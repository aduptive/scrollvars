import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

for (const mode of ['page', 'pin', 'glide'])
test(`benchmark keeps long frames and brackets ${mode} work before publishing results`, async () => {
  const range = mode === 'pin' ? { from:500, to:1500 } : undefined
  const frames = [], marks = [], positions = [], driven = []
  const window = { __benchMark: async name => marks.push(name) }
  window.parent = window
  const document = { createElement: () => ({}), body: { appendChild() {} }, documentElement: { scrollHeight:3000 } }
  const context = { window, document, location: { search:'?harness=1' }, URLSearchParams,
    performance: { now: () => 0 }, innerHeight:1000, scrollTo(x, y) { positions.push(y) },
    requestAnimationFrame: fn => frames.push(fn), console: { log() {} } }
  runInNewContext(readFileSync(new URL('../demo/bench/runner.js', import.meta.url), 'utf8'), context)
  await context.runBench('test', range, mode === 'glide' ? t => { assert.deepEqual(marks, ['start']); driven.push(t) } : undefined)
  const done = window.__benchStart()
  await new Promise(resolve => setImmediate(resolve))
  for (const time of [16, 32, 600, 6000, 9000, 12000]) await frames.shift()(time)
  const result = await done
  assert.deepEqual(marks, ['start', 'end'])
  assert.equal(result.frames, 5)
  assert.equal(result.worstMs, 5400)
  assert.equal(result.framesOver25ms, 4)
  if (mode === 'glide') {
    assert.deepEqual(positions, [], 'custom drive must not also scroll the page')
    assert.equal(driven.length, 6)
    assert.equal(driven.at(-1), 1, 'final state is captured before the end mark')
  } else {
    assert.equal(positions[3], range?.to ?? 2000, 'reaches the end of the selected range')
    assert.equal(positions[4], 1000, 'reverses over the same range')
  }
  assert.equal(result.scrollRange.from, range?.from ?? 0)
  assert.match(document.title, /^DONE /)
})
