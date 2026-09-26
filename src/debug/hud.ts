/**
 * Performance HUD: FPS, dropped/late frames against the measured refresh
 * interval, the worst frame of the last few seconds, and, where
 * PerformanceObserver supports 'long-animation-frame' (Chrome), blocking
 * time with the top script attribution. Self-contained: measures its own
 * rAF cadence, never reads driver internals.
 */
const WINDOW_MS = 5000

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export interface FrameStats {
  fps: number
  refreshHz: number
  dropped: number
  late: number
  worstMs: number
}

function trackFrames(onUpdate: (stats: FrameStats) => void): () => void {
  let raf = 0
  let last = 0
  const samples: Array<{ t: number; delta: number }> = []
  let lastUpdate = 0
  const tick = (t: number) => {
    if (last) {
      const delta = t - last
      samples.push({ t, delta })
      const cutoff = t - WINDOW_MS
      while (samples.length && samples[0].t < cutoff) samples.shift()
    }
    last = t
    if (t - lastUpdate > 500 && samples.length > 1) {
      lastUpdate = t
      const deltas = samples.map((s) => s.delta)
      const interval = median(deltas) || 16.67
      const dropped = deltas.filter((d) => d > interval * 1.5).length
      const late = deltas.filter((d) => d > interval * 1.2 && d <= interval * 1.5).length
      const worstMs = Math.max(...deltas)
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
      onUpdate({
        fps: 1000 / avg,
        refreshHz: 1000 / interval,
        dropped,
        late,
        worstMs,
      })
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
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
    readout.textContent =
      `${stats.fps.toFixed(1)} fps · ~${Math.round(stats.refreshHz)}Hz refresh\n` +
      `dropped ${stats.dropped} · late ${stats.late} · worst ${stats.worstMs.toFixed(1)}ms (last 5s)\n` +
      lafLine
  })

  return () => {
    stopFrames()
    laf.stop()
    panel.remove()
  }
}
