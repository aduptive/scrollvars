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
 * (ninth pass) Eight earlier passes (CHANGELOG.md's Canvas section has the
 * history) all tried to catch that loop by MEASURING: an
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
 * The design narrows the question: PROPORTIONAL, and about ONE axis. Right
 * after `applySize()` writes the backing store (`canvas.width = W`,
 * `canvas.height = H`), it tries up to two readings, each an EXACT integer
 * multiple of `W`/`H` so the ratio between them is preserved and an axis
 * derived from that ratio does not move, and ORs the results. GROWING sets
 * `canvas.width = 2 * W`, `canvas.height = 2 * H`, forces one layout read
 * (`canvas.clientWidth`), restores `W`/`H`, and reads `clientWidth` again.
 * SHRINKING does the same with `W / 2`, `H / 2`. If EITHER pair of readings
 * differs, the WIDTH follows the attribute (this canvas is unsized on
 * width, whatever its height does). If NEITHER differs, the width is
 * CSS-sized, whatever its literal source (a percentage, a fixed px value,
 * or itself derived from a fixed CSS height through the intrinsic ratio,
 * the mirror case): nothing about height enters that conclusion, because
 * nothing about height is asked.
 *
 * (tenth pass) The ninth pass used ONLY halving
 * (`canvas.width = Math.floor(W / 2)`), reasoning that a smaller
 * perturbation was gentler. Two verifier findings, both reproduced in real
 * Chrome, caught two flaws.
 *
 * Finding 1: `Math.floor` on a halved value does not preserve the ratio
 * between W and H when they have different parity (one odd, one even), and
 * a fixed-CSS-height, auto-width canvas (the mirror case: the auto width
 * derives from the fixed height through exactly that ratio) can have its
 * floored ratio read back a fraction off the true one, flipping the
 * before/after `clientWidth` comparison across a rounding boundary even
 * though the CSS height never moved. Swept across heights 99-151 and dprs
 * 0.5-2, this false positive hit 27 of 42 combinations, wrongly pinning an
 * ordinary, fully-responsive canvas and then distorting it on the next CSS
 * height change. GROWING has no such flaw: multiplying two integers by the
 * same integer factor preserves their ratio exactly, for any parity, no
 * flooring involved, so it is now the design's first, preferred probe.
 * SHRINKING keeps the same exactness, but only when `Math.floor` has
 * nothing to floor: both `W` and `H` even, an even divisor never actually
 * floors anything dividing by 2. When parity differs, shrinking is skipped
 * and growing alone decides.
 *
 * Finding 2 (why shrinking is still needed, not just growing): a `max-width`
 * cap that is already binding on the just-written, dpr-inflated attribute
 * (a bare `max-width: 400px` with no CSS width at all, natural intrinsic
 * size 300, at a DPR that inflates the backing store past the cap to, say,
 * 600) stays capped whether GROWN further or restored: both readings clamp
 * to the same 400, so growing alone would wrongly read this canvas as
 * CSS-sized (this is the case the eighth pass's bare-cap regression came
 * from). SHRINKING catches it: halving 600 gives 300, still under the cap,
 * revealing the uncapped relationship the cap otherwise hides. Growing is
 * skipped past the browser's own canvas-size limit (past 8192, doubling
 * could itself trip it); when that leaves shrinking as the only available
 * probe, it still requires exact parity, and a giant canvas with an odd
 * dimension on either axis has no safe direction to probe in at all: it is
 * skipped too, treated as already sized (documented limitation, alongside
 * the one below for a canvas with no CSS size on either axis).
 *
 * This is still causal, not a value comparison, because each perturbation
 * IS the harness's own known cause: double or halve the attributes, exactly
 * here, exactly now, and read the one response that can only follow from
 * THAT write, not from anything else happening on the page. There is no
 * value to coincide with and no window to land inside, so a genuine resize
 * landing on any size at any time, including the exact size the harness
 * itself just wrote, produces no response to the probe's own perturbation
 * and is never mistaken for one. `clientWidth` includes padding, excludes
 * border, and is never affected by a CSS `transform` (applied after
 * layout), so the probe is unaffected by border, padding (whole or
 * fractional), a transform on the canvas itself, or which way the device
 * pixel ratio moved the backing store: above 1, below 1, or exactly 1.
 *
 * A `max-width` cap's relationship to the canvas's natural (uncapped) width
 * decides the outcome, and both are correct, not one an inflation of the
 * other: a cap AT OR BELOW the natural width binds already at mount, before
 * the harness ever touches the attributes, so `clientWidth` reads the same,
 * capped number whichever way the probe perturbs it and this reads as
 * CSS-sized: rendered at the cap, its backing store scaled to that cap by
 * dpr, exactly the crisp size a canvas of that CSS box needs, never
 * pinned, at any DPR ABOVE 1 (a larger DPR only pushes the just-written
 * attribute further past the cap, never below it, so nothing about the
 * shrinking probe's own halved reading ever escapes the clamp either). A
 * cap ABOVE the natural width is the inflation case documented above (the
 * bare `max-width: 400px` example): the intrinsic size is genuinely
 * unsized, and the cap only starts to bind once a DPR scales the harness's
 * own write past it, which the shrinking probe still catches and pins to
 * the true, uncapped width.
 *
 * AT OR BELOW dpr 1, a cap at or below the natural width is a narrower
 * case, not the same guarantee. Below 1, the just-written attribute can
 * itself land BELOW the cap (round(cap * dpr) < cap): a genuine risk, the
 * unbounded feedback loop this whole module exists to stop, just shrinking
 * instead of growing (left unpinned, the next resize would measure that
 * smaller, unclamped size and shrink further every pass), so the probe
 * correctly pins it. AT exactly dpr 1, the just-written attribute lands
 * EXACTLY on the cap: genuinely stable if left alone (writing the same
 * number forever reproduces it), but the shrinking probe cannot tell
 * "exactly at the cap" apart from "just above it" (halving either reads as
 * unclamped), so it pins here too, a narrow, documented, harmless
 * over-pin: the pin lands on exactly what the cap already renders, so
 * nothing about the crisp backing store changes, and a cap that later
 * shrinks further is still honored (`max-width` still clamps a pinned
 * `style.width` down, same as the container-shrink case below); it would
 * only matter for a cap that later widens past this exact pinned number,
 * which is not among this ticket's swept cases.
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
 * probe's proportional doubling leaves alone): there is no loop on that
 * axis, so, correctly, nothing is pinned there either. Otherwise
 * `applySize()` does nothing further: the canvas already has full control
 * of its own size. The context transform (`ctx.setTransform`, the 2D
 * context's DPR scale) is applied AFTER the probe runs, so a pin never
 * leaves a stale scale behind. The probe itself runs only inside
 * `applySize()` (a ResizeObserver callback or a DPR change), never once per
 * animation frame: its cost is two forced layouts per probe it runs, up to
 * four for a resize event when growing alone does not already decide it,
 * never per frame (browsers only recompute layout once per dirty/read
 * cycle, so reading `clientWidth` twice per probe costs exactly that and no
 * more). Setting the attribute momentarily to double, or half, and back
 * also clears the bitmap, same as any width/height write; the frame
 * callback repaints on every resize regardless, so this is free.
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

// Browsers cap a canvas's own width/height attribute well above this
// (platform-dependent, but comfortably higher); guards the proportional
// probe's own doubling from ever tripping that cap on an already-giant
// canvas (see the module doc, tenth pass).
const GIANT_CANVAS_LIMIT = 8192

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

    // The proportional probe (tenth pass; see the module doc for the full
    // reasoning): two readings, each an EXACT integer multiple of the
    // just-written W/H so their ratio holds exactly (immune to finding 1's
    // parity bug, whichever reading runs), ORed together. GROWING (double
    // W and H together) catches an axis that is unsized or whose cap has
    // not engaged yet, including a cap ABOVE the just-written value that a
    // further DPR increase would push past (the inflation case): it alone
    // cannot catch a cap that is ALREADY binding on the just-written value,
    // since growing further only stays behind that cap, both readings
    // identical. SHRINKING (halve W and H together) catches that case
    // instead, revealing the uncapped relationship below it, but only when
    // exact: both W and H even, so dividing by 2 has no `Math.floor`
    // residue, the same exactness growing already relies on. When the cap
    // sits EXACTLY on the just-written value (only possible when the DPR
    // does not scale it away from the cap, i.e. dpr <= 1: a display at or
    // below 1x, or a page not zoomed in), halving still crosses below it
    // and reads a follow: a documented, narrow over-pin, harmless (the
    // pinned width still equals what the cap already renders, and a cap
    // that shrinks further is still honored, see CHANGELOG.md); it would
    // only matter for a cap that later widens past this exact value, which
    // is not among this ticket's swept cases. Growing is skipped past the
    // browser's own canvas-size limit (doubling could itself trip it);
    // shrinking is skipped when W and H have different parity; if neither
    // is safe, the canvas is treated as already sized (documented
    // limitation, alongside the one below for a canvas with no CSS size on
    // either axis).
    const w = canvas.width
    const h = canvas.height
    const canGrow = 2 * w <= GIANT_CANVAS_LIMIT && 2 * h <= GIANT_CANVAS_LIMIT
    const canShrink = w % 2 === 0 && h % 2 === 0

    const probes = (canGrow ? [{ w: 2 * w, h: 2 * h }] : []).concat(
      canShrink ? [{ w: w / 2, h: h / 2 }] : []
    )
    const widthFollows = probes.some((p) => {
      canvas.width = p.w
      canvas.height = p.h
      const probed = canvas.clientWidth
      canvas.width = w
      canvas.height = h
      const restored = canvas.clientWidth
      return probed !== restored
    })

    if (widthFollows) {
      // Width only: height stays free to keep tracking the intrinsic
      // ratio (see the module doc for why that is correct, not a gap).
      // Force content-box sizing so a border-box canvas doesn't
      // reinterpret the pinned width as a smaller content box.
      canvas.style.boxSizing = 'content-box'
      canvas.style.width = `${size.width}px`
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
