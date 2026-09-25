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

test('mapRange: sub-range mapping, clamping, easing', async () => {
  const { mapRange, easeOutCubic } = await import('../dist/core/math.js')
  assert.ok(Math.abs(mapRange(0.5, 0.3, 0.7) - 0.5) < 1e-9)
  assert.equal(mapRange(0.2, 0.3, 0.7), 0)   // before the range
  assert.equal(mapRange(0.9, 0.3, 0.7), 1)   // past the range
  assert.equal(mapRange(0.5, 0.5, 0.5), 0)   // degenerate range never divides by zero
  assert.equal(mapRange(0.7, 0.3, 0.7, easeOutCubic), 1)
  assert.ok(mapRange(0.5, 0.3, 0.7, easeOutCubic) > 0.5) // ease-out front-loads
})

test('mapRange: reversed ranges agree with the CSS twin (round 15 item 7)', async () => {
  const { mapRange } = await import('../dist/core/math.js')
  // styles/pin.css: clamp(0, (t - from) / (to - from), 1). For a reversed
  // range (from 1, to 0) that is .25 at t=.75 and .75 at t=.25: the old
  // epsilon-floored span answered 0 for both, agreeing with neither.
  assert.ok(Math.abs(mapRange(0.75, 1, 0) - 0.25) < 1e-9)
  assert.ok(Math.abs(mapRange(0.25, 1, 0) - 0.75) < 1e-9)
  assert.equal(mapRange(1, 1, 0), 0, 'reversed range, at its start')
  assert.equal(mapRange(0, 1, 0), 1, 'reversed range, at its end')
  // from === to has no ratio to compute at all: a step at `to`, matching the
  // pre-existing degenerate-range assertion above (t === from === to → 0).
  assert.equal(mapRange(0.5, 0.5, 0.5), 0)
  assert.equal(mapRange(0.6, 0.5, 0.5), 1, 'past the single point: stepped')
})
