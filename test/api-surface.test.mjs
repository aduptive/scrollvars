import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// Type-only additions have no runtime Object.keys entry. Keep their public
// declaration names and the inherited hook/wrapper route alongside that list.
const STATUS_SURFACE = ['AttachmentStatus', 'TrackOptions.onStatus']
test('attachment status public declaration surface is intact', () => {
  const core = readFileSync(new URL('../dist/index.d.ts', import.meta.url), 'utf8')
  const driver = readFileSync(new URL('../dist/core/driver.d.ts', import.meta.url), 'utf8')
  const react = readFileSync(new URL('../dist/react/index.d.ts', import.meta.url), 'utf8')
  const names = [
    ...core.matchAll(/\b(AttachmentStatus)\b/g),
    ...driver.matchAll(/\b(onStatus)\?:/g),
  ].map(match => match[1] === 'onStatus' ? 'TrackOptions.onStatus' : match[1])
  assert.deepEqual(names, STATUS_SURFACE)
  assert.match(core, /export type \{[^}]*\bAttachmentStatus\b[^}]*\} from '\.\/core\/driver.js'/)
  assert.match(driver, /export type AttachmentStatus = 'attaching' \| 'active' \| 'completed' \| 'released' \| 'failed'/)
  assert.match(driver, /onStatus\?: \(status: AttachmentStatus\) => void/)
  assert.match(react, /useTrack[^;]*options\?: TrackOptions/)
  assert.match(react, /useScenes[^;]*options\?: Omit<TrackOptions, 'scenes' \| 'onScene'>/)
  assert.match(react, /interface TrackProps extends[^\n]*TrackOptions/)
  assert.match(react, /interface ScenesProps extends Omit<TrackProps, 'scenes' \| 'children'>/)
})

// The public surface, snapshotted. Removing or renaming ANYTHING here is a
// BREAKING change: this test failing is the tripwire — either revert, or
// bump MAJOR, update this list and write the migration in the CHANGELOG.
// Adding exports is fine (minor): add them here in the same PR.
const SURFACE = {
  core: [
    'clamp', 'easeOutCubic', 'mapRange', 'onMotionChange', 'prefersReducedMotion', 'refresh',
    'scan', 'scrollToScene', 'setMotion', 'setPageOutputs', 'slider', 'snapProgress', 'split', 'splitParts',
    'toggles', 'track', 'trackPointer',
  ],
  react: [
    'Accordion', 'Item', 'Marquee', 'Modal', 'Parallax', 'Reveal', 'Scenes',
    'ScrollVarsBoot', 'Slide', 'Slider', 'Split', 'Track', 'useCanvasEffect',
    'usePointer', 'useScenes', 'useSlider', 'useTrack',
  ],
  canvas: ['mountEffect'],
  debug: ['debug'],
}

test('public API surface is intact (breaking changes trip this on purpose)', async () => {
  const mods = {
    core: await import('../dist/index.js'),
    react: await import('../dist/react/index.js'),
    canvas: await import('../dist/canvas/index.js'),
    debug: await import('../dist/debug/index.js'),
  }
  for (const [name, expected] of Object.entries(SURFACE)) {
    const actual = Object.keys(mods[name]).sort()
    const missing = expected.filter((k) => !actual.includes(k))
    assert.deepEqual(missing, [], `${name}: exports REMOVED (breaking!): ${missing}`)
    const extra = actual.filter((k) => !expected.includes(k))
    assert.deepEqual(extra, [], `${name}: new exports not snapshotted yet: ${extra}`)
  }
})
