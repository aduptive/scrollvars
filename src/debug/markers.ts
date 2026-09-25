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
 * height, the offset already folded into the stage's own height). */
export function pinLines(geo: PinGeo, scrollY: number, offset = 0): PinLines {
  const pageTop = geo.wrapperTop + scrollY
  const start = pageTop - offset
  const span = Math.max(geo.wrapperHeight - geo.stageHeight, 1)
  return { start, end: start + span }
}
