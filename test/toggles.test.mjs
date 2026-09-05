import assert from 'node:assert/strict'
import { test } from 'node:test'

function makeElement(attrs = {}) {
  const el = {
    attrs: { ...attrs },
    vars: {},
    classes: new Set(),
    classList: {
      add(c) {
        el.classes.add(c)
      },
      contains(c) {
        return el.classes.has(c)
      },
      toggle(c) {
        if (el.classes.has(c)) {
          el.classes.delete(c)
          return false
        }
        el.classes.add(c)
        return true
      },
    },
    style: {
      setProperty(k, v) {
        el.vars[k] = v
      },
    },
    getAttribute: (k) => el.attrs[k] ?? null,
    setAttribute: (k, v) => (el.attrs[k] = v),
    closest: (sel) => (sel === '[data-sv-toggle]' && 'data-sv-toggle' in el.attrs ? el : null),
  }
  return el
}

test('toggles: class + --sv-state + aria-expanded, custom target, stop()', async () => {
  global.window = {}
  const { toggles } = await import('../dist/core/toggles.js')

  const menu = makeElement()
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: () => [trigger],
  }
  menu.classList.contains = (c) => menu.classes.has(c)

  const stop = toggles(root)
  const click = (target) => listeners.click({ target })

  // on
  click(trigger)
  assert.ok(menu.classes.has('open'))
  assert.equal(menu.vars['--sv-state'], '1')
  assert.equal(trigger.attrs['aria-expanded'], 'true')

  // off
  click(trigger)
  assert.ok(!menu.classes.has('open'))
  assert.equal(menu.vars['--sv-state'], '0')
  assert.equal(trigger.attrs['aria-expanded'], 'false')

  // no data-sv-toggle → ignored
  const bystander = makeElement()
  click(bystander)
  assert.ok(!menu.classes.has('open'))

  // no target attr → the trigger itself, default class sv-open
  const solo = makeElement({ 'data-sv-toggle': '' })
  click(solo)
  assert.ok(solo.classes.has('sv-open'))
  assert.equal(solo.vars['--sv-state'], '1')

  stop()
  assert.ok(!listeners.click, 'listener removed')
})


test('toggles: aria-expanded reflects the target on boot and across every trigger of it', async () => {
  global.window = {}
  const { toggles } = await import('../dist/core/toggles.js?sync')
  const menu = makeElement()
  menu.classes.add('open') // server-rendered already open
  menu.classList.contains = (c) => menu.classes.has(c)
  const a = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const b = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [a, b] : []),
  }
  const stop = toggles(root)
  assert.equal(a.attrs['aria-expanded'], 'true', 'boot syncs to the current state')
  assert.equal(b.attrs['aria-expanded'], 'true')
  listeners.click({ target: a })
  assert.equal(a.attrs['aria-expanded'], 'false')
  assert.equal(b.attrs['aria-expanded'], 'false', 'the other trigger of the same target follows')
  stop()
})

test('toggles: marks each resolved target with sv-ui at boot, document.documentElement never touched', async () => {
  global.window = {}
  const html = makeElement()
  global.document = { documentElement: html }
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-target')

  const menu = makeElement()
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const solo = makeElement({ 'data-sv-toggle': '' }) // no data-sv-target: the trigger is its own target
  const root = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger, solo] : []),
  }
  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'a data-sv-target element gets sv-ui at boot')
  assert.ok(solo.classes.has('sv-ui'), 'a target-less trigger is its own target and gets sv-ui too')
  assert.ok(!html.classes.has('sv-ui'), 'document.documentElement is never marked')
  delete global.document
})

test('toggles: a target added after boot gets sv-ui on its first click', async () => {
  global.window = {}
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-late-target')

  const late = makeElement() // inserted into the DOM only after boot runs
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#late' })
  let inserted = false
  const root = {
    addEventListener: (t, fn) => (root.click = fn),
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#late' && inserted ? late : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }
  toggles(root) // boot: #late does not resolve yet, so it is skipped, unmarked
  inserted = true
  assert.ok(!late.classes.has('sv-ui'), 'not marked before it ever gets clicked')
  root.click({ target: trigger })
  assert.ok(late.classes.has('sv-ui'), 'marked on its first click')
  assert.ok(late.classes.has('open'), 'the click still toggles the class as usual')
})
