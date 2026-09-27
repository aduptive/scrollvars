import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lifecycleEnv } from './lifecycle-fixture.mjs'

// A stub for `document.getElementsByClassName`, live like the real thing:
// `.length` and index access both recompute against the CURRENT tree on
// every read, through a Proxy, since toggles()'s pre-check stores the
// collection once at setup and reads it again on every later mutation.
const liveByClass = (doc, cls) => new Proxy({}, {
  get(_t, prop) {
    const list = doc.querySelectorAll(`.${cls}`)
    if (prop === 'length') return list.length
    const i = Number(prop)
    return Number.isNaN(i) ? undefined : list[i]
  },
})

test('toggles: a marquee track pauses off screen or with the tab hidden, independent of the user pause button', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marquee')
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    root.append(track)
    const stop = toggles(root)

    const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
    assert.ok(io, 'a marquee track gets an IntersectionObserver')
    assert.ok(io.targets.has(track))
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'starts on screen')

    io.cb([{ target: track, isIntersecting: false }])
    assert.ok(track.classes.has('sv-marquee-offscreen'), 'paused off screen')
    io.cb([{ target: track, isIntersecting: true }])
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'resumes back on screen')

    document.hidden = true
    document.fire('visibilitychange')
    assert.ok(track.classes.has('sv-marquee-offscreen'), 'paused while the tab is hidden, even on screen')
    document.hidden = false
    document.fire('visibilitychange')
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'resumes once the tab is visible again')

    // the user's own pause button is a separate class: both can be set independently
    track.classList.add('sv-paused')
    assert.ok(track.classes.has('sv-paused') && !track.classes.has('sv-marquee-offscreen'))

    stop()
    assert.ok(!io.targets.has(track), 'stop() unobserves the track')
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'stop() clears the offscreen class')
  } finally { env.restore() }
})

test('toggles: stopping the last marquee releases the shared observer and visibilitychange listener (packed-acceptance remount baseline)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marquerelease')
    const before = env.baseline()
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    root.append(track)
    const stop = toggles(root)
    const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
    assert.ok(io)
    assert.ok(env.baseline()[0] > before[0], 'a document visibilitychange listener is registered')
    assert.ok(env.baseline()[1] > before[1], 'the shared IntersectionObserver is tracked as live')
    stop()
    assert.deepEqual(env.baseline(), before, 'nothing left behind once the last marquee stops')
  } finally { env.restore() }
})

test('toggles: a second marquee mounted after the first releases keeps its own fresh observer', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marquecycle')
    const before = env.baseline()
    for (let i = 0; i < 3; i++) {
      const root = env.element(), track = env.element()
      track.classList.add('sv-marquee-track')
      root.append(track)
      const stop = toggles(root)
      assert.ok(track.classes.has('sv-marquee-track'))
      stop()
      assert.deepEqual(env.baseline(), before, `cycle ${i}: returns to baseline`)
    }
  } finally { env.restore() }
})

test('toggles: an IntersectionObserver constructor failure does not strand a marquee track behind the has() guard forever (auxiliary failure)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marqueaux')
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    root.append(track)

    const error = Error('IntersectionObserver constructor')
    const workingIO = global.IntersectionObserver
    global.IntersectionObserver = class { constructor() { throw error } }
    assert.throws(() => toggles(root), (e) => e === error)
    assert.deepEqual(env.baseline(), [0, 0, 0, 0], 'the failed attempt leaves nothing running')

    global.IntersectionObserver = workingIO
    const stop = toggles(root)
    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io, 'a later healthy toggles() call picks the track up, not stuck behind watchMarquee()\'s own has() guard')
    assert.ok(io.targets.has(track))
    stop()
    assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

test('toggles: two scopes registering the same track release only on the second stop, in either order (ADU-354 blocker 2)', async () => {
  for (const order of ['outer-then-inner', 'inner-then-outer']) {
    const env = lifecycleEnv()
    try {
      const { toggles } = await import('../dist/core/toggles.js?pr2marqueelease-' + order)
      const track = env.element()
      track.classList.add('sv-marquee-track')
      // Boot's document-wide scan (outer) and a Marquee's own toggles(node)
      // (inner) both find the same track: two independent roots that both
      // resolve it, the shape a real page produces.
      const outerRoot = env.element(), innerRoot = env.element()
      outerRoot.append(track)
      innerRoot.append(track)
      const stopOuter = toggles(outerRoot)
      const stopInner = toggles(innerRoot)
      const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
      assert.ok(io.targets.has(track), 'one shared observer entry for both scopes')

      const [first, second] = order === 'outer-then-inner' ? [stopOuter, stopInner] : [stopInner, stopOuter]
      first()
      assert.ok(io.targets.has(track), 'still observed: the other scope still owns a lease')
      assert.ok(!track.classes.has('sv-marquee-offscreen'), 'the class the other scope relies on survives the first stop')
      second()
      assert.ok(!io.targets.has(track), 'unobserved exactly once, after the second (last) stop')
    } finally { env.restore() }
  }
})

test('toggles: a track removed from the document is pruned on its next IntersectionObserver delivery, not kept by a lease that never released it', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marqueprune')
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    root.append(track)
    const stop = toggles(root) // this scope never calls stop(): models Boot, which lives forever
    const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track))

    // the track leaves the document some other way (an SPA router wiping
    // DOM outside React's own unmount path), never through this scope's stop()
    track.isConnected = false
    io.cb([{ target: track, isIntersecting: false }])
    assert.ok(!io.targets.has(track), 'the detached track is unobserved on its next IO delivery')
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'and its class is cleared')
    // the shared marquee observer releases too (no track left to watch); the
    // scope's own click listener is unrelated and still lives, this scope
    // models Boot, which is never stopped
    assert.equal(env.baseline()[1], 0, 'the shared IntersectionObserver is no longer tracked as live')
    stop()
  } finally { env.restore() }
})

test('toggles: a track detached while already offscreen is swept on the next marquee registration, with no IO delivery of its own (N7)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marquesweep')
    const root = env.element(), track1 = env.element()
    track1.classList.add('sv-marquee-track')
    root.append(track1)
    const stop = toggles(root) // Boot-like scope, never stopped
    const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track1))

    // track1 goes offscreen normally
    io.cb([{ target: track1, isIntersecting: false }])
    assert.ok(track1.classes.has('sv-marquee-offscreen'))

    // then it is removed from the document while already offscreen: a real
    // IntersectionObserver never delivers another record for it (no
    // intersection transition), so the only per-target prune path (the IO
    // callback) never runs for track1 itself.
    track1.isConnected = false

    // a second marquee registers under an unrelated root: this must sweep
    // the whole lease map, not only the track it is registering, and prune
    // track1 with no IO delivery naming it.
    const root2 = env.element(), track2 = env.element()
    track2.classList.add('sv-marquee-track')
    root2.append(track2)
    const stop2 = toggles(root2)
    assert.ok(!io.targets.has(track1), 'track1 is unobserved by the sweep, with no IO delivery of its own')

    stop2()
    stop()
  } finally { env.restore() }
})

test('toggles: a track detached, pruned and reattached under a NEW scope is not disturbed by the OLD scope stopping later (verifier round 1)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2marquegen')
    const oldRoot = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    oldRoot.append(track)
    const stopOld = toggles(oldRoot) // registers the track: lease generation 1
    const io = [...env.deliveries].find(d => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track))

    // the track leaves the document (an SPA router wiping DOM), gets pruned
    // on the next IO delivery, exactly like the test above
    track.isConnected = false
    io.cb([{ target: track, isIntersecting: false }])
    assert.ok(!io.targets.has(track), 'pruned while detached')

    // it comes back (a client-side navigation re-renders the same node, or
    // a real DOM element is reused): a NEW scope registers it, generation 2
    track.isConnected = true
    const newRoot = env.element()
    newRoot.append(track)
    const stopNew = toggles(newRoot)
    const io2 = [...env.deliveries].filter(d => d.kind === 'IntersectionObserver').pop()
    assert.ok(io2.targets.has(track), 'the fresh registration observes the track again')

    // the OLD scope's stop() finally runs, well after the reattach: its
    // release belongs to generation 1 and must not touch generation 2's lease
    stopOld()
    assert.ok(io2.targets.has(track), 'the new registration keeps its lease: the stale release from before the prune is a no-op')
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'no offscreen class regression from the stale release')

    // the new (and only remaining) scope's own state still works correctly
    io2.cb([{ target: track, isIntersecting: false }])
    assert.ok(track.classes.has('sv-marquee-offscreen'), 'the new lease still drives the offscreen class correctly')
    io2.cb([{ target: track, isIntersecting: true }])
    assert.ok(!track.classes.has('sv-marquee-offscreen'))

    stopNew()
    assert.deepEqual(env.baseline(), [0, 0, 0, 0], 'stopping the real owner releases everything')
  } finally { env.restore() }
})

test('toggles: a scope with no marquee track never creates an IntersectionObserver', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2nomarquee')
    const root = env.element()
    const stop = toggles(root)
    assert.equal([...env.deliveries].filter(d => d.kind === 'IntersectionObserver').length, 0)
    stop()
  } finally { env.restore() }
})

test('toggles: a controlled marquee track never gets sv-ui without native inert (T1, ADU-355)', async () => {
  // Below Chrome 102 / Firefox 112 / Safari 15.5 (inside the README floor,
  // Firefox 78-111 and Safari 14.1-15.4), `inert` is inert in name only: the
  // duplicate's own tabbable content would stay reachable behind an animated
  // strip if sv-ui ever turned ui.css's static branch off. No HTMLElement
  // global here models that gap.
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?inertgate-no')
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    const trigger = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': '.sv-marquee-track' })
    root.append(trigger)
    root.append(track)
    const stop = toggles(root)
    assert.ok(!track.classes.has('sv-ui'), 'no inert: ui.css keeps the strip static and the dup hidden')
    stop()
  } finally { env.restore() }
})

test('toggles: a controlled marquee track gets sv-ui once native inert is supported', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?inertgate-yes')
    const root = env.element(), track = env.element()
    track.classList.add('sv-marquee-track')
    const trigger = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': '.sv-marquee-track' })
    root.append(trigger)
    root.append(track)
    const stop = toggles(root)
    assert.ok(track.classes.has('sv-ui'), 'inert supported: the pause button is wired, ui.css turns the strip on')
    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

test('toggles: two controlled marquees under one scope pause independent tracks (N4a, loop8-4 review)', async () => {
  // Before N4a, resolve() looked up `data-sv-target` against the WHOLE
  // scope (`scope.querySelector(selector)`): two marquees sharing the
  // class selector `.sv-marquee-track` both resolved to the FIRST track
  // on the page, so a click on the second marquee's own pause button
  // silently paused the first, and the second's button stayed hidden
  // (no sv-ui ever landed on its own track through the FIRST one's
  // bootTrigger call). A trigger nested in its own `.sv-marquee` wrapper
  // must resolve INSIDE that wrapper first.
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?n4aresolve')
    const root = env.element()
    const marquee = () => {
      const wrap = env.element()
      wrap.classList.add('sv-marquee')
      const track = env.element()
      track.classList.add('sv-marquee-track')
      const button = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': '.sv-marquee-track' })
      wrap.append(track)
      wrap.append(button)
      root.append(wrap)
      return { wrap, track, button }
    }
    const m1 = marquee()
    const m2 = marquee()
    const stop = toggles(root)

    root.fire('click', { target: m2.button })
    assert.ok(m2.track.classes.has('sv-paused'), 'clicking the second marquee\'s own button pauses ITS OWN track')
    assert.ok(!m1.track.classes.has('sv-paused'), 'and leaves the first, independent track untouched')

    root.fire('click', { target: m1.button })
    assert.ok(m1.track.classes.has('sv-paused'), 'the first marquee\'s own button still works')
    assert.ok(m2.track.classes.has('sv-paused'), 'the second stays as it was, unaffected by the first click')

    stop()
  } finally { env.restore() }
})

test('toggles: a marquee track holds no strong reference from the document scope\'s release list once nothing else does (T3, mirrors PR #94\'s retention test)', {
  skip: typeof global.gc !== 'function' && 'run with node --expose-gc',
}, async () => {
  // watchMarquee()'s life.defer closure used to capture `track` directly.
  // life.defer's cleanup only runs at the WHOLE scope's stop, which a
  // Boot-owned document scope never reaches, so a direct capture there
  // pinned every track present at setup for the app's life (same shape as
  // R3's marker fix, ADU-354). Pruning already drops the track from
  // marqueeLeases (the map's own key is not the leak); it is the deferred
  // closure sitting unrun in the scope's release list that must not hold on.
  global.window = {}
  global.requestAnimationFrame = () => 1
  let visibilitychange
  global.document = {
    addEventListener: (type, fn) => { if (type === 'visibilitychange') visibilitychange = fn },
    removeEventListener() {},
    hidden: false,
  }
  const { toggles } = await import('../dist/core/toggles.js?t3marqueeretain')
  let track = { classList: { add() {}, remove() {}, toggle() {}, contains() { return false } }, isConnected: true }
  const root = {
    contains: () => true,
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll: (sel) => (sel === '.sv-marquee-track' ? [track] : []),
  }
  toggles(root) // never stopped: models <ScrollVarsBoot>'s document scope

  // the track leaves the document some other way (an SPA router), pruned on
  // the next delivery this fixture can drive without an IntersectionObserver
  track.isConnected = false
  visibilitychange()

  let collected = false
  const registry = new FinalizationRegistry(() => { collected = true })
  registry.register(track, 'track')
  track = null

  for (let attempt = 0; attempt < 10 && !collected; attempt++) {
    await new Promise((resolve) => setImmediate(resolve))
    global.gc()
  }
  assert.ok(collected, 'a direct capture in the never-run release closure would keep the track alive forever')
  delete global.document
})

test('toggles failure: setup rollback preserves semantic state and releases the live registry', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2')
    const root = env.element(), target = env.element({ 'data-sv-toggle': 'open', 'aria-expanded': 'authored' })
    target.classList.add('open', 'sv-acts'); root.append(target)
    target.style.setProperty('--sv-state', 'author')
    target.style.setProperty('--sv-acts-settle', '3s', 'important')
    target.style.setProperty('transition-duration', '2s', 'important')
    const error = Error('late listener'), add = root.addEventListener
    root.addEventListener = (type, fn) => { add(type, fn); throw error }
    assert.throws(() => toggles(root), e => e === error)
    assert.deepEqual(env.baseline(), [0, 0, 0, 0])
    assert.equal(target.getAttribute('aria-expanded'), 'authored')
    assert.ok(target.classes.has('open'))
    assert.equal(target.style.getPropertyValue('--sv-state'), 'author')
    assert.equal(target.style.getPropertyValue('--sv-acts-settle'), '3s')
    assert.equal(target.style.getPropertyPriority('--sv-acts-settle'), 'important')
    root.querySelectorAll = () => { throw Error('failed scope retained in live registry') }
    const healthy = env.element({ 'data-sv-toggle': '' })
    const off = toggles(healthy); healthy.fire('click'); off()
    assert.equal(healthy.getAttribute('aria-expanded'), 'true')
  } finally { env.restore() }
})

test('toggles failure: a partial click rolls back semantics and leaves sibling controllers usable', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2runtime')
    const a = env.element({ 'data-sv-toggle': 'open', open: '' }), b = env.element({ 'data-sv-toggle': '' })
    const off = toggles(a), good = toggles(b), error = Error('ARIA write')
    const set = a.setAttribute
    a.setAttribute = (key, value) => { set(key, value); if (value === 'true') throw error }
    const stale = [...a.handlers.get('click')][0]
    assert.doesNotThrow(() => a.fire('click'))
    assert.deepEqual(env.errors, [error])
    assert.equal(a.getAttribute('aria-expanded'), 'false')
    assert.equal(a.getAttribute('open'), '')
    assert.ok(!a.classes.has('open'))
    stale({ target: a })
    b.fire('click'); assert.equal(b.getAttribute('aria-expanded'), 'true')
    off(); off(); good()
    assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

test('toggles release: 100 cycles cancel settle frames and stale delivery cannot disturb replacement', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2cycles')
    const a = env.element({ 'data-sv-toggle': '' }); a.classList.add('sv-acts')
    for (let i = 0; i < 100; i++) {
      const off = toggles(a), stale = [...env.frames.values()]
      off(); off()
      assert.deepEqual(env.baseline(), [0, 0, 0, 0])
      const replacement = toggles(a), before = env.baseline()
      stale.forEach(fn => fn())
      assert.deepEqual(env.baseline(), before)
      assert.equal(a.style.getPropertyValue('--sv-acts-settle'), '0s')
      replacement()
    }
  } finally { env.restore() }
})

test('toggles release: stopping the settle owner does not disable a surviving controller transition', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2shared')
    const a = env.element({ 'data-sv-toggle': '' }); a.classList.add('sv-acts')
    a.style.setProperty('transition-duration', '2s', 'important')
    const first = toggles(a), second = toggles(a)
    first(); env.flush(); env.flush()
    assert.equal(a.style.getPropertyValue('transition-duration'), '2s')
    assert.equal(a.style.getPropertyValue('--sv-acts-settle'), '')
    assert.ok(a.classes.has('sv-ui'))
    a.fire('click'); assert.equal(a.getAttribute('aria-expanded'), 'true')
    second(); assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

test('toggles failure: a broken sibling scope cannot stop a healthy click', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?pr2sibling')
    const a = env.element({ 'data-sv-toggle': '' }), b = env.element({ 'data-sv-toggle': '' }), error = Error('sibling query')
    const first = toggles(a), second = toggles(b)
    b.querySelectorAll = () => { throw error }
    a.fire('click')
    assert.equal(a.getAttribute('aria-expanded'), 'true')
    assert.ok(a.classes.has('sv-open'))
    assert.deepEqual(env.errors, [error])
    a.fire('click'); assert.equal(a.getAttribute('aria-expanded'), 'false')
    first(); second(); assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

function makeElement(attrs = {}) {
  const el = {
    attrs: { ...attrs },
    vars: {},
    priorities: {},
    classes: new Set(),
    classList: {
      remove(c) { el.classes.delete(c) },
      add(c) {
        el.classes.add(c)
      },
      contains(c) {
        return el.classes.has(c)
      },
      toggle(c) {
        if (el.classes.has(c)) {
          el.classes.delete(c)
          return false
        }
        el.classes.add(c)
        return true
      },
    },
    style: {
      setProperty(k, v, priority = '') {
        el.vars[k] = v
        el.priorities[k] = priority
      },
      removeProperty(k) {
        delete el.vars[k]
        delete el.priorities[k]
      },
      // real inline longhands round-trip through these two, never through
      // a shorthand: the boot settle reads/writes transition-duration this
      // way only (ADU-104, round 5 finding)
      getPropertyValue(k) {
        return el.vars[k] ?? ''
      },
      getPropertyPriority(k) {
        return el.priorities[k] ?? ''
      },
    },
    getAttribute: (k) => el.attrs[k] ?? null,
    setAttribute: (k, v) => (el.attrs[k] = v),
    closest: (sel) => (sel === '[data-sv-toggle]' && 'data-sv-toggle' in el.attrs ? el : null),
  }
  // style.transition (the shorthand) is frozen at undefined: the boot settle
  // must never read or write it (ADU-104, round 4 finding 2). A regression
  // that assigns to it throws here (strict mode, ES modules) instead of
  // silently passing.
  Object.defineProperty(el.style, 'transition', { value: undefined, writable: false })
  return el
}

test('toggles release enhancement only after the last controller stops', async () => {
  global.window = {}
  const frames = []
  global.requestAnimationFrame = fn => frames.push(fn)
  const { toggles } = await import('../dist/core/toggles.js?round12release')
  for (const reverse of [false, true]) {
    const target = makeElement({ 'data-sv-toggle': '' })
    target.classes.add('sv-acts')
    target.style.setProperty('transition-duration', '2s', 'important')
    const root = { contains: () => true, querySelectorAll: () => [target], addEventListener() {}, removeEventListener() {} }
    const stops = [toggles(root), toggles(root)]
    if (reverse) stops.reverse()
    stops[0]()
    stops[0]()
    assert.ok(target.classes.has('sv-ui'))
    stops[1]()
    assert.ok(!target.classes.has('sv-ui'))
    assert.equal(target.vars['--sv-acts-settle'], undefined)
    assert.equal(target.vars['transition-duration'], '2s')
    assert.equal(target.priorities['transition-duration'], 'important')
    while (frames.length) frames.shift()()
    assert.ok(!target.classes.has('sv-ui'))
  }
})

test('toggles: class + --sv-state + aria-expanded, custom target, stop()', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1 // the boot-settle transition hold schedules these
  const { toggles } = await import('../dist/core/toggles.js')

  const menu = makeElement()
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: () => [trigger],
  }
  menu.classList.contains = (c) => menu.classes.has(c)

  const stop = toggles(root)
  const click = (target) => listeners.click({ target })

  // on
  click(trigger)
  assert.ok(menu.classes.has('open'))
  assert.equal(menu.vars['--sv-state'], '1')
  assert.equal(trigger.attrs['aria-expanded'], 'true')

  // off
  click(trigger)
  assert.ok(!menu.classes.has('open'))
  assert.equal(menu.vars['--sv-state'], '0')
  assert.equal(trigger.attrs['aria-expanded'], 'false')

  // no data-sv-toggle → ignored
  const bystander = makeElement()
  click(bystander)
  assert.ok(!menu.classes.has('open'))

  // no target attr → the trigger itself, default class sv-open
  const solo = makeElement({ 'data-sv-toggle': '' })
  click(solo)
  assert.ok(solo.classes.has('sv-open'))
  assert.equal(solo.vars['--sv-state'], '1')

  stop()
  assert.ok(!listeners.click, 'listener removed')
})

test('toggles: a clicked target holds no strong reference once nothing else does (R3)', { skip: typeof global.gc !== 'function' && 'run with node --expose-gc' }, async () => {
  // Under <ScrollVarsBoot> the document scope never stops, so a strong Set
  // of clicked targets (`mark()`'s `targets`) would hold every one, detached
  // subtree included, for the app's whole life, growing with every
  // navigation. `targets` is a WeakSet now: nothing outside this instance
  // keeping a reference is the only thing that should keep the target alive.
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?r3weakset')
  let menu = makeElement()
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: () => [trigger],
  }
  menu.classList.contains = (c) => menu.classes.has(c)
  const stop = toggles(root)
  listeners.click({ target: trigger }) // resolves and marks `menu` as a target

  let collected = false
  const registry = new FinalizationRegistry(() => { collected = true })
  registry.register(menu, 'menu')
  root.querySelector = () => null // drop the last other reference to it
  menu = null

  for (let attempt = 0; attempt < 10 && !collected; attempt++) {
    await new Promise((resolve) => setImmediate(resolve))
    global.gc()
  }
  assert.ok(collected, 'a strong Set would keep the clicked target alive forever; a WeakSet must not')
  stop()
})

test('toggles: markers settle, release and delete correctly when WeakRef is unavailable (fallback path)', async () => {
  // Below Chrome 84 / Firefox 79 / Safari 14.1, `weakRef()` falls back to
  // `{ deref: () => el }`, a plain closure. This proves that fallback
  // actually resolves to the real target through settle/release/delete,
  // not the naive mistake of a deref that always returns undefined (which
  // would silently skip every settle and release forever).
  const realWeakRef = global.WeakRef
  delete global.WeakRef
  global.window = {}
  const queue = []
  global.requestAnimationFrame = (fn) => (queue.push(fn), queue.length)
  try {
    const { toggles } = await import('../dist/core/toggles.js?r3weakreffallback')
    const target = makeElement()
    target.classList.add('sv-acts') // the only class with a settle to prove
    target.classList.contains = (c) => target.classes.has(c)
    const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#panel' })
    const listeners = {}
    const root = {
      contains: () => true,
      addEventListener: (t, fn) => (listeners[t] = fn),
      removeEventListener: (t) => delete listeners[t],
      querySelector: (sel) => (sel === '#panel' ? target : null),
      querySelectorAll: () => [trigger],
    }
    const stop = toggles(root)
    assert.ok(target.classes.has('sv-ui'), 'boot marks the resolved target through the fallback ref')
    assert.equal(target.vars['--sv-acts-settle'], '0s', 'the boot settle hold is applied through the fallback ref')

    // the settle is two nested rAFs (frame(() => frame(() => {...}))): each
    // flush may enqueue the next, so drain until nothing is left
    while (queue.length) queue.shift()()
    assert.equal(target.vars['--sv-acts-settle'], undefined, 'settle() restores through the fallback ref, not a broken deref')

    stop()
    assert.ok(!target.classes.has('sv-ui'), 'release() removes sv-ui through the fallback ref on stop, and the owner-decrement deletes the marker')
  } finally {
    if (realWeakRef) global.WeakRef = realWeakRef
  }
})

test('toggles: aria-expanded reflects the target on boot and across every trigger of it', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?sync')
  const menu = makeElement()
  menu.classes.add('open') // server-rendered already open
  menu.classList.contains = (c) => menu.classes.has(c)
  const a = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const b = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [a, b] : []),
  }
  const stop = toggles(root)
  assert.equal(a.attrs['aria-expanded'], 'true', 'boot syncs to the current state')
  assert.equal(b.attrs['aria-expanded'], 'true')
  listeners.click({ target: a })
  assert.equal(a.attrs['aria-expanded'], 'false')
  assert.equal(b.attrs['aria-expanded'], 'false', 'the other trigger of the same target follows')
  stop()
})

test('toggles: marks each resolved target with sv-ui at boot, document.documentElement never touched', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const html = makeElement()
  global.document = { documentElement: html }
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-target')

  const menu = makeElement()
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const solo = makeElement({ 'data-sv-toggle': '' }) // no data-sv-target: the trigger is its own target
  const root = {
    contains: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger, solo] : []),
  }
  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'a data-sv-target element gets sv-ui at boot')
  assert.ok(solo.classes.has('sv-ui'), 'a target-less trigger is its own target and gets sv-ui too')
  assert.ok(!html.classes.has('sv-ui'), 'document.documentElement is never marked')
  delete global.document
})

test('toggles: sets --sv-acts-settle with the class at boot, removes it after two frames, never touches style.transition', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-settle')

  const menu = makeElement()
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  const a = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const b = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' }) // shares the same target as a
  const root = {
    contains: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [a, b] : []),
  }

  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'marked at boot')
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'the acts transition is held at zero duration for the settle')
  assert.equal(menu.style.transition, undefined, 'style.transition is never written')
  assert.equal(menu.vars['transition-duration'], undefined, 'no inline longhand on this target: nothing written (ADU-104, round 5)')
  assert.equal(rafQueue.length, 1, 'one restore scheduled, not two, even though two triggers share this target')

  rafQueue.shift()() // frame 1: still held
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'still held after only one frame')
  assert.equal(rafQueue.length, 1, 'the second frame is queued from inside the first')

  rafQueue.shift()() // frame 2: restored
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'removed, back to the CSS-declared duration')
  assert.equal(menu.style.transition, undefined, 'still never touched')
  assert.equal(menu.vars['transition-duration'], undefined, 'still never written: this target never had one to hold')
})

test('toggles: an inline transition-duration longhand is held at 0s for the settle and restored exact, value and priority, after two frames (ADU-104, round 5 finding)', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-longhand-settle')

  const menu = makeElement()
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  // as if parsed from style="transition-duration: 400ms !important": the
  // priority matters here too, not just the value
  menu.style.setProperty('transition-duration', '400ms', 'important')
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const root = {
    contains: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.equal(menu.vars['transition-duration'], '0s', 'the inline longhand is held at zero duration too, not just --sv-acts-settle')
  assert.equal(menu.priorities['transition-duration'], 'important', 'the hold keeps writing it at the same priority as the original')
  assert.equal(menu.style.transition, undefined, 'the shorthand is still never touched')

  rafQueue.shift()() // frame 1: still held
  assert.equal(menu.vars['transition-duration'], '0s', 'still held after only one frame')

  rafQueue.shift()() // frame 2: restored, same guarded path as --sv-acts-settle
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the knob is removed in the same restore')
  assert.equal(menu.vars['transition-duration'], '400ms', 'restored to its exact original value')
  assert.equal(menu.priorities['transition-duration'], 'important', 'restored with its exact original priority')
})

test('toggles: a target without .sv-acts never gets the settle, even carrying an inline transition shorthand (ADU-104, round 6 finding)', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-non-acts-settle')

  const menu = makeElement() // no 'sv-acts' class: a plain toggle target
  // stands in for style="transition: translate 300ms linear": the longhand
  // getter reads this back as '300ms' too, indistinguishable from an
  // authored transition-duration (ADU-104, round 6 finding). The settle
  // must not even look at this: gated on .sv-acts before it ever reaches
  // holdDuration()
  menu.style.setProperty('transition-duration', '300ms')
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const root = {
    contains: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'still marked sv-ui, same as any other target')
  assert.ok(!menu.classes.has('sv-acts'), 'sanity: this target really is not .sv-acts')
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'no .sv-acts: the settle knob is never set')
  assert.equal(
    menu.vars['transition-duration'],
    '300ms',
    'unchanged: holdDuration() never runs on a non-.sv-acts target, whatever this reads back as'
  )
  assert.equal(rafQueue.length, 0, 'no restore ever scheduled for a non-.sv-acts target')
})

test('toggles: a click inside the boot settle window drops the hold immediately, so the toggle still animates', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-settle-click')

  const menu = makeElement()
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  menu.style.setProperty('transition-duration', '250ms') // inline longhand, no !important this time
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'the settle is holding')
  assert.equal(menu.vars['transition-duration'], '0s', 'the inline longhand hold is armed too (ADU-104, round 5 finding)')
  assert.equal(rafQueue.length, 1, 'one restore scheduled')

  listeners.click({ target: trigger }) // lands inside the hold window, before either queued frame runs
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the click drops the hold immediately, so this toggle still transitions')
  assert.equal(menu.vars['transition-duration'], '250ms', 'the click restores the inline longhand immediately too, together with the knob')
  assert.ok(menu.classes.has('open'), 'the click still toggles the class as usual')

  // the scheduled restore is cancelled: running the frames queued at boot
  // must not reintroduce the property or otherwise touch the target
  rafQueue.shift()()
  rafQueue.shift()()
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the cancelled restore never fires')
  assert.equal(menu.vars['transition-duration'], '250ms', 'unchanged: already restored by the click, the cancelled frames must not touch it again')
  assert.equal(menu.style.transition, undefined, 'style.transition is never written')
})

test('toggles: a target added after boot gets sv-ui on its first click', async () => {
  global.window = {}
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-late-target')

  const late = makeElement() // inserted into the DOM only after boot runs
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#late' })
  let inserted = false
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (root.click = fn),
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#late' && inserted ? late : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }
  toggles(root) // boot: #late does not resolve yet, so it is skipped, unmarked
  inserted = true
  assert.ok(!late.classes.has('sv-ui'), 'not marked before it ever gets clicked')
  root.click({ target: trigger })
  assert.ok(late.classes.has('sv-ui'), 'marked on its first click')
  assert.ok(late.classes.has('open'), 'the click still toggles the class as usual')
})

test('toggles: boot writes --sv-state from the class, and triggers group by the resolved target, not the selector string', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?boot-state')

  const menu = makeElement()
  menu.classes.add('open') // server-rendered already open
  const shut = makeElement()
  const byId = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  // the same element, reached through a different selector: the old grouping
  // compared the data-sv-target strings, so these two never saw each other
  const byClass = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': 'nav.menu' })
  const other = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#shut' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: (sel) =>
      sel === '#menu' || sel === 'nav.menu' ? menu : sel === '#shut' ? shut : null,
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [byId, byClass, other] : []),
  }

  toggles(root)
  assert.equal(menu.vars['--sv-state'], '1', 'markup that ships open agrees with its class from boot')
  assert.equal(shut.vars['--sv-state'], '0', 'a closed target is written too, never left unset')
  assert.equal(byId.attrs['aria-expanded'], 'true')
  assert.equal(byClass.attrs['aria-expanded'], 'true', 'another selector for the same element still syncs')
  assert.equal(other.attrs['aria-expanded'], 'false')

  listeners.click({ target: byId })
  assert.equal(menu.vars['--sv-state'], '0')
  assert.equal(byClass.attrs['aria-expanded'], 'false', 'the sibling trigger of that element follows the click')
  assert.equal(other.attrs['aria-expanded'], 'false', 'an unrelated target is untouched')
})

test('toggles: two triggers on one target with different classes keep separate aria-expanded', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?two-classes')

  const nav = makeElement()
  // the same nav reached through two selectors, toggling two different
  // classes: two independent states, so one click must not speak for both
  const hamburger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const pinner = makeElement({ 'data-sv-toggle': 'pinned', 'data-sv-target': 'nav.menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' || sel === 'nav.menu' ? nav : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [hamburger, pinner] : []),
  }

  toggles(root)
  assert.equal(hamburger.attrs['aria-expanded'], 'false', 'neither class is on the target at boot')
  assert.equal(pinner.attrs['aria-expanded'], 'false')

  listeners.click({ target: hamburger })
  assert.ok(nav.classes.has('open'))
  assert.ok(!nav.classes.has('pinned'), 'only the clicked trigger class flips')
  assert.equal(hamburger.attrs['aria-expanded'], 'true')
  assert.equal(
    pinner.attrs['aria-expanded'],
    'false',
    'the pinned control must not report expanded with its class absent'
  )

  listeners.click({ target: pinner })
  assert.equal(pinner.attrs['aria-expanded'], 'true')
  assert.equal(hamburger.attrs['aria-expanded'], 'true', 'the open state survives the other control')
})

test('toggles: a trigger above the scope root is ignored, even when closest() walks up to it (ADU-169)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?scope-containment')

  // outerTrigger lives ABOVE this scope's root: closest() from a click
  // inside the scope walks straight past the root and would still find it,
  // but this scope's own click handler must never resolve/toggle it. It
  // belongs to whichever toggles() instance actually contains it (ADU-152
  // widened the match itself; the bookkeeping around scope was never
  // widened with a containment check to match).
  const outerTrigger = makeElement({ 'data-sv-toggle': 'open' })
  const inner = makeElement() // clicked directly, no data-sv-toggle of its own
  inner.closest = (sel) => (sel === '[data-sv-toggle]' ? outerTrigger : null)
  const listeners = {}
  const root = {
    contains: (el) => el !== outerTrigger, // outerTrigger is an ancestor of the scope root, not inside it
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [], // this scope has no triggers of its own
  }

  toggles(root)
  listeners.click({ target: inner })
  assert.ok(!outerTrigger.classes.has('open'), 'a trigger outside the scope is never toggled by this scope\'s click handler')
  assert.equal(outerTrigger.attrs['aria-expanded'], undefined, 'and never gets aria-expanded from a scope that does not own it')
})

// a scope root that knows its own members: contains() answers from them, and
// the two queries toggles() makes (the '#menu' target and every trigger) see
// only what is inside. A flat `contains: () => true` cannot model nesting.
function makeRoot(members) {
  const listeners = {}
  return {
    listeners,
    contains: (el) => members.includes(el),
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) =>
      sel === '#menu' ? members.find((m) => m.attrs.id === 'menu') ?? null : null,
    querySelectorAll: (sel) =>
      sel === '[data-sv-toggle]' ? members.filter((m) => 'data-sv-toggle' in m.attrs) : [],
  }
}
// one event object down the bubble path, innermost scope first: a scope that
// contains the trigger is an ancestor-or-self of it, so it is on the path,
// and the browser runs the path inner to outer. Roots are passed in that
// order, and a stopped instance simply has no listener left to call.
const bubble = (target, roots) => {
  const event = { target }
  roots.forEach((root) => root.listeners.click?.(event))
}

test('toggles: a trigger outside the owning scope still reflects the target\'s state (round 10)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?cross-scope-sync')

  // the inner instance owns the click; the outer trigger of the same
  // (target, class) pair lives outside it and used to keep the
  // aria-expanded it was synced to at boot
  const menu = makeElement({ id: 'menu' })
  const triggerIn = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const triggerOut = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const inner = makeRoot([menu, triggerIn])
  const outer = makeRoot([menu, triggerIn, triggerOut])
  const stopOuter = toggles(outer)
  const stopInner = toggles(inner)
  assert.equal(triggerOut.attrs['aria-expanded'], 'false', 'boot')

  bubble(triggerIn, [inner, outer])
  assert.ok(menu.classes.has('open'))
  assert.equal(triggerIn.attrs['aria-expanded'], 'true')
  assert.equal(triggerOut.attrs['aria-expanded'], 'true', 'the trigger outside the owning scope follows the target')
  stopOuter()
  stopInner()
})

test('toggles: two Marquee-shaped scopes with the same local selector keep their own aria-pressed (round 10 verify 2)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?sibling-scopes')

  // two <Marquee>s: each a scoped instance, each button targets `.track`
  // inside ITS OWN root. A document-wide resolution matched the first track
  // for both and pressed both buttons on one click.
  const marquee = () => {
    const track = makeElement({ class: 'track' })
    const button = makeElement({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': '.track' })
    button.attrs['aria-pressed'] = 'false'
    const listeners = {}
    const root = {
      listeners,
      contains: (el) => el === track || el === button || el === root,
      addEventListener: (t, fn) => (listeners[t] = fn),
      removeEventListener: (t) => delete listeners[t],
      querySelector: (sel) => (sel === '.track' ? track : null),
      querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [button] : []),
    }
    return { root, track, button }
  }
  const a = marquee()
  const b = marquee()
  // a stray trigger with a selector that does not parse must not break sync
  const broken = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '[' })
  const strayRoot = {
    listeners: {},
    contains: (el) => el === broken,
    addEventListener: () => {},
    removeEventListener: () => {},
    // what a browser throws: a DOMException named SyntaxError, which is NOT
    // an instanceof SyntaxError; an instanceof check reads it as a boot failure
    querySelector: () => { throw new DOMException('invalid selector', 'SyntaxError') },
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [broken] : []),
  }
  const stops = [toggles(a.root), toggles(b.root), toggles(strayRoot)]

  bubble(a.button, [a.root])
  assert.ok(a.track.classes.has('sv-paused'))
  assert.equal(a.button.attrs['aria-pressed'], 'true')
  assert.equal(b.button.attrs['aria-pressed'], 'false', 'the sibling widget keeps its own state')
  assert.ok(!b.track.classes.has('sv-paused'))
  stops.forEach((stop) => stop())
})

test('toggles: a click on a trigger with an unparsable data-sv-target skips that trigger, not the whole instance', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?bad-target-click')

  const menu = makeElement()
  menu.classList.contains = (c) => menu.classes.has(c)
  const good = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const bad = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '[' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => {
      // a real browser throws a DOMException named SyntaxError, not an
      // instanceof SyntaxError; boot() already tolerates it (:262-272)
      if (sel === '[') throw new DOMException('invalid selector', 'SyntaxError')
      return sel === '#menu' ? menu : null
    },
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [good, bad] : []),
  }
  const stop = toggles(root)

  // the bad trigger's click must not tear down the instance
  assert.doesNotThrow(() => listeners.click({ target: bad }))
  assert.ok(listeners.click, 'the click listener is still attached')

  // a following click on the good trigger still opens the menu
  listeners.click({ target: good })
  assert.ok(menu.classes.has('open'))
  assert.equal(good.attrs['aria-expanded'], 'true')
  assert.ok(menu.classes.has('sv-ui'), 'the good target keeps its marker')

  stop()
})

test('toggles: a click the outer scope handles syncs the inner trigger too (round 10 verify 3)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?outer-handled')

  // the trigger sits inside a scoped instance, its #menu target outside it:
  // the inner scope cannot resolve the target and passes the click on, the
  // document-level instance toggles the menu, and the trigger's aria must
  // follow through THAT scope, not the nearest one that finds nothing
  const menu = makeElement({ id: 'menu' })
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const inner = makeRoot([trigger])
  const doc = makeRoot([menu, trigger])
  const stops = [toggles(doc), toggles(inner)]
  assert.equal(trigger.attrs['aria-expanded'], 'false', 'boot, through the document scope')

  bubble(trigger, [inner, doc])
  assert.ok(menu.classes.has('open'), 'the document scope handled the click')
  assert.equal(trigger.attrs['aria-expanded'], 'true', 'and synced the trigger the inner scope could not resolve')
  stops.forEach((stop) => stop())
})

test('toggles: a trigger inside two nested scopes toggles exactly once per click (ADU-172)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?nested-scopes')

  // the library's own documented setup: <ScrollVarsBoot /> boots one instance
  // unscoped, a consumer boots a second one on their own root. A trigger
  // nested inside both is contained by both, and containment is inclusive,
  // so both instances used to flip the same class on one click and the user
  // saw a button that does nothing.
  const menu = makeElement({ id: 'menu' })
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const outer = makeRoot([menu, trigger])
  const inner = makeRoot([menu, trigger])

  toggles(outer)
  toggles(inner)

  bubble(trigger, [inner, outer])
  assert.ok(menu.classes.has('open'), 'one click opens the panel instead of netting to nothing')
  assert.equal(menu.vars['--sv-state'], '1', 'and the state variable is visible, not toggled back to 0')
  assert.equal(trigger.attrs['aria-expanded'], 'true')

  bubble(trigger, [inner, outer])
  assert.ok(!menu.classes.has('open'), 'the second click closes it')
  assert.equal(menu.vars['--sv-state'], '0')
  assert.equal(trigger.attrs['aria-expanded'], 'false')

  bubble(trigger, [inner, outer])
  assert.ok(menu.classes.has('open'), 'and the third opens it again: one click, one state change, forever')
})

test('toggles: each scope alone owns the trigger, and stopping one hands it over without leaking (ADU-172)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?nested-scopes-destroy')

  const menu = makeElement({ id: 'menu' })
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const outer = makeRoot([menu, trigger])
  const inner = makeRoot([menu, trigger])

  // the outer scope alone
  const stopOuter = toggles(outer)
  bubble(trigger, [outer])
  assert.ok(menu.classes.has('open'), 'the outer scope alone still toggles')
  bubble(trigger, [outer])
  assert.ok(!menu.classes.has('open'))
  stopOuter()

  // the inner scope alone
  const stopInnerOnly = toggles(inner)
  bubble(trigger, [inner])
  assert.ok(menu.classes.has('open'), 'the inner scope alone still toggles')
  bubble(trigger, [inner])
  assert.ok(!menu.classes.has('open'))
  stopInnerOnly()

  // both live, then the nearer one is destroyed: the outer takes the trigger
  // over on the very next click, with nothing left over from the instance
  // that used to claim it
  const stopOuterAgain = toggles(outer)
  const stopInner = toggles(inner)
  bubble(trigger, [inner, outer])
  assert.ok(menu.classes.has('open'), 'nested: one click, one toggle')
  stopInner()
  assert.equal(inner.listeners.click, undefined, 'the destroyed instance stops listening')
  bubble(trigger, [inner, outer])
  assert.ok(!menu.classes.has('open'), 'the surviving outer scope owns the trigger now')
  bubble(trigger, [inner, outer])
  assert.ok(menu.classes.has('open'), 'and keeps owning it')

  // both destroyed: no listener anywhere, and no leftover ownership state to
  // poison the next instance
  stopOuterAgain()
  assert.equal(outer.listeners.click, undefined, 'nothing is registered once both instances are stopped')
  assert.equal(inner.listeners.click, undefined)
  bubble(trigger, [inner, outer])
  assert.ok(menu.classes.has('open'), 'a click with no live instance changes nothing')

  const stopFresh = toggles(inner)
  bubble(trigger, [inner])
  assert.ok(!menu.classes.has('open'), 'a fresh instance after every stop() works from the first click')
  stopFresh()
})

// B5 (Astra, loop8-3): a controlled marquee mounted after Boot's
// document-wide toggles() started used to stay static forever: watchMarquee
// and boot() only ever ran once, at setup. A MutationObserver owned by the
// document scope now acquires a later `.sv-marquee-controlled` wrapper
// (both its track and its pause button, whichever mutation record their
// insertion arrives in), wired through the exact same watchMarquee()/mark()
// paths setup uses.
test('toggles: a controlled marquee mounted after the document scope starts is wired by its MutationObserver (B5)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5marquee')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    const fixture = (cls) => {
      const wrap = env.element(); wrap.nodeType = 1
      const track = env.element(); track.nodeType = 1
      track.classList.add('sv-marquee-track', cls)
      const button = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': `.${cls}` })
      button.nodeType = 1
      wrap.append(track)
      wrap.append(button)
      doc.append(wrap)
      return { wrap, track, button }
    }
    const a = fixture('track-a')
    const b = fixture('track-b')
    // both wrappers inserted, delivered as two addedNodes of one record
    // (a synchronous double append batches into one MutationObserver
    // callback in a real browser)
    mo.cb([{ addedNodes: [a.wrap, b.wrap] }])

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(a.track) && io.targets.has(b.track), 'both late tracks got a lease')
    assert.ok(a.track.classes.has('sv-ui') && b.track.classes.has('sv-ui'), 'both late tracks are marked sv-ui: the pause button is no longer stuck hidden behind ui.css')

    doc.fire('click', { target: a.button })
    assert.ok(a.track.classes.has('sv-paused'), 'clicking the first pause button pauses its own track')
    assert.ok(!b.track.classes.has('sv-paused'), 'and leaves the second, independent track alone')

    // removing one: the existing N7 sweep (not a "removedNodes" half of this
    // observer) prunes it on the next IO delivery
    a.track.isConnected = false
    io.cb([{ target: a.track, isIntersecting: false }])
    assert.ok(!io.targets.has(a.track), 'the removed track releases its lease')
    assert.ok(io.targets.has(b.track), 'the surviving track keeps its own')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// A route swap that removes one marquee and inserts another lands both
// mutations in ONE MutationObserver batch (React commits a page swap as a
// single task): the track COUNT stays the same, so a pre-check keyed on
// count alone misses the new track entirely, exactly the SPA case B5
// exists for (lead review of the first version of this fix, d9bc6d4). The
// pre-check now walks the live `.sv-marquee-track` collection for an
// element not already in the lease map, identity rather than count.
test('toggles: a route swap (remove track A, insert track B, ONE batch) wires B even though the count did not change', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5swap')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc

    const fixture = (cls) => {
      const wrap = env.element(); wrap.nodeType = 1
      const track = env.element(); track.nodeType = 1
      track.classList.add('sv-marquee-track', cls)
      const button = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': `.${cls}` })
      button.nodeType = 1
      wrap.append(track)
      wrap.append(button)
      return { wrap, track, button }
    }

    const a = fixture('track-a')
    doc.append(a.wrap)
    const stop = toggles()

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(a.track), 'track A wired at setup')

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    const b = fixture('track-b')
    // the swap: A detaches from doc.children (the route's old page), B
    // attaches (the new one), delivered as ONE batch with both halves,
    // count of live tracks unchanged (A left, B arrived)
    doc.children.splice(doc.children.indexOf(a.wrap), 1)
    doc.append(b.wrap)
    mo.cb([{ addedNodes: [b.wrap], removedNodes: [a.wrap] }])

    assert.ok(io.targets.has(b.track), 'B is wired from the SAME batch, even though the live track count never changed')
    assert.ok(b.track.classes.has('sv-ui'), 'and its pause button is unhidden the same way boot() would')

    // A's own release is unrelated to this pre-check: the existing N7 sweep
    // still does it, on the next thing that touches the marquee observer
    a.track.isConnected = false
    io.cb([{ target: a.track, isIntersecting: false }])
    assert.ok(!io.targets.has(a.track), 'A is released once something touches it (N7)')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// N4b, loop8-4 review: the pre-check above (identity, not count) still
// returned false when a track's OWN batch had already leased it but no
// trigger had run bootTrigger on it yet, because it only asked "is any
// live track unleased", never "is any live pause button's track still
// unmarked". A track inserted in one task and its pause button in a LATER
// one (two separate MutationObserver deliveries) hit exactly that gap: the
// second batch found every track leased, returned early, and the track
// never got sv-ui, so the button stayed hidden behind ui.css's
// `.sv-marquee-track.sv-ui + .sv-marquee-pause` guard forever.
test('toggles: a track and its pause button arriving in SEPARATE mutation batches still wire (N4b)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?n4blatebutton')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo)

    const wrap = env.element(); wrap.nodeType = 1
    const track = env.element(); track.nodeType = 1
    track.classList.add('sv-marquee-track')
    doc.append(wrap)
    wrap.append(track)
    // batch 1: only the track lands
    mo.cb([{ addedNodes: [track] }])

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track), 'the track got its lease from batch 1')
    assert.ok(!track.classes.has('sv-ui'), 'no trigger has run bootTrigger on it yet')

    const button = env.element({ 'data-sv-toggle': 'sv-paused', 'data-sv-target': '.sv-marquee-track' })
    button.nodeType = 1
    button.classList.add('sv-marquee-pause')
    wrap.append(button)
    // batch 2, a LATER task: only the button lands. The track is already
    // leased, so the old count-based pre-check returned false and skipped
    // this whole batch.
    mo.cb([{ addedNodes: [button] }])

    assert.ok(track.classes.has('sv-ui'), 'the late button still gets its track marked sv-ui: not stuck hidden behind ui.css forever')

    doc.fire('click', { target: button })
    assert.ok(track.classes.has('sv-paused'), 'and the button actually works')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// Perf follow-up to B5, narrowed by the late-trigger fix below: a page with
// no marquee AND no new element in the batch pays nothing per mutation. A
// text-node or attribute-only mutation record (most of a Boot page's own
// churn) never reaches either scan, since both `hasUnleasedTrack()`'s
// pause-button loop and `hasNewTrigger()` skip anything whose `nodeType`
// is not 1 before touching it at all.
test('toggles: a batch that adds no element (text-only mutation) never runs the marquee/trigger scan', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5perfgate')
    const doc = env.element()
    // no track is ever added in this test, so a genuinely O(1) live count
    // (never recursing the tree, unlike the other B5 test's stub, which
    // has to grow) stays at 0 throughout: this is what a real
    // getElementsByClassName's `.length` costs, an indexed read
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()
    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    let scans = 0
    // a text node (nodeType 3): a `characterData` sibling insert, or any
    // other non-element addedNodes entry, never calls matches/querySelector
    const textNodes = Array.from({ length: 500 }, () => ({ nodeType: 3 }))
    textNodes.forEach((n) => {
      n.querySelectorAll = () => { scans++; return [] }
    })
    mo.cb([{ addedNodes: textNodes }])
    assert.equal(scans, 0, 'a batch with no element addedNodes never reaches either scan')

    stop()
  } finally { env.restore() }
})

// Companion to the above: a batch that DOES add plain elements (no marquee,
// no trigger) now pays `hasNewTrigger()`'s one matches()/querySelector() pass
// per added node instead of skipping entirely, correctness's price for the
// SPA late-trigger fix below. Bounded, not recursive multiplication: each of
// the 500 unrelated nodes is visited exactly once, one querySelector call
// each (its own querySelectorAll, spied here), never more.
test('toggles: a burst of unrelated ELEMENT insertions runs one bounded matches()/querySelector() pass per node, not a recursive rescan', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5perfgate2')
    const doc = env.element()
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()
    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    let scans = 0
    const unrelated = () => {
      const node = env.element()
      node.nodeType = 1
      const realQSA = node.querySelectorAll
      node.querySelectorAll = (sel) => { scans++; return realQSA(sel) }
      return node
    }
    const burst = Array.from({ length: 500 }, unrelated)
    burst.forEach((n) => doc.append(n))
    mo.cb([{ addedNodes: burst }])
    assert.equal(scans, 500, 'exactly one querySelector pass per added node, bounded, no recursion multiplier')

    stop()
  } finally { env.restore() }
})

// A2 (Astra loop8-5) established the fresh-journal-per-delivery shape;
// T1 (auditor, loop8-7) narrowed WHOSE journal that is. Before T1 every new
// trigger of one delivery shared ONE transaction, so a throw on a later
// trigger's write rolled back an EARLIER sibling's already-written state
// too (this test used to assert exactly that rollback). Each new trigger
// now boots in its own transaction, so t1's write survives t2's failure:
// only the failing trigger loses its write, the rest of the batch is
// unaffected, matching AGENTS:528's "stop only that instance" for a batch
// that boots several triggers at once.
test('toggles: a failing second trigger in one MutationObserver delivery does not roll back a sibling trigger\'s write (T1)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?a2rollback')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    // an unleased track, added AFTER setup so the initial boot's own
    // `.sv-marquee-track` scan never leases it: only here to satisfy the
    // pre-check's `hasUnleasedTrack()` gate, unrelated to the two toggle
    // triggers this test is about.
    const track = env.element(); track.nodeType = 1
    track.classList.add('sv-marquee-track')
    doc.append(track)

    const t1 = env.element({ 'data-sv-toggle': '' }); t1.nodeType = 1
    const t2 = env.element({ 'data-sv-toggle': '' }); t2.nodeType = 1
    doc.append(t1); doc.append(t2)
    const error = Error('t2 write')
    const realSetProperty = t2.style.setProperty
    t2.style.setProperty = (key, value, priority) => {
      if (key === '--sv-state') throw error
      return realSetProperty(key, value, priority)
    }

    mo.cb([{ addedNodes: [t1, t2] }])
    assert.deepEqual(env.errors, [error], 'the throw is reported, not swallowed')
    assert.equal(t1.style.getPropertyValue('--sv-state'), '0', 't1\'s own transaction is untouched by t2\'s throw')
    assert.equal(t1.getAttribute('aria-expanded'), 'false', 't1 still booted normally')
    assert.equal(t2.getAttribute('aria-expanded'), null, 't2 itself never got a write that could stick')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// T1's own acceptance shape (auditor, loop8-7): three trigger/target pairs
// land in ONE delivery, the MIDDLE pair's write throws. Before this fix all
// three read `null` (the shared transaction rolled back the first pair's
// already-written state and the throw stopped the forEach before the third
// pair ever ran). Each trigger now boots in its own transaction: the first
// and third pairs boot normally, only the middle one fails, and exactly
// one error is reported.
test('toggles: three new triggers in one delivery, the middle one throws: the first and third still boot (T1)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?t1threepairs')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    // hasNewTrigger(records) alone opens the pre-check for these three
    // triggers: no marquee track is needed in this batch.
    const pair = (id) => {
      const trigger = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': `#${id}` })
      trigger.nodeType = 1
      const target = env.element(); target.id = id; target.nodeType = 1
      doc.append(target)
      doc.append(trigger)
      return { trigger, target }
    }
    doc.querySelector = (sel) => {
      const id = sel.slice(1)
      return doc.children.find((c) => c.id === id) ?? null
    }
    const first = pair('m1')
    const second = pair('m2')
    const third = pair('m3')
    const error = Error('m2 write')
    second.target.style.setProperty = (key) => { if (key === '--sv-state') throw error }

    mo.cb([{ addedNodes: [first.trigger, second.trigger, third.trigger] }])

    assert.deepEqual(env.errors, [error], 'exactly one error reported for the whole batch')
    assert.equal(first.trigger.getAttribute('aria-expanded'), 'false', 'the first pair booted, unrolled by the second\'s throw')
    assert.equal(second.trigger.getAttribute('aria-expanded'), null, 'the middle pair itself never got a write that could stick')
    assert.equal(third.trigger.getAttribute('aria-expanded'), 'false', 'the third pair still booted, never skipped by the throw before it')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// C2 (Astra loop8-7): removing the last offscreen marquee from the document
// (a route swap) got no IntersectionObserver delivery (an already
// non-intersecting target reports no further transition) and never opened
// the MutationObserver callback's own pre-check (no unleased track, no new
// trigger, no pending trigger): the lease, the shared observer and the
// detached subtree sat until the next click, visibility change or marquee
// registration. A removal-only batch now sweeps detached leases itself.
test('toggles: removing the last offscreen marquee releases its lease and shared resources on the removal-only batch alone (C2)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?c2removalonly')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()
    // baseline AFTER the document scope's own MutationObserver is already
    // registered (it never disconnects for the scope's life): what this
    // test checks is that the MARQUEE's own resources, added below, come
    // back down to this line, not the whole document scope's footprint.
    const before = env.baseline()

    const wrap = env.element(); wrap.nodeType = 1
    const track = env.element(); track.nodeType = 1
    track.classList.add('sv-marquee-track')
    wrap.append(track)
    doc.append(wrap)

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')
    // the initial setup scan already leases every track present in the
    // document, so this late one goes through the MO callback's own
    // acquisition path instead, the shape a route-mounted marquee has.
    mo.cb([{ addedNodes: [wrap] }])

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track), 'the track is leased')
    io.cb([{ target: track, isIntersecting: false }])
    assert.ok(track.classes.has('sv-marquee-offscreen'), 'offscreen, so a later removal reports no further IO transition')

    // the removal: an already non-intersecting track leaves the document
    // with no IO delivery to catch it, and this batch itself carries
    // neither a new trigger nor a new marquee, only a removal.
    doc.children.splice(doc.children.indexOf(wrap), 1)
    track.isConnected = false
    mo.cb([{ addedNodes: [], removedNodes: [wrap] }])

    assert.ok(!io.targets.has(track), 'the removal-only batch alone released the lease, no click needed')
    assert.ok(!track.classes.has('sv-marquee-offscreen'), 'and cleared the offscreen class')
    assert.deepEqual(env.baseline(), before, 'the shared observer and visibilitychange listener are released too')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// Verifier fix on PR #116: sweepDetachedMarquees() called pruneDetachedMarquee
// for every leased track with no guard of its own. From the MutationObserver
// callback's C2 pre-sweep a throwing classList.remove reached life.guard's
// fail() and stopped the WHOLE document scope (click listener removed,
// MutationObserver disconnected) over one bad detached track, even though a
// NEW trigger sat in the SAME batch. Each track is now guarded inside the
// sweep itself: the throw is reported once and the rest of the batch, and
// every later delivery, still works.
test('toggles: a throwing classList on a detached track does not stop the document scope from booting a sibling trigger in the same batch, or a later batch (guard)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?guardsweepmo')
    const doc = env.element()
    doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
    global.document = doc
    const stop = toggles()

    const wrap = env.element(); wrap.nodeType = 1
    const track = env.element(); track.nodeType = 1
    track.classList.add('sv-marquee-track')
    wrap.append(track)
    doc.append(wrap)

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    mo.cb([{ addedNodes: [wrap] }])
    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(track), 'the track is leased')

    doc.children.splice(doc.children.indexOf(wrap), 1)
    track.isConnected = false
    const error = Error('classList.remove')
    track.classList.remove = () => { throw error }

    const menu = env.element(); menu.nodeType = 1
    const trigger = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
    trigger.nodeType = 1
    menu.id = 'menu'
    doc.append(menu); doc.append(trigger)
    doc.querySelector = (sel) => (sel === '#menu' ? menu : null)

    // one batch: the detached, throwing track's own removal, AND a brand
    // new trigger that must still boot despite the sweep's throw.
    mo.cb([{ addedNodes: [trigger], removedNodes: [wrap] }])

    assert.deepEqual(env.errors, [error], 'the throw is reported once, not swallowed')
    assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'the sibling new trigger in the SAME batch still booted')

    // a later batch, unrelated: the scope is still alive (not stopped by
    // life.guard's fail() over the earlier throw).
    const later = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
    later.nodeType = 1
    doc.append(later)
    mo.cb([{ addedNodes: [later] }])
    assert.equal(later.getAttribute('aria-expanded'), 'false', 'a later delivery still works: the scope was not stopped')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

test('toggles: a throwing classList on a detached track does not stop the other entries of the same IntersectionObserver batch from settling (guard)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?guardsweepio')
    const root = env.element()
    const bad = env.element(), good = env.element()
    bad.classList.add('sv-marquee-track')
    good.classList.add('sv-marquee-track')
    root.append(bad); root.append(good)
    const stop = toggles(root)

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    assert.ok(io.targets.has(bad) && io.targets.has(good))

    bad.isConnected = false
    const error = Error('classList.remove')
    bad.classList.remove = () => { throw error }

    // sweepDetachedMarquees() runs FIRST in the IO callback, before the
    // per-entry loop below it: this exercises the sweep's own guard, not
    // the per-entry one added for the earlier finding.
    io.cb([{ target: good, isIntersecting: false }])
    assert.deepEqual(env.errors, [error], 'the throw is reported once, not swallowed')
    assert.ok(good.classes.has('sv-marquee-offscreen'), 'the other entry in the same batch still settled')

    stop()
  } finally { env.restore() }
})

// The retention half: a late-booted trigger under the document scope
// (<ScrollVarsBoot> never stops) must not be kept strongly reachable by the
// MO callback's own journal once nothing else references it and no click
// has run since (mirrors PR #94's own retention test).
test('toggles: a late-booted trigger from a MutationObserver delivery holds no strong reference once nothing else does (A2)', {
  skip: typeof global.gc !== 'function' && 'run with node --expose-gc',
}, async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  let moCallback
  global.MutationObserver = class {
    constructor(cb) { moCallback = cb }
    observe() {}
    disconnect() {}
  }
  const children = []
  const doc = {
    querySelectorAll: (sel) => children.filter((c) => c.matches(sel)),
    addEventListener() {},
    removeEventListener() {},
    contains: () => true,
  }
  doc.getElementsByClassName = (cls) => liveByClass(doc, cls)
  global.document = doc
  const { toggles } = await import('../dist/core/toggles.js?a2retain')
  const stop = toggles()
  assert.equal(typeof moCallback, 'function', 'the document scope owns a MutationObserver')

  // an unleased track, added AFTER setup, only to keep `hasUnleasedTrack()`
  // open for the MO callback body to run at all: unrelated to the trigger
  // this test is about. `liveByClass` above recomputes on every access, like
  // a real live HTMLCollection, so this is visible without a fresh delivery.
  children.push({ matches: (sel) => sel === '.sv-marquee-track' })

  let trigger = {
    nodeType: 1,
    attrs: { 'data-sv-toggle': '' },
    getAttribute(k) { return this.attrs[k] ?? null },
    setAttribute(k, v) { this.attrs[k] = v },
    classList: { contains: () => false, toggle() {}, add() {}, remove() {} },
    style: { setProperty() {}, getPropertyValue: () => '', getPropertyPriority: () => '', removeProperty() {} },
    matches(sel) { return sel === '[data-sv-toggle]' },
    querySelectorAll: () => [],
    closest: () => null,
  }
  // no click ever runs in this test: the old code only cleared the document
  // scope's standing transaction on the NEXT click anywhere in the document
  moCallback([{ addedNodes: [trigger] }])

  let collected = false
  const registry = new FinalizationRegistry(() => { collected = true })
  registry.register(trigger, 'trigger')
  trigger = null

  for (let attempt = 0; attempt < 10 && !collected; attempt++) {
    await new Promise((resolve) => setImmediate(resolve))
    global.gc()
  }
  assert.ok(collected, 'a standing transaction never reset per delivery would keep the trigger alive until the next click')
  stop()
  delete global.document
  delete global.MutationObserver
})

// Regression from the #105 perf pass (found by the verifier in real
// Chrome): `hasUnleasedTrack()` gated the WHOLE MO callback body, so on a
// page with NO marquee at all a plain `[data-sv-toggle]` trigger mounted
// after boot (an SPA menu button) never ran bootTrigger and carried no
// `aria-expanded` or initial `--sv-state` until its own first click
// (WCAG 4.1.2). The callback now also runs when the batch's own addedNodes
// contain a new trigger, marquee or not.
test('toggles: a plain trigger inserted after toggles(document) on a marquee-free page gets aria-expanded before any click (SPA late trigger)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?latetrigger')
    const doc = env.element()
    // a marquee-free page: both live collections stay empty, exactly the
    // shape hasUnleasedTrack() alone used to treat as "nothing to do"
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    const menu = env.element()
    const trigger = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
    trigger.nodeType = 1
    doc.querySelector = (sel) => (sel === '#menu' ? menu : null)
    doc.append(trigger)
    mo.cb([{ addedNodes: [trigger] }])

    assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'the late trigger got its initial aria-expanded before any click')
    assert.equal(menu.style.getPropertyValue('--sv-state'), '0', 'and its target got its initial --sv-state')

    doc.fire('click', { target: trigger })
    assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'and it actually works')

    stop()
  } finally { env.restore() }
})

// B5 (Astra, loop8-6): a trigger mounted BEFORE its target never got
// aria-expanded or --sv-state at all, even after the target later arrived,
// because bootTrigger() just returns on an unresolved target and only NEW
// triggers get booted from a later delivery. The trigger and its target now
// land in two SEPARATE MutationObserver deliveries, the shape #105 already
// covers for trigger+target together.
test('toggles: a trigger mounted before its target gets aria-expanded once the target arrives in a later delivery (B5)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5unresolvedtrigger')
    const doc = env.element()
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    const trigger = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
    trigger.nodeType = 1
    doc.querySelector = () => null // the target does not exist yet
    doc.append(trigger)
    mo.cb([{ addedNodes: [trigger] }])
    assert.equal(trigger.getAttribute('aria-expanded'), null, 'unresolved at setup: no target to write onto yet')

    const menu = env.element()
    menu.nodeType = 1
    doc.querySelector = (sel) => (sel === '#menu' ? menu : null)
    doc.append(menu)
    // the target itself is neither a trigger nor a marquee track, so the
    // batch that inserts it alone must still retry the pending trigger
    mo.cb([{ addedNodes: [menu] }])

    assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'the pending trigger got its initial aria-expanded once its target arrived')
    assert.equal(menu.style.getPropertyValue('--sv-state'), '0', 'and its target got its initial --sv-state, before any click')

    doc.fire('click', { target: trigger })
    assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'and it still works')

    stop()
  } finally { env.restore() }
})

// B5 rollback round 2 (verifier, loop8-6): retrying every pending trigger
// in the SAME shared transaction meant one trigger's write throwing rolled
// back every sibling pending trigger's resolution in that batch too, AND
// stopped the forEach outright, so triggers later in iteration order never
// even got tried. A pending trigger whose resolved target's write throws
// on every retry also used to get RESTORED into pendingTriggers (round 1's
// own fix) and retried again on every future mutation forever: unbounded
// reportFailure spam, since a write failure on an already-resolved target
// will not heal itself (no backoff machinery). Each pending trigger now
// retries in its OWN transaction (one throw cannot touch a sibling's
// writes or stop the loop), and a trigger whose write throws after
// resolving is dropped from pendingTriggers for good and reported once. A
// trigger whose TARGET is still missing (no throw at all) stays pending as
// before.
test('toggles: a permanently failing trigger does not starve a sibling or spam reportFailure (B5 rollback round 2)', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5rollback2')
    const doc = env.element()
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()

    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    assert.ok(mo, 'the document scope owns a MutationObserver')

    // t1 (broken) retries FIRST (insertion order): if it starved siblings
    // or its rollback undid t2's write, t2 would never get its state.
    const t1 = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#m1' }); t1.nodeType = 1
    const t2 = env.element({ 'data-sv-toggle': 'open', 'data-sv-target': '#m2' }); t2.nodeType = 1
    doc.querySelector = () => null // neither target exists yet
    doc.append(t1); doc.append(t2)
    mo.cb([{ addedNodes: [t1, t2] }])
    assert.equal(t1.getAttribute('aria-expanded'), null, 't1 unresolved at setup')
    assert.equal(t2.getAttribute('aria-expanded'), null, 't2 unresolved at setup')

    const m1 = env.element(); m1.nodeType = 1
    const m2 = env.element(); m2.nodeType = 1
    doc.append(m1); doc.append(m2)
    doc.querySelector = (sel) => (sel === '#m1' ? m1 : sel === '#m2' ? m2 : null)
    const error = Error('m1 write')
    m1.style.setProperty = (key) => { if (key === '--sv-state') throw error }

    mo.cb([{ addedNodes: [m1, m2] }])
    assert.deepEqual(env.errors, [error], 'the throw is reported once, not swallowed')
    assert.equal(t1.getAttribute('aria-expanded'), null, 't1 never got a write that could stick: its own retry always throws')
    assert.equal(t2.getAttribute('aria-expanded'), 'false', 't2 got its state: t1\'s failing retry did not roll it back or block it')
    assert.equal(m2.style.getPropertyValue('--sv-state'), '0', 't2\'s target got its initial --sv-state')

    // ten later, unrelated mutations: t1 must not be retried again (its
    // write will never stop throwing) and must not spam reportFailure.
    for (let i = 0; i < 10; i++) {
      const unrelated = env.element(); unrelated.nodeType = 1
      doc.append(unrelated)
      mo.cb([{ addedNodes: [unrelated] }])
    }
    assert.deepEqual(env.errors, [error], 'reportFailure fired exactly once across ten later mutations, not once per retry')
    assert.equal(t1.getAttribute('aria-expanded'), null, 't1 stays dropped: a write failure on a resolved target does not heal on its own')
    assert.equal(t2.getAttribute('aria-expanded'), 'false', 't2\'s state is undisturbed by the later mutations')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// onClick round 2 (verifier, loop8-6): the click handler's catch rethrew
// after rollback, which life.guard turns into a permanent stop() of the
// WHOLE document scope (its click listener and MutationObserver disconnect
// for the rest of the page's life) over one failing click. It now reports
// the error directly instead, matching the MutationObserver callback.
test('toggles: a failing click does not stop the document scope from handling a later click or booting a later trigger', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?onclickround2')
    const doc = env.element()
    doc.getElementsByClassName = () => ({ length: 0 })
    global.document = doc
    const stop = toggles()

    const bad = env.element({ 'data-sv-toggle': '' }); bad.nodeType = 1
    doc.append(bad)
    const error = Error('bad click write')
    bad.style.setProperty = (key) => { if (key === '--sv-state') throw error }

    doc.fire('click', { target: bad })
    assert.deepEqual(env.errors, [error], 'the failing click is reported, not swallowed')

    // a second click, on a DIFFERENT, working trigger: the scope must
    // still be handling clicks at all.
    const ok = env.element({ 'data-sv-toggle': '' }); ok.nodeType = 1
    doc.append(ok)
    doc.fire('click', { target: ok })
    assert.equal(ok.getAttribute('aria-expanded'), 'true', 'a later click on a working trigger still toggles it')

    // a later-mounted trigger must still boot through the MutationObserver.
    const mo = [...env.deliveries].find((d) => d.kind === 'MutationObserver')
    const late = env.element({ 'data-sv-toggle': '' }); late.nodeType = 1
    doc.append(late)
    mo.cb([{ addedNodes: [late] }])
    assert.equal(late.getAttribute('aria-expanded'), 'false', 'a later-mounted trigger still boots: the MutationObserver was not disconnected either')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

// onClick round 3 (verifier, loop8-6): the report-and-continue fix above
// applies to onClick itself, shared by EVERY toggles() instance, not only
// the document scope: a scoped root (a Marquee's own toggles(node), an
// Accordion's own instance) must survive a failing click on one of its
// triggers the same way, so one bad toggle does not disable every other
// toggle in that same scope.
test('toggles: a failing click does not stop a SCOPED (non-document) instance from handling a later click', async () => {
  const realHTMLElement = global.HTMLElement
  function StubHTMLElement() {}
  StubHTMLElement.prototype.inert = false
  global.HTMLElement = StubHTMLElement
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?onclickscoped')
    const root = env.element()
    const stop = toggles(root)

    const bad = env.element({ 'data-sv-toggle': '' }); bad.nodeType = 1
    root.append(bad)
    const error = Error('bad click write')
    bad.style.setProperty = (key) => { if (key === '--sv-state') throw error }

    root.fire('click', { target: bad })
    assert.deepEqual(env.errors, [error], 'the failing click is reported, not swallowed')

    // a second click, on a DIFFERENT, working trigger in the SAME scoped
    // instance: it must still be handling clicks at all.
    const ok = env.element({ 'data-sv-toggle': '' }); ok.nodeType = 1
    root.append(ok)
    root.fire('click', { target: ok })
    assert.equal(ok.getAttribute('aria-expanded'), 'true', 'a later click on a working trigger in the same scoped instance still toggles it')

    stop()
  } finally {
    env.restore()
    if (realHTMLElement) global.HTMLElement = realHTMLElement
    else delete global.HTMLElement
  }
})

test('toggles: a custom-root scope (a Marquee component\'s own toggles(node)) gets no persistent MutationObserver', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?b5noscopeobserver')
    const root = env.element()
    const stop = toggles(root)
    assert.equal([...env.deliveries].filter((d) => d.kind === 'MutationObserver').length, 0, 'only the document scope owns one (cost, not a Marquee component\'s own short-lived scope)')
    stop()
  } finally { env.restore() }
})

test('toggles: a scope-root trigger synchronizes itself, including a pressed-state button', async () => {
  const { toggles } = await import('../dist/core/toggles.js')
  const root = makeElement({ 'data-sv-toggle': 'sv-paused', 'aria-pressed': 'false' })
  const listeners = {}
  Object.assign(root, {
    contains: el => el === root,
    matches: sel => sel === '[data-sv-toggle]',
    querySelectorAll: () => [],
    addEventListener: (type, fn) => listeners[type] = fn,
    removeEventListener: type => delete listeners[type],
  })
  root.classes.add('sv-paused')
  const stop = toggles(root)
  assert.equal(root.attrs['aria-pressed'], 'true', 'initial state includes the root')
  listeners.click({ target: root })
  assert.equal(root.attrs['aria-pressed'], 'false')
  assert.equal(root.attrs['aria-expanded'], undefined, 'pause is not a disclosure')
  stop()
  assert.equal(listeners.click, undefined)
})

// Guard (auditor, loop8-7): the shared marquee IntersectionObserver and
// visibilitychange callbacks run outside any instance's lifetime and touch
// no consumer state directly, but a patched or exotic element's classList
// can still throw. Each entry (or each track) is now wrapped in its own
// try/reportFailure, so one throwing track reports once and does not stop
// the same batch from settling every OTHER marquee.
test('toggles: a throwing classList in the shared IntersectionObserver callback reports once and does not stop a sibling marquee (guard)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?guardio')
    const root = env.element()
    const bad = env.element(), good = env.element()
    bad.classList.add('sv-marquee-track')
    good.classList.add('sv-marquee-track')
    root.append(bad); root.append(good)
    const stop = toggles(root)

    const io = [...env.deliveries].find((d) => d.kind === 'IntersectionObserver')
    const error = Error('classList.toggle')
    bad.classList.toggle = () => { throw error }

    io.cb([{ target: bad, isIntersecting: false }, { target: good, isIntersecting: false }])
    assert.deepEqual(env.errors, [error], 'the throw is reported, not swallowed')
    assert.ok(good.classes.has('sv-marquee-offscreen'), 'the sibling delivered in the SAME batch still settles')

    stop()
  } finally { env.restore() }
})

test('toggles: a throwing classList in the shared visibilitychange callback reports once and does not stop a sibling marquee (guard)', async () => {
  const env = lifecycleEnv()
  try {
    const { toggles } = await import('../dist/core/toggles.js?guardvisibility')
    const root = env.element()
    const bad = env.element(), good = env.element()
    bad.classList.add('sv-marquee-track')
    good.classList.add('sv-marquee-track')
    root.append(bad); root.append(good)
    const stop = toggles(root)

    const error = Error('classList.toggle')
    bad.classList.toggle = () => { throw error }

    document.hidden = true
    document.fire('visibilitychange')
    assert.deepEqual(env.errors, [error], 'the throw is reported, not swallowed')
    assert.ok(good.classes.has('sv-marquee-offscreen'), 'the sibling in the SAME pass still settles')

    stop()
  } finally { env.restore() }
})
