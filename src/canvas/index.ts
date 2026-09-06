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
 * (ninth pass, final design) Eight earlier passes (CHANGELOG.md's Canvas
 * section has the history) all tried to catch that loop by MEASURING: an
 * equality guard, a content-box-vs-border-box comparison, a padding
 * subtraction, a ratio with a tolerance, an "echo window" matching a later
 * ResizeObserver entry's `contentRect` against the exact W/H just written,
 * and (eighth pass) a causal probe: bump `canvas.width`/`height` up by one
 * EACH and pin both `style.width` and `style.height` together whenever
 * either axis' `clientWidth`/`clientHeight` responded. That probe was
 * causal, not a coincidence check, but it asked the wrong shape of
 * question, and verifier findings in real Chrome caught two consequences.
 * First, bumping width and height by a flat +1 each perturbs the RATIO
 * between them, not just their size: an ordinary `width: 100%; height:
 * auto` canvas has a height computed from that ratio (no CSS height at
 * all: the auto height derives from the CSS width through the canvas's own
 * intrinsic width/height ratio, i.e. its attribute values), and two
 * independent +1s can cross a rounding boundary and read the height back as
 * "changed" even though the CSS width never moved, so this ordinary,
 * fully-responsive canvas got wrongly pinned. Second, pinning both axes
 * together assumes both need it: a `max-width: 100%` canvas not yet at its
 * cap correctly reads as unsized on width for now, but pinning
 * `style.height` to that moment's value freezes the aspect ratio, so a
 * later container shrink that re-engages the cap on width leaves height
 * stuck at the old number, distorting the box instead of scaling it.
 *
 * The final design narrows the question: PROPORTIONAL, and about ONE axis.
 * Right after `applySize()` writes the backing store (`canvas.width = W`,
 * `canvas.height = H`), it sets `canvas.width = Math.floor(W / 2)` and
 * `canvas.height = Math.floor(H / 2)` together, same divisor on both axes,
 * so the RATIO between them is preserved and an axis derived from that
 * ratio does not move. It forces one layout read (`canvas.clientWidth`),
 * restores `W`/`H`, and reads `clientWidth` again. If the two readings
 * differ, the WIDTH follows the attribute (this canvas is unsized on
 * width, whatever its height does): a `max-width` cap that is not binding
 * at half size still lets width move, so a bare `max-width: 400px` with no
 * `width` at all, at a DPR that would otherwise inflate the backing store
 * past the cap, is still caught. If the two readings are equal, the width
 * is CSS-sized, whatever its literal source (a percentage, a fixed px
 * value, or itself derived from a fixed CSS height through the intrinsic
 * ratio, the mirror case): nothing about height enters that conclusion,
 * because nothing about height is asked. Halving instead of bumping by one
 * is what keeps the probe from distorting the very ratio a ratio-derived
 * axis needs held steady to read as stable; `Math.floor` keeps both
 * readings whole device pixels, so the delta a real feedback loop produces
 * is always exactly 1 or exactly 0, never a fraction that would need a
 * tolerance. The probe is skipped when `W < 2` (a backing store under two
 * device pixels): too small a move to read past rounding noise, and never
 * pinning it costs nothing worth a special case (the documented limitation
 * below already covers a canvas that never gets pinned).
 *
 * This is still causal, not a value comparison, because the perturbation
 * IS the harness's own known cause: halve the attributes, exactly here,
 * exactly now, and read the one response that can only follow from THAT
 * write, not from anything else happening on the page. There is no value
 * to coincide with and no window to land inside, so a genuine resize
 * landing on any size at any time, including the exact size the harness
 * itself just wrote, produces no response to the probe's own perturbation
 * and is never mistaken for one. `clientWidth` includes padding, excludes
 * border, and is never affected by a CSS `transform` (applied after
 * layout), so the probe is unaffected by border, padding (whole or
 * fractional), a transform on the canvas itself, or which way the device
 * pixel ratio moved the backing store: above 1, below 1, or exactly 1.
 *
 * When width follows, `applySize()` pins the WIDTH ONLY: `canvas.style.width`
 * is set to the CSS content width it measured right before the write
 * (`size.width`, in CSS pixels), forcing `box-sizing: content-box` so an
 * author's border-box declaration cannot reinterpret the pinned number as a
 * smaller content box. `style.height` is left untouched, deliberately: a
 * height the browser derives from the intrinsic ratio (no CSS height at
 * all, or the mirror case, a fixed CSS height with auto width) is exactly
 * the axis this harness's own proportional writes keep stable, so it needs
 * no pin, and staying free lets it keep tracking that ratio; a later
 * `max-width` shrink that re-engages the cap on width then correctly
 * recomputes height from the new, smaller width through that same ratio,
 * instead of fighting a frozen number. A canvas with a genuine CSS height
 * and no CSS width reads as CSS-sized on this probe too (its width is
 * ratio-derived from that fixed height, and the ratio is exactly what the
 * probe's proportional halving leaves alone): there is no loop on that
 * axis, so, correctly, nothing is pinned there either. Otherwise
 * `applySize()` does nothing further: the canvas already has full control
 * of its own size. The context transform (`ctx.setTransform`, the 2D
 * context's DPR scale) is applied AFTER the probe runs, so a pin never
 * leaves a stale scale behind. The probe itself runs only inside
 * `applySize()` (a ResizeObserver callback or a DPR change), never once per
 * animation frame: its cost is two forced layouts per resize event, not per
 * frame (browsers only recompute layout once per dirty/read cycle, so
 * reading `clientWidth` twice costs exactly that and no more). Setting the
 * attribute momentarily to half and back also clears the bitmap, same as
 * any width/height write; the frame callback repaints on every resize
 * regardless, so this is free.
 *
 * A pinned canvas's own pin write changes its layout box, so it fires one
 * more ResizeObserver entry; that entry takes the normal path above (its
 * own probe now finds the width no longer following the attribute, since
 * the canvas has a CSS width now, so it does not pin again). An unpinned
 * canvas's box never moves as a result of the harness's own write, so it
 * produces no such entry either way: no state to track, no window to miss,
 * no loop either way. Documented limitation, unchanged since the very
 * first pass: a canvas with no CSS size on either axis still gets its
 * width pinned inline by the harness (after which height, now derived from
 * that pinned width through the intrinsic ratio, behaves the same as an
 * author-authored fixed-width canvas); give it real CSS dimensions to keep
 * control of its own size.
 *
 * A second, narrower trade-off of pinning width only: the auto-derived
 * height keeps reading the CURRENT `canvas.width`/`height` attribute ratio,
 * and this harness rounds each axis of the backing store independently
 * (correctly: two CSS-sized axes have no reason to share a ratio at all).
 * At a DPR/size pair where that independent rounding is not symmetric (a
 * 300x150 canvas at dpr 1.25 rounds 150 up to 188 while 300 divides to an
 * exact 375, verified in Chrome), the auto height the browser then derives
 * from the pinned width and this slightly-off ratio lands a fraction of a
 * CSS pixel from the true value, firing one more, still bounded (not
 * unbounded) ResizeObserver entry to settle: the backing store itself never
 * moves again once it does (both passes write the identical value), the
 * same class of imperceptible sub-pixel residual the fourth pass already
 * documented for fractional padding, just on the axis this design leaves
 * free rather than the one it pins.
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

    // The proportional probe (ninth pass, final design; see the module doc
    // for the full reasoning): halve the just-written attributes together
    // (same divisor on both axes, so the ratio between them holds steady)
    // and force one layout read, then restore them and read again. Skipped
    // under 2 device pixels: too small a move to read past rounding noise.
    const w = canvas.width
    const h = canvas.height
    if (w >= 2) {
      canvas.width = Math.floor(w / 2)
      canvas.height = Math.floor(h / 2)
      const halved = canvas.clientWidth
      canvas.width = w
      canvas.height = h
      const restored = canvas.clientWidth
      const widthFollows = halved !== restored

      if (widthFollows) {
        // Width only: height stays free to keep tracking the intrinsic
        // ratio (see the module doc for why that is correct, not a gap).
        // Force content-box sizing so a border-box canvas doesn't
        // reinterpret the pinned width as a smaller content box.
        canvas.style.boxSizing = 'content-box'
        canvas.style.width = `${size.width}px`
      }
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
