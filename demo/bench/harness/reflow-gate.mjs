/**
 * Reflow and zoom on the site, pinned content included (ADU-246).
 *
 * WCAG 1.4.10 Reflow: at 320 CSS pixels of width the page presents its
 * content without scrolling in two dimensions. WCAG 1.4.4 Resize Text: at
 * 200 percent the content still works; a 1280 window at 200 percent is a
 * 640 CSS pixel viewport, so that is the second size. On every gallery page
 * and the home, at both sizes, after boot and after a scroll through:
 *
 *   - the document does not scroll sideways (a rail moves inside its
 *     stage, the page itself never widens);
 *   - every `[data-sv-fit]` box fits inside its stage, or its tracker has
 *     released the pin (`data-sv-flow`, the fit contract): nothing pinned
 *     is clipped.
 *
 * Then the keyboard-reach gate runs the pinned pages at 320 by 568: every
 * focus stop can still be seen there. The gate proves it can fail on
 * fixtures/reflow-red.html (a fixed-width band wider than the viewport).
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node reflow-gate.mjs
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { keyboardGate } from './keyboard-gate.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SIZES = [{ width: 320, height: 568, name: '320 (reflow)' }, { width: 640, height: 450, name: '640 (200% zoom)' }]
const PIN_PAGES = ['/fx/curtain.html', '/fx/gsap-scrub.html', '/fx/horizontal-rail.html', '/fx/sequenced-scrub.html', '/fx/sticky-steps.html', '/fx/timeline-scrub.html']

const PROBE = `() => {
  const doc = document.documentElement
  const sideways = doc.scrollWidth - innerWidth
  // the fit contract: a box taller than its stage releases the pin (the
  // tracker is marked data-sv-flow and everything returns to flow), so a
  // box that overflows a stage that STILL pins is the failure
  const clipped = [...document.querySelectorAll('.sv-stage [data-sv-fit]')].map((box) => {
    const stage = box.closest('.sv-stage')
    const tracker = stage.closest('[data-sv], .sv')
    if (tracker && tracker.hasAttribute('data-sv-flow')) return { over: 0 }
    const b = box.getBoundingClientRect(), s = stage.getBoundingClientRect()
    return { over: Math.max(0, Math.round(b.height - s.height)), box: box.className || 'data-sv-fit' }
  }).filter((r) => r.over > 1)
  return { sideways: Math.round(sideways), clipped }
}`

async function measure(page) {
  const atLoad = await page.evaluate(`(${PROBE})()`)
  await page.evaluate(() => new Promise((resolve) => {
    scrollTo(0, document.documentElement.scrollHeight)
    setTimeout(() => { scrollTo(0, Math.round(document.documentElement.scrollHeight / 2)); setTimeout(resolve, 600) }, 600)
  }))
  const scrolled = await page.evaluate(`(${PROBE})()`)
  return { sideways: Math.max(atLoad.sideways, scrolled.sideways), clipped: [...atLoad.clipped, ...scrolled.clipped] }
}

export async function reflowGate({ browser, check, base, only }) {
  const root = join(here, '..', '..')
  const pages = only ? [only] : ['/index.html', ...readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.endsWith('-preview.html')).map((f) => `/fx/${f}`)]
  for (const size of SIZES) {
    for (const path of pages) {
      const page = await browser.newPage()
      let r, detail = ''
      try {
        await page.setViewport({ width: size.width, height: size.height })
        await page.goto(`${base}${path}?harness=1`, { waitUntil: 'load', timeout: 60000 })
        await page.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })
        await page.evaluate(() => new Promise((r) => setTimeout(r, 300)))
        r = await measure(page)
        detail = `${r.sideways}px of sideways scroll` + (r.clipped.length ? `; clipped: ${r.clipped.map((c) => `${c.box} by ${c.over}px`).join(', ')}` : '')
      } catch (error) {
        r = { sideways: 9999, clipped: [] }; detail = error.message
      } finally {
        await page.close()
      }
      check(`reflow at ${size.name}: ${path}: no sideways scroll and every fitted box inside its stage`, r.sideways <= 1 && r.clipped.length === 0, detail)
    }
  }
  if (only) return
  await keyboardGate({ browser, check, base, pages: PIN_PAGES, viewport: { width: 320, height: 568 }, label: ' at 320' })
  // the gate has to be able to fail
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 320, height: 568 })
    await page.goto(`${base}/bench/harness/fixtures/reflow-red.html`, { waitUntil: 'load' })
    await page.waitForFunction(() => typeof window.SV !== 'undefined')
    const r = await measure(page)
    check('reflow gate: a fixed-width band wider than 320px is reported as sideways scroll', r.sideways >= 100, `${r.sideways}px`)
  } finally {
    await page.close()
  }
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
  await reflowGate({ browser, check, base: `http://127.0.0.1:${server.address().port}`, only: args.page })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} check(s) violated` : '\nthe site reflows')
  process.exit(failures ? 1 : 0)
}
