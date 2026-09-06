import assert from 'node:assert/strict'
import { test } from 'node:test'

// Stub enough DOM for driver.init() + scan(). Tracking is observed through
// the driver's ResizeObserver: track() observes the element, untrack
// unobserves it.
function makeElement(attrs = {}, children = [], isConnected = true) {
  const el = {
    attrs: { ...attrs },
    children,
    isConnected,
    style: { setProperty: () => {} },
    classList: { add: () => {}, toggle: () => {}, remove: () => {} },
    scrollHeight: 100,
    hasAttribute(name) {
      return name in el.attrs
    },
    getAttribute(name) {
      return el.attrs[name] ?? null
    },
    querySelectorAll(sel) {
      return sel === '[data-sv]' ? el.children.filter((c) => 'data-sv' in c.attrs) : []
    },
    getBoundingClientRect: () => ({ top: 0, bottom: 100, width: 100, height: 100 }),
  }
  return el
}

test('scan tracks [data-sv] nodes, follows mutations, stops cleanly', async () => {
  const observed = new Set()
  let mutationCallback

  global.MutationObserver = class {
    constructor(cb) {
      mutationCallback = cb
    }
    observe() {}
    disconnect() {}
  }
  global.ResizeObserver = class {
    observe(el) {
      observed.add(el)
    }
    unobserve(el) {
      observed.delete(el)
    }
    disconnect() {}
  }
  global.window = {
    innerHeight: 800,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  }
  global.requestAnimationFrame = () => 1
  global.cancelAnimationFrame = () => {}
  global.HTMLElement = Object // instanceof check in the sweep

  const a = makeElement({ 'data-sv': '', 'data-sv-once': '' })
  const b = makeElement({ 'data-sv': '', 'data-sv-scenes': '4' })
  const later = makeElement({ 'data-sv': '', 'data-sv-pin': '' })

  const body = makeElement({}, [a, b])
  global.document = {
    visibilityState: 'visible',
    body,
    documentElement: { classList: { add: () => {} } },
    addEventListener: () => {},
    querySelectorAll: (sel) => body.querySelectorAll(sel),
  }

  const { scan } = await import('../dist/core/scan.js')
  const trackedCount = () => [a, b, later].filter((el) => observed.has(el)).length

  const stop = scan()
  assert.equal(trackedCount(), 2) // a and b picked up at boot

  // a node added later is swept in via the MutationObserver
  mutationCallback([{ addedNodes: [later], removedNodes: [] }])
  assert.equal(trackedCount(), 3)

  // removing it untracks (idempotent for nodes never tracked). A real removal
  // flips isConnected false, unlike the retained-node cases covered below.
  later.isConnected = false
  mutationCallback([{ addedNodes: [], removedNodes: [later] }])
  assert.equal(trackedCount(), 2)

  stop()
  assert.equal(trackedCount(), 0)
})

test('scan writes data-sv-* knob attributes as CSS variables, once', async () => {
  global.window = { innerHeight: 1000, addEventListener: () => {}, matchMedia: () => ({ matches: false, addEventListener: () => {} }) }
  global.document = { documentElement: { classList: { add: () => {} } }, body: {}, visibilityState: 'visible' }
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  global.MutationObserver = class { constructor(cb) { global.__mutCb = cb } observe() {} disconnect() {} }
  global.HTMLElement = class {}

  const VAR_SEL = '[data-sv-order],[data-sv-distance],[data-sv-from],[data-sv-to]'
  const knob = (attrs) => {
    const el = new global.HTMLElement()
    Object.assign(el, {
      attrs,
      vars: {},
      style: { setProperty: (k, v) => (el.vars[k] = v) },
      classList: { add: () => {}, toggle: () => {} },
      hasAttribute: (n) => n in attrs,
      getAttribute: (n) => attrs[n] ?? null,
      matches: (sel) => sel === VAR_SEL && Object.keys(attrs).some((a) => sel.includes(`[${a}]`)),
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ top: 0, bottom: 100, height: 100 }),
    })
    return el
  }
  const child = knob({ 'data-sv-order': '2', 'data-sv-distance': '3rem' })
  const scope = {
    querySelectorAll: (sel) => (sel === VAR_SEL ? [child] : []),
  }

  const { scan } = await import('../dist/core/scan.js?varattrs')
  const stop = scan(scope)
  assert.equal(child.vars['--sv-order'], '2')
  assert.equal(child.vars['--sv-distance'], '3rem')
  assert.equal(child.vars['--sv-from'], undefined)

  // a node arriving later (route change) gets the same treatment
  const late = knob({ 'data-sv-from': '0.3', 'data-sv-to': '0.7' })
  global.__mutCb([{ addedNodes: [late], removedNodes: [] }])
  assert.equal(late.vars['--sv-from'], '0.3')
  assert.equal(late.vars['--sv-to'], '0.7')
  stop()
})

test('scan releases split closures when the subtree is removed', async () => {
  global.window = { innerHeight: 1000, addEventListener: () => {}, matchMedia: () => ({ matches: false, addEventListener: () => {} }) }
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  let mutationCallback
  global.MutationObserver = class { constructor(cb) { mutationCallback = cb } observe() {} disconnect() {} }
  global.HTMLElement = class {}
  const made = []
  global.document = {
    documentElement: { classList: { add: () => {} } },
    body: { querySelectorAll: () => [] },
    visibilityState: 'visible',
    querySelectorAll: () => [],
    createElement: () => { const n = { style: { setProperty() {} }, setAttribute() {}, textContent: '' }; made.push(n); return n },
    createTextNode: () => ({}),
  }
  const el = new global.HTMLElement()
  let html = 'Hello world'
  Object.defineProperty(el, 'innerHTML', { get: () => html, set: (v) => (html = v) })
  Object.assign(el, {
    attrs: { 'data-sv-split': '' },
    textContent: 'Hello world',
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {} },
    appendChild() {},
    hasAttribute: (n) => n in el.attrs,
    getAttribute: (n) => el.attrs[n] ?? null,
    matches: () => false,
    querySelectorAll: () => [],
  })

  const { scan } = await import('../dist/core/scan.js?splitcleanup')
  const stop = scan()
  mutationCallback([{ addedNodes: [el], removedNodes: [] }])
  assert.equal(html, '', 'split emptied the element and rebuilt it from spans')
  assert.ok(made.length >= 3, 'sr-only span + word spans created')

  mutationCallback([{ addedNodes: [], removedNodes: [el] }])
  assert.equal(html, 'Hello world', 'removal restored the original markup (closure released)')
  stop()
})

// driver.js is a module-level singleton (its own `initialized`/`resizeObserver`
// survive across every test in this file, whichever test touches track()
// first wins the ResizeObserver instance): a churn check needs a signal that
// does not depend on which ResizeObserver mock is currently wired in.
// releaseEntry() (driver.ts) always does two things, and only on release:
// `classList.toggle('sv-live', false)` and `style.setProperty('--sv-live', '1')`.
// Recording those two calls on the element itself proves untrack ran (or
// didn't), regardless of driver's singleton state.
function makeChurnProbe() {
  const releaseCalls = []
  const el = makeElement({ 'data-sv': '' })
  const toggle = el.classList.toggle
  el.classList.toggle = (name, value) => {
    if (name === 'sv-live' && value === false) releaseCalls.push('toggle')
    return toggle(name, value)
  }
  const setProperty = el.style.setProperty
  el.style.setProperty = (name, value) => {
    if (name === '--sv-live' && value === '1') releaseCalls.push('setProperty')
    return setProperty(name, value)
  }
  return { el, releaseCalls }
}

function setupScanGlobals() {
  global.MutationObserver = class {
    constructor(cb) {
      global.__mutCb = cb
    }
    observe() {}
    disconnect() {}
  }
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.window = {
    innerHeight: 800,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  }
  global.requestAnimationFrame = () => 1
  global.cancelAnimationFrame = () => {}
  global.HTMLElement = Object
}

test('scan keeps a node retained in both addedNodes and removedNodes of one record (replaceChildren)', async () => {
  setupScanGlobals()
  const { el: a, releaseCalls } = makeChurnProbe()
  const body = makeElement({}, [a])
  global.document = {
    visibilityState: 'visible',
    body,
    documentElement: { classList: { add: () => {} } },
    addEventListener: () => {},
    querySelectorAll: (sel) => body.querySelectorAll(sel),
  }

  const { scan } = await import('../dist/core/scan.js?retained')
  const stop = scan()
  assert.equal(releaseCalls.length, 0, 'no release at boot')

  // a "replace all" (parent.replaceChildren(...)) that retains `a` queues one
  // record with the same node in both lists; `a` is still connected.
  a.isConnected = true
  global.__mutCb([{ addedNodes: [a], removedNodes: [a] }])

  assert.equal(releaseCalls.length, 0, 'still tracked: never released while connected')

  stop()
})

test('scan does not churn a node reordered across two mutation records in one batch', async () => {
  setupScanGlobals()
  const { el: a, releaseCalls } = makeChurnProbe()
  const body = makeElement({}, [a])
  global.document = {
    visibilityState: 'visible',
    body,
    documentElement: { classList: { add: () => {} } },
    addEventListener: () => {},
    querySelectorAll: (sel) => body.querySelectorAll(sel),
  }

  const { scan } = await import('../dist/core/scan.js?reorder')
  const stop = scan()
  assert.equal(releaseCalls.length, 0, 'no release at boot')

  // a reorder (moving `a` within the tracked list) is delivered as a removal
  // record followed by an insertion record, both in the same callback: by
  // the time the observer fires, `a` is already back, still connected.
  a.isConnected = true
  global.__mutCb([
    { addedNodes: [], removedNodes: [a] },
    { addedNodes: [a], removedNodes: [] },
  ])

  assert.equal(releaseCalls.length, 0, 'no untrack/re-track churn: same entry survives')

  stop()
})
