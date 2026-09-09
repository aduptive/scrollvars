// Frozen, benchmark-only variants of the same slider source. No core API change.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
const source = execFileSync('git', ['show', 'v1.15.2:src/core/slider.ts'], { cwd:new URL('../../../', import.meta.url), encoding:'utf8' })
const removal = "    container.classList.remove('sv-gliding')"
assert.equal(source.split(removal).length, 2, 'Expected one stopGlide removal to compare')
for (const mode of ['original', 'guarded', 'no-outputs']) {
  let contents = source
  if (mode === 'guarded') contents = contents.replace(removal, "    if (container.classList.contains('sv-gliding')) container.classList.remove('sv-gliding')")
  if (mode === 'no-outputs') {
    for (const write of [
      "      slide.style.setProperty('--sd', sd.toFixed(4))",
      "    container.style.setProperty('--sv-progress', p.toFixed(4))",
      "      container.style.setProperty('--sv-slide', String(best))",
    ]) {
      assert.equal(contents.split(write).length, 2, `Expected one output: ${write}`)
      contents = contents.replace(write, '')
    }
  }
  await build({
    stdin: { contents, loader:'ts' },
    bundle:true, minify:true, target:'es2020', format:'iife',
    globalName:mode === 'guarded' ? 'GuardedSlider' : mode === 'no-outputs' ? 'NoOutputSlider' : 'OriginalSlider',
    outfile:new URL(`../slider-${mode}.js`, import.meta.url).pathname,
  })
}
