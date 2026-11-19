/**
 * A featherweight carousel on native rails: the browser does the scrolling
 * (momentum, touch, accessibility) and scroll-snap does the magnetism; this
 * module only adds what the platform lacks,
*
 *   - mouse drag-to-scroll on desktop (touch is already native)
 *   - the active-slide observer, exposed the ScrollVars way:
 *       container:  --sv-slide (active index) · --sv-progress (0..1)
 *       each slide: --sd        (signed distance from center, in slide sizes)
 *                   .sv-active  (nearest to the alignment anchor)
 *   - next / prev / goTo, glide with a soft exponential settle
 *   - full state (`state()` / `onScroll`) and `seek()`. Enough to chain
 *     sliders: `slider(main, { onScroll: (s) => thumbs.seek(s.progress) })`
 *   - `axis: 'y'` for vertical sliders
 *
 * Any CSS reading `--sd` animates the slides: scale, fade, coverflow:
* no per-frame JS, same philosophy as the scroll driver.
 */
import { reducedMotion as effectiveReduce, onMotionChange } from './motion.js'
import { lifetime, ownership } from './lifetime.js'

export interface SliderState {
  active: number
  count: number
  /** Continuous position in slide units (0 .. count−1; 0 <= position < count in a loop). */
  position: number
  /** 0..1 across the scrollable range. */
  progress: number
  dragging: boolean
  gliding: boolean
  /** Whether previous/next navigation is available at the current physical position. */
  canPrev: boolean
  canNext: boolean
}

export interface SliderOptions {
  /** Scroll axis (default 'x'). */
  axis?: 'x' | 'y'
  /** Logical snap alignment (default 'center'). Start/end follow RTL and axis. */
  align?: 'start' | 'center' | 'end'
  /** Snap strictness (default 'mandatory'). */
  snap?: 'mandatory' | 'proximity'
  /** Mouse drag-to-scroll (default true; touch is native regardless). */
  drag?: boolean
  /** Glide settle time in ms (default 600; 0 = instant). Exponential lerp:
   * velocity ∝ remaining distance, so any travel feels equally soft. */
  duration?: number
  /** Wrap next/prev at either end with a return glide (default false).
   * Native dragging and goTo/seek still use the finite scroll range. */
  rewind?: boolean
  /** Recycle offscreen slides for continuous navigation (default false).
   * Falls back to rewind when the rail cannot hold a viewport plus two
   * slide-sized buffers. Original DOM nodes, focus and media are preserved. */
  loop?: boolean
  /** Write --sd, --sv-progress and --sv-slide (default true). Disable when
   * CSS does not consume them. Existing inline values are left intact. */
  cssVars?: boolean
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
  canPrev: false,
  canNext: false,
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
    align = 'center',
    snap = 'mandatory',
    drag = true,
    duration = 600,
    rewind = false,
    loop = false,
    cssVars = true,
    onSlide,
    onScroll,
  }: SliderOptions = {}
): SliderHandle {
  if (typeof window === 'undefined') return noop

  const life = lifetime()
  const owned = ownership()
  life.defer(() => owned.restore())

  const horizontal = axis === 'x'
  // RTL: normalize to logical coordinates: pos() runs 0 → range() from the
  // start of content regardless of direction (raw scrollLeft is 0 → -range
  // in RTL per spec), and slideStart() mirrors offsets to match.
  const rtl =
    horizontal &&
    typeof getComputedStyle === 'function' &&
    getComputedStyle(container).direction === 'rtl'

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
  const alignment = align === 'start' || align === 'end' ? align : 'center'
  const fraction = alignment === 'start' ? 0 : alignment === 'end' ? 1 : 0.5
  let insetStart = 0, insetEnd = 0
  // Resolve snapport insets on layout changes, never in the scroll-frame loop.
  const readInsets = () => {
    if (typeof getComputedStyle !== 'function') return
    const style = getComputedStyle(container), size = viewport()
    const resolve = (value: string) => {
      if (!value || value === 'auto') return 0
      if (/^[\d.]+(?:px|%)?$/.test(value))
        return parseFloat(value) * (value.endsWith('%') ? size / 100 : 1)
      // CSS resolves calc()/min()/max() percentages against the scrollport,
      // unlike ordinary padding percentages (the containing block).
      const host = document.createElement('div'), probe = document.createElement('div')
      host.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;box-sizing:content-box;min-width:0;max-width:none;padding:0;border:0;width:${size}px;height:0;overflow:hidden;contain:strict;`
      probe.style.cssText = `display:block;box-sizing:content-box;min-width:0;max-width:none;padding:0;border:0;width:${value};`
      host.appendChild(probe)
      document.documentElement.appendChild(host)
      try { return parseFloat(getComputedStyle(probe).width) || 0 }
      finally { host.remove() }
    }
    insetStart = resolve(horizontal ? rtl ? style.scrollPaddingRight : style.scrollPaddingLeft : style.scrollPaddingTop)
    insetEnd = resolve(horizontal ? rtl ? style.scrollPaddingLeft : style.scrollPaddingRight : style.scrollPaddingBottom)
  }
  const snapAnchor = () => insetStart + (viewport() - insetStart - insetEnd) * fraction
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
  const destination = (start: number, size: number) => start + size * fraction - snapAnchor()

  // Snap suspension via inline style. One source of truth. The authored
  // inline value (e.g. 'none' on scroll-driven instances) is preserved.
  const authoredSnap = container.style.scrollSnapType
  // Authored none is not always inline: a stylesheet rule or a utility class
  // (Tailwind's snap-none) reaches the same state, and an instance that
  // owns its own position must be left alone whichever way it got there.
  // The computed half is read inside life.setup(), AFTER `.sv-slider` lands
  // (round 15 item 6): that class's own rule sets scroll-snap-type, so
  // reading it here, before setup, sees a plain unclassed element's `none`
  // and mistakes it for an authored none forever, on every element `slider()`
  // is ever called on that did not already carry the class.
  let snapIsNone = authoredSnap === 'none'
  const suspendSnap = () => {
    if (typeof container.style.getPropertyValue === 'function') owned.style(container, 'scroll-snap-type', 'none')
    else owned.property(container.style, 'scrollSnapType', 'none')
  }
  const resumeSnap = () => {
    owned.restore(container, 'style:scroll-snap-type')
    owned.restore(container.style, 'property:scrollSnapType')
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
  life.defer(() => { destroyed = true; dragging = false })

  const slides = () => Array.from(container.children) as HTMLElement[]

  let looping = false
  let loopPeriod = 0
  const restoreLoopOrder = () => {
    const list = slides(), anchor = list[active]
    const before = anchor ? slideStart(anchor) - pos() : 0
    list.forEach(slide => owned.restore(slide, 'style:order'))
    if (anchor) setPos(Math.max(0, Math.min(slideStart(anchor) - before, range())))
  }
  life.defer(() => { if (looping) restoreLoopOrder() })
  const fixLoop = (index?: number, scrollTarget?: number) => {
    if (!loop) return
    const list = slides()
    const ordered = list.map((el, index) => ({ el, index, start: slideStart(el), size: slideSize(el) }))
      .sort((a, b) => a.start - b.start)
    const width = viewport()
    const gap = ordered.length > 1 ? ordered[1].start - ordered[0].start - ordered[0].size : 0
    const buffer = Math.max(0, ...ordered.map(slide => slide.size + gap))
    const wasLooping = looping
    looping = ordered.length >= 3 && width > 0 && buffer > 0 && range() >= buffer * 2 - 0.5 &&
      ordered.every((slide, i) => slide.size > 0 && (!i || (slide.index === (ordered[i - 1].index + 1) % list.length && Math.abs(slide.start - ordered[i - 1].start - ordered[i - 1].size - gap) <= 1)))
    if (!looping) {
      if (wasLooping) restoreLoopOrder()
      return
    }
    loopPeriod = ordered[ordered.length - 1].start + ordered[ordered.length - 1].size - ordered[0].start + gap
    let visibleScroll = pos()
    const destination = index === undefined ? null : ordered.find(slide => slide.el === list[Math.max(0, Math.min(index, list.length - 1))])
    let scroll = destination ? destination.start + destination.size * fraction - snapAnchor() : scrollTarget ?? visibleScroll
    const anchor = ordered.find(slide => slide.start + slide.size > visibleScroll) ?? ordered[0]
    const before = anchor.start - visibleScroll
    let changed = false
    // Only move fully offscreen nodes; the scroll correction keeps the visible anchor still.
    for (let i = 0; i < ordered.length; i++) {
      const first = ordered[0], last = ordered[ordered.length - 1]
      if (scroll - first.start < buffer / 2 - 0.5 && last.start >= visibleScroll + width - 0.5) {
        ordered.pop()
        const delta = last.size + gap
        ordered.forEach(slide => { slide.start += delta })
        last.start = first.start - delta
        ordered.unshift(last)
        scroll += delta
        visibleScroll += delta
      } else if (last.start + last.size - scroll - width < buffer / 2 - 0.5 && first.start + first.size <= visibleScroll + 0.5) {
        ordered.shift()
        const delta = first.size + gap
        ordered.forEach(slide => { slide.start -= delta })
        first.start = last.start + last.size + gap
        ordered.push(first)
        scroll -= delta
        visibleScroll -= delta
      } else break
      changed = true
    }
    if (!changed) return
    const wasSuspended = container.style.scrollSnapType === 'none'
    if (!wasSuspended) suspendSnap()
    ordered.forEach((slide, i) => owned.style(slide.el, 'order', String(i)))
    // A boundary rotation needs one layout read; ordinary frames never reorder.
    setPos(slideStart(anchor.el) - before)
    if (!wasSuspended) resumeSnap()
  }
  const panLoop = (amount: number) => {
    if (Math.abs(amount) >= loopPeriod) amount %= loopPeriod
    // Consume overshoot before the finite native rail can discard it.
    for (let i = 0; i <= container.children.length && Math.abs(amount) > 0.01; i++) {
      fixLoop(undefined, pos() + amount)
      const before = pos()
      const distance = Math.max(-before, Math.min(amount, range() - before))
      if (Math.abs(distance) < 0.01) break
      setPos(before + distance)
      amount -= distance
      fixLoop()
    }
  }

  // measure() hands in the scroll metrics it already snapshotted during
  // its read phase, so the onScroll call at the end of a measure pass never
  // triggers a fresh scrollLeft/scrollWidth read after the writes earlier in
  // that same pass. Called with no argument (the public `state()`, any time
  // outside a measure pass) it reads fresh, same as before.
  let lastState = { ...noopState }
  const scrollState = () => {
    const length = range(), current = pos()
    const movable = container.children.length > 1 && length > 0.5
    return {
      // Native elastic overscroll must not send chained sliders outside 0..1.
      progress: length > 0 ? Math.max(0, Math.min(current / length, 1)) : 0,
      canPrev: movable && (!!loop || !!rewind || current > 0.5),
      canNext: movable && (!!loop || !!rewind || current < length - 0.5),
    }
  }
  const readState = (scroll = scrollState()): SliderState => ({
    active: Math.max(active, 0),
    count: container.children.length,
    position,
    dragging,
    gliding: anim !== 0,
    ...scroll,
  })
  const state = (): SliderState => {
    life.guard(() => { lastState = readState() })()
    return destroyed || life.stopped ? { ...lastState, dragging: false, gliding: false, canPrev: false, canNext: false } : lastState
  }

  const measure = life.guard(() => {
    raf = 0
    if (loop && !anim) fixLoop()
    const center = pos() + viewport() / 2
    const anchor = pos() + snapAnchor()
    let best = 0
    let bestDist = Infinity
    const list = slides()
    // READ phase for every slide, then WRITE phase: no per-slide read/write interleaving
    const sizes = list.map((slide) => Math.max(slideSize(slide), 1))
    const centers = list.map((slide, i) => slideStart(slide) + sizes[i] / 2)
    const anchors = fraction === 0.5 ? centers : centers.map((center, i) => center + sizes[i] * (fraction - 0.5))
    // Snapshot scroll metrics before the style writes; callbacks reuse them.
    const scroll = scrollState()
    const p = scroll.progress
    list.forEach((slide, i) => {
      // --sd stays normalized by the slide's OWN size (that is what the CSS
      // reads), but the active slide is the nearest in PIXELS: comparing the
      // normalized values made a wide slide look nearer than a narrow one
      // beside it, so with a 100px and a 300px slide the active flipped at
      // centre 101 instead of their midpoint, 150.
      if (cssVars) {
        const sd = (centers[i] - center) / sizes[i]
        owned.style(slide, '--sd', sd.toFixed(4))
      }
      // an exact tie keeps the first slide, as before
      const dist = Math.abs(anchors[i] - anchor)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    // Interpolate between alignment anchors; --sd stays center-based for effects.
    position = 0
    if (centers.length > 1) {
      if (looping) {
        const ordered = anchors.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
        let seg = 0
        while (seg + 2 < ordered.length && ordered[seg + 1].value <= anchor) seg++
        const span = ordered[seg + 1].value - ordered[seg].value
        const raw = span > 0 ? ordered[seg].index + (anchor - ordered[seg].value) / span : ordered[seg].index
        position = ((raw % list.length) + list.length) % list.length
      } else {
        let seg = 0
        while (seg + 2 < anchors.length && anchors[seg + 1] <= anchor) seg++
        const span = anchors[seg + 1] - anchors[seg]
        const raw = span > 0 ? seg + (anchor - anchors[seg]) / span : seg
        position = Math.min(Math.max(raw, 0), centers.length - 1)
      }
    }
    if (cssVars) owned.style(container, '--sv-progress', p.toFixed(4))
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
      owned.class(container, 'sv-slider', true)
      owned.class(container, 'sv-slider-y', !horizontal)
      owned.class(container, 'sv-draggable', !!drag)
    }
    list.forEach((slide, i) => {
      const wanted = i === best
      if (slide.classList.contains?.('sv-active') !== wanted)
        owned.class(slide, 'sv-active', wanted)
    })
    const bestEl = list[best] ?? null
    // an empty rail has no slide 0: `best` stays at its 0 default with
    // nothing behind it, and firing onSlide(0) here claims that phantom
    // index as active, so the real first slide never gets its own
    // onSlide(0) once slides arrive. Keep `active` at -1 instead.
    if (list.length > 0 && (best !== active || bestEl !== activeEl)) {
      const indexChanged = best !== active
      active = best
      activeEl = bestEl
      if (cssVars) owned.style(container, '--sv-slide', String(best))
      if (indexChanged) onSlide?.(best)
    } else if (list.length === 0 && (active !== -1 || activeEl !== null)) {
      // populated to empty (every slide removed): a stale `active` from
      // before the removal must not survive it, or repopulating at the same
      // index fires no onSlide, and `state()` reports a phantom active
      // index against a detached node with count 0 (ADU-354 item 5).
      active = -1
      activeEl = null
      if (cssVars) owned.style(container, '--sv-slide', '')
    }
    if (!life.stopped) { lastState = readState(scroll); onScroll?.(lastState) }
  })

  const schedule = life.guard(() => {
    if (!raf && !life.stopped) raf = requestAnimationFrame(measure)
  })

  // Geometry changes can invalidate an in-flight destination. Reuse goTo's
  // fresh bounds only on observer delivery, not on every animation frame.
  const onLayout = life.guard(() => {
    readInsets()
    if (anim) goTo(target)
    schedule()
  })
  let ro: ResizeObserver | undefined
  let mo: MutationObserver | undefined
  let watchedSlides = new Set<HTMLElement>()
  const watchSlides = () => {
    const current = new Set(slides())
    watchedSlides.forEach(slide => { if (!current.has(slide)) owned.restore(slide) })
    watchedSlides = current
    ro?.disconnect()
    ro?.observe(container, { box: 'border-box' })
    current.forEach((slide) => ro?.observe(slide))
  }
  life.defer(() => watchedSlides.clear())

  // pending glide destination: rapid next/prev clicks accumulate from here,
  // not from `active` (which lags mid-glide and would swallow the clicks)
  let target = -1
  const stopGlide = () => {
    if (anim) {
      cancelAnimationFrame(anim)
      anim = 0
      // Rounded/clamped final positions may emit no scroll event. Deliver
      // the stopped state once; schedule() coalesces a pending measurement.
      schedule()
    }
    owned.class(container, 'sv-gliding', false)
  }
  // A preference that flips to reduce mid-glide settles the glide where it
  // was going, now: checking only when a glide starts left one in flight.
  // `target` is the slide INDEX the glide is heading for, so the settle goes
  // through goTo(index, false), which recomputes the pixel destination; the
  // first version wrote the index as scrollLeft (review, ADU-243).
  const motionChanged = life.guard((reduced: boolean) => {
    if (!reduced || target < 0 || destroyed) return
    goTo(target, false)
  })
  const setDestination = (to: number, index: number) => {
    setPos(looping ? Math.max(0, Math.min(to, range())) : to)
    if (!looping || index < 0) return
    fixLoop(index)
    const slide = slides()[index]
    if (slide) setPos(Math.max(0, Math.min(destination(slideStart(slide), slideSize(slide)), range())))
  }
  const glide = (to: number) => {
    stopGlide()
    let current = pos()
    if (duration <= 0 || effectiveReduce() || Math.abs(to - current) < 1) {
      resumeSnap()
      setDestination(to, target)
      target = -1
      return
    }
    suspendSnap() // native snap must not tug while we animate
    owned.class(container, 'sv-gliding', true)
    // exponential lerp, not a fixed tween: velocity is proportional to the
    // remaining distance, so short release settles feel as soft as long
    // button glides, and retargets (rapid clicks) stay continuous.
    // `duration` calibrates the settle time (~99.8% covered by then).
    let last = performance.now()
    const step = life.guard((now: number) => {
      if (looping) {
        const before = pos()
        fixLoop(target)
        const shift = pos() - before
        current += shift
        to += shift
      }
      const dt = Math.min(now - last, 50)
      last = now
      const factor = 1 - Math.pow(0.002, dt / duration)
      current += (to - current) * factor
      if (Math.abs(to - current) < 0.5) {
        setPos(to)
        stopGlide()
        target = -1
        resumeSnap() // the destination matches the native snap alignment
      } else {
        setPos(current)
        anim = requestAnimationFrame(step)
      }
    })
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
  const goTo = life.guard((index: number, smooth = true) => {
    if (destroyed) return
    clearWheel() // this call owns the position now, not the pending settle
    if (loop) { stopGlide(); fixLoop(index) }
    const all = slides()
    const clamped = Math.max(0, Math.min(index, all.length - 1))
    const slide = all[clamped]
    if (!slide) {
      stopGlide()
      resumeSnap()
      target = -1
      return
    }
    // Edge slides may not center within the scroll range. Chasing an
    // unreachable target wastes frames after native scrolling has stopped.
    const aligned = destination(slideStart(slide), slideSize(slide))
    const to = looping ? aligned : Math.max(0, Math.min(aligned, range()))
    if (smooth) {
      target = clamped
      glide(to)
    } else {
      stopGlide()
      resumeSnap() // a previous seek()/glide may have suspended it
      target = -1
      setDestination(to, clamped)
    }
  })

  const seek = life.guard((progress: number) => {
    if (destroyed) return
    clearWheel()
    stopGlide()
    target = -1
    suspendSnap() // the driver owns this instance's position
    setPos(Math.max(0, Math.min(progress, 1)) * range())
  })

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

  const onMove = life.guard((event: PointerEvent) => {
    // A release outside an embedded viewport may never deliver pointerup.
    if (event.buttons === 0) { cancelDrag(); return }
    const point = horizontal ? event.clientX : event.clientY
    if (!dragging) {
      // pending press: activating only after real movement keeps a plain
      // click a plain click (see the focus restore in endDrag for the one
      // side effect of the preventDefault below)
      if (Math.abs(point - startPoint) < DRAG_THRESHOLD) return
      dragging = true
      suspendSnap()
      owned.class(container, 'sv-dragging', true) // slider.css: user-select none
      lastPointer = startPoint
    }
    const step = point - lastPointer
    if (looping) panLoop(rtl ? step : -step)
    else setPos(pos() - (rtl ? -step : step))
    lastPointer = point
  })
  // the click that follows a real drag would activate whatever link the
  // pointer happens to be over. Swallow exactly that one
  const suppressClick = life.guard((event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    window.removeEventListener('click', suppressClick, true)
  })
  let clickTimer: ReturnType<typeof setTimeout> | undefined
  const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex],[contenteditable]'
  let pressedTarget: HTMLElement | null = null
  const endDrag = life.guard(() => {
    if (!pressed) return
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', cancelDrag)
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
    owned.class(container, 'sv-dragging', false)
    window.addEventListener('click', suppressClick, true)
    clickTimer = setTimeout(life.guard(() => window.removeEventListener('click', suppressClick, true)), 0)
    if (snap === 'proximity' || snapIsNone) {
      resumeSnap()
      return
    }
    // A final pointermove and pointerup can precede the scroll measurement.
    // Resolve the destination from today's geometry, not the last frame.
    const anchor = pos() + snapAnchor()
    const list = slides()
    let nearest = 0
    let distance = Infinity
    list.forEach((slide, i) => {
      const d = Math.abs(slideStart(slide) + slideSize(slide) * fraction - anchor)
      if (d < distance) { distance = d; nearest = i }
    })
    goTo(nearest)
  })
  const cancelDrag = life.guard(() => {
    if (!pressed) return
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', cancelDrag)
    pressed = dragging = false
    pressedTarget = null
    owned.class(container, 'sv-dragging', false)
    resumeSnap()
    schedule()
  })
  // native image/link drag-and-drop would hijack the gesture mid-press
  const onDragStart = life.guard((event: Event) => {
    if (pressed) event.preventDefault()
  })
  const onDown = life.guard((event: PointerEvent) => {
    const owner = (event.target as Element | null)?.closest?.('.sv-slider')
    if (owner && owner !== container) return
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
    window.addEventListener('pointercancel', cancelDrag)
  })

  // trackpad/wheel pan: native mandatory snap settles fast and can't be
  // slowed, so replace it. Suspend snap while wheeling, then glide to the
  // nearest slide when the (momentum) wheel stream goes quiet. Skipped on
  // instances authored with snap none (scroll-driven ones own their position).
  const onWheel = life.guard((event: WheelEvent) => {
    const owner = (event.target as Element | null)?.closest?.('.sv-slider')
    if (owner && owner !== container) return
    if (snapIsNone || (!looping && snap === 'proximity') || event.ctrlKey) return
    // only react when the gesture's dominant axis is OUR axis. Otherwise
    // this is the page scrolling past the carousel (trackpad gestures are
    // always slightly diagonal) and assisting would yank the slider around
    const along = horizontal ? event.deltaX : event.deltaY
    const cross = horizontal ? event.deltaY : event.deltaX
    if (Math.abs(along) <= Math.abs(cross)) return
    stopGlide()
    target = -1
    suspendSnap()
    if (looping) {
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport() : 1
      panLoop(along * unit * (rtl ? -1 : 1))
      if (snap === 'proximity') { resumeSnap(); return }
    }
    clearWheel()
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined
      goTo(active)
    }, 200)
  })

  const step = life.guard((direction: number, smooth: boolean) => {
    if (destroyed) return
    const base = stepBase()
    let index = base + direction
    if (looping) {
      const count = container.children.length
      index = ((index % count) + count) % count
    } else if (rewind || loop) {
      const last = container.children.length - 1
      // With several slides visible, the rail ends before the last slide centers.
      const edge = anim && target >= 0
        ? direction > 0 ? base >= last : base <= 0
        : direction > 0 ? pos() >= range() - 0.5 : pos() <= 0.5
      if (edge) index = direction > 0 ? 0 : last
    }
    goTo(index, smooth)
  })
  const next = (smooth = true) => step(1, smooth)
  const prev = (smooth = true) => step(-1, smooth)

  // keyboard: native key-scrolling steps in ~40px jumps and the snap settles
  // hard after each. Replace it with the same soft glide as everything else.
  // The container is made focusable (Safari never focuses scrollers on its own).
  const onKey = life.guard((event: KeyboardEvent) => {
    if (event.target !== container) return // arrows inside inputs stay theirs
    const nextKey = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const prevKey = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    if (event.key === nextKey) next()
    else if (event.key === prevKey) prev()
    else if (event.key === 'Home') goTo(0)
    else if (event.key === 'End') goTo(container.children.length - 1)
    else return
    event.preventDefault()
  })

  // Register each release before its acquisition, including APIs that throw
  // after adding a listener or observing a node.
  const listen = (node: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions) => {
    life.defer(() => node.removeEventListener(type, fn, options))
    node.addEventListener(type, fn, options)
  }
  life.defer(() => { if (raf) cancelAnimationFrame(raf); raf = 0 })
  life.defer(() => { if (anim) cancelAnimationFrame(anim); anim = 0 })
  life.defer(clearWheel)
  life.defer(() => { if (clickTimer !== undefined) clearTimeout(clickTimer) })
  life.defer(() => ro?.disconnect())
  life.defer(() => mo?.disconnect())
  life.defer(() => window.removeEventListener('click', suppressClick, true))
  life.defer(() => window.removeEventListener('pointermove', onMove))
  life.defer(() => window.removeEventListener('pointerup', endDrag))
  life.defer(() => window.removeEventListener('pointercancel', cancelDrag))
  life.setup(() => {
    owned.class(container, 'sv-slider', true)
    owned.class(container, 'sv-slider-y', !horizontal)
    owned.class(container, 'sv-draggable', !!drag)
    if (loop) owned.style(container, 'overflow-anchor', 'none')
    // Now that `.sv-slider` is in place: an inline/stylesheet/utility none
    // already latched snapIsNone above and needs no second opinion.
    if (!snapIsNone && typeof getComputedStyle === 'function') {
      snapIsNone = getComputedStyle(container).scrollSnapType === 'none'
    }
    owned.style(container, '--sv-snap', snap)
    owned.style(container, '--sv-align', alignment)
    readInsets()
    // .tabIndex reads -1 for an authored tabindex="-1" AND for no attribute
    // at all: only the attribute itself tells an author's own -1 (a
    // follower rail deliberately kept out of the tab order) from unauthored.
    if (!container.hasAttribute?.('tabindex') && container.tabIndex === -1) owned.attr(container, 'tabindex', '0')
    listen(container, 'scroll', schedule, { passive: true })
    if (typeof ResizeObserver === 'function') ro = new ResizeObserver(onLayout)
    watchSlides()
    if (typeof MutationObserver === 'function') {
      mo = new MutationObserver(life.guard(() => { watchSlides(); onLayout() }))
      mo.observe(container, { childList: true })
    }
    life.defer(onMotionChange(motionChanged))
    listen(container, 'dragstart', onDragStart)
    listen(container, 'pointerdown', onDown as EventListener)
    listen(window, 'blur', cancelDrag)
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function')
      listen(document, 'visibilitychange', life.guard(() => { if (document.visibilityState === 'hidden') cancelDrag() }))
    listen(container, 'wheel', onWheel as EventListener, { passive: !loop })
    listen(container, 'keydown', onKey as EventListener)
    measure()
  })

  return {
    next,
    prev,
    goTo,
    seek,
    active: () => Math.max(active, 0),
    state,
    destroy: life.stop,
  }
}
