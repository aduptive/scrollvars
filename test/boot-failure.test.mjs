import test from 'node:test'
import assert from 'node:assert/strict'
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


function environment() {
  const listeners = new Map(), watches = new Set(), classes = new Set()
  global.window = {
    innerHeight: 800,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn) },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn) },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  }
  global.document = { documentElement: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } } }
  global.MutationObserver = class { observe() {} disconnect() {} }
  global.ResizeObserver = class { observe(el) { watches.add(el) } disconnect() { watches.clear() } }
  global.IntersectionObserver = class { observe() {} disconnect() {} }
  return { listeners, watches, classes }
}

test('initialization treats a throwing optional culler as absent, without duplicate subscriptions', async () => {
  const env = environment()
  global.IntersectionObserver = class { constructor() { throw Error('culler') } }
  const { init } = await import('../dist/core/driver.js?lifecycle-optional')
  assert.equal(init(), true)
  assert.equal(init(), true)
  assert.equal(env.listeners.get('scroll').size, 1)
  assert.equal(env.listeners.get('resize').size, 1)
  assert.ok(env.classes.has('sv-on'))
})

for (const failure of ['constructor', 'observe', 'motion', 'listener']) test(`initialization rolls back ${failure} failure and permits a clean retry`, async () => {
  const env = environment(), RO = global.ResizeObserver, media = window.matchMedia, add = window.addEventListener
  if (failure === 'constructor') global.ResizeObserver = class { constructor() { throw Error(failure) } }
  if (failure === 'observe') global.ResizeObserver = class extends RO { observe(el) { super.observe(el); throw Error(failure) } }
  if (failure === 'motion') window.matchMedia = () => { throw Error(failure) }
  if (failure === 'listener') window.addEventListener = function(type, fn) { add(type, fn); if (type === 'resize') throw Error(failure) }
  const { init } = await import(`../dist/core/driver.js?lifecycle-init-${failure}`)
  assert.equal(init(), false)
  assert.equal(init(), false)
  assert.equal(env.watches.size, 0)
  assert.ok([...env.listeners.values()].every(set => set.size === 0))
  assert.ok(!env.classes.has('sv-on'))
  global.ResizeObserver = RO; window.matchMedia = media; window.addEventListener = add
  assert.equal(init(), true)
  assert.equal(env.listeners.get('scroll').size, 1)
  assert.equal(env.listeners.get('resize').size, 1)
})

test('terminal watchdog release prevents late attachment even after driver initialization', async () => {
  const env = environment(), timers = []
  window.IntersectionObserver = global.IntersectionObserver
  window.ResizeObserver = global.ResizeObserver
  const source = renderToStaticMarkup(React.createElement(ScrollVarsBoot)).replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
  new Function('window', 'document', 'setTimeout', 'MutationObserver', source)(window, document, fn => timers.push(fn), class { constructor() { throw Error('watchdog observer') } })
  const { init, track } = await import('../dist/core/driver.js?lifecycle-terminal')
  assert.equal(init(), true)
  timers[0]()
  assert.equal(window.__scrollvars, 'released')
  const attrs = new Set(), el = { setAttribute: name => attrs.add(name) }
  const stop = track(el, { pin: '300vh' })
  assert.equal(init(), false)
  assert.ok(attrs.has('data-sv-off'))
  assert.ok(!env.watches.has(el))
  assert.ok(!env.classes.has('sv-on'))
  stop()
})

test('motion observation failure rolls back the media listener before initialization retries', async () => {
  environment()
  const mediaListeners = new Set(), Observer = global.MutationObserver
  window.matchMedia = () => ({ matches: false, addEventListener: (_, fn) => mediaListeners.add(fn), removeEventListener: (_, fn) => mediaListeners.delete(fn) })
  global.MutationObserver = class { observe() { throw Error('motion observation') } disconnect() {} }
  const { init } = await import('../dist/core/driver.js?lifecycle-motion-observe')
  assert.equal(init(), false)
  assert.equal(mediaListeners.size, 0)
  global.MutationObserver = Observer
  assert.equal(init(), true)
  assert.equal(mediaListeners.size, 1)
})
