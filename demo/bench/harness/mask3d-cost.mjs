#!/usr/bin/env node
/**
 * cube-windows: the hull of the 8 projected corners (the original prototype's
 * own project()+hull()) against mask3d-core's faces()/silhouette() union,
 * per-frame script cost in real Chrome.
 *
 *   node mask3d-cost.mjs [instances] [frames]
 *
 * Both variants turn the SAME box through the SAME pose sweep and write a
 * real clip-path onto a real element every frame; per the load-check rule,
 * read sysctl vm.loadavg before and after and treat a run taken under load
 * as provisional (rerun under a quiet machine wins). The rendered-output
 * check: for a plain convex box the two silhouettes must coincide exactly
 * (sampled by nonzero-winding point-in-path over a grid, both DECORATE the
 * clip they write with an actual project+union so neither is a frozen or
 * degenerate shortcut winning on artificially cheap timing).
 */
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const N = Number(process.argv[2] ?? 40) // box instances per variant
const FRAMES = Number(process.argv[3] ?? 240)

const loadavg = () => execFileSync('sysctl', ['-n', 'vm.loadavg']).toString().trim()
console.log('load before:', loadavg(), '| uptime:', execFileSync('uptime').toString().trim())

const PAGE = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="hull"></div><div id="faces"></div>
<script>
// mask3d-core, trimmed to what this screen needs (area/extrude/faces/silhouette/pathOf/toClipPath/bounds/box).
function area(poly) {
  let s = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
  return s / 2
}
function extrude(contours, depth, pivot) { return { contours, depth, pivot: pivot || [0, 0] } }
function faces(piece, angle, pose, focal, out) {
  out = out || []
  const ry = pose.ry || 0, rx = pose.rx || 0, cx = pose.cx || 0, cy = pose.cy || 0
  const cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx)
  const ca = Math.cos(angle), sa = Math.sin(angle)
  const px = piece.pivot[0]
  const put = (x, y, z) => {
    let dx = x - px
    ;[dx, z] = [dx * ca + z * sa, -dx * sa + z * ca]
    let X = px + dx - cx, Y = y - cy, Z = z
    ;[X, Z] = [X * cosY + Z * sinY, -X * sinY + Z * cosY]
    ;[Y, Z] = [Y * cosX - Z * sinX, Y * sinX + Z * cosX]
    const s = focal / (focal + Z)
    return [X * s, Y * s]
  }
  const front = piece.contours.map((c) => c.map(([x, y]) => put(x, y, -piece.depth / 2)))
  const back = piece.contours.map((c) => c.map(([x, y]) => put(x, y, piece.depth / 2)))
  for (const face of [front, back]) {
    const flip = face.reduce((sum, c) => sum + area(c), 0) < 0
    for (const c of face) out.push(flip ? [...c].reverse() : c)
  }
  front.forEach((c, k) => {
    const b = back[k]
    for (let i = 0; i < c.length; i++) {
      const q = [c[i], c[(i + 1) % c.length], b[(i + 1) % c.length], b[i]]
      if (area(q) > 1e-7) out.push(q)
    }
  })
  return out
}
function silhouette(pieces, pose, focal, angles) {
  angles = angles || []
  const out = []
  pieces.forEach((piece, i) => faces(piece, angles[i] || 0, pose, focal, out))
  return out
}
const r1 = (n) => Math.round(n * 10) / 10
function pathOf(polys, ox, oy, scale) {
  let d = ''
  for (const p of polys) {
    d += 'M'
    for (const [x, y] of p) d += r1(ox + x * scale) + ' ' + r1(oy + y * scale) + ' '
    d += 'Z'
  }
  return d
}
function toClipPath(polys, ox, oy, scale) { return "path('" + pathOf(polys, ox, oy, scale) + "')" }
function bounds(pieces, poses, focal) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const pose of poses) {
    for (const poly of silhouette(pieces, pose, focal, pose.angles)) {
      for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    }
  }
  return { x0, x1, y0, y1 }
}
function box(w, h, d) { return extrude([[[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]], d, [0, 0]) }

// The prototype's own project()+hull(), same rotation convention and unit
// system as faces() above (element-width units, not %).
function projectCorners(ry, rx, w, h, d, focal) {
  const pts = []
  for (let i = 0; i < 8; i++) {
    let x = (i & 1 ? .5 : -.5) * w, y = (i & 2 ? .5 : -.5) * h, z = (i & 4 ? .5 : -.5) * d
    ;[x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)]
    ;[y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)]
    const s = focal / (focal + z)
    pts.push([x * s, y * s])
  }
  return pts
}
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list) => {
    const out = []
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    return out.slice(0, -1)
  }
  return [...half(p), ...half([...p].reverse())]
}
function polygonPath(pts, ox, oy, scale) {
  return 'polygon(' + pts.map(([x, y]) => r1(ox + x * scale) + 'px ' + r1(oy + y * scale) + 'px').join(',') + ')'
}

const N = __N__, FRAMES = __FRAMES__, FOCAL = 2.4
const boxSize = [.9, .5, .5]
const solid = box(boxSize[0], boxSize[1], boxSize[2])
const turn = [-1.4, .35, .8, -.1]
const ry0 = turn[0], ry1 = turn[1], rx0 = turn[2], rx1 = turn[3]
const poseAt = (t, hx, hy) => ({ ry: ry0 + (ry1 - ry0) * t + hx * .5, rx: rx0 + (rx1 - rx0) * t - hy * .35, cx: 0, cy: 0 })

function mount(container) {
  const els = []
  for (let i = 0; i < N; i++) {
    const el = document.createElement('div')
    el.style.width = '200px'
    el.style.height = '150px'
    container.appendChild(el)
    els.push(el)
  }
  return els
}
const hullEls = mount(document.getElementById('hull'))
const facesEls = mount(document.getElementById('faces'))

const poses = []
for (let s = 0; s <= 20; s++) for (const hx of [-1, 0, 1]) for (const hy of [-1, 0, 1]) poses.push(poseAt(s / 20, hx, hy))
const b = bounds([solid], poses, FOCAL)
const W = 200, H = 150
const k = Math.min(W / (b.x1 - b.x0), H / (b.y1 - b.y0))
const ox = W / 2 - (b.x0 + b.x1) / 2 * k, oy = H / 2 - (b.y0 + b.y1) / 2 * k

window.__samples = { hull: [], faces: [] }
function drawHull(el, t, hx, hy) {
  const pose = poseAt(t, hx, hy)
  const pts = projectCorners(pose.ry, pose.rx, boxSize[0], boxSize[1], boxSize[2], FOCAL)
  el.style.clipPath = polygonPath(hull(pts), ox, oy, k)
}
function drawFaces(el, t, hx, hy) {
  const pose = poseAt(t, hx, hy)
  el.style.clipPath = toClipPath(silhouette([solid], pose, FOCAL), ox, oy, k)
}
window.__runHull = async () => {
  for (let f = 0; f < FRAMES; f++) {
    const t = (f % 120) / 120, hx = Math.sin(f * 0.13), hy = Math.cos(f * 0.11)
    for (const el of hullEls) drawHull(el, t, hx, hy)
    if (f === 0 || f === (FRAMES >> 1) || f === FRAMES - 1) window.__samples.hull.push(hullEls[0].style.clipPath)
    await new Promise((r) => requestAnimationFrame(r))
  }
}
window.__runFaces = async () => {
  for (let f = 0; f < FRAMES; f++) {
    const t = (f % 120) / 120, hx = Math.sin(f * 0.13), hy = Math.cos(f * 0.11)
    for (const el of facesEls) drawFaces(el, t, hx, hy)
    if (f === 0 || f === (FRAMES >> 1) || f === FRAMES - 1) window.__samples.faces.push(facesEls[0].style.clipPath)
    await new Promise((r) => requestAnimationFrame(r))
  }
}
</script>
</body></html>`.replace('__N__', String(N)).replace('__FRAMES__', String(FRAMES))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })

async function measure(fnName, which) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setContent(PAGE)
  const cdp = await page.createCDPSession()
  await cdp.send('Performance.enable')
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const before = await metrics()
  await page.evaluate((fn) => window[fn](), fnName)
  const after = await metrics()
  const scriptMs = (after.ScriptDuration - before.ScriptDuration) * 1000
  const taskMs = (after.TaskDuration - before.TaskDuration) * 1000
  const clips = await page.evaluate((w) => window.__samples[w], which)
  await context.close()
  return { scriptMs, taskMs, clips }
}

const runs = []
for (let i = 0; i < 3; i++) {
  runs.push(['hull', await measure('__runHull', 'hull')])
  runs.push(['faces', await measure('__runFaces', 'faces')])
}
console.log('load after:', loadavg())

const totals = { hull: [], faces: [] }
for (const [label, r] of runs) {
  totals[label].push(r)
  console.log(label, 'script', r.scriptMs.toFixed(2), 'ms, task', r.taskMs.toFixed(2), 'ms, per-instance-per-frame script', (r.scriptMs / N / FRAMES).toFixed(4), 'ms')
}
for (const label of ['hull', 'faces']) {
  const avg = totals[label].reduce((s, r) => s + r.scriptMs, 0) / totals[label].length
  console.log(label, 'AVG script', avg.toFixed(2), 'ms over', totals[label].length, 'runs, per-instance-per-frame', (avg / N / FRAMES).toFixed(4), 'ms')
}

console.log('\n--- rendered-output check ---')
for (const [label, r] of [['hull', runs[0][1]], ['faces', runs[1][1]]]) {
  const distinct = new Set(r.clips).size
  console.log(label, 'distinct samples over the run:', distinct, distinct > 1 ? 'OK (not frozen)' : 'FROZEN, invalid run')
}

await browser.close()
