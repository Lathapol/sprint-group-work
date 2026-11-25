const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = 'https://approvals-389973748230.asia-southeast1.run.app';
const expectedCommit = 'f9a0d2f704c868e4a0b2048f4cc85c2bf8949997';
const output = path.join(__dirname, 'sprint2-release-evidence');
const calls = [], cookies = [];
const startedAt = new Date().toISOString();
const marker = 'Sprint2 release ' + startedAt;

async function main() {
  const version = await (await fetch(base + '/api/version')).json();
  assert.equal(version.data.commit, expectedCommit, 'New release must be live before synthetic mutations');
  assert.ok(process.env.SEED_PASSWORD, 'Supply existing demo credential privately');
  async function login(username) {
    const response = await fetch(base + '/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password: process.env.SEED_PASSWORD }),
    });
    assert.equal(response.status, 200, 'Synthetic actor login');
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);
    cookies.push(cookie);
    return { username, cookie };
  }
  async function call(actor, method, endpoint, body, expectedStatus) {
    const response = await fetch(base + endpoint, { method,
      headers: { ...(actor ? { cookie: actor.cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    calls.push({ actor: actor?.username ?? 'anonymous', method, endpoint, status: response.status, payload });
    if (expectedStatus !== undefined) assert.equal(response.status, expectedStatus, method + ' ' + endpoint);
    return { status: response.status, ...payload };
  }
  try {
    const owner = await login('requester1'), other = await login('requester2');
    const reviewer = await login('reviewer1'), unrelated = await login('reviewer2');
    const baseline = JSON.parse(fs.readFileSync(path.join(output, 'predeploy-request-13.json'), 'utf8'));
    const retained = (await call(owner, 'GET', '/api/requests/13', undefined, 200)).data;
    assert.deepEqual(retained, baseline.request, 'Existing UAT fixture survives migration/deployment unchanged');
    const retainedHash = crypto.createHash('sha256').update(JSON.stringify(retained)).digest('hex');
    assert.equal(retainedHash, baseline.requestSha256);
    await call(null, 'GET', '/api/requests', undefined, 401);
    await call(other, 'GET', '/api/requests/13', undefined, 404);
    await call(other, 'GET', '/api/requests/13/history', undefined, 404);
    await call(owner, 'POST', '/api/requests/13/claim', {}, 403);

    const input = { title: marker + ' original journey', category: 'PURCHASE', amount: '10.25', justification: 'Synthetic release regression only; retain for evidence.' };
    await call(owner, 'POST', '/api/requests', { ...input, amount: '0' }, 400);
    const original = (await call(owner, 'POST', '/api/requests', input, 201)).data;
    const oldPath = '/api/requests/' + original.id;
    await call(reviewer, 'POST', oldPath + '/claim', {}, 200);
    await call(reviewer, 'POST', oldPath + '/reject', { reason: '   ' }, 400);
    await call(reviewer, 'POST', oldPath + '/reject', { reason: 'Synthetic release rejection; no real purchase.' }, 200);
    const rejected = (await call(owner, 'GET', oldPath, undefined, 200)).data;
    assert.equal(rejected.state, 'REJECTED');
    await call(owner, 'PATCH', oldPath, { amount: '11.25' }, 409);
    const originalHistory = (await call(owner, 'GET', oldPath + '/history', undefined, 200)).data;
    assert.deepEqual(originalHistory.map(r => r.toState), ['PENDING', 'IN_REVIEW', 'REJECTED']);

    const cycle = (await call(owner, 'POST', '/api/requests', { ...input, title: marker + ' returned cycle' }, 201)).data;
    const cyclePath = '/api/requests/' + cycle.id;
    const claimed = (await call(reviewer, 'POST', cyclePath + '/claim', {}, 200)).data;
    await call(reviewer, 'POST', cyclePath + '/return', { reason: ' ' }, 400);
    await call(reviewer, 'POST', cyclePath + '/return', { reason: 'Revise the synthetic estimate.' }, 200);
    const returned = (await call(owner, 'GET', cyclePath, undefined, 200)).data;
    assert.equal(returned.state, 'RETURNED');
    assert.equal(returned.reviewerId, claimed.reviewerId);
    await call(other, 'PATCH', cyclePath, { amount: '17.75' }, 404);
    await call(reviewer, 'PATCH', cyclePath, { amount: '17.75' }, 403);
    await call(owner, 'PATCH', cyclePath, { amount: '0' }, 400);
    await call(owner, 'PATCH', cyclePath, { state: 'APPROVED' }, 400);
    assert.deepEqual((await call(owner, 'GET', cyclePath, undefined, 200)).data, returned);
    const literal = 'Receipt 100%_\\ verified';
    const edited = (await call(owner, 'PATCH', cyclePath, { amount: '17.75', justification: literal + '; synthetic release only.' }, 200)).data;
    assert.equal(edited.amount, '17.75');
    assert.equal(edited.state, 'RETURNED');
    assert.deepEqual((await call(owner, 'PATCH', cyclePath, { amount: '17.75' }, 200)).data, edited);
    assert.equal((await call(owner, 'GET', cyclePath + '/history', undefined, 200)).data.length, 4);
    await call(owner, 'POST', cyclePath + '/resubmit', { reviewerId: 999 }, 400);
    const race = await Promise.all([call(owner, 'POST', cyclePath + '/resubmit', {}), call(owner, 'POST', cyclePath + '/resubmit', {})]);
    assert.deepEqual(race.map(r => r.status).sort(), [200, 409]);
    const resubmitted = (await call(owner, 'GET', cyclePath, undefined, 200)).data;
    assert.equal(resubmitted.state, 'IN_REVIEW');
    assert.equal(resubmitted.reviewerId, claimed.reviewerId);
    const encoded = encodeURIComponent(marker);
    assert.ok(!(await call(reviewer, 'GET', '/api/requests?state=PENDING&q=' + encoded, undefined, 200)).data.some(r => r.id === cycle.id));
    assert.ok((await call(reviewer, 'GET', '/api/requests?mine=true&q=' + encoded, undefined, 200)).data.some(r => r.id === cycle.id));
    await call(unrelated, 'POST', cyclePath + '/approve', {}, 403);
    await call(reviewer, 'POST', cyclePath + '/approve', { reason: 'Synthetic revised estimate accepted.' }, 200);
    const freshOwner = await login('requester1');
    const final = (await call(freshOwner, 'GET', cyclePath, undefined, 200)).data;
    assert.equal(final.state, 'APPROVED');
    assert.equal(final.amount, '17.75');
    assert.equal(final.justification, edited.justification);
    const history = (await call(freshOwner, 'GET', cyclePath + '/history', undefined, 200)).data;
    assert.deepEqual(history.map(r => r.toState), ['PENDING', 'IN_REVIEW', 'RETURNED', 'RETURNED', 'IN_REVIEW', 'APPROVED']);
    assert.equal(history[2].reason, 'Revise the synthetic estimate.');
    assert.deepEqual((await call(unrelated, 'GET', cyclePath + '/history', undefined, 200)).data, history);
    assert.ok(history.every(r => Object.keys(r.actor).sort().join(',') === 'id,role,username'));
    const day = new Date(final.createdAt).toISOString().slice(0, 10);
    const matches = (await call(owner, 'GET', '/api/requests?state=APPROVED&category=PURCHASE&from=' + day + '&to=' + day + '&q=' + encodeURIComponent('100%_\\'), undefined, 200)).data;
    assert.ok(matches.some(r => r.id === cycle.id));
    assert.ok(matches.every(r => r.requesterId === retained.requesterId));
    assert.deepEqual((await call(other, 'GET', '/api/requests?q=' + encoded, undefined, 200)).data, []);
    await call(owner, 'GET', '/api/requests?requesterId=2', undefined, 400);
    await call(owner, 'GET', '/api/requests?from=2026-02-30', undefined, 400);
    await call(reviewer, 'GET', '/api/requests?state=PENDING&state=APPROVED', undefined, 400);
    assert.deepEqual((await call(owner, 'GET', '/api/requests/13', undefined, 200)).data, baseline.request);
    const evidence = { startedAt, completedAt: new Date().toISOString(), kind: 'AI-assisted developer API release verification, not independent manual UAT',
      base, source: expectedCommit, version, retainedFixtureId: 13, retainedFixtureUnchanged: true, retainedHash,
      syntheticIds: { rejected: original.id, approvedReturnCycle: cycle.id }, originalHistory, cycleHistory: history,
      concurrentResubmitStatuses: race.map(r => r.status).sort(), final, calls,
      dataPolicy: 'New synthetic requests retained; no reset, reseed or deletion; existing fixture #13 untouched' };
    fs.writeFileSync(path.join(output, 'live-api-verification.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ source: expectedCommit, retainedFixtureUnchanged: true, syntheticIds: evidence.syntheticIds, calls: calls.length, race: evidence.concurrentResubmitStatuses }));
  } finally {
    for (const cookie of cookies) await fetch(base + '/api/auth/logout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
  }
}
main().catch(error => {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'live-api-failure.json'), JSON.stringify({ startedAt, error: error.message, calls }, null, 2));
  console.error('Live verification failed: ' + error.message); process.exitCode = 1;
});
