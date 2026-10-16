/**
 * The facts README.md, AGENTS.md, demo/llms.txt and /docs/ share, kept once.
 * docs-stamp.mjs writes them into the markdown files between markers,
 * docs-build.mjs renders them into /docs/, bench-tables.mjs stamps the
 * benchmark tables. Sizes are measured here, at build, never typed.
 */
import { buildSync, version as esbuildVersion } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join, relative } from 'node:path'

/** Static consumer graph, including shared chunks but excluding lazy debug code. */
export function measureReactImports(root, contents) {
  root = realpathSync(root)
  const result = buildSync({
    absWorkingDir: root,
    stdin: { contents, resolveDir: root, sourcefile: 'docs-import.js' },
    bundle: true, minify: true, treeShaking: true, format: 'esm', platform: 'browser',
    target: 'es2020', splitting: true, outdir: join(root, 'dist', '.docs-data-split'),
    write: false, metafile: true, external: ['react', 'react-dom'], logLevel: 'silent',
  })
  const outputs = result.metafile.outputs
  const entry = Object.keys(outputs).find(key => outputs[key].entryPoint === 'docs-import.js')
  if (!entry) throw new Error('docs-data: consumer entry chunk not found')
  const reachable = new Set()
  const visit = key => {
    if (reachable.has(key)) return
    reachable.add(key)
    for (const item of outputs[key].imports) if (!item.external && item.kind !== 'dynamic-import') visit(item.path)
  }
  visit(entry)
  const files = result.outputFiles.filter(file => reachable.has(relative(root, file.path)))
  const inputs = [...new Set([...reachable].flatMap(key => Object.entries(outputs[key].inputs)
    .filter(([, value]) => value.bytesInOutput > 0).map(([name]) => name)))]
  return {
    minBytes: files.reduce((sum, file) => sum + file.contents.length, 0),
    gzipBytes: files.reduce((sum, file) => sum + gzipSync(file.contents, { level: 9 }).length, 0),
    inputs,
  }
}

export function reactImportSizesMarkdown(root) {
  const version = JSON.parse(readFileSync(join(root, 'package.json'))).version
  const rows = ['usePointer', 'ScrollVarsBoot', 'Slider, Slide'].map(names => {
    const sizes = measureReactImports(root, `export { ${names} } from './dist/react/index.js'`)
    return `| \`${names}\` | ${sizes.minBytes} | ${sizes.gzipBytes} |`
  })
  return [
    `Isolated consumer bundles of ScrollVars ${version}, esbuild ${esbuildVersion}, browser ESM/ES2020; React external, CSS excluded. Counts the entry and all static shared chunks, excluding lazy debug chunks. Gzip level 9; bytes, not KB:`,
    '', '| React imports | minified bytes | gzip bytes |', '| --- | ---: | ---: |', ...rows, '',
    'These are separate import fixtures, not additive route sizes or runtime benchmarks. Actual application savings depend on its import graph and bundler.',
  ].join('\n')
}

/**
 * gsap + ScrollTrigger's own gzipped bundle size, from its public CDN build
 * (small print at the bottom of /bench/). Not ours to measure at build time,
 * so it stays a hand-kept constant, but a single one: bench-tables.mjs and
 * demo-sync.mjs both divide by it instead of each carrying their own copy
 * (ADU-194, the bundle ratio drifted independently in three places).
 */
// GSAP 3.15.0 + ScrollTrigger, CDN minified scripts, gzip level 6 / 1024.
export const GSAP_KB = 45.2

/**
 * Perf-lab frame budget (T7 evidence, "path to 8/10"), declared BEFORE any
 * device result is read, per Astra's acceptance: p95 frame time must stay
 * within `p95Factor`x the device's OWN measured vsync interval (a 60Hz and
 * a 120Hz display have different budgets, so this is never a fixed
 * millisecond figure), and no more than `lateMaxPct` percent of frames may
 * run past that same line ("late"). A run that fails either line fails
 * regardless of its own animated check. scripts/lab-tables.mjs is the only
 * reader; docs/guide.md's device matrix states this rule in prose from
 * these two numbers, never typed twice.
 */
export const LAB_FRAME_BUDGET = { p95Factor: 1.5, lateMaxPct: 1 }

export const VARS = [
  ['`--sv-view`', '−1 → 0 → 1', 'Below the live band → inside it (flat at 0) → gone above'],
  ['`--sv-t`', '0 → 1', 'Travel through the viewport (same range as native `view()` with a zero inset, cover, vertical axis)'],
  ['`--sv-pin`', '0 → 1', 'Progress across a pinned (sticky) stretch: curtains, rails, scrubbing'],
  ['`--sv-stage-width`', 'px', 'Measured inner width of a pinned .sv-stage; the rail uses it instead of the window width'],
  ['`--sv-scene`', '0 → n−1', 'Scene index of a pinned section, eased and snapped'],
  ['`--sv-scenes`', 'n', 'Scene count, next to `--sv-scene`: progress is `var(--sv-scene) / (var(--sv-scenes) - 1)`'],
  ['`--sv-page` / `--sv-v`', '0 → 1 / ±20 viewport-heights/s', 'On `<html>` once anything is tracked, and either some CSS mentions them (a `var()` read, a declaration outside `<html>`\'s own inline style, even a comment in an inline `<style>` counts; detection errs toward publishing; a declaration inline on `<html>` itself does not count, only a `var()` read there does) or `setPageOutputs(true)` was called: progress through the document, and signed velocity in viewport-heights per second, clamped to ±20, back to 0 within ~80 ms of the last scroll event'],
  ['`--mx` / `--my`', '−1 → 1', "Pointer offset from the element's center, clamped (pointer module)"],
  ['`.sv-live`', 'class', 'On while inside the activation band (enter 75%, exit 25% of the viewport); `once` latches it'],
]
export const DERIVED =
  'Derived by presets and components, not the driver: `--sv-r` (sv-range slice), `--sd` and `--sv-progress` (slider), `--sv-state` (toggles), `--sv-act` (sv-acts).'

export function varsMarkdown() {
  return ['| output | range | meaning |', '| --- | --- | --- |', ...VARS.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n\n' + DERIVED
}
/**
 * The presets `scrollvars/compat`'s fallback sheet re-expresses with
 * `transform:`, split by the variable that drives them. Three prose copies
 * used to be hand-typed (src/compat/index.ts's header, README's Extended
 * floor paragraph, the /docs/ "Older targets" paragraph) and drifted; all
 * three render from here now, docs-stamp.mjs writing the first two and
 * docs-build.mjs the third. test/claim-pairs.test.mjs checks this list
 * against the stylesheet it describes.
 */
export const COMPAT_PRESETS = {
  reveal: ['sv-rise', 'sv-fade', 'sv-slide-l', 'sv-slide-r', 'sv-auto', 'sv-drift'],
  pin: ['sv-curtain-l', 'sv-curtain-r', 'sv-rail'],
}
// Asides the shipped source comment carries and the docs leave to the selector.
export const COMPAT_PRESET_NOTES = { 'sv-auto': 'its auto-ordered children' }

/**
 * The "fully animated" floor: oldest version per engine where the ES2020
 * dist, individual transform properties (`translate:`/`rotate:`/`scale:`
 * as their own CSS properties) and `:is()`/`:where()` (the enhanced-path
 * `.sv-on :is(.sv, [data-sv])` selectors core.css, pin.css and state.css
 * write) all work. Firefox shipped individual transforms first (72, Jan
 * 2020) but `:is()`/`:where()` later (78, Jun 2020), so `:is()`/`:where()`
 * is Firefox's binding constraint; Chrome and Safari are bound by
 * individual transforms either way. Five hand-typed prose copies of this
 * floor drifted (ADU-181): README, AGENTS and the docs-build.mjs template
 * already agreed here; docs/integration.md and demo/index.html said
 * Firefox 74+ (Mar 2020), which matches nothing this floor depends on.
 * All five render from here now. Separate from `scrollvars/compat`'s
 * fallback floor (~Chrome 61 / Firefox 60 / Safari 11), which this does
 * not touch.
 */
export const BROWSER_FLOOR = {
  chrome: { label: 'Chrome / Edge', version: '104+', date: 'Aug 2022' },
  firefox: { label: 'Firefox', version: '78+', date: 'Jun 2020', reason: [':is()', ':where()'] },
  safari: { label: 'Safari / iOS', version: '14.1+', date: 'Apr 2021' },
}

const andList = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** Flat "a, b, c" for the source comment, which keeps the per-preset asides. */
export function compatPresetsFlat(notes = {}) {
  const name = (n) => (notes[n] ? `${n} (${notes[n]})` : n)
  return [...COMPAT_PRESETS.reveal, ...COMPAT_PRESETS.pin].map(name).join(', ')
}

/** Grouped, for README (`fmt` = backticks) and /docs/ (`fmt` = <code>). */
export function compatPresetsGrouped(fmt) {
  return (
    `the reveal presets (${COMPAT_PRESETS.reveal.map(fmt).join(', ')})` +
    ` and the pin presets ${andList(COMPAT_PRESETS.pin.map(fmt))}`
  )
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
  const raw = (opts) =>
    buildSync({ bundle: true, minify: true, format: 'esm', write: false, logLevel: 'silent', external: ['react', 'react-dom'], ...opts }).outputFiles[0].contents
  const build = (opts) => gzipSync(raw(opts)).length / 1024
  const entryRaw = (rel) => raw({ entryPoints: [join(root, 'dist', rel)] })
  const entry = (rel) => build({ entryPoints: [join(root, 'dist', rel)] })
  const cssKb = (name) => gzipSync(readFileSync(join(root, 'styles', `${name}.css`))).length / 1024
  const kb = (n) => n.toFixed(1)
  // minified (pre-gzip) buffers, kept for the two figures the home page states
  // side by side with a competitor's own minified size (the carousel section,
  // "the receipts" table): everything else on the site only ever cites gzip.
  const driverBuf = raw({ stdin: { contents: "export { track } from './dist/index.js'", resolveDir: root } })
  const everythingBuf = entryRaw('index.js')
  const sliderBuf = entryRaw('core/slider.js')
  const driver = gzipSync(driverBuf).length / 1024
  // Count static shared chunks too; the dev-only debug chunk stays lazy.
  const react = measureReactImports(root, "export * from './dist/react/index.js'")
  return {
    driver: kb(driver),
    driverMin: kb(driverBuf.length / 1024),
    driverScan: kb(build({ stdin: { contents: "export { track, scan } from './dist/index.js'", resolveDir: root }, })),
    slider: kb(gzipSync(sliderBuf).length / 1024),
    sliderMin: kb(sliderBuf.length / 1024),
    pointer: kb(entry('core/pointer.js')),
    canvas: kb(entry('canvas/index.js')),
    everything: kb(gzipSync(everythingBuf).length / 1024),
    everythingMin: kb(everythingBuf.length / 1024),
    react: kb(react.gzipBytes / 1024),
    typical: kb(driver + cssKb('core')),
    stylesAll: kb(gzipSync(readFileSync(join(root, 'styles.css'))).length / 1024),
    css: Object.fromEntries(['core', 'pin', 'slider', 'tilt', 'state', 'ui', 'scoped'].map((n) => [n, kb(cssKb(n))])),
  }
}

/** Keep every public main table on the same dated snapshot. */
export const newerMain = (full, mainOnly) => mainOnly?.scenarios.some(s => s.name === 'main-900')
  && mainOnly.meta.throttle === 1 && Date.parse(mainOnly.meta.date) > Date.parse(full.meta.date)
  ? mainOnly : full

export function readBenchResults(root) {
  const results = JSON.parse(readFileSync(join(root, 'demo', 'bench', 'results', 'latest.json'), 'utf8'))
  const mainPath = join(root, 'demo', 'bench', 'results', 'main-current.json')
  const current = newerMain(results, existsSync(mainPath) ? JSON.parse(readFileSync(mainPath, 'utf8')) : null)
  return { results, current, mainFile: current === results ? 'latest.json' : 'main-current.json' }
}
