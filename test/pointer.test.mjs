import assert from 'node:assert/strict'
import { test } from 'node:test'

// Minimal element stub: a manual `.parent` chain drives closest()/contains(),
// a classList backed by a Set, inline vars go through style.setProperty.
// `matchSelector`, when given, is the ONE selector this element answers to
// (any string), covering a self-targeting container (e.g. '.sv-hero'). The
// older `isTilt` flag is kept as shorthand for the default '.sv-tilt'.
function makeEl({ isTilt = false, matchSelector = null, parent = null } = {}) {
  const vars = {}
  const classes = new Set()
  const el = {
    parent,
    vars,
    classes,
    isTilt,
    style: {
      setProperty: (name, value) => {
        vars[name] = value
      },
      removeProperty: (name) => {
        delete vars[name]
      },
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    contains(node) {
      let n = node
      while (n) {
        if (n === el) return true
        n = n.parent
      }
      return false
    },
    matches(sel) {
      if (matchSelector !== null) return sel === matchSelector
      return sel === '.sv-tilt' && el.isTilt
    },
    closest(sel) {
      let n = el
      while (n) {
        if (n.matches(sel)) return n
        n = n.parent
      }
      return null
    },
  }
  return el
}

// gives any element a fireable addEventListener/removeEventListener pair,
// so a self-targeting container built with matchSelector can be wired up
// the same way makeContainer() wires up a plain one
function withListeners(el) {
  const listeners = {}
  el.addEventListener = (type, fn) => {
    listeners[type] = fn
  }
  el.removeEventListener = (type, fn) => {
    if (listeners[type] === fn) delete listeners[type]
  }
  el.fire = (type, event) => listeners[type]?.(event)
  return el
}

function makeContainer(parent = null) {
  return withListeners(makeEl({ parent }))
}

function stubFrame() {
  let cb = null
  global.window = {}
  global.requestAnimationFrame = (fn) => {
    cb = fn
    return 1
  }
  global.cancelAnimationFrame = () => {
    cb = null
  }
  return () => cb
}

test('trackPointer ignores a .sv-tilt ancestor of the container: match must be inside', async () => {
  const rafCb = stubFrame()

  // ancestorTilt is the container's PARENT, not a descendant. A selector
  // match found by walking up from the event target past the container's
  // own boundary must be ignored.
  const ancestorTilt = makeEl({ isTilt: true })
  const container = makeContainer(ancestorTilt)
  const child = makeEl({ parent: container })

  const { trackPointer } = await import('../dist/core/pointer.js')
  const stop = trackPointer(container)

  container.fire('pointermove', { target: child, clientX: 10, clientY: 10 })

  assert.equal(rafCb(), null, 'no frame scheduled: the only closest(.sv-tilt) match is outside the container')
  assert.equal(ancestorTilt.vars['--mx'], undefined, 'the ancestor never receives --mx')

  stop()
})

test('trackPointer accepts a container that matches its own selector: self-match works (ADU-152)', async () => {
  const rafCb = stubFrame()

  // this is how the gallery's flagship hero is wired: the container IS the
  // target (usePointer({ selector: '.sv-hero' }) on the hero itself).
  // container.contains(container) is true (Node.contains includes the node
  // itself), so a move over a plain child must still resolve, through
  // closest(), all the way up to the container and be accepted.
  const container = withListeners(makeEl({ matchSelector: '.sv-hero' }))
  const child = makeEl({ parent: container })

  const { trackPointer } = await import('../dist/core/pointer.js')
  const stop = trackPointer(container, { selector: '.sv-hero' })

  container.fire('pointermove', { target: child, clientX: 75, clientY: 25 })

  const cb = rafCb()
  assert.ok(cb, 'a frame is scheduled: closest(.sv-hero) from the child bubbles up to the container itself')
  cb()

  assert.notEqual(container.vars['--mx'], undefined, 'the container receives --mx from its own selector match')
  assert.notEqual(container.vars['--my'], undefined, 'the container receives --my from its own selector match')

  stop()
})

test('trackPointer teardown clears --mx/--my and sv-pointer-leave from the last hovered element', async () => {
  const rafCb = stubFrame()

  const container = makeContainer()
  const card = makeEl({ isTilt: true, parent: container })

  const { trackPointer } = await import('../dist/core/pointer.js')
  const stop = trackPointer(container)

  container.fire('pointermove', { target: card, clientX: 75, clientY: 25 })
  assert.ok(rafCb(), 'a frame was scheduled for the valid descendant match')
  rafCb()()
  assert.notEqual(card.vars['--mx'], undefined, 'flushed: mid-tilt')

  // teardown while the pointer is still "over" the card, mid-tilt
  stop()

  assert.equal(card.vars['--mx'], undefined, 'teardown clears --mx')
  assert.equal(card.vars['--my'], undefined, 'teardown clears --my')
  assert.equal(card.classes.has('sv-pointer-leave'), false, 'teardown leaves no sv-pointer-leave')
})

test('trackPointer teardown clears --mx/--my when the last hovered element IS the container (self-match, ADU-152)', async () => {
  const rafCb = stubFrame()

  // same self-targeting shape as the hero-cinematic wiring above, but here
  // the teardown races the pointer still being "over" the container itself,
  // so `last` and the container are the same node.
  const container = withListeners(makeEl({ matchSelector: '.sv-hero' }))
  const child = makeEl({ parent: container })

  const { trackPointer } = await import('../dist/core/pointer.js')
  const stop = trackPointer(container, { selector: '.sv-hero' })

  container.fire('pointermove', { target: child, clientX: 75, clientY: 25 })
  assert.ok(rafCb(), 'a frame was scheduled for the self-match')
  rafCb()()
  assert.notEqual(container.vars['--mx'], undefined, 'flushed: container mid-tilt on its own selector')

  // teardown while the container is its own last hovered element
  stop()

  assert.equal(container.vars['--mx'], undefined, 'teardown clears --mx from the self-matched container')
  assert.equal(container.vars['--my'], undefined, 'teardown clears --my from the self-matched container')
  assert.equal(container.classes.has('sv-pointer-leave'), false, 'teardown leaves no sv-pointer-leave on the self-matched container')
})

test('trackPointer clears a still-written outer .sv-tilt on handover to its own nested match, not just at the next pointerout (ADU-169)', async () => {
  const rafCb = stubFrame()

  // ADU-152 widened matchIn to accept nested/self matches (a .sv-tilt inside
  // another .sv-tilt). That exposed a bookkeeping gap: the driver remembered
  // only ONE last-written element, and matchIn/onOut's own containment check
  // treats a move onto a contained descendant as still hovering the SAME
  // widget, so a real pointerout for outer -> inner never clears the outer
  // either. Without an explicit handover check the outer element is written
  // once and never touched again.
  const container = makeContainer()
  const outer = makeEl({ isTilt: true, parent: container })
  const inner = makeEl({ isTilt: true, parent: outer })

  const { trackPointer } = await import('../dist/core/pointer.js')
  const stop = trackPointer(container)

  container.fire('pointermove', { target: outer, clientX: 10, clientY: 10 })
  rafCb()()
  assert.notEqual(outer.vars['--mx'], undefined, 'the outer element is written first')

  container.fire('pointermove', { target: inner, clientX: 60, clientY: 60 })
  assert.equal(outer.vars['--mx'], '0', 'handover to the nested match relaxes the outer immediately, from the move itself')
  assert.equal(outer.vars['--my'], '0')
  assert.ok(outer.classes.has('sv-pointer-leave'), 'the outer gets the same leave treatment as any other exit')

  rafCb()()
  assert.notEqual(inner.vars['--mx'], undefined, 'the inner element now receives the vars')

  stop()
  assert.equal(outer.vars['--mx'], '0', 'stop() does not need to touch the outer again: the handover already relaxed it')
  assert.equal(inner.vars['--mx'], undefined, 'stop() clears whichever element is still active')
  assert.equal(inner.classes.has('sv-pointer-leave'), false, 'stop() leaves no sv-pointer-leave on the active element either')
})

// gallery regression guard (ADU-152): every explicit `selector: '...'` an
// effect or installed component passes to trackPointer()/usePointer() must
// resolve inside its own container, not to something outside it. Each of
// these blocks is a self-contained snippet (the whole markup the call
// attaches to, plus, for a JSX/TSX block, its own CSS), so the selector's
// class appearing anywhere else in the SAME block, as a class attribute or
// a CSS rule, is proof it targets the container itself or a descendant:
// there is no ancestor markup described in these strings for it to hit.
// Scans preview/css/tailwind/react/previewScript on EFFECTS and content on
// COMPONENTS: previewScript is the exact field hero-cinematic's live-rendered
// attach script uses (fx-data.mjs), the path that shipped the ADU-152 bug.
test('gallery: every explicit usePointer/trackPointer selector in fx-data.mjs resolves inside its own container markup', async () => {
  const { EFFECTS, COMPONENTS } = await import('../scripts/fx-data.mjs')

  const blocks = []
  for (const effect of EFFECTS) {
    for (const key of ['preview', 'css', 'tailwind', 'react', 'previewScript']) {
      if (typeof effect[key] === 'string') blocks.push([`EFFECTS.${effect.slug}.${key}`, effect[key]])
    }
  }
  for (const [slug, component] of Object.entries(COMPONENTS)) {
    if (typeof component.content === 'string') blocks.push([`COMPONENTS.${slug}`, component.content])
  }

  let checked = 0
  for (const [label, text] of blocks) {
    for (const m of text.matchAll(/selector:\s*'([^']+)'/g)) {
      const cls = m[1].replace(/^\./, '')
      // strip the option itself first: it is written as '.cls' too, and
      // would otherwise "prove" its own claim
      const rest = text.replace(/selector:\s*'[^']+'/g, '')

      // exact token match, not a substring: a plain \bcls\b regex reads a
      // hyphen as a word boundary too, so '.hero' would "resolve" against
      // class="hero-orb" even though the exact class hero never appears.
      // Split every class/className attribute value on whitespace and
      // compare tokens instead.
      const inMarkup = [...rest.matchAll(/class(?:Name)?=["']([^"']*)["']/g)].some((attr) =>
        attr[1].split(/\s+/).includes(cls)
      )
      // same trap on the CSS side (`.hero-orb` matching a `.hero` selector):
      // the boundary after cls must also reject a following hyphen.
      const inCss = new RegExp(`\\.${cls}(?![\\w-])`).test(rest)

      checked++
      assert.ok(
        inMarkup || inCss,
        `${label}: selector '${m[1]}' has no class attribute or CSS rule anywhere else in this block, so it cannot resolve to the container or a descendant`
      )
    }
  }
  assert.ok(checked > 0, 'sanity: at least one explicit pointer selector was actually checked')
})
