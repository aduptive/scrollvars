import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { chromium, firefox, webkit } from 'playwright'
import { mediaFiles } from './fixtures/section-content.mjs'

const settle = page => page.evaluate(() => window.packedSettle())
const failed = '#failed-section .sv-steps'
const healthy = '#healthy-section .sv-steps'

async function pin(page, selector, progress) {
  await page.locator(selector).evaluate((el, p) => {
    const stage = el.querySelector('.sv-stage')
    const top = parseFloat(getComputedStyle(stage).top) || 0
    scrollTo(0, scrollY + el.getBoundingClientRect().top - top + (el.offsetHeight - stage.offsetHeight) * p)
  }, progress)
  await settle(page)
}

async function crossfade(page, selector) {
  await pin(page, selector, 0)
  await page.waitForFunction(sel => {
    const el = document.querySelector(sel), shots = [...el.querySelectorAll('.st-shot')]
    const stage = el.querySelector('.sv-stage'), fit = el.querySelector('[data-sv-fit]')
    return el.classList.contains('st-ready') && !el.hasAttribute('data-sv-off') && !el.hasAttribute('data-sv-flow') &&
      getComputedStyle(stage).position === 'sticky' && Math.max(fit.offsetHeight, fit.scrollHeight) <= stage.clientHeight + 1 &&
      shots.length === 3 && shots.filter(shot => shot.inert && shot.getAttribute('aria-hidden') === 'true').length === 2 &&
      shots.every(shot => getComputedStyle(shot).position === 'absolute') &&
      !shots[0].inert && +getComputedStyle(shots[0]).opacity > .99
  }, selector)
  await pin(page, selector, 1)
  await page.waitForFunction(sel => {
    const shots = document.querySelector(sel).querySelectorAll('.st-shot')
    return +getComputedStyle(shots[0]).opacity < .01 && shots[0].inert &&
      +getComputedStyle(shots[2]).opacity > .99 && !shots[2].inert && !shots[2].hasAttribute('aria-hidden')
  }, selector)
  // Programmatic focus must also be refused by the actual inert subtree.
  const last = page.locator(selector + ' .st-shot:last-child a')
  await last.focus()
  await page.locator(selector + ' .st-shot:first-child a').evaluate(el => el.focus())
  assert(await last.evaluate(el => document.activeElement === el), 'inactive shot stole focus')
  assert(await last.evaluate(visible), 'active shot focus is clipped or hidden')
}

function visible(el) {
  for (let node = el; node; node = node.parentElement) {
    const css = getComputedStyle(node)
    if (css.display === 'none' || css.visibility !== 'visible' || +css.opacity < .01 || node.inert || node.getAttribute('aria-hidden') === 'true') return false
  }
  return [...el.getClientRects()].some(rect => {
    const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right)
    const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom)
    if (right <= left || bottom <= top) return false
    const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
    return !!hit && (hit === el || el.contains(hit))
  })
}

async function staticShots(page, selector, count = 3) {
  await page.waitForFunction(({ sel, count }) => {
    const shots = [...document.querySelectorAll(sel + ' .st-shot')]
    return shots.length === count && shots.every(el => !el.inert && !el.hasAttribute('aria-hidden') &&
      getComputedStyle(el).position === 'static' && +getComputedStyle(el).opacity === 1)
  }, { sel: selector, count })
  for (const link of await page.locator(selector + ' .st-shot a').all()) {
    await link.scrollIntoViewIfNeeded()
    assert(await link.evaluate(visible), 'static shot clipped, covered or hidden')
  }
  const links = page.locator(selector + ' .st-shot a')
  if (!count) return
  await links.first().focus()
  assert(await links.first().evaluate(visible), 'first static shot focus is hidden')
  for (let i = 1; i < count; i++) {
    await page.keyboard.press('Tab')
    assert(await links.nth(i).evaluate(el => document.activeElement === el), 'Tab skipped static shot')
    assert(await links.nth(i).evaluate(visible), 'focused static shot not visible')
  }
}

const contentSteps = '#content-steps .sv-steps'
const contentPins = [contentSteps, '#content-timeline .sv-timeline', '#content-rail .sv-casework > .sv']

async function contentReachable(page) {
  const copy = page.locator('[data-content-title],[data-content-body],#content-rail h3,#content-rail p')
  assert(await copy.count() >= 12, 'content fixture is empty')
  for (const node of await copy.all()) {
    await node.scrollIntoViewIfNeeded()
    assert(await node.evaluate(visible), `copy clipped or hidden: ${await node.textContent()}`)
    assert(await node.evaluate(el => [...el.getClientRects()].every(r => r.left >= -2 && r.right <= innerWidth + 2)), 'copy extends outside the viewport')
  }
  // Real focus and hit testing, including links surrounding failed images.
  for (const link of await page.locator('[data-content-lease] a').all()) {
    if (await link.evaluate(el => !!el.closest('[inert]'))) continue
    await link.focus()
    assert(await link.evaluate(el => document.activeElement === el), 'content link refused focus')
    assert(await link.evaluate(visible), 'focused content link is clipped or covered')
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'content creates horizontal page overflow')
}

async function contentFlow(page) {
  for (const selector of contentPins) {
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel), stage = el.querySelector('.sv-stage')
      return el.hasAttribute('data-sv-flow') && getComputedStyle(stage).position === 'static' && stage.scrollHeight <= stage.clientHeight + 1
    }, selector)
  }
  await staticShots(page, contentSteps)
  await contentReachable(page)
}

async function contentActive(page) {
  await crossfade(page, contentSteps)
  for (const selector of contentPins.slice(1)) {
    await pin(page, selector, .5)
    assert(await page.locator(selector).evaluate(el => {
      const fit = el.querySelector('[data-sv-fit]'), stage = el.querySelector('.sv-stage')
      return !el.hasAttribute('data-sv-flow') && getComputedStyle(stage).position === 'sticky' && Math.max(fit.offsetHeight, fit.scrollHeight) <= stage.clientHeight + 1
    }), `${selector}: short content never enhanced`)
  }
}

async function contentMotion(page) {
  for (const mode of ['OS', 'page']) {
    if (mode === 'OS') await page.emulateMedia({ reducedMotion: 'reduce' })
    else await page.evaluate(() => window.packed.SV.setMotion('reduce'))
    await staticShots(page, contentSteps)
    await contentReachable(page)
    if (mode === 'OS') await page.emulateMedia({ reducedMotion: 'no-preference' })
    else await page.evaluate(() => window.packed.SV.setMotion('auto'))
    await crossfade(page, contentSteps)
  }
  const immediate = await page.evaluate(() => {
    const snapshot = () => [...document.querySelectorAll('#content-steps .st-shot')].map(el => ({ inert: el.inert, hidden: el.hasAttribute('aria-hidden'), position: getComputedStyle(el).position }))
    window.packed.SV.setMotion('reduce')
    const reduced = snapshot()
    window.packed.SV.setMotion('auto')
    return { reduced, restored: snapshot() }
  })
  assert(immediate.reduced.every(s => !s.inert && !s.hidden && s.position === 'static'))
  assert.equal(immediate.restored.filter(s => s.inert && s.hidden && s.position === 'absolute').length, 2, 'consecutive calls failed to restore eligibility before React rendered')
  await crossfade(page, contentSteps)
}

async function runContentChecks({ browser, label, url, check, diagnose }) {
  const scenarios = [
    ['decoded JPEGs, first and last scenes, and live motion', 'normal', async page => {
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth === 1200 && img.naturalHeight === 900))
      await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())))
      await contentActive(page)
      await contentMotion(page)
    }],
    ['held image across hydration and both motion controls', 'held', async page => {
      assert(await page.locator('#content-steps img').nth(1).evaluate(img => !img.complete), 'image was not held after hydration')
      await crossfade(page, contentSteps)
      await contentMotion(page)
      await page.request.get(url + 'release-images')
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth === 1200))
      await contentActive(page)
      await contentMotion(page)
    }],
    ['separate image 404 preserves surrounding copy and links', 'broken', async page => {
      await page.waitForFunction(() => [...document.images].every(img => img.complete))
      assert.equal(await page.locator('#content-steps img').nth(1).evaluate(img => img.naturalWidth), 0)
      await crossfade(page, contentSteps)
      await page.evaluate(() => window.packed.SV.setMotion('reduce'))
      await staticShots(page, contentSteps)
      await contentReachable(page)
    }],
    ['200-word bodies and 120-character titles latch actual overflow until remount', 'normal', async page => {
      await contentActive(page)
      await page.evaluate(() => window.packedContent.replace(true))
      await page.waitForFunction(() => document.querySelector('[data-content-body]').textContent.trim().split(/\s+/).length === 200)
      assert(await page.locator('[data-content-title],#content-rail h3').evaluateAll(nodes => nodes.length === 9 && nodes.every(el => el.textContent.length === 120)))
      await contentFlow(page)
      for (const selector of contentPins) assert(await page.locator(selector + ' .sv-stage').evaluate(el => el.clientHeight > innerHeight), `${selector}: long replacement did not create actual overflow`)
      await page.evaluate(() => window.packedContent.replace(false))
      await page.waitForFunction(() => document.querySelector('[data-content-title]').textContent === 'Step 1')
      await contentFlow(page)
      for (const mode of ['OS', 'page']) {
        if (mode === 'OS') await page.emulateMedia({ reducedMotion: 'reduce' })
        else await page.evaluate(() => window.packed.SV.setMotion('reduce'))
        await contentFlow(page)
        if (mode === 'OS') await page.emulateMedia({ reducedMotion: 'no-preference' })
        else await page.evaluate(() => window.packed.SV.setMotion('auto'))
        await contentFlow(page)
      }
      await page.evaluate(() => window.packedContent.remount())
      await page.waitForFunction(() => document.querySelector('[data-content-lease]').dataset.contentLease === '1')
      await contentActive(page)
    }],
    ['step replacement 3 to 1 to 0 to 3 clears scene restrictions', 'normal', async page => {
      await crossfade(page, contentSteps) // leave scene 2 selected before shrinking
      for (const count of [1, 0, 3]) {
        await page.evaluate(n => window.packedContent.count(n), count)
        await page.waitForFunction(n => document.querySelectorAll('#content-steps .st-shot').length === n, count)
        // the re-attached lease settles on the driver's next frame: assert the
        // settled state, never the measuring frame between render and fit read
        await page.waitForFunction(() => !document.querySelector('#content-steps .sv-steps').classList.contains('st-measuring'))
        if (count === 3) await crossfade(page, contentSteps)
        else {
          await page.waitForFunction(() => [...document.querySelectorAll('#content-steps .st-shot')].every(el => !el.inert && !el.hasAttribute('aria-hidden') && +getComputedStyle(el).opacity > .99))
          assert.equal(await page.locator('#content-steps [inert],#content-steps .st-media [aria-hidden="true"]').count(), 0, 'orphaned media accessibility restriction')
          if (count) {
            const link = page.locator('#content-steps .st-shot a')
            await link.focus(); assert(await link.evaluate(visible), 'surviving shot is not focus-visible')
          } else assert(await page.locator(contentSteps + ' .sv-stage').evaluate(el => getComputedStyle(el).position === 'static' && el.scrollHeight <= el.clientHeight + 1), 'empty section kept a clipped stage')
        }
      }
    }],
    ...['320px', 'double text'].map(size => [`${size} long content is reachable without horizontal overflow`, 'normal', async page => {
      if (size === '320px') await page.setViewportSize({ width: 320, height: 900 })
      await page.evaluate(() => window.packedContent.replace(true))
      await page.waitForFunction(() => document.querySelector('[data-content-title]').textContent.length === 120)
      if (size === 'double text') await page.evaluate(() => {
        const text = [...document.querySelectorAll('[data-content-lease] *')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
        const sizes = text.map(el => parseFloat(getComputedStyle(el).fontSize) * 2)
        text.forEach((el, i) => { el.style.fontSize = sizes[i] + 'px' })
      })
      await contentFlow(page)
    }]),
  ]
  for (const [title, mode, run] of scenarios) {
    await check(`${label}: content ${title}`, async () => {
      const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'no-preference' })
      let page
      try {
        page = await context.newPage()
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(url + 'content/' + mode, { waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => window.packedContent && window.packed, null, { polling: 100 })
        await run(page)
        assert.deepEqual(errors, [])
        assert.deepEqual(await page.evaluate(() => window.packedHydrationErrors), [])
        assert.deepEqual(await page.evaluate(() => window.packedControllerReports), [])
      } catch (error) { await diagnose(page, `${label}-content-${title}`); throw error }
      finally { await context.close() }
    })
  }
}

async function keyboardPage(page) {
  // Count authored controls including any accidentally inert ones. Only the
  // kit's explicitly decorative duplicated track is excluded from the set.
  const candidates = page.locator('a[href],button,input,select,textarea,[tabindex]')
  const expected = []
  for (const el of await candidates.all()) {
    if (await el.evaluate(node => !!node.closest('.sv-marquee-track > [aria-hidden="true"]'))) continue
    // Without its click driver the shipped kit deliberately hides this
    // enhancement-only control. Never use a generic hidden/inert exclusion.
    if (await el.evaluate(node => node.matches('.sv-marquee-pause') &&
      !node.previousElementSibling.classList.contains('sv-ui') && getComputedStyle(node).display === 'none')) continue
    expected.push(el)
  }
  assert(expected.length >= 8, `empty keyboard coverage: ${expected.length}`)
  await page.locator('#before').focus()
  for (let i = 0; i < expected.length; i++) {
    if (i) await page.keyboard.press('Tab')
    assert(await expected[i].evaluate(el => document.activeElement === el), `Tab missed control ${i}: ${await expected[i].textContent()}`)
    assert(await expected[i].evaluate(visible), `control ${i} is focused but clipped, covered or hidden`)
  }
  return expected.length
}

// Decorative dots differ intentionally without JS; compare content layout.
const shape = () => [...document.querySelectorAll('.st-shot,.sv-stage,.work-rail,.st-steps>li')].map(el => {
  const css = getComputedStyle(el)
  return { class: el.className, position: css.position, opacity: css.opacity, transform: css.transform, translate: css.translate, scale: css.scale, inert: el.inert, hidden: el.getAttribute('aria-hidden') }
})
const isolation = () => {
  const el = document.getElementById('isolation'), css = getComputedStyle(el)
  return [el.outerHTML, css.color, css.padding, css.transform, css.opacity]
}

async function fallback(page) {
  await staticShots(page, failed)
  await staticShots(page, healthy)
  // All installed Sections must have readable copy, not only StickySteps.
  const copy = page.locator('[data-installed] h1,[data-installed] h2,[data-installed] h3,[data-installed] p,[data-installed] li,[data-installed] dt')
  assert(await copy.count() > 15)
  for (const el of await copy.all()) {
    await el.scrollIntoViewIfNeeded()
    assert(await el.evaluate(visible), `fallback copy not reachable: ${await el.textContent()}`)
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'fallback horizontal overflow')
  return keyboardPage(page)
}

async function kitWorks(page) {
  const button = page.locator('#kit button')
  await button.scrollIntoViewIfNeeded()
  const track = page.locator('#kit .sv-marquee-track')
  await page.mouse.move(0, 0)
  await page.locator('#before').focus()
  assert.equal(await track.evaluate(el => getComputedStyle(el).animationName), 'sv-marquee')
  await button.click()
  assert(await track.evaluate(el => el.classList.contains('sv-paused')), 'installed kit click enhancement did not execute')
  assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), 'paused')
  await button.click()
  assert(await track.evaluate(el => !el.classList.contains('sv-paused')))
}

async function sectionMotion(page) {
  // Every installed Section needs a positive behavior control; absence of
  // styles or a nonexecuting bundle must fail before fallback assertions.
  await page.locator('.sv-hero').evaluate(el => el.scrollIntoView({ block: 'center' }))
  await page.waitForFunction(() => document.querySelector('.sv-hero .sv')?.classList.contains('sv-live') &&
    document.querySelectorAll('.sv-hero .sv-split-rise [aria-hidden="true"]').length > 2)
  await pin(page, '.sv-timeline', 0)
  const year = await page.locator('.tl-year').evaluate(el => getComputedStyle(el).counterReset)
  await pin(page, '.sv-timeline', .8)
  await page.waitForFunction(before => getComputedStyle(document.querySelector('.tl-year')).counterReset !== before, year)
  await pin(page, '.sv-casework > .sv', .7)
  assert(await page.locator('.work-rail').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 < -100))
  const opacities = []
  for (const p of [.4, .8]) {
    await page.locator('.sv-manifesto').evaluate((el, t) => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight + (innerHeight + el.offsetHeight) * t), p)
    await settle(page)
    opacities.push(await page.locator('.manifesto-copy p').last().evaluate(el => +getComputedStyle(el).opacity))
  }
  assert(Math.abs(opacities[1] - opacities[0]) > .1, `manifesto did not change: ${opacities}`)
  await page.locator('.sv-stats').evaluate(el => el.scrollIntoView({ block: 'center' }))
  await page.waitForFunction(() => [...document.querySelectorAll('.stat')].every(el => /n [1-9]/.test(getComputedStyle(el).counterReset)))
}

export async function runBrowsers({ fixture, browsers, react, check: recordCheck, recordBrowser = () => {}, diagnose = async () => {} }) {
  let activePage
  const check = (name, run) => recordCheck(name, async () => {
    try { await run() } catch (error) { await diagnose(activePage, name); throw error }
  })
  const resources = new Map([['/', ['text/html', fixture.html]], ['/client.js', ['text/javascript', fixture.script]], ['/consumer.css', ['text/css', fixture.css]]])
  for (const [mode, html] of Object.entries(fixture.content)) resources.set('/content/' + mode, ['text/html', html])
  for (const name of mediaFiles) resources.set('/media/' + name, ['image/jpeg', readFileSync(new URL('./fixtures/media/' + name, import.meta.url))])
  const held = new Set()
  let released = false
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname
    res.setHeader('Cache-Control', 'no-store')
    if (path === '/content/held') released = false
    const jpeg = () => { res.setHeader('Content-Type', 'image/jpeg'); res.end(resources.get('/media/step-2.jpg')[1]) }
    if (path === '/media/held.jpg') {
      if (released) jpeg()
      else { held.add(jpeg); res.on('close', () => held.delete(jpeg)) }
      return
    }
    if (path === '/release-images') { released = true; for (const send of held) send(); held.clear(); res.end('released'); return }
    const resource = resources.get(path)
    if (!resource) return res.writeHead(404).end()
    res.setHeader('Content-Type', resource[0]); res.end(resource[1])
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/`
  try {
    for (const name of browsers) {
      const browser = await ({ chromium, firefox, webkit })[name].launch()
      recordBrowser(name, browser.version())
      const label = `${name} React ${react}`
      try {
        let noJsShape, independent
        await check(`${label}: no-JS computed reachability and keyboard`, async () => {
          const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1400, height: 900 } })
          try {
            const page = activePage = await context.newPage()
            await page.goto(url)
            await fallback(page)
            noJsShape = await page.evaluate(shape)
            independent = await page.evaluate(isolation)
            assert.deepEqual(independent.slice(1), ['rgb(11, 22, 33)', '17px', 'matrix(1, 0, 0, 1, 0, 3)', '0.83'])
          } catch (error) { await diagnose(activePage, `${label}-no-JS`); throw error }
          finally { await context.close() }
        })
        const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'no-preference' })
        try {
          const page = activePage = await context.newPage(), errors = []
          page.on('pageerror', error => { if (!error.message.includes('packed fixture: measurement')) errors.push(error.message) })
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
          await check(`${label}: SSR hydration and all installed enhancements execute`, async () => {
            await page.goto(url)
            // Interval polling: Playwright's default raf poller books a frame
            // through the instrumented requestAnimationFrame while the fixture
            // is still capturing its baseline, and wins that race often enough.
            await page.waitForFunction(() => window.packedMounted === 1, null, { polling: 100 })
            assert.equal(await page.evaluate(() => window.packedBaseline.frames), 0, 'the empty-route baseline must be quiescent, or a leaked frame after unmount reads as baseline')
            assert.deepEqual(await page.evaluate(() => window.packedHydrationErrors), [])
            await sectionMotion(page)
            await crossfade(page, failed)
            await crossfade(page, healthy)
            await kitWorks(page)
          })
          await check(`${label}: failure becomes reachable while sibling Section and kit remain healthy`, async () => {
            await pin(page, failed, 0)
            await page.evaluate(() => window.packed.fail())
            await page.waitForFunction(sel => document.querySelector(sel).hasAttribute('data-sv-off'), failed)
            await page.evaluate(() => window.packed.restore())
            await staticShots(page, failed)
            assert.equal(await page.evaluate(() => window.packedFaults.length), 1, 'fault must actually execute and report once')
            await crossfade(page, healthy)
            await kitWorks(page)
          })
          for (const mode of ['page', 'OS']) {
            await check(`${label}: live ${mode} reduced motion matches no-JS layout and keyboard reachability`, async () => {
              if (mode === 'page') await page.evaluate(() => window.packed.SV.setMotion('reduce'))
              else await page.emulateMedia({ reducedMotion: 'reduce' })
              await settle(page)
              await fallback(page)
              assert.deepEqual(await page.evaluate(shape), noJsShape)
              assert(await page.locator('.st-dots i').evaluateAll(dots => dots.length === 6 && dots.every(el =>
                getComputedStyle(el).opacity === '1' && getComputedStyle(el).scale === 'none')), 'reduced-motion dots must reset')
              if (mode === 'page') await page.evaluate(() => window.packed.SV.setMotion('auto'))
              else await page.emulateMedia({ reducedMotion: 'no-preference' })
              await crossfade(page, healthy)
              await staticShots(page, failed)
            })
          }
          await check(`${label}: independent page style is untouched`, async () => assert.deepEqual(await page.evaluate(isolation), independent))
          for (const fault of ['read', 'write']) {
            await check(`${label}: later controller ${fault} failure settles locally and remount retries`, async () => {
              await page.evaluate(() => { window.packed.unmount(); window.packed.mount() })
              await crossfade(page, failed)
              await pin(page, failed, 0)
              await page.waitForFunction(sel => !document.querySelector(sel + ' .st-shot').inert, failed)
              const before = await page.evaluate(() => window.packedControllerReports.length)
              assert.deepEqual(await page.evaluate(kind => window.packedControllerFault(kind), fault), { injected: true, disconnected: true })
              await staticShots(page, failed)
              assert(await page.locator(failed + ' .sv-stage').evaluate(el => getComputedStyle(el).position === 'static' && el.scrollHeight <= el.clientHeight + 1))
              await page.evaluate(() => {
                window.packedQueuedController()
                window.packed.SV.setMotion('reduce'); window.packed.SV.setMotion('auto')
                window.packed.SV.refresh()
                window.packed.rerender()
              })
              await staticShots(page, failed)
              assert.equal(await page.evaluate(() => window.packedControllerReports.length), before + 1)
              await crossfade(page, healthy)
              await kitWorks(page)
              await page.evaluate(() => { window.packed.unmount(); window.packed.mount() })
              await crossfade(page, failed)
            })
          }
          for (let cycle = 1; cycle <= 2; cycle++) {
            await check(`${label}: route replacement ${cycle} returns resources to baseline and remounts`, async () => {
              await page.evaluate(() => window.packed.unmount())
              await settle(page)
              // Interval polling, never rAF: Playwright's default raf polling books a
              // frame through the instrumented requestAnimationFrame, so the count
              // reads baseline plus one for as long as the predicate is polled.
              // Polled from here, never through waitForFunction: Playwright's
              // in-page poller changes the very resources this compares.
              const deadline = Date.now() + 5000
              let snapshot
              for (;;) {
                snapshot = await page.evaluate(() => ({ baseline: window.packedBaseline, actual: window.packedResources() }))
                if (JSON.stringify(snapshot.actual) === JSON.stringify(snapshot.baseline)) break
                if (Date.now() > deadline) {
                  // multiset diff: a duplicate signature (one more window:resize:false
                  // than the baseline had) is a leak that a set difference hides
                  const diff = (a, b) => {
                    const count = list => list.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map())
                    const before = count(a), after = count(b), extra = [], missing = []
                    for (const [x, n] of after) if (n > (before.get(x) || 0)) extra.push(`${x} x${n - (before.get(x) || 0)}`)
                    for (const [x, n] of before) if (n > (after.get(x) || 0)) missing.push(`${x} x${n - (after.get(x) || 0)}`)
                    return { extra, missing }
                  }
                  throw Error(`resources did not return to baseline: listeners ${JSON.stringify(diff(snapshot.baseline.listeners, snapshot.actual.listeners))}, observers ${JSON.stringify(diff(snapshot.baseline.observers, snapshot.actual.observers))}, frames ${snapshot.baseline.frames} -> ${snapshot.actual.frames}`)
                }
                await new Promise(resolve => setTimeout(resolve, 100))
              }
              assert.equal(await page.locator('#app > *').count(), 0, 'React root really unmounted')
              const mounts = await page.evaluate(() => window.packedMounted)
              await page.evaluate(() => window.packed.mount())
              await page.waitForFunction(n => window.packedMounted === n + 1, mounts)
              await crossfade(page, failed)
              await crossfade(page, healthy)
              await kitWorks(page)
              assert.deepEqual(await page.evaluate(isolation), independent)
            })
          }
          await check(`${label}: no unexpected errors or hydration recovery`, async () => {
            assert.deepEqual(errors, [])
            assert.deepEqual(await page.evaluate(() => window.packedHydrationErrors), [])
            assert.equal(await page.evaluate(() => window.packedFaults.length), 1, 'failed lease must not report again after replacement')
          })
        } finally { await context.close() }
        await runContentChecks({ browser, label, url, check, diagnose })
      } finally { await browser.close() }
    }
  } finally { for (const send of held) send(); await new Promise(resolve => server.close(resolve)) }
}
