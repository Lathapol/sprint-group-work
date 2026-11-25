const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { test } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('F-08 filters preserve exact persisted matches and authorization', async t => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Use an isolated migrated test database.');
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const app = request(createApp(db, 8, 10));
  const userIds = [], rows = [];
  t.after(async () => {
    try {
      await db.requestHistory.deleteMany({ where: { request: { requesterId: { in: userIds } } } });
      await db.request.deleteMany({ where: { requesterId: { in: userIds } } });
      await db.session.deleteMany({ where: { userId: { in: userIds } } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    } finally { await db.$disconnect(); }
  });
  async function actor(role) {
    const user = await db.user.create({ data: { username: randomUUID(), role, passwordHash: 'never-return-this-hash' } });
    userIds.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 600_000) } });
    return { ...user, cookie: 'session=' + token };
  }
  const owner = await actor('REQUESTER'), other = await actor('REQUESTER');
  const reviewer = await actor('REVIEWER'), unrelated = await actor('REVIEWER');
  const marker = 'Filter ' + randomUUID();
  async function fixture(title, category, state, createdAt, assigned = reviewer, who = owner, justification = 'Synthetic filter fixture') {
    const row = await db.request.create({ data: {
      title: marker + ' ' + title, category, state, createdAt: new Date(createdAt),
      amount: '10.25', requesterId: who.id,
      reviewerId: state === 'PENDING' ? null : assigned.id,
      decisionReason: ['RETURNED', 'REJECTED'].includes(state) ? 'Synthetic reason' : null,
      justification,
    } });
    rows.push(row);
    return row;
  }
  await fixture('before', 'PURCHASE', 'PENDING', '2026-02-27T23:59:59.999Z');
  await fixture('Office 100%_\\ chair', 'PURCHASE', 'PENDING', '2026-02-28T00:00:00Z');
  await fixture('Travel', 'TRAVEL', 'IN_REVIEW', '2026-02-28T12:00:00Z', reviewer, owner, 'Office supplies');
  await fixture('Returned', 'PURCHASE', 'RETURNED', '2026-02-28T23:59:59.999Z');
  await fixture('after', 'FUNDING', 'APPROVED', '2026-03-01T00:00:00Z');
  await fixture('Rejected', 'REIMBURSEMENT', 'REJECTED', '2024-02-29T00:00:00Z', unrelated);
  await fixture('Office 100XXchair private', 'PURCHASE', 'PENDING', '2026-02-28T10:00:00Z', reviewer, other);
  await fixture('Office other reviewer', 'PURCHASE', 'IN_REVIEW', '2026-02-28T11:00:00Z', unrelated);
  const before = await db.request.findMany({ where: { id: { in: rows.map(r => r.id) } }, orderBy: { id: 'asc' } });
  async function get(actor, query = '') {
    return (await app.get('/api/requests' + (query ? '?' + query : '')).set('Cookie', actor.cookie).expect(200)).body.data;
  }
  function expected(actor, predicate) {
    return rows.filter(r => (actor.role === 'REVIEWER' || r.requesterId === actor.id) && predicate(r))
      .map(r => r.id).sort((a, b) => b - a);
  }
  // Reviewer searches use the unique marker to exclude unrelated, pre-existing fixtures.
  async function exact(actor, query, predicate) {
    const actual = await get(actor, query);
    assert.deepEqual(actual.map(r => r.id), expected(actor, predicate), query);
    assert.ok(actual.every(r => !JSON.stringify(r).includes('passwordHash')));
  }
  const enc = encodeURIComponent;
  await t.test('TEST-08-01: state category text AND combinations and literal wildcard characters', async () => {
    for (const state of ['PENDING', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED']) {
      await exact(owner, 'state=' + state, r => r.state === state);
    }
    for (const category of ['PURCHASE', 'TRAVEL', 'FUNDING', 'REIMBURSEMENT']) {
      await exact(owner, 'category=' + category, r => r.category === category);
    }
    await exact(owner, 'q=' + enc('  oFfIcE  '), r => /office/i.test(r.title + ' ' + r.justification));
    for (const literal of ['%', '_', '\\', '%_\\']) {
      await exact(owner, 'q=' + enc(literal), r => r.title.includes(literal) || r.justification.includes(literal));
    }
    await exact(owner, 'q=%20%20', () => true);
    await exact(owner, 'category=PURCHASE&state=PENDING&q=office&from=2026-02-28&to=2026-02-28',
      r => r.category === 'PURCHASE' && r.state === 'PENDING' && /office/i.test(r.title) && r.createdAt.toISOString().startsWith('2026-02-28'));
    await exact(owner, 'category=TRAVEL&q=office', r => r.category === 'TRAVEL' && /office/i.test(r.justification));
    await exact(owner, 'category=TRAVEL&q=does-not-exist', () => false);
  });
  await t.test('TEST-08-02: calendar dates and inclusive UTC days, one-sided and leap-day boundaries', async () => {
    const day = '2026-02-28';
    await exact(owner, 'from=' + day + '&to=' + day, r => r.createdAt.toISOString().startsWith(day));
    await exact(owner, 'from=' + day, r => r.createdAt >= new Date(day));
    await exact(owner, 'to=' + day, r => r.createdAt < new Date('2026-03-01'));
    await exact(owner, 'from=2024-02-29&to=2024-02-29', r => r.createdAt.toISOString().startsWith('2024-02-29'));
    for (const query of [
      'from=2026-02-30', 'to=2025-02-29', 'from=2026-13-01', 'to=2026-00-01', 'from=2026-01-00',
      'from=2026-2-01', 'from=2026-02-28T00:00:00Z', 'from=0000-01-01', 'from=',
      'from=2026-03-01&to=2026-02-28', 'category=OTHER', 'category=', 'state=INVALID',
      'state=PENDING&state=APPROVED', 'q=a&q=b', 'category=TRAVEL&category=FUNDING',
      'from=2026-01-01&from=2026-01-02', 'to=2026-01-01&to=2026-01-02',
      'q%5Bnested%5D=office', 'state%5B%5D=PENDING', 'mine=perhaps', 'mine=true&mine=false',
      'q=' + enc('🪑'.repeat(201)),
    ]) {
      const response = await app.get('/api/requests?' + query).set('Cookie', reviewer.cookie).expect(400);
      assert.equal(response.body.error.code, 'INVALID_INPUT', query);
      assert.ok(Object.keys(response.body.error.fields).length, query + ' must identify a field');
    }
    await exact(owner, 'q=' + enc('🪑'.repeat(200)), () => false);
    await exact(owner, 'from=0001-01-01&to=9999-12-31', () => true);
  });
  await t.test('TEST-08-03: ownership before filters; reviewer scopes AND filters; no forged owner selectors', async () => {
    await app.get('/api/requests?q=office').expect(401);
    await exact(owner, 'q=private&category=PURCHASE&from=2026-02-28', () => false);
    for (const query of ['mine=true', 'mine=false', 'requesterId=' + other.id, 'reviewerId=' + unrelated.id, 'role=REVIEWER', 'id=' + rows[6].id]) {
      const denied = await app.get('/api/requests?' + query).set('Cookie', owner.cookie).expect(400);
      assert.equal(denied.body.data, undefined);
    }
    await exact(reviewer, 'q=' + enc(marker) + '&mine=true&category=PURCHASE',
      r => r.reviewerId === reviewer.id && r.category === 'PURCHASE');
    await exact(reviewer, 'q=' + enc(marker) + '&state=PENDING&category=PURCHASE',
      r => r.state === 'PENDING' && r.category === 'PURCHASE');
    await exact(reviewer, 'q=' + enc(marker) + '&mine=true&state=PENDING', () => false);
    await exact(reviewer, 'q=' + enc(marker) + '&mine=false', () => true);
    await exact(unrelated, 'q=' + enc(marker) + '&mine=true', r => r.reviewerId === unrelated.id);
    for (const query of ['requesterId=' + owner.id, 'reviewerId=' + owner.id, 'owner=all']) {
      await app.get('/api/requests?' + query).set('Cookie', reviewer.cookie).expect(400);
    }
  });
  await t.test('TEST-08-04 persistence: reads do not mutate requests/history; fresh app returns same results', async () => {
    const query = 'category=PURCHASE&q=office&from=2026-02-28&to=2026-02-28';
    const first = await get(owner, query);
    const fresh = request(createApp(db, 8, 10));
    assert.deepEqual((await fresh.get('/api/requests?' + query).set('Cookie', owner.cookie).expect(200)).body.data, first);
    assert.deepEqual(await db.request.findMany({ where: { id: { in: rows.map(r => r.id) } }, orderBy: { id: 'asc' } }), before);
    assert.equal(await db.requestHistory.count({ where: { requestId: { in: rows.map(r => r.id) } } }), 0);
  });
});
