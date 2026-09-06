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
  }

  return {
    canvas,
    // A real ResizeObserver hands its callback the entry it observed;
    // `contentRect` (below) exercises applySize()'s preferred, bit-exact
    // read of it. Called with nothing, this stub matches the harness's
    // other two call sites (onDprChange, and applySize()'s own internal
    // re-measure), neither of which has an entry either.
    resize: (contentRect) => roCallback(contentRect ? [{ contentRect }] : []),
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
// harness pins it) plus `padding` plus `border` is what getBoundingClientRect
// reports (a real border-box rect), whatever the canvas's own box-sizing
// says: box-sizing only changes what a specified CSS `width` means, never
// what the rendered border box measures.
// A real layout engine snaps subpixel sizes to a fixed-precision grid; raw
// IEEE-754 addition does not (0.3 + 0.3 - 0.6 !== 0 in binary floating
// point), which would inject arithmetic noise this stub has no business
// producing. Round to 9 decimal places, well past any pixel value this
// harness cares about, so fractional-padding fixtures stay exact.
const round9 = (n) => Math.round(n * 1e9) / 1e9

function makeCanvas({ width, height, style, border = 0, padding = 0, scale = 1, residual = 0 }) {
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
      // split evenly: getBoundingClientRect() below adds the combined
      // `border` once per axis, so left+right (and top+bottom) must sum
      // back to it for measureLayout()'s subtraction to recover the
      // content box.
      borderLeftWidth: `${border / 2}px`,
      borderRightWidth: `${border / 2}px`,
      borderTopWidth: `${border / 2}px`,
      borderBottomWidth: `${border / 2}px`,
    },
    getContext: () => ({ setTransform: () => {} }),
    getBoundingClientRect() {
      const contentW = this.style.width ? parseFloat(this.style.width) : this.width
      const contentH = this.style.height ? parseFloat(this.style.height) : this.height
      // `scale` simulates a CSS `transform: scale()`: it inflates what
      // getBoundingClientRect() reports without moving layout or touching
      // computed border/padding, the same way a real ResizeObserver entry's
      // contentRect (fed straight to env.resize() by a test, not derived
      // here) stays unaffected. `residual` simulates the sub-pixel snap a
      // real layout engine applies that this stub's plain arithmetic does
      // not (see the fourth-pass test above): both default to a no-op so
      // every earlier test keeps its exact numbers.
      return {
        width: round9((contentW + pad.left + pad.right + border) * scale - residual),
        height: round9((contentH + pad.top + pad.bottom + border) * scale - residual),
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

  // border:4px, padding:6px, box-sizing:border-box. getBoundingClientRect
  // reports the border box regardless of box-sizing (box-sizing only
  // changes what a specified CSS `width` means, never what the rendered
  // box measures), so subtracting both computed border and padding
  // recovers the true 300 content box. Forcing box-sizing:content-box on
  // the pin is what stops the author's own border-box declaration from
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

test('canvas harness: an unsized canvas with fractional padding settles in one pass at the exact content size, via the getBoundingClientRect fallback (ADU-107, fourth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // padding: 0.3px, common from a percentage or calc() padding, or a
  // non-100% zoom. clientWidth rounds to an integer before computed
  // padding (subpixel-precise) is subtracted, so the old measureLayout()
  // landed a fraction of a pixel off the true 300x150 content box on its
  // first read, needing a second applySize() pass to notice and correct.
  // getBoundingClientRect() is subpixel-precise like the padding it is
  // read alongside, so the same subtraction lands exactly on 300x150 in
  // one env.resize(). This stub has no real layout engine to snap sizes
  // to a sub-pixel grid, so it cannot reproduce the residual mismatch a
  // real browser has between this fallback and a ResizeObserver entry's
  // own contentRect (see the next test): this one only proves the
  // arithmetic itself is exact when the two subpixel-precise reads agree.
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

test('canvas harness: applySize() prefers the ResizeObserver entry\'s own contentRect over getBoundingClientRect (ADU-107, fourth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // A real ResizeObserver entry's contentRect is the layout engine's own
  // content-box measurement, bit-exact: no border/padding subtraction, so
  // no residual mismatch between an authored computed-style value and the
  // sub-pixel value layout actually used (the real-Chrome finding behind
  // the previous test). Feeding applySize() an entry whose contentRect
  // (111x222) disagrees with what getBoundingClientRect()/computed style
  // on this same canvas would derive (300x150, padding 0) proves the
  // entry wins: if the harness fell back to the rect it would pin 300x150
  // instead.
  const { style } = makeStyle()
  const canvas = makeCanvas({ width: 300, height: 150, style })

  mountEffect(canvas, { frame: () => {} })

  env.resize({ width: 111, height: 222 })
  assert.equal(canvas.style.width, '111px')
  assert.equal(canvas.style.height, '222px')
  assert.equal(canvas.width, 222) // 111 CSS px * dpr 2, not 600 (300 * 2)
  assert.equal(canvas.height, 444)
})

test('canvas harness: a CSS-sized canvas with fractional padding is never pinned, even against a bit-exact entry (ADU-107, fifth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized (style width/height authored below), padding: 0.3px. A real
  // ResizeObserver entry's contentRect is the layout engine's bit-exact
  // content box (300x150, fed to env.resize below); getBoundingClientRect()
  // minus computed padding, what the feedback-loop check now reads, lands a
  // sub-pixel residual off that same value in a real browser (measured in
  // Chrome: 299.99375, not 300, see the module doc and `residual` above).
  // The old check compared the entry (exact) against that fallback
  // residual and read the mismatch as the canvas having moved, pinning a
  // canvas that never did and then ignoring every later CSS resize.
  const { style, state, writes } = makeStyle({ width: '300px', height: '150px' })
  const canvas = makeCanvas({ width: 300, height: 150, style, padding: 0.3, residual: 0.00625 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 300, height: 150 }) // entry: bit-exact
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

test('canvas harness: a CSS-sized canvas under transform: scale() is never pinned, even though its rect is inflated (ADU-107, fifth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 2
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized (style width/height authored below), transform: scale(1.3).
  // A real ResizeObserver entry's contentRect ignores transform (it is
  // layout size, not rendered size): fed here as the true 200x100. But
  // getBoundingClientRect(), what the feedback-loop check reads, is scaled
  // by the transform (260x130), same as a real browser. The old check
  // compared the entry (200) against that inflated fallback (260) and read
  // the mismatch as the canvas having moved.
  const { style, state, writes } = makeStyle({ width: '200px', height: '100px' })
  const canvas = makeCanvas({ width: 200, height: 100, style, scale: 1.3 })

  const sizes = []
  mountEffect(canvas, { frame: () => {}, resize: (fx) => sizes.push({ w: fx.width, h: fx.height }) })

  env.resize({ width: 200, height: 100 }) // entry: unaffected by transform
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

test('canvas harness: a display:none canvas with padding returns early instead of writing a negative backing store (ADU-107, fifth pass)', async () => {
  const env = makeEnv()
  const { mountEffect } = await import('../dist/canvas/index.js')

  // display:none: getBoundingClientRect() reports an all-zero rect.
  // Padding is still authored (10px combined per axis), so the raw
  // subtraction rect.width - padding goes negative (-10), which the old
  // `!before.width` guard did not catch: a negative number is truthy in
  // JS, so it fell through and rounded a negative size through dpr into
  // canvas.width/height. Clamping the fallback to 0 restores the "not
  // laid out yet" read the guard already handles for a genuinely empty
  // rect.
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

  env.resize()
  assert.equal(canvas.width, 0) // never written, not a negative value
  assert.equal(canvas.height, 0)
  assert.equal(env.pending(), 0) // never started: setup()/frame() never ran
})

test('canvas harness: a small unsized canvas is pinned on the very first pass at a fractional DPR (ADU-107, sixth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.25
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 4x4, dpr 1.25: the feedback loop moves this canvas by size * (dpr - 1)
  // = 1 CSS pixel on this very first tick. The old flat 1px tolerance
  // needed the gap to grow PAST a pixel (`> 1`), so an exact 1px move took
  // many ticks to accumulate past it, pinning 50-100% inflated first; the
  // ratio check (after / before >= 1 + (dpr - 1) / 2) catches it
  // immediately, whatever the canvas's size.
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

test('canvas harness: a small unsized canvas is pinned on the very first pass at a barely-fractional DPR (ADU-107, sixth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.05
  const { mountEffect } = await import('../dist/canvas/index.js')

  // 20x20, dpr 1.05: also moves by size * (dpr - 1) = 1 CSS pixel, same
  // edge case as the 4x4/1.25 test above at a different size and DPR, to
  // prove the ratio scales with both instead of hard-coding one pair.
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

test('canvas harness: a small CSS-sized canvas with fractional padding is never pinned at a fractional DPR (ADU-107, sixth pass)', async () => {
  const env = makeEnv()
  global.window.devicePixelRatio = 1.25
  const { mountEffect } = await import('../dist/canvas/index.js')

  // CSS-sized (style authored), padding: 0.3px, at the same small size and
  // fractional DPR as the unsized case above: the ratio check has to tell
  // the two apart at this scale too, not just at dpr 2 on a 300px canvas.
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

test("canvas harness: onDprChange() reuses the last ResizeObserver-measured content size instead of a transform-inflated rect (ADU-107, sixth pass)", async () => {
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
