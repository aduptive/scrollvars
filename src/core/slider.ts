/**
 * A featherweight carousel on native rails: the browser does the scrolling
 * (momentum, touch, accessibility) and scroll-snap does the magnetism; this
 * module only adds what the platform lacks —
 *
 *   - mouse drag-to-scroll on desktop (touch is already native)
 *   - the active-slide observer, exposed the scrollvars way:
 *       container:  --sv-slide  (active index)
 *       each slide: --sd        (signed distance from center, in slide widths)
 *                   .sv-active  (nearest to center)
 *   - next / prev / goTo
 *
 * Any CSS reading `--sd` animates the slides: scale, fade, coverflow —
 * no per-frame JS, same philosophy as the scroll driver.
 */

export interface SliderOptions {
  /** Snap strictness (default 'mandatory'). */
  snap?: 'mandatory' | 'proximity'
  /** Mouse drag-to-scroll (default true; touch is native regardless). */
  drag?: boolean
  /** Fires when the active slide changes. */
  onSlide?: (index: number) => void
}

export interface SliderHandle {
  next: (smooth?: boolean) => void
  prev: (smooth?: boolean) => void
  goTo: (index: number, smooth?: boolean) => void
  /** Current active index. */
  active: () => number
  destroy: () => void
}

const noop: SliderHandle = {
  next: () => {},
  prev: () => {},
  goTo: () => {},
  active: () => 0,
  destroy: () => {},
}

export function slider(
  container: HTMLElement,
  { snap = 'mandatory', drag = true, onSlide }: SliderOptions = {}
): SliderHandle {
  if (typeof window === 'undefined') return noop

  container.classList.add('sv-slider')
  container.style.setProperty('--sv-snap', snap)

  let active = -1
  let raf = 0

  const slides = () => Array.from(container.children) as HTMLElement[]

  const measure = () => {
    raf = 0
    const center = container.scrollLeft + container.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    slides().forEach((slide, i) => {
      const mid = slide.offsetLeft + slide.offsetWidth / 2
      const sd = (mid - center) / Math.max(slide.offsetWidth, 1)
      slide.style.setProperty('--sd', sd.toFixed(4))
      const dist = Math.abs(sd)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    if (best !== active) {
      active = best
      slides().forEach((slide, i) => slide.classList.toggle('sv-active', i === best))
      container.style.setProperty('--sv-slide', String(best))
      onSlide?.(best)
    }
  }

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(measure)
  }

  container.addEventListener('scroll', schedule, { passive: true })
  const ro = new ResizeObserver(schedule)
  ro.observe(container)
  measure()

  const goTo = (index: number, smooth = true) => {
    const slide = slides()[Math.max(0, Math.min(index, slides().length - 1))]
    if (!slide) return
    container.scrollTo({
      left: slide.offsetLeft - (container.clientWidth - slide.offsetWidth) / 2,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }

  // mouse drag: snap is suspended while dragging (sv-dragging kills it in
  // CSS) and re-engages on release, which settles onto the nearest slide.
  // ponytail: no momentum fling of our own — the snap settle covers it.
  let dragging = false
  let lastX = 0
  const onDown = (event: PointerEvent) => {
    if (!drag || event.pointerType !== 'mouse') return
    dragging = true
    lastX = event.clientX
    container.classList.add('sv-dragging')
    container.setPointerCapture(event.pointerId)
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    container.scrollLeft -= event.clientX - lastX
    lastX = event.clientX
  }
  const onUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    container.classList.remove('sv-dragging')
    container.releasePointerCapture(event.pointerId)
    goTo(active) // snap-assist: glide to the nearest slide
  }
  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onUp)

  return {
    next: (smooth = true) => goTo(active + 1, smooth),
    prev: (smooth = true) => goTo(active - 1, smooth),
    goTo,
    active: () => active,
    destroy: () => {
      container.removeEventListener('scroll', schedule)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    },
  }
}
