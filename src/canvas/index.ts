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
 * measuring the CSS size. On an unsized canvas that write IS the new CSS
 * layout size, W by H CSS px, so the ResizeObserver delivers another entry
 * for it in the very same frame, reporting exactly that (this is the
 * runaway loop itself, the platform handing it right back). A CSS-sized
 * canvas's box never moves as a result of its own backing-store write,
 * whatever its attribute values, borders, padding, transform or the
 * current device pixel ratio, so no such entry ever comes.
 *
 * (seventh pass, design change) applySize() detects that directly, the
 * platform's own signal, instead of measuring and guessing. After every
 * backing-store write it remembers `pending`: the exact W/H it just wrote,
 * plus the CSS content size it measured right before writing. It clears
 * `pending` two animation frames later, not one (verified against real
 * Chrome): a write made during frame N's ResizeObserver callback does not
 * echo back until frame N+1's own ResizeObserver step, and within a single
 * "update the rendering" cycle the browser runs that frame's
 * requestAnimationFrame callbacks BEFORE its ResizeObserver step, so a
 * callback scheduled with a single `requestAnimationFrame` fires at the
 * start of frame N+1, one step too early, clearing `pending` moments
 * before the echo it was supposed to catch arrives in that same frame. A
 * second, nested `requestAnimationFrame` pushes the clear out to frame
 * N+2, safely after frame N+1's echo has already been handled, while still
 * bounding the window (a user resize that happens to land on the same
 * size only after that must not be mistaken for one). When the
 * ResizeObserver callback next runs with `pending` still set, it rounds
 * the new entry's own `contentRect`
 * (a layout engine can report a fractional content box) and compares it
 * against `pending`'s W/H. An exact match is the echo of the write this
 * harness itself just made, nothing else: `contentRect` is the layout
 * engine's own content-box measurement, so it already excludes padding and
 * border, ignores any CSS `transform` (which never touches layout), and is
 * exact. No ratio, no tolerance, no `dpr > 1` guard: the comparison is a
 * plain equality against the actual W/H this harness wrote, whichever way
 * the device pixel ratio moved it, so a page zoomed out to a DPR below 1
 * (0.8, 0.5, shrinking the backing store) produces the same echo signal a
 * DPR above 1 does. On a match, applySize() pins the CSS size it measured
 * before the write to `canvas.style.width`/`height`, forcing
 * `box-sizing: content-box` inline so a `border-box` canvas doesn't
 * reinterpret the pinned width as a smaller content box, and returns
 * without touching the backing store again. That pin itself changes the
 * canvas's own layout box, which fires one more ResizeObserver entry; that
 * entry takes the normal path below and writes the correct, stable backing
 * store. A canvas with no CSS size still ends up with one pinned inline by
 * the harness: give it real CSS dimensions to keep control of its own
 * size.
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
  // padding lands on 299.99375). That residual only matters here, never in
  // applySize()'s own feedback check (seventh pass: that check now
  // compares the ResizeObserver entry's own bit-exact contentRect against
  // the exact integer backing-store size the harness itself wrote, not two
  // fallback reads against each other). The subtraction can also go
  // negative, a display:none canvas (rect all zero) with real padding:
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

  // Set right after every backing-store write, cleared two animation
  // frames later (see the module doc for why one frame fires too early
  // against real Chrome): the window in which a ResizeObserver entry
  // reporting exactly `w`/`h` (the backing store just written, integer CSS
  // pixels) counts as the echo of that write rather than a coincidental
  // real resize landing on the same number. `cssW`/`cssH` is the CSS
  // content size measured BEFORE the write, what gets pinned if the echo
  // arrives.
  let pending: { w: number; h: number; cssW: number; cssH: number } | undefined

  const applySize = (entries?: ResizeObserverEntry[]) => {
    const entry = entries?.[0]

    // The echo check: only a real ResizeObserver delivery can be one (a
    // direct call, from onDprChange(), never is), and only while `pending`
    // is still set. Round the entry's contentRect: a layout engine can
    // report a fractional content box even though the backing store this
    // harness wrote is always a whole number of device pixels.
    if (entry && pending) {
      const w = Math.round(entry.contentRect.width)
      const h = Math.round(entry.contentRect.height)
      if (w === pending.w && h === pending.h) {
        // This canvas has no CSS size of its own: pin the content size
        // measured before the write. Force content-box sizing: `cssW`/
        // `cssH` are always the pure content box, so the pinned width/
        // height must be interpreted as content-box too, whatever the
        // canvas's own box-sizing says, or a border-box canvas would pin a
        // content box smaller than the one just measured.
        canvas.style.boxSizing = 'content-box'
        canvas.style.width = `${pending.cssW}px`
        canvas.style.height = `${pending.cssH}px`
        pending = undefined
        return // the pin itself fires one more entry; that one takes the
        // normal path below and writes the correct, stable backing store.
      }
    }

    const size = entry ? measureLayout(entry) : (lastContent ?? measureLayout())
    if (entry) lastContent = size
    if (!size.width || !size.height) return
    fx.dpr = Math.min(window.devicePixelRatio || 1, dprCap)

    writeBackingStore(size)
    pending = { w: canvas.width, h: canvas.height, cssW: size.width, cssH: size.height }
    // Nested, not a single requestAnimationFrame: see the module doc and
    // the `pending` comment above for why one frame clears this a step
    // too early against real Chrome's rAF-then-ResizeObserver ordering.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pending = undefined
      })
    })

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
