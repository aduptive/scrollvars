import { clamp, easeOutCubic } from './math.js'

export interface TrackOptions {
  /** Write `--sv-view` (-1 below viewport → 0 in scene → 1 gone above). Default true. */
  view?: boolean
  /** Write `--sv-t` (0..1 across the element's full travel through the viewport,
   * same semantics as the native `animation-timeline: view()` cover range). */
  travel?: boolean
  /** Write `--sv-pin` (0..1 across the element's pinned stretch). The raw
   * fuel for curtains, horizontal carousels and any sticky choreography. */
  pin?: boolean | string
  /** Sticky storytelling: split the element's pinned travel into N scenes.
   * Writes `--sv-scene` (0..N-1, eased + snapped) and fires onScene on integer changes. */
  scenes?: number
  /** Scene snap dead-zone (0..1), false to disable. */
  snap?: number | false
  /** Latch the live state once reached (entrance animations). */
  once?: boolean
  onLive?: (live: boolean) => void
  onScene?: (scene: number) => void
  /** Fires every frame with the raw travel t (0..1). For video scrubbing,
   * WebGL cameras, or anything JS-driven. Keep the callback cheap. */
  onTravel?: (t: number) => void
  /** Fires every frame with the raw pin progress (0..1 across the pinned
   * stretch). Frame scrubbing, camera tours. Implies pin tracking. */
  onPin?: (p: number) => void
  /** Scroll container to measure against instead of the window viewport,
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
   * entries skip the per-frame rect read. Their variables are already at
   * their resting extremes. Entries with a custom root are never culled. */
  near: boolean
  live: boolean
  scene: number
  /** px the pinned stage sits below the viewport top (a sticky header): read once
   * from the element's computed `--sv-pin-offset`, so one CSS declaration drives
   * both the layout (.sv-stage) and the math. */
  pinOffset: number
  written: Record<string, string>
}

const SCENE_SNAP = 0.4
// Live band: enter when the top reaches 75% down the viewport, stay while the
// bottom is past 25%. The standard reveal-on-scroll feel.
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

  // capture: scroll doesn't bubble, but it does capture-descend. One
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

  try {
    resizeObserver = new ResizeObserver(() => schedule())
    // Layout shifts above an element (images loading, fonts) move it without
    // resizing it: watching the document catches those too.
    resizeObserver.observe(document.documentElement)
  } catch {
    return // no ResizeObserver: stay a static page (scrollvars/compat adds a shim)
  }

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

  // No-JS guard: preset styles only hide content under `html.sv-on`, so a
  // failed bundle degrades to a static, fully visible page. The class lands
  // last, once every observer exists, so a throwing constructor can never
  // leave the page hidden. __scrollvars lets the SSR pre-paint script (React
  // ScrollVarsBoot) confirm the driver arrived.
  document.documentElement.classList.add('sv-on')
  ;(window as unknown as { __scrollvars?: boolean }).__scrollvars = true
}

let lastY = -1
let lastT = 0
let velTimer: ReturnType<typeof setTimeout> | undefined

function schedule() {
  if (!raf && entries.size > 0) raf = requestAnimationFrame(update)
}

function update() {
  raf = 0
  // READ phase: batch all layout reads before any style write. Root rects
  // are read once per root per frame and shared by its entries.
  const y = window.scrollY
  const now = performance.now()
  // A jump longer than a viewport (anchor, scrollTo, restored position) can
  // carry an element from far below to far above without the culler ever
  // seeing it intersect: give every entry one geometry pass on such frames.
  const jumped = lastY >= 0 && Math.abs(y - lastY) > vh
  const docEl = document.documentElement
  const pageSpan = Math.max((docEl.scrollHeight || 0) - vh, 1)
  const rootRects = new Map<HTMLElement, DOMRect>()
  const frames: Array<{ entry: Entry; geo: Geometry }> = []
  entries.forEach((entry) => {
    if (!entry.near && !entry.opts.root && !jumped) return
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
  // Page-level outputs on <html>: --sv-page (0..1 through the document) and
  // --sv-v (signed velocity, viewport-heights per second). Velocity decays to
  // 0 shortly after the last scroll event so a CSS transition can ease a
  // skew/stretch effect back to rest.
  const dt = now - lastT
  const v = lastY < 0 || dt <= 0 ? 0 : ((y - lastY) / dt) * 1000 / vh
  docEl.style?.setProperty('--sv-page', clamp(y / pageSpan, 0, 1).toFixed(4))
  docEl.style?.setProperty('--sv-v', (reducedMotion ? 0 : clamp(v, -20, 20)).toFixed(3))
  clearTimeout(velTimer)
  velTimer = setTimeout(() => docEl.style?.setProperty('--sv-v', '0'), 80)
  lastY = y
  lastT = now
}

interface Geometry {
  top: number
  bottom: number
  height: number
  vp: number
}

/**
 * Signed position relative to the live band. The same 75%/25% lines the
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
function computePin(geo: Geometry, offset = 0): number {
  const span = Math.max(geo.height - geo.vp + offset, 1)
  return clamp((offset - geo.top) / span, 0, 1)
}

/** `--sv-pin-offset` as a number of px (0 when unset or outside a browser). */
function readPinOffset(el: HTMLElement): number {
  if (typeof getComputedStyle !== 'function') return 0
  return parseFloat(getComputedStyle(el).getPropertyValue('--sv-pin-offset')) || 0
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
    const p = computePin(geo, entry.pinOffset)
    if (opts.pin) setVar(entry, '--sv-pin', p)
    opts.onPin?.(p)
  }

  if (opts.scenes && opts.scenes > 1) {
    const pin = computePin(geo, entry.pinOffset)
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
    pinOffset: opts.pin ? readPinOffset(el) : 0,
    written: {},
  }
  entries.set(el, entry)
  el.classList.add('sv')
  // constants CSS can read: how many scenes, so progress bars need no hard-coded count
  if (opts.scenes && opts.scenes > 1) el.style.setProperty('--sv-scenes', String(opts.scenes))
  // pin helper: `pin: '320vh'` is the whole skeleton (tall relative wrapper);
  // under reduced motion the wrapper stays in flow instead of an empty scroll
  if (typeof opts.pin === 'string' && !reducedMotion) {
    el.style.height = opts.pin
    if (!el.style.position) el.style.position = 'relative'
  }
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

/** Scroll so a Scenes container lands on the given scene. Pass the same
 * `root` the container is tracked with to scroll that element instead of the
 * window. Uses the rendered height, like the driver's pin math. */
export function scrollToScene(
  el: HTMLElement,
  index: number,
  count: number,
  smooth = true,
  root?: HTMLElement
) {
  if (typeof window === 'undefined' || count < 2) return
  const rect = el.getBoundingClientRect()
  const vp = root ? root.clientHeight : window.innerHeight
  const pinOffset = readPinOffset(el)
  const span = Math.max(rect.height - vp + pinOffset, 1)
  const offset = (clamp(index, 0, count - 1) / (count - 1)) * span - pinOffset
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'instant'
  if (root) {
    root.scrollTo({ top: root.scrollTop + rect.top - root.getBoundingClientRect().top + offset, behavior })
  } else {
    window.scrollTo({ top: window.scrollY + rect.top + offset, behavior })
  }
}

export function prefersReducedMotion() {
  return reducedMotion
}
