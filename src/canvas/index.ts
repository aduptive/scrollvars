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
 * width/height attribute values, read as CSS pixels: that is the whole
 * feedback loop this harness has to stop. applySize() writes
 * `canvas.width = W` / `canvas.height = H` (the backing store) after
 * measuring the CSS size, and on an unsized canvas that write IS the new
 * layout size, so the very next resize would otherwise measure exactly
 * what this write produced and multiply the backing store by the device
 * pixel ratio again, unbounded.
 *
 * (eighth pass, final design change) Seven earlier passes (CHANGELOG.md's
 * Canvas section has the history) all tried to catch that loop by
 * MEASURING: an equality guard, a content-box-vs-border-box comparison, a
 * padding subtraction, a ratio with a tolerance, an "echo window" matching
 * a later ResizeObserver entry's `contentRect` against the exact W/H just
 * written. Every one of those is a comparison of two numbers, or a number
 * against a deadline, and a real, ordinary CSS resize can coincidentally
 * produce the very same number the harness itself would have written, at
 * any time: a 300x150 canvas at dpr 2, doubled to 600x300 by a class
 * applied a frame after mount, lands exactly on the 600x300 the harness
 * wrote to that same canvas's backing store one frame earlier. No amount
 * of tightening the value comparison or the timing window tells that
 * coincidence apart from the harness's own echo, because a comparison
 * never asks WHY the numbers match, only THAT they do.
 *
 * applySize() now asks the browser directly instead of guessing from a
 * coincidence: a causal probe. Right after writing the backing store
 * (`canvas.width = W`, `canvas.height = H`), it bumps the attributes up by
 * one (`canvas.width = W + 1`, `canvas.height = H + 1`) and forces a layout
 * read (`canvas.clientWidth`, `canvas.clientHeight`), then sets them back
 * to `W`/`H` and reads again. If an axis has no CSS size of its own, its
 * layout size IS the attribute value, so the two readings on that axis
 * differ by exactly 1; if the axis has a real CSS size, changing the
 * attribute never touches layout, so the two readings are identical, a
 * difference of exactly 0. `clientWidth`/`clientHeight` include padding,
 * exclude border, and are never affected by a CSS `transform` (a transform
 * is applied after layout), so the probe is unaffected by border, padding
 * (whole or fractional), a transform on the canvas itself, or which way
 * the device pixel ratio moved the backing store: above 1, below 1, or
 * exactly 1, where the write happens to equal the CSS size numerically but
 * the causal relationship (layout tracking the attribute) is unchanged, so
 * an unsized canvas still gets pinned there too, consistent with the
 * documented limitation below. The attribute values this harness ever
 * writes are whole device pixels, so the difference between the two
 * readings is always exactly 1 or exactly 0, never a fraction that would
 * need a tolerance.
 *
 * This is causal, not a measurement comparison, because the perturbation
 * IS the harness's own known cause: bump the attribute, exactly here,
 * exactly now, and read the one response that can only follow from THAT
 * write, not from anything else happening on the page. There is no value
 * to coincide with and no window to land inside, so a genuine resize
 * landing on any size at any time, including the exact size the harness
 * itself just wrote, produces no response to the probe's own perturbation
 * and is never mistaken for one.
 *
 * A canvas can have a CSS size on one axis and none on the other (a
 * replaced element with only, say, a CSS `height` computes its `width`
 * from its own intrinsic width/height ratio, i.e. its attribute values):
 * either axis following the attribute is reason enough to pin both
 * `canvas.style.width` and `height` together, forcing
 * `box-sizing: content-box`, to the CSS content size measured right before
 * the write (pinning the axis that already had a CSS size to the value it
 * already measured is a no-op for that axis, and stops the other one from
 * drifting on its own). Otherwise applySize() does nothing further: the
 * canvas already has full control of its own size. The context transform
 * (`ctx.setTransform`, the 2D context's DPR scale) is applied AFTER the
 * probe runs, so a pin never leaves a stale scale behind. The probe itself
 * runs only inside applySize() (a ResizeObserver callback or a DPR
 * change), never once per animation frame: its cost is two forced layouts
 * per resize event, not per frame (browsers only recompute layout once per
 * dirty/read cycle, so reading `clientWidth` and `clientHeight` together,
 * twice, costs exactly that and no more). Setting the attribute
 * momentarily to `W + 1` and back also clears the bitmap, same as any
 * width/height write; the frame callback repaints on every resize
 * regardless, so this is free.
 *
 * A pinned canvas's own pin write changes its layout box, so it fires one
 * more ResizeObserver entry; that entry takes the normal path above (its
 * own probe now finds neither axis following the attribute, since the
 * canvas has a CSS size now, so it does not pin again). An unpinned
 * canvas's box never moves as a result of the harness's own write, so it
 * produces no such entry either way: no state to track, no window to miss,
 * no loop either way. Documented limitation, unchanged since the very
 * first pass: a canvas with no CSS size on either axis still gets one
 * pinned inline by the harness; give it real CSS dimensions to keep
 * control of its own size.
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
  // integer), covers onDprChange() before its first ResizeObserver entry
  // has ever arrived (afterwards it reuses that entry's remembered size,
  // see `lastContent` below, instead of this fallback, which would
  // otherwise include a CSS `transform: scale()` the entry never sees).
  // That fallback is close but not bit-exact for fractional values:
  // computed border and padding can report the AUTHORED px value, not the
  // sub-pixel value layout actually snapped to, so subtracting it from the
  // border-box rect can land a thousandth of a pixel off the true content
  // box (verified in Chrome: an unsized canvas with `padding: 0.3px`
  // measures its contentRect at exactly 300, but rect.width minus computed
  // padding lands on 299.99375). That residual only matters here: the
  // causal probe below reads `clientWidth`/`clientHeight` directly, which
  // always round to a whole pixel, so it never sees this fallback at all.
  // The subtraction can also go negative, a display:none canvas (rect all
  // zero) with real padding:
  // clamp to 0 so it reads as "not laid out yet", same as a canvas with no
  // rect at all, instead of a negative size that would round through dpr
  // into a negative backing-store write.
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

    writeBackingStore(size)

    // The causal probe (eighth pass, final design; see the module doc for
    // the full reasoning): bump the just-written attribute up by one on
    // each axis and force a layout read, then put it back and read again.
    // An axis with no CSS size of its own has its layout size driven
    // directly by the attribute, so the two readings differ by exactly 1;
    // an axis with a real CSS size never responds to the attribute at
    // all, so they are identical, a difference of exactly 0. Reading both
    // axes together in each pass (not one axis fully, then the other)
    // costs exactly two forced layouts total, not four: nothing redirties
    // layout between the two reads of the same pass.
    const w = canvas.width
    const h = canvas.height
    canvas.width = w + 1
    canvas.height = h + 1
    const afterBumpW = canvas.clientWidth
    const afterBumpH = canvas.clientHeight
    canvas.width = w
    canvas.height = h
    const afterResetW = canvas.clientWidth
    const afterResetH = canvas.clientHeight
    const widthFollows = afterBumpW - afterResetW === 1
    const heightFollows = afterBumpH - afterResetH === 1

    if (widthFollows || heightFollows) {
      // Either axis following is reason enough to pin both together
      // (a canvas can have a CSS size on only one axis, the other driven
      // by the intrinsic width/height ratio): force content-box sizing so
      // a border-box canvas doesn't reinterpret the pinned width as a
      // smaller content box.
      canvas.style.boxSizing = 'content-box'
      canvas.style.width = `${size.width}px`
      canvas.style.height = `${size.height}px`
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
