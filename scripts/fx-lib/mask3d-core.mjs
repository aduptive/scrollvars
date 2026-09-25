/**
 * 3D masks, shared projection math (mask3d recipes: word-window, hero-lens,
 * cube-windows). A solid is one or more extruded 2D pieces; each piece turns
 * about its own pivot, then the whole solid turns by a pose (ry, rx) with a
 * perspective focal length. The projected outline becomes a clip-path.
 *
 * Why the union works, kept here for whoever promotes this later: for a
 * closed extruded solid, the projection equals the union of either facing
 * set of its faces. So: both caps normalized to positive area, plus only the
 * side walls whose projected area is positive. A contour's hole (opposite
 * winding to its outer contour, net area 0) survives face-on and gets
 * covered by its own wall once the piece turns far enough to show it edge-on.
 * Nothing emitted is ever negative; the clip-path's nonzero fill rule does
 * the union for you.
 *
 * This file is plain, dependency-free ESM: the recipe's whole point is that
 * you own and edit it. It is unit-tested directly (test/mask3d-core.test.mjs)
 * so a change here proves itself before it goes back into a live page.
 */

export function area(poly) {
  let s = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
  return s / 2
}

// One piece: 2D contours (arrays of [x, y], any winding) extruded to
// `depth`, turning about its own `pivot` ([x, y], default the origin).
export function extrude(contours, depth, pivot = [0, 0]) {
  return { contours, depth, pivot }
}

// Every face of one piece, projected and oriented the same way, appended to
// `out`. `angle` turns the piece about its own pivot; `pose` (ry, rx, cx, cy)
// turns the whole solid about its centre (cx, cy); `focal` is the
// perspective distance. A nonzero fill of everything `faces()` emits, across
// every piece of a solid, is the solid's silhouette.
export function faces(piece, angle, pose, focal, out = []) {
  const { ry = 0, rx = 0, cx = 0, cy = 0 } = pose
  const cosY = Math.cos(ry), sinY = Math.sin(ry)
  const cosX = Math.cos(rx), sinX = Math.sin(rx)
  const ca = Math.cos(angle), sa = Math.sin(angle)
  // Only the pivot's x turns the piece: it spins about a vertical axis
  // through that point, same as a letter turning in place on the page.
  const [px] = piece.pivot
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
  // Side walls: keep one facing only, that set alone covers the outline.
  front.forEach((c, k) => {
    const b = back[k]
    for (let i = 0; i < c.length; i++) {
      const q = [c[i], c[(i + 1) % c.length], b[(i + 1) % c.length], b[i]]
      if (area(q) > 1e-7) out.push(q)
    }
  })
  return out
}

// The outline of a whole solid (one or more pieces) at one pose. `angles` is
// one turn per piece (default 0), so a recipe can turn letters independently
// of the solid's own pose (word-window's per-letter wave).
export function silhouette(pieces, pose, focal, angles = []) {
  const out = []
  pieces.forEach((piece, i) => faces(piece, angles[i] ?? 0, pose, focal, out))
  return out
}

// Rounds without toFixed (measured 2x cheaper on the per-frame path).
const r1 = (n) => Math.round(n * 10) / 10

export function pathOf(polys, ox, oy, scale) {
  let d = ''
  for (const p of polys) {
    d += 'M'
    for (const [x, y] of p) d += `${r1(ox + x * scale)} ${r1(oy + y * scale)} `
    d += 'Z'
  }
  return d
}

export function toClipPath(polys, ox, oy, scale) {
  return `path('${pathOf(polys, ox, oy, scale)}')`
}

// The extent every vertex of `pieces` can reach across `poses` (each a full
// pose plus its own `angles`), so a recipe can fit the solid inside its
// element without cutting a corner off at any reachable turn.
export function bounds(pieces, poses, focal) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const pose of poses) {
    for (const poly of silhouette(pieces, pose, focal, pose.angles)) {
      for (const [x, y] of poly) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x)
        y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      }
    }
  }
  return { x0, x1, y0, y1 }
}

// Shape helpers: a box (cube windows), a regular polygon (hex, triangle...),
// a star. All centred on their own pivot.
export function box(w, h, d) {
  return extrude([[[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]], d, [0, 0])
}

export function regularPolygon(n, r = .5, depth = .3) {
  const c = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    c.push([r * Math.cos(a), r * Math.sin(a)])
  }
  return extrude([c], depth, [0, 0])
}

export function star(n, inner = .45, r = .5, depth = .3) {
  const c = []
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const rad = i % 2 === 0 ? r : r * inner
    c.push([rad * Math.cos(a), rad * Math.sin(a)])
  }
  return extrude([c], depth, [0, 0])
}
