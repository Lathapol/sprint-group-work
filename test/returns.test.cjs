const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { test } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('F-07 return edit and same-reviewer resubmission', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Use an isolated migrated database.');
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const api = request(createApp(db, 8, 10));
  const users = [];
  t.after(async () => {
    try {
      const owned = { requesterId: { in: users } };
      await db.requestHistory.deleteMany({ where: { request: owned } });
      await db.request.deleteMany({ where: owned });
      await db.session.deleteMany({ where: { userId: { in: users } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
    } finally { await db.$disconnect(); }
  });
  async function actor(role) {
    const user = await db.user.create({ data: { username: randomUUID(), role, passwordHash: 'unused-test-only' } });
    users.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 300000) } });
    return { id: user.id, cookie: 'session=' + token };
  }
  const owner = await actor('REQUESTER'), other = await actor('REQUESTER');
  const reviewer = await actor('REVIEWER'), unrelated = await actor('REVIEWER');
  async function claimed() {
    const created = await api.post('/api/requests').set('Cookie', owner.cookie).send({
      title: 'Return ' + randomUUID(), category: 'PURCHASE', amount: '99.50', justification: 'Synthetic original',
    }).expect(201);
    const path = '/api/requests/' + created.body.data.id;
    await api.post(path + '/claim').set('Cookie', reviewer.cookie).send({}).expect(200);
    return { id: created.body.data.id, path };
  }
  async function returned() {
    const row = await claimed();
    await api.post(row.path + '/return').set('Cookie', reviewer.cookie).send({ reason: 'Revise estimate' }).expect(200);
    return row;
  }
  async function snapshot(id) {
    return { request: await db.request.findUnique({ where: { id } }), history: await db.requestHistory.findMany({ where: { requestId: id }, orderBy: { id: 'asc' } }) };
  }

  await t.test('TEST-07-01: assigned return persists reason and invalid returns change nothing', async () => {
    const { id, path } = await claimed();
    const result = await api.post(path + '/return').set('Cookie', reviewer.cookie).send({ reason: '  Revise estimate  ' }).expect(200);
    assert.equal(result.body.data.state, 'RETURNED');
    assert.equal(result.body.data.reviewerId, reviewer.id);
    assert.equal(result.body.data.decisionReason, 'Revise estimate');
    assert.equal(result.body.data.decidedAt, null);
    const history = (await snapshot(id)).history;
    assert.equal(history.length, 3);
    assert.equal(history[2].fromState, 'IN_REVIEW');
    assert.equal(history[2].toState, 'RETURNED');
    assert.equal(history[2].actorId, reviewer.id);
    const fresh = await claimed(), before = await snapshot(fresh.id);
    for (const reason of ['', '   ', {}, 7, null]) {
      await api.post(fresh.path + '/return').set('Cookie', reviewer.cookie).send({ reason }).expect(400);
    }
    await api.post(fresh.path + '/return').send({ reason: 'x' }).expect(401);
    for (const actor of [owner, unrelated]) await api.post(fresh.path + '/return').set('Cookie', actor.cookie).send({ reason: 'x' }).expect(403);
    assert.deepEqual(await snapshot(fresh.id), before);
    const after = await snapshot(id);
    await api.post(path + '/return').set('Cookie', reviewer.cookie).send({ reason: 'again' }).expect(409);
    assert.deepEqual(await snapshot(id), after);
  });

  await t.test('TEST-07-02: Returned edits are owner-only, validated and audited once', async () => {
    const { id, path } = await returned();
    const before = await snapshot(id);
    await api.patch(path).send({ title: 'x' }).expect(401);
    await api.patch(path).set('Cookie', other.cookie).send({ title: 'x' }).expect(404);
    await api.patch(path).set('Cookie', reviewer.cookie).send({ title: 'x' }).expect(403);
    for (const bad of [{ title: ' ' }, { category: 'OTHER' }, { amount: '0' }, { amount: '-1' }, { amount: '1.001' }, { justification: '' }, { state: 'APPROVED' }, { reviewerId: unrelated.id }, { requesterId: other.id }, { reason: 'spoof' }, { history: [] }, []]) {
      await api.patch(path).set('Cookie', owner.cookie).send(bad).expect(400);
    }
    assert.deepEqual(await snapshot(id), before);
    const saved = await api.patch(path).set('Cookie', owner.cookie).send({ title: '  Revised  ', amount: '149.75', justification: 'New synthetic estimate' }).expect(200);
    assert.equal(saved.body.data.title, 'Revised');
    assert.equal(saved.body.data.amount, '149.75');
    assert.equal(saved.body.data.category, 'PURCHASE');
    assert.equal(saved.body.data.state, 'RETURNED');
    assert.equal(saved.body.data.reviewerId, reviewer.id);
    const edited = await snapshot(id);
    assert.equal(edited.history.length, 4);
    assert.equal(edited.history[3].fromState, 'RETURNED');
    assert.equal(edited.history[3].toState, 'RETURNED');
    assert.equal(edited.history[3].actorId, owner.id);
    await api.patch(path).set('Cookie', owner.cookie).send({ title: 'Revised', amount: '149.750'.slice(0,6) }).expect(200);
    assert.deepEqual(await snapshot(id), edited, 'No effective edits must not append or update');
  });

  await t.test('TEST-07-03: resubmit retains reviewer and reason history, and supports a final decision', async () => {
    const { id, path } = await returned();
    const before = await snapshot(id);
    await api.post(path + '/resubmit').send({}).expect(401);
    await api.post(path + '/resubmit').set('Cookie', other.cookie).send({}).expect(404);
    await api.post(path + '/resubmit').set('Cookie', reviewer.cookie).send({}).expect(403);
    await api.post(path + '/resubmit').set('Cookie', owner.cookie).send({ reviewerId: unrelated.id }).expect(400);
    assert.deepEqual(await snapshot(id), before);
    const result = await api.post(path + '/resubmit').set('Cookie', owner.cookie).send({}).expect(200);
    assert.equal(result.body.data.state, 'IN_REVIEW');
    assert.equal(result.body.data.reviewerId, reviewer.id);
    assert.equal(result.body.data.decisionReason, null);
    const queue = await api.get('/api/requests?state=PENDING').set('Cookie', reviewer.cookie).expect(200);
    assert.ok(!queue.body.data.some(row => row.id === id));
    const mine = await api.get('/api/requests?mine=true').set('Cookie', reviewer.cookie).expect(200);
    assert.ok(mine.body.data.some(row => row.id === id));
    await api.post(path + '/approve').set('Cookie', unrelated.cookie).send({}).expect(403);
    await api.post(path + '/reject').set('Cookie', reviewer.cookie).send({ reason: 'Final synthetic decision' }).expect(200);
    const fresh = request(createApp(db, 8, 10));
    assert.equal((await fresh.get(path).set('Cookie', owner.cookie).expect(200)).body.data.state, 'REJECTED');
    const history = (await fresh.get(path + '/history').set('Cookie', owner.cookie).expect(200)).body.data;
    assert.deepEqual(history.map(row => row.toState), ['PENDING','IN_REVIEW','RETURNED','IN_REVIEW','REJECTED']);
    assert.equal(history[2].reason, 'Revise estimate');
    assert.equal(history[3].actor.id, owner.id);
  });

  await t.test('TEST-07-04: duplicate resubmission and edit/resubmit races serialize', async () => {
    const a = await returned();
    const results = await Promise.all([1,2].map(() => api.post(a.path + '/resubmit').set('Cookie', owner.cookie).send({})));
    assert.deepEqual(results.map(x => x.status).sort(), [200,409]);
    assert.equal((await snapshot(a.id)).history.length, 4);
    const b = await returned();
    const race = await Promise.all([
      api.patch(b.path).set('Cookie', owner.cookie).send({ amount: '159.75' }),
      api.post(b.path + '/resubmit').set('Cookie', owner.cookie).send({}),
    ]);
    assert.equal(race[1].status, 200);
    assert.ok([200,409].includes(race[0].status));
    const saved = await snapshot(b.id);
    assert.equal(saved.request.state, 'IN_REVIEW');
    assert.equal(saved.request.amount.toString(), race[0].status === 200 ? '159.75' : '99.5');
    assert.equal(saved.history.length, race[0].status === 200 ? 5 : 4);
    assert.equal(saved.history.at(-1).toState, 'IN_REVIEW');
  });

  await t.test('TEST-07-05: non-Returned states cannot be edited or resubmitted', async () => {
    const a = await claimed();
    for (const state of ['IN_REVIEW', 'APPROVED']) {
      if (state === 'APPROVED') await api.post(a.path + '/approve').set('Cookie', reviewer.cookie).send({}).expect(200);
      const before = await snapshot(a.id);
      await api.patch(a.path).set('Cookie', owner.cookie).send({ title: 'forbidden' }).expect(409);
      await api.post(a.path + '/resubmit').set('Cookie', owner.cookie).send({}).expect(409);
      assert.deepEqual(await snapshot(a.id), before);
    }
  });
});
