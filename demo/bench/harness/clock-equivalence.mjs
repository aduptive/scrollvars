import assert from 'node:assert/strict'

// Shared by the browser preflight and the archived-result regression test.
export function assertClockEquivalence(expected, actual) {
  assert.ok(expected.length > 0, 'Clock preflight needs rendered samples')
  assert.deepEqual(actual, expected, 'Clock experiment changed rendered output')
}
