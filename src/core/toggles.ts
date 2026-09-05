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
 * - the target also gets `--sv-state: 1|0` for continuous CSS use
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
 * Marking a target at boot holds its inline `transition` at 'none' for two
 * frames: without that, a target closed by default settles from the no-JS
 * finished value down to 0 WITH the acts transition running, a visible
 * un-animation the instant the click driver takes over.
 */

export function toggles(root?: Document | HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {}
  const scope: Document | HTMLElement = root ?? document

  const resolve = (trigger: HTMLElement) => {
    const className = trigger.getAttribute('data-sv-toggle') || 'sv-open'
    const selector = trigger.getAttribute('data-sv-target')
    const target = selector ? (scope.querySelector(selector) as HTMLElement | null) : trigger
    return { className, selector, target }
  }
  // every trigger of a target reflects its state: on boot, and after any click
  const sync = (selector: string | null, target: HTMLElement, on: boolean) => {
    const triggers = selector
      ? [...scope.querySelectorAll<HTMLElement>('[data-sv-toggle]')].filter(
          (t) => t.getAttribute('data-sv-target') === selector
        )
      : [target]
    triggers.forEach((t) => t.setAttribute('aria-expanded', String(on)))
  }
  scope.querySelectorAll<HTMLElement>('[data-sv-toggle]').forEach((trigger) => {
    const { className, selector, target } = resolve(trigger)
    if (!target) return
    if (!target.classList.contains('sv-ui')) {
      // a target closed by default already painted the no-JS finished value
      // (html:not(.sv-on) .sv-acts:not(.sv-ui), see the module comment):
      // marking it sv-ui alone stops that guard from matching, and --sv-act
      // would transition from the finished value down to 0, a visible
      // un-animation right as the page becomes interactive. Hold the
      // transition off for exactly the settle: two frames is enough for the
      // cascade to apply the new --sv-act before transitions come back.
      const prevTransition = target.style.transition
      target.style.transition = 'none'
      target.classList.add('sv-ui')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.style.transition = prevTransition
        })
      })
    }
    sync(selector, target, target.classList.contains(className))
  })

  const onClick = (event: Event) => {
    const trigger = (event.target as HTMLElement).closest?.(
      '[data-sv-toggle]'
    ) as HTMLElement | null
    if (!trigger) return
    const { className, selector, target } = resolve(trigger)
    if (!target) return
    // a target that appeared after boot (e.g. inserted later) is marked here
    // instead: its first click shows the finished state with no transition,
    // since it was covered by the no-JS/no-boot fallback up to this instant
    target.classList.add('sv-ui')
    const on = target.classList.toggle(className)
    target.style.setProperty('--sv-state', on ? '1' : '0')
    sync(selector, target, on)
  }

  scope.addEventListener('click', onClick)
  return () => scope.removeEventListener('click', onClick)
}
