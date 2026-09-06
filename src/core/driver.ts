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
  /** inline height/position the pin helper replaced, restored on untrack */
  authored?: { height: string; position: string }
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
  vh = window.innerHeight

  // Construct the ResizeObserver FIRST, before any listener is installed: a
  // throwing constructor must leave nothing behind to undo, so a later
  // track() (after scrollvars/compat shims one in) can retry init() clean.
  try {
    resizeObserver = new ResizeObserver(() => schedule())
    // Layout shifts above an element (images loading, fonts) move it without
    // resizing it: watching the document catches those too.
    resizeObserver.observe(document.documentElement)
  } catch {
    resizeObserver = null
    return // no ResizeObserver: stay a static page (scrollvars/compat adds a shim)
  }
  initialized = true

  // capture: scroll doesn't bubble, but it does capture-descend. One
  // listener covers nested scrollers (modals, inner panels) for free
  window.addEventListener('scroll', schedule, { passive: true, capture: true })
  window.addEventListener('resize', () => {
    vh = window.innerHeight
    refresh() // a responsive sticky header changes every pin offset too
  })

  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = media.matches
  const onMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches
    entries.forEach(applyPinHelper)
    schedule()
  }
  // addEventListener on a MediaQueryList is Safari 14; inside the supported
  // floor (Safari 11) only the deprecated addListener exists, and the
  // optional call alone made the whole preference a no-op there.
  if (typeof media.addEventListener === 'function') media.addEventListener('change', onMotionChange)
  else media.addListener?.(onMotionChange)

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
let lastPageStr = ''
let lastVStr = ''

let pageOutputs = false // true once anything was ever tracked: --sv-page/--sv-v then follow every scroll
let forceAll = false // set by refresh(): give culled entries one geometry pass on the next update()

function schedule() {
  if (!raf && (entries.size > 0 || pageOutputs)) raf = requestAnimationFrame(update)
}

function update() {
  raf = 0
  const force = forceAll
  forceAll = false
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
    if (!entry.near && !entry.opts.root && !jumped && !force) return
    const rect = entry.el.getBoundingClientRect()
    const root = entry.opts.root
    let geo: Geometry
    if (root) {
      let rr = rootRects.get(root)
      if (!rr) {
        rr = root.getBoundingClientRect()
        rootRects.set(root, rr)
      }
      // clientTop/clientHeight (not the border-inclusive bounding rect) so a
      // bordered root measures the same origin here as scrollToScene uses.
      const originTop = rr.top + root.clientTop
      const vp = root.clientHeight
      geo = { top: rect.top - originTop, bottom: rect.bottom - originTop, height: rect.height, vp }
    } else {
      geo = { top: rect.top, bottom: rect.bottom, height: rect.height, vp: vh }
    }
    frames.push({ entry, geo })
  })
  // WRITE phase. `frames` is a snapshot taken before any callback ran: an
  // onLive/onScene fired earlier in this same loop can untrack (or replace)
  // a later entry, and a released entry must not get one more write and one
  // more callback after its untrack returned.
  for (const { entry, geo } of frames) {
    if (entries.get(entry.el) !== entry) continue
    apply(entry, geo)
  }
  // Page-level outputs on <html>: --sv-page (0..1 through the document) and
  // --sv-v (signed velocity, viewport-heights per second). Velocity decays to
  // 0 shortly after the last scroll event so a CSS transition can ease a
  // skew/stretch effect back to rest.
  const dt = now - lastT
  const v = lastY < 0 || dt <= 0 ? 0 : ((y - lastY) / dt) * 1000 / vh
  const pageStr = clamp(y / pageSpan, 0, 1).toFixed(4)
  if (pageStr !== lastPageStr) docEl.style?.setProperty('--sv-page', (lastPageStr = pageStr))
  const vStr = (reducedMotion ? 0 : clamp(v, -20, 20)).toFixed(3)
  if (vStr !== lastVStr) docEl.style?.setProperty('--sv-v', (lastVStr = vStr))
  clearTimeout(velTimer)
  velTimer = setTimeout(() => docEl.style?.setProperty('--sv-v', (lastVStr = '0')), 80)
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

/** `--sv-pin-offset` as a number of px (0 when unset or outside a browser).
 * Resolves rem (root font-size), em (the element's own font-size), vh/svh/lvh/dvh
 * (window.innerHeight) and vw (window.innerWidth); anything else, including a
 * bare number, falls back to parseFloat as px. svh/lvh/dvh resolve like vh:
 * there is no JS API for the small/large viewport height without an actual
 * probe element, so all three read window.innerHeight like vh does. */
function readPinOffset(el: HTMLElement): number {
  if (typeof getComputedStyle !== 'function') return 0
  const raw = getComputedStyle(el).getPropertyValue('--sv-pin-offset').trim()
  const match = raw.match(/^(-?[\d.]+)\s*([a-z%]*)$/i)
  const value = match ? parseFloat(match[1]) : parseFloat(raw)
  if (!value) return 0
  switch (match?.[2]?.toLowerCase()) {
    case 'rem':
      return value * parseFloat(getComputedStyle(document.documentElement).fontSize)
    case 'em':
      return value * parseFloat(getComputedStyle(el).fontSize)
    case 'vh':
    case 'svh':
    case 'lvh':
    case 'dvh':
      return (value / 100) * window.innerHeight
    case 'vw':
      return (value / 100) * window.innerWidth
    default:
      return value
  }
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

/** The driver owns the live state, so it writes it twice: the `sv-live`
 * class (public API, what authored CSS hooks into) and an inline
 * `--sv-live`, which no className rewrite can reach. React's `<Track>`
 * renders `className={'sv ' + className}`: a prop change rewrites the whole
 * attribute and drops a class the driver added, and a settled `once` entry
 * has no tracker left to put it back, which used to hold that section at
 * opacity 0 forever. */
function writeLive(entry: Entry) {
  const flag = entry.live ? '1' : '0'
  entry.written['--sv-live'] = flag
  entry.el.classList.toggle('sv-live', entry.live)
  entry.el.style.setProperty?.('--sv-live', flag)
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
    writeLive(entry)
    // once + nothing continuous = fire-and-forget: stop tracking, stop paying
    // the per-frame rect read. The class stays; --sv-view freezes as-is.
    const settle =
      isLive &&
      opts.once &&
      !opts.travel &&
      !opts.pin &&
      !(opts.scenes && opts.scenes > 1) &&
      !opts.onTravel &&
      !opts.onPin &&
      !opts.onScene
    if (settle) {
      // settle the outputs first: a child measured below the screen must not keep
      // --sv-view at -1 forever (sv-drift would stay invisible)
      if (opts.view !== false) setVar(entry, '--sv-view', reducedMotion ? 0 : computeView(geo, enter, exit))
      // release BEFORE onLive runs, and by identity: the callback is free to
      // track() the same element again, and a delete-by-element afterwards
      // would drop that replacement instead of this entry.
      if (entries.get(entry.el) === entry) {
        entries.delete(entry.el)
        // entry.el can be another live entry's root (a shared scroll container),
        // and this entry can declare its own root: only drop each resize watch
        // once no other entry still needs it.
        unobserveIfUnneeded(entry.el)
        if (opts.root) unobserveIfUnneeded(opts.root)
        culler?.unobserve(entry.el)
      }
    }
    opts.onLive?.(isLive)
    if (settle) return
    // onLive just ran and can untrack or re-track this same element: check
    // identity again before any further write, or a released (or replaced)
    // entry keeps writing --sv-view/--sv-t inline and fires one extra
    // onTravel/onPin/onScene for a callback that already returned.
    if (entries.get(entry.el) !== entry) return
  }

  // Something outside the driver can rewrite the class attribute of a tracked
  // element (React re-rendering `className`), dropping `sv` and `sv-live`
  // mid-flight. The driver re-asserts what it owns on every write: one
  // classList read per frame, an actual write only when the DOM disagrees.
  const classes = entry.el.classList
  if (classes.contains?.('sv') !== true || classes.contains?.('sv-live') !== entry.live) {
    classes.add('sv')
    writeLive(entry)
  }

  if (opts.view !== false) {
    setVar(entry, '--sv-view', reducedMotion ? 0 : computeView(geo, enter, exit))
  }

  if (opts.travel || opts.onTravel) {
    const t = computeTravel(geo)
    if (opts.travel) setVar(entry, '--sv-t', t)
    opts.onTravel?.(t)
    // every callback can untrack (or replace) its own element: the same
    // identity check the onLive branch makes, or a released entry keeps
    // getting --sv-pin/--sv-scene written inline (variables releaseEntry
    // already cleaned up, so they would stay forever) and one extra onScene
    if (entries.get(entry.el) !== entry) return
  }

  if (opts.pin || opts.onPin) {
    const p = computePin(geo, entry.pinOffset)
    if (opts.pin) setVar(entry, '--sv-pin', p)
    opts.onPin?.(p)
    if (entries.get(entry.el) !== entry) return
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

/** True if some OTHER live entry still needs `target` watched: either as its
 * own tracked element, or as its `root`. A root can be shared (a standalone
 * tracked element that is also another entry's scroll container), so release
 * must never unobserve a target another live entry still depends on. */
function stillNeeded(target: HTMLElement): boolean {
  for (const other of entries.values()) {
    if (other.el === target || other.opts.root === target) return true
  }
  return false
}

/** Drop the resize watch on `target` (a tracked element or a `root`), but
 * only once no other live entry still needs it. Shared by releaseEntry()
 * and the once fire-and-forget branch in apply() so the two release paths
 * cannot drift apart again: both must release the tracked element AND its
 * `root`, or a `{ once: true, root }` entry leaks the root's watch. */
function unobserveIfUnneeded(target: HTMLElement) {
  if (!stillNeeded(target)) resizeObserver?.unobserve(target)
}

/** Undo everything a track() call installed for one entry: written vars,
 * `--sv-scenes`, the pin helper, both observers (respecting shared roots).
 * Shared by the identity-guarded untrack and by track() replacing an
 * already-tracked element, so a replacing track() is exactly untrack then
 * track. */
function releaseEntry(entry: Entry) {
  const { el } = entry
  entries.delete(el)
  culler?.unobserve(el)
  unobserveIfUnneeded(el)
  if (entry.opts.root) unobserveIfUnneeded(entry.opts.root)
  restorePinHelper(entry)
  el.classList.toggle('sv-live', false)
  for (const name of Object.keys(entry.written)) el.style.removeProperty?.(name)
  el.style.removeProperty?.('--sv-scenes')
  // A released element settles VISIBLE. `.sv` and `[data-sv]` both declare
  // `--sv-live: 0`, only `.sv.sv-live` lifts it to 1, and `html.sv-on` is
  // never taken off: without this, stopScan() or a ScrollVarsBoot unmount
  // would leave every not-yet-live section at opacity 0 forever, and an
  // option change would flash content out and back. Inline rather than
  // dropping `.sv`, because server markup keeps its authored `[data-sv]`
  // (which hides on its own) and the driver must not rewrite that attribute.
  el.style.setProperty?.('--sv-live', '1')
  // The same promise for everything the pin presets style on this element's
  // DESCENDANTS, which no inline variable here could reach: `.sv-off` is the
  // marker the guards in styles/pin.css exclude, so a released element
  // renders like its no-JS state (curtains gone, deck unstacked, sv-range
  // finished, `.sv-stage` back in flow) instead of freezing the last frame.
  el.classList.add('sv-off')
}

/** Track an element. Returns an untrack function. */
export function track(el: HTMLElement, opts: TrackOptions = {}): () => void {
  init()
  // A failed init() (no ResizeObserver) leaves the driver uninitialized: stay
  // a no-op so the page stays static until compat() shims one in and a later
  // track() call retries init() clean.
  if (!initialized) return () => {}
  // re-tracking an already-tracked element must behave like untrack then
  // track: release the previous entry's outputs first, or a variable only it
  // ever wrote (e.g. --sv-t from a first call with travel:true) stays inline
  // forever once the identity guard blocks its own untrack.
  const existing = entries.get(el)
  if (existing) releaseEntry(existing)
  // a previous release settled the element visible with an inline --sv-live: 1
  // (and `.sv-off`); tracking hands the flag back to the driver, so drop both
  // before the first frame. `sv-live` goes too: a settled `once` entry keeps
  // the class with no tracker behind it, and a new entry starts at live:false,
  // so leaving it would skip the entrance and desync the DOM from the driver.
  el.style.removeProperty?.('--sv-live')
  el.classList.remove('sv-live', 'sv-off')
  const entry: Entry = {
    el,
    opts,
    near: true,
    live: false,
    scene: -1,
    pinOffset: opts.pin || opts.scenes || opts.onPin ? readPinOffset(el) : 0,
    written: {},
  }
  entries.set(el, entry)
  el.classList.add('sv')
  // constants CSS can read: how many scenes, so progress bars need no hard-coded count
  if (opts.scenes && opts.scenes > 1) el.style.setProperty('--sv-scenes', String(opts.scenes))
  // pin helper: `pin: '320vh'` is the whole skeleton (tall relative wrapper);
  // under reduced motion the wrapper stays in flow instead of an empty scroll
  if (typeof opts.pin === 'string') {
    entry.authored = { height: el.style.height, position: el.style.position }
    applyPinHelper(entry)
  }
  pageOutputs = true
  resizeObserver?.observe(el)
  // a root scrolls its own content; watch it too so a resize of the scroller
  // itself (not just the tracked element) reschedules a measure. A root can
  // be shared by several entries (or be a standalone tracked element too),
  // so release() only unobserves it once no live entry needs it any more.
  if (opts.root) resizeObserver?.observe(opts.root)
  if (!opts.root) culler?.observe(el)
  schedule()

  return () => {
    // a second track() on the same element replaces this entry in the map;
    // an untrack from the first call must not release or unobserve the
    // replacement, only its own bookkeeping.
    if (entries.get(el) !== entry) return
    releaseEntry(entry)
  }
}

function applyPinHelper(entry: Entry) {
  const { el, opts, authored } = entry
  if (typeof opts.pin !== 'string' || !authored) return
  if (reducedMotion) {
    el.style.height = authored.height
    el.style.position = authored.position
  } else {
    el.style.height = opts.pin
    // only a static element needs the positioning context; one positioned by a
    // stylesheet or inline (absolute, fixed, sticky) keeps it. An authored
    // inline `static` is exactly the case that needs replacing: keeping it
    // means the containing block the helper promises never exists, and an
    // absolutely positioned curtain escapes the stage.
    const keep = authored.position && authored.position !== 'static' ? authored.position : ''
    const computed = typeof getComputedStyle === 'function' ? getComputedStyle(el).position : undefined
    el.style.position = keep || (!computed || computed === 'static' ? 'relative' : '')
  }
}
function restorePinHelper(entry: Entry) {
  if (!entry.authored) return
  entry.el.style.height = entry.authored.height
  entry.el.style.position = entry.authored.position
}

/** Force a recompute (e.g. after content changes outside a resize). */
export function refresh() {
  // a sticky header that changed size changes every pin consumer's offset
  entries.forEach((entry) => {
    if (entry.opts.pin || entry.opts.scenes || entry.opts.onPin) entry.pinOffset = readPinOffset(entry.el)
  })
  // culled entries skip the per-frame rect read; give them one anyway so a
  // manual refresh() (content changed, no resize fired) reaches them too
  forceAll = true
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
  // reduced motion outranks the caller's `smooth`, the same way the slider's
  // glide falls back to a jump: a scene jump is navigation, not decoration
  const behavior: ScrollBehavior = smooth && !reducedMotion ? 'smooth' : 'instant'
  if (root) {
    // same origin update() measures against: the root's border-box top plus
    // clientTop, not the bare bounding rect
    root.scrollTo({
      top: root.scrollTop + rect.top - root.getBoundingClientRect().top - root.clientTop + offset,
      behavior,
    })
  } else {
    window.scrollTo({ top: window.scrollY + rect.top + offset, behavior })
  }
}

export function prefersReducedMotion() {
  return reducedMotion
}
