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
  const { gzipSync } = await import('node:zlib')
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  const gz = (entry) =>
    (gzipSync(execSync(`npx esbuild ${join(root, entry)} --bundle --minify`, { maxBuffer: 1e7 })).length / 1024).toFixed(1)
  const driverKB = gz('dist/core/driver.js')
  const coreKB = gz('dist/index.js')
  html = html.replace(
    /<code>npm i scrollvars<\/code> · zero dependencies · driver [\d.]+ KB gzip · whole lib [^·]+·/,
    `<code>npm i scrollvars</code> · zero dependencies · driver ${driverKB} KB gzip · full core ${coreKB} KB ·`
  )
  html = html.replace(/ · v[\d.]+ · MIT · /, ` · v${version} · MIT · `)
}

if (html !== before) {
  writeFileSync(demoPath, html)
  console.log('demo synced from dist')
} else {
  console.log('demo already in sync')
}
