import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mountScene } from '../demo/recipes/svg-scene/scene-lifecycle.mjs'

function env() {
  const original = Object.fromEntries(['document', 'IntersectionObserver', 'ResizeObserver'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  const callbacks = {}, disconnected = [], attrs = new Set(), events = new Map()
  globalThis.document = { hidden: false, addEventListener: (n, f) => events.set(n, f), removeEventListener: n => events.delete(n) }
  for (const [name, kind] of [['IntersectionObserver', 'intersection'], ['ResizeObserver', 'resize']]) {
    globalThis[name] = class { constructor(fn) { callbacks[kind] = fn } observe() {} disconnect() { disconnected.push(kind) } }
  }
  return { callbacks, disconnected, events, attrs,
    section: { setAttribute: key => attrs.add(key), removeAttribute: key => attrs.delete(key) },
    activate() { callbacks.intersection([{ isIntersecting: true }]); callbacks.resize([{ contentRect: { width: 400, height: 300 } }]) },
    restore() { for (const [k, d] of Object.entries(original)) { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k] } },
  }
}

test('SVG recipe wakes on motion changes and ignores callbacks from a released connection', () => {
  const e = env(), draws = [], callbacks = []
  let reduced = false, motion, releases = 0, unsubscribed = false
  try {
    const destroy = mountScene(e.section, { paint: t => draws.push(t), reduced: () => reduced,
      onMotion: fn => { motion = fn; return () => { unsubscribed = true } },
      connect: fn => { callbacks.push(fn); return () => { releases++ } },
    })
    e.activate(); callbacks[0](.3)
    assert.equal(draws.at(-1), .3)
    reduced = true; motion(); callbacks[0](.8)
    assert.equal(draws.at(-1), .5)
    reduced = false; motion()
    assert.equal(callbacks.length, 2, 'no scroll needed to reconnect')
    callbacks[1](.6); assert.equal(draws.at(-1), .6)
    destroy(); destroy(); callbacks[1](.9)
    assert.equal(draws.at(-1), .6)
    assert.equal(releases, 2); assert.ok(unsubscribed); assert.equal(e.events.size, 0)
  } finally { e.restore() }
})

test('SVG recipe attempts every cleanup when the input release throws', () => {
  const e = env(), error = Error('release failed')
  let restored = false, unsubscribed = false
  const paint = () => {}; paint.restore = () => { restored = true }
  try {
    const destroy = mountScene(e.section, { paint, reduced: () => false,
      onMotion: () => () => { unsubscribed = true }, connect: () => () => { throw error } })
    e.activate()
    assert.throws(destroy, ex => ex === error)
    assert.equal(e.attrs.size, 0); assert.equal(e.events.size, 0)
    assert.deepEqual(e.disconnected.sort(), ['intersection', 'resize'])
    assert.ok(restored && unsubscribed)
    assert.doesNotThrow(destroy)
  } finally { e.restore() }
})
