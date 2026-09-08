// Real browser regressions for the review fixes. Uses the existing harness,
// bundler and installed component source; no handwritten React substitutes.
import { build } from 'esbuild'
import { COMPONENTS } from '../../../scripts/fx-data.mjs'
import { resolveScrollvars } from '../../../scripts/fx-render.mjs'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const styles = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8')
const componentPlugin = {
  name: 'review-components',
  setup(api) {
    api.onResolve({ filter: /^review:/ }, args => ({ path: args.path.slice(7), namespace: 'review' }))
    api.onLoad({ filter: /.*/, namespace: 'review' }, args => ({ contents: COMPONENTS[args.path].content, loader: 'tsx', resolveDir: repo }))
  },
}
const fixture = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Slider, Slide, Marquee } from 'scrollvars/react'
import * as SV from 'scrollvars'
import { StickySteps } from 'review:sticky-steps'
import { TimelineScrub } from 'review:timeline-scrub'
window.SV = SV
const root = createRoot(document.getElementById('app'))
window.renderKit = () => root.render(<>
  <Slider className="outer" perView={{base: 1, md: 2}} gap={16} autoplay={60000} arrows nonce="review">
    <Slide><Slider className="nested"><div className="nested-slide">Nested slide</div></Slider></Slide>
    <Slide>Second</Slide><Slide>Third</Slide>
  </Slider>
  <Marquee><span>Logos without links</span></Marquee>
</>)
window.renderSections = () => root.render(<>
  <StickySteps steps={[0,1,2].map(i => ({title:'Step '+i, text:'Readable content. '.repeat(35), media:<a href={'#shot'+i}>Media {i}</a>}))} />
  <TimelineScrub steps={[0,1,2,3,4].map(i => ({year:2020+i, text:'Timeline content. '.repeat(35)}))} />
</>)
window.renderKit()
`

export async function reviewGate({ browser, check }) {
  const bundle = await build({ stdin: { contents: fixture, loader: 'tsx', resolveDir: repo }, bundle: true, format: 'iife', write: false, plugins: [resolveScrollvars, componentPlugin], logLevel: 'silent' })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.setViewport({ width: 1100, height: 800 })
    await page.setContent(`<!doctype html><meta http-equiv="Content-Security-Policy" content="style-src 'nonce-review'"><style nonce="review">${styles}\nbody{margin:20px}.nested-slide{width:123px}.sv-marquee{margin-top:80px}</style><div id="app"></div>`)
    await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.waitForSelector('.sv-marquee-track.sv-ui')
    const dimensions = await page.evaluate(() => {
      const rail = document.querySelector('.outer > .sv-slider')
      return { rail:rail.clientWidth, first:rail.firstElementChild.offsetWidth, nested:document.querySelector('.nested-slide').offsetWidth }
    })
    check('review: responsive Slider CSS works under nonce-only CSP', Math.abs(dimensions.first - (dimensions.rail - 16) / 2) < 2, JSON.stringify(dimensions))
    check('review: outer perView does not size an inner slider', dimensions.nested === 123, JSON.stringify(dimensions))
    await page.hover('.outer')
    await page.waitForFunction(() => document.querySelector('.outer > .sv-slider').getAttribute('aria-live') === 'polite')
    check('review: hovering exposes the paused live region', true)
    await page.focus('.outer .sv-arrow')
    await page.mouse.move(1099, 799)
    await page.focus('.sv-marquee-pause')
    check('review: carousel stays stopped after focus leaves', await page.$eval('.outer .sv-pause', el => el.getAttribute('aria-label') === 'start slide rotation'))
    await page.keyboard.press('Space')
    await page.waitForFunction(() => document.querySelector('.sv-marquee-pause').getAttribute('aria-pressed') === 'true')
    await page.focus('.outer .sv-pause')
    check('review: marquee keyboard pause persists after focus leaves', await page.$eval('.sv-marquee-track', el => getComputedStyle(el).animationPlayState === 'paused' && el.classList.contains('sv-paused')))
    await page.keyboard.press('Space')
    await page.waitForFunction(() => document.querySelector('.outer > .sv-slider').getAttribute('aria-live') === 'off')
    check('review: explicit keyboard resume restores carousel rotation', true)
    const noClickDriver = await page.evaluate(() => {
      const marquee = document.querySelector('.sv-marquee')
      const track = marquee.querySelector('.sv-marquee-track')
      marquee.style.width = '160px'
      track.classList.remove('sv-ui')
      return { width:track.scrollWidth, available:marquee.clientWidth, wraps:getComputedStyle(track).flexWrap, duplicate:getComputedStyle(track.querySelector('.sv-marquee-dup')).display }
    })
    check('review: a marquee without its click driver wraps the original content', noClickDriver.wraps === 'wrap' && noClickDriver.duplicate === 'none' && noClickDriver.width <= noClickDriver.available, JSON.stringify(noClickDriver))

    // Section CSS is intentionally embedded; this page is for layout, not CSP.
    await page.goto('about:blank')
    await page.setViewport({ width: 390, height: 600 })
    await page.setContent(`<style>${styles}\nbody{margin:0;font:20px/1.6 system-ui}</style><div id="app"></div>`)
    await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.evaluate(() => window.renderSections())
    await page.waitForSelector('.sv-steps[data-sv-flow]')
    await page.$eval('.sv-timeline', el => el.scrollIntoView())
    await page.waitForSelector('.sv-timeline[data-sv-flow]')
    const fitted = await page.evaluate(() => [...document.querySelectorAll('[data-sv-flow]')].map(el => ({
      height:el.style.height, stage:getComputedStyle(el.querySelector('.sv-stage')).position,
      inert:el.querySelectorAll('[inert], [aria-hidden="true"].st-shot').length,
      shots:[...el.querySelectorAll('.st-shot')].every(shot => getComputedStyle(shot).position === 'static' && getComputedStyle(shot).opacity === '1'),
    })))
    check('review: tall mobile Sections release pin height and all media', fitted.length === 2 && fitted.every(row => !row.height && row.stage === 'static' && row.inert === 0 && row.shots), JSON.stringify(fitted))

    const pointer = await page.evaluate(async () => {
      const root = document.createElement('div')
      root.setAttribute('data-sv-pointer', '.pointer-card')
      root.innerHTML = '<div class="pointer-card" style="width:100px;height:100px">Pointer</div>'
      document.body.append(root)
      const stop = SV.scan(root)
      const card = root.firstElementChild
      const move = () => { const r=card.getBoundingClientRect(); card.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, clientX:r.right, clientY:r.bottom })) }
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
      move(); await frame()
      const active = card.style.getPropertyValue('--mx')
      stop(); move(); await frame()
      const released = card.style.getPropertyValue('--mx')
      root.remove()
      return { active, released }
    })
    check('review: declarative pointer includes the scan root and stops cleanly', Number(pointer.active) === 1 && Number(pointer.released) === 0, JSON.stringify(pointer))
    check('review: mounted components raised no browser exceptions', errors.length === 0, errors.join('\n'))
  } finally {
    await page.close()
  }
}
