#!/usr/bin/env node
/**
 * Regenerates the measured tables on demo/bench/index.html from
 * demo/bench/results/latest.json (written by the harness). Same rule as the
 * demo inline blocks: the page is never hand-patched.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pagePath = join(root, 'demo', 'bench', 'index.html')
const results = JSON.parse(readFileSync(join(root, 'demo', 'bench', 'results', 'latest.json'), 'utf8'))

const label = (e) =>
  ({ 'scrollvars.html': 'scrollvars', 'gsap.html': 'gsap + ScrollTrigger (idiomatic, 1 trigger/box)', 'gsap-batched.html': 'gsap + ScrollTrigger (batched, 1 trigger/section)', 'framer.html': 'framer-motion (React)' })[e] ?? e

const main = results.scenarios.find((s) => s.name === 'main-900')
const deeps = results.scenarios.filter((s) => s.name.startsWith('deep-'))

let html = `<p class="sub">Measured by the committed harness (<a href="https://github.com/aduptive/scrollvars" style="color:#a78bfa"><code>demo/bench/harness</code></a>. Clone the repo,
<code>npm i && npm run measure</code>): headless Chrome ${results.meta.chrome.replace('HeadlessChrome/', '')},
median of ${results.meta.runs} runs, engine order rotated per repetition${results.meta.throttle > 1 ? `, ${results.meta.throttle}x CPU throttle (calibration verified)` : ''}.
Raw output: <a href="results/latest.json" style="color:#a78bfa">results/latest.json</a>.</p>
<table>
  <thead><tr><th>engine</th><th>JS script</th><th>style recalc</th><th>layout</th><th>task total</th><th>JS heap</th><th>fps</th></tr></thead>
  <tbody>
`
for (const [engine, m] of Object.entries(main.engines)) {
  html += `    <tr><td>${label(engine)}</td><td class="n">${m.scriptMs} ms</td><td class="n">${m.recalcMs} ms</td><td class="n">${m.layoutMs} ms</td><td class="n">${m.taskMs} ms</td><td class="n">${m.heapMB} MB</td><td class="n">${m.fps}</td></tr>\n`
}
html += `  </tbody>
</table>
<h2 style="font-size:15px; margin-top:18px;">The style-recalc curve <span style="color:#8f8ca6; font-weight:400;">(the honest cost of the CSS-variable mechanism)</span></h2>
<p class="sub">Every box gets a realistic subtree (<code>?deep=N</code> spans with distinct
selectors); vars written on the section invalidate it all. ScrollVars vs the batched GSAP
build, 150 boxes, medians:</p>
<table>
  <thead><tr><th>subtree size</th><th>ScrollVars recalc</th><th>gsap-batched recalc</th><th>ScrollVars script</th><th>gsap-batched script</th><th>sv heap</th><th>gsap heap</th></tr></thead>
  <tbody>
`
for (const sc of deeps) {
  const sv = sc.engines['scrollvars.html']
  const gs = sc.engines['gsap-batched.html']
  html += `    <tr><td>${sc.name.replace('deep-', '')} nodes/box</td><td class="n">${sv.recalcMs} ms</td><td class="n">${gs.recalcMs} ms</td><td class="n">${sv.scriptMs} ms</td><td class="n">${gs.scriptMs} ms</td><td class="n">${sv.heapMB} MB</td><td class="n">${gs.heapMB} MB</td></tr>\n`
}
html += `  </tbody>
</table>`

// low-end profile (headful + 4x CPU throttle) when measured
import { existsSync } from 'node:fs'
const throttledPath = join(root, 'demo', 'bench', 'results', 'throttled-4x.json')
if (existsSync(throttledPath)) {
  const th = JSON.parse(readFileSync(throttledPath, 'utf8'))
  const main4 = th.scenarios.find((s) => s.name === 'main-900')
  if (main4) {
    html += `
<h2 style="font-size:15px; margin-top:18px;">Low-end profile <span style="color:#8f8ca6; font-weight:400;">(4× CPU throttle, calibration verified. The phone your client actually has)</span></h2>
<table>
  <thead><tr><th>engine</th><th>JS script</th><th>style recalc</th><th>task total</th><th>fps</th><th>p95 frame</th></tr></thead>
  <tbody>
`
    for (const [engine, m] of Object.entries(main4.engines)) {
      html += `    <tr><td>${label(engine)}</td><td class="n">${m.scriptMs} ms</td><td class="n">${m.recalcMs} ms</td><td class="n">${m.taskMs} ms</td><td class="n">${m.fps}</td><td class="n">${m.p95Ms} ms</td></tr>\n`
    }
    html += `  </tbody>
</table>
<p class="sub">Raw: <a href="results/throttled-4x.json" style="color:#a78bfa">results/throttled-4x.json</a>.</p>`
  }
}

const page = readFileSync(pagePath, 'utf8')
const re = /<!-- measured:start -->[\s\S]*?<!-- measured:end -->/
if (!re.test(page)) throw new Error('measured markers not found in bench/index.html')
writeFileSync(pagePath, page.replace(re, `<!-- measured:start -->\n${html}\n<!-- measured:end -->`))
console.log('bench tables regenerated from results/latest.json')
