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
