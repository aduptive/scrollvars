import assert from 'node:assert/strict'
import { test } from 'node:test'

// MutationObserver is from 2012 (Chrome 18, Firefox 14, Safari 6) and
// ResizeObserver from 2018 (Chrome 64, Firefox 69, Safari 13.1): every engine
// that has the ResizeObserver these fixtures install everywhere has had this
// one for six years. Installing it in a single test left the re-render resync
// in src/core/slider.ts (a childList record re-observes the slides and
// re-measures) switched off for the whole rest of the file, a state no engine
// is in (ADU-161). One observer for the file, delivering only when a fixture
// actually replaces a child, the way a real one does.
const mutationObservers = []
global.MutationObserver = class {
  constructor(cb) {
    this.cb = cb
    this.targets = new Set()
    mutationObservers.push(this)
  }
  observe(target, options) {
    this.targets.add(target)
    this.options = options
  }
  disconnect() {
    this.targets.clear()
  }
}

// Deliver a childList record for `target`, what a real observer does after a
// re-render swaps a slide node. Returns how many live observers took it, so a
// test can prove the slider really is watching that container.
function fireChildList(target) {
  let delivered = 0
  for (const mo of mutationObservers) {
    if (!mo.targets.has(target)) continue
    delivered++
    mo.cb([{ type: 'childList', target }], mo)
  }
  return delivered
}

// A real ResizeObserver delivers ONCE right after observe(), with the
// element's current size, and src/core/slider.ts is written against that: its
// callback is schedule(), so the mount-time frame comes from that first
// delivery, not from anything the page does. A stub that records the element
// and delivers nothing left that path untested in all 18 fixtures below
// (ADU-177).
//
// The delivery is a frame, not a microtask: a real one runs in the rendering
// step of the next frame, and these fixtures drive their own rAF queue as
// their only clock, so a microtask would land after the whole test body ran.
// Chrome runs a frame's rAF callbacks before that frame's ResizeObserver
// step; queueing the delivery on the same rAF queue keeps that order for
// every fixture here (the delivery is the first thing queued at mount, and
// the measure it schedules lands behind it). Entries are batched into one
// callback per frame, and disconnect() drops the ones still pending, both the
// way the spec has it.
class ResizeObserverStub {
  constructor(cb) {
    this.cb = cb
    this.pending = []
    this.frame = 0
  }
  observe(target) {
    this.pending = this.pending.filter((entry) => entry.target !== target)
    this.pending.push({
      target,
      // contentRect is a LAYOUT box: clientWidth/clientHeight, never a rect
      contentRect: { width: target.clientWidth ?? 0, height: target.clientHeight ?? 0 },
    })
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0
        const entries = this.pending
        this.pending = []
        if (entries.length) this.cb(entries, this)
      })
  }
  unobserve(target) {
    this.pending = this.pending.filter((entry) => entry.target !== target)
  }
  disconnect() {
    this.pending = []
    // cancel the queued delivery, not just forget it: leaving `frame` set
    // with nothing left in the real queue to reset it would make every
    // observe() after this one believe a delivery is still pending and
    // never schedule another
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
  }
}

// Runs every frame callback queued as of now, and the ones those queue in
// turn: the mount-time ResizeObserver delivery lands on the first frame after
// slider() returns, and the measure() it schedules on the one behind it.
// Fixtures that already pump their own queue (pumpSlider below) get this for
// free; the ones that never pumped call this once, so the mount frame a real
// browser always runs is not skipped.
const runFrames = (rafQueue) => {
  while (rafQueue.length) rafQueue.shift()(0)
}

// Geometry stubs: 3 slides of 100px in a 300px container, gapless.
function makeSlide(offsetLeft) {
  return {
    offsetLeft,
    offsetWidth: 100,
    // rect geometry derived from the same numbers; _c is bound by the container's
    // children getter. RTL content is right-aligned: its left edge sits at
    // -(scrollWidth - clientWidth), and a negative scrollLeft shifts it right.
    getBoundingClientRect() {
      const c = this._c
      const left = c.__rtl
        ? this.offsetLeft - (c.scrollWidth - c.clientWidth) - c.scrollLeft
        : this.offsetLeft - c.scrollLeft
      return { left, right: left + this.offsetWidth, top: 0, bottom: 100, width: this.offsetWidth, height: 100 }
    },
    vars: {},
    classes: new Set(),
    style: {
      setProperty(k, v) {
        this._owner.vars[k] = v
      },
    },
    classList: {
      toggle(name, on) {
        on ? this._owner.classes.add(name) : this._owner.classes.delete(name)
      },
    },
  }
}

test('slider: --sd per slide, active detection, goTo centering math', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })

  const scrolls = []
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    getBoundingClientRect() {
      return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 }
    },
    scrollLeft: 0,
    clientWidth: 300,
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {
      setProperty(k, v) {
        container.vars[k] = v
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: (o) => scrolls.push(o),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  }

  const { slider } = await import('../dist/core/slider.js')
  const onSlideCalls = []
  const handle = slider(container, { duration: 0, onSlide: (i) => onSlideCalls.push(i) })

  // initial measure runs synchronously: center=150 → slide 2 (mid=150) active
  assert.equal(handle.active(), 1)
  assert.deepEqual(onSlideCalls, [1])
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  assert.equal(slides[2].vars['--sd'], '1.0000')
  assert.ok(slides[1].classes.has('sv-active'))
  assert.ok(!slides[0].classes.has('sv-active'))

  // one frame later the ResizeObserver's first delivery re-measures: every
  // command below runs against that state, the one a real page is ever in
  runFrames(rafQueue)
  assert.equal(handle.active(), 1, 'the mount frame re-measures to the same place')
  assert.deepEqual(onSlideCalls, [1], 'and does not re-fire onSlide')

  // next(): centers slide 3 → left = 200 - (300-100)/2 = 100
  // (duration: 0 → the glide short-circuits to a direct position write)
  handle.next()
  assert.equal(container.scrollLeft, 100)

  // goTo clamps
  container.scrollLeft = 0
  handle.goTo(99, false)
  assert.equal(container.scrollLeft, 100)

  // state(): full snapshot
  const st = handle.state()
  assert.equal(st.count, 3)
  assert.equal(st.dragging, false)
  assert.equal(st.gliding, false)

  handle.destroy()
})

test('slider: rapid next() clicks accumulate through the pending target', async () => {
  const rafQueue = []
  let now = 0
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.performance = { now: () => now }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    getBoundingClientRect() {
      return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 }
    },
    scrollLeft: 0,
    clientWidth: 300,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { scrollSnapType: '', setProperty: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  }

  const { slider } = await import('../dist/core/slider.js')
  const handle = slider(container, { duration: 100 })
  // the mount frame first: this fixture's cancelAnimationFrame drops the whole
  // queue, so a glide started before it would swallow the observer's delivery
  runFrames(rafQueue)

  // active starts at 1 (center). Two rapid clicks: 1 → 2 → clamped 2,
  // but the second must count from the PENDING target, not stale active.
  handle.next()
  handle.next() // mid-glide: steps from target (2), clamps at last slide
  // pump the glide to completion
  for (let i = 0; i < 30 && rafQueue.length; i++) {
    now += 16
    rafQueue.shift()(now)
  }
  // slide 3 centered: left = 200 - (300-100)/2 = 100
  assert.equal(Math.round(container.scrollLeft), 100)
  handle.destroy()
})

test('slider: RTL normalizes to logical coordinates', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  // a queue, not `() => 1`: a rAF stub that throws its callback away also
  // throws away the ResizeObserver's first delivery, so the mount frame that
  // every real browser runs could never happen here
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  // direction: rtl — slides laid out right-to-left; raw scrollLeft is 0..-range.
  // offsetLeft values measured in real Chrome (container position:relative,
  // so offsetParent = container): 200, 100, 0, -100, -200 for a 300px client
  // box holding 5 slides of 100px (scrollWidth 500).
  global.getComputedStyle = () => ({ direction: 'rtl' })

  const slides = [makeSlide(200), makeSlide(100), makeSlide(0), makeSlide(-100), makeSlide(-200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    getBoundingClientRect() {
      return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 }
    },
    scrollLeft: 0,
    clientWidth: 300,
    scrollWidth: 500,
    __rtl: true,
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {
      setProperty(k, v) {
        container.vars[k] = v
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }

  const { slider } = await import('../dist/core/slider.js')
  const handle = slider(container, { duration: 0 })
  runFrames(rafQueue) // the mount-time observer delivery re-measures

  // at raw 0 (start, rightmost) logical pos is 0 → progress 0; the slide
  // nearest the 300px viewport's center is index 1, same as the LTR case
  assert.equal(handle.state().progress, 0)
  assert.equal(handle.active(), 1)

  // the mirrored starts are 0, 100, 200, 300, 400: --sd confirms every one
  // of them (size 100, center 150 at rest)
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.equal(slides[2].vars['--sd'], '1.0000')
  assert.equal(slides[3].vars['--sd'], '2.0000')
  assert.equal(slides[4].vars['--sd'], '3.0000')

  // goTo the last slide: its logical start is 500-0-100=400 → centered target
  // logical 300 → raw scrollLeft must be -300 (spec RTL negative domain)
  handle.goTo(4, false)
  assert.equal(container.scrollLeft, -300)

  // seek(1) lands on the logical end, raw -range
  handle.seek(1)
  assert.equal(container.scrollLeft, -200)

  handle.destroy()
  delete global.getComputedStyle
})

test('slider: mouse drag kills native text-selection at pointerdown, and restores focus on a plain click', async () => {
  const rafQueue = []
  // a real queue, so the ResizeObserver's first delivery has a frame to land
  // on (see the RTL fixture above)
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getSelection = () => ({ removeAllRanges: () => {} })
  global.matchMedia = undefined

  const winHandlers = {}
  global.window = {
    addEventListener: (type, fn) => (winHandlers[type] = fn),
    removeEventListener: (type, fn) => {
      if (winHandlers[type] === fn) delete winHandlers[type]
    },
  }

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })

  const containerHandlers = {}
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    getBoundingClientRect() {
      return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 }
    },
    scrollLeft: 0,
    clientWidth: 300,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { scrollSnapType: '', setProperty: () => {} },
    addEventListener: (type, fn) => (containerHandlers[type] = fn),
    removeEventListener: () => {},
    scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js')
  const handle = slider(container, { duration: 0 })
  runFrames(rafQueue) // the mount-time observer delivery re-measures

  // --- a plain click: pointerdown, no movement, pointerup ---
  let prevented = false
  const focusSpy = { focused: false, focus: () => (focusSpy.focused = true) }
  const linkTarget = { closest: (sel) => (sel.includes('a[href]') ? focusSpy : null) }
  containerHandlers.pointerdown({
    pointerType: 'mouse',
    clientX: 50,
    target: linkTarget,
    preventDefault: () => (prevented = true),
  })
  assert.ok(prevented, 'pointerdown on mouse must preventDefault (kills native selection-drag)')
  assert.ok(winHandlers.pointermove, 'drag tracking armed on window')
  winHandlers.pointerup() // released before crossing the drag threshold
  assert.ok(focusSpy.focused, 'a genuine click restores focus that preventDefault suppressed')

  // --- a real drag: pointerdown, move past threshold, release ---
  let prevented2 = false
  containerHandlers.pointerdown({
    pointerType: 'mouse',
    clientX: 50,
    target: { closest: () => null },
    preventDefault: () => (prevented2 = true),
  })
  assert.ok(prevented2)
  winHandlers.pointermove({ clientX: 80 }) // 30px > 5px threshold: now dragging
  const before = container.scrollLeft
  winHandlers.pointermove({ clientX: 70 })
  assert.notEqual(container.scrollLeft, before, 'a real drag moves scrollLeft')
  winHandlers.pointerup()

  handle.destroy()
})

test('slider: goTo(i, false) after seek() restores the authored snap; position clamps at the last slide', async () => {
  const rafQueue = []
  const listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => { s.style._owner = s; s.classList._owner = s })
  const container = {
    get children() { slides.forEach((sl) => { sl._c = this; sl.offsetParent = this }); return slides },
    clientLeft: 0, clientTop: 0, scrollTop: 0, offsetLeft: 0, offsetTop: 0, offsetParent: null,
    getBoundingClientRect() { return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 } },
    scrollLeft: 0,
    clientWidth: 200,
    scrollWidth: 300,
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v }, scrollSnapType: 'x mandatory' },
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    scrollTo: () => {},
  }
  const { slider } = await import('../dist/core/slider.js?snap')
  const handle = slider(container, { duration: 0 })

  handle.seek(0.5) // the driver takes over: snap suspended
  assert.equal(container.style.scrollSnapType, 'none')
  handle.goTo(1, false) // manual jump: authored snap must come back
  assert.equal(container.style.scrollSnapType, 'x mandatory')

  // overscroll (rubber band): scrollLeft past the range makes the last slide's
  // signed distance negative; position must not exceed count - 1
  container.scrollLeft = 200
  listeners.scroll()
  while (rafQueue.length) rafQueue.shift()(0)
  assert.equal(handle.state().position, 2)
  assert.equal(handle.state().count, 3)
  handle.destroy()
})

// shared for the two geometry tests below: a container whose rect starts away
// from the viewport origin (the offsetParent case Codex flagged) and vertical slides
function makeSlideBox({ x = 0, y = 0, w = 100, h = 100 }) {
  return {
    offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h,
    vars: {}, classes: new Set(),
    style: { setProperty(k, v) { this._owner.vars[k] = v } },
    classList: { toggle(name, on) { on ? this._owner.classes.add(name) : this._owner.classes.delete(name) } },
    getBoundingClientRect() {
      const c = this._c
      const left = c.rect.left + c.clientLeft + this.offsetLeft - c.scrollLeft
      const top = c.rect.top + c.clientTop + this.offsetTop - c.scrollTop
      return { left, right: left + this.offsetWidth, top, bottom: top + this.offsetHeight, width: this.offsetWidth, height: this.offsetHeight }
    },
  }
}
function makeBox(slides, { rect, clientWidth, clientHeight, scrollWidth, scrollHeight, listeners, rafQueue }) {
  const c = {
    get children() { slides.forEach((s) => { s._c = c; s.offsetParent = c; s.style._owner = s; s.classList._owner = s }); return slides },
    rect, clientLeft: 0, clientTop: 0, scrollLeft: 0, scrollTop: 0,
    offsetLeft: rect.left, offsetTop: rect.top, offsetParent: null,
    clientWidth, clientHeight, scrollWidth, scrollHeight,
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    // '' like a real element with no inline scroll-snap-type: the snap
    // suspension writes here, so it doubles as the "did the wheel assist
    // run?" probe
    style: { scrollSnapType: '', setProperty(k, v) { c.vars[k] = v } },
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    scrollTo: () => {},
    getBoundingClientRect() { return { ...rect, right: rect.left + clientWidth + 4, bottom: rect.top + clientHeight + 4, width: clientWidth + 4, height: clientHeight + 4 } },
  }
  return c
}
const pumpSlider = (listeners, rafQueue) => { listeners.scroll(); while (rafQueue.length) rafQueue.shift()(0) }

test('slider: geometry is container-local even when the rail sits far from the viewport origin', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })
  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  // the rail is 250px from the left of a positioned ancestor and 900px down the page
  const c = makeBox(slides, { rect: { left: 250, top: 900 }, clientWidth: 300, clientHeight: 100, scrollWidth: 300, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?offset')
  const handle = slider(c, { duration: 0 })
  pumpSlider(listeners, rafQueue)
  // viewport center at 150 in rail coordinates: slide 1 (100..200) is active, --sd 0
  assert.equal(handle.active(), 1)
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  handle.destroy()
})

test('slider: vertical rail (axis y) measures with tops and scrollTop', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })
  const slides = [makeSlideBox({ y: 0, w: 300 }), makeSlideBox({ y: 100, w: 300 }), makeSlideBox({ y: 200, w: 300 }), makeSlideBox({ y: 300, w: 300 })]
  const c = makeBox(slides, { rect: { left: 40, top: 500 }, clientWidth: 300, clientHeight: 200, scrollWidth: 300, scrollHeight: 400, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?vertical')
  const handle = slider(c, { axis: 'y', duration: 0 })
  pumpSlider(listeners, rafQueue)
  // 200px viewport, center at 100: slides 0 and 1 tie, the first wins
  assert.equal(handle.active(), 0)
  c.scrollTop = 150 // center at 250: slide 2 (200..300) exactly
  pumpSlider(listeners, rafQueue)
  assert.equal(handle.active(), 2)
  assert.equal(slides[2].vars['--sd'], '0.0000')
  c.scrollTop = 200 // the end of the range (scrollHeight - clientHeight)
  pumpSlider(listeners, rafQueue)
  assert.equal(handle.state().progress, 1)
  handle.destroy()
})


test('slider: a transformed slide (coverflow scale/rotate) does not move its own measurement', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })
  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  // a coverflow transform would shift the painted rect of slide 1 by 40px; offsets are layout, not paint
  slides[1].getBoundingClientRect = () => ({ left: 140, right: 240, top: 0, bottom: 100, width: 100, height: 100 })
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 300, clientHeight: 100, scrollWidth: 300, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?transform')
  const handle = slider(c, { duration: 0 })
  pumpSlider(listeners, rafQueue)
  assert.equal(slides[1].vars['--sd'], '0.0000', 'the transformed rect is ignored: the slide is still exactly centered')
  assert.equal(handle.active(), 1)
  handle.destroy()
})

test('slider: native controls and non-primary buttons keep their gesture (no preventDefault)', async () => {
  const rafQueue = []
  const containerHandlers = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })
  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => { s.style._owner = s; s.classList._owner = s })
  const container = {
    get children() { slides.forEach((sl) => { sl._c = this; sl.offsetParent = this }); return slides },
    clientLeft: 0, clientTop: 0, scrollTop: 0, offsetLeft: 0, offsetTop: 0, offsetParent: null,
    getBoundingClientRect() { return { left: 0, right: 300, top: 0, bottom: 100, width: 300, height: 100 } },
    scrollLeft: 0, clientWidth: 300, scrollWidth: 300, vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v } },
    addEventListener: (t, fn) => (containerHandlers[t] = fn),
    removeEventListener: () => {},
    scrollTo: () => {},
  }
  const { slider } = await import('../dist/core/slider.js?native')
  const handle = slider(container, { duration: 0, drag: true })
  runFrames(rafQueue) // the mount-time observer delivery re-measures
  let prevented = 0
  const down = (extra) => containerHandlers.pointerdown({ pointerType: 'mouse', button: 0, clientX: 10, clientY: 10, target: { closest: () => null }, preventDefault: () => prevented++, ...extra })
  down({ target: { closest: (sel) => (sel.includes('input') ? {} : null) } }) // a range input inside a slide
  down({ button: 2 }) // right click
  assert.equal(prevented, 0, 'neither a native control nor a secondary button starts a drag')
  down({})
  assert.equal(prevented, 1, 'a primary-button press on plain content still kills native selection-drag')
  handle.destroy()
})

test('slider: a bordered positioned container (offsetParent = container) does not double-subtract its own border', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  // offsetLeft is already measured against the offsetParent's PADDING edge
  // (spec), so when the container itself is that offsetParent, its 10px
  // border must not be subtracted a second time: the first slide's start
  // stays 0, same as an unbordered container.
  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => { s.style._owner = s; s.classList._owner = s })
  const container = {
    get children() { slides.forEach((sl) => { sl._c = this; sl.offsetParent = this }); return slides },
    clientLeft: 10, clientTop: 0, scrollTop: 0, offsetLeft: 0, offsetTop: 0, offsetParent: null,
    getBoundingClientRect() { return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 } },
    scrollLeft: 0, clientWidth: 300, vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v } },
    addEventListener: () => {}, removeEventListener: () => {}, scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js?bordered-relative')
  const handle = slider(container, { duration: 0 })
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.equal(handle.active(), 1)
  // the observer's first delivery, one frame later: the same border must not
  // be subtracted on the re-measure either
  runFrames(rafQueue)
  assert.equal(slides[0].vars['--sd'], '-1.0000', 'the mount frame re-measures to the same place')
  handle.destroy()
})

test('slider: a statically positioned container falls back to absolute offsets when it is skipped as offsetParent', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  // container is static: neither it nor its slide is positioned, so both are
  // measured by the browser against the same real offsetParent (a stand-in
  // for body here) instead of against each other. offsetLeft 18 for the
  // slide, 8 for the container, clientLeft 10: local = 18 - 8 - 10 = 0.
  const stubParent = { offsetLeft: 0, offsetTop: 0, offsetParent: null }
  const slide = {
    offsetLeft: 18, offsetTop: 0, offsetWidth: 100, offsetHeight: 100, offsetParent: stubParent,
    vars: {},
    classes: new Set(),
    style: { setProperty(k, v) { this._owner.vars[k] = v } },
    classList: { toggle(name, on) { on ? this._owner.classes.add(name) : this._owner.classes.delete(name) } },
  }
  slide.style._owner = slide
  slide.classList._owner = slide
  const container = {
    children: [slide],
    clientLeft: 10, clientTop: 0, scrollTop: 0, offsetLeft: 8, offsetTop: 0, offsetParent: stubParent,
    getBoundingClientRect() { return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 } },
    scrollLeft: 0, clientWidth: 100, vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v } },
    addEventListener: () => {}, removeEventListener: () => {}, scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js?static-bordered')
  const handle = slider(container, { duration: 0 })
  assert.equal(slide.vars['--sd'], '0.0000')
  assert.equal(handle.active(), 0)
  // and again on the observer's first delivery one frame later
  runFrames(rafQueue)
  assert.equal(slide.vars['--sd'], '0.0000', 'the mount frame re-measures to the same place')
  handle.destroy()
})

test('slider: a replaced active slide node (same index, new element) carries sv-active without re-firing onSlide', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => { s.style._owner = s; s.classList._owner = s })
  const container = {
    get children() { slides.forEach((sl) => { sl._c = this; sl.offsetParent = this }); return slides },
    clientLeft: 0, clientTop: 0, scrollTop: 0, offsetLeft: 0, offsetTop: 0, offsetParent: null,
    getBoundingClientRect() { return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 } },
    scrollLeft: 0, clientWidth: 300, vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v } },
    addEventListener: () => {}, removeEventListener: () => {}, scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js?replace')
  const onSlideCalls = []
  const handle = slider(container, { duration: 0, onSlide: (i) => onSlideCalls.push(i) })
  assert.equal(handle.active(), 1)
  assert.deepEqual(onSlideCalls, [1])

  // swap the active element for a fresh node at the same offset/index: this
  // is what a framework re-render (key churn, innerHTML replace) does. The
  // MutationObserver path must move sv-active onto the new node, but the
  // active index itself never changed, so onSlide must not fire again.
  const replacement = makeSlide(100)
  replacement.style._owner = replacement
  replacement.classList._owner = replacement
  slides[1] = replacement

  assert.equal(fireChildList(container), 1, 'the slider observes the container for childList records')
  while (rafQueue.length) rafQueue.shift()(0)

  assert.ok(replacement.classes.has('sv-active'), 'the new node at the active index carries sv-active')
  assert.equal(container.vars['--sv-slide'], '1')
  assert.deepEqual(onSlideCalls, [1], 'the index did not change: onSlide must not fire again')
  handle.destroy()
  assert.equal(fireChildList(container), 0, 'destroy() disconnects the observer')
})

test('slider: snap none from a stylesheet (not inline) keeps the wheel assist off', async () => {
  const rafQueue = [], listeners = {}, control = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub

  const slidesA = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  const slidesB = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  const box = { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 300, scrollHeight: 100 }
  const styled = makeBox(slidesA, { ...box, listeners, rafQueue })
  const snapped = makeBox(slidesB, { ...box, listeners: control, rafQueue })
  // a stylesheet rule or a utility class (Tailwind's snap-none): the inline
  // style is empty on both, only the computed value tells them apart
  global.getComputedStyle = (el) => ({
    direction: 'ltr',
    scrollSnapType: el === styled ? 'none' : 'x mandatory',
  })

  const { slider } = await import('../dist/core/slider.js?computedsnap')
  const off = slider(styled, { duration: 0 })
  const on = slider(snapped, { duration: 0 })
  runFrames(rafQueue) // both mount-time observer deliveries, before the gesture
  const wheel = { deltaX: 40, deltaY: 0 }
  listeners.wheel(wheel)
  control.wheel(wheel)

  // the control proves the gesture reaches the handler in this harness at all
  assert.equal(snapped.style.scrollSnapType, 'none', 'a snapping instance does suspend on wheel')
  assert.equal(styled.style.scrollSnapType, '', 'authored none is left alone, whatever authored it')

  off.destroy()
  on.destroy()
})

test('slider: elastic overscroll never drives progress outside 0..1', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  // 100px viewport over 300px of content: the scrollable range is 200
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 300, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?overscroll')
  const handle = slider(c, { duration: 0 })

  c.scrollLeft = 260 // rubber band past the end
  pumpSlider(listeners, rafQueue)
  assert.equal(handle.state().progress, 1, 'past the end reads 1, not 1.3')
  assert.equal(c.vars['--sv-progress'], '1.0000')

  c.scrollLeft = -40 // rubber band past the start
  pumpSlider(listeners, rafQueue)
  assert.equal(handle.state().progress, 0, 'before the start reads 0, not -0.2')
  assert.equal(c.vars['--sv-progress'], '0.0000')

  handle.destroy()
})

test('slider: position never goes backwards across the gap between slides', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  // two 100px slides 16px apart: their centres sit 116px apart, not 100.
  // Normalizing the distance by ONE slide's own size read 0.580 just before
  // the midpoint and 0.430 just after it, walking the reported position
  // backwards while the scroll only ever moved forwards.
  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 116 })]
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 216, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?gap')
  const handle = slider(c, { duration: 0 })

  let previous = -Infinity
  for (let scroll = 0; scroll <= 116; scroll++) {
    c.scrollLeft = scroll
    pumpSlider(listeners, rafQueue)
    const { position } = handle.state()
    assert.ok(
      position >= previous,
      `position must not decrease: ${position} at scrollLeft ${scroll}, after ${previous}`
    )
    previous = position
  }
  assert.equal(handle.state().position, 1, 'the walk ends centered on the second slide')

  c.scrollLeft = 0
  pumpSlider(listeners, rafQueue)
  assert.equal(handle.state().position, 0, 'and starts centered on the first')
  handle.destroy()
})

test('slider: a press inside the wheel settle window drops the pending glide', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr', scrollSnapType: 'x mandatory' })

  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 300, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?wheelhandoff')
  const handle = slider(c, { duration: 600 })
  // the mount-time observer delivery, before anything counts frames below
  runFrames(rafQueue)

  // the 200 ms settle timer, on demand instead of on the clock
  const pending = new Map()
  let seq = 0
  const realSetTimeout = global.setTimeout
  const realClearTimeout = global.clearTimeout
  global.setTimeout = (fn) => {
    pending.set(++seq, fn)
    return seq
  }
  global.clearTimeout = (id) => pending.delete(id)
  const settle = () => {
    const fns = [...pending.values()]
    pending.clear()
    fns.forEach((fn) => fn())
  }
  const press = () =>
    listeners.pointerdown({
      pointerType: 'mouse',
      button: 0,
      clientX: 50,
      target: { closest: () => null },
      preventDefault: () => {},
    })

  try {
    // control: with nothing else taking over, the settle does glide here
    c.scrollLeft = 40
    listeners.wheel({ deltaX: 40, deltaY: 0 })
    settle()
    assert.ok(rafQueue.length > 0, 'the wheel settle glides when it keeps ownership')

    // a drag starting inside the window owns the position: no settle behind it
    rafQueue.length = 0
    c.scrollLeft = 40
    listeners.wheel({ deltaX: 40, deltaY: 0 })
    press()
    settle()
    assert.equal(rafQueue.length, 0, 'a press inside the window leaves no glide to fight it')

    // same for an explicit move (arrow click, autoplay, keyboard: all goTo)
    c.scrollLeft = 40
    listeners.wheel({ deltaX: 40, deltaY: 0 })
    handle.next()
    rafQueue.length = 0
    settle()
    assert.equal(rafQueue.length, 0, 'a goTo inside the window replaces the settle')
  } finally {
    global.setTimeout = realSetTimeout
    global.clearTimeout = realClearTimeout
  }
  handle.destroy()
})

test('slider: the active slide is the nearest one in pixels, not in slide widths', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  // a 100px slide followed by a 300px one: centres at 50 and 250, midpoint 150.
  // Dividing each distance by the slide's OWN width made the wide one look
  // nearer from centre 101 on, where it is 149px away and its neighbour 51px.
  const slides = [makeSlideBox({ x: 0, w: 100 }), makeSlideBox({ x: 100, w: 300 })]
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 400, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?uneven')
  const handle = slider(c, { duration: 0 })

  for (let centre = 100; centre <= 200; centre++) {
    c.scrollLeft = centre - 50 // centre = scrollLeft + clientWidth / 2
    pumpSlider(listeners, rafQueue)
    const { active, position } = handle.state()
    // the flip sits on the midpoint 150, where the two are equidistant and the
    // first one keeps it (same tie rule as the vertical rail test above)
    assert.equal(active, centre <= 150 ? 0 : 1, `centre ${centre} belongs to the nearest slide in pixels`)
    // active follows the code's own tie rule, ceil(position - 0.5), which
    // rounds an exact tie DOWN to the earlier slide. Stronger than a plain
    // distance span (|position - active| <= 0.5): the span form also allows
    // a tie to resolve to the LATER slide, which the code never does.
    // assert.ok with === (not assert.equal, which strict mode backs with
    // Object.is): active 0 and Math.ceil's -0 for a value just under a
    // whole number are the same under === and must read as a pass.
    assert.ok(
      active === Math.ceil(position - 0.5),
      `active ${active} breaks the tie rule for position ${position} at centre ${centre}`
    )
  }

  // --sd stays normalized by each slide's own size: that is what the CSS reads
  c.scrollLeft = 100 // centre 150
  pumpSlider(listeners, rafQueue)
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  assert.equal(slides[1].vars['--sd'], '0.3333')

  handle.destroy()
})

test('slider: a destroyed slider stops moving', async () => {
  const rafQueue = [], listeners = {}
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const slides = [makeSlideBox({ x: 0 }), makeSlideBox({ x: 100 }), makeSlideBox({ x: 200 })]
  const c = makeBox(slides, { rect: { left: 0, top: 0 }, clientWidth: 100, clientHeight: 100, scrollWidth: 300, scrollHeight: 100, listeners, rafQueue })
  const { slider } = await import('../dist/core/slider.js?destroyed')
  const handle = slider(c, { duration: 0 })
  runFrames(rafQueue) // the mount-time observer delivery re-measures

  handle.goTo(1, false)
  const parked = c.scrollLeft
  assert.equal(parked, 100, 'it moves while it is alive')

  handle.destroy()
  handle.next()
  handle.prev()
  handle.goTo(2, false)
  handle.seek(1)
  assert.equal(c.scrollLeft, parked, 'no command writes a position after destroy')

  // a stray scroll (or an observer record already in flight) measures nothing
  rafQueue.length = 0
  listeners.scroll()
  assert.equal(rafQueue.length, 0, 'a destroyed slider schedules no frame')
})

test('slider: the observer\'s first delivery measures a container that had no box at mount', async () => {
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  // The rail is mounted before it has a box: inside a display:none ancestor a
  // tab has just revealed, a details that is still closed, a web font that has
  // not swapped. slider() measures synchronously anyway and reads a zero
  // viewport; nothing scrolls, nothing resizes afterwards. What corrects it in
  // a real browser is the ResizeObserver's FIRST delivery, which arrives on
  // its own right after observe() with the element's current size, and whose
  // callback here is schedule(). Without that delivery this rail stays parked
  // on slide 0 forever (ADU-177).
  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0, clientTop: 0, scrollTop: 0, offsetLeft: 0, offsetTop: 0, offsetParent: null,
    getBoundingClientRect() { return { left: 0, right: this.clientWidth, top: 0, bottom: 0, width: this.clientWidth, height: 0 } },
    scrollLeft: 0,
    clientWidth: 0, // no layout yet
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { container.vars[k] = v } },
    addEventListener: () => {}, removeEventListener: () => {}, scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js?mountframe')
  const onSlideCalls = []
  const handle = slider(container, { duration: 0, onSlide: (i) => onSlideCalls.push(i) })

  // zero viewport: the centre sits at 0, so the first slide is the nearest
  assert.equal(handle.active(), 0, 'the synchronous mount measure sees no box')
  assert.deepEqual(onSlideCalls, [0])
  assert.equal(rafQueue.length, 1, 'observing the rail queued the mount frame, and nothing else did')

  // layout happens, then the observer delivers its first entry on that frame
  container.clientWidth = 300
  runFrames(rafQueue)

  assert.equal(handle.active(), 1, 'the first delivery re-measures against the real box')
  assert.deepEqual(onSlideCalls, [0, 1], 'and reports the slide that actually became active')
  assert.equal(container.vars['--sv-slide'], '1')
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.ok(slides[1].classes.has('sv-active'))
  handle.destroy()
})

test('slider: measure() reads scrollLeft and scrollWidth before it writes anything, never after (ADU-190)', async () => {
  // Same shape as the driver's ADU-168 test: a read/write log, and the
  // assertion is about ORDER, not about the values read staying consistent
  // (that claim was rejected twice in round 6 and stays rejected). measure()
  // declares a read phase then a write phase; progress() (through pos() and
  // range()) reads scrollLeft and scrollWidth, and used to be called again
  // after the --sd writes (for --sv-progress) and again after the class
  // writes (inside state(), for onScroll). Both must land in the read phase.
  const rafQueue = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => (rafQueue.length = 0)
  global.ResizeObserver = ResizeObserverStub
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const log = []
  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
    const rawSetProperty = s.style.setProperty.bind(s.style)
    s.style.setProperty = (k, v) => {
      log.push(`write slide ${k}`)
      rawSetProperty(k, v)
    }
  })

  let scrollLeftValue = 100
  let scrollHandler
  const container = {
    get children() {
      slides.forEach((sl) => {
        sl._c = this
        sl.offsetParent = this
      })
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
    offsetLeft: 0,
    offsetTop: 0,
    offsetParent: null,
    getBoundingClientRect() {
      return { left: 0, right: this.clientWidth, top: 0, bottom: 100, width: this.clientWidth, height: 100 }
    },
    get scrollLeft() {
      log.push('read scrollLeft')
      return scrollLeftValue
    },
    set scrollLeft(v) {
      scrollLeftValue = v
    },
    get scrollWidth() {
      log.push('read scrollWidth')
      return 500
    },
    get clientWidth() {
      log.push('read clientWidth')
      return 300
    },
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {
      setProperty(k, v) {
        log.push(`write container ${k}`)
        container.vars[k] = v
      },
    },
    addEventListener: (type, fn) => {
      if (type === 'scroll') scrollHandler = fn
    },
    removeEventListener: () => {},
    scrollTo: () => {},
  }

  const { slider } = await import('../dist/core/slider.js?readorder')
  const scrollStates = []
  const handle = slider(container, { duration: 0, onScroll: (s) => scrollStates.push(s) })
  assert.equal(typeof scrollHandler, 'function', 'mount registered the scroll listener this test fires')

  // The mount-time measure already ran synchronously, mixed in with the
  // container's own setup writes before it (--sv-snap et al). Clear the log
  // and re-measure the way a real scroll does, so what gets inspected below
  // is exactly one clean measure() pass.
  log.length = 0
  scrollStates.length = 0
  scrollHandler()
  runFrames(rafQueue)

  assert.ok(log.some((step) => step.startsWith('read')), 'the measure pass really did read geometry')
  assert.ok(log.some((step) => step.startsWith('write')), 'and really did write --sd/--sv-progress')
  assert.equal(scrollStates.length, 1, 'onScroll fired once for this measure pass')
  const lastRead = log.reduce((acc, step, i) => (step.startsWith('read') ? i : acc), -1)
  const firstWrite = log.findIndex((step) => step.startsWith('write'))
  assert.ok(
    lastRead < firstWrite,
    `every read happens before the first write of the whole pass, got ${log.join(' → ')}`
  )
  handle.destroy()
})
