import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSync } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { measureSizes } from '../scripts/docs-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('measureSizes().react excludes the ?sv-debug dynamic import (its own consumer chunk, never shipped to a page that does not use it)', () => {
  const sizes = measureSizes(root)
  const reactKb = parseFloat(sizes.react)

  // The naive, non-split bundle: what react/index.js weighs if the dynamic
  // `?sv-debug` import were inlined instead of code-split. A dev-only
  // module must not move the production number this measures.
  const inlined = buildSync({
    entryPoints: [join(root, 'dist', 'react/index.js')],
    bundle: true, minify: true, format: 'esm', write: false, logLevel: 'silent',
    external: ['react', 'react-dom'],
  }).outputFiles[0].contents
  const inlinedKb = gzipSync(inlined).length / 1024

  assert.ok(
    reactKb < inlinedKb - 1,
    `stamped react size (${reactKb} KB) should sit well below the inlined-with-debug size ` +
      `(${inlinedKb.toFixed(2)} KB): the debug chunk must not be counted`
  )
})

test('measureSizes().react is a plausible entry-chunk size (sanity: the split build actually found react/index.js)', () => {
  const sizes = measureSizes(root)
  assert.ok(parseFloat(sizes.react) > 10, `react size reads implausibly small: ${sizes.react}`)
})
