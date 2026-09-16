// Real generated pages, three engines. Run after npm run demo:sync.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chromium, firefox, webkit } from 'playwright'
import { snapshotRender, compareRender, rendersMoved, describeMismatch } from './render-equivalence.mjs'
const SCOPED_CSS = await readFile(fileURLToPath(new URL('../../../styles/scoped.css', import.meta.url)), 'utf8')
// Use the same CLI installation builder as the isolated gate, with actual
// hydration instead of its static-preview attach script. Fail on a missing
// React major; never silently omit half of the acceptance matrix.
execFileSync(process.execPath, [fileURLToPath(new URL('../../../scripts/react18-install.mjs', import.meta.url))], { stdio: 'inherit' })
const failures = new Map()
for (const major of [19, 18]) {
  const args = major === 18 ? ['--import', fileURLToPath(new URL('../../../scripts/react18-register.mjs', import.meta.url))] : []
  const payload = JSON.parse(execFileSync(process.execPath, [...args, fileURLToPath(new URL('./render-installed.mjs', import.meta.url)), '--enhancement-failure'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))
  assert.equal(Number(payload.react.split('.')[0]), major)
  failures.set(String(major), payload.effects[0])
}
const failureTemplate = await readFile(new URL('./fixtures/enhancement-failure.html', import.meta.url), 'utf8')
const failureStyles = (await Promise.all(['pin', 'core'].map(part => readFile(new URL(`../../../styles/${part}.css`, import.meta.url), 'utf8')))).join('\n')
for (const fixture of failures.values()) assert.deepEqual(fixture.styles, ['pin'], 'StickySteps declares pin.css; the entrance probes additionally declare core.css')
const substitute = (text, marker, value) => {
  assert.equal(text.split(marker).length, 2, `fixture marker must occur once: ${marker}`)
  return text.replace(marker, () => value)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname
    if (['/failure.html', '/failure-client.js', '/failure-styles.css'].includes(path)) {
      const fixture = failures.get(url.searchParams.get('react') || '19')
      assert(fixture)
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'nonce-sv-fixture'; style-src 'nonce-sv-fixture' 'self'; style-src-attr 'unsafe-inline'; img-src data:; base-uri 'none'")
      res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html')
      if (path === '/failure-client.js') return res.end(fixture.script)
      if (path === '/failure-styles.css') return res.end(failureStyles)
      let html = substitute(failureTemplate, '<!-- DECLARED_STYLES -->', url.searchParams.get('case') === 'missing-css'
        ? '' : '<link rel="stylesheet" href="/failure-styles.css">')
      html = substitute(html, '<!-- APP_MARKUP -->', url.searchParams.get('case') === 'empty' ? fixture.emptyMarkup : fixture.markup)
      if (url.searchParams.get('case') === 'empty') {
        assert.equal((html.match(/ data-sv>/g) || []).length, 2)
        html = html.replace(/ data-sv>/g, '>')
      }
      return res.end(html)
    }
    if (path !== '/index.html' && !/^\/(fx|bench)\/[\w.-]+$/.test(path)) throw Error('not found')
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

async function staticShots(page, label) {
  await page.waitForFunction(() => [...document.querySelectorAll('.st-shot')].every(el =>
    !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true' &&
    getComputedStyle(el).position !== 'absolute' && +getComputedStyle(el).opacity === 1))
  const shots = page.locator('.st-shot a')
  assert.equal(await shots.count(), 3, `${label}: all media is present`)
  for (const link of await shots.all()) {
    await link.scrollIntoViewIfNeeded()
    const visible = await link.evaluate(el => {
      const rect = el.getBoundingClientRect()
      const x = (Math.max(0, rect.left) + Math.min(innerWidth, rect.right)) / 2
      const y = (Math.max(0, rect.top) + Math.min(innerHeight, rect.bottom)) / 2
      const hit = document.elementFromPoint(x, y)
      return rect.width > 0 && rect.height > 0 && !!hit && (el === hit || el.contains(hit))
    })
    assert(visible, `${label}: media is not clipped or covered`)
  }
  // Actual keyboard navigation, not just an inert attribute inspection.
  await shots.first().focus()
  for (let i = 1; i < 3; i++) {
    await page.keyboard.press('Tab')
    assert(await shots.nth(i).evaluate(el => document.activeElement === el), `${label}: Tab reaches media ${i + 1}`)
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: no horizontal overflow`)
}

async function readableEntrances(page, label) {
  for (const el of await page.locator('#scan-first .sv-rise, #scan-last .sv-rise').all()) {
    // center, not "if needed": when the failed StickySteps keeps no pin
    // height the page is short and the probe already touches the bottom
    // edge, below the live band, so it would never go live (lead, lifecycle 1)
    await el.evaluate(node => node.scrollIntoView({ block: 'center' }))
    await page.waitForFunction(id => {
      const el = document.querySelector('#' + id + ' .sv-rise')
      const css = getComputedStyle(el)
      return +css.opacity === 1 && css.visibility === 'visible' && el.getBoundingClientRect().height > 0
    }, await el.evaluate(node => node.parentElement.id))
  }
  assert.equal(await page.locator('#probes [inert], #probes [aria-hidden="true"]').count(), 0, `${label}: static copy remains accessible`)
}

async function workingCrossfade(page, label) {
  await page.waitForFunction(() => document.querySelectorAll('.st-shot[inert][aria-hidden="true"]').length === 2)
  assert(await page.locator('.sv-steps').evaluate(el => {
    const stage = el.querySelector('.sv-stage'), fit = el.querySelector('[data-sv-fit]')
    return stepsStatuses[stepsStatuses.length - 1] === 'active' &&
      !el.hasAttribute('data-sv-flow') && getComputedStyle(stage).position === 'sticky' &&
      Math.max(fit.offsetHeight, fit.scrollHeight) <= stage.clientHeight + 1 &&
      [...el.querySelectorAll('.st-shot')].every(shot => getComputedStyle(shot).position === 'absolute')
  }), `${label}: inaccessible shots require an active lease, fitting content and applied crossfade CSS`)
}

async function enhancementFailures(browser, name) {
  for (const major of [19, 18]) for (const width of [1400, 320]) {
    for (const mode of ['no-js', 'blocked', 'delayed', 'ro-missing', 'ro-constructor', 'ro-observe', 'attach', 'later-attach', 'io-missing', 'io-constructor', 'io-observe', 'scan-observer', 'steps-mo-missing', 'steps-mo-constructor', 'steps-mo-first', 'steps-mo-second', 'empty', 'normal', 'reduced', 'missing-css', 'oversized', 'steps-runtime', 'steps-release']) {
      const label = `${name} React ${major} ${width} ${mode}`
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: mode !== 'no-js', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })
      const page = await context.newPage()
      const unexpected = []
      page.on('pageerror', error => { if (!error.message.includes('fixture failure')) unexpected.push(error.message) })
      try {
        await page.goto(`${base}../failure.html?react=${major}&case=${mode}`)
        if (mode === 'no-js') {
          await staticShots(page, label)
          await readableEntrances(page, label)
          continue
        }
        if (['blocked', 'delayed'].includes(mode)) {
          assert(await page.locator('.st-shot').evaluateAll(els => els.every(el => getComputedStyle(el).position === 'static')), `${label}: SSR stays static during prepaint`)
          await page.waitForFunction(() => window.__scrollvars === 'released')
          await staticShots(page, label + ' after watchdog')
          await readableEntrances(page, label)
          if (mode === 'delayed') {
            await page.waitForFunction(() => window.failureHydrated)
            await page.evaluate(() => { failureControl.remount(); failureControl.SV.scan() })
            await settle(page)
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('sv-on')), false, `${label}: late remount cannot hide again`)
            await staticShots(page, label + ' after late hydration')
            assert.equal(await page.locator('.sv-steps').evaluate(el => el.style.height), '', `${label}: terminal attachment cannot leave an empty pin stretch`)
          }
          continue
        }
        await page.waitForFunction(() => window.failureHydrated)
        if (mode === 'missing-css' || mode === 'oversized') {
          await page.waitForFunction(() => stepsStatuses.includes('active'))
          await staticShots(page, label)
          assert.equal(await page.locator('.sv-steps.st-ready').count(), 0, `${label}: driver readiness alone cannot enable crossfade`)
          if (mode === 'oversized') {
            assert(await page.locator('.sv-steps').evaluate(el => el.hasAttribute('data-sv-flow')), `${label}: initial overflow latches flow`)
            await page.evaluate(() => document.documentElement.removeAttribute('data-fixture'))
            await page.evaluate(() => failureControl.SV.refresh())
            await settle(page)
            assert(await page.locator('.sv-steps').evaluate(el => el.hasAttribute('data-sv-flow')), `${label}: shrinking content cannot silently re-pin`)
            await staticShots(page, label + ' smaller content')
          }
          assert.deepEqual(await page.evaluate(() => stepsStatuses), ['attaching', 'active'])
          continue
        }
        if (mode.startsWith('steps-mo-')) {
          await staticShots(page, label)
          assert.deepEqual(await page.evaluate(() => [stepsSubscriptions, stepsObservers, failureErrors.length]), [0, 0, 0], `${label}: failed acquisition leaves no resources or escaped effect error`)
          await page.evaluate(() => failureControl.SV.setMotion('reduce'))
          await page.evaluate(() => failureControl.SV.setMotion('auto'))
          await staticShots(page, label + ' motion reversal')
          await page.evaluate(() => failureControl.remount())
          await settle(page)
          await staticShots(page, label + ' remount')
          assert.deepEqual(await page.evaluate(() => [stepsSubscriptions, stepsObservers, failureErrors.length]), [0, 0, 0])
          continue
        }
        if (['ro-missing', 'ro-constructor', 'ro-observe', 'attach', 'reduced'].includes(mode)) {
          await staticShots(page, label)
          await readableEntrances(page, label)
          if (mode !== 'reduced') {
            // Retry before the three-second watchdog expires. Recoverable
            // attachment failure is distinct from terminal boot expiry.
            const terminal = await page.evaluate(() => window.__scrollvars === 'released')
            await page.evaluate(() => { restoreObservers(); failureControl.remount(); failureControl.SV.scan() })
            if (terminal) await staticShots(page, label + ' terminal retry')
            else await page.waitForFunction(() => document.querySelector('.sv-steps').style.getPropertyValue('--sv-scene') !== '')
          }
          continue
        }
        if (mode === 'empty') {
          assert.equal(await page.locator('.sv-steps').count(), 0)
          assert.equal(await page.evaluate(() => window.__scrollvars), true, `${label}: empty scan acknowledges readiness`)
          await page.evaluate(() => {
            const late = document.createElement('section')
            late.id = 'empty-late'; late.setAttribute('data-sv', ''); late.textContent = 'Populated route'
            document.body.appendChild(late)
            failureControl.show(true)
          })
          await page.waitForFunction(() => document.getElementById('empty-late').classList.contains('sv'))
        }
        if (mode === 'scan-observer' || mode === 'later-attach') {
          assert(await page.locator('#scan-first').evaluate(el => el.hasAttribute('data-sv-off')), `${label}: partial scan released`)
          assert(await page.locator('#scan-last').evaluate(el => el.hasAttribute('data-sv-off')), `${label}: last element is static too`)
          await readableEntrances(page, label)
          await page.evaluate(() => { restoreObservers(); window.retryScan = failureControl.SV.scan() })
          assert(await page.locator('#scan-last').evaluate(el => !el.hasAttribute('data-sv-off')), `${label}: explicit retry acquired content`)
        }
        await page.waitForFunction(() => document.querySelector('.sv-steps')?.style.getPropertyValue('--sv-scene') !== '')
        if (width === 1400) {
          await workingCrossfade(page, label)
          assert.equal(await page.locator('.st-shot').first().evaluate(el => getComputedStyle(el).position), 'absolute', `${label}: successful tracker actually crossfades`)
          await pin(page, '.sv-steps', 1)
          await page.waitForFunction(() => {
            const last = document.querySelector('.st-shot:last-child')
            return !last.hasAttribute('inert') && last.getAttribute('aria-hidden') !== 'true' && +getComputedStyle(last).opacity > .99
          })
          assert(await page.locator('.st-shot').first().evaluate(el => +getComputedStyle(el).opacity < .01), `${label}: scene navigation changes rendered media`)
        }
        if (mode === 'steps-runtime' || mode === 'steps-release') {
          assert.deepEqual(await page.evaluate(() => stepsStatuses), ['attaching', 'active'])
          await page.evaluate(mode => {
            const el = document.querySelector('.sv-steps'), { SV } = failureControl
            if (mode === 'steps-runtime') {
              el.getBoundingClientRect = () => { throw Error('fixture failure: steps measure') }
              SV.refresh()
            } else {
              // Replacing the installed lease must release its accessibility
              // restrictions even when a successor successfully tracks the node.
              window.stopReplacement = SV.track(el)
            }
          }, mode)
          const terminal = mode === 'steps-runtime' ? 'failed' : 'released'
          await page.waitForFunction(s => stepsStatuses.includes(s), terminal)
          if (mode === 'steps-runtime') await page.evaluate(() => delete document.querySelector('.sv-steps').getBoundingClientRect)
          await staticShots(page, label + ' terminal status')
          await page.evaluate(() => { failureControl.SV.refresh(); window.stopReplacement?.(); window.stopReplacement?.() })
          await settle(page)
          assert.deepEqual(await page.evaluate(() => stepsStatuses), ['attaching', 'active', terminal], `${label}: no later status from the old lease`)
          await page.evaluate(() => failureControl.remount())
          await page.waitForFunction(() => stepsStatuses.filter(s => s === 'active').length === 2)
          if (width === 1400) await workingCrossfade(page, label + ' explicit remount')
          continue
        }
        if (mode !== 'normal') continue

        if (width === 1400) {
          await page.locator('.sv-steps').evaluate(el => { el.className = 'sv-steps sv authored-class' })
          await workingCrossfade(page, label + ' authored class rewrite')
          await page.evaluate(() => { failureControl.SV.setMotion('reduce'); failureControl.SV.setMotion('auto') })
          await workingCrossfade(page, label + ' batched motion reversal')
        }

        // The live page switch and OS switch must each agree with layout and
        // keyboard reachability. The raw scene clock may continue to scrub.
        await page.evaluate(() => failureControl.SV.setMotion('reduce'))
        await staticShots(page, label + ' page reduction')
        await page.evaluate(() => failureControl.SV.setMotion('auto'))
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await staticShots(page, label + ' OS reduction')
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        if (width === 1400) await workingCrossfade(page, label + ' motion reversal')
        assert.deepEqual(await page.evaluate(() => stepsStatuses), ['attaching', 'active'], `${label}: motion reversal keeps the same lease`)

        // Failure during a later frame must not prevent the next sibling's
        // callback, or leave the failed pin's authored geometry overwritten.
        await page.evaluate(() => {
          const { SV } = failureControl
          const bad = document.getElementById('runtime'), good = document.getElementById('healthy')
          bad.style.setProperty('height', '123px', 'important')
          window.healthyFrames = 0
          window.stopBad = SV.track(bad, { root: document.documentElement, pin: '300vh', onPin() { throw Error('fixture failure: onPin') } })
          window.stopGood = SV.track(good, { root: document.documentElement, onTravel() { healthyFrames++ } })
        })
        await page.waitForFunction(() => healthyFrames > 0 && document.getElementById('runtime').hasAttribute('data-sv-off'))
        assert.deepEqual(await page.locator('#runtime').evaluate(el => [el.style.height, el.style.getPropertyPriority('height')]), ['123px', 'important'], `${label}: failed pin restores authored geometry`)
        await page.evaluate(() => failureControl.SV.refresh())
        await settle(page)
        assert.equal(await page.evaluate(() => failureErrors.filter(s => s.includes('onPin')).length), 1, `${label}: failing callback reported once`)
        await page.evaluate(() => { stopBad(); stopGood() })

        // Scanner leases overlap. Releasing an inner scan cannot release the
        // Boot-owned nodes, and a completed stop is harmless after a retry.
        await page.evaluate(() => {
          const { SV } = failureControl, root = document.getElementById('probes')
          const stop = SV.scan(root); stop(); stop()
        })
        assert(await page.locator('#scan-first').evaluate(el => !el.hasAttribute('data-sv-off')), `${label}: overlap preserves Boot ownership`)

        // Replacing the React component releases the old generation; only the
        // current instance may publish layout and accessibility restrictions.
        await page.evaluate(() => failureControl.show(false))
        await page.waitForFunction(() => !document.querySelector('.sv-steps'))
        await page.evaluate(() => failureControl.show(true))
        await page.waitForFunction(() => document.querySelector('.sv-steps')?.style.getPropertyValue('--sv-scene') !== '')

        // Real CMS overflow must release both pin height and hidden media.
        await page.locator('.st-steps').evaluate(el => { el.style.minHeight = '1400px' })
        await page.evaluate(() => failureControl.SV.refresh())
        await page.waitForFunction(() => document.querySelector('.sv-steps').hasAttribute('data-sv-flow'))
        await staticShots(page, label + ' fit overflow')
        assert.equal(await page.locator('.sv-steps').evaluate(el => el.style.height), '', `${label}: fit fallback restores wrapper height`)
      } finally {
        await context.close()
        assert.deepEqual(unexpected, [], `${label}: no unexpected runtime errors`)
      }
    }
    console.log(`ok ${name}: enhancement failure, React ${major}, ${width}px, nonce CSP, actual Boot and installed StickySteps`)
  }
}

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
      await enhancementFailures(browser, name)
      // styles/scoped.css in every engine: it must never change what a page
      // renders, whether the engine registers the clocks (Chrome 85+, Safari
      // 16.4+, Firefox 128+, all behind @supports selector(:has(a))) or
      // ignores the sheet. The gate in e2e-invariants runs in Chrome only;
      // this is the same comparison in the other two, and it reports whether
      // the registration took, so the support matrix is measured, not read.
      {
        const shot = async css => {
          const context = await browser.newContext()
          const page = await context.newPage()
          await page.setViewportSize({ width: 1400, height: 900 })
          await page.goto(base + '../fx/sticky-steps.html')
          await page.waitForFunction(() => document.documentElement.classList.contains('sv-on'))
          let registered = null
          if (css) registered = await page.evaluate(text => {
            const style = document.createElement('style')
            style.textContent = text
            document.head.append(style)
            return getComputedStyle(document.documentElement).getPropertyValue('--sv-t').trim() === '0'
          }, css)
          const result = await snapshotRender(page)
          await context.close()
          return { result, registered }
        }
        const plain = await shot()
        assert(rendersMoved(plain.result), `${name} scoped.css: the page did not animate between scroll positions, the check proves nothing`)
        const scoped = await shot(SCOPED_CSS)
        const cmp = compareRender(plain.result, scoped.result)
        assert(cmp.ok, `${name} scoped.css: ${describeMismatch('scoped.css', cmp)}`)
        console.log(`${name} scoped.css: renders the same (${cmp.compared} settled elements compared), registration ${scoped.registered ? 'took' : 'ignored, the sheet is inert here'}`)
      }
      const staticContext = await browser.newContext({ javaScriptEnabled: false })
      const staticPage = await staticContext.newPage()
      for (const width of [1400, 390]) {
        await staticPage.setViewportSize({ width, height: 900 })
        await staticPage.goto(base + '../index.html')
        const hidden = await staticPage.locator('main h1, main h2, .demo-head p').evaluateAll(elements => elements.filter(el => {
          for (let node = el; node; node = node.parentElement) {
            const css = getComputedStyle(node)
            if (css.display === 'none' || css.visibility === 'hidden' || +css.opacity === 0) return true
          }
          return false
        }).map(el => el.textContent.trim()))
        assert.deepEqual(hidden, [], `${name} homepage no-JS ${width}: hidden copy`)
        // Check real text pixels after scrolling: opacity alone misses clipped
        // galleries, overlapping decks, offscreen rails and curtain occlusion.
        const targets = staticPage.locator('main h1, main h2, .pgal-card .lbl, .hcar-card, .deck-card h3, .curtain-reveal .big, .tour-panel h3, .map-station h3, .type-letter i, .collage-item.co-card, .spread-cards > div, .acts-stage h3, .acts-chips span, .acts-tag, .face .big')
        assert(await targets.count() > 40)
        for (const target of await targets.all()) {
          await target.scrollIntoViewIfNeeded()
          const result = await target.evaluate(el => {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
            let text
            while ((text = walker.nextNode()) && !text.textContent.trim()) {}
            const range = document.createRange()
            range.selectNodeContents(text)
            const rect = range.getClientRects()[0]
            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
            let visible = true
            for (let node = el; node; node = node.parentElement) {
              const css = getComputedStyle(node)
              if (+css.opacity === 0 || css.visibility === 'hidden' || css.display === 'none') visible = false
            }
            return { text: el.textContent.trim(), visible, hit: !!hit && el.contains(hit), fits: rect.left >= -2 && rect.right <= innerWidth + 2 }
          })
          assert(result.visible && result.hit && result.fits, `${name} homepage no-JS ${width}: ${JSON.stringify(result)}`)
        }
        // Native scrolling remains available even when the click/drag driver
        // never attaches, including the normally page-driven horizontal rail.
        for (const selector of ['#slider-rail', '#slider-demo', '#snapcar', '#wingal-slider', '#wheel-slider']) {
          const rail = staticPage.locator(selector)
          const vertical = selector === '#wheel-slider'
          await rail.scrollIntoViewIfNeeded()
          await rail.focus()
          // WebKit consumes the first arrow after programmatic focus even in
          // a bare native overflow div; the next arrow must scroll it.
          await staticPage.keyboard.press(vertical ? 'ArrowDown' : 'ArrowRight')
          await staticPage.waitForTimeout(100)
          await staticPage.keyboard.press(vertical ? 'ArrowDown' : 'ArrowRight')
          await staticPage.waitForTimeout(300)
          assert(await rail.evaluate((el, y) => (y ? el.scrollTop : el.scrollLeft) > 0, vertical), `${name}: no-JS ${selector} responds to the keyboard`)
          const end = await rail.evaluate((el, y) => {
            if (y) el.scrollTop = el.scrollHeight
            else el.scrollLeft = el.scrollWidth
            const last = el.lastElementChild.getBoundingClientRect(), box = el.getBoundingClientRect()
            return y ? last.top >= box.top - 2 && last.bottom <= box.bottom + 2 : last.left >= box.left - 2 && last.right <= box.right + 2
          }, vertical)
          assert(end, `${name}: no-JS ${selector} last card is reachable`)
        }
      }
      await staticContext.close()
      console.log(`ok ${name}: homepage no-JS text, card occlusion, mobile flow and keyboard rail`)
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(base + '../index.html')
      assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--sv-page')), '', `${name}: homepage must opt out before tracking`)
      for (const progress of [.25, .75, 1]) {
        const states = await page.evaluate(async p => {
          const el = document.getElementById('hcar-demo')
          scrollTo(0, scrollY + el.getBoundingClientRect().top + p * (el.offsetHeight - innerHeight))
          const states = []
          for (const enabled of [false, true]) {
            SV.setPageOutputs(enabled)
            await new Promise(r => setTimeout(r, 180)) // includes the throttled HUD
            const last = el.querySelector('.hcar-card:last-child').getBoundingClientRect()
            states.push({
              pin: el.style.getPropertyValue('--sv-pin'), travel: el.style.getPropertyValue('--sv-t'),
              translate: getComputedStyle(el.querySelector('.hcar-track')).translate,
              hud: document.getElementById('hud-pin').textContent,
              lastLeft: last.left, lastRight: last.right,
            })
          }
          SV.setPageOutputs(false)
          return states
        }, progress)
        assert.deepEqual(states[0], states[1], `${name}: homepage local motion/HUD must match with either page-output setting`)
        assert(Math.abs(+states[0].pin - progress) < .002, `${name}: homepage pin reaches ${progress}`)
        if (progress === 1) assert(states[0].lastLeft >= -2 && states[0].lastRight <= 1402, `${name}: homepage rail endpoint`)
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(await page.locator('.hcar-track').evaluate(el => getComputedStyle(el).translate), 'none', `${name}: homepage reduced-motion rail`)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      console.log(`ok ${name}: homepage opt-out preserves pin, travel, rail geometry, HUD and reduced motion`)
      await page.goto(base + 'horizontal-rail.html')
      const interactions = await page.evaluate(async () => {
        document.body.innerHTML = `<style>
          .test-rail { display:flex; gap:0; width:300px; overflow:auto; scroll-snap-type:x mandatory; }
          .test-rail > div { flex:0 0 300px; height:100px; scroll-snap-align:center; }
          #root { width:400px; height:500px; overflow:auto; container-type:inline-size; }
          #pin { height:1500px; } #pin .sv-stage { height:500px; top:40px; }
          @container (min-width:500px) { #pin .sv-stage { top:80px; } }
        </style><div id="outer" class="test-rail"><div><div id="inner" class="test-rail"><div>A</div><div>B</div><div>C</div></div></div><div>D</div><div>E</div></div>
        <div id="root"><div id="pin"><div class="sv-stage">Pinned</div></div></div>`
        const outer = document.getElementById('outer'), inner = document.getElementById('inner')
        const a = SV.slider(outer, { duration:0 }), b = SV.slider(inner, { duration:0 })
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        const pointer = (target, type, x) => target.dispatchEvent(new PointerEvent(type, { bubbles:true, cancelable:true, pointerType:'mouse', button:0, clientX:x }))
        pointer(inner.firstElementChild, 'pointerdown', 250)
        pointer(window, 'pointermove', 230)
        pointer(window, 'pointermove', 10)
        // No frame between final movement and release: cached active is stale.
        pointer(window, 'pointerup', 10)
        const release = { outer:outer.scrollLeft, inner:inner.scrollLeft }
        inner.dispatchEvent(new WheelEvent('wheel', { bubbles:true, deltaX:30 }))
        const wheel = { outer:outer.style.scrollSnapType, inner:inner.style.scrollSnapType }
        a.destroy(); b.destroy()
        const root = document.getElementById('root'), el = document.getElementById('pin')
        window.stopTestPin = SV.track(el, { root, pin:true })
        root.scrollTop = 200
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        root.style.width = '600px'
        return { release, wheel }
      })
      assert.equal(interactions.release.outer, 0, `${name}: outer slider stole inner drag`)
      assert.equal(interactions.release.inner, 300, `${name}: release used stale active slide`)
      assert.notEqual(interactions.wheel.outer, 'none', `${name}: outer slider stole inner wheel`)
      assert.equal(interactions.wheel.inner, 'none')
      await page.waitForFunction(() => {
        const root = document.getElementById('root'), el = document.getElementById('pin')
        const stage = el.firstElementChild
        const top = parseFloat(getComputedStyle(stage).top)
        // the stretch ends when the wrapper's bottom meets the stage's border
        // box, so the span is wrapper minus stage (round 10), whatever the
        // stage's height is relative to the root: here 500px inside a 500px root
        const expected = (top - el.getBoundingClientRect().top + root.getBoundingClientRect().top) / (el.offsetHeight - stage.offsetHeight)
        return top === 80 && Math.abs(+el.style.getPropertyValue('--sv-pin') - expected) < .001
      })
      await page.evaluate(() => window.stopTestPin())
      console.log(`ok ${name}: nested gestures, same-frame release, container-query pin offset`)
      const edgeGlides = await page.evaluate(async () => {
        const results = []
        for (const mode of ['ltr', 'rtl', 'y']) {
          document.body.innerHTML = `<style>#rail{display:flex;position:relative;width:300px;height:300px;overflow:auto;${mode === 'y' ? 'flex-direction:column' : 'direction:' + mode}}#rail>div{flex:0 0 200px}</style><div id="rail"><div>A</div><div>B</div><div>C</div><div>D</div><div>E</div></div>`
          const rail = document.getElementById('rail'), states = [], writes = []
          const property = mode === 'y' ? 'scrollTop' : 'scrollLeft'
          const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, property)
          Object.defineProperty(rail, property, {
            get() { return descriptor.get.call(this) },
            set(value) { writes.push(mode === 'rtl' ? -value : value); descriptor.set.call(this, value) },
          })
          const handle = SV.slider(rail, { axis:mode === 'y' ? 'y' : 'x', duration:250, onScroll:state => states.push(state) })
          const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
          await settle()
          const reported = []
          for (const index of [4, 0]) {
            handle.goTo(index)
            for (let i = 0; i < 90 && handle.state().gliding; i++) await new Promise(requestAnimationFrame)
            await settle()
            reported.push(states.at(-1).gliding)
          }
          const length = mode === 'y' ? rail.scrollHeight - rail.clientHeight : rail.scrollWidth - rail.clientWidth
          results.push({ mode, reported, outside:writes.filter(p => p < 0 || p > length).length })
          handle.destroy()
        }
        return results
      })
      for (const result of edgeGlides) {
        assert.equal(result.outside, 0, `${name}: ${result.mode} glide writes beyond the scrollable range`)
        assert.deepEqual(result.reported, [false, false], `${name}: ${result.mode} final callback still reports gliding`)
      }
      console.log(`ok ${name}: slider edge glides stay in range and report completion in LTR/RTL/vertical`)
      const changingGlides = await page.evaluate(async () => {
        const results = []
        for (const change of ['resize', 'remove', 'empty']) {
          document.body.innerHTML = '<style>#rail{display:flex;position:relative;width:300px;overflow:auto}#rail>div{flex:0 0 200px;height:100px}</style><div id="rail"><div>A</div><div>B</div><div>C</div><div>D</div><div>E</div></div>'
          const rail = document.getElementById('rail'), writes = [], states = []
          const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft')
          Object.defineProperty(rail, 'scrollLeft', {
            get() { return descriptor.get.call(this) },
            set(value) { writes.push({ value, max:this.scrollWidth - this.clientWidth }); descriptor.set.call(this, value) },
          })
          const handle = SV.slider(rail, { duration:600, onScroll:state => states.push(state) })
          const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
          await settle()
          handle.goTo(4)
          for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame)
          if (change === 'resize') rail.style.width = '700px'
          else if (change === 'empty') rail.replaceChildren()
          else { rail.lastElementChild.remove(); rail.lastElementChild.remove() }
          await settle() // ResizeObserver/MutationObserver have delivered the change.
          writes.length = 0
          for (let i = 0; i < 90 && handle.state().gliding; i++) await new Promise(requestAnimationFrame)
          await settle()
          results.push({ change, outside:writes.filter(w => w.value < 0 || w.value > w.max).length,
            gliding:handle.state().gliding, reported:states.at(-1).gliding, count:handle.state().count })
          handle.destroy()
        }
        return results
      })
      for (const result of changingGlides) {
        assert.equal(result.outside, 0, `${name}: ${result.change} kept an unreachable glide destination`)
        assert.equal(result.gliding, false)
        assert.equal(result.reported, false)
        assert.equal(result.count, result.change === 'empty' ? 0 : result.change === 'remove' ? 3 : 5)
      }
      console.log(`ok ${name}: resize, removed destination and empty rail interrupt stale glide geometry`)
      for (const guarded of [false, true]) {
        await page.goto(base + `../bench/slider-seek.html?count=120&norun=1${guarded ? '&guarded=1' : ''}`)
        const seek = await page.evaluate(async () => {
          stopSliderDriver()
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
          const rail = document.getElementById('rail')
          let mutations = 0
          const observer = new MutationObserver(records => { mutations += records.length })
          observer.observe(rail, { attributes:true, attributeFilter:['class'] })
          for (let i = 0; i < 100; i++) sliderHandle.seek(i / 99)
          await Promise.resolve(); observer.disconnect()
          rail.classList.add('sv-gliding') // an external class rewrite must still be repaired
          sliderHandle.seek(0)
          const repaired = !rail.classList.contains('sv-gliding')
          sliderHandle.goTo(100)
          const started = sliderHandle.state().gliding
          sliderHandle.seek(.25)
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
          const stopped = !sliderHandle.state().gliding && !rail.classList.contains('sv-gliding')
          const progress = sliderHandle.state().progress, position = rail.scrollLeft
          sliderHandle.destroy(); sliderHandle.seek(.8)
          return { mutations, repaired, started, stopped, progress, released:rail.scrollLeft === position }
        })
        assert.equal(seek.mutations, guarded ? 0 : 100, `${name}: seek class mutations`)
        assert(seek.repaired && seek.started && seek.stopped && seek.released, `${name}: guarded=${guarded}: ${JSON.stringify(seek)}`)
        assert(Math.abs(seek.progress - .25) < .001)
      }
      console.log(`ok ${name}: seek guard removes only redundant mutations; repair, interruption and destroy remain intact`)
      for (const api of [false, true])
      for (const count of [15, 120]) {
        const variants = []
        for (const off of [false, true]) {
          await page.goto(base + `../bench/slider-seek.html?count=${count}&plain=1&norun=1${api ? '&api=1' : ''}${off ? '&outputs=off' : ''}`)
          await page.evaluate(() => stopSliderDriver())
          await settle(page)
          const samples = []
          for (const progress of [0, .2, .5, 1, .2]) {
            await page.evaluate(p => sliderHandle.seek(p), progress)
            await settle(page)
            const sample = await page.locator('#rail').evaluate(rail => ({
              state:sliderHandle.state(), callback:sliderLastState, activeCallback:sliderActive,
              active:[...rail.children].findIndex(el => el.classList.contains('sv-active')),
              left:rail.scrollLeft, width:rail.scrollWidth, scale:getComputedStyle(rail.firstElementChild).scale,
              background:getComputedStyle(rail.querySelector('.sv-active')).backgroundColor,
              outputs:[rail.style.getPropertyValue('--sv-progress'), rail.style.getPropertyValue('--sv-slide'), rail.firstElementChild.style.getPropertyValue('--sd')],
            }))
            assert.deepEqual(sample.callback, sample.state, `${name}: ${count} callback/state diverged`)
            assert.equal(sample.activeCallback, sample.active)
            assert.equal(sample.active, sample.state.active)
            assert.equal(sample.scale, 'none')
            assert(sample.outputs.every(value => off ? value === '' : value !== ''))
            assert(Math.abs(sample.state.progress - progress) < .001)
            delete sample.outputs
            samples.push(sample)
          }
          variants.push(samples)
        }
        assert.deepEqual(variants[0], variants[1], `${name}: ${count} plain carousel changed without CSS outputs`)
      }
      console.log(`ok ${name}: plain slider output suppression preserves forward/reverse geometry, classes, state and callbacks`)
      for (const count of [15, 120]) {
        const variants = []
        for (const off of [false, true]) {
          await page.goto(base + `../bench/slider-seek.html?count=${count}&plain=1&api=1&glide=1&norun=1${off ? '&outputs=off' : ''}`)
          await settle(page)
          const samples = []
          for (const target of [4, 7, 0]) {
            await page.evaluate(i => sliderHandle.goTo(i), target)
            await page.waitForFunction(() => !sliderHandle.state().gliding)
            await settle(page)
            const sample = await page.locator('#rail').evaluate((rail, i) => {
              const child = rail.children[i]
              return { state:sliderHandle.state(), callback:sliderLastState, left:rail.scrollLeft,
                expected:Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, child.offsetLeft + child.offsetWidth / 2 - rail.clientWidth / 2)),
                active:[...rail.children].findIndex(el => el.classList.contains('sv-active')),
                scale:getComputedStyle(rail.firstElementChild).scale,
                background:getComputedStyle(rail.querySelector('.sv-active')).backgroundColor }
            }, target)
            assert(Math.abs(sample.left - sample.expected) <= 1, `${name}: goTo(${target}) missed destination`)
            assert.deepEqual(sample.callback, sample.state)
            assert.equal(sample.active, sample.state.active)
            assert.equal(sample.scale, 'none')
            samples.push(sample)
          }
          variants.push(samples)
        }
        assert.deepEqual(variants[0], variants[1], `${name}: goTo output modes diverged`)
      }
      console.log(`ok ${name}: plain slider goTo keeps destinations, stopped callbacks and appearance in both output modes`)
      await page.goto(base + 'pointer-tilt.html')
      const pointerClassWrites = await page.locator('.sv-tilt').first().evaluate(async el => {
        let writes = 0
        const observer = new MutationObserver(records => { writes += records.length })
        observer.observe(el, { attributes:true, attributeFilter:['class'] })
        for (let i = 0; i < 100; i++)
          el.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, clientX:i, clientY:25 }))
        await Promise.resolve()
        observer.disconnect()
        return writes
      })
      assert.equal(pointerClassWrites, 0, `${name}: pointermove rewrote an unchanged class ${pointerClassWrites} times`)
      const hiddenPointer = await page.locator('.sv-tilt').first().evaluate(async el => {
        const display = el.style.display
        el.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, clientX:0, clientY:0 }))
        el.style.display = 'none'
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        const values = ['--mx', '--my'].map(name => +el.style.getPropertyValue(name))
        el.style.display = display
        return values
      })
      assert.deepEqual(hiddenPointer, [0, 0], `${name}: hidden pointer target emitted invalid coordinates`)
      const glare = await page.locator('.sv-tilt').first().evaluate(el => {
        const samples = []
        for (const x of [-1, 1]) {
          el.style.setProperty('--mx', String(x))
          const style = getComputedStyle(el, '::after')
          samples.push({ background:style.backgroundImage, translate:style.translate })
        }
        return samples
      })
      assert.equal(glare[0].background, glare[1].background, `${name}: glare repaints its gradient`)
      assert.notEqual(glare[0].translate, glare[1].translate, `${name}: glare does not move`)
      console.log(`ok ${name}: pointer class writes, hidden target, translated glare`)
      await page.addScriptTag({ url:base + 'sv-canvas.js' })
      const canvasFrames = await page.evaluate(async () => {
        document.body.innerHTML = '<canvas style="position:fixed;top:20px;left:20px;width:200px;height:100px"></canvas>'
        const canvas = document.querySelector('canvas')
        let frames = 0
        const handle = SVC.mountEffect(canvas, { frame:() => { frames++ } })
        const waitFrames = async () => {
          for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame)
        }
        await waitFrames()
        canvas.style.width = '0px'
        await waitFrames()
        const before = frames
        await waitFrames()
        const hidden = frames - before
        canvas.style.width = '200px'
        await waitFrames()
        const resumed = frames - before - hidden
        handle.destroy()
        return { hidden, resumed }
      })
      assert.equal(canvasFrames.hidden, 0, `${name}: zero-area canvas kept drawing`)
      assert.ok(canvasFrames.resumed > 0, `${name}: restoring canvas size did not resume`)
      console.log(`ok ${name}: zero-area canvas pause and resume`)
      // Same output geometry before comparing CPU: forward, reverse and resize.
      for (const mode of ['css', 'direct', 'localized']) {
        await page.goto(base + `../bench/rail.html?deep=200&norun=1&mode=${mode}`)
        for (const width of [800, 390]) {
          await page.setViewportSize({ width, height:600 })
          await settle(page)
          for (const progress of [0, .15, .5, 1, .5, 0]) {
            await pin(page, 'section', progress)
            const geometry = await page.locator('section').evaluate(el => {
              const stage = el.querySelector('.sv-stage'), rail = el.querySelector('.sv-rail')
              const p = +Math.max(0, Math.min(1, -el.getBoundingClientRect().top / (el.offsetHeight - innerHeight))).toFixed(4)
              const expected = (1 - p) * stage.clientWidth + p * Math.min(stage.clientWidth - rail.offsetWidth, 0)
              return { actual:rail.getBoundingClientRect().left - stage.getBoundingClientRect().left, expected,
                privateClock:+getComputedStyle(rail).getPropertyValue('--bench-rail-pin'),
                childClock:+getComputedStyle(rail.firstElementChild).getPropertyValue('--bench-rail-pin') }
            })
            assert.ok(Math.abs(geometry.actual - geometry.expected) < .1, `${name}: ${mode} rail at ${width}px, ${progress}: ${JSON.stringify(geometry)}`)
            if (mode === 'localized' && progress === .5) {
              assert.equal(geometry.privateClock, .5)
              assert.equal(geometry.childClock, 0, `${name}: private rail clock leaked into descendants`)
            }
          }
        }
      }
      await page.setViewportSize({ width:1400, height:900 })
      console.log(`ok ${name}: CSS/direct/localized rail geometry, reverse and resize`)
      for (const mode of ['css', 'direct', 'boundary']) {
        await page.goto(base + 'case-study-rail.html')
        await page.addScriptTag({ url:base + '../bench/casework.js' })
        await page.evaluate(mode => { window.stopCaseworkExperiment = mountCaseworkExperiment({ direct:mode === 'direct', boundary:mode === 'boundary', rich:true }) }, mode)
        for (const width of [1400, 900, 1400]) {
          await page.setViewportSize({ width, height:900 })
          await settle(page)
          for (const progress of [.1, .5, 1, .5, 0]) {
            await pin(page, '.sv-casework > .sv', progress)
            const geometry = await page.locator('.work-rail').evaluate(rail => {
              const root = rail.closest('.sv'), stage = rail.closest('.sv-stage')
              const p = +root.style.getPropertyValue('--sv-pin')
              return { flow:root.hasAttribute('data-sv-flow'), p,
                actual:new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41,
                expected:p * Math.min(stage.clientWidth - rail.getBoundingClientRect().width, 0) }
            })
            assert(!geometry.flow && Math.abs(geometry.p - progress) < .002 && Math.abs(geometry.actual - geometry.expected) < .2,
              `${name}: casework ${mode}, width=${width}, p=${progress}: ${JSON.stringify(geometry)}`)
          }
        }
        await page.emulateMedia({ reducedMotion:'reduce' })
        await settle(page)
        assert.equal(await page.locator('.work-rail').evaluate(el => getComputedStyle(el).transform), 'none')
        await page.emulateMedia({ reducedMotion:'no-preference' })
        await settle(page)
        await pin(page, '.sv-casework > .sv', .5)
        assert(await page.locator('.work-rail').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 < -100))
        await page.locator('.work-fit').evaluate(el => {
          const text = document.createElement('p'); text.textContent = 'Long CMS content. '.repeat(500); el.append(text)
        })
        await page.setViewportSize({ width:390, height:600 })
        await page.waitForFunction(() => document.querySelector('.sv-casework > .sv').hasAttribute('data-sv-flow'))
        assert.equal(await page.locator('.work-rail').evaluate(el => getComputedStyle(el).transform), 'none')
        await page.setViewportSize({ width:1400, height:900 })
        await settle(page)
        assert(await page.locator('.sv-casework > .sv').evaluate(el => el.hasAttribute('data-sv-flow')))
        await page.evaluate(() => stopCaseworkExperiment())
        assert.deepEqual(await page.locator('.work-rail').evaluate(el => ['transform', '--sv-pin'].map(p => el.style.getPropertyValue(p))), ['', ''])
      }
      console.log(`ok ${name}: real casework CSS/direct/boundary geometry, reverse, resize, live reduced motion, CMS flow and cleanup`)
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
