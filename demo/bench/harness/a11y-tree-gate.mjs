/**
 * Accessibility-tree proxy suite (T8a evidence, "path to 8/10").
 *
 * Astra accepted an accessibility-tree proxy plus a documented, author-run
 * manual VoiceOver pass as sufficient evidence for the accessibility half
 * of the score (docs/guide.md's Accessibility section, "VoiceOver pass"
 * subsection carries the manual half). This is the automated half: it
 * reads Chrome's accessibility tree (puppeteer's page.accessibility.snapshot,
 * backed by the same CDP Accessibility domain the review named) over the
 * exact scope Astra listed: Slider (controls named, current slide
 * announced), Modal (dialog role, Escape closes, focus returns to the
 * opener), Accordion and toggles (aria-expanded in sync), split text (the
 * full text readable once, not fragmented per letter), Scenes in a
 * fallback state (every step present in the tree with no JS and under
 * reduced motion) and the Marquee pause control (named, pressed state).
 *
 * What this does NOT prove, because a role/name/value tree is not a screen
 * reader: the reading ORDER a person actually hears, the verbosity or
 * quirks of a real assistive technology (VoiceOver's rotor, landmark
 * announcements, how it groups a live region), or anything about
 * RotatingWords: it has no persistent pause control at all yet (N4, an
 * open defect tracked separately, out of scope here). The written
 * VoiceOver checklist in docs/guide.md covers the human half; this script
 * covers only what a browser's own accessibility tree can answer.
 *
 * Slider, Modal, Accordion and Marquee are mounted from the real
 * `scrollvars/react` components (esbuild + the resolveScrollvars plugin,
 * same technique as autoplay-interaction.mjs), not the gallery's
 * copy-paste panes: the gallery's marquee preview is known to lag behind
 * the installed component (N4, no pause button there either), so testing
 * the shipped component is what actually matters to a consumer. Split
 * text and the Scenes fallback use the live gallery pages (split-reveal,
 * sticky-steps), which already exercise split() and --sv-scene for real.
 *
 * Each check that could plausibly pass on broken code is proved able to
 * fail: see the "gate can fail" block near the end.
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node a11y-tree-gate.mjs
 */
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { resolveScrollvars } from '../../../scripts/fx-render.mjs'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))

/** Recursively finds every AX node matching `pred`, depth-first. */
function findAll(node, pred, out = []) {
  if (!node) return out
  if (pred(node)) out.push(node)
  for (const child of node.children || []) findAll(child, pred, out)
  return out
}
const find = (node, pred) => findAll(node, pred)[0]

const APP_SOURCE = `
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ScrollVarsBoot, Slider, Modal, Accordion, Marquee } from 'scrollvars/react'

function App() {
  const [open, setOpen] = React.useState(false)
  window.__setModalOpen = setOpen
  return (
    <>
      <ScrollVarsBoot />
      <button id="modal-open" onClick={() => setOpen(true)}>Open modal</button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <p>Modal content</p>
        <button id="modal-close" onClick={() => setOpen(false)}>Close</button>
      </Modal>
      <button id="disc-trigger" data-sv-toggle="sv-open" data-sv-target="#panel" aria-controls="panel">Toggle panel</button>
      <nav id="panel" className="sv-pop">panel body</nav>
      <Accordion title="FAQ question">FAQ answer</Accordion>
      <Slider perView={1} arrows dots aria-label="Photos">
        <div>One</div><div>Two</div><div>Three</div>
      </Slider>
      <Marquee>
        <span>Alpha</span><span>Beta</span><span>Gamma</span>
      </Marquee>
    </>
  )
}
const root = createRoot(document.getElementById('app'))
root.render(<App />)
window.__mounted = true
`

// A deliberately broken analog of three of the checks above, used only to
// prove the detectors are not blind (the "gate can fail" block): a fake
// dialog that does not restore focus on close, a toggle wired to nothing
// (no aria-expanded sync), and split text with its per-word spans left
// readable instead of aria-hidden (so the tree sees three fragments, not one).
const BROKEN_SOURCE = `
import * as React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button id="fake-open" onClick={() => { setOpen(true); document.getElementById('fake-open').blur() }}>Open</button>
      {open && <div role="dialog" aria-modal="true" id="fake-dialog">
        <button id="fake-close" onClick={() => { setOpen(false); document.body.focus() }}>Close</button>
      </div>}
      <button id="dead-trigger" aria-expanded="false">Toggle (unwired)</button>
      <h3 id="broken-split">
        <span>Words</span> <span>fragmented</span> <span>badly</span>
      </h3>
    </>
  )
}
createRoot(document.getElementById('app')).render(<App />)
window.__mounted = true
`

async function bundleApp(source) {
  const result = await build({
    stdin: { contents: source, loader: 'tsx', resolveDir: repoRoot },
    bundle: true, write: false, format: 'iife', platform: 'browser', plugins: [resolveScrollvars],
    define: { 'process.env.NODE_ENV': '"production"' },
  })
  return result.outputFiles[0].text
}

export async function a11yTreeGate({ browser, check, base }) {
  const appBundle = await bundleApp(APP_SOURCE)
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.setContent('<div id="app"></div>')
    await page.addScriptTag({ content: appBundle })
    await page.waitForFunction(() => window.__mounted === true)
    // toggles() and the driver boot inside ScrollVarsBoot; give the scan a frame
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

    // ---- Slider: controls named, current slide announced ----------------
    {
      const tree = await page.accessibility.snapshot({ interestingOnly: false })
      const carousel = find(tree, (n) => n.role === 'region' && n.name === 'Photos')
      const prev = find(tree, (n) => n.role === 'button' && n.name === 'previous slide')
      const next = find(tree, (n) => n.role === 'button' && n.name === 'next slide')
      const slides = findAll(tree, (n) => /^\d+ of 3$/.test(n.name || ''))
      const dots = findAll(tree, (n) => /^go to slide \d+$/.test(n.name || ''))
      check('a11y-tree: Slider carousel region is named', !!carousel, JSON.stringify(carousel))
      check('a11y-tree: Slider previous/next arrows are named', !!prev && !!next)
      check('a11y-tree: Slider announces "N of 3" on every slide', slides.length === 3, `found ${slides.length}: ${JSON.stringify(slides.map((s) => s.name))}`)
      check('a11y-tree: Slider dots are named "go to slide N"', dots.length === 3, `found ${dots.length}`)
    }

    // ---- Accordion and toggles: aria-expanded in sync ---------------------
    {
      const before = await page.evaluate(() => document.getElementById('disc-trigger').getAttribute('aria-expanded'))
      await page.click('#disc-trigger')
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const after = await page.evaluate(() => document.getElementById('disc-trigger').getAttribute('aria-expanded'))
      check('a11y-tree: toggles() flips aria-expanded on click', before === 'false' && after === 'true', `${before} -> ${after}`)

      const detailsBefore = await page.evaluate(() => document.querySelector('.sv-accordion').open)
      const tree1 = await page.accessibility.snapshot({ interestingOnly: false })
      const summaryClosed = find(tree1, (n) => n.name === 'FAQ question')
      await page.evaluate(() => document.querySelector('.sv-accordion summary').click())
      const detailsAfter = await page.evaluate(() => document.querySelector('.sv-accordion').open)
      const tree2 = await page.accessibility.snapshot({ interestingOnly: false })
      const summaryOpen = find(tree2, (n) => n.name === 'FAQ question' && n.expanded === true)
      check('a11y-tree: Accordion summary is a named disclosure', !!summaryClosed, JSON.stringify(summaryClosed))
      check('a11y-tree: Accordion open state is reflected (details.open and the tree agree)', detailsBefore === false && detailsAfter === true && !!summaryOpen, `details.open ${detailsBefore} -> ${detailsAfter}`)
    }

    // ---- Marquee pause control: named, pressed state -----------------------
    {
      const tree = await page.accessibility.snapshot({ interestingOnly: false })
      const pauseBefore = find(tree, (n) => n.role === 'button' && n.name === 'Pause animation')
      check('a11y-tree: Marquee pause control is named "Pause animation"', !!pauseBefore && pauseBefore.pressed === false, JSON.stringify(pauseBefore))
      await page.click('.sv-marquee-pause')
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const treeAfter = await page.accessibility.snapshot({ interestingOnly: false })
      const pauseAfter = find(treeAfter, (n) => n.role === 'button' && /Pause animation|Resume animation/.test(n.name || ''))
      check('a11y-tree: Marquee pause control reports a pressed state after activation', !!pauseAfter && pauseAfter.pressed === true, JSON.stringify(pauseAfter))
    }

    // ---- Modal: dialog role, Escape closes, focus returns to the opener ----
    {
      await page.focus('#modal-open')
      await page.click('#modal-open')
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const tree = await page.accessibility.snapshot({ interestingOnly: false })
      const dialog = find(tree, (n) => n.role === 'dialog')
      check('a11y-tree: an open Modal exposes role dialog', !!dialog, JSON.stringify(dialog))
      await page.keyboard.press('Escape')
      await page.evaluate(() => new Promise((r) => setTimeout(r, 50)))
      const focusReturned = await page.evaluate(() => document.activeElement?.id === 'modal-open')
      check('a11y-tree: Escape closes the Modal and returns focus to the opener', focusReturned)
      const treeAfter = await page.accessibility.snapshot({ interestingOnly: false })
      const dialogAfter = find(treeAfter, (n) => n.role === 'dialog')
      check('a11y-tree: a closed Modal no longer exposes role dialog', !dialogAfter)
    }

    check('a11y-tree: no page errors from the mounted kit', errors.length === 0, errors.join('; '))
  } finally {
    await page.close()
  }

  // ---- split text: the full text readable once, not fragmented -----------
  {
    const page2 = await browser.newPage()
    try {
      await page2.goto(`${base}/fx/split-reveal.html`, { waitUntil: 'load' })
      await page2.waitForFunction(() => typeof window.SV !== 'undefined')
      await page2.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const tree = await page2.accessibility.snapshot({ interestingOnly: false })
      const heading = find(tree, (n) => n.role === 'heading' && (n.name || '').includes('Words arrive one by one'))
      // aria-hidden excludes a node from the tree entirely: a lone word span
      // ("Words", not the full sentence) surviving as its own node means
      // split()'s per-word aria-hidden never applied.
      const fragments = findAll(tree, (n) => ['Words', 'arrive', 'one', 'by'].includes((n.name || '').trim()))
      check('a11y-tree: split() keeps the full sentence as the heading\'s accessible name', !!heading, JSON.stringify(heading))
      check('a11y-tree: split() marks its per-word spans out of the tree (no per-word fragments)', fragments.length === 0, `found ${fragments.length} fragments`)
    } finally {
      await page2.close()
    }
  }

  // ---- Scenes fallback: every step present, no JS and under reduced motion ----
  {
    for (const [label, setup] of [
      ['no JS', async (p) => { await p.setJavaScriptEnabled(false) }],
      ['reduced motion', async (p) => { await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]) }],
    ]) {
      const page3 = await browser.newPage()
      try {
        await setup(page3)
        await page3.goto(`${base}/fx/sticky-steps.html`, { waitUntil: 'load' })
        if (label === 'reduced motion') {
          await page3.waitForFunction(() => typeof window.SV !== 'undefined')
          await page3.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
        }
        const tree = await page3.accessibility.snapshot({ interestingOnly: false })
        const steps = findAll(tree, (n) => /^Step \d$/.test(n.name || ''))
        check(`a11y-tree: sticky-steps keeps every step in the tree (${label})`, steps.length >= 3, `found ${steps.length}`)
      } finally {
        await page3.close()
      }
    }
  }

  // ---- gate can fail: the same detectors against a deliberately broken app ----
  {
    const brokenBundle = await bundleApp(BROKEN_SOURCE)
    const page4 = await browser.newPage()
    try {
      await page4.setContent('<div id="app"></div>')
      await page4.addScriptTag({ content: brokenBundle })
      await page4.waitForFunction(() => window.__mounted === true)

      await page4.focus('#fake-open')
      await page4.click('#fake-open')
      const focusReturnedBroken = await page4.evaluate(() => document.activeElement?.id === 'fake-open')
      check('a11y-tree gate can fail: a fake dialog that blurs on open and focuses body on close is reported as NOT returning focus', focusReturnedBroken === false)

      const expandedBroken = await page4.evaluate(() => document.getElementById('dead-trigger').getAttribute('aria-expanded'))
      await page4.click('#dead-trigger')
      const expandedBrokenAfter = await page4.evaluate(() => document.getElementById('dead-trigger').getAttribute('aria-expanded'))
      check('a11y-tree gate can fail: an unwired trigger is reported as NOT syncing aria-expanded', expandedBroken === expandedBrokenAfter)

      const tree = await page4.accessibility.snapshot({ interestingOnly: false })
      const brokenFragments = findAll(tree, (n) => n.role === 'text' && ['Words', 'fragmented', 'badly'].includes((n.name || '').trim()))
      check('a11y-tree gate can fail: readable per-word spans (no aria-hidden) are reported as fragments', brokenFragments.length > 0, `found ${brokenFragments.length}`)
    } finally {
      await page4.close()
    }
  }
}

// Standalone: serve demo/ and run the same gate.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { extname, join } = await import('node:path')
  const puppeteer = (await import('puppeteer-core')).default
  const root = join(repoRoot, 'demo')
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
  const server = createServer((req, res) => {
    const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
    try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
    catch { res.statusCode = 404; res.end('nope') }
  })
  await new Promise((r) => server.listen(0, r))
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  let failures = 0
  const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ':\n      ' + detail}`); if (!ok) failures++ }
  await a11yTreeGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} check(s) violated` : '\nthe accessibility-tree proxy holds')
  process.exit(failures ? 1 : 0)
}
