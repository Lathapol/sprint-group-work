const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';

function release(reuse, tag = 'a'.repeat(40)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab5-release-'));
  const log = path.join(dir, 'commands.log');
  fs.writeFileSync(path.join(dir, 'gcloud'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$RELEASE_LOG"
case "$*" in
  'artifacts docker images describe '*) printf 'sha256:%064d\\n' 0 ;;
  *'value(status.url)'*) echo https://example.test ;;
  *'value(status.latestReadyRevisionName)'*) echo approvals-test-revision ;;
esac
`, { mode: 0o755 });
  try {
    const result = spawnSync(bash, ['deploy/release.sh'], {
      cwd: path.resolve(__dirname, '..'), encoding: 'utf8',
      env: {
        ...process.env, PATH: dir + path.delimiter + process.env.PATH,
        RELEASE_LOG: log.replaceAll('\\', '/'), GCP_PROJECT_ID: 'test-project',
        GCP_REGION: 'test-region', IMAGE_TAG: tag, REUSE_IMAGE: String(reuse),
        GITHUB_ENV: path.join(dir, 'release.env').replaceAll('\\', '/'),
      },
    });
    return { ...result, commands: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('new releases migrate before deploying an exact image digest', () => {
  const result = release(false);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.commands, /run jobs execute approvals-migrate --wait/);
  assert.ok(result.commands.indexOf('run jobs execute') < result.commands.indexOf('run services update'));
  assert.match(result.commands, /--image=.*app@sha256:[0-9a-f]{64}/);
  assert.match(result.commands, /--update-env-vars=RELEASE_COMMIT=a{40}/);
});

test('existing-image rollback preserves the database schema and skips migration', () => {
  const result = release(true);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.commands, /run jobs|migration:/);
  assert.match(result.commands, /run services update/);
});

test('invalid release tags are rejected before contacting GCP', () => {
  const result = release(false, 'main');
  assert.notEqual(result.status, 0);
  assert.equal(result.commands, '');
});
