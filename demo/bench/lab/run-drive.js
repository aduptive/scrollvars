// Loaded by every reference page. Does nothing unless index.html started a
// run: then it scrolls this page top to bottom, one step per frame, timing
// each frame, collects Long Animation Frames where the browser supports
// them, runs the page's own animated check, stores the result and moves to
// the next page. Top-level pages, not iframes: that is how a visitor sees
// them. Expects `window.LAB_PAGE = { name, animated() }` set before this
// script runs.
;(async () => {
  const KEY = 'sv-perf-lab'
  let state
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return }
  if (!state || !state.queue.length) return
  const [page, rep] = state.queue[0].split('#')
  const cfg = window.LAB_PAGE
  if (!cfg || cfg.name !== page) return

  const done = state.runs.length, total = done + state.queue.length
  const ping = (stage) => { new Image().src = `result?ping=1&page=${page}&rep=${+rep + 1}&${stage}&${done + 1}of${total}&t=${Date.now()}` }

  const badge = document.createElement('div')
  badge.setAttribute('role', 'status')
  badge.textContent = `Perf lab ${done + 1}/${total}: ${page}, run ${+rep + 1}. Do not touch the screen.`
  badge.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;padding:8px 12px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:#111;color:#fff;font:600 13px/1.3 -apple-system,system-ui,sans-serif;text-align:center'
  document.body.append(badge)

  const next = () => {
    state.queue.shift()
    localStorage.setItem(KEY, JSON.stringify(state))
    location.replace(state.queue.length ? `${state.queue[0].split('#')[0]}.html?run=${Date.now()}` : `index.html?done&v=${Date.now()}`)
  }
  const fail = (message) => {
    ping('error')
    state.runs.push({ page, rep: +rep, error: String(message).slice(0, 200) })
    next()
  }
  addEventListener('error', (e) => fail(e.message), { once: true })
  addEventListener('unhandledrejection', (e) => fail(e.reason), { once: true })

  // A page that leaves the screen stops getting frames: those timings are
  // meaningless, so start this page over once it is visible again.
  let hidden = false
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hidden = true
    else if (hidden) location.replace(`${page}.html?run=${Date.now()}`)
  })

  // Long Animation Frames (Chrome only): total blocking time and the share
  // attributed to script, over the whole scroll window.
  let loaf = null
  if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')) {
    loaf = { count: 0, totalBlocking: 0, scriptTotal: 0 }
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        loaf.count++
        loaf.totalBlocking += entry.blockingDuration || 0
        for (const s of entry.scripts || []) loaf.scriptTotal += s.duration || 0
      }
    })
    obs.observe({ type: 'long-animation-frame', buffered: true })
  }

  const raf = () => new Promise((r) => requestAnimationFrame(r))
  ping('start')
  await new Promise((r) => setTimeout(r, 1000))

  const max = document.documentElement.scrollHeight - innerHeight
  scrollTo(0, 0)
  await raf(); await raf()
  const deltas = []
  let last = performance.now()
  for (let f = 1; f <= state.frames; f++) {
    scrollTo(0, (max * f) / state.frames)
    const now = await raf()
    if (hidden) return
    deltas.push(+(now - last).toFixed(2))
    last = now
  }

  // untimed: the page's own check that something actually animated. A
  // frozen page must not post a good frame-interval number.
  let animated = false
  try { animated = !!cfg.animated() } catch {}

  if (hidden) return
  ping('done')
  state.runs.push({
    page,
    rep: +rep,
    deltas,
    animated,
    loaf: loaf ? { count: loaf.count, totalBlocking: +loaf.totalBlocking.toFixed(2), scriptTotal: +loaf.scriptTotal.toFixed(2) } : null,
  })
  next()
})()
