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

test('driver: custom live band and custom root geometry', async () => {
  const { track } = await import('../dist/core/driver.js')

  // custom thresholds: enter 0.5 / exit 0.1 — at top 600 (< 500? no) stays
  // out; at 400 (< 500) goes live; default band would already be live at 700
  const el = makeElement(300)
  const untrack = track(el, { enter: 0.5, exit: 0.1 })
  place(el, 700)
  pump()
  assert.ok(!el.classes.has('sv-live'), 'default band would be live here; custom is not')
  place(el, 400)
  pump()
  assert.ok(el.classes.has('sv-live'))
  untrack()

  // custom root: a 500px-tall inner scroller at viewport top 100; the child
  // rect sits at 450 → relative top 350 = 70% of the root, inside its band
  const rootEl = {
    getBoundingClientRect: () => ({ top: 100, bottom: 600, height: 500 }),
  }
  const child = makeElement(200)
  place(child, 450)
  const untrack2 = track(child, { root: rootEl, travel: true })
  pump()
  assert.ok(child.classes.has('sv-live'), 'live relative to the root band')
  // travel: (vp - top) / (vp + height) = (500 - 350) / (500 + 200)
  assert.equal(child.vars['--sv-t'], (150 / 700).toFixed(4))
  // same rect against the WINDOW band (vh 1000): top 450 < 750 → also live,
  // but travel differs — proves the geometry really is root-relative
  untrack2()
})

test('driver: offscreen culling skips the rect read, IO wakes it back up', async () => {
  let ioCallback
  const observedByIO = new Set()
  global.IntersectionObserver = class {
    constructor(cb) { ioCallback = cb }
    observe(el) { observedByIO.add(el) }
    unobserve(el) { observedByIO.delete(el) }
    disconnect() {}
  }
  // fresh module instance so init() runs with the IO stub in place
  const { track } = await import('../dist/core/driver.js?culling')

  const el = makeElement(400)
  let reads = 0
  const origGet = el.getBoundingClientRect
  el.getBoundingClientRect = () => (reads++, origGet())
  const untrack = track(el, {})
  assert.ok(observedByIO.has(el), 'culler observes rootless entries')
  place(el, 400)
  pump()
  assert.ok(reads > 0 && el.classes.has('sv-live'))

  // far offscreen: the culler flags it, subsequent frames skip the read
  ioCallback([{ target: el, isIntersecting: false }])
  const before = reads
  pump()
  pump()
  assert.equal(reads, before, 'culled entry pays no getBoundingClientRect')

  // a jump longer than a viewport gives every entry one pass even while culled
  // (an element carried from far below to far above never intersects the culler)
  window.scrollY += 3000
  const beforeJump = reads
  pump()
  assert.equal(reads, beforeJump + 1, 'jump frame reads culled entries once')
  pump()
  assert.equal(reads, beforeJump + 1, 'and only once')

  // back near: reads resume
  ioCallback([{ target: el, isIntersecting: true }])
  pump()
  assert.ok(reads > beforeJump + 1)
  untrack()
  assert.ok(!observedByIO.has(el))
  delete global.IntersectionObserver
})

test('driver: --sv-page/--sv-v on <html>, --sv-scenes on scene containers', async () => {
  const pageVars = {}
  global.document = {
    documentElement: {
      classList: { add: () => {} },
      style: { setProperty: (k, v) => (pageVars[k] = v) },
      scrollHeight: 3000,
    },
  }
  window.scrollY = 1000
  const { track } = await import('../dist/core/driver.js?pagevars')
  const el = makeElement(400)
  el.rect = { top: 100, bottom: 600, width: 800, height: 500 }
  const untrack = track(el, { scenes: 4 })
  assert.equal(el.vars['--sv-scenes'], '4', 'scene count written once at track time')
  pump()
  // 1000 / (3000 - 1000)
  assert.equal(pageVars['--sv-page'], '0.5000')
  assert.equal(pageVars['--sv-v'], '0.000', 'first frame has no velocity')
  window.scrollY = 1500
  await new Promise((r) => setTimeout(r, 20))
  pump()
  assert.ok(parseFloat(pageVars['--sv-v']) > 0, 'downward scroll is positive velocity')
  await new Promise((r) => setTimeout(r, 120))
  assert.equal(pageVars['--sv-v'], '0', 'velocity decays to 0 at rest')
  untrack()
})

test('driver: --sv-pin-offset shifts the pinned stretch below a sticky header', async () => {
  global.getComputedStyle = () => ({ getPropertyValue: (n) => (n === '--sv-pin-offset' ? '64px' : '') })
  const { track } = await import('../dist/core/driver.js?pinoffset')
  const el = makeElement(3000)
  const untrack = track(el, { pin: true })
  // stage sticks at 64px from the top: progress 0 there, 1 when the wrapper's
  // bottom reaches the stage's bottom (vh - height)
  place(el, 64)
  pump()
  assert.equal(el.vars['--sv-pin'], '0.0000')
  place(el, 1000 - 3000)
  pump()
  assert.equal(el.vars['--sv-pin'], '1.0000')
  place(el, 0)
  pump()
  assert.equal(el.vars['--sv-pin'], (64 / (3000 - 1000 + 64)).toFixed(4))
  untrack()
  delete global.getComputedStyle
})
