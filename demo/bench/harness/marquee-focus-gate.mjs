/**
 * A focused marquee item stays inside the visible strip (WCAG 2.4.7/2.4.11,
 * loop8-6 triage B1a).
 *
 * The track holds two copies and slides the whole strip; focus alone only
 * pauses the translation (`:focus-within { animation-play-state: paused }`),
 * so a focused item mid-loop can sit translated well outside the wrapper's
 * clipped box, with no way to scroll it back (content left of a scroll
 * container's origin is unreachable overflow). `styles/ui.css`'s
 * `.sv-marquee-track:focus-within` override must present the track
 * statically and wrapped instead, and only while the TRACK holds focus: the
 * controlled marquee's pause button sits outside the track, and focusing it
 * must not reflow the strip.
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node marquee-focus-gate.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const FIXTURE = '/bench/harness/fixtures/marquee-focus.html'

export async function marqueeFocusGate({ browser, check, base }) {
  const page = await browser.newPage()
  try {
    await page.goto(`${base}${FIXTURE}`, { waitUntil: 'load' })
    await page.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })

    // Deterministic loop position, no timing flake: park both tracks at 80%
    // of their loop (translate -40%, well inside Astra's measured range).
    await page.evaluate(() => {
      for (const id of ['track1', 'track2']) {
        const anim = document.getElementById(id).getAnimations()[0]
        anim.pause()
        anim.currentTime = anim.effect.getTiming().duration * 0.8
      }
    })

    await page.evaluate(() => document.body.focus())
    for (const id of ['m0', 'm1']) {
      await page.keyboard.press('Tab')
      const state = await page.evaluate((expected) => {
        const el = document.activeElement
        const r = el.getBoundingClientRect()
        const wrap = document.getElementById('marq1').getBoundingClientRect()
        return { id: el.id, expected, left: r.left, right: r.right, wrapLeft: wrap.left, wrapRight: wrap.right }
      }, id)
      check(`marquee: the focused item (${id}) near -40% loop position lands inside the strip (B1a)`,
        state.id === state.expected && state.left >= state.wrapLeft && state.right <= state.wrapRight,
        JSON.stringify(state))
    }

    const before = await page.evaluate(() => document.getElementById('track2').getBoundingClientRect().width)
    await page.evaluate(() => document.getElementById('pause2').focus())
    const after = await page.evaluate(() => document.getElementById('track2').getBoundingClientRect().width)
    check('marquee: focusing the pause button does not reflow the strip',
      before === after, JSON.stringify({ before, after }))
  } finally {
    await page.close()
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
  await marqueeFocusGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} check(s) violated` : '\nfocused marquee content stays inside the strip')
  process.exit(failures ? 1 : 0)
}
