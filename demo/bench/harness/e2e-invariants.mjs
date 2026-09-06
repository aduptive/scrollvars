#!/usr/bin/env node
/**
 * The progressive-enhancement invariants, as tests: the architectural
 * promises the reviewers flagged as "claimed but not proven":
 *
 *   1. No JS  → the page renders COMPLETE: no entrance-hidden content
 *   2. With JS → no fail-hidden flash: nothing is hidden until html.sv-on
 *      exists (the guard is the gate, not a race)
 *   3. Attribute knobs land: data-sv-order becomes --sv-order on mount
 *   4. A pin stage never covers its own revealed text; reduced motion
 *      settles sv-auto immediately; a nested non-live tracker keeps its
 *      spread stacked under a live ancestor
 *   5. An opened sv-acts widget keeps its finished state even inside, or
 *      as, a non-live tracker (the live-driven rule must not outrank .sv-open)
 *   6. toggles() marking a boot-present target sv-ui settles it straight
 *      from the no-JS finished value to 0, never mid-transition
 *   7. sticky-steps: the non-active shots' inert/aria-hidden follow
 *      prefers-reduced-motion live, not just at mount
 *   8. Canvas: mountEffect()'s applySize() settles an unsized canvas at
 *      its intrinsic size, even a small one at a barely fractional DPR,
 *      never runs away whatever direction the device pixel ratio moves the
 *      backing store (above 1, or a zoomed-out page's dpr below 1), and
 *      never mistakes a CSS-sized canvas (padding, a transform, or both
 *      together, or a genuine resize landing exactly on the size the
 *      harness itself just wrote) for one that moved. It also never pins a
 *      genuinely responsive canvas (width:100%, height:auto, or the fixed-
 *      height/auto-width mirror, even at an odd height that would trip the
 *      ninth pass's halving probe on parity), pins width only (not a frozen
 *      height) on a max-width cap that only engages later, never settles a
 *      bare max-width canvas inflated past its cap, and never pins a cap
 *      that already binds at the canvas's natural size (rendered crisp at
 *      the cap, not inflation). A cap "in the gap" (strictly between half
 *      the natural size and the natural size) is pinned at the natural
 *      attribute size, not the measured, capped value, so it tracks the
 *      cap later widening or narrowing instead of freezing; an author's
 *      own aspect-ratio on an unsized canvas is kept, not overwritten, and
 *      an unauthored one is actually set (real Chrome reports 'auto W / H',
 *      never bare 'auto', so a strict equality guard never fires), keeping
 *      a pinned canvas's height stable even at a non-integer w0 * dpr
 *      instead of drifting through the harness's own rounded attributes
 *      (ADU-107, ninth pass, three verifier findings on the eighth; tenth
 *      pass, two more on the ninth; eleventh pass, two more on the tenth;
 *      twelfth pass, two more on the eleventh; thirteenth pass, one more
 *      on the twelfth)
 *   9. The pin-stage occlusion sweep is not blind to clip-path: a real
 *      sr-only span is pinpoint-sized (1px by 1px) AND clip-path'd, so a
 *      normal-sized element that only has clip-path (a decorative reveal
 *      mask) is still a candidate, and gets reported if a panel covers it
 *      (ADU-102, second pass finding)
 *  10. Every Section `npx scrollvars add` installs works on ONLY the
 *      stylesheets its registry entry declares, under React 18 and 19, with
 *      and without the engine and under reduced motion (installed-gate.mjs,
 *      ADU-129)
 *  11. trackPointer() on a container that matches its own selector still
 *      writes --mx/--my on a pointermove over a child, the hero fixture
 *      round 5's ancestor fix collaterally broke (ADU-152)
 *
 * Runs against the fx pages (the shipped presets, the shipped engine).
 *   node e2e-invariants.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { installedGate } from './installed-gate.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const STYLES_CSS = readFileSync(join(root, '..', 'styles.css'), 'utf8')
// The built canvas module has no imports of its own: safe to inject as a
// classic (non-module) script that assigns its one export to `window`.
const CANVAS_JS = readFileSync(join(root, '..', 'dist', 'canvas', 'index.js'), 'utf8').replace(
  'export function mountEffect',
  'window.mountEffect = function mountEffect'
)
// Drives a canvas's own resize() log to a fixed point (ADU-107, eleventh
// pass): waits for the initial mount delivery first (a real
// ResizeObserver's own first callback is itself asynchronous, never
// synchronous with mountEffect() returning), then polls, one double
// requestAnimationFrame per pass (Chrome runs a frame's rAF callbacks
// BEFORE that frame's ResizeObserver step, so a single rAF closes the
// window too early), until the log stops growing for one whole pass, or
// `maxPasses` (default 300) is reached. Returns the number of DELIVERIES
// that arrived after the first one before it stabilized (0 if the mount
// delivery already was the fixed point); a return of `maxPasses` means it
// never converged.
const DRIVE_TO_FIXED_POINT_JS = `
window.driveToFixedPoint = function driveToFixedPoint(log, maxPasses) {
  maxPasses = maxPasses || 300
  const waitFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return (async () => {
    for (let i = 0; i < maxPasses && log.length === 0; i++) await waitFrame()
    let prevLen = log.length
    for (let i = 0; i < maxPasses; i++) {
      await waitFrame()
      if (log.length === prevLen) return i
      prevLen = log.length
    }
    return maxPasses
  })()
}
`
// The fx pages' IIFE bundle minus the auto-scan fx-build appends to it, so a
// fixture can call SV.scan() itself and keep the stop handle it returns.
const SV_IIFE_JS = readFileSync(join(root, 'fx', 'sv.js'), 'utf8').replace(/\nSV\.scan\(\);\n$/, '')
const CHROME =
  process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const server = createServer((req, res) => {
  try {
    let url = req.url.split('?')[0].replace(/\/$/, '/index.html')
    // /ssr/<fx page>: the fx page as a server renderer would emit it, with the
    // driver's .sv class already on every tracked element (React <Track> does that)
    const ssr = url.startsWith('/ssr/')
    if (ssr) url = '/fx/' + url.slice(5)
    const p = join(root, url)
    res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream')
    if (ssr && p.endsWith('.html')) {
      const html = readFileSync(p, 'utf8').replace(/<(\w+)([^>]*\sdata-sv(?=[\s>])[^>]*)>/g, (all, tag, attrs) =>
        /\sclass="/.test(attrs) ? `<${tag}${attrs.replace(/\sclass="/, ' class="sv ')}>` : `<${tag} class="sv"${attrs}>`
      )
      res.end(html)
      return
    }
    res.end(readFileSync(p))
  } catch {
    res.statusCode = 404
    res.end()
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok ' : 'FAIL'} ${name}${ok ? '' : ': ' + detail}`)
  if (!ok) failures++
}

// shared: elements with their own text that are invisible (opacity 0, hidden, display none)
const HIDDEN_TEXT = () => {
  const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  return [...document.body.querySelectorAll('*')].filter((el) => {
    if (!own(el) || el.closest('[aria-hidden="true"], script, style, template, .sv-words, .sv-curtain-l, .sv-curtain-r')) return false
    const cs = getComputedStyle(el)
    return cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none'
  }).length
}

// shared: own-text elements inside a pin stage (curtain/rail/deck/reading/range/counter
// all live in one) whose center point is covered by something else (elementFromPoint).
// Scrolls each candidate into view first: at scroll position 0 a pin stage further
// down the page is off-viewport, so elementFromPoint would always be skipped below
// and the sweep would silently examine nothing. Returns how many it did examine, so
// a regression back to zero coverage can be asserted instead of passing by omission.
const OCCLUDED_TEXT = () => {
  const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  // the sr-only technique (Split, TimelineScrub's year, StatsCountup's count:
  // clip-path: inset(50%) PLUS a 1px by 1px box, same text as an adjacent
  // aria-hidden visual digit, by design): nothing is on screen for it to
  // cover or be covered by, so it is not a candidate, the same way an
  // aria-hidden sibling is not one. clip-path alone is not the signal: a
  // decorative reveal effect (e.g. clip-path: circle()) can mask real,
  // normal-sized visible text, and that text must still be examined.
  const srOnly = (el) => {
    if (getComputedStyle(el).clipPath === 'none') return false
    // offsetWidth/offsetHeight read the layout box, not the painted one: an
    // ancestor transform (sv-tilt, sv-deck, any scale()) leaves the 1px sr-only
    // box's getBoundingClientRect scaled up (e.g. 2x2 under scale(2)), which
    // would escape this exclusion and turn a genuine sr-only span into a false
    // occlusion candidate.
    return el.offsetWidth <= 1 && el.offsetHeight <= 1
  }
  const bad = []
  let examined = 0
  for (const stage of document.querySelectorAll('.sv-stage')) {
    for (const el of stage.querySelectorAll('*')) {
      if (!own(el) || srOnly(el) || el.closest('[aria-hidden="true"], script, style, template, .sv-words, .sv-curtain-l, .sv-curtain-r')) continue
      el.scrollIntoView({ block: 'center', inline: 'center' })
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // off-viewport: elementFromPoint returns null there regardless of occlusion
      if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) continue
      examined++
      const hit = document.elementFromPoint(cx, cy)
      if (!hit || (hit !== el && !el.contains(hit))) bad.push(el.className || el.tagName)
    }
  }
  return { bad, examined }
}
// the fx pages that ship a .sv-stage pin preset with own-text content to
// examine: a silent drop to 0 examined candidates on any of these is the
// exact regression this sweep exists to catch. deck-spread.html has no
// .sv-stage at all (its "deck" is the sv-spread entrance preset, not the
// pin one); three-scene.html's .sv-stage holds only a <canvas>, so it
// structurally examines 0 forever, not a coverage regression.
const PIN_PAGES = [
  'curtain.html',
  'gsap-scrub.html',
  'horizontal-rail.html',
  'sequenced-scrub.html',
  'sticky-steps.html',
  'timeline-scrub.html',
]
const MIN_EXAMINED = 1

// ── 0. Every fx page, no JS: no text hidden, no stage clipping content away ──
{
  const pages = readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(false)
  const bad = []
  const ssrBad = []
  const occluded = []
  const examinedByPage = {}
  for (const f of pages) {
    await page.goto(`${base}/fx/${f}`, { waitUntil: 'load' })
    const hidden = await page.evaluate(HIDDEN_TEXT)
    if (hidden > 0) bad.push(`${f}:${hidden}`)
    // markup carries data-sv only (scan() adds .sv with JS): a pin stage's
    // panels (curtain, etc.) must not stay as overlays covering the content
    const { bad: occ, examined } = await page.evaluate(OCCLUDED_TEXT)
    if (occ.length > 0) occluded.push(`${f}:${occ.join(',')}`)
    if (PIN_PAGES.includes(f)) examinedByPage[f] = examined
    // the SSR shape: .sv already on the markup, still no JS (a failed bundle on a Next.js page)
    await page.goto(`${base}/ssr/${f}`, { waitUntil: 'load' })
    const ssrHidden = await page.evaluate(HIDDEN_TEXT)
    if (ssrHidden > 0) ssrBad.push(`${f}:${ssrHidden}`) // pages without [data-sv] (slider, pointer, gsap, three) simply have nothing to inject
  }
  await page.close()
  check(`no-JS: ${pages.length} fx pages render every text node`, bad.length === 0, bad.join(' '))
  check(`no-JS + SSR markup (.sv present): ${pages.length} fx pages still render every text node`, ssrBad.length === 0, ssrBad.join(' '))
  check(`no-JS: pin stages never cover their revealed text`, occluded.length === 0, occluded.join(' '))
  console.log(`     examined pin candidates: ${PIN_PAGES.map((f) => `${f}=${examinedByPage[f] ?? 0}`).join(' ')}`)
  const underExamined = PIN_PAGES.filter((f) => (examinedByPage[f] ?? 0) < MIN_EXAMINED)
  check(
    `no-JS: every pin page examines at least ${MIN_EXAMINED} candidate(s) (no silent regression to zero coverage)`,
    underExamined.length === 0,
    underExamined.map((f) => `${f}=${examinedByPage[f] ?? 0}`).join(' ')
  )
}

// ── 0b. Reduced motion, JS on: nothing hidden after scrolling the whole page ──
{
  const pages = readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const bad = []
  for (const f of pages) {
    await page.goto(`${base}/fx/${f}`, { waitUntil: 'load' })
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await new Promise((r) => setTimeout(r, 300))
    await page.evaluate(() => scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 300))
    const hidden = await page.evaluate(HIDDEN_TEXT)
    if (hidden > 0) bad.push(`${f}:${hidden}`)
  }
  await page.close()
  check(`reduced motion: ${pages.length} fx pages keep every text node visible`, bad.length === 0, bad.join(' '))
}

// ── 0c. Reduced motion, dedicated fixture: .sv-auto (no fx page ships one) ──
// The override selector must outrank the normal entrance rule on specificity,
// not on timing, so this must hold immediately on load, with no scroll at all.
{
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setContent(`<!doctype html><html class="sv-on"><head><style>${STYLES_CSS}</style></head>
    <body><div class="sv sv-live sv-auto">
      <p>one</p><p>two</p><p style="margin-top:150vh">three, below the fold</p>
    </div></body></html>`)
  const unsettled = await page.evaluate(() =>
    [...document.querySelectorAll('.sv-auto > *')]
      .map((el) => getComputedStyle(el))
      .filter((cs) => cs.opacity !== '1' || cs.transitionProperty !== 'none').length
  )
  check(
    'reduced motion: .sv-auto children are opacity 1 with no transition before any scroll, incl. below the fold',
    unsettled === 0,
    `${unsettled} unsettled`
  )
  await page.close()
}

// ── 0c-2. Reduced motion, dedicated fixtures: spread and tilt specificity ──
// Round 5 finding: the spread entrance transition rule and the tilt
// leave-transition rule both outrank the reduced-motion override on raw
// selector specificity (extra classes), so a live preference switch used
// to animate the very reset that is supposed to land instantly.
{
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setContent(`<!doctype html><html class="sv-on"><head><style>${STYLES_CSS}</style></head>
    <body>
      <div class="sv"><div class="sv-spread sv-spread-in"><div id="spreadChild">child</div></div></div>
      <div class="sv-tilt sv-pointer-leave" id="tilt"></div>
    </body></html>`)
  const r = await page.evaluate(() => ({
    spreadDuration: getComputedStyle(document.getElementById('spreadChild')).transitionDuration,
    tiltProperty: getComputedStyle(document.getElementById('tilt')).transitionProperty,
  }))
  check(
    `reduced motion: a live .sv-spread-in child's transition-duration is 0s, not the animating rule's duration (ADU-143)`,
    r.spreadDuration === '0s',
    r.spreadDuration
  )
  check(
    `reduced motion: .sv-tilt.sv-pointer-leave's transition is none, not the leave rule's duration (ADU-143)`,
    r.tiltProperty === 'none',
    r.tiltProperty
  )
  await page.close()
}

// ── 0d. No JS, attribute-only markup: the counter renders DIGITS ──
// The no-JS guard feeds --sv-int to [data-sv] markup as well as .sv, but the
// digits themselves come from counter-reset + ::after: keyed on .sv alone,
// attribute-only markup rendered an empty element. Measured as width, not as
// getComputedStyle().content: Chrome reports the literal counter(sv-counter)
// there, for a rule that renders and for one that does not.
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style></head>
    <body>
      <div class="sv"><span id="cls" class="sv-counter" style="--sv-max: 421"></span></div>
      <div data-sv><span id="attr" class="sv-counter" style="--sv-max: 421"></span></div>
    </body></html>`)
  const r = await page.evaluate(() => ({
    cls: document.getElementById('cls').getBoundingClientRect().width,
    attr: document.getElementById('attr').getBoundingClientRect().width,
  }))
  check(
    'no-JS: [data-sv] .sv-counter renders its digits, exactly like .sv does',
    r.attr > 0 && r.attr === r.cls,
    `class=${r.cls} attribute=${r.attr}`
  )
  await page.close()
}

// ── 1. No JS → fully visible ──
{
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(false)
  await page.goto(`${base}/fx/staggered-reveal.html`, { waitUntil: 'load' })
  const r = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.sv-rise, .sv-split-rise')]
    return {
      svOn: document.documentElement.classList.contains('sv-on'),
      hidden: els.filter((el) => getComputedStyle(el).opacity === '0').length,
      total: els.length,
    }
  })
  check('no-JS: html.sv-on absent', r.svOn === false)
  check(`no-JS: 0/${r.total} entrance elements hidden`, r.hidden === 0, `${r.hidden} hidden`)
  await page.close()
}

// ── 2. With JS → hiding only ever happens under html.sv-on ──
{
  const page = await browser.newPage()
  // observe from the first script tick: was any .sv-rise ever computed
  // hidden while sv-on was NOT on <html>?
  await page.evaluateOnNewDocument(() => {
    window.__flash = 0
    const probe = () => {
      const on = document.documentElement.classList.contains('sv-on')
      if (!on) {
        for (const el of document.querySelectorAll('.sv-rise')) {
          if (getComputedStyle(el).opacity === '0') window.__flash++
        }
      }
      if (!on || document.readyState !== 'complete') requestAnimationFrame(probe)
    }
    requestAnimationFrame(probe)
  })
  await page.goto(`${base}/fx/staggered-reveal.html?force=1`, { waitUntil: 'load' })
  const r = await page.evaluate(() => ({
    flash: window.__flash,
    svOn: document.documentElement.classList.contains('sv-on'),
  }))
  check('JS: driver booted (html.sv-on set)', r.svOn === true)
  check('JS: zero frames with content hidden before sv-on', r.flash === 0, `${r.flash} frames`)
  await page.close()
}

// ── 3. Attribute knobs land as variables ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/fx/split-reveal.html?force=1`, { waitUntil: 'load' })
  const r = await page.evaluate(() => {
    const split = document.querySelector('[data-sv-split]')
    const spans = split ? split.querySelectorAll('span[aria-hidden]') : []
    const attr = document.querySelector('[data-sv-order]')
    return {
      spans: spans.length,
      count: split && split.style.getPropertyValue('--sv-count'),
      srText: (() => { const sr = split && split.querySelector('span:not([aria-hidden])'); return sr ? sr.textContent.trim() : '' })(),
      label: split && split.getAttribute('aria-label'),
      attrVar: attr && attr.style.getPropertyValue('--sv-order'),
      spanDisplay: spans.length ? getComputedStyle(spans[0]).display : null,
    }
  })
  check('split: words wrapped in aria-hidden spans', r.spans > 2, `${r.spans} spans`)
  check('split: --sv-count set + sr-only text kept (no aria-label)', !!r.count && r.srText.length > 0 && !r.label, `count=${r.count} sr="${r.srText.slice(0, 20)}" label=${r.label}`)
  check('split-rise: a split word span computes to display: inline-block (so translate applies)', r.spanDisplay === 'inline-block', `display=${r.spanDisplay}`)
  await page.close()
}

// ── 3b. stopScan(): releasing a tracked element leaves it VISIBLE (ADU-130) ──
// `.sv` and `[data-sv]` both declare --sv-live: 0, only .sv.sv-live lifts it,
// and html.sv-on is never taken back off: a scan() that stops (a React
// ScrollVarsBoot unmount, a route teardown) used to strand every section that
// had not gone live yet at opacity 0 forever.
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style></head>
    <body>
      <section data-sv><p class="sv-rise">above the fold</p></section>
      <section data-sv style="margin-top:250vh"><p class="sv-rise">below the fold, never live</p></section>
    </body></html>`)
  await page.addScriptTag({ content: SV_IIFE_JS })
  const r = await page.evaluate(async () => {
    const stop = SV.scan()
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    const hiddenWhileScanning = [...document.querySelectorAll('.sv-rise')].filter(
      (el) => getComputedStyle(el).opacity !== '1'
    ).length
    stop()
    // --sv-duration is 800ms: let the entrance transition finish before reading
    await new Promise((done) => setTimeout(done, 1200))
    return {
      hiddenWhileScanning,
      total: document.querySelectorAll('.sv-rise').length,
      svOn: document.documentElement.classList.contains('sv-on'),
      hidden: [...document.querySelectorAll('.sv-rise')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    }
  })
  // the fixture only proves anything if something really was hidden first
  check(
    'stopScan(): the fixture starts with a section hidden below the fold',
    r.hiddenWhileScanning > 0 && r.svOn,
    `${r.hiddenWhileScanning}/${r.total} hidden while scanning, sv-on=${r.svOn}`
  )
  check(
    `stopScan(): 0/${r.total} entrance elements left hidden after the scan stops`,
    r.hidden === 0,
    `${r.hidden} still hidden`
  )
  await page.close()
}

// ── 3c. The driver owns the live state (ADU-140, round 5 finding 1): a
// className rewrite that drops the driver-added `sv-live` never hides a
// section that already went live. React's <Track> renders
// `className={'sv ' + className}`, so a prop change rewrites the whole
// attribute, keeps `.sv` (which declares --sv-live: 0) and takes `sv-live`
// with it. A still-tracked element gets the class back on the next frame; a
// settled `once` one has no tracker left at all, and only the inline
// --sv-live the driver now writes keeps it visible ──
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style></head>
    <body>
      <!-- tall enough to sit inside the live band (enter 75%, exit 25% of the viewport) -->
      <section class="sv" data-sv id="tracked" style="margin-top:20vh;min-height:40vh"><p class="sv-rise">tracked, still scanning</p></section>
      <section class="sv" data-sv data-sv-once id="settled" style="min-height:40vh"><p class="sv-rise">settled once, no tracker left</p></section>
    </body></html>`)
  await page.addScriptTag({ content: SV_IIFE_JS })
  const r = await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    const opacity = (id) => getComputedStyle(document.querySelector(`#${id} .sv-rise`)).opacity
    SV.scan()
    await frame()
    await new Promise((done) => setTimeout(done, 1200)) // --sv-duration is 800ms
    const liveBefore = ['tracked', 'settled'].filter((id) => document.getElementById(id).classList.contains('sv-live'))
    const visibleBefore = ['tracked', 'settled'].filter((id) => opacity(id) === '1')
    for (const id of ['tracked', 'settled']) document.getElementById(id).className = 'sv rewritten'
    await frame()
    await new Promise((done) => setTimeout(done, 1200)) // long enough for a fade-out to finish
    const visibleAfter = ['tracked', 'settled'].filter((id) => opacity(id) === '1')
    // a class rewrite schedules no frame of its own (nothing scrolled, nothing
    // resized): the class comes back on the next frame the driver measures,
    // while the inline flag it wrote at the transition covers the meantime
    scrollTo(0, 1)
    await frame()
    return {
      liveBefore,
      visibleBefore,
      visibleAfter,
      trackedClass: document.getElementById('tracked').classList.contains('sv-live'),
      settledInline: document.getElementById('settled').style.getPropertyValue('--sv-live'),
      opacities: ['tracked', 'settled'].map((id) => `${id}=${opacity(id)}`).join(' '),
    }
  })
  check(
    'live state: the fixture starts with both sections live and revealed',
    r.liveBefore.length === 2 && r.visibleBefore.length === 2,
    `live=${r.liveBefore.join(',')} visible=${r.visibleBefore.join(',')}`
  )
  check(
    'live state: a className rewrite that drops sv-live leaves both sections visible',
    r.visibleAfter.length === 2,
    `visible=${r.visibleAfter.join(',')} (${r.opacities})`
  )
  check(
    'live state: the still-tracked section gets sv-live back on its next measured frame, the settled once one holds the inline flag',
    r.trackedClass && r.settledInline === '1',
    `class=${r.trackedClass} inline=${r.settledInline || '(none)'}`
  )
  await page.close()
}

// ── 3d. Release settles a tracked element to its no-JS rendering (ADU-140,
// round 5 finding 2). ADU-130 settled the ENTRANCE presets with an inline
// --sv-live: 1, but `.sv` stays and `html.sv-on` never comes off, so every
// pin preset kept reading a clock that had stopped: closed curtains over the
// content, a deck stacked in one grid cell, an unfinished sv-range at
// opacity 0, a spread scrubbed from --sv-t fanned into an overlapping stack,
// and a sticky, 100vh, overflow-hidden stage. The same markup with
// JavaScript off is the reference rendering ──
{
  // SSR shape on purpose (`class="sv"` next to the data-sv attributes, what
  // React <Track> emits): the two pages then differ only by the driver having
  // run, which is exactly the claim under test.
  const RELEASE_FIXTURE = `<!doctype html><html><head><style>${STYLES_CSS}</style>
    <style>
      body { margin: 0 }
      .panel { position: absolute; top: 0; bottom: 0; width: 50%; background: #111; color: #fff }
      .revealed { display: grid; place-items: center; height: 100% }
      .card { padding: 2rem; background: #333; color: #fff }
      /* the documented scrub idiom for the spread preset, mapped from the
         driver's own travel clock (styles/core.css says so verbatim) */
      #spread > * { --sv-spread: clamp(0, calc(var(--sv-t) * 2), 1) }
    </style></head>
    <body>
      <div class="sv" data-sv data-sv-pin="300vh" id="pinned">
        <div class="sv-stage" id="stage">
          <div class="revealed">revealed content</div>
          <div class="panel sv-curtain-l" id="curtain-l">left</div>
          <div class="panel sv-curtain-r" id="curtain-r" style="left:50%">right</div>
          <div class="sv-deck" id="deck" style="--sv-count:3">
            <div class="card" id="card">one</div><div class="card">two</div><div class="card">three</div>
          </div>
          <div class="sv-range sv-range-rise" id="range">
            <p id="rise-item" style="--sv-from:0;--sv-to:.5">ranged text</p>
          </div>
        </div>
      </div>
      <p>after the pinned stretch</p>
      <!-- a second tracker, far below the fold: it never goes live while the
           driver runs, so its presets sit at the START of their clocks. The
           entrance half settles on the inline --sv-live: 1 the release writes,
           the scrubbed spread only on the [data-sv-off] guard. Spans by hand,
           not data-sv-split: split() is JS, and both pages must ship the same
           markup for the comparison to mean anything. -->
      <section class="sv" data-sv id="below" style="min-height:40vh">
        <p class="sv-split-rise" id="split"><span aria-hidden="true" id="split-span" style="--sv-order:0">one</span></p>
        <div class="sv-spread" id="spread">
          <div class="card" id="spread-card" style="--sv-order:0">a</div>
          <div class="card" style="--sv-order:1">b</div>
          <div class="card" style="--sv-order:2">c</div>
        </div>
        <div class="sv-acts" id="acts" style="--sv-acts-duration:60ms">act clock</div>
      </section>
    </body></html>`
  const SETTLED_SIGNATURE = () => {
    // an identity transform paints exactly like `none`, and the two pages
    // reach it by different routes: the released page computes
    // `translate: 0 calc((1 - 1) * 0.6em)` to `0px`, the no-JS page never
    // applies the rule at all. Only translate/rotate/scale are folded, so a
    // real 100px offset still reads as a difference.
    const identity = (prop, value) =>
      ['translate', 'rotate', 'scale'].includes(prop) && /^(0px|0px 0px|0deg|1|1 1)$/.test(value) ? 'none' : value
    const read = (sel, props) => {
      const el = document.querySelector(sel)
      if (!el) return `MISSING ${sel}`
      const cs = getComputedStyle(el)
      return props.map((p) => `${p}=${identity(p, cs.getPropertyValue(p).trim())}`).join(' ')
    }
    return {
      wrapper: read('#pinned', ['height', 'position']),
      stage: read('#stage', ['position', 'height', 'overflow']),
      curtainL: read('#curtain-l', ['display', 'translate', 'transform']),
      curtainR: read('#curtain-r', ['display', 'translate', 'transform']),
      deck: read('#deck', ['display']),
      card: read('#card', ['translate', 'rotate', 'scale', 'opacity']),
      rise: read('#rise-item', ['opacity', 'translate']),
      spread: read('#spread-card', ['translate', 'rotate']),
      split: read('#split-span', ['opacity', 'translate']),
      acts: read('#acts', ['--sv-act']),
    }
  }

  const noJs = await browser.newPage()
  await noJs.setJavaScriptEnabled(false)
  await noJs.setContent(RELEASE_FIXTURE)
  const baseline = await noJs.evaluate(SETTLED_SIGNATURE)
  await noJs.close()

  const page = await browser.newPage()
  await page.setContent(RELEASE_FIXTURE)
  await page.addScriptTag({ content: SV_IIFE_JS })
  await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    window.__stopScan = SV.scan()
    await frame()
    scrollTo(0, innerHeight) // into the pinned stretch: every clock is mid-flight
    await frame()
  })
  const driven = await page.evaluate(SETTLED_SIGNATURE)
  await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    window.__stopScan() // a ScrollVarsBoot unmount, a route teardown
    await frame()
    scrollTo(0, 0) // same scroll position the no-JS page is read at
    await frame()
    // the settle is animated, not instant: the entrance transition is
    // --sv-duration (800ms) and the acts clock 60ms in this fixture. Reading
    // at 200ms caught a split-rise span still 0.63px short of its rest.
    await new Promise((done) => setTimeout(done, 1200))
  })
  const released = await page.evaluate(SETTLED_SIGNATURE)

  const differing = (a, b) => Object.keys(baseline).filter((k) => a[k] !== b[k])
  // the comparison is only worth anything if the driver really was driving
  const drivenDiff = differing(driven, baseline)
  check(
    'release: while scanning, the pinned fixture really does render differently from its no-JS state',
    drivenDiff.length > 0,
    `identical on every probe: ${JSON.stringify(driven)}`
  )
  // and the below-the-fold section only proves its three presets if the driver
  // really held them at the start of their clocks first
  const belowDriven = ['spread', 'split', 'acts'].filter((k) => driven[k] === baseline[k])
  check(
    'release: while scanning, the below-the-fold spread, split-rise and acts sit at their unstarted state',
    belowDriven.length === 0,
    `already settled while driving: ${belowDriven.map((k) => `${k}[${driven[k]}]`).join(' | ')}`
  )
  // the marker is an attribute, not a class, exactly for this: React's
  // <Track> renders className={'sv ' + className}, and a released element has
  // no tracker left to put a dropped class back
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('[data-sv]')) el.className = 'sv rewritten'
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })
  const rewritten = await page.evaluate(SETTLED_SIGNATURE)

  const stillDiffering = differing(released, baseline)
  check(
    'release: after stopScan() the curtain, deck, sv-range, stage, spread, split-rise and acts all render exactly as with no JS',
    stillDiffering.length === 0,
    stillDiffering.map((k) => `${k}: released[${released[k]}] noJS[${baseline[k]}]`).join(' | ')
  )
  const rewrittenDiff = differing(rewritten, baseline)
  check(
    'release: a className rewrite after the release keeps that rendering (the marker is an attribute, which React never drops)',
    rewrittenDiff.length === 0,
    rewrittenDiff.map((k) => `${k}: rewritten[${rewritten[k]}] noJS[${baseline[k]}]`).join(' | ')
  )
  await page.close()
}

// ── 3d bis. Release with the tracker ON the .sv-spread container (ADU-140,
// round 3 finding 2). The no-JS guard `html:not(.sv-on) .sv-spread > *` needs
// no tracker ancestor, and the documented scrub idiom puts `.sv` and the
// data-sv attributes on the spread container itself, so the release marker
// lands on the .sv-spread. A descendant-only twin can never fire there, and
// the cards stayed fanned into an overlapping stack where no JS gives none ──
{
  const SPREAD_FIXTURE = `<!doctype html><html><head><style>${STYLES_CSS}</style>
    <style>
      body { margin: 0 }
      .card { padding: 1rem; background: #333; color: #fff }
      /* the scrub idiom styles/core.css documents, on the tracked element */
      #spread > * { --sv-spread: clamp(0, calc(var(--sv-t) * 2), 1) }
    </style></head>
    <body>
      <div style="height:120vh">above the fold</div>
      <div class="sv sv-spread" data-sv data-sv-travel id="spread">
        <div class="card" id="spread-card" style="--sv-order:0">a</div>
        <div class="card" style="--sv-order:1">b</div>
        <div class="card" style="--sv-order:2">c</div>
      </div>
    </body></html>`
  const SPREAD_PROBE = () => {
    const cs = getComputedStyle(document.querySelector('#spread-card'))
    return `translate=${cs.translate} rotate=${cs.rotate}`
  }
  const noJs = await browser.newPage()
  await noJs.setJavaScriptEnabled(false)
  await noJs.setContent(SPREAD_FIXTURE)
  const spreadBaseline = await noJs.evaluate(SPREAD_PROBE)
  await noJs.close()

  const page = await browser.newPage()
  await page.setContent(SPREAD_FIXTURE)
  await page.addScriptTag({ content: SV_IIFE_JS })
  await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    window.__stopScan = SV.scan()
    await frame()
    scrollTo(0, innerHeight * 0.6) // mid-travel: the cards sit part-way out
    await frame()
  })
  const spreadDriven = await page.evaluate(SPREAD_PROBE)
  check(
    'released spread: the scrub idiom on the container really does fan the cards while the driver runs',
    spreadDriven !== spreadBaseline,
    `identical to the no-JS page already: ${spreadDriven}`
  )
  const spreadReleased = await page.evaluate(async () => {
    window.__stopScan()
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    await new Promise((done) => setTimeout(done, 250))
    return document.querySelector('#spread').hasAttribute('data-sv-off')
  })
  check('released spread: the marker lands on the tracked .sv-spread itself', spreadReleased, 'no data-sv-off on #spread')
  const spreadAfter = await page.evaluate(SPREAD_PROBE)
  check(
    'released spread: a released .sv-spread container settles its cards exactly as with no JS',
    spreadAfter === spreadBaseline,
    `released[${spreadAfter}] noJS[${spreadBaseline}]`
  )
  await page.close()
}

// ── 3e. A released ancestor must not settle a still-tracked descendant
// (ADU-140, round 3 finding 1). `[data-sv-off] X` matches through ANY depth
// and nested trackers are a first-class pattern (invariant 4 below: the
// NEAREST tracker owns spread), so releasing an outer tracker flipped the
// inner one's stage, curtains and deck to their static rendering while its
// pin clock kept writing --sv-pin ──
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style>
    <style>
      body { margin: 0 }
      .panel { position: absolute; top: 0; bottom: 0; width: 50%; background: #111; color: #fff }
      .card { padding: 2rem; background: #333; color: #fff }
    </style></head>
    <body>
      <div class="sv" data-sv id="outer">
        <div class="sv" data-sv id="inner">
          <div class="sv-stage" id="stage">
            <div>revealed content</div>
            <div class="panel sv-curtain-l" id="curtain-l">left</div>
            <div class="sv-deck" id="deck" style="--sv-count:3">
              <div class="card" id="card">one</div><div class="card">two</div><div class="card">three</div>
            </div>
          </div>
        </div>
      </div>
      <p>after the pinned stretch</p>
    </body></html>`)
  await page.addScriptTag({ content: SV_IIFE_JS })
  const NESTED_SIGNATURE = () => {
    const read = (sel, props) => {
      const cs = getComputedStyle(document.querySelector(sel))
      return props.map((p) => `${p}=${cs.getPropertyValue(p).trim()}`).join(' ')
    }
    return {
      pin: read('#inner', ['--sv-pin']),
      stage: read('#stage', ['position', 'height', 'overflow']),
      curtain: read('#curtain-l', ['display', 'translate']),
      deck: read('#deck', ['display']),
      card: read('#card', ['translate', 'rotate', 'scale']),
    }
  }
  await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    window.__stopOuter = SV.track(document.querySelector('#outer'), {})
    window.__stopInner = SV.track(document.querySelector('#inner'), { pin: '300vh' })
    await frame()
    scrollTo(0, innerHeight) // into the inner tracker's pinned stretch: every clock mid-flight
    await frame()
  })
  const both = await page.evaluate(NESTED_SIGNATURE)
  const clock = Number(both.pin.split('=')[1])
  check(
    'nested release: the inner tracker really is mid-flight before the outer one is released',
    clock > 0 && clock < 1 && both.stage.includes('position=sticky'),
    `${both.pin} | ${both.stage}`
  )
  await page.evaluate(async () => {
    window.__stopOuter() // the ancestor goes, the descendant keeps tracking
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    await new Promise((done) => setTimeout(done, 250))
  })
  const afterOuter = await page.evaluate(NESTED_SIGNATURE)
  const moved = Object.keys(both).filter((key) => both[key] !== afterOuter[key])
  check(
    'nested release: releasing an outer tracker leaves a still-tracked descendant rendering exactly as before',
    moved.length === 0,
    moved.map((key) => `${key}: after[${afterOuter[key]}] before[${both[key]}]`).join(' | ')
  )
  const marks = await page.evaluate(() => ({
    outer: document.querySelector('#outer').hasAttribute('data-sv-off'),
    inner: document.querySelector('#inner').hasAttribute('data-sv-off'),
  }))
  check(
    'nested release: the released ancestor holds its marker back while a descendant is still tracked',
    !marks.outer && !marks.inner,
    `outer=${marks.outer} inner=${marks.inner}`
  )
  // and the ancestor was WAITING, not skipped: stopScan() releases the outer
  // tracker first, so the marker has to land when the inner one goes too
  const settled = await page.evaluate(async () => {
    window.__stopInner()
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    return {
      outer: document.querySelector('#outer').hasAttribute('data-sv-off'),
      inner: document.querySelector('#inner').hasAttribute('data-sv-off'),
      stage: getComputedStyle(document.querySelector('#stage')).position,
      curtain: getComputedStyle(document.querySelector('#curtain-l')).display,
    }
  })
  check(
    'nested release: releasing the descendant settles it AND the ancestor that was waiting on it',
    settled.outer && settled.inner && settled.stage === 'static' && settled.curtain === 'none',
    JSON.stringify(settled)
  )
  await page.close()
}

// ── 3f. The same waiting ancestor, settled by the OTHER exit from the entry
// map (ADU-140, round 4 finding 1): a `once` entrance descendant latches and
// deletes its entry inside apply(), never through the untrack handle, so the
// ancestor released before it kept a sticky, clipping stage with the curtain
// over its content until some unrelated later release swept the backlog ──
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style>
    <style>
      body { margin: 0 }
      .panel { position: absolute; top: 0; bottom: 0; width: 50%; background: #111; color: #fff }
      #inner { min-height: 40vh; margin-top: 20vh }
    </style></head>
    <body>
      <div class="sv" data-sv id="outer">
        <div class="sv-stage" id="stage">
          <div>revealed content</div>
          <div class="panel sv-curtain-l" id="curtain-l">left</div>
        </div>
        <div class="sv" data-sv id="inner">a section that latches once</div>
      </div>
      <p>after the pinned stretch</p>
    </body></html>`)
  await page.addScriptTag({ content: SV_IIFE_JS })
  const ONCE_SIGNATURE = () => ({
    stage: ['position', 'height', 'overflow']
      .map((p) => `${p}=${getComputedStyle(document.querySelector('#stage')).getPropertyValue(p).trim()}`)
      .join(' '),
    curtain: getComputedStyle(document.querySelector('#curtain-l')).display,
    outerMarked: document.querySelector('#outer').hasAttribute('data-sv-off'),
    innerMarked: document.querySelector('#inner').hasAttribute('data-sv-off'),
    innerLive: document.querySelector('#inner').classList.contains('sv-live'),
  })
  const before = await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    window.__stopOuter = SV.track(document.querySelector('#outer'), { pin: '300vh' })
    // the descendant is below the live band at rest: it still has to latch
    SV.track(document.querySelector('#inner'), { once: true })
    await frame()
    window.__stopOuter() // the ancestor goes first, exactly like stopScan()
    await frame()
    return true
  })
  void before
  const waiting = await page.evaluate(ONCE_SIGNATURE)
  check(
    'once release: the released ancestor holds its marker back while the once descendant is still tracked',
    !waiting.outerMarked && !waiting.innerMarked && waiting.stage.includes('position=sticky'),
    JSON.stringify(waiting)
  )
  const settled = await page.evaluate(async () => {
    scrollTo(0, innerHeight) // the once descendant enters the band, latches and settles itself out
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    await new Promise((done) => setTimeout(done, 250))
    return true
  })
  void settled
  const after = await page.evaluate(ONCE_SIGNATURE)
  check(
    'once release: the settle hands the waiting ancestor its marker, and the stage stops clipping its own content',
    after.outerMarked && after.stage.includes('position=static') && after.curtain === 'none',
    JSON.stringify(after)
  )
  check(
    'once release: the settled descendant itself stays live and unmarked (it latched, it was not released)',
    after.innerLive && !after.innerMarked,
    JSON.stringify(after)
  )
  await page.close()
}

// ── 4. Nested trackers: the nearest one, not any live ancestor, owns spread ──
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html class="sv-on"><head><style>${STYLES_CSS}</style></head>
    <body>
      <div class="sv sv-live" id="direct">
        <div class="sv-spread sv-spread-in">
          <div style="--sv-order:0">a</div><div style="--sv-order:1">b</div><div style="--sv-order:2">c</div>
        </div>
      </div>
      <div class="sv sv-live" id="outer">
        <div class="sv" id="inner">
          <div class="sv-spread sv-spread-in">
            <div style="--sv-order:0">a</div><div style="--sv-order:1">b</div><div style="--sv-order:2">c</div>
          </div>
        </div>
      </div>
    </body></html>`)
  const r = await page.evaluate(() => ({
    direct: getComputedStyle(document.querySelector('#direct .sv-spread > *')).getPropertyValue('--sv-spread').trim(),
    nested: getComputedStyle(document.querySelector('#inner .sv-spread > *')).getPropertyValue('--sv-spread').trim(),
  }))
  check('nested tracker: a live tracker spreads its own children (--sv-spread: 1)', r.direct === '1', `--sv-spread=${r.direct}`)
  check('nested tracker: a non-live tracker inside a live one keeps its spread stacked (--sv-spread: 0)', r.nested === '0', `--sv-spread=${r.nested}`)
  await page.close()
}

// ── 5. Acts: an opened widget keeps its finished --sv-act even inside, or
// as, a non-live tracker (the live-driven rule must not outrank
// .sv-acts.sv-open, on either its descendant or its compound/self selector) ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/bench/harness/fixtures/sv-acts-open-nested.html`, { waitUntil: 'load' })
  await page.addStyleTag({ content: STYLES_CSS })
  const r = await page.evaluate(() => ({
    descendant: getComputedStyle(document.querySelector('#descendant')).getPropertyValue('--sv-act').trim(),
    self: getComputedStyle(document.querySelector('#self')).getPropertyValue('--sv-act').trim(),
  }))
  check(
    'sv-acts: .sv-acts.sv-open inside a non-live [data-sv] tracker keeps --sv-act at --sv-acts-count (5), not reset to 0',
    Number(r.descendant) === 5,
    `--sv-act=${r.descendant}`
  )
  check(
    'sv-acts: a [data-sv].sv-acts.sv-open element that is itself the non-live tracker keeps --sv-act at 5 too',
    Number(r.self) === 5,
    `--sv-act=${r.self}`
  )
  await page.close()
}

// ── 6. toggles(): a boot-present .sv-acts target, closed by default,
// settles from the no-JS finished value straight to 0 with no transition
// when it is marked sv-ui, instead of visibly counting back down (ADU-104,
// round 3 finding 1). An unrelated .sv-acts that no toggle controls is
// never marked sv-ui, so it must keep reading the finished value the whole
// time. toggles() itself is booted from a setTimeout scheduled on the
// first sampled frame, the realistic deferred-boot path (after first
// paint, e.g. a dynamically-imported interactive layer), so the sampling
// window reliably straddles the moment it fires. Round 4 finding 2: the
// hold must never read or write the `transition` shorthand, so an inline
// transition-duration longhand on a boot-marked target survives untouched,
// and an unrelated in-flight transition on a boot-marked target is never
// stopped mid-flight. Round 5 finding: an inline transition-duration
// LONGHAND outranks the stylesheet's --sv-acts-settle-driven duration by
// cascade origin regardless of its value, so a target that has one must
// have its own --sv-act sampled per frame too, the same way the main
// target is, not just have its attribute string checked afterward, or a
// settle silently governed by the longhand passes by omission. Round 6
// finding: the settle must never run at all on a target that is not
// .sv-acts, since getPropertyValue('transition-duration') cannot tell an
// authored longhand from the browser's own expansion of an unrelated
// inline `transition` SHORTHAND, so a plain toggle target with one got
// held too. #drift-after-target is not .sv-acts; its own unrelated
// translate transition starts one frame INTO the hold window (after
// toggles() has already run, unlike #drift-target above which starts
// alongside it), the instant the bug forced a snap instead of letting it
// animate ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/bench/harness/fixtures/toggles-boot-settle.html`, { waitUntil: 'load' })
  await page.addStyleTag({ content: STYLES_CSS })
  const FINISHED = 4
  const LONGHAND_FINISHED = 3 // #longhand-target(-important) set no --sv-acts-count: the CSS default
  const DRIFT_END = 90 // px, matches the translate this test sets below
  const {
    samples,
    unrelated,
    longhandSamples,
    longhandDuration,
    longhandImportantSamples,
    longhandImportantDuration,
    longhandImportantPriority,
    driftSamples,
    driftAfterSamples,
  } = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const read = (el) => Number(getComputedStyle(el).getPropertyValue('--sv-act'))
        const target = document.querySelector('#target')
        const other = document.querySelector('#unrelated')
        const longhand = document.querySelector('#longhand-target')
        const longhandImportant = document.querySelector('#longhand-important-target')
        const drift = document.querySelector('#drift-target')
        const driftX = () => parseFloat(getComputedStyle(drift).translate) || 0
        const driftAfter = document.querySelector('#drift-after-target')
        const driftAfterX = () => parseFloat(getComputedStyle(driftAfter).translate) || 0
        const samples = []
        const unrelated = []
        const longhandSamples = []
        const longhandImportantSamples = []
        const driftSamples = []
        const driftAfterSamples = []
        let booted = false
        let toggleRan = false
        let driftAfterArmed = false
        let frames = 0
        const FRAMES = 20
        const tick = () => {
          samples.push(read(target))
          unrelated.push(read(other))
          longhandSamples.push(read(longhand))
          longhandImportantSamples.push(read(longhandImportant))
          driftSamples.push(driftX())
          driftAfterSamples.push(driftAfterX())
          if (!booted) {
            booted = true
            // an unrelated transition, already committed at translate: 0px
            // since page load, kicked off right as toggles() is scheduled
            // to boot: it must keep animating straight through the settle
            drift.style.translate = '90px'
            setTimeout(() => {
              window.SV.toggles()
              toggleRan = true
            }, 0)
          } else if (toggleRan && !driftAfterArmed) {
            // the first sampled frame after toggles() has actually run, not
            // just been scheduled: #drift-after-target's own unrelated
            // transition starts here, one frame INTO the two-frame settle
            // hold, the instant round 6's bug forced a snap (ADU-104)
            driftAfterArmed = true
            driftAfter.style.translate = '90px'
          }
          frames++
          if (frames < FRAMES) requestAnimationFrame(tick)
          else
            resolve({
              samples,
              unrelated,
              longhandSamples,
              longhandDuration: longhand.style.transitionDuration,
              longhandImportantSamples,
              longhandImportantDuration: longhandImportant.style.getPropertyValue('transition-duration'),
              longhandImportantPriority: longhandImportant.style.getPropertyPriority('transition-duration'),
              driftSamples,
              driftAfterSamples,
            })
        }
        requestAnimationFrame(tick)
      })
  )
  console.log(`     sampled --sv-act on the boot-settle target: ${samples.join(', ')}`)
  const intermediate = samples.filter((n) => n !== FINISHED && n !== 0)
  check(
    'toggles(): a boot-marked .sv-acts target only ever reads the finished value or 0, never mid-transition',
    intermediate.length === 0,
    `intermediate values seen: ${intermediate.join(', ')}`
  )
  check(
    'toggles(): the boot-marked target settles to 0 within the sampled frames',
    samples[samples.length - 1] === 0,
    `last sample=${samples[samples.length - 1]}`
  )
  check(
    'toggles(): an unrelated .sv-acts that no toggle controls stays at the finished value throughout',
    unrelated.every((n) => n === FINISHED),
    unrelated.join(', ')
  )
  const longhandIntermediate = longhandSamples.filter((n) => n !== LONGHAND_FINISHED && n !== 0)
  check(
    'toggles(): a target with an inline transition-duration longhand only ever reads the finished value or 0, never mid-transition (ADU-104, round 5 finding)',
    longhandIntermediate.length === 0,
    `intermediate values seen: ${longhandIntermediate.join(', ')}, samples: ${longhandSamples.join(', ')}`
  )
  check(
    'toggles(): an inline transition-duration longhand on a boot-marked target survives the settle (ADU-104, round 4 finding 2)',
    longhandDuration === '400ms',
    `style.transitionDuration=${longhandDuration}`
  )
  const longhandImportantIntermediate = longhandImportantSamples.filter(
    (n) => n !== LONGHAND_FINISHED && n !== 0
  )
  check(
    'toggles(): an inline transition-duration longhand set with !important only ever reads the finished value or 0, never mid-transition (ADU-104, round 5 finding)',
    longhandImportantIntermediate.length === 0,
    `intermediate values seen: ${longhandImportantIntermediate.join(', ')}, samples: ${longhandImportantSamples.join(', ')}`
  )
  check(
    'toggles(): an inline transition-duration longhand set with !important survives the settle with its priority intact, not just its value (ADU-104, round 5 finding)',
    longhandImportantDuration === '400ms' && longhandImportantPriority === 'important',
    `value=${longhandImportantDuration} priority=${longhandImportantPriority}`
  )
  check(
    'toggles(): an unrelated in-flight transition on a boot-marked target is never stopped by the settle hold (ADU-104, round 4 finding 2)',
    driftSamples.some((n) => n > 0 && n < DRIFT_END),
    `sampled translate: ${driftSamples.join(', ')}`
  )
  check(
    'toggles(): a plain toggle target (not .sv-acts) never runs the settle, so an unrelated transition started one frame into the hold window still animates instead of snapping (ADU-104, round 6 finding)',
    driftAfterSamples.some((n) => n > 0 && n < DRIFT_END),
    `sampled translate: ${driftAfterSamples.join(', ')}`
  )

  await page.click('#trigger')
  const afterClickSamples = await page.evaluate(
    (finished) =>
      new Promise((resolve) => {
        const read = () => Number(getComputedStyle(document.querySelector('#target')).getPropertyValue('--sv-act'))
        const samples = []
        let frames = 0
        const FRAMES = 20
        const tick = () => {
          samples.push(read())
          frames++
          if (frames < FRAMES && samples[samples.length - 1] !== finished) requestAnimationFrame(tick)
          else resolve(samples)
        }
        requestAnimationFrame(tick)
      }),
    FINISHED
  )
  const afterClick = afterClickSamples[afterClickSamples.length - 1]
  check(
    'toggles(): clicking the trigger still reaches the finished value (transition allowed here, unlike the boot settle)',
    afterClick === FINISHED,
    `--sv-act=${afterClick}`
  )
  check(
    'toggles(): the click transition actually animates through an intermediate value, proving the transition returned (ADU-104, round 4 finding 2)',
    afterClickSamples.some((n) => n > 0 && n < FINISHED),
    afterClickSamples.join(', ')
  )
  await page.close()
}

// ── 7. StickySteps (React fx component): inert/aria-hidden on the
// non-active shots follow prefers-reduced-motion LIVE, not just at mount
// (ADU-108, round 3 finding 19: the effect read the media query once) ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/bench/harness/fixtures/sticky-steps-inert.html`, { waitUntil: 'load' })
  const readShots = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.st-shot')].map((el) => ({
        inert: el.inert,
        ariaHidden: el.getAttribute('aria-hidden'),
      }))
    )
  const settled = (name, shots) =>
    check(
      name,
      shots[0].inert === false &&
        shots[0].ariaHidden === null &&
        shots.slice(1).every((s) => s.inert === true && s.ariaHidden === 'true'),
      JSON.stringify(shots)
    )

  const before = await readShots()
  settled('sticky-steps: on mount the non-active shots are inert + aria-hidden (scene 0 is active)', before)

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await new Promise((r) => setTimeout(r, 100))
  const reduced = await readShots()
  check(
    'sticky-steps: switching to prefers-reduced-motion: reduce LIVE drops inert/aria-hidden from every shot',
    reduced.every((s) => s.inert === false && s.ariaHidden === null),
    JSON.stringify(reduced)
  )

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await new Promise((r) => setTimeout(r, 100))
  const restored = await readShots()
  settled('sticky-steps: switching back restores inert + aria-hidden on the non-active shots', restored)

  await page.close()
}

// ── 8. Canvas: mountEffect()'s applySize() detects the unsized-canvas DPR
// feedback loop (ADU-107). First through eighth pass, each one a verifier
// or panel finding reproduced in real Chrome, are in CHANGELOG.md's Canvas
// section: a border-box-rect-vs-content-box-attribute equality guard that
// both missed a bordered unsized canvas and mispinned a legitimately
// CSS-sized one; a padding-inflated read; a fractional-padding rounding
// residual; a fallback re-measure that disagreed with a bit-exact
// ResizeObserverEntry for reasons that had nothing to do with feedback
// (fractional padding, a transform); a flat 1px tolerance that took dozens
// of passes to notice a small canvas's small move; a value- and
// timing-based "echo window" that could not tell a coincidental real resize
// landing on the harness's own just-written size apart from its own echo;
// and (eighth pass) a causal probe that bumped `canvas.width`/`height` up
// by a flat +1 EACH and pinned `style.width` AND `style.height` together
// whenever either axis' `clientWidth`/`clientHeight` responded. That probe
// was genuinely causal, not a coincidence check, but three verifier
// findings on it (see 8g/8h/8i below) showed it asked the wrong shape of
// question: a flat, per-axis bump perturbs the RATIO between width and
// height, not just their size, so an ordinary `width:100%; height:auto`
// canvas (no CSS height at all: the auto height derives from the ratio)
// could read as having moved on height and get wrongly pinned; and pinning
// both axes together freezes the aspect ratio even when only width needed
// it, so a `max-width` cap not yet binding got pinned correctly on mount but
// then distorted, not scaled, on a later container shrink that engaged it.
//
// Ninth pass: the probe is now PROPORTIONAL and asks about ONE axis only.
// Right after writing the backing store, it sets `canvas.width`/`height` to
// HALF their just-written value together (same divisor on both axes, so
// the ratio between them holds steady) and reads `canvas.clientWidth` (a
// forced layout), then restores them and reads again. If the two readings
// differ, width follows the attribute (unsized on width, whatever height
// does); if they are equal, width is CSS-sized, whatever its source (a
// percentage, a fixed px value, or itself ratio-derived from a fixed
// height), and nothing about height enters that conclusion. Only WIDTH
// gets pinned: height stays free to keep tracking the intrinsic ratio,
// which is exactly the axis the harness's own proportional writes keep
// stable, and a later `max-width` shrink then correctly recomputes height
// from the new width through that ratio instead of fighting a frozen
// number. A settle still takes no extra ResizeObserver round trip at all,
// measured against real Chrome: the pin runs synchronously inside the same
// callback that delivered the entry, before the browser ever gets a chance
// to render the intermediate (unpinned) box the backing-store write alone
// would have produced, so from the ResizeObserver's own perspective the
// canvas's box started this callback at its intrinsic size and ends it at
// that same pinned size, no observable change, no further entry.
// `log.length` below is 1 for a case that settles, the consumer sees the
// correct size exactly once, never an inflated one and never a second
// confirmation. Height is never written to style at all now, so every
// check below that used to assert a pinned `height: ...px` instead asserts
// the style has NO `height` in it.
//
// Tenth pass: two more verifier findings on the ninth pass, both
// reproduced in real Chrome (see 8j/8k below). Finding 1: HALVING
// (`Math.floor(W / 2)`) does not preserve the W:H ratio when W and H have
// different parity, so a fixed-CSS-height, auto-width canvas (the mirror
// case) could have its floored ratio read a fraction off the true one,
// flipping the before/after comparison and wrongly pinning an ordinary,
// fully-responsive canvas. Finding 2: a `max-width` cap that already binds
// at the canvas's natural (uncapped) size settles correctly unpinned,
// rendered crisp at the cap, and this is documented as the correct
// behavior, not inflation (`#maxwidth-bare` above covers the opposite case,
// a cap ABOVE the natural size, which stays the inflation case and must
// still be pinned). The probe now DOUBLES instead of halving (exact for any
// integer pair, whatever the parity), with a fallback to an exact halving
// (only when both W and H are even, so it can never reintroduce finding
// 1's rounding bug) for a cap that is already binding on the just-written,
// dpr-inflated attribute, which doubling alone cannot detect (doubling only
// grows further past a cap already behind it). See the module doc in
// src/canvas/index.ts and CHANGELOG.md's Canvas section for the full
// reasoning.
//
// Eleventh pass: two more verifier findings on the tenth pass (see 8j/8k/8l
// below), both about WHEN the probe ran and WHAT a canvas's write derived
// its own numbers from, not which perturbation it used. The probe now runs
// BEFORE this pass's own write, on the canvas's ORIGINAL `w0`/`h0`
// attributes, never on its own evolving backing store; a pin lands on the
// `anchor` (the CSS content size measured at mount, before any write) with
// `style.aspectRatio` set to `w0 / h0`, so the CSS engine derives height
// exactly from then on. A canvas that stays unpinned has its free axis, if
// it has one, computed from the OTHER axis and `ratio0` instead of
// independently rounding its own fresh measurement, which is what stops
// the mirror case's error from compounding pass over pass instead of
// settling. Probing `w0`/`h0` fixes the tenth pass's parity-mismatch
// inflation but, by design, cannot see a `max-width` cap unclamp because
// THIS pass's own DPR-scaled write dropped below it (a real risk only
// below dpr 1): a separate escape check, right after computing each
// pass's candidate write, catches that instead. See the module doc in
// src/canvas/index.ts and CHANGELOG.md's Canvas section for the full
// reasoning ──
{
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 })
  await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: CANVAS_JS })

  const border = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-border')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: an unsized bordered canvas settles at its intrinsic size instead of running away',
    border.log.length === 1 && border.width === 600 && border.height === 300,
    `resize() calls: ${border.log.length}, canvas.width=${border.width}, canvas.height=${border.height}`
  )
  check(
    'canvas: the pinned CSS width is the content box (border excluded), not the inflated border-box rect; height is never pinned (ninth pass)',
    border.style.includes('width: 300px') && !border.style.includes('height'),
    border.style
  )

  const sized = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#css-sized')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height, cw: canvas.width, ch: canvas.height }),
        })
        setTimeout(() => {
          canvas.classList.add('grown')
          setTimeout(() => resolve({ log, style: canvas.style.cssText }), 200)
        }, 200)
      })
  )
  check(
    'canvas: a CSS-sized canvas whose attributes equal its CSS size is never pinned (no inline style written)',
    sized.style === '',
    sized.style
  )
  check(
    'canvas: that same canvas follows a later class-driven CSS resize instead of freezing at the first size',
    sized.log.length === 2 && sized.log[1].cw === 600 && sized.log[1].ch === 320,
    JSON.stringify(sized.log)
  )

  const padded = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-padded')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: an unsized padded canvas settles at its intrinsic size, the padding never enters the pin',
    padded.log.length === 1 && padded.width === 600 && padded.height === 300,
    `resize() calls: ${padded.log.length}, canvas.width=${padded.width}, canvas.height=${padded.height}`
  )
  check(
    'canvas: the pinned CSS width is the intrinsic content box (300), not the padding-inflated 320; height is never pinned (ninth pass)',
    padded.style.includes('width: 300px') && !padded.style.includes('height'),
    padded.style
  )

  const borderBox = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-border-box')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: an unsized bordered, padded, border-box canvas also settles at its intrinsic size',
    borderBox.log.length === 1 && borderBox.width === 600 && borderBox.height === 300,
    `resize() calls: ${borderBox.log.length}, canvas.width=${borderBox.width}, canvas.height=${borderBox.height}`
  )
  check(
    'canvas: that width pin lands on the intrinsic content box even under the author\'s own box-sizing:border-box; height is never pinned (ninth pass)',
    borderBox.style.includes('width: 300px') &&
      !borderBox.style.includes('height') &&
      borderBox.style.includes('box-sizing: content-box'),
    borderBox.style
  )

  const fractional = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-fractional-padding')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: an unsized canvas with fractional (0.3px) padding settles at its exact intrinsic size',
    fractional.log.length === 1 && fractional.width === 600 && fractional.height === 300,
    `resize() calls: ${fractional.log.length}, canvas.width=${fractional.width}, canvas.height=${fractional.height}`
  )
  check(
    'canvas: the pinned CSS width is the exact intrinsic content box (300), not a subpixel-rounded 300.4; height is never pinned (ninth pass)',
    fractional.style.includes('width: 300px') && !fractional.style.includes('height'),
    fractional.style
  )

  const sizedFractional = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#css-sized-fractional')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height, cw: canvas.width, ch: canvas.height }),
        })
        setTimeout(() => {
          canvas.classList.add('grown')
          setTimeout(() => resolve({ log, style: canvas.style.cssText }), 200)
        }, 200)
      })
  )
  check(
    'canvas: a CSS-sized canvas with fractional (0.3px) padding is never pinned (ADU-107, fifth pass)',
    sizedFractional.style === '',
    sizedFractional.style
  )
  check(
    'canvas: that same canvas follows a later class-driven CSS resize instead of freezing at the first size',
    sizedFractional.log.length === 2 && sizedFractional.log[1].cw === 800 && sizedFractional.log[1].ch === 400,
    JSON.stringify(sizedFractional.log)
  )

  const sizedScaled = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#css-sized-scaled')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height, cw: canvas.width, ch: canvas.height }),
        })
        setTimeout(() => {
          canvas.classList.add('grown')
          setTimeout(() => resolve({ log, style: canvas.style.cssText }), 200)
        }, 200)
      })
  )
  check(
    'canvas: a CSS-sized canvas under transform: scale() is never pinned, even though its rect is inflated (ADU-107, fifth pass)',
    sizedScaled.style === '',
    sizedScaled.style
  )
  check(
    'canvas: that same transformed canvas follows a later class-driven CSS resize instead of freezing at the first size',
    sizedScaled.log.length === 2 && sizedScaled.log[1].cw === 500 && sizedScaled.log[1].ch === 240,
    JSON.stringify(sizedScaled.log)
  )

  const paddedScaled = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-padded-scaled')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: an unsized canvas with padding AND its own transform still settles at its true 300x150 content box (ADU-107, seventh pass)',
    paddedScaled.log.length === 1 && paddedScaled.width === 600 && paddedScaled.height === 300,
    `resize() calls: ${paddedScaled.log.length}, canvas.width=${paddedScaled.width}, canvas.height=${paddedScaled.height}`
  )
  check(
    'canvas: that width pin is the true content box (300), not a transform/padding-dampened inflated size; height is never pinned (ninth pass)',
    paddedScaled.style.includes('width: 300px') && !paddedScaled.style.includes('height'),
    paddedScaled.style
  )
  await page.close()
}

// ── 8b. Canvas: a small unsized canvas at a fractional deviceScaleFactor
// settles at its intrinsic size (ADU-107, sixth pass, panel finding). A
// real feedback loop moves an unsized canvas by size * (dpr - 1) CSS
// pixels per applySize() pass: for a 4x4 canvas at dpr 1.25 that is exactly
// 1px. The seventh-pass echo check catches this the same as any other
// gap: a plain integer equality against the exact backing store it wrote,
// no ratio or tolerance needed (see src/canvas/index.ts) ──
{
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1.25 })
  await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: CANVAS_JS })

  const tiny = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-tiny')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: a 4x4 unsized canvas at deviceScaleFactor 1.25 settles at its intrinsic size, not several passes inflated (ADU-107, sixth pass)',
    tiny.log.length === 1 && tiny.width === 5 && tiny.height === 5,
    `resize() calls: ${tiny.log.length}, canvas.width=${tiny.width}, canvas.height=${tiny.height}`
  )
  check(
    'canvas: that width pin lands on the intrinsic 4x4 content box; height is never pinned (ninth pass)',
    tiny.style.includes('width: 4px') && !tiny.style.includes('height'),
    tiny.style
  )
  await page.close()
}

// ── 8c. Same finding, a barely-fractional DPR and a larger (still small)
// canvas, to prove the echo check catches a 1px gap regardless of the
// canvas's size or the exact DPR (ADU-107, sixth pass) ──
{
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1.05 })
  await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: CANVAS_JS })

  const tiny20 = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#unsized-tiny-20')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => log.push({ w: fx.width, h: fx.height }),
        })
        setTimeout(
          () => resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
          200
        )
      })
  )
  check(
    'canvas: a 20x20 unsized canvas at deviceScaleFactor 1.05 settles at its intrinsic size, not several passes inflated (ADU-107, sixth pass)',
    tiny20.log.length === 1 && tiny20.width === 21 && tiny20.height === 21,
    `resize() calls: ${tiny20.log.length}, canvas.width=${tiny20.width}, canvas.height=${tiny20.height}`
  )
  check(
    'canvas: that width pin lands on the intrinsic 20x20 content box; height is never pinned (ninth pass)',
    tiny20.style.includes('width: 20px') && !tiny20.style.includes('height'),
    tiny20.style
  )
  await page.close()
}

// 8d. Canvas: onDprChange() reuses the last ResizeObserver-measured content
// size instead of a transform-inflated rect (ADU-107, sixth pass, verifier
// finding: a transformed CSS-sized canvas got its content size inflated or
// deflated by the transform on every real devicePixelRatio change, since
// the DPR-change path had no ResizeObserver entry to measure from and fell
// back to getBoundingClientRect(), transform included). Not e2e-able here:
// measured directly (a probe script, not committed), page.setViewport()'s
// deviceScaleFactor does change window.devicePixelRatio and flips a
// matching MediaQueryList's `.matches`, but Chromium never dispatches that
// MediaQueryList's 'change' event for a CDP-emulated DPR override the way
// it does for a real display change, so onDprChange() cannot be triggered
// this way in Puppeteer. Covered by a unit test instead
// (test/canvas.test.mjs, "onDprChange() reuses the last
// ResizeObserver-measured content size...").

// ── 8e. Whole-fixture sweep, every unsized canvas on the page settles at
// its own intrinsic content size and every CSS-sized one is never pinned,
// across every DPR direction this ticket found a regression at: above 1
// (2), just over 1 (1.25, 1.05, the sixth pass's small-canvas findings),
// and below 1 (0.8, 0.5, a zoomed-out page, the seventh-pass regression the
// sixth pass's `dpr > 1` guard missed entirely) ──
{
  const UNSIZED_INTRINSIC = {
    'unsized-border': [300, 150],
    'unsized-padded': [300, 150],
    'unsized-border-box': [300, 150],
    'unsized-fractional-padding': [300, 150],
    'unsized-tiny': [4, 4],
    'unsized-tiny-20': [20, 20],
    'unsized-padded-scaled': [300, 150],
  }
  const CSS_SIZED = ['css-sized', 'css-sized-fractional', 'css-sized-scaled']
  const ids = [...Object.keys(UNSIZED_INTRINSIC), ...CSS_SIZED]

  for (const dpr of [2, 1.25, 1.05, 0.8, 0.5]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })

    const result = await page.evaluate(
      (ids) =>
        new Promise((resolve) => {
          const state = {}
          for (const id of ids) {
            const canvas = document.querySelector('#' + id)
            const log = []
            window.mountEffect(canvas, {
              frame: () => {},
              resize: (fx) => log.push({ w: fx.width, h: fx.height }),
            })
            state[id] = { canvas, log }
          }
          setTimeout(() => {
            resolve({
              // Chrome's actual window.devicePixelRatio at an emulated
              // deviceScaleFactor is not always bit-exact to the literal
              // number passed to page.setViewport() (measured: 1.05 reads
              // back a hair under that), which changes which way
              // `size * dpr` rounds: read the real value instead of
              // assuming it back in Node.
              dpr: window.devicePixelRatio,
              canvases: Object.fromEntries(
                ids.map((id) => [
                  id,
                  {
                    log: state[id].log,
                    style: state[id].canvas.style.cssText,
                    width: state[id].canvas.width,
                    height: state[id].canvas.height,
                  },
                ])
              ),
            })
          }, 200)
        }),
      ids
    )

    for (const [id, [w, h]] of Object.entries(UNSIZED_INTRINSIC)) {
      const r = result.canvases[id]
      const bw = Math.round(w * result.dpr)
      const bh = Math.round(h * result.dpr)
      // The proportional probe halves the CURRENT attribute value and reads
      // how layout responds: that response is independent of whether the
      // backing-store write this pass happened to change the numeric value
      // at all (a coincidence at some size/DPR pairs, e.g. a 4x4 canvas at
      // ~1.05 rounding back to 4), so every genuinely unsized canvas gets
      // its width pinned here regardless. The pin runs synchronously inside
      // the very callback that delivered the entry, before the browser
      // ever renders the unpinned intermediate box, so log.length is 1
      // for most size/DPR pairs; a non-square canvas at a DPR where the
      // backing store rounds its two axes asymmetrically (e.g. 300x150 at
      // dpr 1.25: 150 rounds up to 188, 300 divides exactly to 375) costs
      // one further, still-bounded pass while the free height axis settles
      // a sub-pixel residual against that ratio (see the module doc's
      // second trade-off): at most 2, and the backing store itself must
      // still land on, and stay at, the correct value. Only width is ever
      // written to style (ninth pass): height keeps tracking the intrinsic
      // ratio, so it never appears there at all.
      check(
        `canvas: #${id} settles at its intrinsic ${w}x${h} at deviceScaleFactor ${dpr} (actual dpr ${result.dpr}), backing store ${bw}x${bh}`,
        r.log.length >= 1 &&
          r.log.length <= 2 &&
          r.width === bw &&
          r.height === bh &&
          r.style.includes(`width: ${w}px`) &&
          !r.style.includes('height'),
        `resize() calls: ${r.log.length}, canvas.width=${r.width} (want ${bw}), canvas.height=${r.height} (want ${bh}), style=${r.style}`
      )
    }
    for (const id of CSS_SIZED) {
      const r = result.canvases[id]
      check(`canvas: #${id} is never pinned at deviceScaleFactor ${dpr}`, r.style === '', r.style)
    }

    await page.close()
  }
}

// ── 8f. The verifier's exact eighth-pass scenario: a CSS-sized 300x150
// canvas at devicePixelRatio 2 (backing store written to 600x300 on the
// canvas's first settle) resized by a class to exactly 600x300, one
// requestAnimationFrame after that first settle (not one frame after
// mountEffect() itself returns, which runs before the canvas's very first
// ResizeObserver delivery ever fires and so is too early to land inside the
// window the bug needs), an ordinary responsive breakpoint pattern. That
// lands on the exact number the harness itself just wrote one frame
// earlier: the sixth/seventh pass's value- and timing-based echo check
// could not tell that apart from its own echo and pinned this canvas at
// 300x150 forever, dropping the resize to 600x300 on the floor. The causal
// probe (see src/canvas/index.ts) never compares values, only whether
// clientWidth/clientHeight respond to the harness's own attribute write, so
// the coincidence changes nothing ──
{
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 })
  await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: CANVAS_JS })

  const rebound = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const canvas = document.querySelector('#css-sized-rebound')
        const log = []
        window.mountEffect(canvas, {
          frame: () => {},
          resize: (fx) => {
            log.push({ w: fx.width, h: fx.height, cw: canvas.width, ch: canvas.height })
            if (log.length === 1) {
              requestAnimationFrame(() => {
                canvas.classList.add('doubled')
                setTimeout(
                  () =>
                    resolve({ log, style: canvas.style.cssText, width: canvas.width, height: canvas.height }),
                  200
                )
              })
            }
          },
        })
      })
  )
  check(
    "canvas: a CSS-sized canvas resized to exactly its own backing size one frame after its first settle is never mistaken for the harness's own write (ADU-107, eighth pass)",
    rebound.style === '',
    rebound.style
  )
  check(
    'canvas: that same canvas follows the one-frame-later resize to 600x300, not frozen at 300x150',
    rebound.width === 1200 && rebound.height === 600,
    `canvas.width=${rebound.width} (want 1200), canvas.height=${rebound.height} (want 600), log: ${JSON.stringify(rebound.log)}`
  )
  await page.close()
}

// ── 8g. Ninth pass, the verifier's finding 1: an ordinary responsive
// canvas (width:100%, height:auto, no CSS height at all) must never be
// pinned, at every DPR the finding named (0.5, 0.8, 1.25) plus every other
// DPR this whole ticket has ever needed to sweep. The eighth-pass probe
// bumped width and height by a flat +1 each, perturbing the ratio the auto
// height derives from; at some of these exact dpr/rounding combinations
// that read this canvas as having moved on height and wrongly pinned it ──
{
  for (const dpr of [0.5, 0.8, 1, 1.05, 1.25, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })

    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const canvas = document.querySelector('#width-percent-height-auto')
          const log = []
          window.mountEffect(canvas, {
            frame: () => {},
            resize: (fx) => log.push({ w: fx.width, h: fx.height }),
          })
          setTimeout(() => {
            document.querySelector('#percent-container').classList.add('grown')
            setTimeout(
              () =>
                resolve({
                  log,
                  style: canvas.style.cssText,
                  dpr: window.devicePixelRatio,
                  width: canvas.width,
                }),
              200
            )
          }, 200)
        })
    )
    check(
      `canvas: width:100%,height:auto is never pinned at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style === '',
      result.style
    )
    check(
      `canvas: that same canvas follows the container growing from 400 to 600 at deviceScaleFactor ${dpr}`,
      result.log.length === 2 && result.width === Math.round(600 * result.dpr),
      `resize() calls: ${result.log.length}, canvas.width=${result.width} (want ${Math.round(600 * result.dpr)}), log: ${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8h. Ninth pass, the verifier's finding 2: a max-width:100% canvas not
// binding at mount is pinned on width only, and a later container shrink
// that engages the cap scales height with it (the eighth pass pinned
// height too, freezing the ratio and distorting the box instead), at every
// DPR the finding named plus every other DPR this whole ticket has ever
// needed to sweep ──
{
  for (const dpr of [0.5, 0.8, 1, 1.05, 1.25, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })

    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const canvas = document.querySelector('#maxwidth-percent')
          const log = []
          window.mountEffect(canvas, {
            frame: () => {},
            resize: (fx) => log.push({ w: fx.width, h: fx.height }),
          })
          setTimeout(() => {
            const mounted = { style: canvas.style.cssText, width: canvas.width, height: canvas.height }
            document.querySelector('#maxwidth-container').classList.add('shrunk')
            setTimeout(
              () =>
                resolve({
                  mounted,
                  log,
                  style: canvas.style.cssText,
                  dpr: window.devicePixelRatio,
                  width: canvas.width,
                  height: canvas.height,
                }),
              200
            )
          }, 200)
        })
    )
    const bw = Math.round(300 * result.dpr)
    const bh = Math.round(150 * result.dpr)
    check(
      `canvas: max-width:100% not binding at mount is pinned on width only at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.mounted.style.includes('width: 300px') &&
        !result.mounted.style.includes('height') &&
        result.mounted.width === bw &&
        result.mounted.height === bh,
      `style=${result.mounted.style}, canvas.width=${result.mounted.width} (want ${bw}), canvas.height=${result.mounted.height} (want ${bh})`
    )
    const sw = Math.round(150 * result.dpr)
    check(
      `canvas: the container shrink re-engages the cap and scales height with it (not frozen at the old ratio, the eighth-pass 150x150 distortion) at deviceScaleFactor ${dpr}`,
      result.style.includes('width: 300px') && // the pin itself is never rewritten
        result.width === sw &&
        result.height !== result.mounted.height &&
        Math.abs(result.height / result.width - 0.5) < 0.02,
      `style=${result.style}, mounted.height=${result.mounted.height}, canvas.width=${result.width} (want ${sw}), canvas.height=${result.height}, log: ${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8i. Ninth pass, the verifier's finding 3: a bare max-width, no CSS
// width or height at all, is pinned at its true, uncapped intrinsic width
// and never settles inflated past the cap, at every DPR the finding named
// (2) plus every other DPR this whole ticket has ever needed to sweep ──
{
  for (const dpr of [0.5, 0.8, 1, 1.05, 1.25, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })

    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const canvas = document.querySelector('#maxwidth-bare')
          const log = []
          window.mountEffect(canvas, {
            frame: () => {},
            resize: (fx) => log.push({ w: fx.width, h: fx.height }),
          })
          setTimeout(
            () =>
              resolve({
                log,
                style: canvas.style.cssText,
                dpr: window.devicePixelRatio,
                width: canvas.width,
                height: canvas.height,
              }),
            200
          )
        })
    )
    const bw = Math.round(300 * result.dpr)
    const bh = Math.round(150 * result.dpr)
    // Same non-square-DPR-rounding settle as the 8e sweep (see the module
    // doc's second trade-off): at most 2 resize() calls, never more, and
    // the backing store must land on, and stay at, the correct value.
    check(
      `canvas: a bare max-width:400px canvas is pinned at its uncapped intrinsic width (300, never 400) at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.log.length >= 1 &&
        result.log.length <= 2 &&
        result.style.includes('width: 300px') &&
        !result.style.includes('height') &&
        result.width === bw &&
        result.height === bh,
      `resize() calls: ${result.log.length}, style=${result.style}, canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh})`
    )
    await page.close()
  }
}

// ── 8j. Eleventh pass, the verifier's finding: the tenth pass's mirror-case
// fix (doubling instead of halving) was not the whole bug. Its probe ran
// AFTER the backing-store write and rounded width and height independently
// every pass, each from whatever the LAST pass had already produced: a
// fixed-CSS-height (101px, odd), auto-width canvas has its free width
// computed by the CSS engine through the intrinsic ratio, which IS this
// harness's own backing-store attributes, so independent rounding nudged
// that ratio a fraction every pass and the error compounded instead of
// settling (51 to 77 ResizeObserver passes at dpr 0.5 to a WRONG fixed
// point, never settling at all at dpr 0.8). Driven to an ACTUAL fixed point
// (poll until the resize() log stops growing for a whole pass, capped at
// 300, not a fixed 200ms wait that could not have told a genuine settle
// apart from one still drifting) instead of a fixed wait, the anchor design
// converges within a handful of passes and never pins, at every DPR this
// whole ticket has ever needed to sweep ──
{
  for (const dpr of [0.5, 0.8, 1, 1.05, 1.2, 1.25, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#height-fixed-odd-width-auto')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      const passes = await window.driveToFixedPoint(log)
      return {
        passes,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
        // The RENDERED CSS box, read directly, not backing store / dpr
        // (which only recovers the true CSS size for a canvas this
        // harness pins outright; this one is never pinned, its width
        // stays browser-computed from the fixed height through the
        // intrinsic ratio, and rounding the backing store can leave it a
        // sub-pixel off of backingWidth/dpr without that being a bug,
        // see the module doc's dead band).
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      }
    })
    check(
      `canvas: a fixed height:101px, auto-width canvas (the mirror case) is never pinned at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style === '',
      `style=${result.style}, passes=${result.passes}, log=${JSON.stringify(result.log)}`
    )
    check(
      `canvas: and it converges to a fixed point within 3 passes, not the 51-77 the tenth pass needed, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.passes <= 3,
      `passes=${result.passes} (capped at 300), canvas.width=${result.width}, canvas.height=${result.height}`
    )
    // #height-fixed-odd-width-auto's own attributes are width="300"
    // height="150" (ratio0 2): the RENDERED CSS width the fixed point
    // settled at must still be within 1 CSS pixel of the fixed CSS height
    // (101) times that ratio, not the wrong, drifted relationship the
    // tenth pass could settle at or never settle at all.
    check(
      `canvas: and its rendered box keeps the true 2:1 ratio, not a drifted or diverged one, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      Math.abs(result.clientWidth - result.clientHeight * 2) < 1,
      `clientWidth=${result.clientWidth}, clientHeight=${result.clientHeight} (want within 1px of clientHeight*2), canvas.width=${result.width}, canvas.height=${result.height}`
    )
    await page.close()
  }
}

// ── 8k. Eleventh pass, the verifier's finding: the tenth pass's probe
// perturbed the just-written, DPR-scaled attribute, so at a DPR that does
// not divide evenly (roughly 1.2 to 1.9) a first pass could already write a
// backing store past a `max-width` cap before the probe ever ran against
// the canvas's true, natural size, and a second pass's probe then perturbed
// that already-inflated value and pinned at the inflated number instead of
// the true one: `#maxwidth-binding` (max-width:100px, natural 300x150) was
// false-pinned across that range. Probing `w0`/`h0` (the canvas's original,
// never DPR-scaled attributes) instead of the evolving backing store fixes
// that: at dpr 1 and above, this cap, already binding at the canvas's
// natural size, is never pinned, driven to a fixed point the same way as
// 8j above. BELOW dpr 1, this harness's own DPR-scaled write CAN itself
// drop below the cap and unclamp it for real (an actual, reproduced-in-
// Chrome unbounded shrink: canvas.width walked 100 -> 50 -> 25 -> 13 -> 7
// -> 4 -> 2 -> 1 before the escape check below existed), which the
// mount-time probe deliberately cannot see (it checks `w0`/`h0`, not the
// evolving write, specifically to avoid a false pin once a cap changes
// later, see the module doc); the escape check, run right after computing
// each pass's candidate write, catches it there instead and pins ──
{
  for (const dpr of [1, 1.05, 1.2, 1.25, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#maxwidth-binding')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      const passes = await window.driveToFixedPoint(log)
      return {
        passes,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    const bw = Math.round(100 * result.dpr)
    // Height is the free axis here (width is the one the cap fixes), so
    // it is derived from the just-rounded width and ratio0 (2), not
    // independently rounded from 50 * dpr: at dpr 1.05 those genuinely
    // differ by 1 (105 / 2 rounds up to 53, not 52), and 53 is the
    // correct, stable value (see the module doc's free-axis anchoring).
    const bh = Math.round(bw / 2)
    check(
      `canvas: a max-width:100px canvas whose cap binds already at its natural size is NEVER pinned at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style === '' &&
        result.passes <= 3 &&
        result.width === bw &&
        result.height === bh,
      `style=${result.style}, passes=${result.passes}, canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh}), log=${JSON.stringify(result.log)}`
    )
    await page.close()
  }

  for (const dpr of [0.5, 0.8]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#maxwidth-binding')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      const passes = await window.driveToFixedPoint(log)
      return {
        passes,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    const bw = Math.round(100 * result.dpr)
    const bh = Math.round(50 * result.dpr)
    check(
      // Twelfth pass: the escape check still pins (the crisp backing store
      // is unchanged, still round(100 * dpr)), but now at w0 (300), never
      // the cap's own rendered size (100): see src/canvas/index.ts.
      `canvas: the same cap IS pinned below dpr 1, at w0 (300), instead of shrinking away (the escape check) at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style.includes('width: 300px') &&
        result.passes <= 3 &&
        result.width === bw &&
        result.height === bh,
      `style=${result.style}, passes=${result.passes}, canvas.width=${result.width} (want ${bw}, not shrunk further), canvas.height=${result.height} (want ${bh}), log=${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8l. Eleventh pass: a bare max-width:400px canvas (cap ABOVE the
// natural size, the inflation case #maxwidth-bare / 8i above already
// covers at other DPRs) at devicePixelRatio 1.5, the exact parity-mismatch
// verifier finding: the tenth pass's probe let a first pass write an
// inflated 450x225 backing store before it ever ran against the true,
// natural 300x150, and pinned at that inflated number. The anchor design
// probes `w0`/`h0` before any write, so it pins at the true 300, never the
// inflated one, at this DPR too ──
{
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1.5 })
  await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: CANVAS_JS })
  await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

  const result = await page.evaluate(async () => {
    const canvas = document.querySelector('#maxwidth-bare')
    const log = []
    window.mountEffect(canvas, {
      frame: () => {},
      resize: (fx) => log.push({ w: fx.width, h: fx.height }),
    })
    const passes = await window.driveToFixedPoint(log)
    return { passes, log, style: canvas.style.cssText, dpr: window.devicePixelRatio, width: canvas.width, height: canvas.height }
  })
  const bw = Math.round(300 * result.dpr)
  const bh = Math.round(150 * result.dpr)
  check(
    `canvas: a bare max-width:400px canvas is pinned at its true, uncapped 300x150, never an inflated 450x225, at deviceScaleFactor 1.5 (actual dpr ${result.dpr})`,
    result.style.includes('width: 300px') && result.width === bw && result.height === bh,
    `style=${result.style}, passes=${result.passes}, canvas.width=${result.width} (want ${bw}, not 450), canvas.height=${result.height} (want ${bh}, not 225), log=${JSON.stringify(result.log)}`
  )
  await page.close()
}

// ── 8m. Twelfth pass, the verifier's finding 1: the eleventh pass's pin
// used the MEASURED, capped content size (`anchor.width`), not the natural
// attribute size, so a cap "in the gap" (strictly between half w0 and w0,
// the range the mount-time shrink probe DOES detect and pin) froze there
// even once the cap later widened past the natural size and stopped
// binding at all. #gap-cap-removed (w0=160, h0=80, max-width:100px,
// .widened lifts the cap to 200, past w0) must grow back to its natural
// 160x80, not stay frozen at 100x50, at every DPR ──
{
  for (const dpr of [0.5, 0.8, 1, 1.2, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#gap-cap-removed')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      const mountPasses = await window.driveToFixedPoint(log)
      const mounted = { style: canvas.style.cssText, width: canvas.width, height: canvas.height }
      canvas.classList.add('widened')
      const widenPasses = await window.driveToFixedPoint(log)
      return {
        mounted,
        mountPasses,
        widenPasses,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    check(
      `canvas: a cap in the gap is pinned at w0 (160), not the capped 100, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.mounted.style.includes('width: 160px') &&
        result.mounted.width === Math.round(100 * result.dpr) &&
        result.mounted.height === Math.round(50 * result.dpr),
      `style=${result.mounted.style}, canvas.width=${result.mounted.width}, canvas.height=${result.mounted.height}, passes=${result.mountPasses}`
    )
    const bw = Math.round(160 * result.dpr)
    const bh = Math.round(80 * result.dpr)
    check(
      `canvas: widened past the natural size, it grows back to 160x80 instead of freezing at the old pin, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style.includes('width: 160px') && result.width === bw && result.height === bh,
      `style=${result.style}, widenPasses=${result.widenPasses}, canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh}), log=${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8n. Same finding, a cap widened but still binding: #gap-cap-loosened
// (the HTML default 300x150, max-width:220px, .widened loosens it to 260,
// still under 300) must track the wider cap, not stay frozen at 220 ──
{
  for (const dpr of [0.5, 0.8, 1, 1.2, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#gap-cap-loosened')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      await window.driveToFixedPoint(log)
      const mounted = { style: canvas.style.cssText, width: canvas.width, height: canvas.height }
      canvas.classList.add('widened')
      const widenPasses = await window.driveToFixedPoint(log)
      return {
        mounted,
        widenPasses,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    check(
      `canvas: a cap in the gap is pinned at w0 (300), not the capped 220, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.mounted.style.includes('width: 300px') &&
        result.mounted.width === Math.round(220 * result.dpr) &&
        result.mounted.height === Math.round(110 * result.dpr),
      `style=${result.mounted.style}, canvas.width=${result.mounted.width}, canvas.height=${result.mounted.height}`
    )
    const bw = Math.round(260 * result.dpr)
    const bh = Math.round(130 * result.dpr)
    check(
      `canvas: loosened to 260, it follows the new cap instead of freezing at 220, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style.includes('width: 300px') && result.width === bw && result.height === bh,
      `style=${result.style}, widenPasses=${result.widenPasses}, canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh}), log=${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8o. Same finding, a percentage cap tracking a growing container:
// #percent-cap-canvas (w0=200, h0=100, max-width:60% inside a 200px
// #percent-cap-container, .grown widens the container to 400px) must
// follow the container growing, not stay frozen at the old 120 ──
{
  for (const dpr of [0.5, 0.8, 1, 1.2, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#percent-cap-canvas')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      await window.driveToFixedPoint(log)
      const mounted = { style: canvas.style.cssText, width: canvas.width, height: canvas.height }
      document.querySelector('#percent-cap-container').classList.add('grown')
      const growPasses = await window.driveToFixedPoint(log)
      return {
        mounted,
        growPasses,
        log,
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    check(
      `canvas: a 60% cap is pinned at w0 (200), not the capped 120, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.mounted.style.includes('width: 200px') &&
        result.mounted.width === Math.round(120 * result.dpr) &&
        result.mounted.height === Math.round(60 * result.dpr),
      `style=${result.mounted.style}, canvas.width=${result.mounted.width}, canvas.height=${result.mounted.height}`
    )
    const bw = Math.round(200 * result.dpr)
    const bh = Math.round(100 * result.dpr)
    check(
      `canvas: the container growing to 400 (60% = 240, past w0) lets it reach its natural 200x100, at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style.includes('width: 200px') && result.width === bw && result.height === bh,
      `style=${result.style}, growPasses=${result.growPasses}, canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh}), log=${JSON.stringify(result.log)}`
    )
    await page.close()
  }
}

// ── 8p. Twelfth pass, the verifier's finding 2: an author's own
// aspect-ratio on an unsized canvas is kept, not overridden. Attributes
// 300x150 (a 2:1 intrinsic ratio); #authored-aspect-ratio's own CSS asks
// for a perfect square (aspect-ratio: 1). The eleventh pass set
// style.aspectRatio to w0/h0 unconditionally: this canvas would render
// 2:1, not square, under that bug ──
{
  for (const dpr of [0.5, 0.8, 1, 1.2, 1.5, 2]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#authored-aspect-ratio')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      await window.driveToFixedPoint(log)
      return {
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      }
    })
    check(
      `canvas: an authored aspect-ratio is never overwritten by the harness at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      !result.style.includes('aspect-ratio'),
      `style=${result.style}`
    )
    check(
      `canvas: and the box actually renders square (the authored ratio), not 2:1 (the attribute ratio) at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      Math.abs(result.clientWidth - result.clientHeight) < 1,
      `clientWidth=${result.clientWidth}, clientHeight=${result.clientHeight}`
    )
    await page.close()
  }
}

// ── 8q. Thirteenth pass, the verifier's finding, live in Chrome: the
// twelfth pass's own `aspectRatio === 'auto'` guard, right above, never
// actually fired for an UNAUTHORED canvas either. Chrome always reports
// getComputedStyle(canvas).aspectRatio as 'auto W / H', the intrinsic
// ratio appended to the keyword, never the bare 'auto' string, so
// style.aspectRatio was never written at all, for any canvas; height then
// kept deriving from this harness's own rounded, DPR-scaled attributes,
// drifting on every later pass whenever w0 * dpr was not already an
// integer. #unsized-fractional-dpr (30x61, portrait) at 0.51, 1.9 and
// 1.15: every other w0/DPR pair on this page lands on an exact integer
// product and could not see this ──
{
  for (const dpr of [0.51, 1.9, 1.15]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dpr })
    await page.goto(`${base}/bench/harness/fixtures/canvas-unsized-dpr.html`, { waitUntil: 'load' })
    await page.addScriptTag({ content: CANVAS_JS })
    await page.addScriptTag({ content: DRIVE_TO_FIXED_POINT_JS })

    const result = await page.evaluate(async () => {
      const canvas = document.querySelector('#unsized-fractional-dpr')
      const log = []
      window.mountEffect(canvas, {
        frame: () => {},
        resize: (fx) => log.push({ w: fx.width, h: fx.height }),
      })
      await window.driveToFixedPoint(log)
      return {
        style: canvas.style.cssText,
        dpr: window.devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
      }
    })
    const bw = Math.round(30 * result.dpr)
    const bh = Math.round(61 * result.dpr)
    check(
      `canvas: #unsized-fractional-dpr's aspect-ratio is actually set to 30 / 61 at deviceScaleFactor ${dpr} (actual dpr ${result.dpr})`,
      result.style.includes('aspect-ratio: 30 / 61'),
      `style=${result.style}`
    )
    check(
      `canvas: #unsized-fractional-dpr converges to the exact backing store ${bw}x${bh} at deviceScaleFactor ${dpr} (actual dpr ${result.dpr}), never drifting`,
      result.width === bw && result.height === bh,
      `canvas.width=${result.width} (want ${bw}), canvas.height=${result.height} (want ${bh})`
    )
    await page.close()
  }
}

// ── 9. Occlusion sweep negative cases: a decorative clip-path mask is not
// the sr-only technique by itself. Real sr-only text is pinpoint-sized
// (1px by 1px, matching SR_ONLY_CSS in src/core/split.ts and SR_ONLY in
// src/react/index.tsx) AND clip-path'd; a normal-sized element that only
// has clip-path (e.g. a circular reveal effect ScrollVars may ship one
// day) must stay a candidate, so a panel covering it is still caught
// (ADU-102, second pass finding: the old predicate excluded every
// clip-path'd element and this sweep silently examined 0 of them).
//
// Third pass finding: pinpoint-size alone must also survive an ancestor
// transform. A genuine sr-only span nested under a transform: scale(2)
// ancestor (sv-tilt and sv-deck both transform their content) paints at
// 2px by 2px, so a getBoundingClientRect-based size check reads it as
// "not pinpoint" and lets it through as a false occlusion candidate even
// though nothing covers it. offsetWidth/offsetHeight read the layout box
// instead, which an ancestor transform never changes ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/bench/harness/fixtures/pin-stage-clip-path-occlusion.html`, { waitUntil: 'load' })
  await page.addStyleTag({ content: STYLES_CSS })
  const { bad, examined } = await page.evaluate(OCCLUDED_TEXT)
  check(
    'occlusion sweep: a clip-path masked but normal-sized element is examined and reported when a panel covers it',
    examined > 0 && bad.length > 0,
    `examined=${examined} bad=${bad.join(',')}`
  )
  check(
    'occlusion sweep: a genuine sr-only span under a transform: scale(2) ancestor is excluded (not examined, no false occlusion)',
    examined === 1 && !bad.includes('genuine-sr-only'),
    `examined=${examined} bad=${bad.join(',')}`
  )
  await page.close()
}

// ── 9c. trackPointer() on a container that matches its own selector still
// writes --mx/--my on a move over a child (ADU-152, live regression). This
// is exactly the gallery's flagship hero: usePointer/trackPointer wired
// with `{ selector: '.sv-hero' }` on the '.sv-hero' section itself. Round
// 5's ancestor fix (ADU-141) added `match !== container`, which rejected
// this self case too and dropped every pointermove; the day that shipped,
// this invariant would have failed ──
{
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><html><head><style>${STYLES_CSS}</style></head>
    <body>
      <section class="sv-hero" id="hero" style="position:relative;width:300px;height:200px">
        <div class="hero-orb" style="width:20px;height:20px"></div>
      </section>
    </body></html>`)
  await page.addScriptTag({ content: SV_IIFE_JS })
  const r = await page.evaluate(async () => {
    const hero = document.querySelector('.sv-hero')
    SV.trackPointer(hero, { selector: '.sv-hero' })
    const rect = hero.getBoundingClientRect()
    const orb = document.querySelector('.hero-orb')
    orb.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: rect.left + rect.width * 0.75,
        clientY: rect.top + rect.height * 0.25,
      })
    )
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    return {
      mx: hero.style.getPropertyValue('--mx'),
      my: hero.style.getPropertyValue('--my'),
    }
  })
  check(
    'pointer: a container that matches its own selector (the hero fixture) writes --mx on a move over a child',
    r.mx !== '',
    `--mx="${r.mx}"`
  )
  check(
    'pointer: ...and writes --my on the same move',
    r.my !== '',
    `--my="${r.my}"`
  )
  await page.close()
}

// ── 10. The isolated installation gate: every Section the CLI installs,
// rendered under React 18 and 19, on ONLY the stylesheets its registry entry
// declares. A gallery page proves nothing about a consumer who imported
// exactly what `npx scrollvars add` told them to import (ADU-129) ──
await installedGate({ browser, check, HIDDEN_TEXT })

await browser.close()
server.close()
if (failures) {
  console.error(`\n${failures} invariant(s) violated`)
  process.exit(1)
}
console.log('\nall invariants hold')
