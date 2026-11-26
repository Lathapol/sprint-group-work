const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { test } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('CR-L7-01 owner withdrawal is atomic, retained, scoped, and counted separately', async t => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Use an isolated migrated test database.');
  const schema = 'withdrawal_' + randomUUID().replaceAll('-', '');
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  const admin = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  let server;
  t.after(async () => {
    if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.$disconnect();
    try {
      assert.match(schema, /^withdrawal_[0-9a-f]{32}$/);
      await admin.$executeRawUnsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    } finally { await admin.$disconnect(); }
  });
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe',
  });
  server = createApp(db, 8, 10).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const app = request(server);

  async function actor(role) {
    const user = await db.user.create({ data: { username: 'Withdraw-' + randomUUID(), role, passwordHash: 'private-never-returned' } });
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 600_000) } });
    return { ...user, cookie: 'session=' + token };
  }
  const owner = await actor('REQUESTER');
  const other = await actor('REQUESTER');
  const reviewer = await actor('REVIEWER');
  const body = { title: 'Synthetic equipment request', category: 'PURCHASE', amount: '99.50', justification: 'Withdraw before review' };
  const created = await app.post('/api/requests').set('Cookie', owner.cookie).send(body).expect(201);
  const id = created.body.data.id;
  const path = '/api/requests/' + id;

  await t.test('TEST-12-01: eligible owner withdraws once and original data/history remain', async () => {
    await app.post(path + '/withdraw').set('Cookie', owner.cookie).send({}).expect(200);
    const detail = await app.get(path).set('Cookie', owner.cookie).expect(200);
    assert.equal(detail.body.data.state, 'WITHDRAWN');
    assert.equal(detail.body.data.reviewerId, null);
    assert.equal(detail.body.data.decisionReason, null);
    assert.equal(detail.body.data.title, body.title);
    assert.equal(detail.body.data.justification, body.justification);
    assert.equal(detail.body.data.amount, '99.5');
    await app.post(path + '/withdraw').set('Cookie', owner.cookie).send({}).expect(409);
    const history = (await app.get(path + '/history').set('Cookie', owner.cookie).expect(200)).body.data;
    assert.deepEqual(history.map(row => row.toState), ['PENDING', 'WITHDRAWN']);
    assert.equal(history.length, 2);
    assert.equal(history[1].fromState, 'PENDING');
    assert.equal(history[1].actor.id, owner.id);
    assert.equal(history[1].reason, 'Requester withdrew the request.');
    await app.get(path).set('Cookie', other.cookie).expect(404);
    const reviewerRead = await app.get(path).set('Cookie', reviewer.cookie).expect(200);
    assert.equal(reviewerRead.body.data.state, 'WITHDRAWN');
    const reviewerHistory = (await app.get(path + '/history').set('Cookie', reviewer.cookie).expect(200)).body.data;
    assert.equal(reviewerHistory.length, 2);
  });

  await t.test('TEST-12-02/03: role, owner, claimed, returned, final-state and body guards do not mutate', async () => {
    const another = await app.post('/api/requests').set('Cookie', owner.cookie).send({ ...body, title: 'Second synthetic request' }).expect(201);
    const otherPath = '/api/requests/' + another.body.data.id;
    await app.post(otherPath + '/withdraw').send({}).expect(401);
    await app.post(otherPath + '/withdraw').set('Cookie', reviewer.cookie).send({}).expect(403);
    await app.post(otherPath + '/withdraw').set('Cookie', other.cookie).send({}).expect(404);
    await app.post(otherPath + '/withdraw').set('Cookie', owner.cookie).send({ reason: 'Not in contract' }).expect(400);
    await app.post(otherPath + '/claim').set('Cookie', reviewer.cookie).send({}).expect(200);
    const before = await db.requestHistory.count({ where: { requestId: another.body.data.id } });
    await app.post(otherPath + '/withdraw').set('Cookie', owner.cookie).send({}).expect(409);
    assert.equal(await db.requestHistory.count({ where: { requestId: another.body.data.id } }), before);
    assert.equal((await db.request.findUnique({ where: { id: another.body.data.id } })).state, 'IN_REVIEW');

    const returned = await app.post('/api/requests').set('Cookie', owner.cookie)
      .send({ ...body, title: 'Returned request cannot be withdrawn' }).expect(201);
    const returnedPath = '/api/requests/' + returned.body.data.id;
    await app.post(returnedPath + '/claim').set('Cookie', reviewer.cookie).send({}).expect(200);
    await app.post(returnedPath + '/return').set('Cookie', reviewer.cookie).send({ reason: 'Revise estimate' }).expect(200);
    const returnedBefore = {
      request: await db.request.findUnique({ where: { id: returned.body.data.id } }),
      history: await db.requestHistory.findMany({ where: { requestId: returned.body.data.id }, orderBy: { id: 'asc' } }),
    };
    await app.post(returnedPath + '/withdraw').set('Cookie', owner.cookie).send({}).expect(409);
    assert.deepEqual({
      request: await db.request.findUnique({ where: { id: returned.body.data.id } }),
      history: await db.requestHistory.findMany({ where: { requestId: returned.body.data.id }, orderBy: { id: 'asc' } }),
    }, returnedBefore);

    const final = await app.post('/api/requests').set('Cookie', owner.cookie)
      .send({ ...body, title: 'Final request cannot be withdrawn' }).expect(201);
    const finalPath = '/api/requests/' + final.body.data.id;
    await app.post(finalPath + '/claim').set('Cookie', reviewer.cookie).send({}).expect(200);
    await app.post(finalPath + '/approve').set('Cookie', reviewer.cookie).send({}).expect(200);
    const finalBefore = {
      request: await db.request.findUnique({ where: { id: final.body.data.id } }),
      history: await db.requestHistory.findMany({ where: { requestId: final.body.data.id }, orderBy: { id: 'asc' } }),
    };
    await app.post(finalPath + '/withdraw').set('Cookie', owner.cookie).send({}).expect(409);
    assert.deepEqual({
      request: await db.request.findUnique({ where: { id: final.body.data.id } }),
      history: await db.requestHistory.findMany({ where: { requestId: final.body.data.id }, orderBy: { id: 'asc' } }),
    }, finalBefore);
  });

  await t.test('TEST-12-04: concurrent claim and withdrawal produce one transition and one event', async () => {
    const race = await app.post('/api/requests').set('Cookie', owner.cookie).send({ ...body, title: 'Race synthetic request' }).expect(201);
    const racePath = '/api/requests/' + race.body.data.id;
    const results = await Promise.all([
      app.post(racePath + '/withdraw').set('Cookie', owner.cookie).send({}),
      app.post(racePath + '/claim').set('Cookie', reviewer.cookie).send({}),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    const saved = await db.request.findUnique({ where: { id: race.body.data.id } });
    assert.ok(['WITHDRAWN', 'IN_REVIEW'].includes(saved.state));
    assert.equal(saved.reviewerId === null, saved.state === 'WITHDRAWN');
    const transitions = await db.requestHistory.findMany({ where: { requestId: saved.id, fromState: 'PENDING' } });
    assert.equal(transitions.length, 1);
    assert.equal(transitions[0].toState, saved.state);
  });

  await t.test('TEST-12-05/06: list filters and state totals include withdrawal, decisions do not', async () => {
    const reviewerList = await app.get('/api/requests?state=WITHDRAWN').set('Cookie', reviewer.cookie).expect(200);
    assert.ok(reviewerList.body.data.some(row => row.id === id));
    assert.ok(reviewerList.body.data.every(row => row.state === 'WITHDRAWN'));
    const pending = await app.get('/api/requests?state=PENDING').set('Cookie', reviewer.cookie).expect(200);
    assert.ok(!pending.body.data.some(row => row.id === id));
    const summary = (await app.get('/api/reports/summary').set('Cookie', reviewer.cookie).expect(200)).body.data;
    const withdrawnCount = summary.byState.find(row => row.state === 'WITHDRAWN').count;
    assert.equal(withdrawnCount, reviewerList.body.data.length);
    assert.equal(summary.total, 5);
    assert.equal(summary.byReviewer.reduce((total, row) => total + row.total, 0), 1);
    assert.equal(summary.unattributedDecisions, 0);
  });
});
