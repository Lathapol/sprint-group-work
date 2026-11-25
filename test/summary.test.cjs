const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { PrismaClient, RequestState, Category } = require('@prisma/client');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('F-10 persisted global summary, final actors and snapshot reconciliation', async t => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Use an isolated migrated test database.');
  const schema = 'summary_' + randomUUID().replaceAll('-', '');
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  const admin = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  t.after(async () => {
    await db.$disconnect();
    try {
      // Only the uniquely generated schema owned by this test is disposable.
      assert.match(schema, /^summary_[0-9a-f]{32}$/);
      await admin.$executeRawUnsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    } finally { await admin.$disconnect(); }
  });
  // A fresh private schema permits a real empty database assertion without
  // truncating shared fixtures or racing the other API suites.
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe',
  });
  const app = request(createApp(db, 8, 10));
  async function actor(role) {
    const user = await db.user.create({ data: { username: 'Summary-' + randomUUID(), role, passwordHash: 'private-never-returned' } });
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 600_000) } });
    return { ...user, cookie: 'session=' + token };
  }
  const owner = await actor('REQUESTER'), first = await actor('REVIEWER'), final = await actor('REVIEWER');
  const endpoint = '/api/reports/summary';
  async function summary(api = app) {
    return (await api.get(endpoint).set('Cookie', first.cookie).expect(200)).body.data;
  }
  function counts(rows, key) { return Object.fromEntries(rows.map(row => [row[key], row.count])); }
  function invariants(data) {
    assert.equal(data.byState.reduce((n, r) => n + r.count, 0), data.total);
    assert.equal(data.byCategory.reduce((n, r) => n + r.count, 0), data.total);
    const terminal = data.byState.filter(r => ['APPROVED', 'REJECTED'].includes(r.state)).reduce((n, r) => n + r.count, 0);
    assert.equal(data.byReviewer.reduce((n, r) => n + r.total, 0) + data.unattributedDecisions, terminal);
    for (const row of data.byReviewer) assert.equal(row.approved + row.rejected, row.total);
  }
  await t.test('TEST-10-01: actual empty schema has all zero enum buckets, then exact persisted counts', async () => {
    const empty = await summary();
    assert.equal(empty.total, 0);
    assert.deepEqual(counts(empty.byState, 'state'), Object.fromEntries(Object.values(RequestState).map(value => [value, 0])));
    assert.deepEqual(counts(empty.byCategory, 'category'), Object.fromEntries(Object.values(Category).map(value => [value, 0])));
    assert.deepEqual(empty.byReviewer, []);
    assert.equal(empty.unattributedDecisions, 0);
    invariants(empty);
  });
  async function fixture(state, category = 'PURCHASE', reviewer = first) {
    return db.request.create({ data: { title: 'Private summary title ' + randomUUID(), justification: 'private business text', amount: '25.50',
      state, category, requesterId: owner.id, reviewerId: state === 'PENDING' ? null : reviewer.id,
      decisionReason: ['RETURNED', 'REJECTED'].includes(state) ? 'Synthetic reason' : null } });
  }
  await fixture('PENDING');
  await fixture('IN_REVIEW', 'TRAVEL');
  await fixture('RETURNED');
  const approved = await fixture('APPROVED', 'FUNDING');
  const rejected = await fixture('REJECTED', 'REIMBURSEMENT', final);
  await fixture('APPROVED'); // Legacy terminal record with no decision history.
  const malformed = await fixture('REJECTED', 'PURCHASE', final);
  async function event(row, actor, toState, createdAt, fromState = 'IN_REVIEW') {
    return db.requestHistory.create({ data: { requestId: row.id, actorId: actor.id, fromState, toState, createdAt: new Date(createdAt) } });
  }
  await event(approved, first, 'APPROVED', '2026-01-01T00:00:00Z');
  await event(approved, first, 'APPROVED', '2026-01-02T00:00:00Z');
  await event(approved, final, 'APPROVED', '2026-01-02T00:00:00Z'); // Equal time, higher id wins.
  await event(approved, first, 'APPROVED', '2026-01-03T00:00:00Z', 'APPROVED'); // Same-state audit is not a decision.
  await event(approved, first, 'REJECTED', '2026-01-04T00:00:00Z'); // Does not match current terminal state.
  await event(rejected, first, 'REJECTED', '2026-01-02T00:00:00Z'); // Actor differs from assigned reviewer.
  await event(malformed, owner, 'REJECTED', '2026-01-02T00:00:00Z'); // Never label Requester as Reviewer.
  await t.test('TEST-10-02: latest matching final actor, no duplicate count, explicit unattributed legacy', async () => {
    const before = await db.request.findMany({ orderBy: { id: 'asc' } });
    const histories = await db.requestHistory.findMany({ orderBy: { id: 'asc' } });
    const data = await summary();
    assert.equal(data.total, 7);
    assert.deepEqual(counts(data.byState, 'state'), { PENDING: 1, IN_REVIEW: 1, RETURNED: 1, APPROVED: 2, REJECTED: 2 });
    assert.deepEqual(counts(data.byCategory, 'category'), { FUNDING: 1, PURCHASE: 4, TRAVEL: 1, REIMBURSEMENT: 1 });
    assert.deepEqual(data.byReviewer, [
      { reviewer: { id: first.id, username: first.username }, approved: 0, rejected: 1, total: 1 },
      { reviewer: { id: final.id, username: final.username }, approved: 1, rejected: 0, total: 1 },
    ]);
    assert.equal(data.unattributedDecisions, 2);
    invariants(data);
    assert.deepEqual(await summary(request(createApp(db, 8, 10))), data);
    assert.deepEqual(await db.request.findMany({ orderBy: { id: 'asc' } }), before);
    assert.deepEqual(await db.requestHistory.findMany({ orderBy: { id: 'asc' } }), histories);
    assert.deepEqual(Object.keys(data).sort(), ['byCategory', 'byReviewer', 'byState', 'total', 'unattributedDecisions']);
    assert.ok(!JSON.stringify(data).includes('private'));
    for (const row of data.byReviewer) {
      assert.deepEqual(Object.keys(row).sort(), ['approved', 'rejected', 'reviewer', 'total']);
      assert.deepEqual(Object.keys(row.reviewer).sort(), ['id', 'username']);
    }
  });
  await t.test('TEST-10-03: session role is authoritative; anonymous/expired/requester denied', async () => {
    await app.get(endpoint).expect(401);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: first.id, expiresAt: new Date(Date.now() - 1000) } });
    await app.get(endpoint).set('Cookie', 'session=' + token).expect(401);
    for (const query of ['', '?role=REVIEWER', '?reviewerId=' + first.id]) {
      const denied = await app.get(endpoint + query).set('Cookie', owner.cookie).send({ role: 'REVIEWER' }).expect(403);
      assert.equal(denied.body.data, undefined);
    }
    await app.get(endpoint + '?q=private').set('Cookie', first.cookie).expect(400);
    const actual = await summary();
    assert.deepEqual((await app.get(endpoint).set('Cookie', final.cookie).send({ role: 'REQUESTER', reviewerId: owner.id }).expect(200)).body.data, actual);
    for (const method of ['post', 'patch', 'delete']) {
      await app[method](endpoint).set('Cookie', first.cookie).send({}).expect(404);
    }
  });
  await t.test('TEST-10-04: real return/edit/resubmit/final decision and concurrent snapshots reconcile', async () => {
    const created = await app.post('/api/requests').set('Cookie', owner.cookie).send({ title: 'Summary cycle', category: 'PURCHASE', amount: '49.50', justification: 'Synthetic cycle' }).expect(201);
    const target = '/api/requests/' + created.body.data.id;
    await app.post(target + '/claim').set('Cookie', first.cookie).send({}).expect(200);
    await app.post(target + '/return').set('Cookie', first.cookie).send({ reason: 'Revise' }).expect(200);
    const returned = await summary();
    assert.equal(counts(returned.byState, 'state').RETURNED, 2);
    invariants(returned);
    await app.patch(target).set('Cookie', owner.cookie).send({ amount: '99.50' }).expect(200);
    await app.post(target + '/resubmit').set('Cookie', owner.cookie).send({}).expect(200);
    await app.post(target + '/approve').set('Cookie', first.cookie).send({}).expect(200);
    const decided = await summary();
    assert.equal(decided.byReviewer.find(r => r.reviewer.id === first.id).approved, 1);
    assert.equal(decided.total, 8);
    invariants(decided);
    const competing = await Promise.all(Array.from({ length: 10 }, () => fixture('PENDING')));
    const decisions = Promise.all(competing.map(async row => {
      await app.post('/api/requests/' + row.id + '/claim').set('Cookie', first.cookie).send({}).expect(200);
      await app.post('/api/requests/' + row.id + '/approve').set('Cookie', first.cookie).send({}).expect(200);
    }));
    for (let i = 0; i < 20; i++) {
      const observed = await summary();
      assert.equal(observed.total, 18);
      invariants(observed);
    }
    await decisions;
    const after = await summary();
    assert.equal(after.byReviewer.find(r => r.reviewer.id === first.id).approved, 11);
    assert.equal(after.unattributedDecisions, 2);
    invariants(after);
  });
});
