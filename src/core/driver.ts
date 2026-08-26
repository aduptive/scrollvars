import { clamp, easeOutCubic } from './math.js'

export interface TrackOptions {
  /** Write `--sv-view` (-1 below viewport → 0 in scene → 1 gone above). Default true. */
  view?: boolean
  /** Write `--sv-t` (0..1 across the element's full travel through the viewport,
   * same semantics as the native `animation-timeline: view()` cover range). */
  travel?: boolean
  /** Write `--sv-pin` (0..1 across the element's pinned stretch) — the raw
   * fuel for curtains, horizontal carousels and any sticky choreography. */
  pin?: boolean
  /** Sticky storytelling: split the element's pinned travel into N scenes.
   * Writes `--sv-scene` (0..N-1, eased + snapped) and fires onScene on integer changes. */
  scenes?: number
  /** Scene snap dead-zone (0..1), false to disable. */
  snap?: number | false
  /** Latch the live state once reached (entrance animations). */
  once?: boolean
  onLive?: (live: boolean) => void
  onScene?: (scene: number) => void
  /** Fires every frame with the raw travel t (0..1) — for video scrubbing,
   * WebGL cameras, or anything JS-driven. Keep the callback cheap. */
  onTravel?: (t: number) => void
  /** Fires every frame with the raw pin progress (0..1 across the pinned
   * stretch) — frame scrubbing, camera tours. Implies pin tracking. */
  onPin?: (p: number) => void
  /** Scroll container to measure against instead of the window viewport —
   * for tracked elements inside nested scroll panels. (The capture-phase
   * scroll listener already hears those scrolls; this makes the geometry
   * agree with them.) */
  root?: HTMLElement
  /** Live-band enter line as a fraction of the viewport height (default 0.75). */
  enter?: number
  /** Live-band exit line as a fraction of the viewport height (default 0.25). */
  exit?: number
}

interface Entry {
  el: HTMLElement
  opts: TrackOptions
  /** Inside the culling margin (one viewport around the screen). Far-away
   * entries skip the per-frame rect read — their variables are already at
   * their resting extremes. Entries with a custom root are never culled. */
  near: boolean
  live: boolean
  scene: number
  written: Record<string, string>
}

const SCENE_SNAP = 0.4
// Live band: enter when the top reaches 75% down the viewport, stay while the
// bottom is past 25% — the standard reveal-on-scroll feel.
const LIVE_ENTER = 0.75
const LIVE_EXIT = 0.25

const entries = new Map<HTMLElement, Entry>()
let raf = 0
let vh = 0
let resizeObserver: ResizeObserver | null = null
let culler: IntersectionObserver | null = null
let initialized = false
let reducedMotion = false

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  vh = window.innerHeight

  // No-JS guard: preset styles only hide content under `html.sv-on`, so a
  // failed bundle degrades to a static, fully visible page.
  document.documentElement.classList.add('sv-on')

  // capture: scroll doesn't bubble, but it does capture-descend — one
  // listener covers nested scrollers (modals, inner panels) for free
  window.addEventListener('scroll', schedule, { passive: true, capture: true })
  window.addEventListener('resize', () => {
    vh = window.innerHeight
    schedule()
  })

  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = media.matches
  media.addEventListener?.('change', (event) => {
    reducedMotion = event.matches
    schedule()
  })

  resizeObserver = new ResizeObserver(() => schedule())
  // Layout shifts above an element (images loading, fonts) move it without
  // resizing it — watching the document catches those too.
  resizeObserver.observe(document.documentElement)

  // Offscreen culling: a viewport of margin on each side keeps fast scrolls
  // correct; far outside it the rect read is skipped entirely.
  if (typeof IntersectionObserver !== 'undefined') {
    culler = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const entry = entries.get(record.target as HTMLElement)
          if (entry) entry.near = record.isIntersecting
        }
        schedule()
      },
      { rootMargin: '100% 0px 100% 0px' }
    )
  }
}

function schedule() {
  if (!raf && entries.size > 0) raf = requestAnimationFrame(update)
}

function update() {
  raf = 0
  // READ phase: batch all layout reads before any style write. Root rects
  // are read once per root per frame and shared by its entries.
  const rootRects = new Map<HTMLElement, DOMRect>()
  const frames: Array<{ entry: Entry; geo: Geometry }> = []
  entries.forEach((entry) => {
    if (!entry.near && !entry.opts.root) return
    const rect = entry.el.getBoundingClientRect()
    const root = entry.opts.root
    let geo: Geometry
    if (root) {
      let rr = rootRects.get(root)
      if (!rr) {
        rr = root.getBoundingClientRect()
        rootRects.set(root, rr)
      }
      geo = { top: rect.top - rr.top, bottom: rect.bottom - rr.top, height: rect.height, vp: rr.height }
    } else {
      geo = { top: rect.top, bottom: rect.bottom, height: rect.height, vp: vh }
    }
    frames.push({ entry, geo })
  })
  // WRITE phase
  for (const { entry, geo } of frames) {
    apply(entry, geo)
  }
}

interface Geometry {
  top: number
  bottom: number
  height: number
  vp: number
}

/**
 * Signed position relative to the live band — the same 75%/25% lines the
 * `sv-live` class uses, so the variable and the class always agree.
 * −1: the top is still at the viewport's bottom edge; ramps to 0 as it
 * crosses the enter line; 0 across the whole band; then 0 → +1 as the
 * bottom travels from the exit line out of the viewport.
 */
function computeView(geo: Geometry, enter: number, exit: number): number {
  const enterLine = geo.vp * enter
  const exitLine = geo.vp * exit
  if (geo.top > enterLine) {
    return -clamp((geo.top - enterLine) / (geo.vp - enterLine), 0, 1)
  }
  if (geo.bottom < exitLine) {
    return clamp((exitLine - geo.bottom) / exitLine, 0, 1)
  }
  return 0
}

/** 0 when the top touches the viewport bottom, 1 when the bottom leaves the top. */
function computeTravel(geo: Geometry): number {
  return clamp((geo.vp - geo.top) / (geo.vp + geo.height), 0, 1)
}

/** 0..1 across a sticky container's pinned stretch. */
function computePin(geo: Geometry): number {
  const span = Math.max(geo.height - geo.vp, 1)
  return clamp(-geo.top / span, 0, 1)
}

function computeScene(pin: number, count: number, snap: number | false): number {
  const raw = pin * (count - 1)
  const base = Math.floor(raw)
  if (raw === base) return raw
  let fraction = raw - base
  if (snap !== false && snap > 0) {
    fraction = fraction <= snap ? 0 : (fraction - snap) / (1 - snap)
  }
  return base + easeOutCubic(fraction)
}

function setVar(entry: Entry, name: string, value: number) {
  const serialized = value.toFixed(4)
  if (entry.written[name] === serialized) return
  entry.written[name] = serialized
  entry.el.style.setProperty(name, serialized)
}

function apply(entry: Entry, geo: Geometry) {
  const { opts } = entry
  const enter = opts.enter ?? LIVE_ENTER
  const exit = opts.exit ?? LIVE_EXIT

  const isLive =
    (geo.top < geo.vp * enter && geo.bottom > geo.vp * exit) ||
    (entry.live && !!opts.once)
  if (isLive !== entry.live) {
    entry.live = isLive
    entry.el.classList.toggle('sv-live', isLive)
    opts.onLive?.(isLive)
    // once + nothing continuous = fire-and-forget: stop tracking, stop paying
    // the per-frame rect read. The class stays; --sv-view freezes as-is.
    if (
      isLive &&
      opts.once &&
      !opts.travel &&
      !opts.pin &&
      !(opts.scenes && opts.scenes > 1) &&
      !opts.onTravel &&
      !opts.onPin &&
      !opts.onScene
    ) {
      entries.delete(entry.el)
      resizeObserver?.unobserve(entry.el)
      culler?.unobserve(entry.el)
      return
    }
  }

  if (opts.view !== false) {
    setVar(entry, '--sv-view', reducedMotion ? 0 : computeView(geo, enter, exit))
  }

  if (opts.travel || opts.onTravel) {
    const t = computeTravel(geo)
    if (opts.travel) setVar(entry, '--sv-t', t)
    opts.onTravel?.(t)
  }

  if (opts.pin || opts.onPin) {
    const p = computePin(geo)
    if (opts.pin) setVar(entry, '--sv-pin', p)
    opts.onPin?.(p)
  }

  if (opts.scenes && opts.scenes > 1) {
    const pin = computePin(geo)
    const snap = opts.snap === false ? false : (opts.snap ?? SCENE_SNAP)
    const scene = computeScene(pin, opts.scenes, snap)
    setVar(entry, '--sv-scene', scene)

    const index = clamp(Math.round(scene), 0, opts.scenes - 1)
    if (index !== entry.scene) {
      entry.scene = index
      opts.onScene?.(index)
    }
  }
}

/** Track an element. Returns an untrack function. */
export function track(el: HTMLElement, opts: TrackOptions = {}): () => void {
  init()
  const entry: Entry = {
    el,
    opts,
    near: true,
    live: false,
    scene: -1,
    written: {},
  }
  entries.set(el, entry)
  el.classList.add('sv')
  resizeObserver?.observe(el)
  if (!opts.root) culler?.observe(el)
  schedule()

  return () => {
    entries.delete(el)
    resizeObserver?.unobserve(el)
    culler?.unobserve(el)
  }
}

/** Force a recompute (e.g. after content changes outside a resize). */
export function refresh() {
  schedule()
}

/** Scroll the window so a Scenes container lands on the given scene. */
export function scrollToScene(el: HTMLElement, index: number, count: number, smooth = true) {
  if (typeof window === 'undefined' || count < 2) return
  const height = el.scrollHeight
  const span = Math.max(height - window.innerHeight, 1)
  const top =
    window.scrollY +
    el.getBoundingClientRect().top +
    (clamp(index, 0, count - 1) / (count - 1)) * span

  window.scrollTo({
    top: Math.max(0, top),
    behavior: smooth ? 'smooth' : 'instant',
  })
}

export function prefersReducedMotion() {
  return reducedMotion
}
