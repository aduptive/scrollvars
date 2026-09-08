// Real generated pages, three engines. Run after npm run demo:sync.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    if (!/^\/fx\/[\w.-]+$/.test(path)) throw Error('not found')
    res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html')
    res.end(await readFile(fileURLToPath(new URL(`../../${path.slice(1)}`, import.meta.url))))
  } catch { res.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}/fx/`
const sections = ['hero-cinematic', 'timeline-scrub', 'sticky-steps', 'stats-countup', 'case-study-rail', 'editorial-manifesto']
const selected = process.argv[2]
assert(!selected || ['chromium', 'firefox', 'webkit'].includes(selected), `Unknown browser: ${selected}`)
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
async function pin(page, selector, progress) {
  await page.locator(selector).evaluate((el, p) => {
    const stage = el.querySelector('.sv-stage')
    const offset = parseFloat(getComputedStyle(stage).top) || 0
    scrollTo(0, scrollY + el.getBoundingClientRect().top - offset + (el.offsetHeight - innerHeight + offset) * p)
  }, progress)
  await settle(page)
}
try {
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    if (selected && selected !== name) continue
    const browser = await engine.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      for (const [slug, selector, visual] of [
        ['hero-cinematic', '.sv-hero', '.hero-inner'],
        ['editorial-manifesto', '.sv-manifesto', '.manifesto-copy p:last-child'],
      ]) {
        await page.goto(base + slug + '.html')
        const samples = []
        for (const progress of [.4, .8]) {
          await page.locator(selector).evaluate((el, p) => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight + (innerHeight + el.offsetHeight) * p), progress)
          await settle(page)
          samples.push(await page.locator(visual).evaluate(el => +getComputedStyle(el).opacity))
        }
        assert(Math.abs(samples[1] - samples[0]) > .1, `${name} ${slug}: opacity ${samples}`)
      }
      await page.goto(base + 'stats-countup.html')
      const counter = () => page.locator('.stat').first().evaluate(el => getComputedStyle(el).counterReset)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.stat')).counterReset === 'n 0')
      const before = await counter()
      await page.locator('.sv-stats').evaluate(el => el.scrollIntoView({ block: 'center' }))
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.stat')).counterReset === 'n 248')
      assert.notEqual(await counter(), before, `${name}: counter must animate after entering`)
      console.log(`ok ${name}: hero, manifesto and count-up visibly change`)
      for (const [slug, selector, visual] of [
        ['timeline-scrub', '.sv-timeline', '.tl-year'],
        ['sticky-steps', '.sv-steps', '.st-shot'],
      ]) {
        await page.goto(base + slug + '.html')
        const samples = []
        for (const p of [.1, .8]) {
          await pin(page, selector, p)
          samples.push(await page.locator(selector).evaluate((el, visual) => ({
            flow: el.hasAttribute('data-sv-flow'),
            progress: +el.style.getPropertyValue('--sv-pin'),
            visual: getComputedStyle(el.querySelector(visual)).counterReset + '/' + getComputedStyle(el.querySelector(visual)).opacity,
          }), visual))
        }
        assert(samples.every(s => !s.flow) && samples[1].progress - samples[0].progress > .6 && samples[0].visual !== samples[1].visual, `${name} ${slug}: ${JSON.stringify(samples)}`)
        // CMS content grows after mount; resize must release pinning and keep
        // content readable. Returning to desktop must not unexpectedly re-pin.
        await page.locator(selector + ' [data-sv-fit]').evaluate(el => {
          const text = document.createElement('p'); text.textContent = 'Long CMS content. '.repeat(180); el.append(text)
        })
        await page.setViewportSize({ width: 390, height: 600 })
        await page.waitForFunction(sel => document.querySelector(sel).hasAttribute('data-sv-flow'), selector)
        assert.equal(await page.locator(selector + ' .sv-stage').evaluate(el => getComputedStyle(el).position), 'static')
        await page.setViewportSize({ width: 1400, height: 900 })
        await settle(page)
        assert(await page.locator(selector).evaluate(el => el.hasAttribute('data-sv-flow')))
        console.log(`ok ${name}: ${slug} scroll, CMS overflow, resize`)
      }
      for (const width of [1600, 900, 390]) {
        await page.setViewportSize({ width, height: 900 })
        for (const [slug, root, track] of [
          ['horizontal-rail', '.fxouter', '.sv-rail'],
          ['case-study-rail', '.sv-casework > .sv', '.work-rail'],
        ]) {
          await page.goto(base + slug + '.html')
          await pin(page, root, 1)
          const end = await page.locator(track).evaluate(el => {
            const stage = el.closest('.sv-stage').getBoundingClientRect()
            const last = el.lastElementChild.getBoundingClientRect()
            return { left: last.left, right: last.right, start: stage.left, end: stage.right }
          })
          assert(end.left >= end.start - 2 && end.right <= end.end + 2, `${name} ${slug} ${width}: ${JSON.stringify(end)}`)
        }
      }
      // Every section must retain visible text and avoid page-wide overflow
      // on a narrow viewport, with reduced motion and with JS disabled.
      for (const mode of [{ javaScriptEnabled: false }, { reducedMotion: 'reduce' }]) {
        const context = await browser.newContext({ ...mode, viewport: { width: 390, height: 844 } })
        const fallback = await context.newPage()
        for (const slug of sections) {
          await fallback.goto(base + slug + '.html')
          await fallback.locator('main > h1').scrollIntoViewIfNeeded()
          const result = await fallback.evaluate(() => {
            const roots = [...document.querySelectorAll('main .sv-hero, main .sv-timeline, main .sv-steps, main .sv-stats, main .sv-casework, main .sv-manifesto')]
            const text = roots.flatMap(root => [...root.querySelectorAll('p,h2,h3,dt,li')]).filter(el => el.textContent.trim())
            const hidden = el => {
              for (let node = el; node; node = node.parentElement) {
                const css = getComputedStyle(node)
                if (css.display === 'none' || css.opacity === '0' || css.visibility === 'hidden') return true
              }
              return false
            }
            return { count: text.length, hidden: text.filter(hidden).map(el => el.textContent), overflow: document.documentElement.scrollWidth - innerWidth }
          })
          assert(result.count > 0 && !result.hidden.length && result.overflow <= 2, `${name} ${slug} ${JSON.stringify(mode)}: ${JSON.stringify(result)}`)
        }
        await context.close()
      }
      assert.deepEqual(errors, [], `${name} uncaught browser errors`)
      console.log(`ok ${name}: rail endpoints and all six Sections' mobile fallbacks`)
      await page.close()
    } finally { await browser.close() }
  }
} finally { server.close() }
