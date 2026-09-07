import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Some prose claims live in BOTH a shipped source comment (tsc emits it
// verbatim into dist) and README.md. Nothing enforced the two stayed
// equal, and the same pair escaped three times: ADU-159 shipped a false
// sentence to npm through src/compat/index.ts's header, ADU-168's
// narrowing missed the driver's own pin comment, ADU-170's first pass
// missed it again. Each test below extracts the claim from BOTH real
// files and compares them to each other, never to a copy hand-typed a
// third time in here: if the anchor text around a claim moves, the match
// fails with "anchor not found" instead of silently comparing nothing.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const compatSrc = readFileSync(join(root, 'src/compat/index.ts'), 'utf8')
const driverSrc = readFileSync(join(root, 'src/core/driver.ts'), 'utf8')

function extract(text, re, label) {
  const m = text.match(re)
  assert.ok(m, `${label}: anchor text not found, wording moved`)
  return m
}

// Strips `//` line-comment markers and backticks, then collapses wrapped
// lines to one space, so a comment split across source lines compares
// equal to README's unwrapped prose.
const norm = (s) => s.replace(/^\s*\/\/\s?/gm, '').replace(/`/g, '').replace(/\s+/g, ' ').trim()
const presets = (s) => s.match(/sv-[a-z-]+/g) ?? []
const units = (s) => [...new Set(s.match(/\b(px|rem|em|svh|lvh|dvh|vh|vw)\b/g) ?? [])].sort()

test('compat fallback preset list: src/compat/index.ts header vs README Extended floor paragraph', () => {
  const src = extract(
    compatSrc,
    /same nine presets README lists:([\s\S]*?)\.\s+Written/,
    'src/compat/index.ts header'
  )[1]
  const doc = extract(
    readme,
    /reveal presets \(([\s\S]*?)\) and the pin presets ([\s\S]*?) \(written without/,
    'README.md Extended floor paragraph'
  )
  assert.deepEqual(presets(src), [...presets(doc[1]), ...presets(doc[2])])
})

test('driver pin-helper comment and README pinning paragraph state the same release condition', () => {
  const src = extract(
    driverSrc,
    /tall relative wrapper\);\s*([\s\S]*?), the wrapper stays in flow/,
    'src/core/driver.ts pin helper comment'
  )[1]
  const doc = extract(
    readme,
    /returns to flow without JS, ([\s\S]*?)\. Sticky header\?/,
    'README.md pinning paragraph'
  )[1]
  assert.equal(norm(src), norm(doc))
})

test('--sv-pin-offset unit list: driver readPinOffset comment vs README pinning paragraph', () => {
  const src = extract(
    driverSrc,
    /as a number of px[\s\S]*?vw \(window\.innerWidth\)/,
    'src/core/driver.ts readPinOffset comment'
  )[0]
  const doc = extract(readme, /Only px[\s\S]*?resolve there today/, 'README.md pinning paragraph')[0]
  assert.deepEqual(units(src), units(doc))
})
