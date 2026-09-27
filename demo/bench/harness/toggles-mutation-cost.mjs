#!/usr/bin/env node
/**
 * What B5's document-scope MutationObserver (src/core/toggles.ts) costs on a
 * page that mutates its DOM: one `.sv-marquee-controlled` wrapper (a track
 * plus its pause button, the shape the observer's callback re-scans)
 * appended per frame, `toggles()` running unscoped on `document` the whole
 * time, script time over the window (same B-style measurement mutation-cost.mjs
 * uses for the page-outputs watch, CLAUDE.md's "a cost screen for anything
 * observer-driven needs a fixture that MUTATES").
 *
 *   node toggles-mutation-cost.mjs             # the checkout's demo/fx/sv.js
 *   SV=/path/to/sv.js node toggles-mutation-cost.mjs
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const here = dirname(fileURLToPath(import.meta.url))
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sv = readFileSync(process.env.SV || join(here, '..', '..', 'fx', 'sv.js'), 'utf8')

const html = `<!doctype html><body>
<script>${sv}</script>
<script>SV.toggles()</script>
</body>`
const server = createServer((_req, res) => { res.setHeader('content-type', 'text/html'); res.end(html) })
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
page.on('pageerror', (e) => { console.error('pageerror', e.message); process.exitCode = 1 })
const cdp = await page.createCDPSession()
await cdp.send('Performance.enable')
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))

for (const round of [0, 1]) {
  await page.goto(base, { waitUntil: 'load' })
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)))
  const before = await metrics()
  const frames = await page.evaluate(() => new Promise((resolve) => {
    let i = 0, worst = 0, last = performance.now()
    const tick = () => {
      const now = performance.now(); worst = Math.max(worst, now - last); last = now
      const wrap = document.createElement('div')
      wrap.className = 'sv-marquee-controlled'
      wrap.innerHTML = '<div class="sv-marquee-track"><span>x</span></div><button type="button" data-sv-toggle="sv-paused" data-sv-target=".sv-marquee-track"></button>'
      document.body.append(wrap)
      if (++i < 120) requestAnimationFrame(tick); else resolve({ worst: worst.toFixed(1) })
    }
    requestAnimationFrame(tick)
  }))
  const after = await metrics()
  const d = (k) => ((after[k] - before[k]) * 1000).toFixed(1)
  const perFrame = (Number(d('ScriptDuration')) / 120).toFixed(3)
  console.log(`round ${round}: 120 mutated frames  task ${d('TaskDuration')}ms  script ${d('ScriptDuration')}ms (${perFrame}ms/frame)  style ${d('RecalcStyleDuration')}ms  worst frame gap ${frames.worst}ms`)
}
await browser.close(); server.close()
