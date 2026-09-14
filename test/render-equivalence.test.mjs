import test from 'node:test'
import assert from 'node:assert/strict'
import { compareRender, rendersMoved } from '../demo/bench/harness/render-equivalence.mjs'

// The gate every performance variant passes before its timing counts. Each
// case is a failure mode that has happened in this repository, or the false
// alarm that would have made the gate get ignored.

const el = (translate, opacity, i = 0) => `div.card${i} => 0px ${translate}px|${opacity}|none|none|none`
// N settled elements per position, two positions, values differ by position
const page = (n, at0, at1, mutate = x => x) =>
  ({ scrollHeight: 4000, positions: [
    [Array.from({ length: n }, (_, i) => mutate(el(at0.t, at0.o, i))), Array.from({ length: n }, (_, i) => mutate(el(at0.t, at0.o, i)))],
    [Array.from({ length: n }, (_, i) => mutate(el(at1.t, at1.o, i))), Array.from({ length: n }, (_, i) => mutate(el(at1.t, at1.o, i)))],
  ] })
const baseline = page(30, { t: -121.877, o: 1 }, { t: 10, o: 0.9 })

test('a baseline that moves between positions counts, a frozen one does not', () => {
  assert.ok(rendersMoved(baseline))
  assert.ok(!rendersMoved(page(30, { t: 121.877, o: 0.3 }, { t: 121.877, o: 0.3 })))
})

test('the frozen-clock failure that started this gate is rejected', () => {
  const frozen = page(30, { t: 121.877, o: 0.3 }, { t: 121.877, o: 0.3 })
  const result = compareRender(baseline, frozen)
  assert.equal(result.ok, false)
  assert.equal(result.position, 0)
  assert.equal(result.differing, 30)
})

test('last-digit jitter is accepted', () => {
  assert.ok(compareRender(baseline, page(30, { t: -121.9, o: 1 }, { t: 10.05, o: 0.9 })).ok)
})

test('an element still in flight between the two samples is ignored, not reported', () => {
  const inflight = page(30, { t: -121.877, o: 1 }, { t: 10, o: 0.9 })
  inflight.positions[0][1][3] = el(-100, 0.8, 3) // element 3 moved between samples at position 0
  const result = compareRender(baseline, inflight)
  assert.ok(result.ok)
  assert.equal(result.compared, 59)
})

test('a variant that keeps everything in flight cannot pass: coverage is required', () => {
  const delayed = page(30, { t: -121.877, o: 1 }, { t: 10, o: 0.9 })
  for (const pos of delayed.positions) pos[1] = pos[1].map((v, i) => el(-50 - i, 0.5, i))
  const result = compareRender(baseline, delayed)
  assert.equal(result.ok, false)
  assert.match(result.reason, /settled in both runs/)
})

test('an element that differs between the two visits of the same position is time-dependent and excluded', () => {
  // four positions so the repeated visit exists: 0.15, 0.4, 0.65, 0.4
  const four = at => ({ scrollHeight: 4000, positions: [0, 1, 2, 3].map(i => {
    const row = Array.from({ length: 30 }, (_, j) => el(at[i].t, at[i].o, j))
    return [row, row]
  }) })
  const b = four([{ t: -121, o: 1 }, { t: 10, o: 0.9 }, { t: 60, o: 0.5 }, { t: 10, o: 0.9 }])
  const o = four([{ t: -121, o: 1 }, { t: 10, o: 0.9 }, { t: 60, o: 0.5 }, { t: 10, o: 0.9 }])
  // element 7 is a lerp still converging: different at the two visits of 0.4, in both runs
  b.positions[3][0][7] = b.positions[3][1][7] = el(12.5, 0.9, 7)
  o.positions[3][0][7] = o.positions[3][1][7] = el(14.1, 0.9, 7)
  o.positions[1][0][7] = o.positions[1][1][7] = el(9.2, 0.9, 7)
  const result = compareRender(b, o)
  assert.ok(result.ok, result.reason)
  assert.equal(result.timeDependent, 4, 'excluded at every position')
})

test('a different scroll height is a different timed path', () => {
  const taller = page(30, { t: -121.877, o: 1 }, { t: 10, o: 0.9 })
  taller.scrollHeight = 4200
  assert.match(compareRender(baseline, taller).reason, /scroll height differs/)
})

test('a change in shape, none against a matrix, is a real change even with equal numbers', () => {
  const reshaped = page(30, { t: -121.877, o: 1 }, { t: 10, o: 0.9 }, s => s.replace('|none|none|none', '|matrix(1, 0, 0, 1, 0, 0)|none|none'))
  assert.equal(compareRender(baseline, reshaped).ok, false)
})
