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

// ---- loop8-3 verifier FIX 2: rep IDENTITY, not run count. A capture that
// records the same rep id twice (a re-run that forgot to bump the counter)
// and never runs the missing one must fail, even though runs.length equals
// the declared repetition count.
test('rep ids [0, 0, 1] read as only 2 of 3 distinct repetitions, not full coverage', () => {
  const payload = {
    reps: 3,
    runs: [rep({ rep: 0 }), rep({ rep: 0 }), rep({ rep: 1 })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /2\/3/)
})

// ---- loop8-3 verifier FIX 3: a rep with no positive deltas, or a
// non-positive vsyncMs, is unusable and must fail, never pass with a
// degenerate (zero or negative) budget.
test('a rep whose deltas are all zero or negative fails as unusable', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, deltas: [0, -1, -2, 0] })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-finite or non-positive delta/)
})

// ---- D4 (Astra, loop8-8): a rep id OUTSIDE 0..reps-1 does not count as
// coverage ({0, 1, 99} must fail exactly like {0, 1}, never pass as "3
// distinct repetitions").
test('rep ids [0, 1, 99] fail: 99 is not a repetition the page declared', () => {
  const payload = {
    reps: 3,
    runs: [rep({ rep: 0 }), rep({ rep: 1 }), rep({ rep: 99 })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /2\/3/)
})

// ---- D4 (Astra, loop8-8): a rep with SOME non-positive or NaN deltas
// mixed among otherwise-good ones used to pass (only an ALL-bad rep
// failed), letting zeros dilute the late-% denominator and a NaN slip
// through `NaN <= 0` being false.
test('a rep with one zero delta among good ones fails', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, deltas: [0, 16.7, 16.7, 16.7] })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-finite or non-positive delta/)
})

test('a rep with one NaN delta among good ones fails', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, deltas: [NaN, 16.7, 16.7, 16.7] })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-finite or non-positive delta/)
})

test('a rep whose own vsyncMs is zero fails as unusable', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, vsyncMs: 0 })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-positive vsyncMs/)
})

test('a rep whose own vsyncMs is negative fails as unusable', () => {
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, vsyncMs: -5 })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-positive vsyncMs/)
})

test('a self-calibrated rep whose derived median vsync is non-positive fails, not a trivial pass', () => {
  // no vsyncMs field: falls back to the median of its own sorted deltas.
  // D4 (loop8-8) now rejects ANY non-positive delta before this branch is
  // ever reached, so a mix of negative and positive samples fails there
  // first; this asserts the same non-pass outcome the degenerate-vsync
  // guard existed for, now caught one check earlier.
  const payload = {
    reps: 1,
    runs: [rep({ rep: 0, vsyncMs: undefined, deltas: [-5, -3, -1, 16.7, 16.7] })],
  }
  const v = verdictForPage(payload, 'long')
  assert.equal(v.pass, false)
  assert.match(v.reason, /non-finite or non-positive delta/)
})
