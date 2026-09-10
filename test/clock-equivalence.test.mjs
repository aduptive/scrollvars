import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertClockEquivalence } from '../demo/bench/harness/clock-equivalence.mjs'

test('clock preflight rejects the archived fast but visually different run', () => {
  const archive = JSON.parse(readFileSync(new URL('../demo/bench/results/clocks-cost-deep50.json', import.meta.url)))
  const baseline = archive.variants.base.samples.map(run => run.sample)
  const scoped = archive.variants.noinherit.samples.map(run => run.sample)
  assert.doesNotThrow(() => assertClockEquivalence(baseline, baseline))
  assert.throws(() => assertClockEquivalence(baseline, scoped), /Clock experiment changed rendered output/)
})
