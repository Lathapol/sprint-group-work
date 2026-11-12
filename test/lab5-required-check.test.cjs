const test = require('node:test');
const assert = require('node:assert/strict');

// Intentional failure for Lab 5 C-02. Never merge this evidence branch.
test('Lab 5 required CI check blocks a failing pull request', () => {
  assert.fail('Intentional C-02 failure on the temporary evidence branch.');
});
