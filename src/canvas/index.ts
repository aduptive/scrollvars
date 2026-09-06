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
 * (eleventh pass) The tenth pass fixed WHICH probe to trust (growing over
 * halving) but not WHEN it ran or what a canvas's write derived its own
 * numbers from. Two more verifier findings, both reproduced in real Chrome,
 * showed both still mattered.
 *
 * Finding 1: the tenth pass's probe ran AFTER `writeBackingStore()`, and
 * every pass rounded W and H independently from whatever the LAST pass had
 * already produced. A mirror-case canvas (a fixed CSS height, auto width)
 * has its free width computed by the CSS engine from that fixed height
 * through the intrinsic ratio, but that ratio IS this harness's own
 * backing-store attributes, and rounding W and H independently nudges that
 * ratio a fraction every pass, which nudges the next pass's measured width
 * a fraction, which gets rounded again: the error compounded instead of
 * settling. Swept at dpr 0.5 this took 51 to 77 ResizeObserver passes to
 * reach a WRONG fixed point (a square box instead of the true 2:1 one), and
 * at dpr 0.8 it never reached one at all (a 103px fixed height diverged to
 * a 422 backing height instead of the true 206).
 *
 * Finding 2: the same post-write probe timing perturbed the just-written,
 * DPR-scaled attribute, so at a DPR that does not divide evenly (the
 * parity-mismatch range, roughly 1.2 to 1.9) the FIRST pass could already
 * write a backing store past a `max-width` cap before the probe ever ran
 * against the canvas's true, natural size; a SECOND pass's probe then
 * perturbed that already-inflated value and pinned at the inflated number
 * instead of the true one (`max-width: 100px` false-pinned at several DPRs
 * in this range; a bare `max-width: 400px`, natural size 300x150, landed
 * pinned at an inflated 450x225 at dpr 1.5 instead of the true 300x150).
 *
 * The design anchors every pin, and every free-axis derivation below, to
 * values captured on the very FIRST `applySize()` call (mount), before this
 * harness ever writes anything: `anchor`, the CSS content size the
 * author's own CSS and attributes already produced, and `ratio0` (from
 * `w0`/`h0`), the ORIGINAL width/height attribute ratio. The causal probe
 * itself now runs BEFORE this pass's own write, on `w0`/`h0` specifically,
 * never on this harness's own evolving backing store: at mount the two are
 * the same value, but on any LATER pass probing the evolving store instead
 * can itself misread a cap relationship once the cap later changes (a cap
 * that widened past what the shrunk, already-DPR-scaled store's own
 * doubling would reveal read as a false follow in testing). The probe never
 * runs again once a canvas is pinned. When width follows, `style.width` is
 * set to `anchor.width` (never a later pass's own, possibly already-nudged
 * size) and `style.aspectRatio` to `w0 / h0`, so the CSS engine derives
 * height directly from the ORIGINAL attribute ratio from then on, never
 * through this harness's own rounded backing-store attributes again.
 *
 * For a canvas that stays unpinned (CSS-sized, or a cap already binding), a
 * SECOND kind of probe, two single-axis perturbations (width alone, then
 * height alone, each restored before the other runs), decides which axis,
 * if either, is ratio-derived from the other. The proportional (both
 * together) probe above cannot answer this, on purpose: it never perturbs
 * a ratio-tracking axis in the first place, which is what makes it immune
 * to the eighth pass's false-positive bug, so a genuinely CSS-fixed axis
 * and a ratio-derived one read identically under it, unchanged either way.
 * Perturbing ONE attribute alone tells them apart: an axis truly
 * independent of the attributes never moves for any attribute change,
 * while one derived from the ratio moves whenever the OTHER attribute
 * perturbs that ratio. Whichever axis this reveals as free (both true, or
 * both false and so undetermined, means neither is: rounds independently,
 * same as ever) is then always computed from the OTHER, just-rounded axis
 * and `ratio0`, instead of independently rounding its own fresh
 * measurement: its error is bounded to at most one rounding unit and never
 * depends on anything this harness wrote on an earlier pass, which is what
 * stops the mirror case's error from compounding (Finding 1). A dead band
 * (skip the whole pass, probe included, before any of the above runs, when
 * the measured content size moved by less than 0.5 CSS pixels on both axes
 * since the last write, UNLESS the DPR itself changed: a DPR change always
 * needs a new bitmap even at the same content size) absorbs the one small,
 * self-induced residual the free axis's own backing-store write can still
 * cause on its very next entry, so a canvas that would otherwise need one
 * further bounded pass to settle needs none at all.
 *
 * Probing `w0`/`h0` instead of a DPR-scaled write fixes Finding 2's
 * parity-mismatch inflation outright: a `max-width` cap AT OR BELOW the
 * natural size doubles or halves the SAME, never DPR-inflated pair every
 * time, so it reads as CSS-sized at every DPR in that range; a cap ABOVE
 * the natural size still only starts to bind once doubling `w0`/`h0`
 * pushes past it, and pins at the anchor, never an already-inflated write.
 * It does NOT remove the tenth pass's dpr-BELOW-1 case, and should not: at
 * dpr 1 and above, `round(cap * dpr) >= cap` always, so this harness's own
 * write never drops the attribute below the cap either, genuinely never
 * pinned; below dpr 1 the write CAN itself land below the cap, unclamping
 * it for real, exactly the risk the mount-time probe (on `w0`/`h0`, never
 * a DPR-scaled value, on purpose) cannot see coming. A SEPARATE escape
 * check, right after computing each pass's own candidate write (below),
 * reuses the SAME causal growth check against THAT candidate instead of
 * `w0`/`h0`, and catches it there: if doubling the candidate itself still
 * reads capped, nothing escaped, safe to commit as is; if the candidate
 * now reads as following its own attribute, this canvas is pinned instead,
 * at the size actually measured THIS pass, before the candidate write.
 * Unlike the tenth pass, this does not also over-pin at EXACTLY dpr 1
 * (`round(cap * 1) = cap`, doubling that stays clamped both times, the
 * narrow "harmless over-pin" boundary case the tenth pass documented): a
 * genuine improvement, not just a port of the old behavior. One narrow
 * limitation remains in the mount-time probe specifically, inherited from
 * its own halving fallback's exactness requirement: a cap strictly
 * BETWEEN half the natural size and the natural size itself can still
 * read as a false follow if it changes AFTER this canvas was already
 * found sized (halving `w0` alone can land inside that exact gap, below
 * the new cap, while `w0` itself stays above it); a cap that starts, or
 * stays, at or below half the natural size, or above the natural size
 * entirely, is unaffected. Documented, not fixed in this pass.
 *
 * When width follows, `applySize()` pins the WIDTH ONLY, forcing
 * `box-sizing: content-box` so an author's border-box declaration cannot
 * reinterpret the pinned number as a smaller content box. `style.height`
 * is left untouched: `aspect-ratio` above is what keeps height correct now,
 * not an unpinned height tracking this harness's own attribute ratio the
 * way the ninth and tenth passes relied on. A canvas with a genuine CSS
 * height and no CSS width reads as CSS-sized on the width-follows probe too
 * (its width is ratio-derived from that fixed height, and the ratio is
 * exactly what the probe's proportional doubling leaves alone): there is no
 * loop on that axis, so, correctly, nothing is pinned there either.
 * Otherwise `applySize()` does nothing further: the canvas already has full
 * control of its own size. The context transform (`ctx.setTransform`, the
 * 2D context's DPR scale) is applied AFTER every probe runs, so a pin never
 * leaves a stale scale behind. Every probe runs only inside `applySize()`
 * (a ResizeObserver callback or a DPR change), never once per animation
 * frame, and never again once pinned or dead-banded; setting an attribute
 * momentarily and back also clears the bitmap, same as any width/height
 * write, but the frame callback repaints on every resize regardless, so
 * this is free.
 *
 * A pinned canvas's own pin write changes its layout box, so it fires one
 * more ResizeObserver entry; that entry takes the normal path above, probe
 * skipped (already pinned), and the dead band absorbs it once the `aspect
 * -ratio`-derived height settles, which is immediate (CSS `aspect-ratio` is
 * computed exactly, not through this harness's own rounded attributes).
 * Documented limitation, unchanged since the very first pass: a canvas with
 * no CSS size on either axis still gets its width pinned inline by the
 * harness (after which height, now CSS `aspect-ratio`-derived, behaves the
 * same as an author-authored fixed-width canvas); give it real CSS
 * dimensions to keep control of its own size.
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

  // The last content size a real ResizeObserver entry reported, bit-exact
  // and never touched by a CSS transform. onDprChange() reads this instead
  // of re-deriving the size from getBoundingClientRect() (see the module
  // doc and measureLayout() above): set only when applySize() runs with an
  // actual entry, so it stays undefined until the first one arrives.
  let lastContent: { width: number; height: number } | undefined

  // (eleventh pass; see the module doc) The anchor, set once on the very
  // first applySize() call and never touched again: `anchor` is the CSS
  // content size the author's own CSS and attributes already produced,
  // before this harness writes anything; `ratio0` (from `w0`/`h0`, the
  // ORIGINAL width/height attributes) is the ratio every later pin and
  // every free-axis derivation below is anchored to, never a later pass's
  // own, possibly already-perturbed, reading.
  let mounted = false
  let anchor = { width: 0, height: 0 }
  let w0 = 0
  let h0 = 0
  let ratio0 = 1
  // Which axis is free (ratio-derived from the other through `ratio0`):
  // 'width', 'height', or undefined (neither: both axes are independently
  // CSS-fixed, or a giant canvas left this undetermined, see
  // GIANT_CANVAS_LIMIT below; either way the write below rounds both axes
  // independently, same as ever). Cached from two single-axis probes,
  // refreshed every pass the probe still runs (any pass before this canvas
  // is pinned).
  let freeAxis: 'width' | 'height' | undefined
  // Set once, the moment this canvas is judged unsized and pinned; the
  // probe never runs again afterward.
  let pinned = false
  // The measured content size (and DPR) that produced the LAST actual
  // backing-store write, for the dead band below: undefined until the
  // first write, so the dead band never fires on mount.
  let lastWriteContent: { width: number; height: number } | undefined
  let lastWriteDpr: number | undefined

  const applySize = (entries?: ResizeObserverEntry[]) => {
    const entry = entries?.[0]

    const size = entry ? measureLayout(entry) : (lastContent ?? measureLayout())
    if (entry) lastContent = size
    if (!size.width || !size.height) return
    fx.dpr = Math.min(window.devicePixelRatio || 1, dprCap)

    // Dead band (eleventh pass): a sub-pixel content change never needs a
    // new bitmap. Skipping the whole pass here, before the probe or the
    // write below ever run, is what stops a bounded, self-induced residual
    // (the free axis moving a fraction of a CSS pixel as a side effect of
    // this harness's own previous write) from ever having a next pass to
    // ping-pong in. A DPR change always needs a new bitmap even when the
    // CSS content size did not move at all, so it never counts as dead.
    if (
      lastWriteContent &&
      fx.dpr === lastWriteDpr &&
      Math.abs(size.width - lastWriteContent.width) < 0.5 &&
      Math.abs(size.height - lastWriteContent.height) < 0.5
    ) {
      return
    }

    if (!mounted) {
      mounted = true
      anchor = size
      w0 = canvas.width
      h0 = canvas.height
      ratio0 = w0 / h0
    }

    // The causal probe (see the module doc for the full reasoning): tries
    // up to two perturbations of `w0`/`h0`, the canvas's ORIGINAL width/
    // height attributes (never this harness's own later, DPR-scaled
    // write: probing THAT instead can itself drift once a cap changes
    // after this canvas was already found sized, see the module doc), and
    // never runs again once this canvas is pinned. GROWING (double both
    // together) preserves whatever ratio they have exactly, for any pair
    // of integers: if clientWidth still follows it, this axis is unsized
    // (or a cap not yet binding on it) and gets pinned. SHRINKING (halve
    // both together, only when both are even, so the halving stays exact)
    // is the fallback that also catches a cap already binding on `w0`/`h0`.
    // The canvas's REAL current attributes are restored once, after every
    // perturbation below is done, never left at `w0`/`h0`.
    if (!pinned) {
      const current = { width: canvas.width, height: canvas.height }
      canvas.width = w0
      canvas.height = h0
      const baseW = canvas.clientWidth
      const baseH = canvas.clientHeight
      const canGrow = 2 * w0 <= GIANT_CANVAS_LIMIT && 2 * h0 <= GIANT_CANVAS_LIMIT
      const canShrink = w0 % 2 === 0 && h0 % 2 === 0

      let widthFollows = false
      if (canGrow) {
        canvas.width = 2 * w0
        canvas.height = 2 * h0
        const grownW = canvas.clientWidth
        if (grownW !== baseW) widthFollows = true
        canvas.width = w0
        canvas.height = h0
      }
      if (!widthFollows && canShrink) {
        canvas.width = w0 / 2
        canvas.height = h0 / 2
        const shrunkW = canvas.clientWidth
        if (shrunkW !== baseW) widthFollows = true
        canvas.width = w0
        canvas.height = h0
      }

      // Two SEPARATE, single-axis perturbations decide which axis (if
      // either) this canvas's write derives from the other through
      // `ratio0` below. Doubling BOTH attributes together, above, cannot
      // answer this: it is proportional on purpose (so it never perturbs a
      // ratio-tracking axis, which is what makes it immune to the
      // eighth-pass false-positive bug), so it leaves a genuinely
      // independent axis and a ratio-derived one reading identically,
      // unchanged either way. Changing ONE attribute alone, the other
      // untouched, tells them apart: an axis truly independent of the
      // attributes never moves for ANY attribute change, while one derived
      // from the ratio moves whenever the OTHER attribute perturbs that
      // ratio. `wFixed`/`hFixed` end up true when the corresponding axis
      // stayed put; exactly one false, the other true, names the free
      // axis; both true (or both false, undetermined) means neither axis
      // derives from the other, so the write below rounds them
      // independently, same as ever. Skipped once this canvas is unsized
      // (`widthFollows`, pinned below): height then becomes the CSS
      // engine's own `aspect-ratio` derivation, not this harness's
      // attribute ratio, so nothing here still applies to it.
      if (!widthFollows) {
        let hFixed: boolean | undefined
        if (2 * h0 <= GIANT_CANVAS_LIMIT) {
          canvas.height = 2 * h0
          const grownHAlone = canvas.clientHeight
          canvas.height = h0
          hFixed = grownHAlone === baseH
        } else if (h0 > 1) {
          canvas.height = h0 - 1
          const shrunkHAlone = canvas.clientHeight
          canvas.height = h0
          hFixed = shrunkHAlone === baseH
        }

        let wFixed: boolean | undefined
        if (2 * w0 <= GIANT_CANVAS_LIMIT) {
          canvas.width = 2 * w0
          const grownWAlone = canvas.clientWidth
          canvas.width = w0
          wFixed = grownWAlone === baseW
        } else if (w0 > 1) {
          canvas.width = w0 - 1
          const shrunkWAlone = canvas.clientWidth
          canvas.width = w0
          wFixed = shrunkWAlone === baseW
        }

        if (wFixed === true && hFixed === false) freeAxis = 'height'
        else if (wFixed === false && hFixed === true) freeAxis = 'width'
        else freeAxis = undefined
      }

      canvas.width = current.width
      canvas.height = current.height

      if (widthFollows) {
        // Unsized: pin at the anchor, not this pass's own size (which,
        // past mount, could already be a value this harness's earlier
        // writes helped produce). `aspectRatio` lets the CSS engine derive
        // height from the ORIGINAL attribute ratio directly, never from
        // rounding this harness's own backing-store attributes.
        canvas.style.boxSizing = 'content-box'
        canvas.style.width = `${anchor.width}px`
        canvas.style.aspectRatio = `${w0} / ${h0}`
        pinned = true
      }
    }

    // Backing-store write. A canvas pinned this pass or earlier has both
    // axes rounded independently: height is now the CSS engine's own
    // `aspect-ratio` derivation, exact, never this harness's own rounded
    // attribute ratio, so there is nothing left to anchor. A canvas still
    // unpinned uses `freeAxis` (from the two single-axis probes above),
    // which names the one axis, if either, that is ratio-derived from the
    // other: that axis is computed from the OTHER, just-rounded axis and
    // `ratio0` instead of independently rounding its own measurement, so
    // its error is bounded by one rounding unit, never compounding pass
    // over pass, because it never depends on anything this harness wrote
    // earlier. Neither axis free (both independently CSS-fixed, or
    // undetermined past GIANT_CANVAS_LIMIT) rounds both independently.
    let w: number
    let h: number
    if (pinned) {
      w = Math.round(size.width * fx.dpr)
      h = Math.round(size.height * fx.dpr)
    } else if (freeAxis === 'height') {
      w = Math.round(size.width * fx.dpr)
      h = Math.round(w / ratio0)
    } else if (freeAxis === 'width') {
      h = Math.round(size.height * fx.dpr)
      w = Math.round(h * ratio0)
    } else {
      w = Math.round(size.width * fx.dpr)
      h = Math.round(size.height * fx.dpr)
    }

    // Escape check, unpinned canvases only: a `max-width` cap with no CSS
    // width of its own still binds on THIS canvas's own intrinsic
    // width/height attribute, and this candidate write, once committed,
    // becomes that attribute. At a DPR below 1 the candidate can itself
    // land BELOW the cap and unclamp it, a genuine unbounded shrink this
    // harness exists to stop, just discovered here instead of by the
    // mount-time probe (which deliberately checks `w0`/`h0`, never a
    // DPR-scaled write, so a cap relationship it cannot see change).
    // Reuses the exact same causal check as that probe (a proportional
    // GROW, `clientWidth` before and after, immune to border, padding and
    // transform because they cancel out of the delta), just against this
    // candidate write instead of `w0`/`h0`: if the candidate is STILL
    // capped at double its own size, nothing escaped, safe to commit as
    // is; if it now reads as following its own attribute, the cap already
    // escaped this candidate, and this canvas is pinned instead, at the
    // size actually measured THIS pass (before this candidate write), not
    // the candidate itself.
    if (!pinned) {
      canvas.width = w
      canvas.height = h
      const baseW = canvas.clientWidth
      if (2 * w <= GIANT_CANVAS_LIMIT && 2 * h <= GIANT_CANVAS_LIMIT) {
        canvas.width = 2 * w
        canvas.height = 2 * h
        const grownW = canvas.clientWidth
        canvas.width = w
        canvas.height = h
        if (grownW !== baseW) {
          canvas.style.boxSizing = 'content-box'
          canvas.style.width = `${size.width}px`
          canvas.style.aspectRatio = `${w0} / ${h0}`
          pinned = true
        }
      }
    }

    canvas.width = w
    canvas.height = h
    lastWriteContent = size
    lastWriteDpr = fx.dpr

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
