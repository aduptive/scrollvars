import assert from 'node:assert/strict'
import { test } from 'node:test'

// Stub enough DOM for driver.init() + scan(). Tracking is observed through
// the driver's ResizeObserver: track() observes the element, untrack
// unobserves it. `.parent` is a real back-pointer, wired below whenever an
// element is passed as a child of another: `contains()` walks it, like
// pointer.test.mjs's stub, instead of trusting a flag the test sets by hand.
function makeElement(attrs = {}, children = [], isConnected = true) {
  const el = {
    attrs: { ...attrs },
    children,
    isConnected,
    parent: null,
    style: { setProperty: () => {} },
    classList: { add: () => {}, toggle: () => {}, remove: () => {} },
    scrollHeight: 100,
    hasAttribute(name) {
      return name in el.attrs
    },
    getAttribute(name) {
      return el.attrs[name] ?? null
    },
    // releaseEntry() marks the element data-sv-off and track() clears the
    // marker again: a real element always carries the whole attribute trio
    setAttribute(name, value) {
      el.attrs[name] = value
    },
    removeAttribute(name) {
      delete el.attrs[name]
    },
    querySelectorAll(sel) {
      return sel === '[data-sv]' ? el.children.filter((c) => 'data-sv' in c.attrs) : []
    },
    getBoundingClientRect: () => ({ top: 0, bottom: 100, width: 100, height: 100 }),
    contains(node) {
      let n = node
      while (n) {
        if (n === el) return true
        n = n.parent
      }
      return false
    },
  }
  children.forEach((c) => {
    c.parent = el
  })
  return el
}

// document stub whose `.contains` walks the same `.parent` chain: `body`
// hangs off it so anything reachable from `body` (or `body` itself) reads
// as connected, and a node whose chain never reaches either does not.
function makeDocumentStub(body) {
  const doc = {
    visibilityState: 'visible',
    body,
    documentElement: { classList: { add: () => {} } },
    addEventListener: () => {},
    querySelectorAll: (sel) => body.querySelectorAll(sel),
    contains(node) {
      let n = node
      while (n) {
        if (n === doc) return true
        n = n.parent
      }
      return false
    },
  }
  body.parent = doc
  return doc
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
  global.document = makeDocumentStub(body)

  const { scan } = await import('../dist/core/scan.js')
  const trackedCount = () => [a, b, later].filter((el) => observed.has(el)).length

  const stop = scan()
  assert.equal(trackedCount(), 2) // a and b picked up at boot

  // a node added later is swept in via the MutationObserver
  mutationCallback([{ addedNodes: [later], removedNodes: [] }])
  assert.equal(trackedCount(), 3)

  // removing it untracks (idempotent for nodes never tracked). `later` was
  // never actually inserted under `body` (only swept in via the mutation
  // record above), so it was never reachable from document.contains either,
  // unlike the retained-node cases covered below.
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

  const VAR_SEL = ['order', 'distance', 'from', 'to', 'duration', 'stagger', 'ease'].map(n => `[data-sv-${n}]`).join(',')
  const knob = (attrs) => {
    const el = new global.HTMLElement()
    Object.assign(el, {
      attrs,
      vars: {},
      style: { setProperty: (k, v) => (el.vars[k] = v) },
      classList: { add: () => {}, toggle: () => {} },
      hasAttribute: (n) => n in attrs,
      getAttribute: (n) => attrs[n] ?? null,
      removeAttribute: (n) => delete attrs[n],
      matches: (sel) => sel === VAR_SEL && Object.keys(attrs).some((a) => sel.includes(`[${a}]`)),
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ top: 0, bottom: 100, height: 100 }),
    })
    return el
  }
  const child = knob({ 'data-sv-order': '2', 'data-sv-distance': '3rem', 'data-sv-duration': '800ms', 'data-sv-stagger': '90ms', 'data-sv-ease': 'ease-out' })
  const scope = {
    querySelectorAll: (sel) => (sel === VAR_SEL ? [child] : []),
  }

  const { scan } = await import('../dist/core/scan.js?varattrs')
  const stop = scan(scope)
  assert.equal(child.vars['--sv-order'], '2')
  assert.equal(child.vars['--sv-distance'], '3rem')
  assert.equal(child.vars['--sv-duration'], '800ms')
  assert.equal(child.vars['--sv-stagger'], '90ms')
  assert.equal(child.vars['--sv-ease'], 'ease-out')
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
  const doc = {
    documentElement: { classList: { add: () => {} } },
    body: { querySelectorAll: () => [] },
    visibilityState: 'visible',
    querySelectorAll: () => [],
    createElement: () => { const n = { style: { setProperty() {} }, setAttribute() {}, textContent: '' }; made.push(n); return n },
    createTextNode: () => ({}),
  }
  // `el` is never inserted anywhere in this stub tree: its `.parent` chain
  // never reaches `doc`, so contains() reports it unreachable, same as a
  // real removal would.
  doc.contains = (node) => {
    let n = node
    while (n) {
      if (n === doc) return true
      n = n.parent
    }
    return false
  }
  global.document = doc
  const el = new global.HTMLElement()
  let html = 'Hello world'
  Object.defineProperty(el, 'innerHTML', { get: () => html, set: (v) => (html = v) })
  Object.assign(el, {
    attrs: { 'data-sv-split': '' },
    parent: null,
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

test('scan keeps a retained [data-sv-split] node split through a replaceChildren batch (round 6)', async () => {
  global.window = { innerHeight: 1000, addEventListener: () => {}, matchMedia: () => ({ matches: false, addEventListener: () => {} }) }
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  let mutationCallback
  global.MutationObserver = class { constructor(cb) { mutationCallback = cb } observe() {} disconnect() {} }
  global.HTMLElement = class {}
  const doc = {
    documentElement: { classList: { add: () => {} } },
    visibilityState: 'visible',
    querySelectorAll: () => [],
    createElement: () => ({ style: { setProperty() {} }, setAttribute() {}, textContent: '' }),
    createTextNode: () => ({}),
  }
  doc.contains = (node) => {
    let n = node
    while (n) {
      if (n === doc) return true
      n = n.parent
    }
    return false
  }
  global.document = doc
  const el = new global.HTMLElement()
  let html = 'Hello world'
  Object.defineProperty(el, 'innerHTML', { get: () => html, set: (v) => (html = v) })
  // `el`'s `.parent` chain reaches `doc` (a body stand-in in between), like a
  // node a replaceChildren batch retains: still inside scope by the time the
  // observer fires, unlike the genuinely removed `el` above.
  const body = { parent: doc, querySelectorAll: () => [] }
  Object.assign(el, {
    attrs: { 'data-sv-split': '' },
    parent: body,
    textContent: 'Hello world',
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {} },
    appendChild() {},
    hasAttribute: (n) => n in el.attrs,
    getAttribute: (n) => el.attrs[n] ?? null,
    matches: () => false,
    querySelectorAll: () => [],
  })

  const { scan } = await import('../dist/core/scan.js?splitretained')
  const stop = scan()
  mutationCallback([{ addedNodes: [el], removedNodes: [] }])
  assert.equal(html, '', 'split emptied the element and rebuilt it from spans')

  // one mutation record carries `el` in both addedNodes and removedNodes
  // (parent.replaceChildren/replaceWith retaining it): scope.contains(el) is
  // still true, so its spans must survive.
  mutationCallback([{ addedNodes: [el], removedNodes: [el] }])
  assert.equal(html, '', 'retained node keeps its spans (removeSplit guarded like remove)')

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
  global.document = makeDocumentStub(body)

  const { scan } = await import('../dist/core/scan.js?retained')
  const stop = scan()
  assert.equal(releaseCalls.length, 0, 'no release at boot')

  // a "replace all" (parent.replaceChildren(...)) that retains `a` queues one
  // record with the same node in both lists; `a` is still under `body`.
  global.__mutCb([{ addedNodes: [a], removedNodes: [a] }])

  assert.equal(releaseCalls.length, 0, 'still tracked: never released while connected')

  stop()
})

test('scan does not churn a node reordered across two mutation records in one batch', async () => {
  setupScanGlobals()
  const { el: a, releaseCalls } = makeChurnProbe()
  const body = makeElement({}, [a])
  global.document = makeDocumentStub(body)

  const { scan } = await import('../dist/core/scan.js?reorder')
  const stop = scan()
  assert.equal(releaseCalls.length, 0, 'no release at boot')

  // a reorder (moving `a` within the tracked list) is delivered as a removal
  // record followed by an insertion record, both in the same callback: by
  // the time the observer fires, `a` is already back under `body`.
  global.__mutCb([
    { addedNodes: [], removedNodes: [a] },
    { addedNodes: [a], removedNodes: [] },
  ])

  assert.equal(releaseCalls.length, 0, 'no untrack/re-track churn: same entry survives')

  stop()
})

test('scan(root) untracks a node moved out of the observed root into another connected part of the document', async () => {
  setupScanGlobals()
  const { el: a, releaseCalls } = makeChurnProbe()
  const root = makeElement({}, [a])
  const other = makeElement({}, [])
  // both root and other hang off the rest of the document, unreferenced past
  // this line: only their `.parent` pointers (set by makeElement) matter.
  makeElement({}, [root, other])
  global.document = { documentElement: { classList: { add: () => {} } } }

  const { scan } = await import('../dist/core/scan.js?scopedmove')
  const stop = scan(root)
  assert.equal(releaseCalls.length, 0, 'tracked at boot: a starts inside root')

  // `a` moves from root into `other`: still reachable from the rest of the
  // document (el.isConnected would read true), but root's MutationObserver
  // only watches root's own subtree, so this is the one removal record it
  // will ever get for `a`. Only scope.contains(a), not el.isConnected, can
  // tell this apart from the retained-in-both-lists churn case above.
  other.children.push(a)
  a.parent = other
  global.__mutCb([{ addedNodes: [], removedNodes: [a] }])

  assert.equal(releaseCalls.length, 2, 'moved out of the scoped root: untracked')

  stop()
})

test('scan(detachedRoot) keeps a node retained in both lists of one record', async () => {
  setupScanGlobals()
  const { el: a, releaseCalls } = makeChurnProbe()
  // never inserted under any document: el.isConnected reads false the whole
  // time here, the case the old el.isConnected guard could never fix.
  a.isConnected = false
  const detachedRoot = makeElement({}, [a])
  global.document = { documentElement: { classList: { add: () => {} } } }

  const { scan } = await import('../dist/core/scan.js?detachedretained')
  const stop = scan(detachedRoot)
  assert.equal(releaseCalls.length, 0, 'no release at boot')

  // a "replace all" inside the detached root retains `a` in both lists of
  // one record: still under detachedRoot, so scope.contains(a) is true.
  global.__mutCb([{ addedNodes: [a], removedNodes: [a] }])

  assert.equal(releaseCalls.length, 0, 'still tracked: retained inside the detached root')

  stop()
})
