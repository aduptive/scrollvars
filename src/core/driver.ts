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
  /** Fires when a [data-sv-fit] stage falls back to document flow. Discrete, not per frame. */
  onFlow?: (flow: boolean) => void
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
   * from the stage's computed `--sv-pin-offset` (the tracked element's, when
   * there is no `.sv-stage`), so one CSS declaration drives both the layout
   * (.sv-stage) and the math. */
  pinOffset: number
  /** inline height/position the pin helper replaced, restored on untrack */
  authored?: { height: string; position: string }
  written: Record<string, string>
  stage?: HTMLElement
  fit?: HTMLElement
  flow?: boolean
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

/** Reads whether the user prefers reduced motion. Once init() has run, the
 * change listener wired below keeps `reducedMotion` in sync and this just
 * returns it. Before the first track(), nothing has installed that listener
 * yet, so a caller asking early (prefersReducedMotion(), scrollToScene())
 * would otherwise see the stale `false` default: query the media list
 * directly in that window instead. */
function getReducedMotion(): boolean {
  if (initialized || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return reducedMotion
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function init() {
  if (initialized || typeof window === 'undefined') return
  vh = window.innerHeight

  // Construct the ResizeObserver FIRST, before any listener is installed: a
  // throwing constructor must leave nothing behind to undo, so a later
  // track() (after scrollvars/compat shims one in) can retry init() clean.
  try {
    resizeObserver = new ResizeObserver(() => {
      offsetsDirty = true
      schedule()
    })
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
    applyPinHelperAll()
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
let pageOutputsMode: 'auto' | 'on' | 'off' = 'auto'
let pageOutputsResolved = false
let pageOutputsEnabled = true // in auto mode this is the answer detectPageConsumers() gave
let consumerWatch: MutationObserver | null = null
let offsetsDirty = false
let forceAll = false // set by refresh(): give culled entries one geometry pass on the next update()

/** Enable/disable document-wide --sv-page/--sv-v writes. Calling this at all
 * takes the decision away from auto-detection, permanently and in both
 * directions: pass true for a JS reader that no stylesheet reveals.
 * Repeated enabling does not schedule another frame. */
export function setPageOutputs(enabled: boolean) {
  pageOutputsMode = enabled ? 'on' : 'off'
  consumerWatch?.disconnect()
  consumerWatch = null
  unlistenAll()
  if (enabled && pageOutputsEnabled) return
  pageOutputsEnabled = enabled
  if (typeof document === 'undefined') return
  if (!enabled) stopPageOutputs()
  else schedule()
}

function stopPageOutputs() {
  clearTimeout(velTimer)
  document.documentElement.style.removeProperty('--sv-page')
  document.documentElement.style.removeProperty('--sv-v')
  lastPageStr = lastVStr = ''
}

// --sv-page and --sv-v are INHERITED custom properties on <html>: every write
// invalidates style for the whole document, whether or not anything reads
// them. Measured on the 900-box benchmark, publishing them unread costs 3249ms
// of style recalculation over a 12-second scroll against 269ms, and the same
// page with the same writes registered `inherits: false` costs 267.5ms, so the
// price is the inheritance, not the write. Pages that use the variables must
// pay it; pages that do not should not, and until this they all did.
//
// So in auto mode the driver asks the document whether anything COULD read
// them before publishing. Every uncertainty answers yes: an unreadable
// cross-origin sheet, a thrown DOM call, anything. A JS-only reader is
// invisible to this and needs setPageOutputs(true).
// The name has to end where it ends: `--sv-view` starts with `--sv-v`, and a
// plain substring test called every preset in core.css a consumer, which is
// every page that uses the library at all.
const PAGE_OUTPUT_NAMES = /--sv-page(?![\w-])|--sv-v(?![\w-])/

function mentionsPageOutputs(css: string) {
  return PAGE_OUTPUT_NAMES.test(css)
}

// Owner nodes of sheets whose @import has not loaded yet, found by the last
// scan: they fire `load` when it lands, and the answer is asked again then.
let pendingImportOwners: Element[] = []
// Owners currently listened to, one pair each, so repeated resolutions do not
// stack closures and an explicit override can take them all off.
const listened = new Map<Element, () => void>()
function unlistenAll() {
  listened.forEach((off, owner) => {
    owner.removeEventListener('load', off)
    owner.removeEventListener('error', off)
  })
  listened.clear()
}

function sheetReadsPageOutputs(sheet: CSSStyleSheet, depth: number): boolean {
  let rules: CSSRuleList | null
  try {
    rules = sheet.cssRules
  } catch {
    return true // cross-origin without CORS: unreadable, so assume it reads them
  }
  if (!rules) return true
  for (const rule of Array.from(rules)) {
    // An @import's own serialization is just the url: the names live in the
    // sheet it pulls in, and an unreadable imported sheet is the same
    // uncertainty as an unreadable linked one. One that has not LOADED yet
    // (styleSheet still null) is uncertainty too: on a slow connection the
    // first frame runs before the import lands, and reading its text as "no
    // consumer" silenced a page whose consumer was on its way (found in CI).
    if (isImportRule(rule)) {
      const imported = rule.styleSheet
      if (!imported) {
        let owner: CSSStyleSheet | null = sheet
        while (owner && !owner.ownerNode) owner = owner.parentStyleSheet
        if (owner?.ownerNode) pendingImportOwners.push(owner.ownerNode as Element)
        return true
      }
      if (depth > 4 || sheetReadsPageOutputs(imported, depth + 1)) return true
      continue
    }
    // cssText of a grouping rule carries its children, so nesting is covered.
    if (mentionsPageOutputs(rule.cssText)) return true
  }
  return false
}

const isImportRule = (rule: CSSRule): rule is CSSImportRule => rule.type === 3 /* IMPORT_RULE, older engines lack the class */

function detectPageConsumers(): boolean {
  pendingImportOwners = []
  try {
    // The attribute selector can only match a substring, so `--sv-view` (which
    // the driver itself writes inline on every tracked element) matches
    // `--sv-v`. Re-test each candidate with the bounded name instead: without
    // this, any rescan after the first frame says yes on every page.
    // :not(html): the driver writes the two outputs inline on <html>, and a
    // rescan that read its own writes as a consumer never unpublished again.
    for (const el of Array.from(document.querySelectorAll('[style*="--sv-page"]:not(html),[style*="--sv-v"]:not(html)')))
      if (mentionsPageOutputs(el.getAttribute('style') || '')) return true
    const adopted = (document as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets
    if (adopted) for (const sheet of Array.from(adopted)) if (sheetReadsPageOutputs(sheet, 0)) return true
    for (const sheet of Array.from(document.styleSheets)) {
      const node = sheet.ownerNode as Element | null
      // A <style> element's text is the cheap path, but a CSS-in-JS runtime in
      // production inserts rules through the CSSOM and leaves that text empty,
      // so a miss there has to fall through to the rules rather than skip.
      if (node && node.nodeName === 'STYLE' && mentionsPageOutputs(node.textContent || '')) return true
      if (sheetReadsPageOutputs(sheet, 0)) return true
    }
  } catch {
    return true
  }
  return false
}

// A stylesheet that arrives later (a lazily mounted component, a CSS-in-JS
// runtime, an HMR update) can introduce the first consumer, and so can an
// element with an inline style. The watch exists only while the answer is
// "nobody reads them" and stops for good at the first consumer, so a page that
// uses the variables carries no observer at all. Same shape as the scanner's
// own observer, which already watches the whole tree for childList.
function watchForPageConsumers() {
  if (consumerWatch || typeof MutationObserver === 'undefined') return
  const root = document.documentElement
  if (!root) return
  let queued = false
  consumerWatch = new MutationObserver(records => {
    if (queued) return
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        // text landing in a <style> (textContent = ...) is a new rule too
        const relevant = node.nodeType === 1 || (node.nodeType === 3 && node.parentNode?.nodeName === 'STYLE')
        if (!relevant) continue
        queued = true
        break
      }
      if (queued) break
    }
    // One rescan per frame at most: a runtime that injects a hundred rules
    // in a row would otherwise walk every stylesheet a hundred times. The
    // rescan goes through resolvePageOutputs(), so a <link> or @import that
    // has not loaded (inserted bare or inside a wrapper) is uncertainty with
    // a load listener, not a rule read as absent; and it does nothing once
    // the watch is gone, so a frame queued before the last release cannot
    // wake a driver with no work.
    if (queued)
      requestAnimationFrame(() => {
        queued = false
        if (!consumerWatch || pageOutputsMode !== 'auto') return
        resolvePageOutputs()
        if (pageOutputsEnabled && !listened.size) {
          consumerWatch?.disconnect()
          consumerWatch = null
        }
      })
  })
  consumerWatch.observe(root, { childList: true, subtree: true })
}


// A <link> whose sheet has not been parsed yet answers nothing: its rules are
// unreadable at this instant, which is the same uncertainty a cross-origin
// sheet is. It publishes meanwhile and asks again when the sheet lands, so a
// slow stylesheet cannot make the page silent and cannot make it loud forever.
// CI found this: locally the fixture's stylesheet always won the race.
function pendingSheets(): HTMLLinkElement[] {
  // Anything that cannot answer is uncertainty, and detectPageConsumers()
  // already says yes to that, so an empty list here is the honest answer
  // rather than a second guess.
  try {
    return Array.from(document.querySelectorAll('link[rel~="stylesheet"]'))
      .filter(link => !(link as HTMLLinkElement).sheet) as HTMLLinkElement[]
  } catch {
    return []
  }
}

function resolvePageOutputs() {
  if (pageOutputsMode !== 'auto') return
  const found = detectPageConsumers()
  // a <link> with no parsed sheet yet, or a <style>/<link> whose @import has
  // not landed: both answer nothing now and fire `load` when they can
  const pending: Element[] = [...pendingSheets(), ...pendingImportOwners]
  const enabled = found || pending.length > 0
  const was = pageOutputsEnabled
  if (was && !enabled) stopPageOutputs()
  pageOutputsEnabled = enabled
  if (pending.length) {
    for (const owner of pending) {
      if (listened.has(owner)) continue
      const settled = () => {
        owner.removeEventListener('load', settled)
        owner.removeEventListener('error', settled)
        listened.delete(owner)
        resolvePageOutputs()
      }
      listened.set(owner, settled)
      owner.addEventListener('load', settled)
      owner.addEventListener('error', settled)
    }
  } else if (!found) watchForPageConsumers()
  // Only a transition earns a frame. Scheduling on every resolution sustains
  // an idle loop, which is the trap the setPageOutputs guard was written for.
  if (!was && enabled) schedule()
}

function schedule() {
  if (!raf && (entries.size > 0 || (pageOutputs && pageOutputsEnabled))) raf = requestAnimationFrame(update)
}

function update() {
  raf = 0
  const force = forceAll
  forceAll = false
  if (offsetsDirty) {
    offsetsDirty = false
    entries.forEach(entry => {
      if (entry.opts.pin || entry.opts.scenes || entry.opts.onPin) entry.pinOffset = readPinOffset(entry.el)
    })
  }
  // READ phase: batch all layout reads before any style write. Root rects
  // are read once per root per frame and shared by its entries.
  const y = window.scrollY
  const now = performance.now()
  // A jump longer than a viewport (anchor, scrollTo, restored position) can
  // carry an element from far below to far above without the culler ever
  // seeing it intersect: give every entry one geometry pass on such frames.
  const jumped = lastY >= 0 && Math.abs(y - lastY) > vh
  const docEl = document.documentElement
  // Ask the document once, on the first frame that could publish: by then a
  // stylesheet written next to the track() call is in place.
  if (pageOutputs && !pageOutputsResolved) {
    pageOutputsResolved = true
    resolvePageOutputs()
  }
  const pageSpan = pageOutputsEnabled ? Math.max((docEl.scrollHeight || 0) - vh, 1) : null
  const rootRects = new Map<HTMLElement, DOMRect>()
  const frames: Array<{ entry: Entry; geo: Geometry; overflow: boolean; stageWidth?: number }> = []
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
    const overflow = !!entry.fit && !entry.flow && entry.fit.offsetHeight >
      (entry.fit.parentElement?.clientHeight ?? Math.max(geo.vp - entry.pinOffset, 0)) + 1
    frames.push({ entry, geo, overflow, stageWidth: entry.stage?.clientWidth })
  })
  // WRITE phase. `frames` is a snapshot taken before any callback ran: an
  // onLive/onScene fired earlier in this same loop can untrack (or replace)
  // a later entry, and a released entry must not get one more write and one
  // more callback after its untrack returned.
  for (const { entry, geo, overflow, stageWidth } of frames) {
    if (entries.get(entry.el) !== entry) continue
    if (entry.fit && entry.flow === undefined && !overflow) {
      entry.flow = false
      entry.opts.onFlow?.(false)
      if (entries.get(entry.el) !== entry) continue
    }
    if (overflow && !entry.flow) {
      // ponytail: latch until retracked; measuring the expanded flow layout to
      // re-enable pinning would oscillate and interrupt someone reading it.
      entry.flow = true
      entry.el.setAttribute('data-sv-flow', '')
      restorePinHelper(entry)
      entry.opts.onFlow?.(true)
      if (entries.get(entry.el) !== entry) continue
      schedule() // geometry changed; read the flow layout on the next frame
    }
    if (stageWidth !== undefined) setVar(entry, '--sv-stage-width', stageWidth, 'px')
    apply(entry, geo)
  }
  // Page-level outputs on <html>: --sv-page (0..1 through the document) and
  // --sv-v (signed velocity, viewport-heights per second). Velocity decays to
  // 0 shortly after the last scroll event so a CSS transition can ease a
  // skew/stretch effect back to rest.
  // A callback may enable outputs after the read phase; its scheduled frame
  // must measure the page before publishing progress. Disabling is immediate.
  if (pageOutputsEnabled && pageSpan !== null) {
    const dt = now - lastT
    const v = lastY < 0 || dt <= 0 ? 0 : ((y - lastY) / dt) * 1000 / vh
    const pageStr = clamp(y / pageSpan, 0, 1).toFixed(4)
    if (pageStr !== lastPageStr) docEl.style?.setProperty('--sv-page', (lastPageStr = pageStr))
    const vStr = (reducedMotion ? 0 : clamp(v, -20, 20)).toFixed(3)
    if (vStr !== lastVStr) docEl.style?.setProperty('--sv-v', (lastVStr = vStr))
    clearTimeout(velTimer)
    if (vStr !== '0.000')
      velTimer = setTimeout(() => docEl.style?.setProperty('--sv-v', (lastVStr = '0.000')), 80)
  }
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
 * Uses the actual stage's computed top, including calc(), env() and percentages.
 * Without a stage (or when top is auto), the fallback resolves rem (root font-size), em (the stage's font-size), vh/svh/lvh/dvh
 * (window.innerHeight) and vw (window.innerWidth); anything else, including a
 * bare number, falls back to parseFloat as px. svh/lvh/dvh resolve like vh:
 * there is no JS API for the small/large viewport height without an actual
 * probe element, so all three read window.innerHeight like vh does.
 *
 * Read on `.sv-stage`, not on the tracked wrapper: styles/pin.css consumes
 * the variable in `top:` and `height:` THERE, so that is the element a
 * relative unit resolves against and the element an author can redeclare it
 * on. Resolving `4em` against the wrapper disagreed with the CSS by the ratio
 * of the two font sizes. No stage (onPin alone, or custom markup): the
 * wrapper is the best reference left. */
function readPinOffset(el: HTMLElement): number {
  if (typeof getComputedStyle !== 'function') return 0
  const stage = (el.querySelector?.('.sv-stage') as HTMLElement | null) ?? el
  const computed = getComputedStyle(stage)
  // CSS resolves calc(), percentages, viewport units and env() in the actual
  // sticky containing block. Do not maintain a second CSS length engine.
  if (stage !== el && /^-?[\d.]+px$/.test(computed.top)) return parseFloat(computed.top)
  const raw = computed.getPropertyValue('--sv-pin-offset').trim()
  const match = raw.match(/^(-?[\d.]+)\s*([a-z%]*)$/i)
  const value = match ? parseFloat(match[1]) : parseFloat(raw)
  if (!value) return 0
  switch (match?.[2]?.toLowerCase()) {
    case 'rem':
      return value * parseFloat(getComputedStyle(document.documentElement).fontSize)
    case 'em':
      return value * parseFloat(getComputedStyle(stage).fontSize)
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

function setVar(entry: Entry, name: string, value: number, unit = '') {
  const serialized = value.toFixed(4) + unit
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
        // this element stays LIVE (that is what `once` latches), but it just
        // left `entries`: a released ancestor waiting on it can take its
        // marker now, and nothing else on this path would ever tell it.
        settleDeferred()
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
    if (other.el === target || other.opts.root === target || other.fit === target || other.stage === target) return true
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

/** Released elements still holding a tracked descendant: they take the marker
 * as soon as that descendant is released too. */
const deferredOff = new Set<HTMLElement>()

/** True while `el` itself, or anything inside it, is still tracked. The
 * released marker is read as `[data-sv-off] X`, which matches through ANY
 * depth: marking an element settles every preset under it, a still-running
 * nested tracker's included (nested trackers are a first-class pattern, the
 * NEAREST tracker owns spread). `:has()` would express it in CSS but is far
 * above the supported floor, so the driver keeps the marker honest instead. */
function containsTracked(el: HTMLElement): boolean {
  for (const other of entries.values()) if (other.el === el || el.contains?.(other.el)) return true
  return false
}

/** Hand the marker to every released element whose last tracked descendant is
 * gone. Called by BOTH exits from `entries`: releaseEntry() and the `once`
 * fire-and-forget settle in apply(), which deletes its entry inline. Without
 * the second call site an ancestor released while a `once` descendant was
 * still tracked keeps its stage sticky and clipping, curtains closed over the
 * content, until some unrelated later release happens to sweep the backlog. */
function settleDeferred() {
  if (!deferredOff.size) return
  deferredOff.forEach((waiting) => {
    if (containsTracked(waiting)) return
    deferredOff.delete(waiting)
    waiting.setAttribute?.('data-sv-off', '')
  })
}

/** Mark a released element for the static guards, but only once nothing
 * tracked is left inside it. Each release also settles the ancestors that
 * were waiting on it (stopScan() releases outer before inner). */
function markReleased(el: HTMLElement) {
  deferredOff.add(el)
  settleDeferred()
}

/** Drop the released marker off an element AND its ancestors: an ancestor's
 * marker reaches this element just as well, so a tracker starting under a
 * released one (stopScan() then a single section re-mounting) would run its
 * clock with every preset already settled static. */
function clearReleased(el: HTMLElement) {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    // An ANCESTOR that carried the marker (or was still waiting for it) is
    // released all the same: it only lends its marker to the tracker starting
    // inside it, and goes back to waiting, so the next release that empties it
    // marks it again. Dropping it here left the shell bare for good.
    const released = deferredOff.delete(node) || node.hasAttribute?.('data-sv-off') === true
    node.removeAttribute?.('data-sv-off')
    if (released && node !== el) deferredOff.add(node)
  }
}

/** Undo everything a track() call installed for one entry: written vars,
 * `--sv-scenes`, the pin helper, both observers (respecting shared roots).
 * Shared by the identity-guarded untrack and by track() replacing an
 * already-tracked element, so a replacing track() is exactly untrack then
 * track. */
function releaseEntry(entry: Entry) {
  const { el } = entry
  entries.delete(el)
  // Nothing is tracked any more: stop watching for a consumer that would only
  // wake a driver with no work, and let the next track() ask the document
  // again, since the page it asks about will have changed by then.
  if (entries.size === 0 && pageOutputsMode === 'auto') {
    consumerWatch?.disconnect()
    consumerWatch = null
    unlistenAll()
    pageOutputsResolved = false
  }
  culler?.unobserve(el)
  unobserveIfUnneeded(el)
  if (entry.opts.root) unobserveIfUnneeded(entry.opts.root)
  if (entry.fit) unobserveIfUnneeded(entry.fit)
  if (entry.stage) unobserveIfUnneeded(entry.stage)
  el.removeAttribute?.('data-sv-flow')
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
  // The same promise for everything the presets style on this element's
  // DESCENDANTS, which no inline variable here could reach: `[data-sv-off]` is
  // the marker the guards in styles/pin.css and styles/core.css read, so a
  // released element renders like its no-JS state (curtains gone, deck
  // unstacked, sv-range finished, spread in flow, `.sv-stage` back in flow)
  // instead of freezing the last frame. An ATTRIBUTE, not a class, on purpose:
  // the marker outlives a className rewrite (React's `<Track>` renders
  // `className={'sv ' + className}`), and a released element has no tracker
  // left to put a dropped class back. setAttribute, not toggleAttribute:
  // fallback-reachable code stays inside the supported floor (Safari 11).
  markReleased(el)
}

/** Replay the entrance of an element the driver had settled visible.
 *
 * The presets are CSS transitions off the inherited `--sv-live`, so the 0
 * state has to be COMMITTED between the release and the first frame's write
 * of 1. Nothing commits it on its own: a frame's rAF callbacks run BEFORE
 * that frame's style update, so the computed value goes 1 to 1 and no
 * transition is ever generated (measured in Chrome: opacity flat at 1 for
 * six frames after `stop()` then `track()`). A bare forced update is not
 * enough either, it only starts the fade OUT, which the next frame reverses
 * from wherever it got to (measured 0.938, a dip, not an entrance).
 *
 * So: zero the two knobs every preset builds its transition from, force the
 * update, hand them back. They are inherited custom properties, so zeroing
 * them on the tracked element reaches its whole subtree without the driver
 * writing on a descendant. That reach is also the cost: for this one flush
 * every OTHER knob consumer in the subtree reads 0s too, so an unrelated
 * transition created in the same tick (an accordion opened right there and
 * then) is created with duration 0 and snaps instead of animating. The reset
 * itself lands in one step with no transition to reverse, and the first
 * frame's 1 transitions from a real 0 at the authored duration and stagger.
 * An empty value on `setProperty` removes the declaration, and the authored
 * priority is carried back with the value, which is how an author's own
 * inline knobs survive the round trip (`!important` included: without it a
 * `!important` sheet rule would take the knob over from the author's inline
 * declaration, permanently). The zeroing is `!important` for the same
 * reason, so an important sheet rule cannot outrank it mid-replay.
 *
 * Only for an element carrying the inline `--sv-live: 1` the driver settles
 * with (released, or a settled `once`): a first track has nothing to replay
 * and must not pay a forced style update per element at boot. Two shapes are
 * not covered: entrance CSS of your own that hard-codes its duration instead
 * of reading the knobs, and a DESCENDANT that declares its own
 * `--sv-duration` (which `<Item duration>`, `Split` and the staggered-reveal
 * pane all do), since a descendant's own declaration beats an inherited
 * value at any priority. Both then behave as they did before this fix: in
 * the frame-apart shape they dip and reverse (measured 0.938), in the
 * same-tick shape they stay flat at 1 with no visible change at all. */
function replayEntrance(el: HTMLElement) {
  if (typeof getComputedStyle !== 'function') return
  const duration = el.style.getPropertyValue?.('--sv-duration') ?? ''
  const durationPriority = el.style.getPropertyPriority?.('--sv-duration') ?? ''
  const stagger = el.style.getPropertyValue?.('--sv-stagger') ?? ''
  const staggerPriority = el.style.getPropertyPriority?.('--sv-stagger') ?? ''
  el.style.setProperty?.('--sv-duration', '0s', 'important')
  el.style.setProperty?.('--sv-stagger', '0s', 'important')
  // reading a property is what flushes the pending style update, not the
  // getComputedStyle() call itself
  void getComputedStyle(el).opacity
  el.style.setProperty?.('--sv-duration', duration, durationPriority)
  el.style.setProperty?.('--sv-stagger', stagger, staggerPriority)
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
  // (and `data-sv-off`); tracking hands the flag back to the driver, so drop
  // both before the first frame. `sv-live` goes too: a settled `once` entry
  // keeps the class with no tracker behind it, and a new entry starts at
  // live:false, so leaving it would skip the entrance and desync the DOM from
  // the driver.
  const settled = el.style.getPropertyValue?.('--sv-live') === '1'
  el.style.removeProperty?.('--sv-live')
  el.classList.remove('sv-live')
  clearReleased(el)
  const entry: Entry = {
    el,
    opts,
    near: true,
    live: false,
    scene: -1,
    pinOffset: opts.pin || opts.scenes || opts.onPin ? readPinOffset(el) : 0,
    written: {},
    stage: opts.pin || opts.scenes || opts.onPin
      ? el.querySelector?.<HTMLElement>('.sv-stage') ?? undefined
      : undefined,
    fit: opts.pin || opts.scenes || opts.onPin
      ? el.querySelector?.<HTMLElement>('.sv-stage > [data-sv-fit]') ?? undefined
      : undefined,
  }
  entries.set(el, entry)
  el.classList.add('sv')
  // constants CSS can read: how many scenes, so progress bars need no hard-coded count
  if (opts.scenes && opts.scenes > 1) el.style.setProperty('--sv-scenes', String(opts.scenes))
  // pin helper: `pin: '320vh'` is the whole skeleton (tall relative wrapper);
  // under reduced motion, or below the individual-transform floor without
  // compat(), the wrapper stays in flow instead of an empty scroll
  if (typeof opts.pin === 'string') {
    entry.authored = { height: el.style.height, position: el.style.position }
    applyPinHelper(entry)
  }
  // Everything this call writes is in place: commit the `--sv-live: 0` reset
  // before the first frame writes 1 back, or an element the driver had
  // settled visible never replays its entrance.
  if (settled) replayEntrance(el)
  pageOutputs = true
  resizeObserver?.observe(el)
  if (entry.fit) resizeObserver?.observe(entry.fit)
  if (entry.stage) resizeObserver?.observe(entry.stage)
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

// Below the individual-transform floor (Chrome 104 / Firefox 72 / Safari
// 14.1), and on a page that did not call compat(), the `@supports not
// (translate: 0)` net in styles/pin.css releases
// `.sv-stage` (position static, height auto, overflow visible), so a pinned
// section renders at its natural height with JS on. The tall wrapper height
// on top of that would be two blank viewports under the content, which is
// what README's "below the floor nothing breaks" promises does not happen.
// An engine too old to answer at all is also too old for the @supports rule
// that releases the stage, so only an explicit `false` counts here: the JS
// and the CSS then always agree on which side of the floor the page is.
const belowTransformFloor = () => window.CSS?.supports?.('translate', '0px') === false

// scrollvars/compat's marker, written on <html> with its fallback sheet. That
// sheet re-expresses the curtains and the rail with `transform:` and animates
// them from --sv-pin, which the driver computes from the pinned skeleton: with
// it installed the skeleton is exactly what must NOT be released, or the clock
// runs 0 to 1 over a single pixel and those presets snap. styles/pin.css reads
// the same marker to keep `.sv-stage` sticky, so the CSS and the JS release
// together or not at all.
const compatInstalled = () => document.documentElement?.hasAttribute?.('data-sv-compat') === true

// The helper's only computed-style read, split out so a loop over several
// entries can take every read before any write. Reading after a write on the
// SAME element is free (the height cannot change the computed position), but
// the write on entry N invalidates the style the read on entry N+1 asks for,
// so a read-write-read-write loop still flushes a recalc for all but the
// first. This is never cached on the entry: an author media query can change
// the stylesheet position after track(), and a stale read would write
// `relative` over a sticky the sheet just applied.
function readPinPosition(entry: Entry): string | undefined {
  const { el, opts, authored } = entry
  if (typeof opts.pin !== 'string' || !authored) return undefined
  if (entry.flow || reducedMotion || (belowTransformFloor() && !compatInstalled())) return undefined
  // an authored inline position outranks the computed one: no read is owed
  if (authored.position && authored.position !== 'static') return undefined
  return typeof getComputedStyle === 'function' ? getComputedStyle(el).position : undefined
}

// Every read first, then every write, so N pinned entries cost one style
// flush instead of N. Never `entries.forEach(applyPinHelper)`: that hands the
// element in as `computed` (and the compiler says so).
function applyPinHelperAll() {
  const positions = new Map<Entry, string | undefined>()
  entries.forEach((entry) => positions.set(entry, readPinPosition(entry)))
  entries.forEach((entry) => applyPinHelper(entry, positions.get(entry)))
}

function applyPinHelper(entry: Entry, computed = readPinPosition(entry)) {
  const { el, opts, authored } = entry
  if (typeof opts.pin !== 'string' || !authored) return
  if (entry.flow || reducedMotion || (belowTransformFloor() && !compatInstalled())) {
    el.style.height = authored.height
    el.style.position = authored.position
  } else {
    // only a static element needs the positioning context; one positioned by a
    // stylesheet or inline (absolute, fixed, sticky) keeps it. An authored
    // inline `static` is exactly the case that needs replacing: keeping it
    // means the containing block the helper promises never exists, and an
    // absolutely positioned curtain escapes the stage.
    const keep = authored.position && authored.position !== 'static' ? authored.position : ''
    el.style.height = opts.pin
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
  const behavior: ScrollBehavior = smooth && !getReducedMotion() ? 'smooth' : 'instant'
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
  return getReducedMotion()
}
