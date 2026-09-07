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
// `.foo` in a selector, never `1.8s`, `hero.jpg` or `document.querySelector`,
// and never a class that only a comment names: prose documents nothing
const cssPaneClasses = (pane) => new Set([...stripComments(pane).matchAll(/(?<![\w-])\.([a-z][\w-]*)/g)].map((m) => m[1]))
// Two flat sets of class names cannot tell `.stat::after` from
// `.stat .count::after`, so either half of the defect above stays green on its
// own: keep the rule on the dd with the span still in the markup and the number
// is announced twice (with the suffix gone, `content` computing `counter(n) ""`);
// keep the rule on the span and drop the span from the markup and the documented
// HTML renders no number at all. A `counter()` rule is checked against the
// element it prints on, not against a bag of names.
const counterRules = (pane) =>
  [...stripComments(pane).matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .filter((m) => /(?<![\w-])content\s*:[^;}]*counter\(/.test(m[2]))
    .map((m) => ({ sel: m[1].trim().split('\n').pop().trim(), cls: [...m[1].matchAll(/\.([\w-]+)/g)].pop()?.[1] }))
// the classes the React tab hides from assistive tech: where generated digits
// belong, next to a readable copy of the same value
const hiddenClasses = (pane) =>
  new Set(
    [...stripComments(pane).matchAll(/<[a-zA-Z][^<>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => /aria-hidden\s*=\s*(?:"true"|'true'|\{\s*true\s*\})/.test(tag))
      .flatMap((tag) =>
        [...tag.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].flatMap((m) => (m[1] ?? m[2]).split(/\s+/))
      )
      .filter(Boolean)
  )

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
    // and a counter prints on ONE element in both tabs: the class the CSS tab's
    // own markup renders, and the class the React tab hides from AT
    const shown = new Set(classesIn(fx.css))
    const hidden = hiddenClasses(fx.react)
    const misplaced = counterRules(fx.css).flatMap(({ sel, cls }) => {
      const on = cls ? `.${cls}` : sel
      if (!cls || !shown.has(cls))
        return [`\`${sel}\` prints the counter on ${on}, which the CSS tab's own markup never renders`]
      if (hidden.size && !hidden.has(cls))
        return [
          `\`${sel}\` prints the counter on ${on}, but the React tab hides ` +
            `${[...hidden].map((c) => `.${c}`).join(', ')} from AT: the digits land on a box that already reads its value`,
        ]
      return []
    })
    assert.deepEqual(misplaced, [], misplaced.join('\n'))
  })
}

// ---- ADU-155: the CSS tab's reduced-motion block is what a reader pastes;
// ADU-144 fixed the installed component's own block and stopped there, so the
// tab kept resetting `.st-shot` only and every non-active step stayed at 30%
// opacity forever under reduce. Installed components scope every selector
// under their own root class (`.sv-hero`, `.sv-steps`, ...), the only allowed
// spelling difference from the CSS tab's bare selectors, stripped before
// comparing. Chrome the installed component adds beyond what the CSS tab
// documents (sticky-steps' dots) is exempt: the tab's own markup never
// renders it, so there is nothing there to reset. Sections only, same reason
// as the pane-pairing gate above: a Slider's installed component can rename
// its own class entirely (coverflow-slider's `.slide` becomes `.cf-slide`),
// which is a naming choice, not drift.
const reducedMotionSelectors = (pane, scope) => {
  const selectors = new Set()
  for (const [, block] of stripComments(pane).matchAll(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g
  ))
    for (const [, sel] of block.matchAll(/([^{}]+)\{[^{}]*\}/g))
      for (const one of sel.split(','))
        selectors.add(
          one
            .trim()
            .split(/\s+/)
            .filter((t) => t !== `.${scope}`)
            .join(' ')
        )
  return selectors
}
const wrapperScope = (content) => content.match(/className=\{className \? '([\w-]+) ' \+ className : '\1'\}/)?.[1]
const documentedClasses = (pane) => new Set([...classesIn(pane), ...cssPaneClasses(pane)])
// keep only selectors whose class the OTHER pane documents too: a class one
// pane never renders has nothing there to compare a reset against
const sharedSelectors = (selectors, otherDocumented) =>
  [...selectors].filter((sel) => selectorClasses(sel).some((c) => otherDocumented.has(c)))

for (const fx of EFFECTS.filter((e) => e.category === 'Sections' && e.css && COMPONENTS[e.slug])) {
  test(`gallery ${fx.slug}: the CSS tab and the installed component reset the same classes under reduced motion`, () => {
    const installed = COMPONENTS[fx.slug].content
    const cssSelectors = sharedSelectors(reducedMotionSelectors(fx.css), documentedClasses(installed))
    const installedSelectors = sharedSelectors(
      reducedMotionSelectors(installed, wrapperScope(installed)),
      documentedClasses(fx.css)
    )
    const missing = installedSelectors.filter((s) => !cssSelectors.includes(s))
    const extra = cssSelectors.filter((s) => !installedSelectors.includes(s))
    assert.deepEqual(
      { missing, extra },
      { missing: [], extra: [] },
      `installed component resets \`${missing.join('`, `')}\` under reduced motion, the CSS tab does not; ` +
        `the CSS tab resets \`${extra.join('`, `')}\`, the installed component does not`
    )
  })
}

// ---- ADU-167, successor of ADU-155: the gate above compares a CSS tab
// against an installed component, so a pane whose effect ships no component
// (staggered-reveal, split-reveal, marquee) had nothing to be compared to and
// kept a preset copy that stops right before the stylesheet's own
// `@media (prefers-reduced-motion: reduce)` override. Pasted, a reveal
// transitions under reduce and a marquee never stops. The other side here is
// the QUOTED STYLESHEET: a pane that re-declares a preset rule for class C
// re-declares C's reduced-motion override too, whether or not an installed
// component exists.
// Compared per CLASS, not per selector string: a sheet resets a whole family
// in one rule (`:is(.sv-rise, .sv-fade, .sv-slide-l, ...)`) and a pane
// legitimately quotes only the preset it documents.
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '')
// a pane is markup, CSS and sometimes a <script>: JS braces would read as
// rules (`.from('.sv-stage > *', { ... })` is not a selector) and pin.css
// resets .sv-stage under reduce, so an unstripped script invents a finding
const stripScripts = (s) => stripHtmlComments(s.replace(/<script[\s\S]*?<\/script>/g, ''))
// tilt.css's block is `(prefers-reduced-motion: reduce), (hover: none)`: match
// the rest of the query too, or that sheet reads as having no override at all
const REDUCE_BLOCK = /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g
// The class a rule DECLARES ON is the subject of its selector, the last
// compound: `.sv-stage .panel` styles .panel and only scopes it under the
// stage, so a pane that scopes its own boxes under .sv-stage is not
// re-declaring the stage preset. A subject with no class of its own
// (`.sv-spread > *`, `.sv-split-rise > span`, `:not(.sv-skip)`) belongs to the
// nearest ancestor compound that has one, which is the preset being quoted.
const targetClasses = (selectorList) =>
  selectorList.split(/,(?![^(]*\))/).flatMap((sel) => {
    const parts = sel.trim().split(/(?![^(]*\))[\s>+~]+/).filter(Boolean)
    for (let i = parts.length - 1; i >= 0; i--) {
      const found = selectorClasses(parts[i].replace(/:not\([^)]*\)/g, ''))
      if (found.length) return found
    }
    return []
  })
// the classes a chunk of CSS gives rules to, ignoring the engine classes every
// tracked element carries anyway
const ruleClasses = (css) =>
  new Set([...stripComments(stripScripts(css)).matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => targetClasses(m[1])))
const reduceBlocks = (css) => stripComments(stripScripts(css)).match(REDUCE_BLOCK) ?? []
const reducedClasses = (css) => new Set(reduceBlocks(css).flatMap((block) => [...ruleClasses(block)]))
const sheetResets = Object.fromEntries(STYLESHEETS.map((name) => [name, reducedClasses(styleSource[name])]))

for (const fx of EFFECTS.filter((e) => e.css)) {
  test(`gallery ${fx.slug}: the CSS tab carries the reduced-motion override of every preset rule it quotes`, () => {
    const pane = stripComments(stripScripts(fx.css))
    const blocks = pane.match(REDUCE_BLOCK) ?? []
    const reset = reducedClasses(fx.css)
    const missing = []
    for (const cls of ruleClasses(pane.replace(REDUCE_BLOCK, ''))) {
      const sheet = [...(classOwners.get(cls) ?? [])].find((name) => sheetResets[name].has(cls))
      if (sheet && !reset.has(cls))
        missing.push(
          `${fx.slug}: the CSS tab quotes a rule for .${cls} but not styles/${sheet}.css's ` +
            `reduced-motion override for it: pasted as shown, .${cls} keeps animating under reduce`
        )
    }
    // ADU-155's second pass, which no set comparison can see: at equal
    // specificity the LATER rule wins, so a preset rule re-declared BELOW the
    // reduce block silently outranks it and the block is decoration.
    // Anchored per CLASS, never on the pane's last block: sticky-steps ships
    // two reduce blocks and places the second, by design, below the rule it
    // beats, so one anchor at the end leaves every rule between them unchecked.
    let cursor = 0
    const placed = blocks.map((block) => {
      cursor = pane.indexOf(block, cursor) + block.length
      return { classes: ruleClasses(block), end: cursor }
    })
    for (const cls of reset) {
      const own = placed.filter((b) => b.classes.has(cls)).pop()
      if (own && ruleClasses(pane.slice(own.end)).has(cls))
        missing.push(
          `${fx.slug}: the CSS tab re-declares .${cls} AFTER its reduced-motion block, ` +
            `which at equal specificity wins on source order: move the block below it`
        )
    }
    assert.deepEqual(missing, [], missing.join('\n'))
  })
}

// ---- ADU-167: a pin pane pasted as shown must pin. The Curtain, Horizontal
// rail and Sequenced scrub CSS tabs shipped `class="outer"` and
// `class="sticky"` with the geometry in an HTML comment ("height: 250vh",
// "sticky; top:0") and a VALUELESS `data-sv-pin`, so a reader who pasted them
// got a wrapper with no height, a stage that never stuck and no motion at all,
// while the same effects' Tailwind and React tabs used the real helper. gsap
// and three-scene carried the same skeleton with `pin: true` in JS.
// A comment is prose, so the check reads the pane with comments stripped: the
// two things a pin needs are a length on the helper (it sets the wrapper
// height) and a sticky stage, which is `.sv-stage` unless the pane ships its
// own `position: sticky` rule.
// a length, literal ('250vh') or computed (`{steps.length * 100 + 'vh'}`), and
// never `pin: true`, which pins whatever height the wrapper already has: none,
// when the pane's wrapper is an empty div
const PIN_LENGTH = /["'][\d.]*(?:vh|vw|px|rem|em|%)["']/
const PIN_OPTION = /(?<![\w-])pin\s*[:=]\s*([^,\n}]+)/g
for (const fx of EFFECTS.filter((e) => (e.requires?.styles ?? []).includes('pin'))) {
  test(`gallery ${fx.slug}: every pane that pins carries the pin helper, not a comment about it`, () => {
    const problems = []
    for (const [tab, pane] of [
      ['css', fx.css],
      ['tailwind', fx.tailwind],
      ['react', fx.react],
    ]) {
      if (!pane) continue
      const src = stripComments(stripHtmlComments(pane))
      const attr = /data-sv-pin/.test(src)
      const options = [...src.matchAll(PIN_OPTION)]
      if (!attr && !options.length) continue // this pane claims no pin of its own
      // the attribute takes the same length the JS option takes: scan() hands
      // the driver whatever string is there, an invalid length is dropped and
      // the wrapper keeps its natural height, so `data-sv-pin="true"` pins as
      // little as a bare one
      const value = /data-sv-pin\s*=\s*(["'][^"']*["'])/.exec(src)
      if (attr && !(value && PIN_LENGTH.test(value[1])))
        problems.push(
          `${fx.slug} ${tab}: data-sv-pin=${value ? value[1] : '(bare)'} sets no height; ` +
            `the helper takes a length ("250vh"), so the wrapper keeps its natural height and nothing pins`
        )
      for (const [, opt] of options)
        if (!PIN_LENGTH.test(opt))
          problems.push(`${fx.slug} ${tab}: pin ${opt.trim()} sets no height; the helper takes a length ('250vh')`)
      // the stage lives in the MARKUP: a `.sv-stage` inside the pane's own
      // <script> (a gsap selector) is not a sticky element on the page
      const markup = stripScripts(src)
      if (!/(?<![\w-])sv-stage(?![\w-])/.test(markup) && !/position:\s*sticky/.test(markup))
        problems.push(`${fx.slug} ${tab}: pins without .sv-stage and without a position: sticky rule of its own`)
    }
    assert.deepEqual(problems, [], problems.join('\n'))
  })
}

// ---- ADU-144: a "paste the preset" block is copied by a reader with no
// core.css installed: every var(--sv-*) it reads needs its own fallback, or
// the whole declaration (or, worse, the transition shorthand around it) is
// invalid and the entrance never runs. Driver outputs a preset legitimately
// reads bare (--sv-pin, --sv-word, --sv-live) already carry one in every
// current block; this gate keeps that true instead of letting it drift back
// (staggered-reveal's --sv-ease and split-reveal's --sv-duration/--sv-ease
// shipped with no fallback, ADU-144).
const PRESET_MARKER = /\/\*\s*(?:needs [\w./-]+\.css \(or paste the preset\)|the preset \([\w./-]+\.css\))\s*:\s*\*\//
test('gallery snippets: every var(--sv-*) inside a paste-the-preset block carries a fallback', () => {
  const missing = []
  for (const fx of EFFECTS) {
    if (!fx.css) continue
    const marker = PRESET_MARKER.exec(fx.css)
    if (!marker) continue
    const block = stripComments(fx.css.slice(marker.index))
    // a var the block declares itself (--sv-live: 0, say) is not a missing
    // import: the pasted block is self-sufficient for it
    const own = new Set([...block.matchAll(/(--sv-[\w-]+)\s*:/g)].map((m) => m[1]))
    for (const v of [...block.matchAll(/var\(\s*(--sv-[\w-]+)\s*\)/g)].map((m) => m[1])) {
      if (own.has(v)) continue
      missing.push(`${fx.slug}: paste-the-preset block reads var(${v}) with no fallback`)
    }
  }
  assert.deepEqual(missing, [], missing.join('\n'))
})

test('gallery split-reveal snippet: the pasted preset keeps the inline-block rule for aria-hidden spans', () => {
  // non-replaced inline boxes (a bare <span>) ignore `translate`: without
  // this rule the pasted preset compiles but every word sits still
  // (styles/core.css 69-71 is the installed twin, ADU-144).
  const fx = EFFECTS.find((e) => e.slug === 'split-reveal')
  assert.match(fx.css, /\.sv-split\s*>\s*span\[aria-hidden\]\s*\{\s*display:\s*inline-block/)
})

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

// ---- ADU-144: RotatingWords must survive an empty word list (no interval
// dividing by zero, no NaN --sv-word) and a shrinking one (no stranded
// index). Neither bug is reachable from a single renderToStaticMarkup call:
// effects never run there, and the bug only fires once the interval ticks.
// This mounts the compiled component through react-dom/client against a
// hand-rolled DOM, the same recipe test/react.test.mjs uses for ref-attach
// tests (a container needs tagName and ownerDocument.defaultView.HTMLIFrameElement,
// or react-dom's commit phase throws before anything mounts; style needs a
// setProperty, since CSS custom properties are set that way, not as a plain
// attribute). setInterval/clearInterval are stubbed so ticks are driven by
// hand, not real time.
function makeLiveNode(tag) {
  const node = {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    childNodes: [],
    attrs: {},
    style: { setProperty(name, value) { node.style[name] = value } },
    appendChild(child) { node.childNodes.push(child); child.parentNode = node; return child },
    insertBefore(child, ref) {
      const i = ref ? node.childNodes.indexOf(ref) : -1
      if (i === -1) node.childNodes.push(child)
      else node.childNodes.splice(i, 0, child)
      child.parentNode = node
      return child
    },
    removeChild(child) {
      const i = node.childNodes.indexOf(child)
      if (i !== -1) node.childNodes.splice(i, 1)
      child.parentNode = null
      return child
    },
    setAttribute(k, v) { node.attrs[k] = v },
    removeAttribute(k) { delete node.attrs[k] },
    getAttribute(k) { return node.attrs[k] ?? null },
    addEventListener() {},
    removeEventListener() {},
    get textContent() { return node.childNodes.map((c) => c.textContent ?? '').join('') },
    set textContent(v) { node.childNodes = v ? [{ nodeType: 3, textContent: v, parentNode: node }] : [] },
  }
  return node
}

test('cli component rotating-words: an empty list schedules no interval, a late list renders, a shrinking list clamps', async () => {
  const { content } = COMPONENTS['rotating-words']
  const src = join(dir, 'RotatingWordsLive.tsx')
  writeFileSync(src, content)
  const out = join(outDir, 'rotating-words-live.mjs')
  await build({
    entryPoints: [src], outfile: out, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'], plugins: [resolveScrollvars], logLevel: 'silent',
  })
  const { RotatingWords } = await import(pathToFileURL(out).href)

  const doc = makeLiveNode('#document')
  doc.nodeType = 9
  doc.createElement = (tag) => { const el = makeLiveNode(tag); el.ownerDocument = doc; return el }
  doc.createTextNode = (text) => ({ nodeType: 3, textContent: text, parentNode: null })
  doc.createComment = (text) => ({ nodeType: 8, textContent: text, parentNode: null })
  doc.body = makeLiveNode('body')
  doc.body.ownerDocument = doc
  doc.documentElement = makeLiveNode('html')
  doc.addEventListener = () => {}
  doc.removeEventListener = () => {}
  doc.activeElement = null
  doc.HTMLIFrameElement = class HTMLIFrameElement {}
  global.window = {
    document: doc,
    addEventListener() {},
    removeEventListener() {},
    HTMLIFrameElement: doc.HTMLIFrameElement,
  }
  doc.defaultView = global.window
  global.document = doc
  global.HTMLIFrameElement = doc.HTMLIFrameElement
  global.HTMLElement = Object
  global.navigator = { userAgent: 'node' }
  global.IS_REACT_ACT_ENVIRONMENT = true

  const timers = []
  const realSetInterval = global.setInterval
  const realClearInterval = global.clearInterval
  global.setInterval = (fn) => { timers.push({ fn, live: true }); return timers.length }
  global.clearInterval = (id) => { const t = timers[id - 1]; if (t) t.live = false }

  try {
    const React = (await import('react')).default
    const { createRoot } = await import('react-dom/client')
    const { act } = React

    const container = doc.createElement('div')
    const root = createRoot(container)
    // React 18 and 19 pass this through style.setProperty differently (one
    // stringifies the numeric value first): compare numerically, not by type
    const wordVar = () => Number(container.childNodes[0].style['--sv-word'])

    await act(async () => { root.render(React.createElement(RotatingWords, { words: [] })) })
    assert.equal(wordVar(), 0, 'an empty list renders a valid index, not NaN')
    assert.ok(!timers.some((t) => t.live), 'an empty list schedules no interval (the root-cause guard)')

    // the list arrives late, after mount (the common case: fetched data)
    await act(async () => {
      root.render(React.createElement(RotatingWords, { words: ['fast', 'light', 'honest'] }))
    })
    assert.equal(wordVar(), 0)
    assert.match(container.childNodes[0].textContent, /fast/, 'a late list renders')
    const live = timers.find((t) => t.live)
    assert.ok(live, 'a populated list schedules an interval')

    // walk the index to the end of the list, then shrink the list under it
    await act(async () => { live.fn() })
    await act(async () => { live.fn() })
    assert.equal(wordVar(), 2, 'index walked to the last word')
    await act(async () => {
      root.render(React.createElement(RotatingWords, { words: ['fast', 'light'] }))
    })
    assert.equal(wordVar(), 1, '--sv-word clamps to the shrunk list, not a stranded index')

    await act(async () => { root.unmount() })
  } finally {
    global.setInterval = realSetInterval
    global.clearInterval = realClearInterval
    delete global.window
    delete global.document
    delete global.HTMLIFrameElement
    delete global.HTMLElement
    delete global.navigator
    delete global.IS_REACT_ACT_ENVIRONMENT
  }
})

// ---- ADU-188: Children.map calls back for `false` and `null` too, so a
// conditional child ({show && <Card/>}) used to wrap nothing in a real
// wrapper: an empty slide in the rail, an empty cell in the deck, an empty
// slice of the pin. Three components carried the same pair (Children.count
// for the geometry, Children.map for the render), so all three are checked
// on the same shape. The mirror of the count is the pass-through: what is
// not an element is not wrapped and not counted, but it still renders.
const CONDITIONAL_CHILDREN = () => [
  h('p', { key: 1 }, 'one'),
  false,
  null,
  'loose text',
  h('p', { key: 2 }, 'two'),
]

async function renderInstalled(slug, name, props) {
  const src = join(dir, name + 'Conditional.tsx')
  writeFileSync(src, COMPONENTS[slug].content)
  const out = join(outDir, slug + '-conditional.mjs')
  await build({
    entryPoints: [src], outfile: out, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'], plugins: [resolveScrollvars], logLevel: 'silent',
  })
  const mod = await import(pathToFileURL(out).href)
  return renderToStaticMarkup(h(mod[name], props))
}

test('cli component coverflow-slider: a conditional child renders no empty slide', async () => {
  const markup = await renderInstalled('coverflow-slider', 'CoverflowSlider', {
    children: CONDITIONAL_CHILDREN(),
  })
  // class=, not the bare class name: the component's own <style> names
  // .cf-slide twice and would pad the count
  assert.equal(markup.match(/class="cf-slide"/g).length, 2, 'two children, two slides')
  assert.equal(markup.match(/aria-label="go to slide \d+"/g).length, 2)
  assert.doesNotMatch(markup, /of 4/)
  assert.match(markup, /loose text/, 'a child that is not an element still renders')
})

test('cli component deck-spread: the fan is centred on the cards that exist', async () => {
  const markup = await renderInstalled('deck-spread', 'DeckSpread', {
    children: CONDITIONAL_CHILDREN(),
  })
  // four wrappers, two of them empty, and --sv-mid at 1.5 fanned the deck
  // around a card that is not there
  assert.equal(markup.match(/--sv-order:/g).length, 2, 'two cards, two positions')
  assert.match(markup, /--sv-order:0/)
  assert.match(markup, /--sv-order:1/)
  assert.match(markup, /--sv-mid:0\.5/, 'the midpoint of two cards is 0.5, not 1.5')
  assert.match(markup, /loose text/, 'a child that is not an element still renders')
})

test('cli component sequenced-scrub: each card gets the slice its own index earns', async () => {
  const markup = await renderInstalled('sequenced-scrub', 'SequencedScrub', {
    children: CONDITIONAL_CHILDREN(),
  })
  // the second card used to be child 3 of 4 and scrubbed over 0.75..1
  assert.equal(markup.match(/--sv-from:/g).length, 2, 'two cards, two windows')
  assert.match(markup, /--sv-from:0;/)
  assert.match(markup, /--sv-from:0\.5;/)
  assert.doesNotMatch(markup, /--sv-from:0\.75/)
  assert.match(markup, /loose text/, 'a child that is not an element still renders')
})
