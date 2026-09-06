import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EFFECTS, COMPONENTS } from '../scripts/fx-data.mjs'
import { react18TypesPaths, REACT18_CANARY } from '../scripts/react18-paths.mjs'
import { SECTION_PREVIEW_SLUGS, renderSectionPreview, renderStatic } from '../scripts/fx-render.mjs'

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
// hero-cinematic, timeline-scrub, sticky-steps, stats-countup are not fixtured
// here: their gallery preview IS this component, rendered with fx.previewProps
// (scripts/fx-render.mjs), so there is only one props source, not two.
const FIXTURES = {
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
// ADU-120: a consumer using each ref-returning hook in the natural idiom
// (`const ref = usePointer<HTMLDivElement>(); return <div ref={ref} />`, no
// `as React.RefObject<T>` cast) must type-check under both majors. The four
// EFFECTS fixtures above still cast at the JSX ref site (ADU-108, added
// before ADU-106 tightened every hook's declared return type to
// `React.RefObject<T>`); this fixture proves the cast is no longer required.
const HOOK_REF_IDIOMS_FILE = 'HookRefIdioms.tsx'
const HOOK_REF_IDIOMS_CONTENT = `import * as React from 'react'
import { useCanvasEffect, usePointer, useScenes, useSlider, useTrack } from 'scrollvars/react'

function PointerIdiom() {
  const ref = usePointer<HTMLDivElement>()
  return <div ref={ref} />
}
function TrackIdiom() {
  const ref = useTrack<HTMLDivElement>()
  return <div ref={ref} />
}
function ScenesIdiom() {
  const { ref } = useScenes<HTMLDivElement>(3)
  return <div ref={ref} />
}
function CanvasEffectIdiom() {
  const ref = useCanvasEffect({ frame: () => {} })
  return <canvas ref={ref} />
}
function SliderIdiom() {
  const { ref } = useSlider()
  return <div ref={ref} />
}
`
writeFileSync(join(tscDir, HOOK_REF_IDIOMS_FILE), HOOK_REF_IDIOMS_CONTENT)
tscFiles.push(HOOK_REF_IDIOMS_FILE)
if (NEEDS_STUB.gsap) {
  writeFileSync(join(tscDir, 'gsap.d.ts'), AMBIENT_GSAP)
  tscFiles.push('gsap.d.ts')
}
if (NEEDS_STUB.three) {
  writeFileSync(join(tscDir, 'three.d.ts'), AMBIENT_THREE)
  tscFiles.push('three.d.ts')
}
// Under `npm run test:react18`, react18-register.mjs sets SV_REACT18_DIR (a
// subprocess never sees its parent's --import hook, so this is the fixtures'
// own signal): redirect `react` to the isolated React 18 @types the same way
// react18-tsc.mjs does for src/, and add its canary, so reverting a
// React-19-only API in an installed fixture (GsapScrub's useRef typing, say)
// fails this gate instead of quietly staying green against the root's
// React 19 types.
const react18 = Boolean(process.env.SV_REACT18_DIR)
if (react18) {
  writeFileSync(join(tscDir, 'react18-canary.ts'), REACT18_CANARY)
  tscFiles.push('react18-canary.ts')
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
        paths: {
          scrollvars: [`${distRel}/index.d.ts`],
          'scrollvars/*': [`${distRel}/*`],
          ...(react18 ? react18TypesPaths(tscDir) : {}),
        },
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

// ---- requires.styles must be CLOSED, twice over: over the presets the
// component uses (the stylesheet that OWNS a class it renders has to be
// imported) and over the variables those stylesheets read. One stylesheet
// here can consume a custom property another one declares: state.css's acts
// clock is `calc(var(--sv-live) * var(--sv-acts-count))` and --sv-live is
// declared in core.css alone, so an effect that declared state.css without
// core.css computed --sv-act 0 and rendered every number as zero the moment
// the driver booted, only with JS on (ADU-129, finding 1).
// The ownership map is built over ALL stylesheets, never over the ones the
// effect declared: an earlier version iterated `requires.styles` itself, so a
// component that used .sv-stage while declaring only core.css (pin.css, which
// owns the preset, named nowhere) had no rule to read and stayed green.
// Driver outputs (--sv-t, --sv-pin, --sv-scene) and author knobs are declared
// in no stylesheet at all, so they are never flagged; a var read WITHOUT a
// fallback that another scrollvars stylesheet declares is a missing import.
const STYLESHEETS = ['core', 'pin', 'slider', 'tilt', 'state', 'ui']
// comments first: a doc comment naming `var(--sv-t)` is not a consumer
const styleSource = Object.fromEntries(
  STYLESHEETS.map((name) => [
    name,
    readFileSync(join(root, 'styles', `${name}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
  ])
)
const declaresVars = (name) =>
  new Set([
    ...[...styleSource[name].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
    ...[...styleSource[name].matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]),
  ])
// selector + body pairs. Nested at-rules never match as a whole (their body
// holds braces), so their inner rules are what land here: enough for this.
const rulesOf = (name) =>
  [...styleSource[name].matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }))
// var(--x) with no comma before the closing paren: no fallback to fall back on
const readsWithoutFallback = (body) => [...body.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1])
// classes every tracked element carries anyway: they say nothing about which
// preset a rule belongs to, so they never decide relevance on their own
const ENGINE_CLASSES = new Set(['sv', 'sv-on', 'sv-live', 'sv-open', 'sv-ui'])
const selectorClasses = (sel) => [...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]).filter((c) => !ENGINE_CLASSES.has(c))
// which stylesheet defines rules for a class, over all six
const classOwners = new Map()
for (const name of STYLESHEETS) {
  for (const rule of rulesOf(name)) {
    for (const c of selectorClasses(rule.sel)) classOwners.set(c, (classOwners.get(c) ?? new Set()).add(name))
  }
}
const varOwner = (v) => STYLESHEETS.find((name) => declaresVars(name).has(v))
// prose names presets and stylesheets it does not use ("state.css also ships
// sv-words"): only what the component renders counts as used
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const embeddedCss = (content) => (content.match(/const css = `([\s\S]*?)`/) ?? ['', ''])[1]

test('every effect declares the stylesheets its presets live in and read variables from', () => {
  const missing = []
  for (const fx of EFFECTS) {
    const declared = fx.requires?.styles ?? []
    const own = new Set(declared.flatMap((name) => [...declaresVars(name)]))
    const content = COMPONENTS[fx.slug].content
    const used = tokens(stripComments(content))
    // 1. the preset itself: whoever owns a class this component renders is an import
    const needed = new Set(declared)
    for (const cls of used) {
      const owners = classOwners.get(cls)
      if (!owners) continue // component-local class, or one of its own embedded CSS
      for (const o of owners) needed.add(o)
      if (![...owners].some((o) => declared.includes(o)))
        missing.push(
          `${fx.slug}: renders .${cls}, owned by ${[...owners].map((o) => `${o}.css`).join(' or ')}, ` +
            `not in requires.styles [${declared.join(', ') || 'none'}]`
        )
    }
    // 2. the variables those stylesheets read, over every sheet it needs
    for (const name of needed) {
      for (const rule of rulesOf(name)) {
        // only the presets this component actually uses: state.css also ships
        // sv-words, and a rotating-words consumer needs nothing from core.css
        const specific = selectorClasses(rule.sel)
        if (specific.length && !specific.some((c) => used.has(c))) continue
        for (const v of readsWithoutFallback(rule.body)) {
          if (own.has(v)) continue
          const from = varOwner(v)
          if (from) missing.push(`${fx.slug}: ${name}.css \`${rule.sel}\` reads ${v}, declared in ${from}.css`)
        }
      }
    }
    // 3. and the variables the component's OWN css string reads
    for (const v of readsWithoutFallback(stripComments(embeddedCss(content)))) {
      if (own.has(v)) continue
      const from = varOwner(v)
      if (from) missing.push(`${fx.slug}: its own CSS reads ${v}, declared in ${from}.css`)
    }
  }
  assert.deepEqual(missing, [], missing.join('\n'))
})

// ---- the gallery tabs of one Section are two spellings of the SAME block: a
// reader copies the CSS tab and pastes the React tab under it. stats-countup
// shipped `.stats .stat::after { content: counter(n) attr(data-suffix) }` next
// to a React tab whose <dd> holds a `.count` span, so the pair generated the
// number on the <dd> (with the suffix gone, data-suffix having moved to the
// span) on top of the readable value inside it: the double announcement the
// React tab exists to avoid. timeline-scrub carried the same split
// (`.tl-year::after` against a `.tl-count` span). Sections only: the smaller
// effects' React tabs are fragments and lean on Tailwind utilities the CSS tab
// never mentions (ADU-129, fix pass).
const classesIn = (pane) => [
  ...new Set(
    [...stripComments(pane).matchAll(/\bclass(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .flatMap((m) => (m[1] ?? m[2]).split(/\s+/))
      .filter(Boolean)
  ),
]
// `.foo` in a selector, never `1.8s`, `hero.jpg` or `document.querySelector`
const cssPaneClasses = (pane) => new Set([...pane.matchAll(/(?<![\w-])\.([a-z][\w-]*)/g)].map((m) => m[1]))

for (const fx of EFFECTS.filter((e) => e.category === 'Sections' && e.css && e.react)) {
  test(`gallery ${fx.slug}: the CSS tab and the React tab document one markup`, () => {
    const documented = new Set([...classesIn(fx.css), ...cssPaneClasses(fx.css)])
    const undocumented = classesIn(fx.react).filter((c) => !documented.has(c))
    assert.deepEqual(
      undocumented,
      [],
      `the React tab renders ${undocumented.join(', ')}, which the CSS tab neither shows nor styles`
    )
    // and the other way for generated content: a `content:` rule must hang off
    // an element the React tab actually renders, or the number lands on the
    // wrong box (or on two boxes at once)
    const rendered = new Set(classesIn(fx.react))
    const orphans = [...fx.css.matchAll(/\.([\w-]+)::(?:after|before)[^{]*\{[^}]*content:/g)]
      .map((m) => m[1])
      .filter((c) => !rendered.has(c))
    assert.deepEqual(orphans, [], `the CSS tab generates content on .${orphans.join(', .')}, absent from the React tab`)
  })
}

test('consumer-idiom hook refs (no cast) type-check under the installed React major', () => {
  const errors = tscErrorsByFile.get(HOOK_REF_IDIOMS_FILE) ?? []
  assert.deepEqual(errors, [], `${HOOK_REF_IDIOMS_FILE} fails to type-check:\n${errors.join('\n')}`)
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

    if (SECTION_PREVIEW_SLUGS.has(fx.slug)) {
      // The preview IS this component, rendered (scripts/fx-render.mjs), not a
      // second, hand-typed string. renderStatic itself throws on any React
      // warning on stderr, under either React version.
      const markup = renderStatic(mod[name], fx.previewProps)
      assert.ok(markup.length > 50, 'renders markup on the server')
      // demo/fx/<slug>.html is generated once, under the repo's default React
      // (19, `npm run demo:sync`), so under test:react18 this same comparison
      // IS the cross-major check: React 18's renderToStaticMarkup escapes a
      // <style> child's text (`>` becomes `&gt;`) and <style> is raw text, so
      // the entity never decodes and every child-combinator rule is dropped.
      // The components render their constant CSS with dangerouslySetInnerHTML
      // for exactly that reason; this used to `return` here instead, and the
      // corrupted React 18 markup shipped unseen (ADU-129).
      const expected = await renderSectionPreview(fx, { file, content })
      const page = readFileSync(join(root, 'demo', 'fx', `${fx.slug}.html`), 'utf8')
      assert.ok(
        page.includes(expected),
        `demo/fx/${fx.slug}.html has drifted from ${file}'s render; run npm run demo:sync`
      )
      return
    }

    const markup = renderToStaticMarkup(h(mod[name], FIXTURES[fx.slug]))
    assert.ok(markup.length > 50, 'renders markup on the server')
    const want = tokens(fx.preview)
    const have = tokens(markup)
    const skip = new Set(PREVIEW_ONLY[fx.slug] || [])
    const missing = [...want].filter((t) => !have.has(t) && !skip.has(t))
    assert.deepEqual(missing, [], `preview uses ${missing.join(', ')} but the installed component does not`)
  })
}
