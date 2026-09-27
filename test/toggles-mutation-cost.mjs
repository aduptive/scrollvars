import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lifecycleEnv } from './lifecycle-fixture.mjs'

// What the late-trigger fix (SPA menu button correctness, WCAG 4.1.2) costs
// a marquee-free page's document-scope MutationObserver on a batch of
// unrelated ELEMENT insertions: before the fix `hasUnleasedTrack()` alone
// gated the whole callback body and a marquee-free page paid nothing per
// mutation, element or not, at the price of never booting a late plain
// trigger. `hasNewTrigger()` now runs one matches()/querySelector() pass per
// added element, bounded (no recursion multiplier: see
// test/toggles.test.mjs's own scan-count assertions for the correctness
// half of this same bound). A batch with no element addedNodes at all
// (text-node or attribute-only mutations, most of a page's own churn)
// still costs nothing: this file only measures the element-adding case,
// the one the fix actually changes.
//
// This is a wall-clock measurement, not a correctness gate: it logs the
// number for the CHANGELOG and asserts only a generous ceiling, so it does
// not flake on a loaded CI runner. Read `sysctl -n vm.loadavg` before
// trusting the printed number as representative (CLAUDE.md's timing rule).

const median = (samples) => samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)]

test('toggles-mutation-cost: a 500-element unrelated insert on a marquee-free page, document scope', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?mutationcost')
    const doc = env.element()
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()
    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    const burst = () => {
      const nodes = Array.from({ length: 500 }, () => {
        const node = env.element()
        node.nodeType = 1
        return node
      })
      nodes.forEach((n) => doc.append(n))
      return nodes
    }

    const samples = []
    for (let run = 0; run < 7; run++) {
      const nodes = burst()
      const t0 = process.hrtime.bigint()
      mo.cb([{ addedNodes: nodes }])
      const t1 = process.hrtime.bigint()
      samples.push(Number(t1 - t0) / 1e6)
    }

    const ms = median(samples)
    // eslint-disable-next-line no-console
    console.log(`toggles-mutation-cost: 500-element unrelated insert, median ${ms.toFixed(3)}ms over ${samples.length} runs (load: see sysctl -n vm.loadavg in the CI log)`)
    // Generous ceiling: this is a synthetic in-memory DOM (no real layout or
    // paint), so the correctness pass (matches + querySelector, no children
    // to recurse into) should stay in the sub-millisecond range even on a
    // loaded runner. A regression that turns this into an O(n^2) rescan
    // fails loudly here long before it fails in a browser.
    assert.ok(ms < 20, `median ${ms}ms exceeds the generous ceiling; a correctness pass over 500 flat nodes should not approach this`)

    stop()
  } finally { env.restore() }
})
