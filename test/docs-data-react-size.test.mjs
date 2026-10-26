import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildSync } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'

import { measureSizes, measureReactImports } from '../scripts/docs-data.mjs'

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

test('measureSizes().react is a plausible static consumer graph size', () => {
  const sizes = measureSizes(root)
  assert.ok(parseFloat(sizes.react) > 10, `react size reads implausibly small: ${sizes.react}`)
})

test('consumer measurement counts static shared chunks and excludes lazy code', t => {
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), 'sv-shared-size-')))
  t.after(() => rmSync(fixture, { recursive: true, force: true }))
  mkdirSync(join(fixture, 'dist/react'), { recursive: true })
  writeFileSync(join(fixture, 'dist/react/index.js'), "export { shared } from '../shared.js'; export const load = () => import('../lazy.js')")
  writeFileSync(join(fixture, 'dist/shared.js'), 'export const shared = value => Math.sin(value) + Math.cos(value)')
  writeFileSync(join(fixture, 'dist/lazy.js'), "import { shared } from './shared.js'; export const debug = () => shared(42)")
  const sizes = measureReactImports(fixture, "export * from './dist/react/index.js'")
  // Compare identical entry/output paths: chunk hashes also affect gzip size.
  const { outputFiles } = buildSync({
    absWorkingDir: fixture,
    stdin: { contents: "export * from './dist/react/index.js'", resolveDir: fixture, sourcefile: 'docs-import.js' },
    bundle: true, minify: true, treeShaking: true, platform: 'browser', target: 'es2020',
    splitting: true, format: 'esm', outdir: join(fixture, 'dist/.docs-data-split'), write: false,
    external: ['react', 'react-dom'],
  })
  const staticFiles = outputFiles.filter(file => !basename(file.path).startsWith('lazy-'))
  assert.equal(staticFiles.length, 2, 'fixture must actually produce a static shared chunk')
  assert.equal(sizes.minBytes, staticFiles.reduce((sum, file) => sum + file.contents.length, 0))
  assert.equal(sizes.gzipBytes, staticFiles.reduce((sum, file) => sum + gzipSync(file.contents, { level: 9 }).length, 0))
  assert.ok(sizes.inputs.includes('dist/shared.js'))
  assert.ok(!sizes.inputs.includes('dist/lazy.js'))
})
