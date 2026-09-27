#!/usr/bin/env node
/**
 * Builds demo/a11y/index.html + demo/a11y/kit.js (D3 + P1, "path to 8/10"):
 * ONE served page, deployed at scrollvars.dev/a11y/, that mounts the real
 * kit against the SHIPPED styles.css, so the VoiceOver checklist in
 * docs/guide.md and demo/bench/harness/a11y-tree-gate.mjs test the same
 * thing a correct library passes, instead of the vanilla gallery preview a
 * checklist row used to point at (Astra round loop8-3, D3/P1).
 *
 * Every checklist row Andrea runs VoiceOver against lives here: Slider
 * (carousel semantics), a real <dialog> Modal, a sv-pop disclosure, an
 * Accordion, split text, a real <Scenes> (its "no JS yet" and reduced
 * motion fallback both stack every scene), a controlled Marquee and
 * RotatingWords with its pause control. RotatingWords has no `scrollvars`
 * export (it is a copy-paste gallery recipe, COMPONENTS['rotating-words']):
 * its installed source is written to the same esbuild entry, unmodified,
 * so this page runs the exact file `npx scrollvars add rotating-words`
 * would install.
 *
 * Runs in `npm run demo:sync`; CI diffs demo/a11y like every other
 * generated page (ci.yml, release.yml).
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPONENTS } from './fx-data.mjs'
import { resolveScrollvars } from './fx-render.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'demo', 'a11y')
const cacheDir = join(root, 'node_modules', '.cache', 'sv-a11y-page')

export const APP_SOURCE = `
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ScrollVarsBoot, Slider, Modal, Accordion, Marquee, Scenes, Split } from 'scrollvars/react'
import { RotatingWords } from './RotatingWords'

function App() {
  const [open, setOpen] = React.useState(false)
  window.__setModalOpen = setOpen
  return (
    <>
      <ScrollVarsBoot />
      <h1>ScrollVars accessibility checklist fixture</h1>
      <p>
        Mounts the real kit against the shipped styles.css: nothing here is
        the gallery preview. Read against the VoiceOver checklist in
        docs/guide.md, one section per row.
      </p>

      <section id="slider-section" aria-labelledby="h-slider">
        <h2 id="h-slider">Slider</h2>
        <Slider perView={1} arrows dots aria-label="Photos">
          <div>One</div><div>Two</div><div>Three</div>
        </Slider>
      </section>

      <section aria-labelledby="h-modal">
        <h2 id="h-modal">Modal</h2>
        <button id="modal-open" onClick={() => setOpen(true)}>Open modal</button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <p>Modal content</p>
          <button id="modal-close" onClick={() => setOpen(false)}>Close</button>
        </Modal>
      </section>

      <section aria-labelledby="h-disclosure">
        <h2 id="h-disclosure">Disclosure</h2>
        <button id="disc-trigger" data-sv-toggle="sv-open" data-sv-target="#panel" aria-controls="panel">Toggle panel</button>
        <nav id="panel" className="sv-pop">panel body</nav>
      </section>

      <section aria-labelledby="h-accordion">
        <h2 id="h-accordion">Accordion</h2>
        <Accordion title="FAQ question">FAQ answer</Accordion>
      </section>

      <section id="split-section" aria-labelledby="h-split">
        <h2 id="h-split">Split text</h2>
        <Split as="h3">Words arrive one by one</Split>
      </section>

      <section id="scenes-section" aria-labelledby="h-scenes">
        <h2 id="h-scenes">Scenes</h2>
        <Scenes count={3} height="10vh">
          {({ scene }) => (
            <>
              {/* same node across every scene: proves a scene change does
                  not tear down and remount the "current" slot under it,
                  which would drop whatever the person had focused */}
              <input id="scene-input" aria-label="scene input" />
              <p>Scene {scene + 1} of 3</p>
            </>
          )}
        </Scenes>
      </section>

      <section aria-labelledby="h-marquee">
        <h2 id="h-marquee">Marquee</h2>
        <Marquee>
          <span>Alpha</span><span>Beta</span><span>Gamma</span>
        </Marquee>
      </section>

      <section aria-labelledby="h-words">
        <h2 id="h-words">Rotating words</h2>
        <RotatingWords words={['fast', 'light', 'honest']} interval={1800} />
      </section>
    </>
  )
}
const root = createRoot(document.getElementById('app'))
root.render(<App />)
window.__mounted = true
`

export async function bundleKit() {
  mkdirSync(cacheDir, { recursive: true })
  writeFileSync(join(cacheDir, 'App.tsx'), APP_SOURCE)
  writeFileSync(join(cacheDir, 'RotatingWords.tsx'), COMPONENTS['rotating-words'].content)
  const result = await build({
    entryPoints: [join(cacheDir, 'App.tsx')],
    bundle: true, write: false, minify: true, format: 'iife', platform: 'browser',
    plugins: [resolveScrollvars],
    define: { 'process.env.NODE_ENV': '"production"' },
  })
  return result.outputFiles[0].text
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ScrollVars accessibility checklist fixture</title>
<link rel="stylesheet" href="../fx/sv.css">
<meta name="robots" content="noindex">
</head>
<body>
<div id="app"></div>
<script src="kit.js"></script>
</body>
</html>
`

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  mkdirSync(outDir, { recursive: true })
  const kit = await bundleKit()
  writeFileSync(join(outDir, 'kit.js'), kit)
  writeFileSync(join(outDir, 'index.html'), PAGE)
  console.log('a11y checklist fixture built (demo/a11y/index.html, demo/a11y/kit.js)')
}
