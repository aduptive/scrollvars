import assert from 'node:assert/strict'
import { buildSync } from 'esbuild'
import { chromium, firefox, webkit } from 'playwright'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const script = buildSync({ entryPoints:[root + '/src/core/slider.ts'], bundle:true, format:'iife', globalName:'SliderModule', write:false }).outputFiles[0].text
const css = readFileSync(root + '/styles/slider.css', 'utf8')
const engines = {chromium, firefox, webkit}
for (const name of process.env.BROWSERS?.split(',') ?? Object.keys(engines)) {
  const engine = engines[name]
  assert.ok(engine, `Unknown browser: ${name}`)
  const browser = await engine.launch({headless:true, ...(name === 'chromium' && process.env.CHROME ? {executablePath:process.env.CHROME} : {})})
  try {
    const page = await browser.newPage(); page.setDefaultTimeout(5000)
    for (const align of ['start', 'center', 'end']) for (const mode of ['x', 'rtl', 'y', 'multi']) {
      await page.setContent(`<style>${css}.rail { position:relative; width:${mode === 'multi' ? 240 : 120}px; height:120px; direction:${mode === 'rtl' ? 'rtl' : 'ltr'} } .rail > div { flex:0 0 120px; width:120px; height:120px; } .rail { --sv-gap:0px; }</style><div class="rail">${[0,1,2,3].map(i=>`<div>${i}</div>`).join('')}</div>`)
      await page.addScriptTag({content:script})
      await page.evaluate(({mode, align}) => {
        window.rail = document.querySelector('.rail')
        window.originals = [...rail.children]
        window.h = SliderModule.slider(rail, {axis: mode === 'y' ? 'y' : 'x', align, loop:true, duration:100, onScroll:()=>{window.scrollCalls=(window.scrollCalls??0)+1}})
        h.goTo(3, false)
      }, {mode, align})
      await page.waitForFunction(() => h.active() === 3)

      await page.evaluate(()=>h.next())
      await page.waitForFunction(()=>h.active() === 0 && !h.state().gliding)
      await page.evaluate(()=>h.prev())
      await page.waitForFunction(()=>h.active() === 3 && !h.state().gliding)
      await page.locator('.rail').focus()
      await page.keyboard.press(mode === 'y' ? 'ArrowDown' : mode === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
      await page.waitForFunction(()=>h.active() === 0 && !h.state().gliding)
      assert.equal(await page.evaluate(()=>rail.children.length), 4)
      assert.notEqual(await page.evaluate(()=>getComputedStyle(rail).scrollSnapType), 'none')
      await page.emulateMedia({reducedMotion:'reduce'})
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
      await page.evaluate(()=>h.prev(false))
      await page.waitForFunction(()=>h.active() === 3)
      assert.equal(await page.evaluate(()=>{h.next(); return h.state().gliding}), false)
      await page.waitForFunction(()=>h.active() === 0)
      await page.emulateMedia({reducedMotion:'no-preference'})
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
      for (let i=0;i<12;i++) {
        const next = await page.evaluate(()=> (h.active()+1)%4)
        await page.evaluate(()=>h.next())
        await page.waitForFunction(index=>h.active()===index&&!h.state().gliding, next)
      }
      assert.equal(await page.evaluate(()=>originals.every((node,i)=>rail.children[i]===node)), true)
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
      const idle = await page.evaluate(()=>{window.scrollCalls=0; return originals.map(node=>node.style.order)})
      await page.waitForTimeout(150)
      assert.deepEqual(await page.evaluate(()=>originals.map(node=>node.style.order)),idle)
      assert.equal(await page.evaluate(()=>window.scrollCalls),0,'a settled loop has no idle measurements')
      const bounds = await page.locator('.rail').boundingBox()
      const axisY = mode === 'y'
      const forward = mode === 'rtl' ? 1 : -1
      const x = bounds.x + (axisY ? bounds.width / 2 : forward > 0 ? 20 : bounds.width - 20)
      const y = bounds.y + (axisY ? bounds.height - 20 : bounds.height / 2)
      const dragged = await page.evaluate(()=> (h.active()+1)%4)
      await page.mouse.move(x,y)
      await page.mouse.down()
      await page.mouse.move(x + (axisY ? 0 : forward * 90), y - (axisY ? 90 : 0), {steps:8})
      await page.mouse.up()
      await page.waitForFunction(index=>h.active()===index&&!h.state().dragging&&!h.state().gliding,dragged)
      const wheeled = await page.evaluate(()=>h.active())
      await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2)
      await page.mouse.wheel(axisY?0:mode==='rtl'?-120:120,axisY?120:0)
      await page.waitForTimeout(250)
      await page.waitForFunction(index=>h.active()!==index&&!h.state().gliding,wheeled)
      await page.evaluate(()=>{rail.children[h.active()].tabIndex=0;rail.children[h.active()].focus({preventScroll:true})})
      assert.equal(await page.evaluate(()=>document.activeElement===rail.children[h.active()]),true)
      const focused = await page.evaluate(()=>h.active())
      await page.evaluate(()=>h.destroy())
      assert.equal(await page.evaluate(()=>document.activeElement===rail.children[h.active()]),true)
      assert.equal(await page.evaluate(()=>originals.every(node=>node.style.order==='')),true)
      assert.equal(await page.evaluate(()=>h.active()),focused)
      await page.emulateMedia({reducedMotion:'no-preference'})
      console.log(`${name} ${mode} ${align}: loop, keyboard, drag/wheel, focus, idle, reduced motion and cleanup PASS`)
    }
    for (const mode of ['x','rtl','y']) for (const align of ['start','center','end']) {
      const vertical = mode === 'y'
      await page.setContent(`<style>${css}.rail{position:relative;box-sizing:border-box;width:${vertical?180:320}px;height:${vertical?320:180}px;direction:${mode==='rtl'?'rtl':'ltr'};--sv-gap:12px;padding-${vertical?'block':'inline'}:20px 40px;scroll-padding-${vertical?'block':'inline'}:calc(5% + 4px) 40px}.rail>div{width:100px;height:100px}</style><div class="rail">${[80,120,90,110,100,140].map((size,i)=>`<div style="${vertical?'height':'width'}:${size}px">${i}</div>`).join('')}</div>`)
      await page.addScriptTag({content:script})
      await page.evaluate(({mode,align})=>{
        window.rail=document.querySelector('.rail')
        window.h=SliderModule.slider(rail,{axis:mode==='y'?'y':'x',align,duration:100})
        h.goTo(2)
      },{mode,align})
      const verify = async () => {
        await page.waitForFunction(()=>!h.state().gliding && h.active()===2)
        const result = await page.evaluate(({mode,align})=>{
          const vertical=mode==='y', rtl=mode==='rtl', size=vertical?rail.clientHeight:rail.clientWidth
          const c=rail.getBoundingClientRect(), s=rail.children[2].getBoundingClientRect()
          const f=align==='start'?0:align==='end'?1:.5
          const inset=size*.05+4, anchor=inset+(size-inset-40)*f
          const start=vertical?s.top-c.top:rtl?c.right-s.right:s.left-c.left
          return {delta:start+(vertical?s.height:s.width)*f-anchor,pos:vertical?rail.scrollTop:rtl?-rail.scrollLeft:rail.scrollLeft}
        },{mode,align})
        assert.ok(Math.abs(result.delta)<1.1,JSON.stringify({name,mode,align,result}))
        await page.waitForTimeout(1000)
        const after=await page.evaluate(mode=>mode==='y'?rail.scrollTop:mode==='rtl'?-rail.scrollLeft:rail.scrollLeft,mode)
        assert.ok(Math.abs(after-result.pos)<=1,'native snap must not move the settled target')
      }
      await verify()
      await page.evaluate(vertical=>{rail.style[vertical?'height':'width']='340px'},vertical)
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
      await page.evaluate(()=>h.goTo(2))
      await verify()
      await page.evaluate(()=>h.destroy())
      console.log(`${name} ${mode} ${align}: variable sizes, calc scroll-padding, settled position and resize PASS`)
    }
  } finally { await browser.close() }
}
