#!/usr/bin/env node
/**
 * The progressive-enhancement invariants, as tests — the architectural
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
 *      harness itself just wrote) for one that moved
 *   9. The pin-stage occlusion sweep is not blind to clip-path: a real
 *      sr-only span is pinpoint-sized (1px by 1px) AND clip-path'd, so a
 *      normal-sized element that only has clip-path (a decorative reveal
 *      mask) is still a candidate, and gets reported if a panel covers it
 *      (ADU-102, second pass finding)
 *
 * Runs against the fx pages (the shipped presets, the shipped engine).
 *   node e2e-invariants.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const STYLES_CSS = readFileSync(join(root, '..', 'styles.css'), 'utf8')
// The built canvas module has no imports of its own: safe to inject as a
// classic (non-module) script that assigns its one export to `window`.
const CANVAS_JS = readFileSync(join(root, '..', 'dist', 'canvas', 'index.js'), 'utf8').replace(
  'export function mountEffect',
  'window.mountEffect = function mountEffect'
)
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
  console.log(`${ok ? 'ok ' : 'FAIL'} ${name}${ok ? '' : ' — ' + detail}`)
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
// feedback loop (ADU-107). First through seventh pass, each one a verifier
// or panel finding reproduced in real Chrome, are in CHANGELOG.md's Canvas
// section: a border-box-rect-vs-content-box-attribute equality guard that
// both missed a bordered unsized canvas and mispinned a legitimately
// CSS-sized one; a padding-inflated read; a fractional-padding rounding
// residual; a fallback re-measure that disagreed with a bit-exact
// ResizeObserverEntry for reasons that had nothing to do with feedback
// (fractional padding, a transform); a flat 1px tolerance that took dozens
// of passes to notice a small canvas's small move; and a value- and
// timing-based "echo window" (matching a later ResizeObserverEntry's
// contentRect against the exact W/H just written) that could not tell a
// coincidental real resize landing on that same number apart from its own
// echo (the eighth pass's regression, see 8f below).
//
// Eighth pass (final design change): every earlier pass tried to catch the
// loop by MEASURING, comparing two numbers (or a number against a
// deadline). applySize() now asks the browser directly instead: right
// after writing the backing store, it bumps `canvas.width`/`height` up by
// one and reads `canvas.clientWidth`/`clientHeight` (a forced layout), then
// puts the attribute back and reads again. An axis with no CSS size of its
// own has its layout size driven directly by that attribute, so the two
// readings differ by exactly 1; an axis with a real CSS size never
// responds to the attribute at all, so they are identical. This is causal,
// not a value comparison: the probe supplies its own known cause (the
// bump) and reads only the response that can follow from THAT write, so a
// real resize landing on any size, at any time, including the exact size
// the harness itself just wrote, produces no response and is never
// mistaken for anything. See the module doc in src/canvas/index.ts for the
// full reasoning. A settle takes no extra ResizeObserver round trip at all,
// measured against real Chrome: the pin runs synchronously inside the same
// callback that delivered the entry, before the browser ever gets a chance
// to render the intermediate (unpinned) box the backing-store write alone
// would have produced, so from the ResizeObserver's own perspective the
// canvas's box started this callback at its intrinsic size and ends it at
// that same pinned size, no observable change, no further entry. `log.length`
// below is 1 for a case that settles, the consumer sees the correct size
// exactly once, never an inflated one and never a second confirmation. ──
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
    'canvas: the pinned CSS size is the content box (border excluded), not the inflated border-box rect',
    border.style.includes('width: 300px') && border.style.includes('height: 150px'),
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
    'canvas: the pinned CSS size is the intrinsic content box (300x150), not the padding-inflated 320x170',
    padded.style.includes('width: 300px') && padded.style.includes('height: 150px'),
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
    'canvas: that pin lands on the intrinsic content box even under the author\'s own box-sizing:border-box',
    borderBox.style.includes('width: 300px') &&
      borderBox.style.includes('height: 150px') &&
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
    'canvas: the pinned CSS size is the exact intrinsic content box (300x150), not a subpixel-rounded 300.4x150.4',
    fractional.style.includes('width: 300px') && fractional.style.includes('height: 150px'),
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
    'canvas: that pin is the true content box (300x150), not a transform/padding-dampened inflated size',
    paddedScaled.style.includes('width: 300px') && paddedScaled.style.includes('height: 150px'),
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
    'canvas: that pin lands on the intrinsic 4x4 content box',
    tiny.style.includes('width: 4px') && tiny.style.includes('height: 4px'),
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
    'canvas: that pin lands on the intrinsic 20x20 content box',
    tiny20.style.includes('width: 20px') && tiny20.style.includes('height: 20px'),
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
      // The causal probe perturbs the CURRENT attribute value by one and
      // reads how layout responds: that response is independent of whether
      // the backing-store write this pass happened to change the numeric
      // value at all (a coincidence at some size/DPR pairs, e.g. a 4x4
      // canvas at ~1.05 rounding back to 4), so every genuinely unsized
      // canvas gets pinned here regardless. And the pin runs synchronously
      // inside the very callback that delivered the entry, before the
      // browser ever renders the unpinned intermediate box, so there is
      // never a second, confirming entry either: log.length is 1 always.
      check(
        `canvas: #${id} settles at its intrinsic ${w}x${h} at deviceScaleFactor ${dpr} (actual dpr ${result.dpr}), backing store ${bw}x${bh}`,
        r.log.length === 1 &&
          r.width === bw &&
          r.height === bh &&
          r.style.includes(`width: ${w}px`) &&
          r.style.includes(`height: ${h}px`),
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

await browser.close()
server.close()
if (failures) {
  console.error(`\n${failures} invariant(s) violated`)
  process.exit(1)
}
console.log('\nall invariants hold')
