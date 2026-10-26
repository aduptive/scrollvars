#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import puppeteer from 'puppeteer-core'
import { chromium, firefox, webkit } from 'playwright'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const recipe = join(repo, 'demo/recipes/svg-scene')
const out = resolve(process.env.SCENE_RESULTS || join(repo, 'node_modules/.cache/svg-scene'))
mkdirSync(out, { recursive: true })
const selectedBrowser = process.argv.find(arg => arg.startsWith('--browser='))?.slice(10)
if (selectedBrowser && !['chromium', 'firefox', 'webkit'].includes(selectedBrowser)) throw Error('Unknown browser: ' + selectedBrowser)
const modes = ['css', 'direct', 'native'], bundles = {}, sizes = {}
for (const mode of modes) {
  const result = await build({ entryPoints: [join(repo, 'demo/bench/harness/fixtures/svg-scene/controls.mjs')],
    bundle: true, format: 'esm', minify: true, target: 'es2020', write: false, metafile: true,
    alias: { scrollvars: join(repo, 'dist/index.js') }, define: { SCENE_MODE: JSON.stringify(mode) } })
  bundles[mode] = result.outputFiles[0].text
  sizes[mode] = { min: bundles[mode].length, gzip: gzipSync(bundles[mode], { level: 9 }).length,
    sha256: createHash('sha256').update(bundles[mode]).digest('hex') }
  if (mode === 'native') {
    const inputs = Object.values(result.metafile.outputs)[0].inputs
    assert.ok(!Object.entries(inputs).some(([path, input]) => /(^|\/)dist\//.test(path) && input.bytesInOutput > 0), 'native control must not include ScrollVars')
  }
  writeFileSync(join(out, mode + '.js'), bundles[mode])
}
const html = readFileSync(join(recipe, 'index.html'), 'utf8')
const css = readFileSync(join(recipe, 'scene.css'))
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/scene.css') { res.setHeader('content-type', 'text/css'); res.end(css); return }
  const mode = url.searchParams.get('mode') || 'direct'
  if (!modes.includes(mode)) { res.writeHead(400); res.end(); return }
  if (url.pathname === '/entry.js') { res.setHeader('content-type', 'text/javascript'); res.end(bundles[mode]); return }
  if (url.pathname !== '/') { res.writeHead(404); res.end(); return }
  let content = html.replace('./entry.js', './entry.js?mode=' + mode)
  if (url.searchParams.get('deep') === '1') {
    // Same extra SVG descendants in all modes; a stress profile, not a typical section.
    content = content.replaceAll('</g>', Array.from({ length: 120 }, (_, i) => `<circle cx="${120 + i % 20 * 16}" cy="${100 + Math.floor(i / 20) * 28}" r="2" fill="currentColor" opacity=".3"/>`).join('') + '</g>')
  }
  res.setHeader('content-type', 'text/html'); res.end(content)
})
await new Promise(r => server.listen(Number(process.env.SCENE_PORT || 0), '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}/`
if (process.argv.includes('--serve')) {
  console.log(base + '?mode=direct')
  console.log('Controls: ?mode=css or ?mode=native; add &deep=1 for the stress profile.')
} else {
  const sample = async page => page.evaluate(async () => {
    const section = document.querySelector('.scene'), result = []
    for (const p of [.25, .5, .75, .4]) {
      const rect = section.getBoundingClientRect()
      scrollTo(0, rect.top + scrollY - innerHeight + p * (innerHeight + rect.height))
      const deadline = performance.now() + 3000
      while (!section.hasAttribute('data-running')) {
        if (performance.now() > deadline) throw Error('scene did not become active')
        await new Promise(requestAnimationFrame)
      }
      for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame)
      result.push([...section.querySelectorAll('[data-piece]')].map(el => {
        const m = new DOMMatrix(getComputedStyle(el).transform)
        return [m.a, m.b, m.c, m.d, m.e, m.f]
      }))
    }
    return result
  })
  const compare = (a, b) => {
    const x = a.flat(3), y = b.flat(3)
    assert.equal(x.length, y.length)
    x.forEach((v, i) => assert.ok(Math.abs(v - y[i]) < .05, `render differs at ${i}: ${v} vs ${y[i]}`))
    assert.ok(a[0][0].some((v, i) => Math.abs(v - a[2][0][i]) > .1), 'scene must actually move')
  }
  const report = { date: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    sourceHash: createHash('sha256').update(html).update(css).update(Object.values(bundles).join('')).digest('hex'), sizes, gates: [], runs: [] }
  const save = () => writeFileSync(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  try {
    for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
      if (selectedBrowser && name !== selectedBrowser) continue
      const browser = await engine.launch({ headless: true })
      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
        const errors = []; page.on('pageerror', e => errors.push(e.message))
        let expected, expectedMobile, expectedDeep
        for (const mode of modes) {
          await page.goto(base + '?mode=' + mode)
          await page.waitForFunction(() => typeof window.sceneDestroy === 'function')
          const actual = await sample(page)
          if (!expected) expected = actual
          try { compare(expected, actual) } catch (error) { console.error(name, mode, JSON.stringify({ expected, actual, state: await page.evaluate(() => ({ running: document.querySelector('.scene').outerHTML.slice(0,500), style: getComputedStyle(document.querySelector('[data-piece]')).transform })) })); throw error }
          await page.evaluate(() => { document.querySelector('footer').style.minHeight = '200vh'; scrollTo(0, document.documentElement.scrollHeight) })
          await page.waitForTimeout(150)
          assert.equal(await page.locator('[data-running]').count(), 0, 'offscreen pause')
          await page.evaluate(() => { document.querySelector('footer').style.minHeight = '' })
          compare(expected, await sample(page))
          await page.evaluate(() => document.documentElement.setAttribute('data-sv-motion', 'reduce'))
          await page.waitForTimeout(100)
          assert.equal(await page.locator('[data-running]').count(), 0)
          await page.evaluate(() => document.documentElement.removeAttribute('data-sv-motion'))
          await page.waitForTimeout(150)
          assert.equal(await page.locator('[data-running]').count(), 1, 'motion change wakes without a scroll event')
          // Keep the section size fixed so ResizeObserver cannot mask a stale preference read.
          await page.evaluate(() => {
            const section = document.querySelector('.scene')
            section.style.height = section.getBoundingClientRect().height + 'px'
          })
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await page.waitForFunction(() => !document.querySelector('.scene').hasAttribute('data-running'))
          await page.emulateMedia({ reducedMotion: 'no-preference' })
          await page.waitForFunction(() => document.querySelector('.scene').hasAttribute('data-running'))
          await page.evaluate(() => { document.querySelector('.scene').style.height = '' })
          compare(expected, await sample(page))
          await page.setViewportSize({ width: 390, height: 844 })
          const mobile = await sample(page)
          expectedMobile ??= mobile
          compare(expectedMobile, mobile)
          await page.setViewportSize({ width: 1280, height: 800 })
          await page.evaluate(() => { document.querySelector('.scene').style.display = 'none' })
          await page.waitForTimeout(100)
          assert.equal(await page.locator('[data-running]').count(), 0, 'zero-area pause')
          await page.evaluate(() => { document.querySelector('.scene').style.display = '' })
          await page.waitForTimeout(150)
          assert.equal(await page.locator('[data-running]').count(), 1)
          await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
          assert.equal(await page.locator('[data-running]').count(), 0, 'synthetic visibility event pause')
          await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
          await page.waitForTimeout(150)
          assert.equal(await page.locator('[data-running]').count(), 1)
          await page.evaluate(() => { sceneDestroy(); sceneDestroy() })
          await page.waitForTimeout(100)
          assert.equal(await page.locator('[data-running]').count(), 0)
          assert.equal(await page.locator('[data-piece][style*="transform"]').count(), 0, 'teardown restores transforms')
          await page.evaluate(() => sceneMount())
          await page.waitForTimeout(150)
          assert.equal(await page.locator('[data-running]').count(), 1)
        }
        for (const mode of modes) {
          await page.goto(base + '?mode=' + mode + '&deep=1')
          await page.waitForFunction(() => typeof window.sceneDestroy === 'function')
          const deep = await sample(page)
          expectedDeep ??= deep
          compare(expectedDeep, deep)
        }
        if (name === 'chromium') {
          await page.goto(base + '?mode=direct')
          await sample(page)
          await page.screenshot({ path: join(out, 'scene.png') })
        }
        assert.deepEqual(errors, [])
        await page.evaluate(() => { document.querySelector('[data-piece]').style.transform = 'scale(0.8)'; sceneDestroy() })
        assert.equal(await page.locator('[data-piece]').first().evaluate(el => el.style.transform), 'scale(0.8)', 'preserve a later author transform')
        await page.goto(base + '?mode=direct')
        await sample(page)
        const authored = await page.evaluate(() => {
          const el = document.querySelector('[data-piece]'), value = el.style.transform
          el.style.setProperty('transform', value, 'important')
          sceneDestroy()
          return { value, restored: el.style.transform, priority: el.style.getPropertyPriority('transform') }
        })
        assert.equal(authored.restored, authored.value)
        assert.equal(authored.priority, 'important', 'preserve an author priority-only change')
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(base + '?mode=direct')
        await page.waitForTimeout(150)
        assert.equal(await page.locator('[data-running]').count(), 0, 'OS reduced motion starts static')
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await sample(page)
        assert.equal(await page.locator('[data-running]').count(), 1, 'OS preference change wakes scene')
        const noJS = await browser.newPage({ javaScriptEnabled: false })
        await noJS.goto(base)
        assert.equal(await noJS.locator('h1').count(), 1)
        assert.equal(await noJS.locator('[data-piece]').count(), 3)
        assert.equal(await noJS.locator('[data-running]').count(), 0)
        await noJS.close()
        report.gates.push({ browser: name, version: browser.version(), passed: true }); save()
        console.log(name + ': equivalent output, lifecycle and no-JS gates passed')
        await page.close()
      } finally { await browser.close() }
    }
    if (!process.argv.includes('--gates')) {
      const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
      report.browser = await browser.version()
      try {
        for (const profile of [{ name: 'desktop', width: 1280, height: 800, cpu: 1 }, { name: 'mobile-simulated', width: 390, height: 844, cpu: 4 }]) {
          for (const deep of [0, 1]) {
            for (let round = 0; round < 6; round++) {
              const order = round < 3 ? modes : [...modes].reverse()
              for (let n = 0; n < 3; n++) {
                const mode = order[(n + round) % 3]
                const context = await browser.createBrowserContext(), page = await context.newPage()
                try {
                  await page.setViewport({ width: profile.width, height: profile.height })
                  const cdp = await page.createCDPSession()
                  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu })
                  await cdp.send('Performance.enable')
                  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
                  await page.goto(`${base}?mode=${mode}&deep=${deep}`)
                  await sample(page)
                  const before = await metrics()
                  const frames = await page.evaluate(async () => {
                    const section = document.querySelector('.scene'), r = section.getBoundingClientRect()
                    const top = r.top + scrollY, height = r.height, vh = innerHeight, times = []
                    for (let i = 0; i < 180; i++) {
                      times.push(await new Promise(requestAnimationFrame))
                      const p = .5 - .25 * Math.cos(i / 179 * Math.PI * 4)
                      scrollTo(0, top - vh + p * (vh + height))
                    }
                    await new Promise(requestAnimationFrame)
                    return times.slice(1).map((t, i) => t - times[i])
                  })
                  const after = await metrics(), timing = {}
                  for (const key of ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration']) timing[key + 'Ms'] = (after[key] - before[key]) * 1000
                  frames.sort((a, b) => a - b)
                  report.runs.push({ profile: profile.name, deep, round, mode, ...timing, heap: after.JSHeapUsedSize,
                    p95: frames[Math.floor(frames.length * .95)], worst: frames.at(-1), over25: frames.filter(t => t > 25).length, frames: frames.length })
                  save(); console.log(profile.name, deep, round, mode, timing.TaskDurationMs.toFixed(1))
                } finally { await context.close() }
              }
            }
          }
        }
      } finally { await browser.close() }
    }
    save(); console.log('Evidence:', out)
  } finally { server.close() }
}
