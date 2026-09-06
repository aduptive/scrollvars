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
  // it: style.width/height if the canvas has a CSS size (never moves as a
  // consequence of the canvas's own backing-store write), otherwise its
  // width/height attribute (an unsized canvas's layout size IS that
  // attribute value, in CSS pixels — the whole feedback loop). When only
  // one axis has a CSS size (ninth pass: the harness now pins width only,
  // leaving height to the intrinsic ratio), the other axis is derived from
  // the resolved one through the canvas's own width/height attribute ratio,
  // same as a real replaced element. No padding/border/transform enters
  // this at all, matching a real contentRect exactly.
  const contentBoxOf = (canvas) => {
    const hasW = !!canvas.style.width
    const hasH = !!canvas.style.height
    const w = hasW ? parseFloat(canvas.style.width) : canvas.width
    const h = hasH ? parseFloat(canvas.style.height) : canvas.height
    if (hasW && !hasH) return { width: w, height: w * (canvas.height / canvas.width) }
    if (!hasW && hasH) return { width: h * (canvas.width / canvas.height), height: h }
    return { width: w, height: h }
  }

  const canvas = {
    // A real canvas's width/height content attributes default to 300x150
    // (the HTML spec default) even when never set explicitly; this fixture
    // matches that instead of 0x0, which would make the eleventh pass's
    // w0/h0 intrinsic ratio (see src/canvas/index.ts) divide by zero.
    width: 300,
    height: 150,
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
      // Twelfth pass: getComputedStyle(canvas).aspectRatio, read before the
      // pin decides whether to set style.aspectRatio itself. 'auto' matches
      // a real browser's default (no authored aspect-ratio).
      aspectRatio: 'auto',
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
//
// `maxWidth` (mutable on the returned object, so a test can simulate a
// container shrink by lowering it later, same pattern as mutating
// `state.width` above) models `max-width`: it caps whatever the width
// would otherwise resolve to, exactly like the real CSS property, whether
// that source is the attribute (unsized) or an authored `style.width`.
// When one axis has no CSS size of its own (`style.width`/`height` unset),
// its content size is derived from the OTHER, resolved axis through the
// canvas's own width/height attribute ratio, same as a real replaced
// element's intrinsic sizing (this is also what a real `height: auto` or
// `width: auto` resolves to, and what the ninth-pass module doc calls the
// axis "the harness's own proportional writes keep stable").
function resolveContentSize(canvas) {
  const hasW = !!canvas.style.width
  const hasH = !!canvas.style.height
  let w = hasW ? parseFloat(canvas.style.width) : undefined
  let h = hasH ? parseFloat(canvas.style.height) : undefined
  if (w !== undefined && canvas.maxWidth != null) w = Math.min(w, canvas.maxWidth)
  if (w === undefined && canvas.maxWidth != null && h === undefined) {
    w = Math.min(canvas.width, canvas.maxWidth) // auto width, capped
  }
  if (w === undefined && h !== undefined) w = h * (canvas.width / canvas.height)
  if (w === undefined) w = canvas.width
  if (h === undefined) h = hasW || w !== canvas.width ? w * (canvas.height / canvas.width) : canvas.height
  return { width: w, height: h }
}

function makeCanvas({
  width,
  height,
  style,
  border = 0,
  padding = 0,
  scale = 1,
  residual = 0,
  maxWidth,
  aspectRatio = 'auto',
}) {
  const pad = typeof padding === 'number' ? { left: padding, right: padding, top: padding, bottom: padding } : padding
  return {
    width,
    height,
    style,
    maxWidth,
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
      // Twelfth pass: 'auto' unless a test authors its own (kept, not
      // overridden, when the canvas pins).
      aspectRatio,
    },
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect() {
      const { width: contentW, height: contentH } = resolveContentSize(this)
      return {
        width: (contentW + pad.left + pad.right + border) * scale - residual,
        height: (contentH + pad.top + pad.bottom + border) * scale - residual,
      }
    },
    get clientWidth() {
      this.clientReads++
      return resolveContentSize(this).width + pad.left + pad.right
    },
    get clientHeight() {
      this.clientReads++
      return resolveContentSize(this).height + pad.top + pad.bottom
    },
  }
}

// Redelivers `canvas`'s OWN current content box (its clientWidth/Height,
// which for a mirror-style canvas keeps moving a little as a side effect
// of this harness's own writes) as a fresh ResizeObserverEntry, one pass
// per call, until two consecutive deliveries land on the exact same
// backing-store attributes (a real fixed point, not just a small enough
// diff), or `maxPasses` is reached, whichever comes first. Returns the
// number of DELIVERIES that changed the backing store before it stopped
// moving (0 if the very first delivery already settled it); a test that
// gets `maxPasses` back never converged.
function driveToFixedPoint(env, canvas, maxPasses = 100) {
  let prevW = canvas.width
  let prevH = canvas.height
  for (let pass = 1; pass <= maxPasses; pass++) {
    env.resize({ width: canvas.clientWidth, height: canvas.clientHeight })
    if (canvas.width === prevW && canvas.height === prevH) return pass - 1
    prevW = canvas.width
    prevH = canvas.height
  }
  return maxPasses
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
  // Ninth pass: only width is pinned. Height stays free (unset), deriving
  // from the pinned width through the intrinsic ratio (see contentBoxOf()
  // above and the module doc), which is why it still reads 150 on the
  // stability check below without ever being written to style itself.
  assert.equal(canvas.style.height, undefined)
  // Eleventh pass: `aspect-ratio` is set to the ORIGINAL attribute ratio
  // (the anchor design), so the CSS engine derives height exactly, never
  // through this harness's own rounded backing-store attributes.
  assert.equal(canvas.style.aspectRatio, '300 / 150')
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, not multiplied again
  assert.equal(canvas.height, 300)

  env.resize() // second pass: layout now follows the pinned CSS width
  assert.equal(canvas.width, 600) // stable: would have doubled to 1200
  assert.equal(canvas.height, 300) // stable too: the ratio never drifts
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
  // the causal probe reads clientWidth, which excludes border the same
  // way: a border changes nothing here.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, border: 2 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  // canvas at an inflated size instead of its true 300x150. The probe
  // reads clientWidth instead, which includes padding (constant across
  // both readings, cancels out of the delta) and is never touched by a
  // transform (applied after layout), so it never sees any inflation at
  // all; the size that gets pinned still comes from the
  // ResizeObserverEntry's own bit-exact contentRect, which excludes
  // padding and ignores transform outright.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 10, scale: 2 })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '300px')
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
  assert.equal(canvas.style.boxSizing, 'content-box')
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, not the transform-inflated value
  assert.equal(canvas.height, 300)

  env.resize()
  assert.equal(canvas.width, 600) // stable
  assert.equal(canvas.height, 300)
})

test('canvas harness: every unsized variant pins once at the anchor with aspect-ratio set (ADU-107, eleventh pass)', async () => {
  // The anchor design (see the module doc): a pin always sets
  // `style.aspectRatio` to the ORIGINAL, un-perturbed width/height
  // attributes (300/150 here, whatever border/padding/transform the box
  // also carries: none of that touches the attribute values themselves),
  // so the CSS engine derives height exactly, never through this
  // harness's own rounded backing-store attributes. One test per variant
  // already covers its own specific measurement quirk in detail above;
  // this one is just the aspect-ratio pin, swept across all of them.
  const variants = [
    ['plain', {}],
    ['bordered', { border: 2 }],
    ['padded', { padding: 10 }],
    ['bordered, padded, border-box', { border: 4, padding: 6 }],
    ['fractional padding', { padding: 0.3 }],
    ['padded and transformed', { padding: 10, scale: 2 }],
  ]
  for (const [name, opts] of variants) {
    const env = makeEnv()
    global.window.devicePixelRatio = 2
    const { mountEffect } = await import('../dist/canvas/index.js')

    const { style } = makeStyle()
    const canvas = makeCanvas({ width: 300, height: 150, style, ...opts })

    mountEffect(canvas, { frame: () => {} })
    env.resize()

    assert.equal(canvas.style.width, '300px', `${name}: pinned width`)
    assert.equal(canvas.style.aspectRatio, '300 / 150', `${name}: aspect-ratio set to the original attributes`)
    assert.equal(canvas.style.height, undefined, `${name}: height never pinned directly`)
  }
})

test('canvas harness: applySize() uses the entry\'s contentRect, not the canvas\'s own attribute values, to size the backing store', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // The canvas's own width/height attribute is 300x150; a manually fed
  // entry (111x222, distinct on both axes) proves measureLayout() reads
  // the entry directly rather than re-deriving a size from the canvas
  // itself. This canvas is unsized (no CSS width or height at all), so it
  // gets pinned at that entry's width (111) with `aspectRatio` set to the
  // original 300/150; once pinned, both axes round independently from
  // what this pass measured (eleventh pass: CSS `aspect-ratio`, not this
  // harness's own rounding, is what keeps height correct from here on, so
  // there is nothing left to anchor height to).
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 111, height: 222 })
  assert.equal(canvas.width, 222) // 111 CSS px * dpr 2, not 600 (300 * 2)
  assert.equal(canvas.height, 444) // 222 CSS px * dpr 2, independent, once pinned
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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
  assert.equal(canvas.style.height, undefined) // ninth pass: width-only pin
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

test('canvas harness: the proportional probe restores the attribute exactly and runs only inside applySize, never per frame (ADU-107, tenth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized so the box never moves and applySize() runs exactly once per
  // env.resize() call (no pin cascade to account for): isolates the probe
  // itself, not the pin/no-pin decision the other tests already cover.
  const { style, state } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  // 200 CSS px * dpr 2: the probe doubled, then (since 400x200 are both
  // even) also halved, canvas.width/height and put them back each time,
  // landing on the exact value applySize() itself wrote, not one off it
  // either way.
  assert.equal(canvas.width, 400)
  assert.equal(canvas.height, 200)
  const readsAfterMount = canvas.clientReads
  // One resize event, eight reads total: a baseline clientWidth/clientHeight
  // pair (2), doubling both attributes together shows no follow so the
  // halving tiebreaker also runs (400x200 are both even, so it is exact,
  // +1 for its own clientWidth read), the two single-axis probes that
  // decide the free axis (height-alone, +1; width-alone, +1), and the
  // escape check on the candidate write itself (a baseline clientWidth,
  // +1, and a doubled one, +1: this canvas stays CSS-sized at double its
  // own candidate too, so it commits as computed). Still bounded per
  // resize event, never per frame.
  assert.equal(readsAfterMount, 8)

  env.pump(16)
  env.pump(16)
  env.pump(16)
  assert.equal(canvas.clientReads, readsAfterMount) // no reads from the frame loop itself

  // An IDENTICAL resize event (the dead band, eleventh pass): the measured
  // content size did not move, so this pass returns before the probe ever
  // runs again.
  env.resize()
  assert.equal(canvas.clientReads, readsAfterMount)

  // A genuinely DIFFERENT resize event: the probe runs again, reads again.
  state.width = '210px'
  state.height = '105px'
  env.resize()
  assert.equal(canvas.clientReads, readsAfterMount + 8)
  assert.equal(canvas.width, 420) // 210 CSS px * dpr 2, still restored correctly
  assert.equal(canvas.height, 210)
})

test('canvas harness: the dead band skips a sub-pixel content change, but a DPR change at the same size still rewrites (ADU-107, eleventh pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 300, height: 150 }) // mount: writes the backing store
  assert.equal(canvas.width, 600)
  assert.equal(canvas.height, 300)
  assert.equal(sizes.length, 1)

  // A sub-pixel content change (< 0.5px on both axes): the dead band skips
  // the whole pass, backing store included, and `resize()` never fires.
  env.resize({ width: 300.2, height: 150.3 })
  assert.equal(canvas.width, 600) // unchanged, not re-rounded to 601
  assert.equal(canvas.height, 300)
  assert.equal(sizes.length, 1) // resize() did not fire again

  // Back to the exact mounted size: also dead (no change at all), and
  // resets the size onDprChange() below will fall back to.
  env.resize({ width: 300, height: 150 })
  assert.equal(sizes.length, 1)

  // The SAME content size again, but a real DPR change: never dead, since
  // a new bitmap is needed even when the CSS content size did not move.
  // (dprCap defaults to 2, so dpr 1 is the one that actually takes effect
  // here, not a value above the cap.)
  env.changeDpr(1)
  assert.equal(canvas.width, 300) // 300 CSS px * new dpr 1
  assert.equal(canvas.height, 150)
  assert.equal(sizes.length, 2)

  // Back to a genuinely different size at the same DPR: not dead either.
  env.resize({ width: 320, height: 160 })
  assert.equal(canvas.width, 320) // 320 CSS px * dpr 1
  assert.equal(canvas.height, 160)
  assert.equal(sizes.length, 3)
})

test('canvas harness: a width:100%,height:auto canvas is never pinned, at dpr 0.5, 0.8, 1.25 and 2 (ADU-107, ninth pass, verifier finding 1)', async () => {
  for (const dpr of [0.5, 0.8, 1.25, 2]) {
    const env = makeEnv()
    global.window.devicePixelRatio = dpr
    const { mountEffect } = await import('../dist/canvas/index.js')

    // width:100% resolves to a fixed 700px against its container,
    // independent of the canvas's own attribute; height:auto is not
    // authored at all, so the browser derives it from the resolved width
    // through the canvas's own 300x150 (2:1) intrinsic width/height
    // ratio, i.e. its attribute values. The eighth-pass probe bumped both
    // attributes by a flat +1 each, which nudges that ratio and can flip
    // the height reading across a rounding boundary at exactly these dprs
    // (the verifier's finding 1, reproduced in Chrome): this ordinary,
    // fully-responsive canvas got wrongly pinned, and once pinned to a
    // literal px width never followed its container again. The ninth-pass
    // probe only ever asks about width, so a genuine 100%-width canvas is
    // never pinned regardless of what its ratio-derived height does.
    const { style, state, writes } = makeStyle({ width: '700px' })
    const canvas = makeCanvas({ width: 300, height: 150, style })

    const sizes = []
    mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

    env.resize({ width: 700, height: 350 }) // height:auto resolved, 2:1 ratio
    assert.equal(writes.length, 0, `dpr ${dpr}: never pinned`)
    assert.equal(canvas.width, Math.round(700 * dpr))
    assert.equal(canvas.height, Math.round(350 * dpr))
    assert.deepEqual(sizes.at(-1), { w: 700, h: 350 })

    // The container really grows: still following, never pinned.
    state.width = '900px'
    env.resize({ width: 900, height: 450 })
    assert.equal(writes.length, 0, `dpr ${dpr}: still never pinned`)
    assert.equal(canvas.width, Math.round(900 * dpr))
    assert.deepEqual(sizes.at(-1), { w: 900, h: 450 })
  }
})

test('canvas harness: a height:100px,width:auto canvas is never pinned (the mirror case, ADU-107, ninth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // height:100px fixed; width:auto derives from that height through the
  // canvas's own 300x150 (2:1) intrinsic ratio, i.e. its attribute values:
  // the mirror of the width:100%/height:auto case above. The probe still
  // only ever asks about width, and this width IS the ratio-derived axis,
  // exactly what the harness's own proportional doubling (tenth pass) keeps
  // stable, so it reads as CSS-sized and is never pinned either.
  const { style, writes } = makeStyle({ height: '100px' })
  const canvas = makeCanvas({ width: 300, height: 150, style })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 200, height: 100 }) // width:auto resolved, 2:1 ratio
  assert.equal(writes.length, 0)
  assert.equal(canvas.width, 400) // 200 CSS px * dpr 2
  assert.equal(canvas.height, 200)
  assert.deepEqual(sizes.at(-1), { w: 200, h: 100 })

  env.resize({ width: 200, height: 100 }) // a second delivery, stable
  assert.equal(writes.length, 0)
  assert.equal(canvas.width, 400)
  assert.equal(canvas.height, 200)
})

test('canvas harness: the parity sweep, a fixed-CSS-height/auto-width mirror canvas is never pinned across heights 99-151, intrinsic widths 300 and 301, and dpr 0.5/0.8/1/1.05/1.25/2 (ADU-107, tenth pass, verifier finding 1)', async () => {
  // The ninth pass's HALVING probe (Math.floor(W / 2)) does not preserve the
  // W:H ratio when the just-written backing store has mismatched parity (one
  // axis odd, one even): flooring a halved value can land the ratio-derived
  // axis a fraction off the true one, flipping the before/after clientWidth
  // comparison across a rounding boundary even though the CSS height never
  // moved. Sweeping every intrinsic width (300, an exact 2:1 ratio with the
  // fixed 150 height attribute; 301, an inexact one) against every odd CSS
  // height from 99 to 151 and every DPR this ticket has ever swept proves
  // the tenth pass's DOUBLING probe has no such flaw: doubling any pair of
  // integers preserves their ratio exactly, whatever their parity.
  for (const widthAttr of [300, 301]) {
    for (let heightCss = 99; heightCss <= 151; heightCss += 2) {
      for (const dpr of [0.5, 0.8, 1, 1.05, 1.25, 2]) {
        const env = makeEnv()
        global.window.devicePixelRatio = dpr
        const { mountEffect } = await import('../dist/canvas/index.js')

        const { style, writes } = makeStyle({ height: `${heightCss}px` })
        const canvas = makeCanvas({ width: widthAttr, height: 150, style })
        const widthCss = heightCss * (widthAttr / 150)

        mountEffect(canvas, { frame: () => {} })
        env.resize({ width: widthCss, height: heightCss })

        assert.equal(
          writes.length,
          0,
          `intrinsic width ${widthAttr}, CSS height ${heightCss}, dpr ${dpr}: expected never pinned, style writes: ${JSON.stringify(writes)}`
        )
      }
    }
  }
})

test('canvas harness: the mirror sweep, driven to a fixed point, converges within 3 passes and never pins (ADU-107, eleventh pass, verifier finding: mirror case never settles)', async () => {
  // The tenth pass's mirror-case fix (doubling instead of halving, proved
  // never-pinned above) was not the whole bug: even correctly UNPINNED,
  // width and height were each rounded independently every pass, and the
  // free width was re-derived from whatever ratio the JUST-ROUNDED
  // backing store happened to have, so the error could accumulate over
  // many ResizeObserver passes instead of settling (the verifier's
  // eleventh-pass finding: 51 to 77 passes at dpr 0.5, sometimes
  // diverging outright at dpr 0.8). The eleventh pass anchors the free
  // axis (width here) to `ratio0`, the ORIGINAL intrinsic attribute ratio,
  // computed fresh from the fixed axis (height) every pass, never from the
  // free axis's own prior, possibly-drifted reading: driven to a fixed
  // point, this converges in at most one or two passes instead of dozens,
  // and never pins.
  for (const widthAttr of [300, 301]) {
    for (let heightCss = 99; heightCss <= 151; heightCss += 2) {
      for (const dpr of [0.5, 0.8, 1, 1.05, 1.25, 1.5, 2]) {
        const env = makeEnv()
        global.window.devicePixelRatio = dpr
        const { mountEffect } = await import('../dist/canvas/index.js')

        const { style, writes } = makeStyle({ height: `${heightCss}px` })
        const canvas = makeCanvas({ width: widthAttr, height: 150, style })
        const ratio0 = widthAttr / 150

        mountEffect(canvas, { frame: () => {} })
        env.resize({ width: heightCss * ratio0, height: heightCss }) // mount

        const passes = driveToFixedPoint(env, canvas)

        assert.ok(
          passes <= 3,
          `intrinsic width ${widthAttr}, CSS height ${heightCss}, dpr ${dpr}: expected to converge within 3 passes, took ${passes}`
        )
        assert.equal(
          writes.length,
          0,
          `intrinsic width ${widthAttr}, CSS height ${heightCss}, dpr ${dpr}: expected never pinned`
        )
        assert.ok(
          Math.abs(canvas.clientWidth - canvas.clientHeight * ratio0) < 1,
          `intrinsic width ${widthAttr}, CSS height ${heightCss}, dpr ${dpr}: final clientWidth ${canvas.clientWidth} not within 1px of clientHeight ${canvas.clientHeight} * ratio0 ${ratio0}`
        )
      }
    }
  }
})

test('canvas harness: a max-width:100% canvas not binding at mount is pinned on width only, then keeps the ratio through a container shrink (ADU-107, ninth pass, verifier finding 2)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1
  const { mountEffect } = await import('../dist/canvas/index.js')

  // max-width:100% against a wide container: not binding at mount, so this
  // canvas behaves like a fully unsized one on width for now (nothing else
  // constrains it) and correctly gets pinned. The eighth-pass design pinned
  // BOTH style.width and style.height together at that moment; a later
  // container shrink that re-engaged the cap left height frozen at the old
  // pinned number, distorting a 150x150 box instead of scaling it to
  // 150x75 (the verifier's finding 2, reproduced in Chrome). The ninth-pass
  // design pins width only, so height stays free to keep deriving from the
  // (possibly capped) width through the intrinsic ratio.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 1000 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 300, height: 150 }) // cap not binding: unsized on width
  assert.equal(canvas.style.width, '300px') // pinned at the uncapped intrinsic width
  assert.equal(canvas.style.height, undefined) // height never pinned
  assert.equal(canvas.width, 300)
  assert.equal(canvas.height, 150)

  // The container shrinks: max-width now binds on the pinned 300px width.
  canvas.maxWidth = 150
  env.resize({ width: 150, height: 75 }) // the real, ratio-preserving box
  assert.equal(canvas.style.width, '300px') // still the same pin, never rewritten
  assert.equal(canvas.width, 150) // follows the cap correctly
  assert.equal(canvas.height, 75) // 2:1 ratio kept, not the old, distorted 150x150
  assert.deepEqual(sizes.at(-1), { w: 150, h: 75 })
})

test('canvas harness: a bare max-width:400px canvas is pinned at its uncapped intrinsic width, never inflated past the cap (ADU-107, ninth pass, verifier finding 3)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // <canvas width="300" height="150" style="max-width: 400px">: no CSS
  // width or height at all, only a cap that does not bind on the true
  // 300x150 intrinsic size. At dpr 2 the backing-store write inflates the
  // intrinsic size to 600x300, which DOES exceed the cap: the eighth-pass
  // probe read the harness's own just-written 600 straight through the cap
  // (400) and never detected a follow at all, so this canvas settled
  // rendered at an inflated 400x200 and was never pinned (the verifier's
  // finding 3, reproduced in Chrome). Doubling alone (tenth pass) cannot
  // catch this either: 1200 and 600 both clamp to 400, identical readings.
  // Halving still trips the cap here (the RESTORED reading, 600, clamps to
  // 400; the HALVED reading, 300, is still under the cap): 600 and 300 are
  // both even, so this halving is exact, and the tenth pass's probe tries
  // it as a second, safe check whenever doubling alone shows no follow (see
  // the module doc), catching this case and pinning the true, uncapped CSS
  // width of 300, not 400.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 400 })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 300, height: 150 }) // cap not binding yet: true intrinsic size
  assert.equal(canvas.style.width, '300px') // pinned at 300, not the capped 400
  assert.equal(canvas.style.height, undefined)
  assert.equal(canvas.width, 600) // 300 CSS px * dpr 2, correctly dpr-scaled
  assert.equal(canvas.height, 300)
  assert.equal(canvas.clientWidth, 300) // the rendered CSS box: never 400

  env.resize({ width: 300, height: 150 }) // stable: same CSS box measured again
  assert.equal(canvas.width, 600) // would have doubled to 1200 without the fix
  assert.equal(canvas.height, 300)
  assert.equal(canvas.clientWidth, 300)
})

test('canvas harness: a bare max-width:400px canvas (cap above the natural size) pins at 300, at dpr 1.2, 1.5, 1.7, 1.9 and 2 (ADU-107, eleventh pass)', async () => {
  // Same shape as the dpr-2-only test above, swept across the
  // parity-mismatch DPRs the eleventh-pass verifier named plus 2: a cap
  // ABOVE the natural size is genuinely unsized until a DPR inflates the
  // just-written attribute past it, and the anchor design pins it at the
  // true, uncapped anchor (300) with `aspect-ratio` set, at every one of
  // these DPRs.
  for (const dpr of [1.2, 1.5, 1.7, 1.9, 2]) {
    const env = makeEnv()
    global.window.devicePixelRatio = dpr
    const { mountEffect } = await import('../dist/canvas/index.js')

    const { style } = makeStyle()
    const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 400 })

    mountEffect(canvas, { frame: () => {} })

    env.resize({ width: 300, height: 150 })
    assert.equal(canvas.style.width, '300px', `dpr ${dpr}: pinned at 300`)
    assert.equal(canvas.style.aspectRatio, '300 / 150', `dpr ${dpr}: aspect-ratio set`)
    assert.equal(canvas.width, Math.round(300 * dpr), `dpr ${dpr}: backing width`)
    assert.equal(canvas.height, Math.round(150 * dpr), `dpr ${dpr}: backing height`)

    env.resize({ width: 300, height: 150 }) // stable
    assert.equal(canvas.width, Math.round(300 * dpr), `dpr ${dpr}: stable backing width`)
    assert.equal(canvas.height, Math.round(150 * dpr), `dpr ${dpr}: stable backing height`)
  }
})

test('canvas harness: a max-width:100px canvas whose cap binds already at its natural size renders crisp at the cap and is never pinned (ADU-107, tenth pass, verifier finding 2, cap semantics)', async () => {
  // <canvas width="300" height="150" style="max-width: 100px">: the cap
  // (100) is BELOW the natural, uncapped intrinsic size (300), the opposite
  // of the bare max-width:400px case above (cap 400 is ABOVE the natural
  // 300). Here the cap already binds before the harness ever runs: the
  // measured CSS box is 100x50 (2:1 ratio) from the very first entry, never
  // the uncapped 300x150. At dpr 2, the just-written backing store (200)
  // stays above the cap whichever way the probe perturbs it (halved to 100,
  // still not below the cap; doubled to 400, further above it), so neither
  // reading differs from the restored one: this canvas is CSS-sized in
  // every sense that matters, correctly never pinned. Its backing store is
  // the cap scaled by dpr, exactly what a crisp canvas of that size needs,
  // not an inflation the harness ever has to correct. This holds for any
  // dpr ABOVE 1 (the just-written attribute only grows further past the
  // cap, never below it); AT OR BELOW dpr 1 the shrinking probe can itself
  // cross below the cap, a separate case covered next.
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style, writes } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 100 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 100, height: 50 }) // the cap already binding: the true rendered box
  assert.equal(writes.length, 0) // never pinned
  assert.equal(canvas.width, 200) // 100 CSS px * dpr 2, the crisp backing store for the cap
  assert.equal(canvas.height, 100)
  assert.deepEqual(sizes.at(-1), { w: 100, h: 50 })

  env.resize({ width: 100, height: 50 }) // stable: the cap keeps binding, never inflated
  assert.equal(writes.length, 0)
  assert.equal(canvas.width, 200)
  assert.equal(canvas.height, 100)
})

test('canvas harness: a max-width:100px canvas whose cap binds already at its natural size is NEVER pinned at dpr 1 and above, including the parity-mismatch range 1.2 to 1.9 (eleventh pass)', async () => {
  // The mount-time probe perturbs `w0`/`h0`, the canvas's ORIGINAL,
  // never-yet-scaled attributes (300x150 here), before this harness ever
  // writes to them: doubling or halving THOSE can never cross a cap that
  // is already binding at the natural size, at any DPR, so it alone would
  // never pin this canvas. At dpr 1 and above, `round(cap * dpr) >= cap`
  // always, so this harness's own write never drops the attribute below
  // the cap either, and the escape check below (which DOES watch the
  // actual write, see the next test) finds nothing to catch: never
  // pinned, including the parity-mismatch range (1.2 to 1.9) where the
  // tenth pass's post-write probe timing could write an inflated store a
  // second pass then wrongly probed against (CHANGELOG.md, tenth pass).
  for (const dpr of [1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2]) {
    const env = makeEnv()
    global.window.devicePixelRatio = dpr
    const { mountEffect } = await import('../dist/canvas/index.js')

    const { style, writes } = makeStyle()
    const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 100 })

    mountEffect(canvas, { frame: () => {} })

    env.resize({ width: 100, height: 50 })
    assert.equal(writes.length, 0, `dpr ${dpr}: never pinned`)
    assert.equal(canvas.width, Math.round(100 * dpr), `dpr ${dpr}: backing width`)
    assert.equal(canvas.height, Math.round(50 * dpr), `dpr ${dpr}: backing height`)

    env.resize({ width: 100, height: 50 }) // stable: the cap keeps binding
    assert.equal(writes.length, 0, `dpr ${dpr}: still never pinned`)
    assert.equal(canvas.width, Math.round(100 * dpr))
    assert.equal(canvas.height, Math.round(50 * dpr))
  }
})

test('canvas harness: the same max-width:100px canvas IS pinned below dpr 1, where this harness\'s own write would otherwise drop the attribute below the cap and unclamp it (twelfth pass, escape check kept)', async () => {
  // Below dpr 1, `round(cap * dpr) < cap`: this harness's OWN candidate
  // write (80 at dpr 0.8) would itself become an intrinsic width BELOW
  // the cap, unclamping it for real (left unpinned, the very next pass
  // would measure that smaller, unclamped size and shrink further every
  // pass, the exact unbounded feedback loop this module exists to stop).
  // The mount-time probe (on `w0`/`h0`, never a DPR-scaled value) cannot
  // see this coming, on purpose (see the module doc): a SEPARATE escape
  // check, right after computing this pass's own candidate write, reuses
  // the same causal growth check against THAT candidate instead, and
  // catches it. Unlike the eleventh pass, the pin it applies is `w0`
  // (300), never the cap's own rendered size (100): CSS still clamps the
  // box to the cap right now, but a later cap change is free to move it,
  // the whole point of the twelfth pass (see the module doc, finding 1).
  for (const dpr of [0.5, 0.8]) {
    const env = makeEnv()
    global.window.devicePixelRatio = dpr
    const { mountEffect } = await import('../dist/canvas/index.js')

    const { style } = makeStyle()
    const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 100 })

    mountEffect(canvas, { frame: () => {} })

    env.resize({ width: 100, height: 50 })
    assert.equal(canvas.style.width, '300px', `dpr ${dpr}: pinned at w0, not the cap's rendered size`)
    assert.equal(canvas.width, Math.round(100 * dpr), `dpr ${dpr}: still the crisp backing store`)
    assert.equal(canvas.height, Math.round(50 * dpr))

    env.resize({ width: 100, height: 50 }) // stable: pinned, never shrinks further
    assert.equal(canvas.width, Math.round(100 * dpr))
    assert.equal(canvas.height, Math.round(50 * dpr))
  }
})

test('canvas harness: the same max-width canvas follows a later cap change from 50 to 100 (eleventh pass)', async () => {
  // Probing against `w0`/`h0` (the ORIGINAL attributes) rather than this
  // harness's own last write also fixes a second risk: probing the
  // EVOLVING backing store could itself read a stale cap relationship and
  // wrongly pin once the cap later changes past what that store's own
  // doubling would reveal. Anchored to `w0`/`h0`, which never change, the
  // cap is compared against the SAME 300x150 pair every time.
  //
  // Both caps here (50, then 100) stay at or below HALF the natural
  // attribute width (150): the shrinking half of the probe halves `w0`
  // itself (150) to reveal a cap already binding on the natural size, and
  // that halved reading only stays capped, and so correctly unpinned, when
  // the cap does not itself exceed it. A cap strictly between half the
  // natural size and the natural size itself (e.g. 200 here) is a
  // documented limitation the halving probe cannot distinguish from a
  // widened, no-longer-binding cap; out of scope for this pass.
  const env = makeEnv()
  global.window.devicePixelRatio = 1.5
  const { mountEffect } = await import('../dist/canvas/index.js')

  const { style, writes } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style, maxWidth: 50 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 50, height: 25 })
  assert.equal(writes.length, 0)
  assert.equal(canvas.width, 75) // 50 CSS px * dpr 1.5
  assert.equal(canvas.height, 38) // round(25 * 1.5)

  canvas.maxWidth = 100 // the cap widens (e.g. the container grows), still under natural
  env.resize({ width: 100, height: 50 })
  assert.equal(writes.length, 0) // still never pinned: the cap itself governs
  assert.equal(canvas.width, 150) // 100 CSS px * dpr 1.5
  assert.equal(canvas.height, 75)
  assert.deepEqual(sizes.at(-1), { w: 100, h: 50 })
})

test('canvas harness: a 1x1 unsized canvas is still pinned, doubling has no rounding floor to skip under (tenth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1
  const { mountEffect } = await import('../dist/canvas/index.js')

  // A 1x1 unsized canvas: the ninth pass's halving-only probe needed a
  // W >= 2 floor (Math.floor(1 / 2) collapses to 0, a degenerate write) and
  // skipped this size entirely, never pinning it. Doubling has no such
  // floor: 2 * 1 = 2 is always a valid, distinguishable write, so this
  // canvas is now correctly detected as unsized and pinned like any other.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 1, height: 1, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize()
  assert.equal(canvas.style.width, '1px')
  assert.equal(canvas.width, 1)
  assert.equal(canvas.height, 1)
})

test('canvas harness: a giant unsized canvas with even attributes falls back to an exact halving probe instead of risking the browser canvas-size limit (tenth pass, giant-canvas guard)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 8000x4000: doubling would write 16000x8000, past the 8192 guard, so the
  // probe falls back to halving; both attributes are even, so that halving
  // is exact (no Math.floor residue) and still safely detects this
  // genuinely unsized canvas.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 8000, height: 4000, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 8000, height: 4000 })
  assert.equal(canvas.style.width, '8000px')
  assert.equal(canvas.width, 8000)
  assert.equal(canvas.height, 4000)
})

test('canvas harness: a giant unsized canvas with an odd attribute has no safe direction to probe in and is never pinned (documented limitation, tenth pass, giant-canvas guard)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 8001x4000: doubling would exceed the 8192 guard (16002), and halving is
  // unsafe (8001 is odd, Math.floor(8001 / 2) would reintroduce finding 1's
  // rounding bug), so there is no safe direction to probe in at all: this
  // canvas is treated as already sized and never pinned, same documented
  // trade-off as a canvas with no CSS size on either axis.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 8001, height: 4000, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 8001, height: 4000 })
  assert.equal(canvas.style.width, undefined)
  assert.equal(canvas.width, 8001)
  assert.equal(canvas.height, 4000)
})
