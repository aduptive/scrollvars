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
    getComputedStyle: (el) => el.computedStyle,
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
    style: {},
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

// style.width/height as a Proxy: `writes` records every assignment the
// harness makes through `canvas.style`, so a test can assert it never
// pinned anything, not just check the final value. Mutating the returned
// `state` object directly (not through `style`) simulates an external
// stylesheet/class change instead of a harness write.
function makeStyle(initial = {}) {
  const state = { ...initial }
  const writes = []
  const style = new Proxy(state, {
    set(target, prop, value) {
      writes.push(prop)
      target[prop] = value
      return true
    },
  })
  return { style, state, writes }
}

// The content box (canvas.width/height, or style.width/height once the
// harness pins it, exactly like clientWidth/clientHeight track a real
// canvas) plus `padding` is what clientWidth/clientHeight actually report:
// clientWidth/Height always include padding, whatever box-sizing says
// (box-sizing only changes what a specified CSS `width` means, never what
// clientWidth reports). getBoundingClientRect (border box) adds `border`
// on top of that too.
function makeCanvas({ width, height, style, border = 0, padding = 0 }) {
  const pad = typeof padding === 'number' ? { left: padding, right: padding, top: padding, bottom: padding } : padding
  return {
    width,
    height,
    style,
    computedStyle: {
      paddingLeft: `${pad.left}px`,
      paddingRight: `${pad.right}px`,
      paddingTop: `${pad.top}px`,
      paddingBottom: `${pad.bottom}px`,
    },
    getContext: () => ({ setTransform: () => {} }),
    get clientWidth() {
      const content = this.style.width ? parseFloat(this.style.width) : this.width
      return content + pad.left + pad.right
    },
    get clientHeight() {
      const content = this.style.height ? parseFloat(this.style.height) : this.height
      return content + pad.top + pad.bottom
    },
    getBoundingClientRect() {
      const contentW = this.style.width ? parseFloat(this.style.width) : this.width
      const contentH = this.style.height ? parseFloat(this.style.height) : this.height
      return {
        width: contentW + pad.left + pad.right + border,
        height: contentH + pad.top + pad.bottom + border,
      }
    },
  }
}

test('canvas harness: an unsized canvas stabilizes after one pass (dpr 2)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize() // first pass: re-measuring after the write catches the loop,
  // pins the pre-write CSS size
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, not multiplied again
  assert.equal(canvas.height, 300)

  env.resize() // second pass: layout now follows the pinned CSS size
  assert.equal(canvas.width, 600) // stable: would have doubled to 1200
  assert.equal(canvas.height, 300)
})

test('canvas harness: a CSS-sized canvas is never pinned and follows a later CSS resize', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // Attribute values equal the CSS size, same as <canvas width="200"
  // height="100" style="width:200px;height:100px">: the old equality guard
  // mistook this for the unsized case on first mount.
  const { style, state, writes } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style })

  const sizes = []
  mountEffect(canvas, {
    frame: () => {},
    resize: (fx) => sizes.push({ w: fx.width, h: fx.height }),
  })

  env.resize()
  assert.equal(writes.length, 0) // the harness never wrote to style
  assert.equal(canvas.width, 400) // 200 CSS px * dpr 2, backing store only
  assert.equal(canvas.height, 200)
  assert.deepEqual(sizes.at(-1), { w: 200, h: 100 })

  // A later class- or stylesheet-driven resize, not the harness.
  state.width = '300px'
  state.height = '150px'
  env.resize()
  assert.equal(writes.length, 0) // still never pinned
  assert.equal(canvas.width, 600) // follows the new CSS size, not frozen
  assert.equal(canvas.height, 300)
  assert.deepEqual(sizes.at(-1), { w: 300, h: 150 })
})

test('canvas harness: a bordered unsized canvas still stabilizes', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // clientWidth (300) excludes the 2px border the rect (302) includes: the
  // old border-box rect-vs-content-box-attribute equality guard never fired
  // here, so the loop it exists to catch ran unchecked.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, border: 2 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.width, 600)
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})

test('canvas harness: an unsized padded canvas pins its true content box, not the padding-inflated clientWidth (ADU-107, third pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // clientWidth (320) includes the 10px padding on every side that the
  // true content box (300) excludes: the old measureLayout() read
  // clientWidth directly and called it the content box, pinning the
  // inflated 320x170 instead of 300x150.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 10 })

  mountEffect(canvas, { frame: () => {} })

  env.resize() // one pass settles it, same as the plain and bordered cases
  assert.equal(canvas.style.width, '300px') // the true content box, not 320
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.style.boxSizing, 'content-box')
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, not the inflated 320
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})

test('canvas harness: a bordered, padded, border-box unsized canvas still pins its true content box', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // border:4px, padding:6px, box-sizing:border-box. clientWidth already
  // excludes the border regardless of box-sizing (clientWidth is always
  // the padding box), so the same padding subtraction recovers the true
  // 300 content box. Forcing box-sizing:content-box on the pin is what
  // stops the author's own border-box declaration from reinterpreting the
  // pinned width as a border box and shrinking the content back down.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, border: 4, padding: 6 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.style.boxSizing, 'content-box')
  assert.equal(canvas.width, 600)
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})
