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
 * reader: the reading ORDER a person actually hears, or the verbosity or
 * quirks of a real assistive technology (VoiceOver's rotor, landmark
 * announcements, how it groups a live region). The written VoiceOver
 * checklist in docs/guide.md covers the human half; this script covers
 * only what a browser's own accessibility tree can answer.
 *
 * Slider, Modal, Accordion and Marquee are mounted from the real
 * `scrollvars/react` components (esbuild + the resolveScrollvars plugin,
 * same technique as autoplay-interaction.mjs), not the gallery's
 * copy-paste panes, so testing the shipped component is what actually
 * matters to a consumer regardless of whether a gallery pane has caught
 * up. Split text and the Scenes fallback use the live gallery pages
 * (split-reveal, sticky-steps), which already exercise split() and
 * --sv-scene for real.
 *
 * Every check here has a negative counterpart: see the "gate can fail"
 * blocks near the end, each against a deliberately broken analog (a bare
 * fixture with no ARIA, a fake dialog that does not restore focus or
 * never actually closes, an unwired trigger, readable per-word spans).
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

/**
 * All non-empty accessible names in the tree, one entry per node. Chrome
 * folds plain inline text (a <b>, a bare <span>) into whichever ancestor's
 * name computation picks it up rather than always giving it a leaf node of
 * its own, so a check for "is this text anywhere in the tree" joins every
 * name and does a substring search, instead of expecting one exact node
 * per phrase.
 */
function collectNames(node, out = []) {
  if (!node) return out
  if (node.name) out.push(node.name)
  for (const child of node.children || []) collectNames(child, out)
  return out
}

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
      <button id="fake-open" onClick={() => setOpen(true)}>Open</button>
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
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    // The served checklist fixture (D3 + P1, loop8-3): the real kit against
    // the SHIPPED styles.css, same origin, so a CSS-driven exclusion (the
    // marquee pause hidden until sv-ui, dialog:not([open]) rules) is live
    // for these checks, not invisible the way an unstyled setContent() mount
    // was before.
    await page.goto(`${base}/a11y/index.html`, { waitUntil: 'load' })
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

      // ADU (loop8-3 verifier FIX 1): a role/name tree taken once at mount
      // says nothing about a STATE CHANGE. Every slide's static "N of 3"
      // label is in the tree from the first render, so checking that ONE
      // of them is present after a click is a false positive: it passes
      // whether or not "next" does anything at all. The real per-activation
      // signal is the dots' aria-current, which the Slider component moves
      // to the newly active dot (src/react/index.tsx), and the container's
      // aria-live region, which announces the change to a screen reader.
      const dotsBefore = await page.$$eval('#slider-section .sv-dots button', (els) => els.map((el) => el.getAttribute('aria-current')))
      check('a11y-tree: Slider dot 1 starts as the current slide', dotsBefore[0] === 'true' && dotsBefore.slice(1).every((v) => v !== 'true'), JSON.stringify(dotsBefore))
      await page.click('#slider-section .sv-arrow-next')
      await page.waitForFunction(() => document.querySelectorAll('#slider-section .sv-dots button')[1]?.getAttribute('aria-current') === 'true')
      const dotsAfter = await page.$$eval('#slider-section .sv-dots button', (els) => els.map((el) => el.getAttribute('aria-current')))
      check('a11y-tree: activating next moves aria-current from dot 1 to dot 2', dotsAfter[1] === 'true' && dotsAfter[0] !== 'true', JSON.stringify(dotsAfter))

      // N1: a scroll position and an aria-current move are not text a live
      // region announces. The status role outside the rail is the one node
      // whose text actually changes on activation: that is what a screen
      // reader reads out. Chrome reports the status node's own `name` as
      // empty and puts the actual text on a StaticText child, so the check
      // reads every name in that subtree instead of the container's own.
      const statusNode = find(await page.accessibility.snapshot({ interestingOnly: false }), (n) => n.role === 'status')
      const statusText = collectNames(statusNode).join(' ')
      check('a11y-tree: the status region announces the new slide after next()', statusText === 'Slide 2 of 3', JSON.stringify(statusNode))
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
      // A mouse-coordinate click on a long page (this fixture stacks eight
      // sections above the marquee) is the kind of thing that can miss its
      // target; focus + keyboard activation, then poll for the attribute
      // instead of a fixed frame count, is the pattern review-gate.mjs
      // already uses for this exact button.
      await page.focus('.sv-marquee-pause')
      await page.keyboard.press('Space')
      await page.waitForFunction(() => document.querySelector('.sv-marquee-pause')?.getAttribute('aria-pressed') === 'true')
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
  // The checklist row 5 names the /a11y/ page's own <Split>, not the
  // gallery's split-reveal.html preview: the two can drift independently
  // (a fix landed in one and never ported to the other).
  {
    const page2 = await browser.newPage()
    try {
      await page2.goto(`${base}/a11y/index.html`, { waitUntil: 'load' })
      await page2.waitForFunction(() => window.__mounted === true)
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
  // A step with own text and no display:none/visibility:hidden/aria-hidden/
  // inert ancestor is, per spec, IN the accessibility tree: Chrome folds
  // plain body text (a bare <b>) into whichever ancestor node's name
  // computation happens to pick it up rather than always giving it a node
  // of its own, so probing exclusion mechanisms directly is the reliable
  // proxy here, the same shape e2e-invariants.mjs's own HIDDEN_TEXT probe
  // already uses elsewhere in this harness.
  const STEP_EXCLUSION = () => [...document.querySelectorAll('.st-steps > li > b')].map((b) => {
    let excluded = false
    for (let n = b; n; n = n.parentElement) {
      if (n.getAttribute?.('aria-hidden') === 'true' || n.inert) excluded = true
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') excluded = true
    }
    return { text: b.textContent.trim(), excluded }
  })
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
        const steps = await page3.evaluate(`(${STEP_EXCLUSION})()`)
        const ok = steps.length === 3 && steps.every((s) => !s.excluded)
        check(`a11y-tree: sticky-steps keeps every step in the tree (${label})`, ok, JSON.stringify(steps))
      } finally {
        await page3.close()
      }
    }
    // prove it can fail: an aria-hidden step is reported as excluded
    const page3b = await browser.newPage()
    try {
      await page3b.goto(`${base}/fx/sticky-steps.html`, { waitUntil: 'load' })
      await page3b.evaluate(() => document.querySelector('.st-steps > li > b').setAttribute('aria-hidden', 'true'))
      const steps = await page3b.evaluate(`(${STEP_EXCLUSION})()`)
      check('a11y-tree gate can fail: an aria-hidden step is reported as excluded from the tree', steps[0]?.excluded === true, JSON.stringify(steps))
    } finally {
      await page3b.close()
    }
  }

  // ---- a real <Scenes> fallback: every scene present, no JS and under
  // reduced motion (D3/P1: the proxy used to probe StickySteps' own list,
  // never the <Scenes> component itself). Same exclusion-probe shape as
  // STEP_EXCLUSION above, over the checklist fixture's #scenes-section.
  const SCENE_EXCLUSION = () => [...document.querySelectorAll('#scenes-section .sv-stage p')].map((p) => {
    let excluded = false
    for (let n = p; n; n = n.parentElement) {
      if (n.getAttribute?.('aria-hidden') === 'true' || n.inert) excluded = true
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') excluded = true
    }
    return { text: p.textContent.trim(), excluded }
  })
  {
    // The checklist fixture is client-rendered React (createRoot, no SSR):
    // "no JS" is not a state this particular page can be probed in, unlike
    // sticky-steps' static gallery markup above. Reduced motion is the
    // fallback state that applies to a mounted app: `active` never turns
    // true, so <Scenes> stacks every scene instead of the scroll-picked one.
    const page3c = await browser.newPage()
    try {
      await page3c.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      await page3c.goto(`${base}/a11y/index.html`, { waitUntil: 'load' })
      await page3c.waitForFunction(() => window.__mounted === true)
      await page3c.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const scenes = await page3c.evaluate(`(${SCENE_EXCLUSION})()`)
      const ok = scenes.length === 3 && scenes.every((s) => !s.excluded)
      check('a11y-tree: a real <Scenes> keeps every scene in the tree, stacked fallback (reduced motion)', ok, JSON.stringify(scenes))
    } finally {
      await page3c.close()
    }
    // prove it can fail: a scene hidden with display:none is reported as excluded
    const page3d = await browser.newPage()
    try {
      await page3d.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      await page3d.goto(`${base}/a11y/index.html`, { waitUntil: 'load' })
      await page3d.waitForFunction(() => window.__mounted === true)
      await page3d.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      await page3d.evaluate(() => { document.querySelector('#scenes-section .sv-stage p').style.display = 'none' })
      const scenes = await page3d.evaluate(`(${SCENE_EXCLUSION})()`)
      check('a11y-tree gate can fail: a scene hidden with display:none is reported as excluded from the tree', scenes[0]?.excluded === true, JSON.stringify(scenes))
    } finally {
      await page3d.close()
    }
  }

  // ---- a focused input survives a scene change (D3/P1 residue) ----------
  // The render prop's output is the SAME element across every scene (an
  // <input> that never changes, only the sibling text does), so this
  // proves Scenes does not tear down and remount its "current" slot on
  // every scene switch under normal motion: a destructive remount would
  // drop the person's focus back onto <body> the moment the scene moves.
  {
    const page3e = await browser.newPage()
    try {
      await page3e.goto(`${base}/a11y/index.html`, { waitUntil: 'load' })
      await page3e.waitForFunction(() => window.__mounted === true)
      await page3e.evaluate(() => document.getElementById('scenes-section').scrollIntoView({ block: 'start' }))
      await page3e.waitForFunction(() => document.querySelector('#scenes-section p')?.textContent.trim() === 'Scene 1 of 3')
      await page3e.focus('#scene-input')
      await page3e.evaluate(() => window.scrollBy(0, 80))
      await page3e.waitForFunction(() => document.querySelector('#scenes-section p')?.textContent.trim() !== 'Scene 1 of 3', { timeout: 5000 })
      const stillFocused = await page3e.evaluate(() => document.activeElement?.id === 'scene-input')
      const sceneText = await page3e.evaluate(() => document.querySelector('#scenes-section p')?.textContent.trim())
      check('a11y-tree: a focused input survives a scene change, no destructive remount', stillFocused, `now on ${sceneText}`)
    } finally {
      await page3e.close()
    }

    // prove it can fail: a destructive remount (a fresh node with the same
    // id, exactly what a scene keyed by its own index would do) drops focus
    const page3f = await browser.newPage()
    try {
      await page3f.setContent('<input id="scene-input">')
      await page3f.focus('#scene-input')
      await page3f.evaluate(() => {
        const old = document.getElementById('scene-input')
        const fresh = document.createElement('input')
        fresh.id = 'scene-input'
        old.replaceWith(fresh)
      })
      const stillFocused = await page3f.evaluate(() => document.activeElement?.id === 'scene-input')
      check('a11y-tree gate can fail: a destructive remount drops focus off the replaced input', !stillFocused)
    } finally {
      await page3f.close()
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

      // Same flow as the real Modal check: open, try Escape, then click the
      // visible close control (a plain div ignores Escape, same as a real
      // user falling back to the close button when a key does nothing).
      // Its close handler moves focus to the body instead of the opener.
      await page4.focus('#fake-open')
      await page4.click('#fake-open')
      await page4.keyboard.press('Escape')
      await page4.click('#fake-close')
      const focusReturnedBroken = await page4.evaluate(() => document.activeElement?.id === 'fake-open')
      check('a11y-tree gate can fail: a fake dialog that focuses the body on close is reported as NOT returning focus to the opener', focusReturnedBroken === false)

      const expandedBroken = await page4.evaluate(() => document.getElementById('dead-trigger').getAttribute('aria-expanded'))
      await page4.click('#dead-trigger')
      const expandedBrokenAfter = await page4.evaluate(() => document.getElementById('dead-trigger').getAttribute('aria-expanded'))
      check('a11y-tree gate can fail: an unwired trigger is reported as NOT syncing aria-expanded', expandedBroken === expandedBrokenAfter)

      const tree = await page4.accessibility.snapshot({ interestingOnly: false })
      const brokenCombined = collectNames(tree).join(' | ')
      const brokenFound = ['Words', 'fragmented', 'badly'].filter((w) => brokenCombined.includes(w))
      check('a11y-tree gate can fail: readable per-word spans (no aria-hidden) are reported as fragments', brokenFound.length === 3, `found: ${brokenFound.join(', ') || 'none'}`)
    } finally {
      await page4.close()
    }
  }

  // ---- gate can fail: the remaining checks, each against its own bare fixture ----
  // Plain static HTML, no React/esbuild needed: these only test the ABSENCE
  // of ARIA that a hand-rolled, unlabeled analog of each component would
  // have, and the AX tree's own bookkeeping (a role that never actually
  // clears) when a "close" does nothing.
  {
    // Slider: a bare carousel-shaped div, no ARIA at all
    const page9 = await browser.newPage()
    try {
      await page9.setContent('<div class="bare-slider"><div>One</div><div>Two</div><div>Three</div></div><button id="p">&lsaquo;</button><button id="n">&rsaquo;</button><button id="d1">1</button>')
      const tree = await page9.accessibility.snapshot({ interestingOnly: false })
      check('a11y-tree gate can fail: an unlabeled carousel has no named region', !find(tree, (n) => n.role === 'region' && n.name === 'Photos'))
      check('a11y-tree gate can fail: unlabeled arrows are not named "previous/next slide"', !find(tree, (n) => n.name === 'previous slide' || n.name === 'next slide'))
      check('a11y-tree gate can fail: unlabeled slides announce no "N of 3"', findAll(tree, (n) => /^\d+ of 3$/.test(n.name || '')).length === 0)
      check('a11y-tree gate can fail: unlabeled dots are not named "go to slide N"', findAll(tree, (n) => /^go to slide \d+$/.test(n.name || '')).length === 0)
    } finally {
      await page9.close()
    }

    // Slider: a real dot-current pair, but "next" is a no-op (ADU, loop8-3
    // verifier FIX 1's own negative counterpart: the check above must fail
    // when activating next does not move aria-current, not only when the
    // markup has no ARIA at all).
    const page9b = await browser.newPage()
    try {
      await page9b.setContent(
        '<div class="sv-dots">' +
          '<button class="sv-dot on" aria-current="true">1</button>' +
          '<button class="sv-dot">2</button>' +
        '</div>' +
        '<button class="sv-arrow-next" onclick="">next</button>'
      )
      const dotsBefore = await page9b.$$eval('.sv-dots button', (els) => els.map((el) => el.getAttribute('aria-current')))
      await page9b.click('.sv-arrow-next')
      await page9b.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const dotsAfter = await page9b.$$eval('.sv-dots button', (els) => els.map((el) => el.getAttribute('aria-current')))
      check(
        'a11y-tree gate can fail: a no-op next never moves aria-current off dot 1',
        !(dotsAfter[1] === 'true' && dotsAfter[0] !== 'true'),
        JSON.stringify({ dotsBefore, dotsAfter })
      )
    } finally {
      await page9b.close()
    }

    // Slider: a status region that is never written (N1's own negative
    // counterpart: the check above must fail when navigation never changes
    // the announced text, not only when there is no status node at all).
    const page9c = await browser.newPage()
    try {
      await page9c.setContent(
        '<div role="status" aria-live="polite">Slide 1 of 3</div>' +
        '<button class="sv-arrow-next" onclick="">next</button>'
      )
      const before = await page9c.accessibility.snapshot({ interestingOnly: false })
      const beforeName = find(before, (n) => n.role === 'status')?.name
      await page9c.click('.sv-arrow-next')
      const after = await page9c.accessibility.snapshot({ interestingOnly: false })
      const afterName = find(after, (n) => n.role === 'status')?.name
      check(
        'a11y-tree gate can fail: a status that is never written stays "Slide 1 of 3" after next()',
        !(afterName === 'Slide 2 of 3'),
        JSON.stringify({ beforeName, afterName })
      )
    } finally {
      await page9c.close()
    }

    // Marquee: an unlabeled, non-functional pause control
    const page10 = await browser.newPage()
    try {
      await page10.setContent('<div class="bare-marquee"><span>Alpha</span></div><button id="dp" onclick="">Fake pause</button>')
      const before = await page10.accessibility.snapshot({ interestingOnly: false })
      check('a11y-tree gate can fail: an unlabeled pause control is not named "Pause animation"', !find(before, (n) => n.name === 'Pause animation'))
      await page10.click('#dp')
      const after = await page10.accessibility.snapshot({ interestingOnly: false })
      check('a11y-tree gate can fail: clicking an unwired pause control reports no pressed state', !find(after, (n) => n.pressed === true))
    } finally {
      await page10.close()
    }

    // Modal: an open panel with no dialog role at all
    const page11 = await browser.newPage()
    try {
      await page11.setContent('<button id="o">open</button><div id="d" style="display:none">not a dialog</div><script>document.getElementById("o").onclick=()=>{document.getElementById("d").style.display="block"}</script>')
      await page11.click('#o')
      const tree = await page11.accessibility.snapshot({ interestingOnly: false })
      check('a11y-tree gate can fail: a plain div shown on "open" has no dialog role', !find(tree, (n) => n.role === 'dialog'), JSON.stringify(find(tree, (n) => n.role === 'dialog')))
    } finally {
      await page11.close()
    }

    // Modal: a dialog role that never actually clears on "close"
    const page12 = await browser.newPage()
    try {
      await page12.setContent('<div role="dialog" aria-modal="true" id="d">stays in the tree no matter what</div><button id="c" onclick="">close</button>')
      await page12.click('#c')
      const tree = await page12.accessibility.snapshot({ interestingOnly: false })
      check('a11y-tree gate can fail: a dialog role that never actually closes is reported as still present', !!find(tree, (n) => n.role === 'dialog'))
    } finally {
      await page12.close()
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
