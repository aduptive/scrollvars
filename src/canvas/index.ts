/**
 * Canvas effect harness: the lifecycle chassis every ambient canvas effect
 * repeats: mount, resize, DPR cap, delta-time rAF loop, pause when offscreen
 * or the tab is hidden, reduced-motion flag, full cleanup.
 *
 * The simulation itself stays yours: `setup` builds state, `frame` advances
 * one step. The harness never touches what you draw. Feed it scroll/pointer
 * values from the driver (`--sv-t`, `--mx`…) via your own closure. The two
 * modules stay decoupled.
 *
 * Drawing space is CSS pixels: the context is pre-scaled by DPR, so
 * `fx.width`/`fx.height` match the element's layout size.
 *
 * Give the canvas CSS dimensions. A canvas with none lays out at its own
 * backing-store size, so resizing it feeds back into itself above DPR 1.
 * applySize() detects that by measuring the canvas's own layout size, the
 * fallback method below, once right before and once right after writing
 * the backing store, then comparing the two by RATIO, not an absolute
 * delta: a CSS-sized canvas never moves as a result of its own
 * backing-store write, whatever its attribute values, borders, padding or
 * transform, so the two readings sit within a sub-pixel-noise factor of
 * each other (at most `1 + 0.02 / size`, the rounding residual noted
 * below, never a real move). An unsized one does move, by a factor of the
 * device pixel ratio (`size * (dpr - 1)` CSS pixels), which for a small
 * canvas at a DPR just over 1 is itself only a pixel or two: a 4x4 canvas
 * at dpr 1.25, or a 20x20 at dpr 1.05, both move by exactly 1px on the
 * very first tick, which a flat absolute tolerance either misses outright
 * or only catches after dozens of ticks accumulate past it. A ratio has no
 * such floor: `after / before >= 1 + (dpr - 1) / 2`, the midpoint between
 * "no move" (ratio 1) and "a full DPR move" (ratio dpr), checked on either
 * axis and only when `dpr > 1` (at dpr 1 there is no feedback to detect),
 * scales with both size and DPR and needs no absolute threshold. Both
 * readings deliberately use the SAME method: comparing a bit-exact
 * ResizeObserver contentRect against the fallback's sub-pixel residual
 * instead would read a CSS-sized canvas with fractional padding, or one
 * under a CSS `transform: scale()` (which inflates what
 * getBoundingClientRect() reports without moving layout), as having moved
 * when it never did, pinning it on first mount and then making it ignore
 * every later CSS resize. Only when the two readings disagree by that
 * ratio does applySize() pin the CSS-pixel size it measured BEFORE the
 * write (read straight from the ResizeObserver entry's own `contentRect`
 * when applySize() runs as its callback, bit-exact, no arithmetic, or
 * otherwise from that same fallback) to `canvas.style.width`/`height`,
 * once, so layout stops following the backing store. The pin also forces
 * `box-sizing: content-box` inline, so the width/height it writes
 * reproduce that same content box regardless of the canvas's own
 * `box-sizing` (a `border-box` canvas would otherwise need padding and
 * border added back to the content size instead). A canvas with no CSS
 * size still ends up with one pinned inline by the harness: give it real
 * CSS dimensions to keep control of its own size.
 *
 * onDprChange() (a fixed-CSS-size canvas moving to a monitor with a
 * different DPR, no ResizeObserver callback involved) has no entry to
 * measure from. Falling back to the same getBoundingClientRect() read
 * applySize() uses internally would include the canvas's own
 * `transform: scale()`: a CSS-sized canvas under a transform got its
 * content size inflated or deflated by that transform on every real DPR
 * change, and never self-corrected. The harness instead remembers the last
 * content size a ResizeObserver entry actually reported (`lastContent`,
 * bit-exact, a transform never touches it) and reuses that on the
 * DPR-change path; only before the first entry has ever arrived does it
 * fall back to the rect read, same as before.
 */

export interface EffectFrame {
  /** The 2D context. Or null when `context: null` (WebGL/Three effects own
   * their renderer and read `canvas` instead). */
  ctx: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement
  /** Canvas size in CSS pixels (already DPR-scaled on the 2D context). */
  width: number
  height: number
  dpr: number
  /** Live `prefers-reduced-motion` state: damp or freeze your motion. */
  reducedMotion: boolean
}

export interface EffectOptions {
  /** Runs once, after the first layout size is known. Build your state here;
   * return a function to dispose it (GPU buffers, renderers) on destroy. */
  setup?: (fx: EffectFrame) => void | (() => void)
  /** One simulation step. `dt` is seconds since last frame, clamped to 50ms. */
  frame: (fx: EffectFrame, dt: number) => void
  /** Called after a resize (fx fields already updated). */
  resize?: (fx: EffectFrame) => void
  /** Max device-pixel-ratio (default 2. Beyond that it's just heat). */
  dprCap?: number
  /** `'2d'` (default) grabs and DPR-scales a 2D context. `null` grabs
   * nothing: for WebGL/Three: create your own renderer on `fx.canvas`
   * (the harness still sizes the backing store and runs the lifecycle). */
  context?: '2d' | null
  /** Pause automatically when offscreen / tab hidden (default true). */
  autoPause?: boolean
}

export interface EffectHandle {
  pause: () => void
  resume: () => void
  destroy: () => void
}

const noop: EffectHandle = { pause: () => {}, resume: () => {}, destroy: () => {} }

export function mountEffect(
  canvas: HTMLCanvasElement,
  { setup, frame, resize, dprCap = 2, autoPause = true, context = '2d' }: EffectOptions
): EffectHandle {
  if (typeof window === 'undefined') return noop

  const ctx = context === '2d' ? canvas.getContext('2d') : null
  if (context === '2d' && !ctx) return noop

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const fx: EffectFrame = {
    ctx,
    canvas,
    width: 0,
    height: 0,
    dpr: 1,
    reducedMotion: motionQuery.matches,
  }

  let raf = 0
  let last = 0
  let ready = false
  let cleanup: (() => void) | undefined
  let destroyed = false
  // the loop runs only when every gate is open
  let userPaused = false
  let onscreen = true
  let visible = document.visibilityState !== 'hidden'

  const running = () => raf !== 0

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    frame(fx, dt)
  }

  const sync = () => {
    const shouldRun =
      !destroyed && ready && !userPaused && (!autoPause || (onscreen && visible))
    if (shouldRun && !running()) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    } else if (!shouldRun && running()) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  // Layout size in CSS pixels: content box, border and padding excluded.
  // A ResizeObserverEntry's own contentRect IS that content box, straight
  // from the layout engine, no subtraction needed: use it when one is on
  // hand (applySize() runs as the ResizeObserver callback below, so it
  // usually is). The fallback, getBoundingClientRect() minus computed
  // border and padding (never clientWidth/Height, which round to an
  // integer), covers the two calls applySize() makes around the
  // backing-store write to check for the feedback loop, and onDprChange()
  // before its first ResizeObserver entry has ever arrived (afterwards it
  // reuses that entry's remembered size, see `lastContent` below, instead
  // of this fallback, which would otherwise include a CSS
  // `transform: scale()` the entry never sees). That fallback is close but
  // not bit-exact for fractional values: computed border and padding can
  // report the AUTHORED px value, not the sub-pixel value layout actually
  // snapped to, so subtracting it from the border-box rect can land a
  // thousandth of a pixel off the true content box (verified in Chrome: an
  // unsized canvas with `padding: 0.3px` measures its contentRect at
  // exactly 300, but rect.width minus computed padding lands on
  // 299.99375). That residual is harmless: applySize()'s feedback check
  // compares two fallback reads against each other by ratio, and a
  // rounding residual that small never approaches the ratio a real
  // feedback loop produces. The subtraction can also go negative, a
  // display:none canvas (rect all zero) with real padding: clamp to 0 so
  // it reads as "not laid out yet", same as a canvas with no rect at all,
  // instead of a negative size that would round through dpr into a
  // negative backing-store write.
  const measureLayout = (entry?: ResizeObserverEntry) => {
    if (entry) return { width: entry.contentRect.width, height: entry.contentRect.height }
    const rect = canvas.getBoundingClientRect()
    const style = window.getComputedStyle(canvas)
    const borderX = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
    const borderY = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    return {
      width: Math.max(0, rect.width - borderX - paddingX),
      height: Math.max(0, rect.height - borderY - paddingY),
    }
  }

  const writeBackingStore = (size: { width: number; height: number }) => {
    canvas.width = Math.round(size.width * fx.dpr)
    canvas.height = Math.round(size.height * fx.dpr)
  }

  // The last content size a real ResizeObserver entry reported, bit-exact
  // and never touched by a CSS transform. onDprChange() reads this instead
  // of re-deriving the size from getBoundingClientRect() (see the module
  // doc and measureLayout() above): set only when applySize() runs with an
  // actual entry, so it stays undefined until the first one arrives.
  let lastContent: { width: number; height: number } | undefined

  const applySize = (entries?: ResizeObserverEntry[]) => {
    const entry = entries?.[0]
    const size = entry ? measureLayout(entry) : (lastContent ?? measureLayout())
    if (entry) lastContent = size
    if (!size.width || !size.height) return
    fx.dpr = Math.min(window.devicePixelRatio || 1, dprCap)

    // Detect the feedback loop directly instead of guessing from equality,
    // and by RATIO rather than an absolute delta, with two readings taken
    // the SAME way so a canvas that never moved cannot look like it did. A
    // CSS-sized canvas never changes layout as a consequence of its own
    // backing store changing, whatever its attribute values, borders,
    // padding or transform: the fallback read right before the write and
    // the one right after sit within a sub-pixel-noise factor of each
    // other, at most `1 + 0.02 / size` (the residual noted in
    // measureLayout()), never the whole-DPR-factor jump a real feedback
    // loop produces. An unsized canvas lays out at its own backing-store
    // size, so the write moves it `size * (dpr - 1)` CSS pixels, a factor
    // of `dpr` on the axis that moved: for a small canvas at a DPR just
    // over 1 that is only a pixel or two (a 4x4 canvas at dpr 1.25, or a
    // 20x20 at dpr 1.05, both move by exactly 1px on the very first tick),
    // which a flat absolute tolerance either misses outright or only
    // catches after dozens of ticks accumulate past it. A ratio has no
    // such floor: `after / before >= 1 + (dpr - 1) / 2`, the midpoint
    // between "no move" (ratio 1) and "a full DPR move" (ratio dpr), scales
    // with both size and DPR and needs no absolute threshold. Guarded by
    // `dpr > 1`: at dpr 1 there is no feedback to detect (a canvas cannot
    // move by a factor of 1), so the check cannot false-positive there
    // either. Comparing `size` (bit-exact off the ResizeObserver entry when
    // one is on hand) against a fallback read instead would fail this the
    // other way: a CSS-sized canvas with fractional padding, or one under a
    // CSS transform: scale() that inflates getBoundingClientRect() without
    // moving layout, would disagree with the fallback for reasons that
    // have nothing to do with feedback, and get pinned on first mount for
    // it. Both reads force layout, but applySize() only runs once per
    // resize/DPR-change event, never per animation frame, so it is rare.
    const beforeWrite = measureLayout()
    writeBackingStore(size)
    const afterWrite = measureLayout()
    const feedbackRatio = 1 + (fx.dpr - 1) / 2
    const moved =
      fx.dpr > 1 &&
      ((beforeWrite.width > 0 && afterWrite.width / beforeWrite.width >= feedbackRatio) ||
        (beforeWrite.height > 0 && afterWrite.height / beforeWrite.height >= feedbackRatio))
    if (moved) {
      // Force content-box sizing on the pin: `size` is always the pure
      // content box (padding already subtracted above), so the pinned
      // width/height must be interpreted as content-box too, whatever the
      // canvas's own box-sizing says, or a border-box canvas would pin a
      // content box smaller than the one just measured.
      canvas.style.boxSizing = 'content-box'
      canvas.style.width = `${size.width}px`
      canvas.style.height = `${size.height}px`
      writeBackingStore(size) // re-run sizing from the pinned, pre-write size
    }

    fx.width = size.width
    fx.height = size.height
    ctx?.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0)
    if (!ready) {
      ready = true
      const dispose = setup?.(fx)
      if (typeof dispose === 'function') cleanup = dispose
      resize?.(fx) // sizing that lives in resize() must also run once
    } else {
      resize?.(fx)
    }
    sync()
  }

  const ro = new ResizeObserver(applySize)
  ro.observe(canvas)

  const io = new IntersectionObserver((entries) => {
    onscreen = entries[entries.length - 1].isIntersecting
    sync()
  })
  io.observe(canvas)

  const onVisibility = () => {
    visible = document.visibilityState !== 'hidden'
    sync()
  }
  document.addEventListener('visibilitychange', onVisibility)

  // A fixed-CSS-size canvas gets no ResizeObserver callback when it moves to
  // a monitor with a different devicePixelRatio. Watch the resolution too.
  let dprQuery: MediaQueryList | null = null
  const watchDpr = () => {
    dprQuery?.removeEventListener?.('change', onDprChange)
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    dprQuery.addEventListener?.('change', onDprChange)
  }
  const onDprChange = () => {
    applySize()
    watchDpr()
  }
  watchDpr()

  const onMotion = () => {
    fx.reducedMotion = motionQuery.matches
  }
  motionQuery.addEventListener?.('change', onMotion)

  return {
    pause: () => {
      userPaused = true
      sync()
    },
    resume: () => {
      userPaused = false
      sync()
    },
    destroy: () => {
      destroyed = true
      cleanup?.()
      sync()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener?.('change', onMotion)
      dprQuery?.removeEventListener?.('change', onDprChange)
    },
  }
}
