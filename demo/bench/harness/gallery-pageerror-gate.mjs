/**
 * Every shipped fx gallery page, loaded and scrolled through once, must
 * never throw a pageerror. cube-windows destructured `SV` at the TOP of its
 * inline preview script, before `sv.js` (the engine bundle defining `SV`)
 * had loaded: `SV is not defined`, and the `load` listener registered right
 * below it never even ran, so the effect silently never mounted (round 16
 * item 4). No unit test catches this: it needs a real script execution
 * order in a real page, which is what this sweep is for, on every page in
 * the gallery, not only the one that broke.
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node gallery-pageerror-gate.mjs
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export async function galleryPageerrorGate({ browser, check, base }) {
  const root = join(here, '..', '..')
  const pages = readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const page = await browser.newPage()
  const bad = []
  for (const f of pages) {
    const errors = []
    const onError = (error) => errors.push(error.message)
    page.on('pageerror', onError)
    try {
      await page.goto(`${base}/fx/${f}`, { waitUntil: 'load' })
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      await new Promise((r) => setTimeout(r, 300))
      await page.evaluate(() => scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 300))
    } finally {
      page.off('pageerror', onError)
    }
    if (errors.length > 0) bad.push(`${f}: ${errors.join('; ')}`)
  }
  await page.close()
  check(`gallery: ${pages.length} fx pages load and scroll through with no pageerror`, bad.length === 0, bad.join(' | '))
}

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
  await galleryPageerrorGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} page(s) violated` : '\nno pageerror on any fx page')
  process.exit(failures ? 1 : 0)
}
