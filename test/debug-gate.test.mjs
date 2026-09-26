import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// AGENTS.md rule 4: no backdrop-filter on a fixed/sticky overlay (re-rasters
// every scroll frame; the debug panel and the HUD sit over scrolling content
// and would have the HUD itself measure that cost as the page's own).
// lint.ts's own violation-property list legitimately NAMES the property
// (it flags authors who use it against --sv-*), so only the two panels'
// own style declarations are checked (ADU-354 item 12).
test('debug: neither the debug panel nor the HUD declares backdrop-filter in its cssText', () => {
  for (const file of ['src/debug/index.ts', 'src/debug/hud.ts']) {
    const source = readFileSync(join(root, file), 'utf8')
    assert.ok(!/backdrop-filter\s*:/.test(source), `${file} declares backdrop-filter`)
  }
})
