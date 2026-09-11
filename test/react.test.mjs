import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

// Server-render the React layer with renderToStaticMarkup: no DOM, no
// jsdom: exactly what Next.js does on the server, so this also guards SSR.

function stubBrowserGlobals() {
  // the components call browser APIs only in effects, which never run in
  // renderToStaticMarkup, but module init must survive a bare import
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

test('react: Slider responsive perView survives SSR under both React majors', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { perView: { base: 1.2, md: 2.5 } },
      React.createElement('div', null, 'one')
    )
  )
  // react-dom 18.3.1 escapes `"` to `&quot;` inside a <style> child (19 does
  // not), and <style> is raw text: the entity never decodes, so every scoped
  // rule would be dropped on the server and hydration never repairs it
  assert.match(html, /\[data-sv-uid="[^"]+"\] > \.sv-slider\{--sv-per-view:1\.2\}/)
  assert.match(html, /@media \(min-width:768px\)\{\[data-sv-uid="/)
  assert.doesNotMatch(html, /&quot;/)
})

test('react: a perView value cannot break out of the Slider <style>', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  // that sheet goes through dangerouslySetInnerHTML, so React's `</style`
  // escaping is gone: a perView off a CMS is untyped data, and only the
  // Number() coercion in perViewCss keeps this inert
  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { perView: { base: '1}</style><script>window.__pwned=1</script><style>a{b:c', md: 2 } },
      React.createElement('div', null, 'one')
    )
  )
  // one <style>, closed once: the value could not end the element. Before the
  // coercion this rendered a literal </style> and a live <script> in Chrome
  assert.equal(html.match(/<style>/g).length, 1)
  assert.equal(html.match(/<\/style>/g).length, 1)
  assert.doesNotMatch(html, /<script/)
  // the declaration still renders, invalid so the parser drops it
  assert.match(html, /--sv-per-view:NaN\}/)
})

test('react: numeric perView renders its rules unchanged, keys and values', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { perView: { base: 1.5, md: 3, 900: 4 } },
      React.createElement('div', null, 'one')
    )
  )
  assert.match(html, /\.sv-slider\{--sv-per-view:1\.5\}/)
  assert.match(html, /@media \(min-width:768px\)\{\[data-sv-uid="[^"]+"\] > \.sv-slider\{--sv-per-view:3\}\}/)
  // a raw min-width key stays that number
  assert.match(html, /@media \(min-width:900px\)\{\[data-sv-uid="[^"]+"\] > \.sv-slider\{--sv-per-view:4\}\}/)
  assert.doesNotMatch(html, /NaN/)
})

test('react: Slider counts the slides React renders, not the children it was handed', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  // ordinary React: a conditional slide is `false`, a missing one is `null`.
  // Children.count sees 4, the rail gets 2 elements, so the extra dots used to
  // call goTo(2) and goTo(3) on a two-slide engine and the labels lied
  const html = renderToStaticMarkup(
    React.createElement(Slider, { dots: true }, [
      React.createElement('div', { key: 'a' }, 'one'),
      false,
      null,
      React.createElement('div', { key: 'b' }, 'two'),
    ])
  )
  assert.equal(html.match(/aria-label="go to slide \d+"/g).length, 2)
  assert.match(html, /aria-label="1 of 2"/)
  assert.match(html, /aria-label="2 of 2"/)
  assert.doesNotMatch(html, /of 4/)
})

test('react: Slider annotates the slides inside a fragment', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  // a mapped fragment is one child to Children.count and two elements in the
  // rail. cloneElement on a Fragment drops role/aria-*, so neither slide
  // carried any of the annotation the component promises
  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { dots: true },
      React.createElement(
        React.Fragment,
        null,
        React.createElement('div', { key: 'a' }, 'one'),
        React.createElement('div', { key: 'b' }, 'two')
      )
    )
  )
  assert.equal(html.match(/aria-roledescription="slide"/g).length, 2)
  assert.equal(html.match(/aria-label="go to slide \d+"/g).length, 2)
  assert.match(html, /aria-label="1 of 2"/)
  assert.match(html, /aria-label="2 of 2"/)
})

test('react: an outer Slider perView cannot declare on a nested slider rail', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { perView: { base: 1.2 } },
      React.createElement(
        'div',
        null,
        React.createElement(
          Slider,
          { perView: { base: 3 } },
          React.createElement('div', null, 'one')
        )
      )
    )
  )
  // the inner rail is a descendant of the outer shell but never its child:
  // a descendant scope declared --sv-per-view on it, and the inner rail only
  // inherits its own value, so the outer map won every nesting
  assert.doesNotMatch(html, /\[data-sv-uid="[^"]+"\] \.sv-slider\{/)
  assert.equal(html.match(/\[data-sv-uid="[^"]+"\] > \.sv-slider\{/g).length, 2)
})

test('react: a driver boot after the pre-paint watchdog fired does not re-hide the page', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { ScrollVarsBoot } = await import('../dist/react/index.js')
  const source = renderToStaticMarkup(React.createElement(ScrollVarsBoot, null))
    .replace(/^<script[^>]*>/, '')
    .replace(/<\/script>$/, '')

  // one token list, and a MutationObserver stub that delivers on every class
  // write: the real one delivers a microtask later, which only widens the
  // window this guards, it never closes it
  function sandbox() {
    const classes = new Set()
    const callbacks = []
    const timers = []
    const notify = () => callbacks.slice().forEach((cb) => cb())
    const documentElement = {
      classList: {
        add: (c) => (classes.add(c), notify()),
        remove: (c) => (classes.delete(c), notify()),
        contains: (c) => classes.has(c),
      },
    }
    const win = { IntersectionObserver: class {}, ResizeObserver: class {} }
    const MO = class {
      constructor(cb) {
        this.cb = cb
      }
      observe() {
        callbacks.push(this.cb)
      }
    }
    new Function('window', 'document', 'setTimeout', 'MutationObserver', source)(
      win,
      { documentElement },
      (fn, ms) => timers.push([fn, ms]),
      MO
    )
    return {
      timers,
      win,
      boot: () => documentElement.classList.add('sv-on'),
      release: () => documentElement.classList.remove('sv-on'),
      on: () => documentElement.classList.contains('sv-on'),
    }
  }

  const late = sandbox()
  assert.ok(late.on(), 'the pre-paint script adds sv-on before first paint')
  assert.equal(late.timers[0][1], 3000)
  late.timers[0][0]() // 3s, no driver: the page is released, content is visible
  assert.ok(!late.on())
  // the bundle finally arrives at 4s and the driver adds sv-on back, which
  // sent every offscreen entrance to opacity 0: content appeared, then vanished
  late.boot()
  assert.ok(!late.on(), 'a boot after the watchdog must not re-hide what is already on screen')

  const normal = sandbox()
  normal.win.__scrollvars = true
  normal.timers[0][0]() // the driver booted in time: nothing to release
  assert.ok(normal.on())
  normal.release()
  normal.boot()
  assert.ok(normal.on(), 'no watchdog fire, no class guard: the driver owns sv-on')
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

// A node has exactly ONE position in the tree: appendChild and insertBefore
// MOVE a node that already has a parent, they never copy it. A stub that only
// splices the new position in leaves the node listed twice, and a reorder (the
// only thing that exercises keys) reads as a tree that grew instead of one
// whose children swapped places.
function detach(child) {
  const parent = child?.parentNode
  if (!parent) return
  const i = parent.childNodes.indexOf(child)
  if (i !== -1) parent.childNodes.splice(i, 1)
  child.parentNode = null
}

function makeNode(tag) {
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    parentNode: null,
    childNodes: [],
    attributes: {},
    style: {
      setProperty(name, value) { node.style[name] = value },
      removeProperty(name) { const value = node.style[name] ?? ''; delete node.style[name]; return value },
    },
    classes: new Set(),
    // classList and the class attribute are two views of ONE token list in a
    // real element: a classList write updates the attribute, and writing the
    // attribute (React committing `className`) replaces every token, engine
    // classes included. A stub where they drift cannot see that collision.
    classList: {
      add: (c) => (node.classes.add(c), syncClass()),
      remove: (c) => (node.classes.delete(c), syncClass()),
      toggle: (c, on) => ((on ? node.classes.add(c) : node.classes.delete(c)), syncClass()),
      contains: (c) => node.classes.has(c),
      get length() { return node.classes.size },
      [Symbol.iterator]() { return node.classes[Symbol.iterator]() },
    },
    ownerDocument: null,
    _listeners: {},
    appendChild(child) {
      detach(child)
      node.childNodes.push(child)
      child.parentNode = node
      return child
    },
    insertBefore(child, ref) {
      // detach first, then read the reference's index: removing a preceding
      // sibling shifts it, exactly as it does in a real DOM
      detach(child)
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
    setAttribute(name, value) {
      node.attributes[name] = String(value)
      if (name === 'class') node.classes = new Set(String(value).split(/\s+/).filter(Boolean))
    },
    removeAttribute(name) {
      delete node.attributes[name]
      if (name === 'class') node.classes = new Set()
    },
    toggleAttribute(name, force) {
      const on = force === undefined ? !(name in node.attributes) : !!force
      if (on) node.attributes[name] = ''
      else delete node.attributes[name]
      return on
    },
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
    // element children only, like the real DOM's `.children` (skips text
    // nodes): the slider walks this to find slides.
    get children() { return node.childNodes.filter((c) => c.nodeType === 1) },
  }
  const syncClass = () => {
    node.attributes.class = [...node.classes].join(' ')
  }
  // react-dom writes one or the other depending on the major: both land on
  // the same token list here, like in a browser
  Object.defineProperty(node, 'className', {
    get() { return [...node.classes].join(' ') },
    set(value) { node.setAttribute('class', value) },
  })
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

// Frame callbacks are QUEUED, never run on their own: same as the old
// `() => 1` stub for every test that ignores them, but a test that needs the
// driver to actually measure (useScenes below) can flush them by hand. It
// has to be a shared queue: the driver holds one pending frame token until
// its callback runs, so a token dropped on the floor here would block every
// later schedule() in the process.
const rafQueue = []
let rafSeq = 0
// which test scheduled a frame: a throwing frame from the test running now
// has to fail it, one left pending by an earlier test must not
let rafEpoch = 0
// the epoch of the frame flushFrames is running, if any. A frame scheduled
// from inside another frame inherits its scheduler's epoch instead of the
// flushing test's: a self-rescheduling leftover (a canvas loop) would
// otherwise be adopted by whichever later test flushes it twice, and blow up
// a test that never scheduled it.
let runningEpoch = null
beforeEach(() => {
  rafEpoch++
})
function flushFrames() {
  // one flush runs exactly the frames pending when it started. Draining
  // until the queue empties would never return for a self-rescheduling
  // frame (a canvas loop, a slider glide), which queues its next frame
  // from inside this one.
  const batch = rafQueue.splice(0)
  for (const { fn, epoch } of batch) {
    const outer = runningEpoch
    runningEpoch = epoch
    try {
      fn(0)
    } catch (error) {
      // frames left behind by earlier tests' torn-down widgets (a destroyed
      // slider's measure, a canvas loop) are not the flushing test's business
      if (epoch === rafEpoch) throw error
    } finally {
      runningEpoch = outer
    }
  }
}

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
  // never fires: nothing here needs a real intersection callback, this
  // stub only exists so mountEffect's `new IntersectionObserver(...)`
  // (useCanvasEffect) doesn't throw against a DOM with no real layout.
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.HTMLIFrameElement = doc.HTMLIFrameElement
  global.HTMLElement = Object
  global.IS_REACT_ACT_ENVIRONMENT = true
  global.getComputedStyle = () => ({ getPropertyValue: () => '', position: 'static' })
  // ids are real: cancelAnimationFrame has to drop the entry, or a widget
  // that cancels its pending frame on teardown still gets it run by the
  // next flush
  global.requestAnimationFrame = (fn) => {
    const id = ++rafSeq
    rafQueue.push({ id, fn, epoch: runningEpoch ?? rafEpoch })
    return id
  }
  global.cancelAnimationFrame = (id) => {
    const i = rafQueue.findIndex((entry) => entry.id === id)
    if (i !== -1) rafQueue.splice(i, 1)
  }
  global.location = { search: '' }
  global.window = {
    innerHeight: 800,
    addEventListener: () => {},
    removeEventListener: () => {},
    // A real MediaQueryList never has addEventListener without its
    // removeEventListener pair (ADU-143's addListener fallback in
    // src/canvas/index.ts asks for the pair explicitly on cleanup).
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
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

test('react: useTrack moves the tracking to the new node by identity, no key change', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useTrack } = await import('../dist/react/index.js')

  // same component instance, no key: React itself replaces the host node
  // because the tag changed (div -> span), the case a count-only assertion
  // cannot distinguish from "still the same node, count coincidentally net."
  function Swapped({ tag }) {
    const ref = useTrack()
    return React.createElement(tag, { ref })
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)

  await act(async () => { root.render(React.createElement(Swapped, { tag: 'div' })) })
  const firstNode = container.firstChild
  assert.ok(observedRO.has(firstNode), 'the first node is tracked')

  await act(async () => { root.render(React.createElement(Swapped, { tag: 'span' })) })
  const secondNode = container.firstChild
  assert.notEqual(secondNode, firstNode, 'a tag swap with no key still replaces the host node')
  assert.ok(!observedRO.has(firstNode), 'the old node is no longer tracked')
  assert.ok(observedRO.has(secondNode), 'the new node is tracked, by identity')

  await act(async () => { root.unmount() })
  assert.ok(!observedRO.has(secondNode), 'untracked on unmount')
})

test('react: useTrack re-tracks the same node when an option changes, the entry reflects the new value', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Track } = await import('../dist/react/index.js')

  const container = global.document.createElement('div')
  const root = createRoot(container)

  await act(async () => { root.render(React.createElement(Track, { pin: '320vh' })) })
  const node = container.firstChild
  assert.equal(node.style.height, '320vh')

  // same node, no key change: only the `pin` option differs between renders
  await act(async () => { root.render(React.createElement(Track, { pin: '480vh' })) })
  assert.equal(container.firstChild, node, 'no remount, same node')
  assert.equal(node.style.height, '480vh', 'the retrack applied the new option to the tracked entry')

  await act(async () => { root.unmount() })
})

test('react: useSlider does not drive a destroyed handle after the tracked node detaches (ADU-106)', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useSlider } = await import('../dist/react/index.js')

  let latestNext = null

  function Cond({ show }) {
    const { ref, next } = useSlider()
    latestNext = next // stable across renders (empty deps), captured once is enough
    return show
      ? React.createElement(
          'div',
          { ref },
          React.createElement('div', null, 'one'),
          React.createElement('div', null, 'two')
        )
      : null
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)

  await act(async () => { root.render(React.createElement(Cond, { show: true })) })
  const next = latestNext

  // detach the target while the component itself stays mounted
  await act(async () => { root.render(React.createElement(Cond, { show: false })) })

  const rafCalls = []
  const realRaf = global.requestAnimationFrame
  global.requestAnimationFrame = (fn) => { rafCalls.push(fn); return realRaf(fn) }
  try {
    assert.doesNotThrow(() => next())
  } finally {
    global.requestAnimationFrame = realRaf
  }
  assert.equal(rafCalls.length, 0, 'no glide starts against a destroyed handle')

  await act(async () => { root.unmount() })
})

// react-dom commits host props onto the DOM node under an internal key. The
// fake DOM has no event system (nothing delegates pointerover into React) and
// renderToStaticMarkup never renders handlers at all, so calling the props
// react-dom committed is the closest thing to a real hover here.
function hostProps(node) {
  const key = Object.keys(node).find((k) => k.startsWith('__reactProps$'))
  assert.ok(key, 'react-dom committed props onto the host node')
  return node[key]
}

test('react: Slider composes consumer pointer handlers with the autoplay hover pause', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  // the autoplay interval callback, captured: firing it by hand keeps the
  // test off the clock. A tick that reaches the handle starts a glide, which
  // schedules a frame; a paused one returns before it ever touches the handle
  const realSetInterval = global.setInterval
  let tick = () => {}
  global.setInterval = (fn) => {
    tick = fn
    return 0
  }

  const render = async (props) => {
    const container = global.document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(
        React.createElement(
          Slider,
          { autoplay: 4000, ...props },
          React.createElement('div', null, 'one'),
          React.createElement('div', null, 'two')
        )
      )
    })
    const shell = container.firstChild
    return {
      root,
      shell,
      props: hostProps(shell),
      advanced: () => {
        const frames = []
        const realRaf = global.requestAnimationFrame
        global.requestAnimationFrame = (fn) => {
          frames.push(fn)
          return realRaf(fn)
        }
        try {
          tick()
        } finally {
          global.requestAnimationFrame = realRaf
        }
        return frames.length > 0
      },
    }
  }

  try {
    const seen = []
    const both = await render({
      onPointerEnter: (e) => seen.push(['enter', e]),
      onPointerLeave: (e) => seen.push(['leave', e]),
    })
    assert.equal(both.advanced(), true, 'autoplay rotates while nothing hovers')

    await act(async () => { both.props.onPointerEnter({ type: 'pointerenter' }) })
    assert.equal(seen.length, 1, "the consumer's onPointerEnter still runs")
    assert.equal(both.advanced(), false, 'hovering pauses the rotation')
    assert.equal(both.shell.childNodes.find(node => hostProps(node).className === 'sv-slider').getAttribute('aria-live'), 'polite')

    await act(async () => { both.props.onPointerLeave({ type: 'pointerleave' }) })
    assert.equal(seen.length, 2, "the consumer's onPointerLeave still runs")
    assert.equal(both.advanced(), true, 'leaving resumes it')
    assert.equal(both.shell.childNodes.find(node => hostProps(node).className === 'sv-slider').getAttribute('aria-live'), 'off')
    await act(async () => { both.root.unmount() })

    // a lone consumer onPointerLeave used to replace the internal one and
    // strand hovering: paused forever after the first hover
    const leaveOnly = await render({ onPointerLeave: () => {} })
    await act(async () => { leaveOnly.props.onPointerEnter({ type: 'pointerenter' }) })
    assert.equal(leaveOnly.advanced(), false, 'hovering pauses')
    await act(async () => { leaveOnly.props.onPointerLeave({ type: 'pointerleave' }) })
    assert.equal(leaveOnly.advanced(), true, 'a lone consumer onPointerLeave does not strand hovering')
    await act(async () => { leaveOnly.root.unmount() })
  } finally {
    global.setInterval = realSetInterval
  }
})

test('react: Slider autoplay starts paused under reduced motion and the visible control resumes it (ADU-243)', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  const realSetInterval = global.setInterval
  let tick = () => {}
  global.setInterval = (fn) => { tick = fn; return 0 }
  const realMatchMedia = global.window.matchMedia
  // the OS asks for less motion before the slider mounts
  global.window.matchMedia = () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} })
  // Under reduced motion a glide is a jump, so "the tick advanced" is not a
  // scheduled frame here (the probe the other autoplay tests use) but a
  // position write on the rail: setPos assigns scrollLeft.
  let writes = 0
  const advanced = (rail) => {
    Object.defineProperty(rail, 'scrollLeft', { configurable: true, get: () => 0, set: () => { writes++ } })
    const before = writes
    tick()
    return writes > before
  }
  try {
    const container = global.document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(React.createElement(Slider, { autoplay: 4000 },
        React.createElement('div', null, 'one'), React.createElement('div', null, 'two')))
    })
    const shell = container.firstChild
    const rail = shell.childNodes.find((node) => hostProps(node).className === 'sv-slider')
    const pause = shell.childNodes.find((node) => hostProps(node).className === 'sv-pause')
    assert.ok(pause, 'the visible rotation control renders')
    assert.equal(hostProps(pause)['aria-label'], 'start slide rotation', 'it reads as paused from the first client render after the effect')
    assert.equal(advanced(rail), false, 'the interval tick does not advance under reduced motion')
    // the person presses the control: that is them asking, so it rotates
    await act(async () => { hostProps(pause).onClick() })
    assert.equal(hostProps(shell.childNodes.find((node) => hostProps(node).className === 'sv-pause'))['aria-label'], 'stop slide rotation')
    assert.equal(advanced(rail), true, 'an explicit resume moves the rail even under reduced motion (a jump, not a glide)')
    await act(async () => { root.unmount() })
  } finally {
    global.setInterval = realSetInterval
    global.window.matchMedia = realMatchMedia
  }
})

test('react: a destroyed Slider handle stops the autoplay interval', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  const realSetInterval = global.setInterval
  let tick = () => {}
  global.setInterval = (fn) => {
    tick = fn
    return 0
  }
  // same probe as the hover test: a tick that reaches the handle starts a
  // glide, which schedules a frame
  const advanced = () => {
    const frames = []
    const realRaf = global.requestAnimationFrame
    global.requestAnimationFrame = (fn) => {
      frames.push(fn)
      return realRaf(fn)
    }
    try {
      tick()
    } finally {
      global.requestAnimationFrame = realRaf
    }
    return frames.length > 0
  }

  try {
    const api = React.createRef()
    const container = global.document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(
        React.createElement(
          Slider,
          { autoplay: 50, ref: api },
          React.createElement('div', null, 'one'),
          React.createElement('div', null, 'two')
        )
      )
    })

    assert.ok(api.current.state().count > 0, 'the live handle reports the real slides')
    assert.equal(advanced(), true, 'autoplay rotates while the slider is alive')

    api.current.destroy()
    assert.equal(api.current.state().count, 0, 'destroy drops the handle instead of keeping it')
    assert.equal(advanced(), false, 'the interval no longer advances a destroyed slider')

    await act(async () => { root.unmount() })
  } finally {
    global.setInterval = realSetInterval
  }
})

test('react: a className rewrite cannot strip the classes the slider owns', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  const view = (props, slideClass) =>
    React.createElement(
      Slider,
      props,
      React.createElement('div', { className: slideClass }, 'one'),
      React.createElement('div', null, 'two')
    )

  const container = global.document.createElement('div')
  const root = createRoot(container)
  await act(async () => { root.render(view({}, 'card')) })

  const shell = container.firstChild
  const rail = shell.children.find((child) => child.classes.has('sv-slider'))
  assert.ok(rail, 'the rail carries the engine class after mount')
  assert.ok(rail.classes.has('sv-draggable'), 'drag is on by default')
  const [first, second] = rail.children
  assert.ok(first.classes.has('sv-active'), 'the first slide is active in this zero-geometry DOM')

  // `perView` is not an attach dep, so React rewrites the rail's class
  // attribute (sv-slider -> sv-slider sv-cols) with no retrack behind it, and
  // a consumer restyling a slide rewrites that one too. Both drop what the
  // engine wrote; the next measure has to put it back.
  await act(async () => { root.render(view({ perView: 2 }, 'card card-lit')) })
  assert.equal(shell.children.find((child) => child.classes.has('sv-slider')), rail, 'same rail node, no remount')

  rail._listeners.scroll[0]() // any measure will do: a scroll is the cheapest
  flushFrames()

  assert.ok(rail.classes.has('sv-cols'), "React's own class survived")
  assert.ok(rail.classes.has('sv-draggable'), 'the engine re-asserts sv-draggable')
  assert.ok(rail.classes.has('sv-slider'), 'and sv-slider')
  assert.ok(first.classes.has('card-lit'), "the consumer's new slide class survived")
  assert.ok(first.classes.has('sv-active'), 'sv-active is re-asserted on the active slide')
  assert.ok(!second.classes.has('sv-active'), 'and only there')

  await act(async () => { root.unmount() })
})

// ---- ADU-188: the normalized list feeds rendering, so anything that is not
// an element has to come out of it untouched. A portal is the case that bites:
// Children.map hands it back and React renders it into its own container,
// while toArray().filter(isValidElement) deletes it from the document with no
// warning anywhere. renderToStaticMarkup cannot see this, portals are a
// client-only construct.
test('react: a Slider child that is not an element still renders, portal included', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { createPortal } = await import('react-dom')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  const sink = global.document.createElement('div')
  const container = global.document.createElement('div')
  const root = createRoot(container)
  await act(async () => {
    root.render(
      React.createElement(
        Slider,
        { dots: true },
        React.createElement('div', { key: 'a' }, 'one'),
        createPortal(React.createElement('p', null, 'PORTALED'), sink),
        'plain text',
        React.createElement('div', { key: 'b' }, 'two')
      )
    )
  })

  const shell = container.firstChild
  const rail = shell.children.find((child) => child.classes.has('sv-slider'))
  assert.equal(sink.children.length, 1, 'the portal renders into its own container')
  assert.equal(sink.children[0].tagName, 'P')
  assert.ok(
    rail.childNodes.some((node) => node.nodeType === 3 && node.textContent === 'plain text'),
    'a bare string child stays in the rail'
  )
  // only the elements are slides: two of them, annotated 1 and 2 of 2
  assert.equal(rail.children.length, 2, 'the portal is not an empty slide in the rail')
  assert.deepEqual(
    rail.children.map((slide) => slide.attributes['aria-label']),
    ['1 of 2', '2 of 2']
  )
  const dots = shell.children.find((child) => child.classes.has('sv-dots'))
  assert.equal(dots.children.length, 2, 'and the dots count the same slides')

  await act(async () => { root.unmount() })
})

// ---- ADU-188: keying a fragment's children under their parent joins two
// React keys into one string. React escapes `=` and `:` in an element key and
// only `/` in a user key, so `.` and `$` pass through: joined on nothing,
// <Fragment key="a"><b/></Fragment> and a sibling keyed "a.$b" both flatten to
// ".$a.$b", which React calls unsupported and warns about in dev and prod.
test('react: a fragment slide and its uncle keep distinct keys across a reorder', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Slider } = await import('../dist/react/index.js')

  let seq = 0
  function Card({ label }) {
    // the instance number moves only if React remounts this component: state
    // surviving the reorder is what "the keys matched" looks like from outside
    const [n] = React.useState(() => ++seq)
    // an attribute, not a text child: react-dom writes a lone string child
    // straight to textContent, which this DOM models as a bare property
    return React.createElement('div', { 'data-card': label + '#' + n })
  }
  const inner = React.createElement(
    React.Fragment,
    { key: 'a' },
    React.createElement(Card, { key: 'b', label: 'inner' })
  )
  const uncle = React.createElement(Card, { key: 'a.$b', label: 'uncle' })
  const view = (order) => React.createElement(Slider, { dots: true }, order)

  const warnings = []
  const realError = console.error
  console.error = (...args) => warnings.push(String(args[0]))
  try {
    const container = global.document.createElement('div')
    const root = createRoot(container)
    await act(async () => { root.render(view([inner, uncle])) })

    const shell = container.firstChild
    const rail = shell.children.find((child) => child.classes.has('sv-slider'))
    const text = () => rail.children.map((slide) => slide.attributes['data-card'])
    assert.deepEqual(text(), ['inner#1', 'uncle#2'], 'both slides render, each its own instance')
    const [firstNode, secondNode] = rail.children

    await act(async () => { root.render(view([uncle, inner])) })
    assert.deepEqual(text(), ['uncle#2', 'inner#1'], 'the reorder moved the instances, it did not rebuild them')
    assert.equal(rail.children[0], secondNode, 'the uncle kept its DOM node')
    assert.equal(rail.children[1], firstNode, 'and so did the fragment slide')
    assert.equal(seq, 2, 'no third instance: nothing remounted')

    await act(async () => { root.unmount() })
  } finally {
    console.error = realError
  }
  assert.deepEqual(
    warnings.filter((message) => /same key|unique "key"/i.test(message)),
    [],
    'the fragment child and its uncle are two keys, not one'
  )
})

test('react: useTrack settles to one tracked node under StrictMode double-invocation, no leak on unmount', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useTrack } = await import('../dist/react/index.js')

  function Tracked() {
    const ref = useTrack()
    return React.createElement('div', { ref })
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)
  const before = observedRO.size

  await act(async () => {
    root.render(React.createElement(React.StrictMode, null, React.createElement(Tracked)))
  })
  const node = container.firstChild
  assert.equal(observedRO.size, before + 1, 'StrictMode\'s mount/unmount/remount settles to exactly one tracked node')
  assert.ok(observedRO.has(node), 'the surviving attach is the actual rendered node')

  await act(async () => { root.unmount() })
  assert.equal(observedRO.size, before, 'no leak: unmount untracks it even after the double-invoke cycle')
})

test('react: usePointer attaches and detaches the delegated listener on a conditional target', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { usePointer } = await import('../dist/react/index.js')

  function Cond({ show }) {
    const ref = usePointer()
    return show ? React.createElement('div', { ref }) : null
  }

  const container = global.document.createElement('div')
  const root = createRoot(container)

  await act(async () => { root.render(React.createElement(Cond, { show: false })) })
  await act(async () => { root.render(React.createElement(Cond, { show: true })) })
  const node = container.firstChild
  assert.equal((node._listeners.pointermove || []).length, 1, 'the delegated pointermove listener is added on attach')

  await act(async () => { root.render(React.createElement(Cond, { show: false })) })
  assert.equal((node._listeners.pointermove || []).length, 0, 'the listener is removed on detach')

  await act(async () => { root.unmount() })
})

test('react: useCanvasEffect mounts and destroys the effect on a conditional target', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { useCanvasEffect } = await import('../dist/react/index.js')

  // mountEffect always registers a visibilitychange listener on attach and
  // removes it on destroy: a cheap, specific proxy for "setup ran" / "destroy ran"
  // that doesn't require a real canvas 2D context or firing ResizeObserver.
  const listeners = []
  const realAdd = global.document.addEventListener
  const realRemove = global.document.removeEventListener
  global.document.addEventListener = (type, fn) => {
    if (type === 'visibilitychange') listeners.push(fn)
  }
  global.document.removeEventListener = (type, fn) => {
    if (type !== 'visibilitychange') return
    const i = listeners.indexOf(fn)
    if (i !== -1) listeners.splice(i, 1)
  }

  try {
    function Cond({ show }) {
      const ref = useCanvasEffect({ context: null, frame: () => {} })
      return show ? React.createElement('canvas', { ref }) : null
    }

    const container = global.document.createElement('div')
    const root = createRoot(container)

    await act(async () => { root.render(React.createElement(Cond, { show: true })) })
    assert.equal(listeners.length, 1, 'mountEffect ran: the visibility listener is attached')

    await act(async () => { root.render(React.createElement(Cond, { show: false })) })
    assert.equal(listeners.length, 0, 'destroy ran: the visibility listener is removed')

    await act(async () => { root.unmount() })
  } finally {
    global.document.addEventListener = realAdd
    global.document.removeEventListener = realRemove
  }
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

test('react: changing Boot page outputs does not reconnect its scanner', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { ScrollVarsBoot } = await import('../dist/react/index.js')
  const Original = global.MutationObserver
  let disconnected = 0
  global.MutationObserver = class extends Original {
    disconnect() { disconnected++; super.disconnect() }
  }
  const root = createRoot(document.createElement('div'))
  try {
    await React.act(async () => root.render(React.createElement(ScrollVarsBoot, { pageOutputs:false })))
    const baseline = disconnected
    await React.act(async () => root.render(React.createElement(ScrollVarsBoot, { pageOutputs:true })))
    assert.equal(disconnected, baseline, 'changing clocks must not release/retrack scanned content')
  } finally {
    await React.act(async () => root.unmount())
    global.MutationObserver = Original
  }
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

test('react: a Modal rendered open carries the open attribute in the SSR markup', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Modal } = await import('../dist/react/index.js')

  // without this attribute the server markup is a CLOSED dialog: a no-JS or
  // pre-hydration modal renders nothing, against README's "open ones open"
  const open = renderToStaticMarkup(React.createElement(Modal, { open: true }, 'hello'))
  assert.match(open, /<dialog[^>]*\sopen=""/)
  assert.match(open, /hello/)

  const closed = renderToStaticMarkup(React.createElement(Modal, { open: false }, 'hello'))
  assert.doesNotMatch(closed, /\sopen=""/)
})

// A <dialog> modelled on the spec, close enough for the promotion to matter.
// `open` reflects the attribute both ways (react-dom may write either) and
// only showModal() sets `modal` (the top layer). Its first step is "if the
// dialog is open AND modal, return", so a repeated showModal() is a harmless
// no-op: it is dropping the attribute first that walks past that early return
// and reaches step two, InvalidStateError on an open NON-modal dialog.
// showModal() also records the previously focused element and moves focus
// into the dialog, and close() puts focus back. That is the only surface a
// second promotion shows on: it captures a node INSIDE the dialog, and a
// closed dialog is display:none, so focus falls to the body.
function installSpecDialog() {
  const doc = global.document
  const realCreate = doc.createElement
  const state = {
    promotions: 0,
    closeCalls: 0,
    restore() { doc.createElement = realCreate },
  }
  doc.createElement = (tag) => {
    const el = realCreate(tag)
    if (tag !== 'dialog') return el
    el.modal = false
    el.previouslyFocused = null
    Object.defineProperty(el, 'open', {
      configurable: true,
      get: () => el.hasAttribute('open'),
      set: (on) => (on ? el.setAttribute('open', '') : el.removeAttribute('open')),
    })
    el.showModal = () => {
      if (el.open && el.modal) return
      if (el.open) throw new Error('InvalidStateError: showModal on an open non-modal dialog')
      state.promotions++
      el.previouslyFocused = doc.activeElement
      el.setAttribute('open', '')
      el.modal = true
      // the dialog focusing steps: focus lands on the first focusable
      // descendant, the dialog itself when it has none
      doc.activeElement = el.children.find((child) => child.tagName === 'BUTTON') ?? el
    }
    el.close = () => {
      state.closeCalls++
      el.removeAttribute('open')
      el.modal = false
      const back = el.previouslyFocused
      el.previouslyFocused = null
      doc.activeElement = back && !el.contains(back) ? back : doc.body
    }
    return el
  }
  return state
}

test('react: a Modal that mounts open ends up MODAL, not merely open', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Modal } = await import('../dist/react/index.js')

  // React sets the rendered attribute while it commits the element, before
  // any effect runs, so this mount hands the effect the same DOM a hydrated
  // server-rendered modal does.
  const dom = installSpecDialog()

  const container = global.document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => {
      root.render(React.createElement(Modal, { open: true }, 'hello'))
    })
    const dialog = container.firstChild
    assert.equal(dialog.hasAttribute('open'), true, 'still open after mount')
    assert.equal(dialog.modal, true, 'promoted into the top layer by showModal()')
    // close() would fire a close event, and a controlled parent answers that
    // by setting open back to false: the promotion drops the attribute instead
    assert.equal(dom.closeCalls, 0, 'nothing called close() while promoting')

    await act(async () => {
      root.render(React.createElement(Modal, { open: false }, 'hello'))
    })
    assert.equal(dom.closeCalls, 1, 'open={false} closes it')
    assert.equal(dialog.modal, false, 'and it leaves the top layer')
    assert.equal(dialog.hasAttribute('open'), false)

    await act(async () => {
      root.render(React.createElement(Modal, { open: true }, 'hello'))
    })
    assert.equal(dialog.modal, true, 'and it can be opened again')
  } finally {
    dom.restore()
    await act(async () => { root.unmount() })
  }
})

test('react: a Modal open under StrictMode promotes once and hands focus back', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act, StrictMode } = React
  const { Modal } = await import('../dist/react/index.js')

  // StrictMode double-invokes effects in development, and it is the default
  // in Next.js and in the Vite and CRA templates: an unguarded promotion
  // drops the attribute and calls showModal() a second time, and that call
  // records a node INSIDE the dialog as the one to restore focus to.
  const dom = installSpecDialog()
  const doc = global.document
  const activeBefore = doc.activeElement
  const trigger = doc.createElement('button')
  doc.body.appendChild(trigger)
  doc.activeElement = trigger

  const container = doc.createElement('div')
  const root = createRoot(container)
  const tree = (open) =>
    React.createElement(
      StrictMode,
      null,
      React.createElement(Modal, { open }, React.createElement('button', null, 'ok'))
    )
  try {
    await act(async () => {
      root.render(tree(true))
    })
    const dialog = container.firstChild
    assert.equal(dialog.modal, true, 'modal after mount')
    assert.equal(dom.promotions, 1, 'promoted exactly once, double-invoked effect and all')
    assert.equal(doc.activeElement.tagName, 'BUTTON', 'focus moved into the dialog')
    assert.notEqual(doc.activeElement, trigger)

    await act(async () => {
      root.render(tree(false))
    })
    assert.equal(dom.closeCalls, 1, 'open={false} closes it')
    assert.equal(dialog.modal, false, 'and it leaves the top layer')
    // the whole point of promoting once: a second showModal() would have
    // captured the button inside the dialog, and closing a display:none
    // dialog drops focus on the body instead of the control that opened it
    assert.equal(doc.activeElement, trigger, 'focus went back to the trigger')
  } finally {
    dom.restore()
    doc.body.removeChild(trigger)
    doc.activeElement = activeBefore
    await act(async () => { root.unmount() })
  }
})

test('react: Modal without <dialog> support opens AND closes through the attribute', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Modal } = await import('../dist/react/index.js')

  const container = global.document.createElement('div')
  const root = createRoot(container)
  await act(async () => {
    root.render(React.createElement(Modal, { open: false }, 'hello'))
  })
  const dialog = container.firstChild
  // the fake node models an engine with no <dialog>: the tag is an unknown
  // element there, so it has no showModal() and no `open` PROPERTY, only the
  // attribute. A guard on dialog.open (undefined) could only ever open.
  assert.equal(typeof dialog.showModal, 'undefined', 'no showModal on an unknown element')
  assert.equal('open' in dialog, false, 'no open property on an unknown element')
  assert.equal(dialog.hasAttribute('open'), false, 'closed to start with')
  // the engines that reach this branch (Safari below 15.4, Firefox below 98)
  // include Safari 11 and Firefox 60 to 62, which predate toggleAttribute
  // and are inside the README floor: calling it there throws inside the
  // effect and React tears the tree down. React itself never calls it.
  delete dialog.toggleAttribute

  await act(async () => {
    root.render(React.createElement(Modal, { open: true }, 'hello'))
  })
  assert.equal(dialog.hasAttribute('open'), true, 'open={true} sets the attribute')

  await act(async () => {
    root.render(React.createElement(Modal, { open: false }, 'hello'))
  })
  assert.equal(dialog.hasAttribute('open'), false, 'open={false} removes it again')

  await act(async () => { root.unmount() })
})

test('react: useScenes clamps the reported scene when the count shrinks', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const { Scenes } = await import('../dist/react/index.js')

  // the driver only reports through a real measure: it needs a scroll
  // position and a geometry (1600px tall, its top 800px above an 800px
  // viewport = pinned to the very end, so the last scene)
  global.window.scrollY = 0

  const seen = []
  const render = (count) =>
    React.createElement(Scenes, { count }, ({ scene }) => {
      seen.push(scene)
      return null
    })

  const container = global.document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => { root.render(render(3)) })
    container.firstChild.getBoundingClientRect = () => ({
      top: -800, bottom: 800, left: 0, right: 0, width: 0, height: 1600,
    })
    await act(async () => { flushFrames() })
    assert.equal(seen.at(-1), 2, 'the pinned end of a 3-scene container is scene 2')

    // scenes <= 1 makes the driver emit nothing at all, so nothing would
    // ever correct the stranded index: the hook has to clamp it itself
    await act(async () => { root.render(render(1)) })
    assert.equal(seen.at(-1), 0, 'a single scene can only ever be scene 0')
  } finally {
    await act(async () => { root.unmount() })
  }
})

test('harness: one flush runs one batch of frames, and cancel drops a pending one', async () => {
  await ensureDomAndWarmDriver()
  flushFrames() // clear whatever earlier tests left pending

  let runs = 0
  const loop = () => {
    runs++
    if (runs < 2) global.requestAnimationFrame(loop) // a canvas loop, in miniature
  }
  global.requestAnimationFrame(loop)

  flushFrames()
  assert.equal(runs, 1, 'the frame it queued from inside waits for the next flush')
  flushFrames()
  assert.equal(runs, 2)

  const pending = global.requestAnimationFrame(loop)
  global.cancelAnimationFrame(pending)
  flushFrames()
  assert.equal(runs, 2, 'a cancelled frame never runs')
})

test('harness: a frame this test scheduled fails it when it throws', async () => {
  await ensureDomAndWarmDriver()
  flushFrames() // clear whatever earlier tests left pending

  global.requestAnimationFrame(() => {
    throw new Error('a driver frame blew up')
  })
  assert.throws(() => flushFrames(), /a driver frame blew up/)

  // left pending on purpose: the next test proves a leftover stays swallowed,
  // and so does the successor it reschedules from inside that later flush
  global.requestAnimationFrame(() => {
    global.requestAnimationFrame(() => {
      throw new Error('a torn-down widget blew up')
    })
  })
})

test('harness: a frame left pending by an earlier test is still swallowed', async () => {
  await ensureDomAndWarmDriver()
  assert.doesNotThrow(() => flushFrames())
  // the leftover rescheduled itself from inside that flush, the way a canvas
  // loop does: the successor belongs to the test that scheduled its parent,
  // not to whichever test happens to be flushing
  assert.doesNotThrow(() => flushFrames())
})


test('react: responsive Slider puts its CSP nonce on the generated stylesheet', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const markup = renderToStaticMarkup(React.createElement(Slider, { nonce: 'request-nonce', perView: { base: 1, md: 3 } }, React.createElement('div', null, 'slide')))
  assert.ok(markup.includes('<style nonce="request-nonce">'))
})

test('react: Slider cssVars opts out, re-enables by default, and is not forwarded to the DOM', async () => {
  await ensureDomAndWarmDriver()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { Slider } = await import('../dist/react/index.js')
  const container = document.createElement('div'), root = createRoot(container)
  const view = cssVars => React.createElement(Slider, { cssVars }, React.createElement('div', null, 'one'), React.createElement('div', null, 'two'))
  await React.act(async () => { root.render(view(false)) })
  const shell = container.firstChild, rail = shell.children.find(child => child.classes.has('sv-slider'))
  assert.equal(hostProps(shell).cssVars, undefined)
  assert.equal(rail.style['--sv-progress'], undefined)
  assert.equal(rail.children[0].style['--sd'], undefined)
  assert(rail.children[0].classes.has('sv-active'))
  Object.assign(rail, { clientWidth:100, scrollWidth:200, scrollLeft:0, clientLeft:0, offsetLeft:0, offsetParent:null })
  rail.children.forEach((child, i) => Object.assign(child, { offsetWidth:100, offsetLeft:i * 100, offsetParent:rail }))
  await React.act(async () => { root.render(view(undefined)) })
  assert.equal(shell.children.find(child => child.classes.has('sv-slider')), rail)
  assert.equal(rail.style['--sv-progress'], '0.0000')
  assert.equal(rail.children[0].style['--sd'], '0.0000')
  rail.children[0].style['--sd'] = '.75'
  await React.act(async () => {
    root.render(view(false))
  })
  await React.act(async () => { rail._listeners.scroll[0](); flushFrames() })
  assert.equal(rail.children[0].style['--sd'], '.75', 'opt-out stops future writes without deleting authored values')
  await React.act(async () => { root.unmount() })
})

test('react: StrictMode Slider releases resources across output switches, active input and unmount', async () => {
  await ensureDomAndWarmDriver()
  flushFrames()
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { Slider } = await import('../dist/react/index.js')
  const saved = Object.fromEntries(['ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'setInterval', 'clearInterval'].map(key => [key, global[key]]))
  const savedWindow = { addEventListener:window.addEventListener, removeEventListener:window.removeEventListener }
  const observers = new Map(), intervals = new Map(), listeners = new Map()
  let timerId = 0
  class Observer {
    observe(el) { if (!observers.has(this)) observers.set(this, new Set()); observers.get(this).add(el) }
    disconnect() { observers.delete(this) }
  }
  global.ResizeObserver = global.IntersectionObserver = global.MutationObserver = Observer
  global.setInterval = fn => { const id = ++timerId; intervals.set(id, fn); return id }
  global.clearInterval = id => intervals.delete(id)
  window.addEventListener = (type, fn) => { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn) }
  window.removeEventListener = (type, fn) => { const handlers = listeners.get(type); handlers?.delete(fn); if (!handlers?.size) listeners.delete(type) }
  const api = React.createRef(), container = document.createElement('div'), root = createRoot(container)
  let mounted = true
  const pending = () => rafQueue.filter(entry => entry.epoch === rafEpoch).length
  const view = cssVars => React.createElement(React.StrictMode, null,
    React.createElement(Slider, { ref:api, autoplay:4000, cssVars },
      React.createElement('div', null, 'one'), React.createElement('div', null, 'two')))
  try {
    await React.act(async () => root.render(view(false)))
    const facade = api.current, shell = container.firstChild
    const rail = shell.children.find(child => child.classes.has('sv-slider'))
    Object.assign(rail, { clientWidth:100, scrollWidth:200, scrollLeft:0, clientLeft:0, offsetLeft:0, offsetParent:null })
    rail.children.forEach((child, i) => Object.assign(child, { offsetWidth:100, offsetLeft:i * 100, offsetParent:rail }))
    for (const cssVars of [true, undefined, true]) {
      assert.equal(intervals.size, 1, 'StrictMode leaves one autoplay interval')
      assert.equal(observers.size, 3, 'one resize, mutation and intersection observer')
      intervals.values().next().value()
      assert(facade.state().gliding && pending() > 0, 'autoplay starts a real pending glide')
      await React.act(async () => root.render(view(cssVars)))
      assert.equal(api.current, facade, 'external facade remains stable across reattachment')
      assert.equal(facade.state().gliding, false)
      assert.equal(pending(), 0, 'option reattachment cancels the old glide and measurement')
      assert.equal(observers.size, 3, 'old core observers were disconnected')
      rail._listeners.pointerdown[0]({ target:rail, pointerType:'mouse', button:0, clientX:50, preventDefault() {} })
      assert.equal(listeners.size, 3, 'press installs global move/up/cancel handlers')
      listeners.get('pointermove').values().next().value({ clientX:30 })
      assert.equal(facade.state().dragging, true)
      await React.act(async () => root.render(view(cssVars === false ? true : false)))
      assert.equal(listeners.size, 0, 'reattachment cancels the active press listeners')
      assert.equal(facade.state().dragging, false)
    }
    intervals.values().next().value()
    assert(facade.state().gliding)
    await React.act(async () => root.unmount())
    mounted = false
    assert.equal(api.current, null)
    assert.equal(intervals.size, 0)
    assert.equal(observers.size, 0)
    assert.equal(listeners.size, 0)
    assert.equal(pending(), 0)
    assert.equal(shell._listeners.focusin.length, 0)
    for (const type of ['pointerdown', 'wheel', 'scroll', 'keydown', 'dragstart'])
      assert.equal(rail._listeners[type].length, 0)
    facade.next(); facade.seek(.5)
    assert.equal(pending(), 0, 'a saved facade cannot revive an unmounted slider')
    assert.equal(facade.state().count, 0)
  } finally {
    if (mounted) await React.act(async () => root.unmount())
    Object.assign(global, saved)
    Object.assign(window, savedWindow)
  }
})
