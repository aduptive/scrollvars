import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ScrollVarsBoot } from '../dist/react/index.js'
import { scan } from '../dist/core/scan.js'

test('scan cannot acknowledge successful enhancement after ResizeObserver initialization fails', () => {
  const classes = new Set()
  const timers = []
  global.window = { innerHeight: 800, IntersectionObserver: class {}, ResizeObserver: class {} }
  global.document = { documentElement: { classList: {
    add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
  } } }
  global.MutationObserver = class { observe() {} disconnect() {} }
  global.ResizeObserver = class { constructor() { throw Error('unavailable') } }
  const source = renderToStaticMarkup(React.createElement(ScrollVarsBoot))
    .replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
  new Function('window', 'document', 'setTimeout', 'MutationObserver', source)(
    window, document, fn => timers.push(fn), MutationObserver)
  assert.ok(classes.has('sv-on'))
  const el = { getAttribute: () => null, hasAttribute: () => false }
  const stop = scan({ querySelectorAll: sel => sel === '[data-sv]' ? [el] : [] })
  try {
    timers.forEach(fn => fn())
    assert.ok(!classes.has('sv-on'), 'failed boot must release prepaint hiding')
    assert.notEqual(window.__scrollvars, true, 'arrival is not successful initialization')
  } finally { stop() }
})
