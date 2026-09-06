import assert from 'node:assert/strict'
import { test } from 'node:test'

// Minimal DOM stubs — enough to drive mountEffect's gates by hand.
function makeEnv() {
  const rafQueue = []
  let now = 0
  const listeners = { visibilitychange: [] }

  // Captures the 'change' listener from the `(resolution: ...dppx)` query
  // specifically (not the reduced-motion one, which also calls matchMedia):
  // a real DPR change fires this without ever touching ResizeObserver, and
  // env.changeDpr() below drives it the same way.
  let dprChangeListener
  global.window = {
    devicePixelRatio: 3,
    matchMedia: (query) => ({
      matches: false,
      addEventListener: (_type, fn) => {
        if (query.startsWith('(resolution')) dprChangeListener = fn
      },
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

  let roCallback, ioCallback, observedCanvas
  global.ResizeObserver = class {
    constructor(cb) {
      roCallback = cb
    }
    observe(target) {
      observedCanvas = target
    }
    disconnect() {}
  }
  global.IntersectionObserver = class {
    constructor(cb) {
      ioCallback = cb
    }
    observe() {}
    disconnect() {}
  }

  // The canvas's own content box the way a real ResizeObserverEntry reports
  // it (seventh pass): style.width/height if the canvas has a CSS size
  // (never moves as a consequence of the canvas's own backing-store write),
  // otherwise its width/height attribute (an unsized canvas's layout size
  // IS that attribute value, in CSS pixels — the whole feedback loop). No
  // padding/border/transform enters this at all, matching a real
  // contentRect exactly.
  const contentBoxOf = (canvas) => ({
    width: canvas.style.width ? parseFloat(canvas.style.width) : canvas.width,
    height: canvas.style.height ? parseFloat(canvas.style.height) : canvas.height,
  })

  const canvas = {
    width: 0,
    height: 0,
    // CSS-sized on purpose: this fixture is the general lifecycle test
    // (sizes/pauses/resumes/destroys), not a pin/no-pin one, so its box
    // must stay fixed at 400x300 regardless of what the harness writes to
    // canvas.width/height.
    style: { width: '400px', height: '300px' },
    computedStyle: {
      paddingLeft: '0px',
      paddingRight: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
      borderLeftWidth: '0px',
      borderRightWidth: '0px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
    },
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect: () => ({ width: 400, height: 300 }),
    // clientWidth/clientHeight: what the causal probe in applySize() reads
    // directly (see src/canvas/index.ts). CSS-sized, so fixed at 400x300
    // regardless of canvas.width/height, matching a real browser exactly.
    get clientWidth() {
      return this.style.width ? parseFloat(this.style.width) : this.width
    },
    get clientHeight() {
      return this.style.height ? parseFloat(this.style.height) : this.height
    },
  }

  return {
    canvas,
    // Delivers a ResizeObserverEntry to the harness. Given an explicit
    // `contentRect`, exactly that one entry is delivered (a single,
    // isolated event: a manual/bit-exact entry, or a later class- or
    // stylesheet-driven resize a test wants to examine on its own). With
    // none, the entry is derived from the observed canvas's OWN current
    // content box and redelivered for as long as that box keeps changing
    // as a result of the harness's last write (mirroring a real browser's
    // same-frame recursive ResizeObserver redelivery): an unsized canvas's
    // box follows its own backing store and would keep producing new
    // entries forever if the harness never pinned it; a CSS-sized canvas's
    // box never moves this way, so this always stops after exactly one
    // delivery for it. The causal probe (see src/canvas/index.ts) pins an
    // unsized canvas synchronously, inside the very first delivery, so
    // this cascade settles in one iteration there too; it stays as a
    // safety net, a capped loop (not an unbounded one), so a bug that never
    // converges fails the test instead of hanging it.
    resize: (contentRect) => {
      if (contentRect) {
        roCallback([{ contentRect }])
        return
      }
      let rect = contentBoxOf(observedCanvas)
      for (let i = 0; i < 10; i++) {
        roCallback([{ contentRect: rect }])
        const next = contentBoxOf(observedCanvas)
        if (next.width === rect.width && next.height === rect.height) break
        rect = next
      }
    },
    // Simulates a real DPR change (moving window to another monitor): the
    // media query's 'change' event fires with no ResizeObserver entry
    // involved at all, same as onDprChange()'s own trigger in a real
    // browser.
    changeDpr: (dpr) => {
      global.window.devicePixelRatio = dpr
      dprChangeListener?.()
    },
    intersect: (v) => ioCallback([{ isIntersecting: v }]),
    setHidden: (hidden) => {
      global.document.visibilityState = hidden ? 'hidden' : 'visible'
      listeners.visibilitychange.forEach((fn) => fn())
    },
    // Fires every rAF callback queued as of THIS call, together, the way a
    // real browser fires every requestAnimationFrame callback registered
    // before a given frame in that same frame (a callback a fired one
    // schedules, e.g. the nested rAF the harness uses to clear `pending`
    // two frames out, is newly queued during this batch and so waits for
    // the NEXT pump() call, not this one): `splice` snapshots the queue
    // before firing so a callback that reschedules itself (the tick loop)
    // doesn't get invoked twice in the same batch.
    pump: (ms) => {
      now += ms
      const batch = rafQueue.splice(0, rafQueue.length)
      batch.forEach((fn) => fn(now))
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
  // One rAF queued: the tick loop's own start. The causal probe that just
  // ran inside applySize() above is fully synchronous, no rAF of its own.
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

// `width`/`height` are the canvas's own content-box attribute values (what
// an unsized canvas lays out at, in CSS pixels, per the platform's replaced-
// element sizing rules: the whole feedback loop this harness stops).
// `border`/`padding`/`scale` feed getBoundingClientRect() below, the
// fallback measureLayout() uses when applySize() runs with no
// ResizeObserverEntry at all (onDprChange() before its first entry ever
// arrives); they never touch a real entry's contentRect either.
// `clientWidth`/`clientHeight` are what the causal probe in applySize()
// reads directly (see src/canvas/index.ts): CSS-sized (`style.width`/
// `height` authored) stays fixed at that value no matter what
// `width`/`height` (the attribute) is; unsized follows `width`/`height`
// exactly, matching a real browser's replaced-element sizing. Padding is
// included (a real clientWidth/clientHeight does too) but only ever as a
// constant that cancels out of the probe's own before/after delta; border
// and `scale` never enter it at all (a real one excludes border and is
// never touched by a transform), so a bordered/padded/scaled/transformed
// canvas, sized or unsized, still probes exactly the same as a plain one:
// these fixtures exist to prove that, not because the mechanism still
// needs to account for them. `clientReads` counts every
// clientWidth/clientHeight read, so a test can assert the probe ran
// exactly when expected (once per applySize() call, never per frame).
function makeCanvas({ width, height, style, border = 0, padding = 0, scale = 1, residual = 0 }) {
  const pad = typeof padding === 'number' ? { left: padding, right: padding, top: padding, bottom: padding } : padding
  return {
    width,
    height,
    style,
    clientReads: 0,
    computedStyle: {
      paddingLeft: `${pad.left}px`,
      paddingRight: `${pad.right}px`,
      paddingTop: `${pad.top}px`,
      paddingBottom: `${pad.bottom}px`,
      borderLeftWidth: `${border / 2}px`,
      borderRightWidth: `${border / 2}px`,
      borderTopWidth: `${border / 2}px`,
      borderBottomWidth: `${border / 2}px`,
    },
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect() {
      const contentW = this.style.width ? parseFloat(this.style.width) : this.width
      const contentH = this.style.height ? parseFloat(this.style.height) : this.height
      return {
        width: (contentW + pad.left + pad.right + border) * scale - residual,
        height: (contentH + pad.top + pad.bottom + border) * scale - residual,
      }
    },
    get clientWidth() {
      this.clientReads++
      const contentW = this.style.width ? parseFloat(this.style.width) : this.width
      return contentW + pad.left + pad.right
    },
    get clientHeight() {
      this.clientReads++
      const contentH = this.style.height ? parseFloat(this.style.height) : this.height
      return contentH + pad.top + pad.bottom
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

  // One pass: the causal probe runs synchronously right after the backing
  // store write, within this SAME env.resize() call, so the pin lands on
  // the very first delivery, no cascade needed.
  env.resize()
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

  // A real ResizeObserverEntry's contentRect excludes border already, and
  // the causal probe reads clientWidth/clientHeight, which exclude border
  // the same way: a border changes nothing here.
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

test('canvas harness: an unsized padded canvas pins its true content box, not the padding-inflated box', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 10px padding on every side. A real ResizeObserverEntry's contentRect
  // excludes padding already, so the size the harness pins has no
  // padding-inflated box to land on in the first place. The causal probe
  // separately reads clientWidth, which DOES include padding, but only to
  // compare two readings of it: padding is constant across both, so it
  // cancels out of the delta and never affects the follows/doesn't-follow
  // result.
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

  // border:4px, padding:6px, box-sizing:border-box. None of that touches a
  // real contentRect, and border doesn't enter clientWidth either (padding
  // does, but cancels out of the probe's delta, same as the padding-only
  // case above), which is why forcing box-sizing:content-box on the pin is
  // still what stops the author's own border-box declaration from
  // reinterpreting the pinned width as a border box and shrinking the
  // content back down.
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

test('canvas harness: an unsized canvas with fractional padding settles in one pass at the exact content size', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // padding: 0.3px, common from a percentage or calc() padding, or a
  // non-100% zoom. A real contentRect excludes padding regardless of
  // whether it is a whole or fractional value, and the causal probe never
  // subtracts padding from anything (it only diffs two clientWidth
  // readings, and padding is identical in both), so there is no residual
  // to land a fraction of a pixel off of.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 0.3 })

  mountEffect(canvas, { frame: () => {} })

  env.resize() // one pass settles it, same as the integer-padding case
  assert.equal(canvas.style.width, '300px') // exact, not 300.4
  assert.equal(canvas.style.height, '150px') // exact, not 150.4
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})

test('canvas harness: an unsized canvas with padding AND its own transform still pins its true content box (ADU-107, seventh pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // padding: 10px, transform: scale(2). The sixth-pass ratio design read
  // this combination through getBoundingClientRect() (inflated by the
  // transform) minus computed padding, which dampens the before/after
  // ratio below the threshold the feedback check needed: the panel's
  // sixth-pass regression finding, reproduced in Chrome, pinned this
  // canvas at an inflated size instead of its true 300x150. The causal
  // probe (eighth pass) reads clientWidth/clientHeight instead, which
  // include padding (constant across both readings, cancels out of the
  // delta) and are never touched by a transform (applied after layout), so
  // it never sees any inflation at all; the size that gets pinned still
  // comes from the ResizeObserverEntry's own bit-exact contentRect, which
  // excludes padding and ignores transform outright.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 10, scale: 2 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.style.boxSizing, 'content-box')
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, not the transform-inflated value
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})

test('canvas harness: applySize() uses the entry\'s contentRect, not the canvas\'s own attribute values, to size the backing store', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // The canvas's own width/height attribute is 300x150; a manually fed
  // entry (111x222, distinct on both axes) proves measureLayout() reads
  // the entry directly rather than re-deriving a size from the canvas
  // itself.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 111, height: 222 })
  assert.equal(canvas.width, 222) // 111 CSS px * dpr 2, not 600 (300 * 2)
  assert.equal(canvas.height, 444)
})

test('canvas harness: a CSS-sized canvas with fractional padding is never pinned, even against a bit-exact entry', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style, state, writes } = makeStyle({ width: '300px', height: '150px' })
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 0.3 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 300, height: 150 }) // entry: bit-exact, matches the CSS size
  assert.equal(writes.length, 0) // never pinned
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2
  assert.equal(canvas.height, 300)
  assert.deepEqual(sizes.at(-1), { w: 300, h: 150 })

  // A later class- or stylesheet-driven resize, not the harness.
  state.width = '400px'
  state.height = '200px'
  env.resize({ width: 400, height: 200 })
  assert.equal(writes.length, 0) // still never pinned
  assert.equal(canvas.width, 800) // follows the new CSS size, not frozen
  assert.equal(canvas.height, 400)
  assert.deepEqual(sizes.at(-1), { w: 400, h: 200 })
})

test('canvas harness: a CSS-sized canvas under transform: scale() is never pinned', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // A real ResizeObserverEntry's contentRect ignores transform (it is
  // layout size, not rendered size): fed here as the true 200x100,
  // unaffected by transform: scale(1.3) on this same canvas.
  const { style, state, writes } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style, scale: 1.3 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 200, height: 100 })
  assert.equal(writes.length, 0) // never pinned
  assert.equal(canvas.width, 400) // 200 CSS px * dpr 2
  assert.equal(canvas.height, 200)
  assert.deepEqual(sizes.at(-1), { w: 200, h: 100 })

  // A later class- or stylesheet-driven resize, not the harness.
  state.width = '250px'
  state.height = '120px'
  env.resize({ width: 250, height: 120 })
  assert.equal(writes.length, 0) // still never pinned
  assert.equal(canvas.width, 500) // follows the new CSS size, not frozen
  assert.equal(canvas.height, 240)
  assert.deepEqual(sizes.at(-1), { w: 250, h: 120 })
})

test('canvas harness: a display:none canvas with padding returns early instead of writing a negative backing store', async () => {
  const env = makeEnv()
  const { mountEffect } = await import('../dist/canvas/index.js')

  // display:none: getBoundingClientRect() reports an all-zero rect.
  // Padding is still authored (10px combined per axis), so the raw
  // subtraction rect.width - padding goes negative (-10), which the
  // `!size.width` guard alone would not catch (a negative number is
  // truthy in JS): clamped to 0 in measureLayout()'s fallback, read as
  // "not laid out yet". This exercises that fallback specifically (no
  // ResizeObserverEntry at all): env.changeDpr() calls applySize() the way
  // onDprChange() does, direct, with nothing to observe yet, so there is
  // no `lastContent` to fall back to either.
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    computedStyle: {
      paddingLeft: '5px',
      paddingRight: '5px',
      paddingTop: '5px',
      paddingBottom: '5px',
      borderLeftWidth: '0px',
      borderRightWidth: '0px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
    },
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
  }

  mountEffect(canvas, { frame: () => {} })

  env.changeDpr(2)
  assert.equal(canvas.width, 0) // never written, not a negative value
  assert.equal(canvas.height, 0)
  assert.equal(env.pending(), 0) // never started: setup()/frame() never ran
})

test('canvas harness: a small unsized canvas is pinned on the very first pass at a fractional DPR', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.25
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 4x4, dpr 1.25: the backing-store write rounds to 5x5, one CSS pixel
  // more than the canvas's true 4x4. The causal probe is a plain 1-or-0
  // delta check independent of the write's value or the canvas's size: it
  // needs no ratio, no tolerance, and no dpr-direction guard to catch a
  // 1px move on a 4x4 canvas.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 4, height: 4, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '4px') // pinned at the intrinsic size
  assert.equal(canvas.style.height, '4px')
  assert.equal(canvas.width, 5) // 4 CSS px * dpr 1.25
  assert.equal(canvas.height, 5)

  env.resize()
  assert.equal(canvas.width, 5) // stable
  assert.equal(canvas.height, 5)
})

test('canvas harness: a small unsized canvas is pinned on the very first pass at a barely-fractional DPR', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.05
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 20x20, dpr 1.05: also moves by exactly 1 CSS pixel, same edge case as
  // the 4x4/1.25 test above at a different size and DPR. The causal probe
  // catches this the same way it catches every other gap: the delta of
  // two clientWidth readings is 1, nothing else about the size or DPR
  // enters the check.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 20, height: 20, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '20px')
  assert.equal(canvas.style.height, '20px')
  assert.equal(canvas.width, 21) // 20 CSS px * dpr 1.05
  assert.equal(canvas.height, 21)

  env.resize()
  assert.equal(canvas.width, 21) // stable
  assert.equal(canvas.height, 21)
})

test('canvas harness: an unsized canvas settles in one pass at devicePixelRatio 0.8 (a page zoomed out, ADU-107, seventh pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 0.8
  const { mountEffect } = await import('../dist/canvas/index.js')

  // The sixth-pass ratio design guarded its check with `dpr > 1`: at dpr
  // 0.8 (a page zoomed out, or a display below 100% scaling) it never even
  // looked, so an unsized canvas shrank a little further on every pass,
  // unbounded, never stabilizing (the seventh-pass regression this design
  // exists to fix). The causal probe has no such guard: a DPR below 1
  // shrinks the backing store exactly as reliably as one above 1 grows
  // it, and the probe's before/after delta on `canvas.width`/`height`
  // (always exactly 1 or exactly 0) is the same signal either way.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px') // pinned at the intrinsic size
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.width, 240) // 300 CSS px * dpr 0.8, not shrinking further
  assert.equal(canvas.height, 120)

  env.resize()
  assert.equal(canvas.width, 240) // stable
  assert.equal(canvas.height, 120)
})

test('canvas harness: an unsized canvas settles in one pass at devicePixelRatio 0.5', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 0.5
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, '150px')
  assert.equal(canvas.width, 150) // 300 CSS px * dpr 0.5
  assert.equal(canvas.height, 75)

  env.resize()
  assert.equal(canvas.width, 150) // stable
  assert.equal(canvas.height, 75)
})

test('canvas harness: a small CSS-sized canvas with fractional padding is never pinned at a fractional DPR', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.25
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style, writes } = makeStyle({ width: '4px', height: '4px' })
  const canvas = makeCanvas({ width: 4, height: 4, style, padding: 0.3 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(writes.length, 0) // never pinned
  assert.equal(canvas.width, 5) // 4 CSS px * dpr 1.25

  env.resize()
  assert.equal(writes.length, 0) // still never pinned
  assert.equal(canvas.width, 5)
})

test('canvas harness: a CSS-sized canvas with width/height in percent is never pinned', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // width/height authored as %, not px: the causal probe never inspects
  // the style string or its unit, only whether clientWidth/clientHeight
  // respond to the harness's own width/height attribute, so a
  // percentage-sized canvas is detected exactly the same as a pixel-sized
  // one. Fed here as an explicit entry (300x150, whatever the % resolved
  // to against its parent), same pattern as the fractional-padding and
  // transform cases above.
  const { style, writes } = makeStyle({ width: '100%', height: '50%' })
  const canvas = makeCanvas({ width: 300, height: 150, style })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 300, height: 150 })
  assert.equal(writes.length, 0) // never pinned
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2
  assert.equal(canvas.height, 300)
  assert.deepEqual(sizes.at(-1), { w: 300, h: 150 })

  env.resize({ width: 300, height: 150 }) // a second delivery, same size
  assert.equal(writes.length, 0) // still never pinned
  assert.equal(canvas.width, 600)
  assert.equal(canvas.height, 300)
})

test(
  "canvas harness: a CSS-sized canvas resized to exactly the size the harness itself just wrote to the backing store is never mistaken for its own write, in the same tick (ADU-107, eighth pass)",
  async () => {
    const env = makeEnv()
    global.window.devicePixelRatio = 2
    const { mountEffect } = await import('../dist/canvas/index.js')

    // 300x150 CSS size, dpr 2: mounting writes the backing store to
    // 600x300. A genuine CSS resize that then doubles the canvas's CSS
    // size to exactly 600x300 (an ordinary responsive pattern: a class
    // applied a frame after mount) lands on the exact number the harness
    // itself just wrote, the coincidence a value- or timing-based echo
    // check (sixth/seventh pass) could not tell apart from its own echo.
    // The causal probe never compares values at all: this canvas has a
    // real CSS size before AND after the resize, so it is never pinned,
    // on either delivery, regardless of the coincidence.
    const { style, state, writes } = makeStyle({ width: '300px', height: '150px' })
    const canvas = makeCanvas({ width: 300, height: 150, style })

    const sizes = []
    mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

    env.resize({ width: 300, height: 150 }) // mount: writes the backing store to 600x300
    assert.equal(writes.length, 0)
    assert.equal(canvas.width, 600)
    assert.equal(canvas.height, 300)

    // The coincidental resize, delivered in the very same tick, no frame
    // in between.
    state.width = '600px'
    state.height = '300px'
    env.resize({ width: 600, height: 300 })
    assert.equal(writes.length, 0) // never pinned
    assert.equal(canvas.width, 1200) // follows the real resize: 600 CSS px * dpr 2
    assert.equal(canvas.height, 600)
    assert.deepEqual(sizes.at(-1), { w: 600, h: 300 })
  }
)

test(
  "canvas harness: the same coincidental resize, a frame later, is also never mistaken for the harness's own write (ADU-107, eighth pass)",
  async () => {
    const env = makeEnv()
    global.window.devicePixelRatio = 2
    const { mountEffect } = await import('../dist/canvas/index.js')

    // Same setup as the same-tick case above, but the coincidental resize
    // arrives after a couple of frames instead of immediately: the
    // seventh pass's echo window closed after two frames, so a later
    // arrival fell outside it and was (correctly, by luck of the window)
    // followed as a real resize; the causal probe has no window to fall
    // outside of in the first place, so the timing changes nothing.
    const { style, state, writes } = makeStyle({ width: '300px', height: '150px' })
    const canvas = makeCanvas({ width: 300, height: 150, style })

    const sizes = []
    mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

    env.resize({ width: 300, height: 150 })
    assert.equal(canvas.width, 600)

    env.pump(16)
    env.pump(16)

    state.width = '600px'
    state.height = '300px'
    env.resize({ width: 600, height: 300 })
    assert.equal(writes.length, 0) // never pinned, same as the same-tick case
    assert.equal(canvas.width, 1200)
    assert.equal(canvas.height, 600)
    assert.deepEqual(sizes.at(-1), { w: 600, h: 300 })
  }
)

test("canvas harness: onDprChange() reuses the last ResizeObserver-measured content size instead of a transform-inflated rect", async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized (style width/height authored below), transform: scale(1.5).
  // onDprChange() (a real DPR change, no ResizeObserver entry involved) used
  // to fall back to getBoundingClientRect(), inflated by the transform, and
  // wrote a wrong fx.width/height and context scale that never
  // self-corrected. The harness now remembers the content size the last
  // real ResizeObserver entry reported (bit-exact, a transform never
  // touches it) and reuses that here instead of re-deriving from the rect.
  const { style } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style, scale: 1.5 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 200, height: 100 }) // entry: unaffected by transform
  assert.deepEqual(sizes.at(-1), { w: 200, h: 100 })
  assert.equal(canvas.width, 200) // 200 CSS px * dpr 1

  env.changeDpr(2) // a real DPR change: no ResizeObserver entry involved
  assert.deepEqual(sizes.at(-1), { w: 200, h: 100 }) // unchanged, not 300 (200 * 1.5 rect inflation)
  assert.equal(canvas.width, 400) // 200 CSS px * new dpr 2, not 600 (300 inflated * 2)
  assert.equal(canvas.height, 200)
})

test('canvas harness: the causal probe restores the attribute exactly and runs only inside applySize, never per frame (ADU-107, eighth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized so the box never moves and applySize() runs exactly once per
  // env.resize() call (no pin cascade to account for): isolates the probe
  // itself, not the pin/no-pin decision the other tests already cover.
  const { style } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  // 200 CSS px * dpr 2: the probe bumped canvas.width/height by one on
  // each axis and put them back, landing on the exact value applySize()
  // itself wrote, not one off it either way.
  assert.equal(canvas.width, 400)
  assert.equal(canvas.height, 200)
  const readsAfterMount = canvas.clientReads
  // One resize event, both axes probed together: clientWidth + clientHeight
  // read once after the bump, once after the reset, 4 reads total, not 8
  // (see the module doc: two forced layouts, not four).
  assert.equal(readsAfterMount, 4)

  env.pump(16)
  env.pump(16)
  env.pump(16)
  assert.equal(canvas.clientReads, readsAfterMount) // no reads from the frame loop itself

  env.resize() // a second resize event: the probe runs again, reads again
  assert.equal(canvas.clientReads, readsAfterMount + 4)
  assert.equal(canvas.width, 400) // still restored correctly
  assert.equal(canvas.height, 200)
})
