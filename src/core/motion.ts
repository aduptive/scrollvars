/**
 * One effective motion preference for the whole library.
 *
 * The OS setting behind `prefers-reduced-motion` is not enough on its own:
 * many people never find it, some cannot change it, and a site can offer
 * its own switch. So the preference is the media query OR
 * `data-sv-motion="reduce"` on <html>, read live. The driver, the slider's
 * glide, canvas effects and the React Slider's autoplay ask here and
 * subscribe here, so a change from either source reaches every animation
 * at once, instead of only the next one that happens to start. The
 * stylesheets honor the same attribute: every reduced-motion block in
 * styles/*.css has a twin under `[data-sv-motion="reduce"]`.
 */
const ATTR = 'data-sv-motion'
const listeners = new Set<(reduced: boolean) => void>()
let media: MediaQueryList | null = null
let wiredWith: unknown = null // the matchMedia the list came from: a replaced one (tests, iframes) is wired again
let mediaMatches = false
let last = false
let unwire: (() => void) | undefined

const attrReduce = () => {
  const el = typeof document !== 'undefined' ? document.documentElement : null
  return typeof el?.getAttribute === 'function' && el.getAttribute(ATTR) === 'reduce'
}

const mediaReduce = () => (media ? mediaMatches : false)

// The change event carries the new state; a list that only has the old
// addListener still passes one. Read it from the event first: on the old
// path the list's own `matches` is not always updated before the call.
const onMedia = (event?: { matches?: boolean }) => {
  mediaMatches = typeof event?.matches === 'boolean' ? event.matches : !!media?.matches
  notify()
}

/** True when the OS or the page asks for less motion. Safe anywhere, SSR included. */
export function reducedMotion(): boolean {
  wire()
  return attrReduce() || mediaReduce()
}

function notify() {
  const now = reducedMotion()
  if (now === last) return
  last = now
  // Each subscriber on its own: a throwing one (an application's listener)
  // must not stop the slider or the canvas from hearing the change, and the
  // observer cannot deliver it again since `last` already moved.
  listeners.forEach((fn) => {
    try {
      fn(now)
    } catch (error) {
      if (typeof reportError === 'function') reportError(error)
      else console.error(error)
    }
  })
}

function wire() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia === wiredWith) return
  const next = window.matchMedia('(prefers-reduced-motion: reduce)')
  let observer: MutationObserver | undefined
  const cleanup = () => {
    try {
      if (typeof next.removeEventListener === 'function') next.removeEventListener('change', onMedia)
      else next.removeListener?.(onMedia)
    } finally { observer?.disconnect() }
  }
  try {
    // addEventListener on a MediaQueryList is Safari 14; inside the supported
    // floor only the deprecated addListener exists.
    if (typeof next.addEventListener === 'function') next.addEventListener('change', onMedia)
    else next.addListener?.(onMedia)
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
      observer = new MutationObserver(notify)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] })
    }
  } catch (error) {
    try { cleanup() } catch { /* preserve the setup error */ }
    throw error
  }
  try { unwire?.() } catch { /* the replacement is already wired */ }
  unwire = cleanup
  wiredWith = window.matchMedia
  media = next
  mediaMatches = !!next.matches
  last = attrReduce() || mediaMatches
}

/** Runs `fn` with the effective preference whenever it changes. Returns the unsubscribe. */
export function onMotionChange(fn: (reduced: boolean) => void): () => void {
  wire()
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * The page's own switch. `'reduce'` asks for less motion whatever the OS
 * says; `'auto'` follows the OS again. Persisting the choice is the page's
 * job (a cookie, storage, a server preference): set it before the first
 * frame and nothing animates first and calms down later.
 */
export function setMotion(mode: 'reduce' | 'auto'): void {
  const el = typeof document !== 'undefined' ? document.documentElement : null
  if (!el || typeof el.setAttribute !== 'function') return
  if (mode === 'reduce') el.setAttribute(ATTR, 'reduce')
  else el.removeAttribute(ATTR)
  wire()
  notify() // the observer would report it a microtask later; callers read the new state now
}
