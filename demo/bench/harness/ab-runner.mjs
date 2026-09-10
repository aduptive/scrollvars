#!/usr/bin/env node
/**
 * A/B runner for ANY page in demo/, with a rendered-output gate that no
 * timing can bypass, and with every trap found so far closed by construction.
 *
 *   node ab-runner.mjs --page=/index.html --variant=scopedcss --runs=6
 *   node ab-runner.mjs --page='/bench/scrollvars.html?s=30&p=5&deep=50' \
 *        --variant=forward,scopedcss --forward=.box --runs=6
 *
 * Per configuration and per run:
 *   1. a GATE load: the variant is applied after `load` (document.head is
 *      null before the document exists), it must prove it applied, and the
 *      rendered output is snapshotted at four scroll positions and compared
 *      against the baseline's snapshot from the same run;
 *   2. a TIMED load, separate, so the timed page is as cold as the published
 *      one: no preflight scrolling, no latched entries, the variant applied
 *      the same way, then the page's own 12-second workload.
 * The frame count of every variant must match the baseline's within 2%: a
 * run that drops frames visits fewer scroll positions and looks cheaper.
 * Order rotates each run and reverses direction every round, so each
 * configuration follows each other one equally often; use 2 x (variants + 1)
 * runs or a multiple of it.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'
import { snapshotRender, compareRender, rendersMoved, describeMismatch } from './render-equivalence.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const SCOPED_CSS = readFileSync(join(root, '..', 'styles', 'scoped.css'), 'utf8')

// Split on the FIRST '=' only: a page URL carries its own '=' signs, and
// splitting on all of them once turned '?s=30&p=5&deep=50' into '?s'.
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  if (!a.startsWith('--')) return [a, true]
  const eq = a.indexOf('=')
  return eq < 0 ? [a.slice(2), true] : [a.slice(2, eq), a.slice(eq + 1)]
}))
const RUNS = Number(args.runs ?? 6)
const PAGE = args.page ?? '/index.html'
if (/[?&][a-z]+(&|$)/.test(PAGE)) throw Error(`page query has a key with no value: ${PAGE}`)
const VARIANT = String(args.variant ?? 'scopedcss')
// The author's side of the scoped-clocks contract: this page's own readers.
const FORWARD = args.forward ? String(args.forward) : ''
// Any further author-side CSS the page needs under the sheet, for instance a
// default on the tracked element replacing a `var(--sv-t, 1)` fallback that a
// registered property no longer honours.
const AUTHOR = args.author ? String(args.author) : ''
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

// Each variant: `apply` runs in the page after load, `verify` runs right
// after and must return true, or the run fails instead of measuring the
// untouched page under the variant's name.
const VARIANTS = {
  // Nothing at all: base against base, to learn what the gate and the timing
  // report when there is no difference. Run it before trusting a small one.
  noop: { apply: () => { window.__svNoop = true }, verify: () => window.__svNoop === true },
  // The real artifact: styles/scoped.css as shipped, plus this page's own
  // readers forwarded the way its author would.
  scopedcss: {
    apply: (css, forward, author) => {
      const style = document.createElement('style')
      style.textContent = css + (forward ? `\n${forward} { --sv-t: inherit; --sv-view: inherit; }` : '') + (author ? `\n${author}` : '')
      document.head.append(style)
    },
    // a registered non-inheriting property reads its initial value on <html>
    verify: () => getComputedStyle(document.documentElement).getPropertyValue('--sv-t') === '0',
  },
  // The same design through the JS API and a one-level forward to every child.
  forward: {
    apply: () => {
      const style = document.createElement('style')
      style.textContent = '.sv > *, .sv-drift, .sv-range { --sv-t: inherit; --sv-view: inherit }'
      document.head.append(style)
      for (const name of ['--sv-t', '--sv-view'])
        CSS.registerProperty({ name, syntax: '<number>', inherits: false, initialValue: '0' })
    },
    verify: () => getComputedStyle(document.documentElement).getPropertyValue('--sv-t') === '0',
  },
  // The browser computes the travel clock itself over a view() timeline.
  native: {
    apply: () => {
      CSS.registerProperty({ name: '--sv-t', syntax: '<number>', inherits: true, initialValue: '0' })
      const style = document.createElement('style')
      style.textContent = `@keyframes sv-native-travel { from { --sv-t: 0 } to { --sv-t: 1 } }
        .sv { animation: sv-native-travel linear both; animation-timeline: view(); animation-range: cover 0% cover 100% }`
      document.head.append(style)
      const real = CSSStyleDeclaration.prototype.setProperty
      CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
        if (name === '--sv-t') return
        return real.call(this, name, value, priority)
      }
    },
    verify: () => [...document.querySelectorAll('.sv')].some(el => getComputedStyle(el).animationName === 'sv-native-travel'),
  },
  // Hypothesis 2: CSS containment on tracked elements that are not pinned.
  // Not about inheritance: layout and paint containment let Blink skip the
  // subtree in layout and paint when only the element's own style changed.
  // The gate decides whether the clipping it implies changes the rendering.
  contain: {
    apply: () => {
      const style = document.createElement('style')
      style.textContent = '.sv:not([data-sv-pin]):not(:has(.sv-stage)) { contain: layout style paint; }'
      document.head.append(style)
      window.__svContain = true
    },
    // Chrome serializes `layout style paint` as the shorthand keyword `content`
    verify: () => window.__svContain === true && [...document.querySelectorAll('.sv')].some(el => /content|strict|layout/.test(getComputedStyle(el).contain)),
  },
  // 6a, the INVERSE screen: eleven more rules shaped like core.css's stagger
  // block, whose rightmost compound is an unqualified :nth-child() and so
  // sits in Blink's universal bucket, candidate-matched against every element
  // in a recalculation. If adding eleven does not move recalc, removing the
  // shipped eleven will not either.
  nthload: {
    apply: () => {
      const style = document.createElement('style')
      style.textContent = Array.from({ length: 11 }, (_, i) => `.sv-probe > :nth-child(${i + 1}) { --sv-probe: ${i}; }`).join('\n')
      document.head.append(style)
      window.__svNthLoad = true
    },
    verify: () => window.__svNthLoad === true && [...document.styleSheets].some(sheet => { try { return [...sheet.cssRules].some(r => r.selectorText?.includes('.sv-probe')) } catch { return false } }),
  },
  // 6b: the travel clock registered as a typed number that still inherits,
  // initial .5 to match the bench fixture's var(--sv-t, .5) fallback, so
  // resolution copies a number instead of re-parsing a token list.
  typed: {
    apply: () => {
      CSS.registerProperty({ name: '--sv-t', syntax: '<number>', inherits: true, initialValue: '0.5' })
      window.__svTyped = true
    },
    verify: () => window.__svTyped === true && getComputedStyle(document.documentElement).getPropertyValue('--sv-t') === '0.5',
  },
  // Skip the continuous view clock entirely.
  noview: {
    apply: () => {
      const real = CSSStyleDeclaration.prototype.setProperty
      CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
        if (name === '--sv-view') return
        return real.call(this, name, value, priority)
      }
      window.__svNoView = true
    },
    verify: () => window.__svNoView === true,
  },
}

const NAMES = ['base', ...VARIANT.split(',').map(v => v.trim()).filter(Boolean)]
for (const n of NAMES.slice(1)) if (!VARIANTS[n]) throw Error(`unknown variant ${n}; known: ${Object.keys(VARIANTS).join(', ')}`)
if (RUNS % (2 * NAMES.length)) console.warn(`runs=${RUNS} is not a multiple of ${2 * NAMES.length}: order is not fully balanced`)
console.log(`page ${PAGE}   configurations ${NAMES.join(', ')}   runs ${RUNS}${FORWARD ? `   forward ${FORWARD}` : ''}${AUTHOR ? `   author ${AUTHOR}` : ''}`)

const server = createServer((req, res) => {
  const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
  try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
  catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })

const KEYS = { scriptMs: 'ScriptDuration', recalcMs: 'RecalcStyleDuration', layoutMs: 'LayoutDuration', taskMs: 'TaskDuration' }
const delta = (end, start) => Object.fromEntries(Object.entries(KEYS).map(([k, m]) => [k, Math.round((end[m] - start[m]) * 1000)]))

async function open(variant) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  // Match the published methodology: bench pages at puppeteer's default
  // 800x600, only the site pages at the large viewport.
  if (!PAGE.startsWith('/bench/')) await page.setViewport({ width: 1400, height: 900 })
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${base}${PAGE}${PAGE.includes('?') ? '&' : '?'}harness=1`, { waitUntil: 'load', timeout: 60000 })
  if (!PAGE.startsWith('/bench/')) {
    await page.addScriptTag({ url: `${base}/bench/runner.js` })
    await page.evaluate(label => runBench(label), PAGE)
  }
  await page.waitForFunction(() => typeof window.__benchStart === 'function')
  if (variant !== 'base') {
    await page.evaluate(VARIANTS[variant].apply, variant === 'scopedcss' ? SCOPED_CSS : undefined, FORWARD, AUTHOR)
    if (!(await page.evaluate(VARIANTS[variant].verify))) throw Error(`${variant}: the variant did not apply, the run would have measured the untouched page`)
  }
  const failOnErrors = () => { if (pageErrors.length) throw Error(`${variant}: the page raised ${pageErrors.length} error(s), first: ${pageErrors[0]}`) }
  return { page, context, failOnErrors }
}

async function gate(variant) {
  const { page, context, failOnErrors } = await open(variant)
  try {
    const shot = await snapshotRender(page)
    failOnErrors()
    return shot
  } finally { await context.close() }
}

async function timed(variant) {
  const { page, context, failOnErrors } = await open(variant)
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
    const end = marks.end ?? await metrics()
    const start = marks.start ?? initial
    return { ...delta(end, start), fps: payload.fps, frames: payload.frames, framesOver25ms: payload.framesOver25ms, p95Ms: payload.p95Ms }
  } finally { await context.close() }
}

const raw = Object.fromEntries(NAMES.map(n => [n, []]))
const order = []
try {
  for (let run = 0; run < RUNS; run++) {
    const pool = Math.floor(run / NAMES.length) % 2 ? [...NAMES].reverse() : NAMES
    const seq = pool.slice(run % pool.length).concat(pool.slice(0, run % pool.length))
    order.push(seq)
    let baseline = null, baseFrames = null
    // the gate first, for every configuration of this run, against this run's baseline
    for (const name of ['base', ...seq.filter(n => n !== 'base')]) {
      const shot = await gate(name)
      if (name === 'base') {
        if (!rendersMoved(shot)) throw Error('baseline did not animate between scroll positions: the fixture proves nothing')
        baseline = shot
        continue
      }
      const result = compareRender(baseline, shot)
      if (!result.ok) throw Error(describeMismatch(name, result))
      if (run === 0) console.log(`  gate ${name}: ${result.compared} of ${result.total} sampled elements settled and equal, ${result.timeDependent} time-dependent excluded`)
    }
    // then the timed loads, in the balanced order
    for (const name of seq) {
      const r = await timed(name)
      if (name === 'base') baseFrames = r.frames
      else if (baseFrames && Math.abs(r.frames - baseFrames) > baseFrames * 0.02)
        throw Error(`${name}: ${r.frames} frames against the baseline's ${baseFrames}, the run did not do the same work`)
      raw[name].push(r)
      console.log(`  ${name.padEnd(9)} run ${run + 1}: task ${String(r.taskMs).padStart(5)}ms · recalc ${String(r.recalcMs).padStart(5)}ms · script ${String(r.scriptMs).padStart(4)}ms · frames ${r.frames} · fps ${r.fps}`)
    }
  }
} finally { await browser.close(); server.close() }

const median = xs => { const s = xs.slice().sort((a, b) => a - b), m = Math.floor(xs.length / 2); return (s[Math.ceil(xs.length / 2) - 1] + s[m]) / 2 }
const out = { meta: {
  date: new Date().toISOString(), page: PAGE, variants: NAMES.slice(1), forward: FORWARD, author: AUTHOR, runs: RUNS, order,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: join(root, '..'), encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: join(root, '..'), encoding: 'utf8' }).trim(),
  method: 'gate load then separate timed load per configuration per run; variant proved applied; frames within 2% of baseline; rotation reversed every round',
}, variants: {} }
for (const [n, runs] of Object.entries(raw))
  out.variants[n] = {
    taskMs: median(runs.map(r => r.taskMs)), recalcMs: median(runs.map(r => r.recalcMs)), scriptMs: median(runs.map(r => r.scriptMs)),
    frames: median(runs.map(r => r.frames)), fps: median(runs.map(r => r.fps)), runs: runs.length, samples: runs,
  }
mkdirSync(join(root, 'bench', 'results'), { recursive: true })
const outName = args.out ? String(args.out) : `ab-${VARIANT.replace(/,/g, '+')}.json`
writeFileSync(join(root, 'bench', 'results', outName), JSON.stringify(out, null, 2))
console.log(`\nwritten to bench/results/${outName}`)
console.log('| variant | task | recalc | script | frames | fps |')
console.log('|---|---:|---:|---:|---:|---:|')
for (const [n, m] of Object.entries(out.variants)) console.log(`| ${n} | ${m.taskMs}ms | ${m.recalcMs}ms | ${m.scriptMs}ms | ${m.frames} | ${m.fps} |`)
