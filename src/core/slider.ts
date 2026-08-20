/**
 * A featherweight carousel on native rails: the browser does the scrolling
 * (momentum, touch, accessibility) and scroll-snap does the magnetism; this
 * module only adds what the platform lacks —
 *
 *   - mouse drag-to-scroll on desktop (touch is already native)
 *   - the active-slide observer, exposed the scrollvars way:
 *       container:  --sv-slide (active index) · --sv-progress (0..1)
 *       each slide: --sd        (signed distance from center, in slide sizes)
 *                   .sv-active  (nearest to center)
 *   - next / prev / goTo, glide with a soft exponential settle
 *   - full state (`state()` / `onScroll`) and `seek()` — enough to chain
 *     sliders: `slider(main, { onScroll: (s) => thumbs.seek(s.progress) })`
 *   - `axis: 'y'` for vertical sliders
 *
 * Any CSS reading `--sd` animates the slides: scale, fade, coverflow —
 * no per-frame JS, same philosophy as the scroll driver.
 */

export interface SliderState {
  active: number
  count: number
  /** Continuous position in slide units (0 .. count−1). */
  position: number
  /** 0..1 across the scrollable range. */
  progress: number
  dragging: boolean
  gliding: boolean
}

export interface SliderOptions {
  /** Scroll axis (default 'x'). */
  axis?: 'x' | 'y'
  /** Snap strictness (default 'mandatory'). */
  snap?: 'mandatory' | 'proximity'
  /** Mouse drag-to-scroll (default true; touch is native regardless). */
  drag?: boolean
  /** Glide settle time in ms (default 600; 0 = instant). Exponential lerp:
   * velocity ∝ remaining distance, so any travel feels equally soft. */
  duration?: number
  /** Fires when the active slide changes. */
  onSlide?: (index: number) => void
  /** Fires on every measured scroll frame with the full state — drive a
   * progress bar, or chain another slider through `seek`. Keep it cheap. */
  onScroll?: (state: SliderState) => void
}

export interface SliderHandle {
  next: (smooth?: boolean) => void
  prev: (smooth?: boolean) => void
  goTo: (index: number, smooth?: boolean) => void
  /** Jump to a fraction (0..1) of the scrollable range — no glide. Made for
   * followers: suspends this instance's snap so the driver stays the single
   * writer of its position. */
  seek: (progress: number) => void
  /** Current active index. */
  active: () => number
  state: () => SliderState
  destroy: () => void
}

const noopState: SliderState = {
  active: 0,
  count: 0,
  position: 0,
  progress: 0,
  dragging: false,
  gliding: false,
}

const noop: SliderHandle = {
  next: () => {},
  prev: () => {},
  goTo: () => {},
  seek: () => {},
  active: () => 0,
  state: () => noopState,
  destroy: () => {},
}

export function slider(
  container: HTMLElement,
  {
    axis = 'x',
    snap = 'mandatory',
    drag = true,
    duration = 600,
    onSlide,
    onScroll,
  }: SliderOptions = {}
): SliderHandle {
  if (typeof window === 'undefined') return noop

  const horizontal = axis === 'x'
  container.classList.add('sv-slider')
  if (!horizontal) container.classList.add('sv-slider-y')
  if (drag) container.classList.add('sv-draggable') // grab cursor only where dragging works
  container.style.setProperty('--sv-snap', snap)

  // axis accessors — the only place the orientation matters
  const pos = () => (horizontal ? container.scrollLeft : container.scrollTop)
  const setPos = (v: number) => {
    if (horizontal) container.scrollLeft = v
    else container.scrollTop = v
  }
  const viewport = () => (horizontal ? container.clientWidth : container.clientHeight)
  const range = () =>
    Math.max((horizontal ? container.scrollWidth : container.scrollHeight) - viewport(), 0)
  const slideStart = (el: HTMLElement) => (horizontal ? el.offsetLeft : el.offsetTop)
  const slideSize = (el: HTMLElement) => (horizontal ? el.offsetWidth : el.offsetHeight)

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
  let position = 0
  let raf = 0
  let dragging = false
  let anim = 0

  const slides = () => Array.from(container.children) as HTMLElement[]

  const state = (): SliderState => ({
    active: Math.max(active, 0),
    count: slides().length,
    position,
    progress: range() > 0 ? pos() / range() : 0,
    dragging,
    gliding: anim !== 0,
  })

  const measure = () => {
    raf = 0
    const center = pos() + viewport() / 2
    let best = 0
    let bestSd = Infinity
    slides().forEach((slide, i) => {
      const mid = slideStart(slide) + slideSize(slide) / 2
      const sd = (mid - center) / Math.max(slideSize(slide), 1)
      slide.style.setProperty('--sd', sd.toFixed(4))
      if (Math.abs(sd) < Math.abs(bestSd)) {
        bestSd = sd
        best = i
      }
    })
    position = Math.max(best - (bestSd === Infinity ? 0 : bestSd), 0)
    const progress = range() > 0 ? pos() / range() : 0
    container.style.setProperty('--sv-progress', progress.toFixed(4))
    if (best !== active) {
      active = best
      slides().forEach((slide, i) => slide.classList.toggle('sv-active', i === best))
      container.style.setProperty('--sv-slide', String(best))
      onSlide?.(best)
    }
    onScroll?.(state())
  }

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(measure)
  }

  container.addEventListener('scroll', schedule, { passive: true })
  const ro = new ResizeObserver(schedule)
  ro.observe(container)
  measure()

  // pending glide destination — rapid next/prev clicks accumulate from here,
  // not from `active` (which lags mid-glide and would swallow the clicks)
  let target = -1
  const stopGlide = () => {
    if (anim) cancelAnimationFrame(anim)
    anim = 0
    container.classList.remove('sv-gliding')
  }
  const glide = (to: number) => {
    stopGlide()
    let current = pos()
    if (duration <= 0 || Math.abs(to - current) < 1) {
      resumeSnap()
      target = -1
      setPos(to)
      return
    }
    suspendSnap() // native snap must not tug while we animate
    container.classList.add('sv-gliding')
    // exponential lerp, not a fixed tween: velocity is proportional to the
    // remaining distance, so short release settles feel as soft as long
    // button glides, and retargets (rapid clicks) stay continuous.
    // `duration` calibrates the settle time (~99.8% covered by then).
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now
      const factor = 1 - Math.pow(0.002, dt / duration)
      current += (to - current) * factor
      if (Math.abs(to - current) < 0.5) {
        setPos(to)
        stopGlide()
        target = -1
        resumeSnap() // position is centered — safe to re-engage
      } else {
        setPos(current)
        anim = requestAnimationFrame(step)
      }
    }
    anim = requestAnimationFrame(step)
  }

  const goTo = (index: number, smooth = true) => {
    const all = slides()
    const clamped = Math.max(0, Math.min(index, all.length - 1))
    const slide = all[clamped]
    if (!slide) return
    const to = slideStart(slide) - (viewport() - slideSize(slide)) / 2
    if (smooth) {
      target = clamped
      glide(to)
    } else {
      stopGlide()
      target = -1
      setPos(to)
    }
  }

  const seek = (progress: number) => {
    stopGlide()
    target = -1
    suspendSnap() // the driver owns this instance's position
    setPos(Math.max(0, Math.min(progress, 1)) * range())
  }

  /** Where the next relative step counts from: the in-flight destination if
   * a glide is running, the measured active slide otherwise. */
  const stepBase = () => (anim && target >= 0 ? target : active)

  // mouse drag: snap is suspended from grab until the release glide finishes.
  // move/up listeners live on window WHILE dragging — pointer capture on a
  // scrollable container is unreliable, and this way the gesture survives
  // leaving the element (release happens on the real pointerup, anywhere).
  // ponytail: no momentum fling of our own — the release glide covers it.
  let lastPointer = 0
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    const point = horizontal ? event.clientX : event.clientY
    setPos(pos() - (point - lastPointer))
    lastPointer = point
  }
  const endDrag = () => {
    if (!dragging) return
    dragging = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
    container.classList.remove('sv-dragging')
    goTo(active) // release: glide softly onto the nearest slide
  }
  const onDown = (event: PointerEvent) => {
    stopGlide() // the user takes over
    target = -1
    if (!drag || event.pointerType !== 'mouse') return
    // kill native text-selection at the root: with a live selection inside a
    // scrollable container the browser auto-scrolls toward the pointer,
    // fighting the drag frame by frame (user-select:none alone doesn't stop
    // the selection from STARTING in every browser)
    event.preventDefault()
    suspendSnap()
    dragging = true
    lastPointer = horizontal ? event.clientX : event.clientY
    container.classList.add('sv-dragging')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }
  container.addEventListener('pointerdown', onDown)

  // trackpad/wheel pan: native mandatory snap settles fast and can't be
  // slowed, so replace it — suspend snap while wheeling, then glide to the
  // nearest slide when the (momentum) wheel stream goes quiet. Skipped on
  // instances authored with snap none (scroll-driven ones own their position).
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  const onWheel = (event: WheelEvent) => {
    if (authoredSnap === 'none') return
    // only react when the gesture's dominant axis is OUR axis — otherwise
    // this is the page scrolling past the carousel (trackpad gestures are
    // always slightly diagonal) and assisting would yank the slider around
    const along = horizontal ? event.deltaX : event.deltaY
    const cross = horizontal ? event.deltaY : event.deltaX
    if (Math.abs(along) <= Math.abs(cross)) return
    stopGlide()
    target = -1
    suspendSnap()
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => goTo(active), 200)
  }
  container.addEventListener('wheel', onWheel, { passive: true })

  return {
    next: (smooth = true) => goTo(stepBase() + 1, smooth),
    prev: (smooth = true) => goTo(stepBase() - 1, smooth),
    goTo,
    seek,
    active: () => Math.max(active, 0),
    state,
    destroy: () => {
      stopGlide()
      resumeSnap()
      clearTimeout(wheelTimer)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('scroll', schedule)
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    },
  }
}
