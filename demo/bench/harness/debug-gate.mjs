/**
 * scrollvars/debug on a real gallery page: the HUD reports a number, the
 * markers layer draws at least one line per tracked element, the perf lint
 * runs without throwing, and nothing throws on the page at all (PR
 * feature/debug-tools). Bundled with esbuild the same way the canvas module
 * is bundled for this harness (dist/debug/index.ts imports hud.ts and
 * overlay.ts, so a plain `export`-stripping classic-script trick would not
 * work here).
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node debug-gate.mjs
 */
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

export async function debugGate({ browser, check, base }) {
  const DEBUG_JS =
    execSync(
      `npx esbuild ${join(root, '..', 'dist', 'debug', 'index.js')} --bundle --format=iife --global-name=SVDebug`,
      { cwd: join(root, '..'), maxBuffer: 1e7 }
    ).toString() + '\nwindow.debug = SVDebug.debug;\n'

  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  await page.goto(`${base}/fx/staggered-reveal.html`, { waitUntil: 'load' })
  await page.addScriptTag({ content: DEBUG_JS })

  const result = await page.evaluate(async () => {
    const stop = window.debug({ markers: true, hud: true, lint: true })
    // the HUD updates on a 500ms cadence; poll for it instead of a fixed wait
    const deadline = Date.now() + 3000
    let hudText = ''
    while (Date.now() < deadline) {
      const panels = [...document.querySelectorAll('div')].filter((d) => d.textContent.includes('ScrollVars perf'))
      const hud = panels.find((d) => !d.textContent.includes('lint'))
      hudText = hud ? hud.textContent : ''
      if (/fps/.test(hudText)) break
      await new Promise((r) => requestAnimationFrame(r))
    }
    const markerLines = document.querySelectorAll('body > div[aria-hidden="true"] > div[style*="border-top"]').length
    const trackedCount = document.querySelectorAll('.sv').length
    stop()
    const survivedStop = {
      hudGone: [...document.querySelectorAll('div')].every((d) => !d.textContent.startsWith('ScrollVars perf')),
      markersGone: document.querySelectorAll('body > div[aria-hidden="true"] > div[style*="border-top"]').length === 0,
    }
    return { hudText, markerLines, trackedCount, ...survivedStop }
  })

  check('debug(): the HUD reports an fps reading', /fps/.test(result.hudText), result.hudText)
  check('debug(): markers() draws at least one line per tracked element', result.markerLines >= result.trackedCount && result.trackedCount > 0,
    `${result.markerLines} lines for ${result.trackedCount} tracked elements`)
  check('debug(): stop() removes the HUD', result.hudGone)
  check('debug(): stop() removes the markers layer', result.markersGone)
  check('debug(): importing and running debug() throws nothing', pageErrors.length === 0, pageErrors.join(' | '))

  await page.close()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const puppeteer = (await import('puppeteer-core')).default
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { extname } = await import('node:path')
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
  const server = createServer((req, res) => {
    try {
      const url = req.url.split('?')[0].replace(/\/$/, '/index.html')
      res.setHeader('content-type', MIME[extname(url)] || 'application/octet-stream')
      res.end(readFileSync(join(root, url)))
    } catch {
      res.statusCode = 404
      res.end()
    }
  })
  await new Promise((r) => server.listen(0, r))
  const base = `http://127.0.0.1:${server.address().port}`
  const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  let failures = 0
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'ok ' : 'FAIL'} ${name}${ok ? '' : ': ' + detail}`)
    if (!ok) failures++
  }
  await debugGate({ browser, check, base })
  await browser.close()
  server.close()
  process.exit(failures ? 1 : 0)
}
