/**
 * The page's own motion switch, and the slider's dot targets, in a browser.
 *
 * `prefers-reduced-motion` is an OS setting many people never find. Every
 * reduced-motion block in the shipped sheets has a twin under
 * `html[data-sv-motion="reduce"]` (a unit test keeps them in step), and
 * core/motion.ts feeds the same preference to the driver, the slider, the
 * canvas harness and the React Slider. A unit test proves the text; this
 * proves the rendering: the switch flips the entrance to its final state,
 * stops the marquee and the dot transition, and follows the OS again on
 * 'auto'. The dots are measured for WCAG 2.5.8 (24 by 24 CSS pixels).
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node motion-gate.mjs
 */
const FIXTURE = '/bench/harness/fixtures/motion.html'

export async function motionGate({ browser, check, base }) {
  const page = await browser.newPage()
  try {
    await page.goto(`${base}${FIXTURE}`, { waitUntil: 'load' })
    await page.waitForFunction(() => typeof window.SV !== 'undefined')
    // the hidden entrance state comes from the driver's first frame, not from
    // the class: wait for the state with a deadline, never for a frame count
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.probe')).opacity === '0', { timeout: 1500 })
    const before = await page.evaluate(() => ({
      pref: SV.prefersReducedMotion(),
      marquee: getComputedStyle(document.querySelector('.sv-marquee-track')).animationName,
    }))
    check('motion: before the switch the driver reads no preference and the marquee runs', before.pref === false && before.marquee !== 'none', JSON.stringify(before))

    const after = await page.evaluate(() => new Promise((resolve) => {
      SV.setMotion('reduce')
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const probe = getComputedStyle(document.querySelector('.probe'))
        resolve({
          attr: document.documentElement.getAttribute('data-sv-motion'),
          pref: SV.prefersReducedMotion(),
          opacity: probe.opacity,
          translate: probe.translate,
          marquee: getComputedStyle(document.querySelector('.sv-marquee-track')).animationName,
          dotTransition: getComputedStyle(document.querySelector('.sv-dot'), '::before').transitionProperty,
        })
      }))
    }))
    check('motion: setMotion("reduce") sets the attribute and the driver reads it', after.attr === 'reduce' && after.pref === true, JSON.stringify(after))
    check('motion: under the switch the entrance renders its final state, no OS setting involved', after.opacity === '1' && after.translate === 'none', `opacity=${after.opacity} translate=${after.translate}`)
    check('motion: under the switch the marquee stands still', after.marquee === 'none', `animationName=${after.marquee}`)
    check('motion: under the switch the dots stop transitioning', after.dotTransition === 'none', `transition-property=${after.dotTransition}`)

    const back = await page.evaluate(() => {
      SV.setMotion('auto')
      return { attr: document.documentElement.getAttribute('data-sv-motion'), pref: SV.prefersReducedMotion() }
    })
    check('motion: setMotion("auto") follows the OS again', back.attr === null && back.pref === false, JSON.stringify(back))

    const dots = await page.evaluate(() => [...document.querySelectorAll('.sv-dot')].map((d) => { const r = d.getBoundingClientRect(); return [r.width, r.height] }))
    check('dots: every slider dot is at least a 24 by 24 CSS pixel target (WCAG 2.5.8)', dots.length >= 3 && dots.every(([w, h]) => w >= 24 && h >= 24), JSON.stringify(dots))
    const visual = await page.evaluate(() => { const r = getComputedStyle(document.querySelector('.sv-dot'), '::before'); return [r.width, r.height] })
    check('dots: the visual dot keeps --sv-dot-size inside the target', visual[0] === '8px' && visual[1] === '8px', JSON.stringify(visual))
  } catch (error) {
    check('motion gate ran to the end', false, error.message)
  } finally {
    await page.close()
  }
}

// Standalone: serve demo/ and run the same gate.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { dirname, join, extname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const puppeteer = (await import('puppeteer-core')).default
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
  const server = createServer((req, res) => {
    const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
    try { res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path)) }
    catch { res.statusCode = 404; res.end('nope') }
  })
  await new Promise((r) => server.listen(0, r))
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  let failures = 0
  const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ': ' + detail}`); if (!ok) failures++ }
  await motionGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} violated` : '\nall motion invariants hold')
  process.exit(failures ? 1 : 0)
}
