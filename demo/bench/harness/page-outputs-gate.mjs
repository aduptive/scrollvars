/**
 * --sv-page and --sv-v are inherited custom properties on <html>: every write
 * invalidates style for the whole document. Since they publish only when
 * something can read them, these invariants pin BOTH directions. A regression
 * that publishes always costs every page a document-wide recalculation per
 * frame (measured: 3249ms against 269ms over a 12-second scroll on the 900-box
 * benchmark); a regression that never publishes silently breaks every page
 * whose CSS reads them.
 *
 * Exported as a gate for e2e-invariants.mjs and runnable on its own:
 *   node page-outputs-gate.mjs
 */
const FIXTURE = '/bench/harness/fixtures/page-outputs.html'

const published = page =>
  page.evaluate(() => new Promise(resolve => {
    scrollTo(0, 1500)
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() =>
      resolve(document.documentElement.style.getPropertyValue('--sv-page') !== ''))))
  }))

// Publishing or not, the tracked element still has to animate.
const travelling = page =>
  page.evaluate(() => document.querySelector('[data-sv]').style.getPropertyValue('--sv-t') !== '')

export async function pageOutputsGate({ browser, check, base }) {
  const cases = [
    ['nothing reads them: not published', 'none', null, false],
    ['a --sv-view preset is not mistaken for --sv-v', 'view', null, false],
    ['a <style> reading --sv-page: published', 'style-page', null, true],
    ['--sv-v inside @media: published', 'media-v', null, true],
    ['an inline style attribute reading it: published', 'inline', null, true],
    ['a linked stylesheet reading it: published', 'link', null, true],
    ['setPageOutputs(true) with no consumer: published', 'none',
      page => page.evaluate(() => SV.setPageOutputs(true)), true],
    ['setPageOutputs(false) with a consumer: not published', 'style-page',
      page => page.evaluate(() => SV.setPageOutputs(false)), false],
    ['a CSSOM-inserted rule counts as a consumer', 'cssom', null, true],
    ['an @import that reaches a consumer counts', 'import', null, true],
    ['a stylesheet added after boot that reads nothing stays silent', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        const style = document.createElement('style')
        style.textContent = '.late { opacity: var(--sv-view) }'
        document.head.append(style)
        requestAnimationFrame(() => requestAnimationFrame(done))
      }))
    }, false],
    ['a preload or icon link added after boot is not a stylesheet and stays silent', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = '/fx/nothing.png'
        document.head.append(link)
        requestAnimationFrame(() => requestAnimationFrame(done))
      }))
    }, false],
    ['text assigned into an existing empty <style> after boot counts', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        const style = document.createElement('style')
        document.head.append(style)
        requestAnimationFrame(() => {
          style.textContent = '.late { opacity: var(--sv-page) }'
          setTimeout(done, 40)
        })
      }))
    }, true],
    ['a stylesheet added after boot turns publishing back on', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        scrollTo(0, 800)
        requestAnimationFrame(() => requestAnimationFrame(done))
      }))
      if (await published(page)) throw Error('published before the late stylesheet arrived')
      await page.evaluate(() => new Promise(done => {
        const style = document.createElement('style')
        style.textContent = '.late { opacity: var(--sv-page) }'
        document.head.append(style)
        setTimeout(done, 30)
      }))
    }, true],
    // The watch rescans once per frame that adds an element. A sheet read in
    // full that reached nothing is remembered by rule count, so those frames
    // serialize no rule at all: 3.2ms a frame at 5000 rules before the memo,
    // on a page that mounts one element per frame. Counted at the getter.
    ['elements added after boot do not serialize the stylesheets again', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        // two frames so the boot scan is over before the counter goes in
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const desc = Object.getOwnPropertyDescriptor(CSSRule.prototype, 'cssText')
          window.__cssTextReads = 0
          Object.defineProperty(CSSRule.prototype, 'cssText', { configurable: true, get() { window.__cssTextReads++; return desc.get.call(this) } })
          let n = 0
          const tick = () => {
            document.body.append(document.createElement('div'))
            if (++n < 30) requestAnimationFrame(tick)
            else requestAnimationFrame(() => requestAnimationFrame(done))
          }
          requestAnimationFrame(tick)
        }))
      }))
      const reads = await page.evaluate(() => window.__cssTextReads)
      if (reads > 0) throw Error(`${reads} rule serializations for 30 plain elements`)
    }, false],
    // The memo is by rule count on purpose: a CSS-in-JS runtime in production
    // inserts a component's rules into ONE existing sheet as the component
    // mounts, and the mount's own elements are what wake the watch.
    ['a rule inserted into an existing sheet at mount time counts', 'none', async page => {
      await page.evaluate(() => new Promise(done => {
        const live = document.createElement('style')
        document.head.append(live)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          live.sheet.insertRule('.p { width: calc(var(--sv-page) * 100%) }', 0)
          document.body.append(document.createElement('div'))
          setTimeout(done, 40)
        }))
      }))
    }, true],
  ]

  for (const [name, consumer, setup, expected] of cases) {
    const page = await browser.newPage()
    let got, detail = ''
    try {
      await page.goto(`${base}${FIXTURE}?consumer=${consumer}`, { waitUntil: 'load' })
      await page.waitForFunction(() => typeof window.SV !== 'undefined')
      if (setup) await setup(page)
      got = await published(page)
      if (!(await travelling(page))) detail = 'the tracked element stopped animating'
    } catch (error) {
      got = `threw: ${error.message}`
    }
    check(`page outputs: ${name}`, got === expected && !detail, detail || `published=${got}`)
    await page.close()
  }
}

// Standalone: serve demo/ and run the same gate.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http')
  const { readFileSync } = await import('node:fs')
  const { dirname, join, extname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const puppeteer = (await import('puppeteer-core')).default
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
  const server = createServer((req, res) => {
    const path = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
    try {
      res.setHeader('content-type', MIME[extname(path)] || 'application/octet-stream')
      res.end(readFileSync(path))
    } catch {
      res.statusCode = 404
      res.end('nope')
    }
  })
  await new Promise(r => server.listen(0, r))
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  let failures = 0
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ': ' + detail}`)
    if (!ok) failures++
  }
  await pageOutputsGate({ browser, check, base: `http://127.0.0.1:${server.address().port}` })
  await browser.close()
  server.close()
  console.log(failures ? `\n${failures} violated` : '\nall page-output invariants hold')
  process.exit(failures ? 1 : 0)
}
