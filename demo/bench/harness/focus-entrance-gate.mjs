/**
 * Focus visibility on an entrance preset (WCAG 2.4.7, Astra B1).
 *
 * The entrance presets (`sv-auto` etc.) hide a child until its tracker goes
 * live, then reveal it after `--sv-order * --sv-stagger` plus a transition.
 * A keyboard user who tabs (or is programmatically focused) into a hidden
 * child must see it AT ONCE, not after up to 1.7s of delay and transition:
 * `styles/core.css`'s `:focus-within` override (placed after the entrance
 * rules) must make the focused item (or its container) opacity 1, no
 * translate, no transition, within one sampled animation frame of focus.
 *
 * Two scenarios from Astra's measurement: the persistent case (the first
 * link, focused with a small scroll, section never went live) and the
 * stagger case (the 11th child, `--sv-order: 10`, the longest delay).
 * Both are checked with and without reduced motion.
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node focus-entrance-gate.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const FIXTURE = '/bench/harness/fixtures/focus-entrance.html'

// evaluated in the page: focus the target, wait one rAF, read the computed style
const FOCUS_AND_READ = `(selector) => new Promise((resolve) => {
  const el = document.querySelector(selector)
  el.focus()
  requestAnimationFrame(() => {
    const cs = getComputedStyle(el)
    resolve({ opacity: cs.opacity, translate: cs.translate })
  })
})`

// N3: the split() word spans are the ones the entrance actually hides
// (aria-hidden, --sv-order). :focus-within never matches a span (it never
// holds focus, only its aria-hidden text does not either): the selector has
// to key off the CONTAINER's :focus-within to reveal its children.
const FOCUS_AND_READ_SPANS = `(selector) => new Promise((resolve) => {
  const el = document.querySelector(selector)
  el.focus()
  requestAnimationFrame(() => {
    const spans = [...el.querySelectorAll('span[aria-hidden]')]
    resolve(spans.map((s) => getComputedStyle(s).opacity))
  })
})`

export async function focusEntranceGate({ browser, check, base }) {
  for (const reduce of [false, true]) {
    const label = reduce ? ' (reduced motion)' : ''
    const page = await browser.newPage()
    if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    try {
      await page.goto(`${base}${FIXTURE}`, { waitUntil: 'load' })
      await page.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })
      // Under normal motion, going hidden is itself a transition off the
      // fail-visible first paint (up to stagger*order + duration, 1700ms for
      // the 11th child): wait for the settled hidden state before focusing,
      // or the "went to 1" read could be a leftover mid-transition value
      // rather than proof the focus override fired.
      if (!reduce) {
        await page.waitForFunction(() => getComputedStyle(document.getElementById('child11')).opacity === '0', { timeout: 2500 })
        await page.waitForFunction(() => getComputedStyle(document.getElementById('self-tracked')).opacity === '0', { timeout: 2500 })
        // A4 (loop8-5 verifier finding 2): without this, a missing
        // self-tracked sv-split-rise selector never hides the spans at all
        // (fail-visible, opacity 1 from the start), so the post-focus check
        // below stays green whether or not the entrance rule exists. Assert
        // the pre-focus HIDDEN state first, polled with a deadline (ADU-219),
        // exactly like the plain #self-tracked element above.
        const hiddenSplit = await page.waitForFunction(() => {
          const spans = [...document.getElementById('self-tracked-split').querySelectorAll('span[aria-hidden]')]
          return spans.length > 0 && spans.every((s) => getComputedStyle(s).opacity === '0') ? spans.length : false
        }, { timeout: 2500 }).then((h) => h.jsonValue()).catch(() => false)
        check('focus-entrance: a self-tracked sv-split-rise heading is hidden below the fold before it goes live (A4)',
          hiddenSplit > 0, JSON.stringify({ hiddenSplit }))
      } else {
        // A1/A4 (loop8-5): under reduce a self-tracked entrance (rise or
        // split-rise) must be at rest from the first frame, unfocused: it
        // never went through the hidden fail-visible state at all.
        const rest = await page.evaluate(() => {
          const el = document.getElementById('self-tracked')
          const cs = getComputedStyle(el)
          const spans = [...document.getElementById('self-tracked-split').querySelectorAll('span[aria-hidden]')].map((s) => getComputedStyle(s).opacity)
          return { opacity: cs.opacity, translate: cs.translate, transition: cs.transitionDuration, spans }
        })
        check(`focus-entrance${label}: a self-tracked sv-rise element is at rest (unfocused, below the fold)`,
          rest.opacity === '1' && rest.translate === 'none' && rest.transition === '0s', JSON.stringify(rest))
        check(`focus-entrance${label}: a self-tracked sv-split-rise heading's spans are at rest (unfocused, below the fold, A4)`,
          rest.spans.length > 0 && rest.spans.every((o) => o === '1'), JSON.stringify(rest.spans))
      }

      const persistent = await page.evaluate(`(${FOCUS_AND_READ})('.links a:first-child')`)
      check(`focus-entrance${label}: the persistent case (first link, section not live) is opacity 1 within one frame of focus`,
        persistent.opacity === '1', JSON.stringify(persistent))

      const stagger = await page.evaluate(`(${FOCUS_AND_READ})('#child11')`)
      check(`focus-entrance${label}: the stagger case (11th child, --sv-order: 10) is opacity 1 within one frame of focus`,
        stagger.opacity === '1', JSON.stringify(stagger))

      const splitSpans = await page.evaluate(`(${FOCUS_AND_READ_SPANS})('#split-heading')`)
      check(`focus-entrance${label}: a focused split heading reveals every word span at once (N3)`,
        splitSpans.length > 0 && splitSpans.every((o) => o === '1'), JSON.stringify(splitSpans))

      // PR #107 review: the entrance rules require the preset to be a
      // DESCENDANT of .sv/[data-sv]. A self-tracked element (the tracked
      // element IS the preset, e.g. `<pre class="sv sv-rise" tabindex="0">`)
      // never matched and could be focused mid-fade.
      const selfTracked = await page.evaluate(`(${FOCUS_AND_READ})('#self-tracked')`)
      check(`focus-entrance${label}: a self-tracked entrance element (tracked element IS the preset) is opacity 1 within one frame of focus`,
        selfTracked.opacity === '1', JSON.stringify(selfTracked))

      // A4: a self-tracked sv-split-rise heading (the tracked element IS the
      // split preset, no separate ancestor) must animate at all, and its
      // spans must reveal at once when focused.
      const selfTrackedSplit = await page.evaluate(`(${FOCUS_AND_READ_SPANS})('#self-tracked-split')`)
      check(`focus-entrance${label}: a self-tracked sv-split-rise heading reveals every word span at once (A4)`,
        selfTrackedSplit.length > 0 && selfTrackedSplit.every((o) => o === '1'), JSON.stringify(selfTrackedSplit))
    } finally {
      await page.close()
    }
  }

  // The page's own switch (html[data-sv-motion="reduce"]), not just the OS
  // media query: A1's fix touches both twins, so both need proof.
  const attrPage = await browser.newPage()
  try {
    await attrPage.goto(`${base}${FIXTURE}`, { waitUntil: 'load' })
    await attrPage.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })
    await attrPage.waitForFunction(() => getComputedStyle(document.getElementById('self-tracked')).opacity === '0', { timeout: 2500 })
    const rest = await attrPage.evaluate(() => new Promise((resolve) => {
      SV.setMotion('reduce')
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = document.getElementById('self-tracked')
        const cs = getComputedStyle(el)
        const spans = [...document.getElementById('self-tracked-split').querySelectorAll('span[aria-hidden]')].map((s) => getComputedStyle(s).opacity)
        resolve({ opacity: cs.opacity, translate: cs.translate, transition: cs.transitionDuration, spans })
      }))
    }))
    check('focus-entrance (data-sv-motion="reduce"): a self-tracked sv-rise element is at rest',
      rest.opacity === '1' && rest.translate === 'none' && rest.transition === '0s', JSON.stringify(rest))
    check('focus-entrance (data-sv-motion="reduce"): a self-tracked sv-split-rise heading\'s spans are at rest (A4)',
      rest.spans.length > 0 && rest.spans.every((o) => o === '1'), JSON.stringify(rest.spans))
  } catch (error) {
    check('focus-entrance (data-sv-motion="reduce"): the checks ran to the end', false, error.message)
  } finally {
    await attrPage.close()
  }
}

// Standalone: serve demo/ and run the gate.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { extname } = await import('node:path')
  const puppeteer = (await import('puppeteer-core')).default
  const root = join(here, '..', '..')
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
  await focusEntranceGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} check(s) violated` : '\nfocused entrance content is visible at once')
  process.exit(failures ? 1 : 0)
}
