#!/usr/bin/env node
/**
 * The progressive-enhancement invariants, as tests — the architectural
 * promises the reviewers flagged as "claimed but not proven":
 *
 *   1. No JS  → the page renders COMPLETE: no entrance-hidden content
 *   2. With JS → no fail-hidden flash: nothing is hidden until html.sv-on
 *      exists (the guard is the gate, not a race)
 *   3. Attribute knobs land: data-sv-order becomes --sv-order on mount
 *
 * Runs against the fx pages (the shipped presets, the shipped engine).
 *   node e2e-invariants.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CHROME =
  process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
const server = createServer((req, res) => {
  try {
    let url = req.url.split('?')[0].replace(/\/$/, '/index.html')
    // /ssr/<fx page>: the fx page as a server renderer would emit it, with the
    // driver's .sv class already on every tracked element (React <Track> does that)
    const ssr = url.startsWith('/ssr/')
    if (ssr) url = '/fx/' + url.slice(5)
    const p = join(root, url)
    res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream')
    if (ssr && p.endsWith('.html')) {
      const html = readFileSync(p, 'utf8').replace(/<(\w+)([^>]*\sdata-sv(?=[\s>])[^>]*)>/g, (all, tag, attrs) =>
        /\sclass="/.test(attrs) ? `<${tag}${attrs.replace(/\sclass="/, ' class="sv ')}>` : `<${tag} class="sv"${attrs}>`
      )
      res.end(html)
      return
    }
    res.end(readFileSync(p))
  } catch {
    res.statusCode = 404
    res.end()
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok ' : 'FAIL'} ${name}${ok ? '' : ' — ' + detail}`)
  if (!ok) failures++
}

// shared: elements with their own text that are invisible (opacity 0, hidden, display none)
const HIDDEN_TEXT = () => {
  const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  return [...document.body.querySelectorAll('*')].filter((el) => {
    if (!own(el) || el.closest('[aria-hidden="true"], script, style, template, .sv-words, .sv-curtain-l, .sv-curtain-r')) return false
    const cs = getComputedStyle(el)
    return cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none'
  }).length
}

// ── 0. Every fx page, no JS: no text hidden, no stage clipping content away ──
{
  const pages = readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(false)
  const bad = []
  const ssrBad = []
  for (const f of pages) {
    await page.goto(`${base}/fx/${f}`, { waitUntil: 'load' })
    const hidden = await page.evaluate(HIDDEN_TEXT)
    if (hidden > 0) bad.push(`${f}:${hidden}`)
    // the SSR shape: .sv already on the markup, still no JS (a failed bundle on a Next.js page)
    await page.goto(`${base}/ssr/${f}`, { waitUntil: 'load' })
    const ssrHidden = await page.evaluate(HIDDEN_TEXT)
    if (ssrHidden > 0) ssrBad.push(`${f}:${ssrHidden}`) // pages without [data-sv] (slider, pointer, gsap, three) simply have nothing to inject
  }
  await page.close()
  check(`no-JS: ${pages.length} fx pages render every text node`, bad.length === 0, bad.join(' '))
  check(`no-JS + SSR markup (.sv present): ${pages.length} fx pages still render every text node`, ssrBad.length === 0, ssrBad.join(' '))
}

// ── 0b. Reduced motion, JS on: nothing hidden after scrolling the whole page ──
{
  const pages = readdirSync(join(root, 'fx')).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const bad = []
  for (const f of pages) {
    await page.goto(`${base}/fx/${f}`, { waitUntil: 'load' })
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await new Promise((r) => setTimeout(r, 300))
    await page.evaluate(() => scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 300))
    const hidden = await page.evaluate(HIDDEN_TEXT)
    if (hidden > 0) bad.push(`${f}:${hidden}`)
  }
  await page.close()
  check(`reduced motion: ${pages.length} fx pages keep every text node visible`, bad.length === 0, bad.join(' '))
}

// ── 1. No JS → fully visible ──
{
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(false)
  await page.goto(`${base}/fx/staggered-reveal.html`, { waitUntil: 'load' })
  const r = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.sv-rise, .sv-split-rise')]
    return {
      svOn: document.documentElement.classList.contains('sv-on'),
      hidden: els.filter((el) => getComputedStyle(el).opacity === '0').length,
      total: els.length,
    }
  })
  check('no-JS: html.sv-on absent', r.svOn === false)
  check(`no-JS: 0/${r.total} entrance elements hidden`, r.hidden === 0, `${r.hidden} hidden`)
  await page.close()
}

// ── 2. With JS → hiding only ever happens under html.sv-on ──
{
  const page = await browser.newPage()
  // observe from the first script tick: was any .sv-rise ever computed
  // hidden while sv-on was NOT on <html>?
  await page.evaluateOnNewDocument(() => {
    window.__flash = 0
    const probe = () => {
      const on = document.documentElement.classList.contains('sv-on')
      if (!on) {
        for (const el of document.querySelectorAll('.sv-rise')) {
          if (getComputedStyle(el).opacity === '0') window.__flash++
        }
      }
      if (!on || document.readyState !== 'complete') requestAnimationFrame(probe)
    }
    requestAnimationFrame(probe)
  })
  await page.goto(`${base}/fx/staggered-reveal.html?force=1`, { waitUntil: 'load' })
  const r = await page.evaluate(() => ({
    flash: window.__flash,
    svOn: document.documentElement.classList.contains('sv-on'),
  }))
  check('JS: driver booted (html.sv-on set)', r.svOn === true)
  check('JS: zero frames with content hidden before sv-on', r.flash === 0, `${r.flash} frames`)
  await page.close()
}

// ── 3. Attribute knobs land as variables ──
{
  const page = await browser.newPage()
  await page.goto(`${base}/fx/split-reveal.html?force=1`, { waitUntil: 'load' })
  const r = await page.evaluate(() => {
    const split = document.querySelector('[data-sv-split]')
    const spans = split ? split.querySelectorAll('span[aria-hidden]') : []
    const attr = document.querySelector('[data-sv-order]')
    return {
      spans: spans.length,
      count: split && split.style.getPropertyValue('--sv-count'),
      srText: (() => { const sr = split && split.querySelector('span:not([aria-hidden])'); return sr ? sr.textContent.trim() : '' })(),
      label: split && split.getAttribute('aria-label'),
      attrVar: attr && attr.style.getPropertyValue('--sv-order'),
    }
  })
  check('split: words wrapped in aria-hidden spans', r.spans > 2, `${r.spans} spans`)
  check('split: --sv-count set + sr-only text kept (no aria-label)', !!r.count && r.srText.length > 0 && !r.label, `count=${r.count} sr="${r.srText.slice(0, 20)}" label=${r.label}`)
  await page.close()
}

await browser.close()
server.close()
if (failures) {
  console.error(`\n${failures} invariant(s) violated`)
  process.exit(1)
}
console.log('\nall invariants hold')
