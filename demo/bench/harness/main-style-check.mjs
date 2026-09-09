// Fast geometry/clock gate for the main-style diagnostic, outside CPU runs.
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'

const callbackOnly = process.argv.includes('--callback')
const cssOnly = process.argv.includes('--css')
const modes = cssOnly ? ['baseline-off', 'hint-off', 'transform-off'] : callbackOnly ? ['baseline-off', 'direct-clocks-off', 'direct-off'] : ['baseline', 'direct-clocks', 'direct-clocks-off', 'visibility', 'waapi', 'waapi-off']
const profiles = callbackOnly || cssOnly ? ['s=60&p=15', 's=30&p=5&deep=50'] : ['s=60&p=15']

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch()
  try {
    for (const mode of modes) for (const params of profiles) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
      try {
        await page.goto(new URL(`../scrollvars.html?${params}&harness=1`, import.meta.url).href)
        await page.addScriptTag({ path: fileURLToPath(new URL('../main-style.js', import.meta.url)) })
        await page.evaluate(mode => { window.stopStyleExperiment = mountMainStyleExperiment(mode) }, mode)
        for (const width of [800, 390]) {
          await page.setViewportSize({ width, height: 600 })
          const samples = await page.evaluate(() => __styleCheck())
          assert(samples[2] - samples[0] > .59 && samples[2] - samples[4] > .59)
        }
        await page.evaluate(() => stopStyleExperiment())
        assert.equal(await page.evaluate(() => document.getAnimations().length), 0)
        console.log(`ok ${name}: ${mode} ${params}, forward/reverse, resize, transforms, opacity and public clocks`)
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}
