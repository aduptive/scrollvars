/**
 * styles/scoped.css registers --sv-t and --sv-view non-inheriting. It must not
 * change what any shipped page renders: the presets that read a clock from a
 * descendant are forwarded inside the sheet, and this proves it on the pages
 * themselves rather than by reading selectors. A page that stops animating
 * under the sheet fails here, in CI, with the element named.
 *
 * Exported as a gate for e2e-invariants.mjs.
 */
import { readFileSync } from 'node:fs'
import { snapshotRender, compareRender, rendersMoved, describeMismatch } from './render-equivalence.mjs'

const SCOPED_CSS = readFileSync(new URL('../../../styles/scoped.css', import.meta.url), 'utf8')

// stats-countup animates counters, which the snapshot does not sample, so it
// cannot prove or disprove anything here and is covered by its own invariants.
//
// Each page carries the author-side lines the sheet's contract asks of it: a
// forward for every reader of its own that is not a shipped preset, and a
// default on the tracked element where the page relied on a var() fallback.
// This list IS the documentation of what each shipped page needs, kept true
// by running it. A page whose entry is empty needs nothing beyond the sheet.
const PAGES = {
  '/index.html': '.sv :has(.card3d), .card3d, .spread-scrub > * { --sv-t: inherit; --sv-view: inherit; }',
  '/fx/hero-cinematic.html': '.sv :has(.hero-inner), .hero-inner { --sv-t: inherit; --sv-view: inherit; }',
  '/fx/timeline-scrub.html': '',
  '/fx/sticky-steps.html': '',
  '/fx/case-study-rail.html': '',
  // unread paragraphs are fully visible through var(--sv-t, 1): a registered
  // property never takes a fallback, so the default moves to the tracked element
  // the path rule names the reader's LAST compound: :has(.manifesto-copy p)
  // would skip .manifesto-copy itself, since it has no .manifesto-copy inside
  '/fx/editorial-manifesto.html': '.sv :has(p), .manifesto-copy p { --sv-t: inherit; --sv-view: inherit; } .sv-manifesto { --sv-t: 1; }',
}

async function shot(browser, base, url, css) {
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    await page.setViewport({ width: 1400, height: 900 })
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(`${base}${url}`, { waitUntil: 'load', timeout: 60000 })
    await page.waitForFunction(() => document.documentElement.classList.contains('sv-on'))
    // After load, so <head> exists: at new-document time it is null and the
    // append throws silently, which measures the plain page under the other
    // name. Registration changes inheritance the instant it lands.
    if (css) await page.evaluate(text => {
      const style = document.createElement('style')
      style.textContent = text
      document.head.append(style)
      if (![...document.styleSheets].some(sheet => sheet.ownerNode === style)) throw Error('scoped.css did not attach')
      // attached is not applied: a registered non-inheriting clock reads its
      // initial value on <html>, an unregistered one reads nothing
      if (getComputedStyle(document.documentElement).getPropertyValue('--sv-t') !== '0') throw Error('scoped.css attached but registered nothing')
    }, css)
    const shot = await snapshotRender(page)
    if (pageErrors.length) throw Error(`the page raised ${pageErrors.length} error(s), first: ${pageErrors[0]}`)
    return shot
  } finally { await context.close() }
}

export async function scopedClocksGate({ browser, check, base }) {
  for (const [url, author] of Object.entries(PAGES)) {
    let detail = ''
    let ok = false
    try {
      const plain = await shot(browser, base, url)
      if (!rendersMoved(plain)) throw Error('the page did not animate between scroll positions, so this proves nothing')
      const scoped = await shot(browser, base, url, SCOPED_CSS + (author ? `\n${author}` : ''))
      const result = compareRender(plain, scoped)
      ok = result.ok
      if (!ok) detail = describeMismatch('scoped.css', result)
    } catch (error) {
      detail = error.message
    }
    check(`scoped clocks: ${url} renders the same with styles/scoped.css${author ? ' and its author lines' : ''}`, ok, detail)
  }
}
