const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = 'https://approvals-389973748230.asia-southeast1.run.app';
const sessions = [];
async function call(path, cookie, data) {
  const response = await fetch(base + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { ...(cookie ? { cookie } : {}), ...(data === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { status: response.status, body: await response.json(), response };
}
async function login(username) {
  const result = await call('/api/auth/login', null, { username, password: process.env.SEED_PASSWORD });
  assert.equal(result.status, 200, 'Synthetic account login');
  const cookie = result.response.headers.get('set-cookie').split(';')[0];
  sessions.push(cookie);
  return cookie;
}
(async () => {
  try {
    assert.ok(process.env.SEED_PASSWORD, 'Supply the demo password privately');
    const owner = await login('requester1');
    const other = await login('requester2');
    const input = { title: 'UAT6-03 independent rerun fixture ' + new Date().toISOString(), category: 'PURCHASE', amount: '25.50', justification: 'Synthetic fresh Pending fixture; retain for partner retest of issue 60.' };
    const created = await call('/api/requests', owner, input);
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    const path = '/api/requests/' + id;
    const before = (await call(path, owner)).body.data;
    assert.equal(before.state, 'PENDING');
    assert.equal(before.reviewerId, null);
    const read = await call(path, other);
    const denied = await call(path + '/claim', other, {});
    const after = (await call(path, owner)).body.data;
    assert.equal(read.status, 404);
    assert.equal(denied.status, 403);
    assert.deepEqual(after, before, 'All returned business fields remain unchanged');
    const evidence = {
      observedAt: new Date().toISOString(), kind: 'AI-assisted developer API verification; NOT independent partner UAT',
      base, version: (await call('/api/version')).body,
      requestId: id, owner: 'requester1', forbiddenActor: 'requester2',
      exactMethod: 'POST', exactPath: path + '/claim', jsonBody: {},
      crossOwnerGet: { status: read.status, body: read.body },
      forbiddenClaim: { status: denied.status, body: denied.body },
      before, after, businessRecordUnchanged: true,
      limitation: 'Business representation compared; database history count not independently queried. Fixture remains Pending for partner rerun.',
    };
    fs.mkdirSync('lab6-evidence', { recursive: true });
    fs.writeFileSync('lab6-evidence/fresh-pending-claim-check.json', JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ requestId: id, status: denied.status, businessRecordUnchanged: true, version: evidence.version }));
  } finally {
    for (const cookie of sessions) await call('/api/auth/logout', cookie, {});
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
