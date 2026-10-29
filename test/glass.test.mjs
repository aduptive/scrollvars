import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { lifecycleEnv } from './lifecycle-fixture.mjs'
import { mountGlass } from '../dist/glass/index.js'
import { Glass } from '../dist/react/glass.js'
import { setMotion } from '../dist/core/motion.js'

function context(canvas) {
  const calls = [], resources = new Set()
  const gl = new Proxy({ FRAMEBUFFER_COMPLETE: 'FRAMEBUFFER_COMPLETE', checkFramebufferStatus: () => 'FRAMEBUFFER_COMPLETE', NO_ERROR: 0, getError: () => 0, getShaderParameter: () => true, getProgramParameter: () => true, getAttribLocation: () => 0, getUniformLocation: (_, key) => key }, {
    get(target, key) {
      if (key in target) return target[key]
      if (/^[A-Z_0-9]+$/.test(key)) return key
      return (...args) => {
        calls.push([key, ...args])
        if (key.startsWith('create')) { const resource = {}; resources.add(resource); return resource }
        if (key.startsWith('delete')) resources.delete(args[0])
      }
    },
  })
  canvas.getContext = () => gl
  return { calls, resources, gl, count: name => calls.filter(c => c[0] === name).length }
}

test('Glass SSR: div/span preserve real content; decorative canvas is hidden without JS', () => {
  for (const as of ['div', 'span']) {
    const markup = renderToStaticMarkup(React.createElement(Glass, { as, source: () => { throw Error('SSR must not paint') } }, React.createElement('strong', null, 'Accessible text')))
    assert.ok(markup.startsWith(`<${as} class="sv-glass">`))
    assert.match(markup, /<strong>Accessible text<\/strong>/)
    assert.match(markup, /aria-hidden="true" hidden=""/)
  }
})

test('Glass: unchanged frames skip GPU work; material updates reuse source; invalidation recaptures; release is complete', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas)
    canvas.hidden = true
    let paints = 0
    const handle = mountGlass(canvas, { source: () => { paints++; return {} } })
    assert.equal(canvas.hidden, false, 'canvas must be measurable at attach')
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([])
    env.flush()
    assert.equal(paints, 1); assert.equal(gpu.count('drawArrays'), 1)
    env.flush(); env.flush()
    assert.equal(gpu.count('drawArrays'), 1)
    handle.update({ edgeWidth: 20, refraction: 80, dispersion: 30, interior: 0, position: 70 })
    env.flush()
    assert.equal(paints, 1); assert.equal(gpu.count('drawArrays'), 2)
    assert.ok(gpu.calls.some(c => c[0] === 'uniform1f' && c[1] === 'u_edge_width' && c[2] === .2))
    handle.update({ edgeWidth: 20 }); env.flush()
    assert.equal(gpu.count('drawArrays'), 2)
    assert.throws(() => handle.update({ edgeWidth: NaN }), /finite/)
    handle.invalidateSource(); env.flush(); assert.equal(paints, 2)
    handle.pause(); assert.equal(env.frames.size, 0)
    handle.update({ position: 10 }); handle.resume(); env.flush()
    assert.equal(gpu.count('drawArrays'), 4)
    handle.destroy(); handle.destroy()
    handle.invalidateSource(); handle.update({ interior: 100 }); handle.resume()
    assert.equal(canvas.hidden, true)
    assert.equal(gpu.resources.size, 0)
    assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

for (const failure of ['source', 'compile', 'context-lost', 'no-webgl', 'texture-allocation', 'draw']) test(`Glass failure preserves HTML fallback and releases resources: ${failure}`, () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas), errors = []
    if (failure === 'no-webgl') canvas.getContext = () => null
    if (failure === 'compile') gpu.gl.getShaderParameter = () => false
    if (failure === 'texture-allocation') gpu.gl.createTexture = () => { throw Error('allocation failed') }
    if (failure === 'draw') gpu.gl.getError = () => 1282
    const handle = mountGlass(canvas, { source: () => { if (failure === 'source') throw Error('tainted source'); return {} }, onError: e => errors.push(e) })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([])
    env.flush()
    if (failure === 'context-lost') canvas.fire('webglcontextlost', { preventDefault() {} })
    assert.equal(errors.length, 1)
    assert.equal(canvas.hidden, true)
    assert.equal(gpu.resources.size, 0)
    assert.deepEqual(env.baseline(), [0, 0, 0, 0])
    handle.destroy()
  } finally { env.restore() }
})

test('Glass: independent instances, resize recaptures, hidden/offscreen gates prevent draws', () => {
  const env = lifecycleEnv()
  try {
    const a = env.canvas(), b = env.canvas(), ga = context(a), gb = context(b)
    const first = mountGlass(a, { source: () => ({}) }), second = mountGlass(b, { source: () => ({}) })
    env.deliveries.filter(o => o.kind === 'ResizeObserver').forEach(o => o.cb([])); env.flush()
    first.update({ edgeWidth: 1 }); env.flush()
    assert.equal(ga.count('drawArrays'), 2); assert.equal(gb.count('drawArrays'), 1)
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([{ contentRect: { width: 200, height: 100 } }]); env.flush()
    assert.equal(ga.count('texImage2D'), 2)
    const io = env.deliveries.find(o => o.kind === 'IntersectionObserver')
    io.cb([{ isIntersecting: false }]); first.update({ position: 2 }); env.flush()
    assert.equal(ga.count('drawArrays'), 3)
    io.cb([{ isIntersecting: true }]); env.flush(); assert.equal(ga.count('drawArrays'), 4)
    document.visibilityState = 'hidden'; document.fire('visibilitychange')
    first.update({ position: 3 }); env.flush(); assert.equal(ga.count('drawArrays'), 4)
    first.destroy(); second.destroy(); assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

test('Glass: reduced motion freezes position and resumes the latest requested position', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas)
    const handle = mountGlass(canvas, { source: () => ({}), position: 10 })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([]); env.flush()
    const firstX = () => gpu.calls.filter(c => c[0] === 'uniform2fv').at(-1)[2][0]
    assert.ok(Math.abs(firstX() - -11) < .001)
    setMotion('reduce'); env.flush(); assert.ok(Math.abs(firstX() - 21) < .001)
    handle.update({ position: 70 }); env.flush(); assert.ok(Math.abs(firstX() - 21) < .001)
    setMotion('auto'); env.flush(); assert.ok(Math.abs(firstX() - 49) < .001)
    handle.destroy(); assert.deepEqual(env.baseline(), [0, 0, 0, 0])
  } finally { env.restore() }
})

test('Glass material: opacity, hex color, blur and edge light update without recapturing the scene', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas)
    let paints = 0
    const handle = mountGlass(canvas, { source: () => { paints++; return {} } })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([]); env.flush()
    const scalar = name => gpu.calls.filter(c => c[0] === 'uniform1f' && c[1] === name).at(-1)[2]
    assert.equal(scalar('u_opacity'), 1); assert.equal(gpu.count('createFramebuffer'), 0); assert.equal(scalar('u_edge_glow'), .12)
    handle.update({ opacity: 70, color: '#abc', blur: 4, edgeGlow: 85 }); env.flush()
    assert.equal(scalar('u_opacity'), .7); assert.equal(scalar('u_sigma'), 4); assert.equal(scalar('u_edge_glow'), .85)
    const color = gpu.calls.filter(c => c[0] === 'uniform3fv').at(-1)[2]
    assert.ok(Math.abs(color[0] - 170/255) < 1e-6)
    assert.ok(Math.abs(color[1] - 187/255) < 1e-6)
    assert.ok(Math.abs(color[2] - 204/255) < 1e-6)
    assert.equal(paints, 1)
    const draws = gpu.count('drawArrays')
    handle.update({ color: '#AABBCC' }); env.flush(); assert.equal(gpu.count('drawArrays'), draws)
    handle.update({ opacity: -1, blur: 100, edgeGlow: 200 }); env.flush()
    assert.equal(scalar('u_opacity'), 0); assert.equal(scalar('u_sigma'), 24); assert.equal(scalar('u_edge_glow'), 1)
    for (const bad of [{ color: 'red' }, { color: '#12' }, { blur: NaN }, { opacity: Infinity }, { edgeGlow: NaN }])
      assert.throws(() => handle.update(bad), /finite|color/)
    handle.destroy(); assert.equal(gpu.resources.size, 0)
  } finally { env.restore() }
})

test('Glass light: pointer, fixed point, float and reduced motion share the harness and cached scene', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas)
    let paints = 0
    const handle = mountGlass(canvas, { source: () => { paints++; return {} }, lightMode: 'pointer', edgeGlow: 80 })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([]); env.flush()
    const light = () => gpu.calls.filter(c => c[0] === 'uniform2f' && c[1] === 'u_light').at(-1).slice(2)
    assert.deepEqual(light(), [.25, 0])
    canvas.fire('pointermove', { clientX: 75, clientY: 40 }); env.flush(); assert.deepEqual(light(), [.75, .4])
    canvas.fire('pointerleave'); env.flush(); assert.deepEqual(light(), [.25, 0])
    handle.update({ lightMode: 'static', lightX: 80, lightY: 20 }); env.flush(); assert.deepEqual(light(), [.8, .2])
    const draws = gpu.count('drawArrays'); canvas.fire('pointermove', { clientX: 1, clientY: 2 }); env.flush()
    assert.equal(gpu.count('drawArrays'), draws)
    let clock = performance.now()
    const step = () => { const batch = [...env.frames]; env.frames.clear(); clock += 16; for (const [,fn] of batch) fn(clock) }
    handle.update({ lightMode: 'float' }); step(); const a = light(); step(); assert.notDeepEqual(light(), a)
    setMotion('reduce'); env.flush(); assert.deepEqual(light(), [.8, .2])
    const reducedDraws = gpu.count('drawArrays'); env.flush(); assert.equal(gpu.count('drawArrays'), reducedDraws)
    assert.equal(paints, 1)
    assert.throws(() => handle.update({ lightMode: 'unknown' }), /lightMode/)
    handle.destroy(); assert.deepEqual(env.baseline(), [0,0,0,0])
  } finally { env.restore() }
})

test('Glass Gaussian prepass: two passes only on source/radius changes, zero bypass, full disposal', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas)
    let captures = 0
    const handle = mountGlass(canvas, { source: () => { captures++; return {} }, blur: 12 })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([]); env.flush()
    assert.equal(gpu.count('drawArrays'), 3, 'horizontal, vertical, then refracted glass')
    const axes = () => gpu.calls.filter(c => c[0] === 'uniform2f' && c[1] === 'u_axis').map(c => c.slice(2))
    assert.deepEqual(axes(), [[.01,0],[0,.01]])
    env.flush(); assert.equal(gpu.count('drawArrays'), 3)
    handle.update({ lightX: 60 }); env.flush(); assert.equal(gpu.count('drawArrays'), 4)
    assert.equal(axes().length, 2, 'moving light reuses the blurred texture')
    handle.update({ blur: 24 }); env.flush(); assert.equal(gpu.count('drawArrays'), 7)
    assert.equal(captures, 1, 'radius change never recaptures DOM/source')
    handle.update({ blur: 0 }); env.flush(); assert.equal(gpu.count('drawArrays'), 8)
    handle.update({ blur: 24 }); env.flush(); assert.equal(gpu.count('drawArrays'), 9, 'previous blur is cached')
    handle.invalidateSource(); env.flush(); assert.equal(gpu.count('drawArrays'), 12); assert.equal(captures, 2)
    handle.destroy(); assert.equal(gpu.resources.size, 0); assert.deepEqual(env.baseline(), [0,0,0,0])
  } finally { env.restore() }
})

test('Glass Gaussian prepass failure: incomplete framebuffer releases every resource and keeps fallback', () => {
  const env = lifecycleEnv()
  try {
    const canvas = env.canvas(), gpu = context(canvas), errors = []
    gpu.gl.checkFramebufferStatus = () => 'INCOMPLETE'
    const handle = mountGlass(canvas, { source: () => ({}), blur: 10, onError: error => errors.push(error) })
    env.deliveries.find(o => o.kind === 'ResizeObserver').cb([]); env.flush()
    assert.match(errors[0].message, /framebuffer incomplete/)
    assert.equal(canvas.hidden, true); assert.equal(gpu.resources.size, 0)
    assert.deepEqual(env.baseline(), [0,0,0,0]); handle.destroy()
  } finally { env.restore() }
})
