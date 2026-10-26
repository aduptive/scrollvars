import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSync } from 'esbuild'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { measureReactImports } from '../scripts/docs-data.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
let baseline
test('distribution processing preserves client boundaries and editor documentation', () => {
  assert.match(readFileSync(join(root, 'dist/react/index.js'), 'utf8'), /^['"]use client['"];?/)
  assert.match(readFileSync(join(root, 'dist/canvas/index.d.ts'), 'utf8'), /\/\*\* Canvas size in CSS pixels/)
})

before(() => {
  baseline = mkdtempSync(join(tmpdir(), 'sv-unannotated-'))
  cpSync(join(root, 'dist'), join(baseline, 'dist'), { recursive: true })
  cpSync(join(root, 'package.json'), join(baseline, 'package.json'))
  const path = join(baseline, 'dist/react/index.js'), source = readFileSync(path, 'utf8')
  const annotation = /Slider = \/\*\s*[@#]__PURE__\s*\*\/ React\.forwardRef/
  assert.match(source, annotation)
  writeFileSync(path, source.replace(annotation, 'Slider = React.forwardRef'))
})
after(() => { if (baseline) rmSync(baseline, { recursive: true, force: true }) })
const retainsSlider = report => report.inputs.some(path => path.endsWith('core/slider.js'))

for (const name of ['usePointer', 'ScrollVarsBoot']) test(`React bundle: ${name} drops unused Slider and its engine`, () => {
  const entry = `export { ${name} } from './dist/react/index.js'`
  const fixed = measureReactImports(root, entry)
  const before = measureReactImports(baseline, entry)
  assert.equal(retainsSlider(before), true, 'control reproduces the released retention defect')
  assert.equal(retainsSlider(fixed), false)
  assert.ok(before.gzipBytes - fixed.gzipBytes > 4000)
  if (name === 'usePointer') assert.ok(fixed.minBytes < 5000)
})

test('React bundle: a consumer that uses Slider still retains it', () => {
  const entry = "export { ScrollVarsBoot, usePointer, Slider, Slide } from './dist/react/index.js'; export {track,prefersReducedMotion} from './dist/index.js'; export {mountEffect} from './dist/canvas/index.js'"
  const fixed = measureReactImports(root, entry)
  const before = measureReactImports(baseline, entry)
  assert.equal(retainsSlider(fixed), true)
  assert.equal(fixed.minBytes, before.minBytes)
  assert.ok(Math.abs(fixed.gzipBytes - before.gzipBytes) <= 1)
})

for (const [module, names] of [['index', 'slider'], ['react/index', 'useSlider'], ['react/index', 'Slider, Slide']]) {
  test(`Slider-only bundle: ${names} excludes unrelated engines`, () => {
    const report = measureReactImports(root, `export { ${names} } from './dist/${module}.js'`)
    assert.equal(retainsSlider(report), true)
    for (const path of ['core/driver.js', 'core/scan.js', 'core/pointer.js', 'core/toggles.js', 'core/split.js', 'canvas/index.js', 'debug/index.js']) {
      assert.equal(report.inputs.some(input => input.endsWith(path)), false, path)
    }
  })
}

test('React bundle: a bundled Slider still server renders its actual slides and controls', () => {
  const { outputFiles } = buildSync({
    stdin: { contents: "export { Slider } from './dist/react/index.js'", resolveDir: root },
    bundle: true, minify: true, format: 'cjs', platform: 'node', write: false,
    external: ['react', 'react-dom'], logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputFiles[0].text)(createRequire(import.meta.url), module, module.exports)
  const html = renderToStaticMarkup(createElement(module.exports.Slider, { arrows: true, dots: true },
    createElement('div', null, 'First'), createElement('div', null, 'Second')))
  assert.match(html, /First/)
  assert.match(html, /Second/)
  assert.equal((html.match(/aria-roledescription="slide"/g) ?? []).length, 2)
  assert.match(html, /previous slide/)
  assert.match(html, /go to slide 2/)
})
