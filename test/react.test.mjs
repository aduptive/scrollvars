import assert from 'node:assert/strict'
import { test } from 'node:test'

// Server-render the React layer with renderToStaticMarkup — no DOM, no
// jsdom: exactly what Next.js does on the server, so this also guards SSR.

function stubBrowserGlobals() {
  // the components call browser APIs only in effects, which never run in
  // renderToStaticMarkup — but module init must survive a bare import
  global.window = undefined
}

test('react: Slider renders the APG carousel contract', async () => {
  stubBrowserGlobals()
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')

  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { label: 'cases', arrows: true, dots: true, autoplay: 4000 },
      React.createElement('div', null, 'one'),
      React.createElement('div', null, 'two')
    )
  )
  assert.match(html, /role="region"/)
  assert.match(html, /aria-roledescription="carousel"/)
  assert.match(html, /aria-label="cases"/)
  // visible rotation control, present because autoplay is on
  assert.match(html, /class="sv-pause"/)
  assert.match(html, /aria-label="stop slide rotation"/)
  // slides annotated in place, no wrapper elements
  assert.match(html, /aria-roledescription="slide"/)
  assert.match(html, /aria-label="1 of 2"/)
  assert.match(html, /aria-label="2 of 2"/)
  // rotating → the track is aria-live off; arrows/dots labeled
  assert.match(html, /aria-live="off"/)
  assert.match(html, /aria-label="previous slide"/)
  assert.match(html, /aria-label="go to slide 2"/)
})

test('react: Slider without autoplay has no pause control and is polite', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(Slider, null, React.createElement('div', null, 'one'))
  )
  assert.doesNotMatch(html, /sv-pause/)
  assert.match(html, /aria-live="polite"/)
})

test('react: Scenes forwards options without leaking props to the DOM', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Scenes } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(
      Scenes,
      { count: 3, snap: false, once: true, onScene: () => {}, distance: '4rem' },
      ({ scene }) => React.createElement('span', null, `scene ${scene}`)
    )
  )
  // tracking options must NOT appear as DOM attributes
  assert.doesNotMatch(html, /snap|onScene|once=/)
  // VarProps compile to the CSS variable
  assert.match(html, /--sv-distance:4rem/)
  assert.match(html, /scene 0/)
})

test('react: Marquee duplicate is aria-hidden and inert', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Marquee } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(Marquee, null, React.createElement('a', { href: '#x' }, 'logo'))
  )
  // both React majors must render the same markup: React 19 knows `inert`
  // as a boolean and React 18 does not, so the source picks `true` or `''`
  // accordingly (see src/react/index.tsx), but the two must land on the
  // same wire format either way.
  assert.match(html, /aria-hidden="true"[^>]*inert=""/)
})


test('<Split by="char"> renders one span per grapheme, matching --sv-count', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Split } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(React.createElement(Split, { by: 'char' }, 'a👨‍👩‍👧'))
  const spans = (html.match(/aria-hidden="true"/g) || []).length
  assert.equal(spans, 2, 'a + one family emoji (a ZWJ sequence), not five code points')
  assert.ok(html.includes('--sv-count:2'))
})

// The ref-attach tests below need real mount/unmount lifecycle (refs never
// commit under renderToStaticMarkup), so they render through react-dom
// against a hand-rolled DOM, same spirit as driver.test.mjs's fake elements,
// extended just enough for react-dom's own host config: firstChild + a
// minimal innerHTML parse, because react-dom builds an inert <script> by
// innerHTML-parsing "<tag></tag>" on a wrapper and pulling firstChild back
// out (real trick, see react-dom-client.development.js, the "script" case).
// One process (module-level driver state, ResizeObserver singleton on
// documentElement), so these run as one sequential group, like driver.test.mjs.

function makeNode(tag) {
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    parentNode: null,
    childNodes: [],
    attributes: {},
    style: { setProperty(name, value) { node.style[name] = value } },
    classes: new Set(),
    classList: {
      add: (c) => node.classes.add(c),
      remove: (c) => node.classes.delete(c),
      toggle: (c, on) => (on ? node.classes.add(c) : node.classes.delete(c)),
      contains: (c) => node.classes.has(c),
      get length() { return node.classes.size },
      [Symbol.iterator]() { return node.classes[Symbol.iterator]() },
    },
    ownerDocument: null,
    _listeners: {},
    appendChild(child) {
      node.childNodes.push(child)
      child.parentNode = node
      return child
    },
    insertBefore(child, ref) {
      const i = ref ? node.childNodes.indexOf(ref) : -1
      if (i === -1) node.childNodes.push(child)
      else node.childNodes.splice(i, 0, child)
      child.parentNode = node
      return child
    },
    removeChild(child) {
      const i = node.childNodes.indexOf(child)
      if (i !== -1) node.childNodes.splice(i, 1)
      if (child) child.parentNode = null
      return child
    },
    setAttribute(name, value) { node.attributes[name] = String(value) },
    removeAttribute(name) { delete node.attributes[name] },
    getAttribute(name) { return node.attributes[name] ?? null },
    hasAttribute(name) { return name in node.attributes },
    addEventListener(type, fn) { (node._listeners[type] ??= []).push(fn) },
    removeEventListener(type, fn) {
      const arr = node._listeners[type]
      if (!arr) return
      const i = arr.indexOf(fn)
      if (i !== -1) arr.splice(i, 1)
    },
    dispatchEvent() { return true },
    getBoundingClientRect() { return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } },
    contains(other) {
      let n = other
      while (n) { if (n === node) return true; n = n.parentNode }
      return false
    },
    get firstChild() { return node.childNodes[0] ?? null },
  }
  Object.defineProperty(node, 'innerHTML', {
    get() { return node._innerHTML ?? '' },
    set(html) {
      node._innerHTML = html
      const m = /^<([a-zA-Z][a-zA-Z0-9]*)><\/\1>$/.exec(html)
      if (m && node.ownerDocument) {
        const child = node.ownerDocument.createElement(m[1])
        node.childNodes = [child]
        child.parentNode = node
      }
    },
  })
  return node
}

const observedRO = new Set()
let domReady = false

function ensureDom() {
  if (domReady) return
  domReady = true

  const doc = makeNode('#document')
  doc.nodeType = 9
  doc.createElement = (tag) => {
    const el = makeNode(tag)
    el.ownerDocument = doc
    return el
  }
  doc.createTextNode = (text) => ({ nodeType: 3, textContent: text, parentNode: null })
  doc.createComment = (text) => ({ nodeType: 8, textContent: text, parentNode: null })
  doc.body = makeNode('body')
  doc.body.ownerDocument = doc
  doc.head = makeNode('head')
  doc.head.ownerDocument = doc
  doc.documentElement = makeNode('html')
  doc.documentElement.ownerDocument = doc
  doc.addEventListener = () => {}
  doc.removeEventListener = () => {}
  doc.activeElement = null
  doc.querySelectorAll = () => []
  doc.HTMLIFrameElement = class HTMLIFrameElement {}

  global.MutationObserver = class {
    observe() {}
    disconnect() {}
  }
  global.ResizeObserver = class {
    observe(el) { observedRO.add(el) }
    unobserve(el) { observedRO.delete(el) }
    disconnect() {}
  }
  global.HTMLIFrameElement = doc.HTMLIFrameElement
  global.HTMLElement = Object
  global.IS_REACT_ACT_ENVIRONMENT = true
  global.getComputedStyle = () => ({ getPropertyValue: () => '', position: 'static' })
  global.requestAnimationFrame = () => 1
  global.cancelAnimationFrame = () => {}
  global.location = { search: '' }
  global.window = {
    innerHeight: 800,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    scrollTo: () => {},
    document: doc,
    HTMLIFrameElement: doc.HTMLIFrameElement,
    location: global.location,
  }
  doc.defaultView = global.window
  global.document = doc
  global.navigator = { userAgent: 'node' }
}

async function ensureDomAndWarmDriver() {
  const alreadyReady = domReady
  ensureDom()
  if (alreadyReady) return
  // the driver's init() runs on the first track() call and observes
  // document.documentElement once, for the lifetime of the process: warm
  // it up here so every test's own `before` baseline already includes it
  const { track } = await import('../dist/core/driver.js')
  const warmup = global.document.createElement('div')
  track(warmup)()
}

test('react: useTrack attaches through the ref setter (conditional mount), untracks on unmount', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useTrack } = await import('../dist/react/index.js')

  function Cond({ show }) {
    const ref = useTrack()
    return show ? React.createElement('div', { ref }) : null
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)
  const before = observedRO.size

  await act(async () => { root.render(React.createElement(Cond, { show: false })) })
  // not rendered yet: a mount-effect keyed on options (which never change)
  // would have nothing to re-run against, this is the case it used to miss
  assert.equal(observedRO.size, before, 'nothing tracked before the node exists')

  await act(async () => { root.render(React.createElement(Cond, { show: true })) })
  assert.equal(observedRO.size, before + 1, 'the node is tracked the moment it attaches')

  await act(async () => { root.unmount() })
  assert.equal(observedRO.size, before, 'untracked on unmount')
})

test('react: useTrack moves the tracking when the node is replaced', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useTrack } = await import('../dist/react/index.js')

  function Keyed({ k }) {
    const ref = useTrack()
    return React.createElement('div', { ref, key: k })
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)
  const before = observedRO.size

  await act(async () => { root.render(React.createElement(Keyed, { k: 'a' })) })
  assert.equal(observedRO.size, before + 1)

  await act(async () => { root.render(React.createElement(Keyed, { k: 'b' })) })
  // the old node untracked, the new one tracked: net count unchanged
  assert.equal(observedRO.size, before + 1, 'old node untracked, new node tracked')

  await act(async () => { root.unmount() })
  assert.equal(observedRO.size, before)
})

test('react: Scenes pin="320vh" sets the wrapper height, pin={false} sets none', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Scenes } = await import('../dist/react/index.js')

  function firstDiv(n) {
    for (const c of n.childNodes || []) {
      if (c.tagName === 'DIV') return c
      const found = firstDiv(c)
      if (found) return found
    }
    return null
  }

  const pinnedContainer = global.document.createElement('div')
  const pinnedRoot = createRoot(pinnedContainer)
  await act(async () => {
    pinnedRoot.render(React.createElement(Scenes, { count: 3, pin: '320vh' }, () => null))
  })
  assert.equal(firstDiv(pinnedContainer)?.style.height, '320vh')
  await act(async () => { pinnedRoot.unmount() })

  const unpinnedContainer = global.document.createElement('div')
  const unpinnedRoot = createRoot(unpinnedContainer)
  await act(async () => {
    unpinnedRoot.render(React.createElement(Scenes, { count: 3, pin: false }, () => null))
  })
  assert.equal(firstDiv(unpinnedContainer)?.style.height, undefined)
  await act(async () => { unpinnedRoot.unmount() })
})

test('react: ScrollVarsBoot renders the nonce on the pre-paint script tag', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { ScrollVarsBoot } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(React.createElement(ScrollVarsBoot, { nonce: 'abc123' }))
  assert.match(html, /<script nonce="abc123"/)
})

test('react: ScrollVarsBoot debug overlay never mounts if unmounted before the dynamic import resolves', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { ScrollVarsBoot } = await import('../dist/react/index.js')

  global.location = { search: '?sv-debug' }
  let appended = 0
  const realAppend = global.document.body.appendChild.bind(global.document.body)
  global.document.body.appendChild = (child) => {
    appended++
    return realAppend(child)
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)
  // mount then unmount with no `await` between them: the debug module's
  // dynamic import can only resolve on a later microtask, so `disposed` is
  // already true by the time its .then() runs, no matter how fast it loads
  act(() => {
    root.render(React.createElement(ScrollVarsBoot, { nonce: 'x' }))
  })
  act(() => {
    root.unmount()
  })
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(appended, 0, 'the debug overlay never appended to document.body')
})
