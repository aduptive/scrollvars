#!/usr/bin/env node
/**
 * Diagnostic: deep DOM is where the library loses to GSAP, and all of the
 * excess is style recalculation. Section clocks inherit into animated boxes
 * and their text subtrees. Registration alone breaks the boxes' animation;
 * the visual preflight must reject that variant before accepting timings.
 *
 * Same page, same 12s path:
 *   base       untouched
 *   scoped     the clocks registered inherits:false AND mirrored onto the consuming children
 *
 * The second variant writes exactly what the first writes; only the
 * invalidation scope changes. This is not an equivalent workload unless the
 * visual gate passes. Not a shipped change.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'
import { assertClockEquivalence } from './clock-equivalence.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = Object.fromEntries(process.argv.slice(2).map(a => (a.startsWith('--') ? a.slice(2).split('=') : [a, true])))
const RUNS = Number(args.runs ?? 4)
const PARAMS = args.params ?? 's=30&p=5&deep=50'
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

const server = createServer((req, res) => {
  const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
  try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
  catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/bench/`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const chromeVersion = await browser.version()

const KEYS = { scriptMs:'ScriptDuration', recalcMs:'RecalcStyleDuration', layoutMs:'LayoutDuration', taskMs:'TaskDuration' }
const delta = (end, start) => Object.fromEntries(Object.entries(KEYS).map(([k, m]) => [k, Math.round((end[m] - start[m]) * 1000)]))

async function once(variant) {
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    const cdp = await page.createCDPSession()
    await cdp.send('Performance.enable')
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
    const marks = {}
    await page.exposeFunction('__benchMark', async name => { marks[name] = await metrics() })
    const initial = await metrics()
    await page.goto(`${base}scrollvars.html?${PARAMS}&harness=1`, { waitUntil:'load', timeout:60000 })

    // Check the actual consumers at multiple positions before timing. A rAF
    // runner still reports 60fps when registration has frozen every box.
    const sampleMotion = () => page.evaluate(async () => {
      const box = document.querySelectorAll('.box')[40]
      if (!box) throw new Error('Clock preflight requires at least 41 boxes')
      const section = box.parentElement
      const top = section.getBoundingClientRect().top + scrollY
      const samples = []
      for (const offset of [-innerHeight / 2, 0, innerHeight / 2, 0]) {
        scrollTo(0, top + offset)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const cs = getComputedStyle(box)
        samples.push({ translate: cs.translate, opacity: cs.opacity })
      }
      return samples
    })
    const expected = await sampleMotion()
    if (new Set(expected.map(sample => JSON.stringify(sample))).size < 2)
      throw new Error('Clock baseline did not animate during preflight')

    if (variant === 'scoped')
      await page.evaluate(() => {
        // The consumers still receive the value: the driver mirrors it onto
        // the element children that read it. Only the invalidation scope
        // changes, so the preflight below must find identical rendering.
        globalThis.__svScopedClocks = true
        for (const name of ['--sv-t', '--sv-view'])
          CSS.registerProperty({ name, syntax:'<number>', inherits:false, initialValue:'0' })
      })

    const sample = await sampleMotion()
    assertClockEquivalence(expected, sample)
    await page.evaluate(() => scrollTo(0, 0))

    await page.waitForFunction(() => typeof window.__benchStart === 'function')
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    const payload = await page.evaluate(() => window.__benchStart())

    // Were the globals actually written (or actually suppressed)?
    const wrote = await page.evaluate(() => ({
      page: document.documentElement.style.getPropertyValue('--sv-page'),
      v: document.documentElement.style.getPropertyValue('--sv-v'),
    }))
    const end = marks.end ?? await metrics()
    const start = marks.start ?? initial
    return {
      ...delta(end, start),
      recalcCount: Math.round(end.RecalcStyleCount - start.RecalcStyleCount),
      layoutCount: Math.round(end.LayoutCount - start.LayoutCount),
      threadTimeMs: Math.round((end.ThreadTime - start.ThreadTime) * 1000),
      fps: payload.fps, frames: payload.frames, worstMs: payload.worstMs,
      framesOver25ms: payload.framesOver25ms, p95Ms: payload.p95Ms,
      wrote, sample, expected,
    }
  } finally { await context.close() }
}

const VARIANTS = ['base', 'scoped']
const raw = Object.fromEntries(VARIANTS.map(v => [v, []]))
const order = []
try {
  for (let run = 0; run < RUNS; run++) {
    const pool = Math.floor(run / VARIANTS.length) % 2 ? [...VARIANTS].reverse() : VARIANTS
    const seq = pool.slice(run % pool.length).concat(pool.slice(0, run % pool.length))
    order.push(seq)
    for (const v of seq) {
      const r = await once(v)
      raw[v].push(r)
      console.log(`  ${v.padEnd(10)} run ${run + 1}: task ${String(r.taskMs).padStart(5)}ms · recalc ${String(r.recalcMs).padStart(5)}ms · recalcs ${String(r.recalcCount).padStart(5)} · fps ${r.fps} · --sv-page="${r.wrote.page}"`)
    }
  }
} finally {
  await browser.close()
  server.close()
}

const median = xs => { const s = xs.slice().sort((a, b) => a - b), m = Math.floor(xs.length / 2); return (s[Math.ceil(xs.length / 2) - 1] + s[m]) / 2 }
const out = { meta: {
  date: new Date().toISOString(), chrome: chromeVersion, runs: RUNS, params: PARAMS,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: join(root, '..'), encoding:'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: join(root, '..'), encoding:'utf8' }).trim(),
  note: 'Diagnostic only. noinherit registers the per-element clocks with inherits:false; the writes are identical to base.',
}, order, variants: {} }
for (const [v, runs] of Object.entries(raw))
  out.variants[v] = {
    taskMs: median(runs.map(r => r.taskMs)), recalcMs: median(runs.map(r => r.recalcMs)),
    scriptMs: median(runs.map(r => r.scriptMs)), layoutMs: median(runs.map(r => r.layoutMs)),
    recalcCount: median(runs.map(r => r.recalcCount)), threadTimeMs: median(runs.map(r => r.threadTimeMs)),
    fps: median(runs.map(r => r.fps)), framesOver25ms: median(runs.map(r => r.framesOver25ms)),
    samples: runs,
  }
mkdirSync(join(root, 'bench', 'results'), { recursive: true })
writeFileSync(join(root, 'bench', 'results', args.out || 'clocks-cost.json'), JSON.stringify(out, null, 2))
console.log('\n| variant | task | recalc | recalcs | script | layout | fps |')
console.log('|---|---:|---:|---:|---:|---:|---:|')
for (const [v, m] of Object.entries(out.variants))
  console.log(`| ${v} | ${m.taskMs}ms | ${m.recalcMs}ms | ${m.recalcCount} | ${m.scriptMs}ms | ${m.layoutMs}ms | ${m.fps} |`)
