#!/usr/bin/env node
/**
 * Regenerates the measured tables on demo/bench/index.html from
 * demo/bench/results/latest.json (written by the harness). Same rule as the
 * demo inline blocks: the page is never hand-patched.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { measureSizes, GSAP_KB } from './docs-data.mjs'
import { spliceOne } from './docs-stamp.mjs'

/**
 * Replaces every match of `re` in `text`, throwing unless the match count
 * is exactly `count`. A repeat is the intended shape here (the bench
 * page's runner config states the same bundle size in three engine
 * entries), so the caller states its own expected count instead of the
 * old "any count greater than zero" check: that check accepted PARTIAL
 * coverage, where one of the three matches breaks (a stray quote, an
 * anchor that moved) while the other two are silently rewritten and the
 * third is silently left stale, exit 0 either way (ADU-196 fix pass).
 */
export const spliceAll = (text, re, replacement, count, label) => {
  const globalRe = re.global ? re : new RegExp(re.source, `${re.flags}g`)
  const matches = (text.match(globalRe) || []).length
  if (matches !== count) throw new Error(`${label}: expected ${count} matches, found ${matches}`)
  return text.replace(globalRe, replacement)
}

// Everything below only runs when this script is executed directly, not
// when a test imports spliceAll above.
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pagePath = join(root, 'demo', 'bench', 'index.html')
const results = JSON.parse(readFileSync(join(root, 'demo', 'bench', 'results', 'latest.json'), 'utf8'))

const label = (e) =>
  ({ 'scrollvars.html': 'ScrollVars (page outputs on)', 'scrollvars-local.html': 'ScrollVars (page outputs off)', 'gsap.html': 'gsap + ScrollTrigger (idiomatic, 1 trigger/box)', 'gsap-batched.html': 'gsap + ScrollTrigger (batched, 1 trigger/section)', 'framer.html': 'framer-motion (React)' })[e] ?? e

const main = results.scenarios.find((s) => s.name === 'main-900')
const deeps = results.scenarios.filter((s) => s.name.startsWith('deep-'))

let html = `<p class="sub">Measured by the committed harness (<a href="https://github.com/aduptive/scrollvars" style="color:#a78bfa"><code>demo/bench/harness</code></a>. Clone the repo,
<code>npm i && npm run measure</code>): Chrome ${results.meta.chrome.replace('HeadlessChrome/', '')},
median of ${results.meta.runs} runs, engine order rotated per repetition${results.meta.throttle > 1 ? `, ${results.meta.throttle}x CPU throttle set through CDP, nominal` : ''}.
Measured ${results.meta.date}; package ${results.meta.version ?? "historical"}, commit ${results.meta.commit ?? "not recorded"}. Startup is separate; scroll intervals are never filtered. Raw runs and source hashes: <a href="results/latest.json" style="color:#a78bfa">results/latest.json</a>.</p>
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
selectors). Compare document-wide writes, local writes and batched GSAP:
150 boxes, medians:</p>
<table>
  <thead><tr><th>subtree size</th><th>engine</th><th>style recalc</th><th>JS script</th><th>task total</th><th>heap</th><th>fps</th></tr></thead>
  <tbody>
`
for (const sc of deeps) {
  for (const [engine, m] of Object.entries(sc.engines))
    html += `    <tr><td>${sc.name.replace('deep-', '')} nodes/box</td><td>${label(engine)}</td><td class="n">${m.recalcMs} ms</td><td class="n">${m.scriptMs} ms</td><td class="n">${m.taskMs} ms</td><td class="n">${m.heapMB} MB</td><td class="n">${m.fps}</td></tr>\n`
}
html += `  </tbody>
</table>`

// low-end profile (headful + 4x CPU throttle) when measured
const throttledPath = join(root, 'demo', 'bench', 'results', 'throttled-4x.json')
if (existsSync(throttledPath)) {
  const th = JSON.parse(readFileSync(throttledPath, 'utf8'))
  const main4 = th.scenarios.find((s) => s.name === 'main-900')
  if (main4) {
    html += `
<h2 style="font-size:15px; margin-top:18px;">Low-end profile <span style="color:#8f8ca6; font-weight:400;">(4× synthetic CPU throttle; not a physical phone)</span></h2>
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

const galleries = results.scenarios.filter(s => s.name.startsWith('gallery-'))
if (galleries.length) {
  html += '<h2>Real gallery sections (page outputs off)</h2><p class="sub">Each complete generated page, including gallery UI. These are workload checks, not competitor comparisons or device guarantees.</p><table><thead><tr><th>section</th><th>JS</th><th>style</th><th>task total</th><th>p95</th><th>worst</th><th>frames &gt;25ms</th></tr></thead><tbody>'
  for (const row of galleries) {
    const m = Object.values(row.engines)[0]
    html += `<tr><td>${row.name.slice(8)}</td><td>${m.scriptMs} ms</td><td>${m.recalcMs} ms</td><td>${m.taskMs} ms</td><td>${m.p95Ms} ms</td><td>${m.worstMs} ms</td><td>${m.framesOver25ms}</td></tr>`
  }
  html += '</tbody></table>'
}

const page = readFileSync(pagePath, 'utf8')
const re = /<!-- measured:start -->[\s\S]*?<!-- measured:end -->/
if (!re.test(page)) throw new Error('measured markers not found in bench/index.html')
writeFileSync(pagePath, page.replace(re, `<!-- measured:start -->\n${html}\n<!-- measured:end -->`))
console.log('bench tables regenerated from results/latest.json')

// ── the same numbers in README.md and AGENTS.md (markdown, between markers) ──
const sizes = measureSizes(root)
const measuredCore = results.meta.coreGzipKB ?? sizes.everything
const BUNDLES = { 'scrollvars.html': `${measuredCore} KB`, 'scrollvars-local.html': `${measuredCore} KB`, 'gsap.html': `${GSAP_KB} KB`, 'gsap-batched.html': `${GSAP_KB} KB`, 'framer.html': '46.9 KB (+ React)' }
const MD_LABEL = { 'scrollvars.html': 'ScrollVars (page outputs on)', 'scrollvars-local.html': 'ScrollVars (page outputs off)', 'gsap.html': 'gsap + ScrollTrigger (idiomatic)', 'gsap-batched.html': 'gsap + ScrollTrigger (batched, symmetric)', 'framer.html': 'framer-motion' }
const md = [`Measured ${results.meta.date}; package ${results.meta.version ?? 'historical'}, ${results.meta.runs} runs. Bundle and runtime measurements refer to this snapshot.`, '', '| engine | bundle (gzip) | JS script (12 s, 900 el) | style recalc | JS heap |', '|---|---|---|---|---|']
for (const [engine, m] of Object.entries(main.engines)) {
  const sv = engine === 'scrollvars.html'
  md.push(`| ${MD_LABEL[engine]} | ${BUNDLES[engine]} | ${m.scriptMs} ms | ${m.recalcMs} ms | ${sv ? `**${m.heapMB} MB**` : `${m.heapMB} MB`} |`)
}
for (const file of ['README.md', 'AGENTS.md']) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  const mre = /<!-- bench:start -->[\s\S]*?<!-- bench:end -->/
  if (!mre.test(text)) throw new Error(`bench markers not found in ${file}`)
  writeFileSync(path, text.replace(mre, () => `<!-- bench:start -->\n${md.join('\n')}\n<!-- bench:end -->`))
}
// the bench page's runner config carries the same measured bundle size
// (three engine entries share this cell shape, so an exact repeat is
// intended: a broken match on any one of them must throw, not silently
// leave that entry stale while the other two update, ADU-196 fix pass)
writeFileSync(pagePath, spliceAll(readFileSync(pagePath, 'utf8'), /(page: 'scrollvars\.html', bundle: ')[\d.]+ KB'/, `$1${sizes.everything} KB'`, 3, 'demo/bench/index.html: scrollvars.html bundle config line'))
// the bundle ratio in the prose is arithmetic on the same numbers, exactly
// one match expected per file (spliceOne, not spliceAll: an accidental
// second mention in either file must throw, not be double-patched)
const ratio = Math.round(GSAP_KB / parseFloat(sizes.everything))
for (const file of ['README.md', 'AGENTS.md']) {
  const path = join(root, file)
  writeFileSync(path, spliceOne(readFileSync(path, 'utf8'), /~\d+× less bundle/, `~${ratio}× less bundle`, `${file}: "less bundle" ratio sentence`))
}
console.log(`bench tables stamped (README, AGENTS, bench page; ScrollVars ${sizes.everything} KB gz, ~${ratio}× vs GSAP)`)

}
