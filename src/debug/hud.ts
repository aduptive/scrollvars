/**
 * Performance HUD: FPS, dropped/late frames against the measured refresh
 * interval, the worst frame of the last few seconds, and, where
 * PerformanceObserver supports 'long-animation-frame' (Chrome), blocking
 * time with the top script attribution. Self-contained: measures its own
 * rAF cadence, never reads driver internals.
 */
const WINDOW_MS = 5000

export interface FrameStats {
  fps: number
  refreshHz: number
  dropped: number
  late: number
  worstMs: number
  /** False until the calibration window completes; the HUD shows "unknown"
   * refresh and skips dropped/late instead of reading them off an interval
   * it has not measured yet. */
  calibrated: boolean
}

const CALIBRATION_MS = 1000

// A refresh interval measured FROM the frames it is judging reads a
// sustained half-rate page (every other vsync) as a 30Hz display with 0
// dropped frames: the median of {33,33,33...} is 33, so nothing in that
// stream is ever more than 1.5x its own median (ADU-354 item 11). Calibrate
// ONCE, over a quiet opening window, then judge every later delta against
// that frozen interval; a delta that spans a `visibilitychange` (a
// backgrounded tab) is neither a calibration sample nor a dropped frame,
// it is a gap the page was not asked to render through.
/** Exported for unit tests only: `mountHud()` is the public surface. */
export function trackFrames(onUpdate: (stats: FrameStats) => void): () => void {
  let raf = 0
  let last = 0
  let interval: number | null = null
  let calibrationStart = 0
  let calibrationMin = Infinity
  const samples: Array<{ t: number; delta: number }> = []
  let lastUpdate = 0
  let skipNext = false
  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.hidden) skipNext = true
  }
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', onVisibility)
  }
  const tick = (t: number) => {
    if (last) {
      const delta = t - last
      const spansGap = skipNext
      skipNext = false
      if (interval === null) {
        if (!calibrationStart) calibrationStart = t
        if (!spansGap) calibrationMin = Math.min(calibrationMin, delta)
        if (t - calibrationStart >= CALIBRATION_MS && calibrationMin < Infinity) interval = calibrationMin
      }
      if (!spansGap) {
        samples.push({ t, delta })
        const cutoff = t - WINDOW_MS
        while (samples.length && samples[0].t < cutoff) samples.shift()
      }
    }
    last = t
    if (t - lastUpdate > 500 && samples.length > 1) {
      lastUpdate = t
      if (interval === null) {
        onUpdate({ fps: 0, refreshHz: 0, dropped: 0, late: 0, worstMs: 0, calibrated: false })
      } else {
        const deltas = samples.map((s) => s.delta)
        let dropped = 0
        let late = 0
        for (const d of deltas) {
          const ratio = d / interval
          if (ratio > 1.5) dropped += Math.round(ratio) - 1
          else if (ratio > 1.2) late++
        }
        const worstMs = Math.max(...deltas)
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
        onUpdate({ fps: 1000 / avg, refreshHz: 1000 / interval, dropped, late, worstMs, calibrated: true })
      }
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

export interface LafStats {
  supported: boolean
  blockingMs: number
  topScript: string
}

interface LafEntryLike {
  blockingDuration?: number
  scripts?: Array<{ name?: string; sourceURL?: string; invoker?: string; duration?: number }>
}

function watchLongFrames(): { stats: () => LafStats; stop: () => void } {
  const unsupported = { stats: () => ({ supported: false, blockingMs: 0, topScript: '' }), stop: () => {} }
  if (typeof PerformanceObserver === 'undefined') return unsupported
  if (!PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')) return unsupported
  let blockingMs = 0
  let topScript = ''
  let topDuration = 0
  const po = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as unknown as LafEntryLike[]) {
      blockingMs += entry.blockingDuration || 0
      for (const script of entry.scripts || []) {
        const duration = script.duration || 0
        if (duration > topDuration) {
          topDuration = duration
          topScript = script.name || script.sourceURL || script.invoker || 'script'
        }
      }
    }
  })
  po.observe({ type: 'long-animation-frame', buffered: true } as PerformanceObserverInit)
  return {
    stats: () => ({ supported: true, blockingMs: Math.round(blockingMs), topScript }),
    stop: () => po.disconnect(),
  }
}

export function mountHud(): () => void {
  const panel = document.createElement('div')
  panel.setAttribute('aria-hidden', 'true')
  panel.style.cssText =
    'position:fixed;top:12px;right:12px;z-index:2147483647;min-width:220px;' +
    'background:rgba(10,9,14,.92);color:#e6e4f0;border:1px solid rgba(167,139,250,.4);' +
    'border-radius:10px;padding:10px 12px;font:11px/1.6 ui-monospace,Menlo,monospace;white-space:pre'
  panel.innerHTML = '<b style="color:#a78bfa">ScrollVars perf</b>\n<span></span>'
  const readout = panel.lastElementChild as HTMLElement
  document.body.appendChild(panel)

  const laf = watchLongFrames()
  const stopFrames = trackFrames((stats) => {
    const lafStats = laf.stats()
    const lafLine = lafStats.supported
      ? `blocking ${lafStats.blockingMs}ms${lafStats.topScript ? ` (top: ${lafStats.topScript})` : ''}`
      : 'long-animation-frame: unsupported here (Chrome only)'
    readout.textContent = stats.calibrated
      ? `${stats.fps.toFixed(1)} fps · ~${Math.round(stats.refreshHz)}Hz refresh\n` +
        `dropped ${stats.dropped} · late ${stats.late} · worst ${stats.worstMs.toFixed(1)}ms (last 5s)\n` +
        lafLine
      : `calibrating… refresh unknown\n${lafLine}`
  })

  return () => {
    stopFrames()
    laf.stop()
    panel.remove()
  }
}
