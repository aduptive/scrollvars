import assert from 'node:assert/strict'
import { test } from 'node:test'

// The driver holds module-level state (entries, initialized vh, listeners),
// so this file imports it once and runs as one sequential test, untracking
// between scenarios. vh is stubbed at 1000 for round numbers:
//   enter line = 750 · exit line = 250 (the 75% / 25% live band)

const rafQueue = []
const listeners = {}
const observed = new Set()
let mediaChange

function makeElement(height = 400) {
  const el = {
    rect: { top: 2000, bottom: 2000 + height, width: 800, height },
    scrollHeight: height,
    vars: {},
    setCalls: 0,
    classes: new Set(),
    style: {
      setProperty(name, value) {
        el.vars[name] = value
        el.setCalls++
      },
    },
    classList: {
      add: (c) => el.classes.add(c),
      toggle: (c, on) => (on ? el.classes.add(c) : el.classes.delete(c)),
    },
    getBoundingClientRect: () => ({ ...el.rect }),
  }
  return el
}

function place(el, top, height = el.rect.height) {
  el.rect = { top, bottom: top + height, width: 800, height }
}

function pump() {
  // a scroll event schedules one rAF; run the queue to completion
  listeners.scroll?.()
  while (rafQueue.length) rafQueue.shift()(performance.now())
}

test('driver: view band, live latch, travel, pin, scenes, dedup, cleanup', async () => {
  global.window = {
    innerHeight: 1000,
    scrollY: 5000,
    addEventListener: (type, fn) => (listeners[type] = fn),
    matchMedia: () => ({
      matches: false,
      addEventListener: (_, fn) => (mediaChange = fn),
    }),
    scrollTo: (opts) => (window.lastScrollTo = opts),
  }
  global.document = {
    documentElement: { classList: { add: () => {} } },
  }
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  global.cancelAnimationFrame = () => {}
  global.ResizeObserver = class {
    constructor() {}
    observe(el) {
      observed.add(el)
    }
    unobserve(el) {
      observed.delete(el)
    }
  }

  const { track, scrollToScene } = await import('../dist/core/driver.js')

  // ── --sv-view: the ramps around the live band ──
  const el = makeElement(400)
  const liveLog = []
  const untrack = track(el, { travel: true, onLive: (v) => liveLog.push(v) })
  pump()
  assert.equal(el.vars['--sv-view'], '-1.0000') // top at viewport bottom (2000 ≫)

  place(el, 875) // halfway down the enter ramp: -(875-750)/250
  pump()
  assert.equal(el.vars['--sv-view'], '-0.5000')

  place(el, 300) // fully in the band
  pump()
  assert.equal(el.vars['--sv-view'], '0.0000')
  assert.ok(el.classes.has('sv-live'))
  assert.deepEqual(liveLog, [true])

  place(el, -275) // bottom = 125, halfway out the exit ramp: (250-125)/250
  pump()
  assert.equal(el.vars['--sv-view'], '0.5000')
  assert.ok(!el.classes.has('sv-live'))
  assert.deepEqual(liveLog, [true, false])

  // ── --sv-t: (vh - top) / (vh + height), clamped ──
  place(el, 1000)
  pump()
  assert.equal(el.vars['--sv-t'], '0.0000')
  place(el, -400)
  pump()
  assert.equal(el.vars['--sv-t'], '1.0000')
  place(el, 300) // (1000-300)/1400
  pump()
  assert.equal(el.vars['--sv-t'], '0.5000')

  // ── setVar dedup: unchanged value never rewrites ──
  const callsBefore = el.setCalls
  pump()
  assert.equal(el.setCalls, callsBefore)

  // ── reduced motion pins --sv-view to 0 ──
  mediaChange({ matches: true })
  place(el, 875)
  pump()
  assert.equal(el.vars['--sv-view'], '0.0000')
  mediaChange({ matches: false })

  untrack()
  assert.ok(!observed.has(el), 'untrack unobserves')
  const frozen = { ...el.vars }
  place(el, 500)
  pump()
  assert.deepEqual(el.vars, frozen, 'no writes after untrack')

  // ── once latches sv-live ──
  const el1 = makeElement(400)
  const un1 = track(el1, { once: true })
  place(el1, 300)
  pump()
  place(el1, 2000) // way below again
  pump()
  assert.ok(el1.classes.has('sv-live'), 'once keeps the latch')
  un1()

  // ── --sv-pin: -top / (height - vh) on a tall element ──
  const tall = makeElement(3000)
  const scenes = []
  const un2 = track(tall, { pin: true, scenes: 4, onScene: (i) => scenes.push(i) })
  place(tall, 0)
  pump()
  assert.equal(tall.vars['--sv-pin'], '0.0000')
  place(tall, -1000) // -(-1000)/(3000-1000)
  pump()
  assert.equal(tall.vars['--sv-pin'], '0.5000')
  place(tall, -2000)
  pump()
  assert.equal(tall.vars['--sv-pin'], '1.0000')

  // ── scenes: snap dead-zone → integer; onScene on integer change only ──
  // raw = pin * 3; pin = 1.1/3 → raw 1.1, fraction 0.1 ≤ snap 0.4 → exactly 1
  place(tall, -(1.1 / 3) * 2000)
  pump()
  assert.equal(tall.vars['--sv-scene'], '1.0000')
  assert.deepEqual(scenes, [0, 1, 3, 1]) // start, pin .5 (scene 1.42→1), pin 1, now
  un2()

  // ── snap: false skips the dead-zone (eased fraction survives) ──
  const tall2 = makeElement(3000)
  const un3 = track(tall2, { scenes: 4, snap: false })
  place(tall2, -1000) // raw 1.5 → 1 + easeOutCubic(0.5) = 1.875
  pump()
  assert.equal(tall2.vars['--sv-scene'], '1.8750')
  un3()

  // ── scrollToScene target math ──
  const tall3 = makeElement(3000)
  place(tall3, -500)
  scrollToScene(tall3, 2, 4, false)
  // scrollY 5000 + rect.top -500 + (2/3) * (3000 - 1000)
  assert.equal(Math.round(window.lastScrollTo.top), Math.round(4500 + (2 / 3) * 2000))
  assert.equal(window.lastScrollTo.behavior, 'instant')
})
