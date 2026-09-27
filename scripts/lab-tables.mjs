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

// ---- ADU (loop8-3, B2): the old pass/fail judged the MEDIAN repetition
// against a calibration averaged across the whole file, so one bad rep, an
// errored rep or a missing page could hide behind the others. This judges
// EVERY repetition against its OWN vsyncMs (falling back per-rep to the
// median of that rep's own sorted deltas when the field predates
// calibration), and requires full coverage: `payload.reps` repetitions
// present for the page, each with usable deltas and its own animated check
// passing. A row passes only if every repetition does. Exported so
// test/lab-tables.test.mjs can prove it without a captured lab file.
export function verdictForPage(payload, page) {
  const expected = payload.reps
  const runs = (payload.runs || []).filter((r) => r.page === page)
  if (typeof expected === 'number' && runs.length < expected)
    return { pass: false, reason: `only ${runs.length}/${expected} repetition(s) present` }
  if (!runs.length) return { pass: false, reason: 'page missing' }
  for (const r of runs) {
    if (r.error) return { pass: false, reason: `rep ${r.rep + 1} errored: ${r.error}` }
    if (!r.deltas || !r.deltas.length) return { pass: false, reason: `rep ${r.rep + 1} has no deltas` }
    if (!r.animated) return { pass: false, reason: `rep ${r.rep + 1} failed its animated check` }
  }
  const perRep = runs.map((r) => {
    const sorted = [...r.deltas].sort((a, b) => a - b)
    const vsync = typeof r.vsyncMs === 'number' ? r.vsyncMs : median(sorted)
    const budgetMs = vsync * LAB_FRAME_BUDGET.p95Factor
    const p95 = pct(sorted, .95)
    const late = (sorted.filter((x) => x > budgetMs).length / sorted.length) * 100
    return {
      sorted, budgetMs,
      p50: pct(sorted, .5), p95, p99: pct(sorted, .99), late,
      pass: p95 <= budgetMs && late <= LAB_FRAME_BUDGET.lateMaxPct,
    }
  })
  const failed = perRep.find((r) => !r.pass)
  const calibrated = runs.every((r) => typeof r.vsyncMs === 'number')
  return {
    pass: !failed,
    reason: failed ? `rep exceeded its own budget: p95 ${failed.p95.toFixed(1)}ms vs ${failed.budgetMs.toFixed(1)}ms, late ${failed.late.toFixed(1)}%` : null,
    calibration: calibrated ? 'independent' : 'self-calibrated',
    p50: median(perRep.map((r) => r.p50)),
    p95: median(perRep.map((r) => r.p95)),
    p95Worst: Math.max(...perRep.map((r) => r.p95)),
    p99: median(perRep.map((r) => r.p99)),
    late: median(perRep.map((r) => r.late)),
    animatedCount: runs.filter((r) => r.animated).length,
    repCount: runs.length,
  }
}

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
  if (!(payload.runs || []).some((r) => r.deltas))
    throw new Error(`lab-tables: ${run.file} has no usable runs (every animated check failed?)`)

  for (const page of PAGES) {
    // missing page or a failed repetition emits a failing ROW, never an
    // absent one: dropping it silently is exactly what let a bad rep hide.
    const v = verdictForPage(payload, page)
    rows.push({
      device: run.label, browser: browserLabel(payload.env?.userAgent), commit: run.commit,
      calibration: v.calibration ?? '-', page,
      p50: v.p50?.toFixed(1) ?? '-', p95: v.p95?.toFixed(1) ?? '-', p95Worst: v.p95Worst?.toFixed(1) ?? '-',
      p99: v.p99?.toFixed(1) ?? '-', late: v.late?.toFixed(1) ?? '-',
      animated: v.repCount != null ? `${v.animatedCount}/${v.repCount}` : '-', pass: v.pass,
    })
    if (!v.pass) flagged.push(`${run.label} / ${page}: ${v.reason}`)
  }
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
