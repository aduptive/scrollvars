#!/usr/bin/env node
/**
 * Regenerates the verbatim-dist inline blocks in demo/index.html from the
 * built dist — the demo must never be hand-patched (that class of bug bit
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
  const marker = `/* ═══════ ${block.label} — inlined from the built dist, verbatim ═══════ */`
  const wrapped = `${marker}\n  var ${block.name} = (function () {\n${dist}\n  return ${block.name};\n  })();`
  const re = new RegExp(
    `${escapeRe(marker)}\\n  var ${block.name} = \\(function \\(\\) \\{[\\s\\S]*?\\n  return ${block.name};\\n  \\}\\)\\(\\);`
  )
  if (!re.test(html)) throw new Error(`marker block not found for "${block.label}"`)
  html = html.replace(re, wrapped)
}

// post-checks — the same ones this repo's history proved necessary
const script = html.match(/<script>\n\s*\/\* ═+ scrollvars core[\s\S]*?<\/script>/)
if (!script) throw new Error('main demo script block not found')
new Function(script[0].replace(/<\/?script>/g, '')) // throws on syntax errors
if (/^\s*export /m.test(script[0])) throw new Error('an `export` leaked into the demo script')

if (html !== before) {
  writeFileSync(demoPath, html)
  console.log('demo synced from dist')
} else {
  console.log('demo already in sync')
}
