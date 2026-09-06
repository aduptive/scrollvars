/**
 * Pointer → CSS vars, same philosophy as the scroll driver: one delegated
 * listener per container, writes batched in a rAF, CSS does the rest.
 *
 * Writes on the hovered target (any descendant matching `selector`):
 *   --mx  -1..1  pointer x relative to the target's center
 *   --my  -1..1  pointer y relative to the target's center
 * and toggles `sv-pointer-leave` on exit so CSS can relax the return.
 */

export interface PointerOptions {
  /** Which descendants react (default '.sv-tilt'). */
  selector?: string
}

export function trackPointer(
  container: HTMLElement,
  { selector = '.sv-tilt' }: PointerOptions = {}
): () => void {
  if (typeof window === 'undefined') return () => {}

  let pending: { el: HTMLElement; x: number; y: number } | null = null
  let raf = 0
  let last: HTMLElement | null = null

  // the container itself or any descendant matching selector, never an
  // ancestor closest() walked past the container to find. container.contains
  // is true for the container itself as well as for a descendant, and false
  // for anything outside the container, so it alone tells the two apart:
  // no separate `el !== container` check is needed (that check rejected the
  // container itself too, which is how the gallery's hero is wired,
  // `trackPointer(hero, { selector: '.sv-hero' })`, and dropped every move).
  const matchIn = (target: EventTarget | null): HTMLElement | null => {
    const el = (target as HTMLElement)?.closest?.(selector) as HTMLElement | null
    return el && container.contains(el) ? el : null
  }

  const flush = () => {
    raf = 0
    if (!pending) return
    const { el, x, y } = pending
    pending = null
    const rect = el.getBoundingClientRect()
    const unit = (v: number) => Math.max(-1, Math.min(1, v)).toFixed(3)
    el.style.setProperty('--mx', unit(((x - rect.left) / rect.width) * 2 - 1))
    el.style.setProperty('--my', unit(((y - rect.top) / rect.height) * 2 - 1))
  }

  const onMove = (event: PointerEvent) => {
    const el = matchIn(event.target)
    if (!el) return
    last = el
    el.classList.remove('sv-pointer-leave')
    pending = { el, x: event.clientX, y: event.clientY }
    if (!raf) raf = requestAnimationFrame(flush)
  }

  const onOut = (event: PointerEvent) => {
    const el = matchIn(event.target)
    if (!el || el.contains(event.relatedTarget as Node)) return
    if (pending?.el === el) pending = null // drop queued move. It's stale now
    el.classList.add('sv-pointer-leave')
    el.style.setProperty('--mx', '0')
    el.style.setProperty('--my', '0')
  }

  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerout', onOut)

  return () => {
    container.removeEventListener('pointermove', onMove)
    container.removeEventListener('pointerout', onOut)
    if (raf) cancelAnimationFrame(raf)
    // a destroyed instance must not leave the last hovered element frozen
    // mid-tilt: drop its inline vars and the leave class, back to CSS defaults
    if (last) {
      last.style.removeProperty('--mx')
      last.style.removeProperty('--my')
      last.classList.remove('sv-pointer-leave')
    }
  }
}
