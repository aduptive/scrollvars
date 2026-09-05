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

  const onClick = (event: Event) => {
    const trigger = (event.target as HTMLElement).closest?.(
      '[data-sv-toggle]'
    ) as HTMLElement | null
    if (!trigger) return
    const className = trigger.getAttribute('data-sv-toggle') || 'sv-open'
    const selector = trigger.getAttribute('data-sv-target')
    const target = selector
      ? (scope.querySelector(selector) as HTMLElement | null)
      : trigger
    if (!target) return
    const on = target.classList.toggle(className)
    target.style.setProperty('--sv-state', on ? '1' : '0')
    trigger.setAttribute('aria-expanded', String(on))
  }

  scope.addEventListener('click', onClick)
  return () => scope.removeEventListener('click', onClick)
}
