import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('benchmark keeps long frames and brackets work before publishing results', async () => {
  const frames = [], marks = []
  const window = { __benchMark: async name => marks.push(name) }
  window.parent = window
  const document = { createElement: () => ({}), body: { appendChild() {} }, documentElement: { scrollHeight:3000 } }
  const context = { window, document, location: { search:'?harness=1' }, URLSearchParams,
    performance: { now: () => 0 }, innerHeight:1000, scrollTo() {},
    requestAnimationFrame: fn => frames.push(fn), console: { log() {} } }
  runInNewContext(readFileSync(new URL('../demo/bench/runner.js', import.meta.url), 'utf8'), context)
  await context.runBench('test')
  const done = window.__benchStart()
  await new Promise(resolve => setImmediate(resolve))
  for (const time of [16, 32, 600, 12000]) await frames.shift()(time)
  const result = await done
  assert.deepEqual(marks, ['start', 'end'])
  assert.equal(result.frames, 3)
  assert.equal(result.worstMs, 11400)
  assert.equal(result.framesOver25ms, 2)
  assert.match(document.title, /^DONE /)
})
