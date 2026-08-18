import assert from 'node:assert/strict'
import { test } from 'node:test'

import { clamp, easeOutCubic, snapProgress } from '../dist/core/math.js'

test('clamp', () => {
  assert.equal(clamp(5, 0, 1), 1)
  assert.equal(clamp(-5, 0, 1), 0)
  assert.equal(clamp(0.5, 0, 1), 0.5)
})

test('snapProgress dead zones', () => {
  assert.equal(snapProgress(1.2, 0.35), 1)      // early fraction sticks
  assert.equal(snapProgress(1.8, 0.35), 2)      // late fraction jumps
  assert.equal(snapProgress(1.5, 0.35), 1.5)    // middle remaps linearly
  assert.equal(snapProgress(2, 0.35), 2)        // integers pass through
  assert.equal(snapProgress(0.9, 0), 0.9)       // disabled
  assert.equal(snapProgress(-0.3, 0.35), 0)     // negative: snaps toward 0
  assert.equal(snapProgress(-0.9, 0.35), -1)    // negative: snaps toward -1
})

test('easeOutCubic', () => {
  assert.equal(easeOutCubic(0), 0)
  assert.equal(easeOutCubic(1), 1)
  assert.ok(easeOutCubic(0.5) > 0.5)            // out-easing front-loads
})
