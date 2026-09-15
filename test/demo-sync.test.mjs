import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resyncBenchEngine, bundleGallery } from '../scripts/fx-build.mjs'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test('gallery bundling accepts checkout and output paths containing spaces', () => {
  const root = mkdtempSync(join(tmpdir(), 'scrollvars round12 '))
  try {
    mkdirSync(join(root, 'dist/canvas'), { recursive: true })
    const out = join(root, 'gallery output')
    mkdirSync(out)
    symlinkSync(fileURLToPath(new URL('../node_modules', import.meta.url)), join(root, 'node_modules'))
    writeFileSync(join(root, 'dist/index.js'), 'export const value = 12')
    bundleGallery(root, out)
    const result = new Function(`${readFileSync(join(out, 'sv.js'), 'utf8')}; return SV.value`)()
    assert.equal(result, 12)
    writeFileSync(join(root, 'dist/canvas/index.js'), 'export const value = 24')
    bundleGallery(root, out, true)
    assert.equal(new Function(`${readFileSync(join(out, 'sv-canvas.js'), 'utf8')}; return SVC.value`)(), 24)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// esbuild's global IIFE output always starts with this literal prefix; the
// marker relies on it, so fixtures below carry it too, same as the real
// sv.js the script reads at build time.
const iife = '"use strict";var SV=(()=>{return 1})();\n'
// the bench page's own hand-written script resumes right after the blank
// gap, inside the same <script> tag: the marker must stop there, not eat
// the rest of the file looking for </script>.
const benchScript = "  var Q = new URLSearchParams(location.search);\n</script>"

test('resyncBenchEngine: running twice in a row is a no-op', () => {
  const fixture = `<script>\n"use strict";var SV=OLD;\n\n\n${benchScript}`
  const once = resyncBenchEngine(fixture, iife)
  const twice = resyncBenchEngine(once, iife)
  assert.equal(twice, once)
  assert.equal(once, `<script>\n${iife.trimEnd()}\n\n\n${benchScript}`)
})

test('resyncBenchEngine: heals a page that already drifted with extra blank lines', () => {
  const drifted = `<script>\n"use strict";var SV=OLD;\n\n\n\n\n\n\n\n\n${benchScript}`
  const healed = resyncBenchEngine(drifted, iife)
  assert.equal(healed, `<script>\n${iife.trimEnd()}\n\n\n${benchScript}`)
})

test('resyncBenchEngine: throws when the marker is missing', () => {
  assert.throws(() => resyncBenchEngine('<script>no marker here</script>', iife), /marker not found/)
})
