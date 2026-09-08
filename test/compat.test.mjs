import assert from 'node:assert/strict'
import { test } from 'node:test'

function makeDocument(appended) {
  // documentElement carries the marker compat() leaves for styles/pin.css and
  // for the driver's pin helper, so it models the attribute pair, never one
  // half of it
  const documentElement = {
    attrs: new Map(),
    classList: { add: () => {} },
    scrollHeight: 4000,
    setAttribute: (name, value) => documentElement.attrs.set(name, value),
    removeAttribute: (name) => documentElement.attrs.delete(name),
    hasAttribute: (name) => documentElement.attrs.has(name),
  }
  return {
    documentElement,
    querySelector: () => null,
    createElement: () => {
      const el = { attrs: {}, textContent: '' }
      el.setAttribute = (k, v) => (el.attrs[k] = v)
      return el
    },
    head: { appendChild: (el) => appended.push(el) },
  }
}

// A fake element for the ResizeObserver stub, modelling the browser: `scale`
// is an ancestor `transform: scale()`, which inflates getBoundingClientRect
// (a paint box) and leaves clientWidth/clientHeight (the layout box, padding
// included, border excluded) alone. `width`/`height` are the content box.
function makeEl({ width, height, padding = 0, border = 0, scale = 1, writingMode = 'horizontal-tb' }) {
  return {
    clientWidth: width + 2 * padding,
    clientHeight: height + 2 * padding,
    getBoundingClientRect: () => ({
      width: (width + 2 * padding + 2 * border) * scale,
      height: (height + 2 * padding + 2 * border) * scale,
    }),
    computedStyle: {
      borderLeftWidth: `${border}px`,
      borderRightWidth: `${border}px`,
      borderTopWidth: `${border}px`,
      borderBottomWidth: `${border}px`,
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
      paddingTop: `${padding}px`,
      paddingBottom: `${padding}px`,
      writingMode,
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
  // The deck fallback is the one rule that must PARSE below the comparison
  // function floor: its transform carries the whole unstacking, and an
  // invalid one leaves every card in pin.css's shared grid cell. Every other
  // rule that reaches for max() (sv-drift's fade) keeps a plain declaration
  // in front of it, so an old parser drops the upgrade and keeps the
  // fallback. Scoped to the deck rules for that reason, selector included.
  const deckRules = appended[0].textContent.match(/[^{}]*sv-deck[^{}]*\{[^}]*\}/g) || []
  assert.ok(deckRules.length >= 2, 'deck fallback rules found')
  assert.ok(!deckRules.join('\n').includes('min('), 'no min() in the deck fallback')
  assert.ok(!deckRules.join('\n').includes('max('), 'no max() in the deck fallback')

  // IO stub reports visible immediately (canvas harness never pauses)
  let seen = null
  new window.IntersectionObserver((entries) => (seen = entries)).observe('el')
  assert.equal(seen[0].isIntersecting, true)

  // RO stub: a record shaped like a real ResizeObserverEntry (contentRect,
  // contentBoxSize), computed from getBoundingClientRect minus border and
  // padding, not a bare `{ target }` (src/canvas/index.ts reads
  // entry.contentRect.width directly and would throw on that).
  // Measured from the LAYOUT box: this element sits under an ancestor
  // `transform: scale(2)`, so its bounding rect is doubled while its layout
  // size is not. A contentRect derived from the rect would hand the canvas
  // harness a 200x120 content box and settle its backing store there.
  const el = makeEl({ width: 100, height: 60, padding: 10, border: 2, scale: 2 })
  let roEntries = null
  new window.ResizeObserver((entries) => (roEntries = entries)).observe(el)
  assert.equal(roEntries.length, 1)
  assert.equal(roEntries[0].target, el)
  assert.equal(roEntries[0].contentRect.width, 100)
  assert.equal(roEntries[0].contentRect.height, 60)
  assert.equal(roEntries[0].contentBoxSize[0].inlineSize, 100)
  assert.equal(roEntries[0].contentBoxSize[0].blockSize, 60)

  // Vertical writing mode: inline axis runs down the block, so inlineSize is
  // the height and blockSize the width. contentRect stays physical.
  const vertical = makeEl({ width: 100, height: 60, writingMode: 'vertical-rl' })
  let verticalEntries = null
  new window.ResizeObserver((entries) => (verticalEntries = entries)).observe(vertical)
  assert.equal(verticalEntries[0].contentRect.width, 100)
  assert.equal(verticalEntries[0].contentRect.height, 60)
  assert.equal(verticalEntries[0].contentBoxSize[0].inlineSize, 60)
  assert.equal(verticalEntries[0].contentBoxSize[0].blockSize, 100)

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
  assert.equal(
    document.documentElement.hasAttribute('data-sv-compat'),
    false,
    'and no marker either: a modern page must keep the plain, unpatched rendering'
  )
})

test('compat: with the fallback sheet installed the pin skeleton stays whole below the floor (ADU-168)', async () => {
  // Two fixes that were each right alone. styles/pin.css releases `.sv-stage`
  // below the individual-transform floor (ADU-149) and the pin helper withholds
  // the tall wrapper height there (ADU-158), because nothing down there
  // animates and a pinned skeleton would be dead scroll. With compat() the
  // curtains and the rail DO animate, from --sv-pin, which is computed from
  // exactly that skeleton: without it the clock jumps 0 to 1 over a single
  // pixel and the fallback sheet README sells snaps instead of animating.
  // Both releases read compat's marker, so the CSS and the JS agree.
  const appended = []
  // a browser in the compat band with observers of its own (Chrome 64-103,
  // Safari 13.1-14.0): the fallback sheet is the only patch it needs
  const observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.window = {
    innerHeight: 1000,
    scrollY: 0,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    ResizeObserver: observer,
    IntersectionObserver: observer,
    CSS: { supports: (prop) => prop !== 'translate' },
  }
  global.document = makeDocument(appended)
  global.ResizeObserver = observer
  global.IntersectionObserver = observer
  global.requestAnimationFrame = () => 1

  const { compat } = await import('../dist/compat/index.js')
  assert.equal(compat(), true, 'the fallback sheet goes in')
  assert.equal(appended.length, 1, 'and it is the only patch this browser needs')
  assert.ok(
    appended[0].textContent.includes('var(--sv-pin'),
    'the sheet really does animate the pin presets from --sv-pin, which is what needs the skeleton'
  )
  assert.equal(
    document.documentElement.hasAttribute('data-sv-compat'),
    true,
    'the marker lands where BOTH readers can see it: pin.css on <html>, the driver on documentElement'
  )

  const { track } = await import('../dist/core/driver.js?compatpin')
  const el = {
    style: { height: '', position: '', setProperty: () => {}, removeProperty: () => {} },
    classes: new Set(),
    attrs: new Set(),
    classList: {
      add: (c) => el.classes.add(c),
      remove: (c) => el.classes.delete(c),
      toggle: () => {},
      contains: (c) => el.classes.has(c),
    },
    setAttribute: (name) => el.attrs.add(name),
    removeAttribute: (name) => el.attrs.delete(name),
    hasAttribute: (name) => el.attrs.has(name),
    getBoundingClientRect: () => ({ top: 0, bottom: 400, height: 400, width: 800 }),
    parentElement: null,
    contains: () => false,
  }
  const untrack = track(el, { pin: '320vh' })
  assert.equal(
    el.style.height,
    '320vh',
    'the tall wrapper is written again: the fallback curtains and rail have a clock to animate on'
  )
  untrack()
  assert.equal(el.style.height, '', 'and untrack still restores the authored height')
})

test('compat: ResizeObserver reattaches window listeners after disconnect/reobserve', async () => {
  const { compat } = await import('../dist/compat/index.js')
  const listeners = new Map()
  global.window = {
    addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn) },
    removeEventListener: (type, fn) => listeners.get(type)?.delete(fn),
    getComputedStyle: el => el.computedStyle,
  }
  global.document = makeDocument([])
  compat()
  let calls = 0
  const observer = new window.ResizeObserver(() => calls++)
  const el = makeEl({ width: 100, height: 100 })
  observer.observe(el)
  observer.disconnect()
  observer.observe(el)
  observer.observe(el)
  assert.equal(listeners.get('resize').size, 1)
  const before = calls
  for (const fn of listeners.get('resize')) fn()
  assert.equal(calls, before + 1, 'resize remains live after slider-style disconnect/reobserve')
  observer.disconnect()
  assert.equal(listeners.get('resize').size, 0)
  assert.equal(listeners.get('orientationchange').size, 0)
})
