/**
 * Renders a gallery preview FROM the installed component itself, so preview
 * markup and the CLI's installed source cannot drift (they are one render,
 * not two hand-typed strings). Same pipeline test/cli-components.test.mjs
 * proves every fixture against: esbuild + the resolveScrollvars plugin
 * compiles COMPONENTS[slug].content against the built dist, then
 * react-dom/server renders it with the effect's own `previewProps`.
 *
 * Only a handful of Section effects (whole premium blocks, not single
 * presets) opt into this: SECTION_PREVIEW_SLUGS. Everything else in
 * fx-data.mjs keeps a hand-written `preview` string.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const SECTION_PREVIEW_SLUGS = new Set([
  'hero-cinematic',
  'timeline-scrub',
  'sticky-steps',
  'stats-countup',
])

export const resolveScrollvars = {
  name: 'scrollvars-dist',
  setup(buildApi) {
    buildApi.onResolve({ filter: /^scrollvars(\/.*)?$/ }, (args) => {
      const sub = args.path.slice('scrollvars'.length)
      return { path: join(root, 'dist', sub ? sub.slice(1) : '', 'index.js') }
    })
  },
}

/**
 * Compiles one installed component (a COMPONENTS[slug] entry: {file, content})
 * against the built dist and imports it. Bundles live under node_modules/.cache
 * so their `react` import resolves to the same instance react-dom/server uses.
 */
export async function loadComponent(slug, { file, content }) {
  const cacheDir = join(root, 'node_modules', '.cache', 'sv-fx-render')
  mkdirSync(cacheDir, { recursive: true })
  const src = join(cacheDir, file)
  writeFileSync(src, content)
  const out = join(cacheDir, `${slug}.mjs`)
  await build({
    entryPoints: [src],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [resolveScrollvars],
    logLevel: 'silent',
  })
  const mod = await import(pathToFileURL(out).href)
  const name = content.match(/export function (\w+)/)[1]
  return mod[name]
}

/**
 * renderToStaticMarkup with representative props, failing loudly on any
 * React warning (console.error): a bad prop, a missing key, anything the
 * preview would otherwise bake silently into demo/fx/<slug>.html.
 */
export function renderStatic(Component, props) {
  const warnings = []
  const original = console.error
  console.error = (...args) => warnings.push(args.map(String).join(' '))
  let markup
  try {
    markup = renderToStaticMarkup(h(Component, props))
  } finally {
    console.error = original
  }
  if (warnings.length) {
    throw new Error(`renderStatic: React warning(s):\n${warnings.join('\n')}`)
  }
  return markup
}

/**
 * The full gallery preview for one Section: the component's own static
 * markup (its embedded <style> included, it is part of the same render),
 * the sv-stage chrome the other fx pages carry (fxsticky), and, only where
 * the component attaches via a client hook (usePointer, useScenes, a bare
 * <Track pin>) instead of a scannable data-sv attribute, the same tiny
 * inline attach script the hand-written preview used, documented on the fx
 * entry as `previewScript` so it never goes missing silently.
 */
export async function renderSectionPreview(fx, componentEntry) {
  const Component = await loadComponent(fx.slug, componentEntry)
  let markup = renderStatic(Component, fx.previewProps)
  // gallery-only chrome for the pinned sticky viewport (the other fx pages'
  // preview markup gets this from a hand-written class; the component has
  // no slot for it, so it lands here, once, deterministically). Not every
  // Section in SECTION_PREVIEW_SLUGS is pin-based (hero-cinematic and
  // stats-countup use usePointer/counters instead), so a missing .sv-stage
  // is a legitimate no-op here, not the stale-anchor defect ADU-196 guards.
  markup = markup.replace('class="sv-stage', 'class="sv-stage fxsticky')
  return fx.previewScript ? `${markup}\n<script>${fx.previewScript}</script>` : markup
}
