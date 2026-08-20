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
  global.window = {}
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
  const handle = slider(container, { onSlide: (i) => onSlideCalls.push(i) })

  // initial measure runs synchronously: center=150 → slide 2 (mid=150) active
  assert.equal(handle.active(), 1)
  assert.deepEqual(onSlideCalls, [1])
  assert.equal(slides[1].vars['--sd'], '0.0000')
  assert.equal(slides[0].vars['--sd'], '-1.0000')
  assert.equal(slides[2].vars['--sd'], '1.0000')
  assert.ok(slides[1].classes.has('sv-active'))
  assert.ok(!slides[0].classes.has('sv-active'))

  // next(): centers slide 3 → left = 200 - (300-100)/2 = 100
  handle.next()
  assert.deepEqual(scrolls.at(-1), { left: 100, behavior: 'smooth' })

  // goTo clamps
  handle.goTo(99, false)
  assert.deepEqual(scrolls.at(-1), { left: 100, behavior: 'instant' })

  handle.destroy()
})
