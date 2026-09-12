/**
 * Keyboard reach of content the scroll position reveals (ADU-245).
 *
 * An entrance preset hides its content until the tracked section goes live,
 * and a pinned scene shows one step at a time: a keyboard user tabbing into
 * a link inside either can land on an element that has focus and no pixels.
 * This tabs through every gallery page and the home page and, at every
 * stop, requires the focused element to become visible within 1200ms and to
 * stay visible 400ms later: inside the viewport, effective opacity at least
 * 0.5 down the ancestor chain, `visibility: visible`, and not covered at its
 * center (elementFromPoint, so a sticky header or a pin stage on top counts
 * as covering). A bounding box inside the viewport for one frame is not
 * visibility (review, ADU-243).
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node keyboard-gate.mjs                # every page
 *   node keyboard-gate.mjs --page=/fx/sticky-steps.html
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const MAX_STOPS = 120

// evaluated in the page after every Tab: where focus is, and whether it can be seen
const STATE = `() => {
  const describe = (el) => el.tagName.toLowerCase()
    + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : '')
    + (el.textContent && el.textContent.trim() ? ' "' + el.textContent.trim().slice(0, 30) + '"' : '')
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return { end: true }
  // an inline link that wraps across lines has a union box whose center can
  // fall in the gap between its two line fragments, where elementFromPoint
  // finds the paragraph: probe the first fragment, which is always painted
  const r = el.getClientRects()[0] || el.getBoundingClientRect()
  // the part of that fragment inside the viewport: a code block taller than
  // the viewport is visible by its lower half, and its geometric center is
  // off screen, so the probe goes to the center of what can be seen
  const vis = { left: Math.max(r.left, 0), top: Math.max(r.top, 0), right: Math.min(r.right, innerWidth), bottom: Math.min(r.bottom, innerHeight) }
  const inView = r.width > 0 && r.height > 0 && vis.right > vis.left && vis.bottom > vis.top
  let opacity = 1
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) opacity *= parseFloat(getComputedStyle(n).opacity)
  const cx = Math.min((vis.left + vis.right) / 2, innerWidth - 1)
  const cy = Math.min((vis.top + vis.bottom) / 2, innerHeight - 1)
  const hit = inView ? document.elementFromPoint(cx, cy) : null
  const covered = inView && !(hit && (hit === el || el.contains(hit)))
  const visible = inView && opacity >= 0.5 && getComputedStyle(el).visibility === 'visible' && !covered
  return { end: false, name: describe(el), visible, inView, opacity: +opacity.toFixed(2), covered, hit: hit ? describe(hit) : null, y: Math.round(scrollY) }
}`

async function sweep(page, backward = false) {
  const stops = [], violations = []
  const seen = new Set()
  for (let i = 0; i < MAX_STOPS; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift') }
    else await page.keyboard.press('Tab')
    let state = await page.evaluate(`(${STATE})()`)
    if (state.end) break
    if (seen.has(state.name + '@' + i)) break
    // the reveal needs the driver's next frame and the entrance a moment; poll
    const deadline = Date.now() + 1200
    while (!state.visible && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50))
      state = await page.evaluate(`(${STATE})()`)
      if (state.end) break
    }
    if (state.end) break
    const key = state.name
    if (seen.has(key) && i > 0 && stops.length > 2 && stops[0] === key) break // focus cycled back to the first stop
    seen.add(key)
    stops.push(key)
    if (process.env.KEYBOARD_VERBOSE) console.log(`   ${backward ? '<' : '>'} ${key}  visible=${state.visible} inView=${state.inView} opacity=${state.opacity} covered=${state.covered} y=${state.y}`)
    if (!state.visible) { violations.push(`${backward ? 'shift+tab' : 'tab'} ${key}: inView=${state.inView} opacity=${state.opacity} covered=${state.covered}${state.hit ? ' by ' + state.hit : ''} at y=${state.y}`); continue }
    // persistence: still visible after the entrance and the scroll settle
    // (forward only: the way back revisits the same stops, and this wait is
    // most of the gate's running time)
    if (backward) continue
    await new Promise((r) => setTimeout(r, 250))
    const later = await page.evaluate(`(${STATE})()`)
    if (!later.end && later.name === key && !later.visible) violations.push(`${key}: visible at first, then not: opacity=${later.opacity} covered=${later.covered}${later.hit ? ' by ' + later.hit : ''}`)
  }
  return { stops, violations }
}

// `pages` narrows the sweep, `viewport` sets one (the reflow gate runs the
// pin pages at 320 by 568), `label` keeps the check names apart per viewport
export async function keyboardGate({ browser, check, base, only, pages: subset, viewport, label = '' }) {
  const root = join(here, '..', '..')
  // the -preview pages are the static no-driver renders the gallery embeds: nothing reveals there
  const pages = only ? [only] : subset ?? ['/index.html', ...readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.endsWith('-preview.html')).map((f) => `/fx/${f}`)]
  for (const path of pages) {
    const page = await browser.newPage()
    if (viewport) await page.setViewport(viewport)
    let result, detail = ''
    try {
      await page.goto(`${base}${path}?harness=1`, { waitUntil: 'load', timeout: 60000 })
      // sv-on arrives with the first track(); a page with only a marquee or a
      // pointer effect never tracks, so wait for the engine itself
      await page.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })
      await page.evaluate(() => new Promise((r) => setTimeout(r, 200)))
      const forward = await sweep(page)
      // focus is past the last stop now: walk back, every element enters at
      // the top edge this time, which is where a sticky header covers it
      const back = await sweep(page, true)
      result = { stops: forward.stops, back: back.stops, violations: [...forward.violations, ...back.violations] }
      detail = result.violations.join('\n      ')
    } catch (error) {
      result = { stops: [], violations: [error.message] }
      detail = error.message
    } finally {
      await page.close()
    }
    check(`keyboard${label}: ${path}: every focus stop can be seen, tabbing forward and back (${result.stops.length} stops)`, result.stops.length > 0 && result.violations.length === 0, detail || 'no focus stop at all')
  }
  if (only || subset) return
  // The gate has to be able to fail: a link that lands under a sticky header
  // on the way back, and one inside a box that never leaves opacity 0. And
  // the checklist's answer to the first, scroll-padding-top, has to clear it.
  const RED = '/bench/harness/fixtures/keyboard-red.html'
  const run = async (query) => {
    const page = await browser.newPage()
    try {
      await page.goto(`${base}${RED}?${query}`, { waitUntil: 'load' })
      await page.waitForFunction(() => typeof window.SV !== 'undefined')
      const forward = await sweep(page)
      const back = await sweep(page, true)
      return [...forward.violations, ...back.violations]
    } finally { await page.close() }
  }
  const header = await run('header=1')
  check('keyboard gate: a link scrolled under a sticky header on the way back is reported as covered', header.some((v) => v.includes('covered=true') && v.includes('"under the header"')), header.join(' | ') || 'no violation reported')
  const fixed = await run('header=1&fix=1')
  check('keyboard gate: scroll-padding-top on html, the checklist answer, clears the sticky header case', fixed.length === 0, fixed.join(' | '))
  const ghost = await run('ghost=1')
  check('keyboard gate: a link inside a box that stays at opacity 0 is reported', ghost.some((v) => v.includes('opacity=0')), ghost.join(' | ') || 'no violation reported')
}

// Standalone: serve demo/ and run the same gate.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { extname } = await import('node:path')
  const puppeteer = (await import('puppeteer-core')).default
  const args = Object.fromEntries(process.argv.slice(2).map((a) => { const eq = a.indexOf('='); return eq < 0 ? [a.slice(2), true] : [a.slice(2, eq), a.slice(eq + 1)] }))
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
  await keyboardGate({ browser, check, base: `http://127.0.0.1:${server.address().port}`, only: args.page })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} page(s) violated` : '\nevery focus stop can be seen')
  process.exit(failures ? 1 : 0)
}
