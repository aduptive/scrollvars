import assert from 'node:assert/strict'
import { test } from 'node:test'

import { mdLite } from '../scripts/docs-build.mjs'

test('mdLite: a `### ` sub-heading becomes <h4>, not literal text', () => {
  const html = mdLite('## Unreleased\n\n### Driver\n- one liner\n')
  assert.ok(html.includes('<h3>Unreleased</h3>'))
  assert.ok(html.includes('<h4>Driver</h4>'), html)
  assert.ok(!html.includes('### Driver'), html)
})

test('mdLite: a multi-line bullet renders as one <li> with every line joined', () => {
  const md = '- first line of the bullet\n  second line, indented\n  third line too\n- next bullet\n'
  const html = mdLite(md)
  assert.ok(
    html.includes('<li>first line of the bullet second line, indented third line too</li>'),
    html
  )
  assert.ok(html.includes('<li>next bullet</li>'), html)
})

test('mdLite: consecutive bullets share one <ul>, closed before the next paragraph', () => {
  const md = '- a\n- b\n- c\n\nafter the list\n'
  const html = mdLite(md)
  assert.equal(html, '<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n</ul>\n\nafter the list\n')
})
