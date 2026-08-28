import assert from 'node:assert/strict'
import { test } from 'node:test'

test('splitParts: words, chars, whitespace collapsing', async () => {
  const { splitParts } = await import('../dist/core/split.js')
  assert.deepEqual(splitParts('we build websites'), ['we', 'build', 'websites'])
  assert.deepEqual(splitParts('  spaced   out '), ['spaced', 'out'])
  assert.deepEqual(splitParts('hi yo', 'char'), ['h', 'i', 'y', 'o'])
  assert.deepEqual(splitParts('café', 'char'), ['c', 'a', 'f', 'é']) // unicode-safe
  assert.deepEqual(splitParts(''), [])
})

test('react: Split renders SSR spans with orders, count and a11y', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Split } = await import('../dist/react/index.js')

  const html = renderToStaticMarkup(
    React.createElement(Split, { as: 'h2', by: 'word' }, 'we build websites')
  )
  assert.match(html, /<h2[^>]*aria-label="we build websites"/)
  assert.match(html, /class="sv-split"/)
  assert.match(html, /--sv-count:3/)
  assert.match(html, /aria-hidden="true"[^>]*--sv-order:0[^>]*>we</)
  assert.match(html, /--sv-order:2[^>]*>websites</)
  // words separated by real text spaces (wrapping stays natural)
  assert.match(html, /<\/span> <span/)

  const chars = renderToStaticMarkup(React.createElement(Split, { by: 'char' }, 'hi yo'))
  assert.match(chars, /--sv-count:4/)
  assert.match(chars, /--sv-order:3[^>]*>o</)
})
