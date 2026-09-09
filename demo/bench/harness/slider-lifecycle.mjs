// Retention/idle probe, not an animation-speed benchmark. Run from any cwd.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const bundle = new URL('../../fx/sv.js', import.meta.url)
const results = { meta: {
  date:new Date().toISOString(), commit:execFileSync('git', ['rev-parse', 'HEAD'], { cwd:root, encoding:'utf8' }).trim(),
  dirty:!!execFileSync('git', ['status', '--porcelain'], { cwd:root, encoding:'utf8' }).trim(),
  hashes:Object.fromEntries([import.meta.url, bundle.href].map(url => [url.endsWith('sv.js') ? 'fx/sv.js' : 'harness/slider-lifecycle.mjs', createHash('sha256').update(readFileSync(new URL(url))).digest('hex')])),
  slides:120, warmup:20, batches:4, cyclesPerBatch:25, repetitions:3,
}, runs:[] }
const browser = await puppeteer.launch({ executablePath:process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true })
results.meta.chrome = await browser.version()
async function run(mode) {
  const context = await browser.createBrowserContext()
  try {
    const page = await context.newPage()
    await page.setContent('<style>.rail{display:flex;position:relative;width:800px;overflow:auto;scroll-snap-type:x mandatory}.rail>div{flex:0 0 220px;height:100px;scroll-snap-align:center}</style>')
    await page.addScriptTag({ path:fileURLToPath(bundle) })
    await page.evaluate(() => {
      const nativeFrame = requestAnimationFrame.bind(window), nativeCancel = cancelAnimationFrame.bind(window)
      const nativeTimeout = setTimeout.bind(window)
      const pending = new Set()
      const audit = window.lifecycle = { executed:0, callbacksAfterDestroy:0, refs:[], retained:[] }
      window.requestAnimationFrame = fn => {
        const id = nativeFrame(t => { pending.delete(id); audit.executed++; fn(t) })
        pending.add(id); return id
      }
      window.cancelAnimationFrame = id => { pending.delete(id); nativeCancel(id) }
      const frames = () => new Promise(r => nativeFrame(() => nativeFrame(r)))
      window.lifecycleBatch = async (mode, count) => {
        for (let i = 0; i < count; i++) {
          const rail = document.createElement('div'); rail.className = 'rail'
          rail.innerHTML = '<div><span>Project</span><span>Work</span></div>'.repeat(120)
          document.body.append(rail)
          let destroyed = false
          const handle = mode === 'dom' ? null : SV.slider(rail, { cssVars:mode !== 'off', onScroll:() => { if (destroyed) audit.callbacksAfterDestroy++ } })
          await frames()
          if (handle) {
            // Teardown while idle, gliding, wheeling, dragging, and after drag release.
            if (i % 5 === 1) { handle.goTo(40); await frames() }
            if (i % 5 === 2) rail.dispatchEvent(new WheelEvent('wheel', { deltaX:30 }))
            if (i % 5 >= 3) {
              rail.firstElementChild.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerType:'mouse', button:0, clientX:300 }))
              window.dispatchEvent(new PointerEvent('pointermove', { clientX:260 }))
              window.dispatchEvent(new PointerEvent('pointermove', { clientX:200 }))
              if (i % 5 === 4) window.dispatchEvent(new PointerEvent('pointerup'))
            }
            handle.destroy(); destroyed = true
          }
          audit.refs.push(new WeakRef(rail))
          if (handle) audit.refs.push(new WeakRef(handle))
          if (mode === 'retained') audit.retained.push(rail, handle)
          rail.remove()
        }
        await new Promise(r => nativeTimeout(r, 300)) // drain the wheel/click windows
      }
      window.lifecycleSnapshot = () => ({
        alive:audit.refs.reduce((n, ref) => n + (ref.deref() ? 1 : 0), 0),
        pending:pending.size, executed:audit.executed, callbacksAfterDestroy:audit.callbacksAfterDestroy,
      })
      window.lifecycleIdle = async () => {
        const before = audit.executed
        await new Promise(r => nativeTimeout(r, 300))
        return audit.executed - before
      }
    })
    const cdp = await page.createCDPSession()
    await cdp.send('Performance.enable')
    const checkpoint = async cycles => {
      // Separate protocol calls/jobs: WeakRef deref must not keep a target live during GC.
      await cdp.send('HeapProfiler.collectGarbage')
      await cdp.send('HeapProfiler.collectGarbage')
      const snapshot = await page.evaluate(() => {
        const snapshot = lifecycleSnapshot()
        lifecycle.refs = [] // the probe itself must not accumulate WeakRef objects
        return snapshot
      })
      await cdp.send('HeapProfiler.collectGarbage')
      const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]))
      const idleFrames = await page.evaluate(() => lifecycleIdle())
      assert.equal(snapshot.pending, 0, mode + ': pending frame after teardown')
      assert.equal(snapshot.callbacksAfterDestroy, 0, mode + ': callback after destroy')
      assert.equal(idleFrames, 0, mode + ': idle frame work')
      assert.equal(snapshot.alive, mode === 'retained' ? cycles * 2 : 0, mode + ': retained target count')
      return { cycles, ...snapshot, idleFrames, heapBytes:metrics.JSHeapUsedSize, nodes:metrics.Nodes, listeners:metrics.JSEventListeners }
    }
    if (mode === 'retained') {
      await page.evaluate(() => lifecycleBatch('retained', 5))
      return { mode, checkpoints:[await checkpoint(5)] }
    }
    await page.evaluate(mode => lifecycleBatch(mode, 20), mode)
    const checkpoints = [await checkpoint(0)]
    for (let batch = 1; batch <= 4; batch++) {
      await page.evaluate(mode => lifecycleBatch(mode, 25), mode)
      checkpoints.push(await checkpoint(batch * 25))
    }
    return { mode, checkpoints }
  } finally { await context.close() }
}
try {
  results.control = await run('retained')
  console.log('ok positive control: 10 deliberately retained targets detected')
  for (let repeat = 0; repeat < 3; repeat++) {
    const modes = ['dom', 'on', 'off']
    for (const mode of [...modes.slice(repeat), ...modes.slice(0, repeat)]) {
      const result = await run(mode)
      results.runs.push({ repeat:repeat + 1, ...result })
      const first = result.checkpoints[0], last = result.checkpoints.at(-1)
      console.log(`ok ${mode} run ${repeat + 1}: 0 retained targets/idle frames; heap ${first.heapBytes}→${last.heapBytes}; nodes ${first.nodes}→${last.nodes}; listeners ${first.listeners}→${last.listeners}`)
    }
  }
  writeFileSync(new URL('../results/slider-lifecycle.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
} finally { await browser.close() }
