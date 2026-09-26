/**
 * Marker geometry: page-absolute scroll positions for an element's travel
 * and, for pinned elements, its pin stretch. Pure functions, no DOM: a
 * reimplementation of the driver's own enter/exit and pin-span math
 * (src/core/driver.ts computeView/pinSpan), kept independent on purpose
 * (debug is a separate entry, never imports core). Ponytail: this mirrors
 * the two edges the driver's default 75%/25% live band actually crosses,
 * not the full continuous -1..1 curve; enough to place ScrollTrigger-style
 * guide lines.
 */
export interface TravelGeo {
  top: number
  bottom: number
}

export interface TravelLines {
  /** Page Y where --sv-view first reaches 0 (the element goes live). */
  enter: number
  /** Page Y where --sv-view reaches 1 (the element has fully exited). */
  exit: number
}

// `data-sv-enter="0"` and `data-sv-exit="0"` are valid bands (scan.ts's own
// band() accepts 0..1), so `parseFloat(...) || fallback` is wrong: 0 is
// falsy and would silently fall back to the default line. Number.isFinite
// only rejects an unset/unparsable attribute, never a real 0.
export function readBand(raw: string | undefined, fallback: number): number {
  const value = parseFloat(raw ?? '')
  return Number.isFinite(value) ? value : fallback
}

export function travelLines(geo: TravelGeo, scrollY: number, vp: number, enter = 0.75, exit = 0.25): TravelLines {
  void exit // kept for API symmetry with the driver's computeView signature
  const pageTop = geo.top + scrollY
  const pageBottom = geo.bottom + scrollY
  return { enter: pageTop - vp * enter, exit: pageBottom }
}

export interface PinGeo {
  wrapperTop: number
  wrapperHeight: number
  stageHeight: number
}

export interface PinLines {
  start: number
  end: number
}

/** Pin stretch start/end in page coordinates. Starts when the wrapper's top
 * reaches the pin offset; ends when the wrapper's bottom meets the stage's
 * border box (CLAUDE.md's pin-span rule: span = wrapper height minus stage
 * height, the offset already folded into the stage's own height). `origin`
 * is the stage's normal-flow offset the driver reads with readStageOrigin
 * (a heading or padding before the stage): the driver's own pin starts one
 * origin later and its span shortens by the same amount (driver.ts
 * pinSpan/computePin), so markers with no origin were off by exactly that
 * much whenever the stage was not the pinned element's first child
 * (ADU-354 item 10). */
export function pinLines(geo: PinGeo, scrollY: number, offset = 0, origin = 0): PinLines {
  const pageTop = geo.wrapperTop + scrollY
  const start = pageTop - offset + origin
  const span = Math.max(geo.wrapperHeight - geo.stageHeight - origin, 1)
  return { start, end: start + span }
}
