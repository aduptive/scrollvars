import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EFFECTS, COMPONENTS } from '../scripts/fx-data.mjs'

// Every `npx scrollvars add <slug>` file must compile against the built dist,
// type-check on its own (a consumer's `tsc` run is the real gate, not ours),
// declare what it needs in the registry, render on the server, and use the
// preset vocabulary its gallery preview shows: the installed component and
// the preview are two sources, this is the contract that keeps them honest.
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

// ---- requires.tailwind: a component whose installed content leans on
// Tailwind utility classes must say so, so the CLI can warn a consumer who
// has no Tailwind pipeline. Anything that is not `sv-*` and not a selector
// defined in the component's own embedded `<style>` counts as a utility.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function utilityTokens(content) {
  const styleMatch = content.match(/const css = `([\s\S]*?)`/)
  const style = styleMatch ? styleMatch[1] : ''
  const attrRe = /\w*[Cc]lassName\s*[:=]\s*\{?\s*(?:`([^`]*)`|'([^']*)'|"([^"]*)")/g
  const found = new Set()
  let m
  while ((m = attrRe.exec(content))) {
    const raw = m[1] ?? m[2] ?? m[3] ?? ''
    for (const tok of raw.split(/\s+/)) {
      if (!tok || tok.startsWith('sv-') || tok.includes('$') || tok.includes('{')) continue
      if (style && new RegExp(`\\.${escapeRe(tok)}(?![\\w-])`).test(style)) continue
      found.add(tok)
    }
  }
  return found
}

// ---- tsc --noEmit over every installed fixture, together, against the
// repo's installed React types (React 18 is ADU-101, not this check). gsap
// and three ship no devDependency here: minimal ambient stubs stand in, just
// enough to exercise our own code, not gsap/three's full surface.
const tscDir = join(outDir, 'tsc')
mkdirSync(tscDir, { recursive: true })
const NEEDS_STUB = {
  gsap: !existsSync(join(root, 'node_modules', 'gsap')),
  three: !existsSync(join(root, 'node_modules', 'three')),
}
const AMBIENT_GSAP = `declare module 'gsap' {
  function gsap(): void
  namespace gsap {
    namespace core {
      class Timeline {
        progress(value?: number): this
        kill(): void
      }
    }
  }
  export default gsap
}
`
const AMBIENT_THREE = `declare module 'three' {
  export class Object3D { rotation: { x: number; y: number; z: number }; position: { x: number; y: number; z: number } }
  export class BufferGeometry { dispose(): void }
  export class TorusKnotGeometry extends BufferGeometry { constructor(radius?: number, tube?: number, tubularSegments?: number, radialSegments?: number) }
  export class Material { dispose(): void }
  export class MeshNormalMaterial extends Material { constructor(parameters?: unknown) }
  export class Mesh extends Object3D { constructor(geometry: BufferGeometry, material: Material); geometry: BufferGeometry; material: Material }
  export class Scene { add(object: Object3D): void }
  export class Camera extends Object3D {}
  export class PerspectiveCamera extends Camera { constructor(fov?: number, aspect?: number, near?: number, far?: number); aspect: number; updateProjectionMatrix(): void }
  export class WebGLRenderer { constructor(parameters?: unknown); setPixelRatio(value: number): void; setSize(width: number, height: number, updateStyle?: boolean): void; render(scene: Scene, camera: Camera): void; dispose(): void }
}
`
const tscFiles = []
for (const fx of EFFECTS) {
  const { file, content } = COMPONENTS[fx.slug]
  writeFileSync(join(tscDir, file), content)
  tscFiles.push(file)
}
if (NEEDS_STUB.gsap) {
  writeFileSync(join(tscDir, 'gsap.d.ts'), AMBIENT_GSAP)
  tscFiles.push('gsap.d.ts')
}
if (NEEDS_STUB.three) {
  writeFileSync(join(tscDir, 'three.d.ts'), AMBIENT_THREE)
  tscFiles.push('three.d.ts')
}
// tsc 7 dropped `baseUrl`: paths must be relative to this tsconfig's own folder
const distRel = relative(tscDir, join(root, 'dist')).split(sep).join('/')
writeFileSync(
  join(tscDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['DOM', 'ESNext'],
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        paths: { scrollvars: [`${distRel}/index.d.ts`], 'scrollvars/*': [`${distRel}/*`] },
      },
      include: tscFiles,
    },
    null,
    2
  )
)
let tscOutput = ''
let tscFailed = false
try {
  execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['--project', 'tsconfig.json'], {
    cwd: tscDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (err) {
  tscFailed = true
  tscOutput = (err.stdout || '') + (err.stderr || '')
}
// Attribution is for the nicer per-fixture message only (below), never the
// gate itself: a config-level failure (a bad compilerOption, say) prints as
// `tsconfig.json(9,25): error TS6046: ...`, which never matches the per-file
// `<name>.tsx(line,col)` regex and is simply unattributed here.
const allTscErrorLines = tscOutput.split('\n').filter((line) => /error TS\d+/.test(line))
const tscErrorsByFile = new Map()
for (const line of allTscErrorLines) {
  const m = line.match(/^([\w.-]+\.tsx?)\(\d+,\d+\)/)
  if (m) tscErrorsByFile.set(m[1], [...(tscErrorsByFile.get(m[1]) ?? []), line])
}
const attributedTscErrorCount = [...tscErrorsByFile.values()].reduce((n, lines) => n + lines.length, 0)

// This is the real gate: fail the whole file on ANY non-zero tsc exit, no
// matter how (or whether) the diagnostics get attributed to a fixture file.
// The per-fixture attribution below is only a nicer message on top of this;
// it is not itself the gate. A prior version asserted only that attribution
// was internally consistent (every error line matched some file), which
// missed diagnostics attributed to a file nothing here asserts on: the
// ambient stubs `gsap.d.ts` / `three.d.ts` are compiled in scope (needed to
// exercise gsap-scrub/three-scene) but are not one of the EFFECTS fixtures,
// so a syntax error injected into AMBIENT_GSAP/AMBIENT_THREE attributed
// cleanly to `gsap.d.ts(line,col)` and passed every fixture test and the old
// meta-test alike, with tsc having exited 1 the whole time.
test('tsc gate fails the suite on any tsc error, attributed or not', () => {
  assert.equal(
    tscFailed,
    false,
    `tsc exited non-zero over the installed fixtures (${allTscErrorLines.length} error(s), ` +
      `${attributedTscErrorCount} attributed to a fixture file); raw output:\n${tscOutput}`
  )
})

for (const fx of EFFECTS) {
  test(`cli component ${fx.slug}: type-checks, declares requires, compiles${COMPILE_ONLY.has(fx.slug) ? '' : ', renders, matches its preview'}`, async () => {
    const { file, content } = COMPONENTS[fx.slug]

    const tscErrors = tscErrorsByFile.get(file) ?? []
    assert.deepEqual(tscErrors, [], `${file} fails to type-check:\n${tscErrors.join('\n')}`)

    const utility = utilityTokens(content)
    assert.ok(
      utility.size === 0 || fx.requires?.tailwind === true,
      `${fx.slug}: content uses non-sv, non-component classes (${[...utility].join(', ')}) but requires.tailwind is not set`
    )

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
