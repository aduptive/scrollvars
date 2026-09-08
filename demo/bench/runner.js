// Shared workload clock: every engine follows the same path and frame accounting.
async function runBench(label) {
  const query = new URLSearchParams(location.search)
  const hud = document.createElement('div')
  hud.className = 'hud'
  hud.textContent = label + '\nscroll to start, or wait — auto-run in 2s'
  document.body.appendChild(hud)
  if (query.has('norun')) { hud.textContent = label + '\nload-only mode (lighthouse)'; return }
  window.__benchStart = async () => {
    const height = document.documentElement.scrollHeight - innerHeight
    const duration = 12000
    const frames = []
    const burn = Number(query.get('burn')) || 0
    await window.__benchMark?.('start')
    const start = performance.now()
    let last = start
    return new Promise(resolve => {
      async function step(now) {
        frames.push(now - last)
        last = now
        if (burn) { const until = performance.now() + burn; while (performance.now() < until); }
        const t = (now - start) / duration
        if (t < 1) {
          scrollTo(0, (t < .5 ? t * 2 : (1 - t) * 2) * height)
          requestAnimationFrame(step)
          return
        }
        await window.__benchMark?.('end')
        if (frames.length > 1) frames.shift() // first callback is not a complete frame interval
        const sorted = [...frames].sort((a, b) => a - b)
        const avg = frames.reduce((a, b) => a + b, 0) / frames.length
        const out = {
          engine: label, frames: frames.length, avgMs: +avg.toFixed(2),
          fps: +(1000 / avg).toFixed(1), p95Ms: +sorted[Math.floor(sorted.length * .95)].toFixed(2),
          worstMs: +sorted.at(-1).toFixed(1), framesOver25ms: frames.filter(f => f > 25).length,
          deep: Number(query.get('deep')) || 0,
          heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
        }
        hud.textContent = `${label}\navg ${out.avgMs} ms (${out.fps} fps)\np95 ${out.p95Ms} ms · worst ${out.worstMs} ms\nframes >25ms: ${out.framesOver25ms} / ${out.frames}`
        document.title = 'DONE ' + JSON.stringify(out)
        if (window.parent !== window) window.parent.postMessage({ bench: out }, '*')
        console.log('BENCH', out)
        resolve(out)
      }
      requestAnimationFrame(step)
    })
  }
  if (query.has('harness')) return
  const startWhenVisible = () => setTimeout(() => window.__benchStart(), 2000)
  if (query.has('force') || document.visibilityState === 'visible') startWhenVisible()
  else document.addEventListener('visibilitychange', function visible() {
    if (document.visibilityState !== 'visible') return
    document.removeEventListener('visibilitychange', visible)
    startWhenVisible()
  })
}
