/**
 * A featherweight carousel on native rails: the browser does the scrolling
 * (momentum, touch, accessibility) and scroll-snap does the magnetism; this
 * module only adds what the platform lacks,
*
 *   - mouse drag-to-scroll on desktop (touch is already native)
 *   - the active-slide observer, exposed the ScrollVars way:
 *       container:  --sv-slide (active index) · --sv-progress (0..1)
 *       each slide: --sd        (signed distance from center, in slide sizes)
 *                   .sv-active  (nearest to center)
 *   - next / prev / goTo, glide with a soft exponential settle
 *   - full state (`state()` / `onScroll`) and `seek()`. Enough to chain
 *     sliders: `slider(main, { onScroll: (s) => thumbs.seek(s.progress) })`
 *   - `axis: 'y'` for vertical sliders
 *
 * Any CSS reading `--sd` animates the slides: scale, fade, coverflow:
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
  /** Fires on every measured scroll frame with the full state. Drive a
   * progress bar, or chain another slider through `seek`. Keep it cheap. */
  onScroll?: (state: SliderState) => void
}

export interface SliderHandle {
  next: (smooth?: boolean) => void
  prev: (smooth?: boolean) => void
  goTo: (index: number, smooth?: boolean) => void
  /** Jump to a fraction (0..1) of the scrollable range. No glide. Made for
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
  // RTL: normalize to logical coordinates: pos() runs 0 → range() from the
  // start of content regardless of direction (raw scrollLeft is 0 → -range
  // in RTL per spec), and slideStart() mirrors offsets to match.
  const rtl =
    horizontal &&
    typeof getComputedStyle === 'function' &&
    getComputedStyle(container).direction === 'rtl'
  container.classList.add('sv-slider')
  container.classList.toggle('sv-slider-y', !horizontal)
  container.classList.toggle('sv-draggable', !!drag) // grab cursor only where dragging works
  container.style.setProperty('--sv-snap', snap)

  // axis accessors: the only place the orientation matters
  const pos = () =>
    horizontal ? (rtl ? -container.scrollLeft + 0 : container.scrollLeft) : container.scrollTop
  const setPos = (v: number) => {
    if (horizontal) container.scrollLeft = rtl ? -v : v
    else container.scrollTop = v
  }
  const viewport = () => (horizontal ? container.clientWidth : container.clientHeight)
  const range = () =>
    Math.max((horizontal ? container.scrollWidth : container.scrollHeight) - viewport(), 0)
  // Container-local start of a slide in logical scroll units. Rect-based, so
  // it does not depend on which ancestor happens to be the offsetParent, and
  // RTL mirrors against the container's own right edge.
  const slideStart = (el: HTMLElement) => {
    const c = container.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (!horizontal) return r.top - c.top - container.clientTop + container.scrollTop
    return rtl
      ? c.right - r.right - container.clientLeft + pos()
      : r.left - c.left - container.clientLeft + pos()
  }
  const slideSize = (el: HTMLElement) => (horizontal ? el.offsetWidth : el.offsetHeight)

  // Snap suspension via inline style. One source of truth. The authored
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
    position = Math.min(
      Math.max(best - (bestSd === Infinity ? 0 : bestSd), 0),
      Math.max(slides().length - 1, 0)
    )
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

  // pending glide destination: rapid next/prev clicks accumulate from here,
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
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (duration <= 0 || reduced || Math.abs(to - current) < 1) {
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
        resumeSnap() // position is centered. Safe to re-engage
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
      resumeSnap() // a previous seek()/glide may have suspended it
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
  // move/up listeners live on window WHILE dragging. Pointer capture on a
  // scrollable container is unreliable, and this way the gesture survives
  // leaving the element (release happens on the real pointerup, anywhere).
  // ponytail: no momentum fling of our own. The release glide covers it.
  let lastPointer = 0
  let startPoint = 0
  let pressed = false // mouse is down; becomes a drag only after real movement
  const DRAG_THRESHOLD = 5

  const onMove = (event: PointerEvent) => {
    const point = horizontal ? event.clientX : event.clientY
    if (!dragging) {
      // pending press: activating only after real movement keeps a plain
      // click a plain click (see the focus restore in endDrag for the one
      // side effect of the preventDefault below)
      if (Math.abs(point - startPoint) < DRAG_THRESHOLD) return
      dragging = true
      suspendSnap()
      container.classList.add('sv-dragging') // slider.css: user-select none
      lastPointer = point
      return
    }
    const step = point - lastPointer
    setPos(pos() - (rtl ? -step : step))
    lastPointer = point
  }
  // the click that follows a real drag would activate whatever link the
  // pointer happens to be over. Swallow exactly that one
  const suppressClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    window.removeEventListener('click', suppressClick, true)
  }
  const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex],[contenteditable]'
  let pressedTarget: HTMLElement | null = null
  const endDrag = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
    pressed = false
    if (!dragging) {
      // ordinary click: preventDefault on pointerdown (below) killed the
      // browser's native focus-on-mousedown along with text selection,
// restore it now that we know this press was never a drag. The click
      // event itself was never suppressed, so link/button activation was
      // unaffected either way.
      const focusable = pressedTarget?.closest<HTMLElement>(FOCUSABLE)
      focusable?.focus({ preventScroll: true })
      resumeSnap() // the press interrupted a glide that had suspended snap
      return
    }
    dragging = false
    container.classList.remove('sv-dragging')
    window.addEventListener('click', suppressClick, true)
    setTimeout(() => window.removeEventListener('click', suppressClick, true), 0)
    goTo(active) // release: glide softly onto the nearest slide
  }
  // native image/link drag-and-drop would hijack the gesture mid-press
  const onDragStart = (event: Event) => {
    if (pressed) event.preventDefault()
  }
  container.addEventListener('dragstart', onDragStart)
  const onDown = (event: PointerEvent) => {
    const wasGliding = anim !== 0
    stopGlide() // the user takes over
    target = -1
    if (!drag || event.pointerType !== 'mouse') {
      // an interrupted glide must not leave snap suspended forever
      if (wasGliding) resumeSnap()
      return
    }
    pressed = true
    pressedTarget = event.target as HTMLElement
    startPoint = horizontal ? event.clientX : event.clientY
    // Kill native text-selection-drag AT THE SOURCE, not reactively: once a
    // selection anchor exists, the browser auto-scrolls toward the pointer
    // on every native mousemove, fighting our own scrollLeft writes frame
    // by frame (the visible jitter). user-select:none alone doesn't reliably
    // stop a selection from STARTING in every engine. PreventDefault does.
    // The one side effect (this also suppresses native focus-on-mousedown)
    // is repaired in endDrag for genuine clicks; the click event itself
    // still fires natively either way, so link/button activation is fine.
    event.preventDefault()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }
  container.addEventListener('pointerdown', onDown)

  // trackpad/wheel pan: native mandatory snap settles fast and can't be
  // slowed, so replace it. Suspend snap while wheeling, then glide to the
  // nearest slide when the (momentum) wheel stream goes quiet. Skipped on
  // instances authored with snap none (scroll-driven ones own their position).
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  const onWheel = (event: WheelEvent) => {
    if (authoredSnap === 'none') return
    // only react when the gesture's dominant axis is OUR axis. Otherwise
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

  const next = (smooth = true) => goTo(stepBase() + 1, smooth)
  const prev = (smooth = true) => goTo(stepBase() - 1, smooth)

  // keyboard: native key-scrolling steps in ~40px jumps and the snap settles
  // hard after each. Replace it with the same soft glide as everything else.
  // The container is made focusable (Safari never focuses scrollers on its own).
  if (container.tabIndex === -1) container.tabIndex = 0
  const onKey = (event: KeyboardEvent) => {
    if (event.target !== container) return // arrows inside inputs stay theirs
    const nextKey = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const prevKey = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    if (event.key === nextKey) next()
    else if (event.key === prevKey) prev()
    else if (event.key === 'Home') goTo(0)
    else if (event.key === 'End') goTo(slides().length - 1)
    else return
    event.preventDefault()
  }
  container.addEventListener('keydown', onKey)

  return {
    next,
    prev,
    goTo,
    seek,
    active: () => Math.max(active, 0),
    state,
    destroy: () => {
      stopGlide()
      resumeSnap()
      container.classList.remove('sv-slider', 'sv-slider-y', 'sv-draggable', 'sv-dragging')
      clearTimeout(wheelTimer)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('keydown', onKey)
      container.removeEventListener('scroll', schedule)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('click', suppressClick, true)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    },
  }
}
