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
  // no aria-label (axe aria-prohibited-attr on generic roles): the readable
  // text is a visually-hidden first child
  assert.doesNotMatch(html, /aria-label/)
  assert.match(html, /<h2[^>]*><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\);white-space:nowrap">we build websites<\/span>/)
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

test('vanilla split: sr-only text first, no aria-label, restore', async () => {
  const { split } = await import('../dist/core/split.js')
  const node = (tag) => ({
    tag,
    textContent: '',
    style: { cssText: '', vars: {}, setProperty(k, v) { this.vars[k] = v }, removeProperty(k) { delete this.vars[k] } },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v },
    removeAttribute(k) { delete this.attrs[k] },
  })
  global.window = {}
  global.document = { createElement: node, createTextNode: (t) => ({ tag: '#text', textContent: t }) }
  const el = {
    ...node('h2'),
    innerHTML: 'we build',
    textContent: 'we build',
    children: [],
    classList: { list: [], add(c) { this.list.push(c) }, remove(c) { this.list = this.list.filter((x) => x !== c) } },
    appendChild(c) { this.children.push(c) },
  }
  const restore = split(el)
  assert.equal(el.innerHTML, '')
  assert.equal('aria-label' in el.attrs, false)
  assert.equal(el.children[0].textContent, 'we build')
  assert.match(el.children[0].style.cssText, /clip-path:inset\(50%\)/)
  assert.equal(el.children[0].attrs['aria-hidden'], undefined)
  assert.equal(el.children[1].attrs['aria-hidden'], 'true')
  assert.equal(el.children[1].style.vars['--sv-order'], '0')
  assert.equal(el.style.vars['--sv-count'], '2')
  restore()
  assert.equal(el.innerHTML, 'we build')
  assert.deepEqual(el.classList.list, [])
})
