import assert from 'node:assert/strict'
import { test } from 'node:test'

// The public surface, snapshotted. Removing or renaming ANYTHING here is a
// BREAKING change: this test failing is the tripwire — either revert, or
// bump MAJOR, update this list and write the migration in the CHANGELOG.
// Adding exports is fine (minor): add them here in the same PR.
const SURFACE = {
  core: [
    'clamp', 'easeOutCubic', 'mapRange', 'prefersReducedMotion', 'refresh',
    'scan', 'scrollToScene', 'slider', 'snapProgress', 'split', 'splitParts',
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
