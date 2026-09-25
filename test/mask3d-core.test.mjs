import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileMask3dCore } from '../scripts/fx-lib/compile-mask3d.mjs'

// Tests the exact code the fx gallery ships, not a hand-kept JS twin of the
// TypeScript source: compile mask3d-core.ts the same way scripts/fx-data.mjs
// does (esbuild's transformSync), write it once, import it like any other
// module. A change to mask3d-core.ts that breaks these assertions fails
// here before it ever reaches a pane.
const cacheDir = join(process.cwd(), 'node_modules', '.cache', 'sv-mask3d-test')
mkdirSync(cacheDir, { recursive: true })
const { js } = compileMask3dCore()
const compiledPath = join(cacheDir, 'mask3d-core.mjs')
writeFileSync(compiledPath, js)
const { bounds, corners, hull, toClipPath } = await import(pathToFileURL(compiledPath).href)

function signedArea(poly) {
  let s = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
  return s / 2
}

// Nonzero-winding point-in-path test, the same rule a browser's clip-path
// uses on the polygon() this module builds.
function windingNumber(poly, [px, py]) {
  let wn = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]
    if (y1 <= py) {
      if (y2 > py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) > 0) wn++
    } else if (y2 <= py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) < 0) wn--
  }
  return wn
}

test('a face-on box hull covers exactly its face', () => {
  const box = { w: 1, h: 1, d: .001 } // thin depth, near-orthographic: front and back barely differ
  const pts = hull(corners(box, { ry: 0, rx: 0 }, 1e6))
  const n = 60
  let inside = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -.6 + (1.2 * i) / (n - 1), y = -.6 + (1.2 * j) / (n - 1)
      if (windingNumber(pts, [x, y]) !== 0) inside++
    }
  }
  const measured = inside * (1.2 / (n - 1)) ** 2
  assert.ok(Math.abs(measured - 1) < .05, `measured area ${measured}, expected close to 1`)
})

test('the hull has positive signed area and at most 6 vertices, at many random poses', () => {
  let seed = 42
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  const boxes = [{ w: 1, h: 1, d: .4 }, { w: .6, h: 1.3, d: .2 }, { w: 1.2, h: .5, d: .5 }]
  for (let i = 0; i < 500; i++) {
    const box = boxes[i % boxes.length]
    const ry = (rand() - .5) * Math.PI, rx = (rand() - .5) * Math.PI
    const pts = hull(corners(box, { ry, rx }, 3))
    assert.ok(signedArea(pts) > 0, `non-positive hull area at ry=${ry} rx=${rx}`)
    assert.ok(pts.length >= 3 && pts.length <= 6, `hull of a box has 3 to 6 vertices, got ${pts.length}`)
  }
})

test('hull() drops interior points, keeping only the boundary', () => {
  // A square plus its own centre: the centre must not survive the hull.
  const square = [[0, 0], [4, 0], [4, 4], [0, 4]]
  const withCentre = [...square, [2, 2]]
  const pts = hull(withCentre)
  assert.equal(pts.length, 4, 'the interior point must be dropped')
  assert.ok(pts.every(([x, y]) => !(x === 2 && y === 2)), 'the centre point leaked into the hull')
})

test('toClipPath output is a well-formed polygon(), every coordinate finite', () => {
  const box = { w: .7, h: 1.1, d: .3 }
  const pts = hull(corners(box, { ry: .4, rx: -.2 }, 4))
  const clip = toClipPath(pts, 100, 80, 40)
  assert.match(clip, /^polygon\(.*\)$/)
  const points = clip.slice(8, -1).split(',')
  assert.equal(points.length, pts.length)
  for (const p of points) {
    assert.match(p, /^-?\d+(\.\d+)?px -?\d+(\.\d+)?px$/, `malformed point: ${p}`)
  }
})

test('bounds contains every corner over a sampled pose range', () => {
  const box = { w: 1, h: 1, d: .4 }
  const poses = []
  for (let s = 0; s <= 10; s++) poses.push({ ry: (s / 10 - .5) * 2, rx: (s / 10 - .3) * 1.4 })
  const bd = bounds(box, poses, 3)
  for (const pose of poses) {
    for (const [x, y] of corners(box, pose, 3)) {
      assert.ok(x >= bd.x0 - 1e-6 && x <= bd.x1 + 1e-6, `x ${x} outside bounds ${bd.x0}..${bd.x1}`)
      assert.ok(y >= bd.y0 - 1e-6 && y <= bd.y1 + 1e-6, `y ${y} outside bounds ${bd.y0}..${bd.y1}`)
    }
  }
})
