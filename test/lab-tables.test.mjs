import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verdictForPage } from '../scripts/lab-tables.mjs'

// A rep's own vsyncMs when present, else the median of its own sorted
// deltas (never the whole file's). At 16ms vsync and a 1.5x factor the
// budget is 24ms.
const rep = (overrides) => ({
  page: 'long', rep: 0, deltas: Array(100).fill(16.7), animated: true, vsyncMs: 16, ...overrides,
})

test('two passing reps and one rep with p95 at 2x vsync fails the row', () => {
  const payload = {
    reps: 3,
    runs: [
      rep({ rep: 0 }),
      rep({ rep: 1 }),
      rep({ rep: 2, deltas: Array(100).fill(32) }), // p95 32ms vs budget 24ms
    ],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
})

test('a page with only 2 of 3 expected repetitions fails', () => {
  const payload = { reps: 3, runs: [rep({ rep: 0 }), rep({ rep: 1 })] }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /2\/3/)
})

test('a page absent from the file fails, never silently dropped', () => {
  const payload = { reps: 3, runs: [rep({ page: 'deep' })] }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
})

test('a rep with an error and no deltas fails', () => {
  const payload = {
    reps: 3,
    runs: [rep({ rep: 0 }), rep({ rep: 1 }), { page: 'long', rep: 2, error: 'timed out' }],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /errored/)
})

test('a rep that failed its own animated check fails the row', () => {
  const payload = {
    reps: 3,
    runs: [rep({ rep: 0 }), rep({ rep: 1 }), rep({ rep: 2, animated: false })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /animated check/)
})

test('two reps with different vsyncMs are each judged against their own', () => {
  const payload = {
    reps: 2,
    runs: [
      // vsync 16, budget 24: p95 20 passes
      rep({ rep: 0, vsyncMs: 16, deltas: Array(100).fill(20) }),
      // vsync 33 (a slower device), budget 49.5: the SAME 20ms frames pass here too
      rep({ rep: 1, vsyncMs: 33, deltas: Array(100).fill(20) }),
    ],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, true)
  assert.equal(v.calibration, 'independent')
})

test('a fully passing page reports independent calibration and full coverage', () => {
  const payload = { reps: 3, runs: [rep({ rep: 0 }), rep({ rep: 1 }), rep({ rep: 2 })] }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, true)
  assert.equal(v.animatedCount, 3)
  assert.equal(v.repCount, 3)
})

test('a rep missing vsyncMs falls back to self-calibrated, not the whole file', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, vsyncMs: undefined, deltas: Array(100).fill(16.7) })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.calibration, 'self-calibrated')
  assert.equal(v.pass, true)
})
