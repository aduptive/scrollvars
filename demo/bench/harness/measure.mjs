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

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..') // demo/
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => (a.startsWith('--') ? a.slice(2).split('=') : [a, true]))
)
const RUNS = +args.runs || 3
const THROTTLE = +args.throttle || 1
const WHICH = (args.scenarios || 'main,deep').split(',')
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
    engines: ['scrollvars.html', 'gsap.html', 'gsap-batched.html', 'framer.html'],
  })
if (WHICH.includes('deep'))
  for (const deep of [5, 20, 50])
    SCENARIOS.push({
      name: `deep-${deep}`,
      params: `s=30&p=5&deep=${deep}`,
      engines: ['scrollvars.html', 'gsap-batched.html'],
    })

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

async function measureOnce(page_, params) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const cdp = await page.createCDPSession()
  await cdp.send('Performance.enable')
  let calibration = 1
  if (THROTTLE > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })
    // verify the throttle actually applies: a 100ms page-side spin should
    // take ~100ms * THROTTLE of wall time
    await page.goto('about:blank')
    const wall0 = Date.now()
    await page.evaluate(() => {
      const t = performance.now()
      while (performance.now() - t < 100);
    })
    calibration = (Date.now() - wall0) / 100
  }
  await page.goto(`${base}${page_}?${params}&force=1`, { waitUntil: 'load', timeout: 60000 })
  const deadline = Date.now() + 120000
  let payload = null
  while (Date.now() < deadline) {
    const title = await page.title()
    if (title.startsWith('DONE ')) {
      payload = JSON.parse(title.slice(5))
      break
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!payload) throw new Error(`timeout waiting for DONE on ${page_}?${params}`)
  const { metrics } = await cdp.send('Performance.getMetrics')
  const m = Object.fromEntries(metrics.map(({ name, value }) => [name, value]))
  await context.close()
  return {
    ...payload,
    calibration: +calibration.toFixed(2),
    scriptMs: Math.round(m.ScriptDuration * 1000),
    recalcMs: Math.round(m.RecalcStyleDuration * 1000),
    layoutMs: Math.round(m.LayoutDuration * 1000),
    taskMs: Math.round(m.TaskDuration * 1000),
    heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1),
  }
}

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const results = { meta: { date: new Date().toISOString(), chrome: chromeVersion, runs: RUNS, throttle: THROTTLE, host: process.platform }, scenarios: [] }

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
      runs: runs.length,
    }
  }
  results.scenarios.push({ name: sc.name, params: sc.params, engines })
}

await browser.close()
server.close()

const outDir = join(root, 'bench', 'results')
mkdirSync(outDir, { recursive: true })
const outName = THROTTLE > 1 ? `throttled-${THROTTLE}x.json` : 'latest.json'
writeFileSync(join(outDir, outName), JSON.stringify(results, null, 2))
console.log(`\nwritten to bench/results/${outName}`)
for (const sc of results.scenarios) {
  console.log(`\n### ${sc.name}`)
  console.log('| engine | script | recalc | layout | task total | heap | fps | p95 |')
  console.log('|---|---|---|---|---|---|---|---|')
  for (const [e, m] of Object.entries(sc.engines))
    console.log(`| ${e.replace('.html', '')} | ${m.scriptMs}ms | ${m.recalcMs}ms | ${m.layoutMs}ms | ${m.taskMs}ms | ${m.heapMB}MB | ${m.fps} | ${m.p95Ms}ms |`)
}
