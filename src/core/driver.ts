import { clamp, easeOutCubic, snapProgress } from './math.js'

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
}

interface Entry {
  el: HTMLElement
  opts: TrackOptions
  height: number
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
let initialized = false
let reducedMotion = false

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  vh = window.innerHeight

  // No-JS guard: preset styles only hide content under `html.sv-on`, so a
  // failed bundle degrades to a static, fully visible page.
  document.documentElement.classList.add('sv-on')

  window.addEventListener('scroll', schedule, { passive: true })
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

  resizeObserver = new ResizeObserver((observed) => {
    for (const { target } of observed) {
      const entry = entries.get(target as HTMLElement)
      if (entry) entry.height = entry.el.scrollHeight
    }
    schedule()
  })
  // Layout shifts above an element (images loading, fonts) move it without
  // resizing it — watching the document catches those too.
  resizeObserver.observe(document.documentElement)
}

function schedule() {
  if (!raf && entries.size > 0) raf = requestAnimationFrame(update)
}

function update() {
  raf = 0
  // READ phase: batch all layout reads before any style write
  const frames: Array<{ entry: Entry; rect: DOMRect }> = []
  entries.forEach((entry) => {
    frames.push({ entry, rect: entry.el.getBoundingClientRect() })
  })
  // WRITE phase
  for (const { entry, rect } of frames) {
    apply(entry, rect)
  }
}

/**
 * Signed position relative to the live band — the same 75%/25% lines the
 * `sv-live` class uses, so the variable and the class always agree.
 * −1: the top is still at the viewport's bottom edge; ramps to 0 as it
 * crosses the enter line; 0 across the whole band; then 0 → +1 as the
 * bottom travels from the exit line out of the viewport.
 */
function computeView(rect: DOMRect): number {
  const enterLine = vh * LIVE_ENTER
  const exitLine = vh * LIVE_EXIT
  if (rect.top > enterLine) {
    return -clamp((rect.top - enterLine) / (vh - enterLine), 0, 1)
  }
  if (rect.bottom < exitLine) {
    return clamp((exitLine - rect.bottom) / exitLine, 0, 1)
  }
  return 0
}

/** 0 when the top touches the viewport bottom, 1 when the bottom leaves the top. */
function computeTravel(rect: DOMRect, height: number): number {
  return clamp((vh - rect.top) / (vh + height), 0, 1)
}

/** 0..1 across a sticky container's pinned stretch. */
function computePin(rect: DOMRect, height: number): number {
  const span = Math.max(height - vh, 1)
  return clamp(-rect.top / span, 0, 1)
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

function apply(entry: Entry, rect: DOMRect) {
  const { opts } = entry

  const isLive =
    (rect.top < vh * LIVE_ENTER && rect.bottom > vh * LIVE_EXIT) ||
    (entry.live && !!opts.once)
  if (isLive !== entry.live) {
    entry.live = isLive
    entry.el.classList.toggle('sv-live', isLive)
    opts.onLive?.(isLive)
  }

  if (opts.view !== false) {
    setVar(entry, '--sv-view', reducedMotion ? 0 : computeView(rect))
  }

  if (opts.travel || opts.onTravel) {
    const t = computeTravel(rect, entry.height)
    if (opts.travel) setVar(entry, '--sv-t', t)
    opts.onTravel?.(t)
  }

  if (opts.pin || opts.onPin) {
    const p = computePin(rect, entry.height)
    if (opts.pin) setVar(entry, '--sv-pin', p)
    opts.onPin?.(p)
  }

  if (opts.scenes && opts.scenes > 1) {
    const pin = computePin(rect, entry.height)
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
    height: el.scrollHeight,
    live: false,
    scene: -1,
    written: {},
  }
  entries.set(el, entry)
  el.classList.add('sv')
  resizeObserver?.observe(el)
  schedule()

  return () => {
    entries.delete(el)
    resizeObserver?.unobserve(el)
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
