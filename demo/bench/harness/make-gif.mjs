#!/usr/bin/env node
/** Renders the README hero GIF: the split-reveal entrance, captured from a
 * real scroll in headless Chrome, assembled by ffmpeg. Output:
 * demo/media/readme.gif — referenced absolutely from the README so the npm
 * page shows motion. */
import { createServer } from 'node:http'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const server = createServer((req, res) => {
  try {
    const p = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'))
    res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream')
    res.end(readFileSync(p))
  } catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, r))

const frames = join(dirname(fileURLToPath(import.meta.url)), '.gif-frames')
mkdirSync(frames, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 800, height: 520, deviceScaleFactor: 2 })
await page.goto(`http://127.0.0.1:${server.address().port}/fx/split-reveal.html?force=1`, { waitUntil: 'load' })

// scroll the runway so the entrance plays, capturing ~2.4s at 15fps
const stage = await page.$('.fxstage')
const target = await page.evaluate((el) => window.scrollY + el.getBoundingClientRect().top - 160, stage)
let n = 0
for (let f = 0; f < 36; f++) {
  if (f === 4) await page.evaluate((y) => scrollTo({ top: y }), target)
  await new Promise((r) => setTimeout(r, 66))
  const el = await page.$('.fxstage')
  await el.screenshot({ path: join(frames, `f${String(n++).padStart(3, '0')}.png`) })
}
await browser.close()
server.close()

const out = join(root, 'media', 'readme.gif')
execSync(`ffmpeg -y -framerate 15 -i ${frames}/f%03d.png -vf "scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer" ${out}`, { stdio: 'pipe' })
execSync(`rm -rf ${frames}`)
console.log('written', out)
