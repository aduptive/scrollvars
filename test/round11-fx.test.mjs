import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { transformSync } from 'esbuild'
import { readFileSync } from 'node:fs'
import { EFFECTS, COMPONENTS } from '../scripts/fx-data.mjs'

function installed(slug, { intrinsic = false } = {}) {
  let cursor = 0, pending = [], reduced = false
  const slots = [], observers = [], motion = new Set()
  const classes = new Set(), stage = { clientHeight: 900 }, fit = { offsetHeight: 400, scrollHeight: 400 }
  let flow = false, refreshes = 0
  if (intrinsic) Object.defineProperties(fit, {
    offsetHeight: { get: () => classes.has('st-ready') || classes.has('st-measuring') ? 900 : 1504 },
    scrollHeight: { get: () => fit.offsetHeight },
  })
  const shots = Array.from({ length: 2 }, () => {
    const attrs = new Map()
    return { attrs, setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) }
  })
  const shot = shots[0]
  const node = { querySelector: selector => selector === '.sv-stage' ? stage : selector === '[data-sv-fit]' ? fit : shot,
    querySelectorAll: () => shots, classList: {
      contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c),
      toggle: (c, on) => on ? classes.add(c) : classes.delete(c),
    }, hasAttribute: name => name === 'data-sv-flow' && flow }
  const ref = { current: node }
  let enhanced = false, onFlow, onStatus
  const React = {
    version: '19', createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value }] },
    useEffect(fn, deps) {
      const i = cursor++, old = slots[i]
      if (!old || deps.some((dep, j) => dep !== old.deps[j])) pending.push(() => {
        old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }
      })
    },
  }
  const core = { prefersReducedMotion: () => reduced, onMotionChange: fn => { motion.add(fn); return () => motion.delete(fn) }, refresh: () => { refreshes++ } }
  const module = { exports: {} }
  vm.runInNewContext(transformSync(COMPONENTS[slug].content, { loader: 'tsx', format: 'cjs' }).code, {
    exports: module.exports, module, require: name => name === 'react' ? React : name === 'scrollvars' ? core : name === 'gsap' ? {} : { Track: 'Track', useScenes: (_, opts) => { onFlow = opts.onFlow; onStatus = opts.onStatus; return { ref, scene: 0 } } },
    document: { documentElement: {} }, getComputedStyle: el => ({ position: enhanced ? el === stage ? 'sticky' : 'absolute' : 'static' }),
    MutationObserver: class { constructor(fn) { this.fn = fn; observers.push(this) } observe() {} takeRecords() { return [] } disconnect() { this.stopped = true } },
  })
  return {
    render(props) { cursor = 0; const tree = Object.values(module.exports)[0](props); const assign = t => { if (!t || typeof t !== 'object') return; if (t.props?.ref) t.props.ref.current = node; t.children?.flat(Infinity).forEach(assign) }; assign(tree); const effects = pending; pending = []; effects.forEach(fn => fn()); return tree },
    enhance(value) { enhanced = value; observers.forEach(o => { if (!o.stopped) o.fn() }) },
    fit(value) { onFlow(value) },
    firstFit() {
      const height = Math.max(fit.offsetHeight, fit.scrollHeight)
      flow = height > stage.clientHeight + 1
      onFlow(flow); onStatus('active')
      return { height, flow, refreshes }
    },
    status(value) { onStatus(value) },
    oversized(value) { fit.scrollHeight = value ? 1400 : 400 },
    motion(value) { reduced = value; motion.forEach(fn => fn(value)) },
    destroy() { slots.forEach(slot => slot?.cleanup?.()) },
    observers,
    shots,
    classes,
  }
}
const figures = tree => {
  const found = []
  const walk = t => { if (!t || typeof t !== 'object') return; if (t.type === 'figure') found.push(t); t.children?.flat(Infinity).forEach(walk) }
  walk(tree); return found
}

test('StickySteps only hides inactive shots while its enhanced layout is active', () => {
  const app = installed('sticky-steps')
  const props = { steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] }
  app.render(props)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], undefined)
  app.enhance(true)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], undefined, 'a class alone is not a successful fit measurement')
  app.fit(false)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], undefined, 'fit and CSS alone cannot prove an active lease')
  app.status('active')
  app.render(props)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], true)
  app.motion(true)
  assert.equal(figures(app.render(props))[1].props.inert, undefined)
  app.motion(false)
  assert.equal(figures(app.render(props))[1].props.inert, true)
  app.enhance(false)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], undefined)
  app.destroy()
  assert.ok(app.observers.every(o => o.stopped))
})

for (const status of ['failed', 'released']) test(`StickySteps restores reachable shots on ${status} without waiting for a DOM marker`, () => {
  const app = installed('sticky-steps')
  const props = { steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] }
  app.render(props); app.enhance(true); app.fit(false); app.status('active')
  assert.equal(figures(app.render(props))[1].props.inert, true)
  app.status(status)
  assert.equal(figures(app.render(props))[1].props.inert, undefined)
  app.motion(true); app.motion(false)
  assert.equal(figures(app.render(props))[1].props['aria-hidden'], undefined)
  app.destroy()
})

for (const failure of ['missing CSS', 'oversized layout']) test(`StickySteps active status cannot hide shots with ${failure}`, () => {
  const app = installed('sticky-steps')
  const props = { steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] }
  app.render(props); app.fit(false)
  if (failure === 'oversized layout') { app.oversized(true); app.enhance(true) }
  app.status('active')
  assert.equal(figures(app.render(props))[1].props.inert, undefined, failure)
  app.destroy()
})

test('StickySteps SSR keeps crossfade gated until the first successful fit outcome', () => {
  const app = installed('sticky-steps')
  const tree = app.render({ steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] })
  assert.ok(!tree.props.className.includes('st-ready'))
  assert.match(COMPONENTS['sticky-steps'].content, /\.sv-on \.sv-steps:where\(\.st-ready\) \.st-shot/)
  app.destroy()
})

test('StickySteps measures the stacked candidate before fit can latch its taller static rows', () => {
  const app = installed('sticky-steps', { intrinsic: true })
  const props = { steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] }
  app.render(props)
  app.enhance(true)
  assert.ok(app.classes.has('st-measuring'))
  assert.ok(!app.classes.has('st-ready'))
  assert.ok(app.shots.every(shot => !shot.attrs.has('inert') && !shot.attrs.has('aria-hidden')))
  assert.deepEqual(app.firstFit(), { height: 900, flow: false, refreshes: 1 })
  assert.ok(!app.classes.has('st-measuring'))
  assert.equal(figures(app.render(props))[1].props.inert, true)
  app.destroy()
})

test('StickySteps still latches flow when the candidate itself overflows', () => {
  const app = installed('sticky-steps')
  app.render({ steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] })
  app.enhance(true); app.oversized(true)
  assert.deepEqual(app.firstFit(), { height: 1400, flow: true, refreshes: 1 })
  assert.ok(!app.classes.has('st-measuring') && !app.classes.has('st-ready'))
  assert.ok(app.classes.has('st-static'))
  app.oversized(false); app.motion(true); app.motion(false)
  assert.ok(!app.classes.has('st-ready'))
  assert.ok(app.shots.every(shot => !shot.attrs.has('inert') && !shot.attrs.has('aria-hidden')))
  app.destroy()
})

test('StickySteps synchronizes accessibility when motion reverses before React renders', () => {
  const app = installed('sticky-steps')
  app.render({ steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }] })
  app.enhance(true); app.fit(false); app.status('active')
  assert.ok(app.shots[1].attrs.has('inert'))
  app.motion(true)
  assert.ok(!app.shots[1].attrs.has('inert'))
  app.motion(false)
  assert.ok(app.shots[1].attrs.has('inert'), 'restored without a React render')
  app.destroy()
})

test('GsapScrub rebuilds at the last scroll progress without waiting for another frame', () => {
  const app = installed('gsap-scrub')
  const first = [], second = []
  let kills = 0
  const buildTimeline = () => ({ progress: p => first.push(p), kill: () => kills++ })
  const tree = app.render({ buildTimeline })
  tree.props.onPin(.65)
  app.render({ buildTimeline: () => ({ progress: p => second.push(p), kill() {} }) })
  assert.equal(second.at(-1), .65)
  assert.equal(kills, 1)
  app.destroy()
})

test('GSAP preview follows the effective motion preference live', () => {
  const preview = EFFECTS.find(e => e.slug === 'gsap-scrub').preview
  let reduced = true, onMotion, onPin, value
  const timeline = { from() { return this }, to() { return this }, progress(p) { value = p } }
  vm.runInNewContext(preview.match(/<script>\s*([\s\S]*?)<\/script>/)[1], {
    addEventListener: (_, fn) => fn(), gsap: { timeline: () => timeline }, document: { getElementById() {} },
    matchMedia: () => ({ matches: false }),
    SV: { prefersReducedMotion: () => reduced, onMotionChange: fn => { onMotion = fn }, track: (_, opts) => { onPin = opts.onPin } },
  })
  assert.equal(value, 1)
  onPin(.4); assert.equal(value, 1)
  reduced = false; onMotion(false); assert.equal(value, .4)
  reduced = true; onMotion(true); assert.equal(value, 1)
})

test('Coverflow preview has the page-switch twin of its OS reset', () => {
  const preview = EFFECTS.find(e => e.slug === 'coverflow-slider').preview
  assert.match(preview, /:where\(\[data-sv-motion="reduce"\]\) \.fxslide\{scale:none;opacity:1;transform:none\}/)
})

test('legacy pin CSS hides parked curtains and wraps rails without compat', () => {
  const css = readFileSync(new URL('../styles/pin.css', import.meta.url), 'utf8').split('@supports not (translate: 0)')[1].split('/* ---- Accessibility')[0]
  assert.match(css, /html:not\(\[data-sv-compat\]\) \.sv \.sv-rail\s*\{[^}]*width: auto;[^}]*flex-wrap: wrap;/)
  assert.match(css, /html:not\(\[data-sv-compat\]\) \.sv \.sv-curtain-r\s*\{\s*display: none;/)
})
