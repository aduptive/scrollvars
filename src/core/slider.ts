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
  /** Glide duration for next/prev/goTo in ms (default 600; 0 = instant).
   * Longer = softer — the browser's own smooth scroll is not configurable. */
  duration?: number
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
  { snap = 'mandatory', drag = true, duration = 600, onSlide }: SliderOptions = {}
): SliderHandle {
  if (typeof window === 'undefined') return noop

  container.classList.add('sv-slider')
  if (drag) container.classList.add('sv-draggable') // grab cursor only where dragging works
  container.style.setProperty('--sv-snap', snap)

  // Snap suspension via inline style — one source of truth. The authored
  // inline value (e.g. 'none' on scroll-driven instances) is preserved.
  const authoredSnap = container.style.scrollSnapType
  const suspendSnap = () => {
    container.style.scrollSnapType = 'none'
  }
  const resumeSnap = () => {
    container.style.scrollSnapType = authoredSnap
  }

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

  // own glide: eased scrollLeft animation with configurable duration —
  // native smooth scrolling is fast and not configurable. Snap is suspended
  // while gliding (sv-gliding) so it can't tug mid-animation.
  let anim = 0
  const stopGlide = () => {
    if (anim) cancelAnimationFrame(anim)
    anim = 0
    container.classList.remove('sv-gliding')
  }
  const glide = (to: number) => {
    stopGlide()
    const from = container.scrollLeft
    if (duration <= 0 || Math.abs(to - from) < 1) {
      resumeSnap()
      container.scrollTo({ left: to, behavior: 'instant' })
      return
    }
    suspendSnap() // native snap must not tug while we animate
    container.classList.add('sv-gliding')
    const start = performance.now()
    // ease-out: leaves with the gesture's energy, decelerates into the stop —
    // the natural feel for a drag release (ease-in-out hitches there)
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
      const k = Math.min((now - start) / duration, 1)
      container.scrollLeft = from + (to - from) * ease(k)
      if (k < 1) {
        anim = requestAnimationFrame(step)
      } else {
        stopGlide()
        resumeSnap() // position is centered — safe to re-engage
      }
    }
    anim = requestAnimationFrame(step)
  }

  const goTo = (index: number, smooth = true) => {
    const slide = slides()[Math.max(0, Math.min(index, slides().length - 1))]
    if (!slide) return
    const left = slide.offsetLeft - (container.clientWidth - slide.offsetWidth) / 2
    if (smooth) glide(left)
    else {
      stopGlide()
      container.scrollTo({ left, behavior: 'instant' })
    }
  }

  // mouse drag: snap is suspended while dragging (sv-dragging kills it in
  // CSS) and re-engages on release, which settles onto the nearest slide.
  // ponytail: no momentum fling of our own — the snap settle covers it.
  let dragging = false
  let lastX = 0
  const onDown = (event: PointerEvent) => {
    stopGlide() // the user takes over
    if (!drag || event.pointerType !== 'mouse') return
    suspendSnap() // stays off until the release glide finishes
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

  // trackpad/wheel pan: native mandatory snap settles fast and can't be
  // slowed, so replace it — suspend snap while wheeling, then glide to the
  // nearest slide when the (momentum) wheel stream goes quiet. Skipped on
  // instances authored with snap none (scroll-driven ones own their position).
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  const onWheel = () => {
    if (authoredSnap === 'none') return
    stopGlide()
    suspendSnap()
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => goTo(active), 160)
  }
  container.addEventListener('wheel', onWheel, { passive: true })

  return {
    next: (smooth = true) => goTo(active + 1, smooth),
    prev: (smooth = true) => goTo(active - 1, smooth),
    goTo,
    active: () => active,
    destroy: () => {
      stopGlide()
      resumeSnap()
      clearTimeout(wheelTimer)
      container.removeEventListener('wheel', onWheel)
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
