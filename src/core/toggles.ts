/**
 * Click → state → CSS. The third input, after scroll and pointer: one
 * delegated listener turns clicks into classes + variables, and CSS does
 * every pixel of the animation. Same contract as the scroll driver.
 *
 *   <button data-sv-toggle="open" data-sv-target="#menu">menu</button>
 *   <nav id="menu">…</nav>        <!-- gains/loses .open on click -->
 *
 * - `data-sv-toggle="class"`. Class to toggle ('sv-open' when empty)
 * - `data-sv-target="sel"`. What receives it (the trigger itself when absent)
 * - the target also gets `--sv-state: 1|0` for continuous CSS use, written at
 *   boot from the class so markup that ships open agrees from the first frame
 * - the trigger gets `aria-expanded` kept in sync. The accessibility the
 *   old checkbox hack never gave you
 *
 * Deliberately NOT a timeline engine: one click, one state change. For
 * orchestrated multi-act sequences, use GSAP. That's its turf.
 *
 * `<ScrollVarsBoot />` wires this automatically alongside scan().
 *
 * Marks every target it controls with `sv-ui` (the resolved
 * `data-sv-target` element, or the trigger itself when there is no target):
 * a click driver is running on that element even on a page that never calls
 * scan()/track(), so CSS no-JS guards keyed on `html:not(.sv-on)` (sv-acts)
 * must also exempt `.sv-acts.sv-ui`, or a click-only widget stays stuck at
 * the no-JS finished state forever. Scoped to the target, not <html>: an
 * unrelated scroll-revealed widget elsewhere on the same page must still
 * fall back to the finished state when the scroll driver never boots.
 *
 * Marking a target at boot holds its `--sv-acts-settle` (styles/state.css)
 * at 0s for two frames: without that, a target closed by default settles
 * from the no-JS finished value down to 0 WITH the acts transition
 * running, a visible un-animation the instant the click driver takes over.
 * Scoped to that one custom property, never the `transition` shorthand:
 * writing the shorthand would stop every OTHER transition running on the
 * element too, not just the acts one.
 * An inline `transition-duration` LONGHAND is the one thing that knob
 * cannot reach: it outranks the stylesheet's --sv-acts-settle-driven
 * duration by cascade origin no matter what the knob is set to, so it gets
 * its own hold for the same two frames, exact value and priority saved and
 * restored through the longhand getter/setter only, never the shorthand
 * (the shorthand getter reads an inline longhand back as '', so a
 * save/restore through it would erase the longhand for good). A target
 * with no inline longhand never has one written, so an unrelated in-flight
 * transition on it is never touched.
 * The whole settle, --sv-acts-settle AND the longhand hold, is scoped to
 * `.sv-acts` targets: that is the only class with the no-JS finished-value
 * guard above, so only it has a value to un-animate from. A plain toggle
 * target (this module's own `<nav id="menu">` example, most of the time)
 * gets sv-ui and nothing else. This matters beyond skipping needless work:
 * `getPropertyValue('transition-duration')` cannot tell an authored inline
 * longhand from the browser's own expansion of an unrelated inline
 * `transition` SHORTHAND (`style="transition: translate 300ms linear"`
 * reads back as `'300ms'` on that longhand too), so running the hold on a
 * non-.sv-acts target risked forcing that unrelated property's duration to
 * 0s for two frames, snapping instead of animating any change to it that
 * landed inside the hold window.
 */

// One click, one state change, across every live instance. `toggles(root?)`
// is public two-argument API and the documented setup runs two instances at
// once: `<ScrollVarsBoot />` calls it unscoped and a consumer calls it on
// their own root. A trigger nested inside both is contained by both, since
// containment is inclusive and not nearest-exclusive, so both handlers used
// to flip the same class on one click and the toggle netted to nothing: the
// panel stayed closed, --sv-state stayed 0, aria-expanded stayed false, and
// the user saw a button that does nothing (ADU-172).
// The first instance that ACTS on an event claims it, and every later one
// bails. Claimed on action rather than on sight, so a scope that cannot
// resolve the trigger's target still passes the event on to a wider scope
// that can, exactly as before.
// That first instance is the NEAREST scope, by dispatch order rather than by
// a lookup: any scope containing the trigger is an ancestor-or-self of it, so
// it sits on the event's propagation path, and the bubble phase runs the path
// inner to outer. Two instances rooted on the same node (two unscoped calls,
// the other half of this bug) tie and the first registered wins, which is
// still exactly one toggle.
// Keyed by the event object, so the claim lives exactly as long as the
// event does, and a re-dispatched Event object is a silent no-op: dispatch
// the SAME MouseEvent twice and only the first opens the panel, measured
// in Chrome (re-dispatch is rare enough not to need code for it). No
// registry of live scopes to keep in step with stop(), no instance whose
// destruction leaves a stale entry that silently disowns a trigger, and
// nothing to leak.
const claimed = new WeakSet<Event>()

export function toggles(root?: Document | HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {}
  const scope: Document | HTMLElement = root ?? document

  const resolve = (trigger: HTMLElement) => {
    const className = trigger.getAttribute('data-sv-toggle') || 'sv-open'
    const selector = trigger.getAttribute('data-sv-target')
    const target = selector ? (scope.querySelector(selector) as HTMLElement | null) : trigger
    return { className, selector, target }
  }
  // every trigger of the same state reflects it: on boot, and after any
  // click. The state is the PAIR (resolved element, class), not the
  // data-sv-target string: two triggers can name the same panel through
  // different selectors ('#menu' and 'nav.menu'), and a trigger with no
  // target at all resolves to itself, which is the old selector-less case.
  // The class is half the key, not decoration: a hamburger toggling 'open'
  // and a second control toggling 'pinned' on the same nav are two
  // independent states, and grouping by the element alone made one click
  // claim aria-expanded="true" for both.
  const triggers = () => {
    const list = Array.from(scope.querySelectorAll<HTMLElement>('[data-sv-toggle]'))
    if ((scope as HTMLElement).matches?.('[data-sv-toggle]')) list.unshift(scope as HTMLElement)
    return list
  }
  const sync = (target: HTMLElement, className: string, on: boolean) => {
    triggers().forEach((t) => {
      const other = resolve(t)
      if (other.target === target && other.className === className)
        t.setAttribute(t.getAttribute('aria-pressed') !== null ? 'aria-pressed' : 'aria-expanded', String(on))
    })
  }
  // the target's own state, written wherever the class flips
  const write = (target: HTMLElement, className: string, on: boolean) => {
    target.style.setProperty('--sv-state', on ? '1' : '0')
    sync(target, className, on)
  }
  // targets currently inside their boot settle: cancellable by a click that
  // lands inside the two-frame hold, so it still gets its transition
  const settling = new WeakSet<HTMLElement>()
  // an inline transition-duration LONGHAND held for the same settle, saved
  // per target (value and priority, exact). --sv-acts-settle above cannot
  // reach this case: an inline longhand outranks it regardless of what the
  // knob is set to, so a target that has one needs its duration held too.
  const longhandHold = new WeakMap<HTMLElement, { value: string; priority: string }>()
  const holdDuration = (target: HTMLElement) => {
    const value = target.style.getPropertyValue('transition-duration')
    if (!value) return // no inline longhand: the --sv-acts-settle knob alone covers this target
    const priority = target.style.getPropertyPriority('transition-duration')
    longhandHold.set(target, { value, priority })
    target.style.setProperty('transition-duration', '0s', priority)
  }
  const restoreDuration = (target: HTMLElement) => {
    const saved = longhandHold.get(target)
    if (!saved) return
    longhandHold.delete(target)
    target.style.setProperty('transition-duration', saved.value, saved.priority)
  }

  triggers().forEach((trigger) => {
    const { className, target } = resolve(trigger)
    if (!target) return
    if (!target.classList.contains('sv-ui')) {
      target.classList.add('sv-ui')
      // only a .sv-acts target has a no-JS finished value to un-animate
      // from (html:not(.sv-on) .sv-acts:not(.sv-ui), see the module
      // comment): a plain toggle target gets sv-ui above and nothing else,
      // no --sv-acts-settle, no longhand hold, no pending restore (ADU-104,
      // round 6 finding).
      if (target.classList.contains('sv-acts')) {
        // marking it sv-ui alone stops that guard from matching, and
        // --sv-act would transition from the finished value down to 0, a
        // visible un-animation right as the page becomes interactive. Hold
        // the acts transition at zero duration for exactly the settle,
        // scoped to --sv-acts-settle (styles/state.css): two frames is
        // enough for the cascade to apply the new --sv-act before the acts
        // transition comes back.
        target.style.setProperty('--sv-acts-settle', '0s')
        holdDuration(target)
        settling.add(target)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (settling.has(target)) {
              settling.delete(target)
              target.style.removeProperty('--sv-acts-settle')
              restoreDuration(target)
            }
          })
        })
      }
    }
    // markup that ships open (the class already on the target) must agree
    // with --sv-state from the first frame: a continuous CSS rule reading
    // var(--sv-state, 0) otherwise renders the closed value against an open
    // class until the first click.
    write(target, className, target.classList.contains(className))
  })

  const onClick = (event: Event) => {
    // a nearer scope already owned this click: not our trigger, and nothing
    // here runs, not even the sv-ui marking or the settle cancel
    if (claimed.has(event)) return
    const trigger = (event.target as HTMLElement).closest?.(
      '[data-sv-toggle]'
    ) as HTMLElement | null
    // closest() walks the real DOM past this scope's own root: a click on a
    // descendant with no data-sv-toggle of its own can bubble past scope to
    // an ancestor trigger that lives OUTSIDE it. This scope's own sync()
    // only ever queries within scope (scope.querySelectorAll), so resolving
    // and toggling that outer trigger here would flip its target's class and
    // --sv-state while its own aria-expanded, and every other trigger of the
    // same (target, class) pair, is left stale: an instance that does not
    // contain the trigger never owns it (ADU-169, successor of ADU-152 which
    // widened the match without widening this containment check).
    // Containment is the floor here, not the whole rule. It is inclusive, so
    // nested scopes both pass it for the same trigger; the claim above picks
    // exactly one of them, the nearest (ADU-172). One consequence, and the
    // price of single ownership: a second trigger of the same (target, class)
    // pair living OUTSIDE the owning scope keeps the aria-expanded it was
    // synced to at boot, since only the owner's sync() runs.
    if (!trigger || !scope.contains(trigger)) return
    const { className, target } = resolve(trigger)
    if (!target) return
    // this scope is the nearest one that can act on this click: it owns the
    // trigger, and every outer instance still to come bails above
    claimed.add(event)
    // a target that appeared after boot (e.g. inserted later) is marked here
    // instead: its first click shows the finished state with no transition,
    // since it was covered by the no-JS/no-boot fallback up to this instant
    target.classList.add('sv-ui')
    // a click landing inside the boot settle must still animate: drop the
    // hold before the class flips, and cancel the scheduled restore so it
    // does not act on a target a fresh boot may have re-armed since
    if (settling.has(target)) {
      settling.delete(target)
      target.style.removeProperty('--sv-acts-settle')
      restoreDuration(target)
    }
    write(target, className, target.classList.toggle(className))
  }

  scope.addEventListener('click', onClick)
  return () => scope.removeEventListener('click', onClick)
}
