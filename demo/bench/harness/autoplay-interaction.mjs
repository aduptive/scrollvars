// Called by the existing Puppeteer invariant runner. The interval clock is
// controlled; native gesture delivery and slider rendering stay in the browser.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolveScrollvars } from '../../../scripts/fx-render.mjs'

export async function autoplayInteraction({ browser, check }) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.setViewport({ width: 800, height: 600, hasTouch: true })
    await page.setContent('<style>body{margin:0}.sv-slider-shell{width:600px}.sv-slider>div{height:200px}</style><div id="app"></div>')
    await page.addStyleTag({ content: readFileSync(new URL('../../../styles/slider.css', import.meta.url), 'utf8') })
    await page.evaluate(() => {
      let now = 0, id = 0
      const intervals = new Map()
      window.setInterval = (fn, ms) => { intervals.set(++id, { fn, ms, due: now + ms }); return id }
      window.clearInterval = id => intervals.delete(id)
      window.tick = ms => {
        now += ms
        for (const timer of intervals.values()) while (timer.due <= now) { timer.due += timer.ms; timer.fn() }
      }
      window.intervalCount = () => intervals.size
      window.changes = []
    })
    const result = await build({
      stdin: { contents: `import * as React from 'react'; import { createRoot } from 'react-dom/client'; import { Slider } from 'scrollvars/react';
        const root = createRoot(document.getElementById('app'));
        root.render(<Slider perView={1} autoplay={1000} duration={0} onSlide={i => window.changes.push(i)}><div>One</div><div>Two</div><div>Three</div></Slider>);
        window.unmount = () => root.unmount();`, loader: 'tsx', resolveDir: fileURLToPath(new URL('../../../', import.meta.url)) },
      bundle: true, write: false, format: 'iife', platform: 'browser', plugins: [resolveScrollvars],
      define: { 'process.env.NODE_ENV': '"production"' },
    })
    await page.addScriptTag({ content: result.outputFiles[0].text })
    await page.waitForFunction(() => intervalCount() === 1 && changes.length > 0)
    const client = await page.createCDPSession()
    const touch = (type, x) => client.send('Input.dispatchTouchEvent', { type, touchPoints: x === undefined ? [] : [{ x, y: 140 }] })
    for (const ending of ['touchEnd', 'touchCancel']) {
      await touch('touchStart', 480)
      await touch('touchMove', 430)
      await touch('touchMove', 370)
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
      const held = await page.evaluate(() => document.querySelector('.sv-slider').scrollLeft)
      assert(held > 0, 'native touch actually scrolled the rail')
      await page.evaluate(() => tick(3500))
      assert.equal(await page.evaluate(() => document.querySelector('.sv-slider').scrollLeft), held, 'no autoplay write during held touch')
      await touch(ending)
      // Let native snap settle before checking autoplay navigation.
      await new Promise(r => setTimeout(r, 600))
      const before = await page.evaluate(() => changes.length)
      await page.evaluate(() => tick(999))
      assert.equal(await page.evaluate(() => changes.length), before, 'release waits a full countdown')
      await page.evaluate(() => tick(1))
      await page.waitForFunction(n => changes.length > n, {}, before)
    }
    await touch('touchStart', 480)
    await page.evaluate(() => unmount())
    await touch('touchCancel')
    await page.evaluate(() => tick(5000))
    assert.equal(await page.evaluate(() => intervalCount()), 0, 'unmount removes interval and release listeners')
    assert.deepEqual(errors, [])
    check('autoplay: held touch, release/cancel countdown and unmount', true)
  } catch (error) {
    check('autoplay: held touch, release/cancel countdown and unmount', false, error.stack)
  } finally { await page.close() }
}
