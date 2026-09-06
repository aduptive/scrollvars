import assert from 'node:assert/strict'
import { test } from 'node:test'

// Minimal element stub: a manual `.parent` chain drives closest()/contains(),
// a classList backed by a Set, inline vars go through style.setProperty.
function makeEl({ isTilt = false, parent = null } = {}) {
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

function makeContainer(parent = null) {
  const el = makeEl({ parent })
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
