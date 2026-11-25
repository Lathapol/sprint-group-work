const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const base = 'https://approvals-389973748230.asia-southeast1.run.app';

async function main() {
  assert.ok(process.env.SEED_PASSWORD, 'Supply existing demo credential privately');
  const version = await (await fetch(base + '/api/version')).json();
  assert.equal(version.data.commit, 'f9a0d2f704c868e4a0b2048f4cc85c2bf8949997');
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'reviewer1', password: process.env.SEED_PASSWORD }) });
  assert.equal(login.status, 200, 'Demo login');
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  try {
    const records = [];
    for (const id of [13, 16, 17]) {
      const detail = await fetch(base + '/api/requests/' + id, { headers: { cookie } });
      const audit = await fetch(base + '/api/requests/' + id + '/history', { headers: { cookie } });
      assert.equal(detail.status, 200); assert.equal(audit.status, 200);
      const request = (await detail.json()).data, history = (await audit.json()).data;
      assert.equal(request.requester.username, 'requester1');
      records.push({ request, history });
    }
    const oldSummary = await fetch(base + '/api/reports/summary', { headers: { cookie } });
    assert.equal(oldSummary.status, 404, 'F-10 is not yet deployed');
    const snapshot = { observedAt: new Date().toISOString(), kind: 'Read-only Sprint 2 baseline before F-10 deployment',
      base, version, oldSummaryStatus: oldSummary.status, records,
      recordsSha256: crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex') };
    const output = path.join(__dirname, 'sprint3-release-evidence');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'predeploy.json'), JSON.stringify(snapshot, null, 2));
    console.log(JSON.stringify({ source: version.data.commit, ids: records.map(row => row.request.id), historyLengths: records.map(row => row.history.length), oldSummaryStatus: oldSummary.status, recordsSha256: snapshot.recordsSha256 }));
  } finally {
    await fetch(base + '/api/auth/logout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
  }
}
main().catch(() => { console.error('Sprint 3 baseline failed; no credentials/session printed.'); process.exitCode = 1; });
