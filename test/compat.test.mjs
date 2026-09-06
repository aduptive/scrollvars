import assert from 'node:assert/strict'
import { test } from 'node:test'

function makeDocument(appended) {
  return {
    querySelector: () => null,
    createElement: () => {
      const el = { attrs: {}, textContent: '' }
      el.setAttribute = (k, v) => (el.attrs[k] = v)
      return el
    },
    head: { appendChild: (el) => appended.push(el) },
  }
}

// A fake element for the ResizeObserver stub: getBoundingClientRect is the
// border box, computedStyle carries border/padding, same shape
// src/canvas/index.ts's own measureLayout() fallback reads.
function makeEl({ width, height, padding = 0, border = 0 }) {
  return {
    getBoundingClientRect: () => ({ width: width + 2 * padding + 2 * border, height: height + 2 * padding + 2 * border }),
    computedStyle: {
      borderLeftWidth: `${border}px`,
      borderRightWidth: `${border}px`,
      borderTopWidth: `${border}px`,
      borderBottomWidth: `${border}px`,
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
      paddingTop: `${padding}px`,
      paddingBottom: `${padding}px`,
    },
  }
}

test('compat: patches old browsers, no-ops on modern ones', async () => {
  const { compat } = await import('../dist/compat/index.js')

  // OLD browser: nothing available
  const appended = []
  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getComputedStyle: (el) => el.computedStyle,
  }
  global.document = makeDocument(appended)

  assert.equal(compat(), true)
  assert.ok(window.ResizeObserver, 'RO stub installed')
  assert.ok(window.IntersectionObserver, 'IO stub installed')
  assert.equal(appended.length, 1, 'fallback stylesheet injected')
  assert.ok(appended[0].textContent.includes('transform: translateY'))
  assert.ok(!appended[0].textContent.includes(':is('), 'no :is() for old parsers')
  assert.ok(!appended[0].textContent.includes('clamp('), 'no clamp() for old parsers')
  assert.ok(!appended[0].textContent.includes('min('), 'no min() for old parsers')
  assert.ok(!appended[0].textContent.includes('max('), 'no max() for old parsers')

  // IO stub reports visible immediately (canvas harness never pauses)
  let seen = null
  new window.IntersectionObserver((entries) => (seen = entries)).observe('el')
  assert.equal(seen[0].isIntersecting, true)

  // RO stub: a record shaped like a real ResizeObserverEntry (contentRect,
  // contentBoxSize), computed from getBoundingClientRect minus border and
  // padding, not a bare `{ target }` (src/canvas/index.ts reads
  // entry.contentRect.width directly and would throw on that).
  const el = makeEl({ width: 100, height: 60, padding: 10, border: 2 })
  let roEntries = null
  new window.ResizeObserver((entries) => (roEntries = entries)).observe(el)
  assert.equal(roEntries.length, 1)
  assert.equal(roEntries[0].target, el)
  assert.equal(roEntries[0].contentRect.width, 100)
  assert.equal(roEntries[0].contentRect.height, 60)
  assert.equal(roEntries[0].contentBoxSize[0].inlineSize, 100)
  assert.equal(roEntries[0].contentBoxSize[0].blockSize, 60)

  // MODERN browser: everything supported → zero patches
  global.window = {
    ResizeObserver: class {},
    IntersectionObserver: class {},
    CSS: { supports: () => true },
  }
  const appended2 = []
  global.document = makeDocument(appended2)
  assert.equal(compat(), false)
  assert.equal(appended2.length, 0)
})
