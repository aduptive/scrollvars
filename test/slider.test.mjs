import assert from 'node:assert/strict'
import { test } from 'node:test'

// Geometry stubs: 3 slides of 100px in a 300px container, gapless.
function makeSlide(offsetLeft) {
  return {
    offsetLeft,
    offsetWidth: 100,
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
    children: slides,
    scrollLeft: 0,
    clientWidth: 300,
    vars: {},
    classList: { add: () => {}, remove: () => {} },
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
    children: slides,
    scrollLeft: 0,
    clientWidth: 300,
    classList: { add: () => {}, remove: () => {} },
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
    children: slides,
    scrollLeft: 0,
    clientWidth: 300,
    scrollWidth: 500,
    vars: {},
    classList: { add: () => {}, remove: () => {} },
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
    children: slides,
    scrollLeft: 0,
    clientWidth: 300,
    classList: { add: () => {}, remove: () => {} },
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
