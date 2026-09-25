export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Snap a continuous value to integers with a symmetric dead zone.
 * threshold 0.35 → the first/last 35% of each unit sticks to the integer,
 * the middle 30% is remapped to the full 0..1 range.
 */
export function snapProgress(value: number, threshold: number): number {
  if (threshold <= 0) return value
  const base = Math.floor(value)
  const f = value - base
  if (f <= threshold) return base
  if (f >= 1 - threshold) return base + 1
  return base + (f - threshold) / (1 - 2 * threshold)
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Map `t` through the `[from, to]` sub-range to 0..1 (clamped), optionally
 * eased. The JS twin of the `sv-range` CSS preset, for `onTravel`/`onPin`
 * consumers (canvas scenes, WebGL uniforms).
 */
export function mapRange(
  t: number,
  from: number,
  to: number,
  ease?: (x: number) => number
): number {
  // The CSS twin (styles/pin.css's sv-range) divides by `to - from` outright,
  // reversed range and all: `clamp(0, (t - from) / (to - from), 1)`. Flooring
  // that span at an epsilon (round 15 item 7) turned every reversed range
  // into 0, disagreeing with the CSS on every frame. `from === to` is the
  // only case with no ratio to compute: a step at `to`, matching what the
  // epsilon version approximated by accident.
  const span = to - from
  const raw = clamp(span !== 0 ? (t - from) / span : t > to ? 1 : 0, 0, 1)
  return ease ? ease(raw) : raw
}
