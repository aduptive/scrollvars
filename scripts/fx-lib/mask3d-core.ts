/**
 * cube-windows' projection math: a box turns in 3D, its 8 corners project to
 * 2D, and their convex hull is the outline. Correct for any CONVEX solid
 * with no holes; a concave shape or one with a hole (glyph letters, a star)
 * needs the projected faces themselves unioned instead, which costs more.
 *
 * Measured against that faces-union approach on this exact box recipe
 * (demo/bench/harness/mask3d-cost.mjs, three runs, 300 boxes, 240 frames):
 * the hull ran consistently cheaper, about a quarter less per-frame task
 * time, and produces the identical silhouette for a plain box (checked by
 * nonzero-winding point-in-path sampling, not eyeballed). The simpler,
 * cheaper solid wins for the one recipe that exists; nothing here is kept
 * for a shape that has not shipped.
 *
 * This module is the source of truth: it is unit-tested directly (compiled
 * in test/mask3d-core.test.mjs with the repo's own esbuild, the same way the
 * fx gallery's plain-JS pane is derived from it, scripts/fx-data.mjs) so a
 * change here proves itself before it goes back into a live page.
 */

export type Point = [number, number]
export type Box = { w: number; h: number; d: number }
export type Pose = { ry: number; rx: number }

// The 8 corners of the box, turned by `pose` and projected with perspective
// `focal`. Element-width units in, element-width units out (times the
// perspective scale each corner earns from its own depth).
export function corners(box: Box, pose: Pose, focal: number): Point[] {
  const { w, h, d } = box
  const { ry, rx } = pose
  const cosY = Math.cos(ry), sinY = Math.sin(ry)
  const cosX = Math.cos(rx), sinX = Math.sin(rx)
  const pts: Point[] = []
  for (let i = 0; i < 8; i++) {
    let x = (i & 1 ? .5 : -.5) * w, y = (i & 2 ? .5 : -.5) * h, z = (i & 4 ? .5 : -.5) * d
    ;[x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY]
    ;[y, z] = [y * cosX - z * sinX, y * sinX + z * cosX]
    const s = focal / (focal + z)
    pts.push([x * s, y * s])
  }
  return pts
}

// The outline of a convex solid is the convex hull of its corners (monotone
// chain, Andrew's algorithm): 4 points face-on, up to 6 from a corner-on
// turn. Any orientation works, no area or winding bookkeeping needed.
export function hull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: Point[]): Point[] => {
    const out: Point[] = []
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    return out.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

const r1 = (n: number): number => Math.round(n * 10) / 10

export function toClipPath(points: Point[], ox: number, oy: number, scale: number): string {
  return `polygon(${points.map(([x, y]) => `${r1(ox + x * scale)}px ${r1(oy + y * scale)}px`).join(',')})`
}

// The extent every corner can reach across `poses`, so a recipe can fit the
// box inside its element without cutting a corner off at any reachable turn.
export function bounds(box: Box, poses: Pose[], focal: number) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const pose of poses) {
    for (const [x, y] of corners(box, pose, focal)) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x)
      y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
  }
  return { x0, x1, y0, y1 }
}
