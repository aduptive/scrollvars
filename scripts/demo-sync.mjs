#!/usr/bin/env node
/**
 * Regenerates the verbatim-dist inline blocks in demo/index.html from the
 * built dist. The demo must never be hand-patched (that class of bug bit
 * twice before this script existed). Run `npm run build` first, or use
 * `npm run demo:sync` / `npm run demo:deploy` which chain it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demoPath = join(root, 'demo', 'index.html')

/** Replaces text between two fixed anchors, throwing when an anchor moves (docs-stamp.mjs's idiom). */
const between = (text, before, after, body, label) => {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${esc(before)})[\\s\\S]*?(${esc(after)})`)
  if (!re.test(text)) throw new Error(`demo/index.html: ${label}, anchor text not found`)
  return text.replace(re, (m, a, b) => a + body + b)
}

const BLOCKS = [
  {
    name: 'mountEffect',
    label: 'scrollvars/canvas harness',
    dist: 'dist/canvas/index.js',
  },
  {
    name: 'slider',
    label: 'scrollvars slider',
    dist: 'dist/core/slider.js',
  },
  {
    name: 'toggles',
    label: 'scrollvars toggles',
    dist: 'dist/core/toggles.js',
  },
]

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let html = readFileSync(demoPath, 'utf8')
const before = html

for (const block of BLOCKS) {
  let dist = readFileSync(join(root, block.dist), 'utf8')
  dist = dist.replace(`export function ${block.name}`, `function ${block.name}`)
  if (/^export /m.test(dist)) {
    throw new Error(`${block.dist}: unexpected export left after stripping ${block.name}`)
  }
  const marker = `/* ═══════ ${block.label}, inlined from the built dist, verbatim ═══════ */`
  const wrapped = `${marker}\n  var ${block.name} = (function () {\n${dist}\n  return ${block.name};\n  })();`
  const re = new RegExp(
    `${escapeRe(marker)}\\n  var ${block.name} = \\(function \\(\\) \\{[\\s\\S]*?\\n  return ${block.name};\\n  \\}\\)\\(\\);`
  )
  if (!re.test(html)) throw new Error(`marker block not found for "${block.label}"`)
  html = html.replace(re, () => wrapped) // function replacer: dist code may contain $-patterns
}

// engine block: the whole built package as an IIFE (global `SV`). The same
// esbuild invocation fx-build.mjs uses for the bench page
{
  const { execSync } = await import('node:child_process')
  const iife = execSync(
    `npx esbuild ${join(root, 'dist/index.js')} --bundle --format=iife --global-name=SV`,
    { maxBuffer: 1e7 }
  ).toString().trimEnd()
  new Function(iife) // throws on syntax errors
  const start = '/* ═══════ scrollvars engine, inlined from the built dist, verbatim (esbuild IIFE, global `SV`) ═══════ */'
  const end = '/* ═══════ end scrollvars engine ═══════ */'
  const re = new RegExp(`${escapeRe(start)}\\n[\\s\\S]*?${escapeRe(end)}`)
  if (!re.test(html)) throw new Error('engine marker block not found')
  // replacer function: dist code must land verbatim, immune to $-patterns
  html = html.replace(re, () => `${start}\n${iife}\n${end}`)
}

// post-checks: the same ones this repo's history proved necessary
const script = html.match(/<script>\n\s*\/\* ═+ demo driver[\s\S]*?<\/script>/)
if (!script) throw new Error('main demo script block not found')
new Function(script[0].replace(/<\/?script>/g, '')) // throws on syntax errors
if (/^\s*export /m.test(script[0])) throw new Error('an `export` leaked into the demo script')

// footer stamp: version + measured wire sizes (esbuild+gzip of the dist)
{
  const { execSync } = await import('node:child_process')
  const { measureSizes } = await import('./docs-data.mjs')
  const sizes = measureSizes(root)
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  const driverKB = sizes.driver
  const coreKB = sizes.everything
  const footer = /<code>npm i scrollvars<\/code> · zero dependencies · driver [\d.]+ KB gzip · (?:whole lib|full core) [^·]+·/
  if (!footer.test(html)) throw new Error('demo footer size marker not found (it drifted silently once; never again)')
  html = html.replace(footer, `<code>npm i scrollvars</code> · zero dependencies · driver ${driverKB} KB gzip · full core ${coreKB} KB ·`)
  html = html.replace(/ · v[\d.]+ · MIT · /, ` · v${version} · MIT · `)
}

// "fully animated" browser floor, two of five surfaces rendered from BROWSER_FLOOR
// (README/AGENTS/docs-build.mjs's copy; docs/integration.md's is stamped in docs-stamp.mjs)
{
  const { BROWSER_FLOOR } = await import('./docs-data.mjs')
  const row = (key) => {
    const b = BROWSER_FLOOR[key]
    const re = new RegExp(`(<td>${b.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/td><td class="range">)[\\d.]+\\+ · \\w+ \\d{4}(<\\/td>)`)
    if (!re.test(html)) throw new Error(`demo/index.html: browser floor table row for "${b.label}" not found`)
    html = html.replace(re, (m, pre, post) => `${pre}${b.version} · ${b.date}${post}`)
  }
  row('chrome')
  row('firefox')
  row('safari')
  const prose = /Chrome [\d.]+ \/ Firefox [\d.]+ \/ Safari [\d.]+\+/
  if (!prose.test(html)) throw new Error('demo/index.html: browser floor footer sentence not found')
  html = html.replace(prose, `Chrome ${BROWSER_FLOOR.chrome.version.replace('+', '')} / Firefox ${BROWSER_FLOOR.firefox.version.replace('+', '')} / Safari ${BROWSER_FLOOR.safari.version}`)
}

// bundle/CPU numbers the home page repeats by hand: meta descriptions, the
// slider case, "the receipts" section. Same sources bench-tables.mjs reads
// for README/AGENTS/bench page (ADU-194: these had drifted independently,
// one of them citing a driver size and a "Lighthouse 100" claim nothing in
// the repo could source anymore).
{
  const { measureSizes, benchMainEngines, cpuTotalMs, GSAP_KB } = await import('./docs-data.mjs')
  const sizes = measureSizes(root)
  const engines = benchMainEngines(root)
  const sv = engines['scrollvars.html']
  const gsap = engines['gsap.html'] // idiomatic: the build "the receipts" and the home-page CPU table single out
  const framer = engines['framer.html']
  const SWIPER_GZ_KB = 42 // Swiper 11's own gzip size, same figure README's slider paragraph carries
  const bundleRatio = Math.round(GSAP_KB / parseFloat(sizes.everything))
  const sliderRatio = Math.round(SWIPER_GZ_KB / parseFloat(sizes.slider))
  const cpuRatio = (cpuTotalMs(framer) / cpuTotalMs(sv)).toFixed(1)

  html = between(html, 'No GSAP, no framework in the hot path. Driver: ', ' KB gzip.',
    sizes.driver,
    'hero carousel: zero-deps card driver size')
  html = between(html, '.sv-active for state</div>\n        <div>06<br>', ' KB, not 150</div>',
    `${Math.round(parseFloat(sizes.slider))}`,
    'slider demo slide: module size')
  html = between(html, 'The library it demonstrates is the &lt; ', ' KB part.',
    `${Math.ceil(parseFloat(sizes.everything))}`,
    'footer honesty note: core size bound')

  html = between(html, '<meta property="og:description" content="', '">',
    `28 live scroll-animation patterns on a ${sizes.driver} KB driver. Same frames as the 46 KB engines. Measured: ~${cpuRatio}× less CPU than Framer Motion. View-source is the documentation.`,
    'og:description')
  html = between(html, '<meta name="twitter:description" content="', '">',
    `28 live scroll-animation patterns on a ${sizes.driver} KB driver, ~${bundleRatio}× smaller than gsap + ScrollTrigger. Run the benchmark yourself.`,
    'twitter:description')

  // case 13: the slider headline and its body prose (both cite our own module's size)
  html = between(html,
    'case 13 · the slider module</p>\n      <h2 class="sv-rise" style="--sv-order: 1">The ',
    '</h2>',
    `${sizes.slider}&nbsp;KB carousel, ${sliderRatio}× lighter than Swiper`,
    'slider case headline')
  html = between(html,
    '+18&nbsp;KB of CSS); this module is ',
    '</strong>. Because the browser',
    `${sizes.sliderMin}&nbsp;KB minified,\n<strong>${sizes.slider}&nbsp;KB gzipped, ~${sliderRatio}× lighter`,
    'slider case body sizes')

  // "the receipts": the three ScrollVars rows of the weight-on-the-wire table
  html = between(html, '<b>ScrollVars. Everything</b></td><td class="range"><b>', '</b>',
    `not tracked / ${(parseFloat(sizes.everything) + parseFloat(sizes.stylesAll)).toFixed(1)} KB`,
    'receipts: everything row')
  html = between(html, '<b>ScrollVars. Typical page</b></td><td class="range"><b>', '</b>',
    `~${sizes.typical} KB gz`,
    'receipts: typical page row')
  html = between(html, '<b>ScrollVars driver alone</b></td><td class="range"><b>', '</b>',
    `${sizes.driverMin} KB / ${sizes.driver} KB`,
    'receipts: driver alone row')

  // "the receipts": CPU cost table. Matched by cell shape (script/total in ms,
  // heap in MB), which is what tells this table's ScrollVars/framer-motion rows
  // apart from the Lighthouse table's rows just below, same labels, different units.
  const cpuRow = (label, m) => {
    const re = new RegExp(`(<td><b>${label}</b></td><td class="range"><b>)[\\d.]+( ms</b></td><td class="range"><b>)[\\d.]+( ms</b></td><td class="range"><b>)[\\d.]+( MB</b></td>)`)
    if (!re.test(html)) throw new Error(`demo/index.html: receipts CPU row for "${label}" not found`)
    html = html.replace(re, (m0, a, b, c, d) => `${a}${m.scriptMs}${b}${cpuTotalMs(m)}${c}${m.heapMB}${d}`)
  }
  const gsapRow = (label, m) => {
    const re = new RegExp(`(<td>${label}</td><td class="range">)[\\d.]+( ms</td><td class="range">)[\\d.]+( ms</td><td class="range">)[\\d.]+( MB</td>)`)
    if (!re.test(html)) throw new Error(`demo/index.html: receipts CPU row for "${label}" not found`)
    html = html.replace(re, (m0, a, b, c, d) => `${a}${m.scriptMs}${b}${cpuTotalMs(m)}${c}${m.heapMB}${d}`)
  }
  cpuRow('ScrollVars', sv)
  gsapRow('GSAP \\+ ScrollTrigger', gsap)
  gsapRow('framer-motion', framer)
}

if (html !== before) {
  writeFileSync(demoPath, html)
  console.log('demo synced from dist')
} else {
  console.log('demo already in sync')
}
