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
  // 0..1 across the scrollable range, clamped: elastic overscroll (iOS,
  // trackpads) pushes pos() past both ends, and a follower chained through
  // `onScroll` + `seek(progress)` would be sent outside its own range.
  const progress = () => (range() > 0 ? Math.max(0, Math.min(pos() / range(), 1)) : 0)
  // Container-local start of a slide in logical scroll units, from offset
  // chains: layout positions, so the coverflow transforms a slide carries
  // (scale/rotate from --sd) never feed back into its own measurement. RTL
  // mirrors against the container's own client box (clientWidth), not its
  // scrollWidth.
  //
  // Walks the offsetParent chain from `el`, summing offsetLeft (or offsetTop)
  // as it goes. Stops the moment it reaches the container: offsetLeft is
  // defined against the offsetParent's PADDING edge, so once the container
  // itself becomes that offsetParent the running sum already sits at its
  // padding edge and needs no further correction. If the walk never reaches
  // the container (a statically positioned rail: some further ancestor is
  // the real offsetParent instead), it runs all the way to the root and the
  // caller falls back to subtracting the container's own absolute position.
  const chainToContainer = (el: HTMLElement, x: boolean) => {
    let v = 0
    let node: HTMLElement | null = el
    while (node && node !== container) {
      v += x ? node.offsetLeft : node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    return { v, atContainer: node === container }
  }
  // Full walk to the root, used for the container's own absolute position
  // in the fallback above.
  const chain = (el: HTMLElement, x: boolean) => {
    let v = 0
    let node: HTMLElement | null = el
    while (node) {
      v += x ? node.offsetLeft : node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    return v
  }
  const slideStart = (el: HTMLElement) => {
    const x = horizontal
    const walk = chainToContainer(el, x)
    const local = walk.atContainer
      ? walk.v
      : walk.v - chain(container, x) - (x ? container.clientLeft : container.clientTop)
    return rtl ? container.clientWidth - local - el.offsetWidth : local
  }
  const slideSize = (el: HTMLElement) => (horizontal ? el.offsetWidth : el.offsetHeight)

  // Snap suspension via inline style. One source of truth. The authored
  // inline value (e.g. 'none' on scroll-driven instances) is preserved.
  const authoredSnap = container.style.scrollSnapType
  // Authored none is not always inline: a stylesheet rule or a utility class
  // (Tailwind's snap-none) reaches the same state, and an instance that
  // owns its own position must be left alone whichever way it got there.
  // Read once at init, before suspend/resume start writing the inline value.
  const snapIsNone =
    authoredSnap === 'none' ||
    (typeof getComputedStyle === 'function' &&
      getComputedStyle(container).scrollSnapType === 'none')
  const suspendSnap = () => {
    container.style.scrollSnapType = 'none'
  }
  const resumeSnap = () => {
    container.style.scrollSnapType = authoredSnap
  }

  let active = -1
  // The active DOM node, not just its index: a MutationObserver-driven
  // replacement of that node (same index, different element) must still
  // move sv-active and --sv-slide onto the new node, without firing onSlide
  // for an index that never actually changed.
  let activeEl: HTMLElement | null = null
  let position = 0
  let raf = 0
  let dragging = false
  let anim = 0
  // After destroy() every command is a no-op and nothing schedules a frame:
  // the container is no longer measured, and a glide on stale geometry would
  // scroll a slider the page has already let go of (the React kit's autoplay
  // interval kept calling next() on one).
  let destroyed = false

  const slides = () => Array.from(container.children) as HTMLElement[]

  // `p` lets measure() hand in the progress it already snapshotted during
  // its read phase, so the onScroll call at the end of a measure pass never
  // triggers a fresh scrollLeft/scrollWidth read after the writes earlier in
  // that same pass. Called with no argument (the public `state()`, any time
  // outside a measure pass) it reads fresh, same as before.
  const state = (p?: number): SliderState => ({
    active: Math.max(active, 0),
    count: slides().length,
    position,
    progress: p ?? progress(),
    dragging,
    gliding: anim !== 0,
  })

  const measure = () => {
    raf = 0
    const center = pos() + viewport() / 2
    let best = 0
    let bestDist = Infinity
    const list = slides()
    // READ phase for every slide, then WRITE phase: no per-slide read/write interleaving
    const sizes = list.map((slide) => Math.max(slideSize(slide), 1))
    const centers = list.map((slide, i) => slideStart(slide) + sizes[i] / 2)
    // Snapshot progress() here, still inside the read phase: it reads
    // scrollLeft and scrollWidth (through pos()/range()), and the write loop
    // right below writes --sd on every slide. Calling progress() again after
    // that loop (for the --sv-progress write) or after the class writes
    // further down (through state(), for onScroll) would read that same
    // geometry back AFTER this pass has already started writing to the DOM.
    const p = progress()
    list.forEach((slide, i) => {
      // --sd stays normalized by the slide's OWN size (that is what the CSS
      // reads), but the active slide is the nearest in PIXELS: comparing the
      // normalized values made a wide slide look nearer than a narrow one
      // beside it, so with a 100px and a 300px slide the active flipped at
      // centre 101 instead of their midpoint, 150.
      const sd = (centers[i] - center) / sizes[i]
      slide.style.setProperty('--sd', sd.toFixed(4))
      // an exact tie keeps the first slide, as before
      const dist = Math.abs(centers[i] - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    // Continuous position: interpolate between the two adjacent slide CENTRES
    // the viewport centre sits between. The old formula (`best` minus the
    // active slide's own `sd`) normalized by one slide's own size, so any gap
    // made it jump BACKWARDS at every midpoint (two 100px slides 16px apart
    // read 0.580, then 0.430 one pixel later), against the documented
    // contract.
    position = 0
    if (centers.length > 1) {
      let seg = 0
      while (seg + 2 < centers.length && centers[seg + 1] <= center) seg++
      const span = centers[seg + 1] - centers[seg]
      const raw = span > 0 ? seg + (center - centers[seg]) / span : seg
      position = Math.min(Math.max(raw, 0), centers.length - 1)
    }
    container.style.setProperty('--sv-progress', p.toFixed(4))
    // Something outside the slider can rewrite the class attribute of the rail
    // or of a slide (React committing `className`), dropping what the engine
    // owns with no retrack and no index change to re-toggle on. Re-assert on
    // every measure, the way the driver does for its live flag: one classList
    // read each, an actual write only when the DOM disagrees.
    const classes = container.classList
    if (
      classes.contains?.('sv-slider') !== true ||
      classes.contains?.('sv-slider-y') !== !horizontal ||
      classes.contains?.('sv-draggable') !== !!drag
    ) {
      classes.add('sv-slider')
      classes.toggle('sv-slider-y', !horizontal)
      classes.toggle('sv-draggable', !!drag)
    }
    list.forEach((slide, i) => {
      const wanted = i === best
      if (slide.classList.contains?.('sv-active') !== wanted)
        slide.classList.toggle('sv-active', wanted)
    })
    const bestEl = list[best] ?? null
    if (best !== active || bestEl !== activeEl) {
      const indexChanged = best !== active
      active = best
      activeEl = bestEl
      container.style.setProperty('--sv-slide', String(best))
      if (indexChanged) onSlide?.(best)
    }
    if (!destroyed) onScroll?.(state(p))
  }

  const schedule = () => {
    if (!raf && !destroyed) raf = requestAnimationFrame(measure)
  }

  container.addEventListener('scroll', schedule, { passive: true })
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
  ro?.observe(container)
  const watchSlides = () => {
    ro?.disconnect()
    ro?.observe(container)
    slides().forEach((slide) => ro?.observe(slide))
  }
  watchSlides()
  // replaced or added children re-measure even when the container box stays the same
  const mo =
    typeof MutationObserver === 'function'
      ? new MutationObserver(() => {
          watchSlides()
          schedule()
        })
      : null
  mo?.observe(container, { childList: true })
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

  // The wheel settle (below) glides to the nearest slide 200 ms after the last
  // wheel event, with snap suspended until then. Any other writer that takes
  // over inside that window has to drop it, or the settle wakes up mid drag
  // and fights the input that replaced it. Returns whether one was pending:
  // the wheel had suspended snap and only its own glide would have resumed it.
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  const clearWheel = () => {
    if (wheelTimer === undefined) return false
    clearTimeout(wheelTimer)
    wheelTimer = undefined
    return true
  }

  // next, prev and the keyboard all route through goTo; seek is the other
  // writer. Two guards cover every command.
  const goTo = (index: number, smooth = true) => {
    if (destroyed) return
    clearWheel() // this call owns the position now, not the pending settle
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
    if (destroyed) return
    clearWheel()
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
    const wheelPending = clearWheel() // the press owns the position now
    stopGlide() // the user takes over
    target = -1
    const native = (event.target as Element).closest?.('input, textarea, select, [contenteditable]')
    if (!drag || event.pointerType !== 'mouse' || (event.button ?? 0) !== 0 || native) {
      // an interrupted glide (or a dropped wheel settle) must not leave snap
      // suspended forever; a range input, a text field or a right click keep
      // their native gesture
      if (wasGliding || wheelPending) resumeSnap()
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
  const onWheel = (event: WheelEvent) => {
    if (snapIsNone) return
    // only react when the gesture's dominant axis is OUR axis. Otherwise
    // this is the page scrolling past the carousel (trackpad gestures are
    // always slightly diagonal) and assisting would yank the slider around
    const along = horizontal ? event.deltaX : event.deltaY
    const cross = horizontal ? event.deltaY : event.deltaX
    if (Math.abs(along) <= Math.abs(cross)) return
    stopGlide()
    target = -1
    suspendSnap()
    clearWheel()
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined
      goTo(active)
    }, 200)
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
      destroyed = true
      stopGlide()
      resumeSnap()
      container.classList.remove('sv-slider', 'sv-slider-y', 'sv-draggable', 'sv-dragging')
      clearWheel()
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('keydown', onKey)
      container.removeEventListener('scroll', schedule)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('click', suppressClick, true)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      ro?.disconnect()
      mo?.disconnect()
      if (raf) cancelAnimationFrame(raf)
    },
  }
}
