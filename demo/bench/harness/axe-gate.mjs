/**
 * axe-core on every gallery page and the home page (ADU-247).
 *
 * Zero WCAG 2.x A and AA violations, in the page's own state after boot and
 * again with the page scrolled to its end, so what an entrance reveals is
 * checked as well. axe is a floor, not proof: it sees what a rule can see
 * (names, roles, contrast, structure), never whether the experience makes
 * sense to a screen reader user; that pass is a person's. The gate proves it
 * can fail on fixtures/axe-red.html (an image without alt, a button without
 * a name).
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node axe-gate.mjs                     # every page
 *   node axe-gate.mjs --page=/fx/marquee.html
 */
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// a contrast node carries the colors and the ratio axe measured: the
// difference between text dimmed by design and a palette that fails
const node = (n) => n.target.join(' ') + (n.data && n.data.contrastRatio !== undefined ? ` (${n.data.fgColor} on ${n.data.bgColor}, ${n.data.contrastRatio}:1 of ${n.data.expectedContrastRatio})` : '')
const describe = (violations) => violations.map((v) =>
  `${v.id} [${v.impact}] ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'}): ${v.nodes.slice(0, 4).map(node).join(' | ')}`
).join('\n      ')

// Wait for every finite animation and transition to finish (a marquee loops
// forever and is not waited for): text mid-fade reads as low contrast, and
// the home's CSS timeline demo runs 2.4 seconds on its own after boot.
const settle = async (page) => {
  // the driver marks a section live on the frame after the scroll and the
  // entrance transition starts then: polled at once, getAnimations() sees
  // nothing running and the audit lands mid-fade (the hero's subtitle read
  // 1.4:1 that way). Give the transitions a moment to begin, then wait them out.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 400)))
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming?.().iterations === Infinity), { timeout: 8000, polling: 200 }).catch(() => {})
  await page.evaluate(() => new Promise((r) => setTimeout(r, 300)))
}

async function audit(page) {
  await page.addScriptTag({ path: AXE })
  await settle(page)
  const run = async () => page.evaluate(async (tags) => {
    const result = await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
    // axe audits the whole document at once, including what the scroll has
    // carried off screen: a subtitle fading out as its section leaves is a
    // contrast failure to nobody. Contrast counts only for text on screen at
    // this position; every other rule counts wherever the node is.
    const onScreen = (target) => {
      try {
        const el = document.querySelector(target[target.length - 1])
        if (!el) return true
        const r = el.getBoundingClientRect()
        return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
      } catch { return true }
    }
    return result.violations
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.filter((n) => v.id !== 'color-contrast' || onScreen(n.target)).map((n) => ({ target: n.target, data: n.any?.[0]?.data ?? null })) }))
      .filter((v) => v.nodes.length > 0)
  }, TAGS)
  const atLoad = await run()
  // The page's other states. A jump to the bottom leaves every section in
  // between outside the culler's band, never live, never revealed (review,
  // ADU-247): walk the page a viewport at a time so each section goes live
  // on the way, then audit at the bottom, the middle and the top. Sections
  // that latch once stay revealed; the rest are audited where they are in
  // view, which is what a reader scrolling gets.
  await page.evaluate(() => new Promise((resolve) => {
    const step = Math.max(200, Math.round(innerHeight * 0.8))
    let y = 0
    const tick = () => {
      y += step
      scrollTo(0, y)
      if (y < document.documentElement.scrollHeight) setTimeout(tick, 60)
      else resolve()
    }
    tick()
  }))
  await settle(page)
  const atBottom = await run()
  await page.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight / 2)))
  await settle(page)
  const atMiddle = await run()
  await page.evaluate(() => scrollTo(0, 0))
  await settle(page)
  const revealed = await run()
  // merge by rule id and target so a violation seen in several states counts once
  const seen = new Map()
  for (const v of [...atLoad, ...atBottom, ...atMiddle, ...revealed]) {
    const key = v.id
    if (!seen.has(key)) seen.set(key, { ...v, nodes: [] })
    const bucket = seen.get(key)
    for (const n of v.nodes) if (!bucket.nodes.some((m) => m.target.join() === n.target.join())) bucket.nodes.push(n)
  }
  return [...seen.values()]
}

export async function axeGate({ browser, check, base, only }) {
  const root = join(here, '..', '..')
  const pages = only ? [only] : ['/index.html', ...readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.endsWith('-preview.html')).map((f) => `/fx/${f}`)]
  for (const path of pages) {
    const page = await browser.newPage()
    let violations, detail = ''
    try {
      await page.goto(`${base}${path}?harness=1`, { waitUntil: 'load', timeout: 60000 })
      await page.waitForFunction(() => typeof window.SV !== 'undefined', { timeout: 5000 })
      await page.evaluate(() => new Promise((r) => setTimeout(r, 300)))
      violations = await audit(page)
      detail = describe(violations)
    } catch (error) {
      violations = [{ id: 'gate', impact: 'error', help: error.message, nodes: [] }]
      detail = error.message
    } finally {
      await page.close()
    }
    check(`axe: ${path}: zero WCAG A/AA violations at load and revealed`, violations.length === 0, detail)
  }
  if (only) return
  // the gate has to be able to fail
  const page = await browser.newPage()
  try {
    await page.goto(`${base}/bench/harness/fixtures/axe-red.html`, { waitUntil: 'load' })
    await page.waitForFunction(() => typeof window.SV !== 'undefined')
    const red = await audit(page)
    const ids = red.map((v) => v.id)
    check('axe gate: an image without alt and a button without a name are reported', ids.includes('image-alt') && ids.includes('button-name'), ids.join(', ') || 'no violation reported')
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
  await axeGate({ browser, check, base: `http://127.0.0.1:${server.address().port}`, only: args.page })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} page(s) violated` : '\nzero axe violations everywhere')
  process.exit(failures ? 1 : 0)
}
