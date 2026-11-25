const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const base = 'https://approvals-389973748230.asia-southeast1.run.app';
const expectedCommit = '0877808fb5a8084e040974cb56b16648b274bb04';
const output = path.join(__dirname, 'sprint3-release-evidence');
const calls = [], cookies = [], observations = [];
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function main() {
  const version = await (await fetch(base + '/api/version')).json();
  assert.equal(version.data.commit, expectedCommit, 'New main release must be live before test mutations');
  assert.ok(process.env.SEED_PASSWORD);
  async function login(username) {
    const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password: process.env.SEED_PASSWORD }) });
    assert.equal(response.status, 200, 'Synthetic actor login');
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie); cookies.push(cookie); return { username, cookie };
  }
  async function call(actor, method, endpoint, body, expected) {
    const response = await fetch(base + endpoint, { method,
      headers: { ...(actor ? { cookie: actor.cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json();
    // Never persist all shared request details, authentication values or sessions.
    calls.push({ actor: actor?.username ?? 'anonymous', method, endpoint, status: response.status });
    assert.equal(response.status, expected, method + ' ' + endpoint);
    return payload.data;
  }
  try {
    const owner = await login('requester1'), other = await login('requester2'), reviewer = await login('reviewer1');
    const baseline = JSON.parse(fs.readFileSync(path.join(output, 'predeploy.json'), 'utf8'));
    async function retained() {
      const result = [];
      for (const prior of baseline.records) {
        const id = prior.request.id;
        result.push({ request: await call(reviewer, 'GET', '/api/requests/' + id, undefined, 200),
          history: await call(reviewer, 'GET', '/api/requests/' + id + '/history', undefined, 200) });
      }
      assert.deepEqual(result, baseline.records, 'Retained request resources AND history must survive unchanged');
      assert.equal(hash(result), baseline.recordsSha256);
      return result;
    }
    await retained();
    await call(null, 'GET', '/api/reports/summary', undefined, 401);
    await call(owner, 'GET', '/api/reports/summary', undefined, 403);
    await call(other, 'GET', '/api/reports/summary?role=REVIEWER', undefined, 403);
    await call(reviewer, 'GET', '/api/reports/summary?reviewerId=1', undefined, 400);
    // Independent JS oracle uses the existing authorized list/history endpoints,
    // not the report SQL or its aggregation helpers. Check stable list snapshots
    // around the reads so concurrent external changes are not misreported.
    async function reconcile(label) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const records = await call(reviewer, 'GET', '/api/requests', undefined, 200);
        const state = Object.fromEntries(['PENDING', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED'].map(s => [s, 0]));
        const category = Object.fromEntries(['FUNDING', 'PURCHASE', 'TRAVEL', 'REIMBURSEMENT'].map(c => [c, 0]));
        const actors = new Map(); let unattributed = 0;
        for (const row of records) {
          state[row.state]++; category[row.category]++;
          if (!['APPROVED', 'REJECTED'].includes(row.state)) continue;
          const history = await call(reviewer, 'GET', '/api/requests/' + row.id + '/history', undefined, 200);
          const event = history.filter(h => h.toState === row.state && h.fromState !== h.toState)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)[0];
          if (!event || event.actor.role !== 'REVIEWER') { unattributed++; continue; }
          const actor = actors.get(event.actor.id) ?? { reviewer: { id: event.actor.id, username: event.actor.username }, approved: 0, rejected: 0, total: 0 };
          actor[row.state === 'APPROVED' ? 'approved' : 'rejected']++; actor.total++;
          actors.set(event.actor.id, actor);
        }
        const summary = await call(reviewer, 'GET', '/api/reports/summary', undefined, 200);
        const again = await call(reviewer, 'GET', '/api/requests', undefined, 200);
        if (hash(records) !== hash(again)) continue;
        assert.equal(summary.total, records.length);
        assert.deepEqual(Object.fromEntries(summary.byState.map(r => [r.state, r.count])), state);
        assert.deepEqual(Object.fromEntries(summary.byCategory.map(r => [r.category, r.count])), category);
        assert.deepEqual(summary.byReviewer, [...actors.values()].sort((a, b) => a.reviewer.id - b.reviewer.id));
        assert.equal(summary.unattributedDecisions, unattributed);
        assert.deepEqual(Object.keys(summary).sort(), ['byCategory', 'byReviewer', 'byState', 'total', 'unattributedDecisions']);
        assert.ok(summary.byReviewer.every(r => Object.keys(r.reviewer).sort().join(',') === 'id,username'));
        observations.push({ label, observedAt: new Date().toISOString(), inventoryHash: hash(records), independent: { total: records.length, state, category, byReviewer: [...actors.values()], unattributed }, summary });
        return summary;
      }
      throw new Error('Shared data changed during all oracle read attempts; no stable comparison claimed');
    }
    const before = await reconcile('before synthetic decision');
    const created = await call(owner, 'POST', '/api/requests', { title: 'F10 live summary ' + new Date().toISOString(), category: 'TRAVEL', amount: '18.75', justification: 'Synthetic count verification only; retain as release evidence.' }, 201);
    const target = '/api/requests/' + created.id;
    const pending = await reconcile('new synthetic request Pending');
    assert.equal(pending.total, before.total + 1);
    const claimed = await call(reviewer, 'POST', target + '/claim', {}, 200);
    await call(reviewer, 'POST', target + '/approve', { reason: 'Synthetic F10 final decision count verification.' }, 200);
    const after = await reconcile('after real synthetic approval');
    const count = summary => summary.byReviewer.find(r => r.reviewer.id === claimed.reviewerId)?.approved ?? 0;
    assert.equal(count(after), count(before) + 1);
    assert.equal(after.total, before.total + 1);
    const fresh = await login('reviewer1');
    assert.deepEqual(await call(fresh, 'GET', '/api/reports/summary', undefined, 200), after);
    const final = await call(owner, 'GET', target, undefined, 200);
    assert.equal(final.state, 'APPROVED');
    const preserved = await retained();
    const evidence = { observedAt: new Date().toISOString(), kind: 'AI-assisted developer live API verification; not independent manual UAT',
      base, source: expectedCommit, version, retainedIds: preserved.map(r => r.request.id), retainedRecordsAndHistoryUnchanged: true,
      retainedHash: hash(preserved), syntheticId: created.id, syntheticFinal: final, observations, calls,
      privacy: 'Only aggregate oracle results/fingerprints, known synthetic fixture and HTTP status metadata retained; no full shared list/history payloads or authentication values' };
    fs.writeFileSync(path.join(output, 'live-api-verification.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ source: expectedCommit, retainedUnchanged: true, syntheticId: created.id, totalBefore: before.total, totalAfter: after.total, approvedReviewerDelta: 1, recordedCalls: calls.length }));
  } finally {
    for (const cookie of cookies) await fetch(base + '/api/auth/logout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
  }
}
main().catch(error => {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'live-api-failure.json'), JSON.stringify({ error: error.message, observations, calls }, null, 2));
  console.error('Live summary verification failed: ' + error.message); process.exitCode = 1;
});
