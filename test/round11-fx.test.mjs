import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { transformSync } from 'esbuild'
import { readFileSync } from 'node:fs'
import { EFFECTS, COMPONENTS } from '../scripts/fx-data.mjs'

function installed(slug, { intrinsic = false, flowingStage = false, shotCount = 2 } = {}) {
  let cursor = 0, pending = [], reduced = false
  let fault, throwDispose = false
  const reports = []
  const slots = [], observers = [], motion = new Set()
  const classes = new Set(), stage = { clientHeight: 900 }, fit = { offsetHeight: 400, scrollHeight: 400 }
  if (flowingStage) Object.defineProperty(stage, 'clientHeight', { get: () => classes.has('st-static') ? fit.scrollHeight : 900 })
  let flow = false, refreshes = 0
  if (intrinsic) Object.defineProperties(fit, {
    offsetHeight: { get: () => classes.has('st-ready') || classes.has('st-measuring') ? 900 : 1504 },
    scrollHeight: { get: () => fit.offsetHeight },
  })
  const shots = Array.from({ length: shotCount }, () => {
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
    console: { error: (...args) => reports.push(args) },
    document: { documentElement: {} }, getComputedStyle: el => {
      if (fault === 'read') { fault = undefined; throw Error('one-shot style read') }
      return { position: enhanced ? el === stage ? 'sticky' : 'absolute' : 'static' }
    },
    MutationObserver: class { constructor(fn) { this.fn = fn; observers.push(this) } observe() {} takeRecords() { return [] } disconnect() { this.stopped = true; if (throwDispose) throw Error('disconnect failed after release') } },
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
    inject(kind) {
      throwDispose = true
      if (kind === 'read') fault = kind
      else {
        const original = shots[1].setAttribute
        shots[1].setAttribute = (...args) => { shots[1].setAttribute = original; throw Error('one-shot accessibility write') }
      }
    },
    reports, motionListeners: motion,
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

for (const fault of ['read', 'write']) test(`StickySteps contains a later ${fault} failure, drains cleanup and ignores queued deliveries`, () => {
  const props = { steps: [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }, { title: 'Three', media: 'C' }] }
  const app = installed('sticky-steps', { shotCount: 3 }), sibling = installed('sticky-steps', { shotCount: 3 })
  for (const instance of [app, sibling]) {
    instance.render(props); instance.enhance(true); instance.fit(false); instance.status('active')
    assert.equal(figures(instance.render(props))[1].props.inert, true)
    assert.equal(instance.shots.filter(s => s.attrs.has('inert')).length, 2)
  }
  const queued = app.observers[0].fn
  app.inject(fault)
  assert.doesNotThrow(queued)
  assert.equal(app.motionListeners.size, 0, 'motion cleanup runs even after disconnect throws')
  assert.ok(app.observers.every(o => o.stopped))
  assert.equal(app.reports.length, 1)
  for (let i = 0; i < 2; i++) {
    queued(); app.status('active'); app.fit(false); app.motion(false)
    assert.equal(figures(app.render(props))[1].props.inert, undefined)
    assert.ok(app.shots.every(s => !s.attrs.has('inert') && !s.attrs.has('aria-hidden')))
    assert.ok(!app.classes.has('st-ready') && !app.classes.has('st-measuring') && app.classes.has('st-static'))
  }
  assert.equal(app.reports.length, 1)
  assert.equal(figures(sibling.render(props))[1].props.inert, true)
  assert.doesNotThrow(() => app.destroy())
  const remount = installed('sticky-steps', { shotCount: 3 })
  remount.render(props); remount.enhance(true); remount.fit(false); remount.status('active')
  assert.equal(figures(remount.render(props))[1].props.inert, true)
  remount.destroy(); sibling.destroy()
})

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

test('StickySteps leaves the overflowing candidate measurable until the driver latches flow', () => {
  const app = installed('sticky-steps', { flowingStage: true })
  const steps = [{ title: 'One', media: 'A' }, { title: 'Two', media: 'B' }]
  app.render({ steps }); app.enhance(true); app.firstFit()
  app.oversized(true)
  app.render({ steps: steps.map(s => ({ ...s, text: 'Replacement content' })) })
  assert.equal(app.firstFit().flow, true, 'static stage expansion must not swallow actual overflow')
  assert.ok(app.classes.has('st-static'))
  assert.ok(app.shots.every(s => !s.attrs.has('inert')))
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

test('gallery StickySteps contains every callback entry and releases even a late synchronous attachment', () => {
  const source = EFFECTS.find(e => e.slug === 'sticky-steps').previewScript
  for (const entry of ['observer', 'motion', 'status', 'fit', 'scene', 'attaching']) {
    const classes = new Set(), attrs = [new Map(), new Map(), new Map()]
    const shots = attrs.map(a => ({ setAttribute: (k, v) => a.set(k, v), removeAttribute: k => a.delete(k) }))
    const stage = { clientHeight: 900 }, fit = { offsetHeight: 400, scrollHeight: 400 }
    const el = { querySelectorAll: () => shots, hasAttribute: () => false,
      querySelector: s => s === '.sv-stage' ? stage : fit,
      classList: { remove: c => classes.delete(c), add: c => classes.add(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) } }
    let observer, motion, options, armed = false, disconnects = 0, unsubscribes = 0, releases = 0
    const reports = []
    vm.runInNewContext(source, {
      addEventListener: (_, fn) => fn(), document: { documentElement: {}, querySelector: () => el },
      console: { error: e => reports.push(e) },
      getComputedStyle: node => { if (armed) { armed = false; throw Error('late read') }; return { position: node === stage ? 'sticky' : 'absolute' } },
      MutationObserver: class {
        constructor(fn) { observer = fn } observe() {} takeRecords() {}
        disconnect() { disconnects++; throw Error('dispose') }
      },
      SV: { prefersReducedMotion: () => false, refresh() {}, onMotionChange(fn) { motion = fn; return () => { unsubscribes++ } },
        track(_, opts) { options = opts; opts.onFlow(false); armed = entry === 'attaching'; opts.onStatus('active'); return () => { releases++; opts.onStatus('released') } } },
    })
    if (entry !== 'attaching') {
      assert.equal(attrs.filter(a => a.has('inert')).length, 2)
      armed = true
      const call = { observer, motion, status: () => options.onStatus('active'), fit: () => options.onFlow(false), scene: () => options.onScene(2) }[entry]
      assert.doesNotThrow(call)
    }
    observer(); motion(); options.onScene(1); options.onStatus('active'); options.onFlow(false)
    assert.deepEqual([disconnects, unsubscribes, releases, reports.length], [1, 1, 1, 1], entry)
    assert.ok(attrs.every(a => !a.has('inert') && !a.has('aria-hidden')), entry)
    assert.ok(classes.has('st-static') && !classes.has('st-measuring') && !classes.has('st-ready'), entry)
  }
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
