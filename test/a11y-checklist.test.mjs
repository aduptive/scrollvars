import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const guide = readFileSync(join(root, 'docs', 'guide.md'), 'utf8')

// ---- ADU (loop8-3, D3/P1): the VoiceOver checklist used to name pages
// that could never pass (a vanilla slider preview, a dialog no page
// shipped, an Accordion no row named). Every page a checklist row points
// at must resolve to a real file under demo/, or Andrea's pass runs
// against a page that does not exist.
test('every VoiceOver checklist row points at a page that exists under demo/', () => {
  const section = guide.slice(guide.indexOf('### VoiceOver pass'), guide.indexOf('Your side of it, as a checklist:'))
  const paths = new Set()
  for (const m of section.matchAll(/`(\/(?:a11y|fx|docs|bench)\/[^`]*)`/g)) {
    const path = m[1].split('"')[0].trim()
    paths.add(path)
  }
  assert.ok(paths.size > 0, 'the checklist names at least one page')
  const problems = []
  for (const path of paths) {
    const file = path.endsWith('/') ? join(root, 'demo', path, 'index.html') : join(root, 'demo', path)
    if (!existsSync(file)) problems.push(`${path} -> ${file} does not exist`)
  }
  assert.deepEqual(problems, [])
})

test('the a11y checklist fixture is built and served at demo/a11y/', () => {
  assert.ok(existsSync(join(root, 'demo', 'a11y', 'index.html')))
  assert.ok(existsSync(join(root, 'demo', 'a11y', 'kit.js')))
  const html = readFileSync(join(root, 'demo', 'a11y', 'index.html'), 'utf8')
  assert.match(html, /sv\.css/, 'links the shipped stylesheet, not an unstyled fixture')
  const kit = readFileSync(join(root, 'demo', 'a11y', 'kit.js'), 'utf8')
  for (const marker of ['slider-section', 'scenes-section', 'sv-marquee-pause', 'sv-words-pause']) {
    assert.ok(kit.includes(marker), `kit.js is missing ${marker}`)
  }
})
