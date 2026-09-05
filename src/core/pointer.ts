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
    const el = (event.target as HTMLElement).closest?.(selector) as HTMLElement | null
    if (!el) return
    el.classList.remove('sv-pointer-leave')
    pending = { el, x: event.clientX, y: event.clientY }
    if (!raf) raf = requestAnimationFrame(flush)
  }

  const onOut = (event: PointerEvent) => {
    const el = (event.target as HTMLElement).closest?.(selector) as HTMLElement | null
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
  }
}
