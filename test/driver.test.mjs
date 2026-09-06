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
      removeProperty(name) {
        delete el.vars[name]
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
    clientTop: 0,
    clientHeight: 500,
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


test('driver: a once entry settles --sv-view before releasing, and page outputs keep following the scroll', async () => {
  const pageVars = {}
  global.document = {
    documentElement: { classList: { add: () => {} }, style: { setProperty: (k, v) => (pageVars[k] = v) }, scrollHeight: 6000 },
  }
  window.scrollY = 0
  const { track } = await import('../dist/core/driver.js?oncesettle')
  const el = makeElement(200)
  place(el, 1500) // below the viewport: measured at -1
  const untrack = track(el, { once: true })
  pump()
  assert.equal(el.vars['--sv-view'], '-1.0000')
  place(el, 300) // inside the band: goes live and is released
  pump()
  assert.ok(el.classes.has('sv-live'))
  assert.equal(el.vars['--sv-view'], '0.0000', 'released with the settled value, not the stale -1')
  // nothing tracked any more, yet the page keeps its outputs
  window.scrollY = 2500
  pump()
  assert.equal(pageVars['--sv-page'], (2500 / 5000).toFixed(4))
  untrack()
})

test('driver: --sv-pin-offset applies to onPin consumers, and the pin helper restores what it replaced', async () => {
  global.getComputedStyle = () => ({ getPropertyValue: (n) => (n === '--sv-pin-offset' ? '64px' : '') })
  const { track } = await import('../dist/core/driver.js?pinconsumers')
  const el = makeElement(3000)
  const pins = []
  const untrack = track(el, { onPin: (p) => pins.push(p) })
  place(el, 64)
  pump()
  assert.equal(pins[pins.length - 1], 0, 'onPin without pin:true still starts at the header line')
  untrack()

  const wrapper = makeElement(100)
  wrapper.style.height = '10px'
  wrapper.style.position = 'sticky'
  const stop = track(wrapper, { pin: '300vh' })
  assert.equal(wrapper.style.height, '300vh')
  assert.equal(wrapper.style.position, 'sticky', 'an authored position is kept')
  stop()
  assert.equal(wrapper.style.height, '10px', 'untrack restores the authored height')
  delete global.getComputedStyle
})

test('driver: untrack is identity-guarded, a stale untrack cannot delete a replacement', async () => {
  const { track } = await import('../dist/core/driver.js?identityguard')
  const el = makeElement(400)
  place(el, 300) // inside the live band from the start
  const untrackFirst = track(el, { travel: true })
  pump()
  assert.ok(el.classes.has('sv-live'))
  assert.ok('--sv-view' in el.vars)

  const untrackSecond = track(el, { travel: true }) // re-track the same element
  untrackFirst() // stale: entries.get(el) is now the second entry, this must be a no-op
  assert.ok(observed.has(el), 'the stale untrack must not unobserve the still-tracked element')
  pump()
  assert.ok(el.classes.has('sv'), 'the second entry is still tracked')
  place(el, 2000) // move it far below: proves the SECOND entry keeps getting measured
  pump()
  assert.equal(el.vars['--sv-view'], '-1.0000', 'the second entry keeps updating after the first, stale untrack')

  untrackSecond() // the real untrack: cleanup runs now
  assert.ok(!el.classes.has('sv-live'), 'sv-live removed')
  assert.ok(!('--sv-view' in el.vars), 'no --sv-view left inline')
  assert.ok(!('--sv-t' in el.vars), 'no --sv-t left inline')
  assert.ok(el.classes.has('sv'), '.sv stays')
})

test('driver: init() is transactional, a throwing ResizeObserver leaves track() a no-op until it succeeds', async () => {
  global.ResizeObserver = class {
    constructor() {
      throw new Error('no ResizeObserver in this browser')
    }
  }
  const { track } = await import('../dist/core/driver.js?initfail')
  const el = makeElement(400)
  const untrack = track(el, { travel: true })
  pump()
  assert.equal(el.classes.size, 0, 'no .sv class: the page stays static')
  assert.deepEqual(el.vars, {}, 'no inline vars written')
  untrack() // the no-op must be safely callable

  // scrollvars/compat shims a real ResizeObserver in; a later track() retries init()
  global.ResizeObserver = class {
    constructor() {}
    observe(el) {
      observed.add(el)
    }
    unobserve(el) {
      observed.delete(el)
    }
  }
  const untrack2 = track(el, { travel: true })
  pump()
  assert.ok(el.classes.has('sv'), 'track() succeeds once the ResizeObserver is available')
  untrack2()
})

test('driver: refresh() forces one geometry pass through culled entries', async () => {
  let ioCallback
  global.IntersectionObserver = class {
    constructor(cb) {
      ioCallback = cb
    }
    observe(el) {
      observed.add(el)
    }
    unobserve(el) {
      observed.delete(el)
    }
    disconnect() {}
  }
  const { track, refresh } = await import('../dist/core/driver.js?refreshforce')
  const el = makeElement(400)
  const untrack = track(el, {})
  pump()
  ioCallback([{ target: el, isIntersecting: false }]) // cull it
  place(el, 300) // move into the live band while culled
  pump()
  assert.ok(!el.classes.has('sv-live'), 'a culled entry is not measured on a plain scroll frame')
  refresh()
  pump()
  assert.ok(el.classes.has('sv-live'), 'refresh() forces one geometry pass through the culled entry')
  untrack()
  delete global.IntersectionObserver
})

test('driver: a bordered root shares one origin between update() pin progress and scrollToScene()', async () => {
  const { track, scrollToScene } = await import('../dist/core/driver.js?rootorigin')
  const rootRect = { top: 100, bottom: 620, height: 520 }
  const rootEl = {
    clientTop: 10, // e.g. a 10px top border
    clientHeight: 500, // border-box minus the top+bottom border, unlike the 520px bounding rect
    scrollTop: 0,
    getBoundingClientRect: () => ({ ...rootRect }),
    scrollTo(opts) {
      rootEl.lastScrollTo = opts
    },
  }
  const child = makeElement(2000)
  place(child, -200)
  const untrack = track(child, { pin: true, root: rootEl })
  assert.ok(observed.has(rootEl), 'the root is observed by the ResizeObserver too')
  pump()
  assert.equal(child.vars['--sv-pin'], '0.2067', 'origin uses root.clientTop, vp uses root.clientHeight')

  scrollToScene(child, 1, 3, false, rootEl)
  const delta = rootEl.lastScrollTo.top - rootEl.scrollTop
  rootEl.scrollTop = rootEl.lastScrollTo.top
  place(child, child.rect.top - delta) // simulate the root having scrolled by that delta
  pump()
  assert.equal(
    child.vars['--sv-pin'],
    '0.5000',
    'the offset scrollToScene computed lands where update() reports the same progress'
  )
  untrack()
})

test('driver: readPinOffset resolves rem, em, vh/svh/lvh/dvh, vw and bare numbers to px', async () => {
  window.innerWidth = 400
  const { track } = await import('../dist/core/driver.js?pinunits')

  const cases = [
    { raw: '4rem', elFont: '20px', px: 64 }, // 4 * the root's 16px font-size
    { raw: '2em', elFont: '32px', px: 64 }, // 2 * the element's own 32px font-size
    { raw: '10vh', elFont: '16px', px: 100 }, // 10% of innerHeight 1000
    { raw: '10svh', elFont: '16px', px: 100 },
    { raw: '10lvh', elFont: '16px', px: 100 },
    { raw: '10dvh', elFont: '16px', px: 100 },
    { raw: '25vw', elFont: '16px', px: 100 }, // 25% of innerWidth 400
    { raw: '64', elFont: '16px', px: 64 }, // a bare number reads as px
  ]

  for (const { raw, elFont, px } of cases) {
    global.getComputedStyle = (target) => ({
      getPropertyValue: (n) => (n === '--sv-pin-offset' ? raw : ''),
      fontSize: target === document.documentElement ? '16px' : elFont,
    })
    const el = makeElement(3000)
    const untrack = track(el, { pin: true })
    place(el, px) // the stage sticks at `px` from the top: progress 0 there
    pump()
    assert.equal(el.vars['--sv-pin'], '0.0000', `${raw} resolves to ${px}px`)
    untrack()
  }
  delete global.getComputedStyle
  delete window.innerWidth
})
