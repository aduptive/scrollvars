import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EFFECTS, COMPONENTS } from '../scripts/fx-data.mjs'

// Every `npx scrollvars add <slug>` file must compile against the built dist,
// render on the server, and use the preset vocabulary its gallery preview
// shows: the installed component and the preview are two sources, this is the
// contract that keeps them honest.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'sv-cli-'))
// bundles must live inside the repo so their `react` import resolves to the
// same React instance react-dom/server uses (a second copy breaks hooks)
const outDir = join(root, 'node_modules', '.cache', 'sv-cli')
mkdirSync(outDir, { recursive: true })
const COMPILE_ONLY = new Set(['gsap-scrub', 'three-scene']) // peer libraries are not installed here
const FIXTURES = {
  'hero-cinematic': { title: 'Sites that move with intent', eyebrow: 'Studio', copy: 'One listener.', cta: 'See the work' },
  'timeline-scrub': { steps: [{ year: 2019, text: 'a' }, { year: 2026, text: 'b' }] },
  'sticky-steps': { steps: [{ title: 'A', text: 'a', media: '01' }, { title: 'B', media: '02' }] },
  'stats-countup': { stats: [{ label: 'sites', value: 248, suffix: '+' }, { label: 'score', value: 99 }] },
  'sequenced-scrub': { children: [h('p', { key: 1 }, 'first'), h('p', { key: 2 }, 'second')] },
  'split-reveal': { children: 'Words arrive one by one' },
  'staggered-reveal': { children: [h('h2', { key: 1 }, 'Title'), h('p', { key: 2 }, 'Copy')] },
  'deck-spread': { children: [h('div', { key: 1 }, 'a'), h('div', { key: 2 }, 'b'), h('div', { key: 3 }, 'c')] },
  curtain: { children: h('h2', null, 'Revealed') },
  'horizontal-rail': { children: [h('div', { key: 1 }, 'a'), h('div', { key: 2 }, 'b')] },
  'rotating-words': { words: ['fast', 'light', 'honest'] },
  'pointer-tilt': { children: [h('div', { key: 1, className: 'sv-tilt' }, 'a')] },
  'coverflow-slider': { children: [h('div', { key: 1 }, 'a'), h('div', { key: 2 }, 'b'), h('div', { key: 3 }, 'c')], label: 'demo' },
  marquee: { children: [h('span', { key: 1 }, 'Brand'), h('span', { key: 2 }, 'Motion')] },
}
// The comparison is on preset CLASSES: the React API takes props where the
// vanilla preview writes data-sv-* attributes (tracking is attached by refs,
// never rendered). Preview-only classes that the installed file legitimately
// lacks are listed with the reason.
const PREVIEW_ONLY = {
  'staggered-reveal': ['sv-rise'], // <Reveal auto> renders sv-auto: every child rises without per-child classes
  'split-reveal': ['sv-rise'], // the preview's caption line; the component is the headline only
  'pointer-tilt': ['sv-tilt'], // the preview supplies tilt cards; the component tilts whatever children it gets
}
const tokens = (s) => new Set([...s.matchAll(/(?<![\w-])(sv-[a-z0-9-]+)(?![\w-])/g)].map((m) => m[1]))
const resolveScrollvars = {
  name: 'scrollvars-dist',
  setup(build) {
    build.onResolve({ filter: /^scrollvars(\/.*)?$/ }, (args) => {
      const sub = args.path.slice('scrollvars'.length)
      return { path: join(root, 'dist', sub ? sub.slice(1) : '', 'index.js') }
    })
  },
}

for (const fx of EFFECTS) {
  test(`cli component ${fx.slug}: compiles${COMPILE_ONLY.has(fx.slug) ? '' : ', renders, matches its preview'}`, async () => {
    const { file, content } = COMPONENTS[fx.slug]
    const src = join(dir, file)
    writeFileSync(src, content)
    const out = join(outDir, fx.slug + '.mjs')
    await build({
      entryPoints: [src], outfile: out, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
      external: ['react', 'react-dom', 'react/jsx-runtime', 'gsap', 'three'], plugins: [resolveScrollvars], logLevel: 'silent',
    })
    if (COMPILE_ONLY.has(fx.slug)) return
    const mod = await import(pathToFileURL(out).href)
    const name = content.match(/export function (\w+)/)[1]
    assert.equal(typeof mod[name], 'function', `${file} exports ${name}`)
    const markup = renderToStaticMarkup(h(mod[name], FIXTURES[fx.slug]))
    assert.ok(markup.length > 50, 'renders markup on the server')
    const want = tokens(fx.preview)
    const have = tokens(markup)
    const skip = new Set(PREVIEW_ONLY[fx.slug] || [])
    const missing = [...want].filter((t) => !have.has(t) && !skip.has(t))
    assert.deepEqual(missing, [], `preview uses ${missing.join(', ')} but the installed component does not`)
  })
}
