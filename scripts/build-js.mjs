import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

// Strip implementation comments without losing PURE annotations or declaration JSDoc.
function clean(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) clean(path)
    else if (entry.name.endsWith('.js')) {
      const { code } = transformSync(readFileSync(path, 'utf8'), {
        target: 'es2020', legalComments: 'none',
      })
      writeFileSync(path, code)
    }
  }
}
clean(fileURLToPath(new URL('../dist', import.meta.url)))
