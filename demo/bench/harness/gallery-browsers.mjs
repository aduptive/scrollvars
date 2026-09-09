// Real generated pages, three engines. Run after npm run demo:sync.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
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
        const top = parseFloat(getComputedStyle(el.firstElementChild).top)
        const expected = (top - el.getBoundingClientRect().top + root.getBoundingClientRect().top) / (el.offsetHeight - root.clientHeight + top)
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
