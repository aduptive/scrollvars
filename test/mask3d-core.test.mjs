import assert from 'node:assert/strict'
import { test } from 'node:test'
import { area, bounds, box, extrude, faces, regularPolygon, star, toClipPath } from '../scripts/fx-lib/mask3d-core.mjs'

// Nonzero-winding point-in-path test, the same rule a browser's clip-path
// uses on the path() this module builds: a point is inside the silhouette
// when its winding number across every emitted polygon is nonzero.
function windingNumber(polys, [px, py]) {
  let wn = 0
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]
      if (y1 <= py) {
        if (y2 > py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) > 0) wn++
      } else if (y2 <= py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) < 0) wn--
    }
  }
  return wn
}

test('a face-on cube silhouette covers exactly a square', () => {
  // Near-orthographic (huge focal, thin depth) so the front and back caps
  // coincide and the side walls carry no measurable area of their own.
  const cube = box(1, 1, .001)
  const polys = faces(cube, 0, { ry: 0, rx: 0, cx: 0, cy: 0 }, 1e6)
  const n = 60
  let inside = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -.6 + (1.2 * i) / (n - 1), y = -.6 + (1.2 * j) / (n - 1)
      if (windingNumber(polys, [x, y]) !== 0) inside++
    }
  }
  const measured = inside * (1.2 / (n - 1)) ** 2
  assert.ok(Math.abs(measured - 1) < .05, `measured area ${measured}, expected close to 1`)
})

test('every emitted polygon has positive signed area, at many random poses', () => {
  let seed = 42
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  const shapes = [box(1, 1, .4), regularPolygon(6, .5, .3), star(5, .45, .5, .3)]
  let total = 0
  for (let i = 0; i < 500; i++) {
    const piece = shapes[i % shapes.length]
    const angle = (rand() - .5) * Math.PI * 2
    const ry = (rand() - .5) * Math.PI
    const rx = (rand() - .5) * Math.PI
    const polys = faces(piece, angle, { ry, rx, cx: 0, cy: 0 }, 3)
    for (const p of polys) {
      total++
      assert.ok(area(p) > 0, `negative or zero area at angle=${angle} ry=${ry} rx=${rx}`)
    }
  }
  assert.ok(total > 500) // the loop actually exercised every shape
})

test('a raw (unflipped) contour can wind negative, which is exactly what faces() corrects', () => {
  // Sanity check that the assertion above is not vacuous: a plain contour in
  // this file's winding convention CAN come out negative before faces()
  // normalizes it, so "every emitted polygon is positive" is a real claim.
  assert.ok(area([[0, 0], [0, 1], [1, 1], [1, 0]]) < 0)
})

test('the hole of an "o"-like contour has winding 0 face-on, covered by walls edge-on', () => {
  // A ring: outer square (positive area, CCW) with a square hole (opposite
  // winding, net area 0), the same shape a glyph's counter takes.
  const outer = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  const hole = [[-.4, -.4], [-.4, .4], [.4, .4], [.4, -.4]]
  const ring = extrude([outer, hole], .3, [0, 0])

  const faceOn = faces(ring, 0, { ry: 0, rx: 0, cx: 0, cy: 0 }, 5)
  assert.equal(windingNumber(faceOn, [0, 0]), 0, 'the hole center should be uncovered face-on')
  assert.notEqual(windingNumber(faceOn, [.7, 0]), 0, 'the ring body should be covered face-on')

  const edgeOn = faces(ring, 0, { ry: Math.PI / 2 - .001, rx: 0, cx: 0, cy: 0 }, 5)
  assert.notEqual(windingNumber(edgeOn, [0, 0]), 0, 'the wall should cover the hole edge-on')
})

test('toClipPath output parses: matched M/Z counts, every number finite', () => {
  const shape = star(5, .45, .5, .3)
  const polys = faces(shape, .4, { ry: .3, rx: -.2, cx: 0, cy: 0 }, 4)
  const clip = toClipPath(polys, 100, 80, 40)
  assert.match(clip, /^path\('.*'\)$/)
  const d = clip.slice(6, -2)
  const moves = d.match(/M/g)?.length ?? 0
  const closes = d.match(/Z/g)?.length ?? 0
  assert.equal(moves, polys.length)
  assert.equal(closes, polys.length)
  const numbers = d.match(/-?\d+(\.\d+)?/g) ?? []
  assert.ok(numbers.length > 0)
  for (const n of numbers) assert.ok(Number.isFinite(Number(n)), `not finite: ${n}`)
})

test('bounds contains every vertex over a sampled pose range', () => {
  const shape = box(1, 1, .4)
  const poses = []
  for (let s = 0; s <= 10; s++) poses.push({ ry: (s / 10 - .5) * 2, rx: (s / 10 - .3) * 1.4, cx: 0, cy: 0, angles: [(s / 10 - .5) * 3] })
  const bd = bounds([shape], poses, 3)
  for (const pose of poses) {
    for (const poly of faces(shape, pose.angles[0], pose, 3)) {
      for (const [x, y] of poly) {
        assert.ok(x >= bd.x0 - 1e-6 && x <= bd.x1 + 1e-6, `x ${x} outside bounds ${bd.x0}..${bd.x1}`)
        assert.ok(y >= bd.y0 - 1e-6 && y <= bd.y1 + 1e-6, `y ${y} outside bounds ${bd.y0}..${bd.y1}`)
      }
    }
  }
})

