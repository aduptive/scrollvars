#!/usr/bin/env node
/**
 * What the page-outputs consumer watch costs on a page that MUTATES its DOM.
 * Every bench page holds still after load, which is how six rounds of screens
 * missed a rescan that serialized every rule of every stylesheet on each
 * frame that added an element (round 7 in README.md).
 *
 * A: the pure rescan, in page: iterate a linked sheet's rules, regex each
 *    cssText, for 1000, 5000 and 20000 rules.
 * B: end to end at 5000 rules and 5000 elements in the body: one element
 *    appended per frame for 120 frames, the driver in auto mode (watch alive,
 *    no consumer) against setPageOutputs(false), script time over the window.
 *
 *   node mutation-cost.mjs            # the checkout's demo/fx/sv.js
 *   SV=/path/to/sv.js node mutation-cost.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const here = dirname(fileURLToPath(import.meta.url))
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sv = readFileSync(process.env.SV || join(here, '..', '..', 'fx', 'sv.js'), 'utf8')
const out = { meta: { date: new Date().toISOString(), bundle: process.env.SV || 'demo/fx/sv.js', note: 'script ms over 120 frames, one element appended per frame; A is the pure rescan median of five' }, rescan: [], runs: [] }
const css = n => Array.from({ length: n }, (_, i) => `.k${i}{color:#123;padding:${i % 9}px}`).join('\n')
const html = (n, off) => `<!doctype html><link rel="stylesheet" href="/big.css?n=${n}">
<section data-sv style="min-height:200vh"><p>x</p></section><div id="host">${'<div class="k1"></div>'.repeat(5000)}</div>
<script>${off ? 'window.__off=1' : ''}</script><script src="/sv.js"></script>
<script>if (window.__off) SV.setPageOutputs(false)</script>`
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/big.css') { res.setHeader('content-type', 'text/css'); return res.end(css(+u.searchParams.get('n'))) }
  if (u.pathname === '/sv.js') { res.setHeader('content-type', 'text/javascript'); return res.end(sv) }
  res.setHeader('content-type', 'text/html'); res.end(html(+u.searchParams.get('n'), u.searchParams.has('off')))
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
page.on('pageerror', e => { console.error('pageerror', e.message); process.exitCode = 1 })

// A: pure rescan cost per sheet size
for (const n of [1000, 5000, 20000]) {
  await page.goto(`${base}/page.html?n=${n}&off`, { waitUntil: 'load' })
  const ms = await page.evaluate(() => {
    const re = /--sv-page(?![\w-])|--sv-v(?![\w-])/
    const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('big.css'))
    const t = []
    for (let k = 0; k < 5; k++) {
      const t0 = performance.now()
      let hit = false
      for (const r of Array.from(sheet.cssRules)) if (re.test(r.cssText)) hit = true
      t.push(performance.now() - t0)
    }
    return { rules: sheet.cssRules.length, median: t.sort((a, b) => a - b)[2].toFixed(2), first: t[0].toFixed(2) }
  })
  console.log(`A rescan of ${ms.rules} rules: median ${ms.median}ms`)
  out.rescan.push({ rules: ms.rules, medianMs: +ms.median })
}

// B: end to end at 5000 rules, one appended element per frame for 120 frames
const cdp = await page.createCDPSession()
await cdp.send('Performance.enable')
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
for (const round of [0, 1]) for (const off of [false, true]) {
  await page.goto(`${base}/page.html?n=5000${off ? '&off' : ''}`, { waitUntil: 'load' })
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)))
  const before = await metrics()
  const frames = await page.evaluate(() => new Promise(resolve => {
    const host = document.getElementById('host')
    let i = 0, worst = 0, last = performance.now()
    const tick = () => {
      const now = performance.now(); worst = Math.max(worst, now - last); last = now
      host.append(document.createElement('div'))
      if (++i < 120) requestAnimationFrame(tick); else resolve({ worst: worst.toFixed(1) })
    }
    requestAnimationFrame(tick)
  }))
  const after = await metrics()
  const d = k => ((after[k] - before[k]) * 1000).toFixed(0)
  console.log(`B round ${round} ${off ? 'setPageOutputs(false)' : 'auto (watch alive)   '}  task ${d('TaskDuration')}ms  script ${d('ScriptDuration')}ms  style ${d('RecalcStyleDuration')}ms  worst frame gap ${frames.worst}ms`)
  out.runs.push({ round, mode: off ? 'off' : 'auto', taskMs: +d('TaskDuration'), scriptMs: +d('ScriptDuration'), styleMs: +d('RecalcStyleDuration'), worstGapMs: +frames.worst })
}
await browser.close(); server.close()
mkdirSync(join(here, '..', 'results'), { recursive: true })
writeFileSync(join(here, '..', 'results', 'mutation-cost.json'), JSON.stringify(out, null, 2))
console.log('written to bench/results/mutation-cost.json')
