#!/usr/bin/env node
/**
 * Stamps the physical-device frame budget matrix (T7 evidence, "path to
 * 8/10") into docs/guide.md from demo/bench/lab/results/published/*.json,
 * the only committed lab results (the scratch results/*.json next to them
 * are gitignored). manifest.json in that folder names which JSON file
 * belongs to which device/browser and which commit it was measured
 * against, plus the devices still pending Andrea's hands (no fake rows: a
 * pending device gets a placeholder, never a number nobody measured).
 *
 * Runs in `npm run demo:sync`; CI fails if the committed docs differ from
 * what this produces, same rule as bench-tables.mjs.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAB_FRAME_BUDGET } from './docs-data.mjs'
import { stamp } from './docs-stamp.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const resultsDir = join(root, 'demo', 'bench', 'lab', 'results', 'published')
const PAGES = ['long', 'deep', 'cubes']

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]

const browserLabel = (ua = '') => {
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)[1].split('.')[0]}`
  if (/Chrome\//.test(ua)) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)[1].split('.')[0]}`
  if (/Version\/.*Safari\//.test(ua)) return `Safari ${ua.match(/Version\/([\d.]+)/)[1]}`
  return ua || 'unknown'
}

// Everything below only runs when this script is executed directly, not
// when a test imports the helpers above.
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {

const manifest = JSON.parse(readFileSync(join(resultsDir, 'manifest.json'), 'utf8'))
const files = new Set(readdirSync(resultsDir).filter((f) => f.endsWith('.json')))

const rows = []
const flagged = []
for (const run of manifest.runs) {
  if (!files.has(run.file)) throw new Error(`lab-tables: manifest names ${run.file}, not found in ${resultsDir}`)
  const payload = JSON.parse(readFileSync(join(resultsDir, run.file), 'utf8'))
  const good = (payload.runs || []).filter((r) => r.deltas)
  const all = good.flatMap((r) => r.deltas)
  if (!all.length) throw new Error(`lab-tables: ${run.file} has no usable runs (every animated check failed?)`)
  // Independent calibration (run-drive.js's idle rAF window, one per run,
  // stored as vsyncMs) when every run in the file has it; otherwise this
  // file predates that field and falls back to the OLD method (median of
  // the scroll frames themselves), which lets a uniformly slow device drag
  // its own budget line down with it. Said explicitly per row below, never
  // presented the same way as an independent calibration.
  const calibrated = good.every((r) => typeof r.vsyncMs === 'number')
  const vsync = calibrated ? median(good.map((r) => r.vsyncMs)) : median(all)
  const budgetMs = vsync * LAB_FRAME_BUDGET.p95Factor

  for (const page of PAGES) {
    const rs = good.filter((r) => r.page === page)
    if (!rs.length) continue
    const stat = (fn) => median(rs.map((r) => fn([...r.deltas].sort((a, b) => a - b))))
    const worst = (fn) => Math.max(...rs.map((r) => fn([...r.deltas].sort((a, b) => a - b))))
    const p50 = stat((d) => pct(d, .5)), p95 = stat((d) => pct(d, .95)), p95Worst = worst((d) => pct(d, .95)), p99 = stat((d) => pct(d, .99))
    const late = stat((d) => (d.filter((x) => x > budgetMs).length / d.length) * 100)
    const animatedCount = rs.filter((r) => r.animated).length
    const pass = p95 <= budgetMs && late <= LAB_FRAME_BUDGET.lateMaxPct && animatedCount === rs.length
    rows.push({
      device: run.label, browser: browserLabel(payload.env?.userAgent), commit: run.commit,
      calibration: calibrated ? 'independent' : 'self-calibrated', page,
      p50: p50.toFixed(1), p95: p95.toFixed(1), p95Worst: p95Worst.toFixed(1), p99: p99.toFixed(1), late: late.toFixed(1),
      animated: `${animatedCount}/${rs.length}`, pass,
    })
    if (!pass) flagged.push(`${run.label} / ${page}: p95 ${p95.toFixed(1)}ms vs budget ${budgetMs.toFixed(1)}ms, late ${late.toFixed(1)}%, animated ${animatedCount}/${rs.length}`)
  }
  for (const r of (payload.runs || []).filter((r) => r.error)) flagged.push(`${run.label} / ${r.page}: run ${r.rep + 1} errored: ${r.error}`)
}

const lines = [
  `Frame budget declared before reading any number (\`LAB_FRAME_BUDGET\`, \`scripts/docs-data.mjs\`): p95 frame time at most ${LAB_FRAME_BUDGET.p95Factor}x the device's own measured vsync interval, and at most ${LAB_FRAME_BUDGET.lateMaxPct}% of frames late (past that same line). A run that misses either line fails, whatever its own animated check reports. The vsync interval is independently calibrated per run (an idle rAF window before the scroll starts, \`demo/bench/lab/run-drive.js\`) where the raw result has it; a row marked self-calibrated predates that field and instead derives its interval from the median of its own scroll frames, a weaker number since a uniformly slow device can drag its own line down with it. Raw runs: [\`demo/bench/lab/results/published/\`](https://github.com/aduptive/scrollvars/tree/main/demo/bench/lab/results/published).`,
  '',
  '| device | browser | commit | calibration | page | p50 ms | p95 ms | p95 worst rep | p99 ms | late % | animated | budget |',
  '| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
]
for (const r of rows) {
  lines.push(`| ${r.device} | ${r.browser} | \`${r.commit}\` | ${r.calibration} | ${r.page} | ${r.p50} | ${r.p95} | ${r.p95Worst} | ${r.p99} | ${r.late} | ${r.animated} | ${r.pass ? 'pass' : '**fail**'} |`)
}
for (const p of manifest.pending || []) {
  lines.push(`| ${p.label} | — | — | — | — | — | — | — | — | — | — | pending, Andrea's device |`)
}
if (flagged.length) {
  lines.push('', '**Flagged** (missed the budget, or an animated check failed):', '')
  for (const f of flagged) lines.push(`- ${f}`)
}

writeFileSync(join(root, 'docs', 'guide.md'), stamp(readFileSync(join(root, 'docs', 'guide.md'), 'utf8'), 'devicematrix', lines.join('\n')))
console.log(`lab tables stamped (${rows.length} measured row(s), ${(manifest.pending || []).length} pending)`)

}
