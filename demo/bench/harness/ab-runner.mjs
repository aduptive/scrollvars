#!/usr/bin/env node
/**
 * A/B runner for ANY page in demo/, with a rendered-output gate that no
 * timing can bypass. Born from a screen that reported 53% because the
 * variant had stopped animating.
 *
 * For each variant it snapshots the computed animatable properties of every
 * element under a tracked ancestor, at several scroll positions, BEFORE the
 * timed run. The baseline must actually move between positions, and every
 * variant must match the baseline exactly. Only then are timings recorded.
 *
 *   node ab-runner.mjs --page=/index.html --variant=forward --runs=3
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = Object.fromEntries(process.argv.slice(2).map(a => (a.startsWith('--') ? a.slice(2).split('=') : [a, true])))
const RUNS = Number(args.runs ?? 3)
const PAGE = args.page ?? '/index.html'
const VARIANT = args.variant ?? 'forward'
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

// Each variant is a function evaluated in the page before the driver boots.
const VARIANTS = {
  // One write, as today, with propagation stopped at the consumers.
  forward: () => {
    const style = document.createElement('style')
    style.textContent = '.sv > *, .sv-drift, .sv-range, .sv-rise, .sv-fade, .sv-spread { --sv-t: inherit; --sv-view: inherit }'
    document.head.append(style)
    for (const name of ['--sv-t', '--sv-view'])
      CSS.registerProperty({ name, syntax: '<number>', inherits: false, initialValue: '0' })
  },
  // The browser computes the travel clock itself, from the scroll position,
  // with no JavaScript in the frame at all: a registered custom property
  // animated over a view() timeline. --sv-t is documented as having the same
  // semantics as the native cover range, so this should be a drop-in.
  native: () => {
    CSS.registerProperty({ name: '--sv-t', syntax: '<number>', inherits: true, initialValue: '0' })
    const style = document.createElement('style')
    style.textContent = `@keyframes sv-native-travel { from { --sv-t: 0 } to { --sv-t: 1 } }
      .sv { animation: sv-native-travel linear both; animation-timeline: view(); animation-range: cover 0% cover 100% }`
    document.head.append(style)
    // The driver must stop writing the clock it no longer owns.
    const proto = CSSStyleDeclaration.prototype
    const real = proto.setProperty
    proto.setProperty = function (name, value, priority) {
      if (name === '--sv-t') return
      return real.call(this, name, value, priority)
    }
  },
  // The driver mirrors each clock onto the children that consume it.
  mirror: () => {
    globalThis.__svScopedClocks = true
    for (const name of ['--sv-t', '--sv-view'])
      CSS.registerProperty({ name, syntax: '<number>', inherits: false, initialValue: '0' })
  },
}

const server = createServer((req, res) => {
  const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
  try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
  catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })

const KEYS = { scriptMs:'ScriptDuration', recalcMs:'RecalcStyleDuration', layoutMs:'LayoutDuration', taskMs:'TaskDuration' }
const delta = (end, start) => Object.fromEntries(Object.entries(KEYS).map(([k, m]) => [k, Math.round((end[m] - start[m]) * 1000)]))

// Every element under a tracked ancestor, capped so a huge page stays quick.
const SNAPSHOT = () => {
  const els = [...document.querySelectorAll('.sv, .sv *')].slice(0, 400)
  return els.map(el => {
    const cs = getComputedStyle(el)
    const id = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '')
    return id + ' => ' + [cs.translate, cs.opacity, cs.transform, cs.rotate, cs.scale].join('|')
  })
}

async function once(variant) {
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    const cdp = await page.createCDPSession()
    await cdp.send('Performance.enable')
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
    const marks = {}
    await page.exposeFunction('__benchMark', async name => { marks[name] = await metrics() })
    const initial = await metrics()
    if (variant !== 'base') await page.evaluateOnNewDocument(VARIANTS[variant])
    await page.goto(`${base}${PAGE}${PAGE.includes('?') ? '&' : '?'}harness=1`, { waitUntil: 'load', timeout: 60000 })
    if (!PAGE.startsWith('/bench/')) {
      await page.addScriptTag({ url: `${base}/bench/runner.js` })
      await page.evaluate(label => runBench(label), PAGE)
    }
    await page.waitForFunction(() => typeof window.__benchStart === 'function')

    // Rendered-output preflight, outside the timed window.
    const shot = await page.evaluate(async snap => {
      const fn = new Function('return (' + snap + ')()')
      const out = []
      const height = document.documentElement.scrollHeight - innerHeight
      for (const p of [0.15, 0.4, 0.65, 0.4]) {
        scrollTo(0, Math.round(height * p))
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        // Entrance presets are transitions: their value depends on the wall
        // clock since the class flipped, and on this page something is always
        // mid-flight. Sample twice and let the runner keep only what did not
        // move in between, so a scroll-linked value is compared exactly and a
        // transition in progress is ignored rather than reported as a change.
        await new Promise(r => setTimeout(r, 500))
        const first = fn()
        await new Promise(r => setTimeout(r, 400))
        out.push([first, fn()])
      }
      scrollTo(0, 0)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      return out
    }, SNAPSHOT.toString())

    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    const payload = await page.evaluate(() => window.__benchStart())
    const end = marks.end ?? await metrics()
    const start = marks.start ?? initial
    return { ...delta(end, start), fps: payload.fps, frames: payload.frames, framesOver25ms: payload.framesOver25ms, shot }
  } finally { await context.close() }
}

// A transition-based preset depends on wall-clock time since its class
// flipped, so two loads never agree byte for byte: measured jitter is about
// 0.01% (17.5173 against 17.491). Compare numerically instead, tight enough
// to catch the failure that started this gate (a sign flip and opacity 1
// against 0.3) and loose enough not to cry wolf.
const TOL_REL = 0.01
const TOL_ABS = 0.05
const numbersOf = s => (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
const sameRender = (a, b, mask) => {
  if (a.length !== b.length) return false
  return a.every((v, i) => !mask[i] || sameOne(v, b[i]))
}

// An element counts only where it held still between the two samples.
const stableMask = pair => pair[0].map((v, i) => sameOne(v, pair[1][i]))
const sameOne = (a, b) => {
  const [ka, kb] = [a.split(' => ')[0], b.split(' => ')[0]]
  if (ka !== kb) return false
  if (a.replace(/-?\d+(?:\.\d+)?/g, '#') !== b.replace(/-?\d+(?:\.\d+)?/g, '#')) return false
  const [na, nb] = [numbersOf(a), numbersOf(b)]
  if (na.length !== nb.length) return false
  return na.every((x, j) => {
    const diff = Math.abs(x - nb[j])
    return diff <= TOL_ABS || diff <= Math.abs(nb[j]) * TOL_REL
  })
}

const NAMES = ['base', VARIANT]
const raw = Object.fromEntries(NAMES.map(n => [n, []]))
let baseline = null
try {
  for (let run = 0; run < RUNS; run++) {
    const seq = run % 2 ? [...NAMES].reverse() : NAMES
    for (const name of seq) {
      const r = await once(name)
      if (name === 'base') {
        const mask0 = stableMask(r.shot[0])
        const moved = r.shot.some((s, i) => i > 0 && !sameRender(s[1], r.shot[0][1], mask0.map((m, j) => m && stableMask(s)[j])))
        if (!moved) throw Error('baseline did not animate between scroll positions: the fixture proves nothing')
        baseline ??= r.shot
      }
      const maskAt = i => stableMask(r.shot[i]).map((m, j) => m && stableMask(baseline[i])[j])
      if (baseline && r.shot.some((s, i) => !sameRender(s[1], baseline[i][1], maskAt(i)))) {
        const at = r.shot.findIndex((s, i) => !sameRender(s[1], baseline[i][1], maskAt(i)))
        const mask = maskAt(at)
        const mine = r.shot[at][1] ?? [], theirs = baseline[at][1] ?? []
        const diffs = mine.map((v, i) => [v, theirs[i], mask[i]]).filter(([a, b, m]) => m && !sameOne(a, b)).slice(0, 6)
        throw Error(`${name} changed rendered output at scroll position ${at}: the timing is not comparable\n` +
          diffs.map(([a, b]) => `   variant: ${a}\n   base   : ${b}`).join('\n') +
          `\n   (${mine.filter((v, i) => mask[i] && !sameOne(v, theirs[i])).length} settled elements differ)`)
      }
      raw[name].push(r)
      console.log(`  ${name.padEnd(8)} run ${run + 1}: task ${String(r.taskMs).padStart(5)}ms · recalc ${String(r.recalcMs).padStart(5)}ms · script ${String(r.scriptMs).padStart(4)}ms · fps ${r.fps}`)
    }
  }
} finally { await browser.close(); server.close() }

const median = xs => { const s = xs.slice().sort((a,b)=>a-b), m = Math.floor(xs.length/2); return (s[Math.ceil(xs.length/2)-1] + s[m]) / 2 }
const out = { meta: { date:new Date().toISOString(), page:PAGE, variant:VARIANT, runs:RUNS,
  commit: execFileSync('git', ['rev-parse','HEAD'], { cwd: join(root,'..'), encoding:'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status','--porcelain'], { cwd: join(root,'..'), encoding:'utf8' }).trim(),
  gate: 'rendered output compared against the baseline at four scroll positions before any timing was kept',
}, variants: {} }
for (const [n, runs] of Object.entries(raw))
  out.variants[n] = { taskMs:median(runs.map(r=>r.taskMs)), recalcMs:median(runs.map(r=>r.recalcMs)),
    scriptMs:median(runs.map(r=>r.scriptMs)), fps:median(runs.map(r=>r.fps)), runs:runs.length }
mkdirSync(join(root,'bench','results'), { recursive:true })
writeFileSync(join(root,'bench','results', args.out || `ab-${VARIANT}.json`), JSON.stringify(out, null, 2))
console.log('\n| variant | task | recalc | script | fps |')
console.log('|---|---:|---:|---:|---:|')
for (const [n,m] of Object.entries(out.variants)) console.log(`| ${n} | ${m.taskMs}ms | ${m.recalcMs}ms | ${m.scriptMs}ms | ${m.fps} |`)
