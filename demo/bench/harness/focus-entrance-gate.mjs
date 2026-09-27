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
      }

      const persistent = await page.evaluate(`(${FOCUS_AND_READ})('.links a:first-child')`)
      check(`focus-entrance${label}: the persistent case (first link, section not live) is opacity 1 within one frame of focus`,
        persistent.opacity === '1', JSON.stringify(persistent))

      const stagger = await page.evaluate(`(${FOCUS_AND_READ})('#child11')`)
      check(`focus-entrance${label}: the stagger case (11th child, --sv-order: 10) is opacity 1 within one frame of focus`,
        stagger.opacity === '1', JSON.stringify(stagger))
    } finally {
      await page.close()
    }
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
