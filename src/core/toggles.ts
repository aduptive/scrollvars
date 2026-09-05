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
    if (target) sync(selector, target, target.classList.contains(className))
  })

  const onClick = (event: Event) => {
    const trigger = (event.target as HTMLElement).closest?.(
      '[data-sv-toggle]'
    ) as HTMLElement | null
    if (!trigger) return
    const { className, selector, target } = resolve(trigger)
    if (!target) return
    const on = target.classList.toggle(className)
    target.style.setProperty('--sv-state', on ? '1' : '0')
    sync(selector, target, on)
  }

  scope.addEventListener('click', onClick)
  return () => scope.removeEventListener('click', onClick)
}
