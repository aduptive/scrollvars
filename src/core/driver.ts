import { clamp, easeOutCubic, snapProgress } from './math'

export interface ScrollVarsOptions {
  /** Write `--d` (-1 entering → 0 in view → 1 leaving). Default true. */
  distance?: boolean
  /** Write `--p` (-1 → 1 across the element's full scroll travel). */
  progress?: boolean
  /** Write `--kf` (0..count) and fire onKeyframe on integer changes. */
  keyframes?: number
  /** Dead zone for snapping distance/keyframes to integers. false disables. */
  snap?: number | false
  /** Latch the active state once reached (entrance animations). */
  once?: boolean
  onActive?: (active: boolean) => void
  onKeyframe?: (index: number) => void
}

interface Entry {
  el: HTMLElement
  opts: ScrollVarsOptions
  height: number
  active: boolean
  kfIndex: number
  written: Record<string, string>
}

const DIST_SNAP = 0.35
const KF_SNAP = 0.4
// Active band: enter when the top reaches 75% down the viewport, stay while
// the bottom is past 25% — the standard reveal-on-scroll feel (a strict
// center line keeps tall sections dark for too long).
const ACTIVE_ENTER = 0.75
const ACTIVE_EXIT = 0.25

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

function computeDistance(rect: DOMRect, height: number): number {
  const zone = vh * (2 / 3)
  const enterTop = rect.top - (vh - zone)
  if (enterTop > 0) {
    return clamp(-enterTop / zone, -1, 0)
  }
  const traveled = -enterTop
  const span = Math.max(height - zone, zone)
  if (traveled > span) {
    return clamp((traveled - span) / zone, 0, 1)
  }
  return 0
}

function computeProgress(rect: DOMRect, height: number): number {
  const topHeight = Math.max(vh / 2, vh - height)
  const span = Math.max(height - vh, vh / 2) + topHeight
  return clamp(-(rect.top - topHeight) / span, -1, 1)
}

function computeKeyframe(
  progress: number,
  count: number,
  snap: number | false
): number {
  const raw = clamp(progress, 0, 1) * count
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

  const isActive =
    (rect.top < vh * ACTIVE_ENTER && rect.bottom > vh * ACTIVE_EXIT) ||
    (entry.active && !!opts.once)
  if (isActive !== entry.active) {
    entry.active = isActive
    entry.el.classList.toggle('sv-active', isActive)
    opts.onActive?.(isActive)
  }

  if (opts.distance !== false) {
    const raw = reducedMotion ? 0 : computeDistance(rect, entry.height)
    const snap = opts.snap === false ? 0 : (opts.snap ?? DIST_SNAP)
    setVar(entry, '--d', snapProgress(raw, snap))
  }

  const needsProgress = opts.progress || opts.keyframes
  if (needsProgress) {
    const progress = computeProgress(rect, entry.height)
    if (opts.progress) setVar(entry, '--p', progress)

    if (opts.keyframes) {
      const snap = opts.snap === false ? false : (opts.snap ?? KF_SNAP)
      const kf = computeKeyframe(progress, opts.keyframes, snap)
      setVar(entry, '--kf', kf)

      const index = clamp(Math.round(kf), 0, opts.keyframes - 1)
      if (index !== entry.kfIndex) {
        entry.kfIndex = index
        opts.onKeyframe?.(index)
      }
    }
  }
}

/** Register an element. Returns an unregister function. */
export function register(
  el: HTMLElement,
  opts: ScrollVarsOptions = {}
): () => void {
  init()
  const entry: Entry = {
    el,
    opts,
    height: el.scrollHeight,
    active: false,
    kfIndex: -1,
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

/** Scroll the window so `el` lands on the given keyframe. */
export function scrollToKeyframe(
  el: HTMLElement,
  index: number,
  count: number,
  smooth = true
) {
  if (typeof window === 'undefined') return
  const height = el.scrollHeight
  const viewport = window.innerHeight
  const topHeight = Math.max(viewport / 2, viewport - height)
  const span = Math.max(height - viewport, viewport / 2) + topHeight
  const targetProgress = clamp((index + 0.02) / count, 0, 1)
  const top =
    window.scrollY + el.getBoundingClientRect().top - topHeight +
    targetProgress * span

  window.scrollTo({
    top: Math.max(0, top),
    behavior: smooth ? 'smooth' : 'instant',
  })
}

export function prefersReducedMotion() {
  return reducedMotion
}
