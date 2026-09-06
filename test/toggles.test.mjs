import assert from 'node:assert/strict'
import { test } from 'node:test'

function makeElement(attrs = {}) {
  const el = {
    attrs: { ...attrs },
    vars: {},
    priorities: {},
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
      setProperty(k, v, priority = '') {
        el.vars[k] = v
        el.priorities[k] = priority
      },
      removeProperty(k) {
        delete el.vars[k]
        delete el.priorities[k]
      },
      // real inline longhands round-trip through these two, never through
      // a shorthand: the boot settle reads/writes transition-duration this
      // way only (ADU-104, round 5 finding)
      getPropertyValue(k) {
        return el.vars[k] ?? ''
      },
      getPropertyPriority(k) {
        return el.priorities[k] ?? ''
      },
    },
    getAttribute: (k) => el.attrs[k] ?? null,
    setAttribute: (k, v) => (el.attrs[k] = v),
    closest: (sel) => (sel === '[data-sv-toggle]' && 'data-sv-toggle' in el.attrs ? el : null),
  }
  // style.transition (the shorthand) is frozen at undefined: the boot settle
  // must never read or write it (ADU-104, round 4 finding 2). A regression
  // that assigns to it throws here (strict mode, ES modules) instead of
  // silently passing.
  Object.defineProperty(el.style, 'transition', { value: undefined, writable: false })
  return el
}

test('toggles: class + --sv-state + aria-expanded, custom target, stop()', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1 // the boot-settle transition hold schedules these
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
  global.requestAnimationFrame = () => 1
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
  global.requestAnimationFrame = () => 1
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

test('toggles: sets --sv-acts-settle with the class at boot, removes it after two frames, never touches style.transition', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-settle')

  const menu = makeElement()
  const a = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const b = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' }) // shares the same target as a
  const root = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [a, b] : []),
  }

  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'marked at boot')
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'the acts transition is held at zero duration for the settle')
  assert.equal(menu.style.transition, undefined, 'style.transition is never written')
  assert.equal(menu.vars['transition-duration'], undefined, 'no inline longhand on this target: nothing written (ADU-104, round 5)')
  assert.equal(rafQueue.length, 1, 'one restore scheduled, not two, even though two triggers share this target')

  rafQueue.shift()() // frame 1: still held
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'still held after only one frame')
  assert.equal(rafQueue.length, 1, 'the second frame is queued from inside the first')

  rafQueue.shift()() // frame 2: restored
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'removed, back to the CSS-declared duration')
  assert.equal(menu.style.transition, undefined, 'still never touched')
  assert.equal(menu.vars['transition-duration'], undefined, 'still never written: this target never had one to hold')
})

test('toggles: an inline transition-duration longhand is held at 0s for the settle and restored exact, value and priority, after two frames (ADU-104, round 5 finding)', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-longhand-settle')

  const menu = makeElement()
  // as if parsed from style="transition-duration: 400ms !important": the
  // priority matters here too, not just the value
  menu.style.setProperty('transition-duration', '400ms', 'important')
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const root = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.equal(menu.vars['transition-duration'], '0s', 'the inline longhand is held at zero duration too, not just --sv-acts-settle')
  assert.equal(menu.priorities['transition-duration'], 'important', 'the hold keeps writing it at the same priority as the original')
  assert.equal(menu.style.transition, undefined, 'the shorthand is still never touched')

  rafQueue.shift()() // frame 1: still held
  assert.equal(menu.vars['transition-duration'], '0s', 'still held after only one frame')

  rafQueue.shift()() // frame 2: restored, same guarded path as --sv-acts-settle
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the knob is removed in the same restore')
  assert.equal(menu.vars['transition-duration'], '400ms', 'restored to its exact original value')
  assert.equal(menu.priorities['transition-duration'], 'important', 'restored with its exact original priority')
})

test('toggles: a click inside the boot settle window drops the hold immediately, so the toggle still animates', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-settle-click')

  const menu = makeElement()
  menu.style.setProperty('transition-duration', '250ms') // inline longhand, no !important this time
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: (t) => delete listeners[t],
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.equal(menu.vars['--sv-acts-settle'], '0s', 'the settle is holding')
  assert.equal(menu.vars['transition-duration'], '0s', 'the inline longhand hold is armed too (ADU-104, round 5 finding)')
  assert.equal(rafQueue.length, 1, 'one restore scheduled')

  listeners.click({ target: trigger }) // lands inside the hold window, before either queued frame runs
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the click drops the hold immediately, so this toggle still transitions')
  assert.equal(menu.vars['transition-duration'], '250ms', 'the click restores the inline longhand immediately too, together with the knob')
  assert.ok(menu.classes.has('open'), 'the click still toggles the class as usual')

  // the scheduled restore is cancelled: running the frames queued at boot
  // must not reintroduce the property or otherwise touch the target
  rafQueue.shift()()
  rafQueue.shift()()
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'the cancelled restore never fires')
  assert.equal(menu.vars['transition-duration'], '250ms', 'unchanged: already restored by the click, the cancelled frames must not touch it again')
  assert.equal(menu.style.transition, undefined, 'style.transition is never written')
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
