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
  assert.match(html, /\[data-sv-uid="[^"]+"\] \.sv-slider\{--sv-per-view:1\.2\}/)
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
  assert.match(html, /@media \(min-width:768px\)\{\[data-sv-uid="[^"]+"\] \.sv-slider\{--sv-per-view:3\}\}/)
  // a raw min-width key stays that number
  assert.match(html, /@media \(min-width:900px\)\{\[data-sv-uid="[^"]+"\] \.sv-slider\{--sv-per-view:4\}\}/)
  assert.doesNotMatch(html, /NaN/)
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

    both.props.onPointerEnter({ type: 'pointerenter' })
    assert.equal(seen.length, 1, "the consumer's onPointerEnter still runs")
    assert.equal(both.advanced(), false, 'hovering pauses the rotation')

    both.props.onPointerLeave({ type: 'pointerleave' })
    assert.equal(seen.length, 2, "the consumer's onPointerLeave still runs")
    assert.equal(both.advanced(), true, 'leaving resumes it')
    await act(async () => { both.root.unmount() })

    // a lone consumer onPointerLeave used to replace the internal one and
    // strand hovering: paused forever after the first hover
    const leaveOnly = await render({ onPointerLeave: () => {} })
    leaveOnly.props.onPointerEnter({ type: 'pointerenter' })
    assert.equal(leaveOnly.advanced(), false, 'hovering pauses')
    leaveOnly.props.onPointerLeave({ type: 'pointerleave' })
    assert.equal(leaveOnly.advanced(), true, 'a lone consumer onPointerLeave does not strand hovering')
    await act(async () => { leaveOnly.root.unmount() })
  } finally {
    global.setInterval = realSetInterval
  }
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
