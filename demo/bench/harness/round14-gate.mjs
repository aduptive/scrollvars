// Focused round-14 browser proofs, using live component source so red/green
// does not depend on a previously generated registry. Run after a build.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EFFECTS, COMPONENTS } from '../../../scripts/fx-data.mjs'
import { loadComponent, renderStatic } from '../../../scripts/fx-render.mjs'
import { buildFailureFixture } from './enhancement-failure-build.mjs'

export async function round14Gate({ browser, check }) {
  const page = await browser.newPage(), errors = []
  page.on('pageerror', error => errors.push(error.message))
  const styles = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8')
  const stats = EFFECTS.find(fx => fx.slug === 'stats-countup')
  const Stats = await loadComponent('round14-stats', COMPONENTS['stats-countup'])
  try {
    for (const pane of ['installed', 'css', 'tailwind']) {
      const end = stats[pane]?.indexOf('</section>') + '</section>'.length
      const parsed = pane === 'installed' ? { html: renderStatic(Stats, stats.previewProps), css: '' } : { html: stats[pane].slice(0, end), css: stats[pane].slice(end).replace(/<!--[\s\S]*?-->/g, '') }
      for (const mode of ['media', 'switch']) {
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: mode === 'media' ? 'reduce' : 'no-preference' }])
        await page.setContent(`<html class="sv-on" ${mode === 'switch' ? 'data-sv-motion="reduce"' : ''}><style>${styles}\n${parsed.css}</style>${parsed.html}</html>`)
        const values = await page.evaluate(() => {
          const root = document.querySelector('.sv-acts')
          root.classList.add('sv')
          root.style.setProperty('--sv-live', '0')
          // The Tailwind pane expects its utility compiler to supply these vars.
          for (const el of document.querySelectorAll('[class]')) for (const token of el.classList) {
            const match = token.match(/^\[(--[\w-]+):([^\]]+)\]$/)
            if (match) el.style.setProperty(match[1], match[2])
          }
          return [...document.querySelectorAll('.stat')].map(el => ({
            max: Number(getComputedStyle(el).getPropertyValue('--sv-max')),
            counter: getComputedStyle(el).counterReset,
            live: getComputedStyle(root).getPropertyValue('--sv-live').trim(),
          }))
        })
        check(`StatsCountup ${pane} ${mode}: final counters before activation`, values.length > 0 && values.every(v => v.live === '0' && v.counter === `n ${v.max}` && v.max > 0), JSON.stringify(values))
      }
    }
    check('StatsCountup: no browser errors', errors.length === 0, errors.join('\n'))
  } finally { await page.close() }

  const dir = mkdtempSync(join(tmpdir(), 'sv-round14-'))
  let server, images
  try {
    const path = join(dir, 'StickySteps.tsx')
    writeFileSync(path, COMPONENTS['sticky-steps'].content)
    const fixture = await buildFailureFixture(path, ['pin'])
    const template = readFileSync(new URL('./fixtures/enhancement-failure.html', import.meta.url), 'utf8')
    const html = template.replace('<!-- DECLARED_STYLES -->', () => `<style nonce="sv-fixture">${styles}</style>`)
      .replace('<!-- APP_MARKUP -->', () => fixture.imageMarkup)
    server = createServer((req, res) => {
      res.setHeader('Content-Type', req.url.startsWith('/failure-client.js') ? 'text/javascript' : 'text/html')
      res.end(req.url.startsWith('/failure-client.js') ? fixture.script : html)
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    images = await browser.newPage()
    images.on('pageerror', error => errors.push(error.message))
    await images.setViewport({ width: 1400, height: 900 })
    await images.goto(`http://127.0.0.1:${server.address().port}/failure.html?case=images`)
    await images.waitForFunction(() => window.failureHydrated && stepsStatuses.includes('active') && [...document.images].every(img => img.complete && img.naturalWidth > 0))
    await images.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const measurement = await images.evaluate(() => {
      const el = document.querySelector('.sv-steps'), fit = el.querySelector('[data-sv-fit]'), stage = el.querySelector('.sv-stage')
      const actual = { flow: el.hasAttribute('data-sv-flow'), fit: Math.max(fit.offsetHeight, fit.scrollHeight), stage: stage.clientHeight, ready: el.classList.contains('st-ready'), natural: [...document.images].map(img => [img.naturalWidth, img.naturalHeight]) }
      // Measure the candidate without setting inert or aria-hidden. Restore the
      // original state before returning so this probe cannot repair the result.
      const className = el.className
      el.removeAttribute('data-sv-flow')
      el.classList.remove('st-static')
      el.classList.add('st-ready')
      actual.candidateFit = Math.max(fit.offsetHeight, fit.scrollHeight)
      actual.candidateStage = stage.clientHeight
      el.className = className
      if (actual.flow) el.setAttribute('data-sv-flow', '')
      return actual
    })
    check('StickySteps: intrinsic images fit without latching flow', !measurement.flow && measurement.ready && measurement.fit <= measurement.stage + 1, JSON.stringify(measurement))
    check('StickySteps: no browser errors', errors.length === 0, errors.join('\n'))
  } finally {
    await images?.close()
    if (server) await new Promise(resolve => server.close(resolve))
    rmSync(dir, { recursive: true, force: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const puppeteer = (await import('puppeteer-core')).default
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  let failures = 0
  try {
    await round14Gate({ browser, check(name, ok, detail = '') { console.log(`${ok ? 'ok' : 'FAIL'} ${name}: ${detail}`); if (!ok) failures++ } })
  } finally { await browser.close() }
  assert.equal(failures, 0, `${failures} round-14 browser failures`)
}
