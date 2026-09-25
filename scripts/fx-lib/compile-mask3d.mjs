/**
 * Derives the plain-JS mask3d-core from its TypeScript source with esbuild's
 * `transformSync` (a devDependency already, used elsewhere in this repo for
 * the same "strip types, keep the code" job: scripts/fx-render.mjs,
 * test/cli-components.test.mjs). TypeScript itself (7.x, the native
 * rewrite) ships no `transpileModule`-style API anymore, only an unstable
 * AST surface, so esbuild is the stable equivalent, not a new dependency.
 *
 * One function, used by both scripts/fx-data.mjs (to embed the plain-JS pane
 * in the fx gallery) and test/mask3d-core.test.mjs (to test the exact code
 * that ships, not a hand-kept twin of it).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
export const MASK3D_TS_PATH = join(here, 'mask3d-core.ts')

// esbuild emits one trailing `export { a, b, ... };` block rather than
// inline `export function`s. Fine to import as-is (tests do); a pane pasted
// into a plain <script> tag needs it gone, so this is checked, not guessed:
// throws if the shape ever stops matching exactly one such block.
function stripExportBlock(js) {
  const match = js.match(/\nexport \{\n(?:[^{}]*\n)*\};?\s*$/)
  if (!match) throw new Error('compileMask3dCore: expected exactly one trailing `export { ... }` block, found none')
  return js.slice(0, match.index).trim()
}

export function compileMask3dCore() {
  const source = readFileSync(MASK3D_TS_PATH, 'utf8')
  const { code, warnings } = transformSync(source, { loader: 'ts', target: 'es2020', format: 'esm' })
  if (warnings.length) {
    throw new Error(`compileMask3dCore: mask3d-core.ts produced warnings:\n${warnings.map((w) => w.text).join('\n')}`)
  }
  const js = code.trim()
  return { source, js, jsInline: stripExportBlock(js) }
}
