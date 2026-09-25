#!/usr/bin/env node
// Merges every demo/bench/lab/results/*.json (one per device/browser run)
// into one Markdown table: engine x page x metric. Flags any run whose
// animated check failed, so a frozen page never reads as a good number.
//
//   node demo/bench/lab/report.mjs > demo/bench/lab/results/report.md
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const resultsDir = join(here, 'results')
const PAGES = ['long', 'deep', 'cubes']

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]

const files = readdirSync(resultsDir).filter((f) => f.endsWith('.json'))
if (!files.length) {
  console.log('No results yet in demo/bench/lab/results/. Run the lab (demo/bench/lab/serve.mjs, then open /bench/lab/ on a device) first.')
  process.exit(0)
}

const lines = ['# Perf lab report', '']
const flagged = []

for (const file of files.sort()) {
  const payload = JSON.parse(readFileSync(join(resultsDir, file), 'utf8'))
  const { env, frames, reps, runs } = payload
  const good = (runs || []).filter((r) => r.deltas)
  const all = good.flatMap((r) => r.deltas)
  if (!all.length) continue
  const vsync = median(all)

  lines.push(`## ${env?.userAgent || file}`, '')
  lines.push(`Screen ${env?.screen}, @${env?.dpr}x, viewport ${env?.viewport}, reduced motion: ${env?.reducedMotion}. ${frames} frames per run, ${reps} reps, median vsync ${vsync.toFixed(2)}ms (~${Math.round(1000 / vsync)}Hz).`, '')
  lines.push('| page | p50 ms | p95 ms | p99 ms | late % | animated | LoAF blocking ms | LoAF script ms |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')

  for (const page of PAGES) {
    const rs = good.filter((r) => r.page === page)
    if (!rs.length) continue
    const stat = (fn) => median(rs.map((r) => fn([...r.deltas].sort((a, b) => a - b))))
    const p50 = stat((d) => pct(d, .5)), p95 = stat((d) => pct(d, .95)), p99 = stat((d) => pct(d, .99))
    const late = stat((d) => (d.filter((x) => x > vsync * 1.5).length / d.length) * 100)
    const animatedCount = rs.filter((r) => r.animated).length
    const withLoaf = rs.filter((r) => r.loaf)
    const blocking = withLoaf.length ? median(withLoaf.map((r) => r.loaf.totalBlocking)).toFixed(1) : 'n/a'
    const script = withLoaf.length ? median(withLoaf.map((r) => r.loaf.scriptTotal)).toFixed(1) : 'n/a'
    lines.push(`| ${page} | ${p50.toFixed(1)} | ${p95.toFixed(1)} | ${p99.toFixed(1)} | ${late.toFixed(1)} | ${animatedCount}/${rs.length} | ${blocking} | ${script} |`)
    if (animatedCount < rs.length) flagged.push(`${file}: ${page} had ${rs.length - animatedCount} run(s) with no detected change`)
  }
  for (const r of (runs || []).filter((r) => r.error)) flagged.push(`${file}: ${r.page} run ${r.rep + 1} errored: ${r.error}`)
  lines.push('')
}

if (flagged.length) {
  lines.push('## Flagged (untimed animated check failed, or a run errored)', '')
  for (const f of flagged) lines.push(`- ${f}`)
  lines.push('')
}

console.log(lines.join('\n'))
