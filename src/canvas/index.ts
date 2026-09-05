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

  const applySize = () => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    fx.dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    fx.width = rect.width
    fx.height = rect.height
    canvas.width = Math.round(rect.width * fx.dpr)
    canvas.height = Math.round(rect.height * fx.dpr)
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
