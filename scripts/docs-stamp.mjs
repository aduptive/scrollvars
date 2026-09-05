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
import { varsMarkdown, measureSizes } from './docs-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sizes = measureSizes(root)
const STYLE_NOTES = {
  core: 'entrances, stagger, drift, spread, native view()-tier',
  pin: 'sv-stage, curtain, rail, deck, reading, counter, range',
  slider: 'carousel rails',
  tilt: 'pointer tilt',
  state: 'toggles, popover/dialog, rotating words, acts',
  ui: 'marquee, accordion',
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
  `min+gzip per import (measured from dist at build by \`scripts/docs-stamp.mjs\`):`, '',
  '| you import | JS on the wire |', '| --- | --- |',
  `| \`track\` (the driver) | ${sizes.driver} KB |`,
  `| \`track\` + \`scan\` (zero-wrapper mode) | ${sizes.driverScan} KB |`,
  `| \`slider\` | ${sizes.slider} KB |`,
  `| \`trackPointer\` | ${sizes.pointer} KB |`,
  `| \`mountEffect\` (canvas) | ${sizes.canvas} KB |`,
  `| everything | ${sizes.everything} KB |`,
].join('\n'))
readme = readme.replace(/\*\*~[\d.]+ KB gzipped, total\.\*\*/, `**~${sizes.typical} KB gzipped, total.**`)
for (const [name, note] of Object.entries(STYLE_NOTES)) {
  const re = new RegExp(`^(import 'scrollvars/styles/${name}\\.css'\\s+// )[^\\n]*$`, 'm')
  if (!re.test(readme)) throw new Error(`README styles line for ${name} missing`)
  readme = readme.replace(re, `$1${note}, ${sizes.css[name]} KB gz`)
}
// prose mentions: the intro line and the slider section carry one number each
const intro = /Measured \(min\+gzip\): driver [\d.]+ KB, full core incl\. the slider [\d.]+ KB, styles [\d.]+ KB for every preset or [\d.]+ KB for the core part\./
if (!intro.test(readme)) throw new Error('README intro sizes sentence not found')
readme = readme.replace(intro, `Measured (min+gzip): driver ${sizes.driver} KB, full core incl. the slider ${sizes.everything} KB, styles ${sizes.stylesAll} KB for every preset or ${sizes.css.core} KB for the core part.`)
readme = readme.replace(/Size, measured: this module [\d.]+ KB gzip;/, `Size, measured: this module ${sizes.slider} KB gzip;`)
writeFileSync(join(root, 'README.md'), readme)

// AGENTS
let agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
agents = stamp(agents, 'vars', varsMarkdown())
agents = agents.replace(/^(import 'scrollvars\/styles\/core\.css'\s+\/\/ )[^\n]*$/m, `$1${STYLE_NOTES.core} (${sizes.css.core} KB gz)`)
agents = agents.replace(/^\/\/ also styles\/pin\.css[^\n]*$/m,
  `// also styles/pin.css (${sizes.css.pin}), slider.css (${sizes.css.slider}), tilt.css (${sizes.css.tilt}), state.css (${sizes.css.state}), ui.css (${sizes.css.ui}), per page needs`)
writeFileSync(join(root, 'AGENTS.md'), agents)

// llms.txt = AGENTS.md with the machine-facing header
const body = agents.split('\n').slice(1).join('\n')
const header = `# ScrollVars: llms.txt (guide for AI coding agents)

> Tiny scroll/pointer/click/canvas animation engine: one rAF in, CSS
> variables out. Zero dependencies. Live demo with view-source docs:
> https://scrollvars.dev · Benchmarks: https://scrollvars.dev/bench/
> Generated from the repository's AGENTS.md at build; same content, same version.

## Resources

- [Live demo](https://scrollvars.dev), 28 patterns, view-source is the spec
- [Human docs](https://scrollvars.dev/docs/). Quickstart, every export, de/para tables
- [fx gallery](https://scrollvars.dev/fx/), copy-paste effects and sections, its own [llms.txt](https://scrollvars.dev/fx/llms.txt)
- [Benchmark](https://scrollvars.dev/bench/). Reproducible, includes the scenario it loses
- [npm package](https://www.npmjs.com/package/scrollvars) · [GitHub](https://github.com/aduptive/scrollvars)
`
writeFileSync(join(root, 'demo', 'llms.txt'), header + body)
console.log(`docs stamped (core ${sizes.everything} KB, driver ${sizes.driver} KB); llms.txt generated from AGENTS.md`)
