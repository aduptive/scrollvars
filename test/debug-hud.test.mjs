import assert from 'node:assert/strict'
import { test } from 'node:test'

test('hud: calibrates once from a quiet opening window, then judges later deltas against the frozen interval (ADU-354 item 11)', async () => {
  const queue = []
  const saved = { raf: global.requestAnimationFrame, caf: global.cancelAnimationFrame }
  global.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length }
  global.cancelAnimationFrame = () => {}
  try {
    const { trackFrames } = await import('../dist/debug/hud.js?calibrate')
    const updates = []
    const stop = trackFrames((stats) => updates.push(stats))

    // 95 ticks of a steady 16.7ms delta: past 1000ms of calibration at 60Hz
    // plus another 500ms update tick, so a calibrated stats update actually
    // reports back inside this window (onUpdate only runs every 500ms)
    let t = 0
    const tick = () => { const fn = queue.shift(); t += 16.7; fn(t) }
    for (let i = 0; i < 95; i++) tick()

    const calibrated = updates.filter((s) => s.calibrated)
    assert.ok(calibrated.length > 0, 'calibration completes within the first second')
    assert.ok(Math.round(calibrated.at(-1).refreshHz / 10) * 10 === 60, `refresh reads ~60Hz, got ${calibrated.at(-1).refreshHz}`)
    assert.equal(calibrated.at(-1).dropped, 0, 'a steady 60Hz stream drops nothing')

    // now every OTHER frame is delivered: a sustained half-rate page. A
    // refresh MEASURED FROM these deltas would read 30Hz with 0 dropped
    // (the bug); calibrated against the frozen 16.7ms interval every delta
    // here is a dropped frame.
    for (let i = 0; i < 40; i++) { const fn = queue.shift(); t += 33.3; fn(t) }

    const last = updates.at(-1)
    assert.equal(last.calibrated, true)
    assert.ok(Math.round(last.refreshHz / 10) * 10 === 60, `refresh stays at the calibrated ~60Hz, got ${last.refreshHz}`)
    assert.ok(last.dropped > 0, 'dropped counts every frame in the half-rate stream, not zero')
    stop()
  } finally {
    global.requestAnimationFrame = saved.raf
    global.cancelAnimationFrame = saved.caf
  }
})

test('hud: reports calibrated: false before the opening window completes', async () => {
  const queue = []
  const saved = { raf: global.requestAnimationFrame, caf: global.cancelAnimationFrame }
  global.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length }
  global.cancelAnimationFrame = () => {}
  try {
    const { trackFrames } = await import('../dist/debug/hud.js?precalibrate')
    const updates = []
    const stop = trackFrames((stats) => updates.push(stats))
    let t = 0
    // three ticks (two deltas): nowhere near the 1-second calibration window
    for (let i = 0; i < 3; i++) { const fn = queue.shift(); t += 600; fn(t) }
    assert.ok(updates.length > 0)
    assert.equal(updates.every((s) => s.calibrated === false), true)
    stop()
  } finally {
    global.requestAnimationFrame = saved.raf
    global.cancelAnimationFrame = saved.caf
  }
})
