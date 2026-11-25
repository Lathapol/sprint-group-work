const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { test } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('F-06 persisted history chronology, safe actors and ownership', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Use an isolated migrated test database.');
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const api = request(createApp(db, 8, 10));
  const ids = [];
  t.after(async () => {
    try {
      const owned = { requesterId: { in: ids } };
      await db.requestHistory.deleteMany({ where: { request: owned } });
      await db.request.deleteMany({ where: owned });
      await db.session.deleteMany({ where: { userId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    } finally { await db.$disconnect(); }
  });
  async function actor(role) {
    const user = await db.user.create({ data: { username: randomUUID(), role, passwordHash: 'private-hash-must-never-leak' } });
    ids.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 300_000) } });
    return { id: user.id, username: user.username, role, cookie: 'session=' + token };
  }
  const owner = await actor('REQUESTER');
  const other = await actor('REQUESTER');
  const reviewer = await actor('REVIEWER');
  const unrelated = await actor('REVIEWER');
  const input = { title: 'History ' + randomUUID(), category: 'PURCHASE', amount: '99.50', justification: 'Synthetic history check' };
  const created = await api.post('/api/requests').set('Cookie', owner.cookie).send(input).expect(201);
  const id = created.body.data.id;
  const detail = '/api/requests/' + id;
  const path = detail + '/history';
  await api.post(detail + '/claim').set('Cookie', reviewer.cookie).send({}).expect(200);
  const reason = '<img src=x onerror=alert(1)> synthetic reason';
  await api.post(detail + '/reject').set('Cookie', reviewer.cookie).send({ reason }).expect(200);
  // Equal timestamps exercise the stable id tie-breaker, not a timing assumption.
  await db.requestHistory.updateMany({ where: { requestId: id }, data: { createdAt: new Date('2026-01-02T03:04:05Z') } });
  let baseline;

  await t.test('TEST-06-01: owner and both reviewers retrieve one ordered event per transition', async () => {
    baseline = (await api.get(path).set('Cookie', owner.cookie).expect(200)).body.data;
    assert.deepEqual(baseline.map(row => row.toState), ['PENDING', 'IN_REVIEW', 'REJECTED']);
    assert.deepEqual(baseline.map(row => row.fromState), [null, 'PENDING', 'IN_REVIEW']);
    assert.deepEqual(baseline.map(row => row.actor.id), [owner.id, reviewer.id, reviewer.id]);
    assert.deepEqual(baseline.map(row => row.id), [...baseline.map(row => row.id)].sort((a, b) => a - b));
    assert.equal(baseline[2].reason, reason);
    assert.equal(baseline[0].createdAt, '2026-01-02T03:04:05.000Z');
    for (const row of baseline) {
      assert.deepEqual(Object.keys(row).sort(), ['actor', 'createdAt', 'fromState', 'id', 'reason', 'toState']);
      assert.deepEqual(Object.keys(row.actor).sort(), ['id', 'role', 'username']);
    }
    for (const actor of [reviewer, unrelated]) {
      assert.deepEqual((await api.get(path).set('Cookie', actor.cookie).expect(200)).body.data, baseline);
    }
  });

  await t.test('TEST-06-02: protected history is private and read-only', async () => {
    await api.get(path).expect(401);
    const denied = await api.get(path).set('Cookie', other.cookie).expect(404);
    assert.equal(denied.body.error?.code, 'NOT_FOUND');
    assert.equal(denied.body.data, undefined);
    assert.ok(!JSON.stringify(denied.body).includes(reason));
    for (const bad of ['0', 'not-an-id', '2147483648', '2147483647']) {
      await api.get('/api/requests/' + bad + '/history').set('Cookie', owner.cookie).expect(404);
    }
    const before = await db.requestHistory.findMany({ where: { requestId: id }, orderBy: { id: 'asc' } });
    for (const method of ['post', 'patch', 'put', 'delete']) {
      const response = await api[method](path).set('Cookie', owner.cookie).send({ reason: 'tampered' });
      assert.ok([404, 405].includes(response.status), method + ' must not expose a history mutation');
    }
    assert.deepEqual(await db.requestHistory.findMany({ where: { requestId: id }, orderBy: { id: 'asc' } }), before);
  });

  await t.test('TEST-06-04: a fresh app instance reads identical stored events without duplicates', async () => {
    const fresh = request(createApp(db, 8, 10));
    const first = (await fresh.get(path).set('Cookie', owner.cookie).expect(200)).body.data;
    assert.equal(first.length, 3);
    assert.deepEqual((await fresh.get(path).set('Cookie', owner.cookie).expect(200)).body.data, first);
    assert.equal(await db.requestHistory.count({ where: { requestId: id } }), 3);
    const legacy = await db.request.create({ data: { ...input, requesterId: owner.id } });
    assert.deepEqual((await fresh.get('/api/requests/' + legacy.id + '/history').set('Cookie', owner.cookie).expect(200)).body.data, []);
  });
});
