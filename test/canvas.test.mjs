import assert from 'node:assert/strict'
import { test } from 'node:test'

// Minimal DOM stubs — enough to drive mountEffect's gates by hand.
function makeEnv() {
  const rafQueue = []
  let now = 0
  const listeners = { visibilitychange: [] }

  global.window = {
    devicePixelRatio: 3,
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  }
  global.document = {
    visibilityState: 'visible',
    addEventListener: (t, fn) => listeners[t]?.push(fn),
    removeEventListener: (t, fn) => {
      const i = listeners[t]?.indexOf(fn)
      if (i >= 0) listeners[t].splice(i, 1)
    },
  }
  global.performance = { now: () => now }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = (id) => {
    rafQueue.length = 0
  }

  let roCallback, ioCallback
  global.ResizeObserver = class {
    constructor(cb) {
      roCallback = cb
    }
    observe() {}
    disconnect() {}
  }
  global.IntersectionObserver = class {
    constructor(cb) {
      ioCallback = cb
    }
    observe() {}
    disconnect() {}
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect: () => ({ width: 400, height: 300 }),
  }

  return {
    canvas,
    resize: () => roCallback([]),
    intersect: (v) => ioCallback([{ isIntersecting: v }]),
    setHidden: (hidden) => {
      global.document.visibilityState = hidden ? 'hidden' : 'visible'
      listeners.visibilitychange.forEach((fn) => fn())
    },
    pump: (ms) => {
      now += ms
      const fn = rafQueue.shift()
      if (fn) fn(now)
    },
    pending: () => rafQueue.length,
  }
}

test('canvas harness: sizes, runs, pauses offscreen, clamps dt, destroys', async () => {
  const env = makeEnv()
  const { mountEffect } = await import('../dist/canvas/index.js')

  const frames = []
  const handle = mountEffect(env.canvas, {
    frame: (fx, dt) => frames.push({ dt, w: fx.width, dpr: fx.dpr }),
  })

  // no size yet → no loop
  assert.equal(env.pending(), 0)

  env.resize()
  assert.equal(env.canvas.width, 800) // 400 CSS px × dpr capped at 2
  assert.equal(env.pending(), 1)

  env.pump(16)
  env.pump(16)
  assert.equal(frames.length, 2)
  assert.ok(Math.abs(frames[1].dt - 0.016) < 1e-9)
  assert.equal(frames[1].w, 400)
  assert.equal(frames[1].dpr, 2)

  // dt clamp: a huge gap reports at most 50ms
  env.pump(5000)
  assert.equal(frames.at(-1).dt, 0.05)

  // offscreen → paused; back → resumes
  env.intersect(false)
  assert.equal(env.pending(), 0)
  env.intersect(true)
  assert.equal(env.pending(), 1)

  // hidden tab → paused
  env.setHidden(true)
  assert.equal(env.pending(), 0)
  env.setHidden(false)
  assert.equal(env.pending(), 1)

  // manual pause wins over everything
  handle.pause()
  assert.equal(env.pending(), 0)
  handle.resume()
  assert.equal(env.pending(), 1)

  handle.destroy()
  assert.equal(env.pending(), 0)
})
