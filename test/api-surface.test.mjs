import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// Type-only additions have no runtime Object.keys entry. Keep their public
// declaration names and the inherited hook/wrapper route alongside that list.
const STATUS_SURFACE = ['AttachmentStatus', 'TrackOptions.onStatus']
test('slider loop options and navigation availability are public', () => {
  const slider = readFileSync(new URL('../dist/core/slider.d.ts', import.meta.url), 'utf8')
  const react = readFileSync(new URL('../dist/react/index.d.ts', import.meta.url), 'utf8')
  for (const declaration of [slider, react]) assert.match(declaration, /align\?: 'start' \| 'center' \| 'end'/)
  for (const name of ['loop', 'rewind']) {
    assert.match(slider, new RegExp(`${name}\\?: boolean`))
    assert.match(react, new RegExp(`${name}\\?: boolean`))
  }
  for (const name of ['canPrev', 'canNext']) assert.match(slider, new RegExp(`${name}: boolean`))
})
test('Glass polygon option is public through vanilla and React', () => {
  const glass = readFileSync(new URL('../dist/glass/index.d.ts', import.meta.url), 'utf8')
  const react = readFileSync(new URL('../dist/react/glass.d.ts', import.meta.url), 'utf8')
  assert.match(glass, /points\?: readonly number\[\]/)
  assert.match(react, /interface GlassProps extends GlassOptions/)
})
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
  glass: ['mountGlass'],
  reactGlass: ['Glass'],
  debug: ['debug'],
}

test('public API surface is intact (breaking changes trip this on purpose)', async () => {
  const mods = {
    core: await import('../dist/index.js'),
    react: await import('../dist/react/index.js'),
    canvas: await import('../dist/canvas/index.js'),
    glass: await import('../dist/glass/index.js'),
    reactGlass: await import('../dist/react/glass.js'),
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

test('the public reference documents every shipped runtime module and export', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const html = readFileSync(new URL('../demo/docs/index.html', import.meta.url), 'utf8')
  const reference = html.split('<h2 id="exports">')[1].split('<h2')[0]
  const names = new Set([...reference.matchAll(/<code>(.*?)<\/code>/gs)]
    .flatMap(match => match[1].split(/[^\w$]+/)))
  for (const [key, target] of Object.entries(pkg.exports)) {
    if (!target.endsWith('.js')) continue
    const specifier = key === '.' ? pkg.name : pkg.name + key.slice(1)
    assert.ok(reference.includes(specifier), `Document the ${specifier} entry point`)
    const module = await import(specifier)
    for (const name of Object.keys(module)) {
      assert.ok(names.has(name), `Document ${name} from ${specifier}`)
    }
  }
})
