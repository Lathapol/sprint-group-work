const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

async function main() {
  const base = 'https://approvals-389973748230.asia-southeast1.run.app';
  if (!process.env.SEED_PASSWORD) throw new Error('Supply the existing demo credential privately.');
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'requester1', password: process.env.SEED_PASSWORD }),
  });
  if (!login.ok) throw new Error('Demo login failed.');
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('No demo session returned.');
  try {
    const response = await fetch(base + '/api/requests/13', { headers: { cookie } });
    if (!response.ok) throw new Error('Known retained synthetic UAT request #13 unavailable.');
    const data = (await response.json()).data;
    if (data.requester?.username !== 'requester1') throw new Error('Unexpected fixture owner.');
    const version = await (await fetch(base + '/api/version')).json();
    const output = path.join(__dirname, 'sprint2-release-evidence');
    fs.mkdirSync(output, { recursive: true });
    const evidence = {
      observedAt: new Date().toISOString(), kind: 'Pre-deployment API read of existing synthetic UAT fixture; no request mutation',
      base, version, request: data,
      requestSha256: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    };
    fs.writeFileSync(path.join(output, 'predeploy-request-13.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ commit: version.data.commit, requestId: data.id, state: data.state, requestSha256: evidence.requestSha256 }));
  } finally {
    await fetch(base + '/api/auth/logout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
  }
}
main().catch(() => { console.error('Pre-deployment snapshot failed; no credential or session details printed.'); process.exitCode = 1; });
