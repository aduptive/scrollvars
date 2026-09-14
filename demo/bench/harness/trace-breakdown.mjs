#!/usr/bin/env node
/**
 * Where does the main-thread time go during the 12-second workload?
 *
 * Performance.getMetrics gives script, style and layout as three numbers and
 * a task total that is much larger than their sum: on sticky-steps 267ms of
 * task against 47ms of script and 91ms of style. This records a devtools
 * timeline trace of ONE timed load and buckets the top-level trace events
 * by name, so the remainder has a name too (paint, compositing, hit test,
 * the scroll itself, GC, ...). Diagnostic: tracing has its own overhead, so
 * the numbers are for proportions, never to be compared with untraced runs.
 *
 *   node trace-breakdown.mjs --page=/fx/sticky-steps.html
 *   node trace-breakdown.mjs --page='/bench/scrollvars.html?s=30&p=5&deep=50'
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  if (!a.startsWith('--')) return [a, true]
  const eq = a.indexOf('=')
  return eq < 0 ? [a.slice(2), true] : [a.slice(2, eq), a.slice(eq + 1)]
}))
const PAGE = args.page ?? '/index.html'
if (/[?&][a-z]+(&|$)/.test(PAGE)) throw Error(`page query has a key with no value: ${PAGE}`)
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
console.log(`page ${PAGE}`)

const server = createServer((req, res) => {
  const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
  try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
  catch { res.statusCode = 404; res.end('nope') }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
if (!PAGE.startsWith('/bench/')) await page.setViewport({ width: 1400, height: 900 })
const pageErrors = []
page.on('pageerror', error => pageErrors.push(error.message))
await page.goto(`${base}${PAGE}${PAGE.includes('?') ? '&' : '?'}harness=1`, { waitUntil: 'load', timeout: 60000 })
if (!PAGE.startsWith('/bench/')) {
  await page.addScriptTag({ url: `${base}/bench/runner.js` })
  await page.evaluate(label => runBench(label), PAGE)
}
await page.waitForFunction(() => typeof window.__benchStart === 'function')

const cdp = await page.createCDPSession()
const events = []
cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value))
const done = new Promise(r => cdp.on('Tracing.tracingComplete', r))
// The legacy `categories` string: a traceConfig with excludedCategories ['*']
// alongside the includes came back with six milliseconds of events for a
// twelve-second workload, and the probe with this form came back full.
await cdp.send('Tracing.start', {
  transferMode: 'ReportEvents',
  categories: 'disabled-by-default-devtools.timeline,devtools.timeline,blink.user_timing',
})
await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
const payload = await page.evaluate(() => window.__benchStart())
await cdp.send('Tracing.end')
await done
await browser.close()
server.close()
if (pageErrors.length) throw Error(`the page raised ${pageErrors.length} error(s), first: ${pageErrors[0]}`)

// The page's renderer main thread: several processes carry a CrRendererMain
// (the page, about:blank, devtools); the one with the work is the one with
// the events, so take the busiest rather than the first.
const byThread = new Map()
for (const e of events) if (e.name === 'thread_name' && e.args?.name) byThread.set(`${e.pid}:${e.tid}`, e.args.name)
const mains = [...byThread.entries()].filter(([, name]) => name === 'CrRendererMain').map(([key]) => key)
const count = key => events.filter(e => `${e.pid}:${e.tid}` === key && typeof e.dur === 'number').length
const mainKey = mains.sort((a, b) => count(b) - count(a))[0]
const main = events.filter(e => `${e.pid}:${e.tid}` === mainKey && typeof e.dur === 'number')
console.log(`renderer main threads ${mains.length}, using the one with ${main.length} complete events`)

// Nest by time so a child's duration is not counted again inside its parent.
// Buckets: the deepest named event at each instant, approximated by summing
// self time = dur minus the dur of complete events nested inside it.
main.sort((a, b) => a.ts - b.ts || b.dur - a.dur)
const selfMs = new Map()
const stack = []
for (const e of main) {
  while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop()
  const parent = stack[stack.length - 1]
  if (parent) parent.child = (parent.child || 0) + e.dur
  stack.push(e)
}
for (const e of main) selfMs.set(e.name, (selfMs.get(e.name) || 0) + (e.dur - (e.child || 0)) / 1000)
const total = [...selfMs.values()].reduce((a, b) => a + b, 0)
const rows = [...selfMs.entries()].sort((a, b) => b[1] - a[1]).filter(([, ms]) => ms >= total * 0.005)

const out = { meta: { date: new Date().toISOString(), page: PAGE, frames: payload.frames, fps: payload.fps, note: 'self time per event name on CrRendererMain during one traced 12-second workload; tracing overhead included, proportions only' }, totalMs: Math.round(total), rows: rows.map(([name, ms]) => ({ name, ms: Math.round(ms), pct: +(100 * ms / total).toFixed(1) })) }
mkdirSync(join(root, 'bench', 'results'), { recursive: true })
const outName = args.out ? String(args.out) : `trace-${PAGE.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.json`
writeFileSync(join(root, 'bench', 'results', outName), JSON.stringify(out, null, 2))
console.log(`\nwritten to bench/results/${outName}   frames ${payload.frames}   main-thread self time ${Math.round(total)}ms`)
console.log('| event | self ms | share |')
console.log('|---|---:|---:|')
for (const r of out.rows) console.log(`| ${r.name} | ${r.ms} | ${r.pct}% |`)
