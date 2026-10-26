// Gallery rail screen: same authored geometry and preset, CSS clock vs onPin.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import { chromium, firefox, webkit } from 'playwright'
import { EFFECTS } from '../../../scripts/fx-data.mjs'

const selectedBrowser = process.argv.find(arg => arg.startsWith('--browser='))?.slice(10)
if (selectedBrowser && !['chromium','firefox','webkit'].includes(selectedBrowser)) throw Error('Unknown browser: ' + selectedBrowser)
const root = fileURLToPath(new URL('../../../', import.meta.url))
const out = resolve(process.env.RAIL_RESULTS || join(root, 'node_modules/.cache/rail-cost'))
mkdirSync(out, { recursive: true })
const bundles = {}, sizes = {}, modes = ['css', 'direct']
for (const mode of modes) {
  const r = await build({ entryPoints: [join(root, 'demo/bench/harness/fixtures/rail/direct.mjs')], alias: { scrollvars: join(root, 'dist/index.js') }, bundle: true, minify: true, format: 'esm', target: 'es2020', write: false, define: { DIRECT_RAIL: String(mode === 'direct') } })
  bundles[mode] = r.outputFiles[0].text
  sizes[mode] = { min: bundles[mode].length, gzip: gzipSync(bundles[mode], { level: 9 }).length,
    sha256: createHash('sha256').update(bundles[mode]).digest('hex') }
}
const preset = readFileSync(join(root, 'styles/pin.css'), 'utf8')
const preview = EFFECTS.find(e => e.slug === 'horizontal-rail').preview
const sheet = `body{margin:0;background:#14211a;color:white;font:18px system-ui}header,footer{height:110vh}main{width:80%;margin:auto}.fxouter{position:relative;margin:18px 0}.fxsticky{background:#14211a;border:1px solid #ffffff30;border-radius:16px}.fxcard{width:150px;height:110px;flex:0 0 auto;border-radius:12px;border:1px solid #ffffff30;display:grid;place-items:center;position:relative}.detail{position:absolute;width:2px;height:2px;background:#ddce96}.sv-on .fxouter{height:240vh}[data-sv-off].fxouter,[data-sv-flow].fxouter{height:auto!important}@media(prefers-reduced-motion:reduce){.sv-on .fxouter{height:auto}}:where([data-sv-motion="reduce"]) .fxouter{height:auto}`
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost'), mode = u.searchParams.get('mode') || 'css'
  if (!modes.includes(mode)) { res.writeHead(400);res.end();return }
  if (u.pathname === '/entry.js') { res.setHeader('content-type', 'text/javascript');res.end(bundles[mode]);return }
  if (u.pathname !== '/') { res.writeHead(404);res.end();return }
  let markup = preview
  if (u.searchParams.get('deep') === '1') markup = markup.replace(/(0[1-5])<\/div>/g, '$1' + Array.from({ length: 50 }, (_, i) => `<span class="detail" style="left:${5 + i % 10 * 13}px;top:${5 + Math.floor(i / 10) * 20}px"></span>`).join('') + '</div>')
  res.setHeader('content-type', 'text/html')
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Rail output screen</title><style>${preset}\n${sheet}</style><header></header><main>${markup}</main><footer></footer><script type="module" src="/entry.js?mode=${mode}"></script></html>`)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const report = { date: new Date().toISOString(), sizes, sourceHash: createHash('sha256').update(preview).update(preset).update(sheet).update(Object.values(bundles).join('')).digest('hex'), gates: [], runs: [] }
const save = () => writeFileSync(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
const sample = page => page.evaluate(async () => {
  const el = document.querySelector('.fxouter'), stage = el.querySelector('.sv-stage'), rail = el.querySelector('.sv-rail'), samples = []
  for (const p of [0, .25, .5, .9, 1, .4]) {
    const top = el.getBoundingClientRect().top + scrollY, span = el.offsetHeight - stage.offsetHeight
    scrollTo(0, top - parseFloat(getComputedStyle(stage).top) + p * span)
    for (let n = 0; n < 5; n++) await new Promise(requestAnimationFrame)
    const rect = rail.getBoundingClientRect(), s = stage.getBoundingClientRect()
    samples.push([rect.left, rect.right, rect.width, s.left, s.right, ...[...rail.children].map(c=>c.getBoundingClientRect().left)])
  }
  return samples
})
const compare = (a, b) => { assert.ok(Math.abs(a[0][0] - a[4][0]) > 50, 'rail must move'); a.flat().forEach((v,i) => assert.ok(Math.abs(v-b.flat()[i]) < 1, `rail differs ${i}: ${v} vs ${b.flat()[i]}`)) }
try {
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    if (selectedBrowser && name !== selectedBrowser) continue
    const browser = await engine.launch({ headless: true })
    try {
      for (const width of [1280,390]) for(const deep of [0,1]) {
        const page = await browser.newPage({ viewport:{width,height:800} }), errors = []
        page.on('pageerror',e=>errors.push(e.message));let expected
        for (const mode of modes) {
          await page.goto(`${base}/?mode=${mode}&deep=${deep}`)
          await page.waitForFunction(()=>typeof railDestroy==='function')
          const got = await sample(page);expected??=got;compare(expected,got)
          assert.ok(got[4][1] <= got[4][4] + 1, 'rail reaches the last card')
          await page.evaluate(()=>document.documentElement.setAttribute('data-sv-motion','reduce'))
          await page.waitForTimeout(100)
          assert.equal(await page.locator('.sv-rail').evaluate(el=>getComputedStyle(el).translate),'none')
          await page.evaluate(()=>document.documentElement.removeAttribute('data-sv-motion'))
          await page.waitForTimeout(100);compare(expected,await sample(page))
          await page.setViewportSize({width:width===1280?900:420,height:700})
          await page.evaluate(()=>document.documentElement.style.setProperty('--sv-pin-offset','64px'))
          const resized = await sample(page)
          if(mode==='css')report.resizeExpected=resized;else compare(report.resizeExpected,resized)
          await page.evaluate(()=>{railDestroy();railDestroy()})
          await page.waitForTimeout(50)
          assert.equal(await page.locator('.sv-rail').evaluate(el=>getComputedStyle(el).translate),'none')
          await page.setViewportSize({width,height:800})
        }
        assert.deepEqual(errors,[]);await page.close()
      }
      report.gates.push({browser:name,version:browser.version(),passed:true});delete report.resizeExpected;save();console.log(name,'gates passed')
    } finally {await browser.close()}
  }
  if(!process.argv.includes('--gates')) {
    const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
    report.browser=browser.version()
    try {
      for(const width of [1280,390]) for(const deep of [0,1]) for(let round=0;round<6;round++) for(const mode of round%2?[...modes].reverse():modes) {
        const context=await browser.newContext({viewport:{width,height:800}}),page=await context.newPage()
        try {
          const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:width===390?4:1});await cdp.send('Performance.enable')
          const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]))
          await page.goto(`${base}/?mode=${mode}&deep=${deep}`);await page.waitForFunction(()=>typeof railDestroy==='function');await sample(page)
          const before=await metrics()
          const intervals=await page.evaluate(async()=>{
            const el=document.querySelector('.fxouter'),stage=el.querySelector('.sv-stage'),top=el.getBoundingClientRect().top+scrollY,span=el.offsetHeight-stage.offsetHeight,times=[]
            for(let i=0;i<180;i++){times.push(await new Promise(requestAnimationFrame));scrollTo(0,top+(.5-.5*Math.cos(i/179*Math.PI*4))*span)}
            await new Promise(requestAnimationFrame);return times.slice(1).map((t,i)=>t-times[i])
          })
          const after=await metrics(),timing={};for(const key of ['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration'])timing[key+'Ms']=(after[key]-before[key])*1000
          intervals.sort((a,b)=>a-b);report.runs.push({width,deep,round,mode,...timing,frames:intervals.length,p95:intervals[Math.floor(intervals.length*.95)],over25:intervals.filter(x=>x>25).length,heap:after.JSHeapUsedSize});save();console.log(width,deep,round,mode,timing.TaskDurationMs.toFixed(1))
        }finally{await context.close()}
      }
    }finally{await browser.close()}
  }
}finally{server.close()}
