import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resyncBenchEngine } from '../scripts/fx-build.mjs'

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
