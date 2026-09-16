import test from 'node:test'
import assert from 'node:assert/strict'

function element() {
  const attrs = new Map(), classes = new Set(), values = new Map()
  return {
    style: { height: '', position: '', setProperty: (k, v) => values.set(k, String(v)),
      removeProperty: k => values.delete(k), getPropertyValue: k => values.get(k) ?? '', getPropertyPriority: () => '' },
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
      toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
    setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k),
    hasAttribute: k => attrs.has(k), getAttribute: k => attrs.get(k) ?? null,
    getBoundingClientRect: () => ({ top: 300, bottom: 700, height: 400 }),
    querySelectorAll: () => [], querySelector: () => null,
    scrollHeight: 2000, parentElement: null,
  }
}
let sequence = 0
async function environment() {
  const frames = new Map(), listeners = {}, errors = []
  let id = 0
  global.requestAnimationFrame = fn => { frames.set(++id, fn); return id }
  global.cancelAnimationFrame = id => frames.delete(id)
  global.window = { innerHeight: 1000, scrollY: 0, addEventListener: (k, fn) => { listeners[k] = fn }, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) }
  global.document = { documentElement: element(), styleSheets: [], querySelectorAll: () => [] }
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  global.MutationObserver = class { observe() {} disconnect() {} }
  delete global.IntersectionObserver
  global.getComputedStyle = () => ({ position: 'static', opacity: '1', getPropertyValue: () => '' })
  global.reportError = error => errors.push(error)
  const driver = await import(`../dist/core/driver.js?status-${++sequence}`)
  driver.setPageOutputs(false)
  const frame = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()) }
  return { ...driver, frame, errors, scroll: () => { listeners.scroll?.(); frame() } }
}

test('status: initial failure settles before notification and permits explicit retry', async () => {
  const env = await environment(), el = element(), seen = []
  const RO = global.ResizeObserver
  delete global.ResizeObserver
  const stop = env.track(el, { onStatus: status => {
    seen.push(status)
    if (status === 'failed') assert.ok(el.hasAttribute('data-sv-off'))
  } })
  assert.deepEqual(seen, ['attaching', 'failed'])
  stop()
  global.ResizeObserver = RO
  const retry = env.track(el, { onStatus: s => seen.push(s) })
  env.frame()
  assert.deepEqual(seen, ['attaching', 'failed', 'attaching', 'active'])
  retry()
})

test('status: active follows measurement and output, once per transition', async () => {
  const env = await environment(), el = element(), seen = []
  const stop = env.track(el, { travel: true, onStatus: s => {
    seen.push(s)
    if (s === 'active') assert.notEqual(el.style.getPropertyValue('--sv-t'), '')
  } })
  assert.deepEqual(seen, ['attaching'])
  env.frame(); env.scroll(); env.scroll()
  assert.deepEqual(seen, ['attaching', 'active'])
  stop()
})

test('status: active then runtime failure settles only the failed lease', async () => {
  const env = await environment(), el = element(), seen = [], healthy = []
  const stop = env.track(el, { onStatus: s => {
    seen.push(s)
    if (s === 'failed') assert.ok(el.hasAttribute('data-sv-off'))
  } })
  const sibling = env.track(element(), { onStatus: s => healthy.push(s) })
  env.frame()
  el.getBoundingClientRect = () => { throw Error('measure') }
  env.scroll(); env.scroll(); stop()
  assert.deepEqual(seen, ['attaching', 'active', 'failed'])
  assert.deepEqual(healthy, ['attaching', 'active'])
  assert.equal(env.errors.length, 1)
  sibling()
})

test('status: failed initial output never announces active', async () => {
  const env = await environment(), el = element(), seen = []
  const write = el.style.setProperty
  el.style.setProperty = (k, v) => { if (k === '--sv-view') throw Error('output'); write(k, v) }
  env.track(el, { onStatus: s => seen.push(s) })
  env.frame()
  assert.deepEqual(seen, ['attaching', 'failed'])
})

test('status: active then release is final even with queued work and repeated cleanup', async () => {
  const env = await environment(), el = element(), seen = []
  const stop = env.track(el, { onStatus: s => {
    seen.push(s)
    if (s === 'released') assert.ok(el.hasAttribute('data-sv-off'))
  } })
  env.frame(); env.refresh(); stop(); stop(); env.frame(); env.scroll()
  assert.deepEqual(seen, ['attaching', 'active', 'released'])
})

test('status: reentrant replacement from active leaves the successor owned and old cleanup inert', async () => {
  const env = await environment(), el = element(), old = [], next = []
  let stopNext
  const stop = env.track(el, { onStatus: s => {
    old.push(s)
    if (s === 'active') stopNext = env.track(el, { travel: true, onStatus: s => next.push(s) })
  } })
  env.frame(); env.frame(); stop(); env.scroll()
  assert.deepEqual(old, ['attaching', 'active', 'released'])
  assert.deepEqual(next, ['attaching', 'active'])
  assert.notEqual(el.style.getPropertyValue('--sv-t'), '')
  stopNext()
})

test('status: release callback replacement wins over the interrupted attachment', async () => {
  const env = await environment(), el = element(), middle = [], last = []
  let stopLast
  env.track(el, { onStatus: s => {
    if (s === 'released') stopLast = env.track(el, { onStatus: s => last.push(s) })
  } })
  env.frame()
  const stopMiddle = env.track(el, { onStatus: s => middle.push(s) })
  env.frame(); stopMiddle(); env.scroll()
  assert.deepEqual(middle, ['attaching', 'released'])
  assert.deepEqual(last, ['attaching', 'active'])
  stopLast()
})

test('status: a callback that replaces then throws never notifies the released lease again', async () => {
  const env = await environment(), el = element(), seen = [], next = []
  let stopNext
  const stop = env.track(el, { onTravel: () => {
    stopNext = env.track(el, { onStatus: s => next.push(s) })
    throw Error('old callback')
  }, onStatus: s => seen.push(s) })
  env.frame(); env.frame(); stop()
  assert.deepEqual(seen, ['attaching', 'released'])
  assert.deepEqual(next, ['attaching', 'active'])
  assert.equal(env.errors.length, 1)
  stopNext()
})

test('status: motion reversal preserves an active lease and resumes pin geometry', async () => {
  const env = await environment(), el = element(), seen = []
  const { setMotion } = await import('../dist/core/motion.js')
  const stop = env.track(el, { pin: '300vh', onStatus: s => seen.push(s) })
  env.frame()
  setMotion('reduce'); env.frame()
  assert.equal(el.style.getPropertyValue('height'), '')
  setMotion('auto'); env.frame()
  assert.equal(el.style.height, '300vh')
  assert.deepEqual(seen, ['attaching', 'active'])
  stop()
})

test('status: once completes after its final output without a spurious active or release', async () => {
  const env = await environment(), el = element(), seen = []
  const stop = env.track(el, { once: true, onStatus: s => {
    seen.push(s)
    if (s === 'completed') assert.equal(el.style.getPropertyValue('--sv-live'), '1')
  } })
  env.frame(); stop(); env.scroll()
  assert.deepEqual(seen, ['attaching', 'completed'])
})

test('status: terminal watchdog refuses later retries', async () => {
  const env = await environment(), el = element(), seen = []
  const stop = env.track(el, { onStatus: s => seen.push(s) })
  env.frame(); env.releaseBoot(); stop()
  env.track(el, { onStatus: s => seen.push(s) })
  env.frame()
  assert.deepEqual(seen, ['attaching', 'active', 'released', 'attaching', 'failed'])
})

test('status: reentrant replacement during attaching prevents stale setup', async () => {
  const env = await environment(), el = element(), seen = [], next = []
  let stopNext
  const stop = env.track(el, { pin: '300vh', onStatus: s => {
    seen.push(s)
    if (s === 'attaching') stopNext = env.track(el, { onStatus: s => next.push(s) })
  } })
  env.frame(); stop()
  assert.deepEqual(seen, ['attaching', 'released'])
  assert.deepEqual(next, ['attaching', 'active'])
  assert.notEqual(el.style.height, '300vh', 'interrupted setup cannot write pin geometry')
  stopNext()
})

test('status: a throwing active notification fails only its own lease and reports once', async () => {
  const env = await environment(), el = element(), seen = []
  const stop = env.track(el, { onStatus: s => {
    seen.push(s)
    if (s === 'active') throw Error('status callback')
  } })
  env.frame(); env.scroll(); stop()
  assert.deepEqual(seen, ['attaching', 'active', 'failed'])
  assert.ok(el.hasAttribute('data-sv-off'))
  assert.equal(env.errors.length, 1)
})
