#!/usr/bin/env node
/**
 * Writes the shared facts into README.md and AGENTS.md (between markers, or on
 * the lines that carry a number) and generates demo/llms.txt from AGENTS.md.
 * Runs in `npm run demo:sync`; CI fails if the committed files differ from
 * what this produces, so nothing here can drift by hand.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  varsMarkdown,
  measureSizes,
  compatPresetsFlat,
  compatPresetsGrouped,
  COMPAT_PRESET_NOTES,
  BROWSER_FLOOR,
} from './docs-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const STYLE_NOTES = {
  core: 'entrances, stagger, drift, spread, native view()-tier',
  pin: 'sv-stage, curtain, rail, deck, reading, counter, range',
  slider: 'carousel rails',
  tilt: 'pointer tilt',
  // an acts clock driven by the scroll reads --sv-live, and core.css is the
  // only stylesheet that declares it: state.css alone leaves it at act zero
  state: 'toggles, popover/dialog, rotating words, acts (a scroll-driven acts clock needs core.css too)',
  ui: 'marquee, accordion',
}

/** Greedy wrap to `width` columns, `prefix` on every line. */
const wrap = (text, prefix = '', width = 76) => {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && prefix.length + line.length + 1 + word.length > width) {
      lines.push(prefix + line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(prefix + line)
  return lines.join('\n')
}

/** Counts literal, non-overlapping occurrences of `needle` in `text`. */
const countLiteral = (text, needle) => text.split(needle).length - 1

/**
 * Replaces the text between two anchors, throwing when an anchor moves.
 * Used where a marker comment cannot go: inside a Markdown paragraph (an
 * HTML comment on its own line would split it) and inside shipped source.
 * The `before` anchor is checked for uniqueness first: a non-greedy match
 * starting at a repeated `before` silently absorbs the other occurrences
 * and reports the count of the compound match as one, so counting the
 * compound regex would not catch it (ADU-195).
 */
export const between = (text, before, after, body, label) => {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const beforeCount = countLiteral(text, before)
  if (beforeCount > 1) throw new Error(`${label}: anchor "${before}" is ambiguous, found ${beforeCount} times`)
  const re = new RegExp(`(${esc(before)})[\\s\\S]*?(${esc(after)})`)
  if (!re.test(text)) throw new Error(`${label}: anchor text not found, wording moved`)
  return text.replace(re, (m, a, b) => a + body + b)
}

export const stamp = (text, name, body) => {
  const startMarker = `<!-- ${name}:start -->`
  const startCount = countLiteral(text, startMarker)
  if (startCount > 1) throw new Error(`${name} markers ambiguous: "${startMarker}" found ${startCount} times`)
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`)
  if (!re.test(text)) throw new Error(`${name} markers missing`)
  return text.replace(re, () => `<!-- ${name}:start -->\n${body}\n<!-- ${name}:end -->`)
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Splices a `| label | CELL |` markdown table row's browser-floor cell,
 * throwing when the row moved. `cell` is the whole replacement (bold
 * markers included where the surface wants them); the row's other
 * columns (notes, extra gates) are untouched. The uniqueness check counts
 * the WHOLE regex (label plus the cell shape it requires), not the bare
 * label: a label can repeat across tables with a different cell shape and
 * still be unambiguous for this splice (ADU-195).
 */
export const floorRow = (text, label, cell, surface) => {
  // [^|]* (not [^)]*): the reason parenthetical can nest its own parens
  // (`:is()`), so bound on the next table-cell pipe, not the next `)`.
  const re = new RegExp(`(\\| ${escRe(label)} \\| )(?:\\*\\*)?[\\d.]+\\+(?:\\*\\*)? \\([^|]*\\)`)
  const matches = text.match(new RegExp(re.source, 'g')) || []
  if (matches.length > 1) throw new Error(`${surface}: browser floor row for "${label}" is ambiguous, found ${matches.length} times`)
  if (!re.test(text)) throw new Error(`${surface}: browser floor row for "${label}" not found`)
  return text.replace(re, (m, pre) => pre + cell)
}

/**
 * Replaces a single regex match in `text`, throwing when it matches zero or
 * more than one time. The general form of floorRow()'s uniqueness check,
 * for a plain regex anchor rather than a table row (ADU-196: several calls
 * ran with no guard at all, worse than a "missing" throw: a bare
 * `.replace()` reports success and writes the file back unchanged when the
 * anchor moved).
 */
export const spliceOne = (text, re, replacement, label) => {
  const matches = text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)) || []
  if (matches.length > 1) throw new Error(`${label} is ambiguous, found ${matches.length} times`)
  if (matches.length === 0) throw new Error(`${label} not found`)
  return text.replace(re, replacement)
}

/** "**104+** (Aug 2022)"; with `reason: true` and Firefox, "**78+** (Jun 2020, `:is()`/`:where()`)". */
const floorMd = (key, { reason = false } = {}) => {
  const b = BROWSER_FLOOR[key]
  const why = reason && b.reason ? `, ${b.reason.map((s) => `\`${s}\``).join('/')}` : ''
  return `**${b.version}** (${b.date}${why})`
}

// Everything below only runs when this script is executed directly, not
// when a test imports the splice functions above (between, stamp, floorRow,
// spliceOne).
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {

const sizes = measureSizes(root)

// README
let readme = readFileSync(join(root, 'README.md'), 'utf8')
readme = stamp(readme, 'vars', 'The driver **tracks** elements and writes these outputs (anything that reads them is a preset):\n\n' + varsMarkdown())
readme = stamp(readme, 'sizes', [
  `Named imports for \`track\` / \`track\` + \`scan\`; other rows are complete module entries, measured from dist by \`scripts/docs-stamp.mjs\` (JS min+gzip, CSS gzip as shipped):`, '',
  '| you import | JS on the wire |', '| --- | --- |',
  `| \`track\` (the driver) | ${sizes.driver} KB |`,
  `| \`track\` + \`scan\` (zero-wrapper mode) | ${sizes.driverScan} KB |`,
  `| \`slider\` | ${sizes.slider} KB |`,
  `| \`trackPointer\` | ${sizes.pointer} KB |`,
  `| \`mountEffect\` (canvas) | ${sizes.canvas} KB |`,
  `| everything in \`scrollvars\` (the core entry) | ${sizes.everything} KB |`,
  `| \`scrollvars/react\` (wrappers + kit, React external) | ${sizes.react} KB |`,
].join('\n'))
readme = spliceOne(readme, /\*\*~[\d.]+ KB gzipped, total\.\*\*/, `**~${sizes.typical} KB gzipped, total.**`, 'README.md: total size stamp')
for (const [name, note] of Object.entries(STYLE_NOTES)) {
  const re = new RegExp(`^(import 'scrollvars/styles/${name}\\.css'\\s+// )[^\\n]*$`, 'm')
  readme = spliceOne(readme, re, `$1${note}, ${sizes.css[name]} KB gz`, `README.md: styles import line for ${name}`)
}
// prose mentions: the intro line and the slider section carry one number each
const intro = /Measured \(JS min\+gzip, CSS gzip as shipped\): driver [\d.]+ KB, full core incl\. the slider [\d.]+ KB, styles [\d.]+ KB for every preset or [\d.]+ KB for the core part\. A typical page ships ~[\d.]+ KB on the wire\./
readme = spliceOne(readme, intro, `Measured (JS min+gzip, CSS gzip as shipped): driver ${sizes.driver} KB, full core incl. the slider ${sizes.everything} KB, styles ${sizes.stylesAll} KB for every preset or ${sizes.css.core} KB for the core part. A typical page ships ~${sizes.typical} KB on the wire.`, 'README.md: intro sizes sentence')
readme = spliceOne(readme, /Size, measured: this module [\d.]+ KB gzip;/, `Size, measured: this module ${sizes.slider} KB gzip;`, 'README.md: slider module size stamp')
// compat's fallback preset list, one of three surfaces rendered from COMPAT_PRESETS
readme = between(
  readme,
  'stylesheet for\n',
  '\n(written without',
  wrap(compatPresetsGrouped((n) => `\`${n}\``)),
  'README.md Extended floor paragraph'
)
// the "fully animated" browser floor table, one of five surfaces rendered from BROWSER_FLOOR
readme = floorRow(readme, 'Chrome / Edge', floorMd('chrome'), 'README.md')
readme = floorRow(readme, 'Firefox', floorMd('firefox', { reason: true }), 'README.md')
readme = floorRow(readme, 'Safari / iOS', floorMd('safari'), 'README.md')
writeFileSync(join(root, 'README.md'), readme)

// AGENTS
let agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
agents = stamp(agents, 'vars', varsMarkdown())
agents = spliceOne(agents, /^(import 'scrollvars\/styles\/core\.css'\s+\/\/ )[^\n]*$/m, `$1${STYLE_NOTES.core} (${sizes.css.core} KB gz)`, 'AGENTS.md: core styles import line')
agents = spliceOne(agents, /^\/\/ also styles\/pin\.css[^\n]*$/m,
  `// also styles/pin.css (${sizes.css.pin}), slider.css (${sizes.css.slider}), tilt.css (${sizes.css.tilt}), state.css (${sizes.css.state}, scroll-driven acts need core too), ui.css (${sizes.css.ui}), per page needs`,
  'AGENTS.md: "also styles/pin.css" line')
// the "fully animated" browser floor headline, one of five surfaces rendered from BROWSER_FLOOR
const agentsFloor = /Fully animated: Chrome\/Edge [\d.]+\+, Firefox [\d.]+\+, Safari\/iOS [\d.]+\+/
agents = spliceOne(agents, agentsFloor, `Fully animated: Chrome/Edge ${BROWSER_FLOOR.chrome.version}, Firefox ${BROWSER_FLOOR.firefox.version}, Safari/iOS ${BROWSER_FLOOR.safari.version}`, 'AGENTS.md: browser floor headline')
writeFileSync(join(root, 'AGENTS.md'), agents)

// docs/integration.md: the client-facing browser support table, plain (no bold, no reason)
let integration = readFileSync(join(root, 'docs', 'integration.md'), 'utf8')
integration = floorRow(integration, 'Chrome / Edge', `${BROWSER_FLOOR.chrome.version} (${BROWSER_FLOOR.chrome.date})`, 'docs/integration.md')
integration = floorRow(integration, 'Firefox', `${BROWSER_FLOOR.firefox.version} (${BROWSER_FLOOR.firefox.date})`, 'docs/integration.md')
integration = floorRow(integration, 'Safari / iOS', `${BROWSER_FLOOR.safari.version} (${BROWSER_FLOOR.safari.date})`, 'docs/integration.md')
writeFileSync(join(root, 'docs', 'integration.md'), integration)

// src/compat/index.ts: the header comment ships to npm inside dist, and its
// copy of the preset list is the one that escaped in ADU-159. Stamped from the
// same data, so it cannot say something README does not. The build ahead of
// this step used the pre-stamp comment; comments never reach the measured
// (minified) sizes, and `npm test` rebuilds before it runs.
const compatPath = join(root, 'src', 'compat', 'index.ts')
const compat = between(
  readFileSync(compatPath, 'utf8'),
  'the same presets README lists:\n',
  '\n *     Written without',
  wrap(`${compatPresetsFlat(COMPAT_PRESET_NOTES)}.`, ' *     '),
  'src/compat/index.ts header comment'
)
writeFileSync(compatPath, compat)

// llms.txt = AGENTS.md with the machine-facing header
const body = agents.split('\n').slice(1).join('\n')
const header = `# ScrollVars: llms.txt (guide for AI coding agents)

> Tiny scroll/pointer/click/canvas animation engine: one rAF in, CSS
> variables out. Zero dependencies. Live demo with view-source docs:
> https://scrollvars.dev · Benchmarks: https://scrollvars.dev/bench/
> Generated from the repository's AGENTS.md by \`npm run demo:sync\`; same content, same version.

## Resources

- [Live demo](https://scrollvars.dev), 28 patterns, view-source is the spec
- [Human docs](https://scrollvars.dev/docs/). Quickstart, every export, de/para tables
- [fx gallery](https://scrollvars.dev/fx/), copy-paste effects and sections, its own [llms.txt](https://scrollvars.dev/fx/llms.txt)
- [Benchmark](https://scrollvars.dev/bench/). Reproducible, includes the scenario it loses
- [npm package](https://www.npmjs.com/package/scrollvars) · [GitHub](https://github.com/aduptive/scrollvars)
`
writeFileSync(join(root, 'demo', 'llms.txt'), header + body)
console.log(`docs stamped (core ${sizes.everything} KB, driver ${sizes.driver} KB); llms.txt generated from AGENTS.md`)

}
