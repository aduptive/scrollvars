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
} from './docs-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sizes = measureSizes(root)
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

/**
 * Replaces the text between two anchors, throwing when an anchor moves.
 * Used where a marker comment cannot go: inside a Markdown paragraph (an
 * HTML comment on its own line would split it) and inside shipped source.
 */
const between = (text, before, after, body, label) => {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${esc(before)})[\\s\\S]*?(${esc(after)})`)
  if (!re.test(text)) throw new Error(`${label}: anchor text not found, wording moved`)
  return text.replace(re, (m, a, b) => a + body + b)
}

const stamp = (text, name, body) => {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`)
  if (!re.test(text)) throw new Error(`${name} markers missing`)
  return text.replace(re, () => `<!-- ${name}:start -->\n${body}\n<!-- ${name}:end -->`)
}

// README
let readme = readFileSync(join(root, 'README.md'), 'utf8')
readme = stamp(readme, 'vars', 'The driver **tracks** elements and writes these outputs (anything that reads them is a preset):\n\n' + varsMarkdown())
readme = stamp(readme, 'sizes', [
  `Per module entry, measured from dist by \`scripts/docs-stamp.mjs\` (JS min+gzip, CSS gzip as shipped):`, '',
  '| you import | JS on the wire |', '| --- | --- |',
  `| \`track\` (the driver) | ${sizes.driver} KB |`,
  `| \`track\` + \`scan\` (zero-wrapper mode) | ${sizes.driverScan} KB |`,
  `| \`slider\` | ${sizes.slider} KB |`,
  `| \`trackPointer\` | ${sizes.pointer} KB |`,
  `| \`mountEffect\` (canvas) | ${sizes.canvas} KB |`,
  `| everything in \`scrollvars\` (the core entry) | ${sizes.everything} KB |`,
  `| \`scrollvars/react\` (wrappers + kit, React external) | ${sizes.react} KB |`,
].join('\n'))
readme = readme.replace(/\*\*~[\d.]+ KB gzipped, total\.\*\*/, `**~${sizes.typical} KB gzipped, total.**`)
for (const [name, note] of Object.entries(STYLE_NOTES)) {
  const re = new RegExp(`^(import 'scrollvars/styles/${name}\\.css'\\s+// )[^\\n]*$`, 'm')
  if (!re.test(readme)) throw new Error(`README styles line for ${name} missing`)
  readme = readme.replace(re, `$1${note}, ${sizes.css[name]} KB gz`)
}
// prose mentions: the intro line and the slider section carry one number each
const intro = /Measured \(JS min\+gzip, CSS gzip as shipped\): driver [\d.]+ KB, full core incl\. the slider [\d.]+ KB, styles [\d.]+ KB for every preset or [\d.]+ KB for the core part\. A typical page ships ~[\d.]+ KB on the wire\./
if (!intro.test(readme)) throw new Error('README intro sizes sentence not found')
readme = readme.replace(intro, `Measured (JS min+gzip, CSS gzip as shipped): driver ${sizes.driver} KB, full core incl. the slider ${sizes.everything} KB, styles ${sizes.stylesAll} KB for every preset or ${sizes.css.core} KB for the core part. A typical page ships ~${sizes.typical} KB on the wire.`)
readme = readme.replace(/Size, measured: this module [\d.]+ KB gzip;/, `Size, measured: this module ${sizes.slider} KB gzip;`)
// compat's fallback preset list, one of three surfaces rendered from COMPAT_PRESETS
readme = between(
  readme,
  'stylesheet for\n',
  '\n(written without',
  wrap(compatPresetsGrouped((n) => `\`${n}\``)),
  'README.md Extended floor paragraph'
)
writeFileSync(join(root, 'README.md'), readme)

// AGENTS
let agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
agents = stamp(agents, 'vars', varsMarkdown())
agents = agents.replace(/^(import 'scrollvars\/styles\/core\.css'\s+\/\/ )[^\n]*$/m, `$1${STYLE_NOTES.core} (${sizes.css.core} KB gz)`)
agents = agents.replace(/^\/\/ also styles\/pin\.css[^\n]*$/m,
  `// also styles/pin.css (${sizes.css.pin}), slider.css (${sizes.css.slider}), tilt.css (${sizes.css.tilt}), state.css (${sizes.css.state}, scroll-driven acts need core too), ui.css (${sizes.css.ui}), per page needs`)
writeFileSync(join(root, 'AGENTS.md'), agents)

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
