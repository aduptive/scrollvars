import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
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
    attrs: new Map(),
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
      // the driver reads the class list back every frame (it owns sv-live and
      // re-asserts it), and clears its own classes when it re-tracks
      contains: (c) => el.classes.has(c),
      remove: (...cs) => cs.forEach((c) => el.classes.delete(c)),
    },
    // the release marker is an ATTRIBUTE (data-sv-off), which no className
    // rewrite can drop; setAttribute/removeAttribute, not toggleAttribute,
    // which is outside the supported floor
    setAttribute: (name, value) => el.attrs.set(name, value),
    removeAttribute: (name) => el.attrs.delete(name),
    hasAttribute: (name) => el.attrs.has(name),
    getBoundingClientRect: () => ({ ...el.rect }),
    // `[data-sv-off] X` matches at any depth, so the driver asks whether a
    // released element still holds a tracked one. Both sides walk the real
    // parent chain (a flat boolean would prove nothing): parentElement is
    // set by nest() below.
    parentElement: null,
    contains: (other) => {
      for (let node = other; node; node = node.parentElement) if (node === el) return true
      return false
    },
  }
  return el
}

const nest = (parent, child) => (child.parentElement = parent)

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

  // an inline `position: static` is not a position to keep: the helper promises
  // a containing block, so absolute children (curtains) stay inside the stage
  const flat = makeElement(100)
  flat.style.position = 'static'
  const stopFlat = track(flat, { pin: '300vh' })
  assert.equal(flat.style.position, 'relative', 'an inline static wrapper still gets the containing block')
  stopFlat()
  assert.equal(flat.style.position, 'static', 'untrack restores the authored inline static')

  const floated = makeElement(100)
  floated.style.position = 'absolute'
  const stopFloated = track(floated, { pin: '300vh' })
  assert.equal(floated.style.position, 'absolute', 'a non-static inline position is kept')
  stopFloated()
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
  // .sv (and [data-sv]) declare --sv-live: 0 and html.sv-on never comes off:
  // a released element must settle VISIBLE, not at the entrance rules' opacity 0
  assert.equal(el.vars['--sv-live'], '1', 'released elements settle visible')

  const untrackThird = track(el, {})
  assert.ok(!('--sv-live' in el.vars), 're-tracking hands the live flag back to the class')
  untrackThird()
})

test('driver: re-tracking an element releases the previous entry, so a var only it wrote does not stay inline', async () => {
  const { track } = await import('../dist/core/driver.js?releaseonreplace')
  const el = makeElement(400)
  place(el, 300) // inside the live band from the start
  const untrackFirst = track(el, { travel: true })
  pump()
  assert.ok('--sv-t' in el.vars, 'the first entry wrote --sv-t')

  const untrackSecond = track(el, {}) // replaces the entry; {} never writes --sv-t
  assert.ok(!('--sv-t' in el.vars), 'replacing releases the outputs only the first entry ever wrote')
  pump()
  assert.ok(!('--sv-t' in el.vars), 'the second entry never writes it back')

  untrackSecond()
  assert.ok(!('--sv-view' in el.vars), 'the second entry cleaned up its own output')

  untrackFirst() // stale: entries.get(el) is nothing now, this must be a no-op
  assert.ok(el.classes.has('sv'), 'the stale untrack did not touch anything')
})

test('driver: a root that is also tracked standalone keeps its ResizeObserver watch until nothing needs it', async () => {
  const { track } = await import('../dist/core/driver.js?rootrefcount')
  const rootEl = makeElement(500)
  const untrackRoot = track(rootEl, {})
  assert.ok(observed.has(rootEl), 'the standalone entry observes itself')

  const child = makeElement(200)
  const untrackChild = track(child, { root: rootEl, travel: true })
  assert.ok(observed.has(rootEl), 'the child also needs the root observed')

  untrackRoot()
  assert.ok(observed.has(rootEl), 'the root stays observed: the child entry still references it')

  untrackChild()
  assert.ok(!observed.has(rootEl), 'nothing references it as root any more, so it may now be unobserved')
})

test('driver: a once entry that is also another entry\'s root keeps that root observed after it self-releases', async () => {
  const { track } = await import('../dist/core/driver.js?onceasroot')
  const rootEl = makeElement(500)
  place(rootEl, 300) // inside the live band on the first frame, so once fires immediately
  const untrackRoot = track(rootEl, { once: true })

  const child = makeElement(200)
  const untrackChild = track(child, { root: rootEl, travel: true })

  pump()
  assert.ok(rootEl.classes.has('sv-live'), 'the once entry latches live and self-releases')
  assert.ok(observed.has(rootEl), 'still observed: the child entry still uses it as root')

  untrackChild()
  assert.ok(!observed.has(rootEl), 'nothing references it any more, so it may now be released')
  untrackRoot() // no-op: the once entry already deleted itself from entries on the frame above
})

test('driver: a once entry that declares its own root releases that root once nothing else needs it', async () => {
  const { track } = await import('../dist/core/driver.js?oncedeclaresroot')
  const rootRect = { top: 100, bottom: 620, height: 520 }
  const rootEl = {
    clientTop: 10, // bordered root, same shape as the offsetParent-chain test above
    clientHeight: 500,
    scrollTop: 0,
    getBoundingClientRect: () => ({ ...rootRect }),
    scrollTo(opts) {
      rootEl.lastScrollTo = opts
    },
  }

  const child = makeElement(200)
  place(child, 300) // geo.top = 300-110 = 190, geo.bottom = 500-110 = 390: live from the first frame
  const untrackOnce = track(child, { once: true, root: rootEl })
  pump()
  assert.ok(child.classes.has('sv-live'), 'the once entry latches live on the first frame')
  assert.ok(
    !observed.has(rootEl),
    'nothing else uses the root: it is released the same frame the once entry self-releases'
  )

  // same leak, but this time another entry still needs the root observed
  const other = makeElement(200)
  const untrackOther = track(other, { root: rootEl, travel: true })
  const child2 = makeElement(200)
  place(child2, 300)
  const untrackOnce2 = track(child2, { once: true, root: rootEl })
  pump()
  assert.ok(child2.classes.has('sv-live'), 'the second once entry also latches live on the first frame')
  assert.ok(observed.has(rootEl), 'another entry still declares the same root: it stays observed after the once entry self-releases')

  untrackOther()
  assert.ok(!observed.has(rootEl), 'nothing references the root any more, so it may now be released')
  untrackOnce() // no-op: already self-released on the frame above
  untrackOnce2() // no-op: already self-released on the frame above
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

test('driver: a once entry releases by identity, so an onLive that re-tracks keeps its replacement', async () => {
  const { track } = await import('../dist/core/driver.js?onceretrack')
  const el = makeElement(400)
  place(el, 300) // inside the live band on the first frame, so once fires immediately
  let untrackReplacement = () => {}
  const untrackOnce = track(el, {
    once: true,
    onLive: (live) => {
      if (live) untrackReplacement = track(el, { travel: true })
    },
  })
  pump()
  assert.ok(observed.has(el), 'the replacement entry installed by onLive is observed')

  place(el, 1000)
  pump()
  assert.equal(el.vars['--sv-t'], '0.0000', 'the replacement keeps being measured after the once entry self-released')
  place(el, 300)
  pump()
  assert.equal(el.vars['--sv-t'], '0.5000', 'and keeps updating on later frames')

  untrackOnce() // stale: the once entry deleted itself before calling onLive
  assert.ok(observed.has(el), 'the stale untrack must not unobserve the replacement')
  untrackReplacement()
})

test('driver: an untrack from one callback cancels the same frame\'s write to the entry it released', async () => {
  const { track } = await import('../dist/core/driver.js?sameframeuntrack')
  const first = makeElement(400)
  const second = makeElement(400)
  place(first, 300) // both inside the live band on the first frame
  place(second, 300)

  const secondLog = []
  let untrackSecond = () => {}
  const untrackFirst = track(first, { onLive: () => untrackSecond() })
  untrackSecond = track(second, { travel: true, onLive: (v) => secondLog.push(v) })
  pump()

  assert.ok(first.classes.has('sv-live'), 'the first entry went live and released the second one')
  assert.ok(!('--sv-t' in second.vars), 'the released entry gets no further write in the same frame')
  assert.ok(!second.classes.has('sv-live'), 'and no sv-live it would never take off again')
  assert.deepEqual(secondLog, [], 'and no onLive after its untrack returned')
  assert.equal(second.vars['--sv-live'], '1', 'the released entry settled visible')
  untrackFirst()
})

test('driver: an onLive that untracks itself gets no write after the callback returns', async () => {
  const { track } = await import('../dist/core/driver.js?selfuntrack')
  const el = makeElement(400)
  place(el, 2000) // outside the live band
  let untrackSelf = () => {}
  untrackSelf = track(el, { travel: true, onLive: (live) => { if (live) untrackSelf() } })
  pump() // an off-band frame, so --sv-view/--sv-t get their first write

  place(el, 300) // into the band: isLive flips, onLive fires and self-untracks
  pump()
  assert.ok(!('--sv-view' in el.vars), 'no --sv-view write survives the self-untrack')
  assert.ok(!('--sv-t' in el.vars), 'no --sv-t write survives the self-untrack')
  assert.equal(el.vars['--sv-live'], '1', 'the release still settled the element visible')
})

test('driver: an onLive that re-tracks itself without travel leaves no --sv-t from the old entry', async () => {
  const { track } = await import('../dist/core/driver.js?selfreplace')
  const el = makeElement(400)
  place(el, 2000) // outside the live band
  let untrackCurrent = () => {}
  untrackCurrent = track(el, {
    travel: true,
    onLive: (live) => {
      if (live) untrackCurrent = track(el, {}) // the replacement declares no travel
    },
  })
  pump() // an off-band frame, so the old entry's --sv-t gets its first write

  place(el, 300) // into the band: isLive flips, onLive replaces this entry mid-apply
  pump()
  assert.ok(!('--sv-t' in el.vars), 'the old, released entry must not write --sv-t for its replacement')
  untrackCurrent()
})

test('driver: the driver owns the live state, a className rewrite that drops sv-live is re-asserted', async () => {
  const { track } = await import('../dist/core/driver.js?liveowner')
  const el = makeElement(400)
  place(el, 300) // inside the live band
  const untrack = track(el, {})
  pump()
  assert.ok(el.classes.has('sv-live'))
  assert.equal(el.vars['--sv-live'], '1', 'the flag is written inline too, where a className rewrite cannot reach it')

  // React's <Track> renders className={'sv ' + className}: a prop change
  // rewrites the whole attribute and takes the driver's classes with it
  el.classes.clear()
  delete el.vars['--sv-live']
  pump()
  assert.ok(el.classes.has('sv-live'), 'the next frame resolves the element live again')
  assert.ok(el.classes.has('sv'), 'and puts .sv back with it')
  assert.equal(el.vars['--sv-live'], '1', 'and re-asserts the inline flag')
  untrack()

  // a settled `once` entry has no tracker left to re-assert anything: the
  // inline flag is the whole reason such a section survives the same rewrite
  const once = makeElement(400)
  place(once, 300)
  const stop = track(once, { once: true })
  pump()
  assert.equal(once.vars['--sv-live'], '1', 'the settled once entry carries the flag inline')
  once.classes.clear()
  pump()
  assert.equal(once.vars['--sv-live'], '1', 'and keeps it with no tracker left to help')
  stop()
})

// styles/pin.css, comments stripped (a doc comment naming a selector is not a
// rule), as selector-list + body pairs. Nested at-rules never match as a whole
// (their body holds braces), so their inner rules are what land here.
const readCss = (name) =>
  readFileSync(new URL(`../styles/${name}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const rulesOf = (css) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    // split on top-level commas only: the one inside `:is(.sv, [data-sv])`
    // separates no selectors, and splitting it hid every guard from this file
    selectors: m[1].split(/,(?![^()]*\))/).map((s) => s.replace(/\s+/g, ' ').trim()),
    body: m[2].replace(/\s+/g, ' ').trim(),
  }))
const pinCss = readCss('pin.css')
// every sheet, not the two that happen to carry guards today: a no-JS guard
// added to a third file needs its released twin just as much
const guardRules = readdirSync(new URL('../styles/', import.meta.url))
  .filter((name) => name.endsWith('.css'))
  .flatMap((name) => rulesOf(readCss(name)))
const ruleFor = (selector) => guardRules.find((rule) => rule.selectors.includes(selector))

test('driver: releasing an element settles it to its no-JS rendering, and pin.css guards every preset on that', async () => {
  const { track } = await import('../dist/core/driver.js?releasestatic')
  const el = makeElement(3000)
  const untrack = track(el, { pin: true })
  place(el, -1000)
  pump()
  assert.equal(el.vars['--sv-pin'], '0.5000', 'the pin clock runs while tracked')

  untrack()
  assert.ok(!('--sv-pin' in el.vars), 'the clock the presets read is gone')
  assert.ok(el.attrs.has('data-sv-off'), 'and the element is marked released, for the static guards in the presets')
  assert.ok(el.classes.has('sv'), '.sv still stays: server markup keeps its authored [data-sv] either way')

  // the marker is an attribute on purpose: React's <Track> renders
  // `className={'sv ' + className}`, so a prop change rewrites the whole class
  // attribute. A released element has no tracker left to put a dropped class
  // back, and the stage would snap to sticky + overflow hidden with the
  // curtains over the content, permanently.
  el.classes.clear()
  assert.ok(el.attrs.has('data-sv-off'), 'a className rewrite that drops every driver class leaves the marker in place')
  assert.equal(el.vars['--sv-live'], '1', 'and the settled entrance flag with it')

  const retrack = track(el, {})
  assert.ok(!el.attrs.has('data-sv-off'), 'tracking it again takes the marker back off')
  retrack()

  // the marker is only half the contract: without these guards a released
  // element keeps closed curtains over its content, a stacked deck, an
  // unfinished sv-range, an overlapping spread and a sticky, clipping stage,
  // none of which the no-JS rendering has. The e2e invariant proves the
  // computed values.
  const settled = {
    '[data-sv-off] .sv-curtain-l': 'display: none',
    '[data-sv-off] .sv-curtain-r': 'display: none',
    '[data-sv-off] .sv-deck': 'display: block',
    '[data-sv-off] .sv-deck > *': 'translate: none',
    '[data-sv-off] .sv-range > *': '--sv-r: 1',
    '[data-sv-off] .sv-reading > *': 'opacity: 1',
    '[data-sv-off] .sv-rail': 'translate: none',
    '[data-sv-off] .sv-counter': '--sv-int: var(--sv-max, 100)',
    '[data-sv-off] .sv-stage': 'position: static',
    '[data-sv-off] .sv-spread > *': 'translate: none', // core.css, the scrub idiom settles overlapping without it
    // and the same idiom with the tracker ON the spread container, where the
    // marker lands on the .sv-spread itself and no ancestor carries it
    '.sv-spread[data-sv-off] > *': 'translate: none',
  }
  for (const [selector, declaration] of Object.entries(settled)) {
    const rule = ruleFor(selector)
    assert.ok(rule, `the presets settle the released state with a \`${selector}\` rule`)
    assert.ok(rule.body.includes(declaration), `\`${selector}\` declares \`${declaration}\`, got \`${rule.body}\``)
  }

  // Every no-JS guard needs the released twin, or the CHANGELOG claim ("a
  // released element settles to its no-JS rendering") holds for some presets
  // and lies about the rest. The twin must put `[data-sv-off]` where the guard
  // puts its TRACKER, so the two match the same elements: on an ancestor when
  // the guard demands one, and on the target's own head compound when it does
  // not, since a guard with no ancestor requirement also fires when the tracked
  // element IS the target (`<div class="sv sv-spread" data-sv data-sv-travel>`,
  // the documented scrub idiom). Deriving the twin from the selector STRING
  // gave those guards a descendant-only twin that can never fire for them.
  const trackerAncestor = /^:is\(\.sv, \[data-sv\]\)\s+/
  // The one guard that needs no twin, with its reason, so the exemption is a
  // decision and not an accident: this one only re-derives --sv-act from
  // --sv-live, and releaseEntry() writes an inline `--sv-live: 1` on the
  // released element, which lands the same finished value the guard would
  // (`--sv-act: calc(var(--sv-live) * var(--sv-acts-count, 3))`). The e2e
  // release block reads the computed --sv-act against the no-JS page.
  const noTwin = {
    'html:not(.sv-on) .sv-acts:not(.sv-ui)':
      'the inline --sv-live: 1 the release writes already lands the finished --sv-act',
  }
  for (const selector of Object.keys(noTwin)) {
    assert.ok(ruleFor(selector), `the twin exemption names \`${selector}\`, which is not a guard in styles/ any more`)
  }
  for (const rule of guardRules) {
    for (const selector of rule.selectors) {
      if (!selector.startsWith('html:not(.sv-on)') || noTwin[selector]) continue
      const rest = selector.slice('html:not(.sv-on)'.length).trim()
      const target = rest.replace(trackerAncestor, '')
      assert.ok(ruleFor(`[data-sv-off] ${target}`), `\`${selector}\` has its released twin \`[data-sv-off] ${target}\``)
      if (trackerAncestor.test(rest)) continue
      const self = target.replace(/^\S+/, (head) => `${head}[data-sv-off]`)
      assert.ok(
        ruleFor(self),
        `\`${selector}\` needs no tracker ancestor, so it fires when the tracked element IS the target: that case needs the \`${self}\` twin too`
      )
    }
  }

  // a selector list is all-or-nothing in a parser that predates :is()
  // (Firefox below 78 is the only engine inside the floor the @supports block
  // does not already cover): a released guard sharing a rule with an :is()
  // selector is dropped whole, exactly where it must survive
  for (const rule of guardRules) {
    const released = rule.selectors.filter((s) => s.includes('[data-sv-off]'))
    if (!released.length) continue
    const withIs = rule.selectors.filter((s) => s.includes(':is('))
    assert.equal(withIs.length, 0, `\`${released[0]}\` shares a rule with \`${withIs[0]}\`, which drops both pre-:is()`)
  }
})

test('driver: a released ancestor never settles a still-tracked descendant', async () => {
  const { track } = await import('../dist/core/driver.js?nestedrelease')
  // nested trackers are a first-class pattern (styles/core.css: the NEAREST
  // tracker owns spread), and the released marker is read as `[data-sv-off] X`,
  // which matches through any depth: marking the outer one would settle every
  // preset under the inner one while its clock is still running.
  const outer = makeElement(3000)
  const inner = makeElement(3000)
  nest(outer, inner)
  place(outer, -1000)
  place(inner, -1000)
  const stopOuter = track(outer, {})
  const stopInner = track(inner, { pin: true })
  pump()
  assert.equal(inner.vars['--sv-pin'], '0.5000', 'the inner clock runs while both are tracked')

  stopOuter()
  assert.ok(!outer.attrs.has('data-sv-off'), 'a released ancestor stays unmarked while a descendant is still tracked')
  assert.ok(!inner.attrs.has('data-sv-off'), 'and the descendant is never marked by another entry release')
  place(inner, -500)
  pump()
  assert.equal(inner.vars['--sv-pin'], '0.2500', 'the inner clock keeps running after the outer release')

  stopInner()
  assert.ok(inner.attrs.has('data-sv-off'), 'releasing the inner tracker marks it')
  assert.ok(outer.attrs.has('data-sv-off'), 'and the ancestor waiting on it takes its marker then, or its own presets freeze for good')

  // the other order: a marked ancestor must not settle a tracker that starts
  // under it later (stopScan() then a re-mount of one section)
  const restart = track(inner, { pin: true })
  assert.ok(!inner.attrs.has('data-sv-off'), 'tracking takes the marker off the element')
  assert.ok(!outer.attrs.has('data-sv-off'), 'and off its whole ancestor chain, whose marker reaches it just as well')
  restart()
})

test('driver: a `once` descendant settling hands the waiting ancestor its marker', async () => {
  // a query string this file uses nowhere else: the same one twice hands the
  // second test the FIRST test's module instance, whose scroll listener was
  // overwritten by every later import, so nothing it tracks ever updates
  const { track } = await import('../dist/core/driver.js?oncedescendant')
  // a fire-and-forget `once` entry leaves `entries` inside apply(), not through
  // releaseEntry(): the second exit from the map. An ancestor released while it
  // was still tracked waits on it, and without the sweep on that path it waits
  // forever, its stage sticky and clipping with the curtains over the content.
  const outer = makeElement(3000)
  const inner = makeElement(400)
  nest(outer, inner)
  place(outer, -1000)
  place(inner, 2000) // below the live band: not latched yet
  const stopOuter = track(outer, { pin: true })
  const stopInner = track(inner, { once: true })
  pump()

  stopOuter()
  assert.ok(!outer.attrs.has('data-sv-off'), 'the ancestor waits while the once descendant is still tracked')

  place(inner, 300) // into the band: `once` latches and the entry settles itself out
  pump()
  assert.ok(inner.classes.has('sv-live'), 'the once entry latched live')
  assert.ok(outer.attrs.has('data-sv-off'), 'and its settle hands the waiting ancestor the marker')
  assert.ok(!inner.attrs.has('data-sv-off'), 'while the settled element itself stays live, never released')

  stopInner() // the handle is stale (the settle already left the map), and changes nothing
  assert.ok(outer.attrs.has('data-sv-off'), 'the stale untrack handle leaves the ancestor marked')
})

test('driver: an ancestor that gives up its marker for a new tracker takes it back', async () => {
  const { track } = await import('../dist/core/driver.js?clearrelease')
  // a released shell (stopScan(), a Boot unmount) with one section re-mounting
  // inside it: track() strips the marker off the whole chain so the new clock
  // is not settled static, and the shell is still released, so it must take the
  // marker back as soon as that section goes again.
  const outer = makeElement(3000)
  place(outer, -1000)
  const stopOuter = track(outer, { pin: true })
  pump()
  stopOuter()
  assert.ok(outer.attrs.has('data-sv-off'), 'released with nothing inside, the shell is marked')

  const inner = makeElement(3000)
  nest(outer, inner)
  place(inner, -1000)
  const stopInner = track(inner, { pin: true })
  assert.ok(!outer.attrs.has('data-sv-off'), 'a tracker starting under it takes the marker off the chain')
  pump()
  assert.equal(inner.vars['--sv-pin'], '0.5000', 'so the re-mounted section animates')

  stopInner()
  assert.ok(inner.attrs.has('data-sv-off'), 'the section is marked when it goes')
  assert.ok(outer.attrs.has('data-sv-off'), 'and the shell takes its marker back, or its own presets freeze for good')

  // the same one level deeper: the chain walk clears an untracked middle node
  // too, and that node was never released, so only the shell comes back
  const shell = makeElement(3000)
  const middle = makeElement(3000)
  const leaf = makeElement(3000)
  nest(shell, middle)
  nest(middle, leaf)
  place(shell, -1000)
  place(leaf, -1000)
  const stopShell = track(shell, { pin: true })
  pump()
  stopShell()
  const stopLeaf = track(leaf, { pin: true })
  assert.ok(!shell.attrs.has('data-sv-off'), 'a grandchild tracker unmarks the shell too')
  pump()
  stopLeaf()
  assert.ok(shell.attrs.has('data-sv-off'), 'and the shell takes its marker back when the grandchild goes')
  assert.ok(!middle.attrs.has('data-sv-off'), 'the untracked node in between was never released and stays bare')
})

test('styles/pin.css: below the individual-transform floor the deck unstacks, the curtains open and the stage releases, with JS on', () => {
  // Chrome 88-103, Firefox 60-71, Safari 13-14.0 run the driver, so html.sv-on
  // is on and the no-JS guards cannot fire, while translate/rotate/scale are
  // dropped and the deck's grid stacking (plain layout) survives on its own.
  const block = pinCss.match(/@supports\s+not\s*\(\s*translate:\s*0\s*\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(block, 'pin.css carries an `@supports not (translate: 0)` block')
  const rules = rulesOf(block[1])
  const deck = rules.find((rule) => rule.selectors.includes('.sv .sv-deck'))
  assert.ok(deck && deck.body.includes('display: block'), `the deck unstacks: ${deck?.body}`)
  for (const side of ['l', 'r']) {
    const curtain = rules.find((rule) => rule.selectors.includes(`.sv .sv-curtain-${side}`))
    // `transform`, not the no-JS `display: none`: scrollvars/compat's fallback
    // sheet re-expresses these panels with the same property and is appended
    // later, so it still outranks this and animates them down there
    assert.ok(curtain && /transform:\s*translateX\(/.test(curtain.body), `curtain-${side} opens: ${curtain?.body}`)
  }
  // ADU-149: unstacking the deck is not enough on its own. `.sv-stage` keeps
  // `position: sticky; height: 100vh; overflow: hidden` (its base rule),
  // whose only escapes used to be the no-JS, released and reduced-motion
  // guards, never this block: an unstacked deck taller than one viewport
  // still clipped past the first card. The block must release the stage
  // the same way its reduced-motion twin already does.
  // ADU-168: scoped to a page WITHOUT compat() since round 7. compat's fallback
  // sheet animates the curtains and the rail from --sv-pin, which is computed
  // from the very skeleton this rule releases, so a release that ignored the
  // marker disarmed the module it shares the floor with.
  const stage = rules.find((rule) => rule.selectors.includes('html:not([data-sv-compat]) .sv-stage'))
  assert.ok(stage, 'the block resets `.sv-stage`, or an unstacked deck taller than one viewport still clips')
  for (const declaration of ['position: static', 'height: auto', 'overflow: visible']) {
    assert.ok(stage.body.includes(declaration), `\`.sv-stage\` declares \`${declaration}\`, got \`${stage.body}\``)
  }
})

test('driver: an onTravel or an onPin that untracks its own element gets no write and no later callback', async () => {
  const { track } = await import('../dist/core/driver.js?callbackguard')

  // onTravel runs before the pin and scene writes: an untrack there must stop
  // the frame right where it is, or --sv-pin/--sv-scene land inline on an
  // element releaseEntry has already cleaned up, and stay there forever
  const travelEl = makeElement(3000)
  place(travelEl, -1000)
  const travelScenes = []
  let stopTravel = () => {}
  stopTravel = track(travelEl, {
    travel: true,
    pin: true,
    scenes: 4,
    onTravel: () => stopTravel(),
    onScene: (i) => travelScenes.push(i),
  })
  pump()
  assert.ok(!('--sv-t' in travelEl.vars), 'the release cleaned up the var written before the callback')
  assert.ok(!('--sv-pin' in travelEl.vars), 'no --sv-pin written after the untrack returned')
  assert.ok(!('--sv-scene' in travelEl.vars), 'no --sv-scene either')
  assert.deepEqual(travelScenes, [], 'and no onScene for a callback that already released this entry')

  // same one step later: onPin runs before the scene block
  const pinEl = makeElement(3000)
  place(pinEl, -1000)
  const pinScenes = []
  let stopPin = () => {}
  stopPin = track(pinEl, {
    pin: true,
    scenes: 4,
    onPin: () => stopPin(),
    onScene: (i) => pinScenes.push(i),
  })
  pump()
  assert.ok(!('--sv-pin' in pinEl.vars), 'the release cleaned up the pin clock it had just written')
  assert.ok(!('--sv-scene' in pinEl.vars), 'no --sv-scene written after the untrack returned')
  assert.deepEqual(pinScenes, [], 'and no onScene')
})

test('driver: re-tracking a settled once element clears the stale sv-live, so the entrance replays', async () => {
  const { track } = await import('../dist/core/driver.js?onceretrackflag')
  const el = makeElement(400)
  place(el, 300) // inside the band on the first frame: once latches and settles
  const stop = track(el, { once: true })
  pump()
  assert.ok(el.classes.has('sv-live'), 'the once entry latched live and released itself')
  stop() // stale: the once branch already left the map, so this is a no-op
  assert.ok(el.classes.has('sv-live'), 'the settled class survives that stale untrack')

  place(el, 2000) // far below the band again, the way a route change re-mounts it
  const stop2 = track(el, { once: true })
  assert.ok(!el.classes.has('sv-live'), 're-tracking clears the class the settled entry left behind')
  assert.ok(!('--sv-live' in el.vars), 'and the inline flag with it')
  pump()
  assert.ok(!el.classes.has('sv-live'), 'the DOM and the driver agree: outside the band, not live')
  place(el, 300)
  pump()
  assert.ok(el.classes.has('sv-live'), 'so the entrance replays when it enters the band again')
  assert.equal(el.vars['--sv-live'], '1')
  stop2()
})

test('driver: the reduced-motion listener falls back to addListener (MediaQueryList below Safari 14)', async () => {
  let legacyListener
  const realMatchMedia = window.matchMedia
  window.matchMedia = () => ({ matches: false, addListener: (fn) => (legacyListener = fn) })
  const { track } = await import('../dist/core/driver.js?addlistener')
  const el = makeElement(400)
  const untrack = track(el, {}) // init() reads matchMedia here
  assert.equal(typeof legacyListener, 'function', 'the listener landed through the legacy addListener')

  place(el, 875) // halfway down the enter ramp
  pump()
  assert.equal(el.vars['--sv-view'], '-0.5000')
  legacyListener({ matches: true })
  pump()
  assert.equal(el.vars['--sv-view'], '0.0000', 'the preference reaches the driver through that listener')
  legacyListener({ matches: false })
  untrack()
  window.matchMedia = realMatchMedia
})

test('driver: scrollToScene jumps instead of gliding under reduced motion', async () => {
  const realMatchMedia = window.matchMedia
  window.matchMedia = () => ({ matches: true, addEventListener: () => {} })
  const { track, scrollToScene } = await import('../dist/core/driver.js?reducedscene')
  const el = makeElement(3000)
  const untrack = track(el, {}) // init() reads matchMedia here
  pump()

  scrollToScene(el, 2, 4) // smooth defaults to true
  assert.equal(window.lastScrollTo.behavior, 'instant', 'reduced motion outranks the caller\'s smooth')

  untrack()
  window.matchMedia = realMatchMedia
})

test('driver: prefersReducedMotion() reads the media query before the first track() (ADU-157)', async () => {
  const realMatchMedia = window.matchMedia
  window.matchMedia = () => ({ matches: true, addEventListener: () => {} })
  const { prefersReducedMotion } = await import('../dist/core/driver.js?prefersbeforetrack')
  assert.equal(prefersReducedMotion(), true, 'correct before anything is ever tracked, not the stale default')
  window.matchMedia = realMatchMedia
})

test('driver: scrollToScene() jumps under reduced motion even before the first track() (ADU-157)', async () => {
  const realMatchMedia = window.matchMedia
  window.matchMedia = () => ({ matches: true, addEventListener: () => {} })
  const { scrollToScene } = await import('../dist/core/driver.js?scrollscenebeforetrack')
  const el = makeElement(3000)
  scrollToScene(el, 2, 4) // smooth defaults to true, and nothing was ever tracked
  assert.equal(window.lastScrollTo.behavior, 'instant', 'reduced motion outranks smooth before any track() too')
  window.matchMedia = realMatchMedia
})

test('driver: below the individual-transform floor the pin helper writes no tall wrapper height (ADU-158)', async () => {
  // styles/pin.css releases `.sv-stage` there (`@supports not (translate: 0)`:
  // position static, height auto, overflow visible), so the section renders at
  // its natural height. A tall inline wrapper height on top of that is two
  // blank viewports under the content, with JS on, exactly what the README's
  // "below the floor nothing breaks" promises does not happen. Same branch as
  // reduced motion: leave the authored height alone.
  window.CSS = { supports: (prop) => prop !== 'translate' }
  const { track } = await import('../dist/core/driver.js?transformfloor')
  const el = makeElement(400)
  el.style.height = '' // no authored height: the pin helper is the only writer
  const untrack = track(el, { pin: '320vh' })
  assert.equal(el.style.height, '', 'no 320vh wrapper below the floor')
  untrack()

  // and the same helper still writes it where the presets actually animate
  window.CSS = { supports: () => true }
  const above = makeElement(400)
  above.style.height = ''
  const stopAbove = track(above, { pin: '320vh' })
  assert.equal(above.style.height, '320vh', 'above the floor the tall wrapper is still the whole skeleton')
  stopAbove()

  // an engine with no CSS.supports at all is below the @supports floor too:
  // the stage is never released there, so the skeleton stays whole
  delete window.CSS
  const ancient = makeElement(400)
  ancient.style.height = ''
  const stopAncient = track(ancient, { pin: '320vh' })
  assert.equal(ancient.style.height, '320vh', 'no answer is not a false: the tall wrapper stays')
  stopAncient()
})

test('driver: every released guard also fires when the tracked element IS the target (ADU-168)', async () => {
  // `data-sv-off` lands on the element whose tracker stopped. A guard written
  // only as `[data-sv-off] X` asks for the marker on an ANCESTOR, so a tracked
  // element carrying the preset class itself (a nested tracker on a `.sv-deck`,
  // the documented scrub idiom on a `.sv-spread`) never settles: its cards stay
  // stacked over each other with the clock gone. `.sv-stage[data-sv-off]`
  // already carried the shape, alone, for the one guard whose animated rule
  // needs no tracker ancestor either.
  let audited = 0
  for (const rule of guardRules) {
    for (const selector of rule.selectors) {
      if (!selector.startsWith('[data-sv-off] ')) continue
      const target = selector.slice('[data-sv-off] '.length).trim()
      const self = target.replace(/^\S+/, (head) => `${head}[data-sv-off]`)
      const twin = ruleFor(self)
      assert.ok(twin, `\`${selector}\` needs its self twin \`${self}\`, or a tracker released ON the target never settles`)
      assert.equal(twin.body, rule.body, `\`${self}\` settles exactly what \`${selector}\` settles`)
      audited++
    }
  }
  assert.ok(audited >= 9, `the audit found ${audited} released guards, so it is reading the sheets`)
})

test('driver: a motion flip reads every pinned position before it writes any of them (ADU-168)', async () => {
  // README: "inside the driver, layout thrashing is impossible by construction".
  // A computed-style read after an inline write in the same tick flushes a style
  // recalc. Reading before writing on the SAME element is free (the height
  // cannot change the computed position), but the pin helper runs once per
  // entry in a loop when the motion preference changes, and there the write on
  // entry N invalidates the style the read on entry N+1 asks for: ordering
  // inside the helper takes N flushes to N-1, not to zero. Three entries, so
  // the difference is visible; one entry cannot tell the two apart.
  window.CSS = { supports: () => true }
  const log = []
  global.getComputedStyle = () => {
    log.push('read')
    return { getPropertyValue: () => '', position: 'static' }
  }
  let motionListener
  const realMatchMedia = window.matchMedia
  // both listener pairs, like every real MediaQueryList
  window.matchMedia = () => ({
    matches: false,
    addEventListener: (_type, fn) => (motionListener = fn),
    removeEventListener: () => {},
    addListener: (fn) => (motionListener = fn),
    removeListener: () => {},
  })
  const { track } = await import('../dist/core/driver.js?pinreadorder')
  const instrument = (el, name) => {
    let height = ''
    let position = ''
    Object.defineProperty(el.style, 'height', {
      configurable: true,
      get: () => height,
      set: (value) => {
        log.push(`write ${name} height`)
        height = value
      },
    })
    Object.defineProperty(el.style, 'position', {
      configurable: true,
      get: () => position,
      set: (value) => {
        log.push(`write ${name} position`)
        position = value
      },
    })
    return el
  }
  const els = [instrument(makeElement(400), 'p1'), instrument(makeElement(400), 'p2'), instrument(makeElement(400), 'p3')]
  const untracks = els.map((el) => track(el, { pin: '320vh' }))
  assert.equal(typeof motionListener, 'function', 'init() registered the motion listener this test flips')
  for (const el of els) {
    assert.equal(el.style.height, '320vh', 'the helper still writes the skeleton it is being timed on')
    assert.equal(el.style.position, 'relative', 'and still gives a static wrapper its containing block')
  }
  assert.ok(log.includes('read'), 'the helper really did ask for the computed position')

  log.length = 0
  motionListener({ matches: true }) // reduce: restore the authored skeleton, no read is owed
  assert.equal(log.filter((step) => step === 'read').length, 0, `reduce needs no computed position, got ${log.join(' → ')}`)

  log.length = 0
  motionListener({ matches: false }) // back to motion: the loop that used to interleave
  assert.equal(log.filter((step) => step === 'read').length, 3, `one read per pinned entry, got ${log.join(' → ')}`)
  assert.ok(
    log.lastIndexOf('read') < log.findIndex((step) => step.startsWith('write')),
    `every read happens before the first write of the whole pass, got ${log.join(' → ')}`
  )
  for (const el of els) assert.equal(el.style.height, '320vh', 'and the pass still rebuilt every skeleton')

  untracks.forEach((untrack) => untrack())
  window.matchMedia = realMatchMedia
  delete global.getComputedStyle
  delete window.CSS
})
