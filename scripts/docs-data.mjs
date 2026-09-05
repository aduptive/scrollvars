/**
 * The facts README.md, AGENTS.md, demo/llms.txt and /docs/ share, kept once.
 * docs-stamp.mjs writes them into the markdown files between markers,
 * docs-build.mjs renders them into /docs/, bench-tables.mjs stamps the
 * benchmark tables. Sizes are measured here, at build, never typed.
 */
import { buildSync } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const VARS = [
  ['`--sv-view`', '−1 → 0 → 1', 'Below the live band → inside it (flat at 0) → gone above'],
  ['`--sv-t`', '0 → 1', 'Travel through the viewport (same semantics as native `view()`)'],
  ['`--sv-pin`', '0 → 1', 'Progress across a pinned (sticky) stretch: curtains, rails, scrubbing'],
  ['`--sv-scene`', '0 → n−1', 'Scene index of a pinned section, eased and snapped'],
  ['`--sv-scenes`', 'n', 'Scene count, next to `--sv-scene`: progress is `var(--sv-scene) / (var(--sv-scenes) - 1)`'],
  ['`--sv-page` / `--sv-v`', '0 → 1 / ±vh/s', 'On `<html>`: progress through the document, and signed velocity in viewport-heights per second (decays to 0 at rest)'],
  ['`--mx` / `--my`', '−1 → 1', "Pointer offset from the element's center, clamped (pointer module)"],
  ['`.sv-live`', 'class', 'On while inside the activation band (enter 75%, exit 25% of the viewport); `once` latches it'],
]
export const DERIVED =
  'Derived by presets and components, not the driver: `--sv-r` (sv-range slice), `--sd` and `--sv-progress` (slider), `--sv-state` (toggles), `--sv-act` (sv-acts).'

export function varsMarkdown() {
  return ['| output | range | meaning |', '| --- | --- | --- |', ...VARS.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n\n' + DERIVED
}
const code = (s) => s.replace(/`([^`]+)`/g, (m, c) => `<code>${c.replace(/</g, '&lt;')}</code>`)
export function varsHtml() {
  return (
    '<table>\n<tr><th>output</th><th>range</th><th>meaning</th></tr>\n' +
    VARS.map((r) => `<tr><td>${code(r[0])}</td><td>${r[1]}</td><td>${code(r[2])}</td></tr>`).join('\n') +
    '\n</table>\n<p>' + code(DERIVED) + '</p>'
  )
}

/** min+gzip KB per entry point, measured from dist with esbuild (what a bundler ships). */
export function measureSizes(root) {
  const build = (opts) =>
    gzipSync(buildSync({ bundle: true, minify: true, format: 'esm', write: false, logLevel: 'silent', external: ['react', 'react-dom'], ...opts }).outputFiles[0].contents).length / 1024
  const entry = (rel) => build({ entryPoints: [join(root, 'dist', rel)] })
  const cssKb = (name) => gzipSync(readFileSync(join(root, 'styles', `${name}.css`))).length / 1024
  const kb = (n) => n.toFixed(1)
  const driver = entry('core/driver.js')
  return {
    driver: kb(driver),
    driverScan: kb(build({ stdin: { contents: "export * from './dist/core/driver.js'; export * from './dist/core/scan.js'", resolveDir: root }, })),
    slider: kb(entry('core/slider.js')),
    pointer: kb(entry('core/pointer.js')),
    canvas: kb(entry('canvas/index.js')),
    everything: kb(entry('index.js')),
    typical: kb(driver + cssKb('core')),
    stylesAll: kb(gzipSync(readFileSync(join(root, 'styles.css'))).length / 1024),
    css: Object.fromEntries(['core', 'pin', 'slider', 'tilt', 'state', 'ui'].map((n) => [n, kb(cssKb(n))])),
  }
}
