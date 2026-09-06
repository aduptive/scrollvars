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
  const bad = []
  let examined = 0
  for (const stage of document.querySelectorAll('.sv-stage')) {
    for (const el of stage.querySelectorAll('*')) {
      if (!own(el) || el.closest('[aria-hidden="true"], script, style, template, .sv-words, .sv-curtain-l, .sv-curtain-r')) continue
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

await browser.close()
server.close()
if (failures) {
  console.error(`\n${failures} invariant(s) violated`)
  process.exit(1)
}
console.log('\nall invariants hold')
