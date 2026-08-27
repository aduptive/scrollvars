import type { TrackOptions } from './driver.js'
import { track } from './driver.js'

/**
 * Zero-wrapper mode: track every `[data-sv]` element and keep watching the
 * DOM, so server-rendered pages animate with no client components at all.
 *
 *   <section data-sv data-sv-once>…</section>
 *   <div data-sv data-sv-pin>…</div>
 *   <div data-sv data-sv-scenes="4">…</div>
 *
 * Per-element knobs are attributes too — no style attribute needed:
 *
 *   <p class="sv-rise" data-sv-order="1" data-sv-distance="3rem">…</p>
 *   <h2 data-sv-from="0" data-sv-to=".4">…</h2>   (sv-range slices)
 *
 * Each is written once as the matching CSS variable on mount (never in the
 * frame loop). When typed CSS attr() support settles, this mapping becomes
 * pure CSS and the write disappears.
 *
 * A MutationObserver picks up nodes added later (route transitions, CMS
 * blocks) and untracks removed ones. Returns a stop function.
 */

// per-element variable knobs: data-sv-<name> → --sv-<name>, written once
const VAR_ATTRS = ['order', 'distance', 'from', 'to'] as const
const VAR_SELECTOR = VAR_ATTRS.map((name) => `[data-sv-${name}]`).join(',')

function applyVarAttrs(el: HTMLElement) {
  for (const name of VAR_ATTRS) {
    const value = el.getAttribute(`data-sv-${name}`)
    if (value !== null) el.style.setProperty(`--sv-${name}`, value)
  }
}

function optionsFrom(el: HTMLElement): TrackOptions {
  const scenes = Number(el.getAttribute('data-sv-scenes'))
  return {
    once: el.hasAttribute('data-sv-once'),
    pin: el.hasAttribute('data-sv-pin'),
    travel: el.hasAttribute('data-sv-travel'),
    scenes: scenes > 1 ? scenes : undefined,
    enter: band(el, 'data-sv-enter'),
    exit: band(el, 'data-sv-exit'),
  }
}

function band(el: HTMLElement, attr: string): number | undefined {
  const v = Number(el.getAttribute(attr))
  return el.hasAttribute(attr) && v >= 0 && v <= 1 ? v : undefined
}

export function scan(root?: ParentNode): () => void {
  if (typeof window === 'undefined') return () => {}
  const scope: ParentNode = root ?? document

  const tracked = new Map<HTMLElement, () => void>()

  const add = (el: HTMLElement) => {
    if (!tracked.has(el)) tracked.set(el, track(el, optionsFrom(el)))
  }
  const remove = (el: HTMLElement) => {
    tracked.get(el)?.()
    tracked.delete(el)
  }
  const sweep = (node: Node, fn: (el: HTMLElement) => void) => {
    if (!(node instanceof HTMLElement)) return
    if (node.hasAttribute('data-sv')) fn(node)
    node.querySelectorAll<HTMLElement>('[data-sv]').forEach(fn)
    if (fn === add) {
      if (node.matches?.(VAR_SELECTOR)) applyVarAttrs(node)
      node.querySelectorAll<HTMLElement>(VAR_SELECTOR).forEach(applyVarAttrs)
    }
  }

  scope.querySelectorAll<HTMLElement>('[data-sv]').forEach(add)
  scope.querySelectorAll<HTMLElement>(VAR_SELECTOR).forEach(applyVarAttrs)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => sweep(node, add))
      mutation.removedNodes.forEach((node) => sweep(node, remove))
    }
  })
  observer.observe(scope === document ? document.body : (scope as Node), {
    childList: true,
    subtree: true,
  })

  return () => {
    observer.disconnect()
    tracked.forEach((untrack) => untrack())
    tracked.clear()
  }
}
