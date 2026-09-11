#!/usr/bin/env node
/**
 * Regenerates the measured tables on demo/bench/index.html from
 * demo/bench/results/latest.json and a newer main-only snapshot. Same rule as the
 * demo inline blocks: the page is never hand-patched.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { measureSizes, GSAP_KB, readBenchResults } from './docs-data.mjs'
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
const { results, current, mainFile } = readBenchResults(root)

const label = (e) =>
  ({ 'scrollvars.html': 'ScrollVars', 'scrollvars-page.html': 'ScrollVars (document variables published)', 'scrollvars-scoped.html': 'ScrollVars + styles/scoped.css', 'scrollvars-local.html': 'ScrollVars (page outputs off)', 'gsap.html': 'gsap + ScrollTrigger (idiomatic, 1 trigger/box)', 'gsap-batched.html': 'gsap + ScrollTrigger (batched, 1 trigger/section)', 'framer.html': 'framer-motion (React)' })[e] ?? e

const main = current.scenarios.find((s) => s.name === 'main-900')
const deeps = results.scenarios.filter((s) => s.name.startsWith('deep-'))
const styleCost = m => {
  const values = m.samples?.map(run => run.recalcMs)
  return `${m.recalcMs} ms${values?.length ? ` (${Math.min(...values)}–${Math.max(...values)})` : ''}`
}

let html = `<p class="sub">Measured by the committed harness (<a href="https://github.com/aduptive/scrollvars" style="color:#a78bfa"><code>demo/bench/harness</code></a>. Clone the repo,
<code>cd demo/bench/harness &amp;&amp; npm i &amp;&amp; npm run measure</code>): Chrome ${current.meta.chrome.replace(/^(?:Headless)?Chrome\//, '')},
median of ${current.meta.runs} runs, engine order rotated per repetition${current.meta.throttle > 1 ? `, ${current.meta.throttle}x CPU throttle set through CDP, nominal` : ''}.
Measured ${current.meta.date}; package ${current.meta.version ?? "historical"}, commit ${current.meta.commit ?? "not recorded"}. Viewport 800×600. CPU totals accumulate over 12 seconds; they are not per-frame times. Startup is separate; scroll intervals are never filtered. Style cells show median (min–max). Raw runs and source hashes: <a href="results/${mainFile}" style="color:#a78bfa">results/${mainFile}</a>.</p>
<table>
  <thead><tr><th>engine</th><th>total CPU (12 s)</th><th>fps</th><th>JS script</th><th>style recalc</th><th>layout</th><th>JS heap</th><th>p95</th><th>worst</th><th>frames &gt;25ms</th></tr></thead>
  <tbody>
`
for (const [engine, m] of Object.entries(main.engines)) {
  html += `    <tr><td>${label(engine)}</td><td class="n">${m.taskMs} ms</td><td class="n">${+m.fps.toFixed(1)}</td><td class="n">${m.scriptMs} ms</td><td class="n">${styleCost(m)}</td><td class="n">${m.layoutMs} ms</td><td class="n">${m.heapMB} MB</td><td class="n">${m.p95Ms} ms</td><td class="n">${m.worstMs ?? "not recorded"}</td><td class="n">${m.framesOver25ms ?? "not recorded"}</td></tr>\n`
}
html += `  </tbody>
</table>
<h2 style="font-size:15px; margin-top:18px;">The style-recalc curve <span style="color:#8f8ca6; font-weight:400;">(the honest cost of the CSS-variable mechanism)</span></h2>
<p class="sub">Every box gets a realistic subtree (<code>?deep=N</code> spans with distinct
selectors). A GSAP tween writes a transform on the box, so its cost does not depend on what the box contains; a custom property inherits, so every write re-resolves the box's whole subtree, and <code>styles/scoped.css</code> stops that at the readers. Compare document-wide writes, local writes and batched GSAP:
150 boxes, medians. Historical snapshot: ${results.meta.date}, package ${results.meta.version}; <a href="results/latest.json">raw results</a>. A newer main comparison does not update this snapshot.</p>
<table>
  <thead><tr><th>subtree size</th><th>engine</th><th>style recalc</th><th>JS script</th><th>task total</th><th>heap</th><th>fps</th></tr></thead>
  <tbody>
`
for (const sc of deeps) {
  for (const [engine, m] of Object.entries(sc.engines))
    html += `    <tr><td>${sc.name.replace('deep-', '')} nodes/box</td><td>${label(engine)}</td><td class="n">${styleCost(m)}</td><td class="n">${m.scriptMs} ms</td><td class="n">${m.taskMs} ms</td><td class="n">${m.heapMB} MB</td><td class="n">${m.fps}</td></tr>\n`
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
<p class="sub">Measured ${th.meta.date}; package ${th.meta.version ?? "historical"}, ${th.meta.runs} runs. Headed Chrome; compare engines within this profile, not as a multiplier of the headless table. Fixed-work calibration ratios are in the raw results.</p>
<table>
  <thead><tr><th>engine</th><th>JS script</th><th>style recalc</th><th>task total</th><th>fps</th><th>p95 frame</th></tr></thead>
  <tbody>
`
    for (const [engine, m] of Object.entries(main4.engines)) {
      html += `    <tr><td>${label(engine)}</td><td class="n">${m.scriptMs} ms</td><td class="n">${styleCost(m)}</td><td class="n">${m.taskMs} ms</td><td class="n">${m.fps}</td><td class="n">${m.p95Ms} ms</td></tr>\n`
    }
    html += `  </tbody>
</table>
<p class="sub">Raw: <a href="results/throttled-4x.json" style="color:#a78bfa">results/throttled-4x.json</a>.</p>`
  }
}

// app-shaped page (harness/app-shaped.mjs) when measured: what the library
// adds to a page that mounts, unmounts and swaps content while it scrolls
const appPath = join(root, 'demo', 'bench', 'results', 'app-shaped.json')
const app = existsSync(appPath) ? JSON.parse(readFileSync(appPath, 'utf8')) : null
if (app) {
  const APP_LABEL = { none: 'the page without the library', default: 'ScrollVars', scoped: 'ScrollVars + styles/scoped.css' }
  const spread = (mode, key) => { const xs = app.raw[mode].map(r => r[key]); return `${app.summary[mode][key]} ms (${Math.min(...xs)}–${Math.max(...xs)})` }
  html += `
<h2 style="font-size:15px; margin-top:18px;">An app-shaped page <span style="color:#8f8ca6; font-weight:400;">(what the library adds to a page that lives)</span></h2>
<p class="sub">Measured ${app.meta.date}, ${app.meta.runs} runs, order rotated. Generated by <code>harness/app-shaped.mjs</code>: a sticky header, a hero with entrance presets, a card grid with stagger, a parallax band, a feed of forty tracked items, a stream that mounts and unmounts rows every 250ms while the page scrolls, a route change at six seconds that replaces the grid and the feed, and a ${app.meta.rules}-rule stylesheet. Same 12-second scroll as the tables above; the difference between the first row and the others is what the library costs here, animations included. The scoped row is gated: it rendered the same as the default at every sampled scroll position before its time counted.</p>
<table>
  <thead><tr><th>page</th><th>task total</th><th>JS script</th><th>style recalc</th><th>fps</th><th>p95 frame</th><th>frames &gt;25ms</th></tr></thead>
  <tbody>
`
  for (const mode of Object.keys(app.summary)) {
    const m = app.summary[mode]
    html += `    <tr><td>${APP_LABEL[mode] ?? mode}</td><td class="n">${spread(mode, 'taskMs')}</td><td class="n">${m.scriptMs} ms</td><td class="n">${spread(mode, 'recalcMs')}</td><td class="n">${m.fps}</td><td class="n">${m.p95Ms} ms</td><td class="n">${m.framesOver25ms}</td></tr>\n`
  }
  html += `  </tbody>
</table>
<p class="sub">Raw: <a href="results/app-shaped.json" style="color:#a78bfa">results/app-shaped.json</a>.</p>`
}

const galleries = results.scenarios.filter(s => s.name.startsWith('gallery-'))
if (galleries.length) {
  html += `<h2>Real gallery sections (page outputs off)</h2><p class="sub">Each complete generated page at 800×600, including gallery UI and any responsive fit-to-flow fallback. These are workload checks, not competitor comparisons or device guarantees. Historical snapshot: ${results.meta.date}, package ${results.meta.version}; <a href="results/latest.json">raw results</a>.</p><table><thead><tr><th>section</th><th>JS</th><th>style</th><th>task total</th><th>p95</th><th>worst</th><th>frames &gt;25ms</th></tr></thead><tbody>`
  for (const row of galleries) {
    const m = Object.values(row.engines)[0]
    html += `<tr><td>${row.name.slice(8)}</td><td>${m.scriptMs} ms</td><td>${styleCost(m)}</td><td>${m.taskMs} ms</td><td>${m.p95Ms} ms</td><td>${m.worstMs} ms</td><td>${m.framesOver25ms}</td></tr>`
  }
  html += '</tbody></table>'
}

html = html.replaceAll('<table>', '<div class="table-scroll" tabindex="0"><table>').replaceAll('</table>', '</table></div>')
const page = readFileSync(pagePath, 'utf8')
const re = /<!-- measured:start -->[\s\S]*?<!-- measured:end -->/
if (!re.test(page)) throw new Error('measured markers not found in bench/index.html')
writeFileSync(pagePath, page.replace(re, `<!-- measured:start -->\n${html}\n<!-- measured:end -->`))
console.log(`bench main table from results/${mainFile}; deep/gallery from results/latest.json`)

// ── the same numbers in README.md and AGENTS.md (markdown, between markers) ──
const sizes = measureSizes(root)
const measuredCore = current.meta.coreGzipKB ?? sizes.everything
const BUNDLES = { 'scrollvars.html': `${measuredCore} KB`, 'scrollvars-local.html': `${measuredCore} KB`, 'scrollvars-page.html': `${measuredCore} KB`, 'scrollvars-scoped.html': `${(Number(measuredCore) + Number(sizes.css.scoped)).toFixed(1)} KB`, 'gsap.html': `${current.meta.competitors?.gsapGzipKB ?? GSAP_KB} KB`, 'gsap-batched.html': `${current.meta.competitors?.gsapGzipKB ?? GSAP_KB} KB`, 'framer.html': '46.9 KB (+ React)' }
const MD_LABEL = { 'scrollvars.html': 'ScrollVars', 'scrollvars-page.html': 'ScrollVars (document variables published)', 'scrollvars-scoped.html': 'ScrollVars + styles/scoped.css', 'scrollvars-local.html': 'ScrollVars (page outputs off)', 'gsap.html': 'gsap + ScrollTrigger (idiomatic)', 'gsap-batched.html': 'gsap + ScrollTrigger (batched, symmetric)', 'framer.html': 'framer-motion' }
const md = [`Measured ${current.meta.date}; package ${current.meta.version ?? 'historical'}, ${current.meta.runs} runs. CPU is accumulated over 12 seconds (900 elements), not per-frame time. Bundle and runtime measurements refer to this snapshot. [Raw runs](https://scrollvars.dev/bench/results/${mainFile}); [frame tails and methodology](https://scrollvars.dev/bench/).`, '', '| engine | total CPU (12 s) | fps | bundle (gzip) | JS script | style recalc | JS heap |', '|---|---|---|---|---|---|---|']
for (const [engine, m] of Object.entries(main.engines)) {
  md.push(`| ${MD_LABEL[engine]} | ${m.taskMs} ms | ${+m.fps.toFixed(1)} | ${BUNDLES[engine]} | ${m.scriptMs} ms | ${m.recalcMs} ms | ${m.heapMB} MB |`)
}
// The deep profile in one line under the table, so the README carries the
// shape of the curve with measured numbers rather than typed ones: smallest
// and largest subtree size, three engines. The full curve is on the bench page.
const deepAt = (sc) => ['scrollvars.html', 'scrollvars-scoped.html', 'gsap-batched.html'].map((engine) => sc.engines[engine]?.taskMs)
const [shallow, deep] = [deeps[0], deeps[deeps.length - 1]]
if (shallow && deep && [...deepAt(shallow), ...deepAt(deep)].every((ms) => typeof ms === 'number')) {
  const phrase = (sc) => { const [sv, scoped, gsap] = deepAt(sc); return `ScrollVars ${sv} ms, with styles/scoped.css ${scoped} ms, gsap batched ${gsap} ms` }
  md.push('', `Deep profile, 150 boxes with N nodes each ([full curve](https://scrollvars.dev/bench/)): at ${shallow.name.slice(5)} nodes per box ${phrase(shallow)}; at ${deep.name.slice(5)} nodes per box ${phrase(deep)}.`)
}
// The app-shaped page in one line as well, from the same results file the
// bench page renders, so the README can name what the library adds to a page
// that lives without anyone typing a number.
if (app?.summary?.none && app.summary.default && app.summary.scoped) {
  const smooth = Object.values(app.summary).every((m) => m.framesOver25ms === 0) ? ', and no frame over 25 ms in any of the three' : ''
  md.push('', `An app-shaped page, generated by the benchmark harness (a sticky header, entrance presets, a stagger grid, a parallax band, forty tracked feed items, a stream that mounts rows while the page scrolls, a route change at six seconds, a ${app.meta.rules}-rule stylesheet): ${app.summary.none.taskMs} ms of main-thread time over the same 12-second scroll without the library, ${app.summary.default.taskMs} ms with it and ${app.summary.scoped.taskMs} ms with styles/scoped.css${smooth}.`)
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
