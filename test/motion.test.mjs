import test from 'node:test'
import assert from 'node:assert/strict'

// One effective preference: the OS media query OR data-sv-motion="reduce" on
// <html>, read live. Stubs model both change paths: a MediaQueryList with the
// modern listener pair and a MutationObserver that reports the attribute.

const setup = () => {
  const media = { matches: false, handlers: [], addEventListener(_, fn) { this.handlers.push(fn) }, removeEventListener() {}, addListener() {}, removeListener() {} }
  const attrs = new Map()
  const observers = []
  const documentElement = {
    getAttribute: (k) => attrs.get(k) ?? null,
    setAttribute: (k, v) => { attrs.set(k, v); observers.forEach((fn) => fn()) },
    removeAttribute: (k) => { attrs.delete(k); observers.forEach((fn) => fn()) },
  }
  globalThis.window = { matchMedia: () => media }
  globalThis.document = { documentElement }
  globalThis.MutationObserver = class { constructor(fn) { this.fn = fn } observe() { observers.push(this.fn) } disconnect() {} }
  return { media, attrs }
}

test('motion: the attribute and the media query both count, and both notify once', async () => {
  const { media, attrs } = setup()
  const { reducedMotion, onMotionChange, setMotion } = await import('../dist/core/motion.js?one')
  assert.equal(reducedMotion(), false)
  const seen = []
  const off = onMotionChange((r) => seen.push(r))
  setMotion('reduce')
  assert.equal(attrs.get('data-sv-motion'), 'reduce')
  assert.equal(reducedMotion(), true)
  assert.deepEqual(seen, [true], 'the synchronous notify and the observer report one change, not two')
  setMotion('auto')
  assert.equal(attrs.has('data-sv-motion'), false)
  assert.deepEqual(seen, [true, false])
  media.matches = true
  media.handlers.forEach((fn) => fn())
  assert.equal(reducedMotion(), true)
  assert.deepEqual(seen, [true, false, true])
  setMotion('reduce') // already effectively reduced by the OS: no change to report
  assert.deepEqual(seen, [true, false, true])
  off()
  media.matches = false
  media.handlers.forEach((fn) => fn())
  assert.equal(reducedMotion(), true, 'the attribute still asks for less motion')
  setMotion('auto')
  assert.equal(reducedMotion(), false)
  assert.deepEqual(seen, [true, false, true], 'unsubscribed listeners hear nothing')
})

test('motion: prefersReducedMotion() from the driver reports the effective preference before init', async () => {
  setup()
  const { prefersReducedMotion } = await import('../dist/core/driver.js?motionpref')
  const { setMotion } = await import('../dist/core/motion.js?one')
  assert.equal(prefersReducedMotion(), false)
  setMotion('reduce')
  assert.equal(prefersReducedMotion(), true)
  setMotion('auto')
})
