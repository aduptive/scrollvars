#!/usr/bin/env node
/**
 * An app-shaped page, measured the way the bench pages are.
 *
 * The bench pages are synthetic and hold still after load; the consumer
 * watch's cost (round 7 in README.md) hid in exactly that gap. This page has
 * the shape of a product site built on a utility-class framework: a sticky
 * header, a hero with entrance presets, a card grid with stagger, a parallax
 * band, a feed of forty tracked items, a stream that keeps mounting and
 * unmounting rows while the page scrolls, a route change at six seconds that
 * replaces the grid and the feed, and a 5000-rule stylesheet of which fifty
 * rules match something.
 *
 * Modes, one page load each, order rotated per run: none (the page without
 * the library, what it costs by itself), default (fx/sv.js as shipped),
 * scoped (plus styles/scoped.css; the page's only clock readers are presets
 * the sheet forwards). Timed with bench/runner.js and CDP
 * Performance.getMetrics like the A/B runner. scoped is gated against default
 * on the static page first: a variant that stops animating posts the best
 * time of all. A run whose page raised an error, or whose mutations did not
 * happen, does not count.
 *
 *   node app-shaped.mjs --runs=3
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { snapshotRender, compareRender, describeMismatch, rendersMoved } from './render-equivalence.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const args = Object.fromEntries(process.argv.slice(2).map(a => { const eq = a.indexOf('='); return eq < 0 ? [a.slice(2), true] : [a.slice(2, eq), a.slice(eq + 1)] }))
const RUNS = Number(args.runs ?? 3)
const MODES = ['none', 'default', 'scoped']
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const RULES = 5000

const tw = Array.from({ length: RULES }, (_, i) => `.k${i}{padding:${i % 7}px;margin:${i % 3}px;color:#${(i * 7919 % 4096).toString(16).padStart(3, '0')}}`).join('\n')

// Fourteen nodes of nested wrappers, the tree a component leaves behind.
// These three also run inside the page (their source is inlined below), so
// they use nothing from this module.
const leaf = (n, i) => `${'<div class="w">'.repeat(6)}<span class="k${i % 50}">${n}</span><em class="k${(i * 3) % 50}">.</em>${'</div>'.repeat(6)}`
const card = i => `<article class="card sv-rise">${leaf('card ' + i, i)}<h3>Card ${i}</h3><p>Two lines of copy under the card title.</p></article>`
const item = i => `<article data-sv class="item"><div class="sv-fade">${leaf('item ' + i, i)}<h4>Item ${i}</h4><p>A feed entry with a little text.</p></div></article>`
const plain = i => `<div class="row">${leaf('row ' + i, i)}<p>Stream row ${i}</p></div>`
const grid = seed => Array.from({ length: 12 }, (_, i) => card(seed + i)).join('')
const feed = seed => Array.from({ length: 40 }, (_, i) => item(seed + i)).join('')

const html = (mode, mutate) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>app-shaped ${mode}</title>
<link rel="stylesheet" href="/tw.css">
<link rel="stylesheet" href="/fx/sv.css">
${mode === 'scoped' ? '<link rel="stylesheet" href="/bench/scoped.css">' : ''}
<style>
  body { margin: 0; font: 15px/1.4 system-ui; background: #fafafa; color: #222 }
  .top { position: sticky; top: 0; height: 56px; background: #fff; border-bottom: 1px solid #ddd; z-index: 2 }
  .hero { min-height: 90vh; padding: 12vh 8vw }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 8vh 8vw }
  .card { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; min-height: 180px }
  .parallax { position: relative; height: 80vh; overflow: hidden; background: #111 }
  .layer1, .layer2 { position: absolute; inset: -20% 0; --sv-distance: 120px }
  .layer1 { background: radial-gradient(circle at 30% 40%, #335, transparent 40%) }
  .layer2 { background: radial-gradient(circle at 70% 60%, #533, transparent 35%); --sv-distance: -80px }
  .copy { position: relative; color: #fff; padding: 30vh 8vw }
  .feed { padding: 4vh 8vw }
  .item { background: #fff; border-bottom: 1px solid #eee; padding: 14px; min-height: 120px }
  .stream { padding: 4vh 8vw; background: #f1f1f1 }
  .row { padding: 8px 0; border-bottom: 1px dashed #ccc }
  .w { display: block }
  footer { height: 40vh; background: #222 }
</style></head><body>
<header class="top">app-shaped</header>
<section data-sv class="hero"><h1 class="sv-rise">A product page shaped like a real one</h1><p class="sv-fade">Hero copy under a headline, entrance presets on both.</p><nav class="sv-auto"><a class="sv-rise">Start</a> <a class="sv-rise">Docs</a> <a class="sv-rise">Pricing</a></nav></section>
<section data-sv class="grid sv-stagger" id="grid">${grid(0)}</section>
<section data-sv class="parallax"><div class="sv-drift layer1"></div><div class="sv-drift layer2"></div><div class="copy"><h2>Parallax band</h2></div></section>
<section class="feed" id="feed">${feed(0)}</section>
<section class="stream" id="stream">${Array.from({ length: 20 }, (_, i) => plain(i)).join('')}</section>
<footer></footer>
<script>
  // The app's own life during the scroll: a stream that mounts two rows and
  // unmounts two every 250ms, and a route change at six seconds that swaps
  // the grid and the feed for new ones. Both start at the first scroll, so
  // every mode sees the same timeline against the runner's clock.
  const leaf = ${leaf.toString()}
  const plain = ${plain.toString()}
  window.__appMutations = 0
  if (${mutate ? 'true' : 'false'}) addEventListener('scroll', () => {
    const stream = document.getElementById('stream')
    let n = 20
    const tick = setInterval(() => {
      stream.firstElementChild?.remove(); stream.firstElementChild?.remove()
      stream.insertAdjacentHTML('beforeend', plain(n++) + plain(n++))
      window.__appMutations += 4
    }, 250)
    setTimeout(() => {
      document.getElementById('grid').innerHTML = ${JSON.stringify(grid(100))}
      document.getElementById('feed').innerHTML = ${JSON.stringify(feed(100))}
      window.__appMutations += 52
    }, 6000)
    setTimeout(() => clearInterval(tick), 12500)
  }, { once: true })
</script>
${mode === 'none' ? '' : '<script src="/fx/sv.js"></script>'}
</body></html>`

const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/app.html') { res.setHeader('content-type', 'text/html'); return res.end(html(u.searchParams.get('mode'), u.searchParams.get('mutate') === '1')) }
  if (u.pathname === '/tw.css') { res.setHeader('content-type', 'text/css'); return res.end(tw) }
  const path = join(root, u.pathname.replace(/\/$/, '/index.html'))
  try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
  catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })

async function open(mode, mutate) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${base}/app.html?mode=${mode}&mutate=${mutate ? 1 : 0}&harness=1`, { waitUntil: 'load', timeout: 60000 })
  await page.addScriptTag({ url: `${base}/bench/runner.js` })
  await page.evaluate(label => runBench(label), `app-shaped:${mode}`)
  await page.waitForFunction(() => typeof window.__benchStart === 'function')
  // Prove the mode applied: the run would otherwise measure another page under this name.
  if (mode !== 'none' && !(await page.evaluate(() => typeof window.SV !== 'undefined' && document.documentElement.classList.contains('sv-on'))))
    throw Error(`${mode}: the library did not boot`)
  if (mode === 'none' && await page.evaluate(() => typeof window.SV !== 'undefined')) throw Error('none: the library is present')
  if (mode === 'scoped' && !(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sv-t') === '0')))
    throw Error('scoped: the clocks are not registered (computed --sv-t on <html> is not the initial value)')
  const failOnErrors = () => { if (pageErrors.length) throw Error(`${mode}: the page raised ${pageErrors.length} error(s), first: ${pageErrors[0]}`) }
  return { page, context, failOnErrors }
}

async function gate(mode) {
  const { page, context, failOnErrors } = await open(mode, false)
  try { const shot = await snapshotRender(page); failOnErrors(); return shot } finally { await context.close() }
}

const delta = (a, b) => ({ taskMs: +((a.TaskDuration - b.TaskDuration) * 1000).toFixed(1), scriptMs: +((a.ScriptDuration - b.ScriptDuration) * 1000).toFixed(1), recalcMs: +((a.RecalcStyleDuration - b.RecalcStyleDuration) * 1000).toFixed(1), layoutMs: +((a.LayoutDuration - b.LayoutDuration) * 1000).toFixed(1) })

async function timed(mode) {
  const { page, context, failOnErrors } = await open(mode, true)
  try {
    const cdp = await page.createCDPSession()
    await cdp.send('Performance.enable')
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
    const marks = {}
    await page.exposeFunction('__benchMark', async name => { marks[name] = await metrics() })
    const initial = await metrics()
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    const payload = await page.evaluate(() => window.__benchStart())
    failOnErrors()
    const mutations = await page.evaluate(() => window.__appMutations)
    if (mutations < 100) throw Error(`${mode}: only ${mutations} mutations happened during the run, the page did not live`)
    const end = marks.end ?? await metrics()
    const start = marks.start ?? initial
    return { ...delta(end, start), fps: payload.fps, frames: payload.frames, p95Ms: payload.p95Ms, framesOver25ms: payload.framesOver25ms, heapMB: payload.heapMB, mutations }
  } finally { await context.close() }
}

const raw = Object.fromEntries(MODES.map(m => [m, []]))
const gates = []
try {
  for (let run = 0; run < RUNS; run++) {
    const order = run % 2 ? [...MODES].reverse() : MODES
    const baseline = await gate('default')
    if (!rendersMoved(baseline)) throw Error('default: nothing moved between scroll positions on the static page')
    const result = compareRender(baseline, await gate('scoped'))
    gates.push({ run, ...result })
    if (!result.ok) throw Error(describeMismatch('scoped', result))
    console.log(`run ${run + 1}/${RUNS}  gate ok (${result.compared} of ${result.total} settled elements equal)  order ${order.join(' > ')}`)
    for (const mode of order) {
      const r = await timed(mode)
      raw[mode].push(r)
      console.log(`  ${mode.padEnd(8)} task ${r.taskMs}ms  script ${r.scriptMs}ms  style ${r.recalcMs}ms  layout ${r.layoutMs}ms  fps ${r.fps}  p95 ${r.p95Ms}ms  >25ms ${r.framesOver25ms}  mutations ${r.mutations}`)
    }
  }
} finally {
  await browser.close()
  server.close()
}

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : +((s[s.length / 2 - 1] + s[s.length / 2]) / 2).toFixed(1) }
const summary = Object.fromEntries(MODES.map(m => [m, Object.fromEntries(['taskMs', 'scriptMs', 'recalcMs', 'layoutMs', 'fps', 'p95Ms', 'framesOver25ms', 'heapMB'].map(k => [k, median(raw[m].map(r => r[k]))]))]))
const out = { meta: { date: new Date().toISOString(), runs: RUNS, rules: RULES, page: 'app-shaped (generated by app-shaped.mjs)', note: 'CPU ms over the 12-second scripted scroll with the page mutating; medians of the runs, order rotated' }, gates, summary, raw }
mkdirSync(join(root, 'bench', 'results'), { recursive: true })
writeFileSync(join(root, 'bench', 'results', 'app-shaped.json'), JSON.stringify(out, null, 2))
const span = (m, k) => `${summary[m][k]} (${Math.min(...raw[m].map(r => r[k]))}–${Math.max(...raw[m].map(r => r[k]))})`
console.log('\n| mode | task total | script | style recalc | layout | fps | p95 | frames >25ms | heap |')
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|')
for (const m of MODES) console.log(`| ${m} | ${span(m, 'taskMs')} ms | ${summary[m].scriptMs} ms | ${span(m, 'recalcMs')} ms | ${summary[m].layoutMs} ms | ${summary[m].fps} | ${summary[m].p95Ms} ms | ${summary[m].framesOver25ms} | ${summary[m].heapMB} MB |`)
console.log('written to bench/results/app-shaped.json')
