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
if (!Number.isInteger(RUNS) || RUNS < 1 || !Number.isFinite(THROTTLE) || THROTTLE < 1 || WHICH.some(s => !['main', 'deep', 'gallery', 'rail', 'rail-local'].includes(s)))
  throw new Error('Use a positive integer --runs, --throttle >= 1 and --scenarios=main,deep,gallery,rail,rail-local')
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
    await page.goto(`${base}${local ? 'scrollvars.html' : direct || localized ? 'rail.html' : engine}?${params}&harness=1${local ? '&local=1' : direct ? '&mode=direct' : localized ? '&mode=localized' : ''}`, { waitUntil: 'load', timeout: 60000 })
    if (engine.startsWith('../fx/')) {
      await page.addScriptTag({ url: `${base}runner.js` })
      await page.evaluate(label => runBench(label), engine)
    }
    await page.waitForFunction(() => typeof window.__benchStart === 'function')
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const payload = await page.evaluate(() => window.__benchStart())
    return { ...payload, calibration, startup: delta(marks.start, initial), ...delta(marks.end, marks.start), heapMB: +(marks.end.JSHeapUsedSize / 1048576).toFixed(1) }
  } finally { await context.close() }
}

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
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
  metricWindow: 'scroll only; startup recorded separately; no long frames filtered',
}, scenarios: [] }

for (const sc of SCENARIOS) {
  console.log(`\n== ${sc.name} (${sc.params}) · ${RUNS} runs each ==`)
  const raw = Object.fromEntries(sc.engines.map((e) => [e, []]))
  for (let run = 0; run < RUNS; run++) {
    // rotate order every repetition so no engine always pays the cold cost
    const order = sc.engines.slice(run % sc.engines.length).concat(sc.engines.slice(0, run % sc.engines.length))
    for (const engine of order) {
      const r = await measureOnce(engine, sc.params)
      raw[engine].push(r)
      console.log(`  ${engine.padEnd(20)} run ${run + 1}: script ${r.scriptMs}ms · recalc ${r.recalcMs}ms · task ${r.taskMs}ms · heap ${r.heapMB}MB · fps ${r.fps}`)
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
  results.scenarios.push({ name: sc.name, params: sc.params, engines })
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
