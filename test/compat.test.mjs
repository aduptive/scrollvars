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

test('compat: patches old browsers, no-ops on modern ones', async () => {
  const { compat } = await import('../dist/compat/index.js')

  // OLD browser: nothing available
  const appended = []
  global.window = { addEventListener: () => {}, removeEventListener: () => {} }
  global.document = makeDocument(appended)

  assert.equal(compat(), true)
  assert.ok(window.ResizeObserver, 'RO stub installed')
  assert.ok(window.IntersectionObserver, 'IO stub installed')
  assert.equal(appended.length, 1, 'fallback stylesheet injected')
  assert.ok(appended[0].textContent.includes('transform: translateY'))
  assert.ok(!appended[0].textContent.includes(':is('), 'no :is() for old parsers')
  assert.ok(!appended[0].textContent.includes('clamp('), 'no clamp() for old parsers')

  // IO stub reports visible immediately (canvas harness never pauses)
  let seen = null
  new window.IntersectionObserver((entries) => (seen = entries)).observe('el')
  assert.equal(seen[0].isIntersecting, true)

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
