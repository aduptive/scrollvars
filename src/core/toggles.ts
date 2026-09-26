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
 * reversible multi-act sequences, use the sv-acts CSS preset; use GSAP
 * when branching, physics or per-act callbacks are needed.
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
import { lifetime, ownership } from './lifetime.js'

// One click, one state change, across every live instance. `toggles(root?)`
// is public optional-root API and the documented setup runs two instances at
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
// `ref`: WeakRef where available (README floor engines below Chrome 84 /
// Firefox 79 / Safari 14.1 have none, and there a marker keeps its target
// alive the old way, same tradeoff as no WeakSet at all). `settle`/`release`
// close over it instead of the target directly: `life.defer` below (R3)
// only runs at the WHOLE scope's stop, which a long-lived document instance
// (<ScrollVarsBoot>) never reaches, so any closure the deferred callback
// keeps that references a target DIRECTLY pins it for the app's life, one
// per distinct clicked target, growing with every navigation. Going through
// `ref.deref()` lets that target collect once nothing else holds it, with
// the deferred settle/release becoming a no-op.
type Ref = { deref(): HTMLElement | undefined }
const weakRef: (el: HTMLElement) => Ref =
  typeof WeakRef === 'function' ? (el) => new WeakRef(el) : (el) => ({ deref: () => el })
const markers = new WeakMap<HTMLElement, { owners: number; ref: Ref; release: () => void; settle: () => void }>()

// Live instances, for ARIA sync only (round 10): a trigger's aria-expanded
// is resolved by its NEAREST live scope, the one that would claim its click,
// so a Marquee's `.sv-marquee-track` never resolves against another
// Marquee's. stop() removes the entry; the set is otherwise never read.
type Instance = {
  scope: Document | HTMLElement
  triggers: () => HTMLElement[]
  resolve: (t: HTMLElement) => { className: string; target: HTMLElement | null }
  run: (work: () => void) => void
}
const live = new Set<Instance>()
const has = (scope: Document | HTMLElement, node: Node) =>
  typeof scope.contains === 'function' ? scope.contains(node) : true
// The nearest containing scope that RESOLVES the trigger's target: a click
// handled by an outer scope, because the inner one could not find the
// target, is synced by that outer scope too (round 10, verify 3). A
// selector that does not parse is skipped, not thrown on.
function ownerOf(t: HTMLElement): { className: string; target: HTMLElement | null } | undefined {
  let best: Instance | undefined
  let resolved: { className: string; target: HTMLElement | null } | undefined
  live.forEach((i) => {
    if (!has(i.scope, t)) return
    let r: { className: string; target: HTMLElement | null }
    try {
      r = i.resolve(t)
    } catch {
      return
    }
    if (!r.target) return
    if (!best || has(best.scope, i.scope as Node)) {
      best = i
      resolved = r
    }
  })
  return resolved
}

// Marquee: stop work nobody sees. A `.sv-marquee-track` costs a CSS
// animation running forever even off screen and with the tab in the
// background; this pauses it there and resumes on return, independent of
// the user's own pause button (`.sv-paused`, unaffected). One shared
// IntersectionObserver and one shared visibilitychange listener for
// however many marquees and toggles() scopes a page has, matching the
// singleton pattern driver.ts uses for its ResizeObserver. Reduced motion
// already stops the animation entirely (styles/ui.css); this class costs
// nothing extra there beyond the toggle itself.
let marqueeObserver: IntersectionObserver | undefined
const marqueeOffscreen = new WeakMap<HTMLElement, boolean>()
// A per-track LEASE COUNT, not membership: two scopes can register the same
// track (Boot's document-wide scan plus a Marquee's own toggles(node)), and
// releasing one must not strip the class or the observer from a track the
// other scope still owns (ADU-354 blocker 2). `gen` is the generation this
// lease belongs to: a track that gets pruned (detached) and later
// re-registered starts a NEW generation, so a stop() from a scope that
// registered under the OLD generation, running after the reattach, finds
// its own generation stale and does nothing to the fresh lease (a lease is
// keyed by node identity alone, and a detached-then-reattached node keeps
// the same identity, so without this a late release from before the prune
// would decrement or delete a registration it never owned).
const marqueeLeases = new Map<HTMLElement, { count: number; gen: number }>()
// Never reset by a prune: only ever incremented, so a generation number is
// never reused for the same track.
const marqueeGeneration = new WeakMap<HTMLElement, number>()
function nextMarqueeGeneration(track: HTMLElement): number {
  const gen = (marqueeGeneration.get(track) ?? 0) + 1
  marqueeGeneration.set(track, gen)
  return gen
}
let onVisibility: (() => void) | undefined

// A track that left the document (an SPA router replacing DOM outside
// React's own unmount path, or any removal that never called the owning
// scope's stop()) is pruned on its next IO delivery or visibility pass, so
// no lease can keep a detached node observed forever.
function pruneDetachedMarquee(track: HTMLElement): boolean {
  // Explicit `false` only: a stub or an older engine with no isConnected at
  // all reports `undefined`, which must NOT read as detached (fail visible).
  if (track.isConnected !== false) return false
  marqueeLeases.delete(track)
  marqueeObserver?.unobserve(track)
  marqueeOffscreen.delete(track)
  // The same release the normal (last-lease-goes) path performs: a pruned
  // track must not keep announcing itself paused-offscreen if it is later
  // reattached and re-observed under a fresh lease.
  track.classList.remove('sv-marquee-offscreen')
  releaseMarqueeSharedIfUnneeded()
  return true
}

function applyMarqueeState(track: HTMLElement) {
  if (pruneDetachedMarquee(track)) return
  // classList.toggle's second argument defaults on `undefined`, not on a
  // falsy value: the OR chain below can evaluate to `undefined` (document
  // hidden check short-circuiting), which would silently fall back to the
  // "flip from current state" behavior instead of forcing false.
  const offscreen = Boolean((marqueeOffscreen.get(track) ?? false) || (typeof document !== 'undefined' && document.hidden))
  track.classList.toggle('sv-marquee-offscreen', offscreen)
}

function bindMarqueeVisibility() {
  if (onVisibility || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return
  onVisibility = () => marqueeLeases.forEach((_lease, track) => applyMarqueeState(track))
  document.addEventListener('visibilitychange', onVisibility)
}

// The last marquee stopping releases the shared observer and listener, the
// same "nothing left to watch" release driver.ts's ResizeObserver singleton
// does: a page that mounts and fully unmounts its last Marquee leaves no
// resource behind (packed-acceptance's remount baseline check, ADU debug).
function releaseMarqueeSharedIfUnneeded() {
  if (marqueeLeases.size) return
  marqueeObserver?.disconnect()
  marqueeObserver = undefined
  if (onVisibility && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
    document.removeEventListener('visibilitychange', onVisibility)
  }
  onVisibility = undefined
}

function watchMarquee(track: HTMLElement, life: ReturnType<typeof lifetime>) {
  const existing = marqueeLeases.get(track)
  const already = !!existing
  // A registration reuses the CURRENT generation if one is already live for
  // this track; otherwise it starts one (a fresh track, or one that was
  // pruned and is only now being seen again).
  const gen = existing ? existing.gen : nextMarqueeGeneration(track)
  marqueeLeases.set(track, { count: (existing?.count ?? 0) + 1, gen })
  // Registered before any of the steps below run: a throw partway through
  // (the IntersectionObserver constructor, bindMarqueeVisibility's
  // addEventListener, an overridden classList) is caught by toggles()'s
  // own life.setup() and unwound through every deferred release, this one
  // included. Registering it LAST left a track added with no cleanup ever
  // wired to remove it. Every scope that registers gets its own decrement:
  // only the one that takes the count to zero actually releases the track.
  life.defer(() => {
    const current = marqueeLeases.get(track)
    // No entry (pruned as detached), or the entry belongs to a LATER
    // generation than the one this release was issued for (the track was
    // pruned and re-registered by someone else since): not ours to touch.
    if (!current || current.gen !== gen) return
    if (current.count > 1) { marqueeLeases.set(track, { count: current.count - 1, gen }); return }
    marqueeLeases.delete(track)
    marqueeObserver?.unobserve(track)
    marqueeOffscreen.delete(track)
    track.classList.remove('sv-marquee-offscreen')
    releaseMarqueeSharedIfUnneeded()
  })
  if (already) return
  marqueeOffscreen.set(track, false)
  bindMarqueeVisibility()
  if (typeof IntersectionObserver === 'function') {
    if (!marqueeObserver) {
      marqueeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (!marqueeLeases.has(el)) return
          if (pruneDetachedMarquee(el)) return
          marqueeOffscreen.set(el, !entry.isIntersecting)
          applyMarqueeState(el)
        })
      })
    }
    marqueeObserver.observe(track)
  }
  applyMarqueeState(track)
}

export function toggles(root?: Document | HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {}
  const scope: Document | HTMLElement = root ?? document
  const life = lifetime()
  let transaction = ownership()
  let siblingWrites: ReturnType<typeof ownership>[] = []
  const rollback = () => {
    for (const journal of [transaction, ...siblingWrites]) {
      try { journal.restore() } catch { /* retain the operation's error */ }
    }
  }

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
  // ARIA describes the TARGET's state, so every trigger of the pair in every
  // live instance reflects it, not only the ones this scope owns: a trigger
  // outside the owning scope kept the aria-expanded it was synced to at boot
  // (round 10). Each trigger resolves in its nearest live scope, and a
  // trigger whose selector does not parse is skipped, not thrown on.
  const sync = (target: HTMLElement, className: string, on: boolean) => {
    const seen = new Set<HTMLElement>()
    live.forEach((otherInstance) => {
      const journal = otherInstance === instance ? transaction : ownership()
      if (otherInstance !== instance) siblingWrites.push(journal)
      const update = () => otherInstance.triggers().forEach((t) => {
        if (seen.has(t)) return
        seen.add(t)
        const other = ownerOf(t)
        if (other && other.target === target && other.className === className)
          journal.attr(t, t.getAttribute('aria-pressed') !== null ? 'aria-pressed' : 'aria-expanded', String(on))
      })
      // The click's own sync belongs to its semantic transaction. A broken
      // sibling's query or ARIA write belongs to that sibling's lifetime.
      if (otherInstance === instance) update()
      else otherInstance.run(() => {
        try { update() }
        catch (error) {
          try { journal.restore() } catch { /* retain the sibling failure */ }
          throw error
        }
      })
    })
  }
  const instance: Instance = { scope, triggers, resolve, run: life.guard(work => work()) }
  // the target's own state, written wherever the class flips
  const write = (target: HTMLElement, className: string, on: boolean) => {
    transaction.style(target, '--sv-state', on ? '1' : '0')
    sync(target, className, on)
  }
  // targets currently inside their boot settle: cancellable by a click that
  // lands inside the two-frame hold, so it still gets its transition
  const settling = new WeakSet<HTMLElement>()
  const frames = new Set<number>()
  const hold = ownership()
  const frame = (fn: () => void) => {
    const id = requestAnimationFrame(life.guard(() => { frames.delete(id); fn() }))
    frames.add(id)
  }
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
    hold.style(target, 'transition-duration', '0s', priority)
  }
  const restoreDuration = (target: HTMLElement) => {
    const saved = longhandHold.get(target)
    if (!saved) return
    longhandHold.delete(target)
    hold.restore(target, 'style:transition-duration')
  }
  // WeakSet: under <ScrollVarsBoot> this document scope never stops, so a
  // strong Set would hold every clicked target for the app's whole life,
  // detached subtrees included, growing with every navigation (R3). Its only
  // reads are has/add; nothing ever needs to enumerate it.
  const targets = new WeakSet<HTMLElement>()
  const mark = (target: HTMLElement) => {
    if (targets.has(target)) return false
    targets.add(target)
    let marker = markers.get(target)
    const authored = target.classList.contains('sv-ui')
    if (!marker) {
      const ref = weakRef(target)
      marker = { owners: 0, ref, settle: () => {
        const t = ref.deref()
        if (t && settling.has(t)) {
          settling.delete(t)
          hold.restore(t)
          restoreDuration(t)
        }
      }, release: () => {
        const t = ref.deref()
        if (!t) return
        if (!authored) t.classList.remove('sv-ui')
        if (settling.has(t)) {
          settling.delete(t)
          hold.restore(t)
          restoreDuration(t)
        }
      } }
      markers.set(target, marker)
    }
    marker.owners++
    life.defer(() => {
      // Finish a departing owner's hold even if another controller remains.
      // It must not retain 0s after this owner's queued frames are cancelled.
      // Through marker.ref, never `target` directly: this callback sits in
      // life's own release list until the WHOLE scope stops, which the
      // document instance never does, so a direct capture would pin every
      // distinct clicked target for the app's life (R3).
      try { marker!.settle() }
      finally {
        if (--marker!.owners === 0) {
          const t = marker!.ref.deref()
          if (t) markers.delete(t)
          marker!.release()
        }
      }
    })
    target.classList.add('sv-ui')
    return !authored
  }

  const boot = () => triggers().forEach((trigger) => {
    let resolved: ReturnType<typeof resolve>
    try {
      resolved = resolve(trigger)
    } catch (error) {
      // a selector that does not parse skips its trigger, not the whole boot
      // (round 10). Browsers throw a DOMException NAMED SyntaxError, never a
      // JS SyntaxError instance, so the name is the only cross-surface check.
      if ((error as { name?: unknown } | null)?.name === 'SyntaxError') return
      throw error
    }
    const { className, target } = resolved
    if (!target) return
    if (mark(target)) {
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
        settling.add(target)
        hold.style(target, '--sv-acts-settle', '0s')
        holdDuration(target)
        frame(() => {
          frame(() => {
            if (settling.has(target)) {
              settling.delete(target)
              hold.restore(target)
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

  const click = (event: Event) => {
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
    let resolved: ReturnType<typeof resolve>
    try {
      resolved = resolve(trigger)
    } catch (error) {
      // same contract as boot(): a selector that does not parse skips this
      // trigger, not the whole instance. Before claimed.add(event), so an
      // outer scope still gets a chance at the same click.
      if ((error as { name?: unknown } | null)?.name === 'SyntaxError') return
      throw error
    }
    const { className, target } = resolved
    if (!target) return
    // this scope is the nearest one that can act on this click: it owns the
    // trigger, and every outer instance still to come bails above
    claimed.add(event)
    // a target that appeared after boot (e.g. inserted later) is marked here
    // instead: its first click shows the finished state with no transition,
    // since it was covered by the no-JS/no-boot fallback up to this instant
    mark(target)
    // a click landing inside the boot settle must still animate: drop the
    // hold before the class flips, and cancel the scheduled restore so it
    // does not act on a target a fresh boot may have re-armed since
    markers.get(target)?.settle()
    const on = !target.classList.contains(className)
    transaction.class(target, className, on)
    write(target, className, on)
  }

  const onClick = life.guard((event: Event) => {
    transaction = ownership()
    siblingWrites = []
    try { click(event) }
    catch (error) {
      rollback()
      throw error
    } finally { transaction = ownership(); siblingWrites = [] }
  })
  life.defer(() => {
    frames.forEach(id => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id) })
    frames.clear()
  })
  // no targets.clear(): a WeakSet has none, and it needs none, its entries
  // drop on their own once this closure (mark/click/onClick) is unreachable
  life.defer(() => live.delete(instance))
  life.defer(() => scope.removeEventListener('click', onClick))
  try {
    life.setup(() => {
      live.add(instance)
      boot()
      scope.addEventListener('click', onClick)
      scope.querySelectorAll<HTMLElement>('.sv-marquee-track').forEach((track) => watchMarquee(track, life))
    })
  } catch (error) {
    rollback()
    throw error
  }
  transaction = ownership()
  siblingWrites = []
  return life.stop
}
