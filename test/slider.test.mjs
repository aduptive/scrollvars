import assert from 'node:assert/strict'
import { test } from 'node:test'

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
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })

  const scrolls = []
  const container = {
    get children() {
      slides.forEach((sl) => (sl._c = this))
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
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
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })
  const container = {
    get children() {
      slides.forEach((sl) => (sl._c = this))
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
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
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.requestAnimationFrame = (fn) => 1
  global.cancelAnimationFrame = () => {}
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  // direction: rtl — slides laid out right-to-left; raw scrollLeft is 0..-range
  global.getComputedStyle = () => ({ direction: 'rtl' })

  const slides = [makeSlide(400), makeSlide(300), makeSlide(200), makeSlide(100), makeSlide(0)]
  slides.forEach((s) => {
    s.style._owner = s
    s.classList._owner = s
  })
  const container = {
    get children() {
      slides.forEach((sl) => (sl._c = this))
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
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

  // at raw 0 (start, rightmost) logical pos is 0 → progress 0; the slide
  // nearest the 300px viewport's center is index 1, same as the LTR case
  assert.equal(handle.state().progress, 0)
  assert.equal(handle.active(), 1)

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
  global.requestAnimationFrame = () => 1
  global.cancelAnimationFrame = () => {}
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
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
      slides.forEach((sl) => (sl._c = this))
      return slides
    },
    clientLeft: 0,
    clientTop: 0,
    scrollTop: 0,
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
  global.ResizeObserver = class { observe() {} disconnect() {} }
  global.getComputedStyle = () => ({ direction: 'ltr' })

  const slides = [makeSlide(0), makeSlide(100), makeSlide(200)]
  slides.forEach((s) => { s.style._owner = s; s.classList._owner = s })
  const container = {
    get children() { slides.forEach((sl) => (sl._c = this)); return slides },
    clientLeft: 0, clientTop: 0, scrollTop: 0,
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
    get children() { slides.forEach((s) => { s._c = c; s.style._owner = s; s.classList._owner = s }); return slides },
    rect, clientLeft: 2, clientTop: 2, scrollLeft: 0, scrollTop: 0,
    clientWidth, clientHeight, scrollWidth, scrollHeight,
    vars: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: { setProperty(k, v) { c.vars[k] = v } },
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
  global.ResizeObserver = class { observe() {} disconnect() {} }
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
  global.ResizeObserver = class { observe() {} disconnect() {} }
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
