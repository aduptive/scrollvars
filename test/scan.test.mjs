import assert from 'node:assert/strict'
import { test } from 'node:test'

// Stub enough DOM for driver.init() + scan(). Tracking is observed through
// the driver's ResizeObserver: track() observes the element, untrack
// unobserves it.
function makeElement(attrs = {}, children = []) {
  const el = {
    attrs: { ...attrs },
    children,
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

  // removing it untracks (idempotent for nodes never tracked)
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
