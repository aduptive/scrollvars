/**
 * The isolated-installation gate (ADU-129).
 *
 * A gallery page proves an effect inside the whole demo site: every
 * stylesheet, the site chrome, the site's own CSS. A consumer gets none of
 * that. They run `npx scrollvars add <slug>`, import the stylesheets the
 * registry told them to import, and nothing else. This gate reproduces
 * exactly that, per effect:
 *
 *   - render-installed.mjs installs the component into a fresh temp dir with
 *     the real CLI and renders it with its previewProps, once under the React
 *     the repo installs and once under the isolated React 18
 *   - the page here loads ONLY `requires.styles` (plus the engine, plus a
 *     margin reset), never styles.css and never the gallery's CSS
 *   - three variants per effect: no engine (a consumer whose bundle failed),
 *     engine, engine under prefers-reduced-motion
 *
 * and asserts, per variant: the no-engine page renders complete (no hidden
 * text, list semantics intact, no inert content); with the engine the
 * effect's key behavior actually happens (the counters resolve above zero,
 * the timeline scrubs, the shots swap, the hero is split and live); reduced
 * motion hides nothing and adds no inert; and every focusable element it
 * counts is keyboard reachable, which today is a guard rather than a claim:
 * the four Sections render none with their preview props.
 *
 * One more pass at the end, same file because it must share the assertion:
 * the gallery CSS tab of each Section that declares a reduced-motion
 * behavior is rendered on its own and put through the identical probe. The
 * installed component and the pasteable tab are two spellings of one
 * section, and they have drifted (ADU-144, ADU-155).
 *
 * Called from e2e-invariants.mjs, which owns the browser and the `check`
 * counter and passes its own HIDDEN_TEXT probe in, so both suites judge
 * "hidden" by one definition.
 */
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// live source, not demo/fx/registry.json: the registry carries the installed
// component but not the gallery CSS tab, and reading the tab live means a
// mutation to it is provable red without a demo:sync in between
import { EFFECTS } from '../../../scripts/fx-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..', '..')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- in-page probes -------------------------------------------------------

// A <dl> may only hold dt/dd (directly, or grouped one level deep in a
// <div>), and a term with no readable definition is a term with no
// definition at all: an aria-hidden <dd> plus a loose <span> sibling passes
// every render test and reaches assistive tech as a dangling <dt>.
const LIST_SEMANTICS = () => {
  const OK = ['DT', 'DD', 'SCRIPT', 'TEMPLATE', 'STYLE']
  const bad = []
  let examined = 0
  for (const dl of document.querySelectorAll('dl')) {
    for (const child of dl.children) {
      if (child.tagName === 'DIV') {
        for (const kid of child.children) {
          if (!OK.includes(kid.tagName)) bad.push(`dl > div > ${kid.tagName.toLowerCase()}`)
        }
      } else if (!OK.includes(child.tagName)) {
        bad.push(`dl > ${child.tagName.toLowerCase()}`)
      }
    }
    for (const dt of dl.querySelectorAll('dt')) {
      examined++
      const group = dt.parentElement
      const readable = [...group.children].filter(
        (el) => el.tagName === 'DD' && el.getAttribute('aria-hidden') !== 'true' && el.textContent.trim()
      )
      if (!readable.length) bad.push(`dt "${dt.textContent.trim().slice(0, 28)}" has no readable dd`)
    }
  }
  return { bad, examined }
}

// inert removes a subtree from interaction. The one legitimate use in this
// markup is a decorative duplicate that is aria-hidden too (Marquee clones
// its track): inert WITHOUT aria-hidden is content announced but unusable.
const INERT_LIST = () =>
  [...document.body.querySelectorAll('[inert]')].map(
    (el) =>
      `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}` +
      `${el.getAttribute('aria-hidden') === 'true' ? '[aria-hidden]' : ''}`
  )

const FOCUSABLE = () => {
  const all = [...document.body.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
  const unreachable = all
    .filter((el) => {
      if (el.closest('[inert]') || el.closest('[aria-hidden="true"]')) return true
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return true
      return Number(el.getAttribute('tabindex') ?? 0) < 0
    })
    .map((el) => el.className || el.tagName)
  return { total: all.length, unreachable }
}

// ---- the key behavior of each Section, with the engine running ------------
// One entry per effect: what a reader would call "it works". Anything not
// listed here still gets every generic check above.
const BEHAVIOR = {
  'hero-cinematic': {
    what: 'the headline is split into words and the block goes live',
    async run(page) {
      await page.evaluate(() => document.querySelector('.sv-hero').scrollIntoView({ block: 'center' }))
      await sleep(1200)
      return page.evaluate(() => {
        const split = document.querySelector('.sv-split-rise')
        const words = split ? [...split.querySelectorAll('span[aria-hidden="true"]')] : []
        const tracked = document.querySelector('.sv-hero > .sv')
        const live = Boolean(tracked && tracked.classList.contains('sv-live'))
        const opacity = words.length ? getComputedStyle(words[0]).opacity : 'n/a'
        return {
          ok: words.length >= 3 && live && opacity === '1',
          detail: `words=${words.length} live=${live} firstWordOpacity=${opacity}`,
        }
      })
    },
  },
  'timeline-scrub': {
    what: 'the pin clock scrubs and the year counter counts up with it',
    async run(page) {
      const read = () =>
        page.evaluate(() => ({
          pin: Number(getComputedStyle(document.querySelector('.sv-timeline')).getPropertyValue('--sv-pin')),
          year: Number((getComputedStyle(document.querySelector('.tl-year')).counterReset.match(/-?\d+/) || [NaN])[0]),
        }))
      await page.evaluate(() => {
        const el = document.querySelector('.sv-timeline')
        scrollTo(0, el.getBoundingClientRect().top + scrollY)
      })
      await sleep(300)
      const start = await read()
      await page.evaluate(() => {
        const el = document.querySelector('.sv-timeline')
        scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight * 0.5)
      })
      await sleep(300)
      const mid = await read()
      return {
        ok: mid.pin > start.pin && mid.pin < 1 && mid.year > start.year,
        detail: `pin ${start.pin} → ${mid.pin}, year ${start.year} → ${mid.year}`,
      }
    },
  },
  'sticky-steps': {
    what: 'the scene clock advances and the shots crossfade',
    async run(page) {
      await page.evaluate(() => {
        const el = document.querySelector('.sv-steps')
        scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight * 0.9)
      })
      await sleep(400)
      return page.evaluate(() => {
        const scene = Number(getComputedStyle(document.querySelector('.sv-steps')).getPropertyValue('--sv-scene'))
        const shots = [...document.querySelectorAll('.st-shot')].map((el) => Number(getComputedStyle(el).opacity))
        const last = shots[shots.length - 1]
        return {
          ok: scene > 0.5 && last > 0.5 && shots[0] < 0.5,
          detail: `--sv-scene=${scene} shot opacities=${shots.join(',')}`,
        }
      })
    },
  },
  'stats-countup': {
    what: 'every counter resolves above zero once the block is live',
    async run(page) {
      await page.evaluate(() => document.querySelector('.sv-acts').scrollIntoView({ block: 'center' }))
      await sleep(2600) // --sv-acts-duration is 1.8s, plus the transition's own start
      return page.evaluate(() => {
        const act = getComputedStyle(document.querySelector('.sv-acts')).getPropertyValue('--sv-act').trim()
        const stats = [...document.querySelectorAll('.sv-acts .stat')]
        const resets = stats.map((el) => getComputedStyle(el).counterReset)
        const values = resets.map((r) => Number((r.match(/-?\d+(\.\d+)?/) || [NaN])[0]))
        return {
          ok: stats.length > 0 && values.every((v) => v > 0),
          detail: `--sv-act=${act} counter-reset=[${resets.join(' | ')}]`,
        }
      })
    },
  },
}

// ---- the key behavior of each Section UNDER prefers-reduced-motion, where
// it differs from the plain no-JS check above. One entry per effect that
// needs one: sticky-steps unpins its stage there (pin.css), so --sv-scene
// keeps advancing (the driver never stops writing it) while the CSS must
// reset every step and dot to fully opaque and unmoved, or the ones not at
// the current scene stay dimmed forever and the copy slides with the raw
// scroll (ADU-144). Read at whatever scroll position the reduced-motion
// sweep below already left the page at: only the step whose --i equals the
// current scene has st-d=0, so any other step still animated by st-d fails
// this the moment more than one step exists.
//
// Split in two on purpose: `settle` drives the real page (scroll, engine,
// timing) and `probe` reads the result. The gallery-CSS-tab gate at the
// bottom of this file reuses `probe` verbatim against the tab's own markup,
// so the block a reader pastes is judged by the very assertion the installed
// component passes, not by a second one that can drift from it (ADU-155).
const REDUCED_BEHAVIOR = {
  'sticky-steps': {
    what: 'every step and dot resets to fully opaque and unmoved',
    // the installed component's own wrapper class, the element the driver
    // writes --sv-scene on
    root: '.sv-steps',
    // what the driver writes on the tracked element once it is running, for
    // the tab gate, which sets these by hand instead of running the engine
    writes: { '--sv-scene': '1' },
    async settle(page, root) {
      // the stage unpins under reduced motion (pin.css restores its authored,
      // natural height): the generic sweep above (scroll to document bottom,
      // back to one viewport down) can leave a short, unpinned block already
      // scrolled fully past, --sv-scene pinned at 0. Scroll by the element's
      // own geometry instead, same approach as the BEHAVIOR check above.
      await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight * 0.9)
      }, root)
      await sleep(300)
    },
    // `steps.length > 0` is not decoration: with an empty list every() is
    // vacuously true, so a probe that found nothing would pass on nothing.
    probe: (root) => {
      const scene = getComputedStyle(document.querySelector(root)).getPropertyValue('--sv-scene').trim()
      const read = (el, prop) => `${getComputedStyle(el).opacity}/${getComputedStyle(el)[prop]}`
      const steps = [...document.querySelectorAll('.st-steps > li')].map((el) => read(el, 'translate'))
      const dots = [...document.querySelectorAll('.st-dots i')].map((el) => read(el, 'scale'))
      return {
        ok: steps.length > 0 && steps.every((s) => s === '1/none') && dots.every((d) => d === '1/none'),
        detail: `--sv-scene=${scene} steps=[${steps.join(', ')}] dots=[${dots.join(', ')}]`,
      }
    },
  },
}

// A gallery CSS tab is one string: the markup a reader copies, a blank line,
// then the CSS they paste into their stylesheet (the pane-pairing gate in
// test/cli-components.test.mjs leans on the same shape). A collapsed blank
// line is not a survivable input here: without it `css` would be almost
// nothing and `markup` would carry the CSS text as unstyled nodes, so every
// probe below would pass for having no stylesheet applied rather than for
// the behavior it claims to check. splitPane throws instead of guessing.
export const splitPane = (pane) => {
  const at = pane.search(/\n[ \t]*\n/)
  if (at === -1) {
    throw new Error('splitPane: no blank line separating markup from CSS in this pane')
  }
  return { markup: pane.slice(0, at), css: pane.slice(at) }
}

// ---- the page: only what the registry told the consumer to import ---------
const page = ({ css, markup, engine, script }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>installed</title>
<style>${css}</style>
<style>body { margin: 0; font: 16px/1.5 system-ui, sans-serif; background: #101014; color: #eaeaf0 }
.gate-runway { height: 100vh }</style>
</head><body>
<div class="gate-runway"></div>
${markup}
<div class="gate-runway"></div>
${engine ? `<script>${engine}</script>` : ''}
${engine && script ? `<script>${script}</script>` : ''}
</body></html>`

/** Runs render-installed.mjs in `node`, optionally through the React 18 loader hook. */
function renderPayload(react18) {
  const args = react18
    ? ['--import', join(repo, 'scripts', 'react18-register.mjs'), join(here, 'render-installed.mjs')]
    : [join(here, 'render-installed.mjs')]
  return JSON.parse(execFileSync(process.execPath, args, { cwd: here, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
}

export async function installedGate({ browser, check, HIDDEN_TEXT }) {
  const pages = new Map()
  const server = createServer((req, res) => {
    const body = pages.get(req.url.split('?')[0])
    if (body === undefined) {
      res.statusCode = 404
      return res.end()
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(body)
  })
  await new Promise((r) => server.listen(0, r))
  const base = `http://127.0.0.1:${server.address().port}`
  const engine = readFileSync(join(repo, 'demo', 'fx', 'sv.js'), 'utf8')
  // Every page this gate opens is closed in the finally below: a throw in the
  // render path (the CLI failing to install, a fixture that will not render)
  // must not leave a listening socket and a pile of tabs behind in a run that
  // still has suites to go. The browser itself belongs to the caller.
  const open = new Set()
  const newPage = async () => {
    const p = await browser.newPage()
    open.add(p)
    return p
  }
  try {
    // The React 18 pass is not optional: a <style> child serialized differently
    // by the other supported major is exactly the class of bug this gate exists
    // for, so a missing install fails loudly instead of quietly halving coverage.
    const react18Present = existsSync(join(repo, 'node_modules', '.cache', 'react18', 'node_modules', 'react'))
    check(
      'installed: the isolated React 18 is available to render against',
      react18Present,
      'run `node scripts/react18-install.mjs` (npm run test:e2e does it for you)'
    )

    for (const react18 of react18Present ? [false, true] : [false]) {
      const payload = renderPayload(react18)
      const tag = `react ${payload.react}`
      check(`installed(${tag}): the CLI installed and rendered every Section`, payload.effects.length > 0, 'nothing rendered')

      for (const fx of payload.effects) {
        const css = fx.styles.map((name) => readFileSync(join(repo, 'styles', `${name}.css`), 'utf8')).join('\n')
        const declared = fx.styles.length ? fx.styles.map((n) => `${n}.css`).join(' + ') : '(no stylesheet)'
        const noJs = `/${react18 ? '18' : '19'}/${fx.slug}/no-js`
        const withJs = `/${react18 ? '18' : '19'}/${fx.slug}/js`
        pages.set(noJs, page({ css, markup: fx.markup, engine: '', script: '' }))
        pages.set(withJs, page({ css, markup: fx.markup, engine, script: fx.previewScript }))

        // 1. no engine: the page a consumer whose bundle never loaded still gets
        const p = await newPage()
        await p.goto(base + noJs, { waitUntil: 'load' })
        const hidden = await p.evaluate(HIDDEN_TEXT)
        const semantics = await p.evaluate(LIST_SEMANTICS)
        const inertNoJs = await p.evaluate(INERT_LIST)
        check(
          `installed(${tag}) ${fx.slug} [${declared}]: renders complete with no engine`,
          hidden === 0,
          `${hidden} hidden text element(s)`
        )
        check(
          `installed(${tag}) ${fx.slug}: list semantics hold (${semantics.examined} term(s) examined)`,
          semantics.bad.length === 0,
          semantics.bad.join('; ')
        )
        check(
          `installed(${tag}) ${fx.slug}: nothing is inert without aria-hidden`,
          inertNoJs.every((d) => d.endsWith('[aria-hidden]')),
          inertNoJs.join(' ')
        )
        await p.close()

        // 2. engine loaded: the effect's own key behavior, on the declared CSS only
        const behavior = BEHAVIOR[fx.slug]
        if (behavior) {
          const b = await newPage()
          await b.setViewport({ width: 1200, height: 800 })
          await b.goto(base + withJs, { waitUntil: 'load' })
          const result = await behavior.run(b)
          check(`installed(${tag}) ${fx.slug} [${declared}]: ${behavior.what}`, result.ok, result.detail)
          const keys = await b.evaluate(FOCUSABLE)
          check(
            `installed(${tag}) ${fx.slug}: all ${keys.total} focusable element(s) stay keyboard reachable`,
            keys.unreachable.length === 0,
            keys.unreachable.join(' ')
          )
          await b.close()
        }

        // 3. reduced motion: nothing hidden, and no inert the static markup did not already carry
        const r = await newPage()
        await r.setViewport({ width: 1200, height: 800 })
        await r.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
        await r.goto(base + withJs, { waitUntil: 'load' })
        await r.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
        await sleep(300)
        await r.evaluate(() => scrollTo(0, innerHeight))
        await sleep(300)
        const reducedHidden = await r.evaluate(HIDDEN_TEXT)
        const reducedInert = await r.evaluate(INERT_LIST)
        check(
          `installed(${tag}) ${fx.slug}: reduced motion hides nothing`,
          reducedHidden === 0,
          `${reducedHidden} hidden text element(s)`
        )
        check(
          `installed(${tag}) ${fx.slug}: reduced motion adds no inert content`,
          reducedInert.length === inertNoJs.length,
          `${inertNoJs.length} → ${reducedInert.length}: ${reducedInert.join(' ')}`
        )
        const reducedBehavior = REDUCED_BEHAVIOR[fx.slug]
        if (reducedBehavior) {
          await reducedBehavior.settle(r, reducedBehavior.root)
          const result = await r.evaluate(reducedBehavior.probe, reducedBehavior.root)
          check(`installed(${tag}) ${fx.slug}: reduced motion, ${reducedBehavior.what}`, result.ok, result.detail)
        }
        await r.close()
      }
    }

    // ---- the gallery CSS tab, which is the block a reader actually pastes --
    // The installed component and the tab are two spellings of one section and
    // ADU-155 caught them drifting twice: first the tab had no reduced-motion
    // reset for its steps at all, then the reset was there but sat BEFORE the
    // rule it has to beat. Same selector, same specificity, later wins, so a
    // media block above the base rule never applies no matter which one the
    // media query matches. No gate that reads selector TEXT can see that, so
    // this one reads the rendered result: the tab's own markup with ONLY the
    // tab's own CSS (a reader pasting it has nothing else of ours on the
    // page), what the driver writes set by hand (html.sv-on plus the effect's
    // vars, so the assertion is about the cascade and not about pin geometry
    // or scroll timing), and then the SAME probe the installed component just
    // passed. An effect enters this loop by gaining a REDUCED_BEHAVIOR entry.
    for (const fx of EFFECTS) {
      const reduced = REDUCED_BEHAVIOR[fx.slug]
      if (!reduced || !fx.css || fx.category !== 'Sections') continue
      const pane = splitPane(fx.css)
      const url = `/tab/${fx.slug}`
      pages.set(url, page({ css: pane.css, markup: pane.markup, engine: '', script: '' }))
      const t = await newPage()
      await t.setViewport({ width: 1200, height: 800 })
      await t.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      await t.goto(base + url, { waitUntil: 'load' })
      // every Section tab is one tracked block: the [data-sv] element is what
      // the driver would carry the class and the vars on
      await t.evaluate((writes) => {
        document.documentElement.classList.add('sv-on')
        const root = document.querySelector('[data-sv]')
        for (const [k, v] of Object.entries(writes)) root.style.setProperty(k, v)
      }, reduced.writes)
      const result = await t.evaluate(reduced.probe, '[data-sv]')
      check(`gallery tab ${fx.slug}: reduced motion, ${reduced.what}`, result.ok, result.detail)
      await t.close()
    }
  } finally {
    server.close()
    for (const p of open) await p.close().catch(() => {})
  }
}
