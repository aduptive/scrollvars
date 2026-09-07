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
    contains: () => true,
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
    contains: () => true,
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
    contains: () => true,
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
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  const a = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const b = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' }) // shares the same target as a
  const root = {
    contains: () => true,
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
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  // as if parsed from style="transition-duration: 400ms !important": the
  // priority matters here too, not just the value
  menu.style.setProperty('transition-duration', '400ms', 'important')
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const root = {
    contains: () => true,
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

test('toggles: a target without .sv-acts never gets the settle, even carrying an inline transition shorthand (ADU-104, round 6 finding)', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-non-acts-settle')

  const menu = makeElement() // no 'sv-acts' class: a plain toggle target
  // stands in for style="transition: translate 300ms linear": the longhand
  // getter reads this back as '300ms' too, indistinguishable from an
  // authored transition-duration (ADU-104, round 6 finding). The settle
  // must not even look at this: gated on .sv-acts before it ever reaches
  // holdDuration()
  menu.style.setProperty('transition-duration', '300ms')
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const root = {
    contains: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' ? menu : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [trigger] : []),
  }

  toggles(root)
  assert.ok(menu.classes.has('sv-ui'), 'still marked sv-ui, same as any other target')
  assert.ok(!menu.classes.has('sv-acts'), 'sanity: this target really is not .sv-acts')
  assert.equal(menu.vars['--sv-acts-settle'], undefined, 'no .sv-acts: the settle knob is never set')
  assert.equal(
    menu.vars['transition-duration'],
    '300ms',
    'unchanged: holdDuration() never runs on a non-.sv-acts target, whatever this reads back as'
  )
  assert.equal(rafQueue.length, 0, 'no restore ever scheduled for a non-.sv-acts target')
})

test('toggles: a click inside the boot settle window drops the hold immediately, so the toggle still animates', async () => {
  global.window = {}
  const rafQueue = []
  global.requestAnimationFrame = (fn) => rafQueue.push(fn) && rafQueue.length
  const { toggles } = await import('../dist/core/toggles.js?sv-ui-settle-click')

  const menu = makeElement()
  menu.classes.add('sv-acts') // the settle only runs on .sv-acts targets (ADU-104, round 6)
  menu.style.setProperty('transition-duration', '250ms') // inline longhand, no !important this time
  const trigger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const listeners = {}
  const root = {
    contains: () => true,
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
    contains: () => true,
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

test('toggles: boot writes --sv-state from the class, and triggers group by the resolved target, not the selector string', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?boot-state')

  const menu = makeElement()
  menu.classes.add('open') // server-rendered already open
  const shut = makeElement()
  const byId = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  // the same element, reached through a different selector: the old grouping
  // compared the data-sv-target strings, so these two never saw each other
  const byClass = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': 'nav.menu' })
  const other = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#shut' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: (sel) =>
      sel === '#menu' || sel === 'nav.menu' ? menu : sel === '#shut' ? shut : null,
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [byId, byClass, other] : []),
  }

  toggles(root)
  assert.equal(menu.vars['--sv-state'], '1', 'markup that ships open agrees with its class from boot')
  assert.equal(shut.vars['--sv-state'], '0', 'a closed target is written too, never left unset')
  assert.equal(byId.attrs['aria-expanded'], 'true')
  assert.equal(byClass.attrs['aria-expanded'], 'true', 'another selector for the same element still syncs')
  assert.equal(other.attrs['aria-expanded'], 'false')

  listeners.click({ target: byId })
  assert.equal(menu.vars['--sv-state'], '0')
  assert.equal(byClass.attrs['aria-expanded'], 'false', 'the sibling trigger of that element follows the click')
  assert.equal(other.attrs['aria-expanded'], 'false', 'an unrelated target is untouched')
})

test('toggles: two triggers on one target with different classes keep separate aria-expanded', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?two-classes')

  const nav = makeElement()
  // the same nav reached through two selectors, toggling two different
  // classes: two independent states, so one click must not speak for both
  const hamburger = makeElement({ 'data-sv-toggle': 'open', 'data-sv-target': '#menu' })
  const pinner = makeElement({ 'data-sv-toggle': 'pinned', 'data-sv-target': 'nav.menu' })
  const listeners = {}
  const root = {
    contains: () => true,
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: (sel) => (sel === '#menu' || sel === 'nav.menu' ? nav : null),
    querySelectorAll: (sel) => (sel === '[data-sv-toggle]' ? [hamburger, pinner] : []),
  }

  toggles(root)
  assert.equal(hamburger.attrs['aria-expanded'], 'false', 'neither class is on the target at boot')
  assert.equal(pinner.attrs['aria-expanded'], 'false')

  listeners.click({ target: hamburger })
  assert.ok(nav.classes.has('open'))
  assert.ok(!nav.classes.has('pinned'), 'only the clicked trigger class flips')
  assert.equal(hamburger.attrs['aria-expanded'], 'true')
  assert.equal(
    pinner.attrs['aria-expanded'],
    'false',
    'the pinned control must not report expanded with its class absent'
  )

  listeners.click({ target: pinner })
  assert.equal(pinner.attrs['aria-expanded'], 'true')
  assert.equal(hamburger.attrs['aria-expanded'], 'true', 'the open state survives the other control')
})

test('toggles: a trigger above the scope root is ignored, even when closest() walks up to it (ADU-169)', async () => {
  global.window = {}
  global.requestAnimationFrame = () => 1
  const { toggles } = await import('../dist/core/toggles.js?scope-containment')

  // outerTrigger lives ABOVE this scope's root: closest() from a click
  // inside the scope walks straight past the root and would still find it,
  // but this scope's own click handler must never resolve/toggle it. It
  // belongs to whichever toggles() instance actually contains it (ADU-152
  // widened the match itself; the bookkeeping around scope was never
  // widened with a containment check to match).
  const outerTrigger = makeElement({ 'data-sv-toggle': 'open' })
  const inner = makeElement() // clicked directly, no data-sv-toggle of its own
  inner.closest = (sel) => (sel === '[data-sv-toggle]' ? outerTrigger : null)
  const listeners = {}
  const root = {
    contains: (el) => el !== outerTrigger, // outerTrigger is an ancestor of the scope root, not inside it
    addEventListener: (t, fn) => (listeners[t] = fn),
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [], // this scope has no triggers of its own
  }

  toggles(root)
  listeners.click({ target: inner })
  assert.ok(!outerTrigger.classes.has('open'), 'a trigger outside the scope is never toggled by this scope\'s click handler')
  assert.equal(outerTrigger.attrs['aria-expanded'], undefined, 'and never gets aria-expanded from a scope that does not own it')
})
