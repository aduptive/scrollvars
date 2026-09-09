// Frozen, benchmark-only variants of the same slider source. No core API change.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
const source = await readFile(new URL('../../../src/core/slider.ts', import.meta.url), 'utf8')
const removal = "    container.classList.remove('sv-gliding')"
assert.equal(source.split(removal).length, 2, 'Expected one stopGlide removal to compare')
for (const guarded of [false, true]) {
  await build({
    stdin: { contents:guarded ? source.replace(removal, "    if (container.classList.contains('sv-gliding')) container.classList.remove('sv-gliding')") : source, loader:'ts' },
    bundle:true, minify:true, target:'es2020', format:'iife',
    globalName:guarded ? 'GuardedSlider' : 'OriginalSlider',
    outfile:new URL(`../slider-${guarded ? 'guarded' : 'original'}.js`, import.meta.url).pathname,
  })
}
