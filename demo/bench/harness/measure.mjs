#!/usr/bin/env node
/**
 * Reproducible benchmark runner for the /bench/ pages. Serves the demo
 * statically, drives each engine page in headless Chrome via CDP, waits for
 * the page's own DONE payload (frame stats), then reads
 * Performance.getMetrics for the CPU split the in-page runner cannot see.
 *
 *   npm i && npm run measure                # full suite, 3 runs each
 *   node measure.mjs --runs=5 --throttle=4  # more runs, 4x CPU throttle
 *   node measure.mjs --scenarios=deep       # just the deep-DOM curve
 *
 * Chrome path: env CHROME, else the default macOS install.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { measureSizes, GSAP_KB } from '../../../scripts/docs-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..') // demo/
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => (a.startsWith('--') ? a.slice(2).split('=') : [a, true]))
)
const RUNS = Number(args.runs ?? 3)
const THROTTLE = Number(args.throttle ?? 1)
const WHICH = (args.scenarios || 'main,deep,gallery').split(',')
if (!Number.isInteger(RUNS) || RUNS < 1 || !Number.isFinite(THROTTLE) || THROTTLE < 1 || WHICH.some(s => !['main', 'deep', 'gallery', 'rail', 'rail-local', 'casework', 'casework-boundary', 'casework-aa', 'casework-pin', 'slider-seek', 'slider-outputs', 'slider-api', 'slider-glide', 'home', 'main-style', 'main-style-confirm', 'main-style-waapi', 'main-style-callback', 'main-style-css'].includes(s)))
  throw new Error('Use a positive integer --runs, --throttle >= 1 and --scenarios=main,deep,gallery,rail,rail-local,casework,casework-boundary,casework-aa,casework-pin,slider-seek,slider-outputs,slider-api,slider-glide,home,main-style,main-style-confirm,main-style-waapi,main-style-callback,main-style-css')
const CHROME =
  process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const server = createServer((req, res) => {
  const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
  try {
    res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream')
    res.end(readFileSync(path))
  } catch {
    res.statusCode = 404
    res.end('nope')
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/bench/`

const SCENARIOS = []
if (WHICH.includes('main-style-css'))
  for (const [name, params] of [['900', 's=60&p=15'], ['deep-50', 's=30&p=5&deep=50']])
    SCENARIOS.push({ name:`main-style-css-${name}`, params, balanced:true, engines:['style-baseline-off.html', 'style-hint-off.html', 'style-transform-off.html'] })
if (WHICH.includes('main-style-callback'))
  for (const [name, params] of [['900', 's=60&p=15'], ['deep-20', 's=30&p=5&deep=20'], ['deep-50', 's=30&p=5&deep=50']])
    SCENARIOS.push({ name:`main-style-callback-${name}`, params, balanced:true, engines:['style-baseline-off.html', 'style-direct-clocks-off.html', 'style-direct-off.html'] })
if (WHICH.includes('main-style-waapi'))
  SCENARIOS.push({ name:'main-style-waapi-900', params:'s=60&p=15', engines:['style-baseline.html', 'style-direct-clocks.html', 'style-waapi.html', 'style-baseline-off.html', 'style-direct-clocks-off.html', 'style-waapi-off.html'] })
if (WHICH.includes('main-style-confirm'))
  SCENARIOS.push({ name:'main-style-confirm-900', params:'s=60&p=15', engines:['style-baseline.html', 'style-direct-clocks.html', 'style-baseline-off.html', 'style-direct-clocks-off.html', 'gsap-batched.html', 'framer.html'] })
if (WHICH.includes('main-style'))
  SCENARIOS.push({ name:'main-style-900', params:'s=60&p=15', engines:['style-baseline.html', 'style-typed.html', 'style-direct.html', 'style-visibility.html', 'style-baseline-off.html', 'style-direct-off.html'] })
if (WHICH.includes('home'))
  SCENARIOS.push({ name:'home-page', params:'', engines:['home-on.html', 'home-off.html'] })
if (WHICH.includes('main'))
  SCENARIOS.push({
    name: 'main-900',
    params: 's=60&p=15',
    engines: ['scrollvars.html', 'scrollvars-local.html', 'gsap.html', 'gsap-batched.html', 'framer.html'],
  })
if (WHICH.includes('deep'))
  for (const deep of [5, 20, 50])
    SCENARIOS.push({
      name: `deep-${deep}`,
      params: `s=30&p=5&deep=${deep}`,
      engines: ['scrollvars.html', 'scrollvars-local.html', 'gsap-batched.html'],
    })
if (WHICH.includes('gallery'))
  for (const slug of ['hero-cinematic', 'timeline-scrub', 'sticky-steps', 'stats-countup', 'case-study-rail', 'editorial-manifesto'])
    SCENARIOS.push({ name: `gallery-${slug}`, params: '', engines: [`../fx/${slug}.html`] })
if (WHICH.includes('rail'))
  for (const deep of [5, 50, 200])
    SCENARIOS.push({ name:`rail-${deep}`, params:`deep=${deep}`, engines:['rail.html', 'rail-direct.html'] })
if (WHICH.includes('rail-local'))
  for (const deep of [5, 50, 200])
    SCENARIOS.push({ name:`rail-local-${deep}`, params:`deep=${deep}`, engines:['rail.html', 'rail-direct.html', 'rail-local.html'] })
if (WHICH.some(s => s.startsWith('casework')))
  for (const rich of [0, 1])
    SCENARIOS.push({ name:`casework-${WHICH.includes('casework-pin') ? 'pin-' : ''}${rich ? 'rich' : 'standard'}`, params:`rich=${rich}${WHICH.includes('casework-pin') ? '&pin=1' : ''}`, engines:WHICH.includes('casework-aa') ? ['casework-css.html', 'casework-control.html'] : ['casework-css.html', 'casework-direct.html', ...(WHICH.includes('casework-boundary') ? ['casework-boundary.html'] : [])] })

if (WHICH.includes('slider-seek'))
  for (const count of [15, 120])
    SCENARIOS.push({ name:`slider-seek-${count}`, params:`count=${count}`, engines:['slider-seek.html', 'slider-guarded.html'] })

if (WHICH.includes('slider-outputs'))
  for (const count of [15, 120])
    SCENARIOS.push({ name:`slider-outputs-${count}`, params:`count=${count}&plain=1`, engines:['slider-plain.html', 'slider-no-outputs.html'] })

if (WHICH.includes('slider-api'))
  for (const count of [15, 120])
    SCENARIOS.push({ name:`slider-api-${count}`, params:`count=${count}&plain=1&api=1`, engines:['slider-api.html', 'slider-api-no-outputs.html'] })

if (WHICH.includes('slider-glide'))
  for (const count of [15, 120])
    SCENARIOS.push({ name:`slider-glide-${count}`, params:`count=${count}&plain=1&api=1&glide=1`, engines:['slider-api.html', 'slider-api-no-outputs.html'] })

// Under CPU throttle, headless-new never produces the first BeginFrame —
// rAF starves and the run hangs. The throttled profile launches headful
// with the window parked offscreen: real vsync frames, throttled CPU.
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: THROTTLE <= 1,
  args:
    THROTTLE > 1
      ? [
          // parked offscreen counts as occluded on macOS — these keep the
          // renderer producing real vsync frames anyway
          '--window-position=-3200,-3200',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-background-timer-throttling',
          '--mute-audio',
        ]
      : [],
})
const chromeVersion = await browser.version()

const metricKeys = { scriptMs: 'ScriptDuration', recalcMs: 'RecalcStyleDuration', layoutMs: 'LayoutDuration', taskMs: 'TaskDuration' }
const delta = (end, start) => Object.fromEntries(Object.entries(metricKeys).map(([key, metric]) => [key, Math.round((end[metric] - start[metric]) * 1000)]))
async function measureOnce(engine, params) {
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    const casework = engine.startsWith('casework-')
    const home = engine.startsWith('home-')
    const styleExperiment = engine.startsWith('style-')
    if (home) {
      await page.setViewport({ width:1400, height:900 })
      await page.evaluateOnNewDocument(() => {
        let seed = 12345
        Math.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296)
      })
    }
    if (casework) await page.setViewport({ width:1400, height:900 }) // active pin, not the small-screen flow fallback
    const cdp = await page.createCDPSession()
    let calibration = null
    if (THROTTLE > 1) {
      // Fixed work, consumed result: a slower CPU must take longer, not do less work.
      await page.goto('about:blank')
      const work = () => { const start = performance.now(); let n = 1; for (let i = 0; i < 20000000; i++) n = Math.imul(n ^ i, 1664525); window.calibrationResult = n; return performance.now() - start }
      await page.evaluate(work) // JIT warm-up
      const normal = await page.evaluate(work)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })
      const slowed = await page.evaluate(work)
      calibration = { normalMs: normal, slowedMs: slowed, ratio: slowed / normal }
    }
    await cdp.send('Performance.enable')
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
    const initial = await metrics()
    const marks = {}
    await page.exposeFunction('__benchMark', async name => { marks[name] = await metrics() })
    const local = engine === 'scrollvars-local.html'
    const direct = engine === 'rail-direct.html'
    const localized = engine === 'rail-local.html'
    const guardedSlider = engine === 'slider-guarded.html'
    const noOutputs = engine === 'slider-no-outputs.html' || engine === 'slider-api-no-outputs.html'
    const plainSlider = noOutputs || engine === 'slider-plain.html' || engine === 'slider-api.html'
    await page.goto(`${base}${home ? '../index.html' : casework ? '../fx/case-study-rail.html' : guardedSlider || plainSlider ? 'slider-seek.html' : local || styleExperiment ? 'scrollvars.html' : direct || localized ? 'rail.html' : engine}?${params}&harness=1${noOutputs ? '&outputs=off' : guardedSlider ? '&guarded=1' : local ? '&local=1' : direct ? '&mode=direct' : localized ? '&mode=localized' : ''}`, { waitUntil: 'load', timeout: 60000 })
    if (styleExperiment) {
      await page.addScriptTag({ url:`${base}main-style.js` })
      await page.evaluate(mode => mountMainStyleExperiment(mode), engine.slice(6, -5))
      await page.evaluate(() => __styleCheck())
    }
    if (home) {
      await page.evaluate(async enabled => {
        await document.fonts.ready
        SV.setPageOutputs(enabled)
      }, engine === 'home-on.html')
    }
    if (casework) {
      await page.addScriptTag({ url:`${base}casework.js` })
      await page.evaluate(engine => {
        window.stopCaseworkExperiment = mountCaseworkExperiment({ direct:engine === 'casework-direct.html', boundary:engine === 'casework-boundary.html', rich:new URLSearchParams(location.search).get('rich') === '1' })
      }, engine)
    }
    if (engine.startsWith('../fx/') || casework || home) {
      await page.addScriptTag({ url: `${base}runner.js` })
      await page.evaluate(label => {
        let range
        if (new URLSearchParams(location.search).get('pin') === '1') {
          const root = document.querySelector('.sv-casework > .sv')
          if (root.hasAttribute('data-sv-flow')) throw Error('Expected an active pin')
          const offset = parseFloat(getComputedStyle(root.querySelector('.sv-stage')).top) || 0
          const from = scrollY + root.getBoundingClientRect().top - offset
          range = { from, to:from + root.offsetHeight - innerHeight + offset }
          scrollTo(0, from)
        }
        return runBench(label, range)
      }, casework ? 'CaseStudyRail' : engine)
    }
    await page.waitForFunction(() => typeof window.__benchStart === 'function')
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.evaluate(() => {
      if (window.__railAudit) Object.assign(window.__railAudit, { callbacks:0, changes:0, min:1, max:0, last:null })
    })
    const payload = await page.evaluate(() => window.__benchStart())
    if (home) {
      const hasOutputs = await page.evaluate(() => document.documentElement.style.getPropertyValue('--sv-page') !== '')
      if (hasOutputs !== (engine === 'home-on.html')) throw Error('Home page-output configuration drifted')
    }
    const animation = await page.evaluate(() => window.__railAudit ?? null)
    const glide = await page.evaluate(() => window.__glideAudit ?? null)
    if (glide && (glide.commands.length !== 12 || glide.settled.length !== 12 || glide.settled.some(s => s.state.gliding || s.callback.gliding || Math.abs(s.state.progress - s.callback.progress) > .001)))
      throw Error('Incomplete or unsettled slider glide workload')
    return { ...payload, animation, ...(glide ? { glide } : {}), calibration, startup: delta(marks.start, initial), ...delta(marks.end, marks.start), heapMB: +(marks.end.JSHeapUsedSize / 1048576).toFixed(1) }
  } finally { await context.close() }
}

const median = xs => {
  const sorted = xs.slice().sort((a, b) => a - b), mid = Math.floor(xs.length / 2)
  return (sorted[Math.ceil(xs.length / 2) - 1] + sorted[mid]) / 2
}
const repo = join(root, '..')
const hash = path => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
const results = { meta: {
  date: new Date().toISOString(), chrome: chromeVersion, runs: RUNS, throttle: THROTTLE, host: process.platform,
  version: JSON.parse(readFileSync(join(repo, 'package.json'))).version,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' }).trim(),
  files: Object.fromEntries(['bench/runner.js', 'bench/scrollvars.html', 'bench/gsap.html', 'bench/gsap-batched.html', 'bench/framer.html', 'bench/harness/measure.mjs', 'fx/sv.js', 'fx/sv.css', ...(WHICH.some(s => s.startsWith('rail')) ? ['bench/rail.html'] : []), ...SCENARIOS.filter(s => s.name.startsWith('gallery-')).map(s => s.engines[0].slice(3))].map(path => [path, hash(path)])),
  coreGzipKB: measureSizes(repo).everything,
  competitors: { gsap: '3.15.0', gsapGzipKB: GSAP_KB, framerMotion: '11.18.2', react: '18.3.1' },
  metricWindow: '12-second workload only; startup recorded separately; no long frames filtered',
}, scenarios: [] }
if (WHICH.some(s => s.startsWith('main-style'))) results.meta.files['bench/main-style.js'] = hash('bench/main-style.js')
if (WHICH.includes('home')) results.meta.files['index.html'] = hash('index.html')
if (WHICH.some(s => s.startsWith('slider-')))
  for (const path of ['bench/slider-seek.html', 'bench/slider-original.js', 'bench/slider-guarded.js', 'bench/slider-no-outputs.js', 'bench/harness/slider-build.mjs']) results.meta.files[path] = hash(path)
if (WHICH.some(s => s.startsWith('casework')))
  for (const path of ['bench/casework.js', 'fx/case-study-rail.html']) results.meta.files[path] = hash(path)

for (const sc of SCENARIOS) {
  console.log(`\n== ${sc.name} (${sc.params}) · ${RUNS} runs each ==`)
  const raw = Object.fromEntries(sc.engines.map((e) => [e, []]))
  const measurementOrder = []
  for (let run = 0; run < RUNS; run++) {
    // rotate order every repetition so no engine always pays the cold cost
    const pool = sc.balanced && Math.floor(run / sc.engines.length) % 2 ? [...sc.engines].reverse() : sc.engines
    const order = pool.slice(run % pool.length).concat(pool.slice(0, run % pool.length))
    measurementOrder.push(order)
    for (const engine of order) {
      const r = await measureOnce(engine, sc.params)
      raw[engine].push(r)
      console.log(`  ${engine.padEnd(20)} run ${run + 1}: script ${r.scriptMs}ms · recalc ${r.recalcMs}ms · task ${r.taskMs}ms · heap ${r.heapMB}MB · fps ${r.fps}`)
      if (r.animation) console.log(`    animation: ${r.animation.changes} progress changes / ${r.frames} runner frames; range ${r.animation.min.toFixed(4)}–${r.animation.max.toFixed(4)}`)
    }
  }
  const engines = {}
  for (const [engine, runs] of Object.entries(raw)) {
    engines[engine] = {
      scriptMs: median(runs.map((r) => r.scriptMs)),
      recalcMs: median(runs.map((r) => r.recalcMs)),
      layoutMs: median(runs.map((r) => r.layoutMs)),
      taskMs: median(runs.map((r) => r.taskMs)),
      heapMB: median(runs.map((r) => r.heapMB)),
      fps: median(runs.map((r) => r.fps)),
      p95Ms: median(runs.map((r) => r.p95Ms)),
      worstMs: median(runs.map(r => r.worstMs)),
      framesOver25ms: median(runs.map(r => r.framesOver25ms)),
      runs: runs.length,
      samples: runs,
    }
  }
  results.scenarios.push({ name: sc.name, params: sc.params, measurementOrder, engines })
}

await browser.close()
server.close()

const outDir = join(root, 'bench', 'results')
mkdirSync(outDir, { recursive: true })
const outName = args.out || (THROTTLE > 1 ? `throttled-${THROTTLE}x.json` : 'latest.json')
writeFileSync(join(outDir, outName), JSON.stringify(results, null, 2))
console.log(`\nwritten to bench/results/${outName}`)
for (const sc of results.scenarios) {
  console.log(`\n### ${sc.name}`)
  console.log('| engine | script | recalc | layout | task total | heap | fps | p95 |')
  console.log('|---|---|---|---|---|---|---|---|')
  for (const [e, m] of Object.entries(sc.engines))
    console.log(`| ${e.replace('.html', '')} | ${m.scriptMs}ms | ${m.recalcMs}ms | ${m.layoutMs}ms | ${m.taskMs}ms | ${m.heapMB}MB | ${m.fps} | ${m.p95Ms}ms |`)
}
