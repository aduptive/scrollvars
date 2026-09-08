import type { TrackOptions } from './driver.js'
import { track } from './driver.js'
import { split } from './split.js'
import { trackPointer } from './pointer.js'

/**
 * Zero-wrapper mode: track every `[data-sv]` element and keep watching the
 * DOM, so server-rendered pages animate with no client components at all.
 *
 *   <section data-sv data-sv-once>…</section>
 *   <div data-sv data-sv-pin>…</div>
 *   <div data-sv data-sv-scenes="4">…</div>
 *
 * Per-element knobs are attributes too. No style attribute needed:
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
const VAR_ATTRS = ['order', 'distance', 'from', 'to', 'duration', 'stagger', 'ease'] as const
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
    pin: el.getAttribute('data-sv-pin') || el.hasAttribute('data-sv-pin'),
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
  const splits = new Map<HTMLElement, () => void>()
  const pointers = new Map<HTMLElement, () => void>()
  const addPointer = (el: HTMLElement) => {
    if (!pointers.has(el)) pointers.set(el, trackPointer(el, {
      selector: el.getAttribute('data-sv-pointer') || undefined,
    }))
  }
  const removePointer = (el: HTMLElement) => {
    if (scope.contains(el)) return
    pointers.get(el)?.()
    pointers.delete(el)
  }

  const addSplit = (el: HTMLElement) => {
    if (splits.has(el)) return
    const by = el.getAttribute('data-sv-split') === 'char' ? 'char' : 'word'
    splits.set(el, split(el, { by }))
  }

  const add = (el: HTMLElement) => {
    if (!tracked.has(el)) tracked.set(el, track(el, optionsFrom(el)))
  }
  const remove = (el: HTMLElement) => {
    // a mutation batch can carry the same node in both removedNodes and
    // addedNodes (parent.replaceChildren/replaceWith retaining it) or split
    // a reorder across a removal record and an insertion record: by the
    // time the observer fires the DOM has already settled, so a node still
    // inside the observed scope was never really removed. Untracking it
    // here would strip its live state and force a re-track that hides
    // content for a frame. scope.contains(el), not el.isConnected: a
    // scoped scan(root) only observes root's subtree, so a node moved OUT
    // of root into another still-connected part of the document must be
    // untracked (isConnected stays true and no further record ever
    // arrives for it), and a scan() on a detached root needs the same
    // fix-up (isConnected is always false there, so el.isConnected could
    // never trigger the churn guard for it either).
    if (scope.contains(el)) return
    tracked.get(el)?.()
    tracked.delete(el)
  }
  const removeSplit = (el: HTMLElement) => {
    // same guard as remove() above: a retained [data-sv-split] node (batch
    // replaceChildren/replaceWith, or a reorder split across two records)
    // is still inside scope by the time the observer fires. Restoring its
    // original markup here would drop sv-split and nothing re-splits it.
    if (scope.contains(el)) return
    splits.get(el)?.()
    splits.delete(el)
  }
  const sweep = (node: Node, fn: (el: HTMLElement) => void) => {
    if (!(node instanceof HTMLElement)) return
    if (node.hasAttribute('data-sv')) fn(node)
    node.querySelectorAll<HTMLElement>('[data-sv]').forEach(fn)
    if (fn === add) {
      if (node.matches?.(VAR_SELECTOR)) applyVarAttrs(node)
      node.querySelectorAll<HTMLElement>(VAR_SELECTOR).forEach(applyVarAttrs)
      if (node.hasAttribute('data-sv-split')) addSplit(node)
      node.querySelectorAll<HTMLElement>('[data-sv-split]').forEach(addSplit)
      if (node.hasAttribute('data-sv-pointer')) addPointer(node)
      node.querySelectorAll<HTMLElement>('[data-sv-pointer]').forEach(addPointer)
    } else {
      // removed subtrees release their split closures too (SPA route changes)
      if (node.hasAttribute('data-sv-split')) removeSplit(node)
      node.querySelectorAll<HTMLElement>('[data-sv-split]').forEach(removeSplit)
      if (node.hasAttribute('data-sv-pointer')) removePointer(node)
      node.querySelectorAll<HTMLElement>('[data-sv-pointer]').forEach(removePointer)
    }
  }

  // querySelectorAll excludes an element scope itself; sweep it once.
  if ((scope as HTMLElement).hasAttribute) sweep(scope as Node, add)
  else {
    scope.querySelectorAll<HTMLElement>('[data-sv]').forEach(add)
    scope.querySelectorAll<HTMLElement>(VAR_SELECTOR).forEach(applyVarAttrs)
    scope.querySelectorAll<HTMLElement>('[data-sv-split]').forEach(addSplit)
    scope.querySelectorAll<HTMLElement>('[data-sv-pointer]').forEach(addPointer)
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => sweep(node, add))
      mutation.removedNodes.forEach((node) => sweep(node, remove))
    }
  })
  // documentElement, not body: scan() may run from <head> before <body> exists
  observer.observe(scope === document ? document.documentElement : (scope as Node), {
    childList: true,
    subtree: true,
  })

  return () => {
    observer.disconnect()
    tracked.forEach((untrack) => untrack())
    tracked.clear()
    splits.forEach((restore) => restore())
    splits.clear()
    pointers.forEach((stop) => stop())
    pointers.clear()
  }
}
