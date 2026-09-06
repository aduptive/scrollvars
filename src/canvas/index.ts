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
 * applySize() detects that by re-measuring the canvas's layout size right
 * after writing the backing store: a CSS-sized canvas never moves as a
 * result, whatever its attribute values, borders or padding, but an
 * unsized one does, because layout follows what was just written. Only
 * then does it pin the CSS-pixel size it measured BEFORE the write to
 * `canvas.style.width`/`height`, once, so layout stops following the
 * backing store. That measured size is the content box, border AND
 * padding excluded: read straight from the ResizeObserver entry's own
 * `contentRect` when applySize() runs as its callback (bit-exact, no
 * arithmetic), or, when it does not (a direct DPR-change call, or the
 * synchronous re-measure right after writing the backing store), from
 * `getBoundingClientRect()` minus computed border and padding, never
 * `clientWidth`/`clientHeight` (integer-rounded, off by a whole pixel or
 * more). That fallback is close but not bit-exact for fractional values
 * (computed border/padding can report the authored px value, not the
 * sub-pixel value layout actually used), which would cost an extra
 * applySize() pass if it were what got pinned instead of only feeding the
 * boolean loop check. The pin also forces
 * `box-sizing: content-box` inline, so the width/height it writes
 * reproduce that same content box regardless of the canvas's own
 * `box-sizing` (a `border-box` canvas would otherwise need padding and
 * border added back to the content size instead). A canvas with no CSS
 * size still ends up with one pinned inline by the harness: give it real
 * CSS dimensions to keep control of its own size.
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
  // integer), covers the one caller with no entry (onDprChange()) and the
  // synchronous re-measure inside applySize() right after writing the
  // backing store (no fresh entry exists yet there either). That fallback
  // is close but not bit-exact for fractional values: computed border and
  // padding can report the AUTHORED px value, not the sub-pixel value
  // layout actually snapped to, so subtracting it from the border-box
  // rect can land a thousandth of a pixel off the true content box
  // (verified in Chrome: an unsized canvas with `padding: 0.3px` measures
  // its contentRect at exactly 300, but rect.width minus computed padding
  // lands on 299.99375). That residual is harmless where it is only used,
  // the boolean loop check, but would cost an extra applySize() pass if it
  // were what got pinned.
  const measureLayout = (entry?: ResizeObserverEntry) => {
    if (entry) return { width: entry.contentRect.width, height: entry.contentRect.height }
    const rect = canvas.getBoundingClientRect()
    const style = window.getComputedStyle(canvas)
    const borderX = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
    const borderY = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    return {
      width: rect.width - borderX - paddingX,
      height: rect.height - borderY - paddingY,
    }
  }

  const writeBackingStore = (size: { width: number; height: number }) => {
    canvas.width = Math.round(size.width * fx.dpr)
    canvas.height = Math.round(size.height * fx.dpr)
  }

  const applySize = (entries?: ResizeObserverEntry[]) => {
    const before = measureLayout(entries?.[0])
    if (!before.width || !before.height) return
    fx.dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    writeBackingStore(before)

    // Detect the feedback loop directly instead of guessing from equality:
    // a CSS-sized canvas never changes layout as a consequence of its own
    // backing store changing, whatever its attribute values, borders or
    // padding. An unsized canvas lays out at its own backing-store size, so
    // the write above just moved layout again. This second read is
    // synchronous (forces layout), but applySize() only runs once per
    // resize/DPR-change event, never per animation frame, so it is rare.
    const after = measureLayout()
    if (after.width !== before.width || after.height !== before.height) {
      // Force content-box sizing on the pin: `before` is always the pure
      // content box (padding already subtracted above), so the pinned
      // width/height must be interpreted as content-box too, whatever the
      // canvas's own box-sizing says, or a border-box canvas would pin a
      // content box smaller than the one just measured.
      canvas.style.boxSizing = 'content-box'
      canvas.style.width = `${before.width}px`
      canvas.style.height = `${before.height}px`
      writeBackingStore(before) // re-run sizing from the pinned, pre-write size
    }

    fx.width = before.width
    fx.height = before.height
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
