// How deep is a real page under each tracked element, versus the benchmark?
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' }
const server = createServer((req,res)=>{const p=join(root,req.url.split('?')[0].replace(/\/$/,'/index.html'));try{res.setHeader('content-type',MIME[extname(p)]||'application/octet-stream');res.end(readFileSync(p))}catch{res.statusCode=404;res.end('nope')}})
await new Promise(r=>server.listen(0,r))
const base=`http://127.0.0.1:${server.address().port}`
const browser=await puppeteer.launch({executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const pages = [
  ['bench main-900', '/bench/scrollvars.html?s=60&p=15&harness=1'],
  ['bench deep-50', '/bench/scrollvars.html?s=30&p=5&deep=50&harness=1'],
  ...['hero-cinematic','timeline-scrub','sticky-steps','stats-countup','case-study-rail','editorial-manifesto']
    .map(s => [`gallery ${s}`, `/fx/${s}.html`]),
  ['site home', '/index.html'],
]
console.log('page                      tracked  descendants/tracked  children/tracked  ratio')
for (const [name, url] of pages) {
  const page = await browser.newPage()
  try {
    await page.goto(base+url, { waitUntil:'load' })
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    const r = await page.evaluate(() => {
      const tracked = [...document.querySelectorAll('.sv')]
      if (!tracked.length) return null
      const desc = tracked.map(el => el.getElementsByTagName('*').length)
      const kids = tracked.map(el => el.children.length)
      const sum = a => a.reduce((x,y)=>x+y,0)
      return { n: tracked.length, desc: sum(desc)/tracked.length, kids: sum(kids)/tracked.length }
    })
    if (r) console.log(`${name.padEnd(26)} ${String(r.n).padStart(5)}  ${r.desc.toFixed(1).padStart(17)}  ${r.kids.toFixed(1).padStart(15)}  ${(r.desc/Math.max(r.kids,1)).toFixed(1).padStart(5)}x`)
    else console.log(`${name.padEnd(26)} nada rastreado`)
  } catch (e) { console.log(`${name.padEnd(26)} erro: ${e.message.slice(0,50)}`) }
  await page.close()
}
await browser.close(); server.close()
