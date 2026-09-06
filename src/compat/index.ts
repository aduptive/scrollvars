/**
 * Extended compatibility: OPT-IN module for old browsers. Call `compat()`
 * once, before anything else from scrollvars:
 *
 *   import { compat } from 'scrollvars/compat'
 *   compat()
 *
 * On a modern browser it runs three feature checks and returns false. No
 * stubs, no styles, effectively free. On an old one it patches the gaps:
 *
 *   - ResizeObserver missing (Safari < 13.1): a window-resize-backed stub:
*     re-measures on viewport changes (misses pure content growth; the page
 *     still works, call `refresh()` after big DOM swaps if needed). Its
 *     `contentRect` is measured from the layout box, like the native
 *     observer, so an ancestor `transform: scale()` never inflates it.
 *   - IntersectionObserver missing (Safari < 12.1): an always-visible stub:
*     the canvas harness simply never auto-pauses offscreen.
 *   - Individual transform properties missing (`translate:`, Chrome < 104,
 *     Firefox < 72, Safari < 14.1): injects a fallback stylesheet that
 *     re-expresses with `transform:` the same nine presets README lists:
 *     sv-rise, sv-fade, sv-slide-l, sv-slide-r, sv-auto (its auto-ordered
 *     children), sv-drift, sv-curtain-l, sv-curtain-r, sv-rail. Written
 *     without :is(), clamp() or min() so the old parser accepts it; the
 *     one max() left, drift's fade, sits behind a plain opacity
 *     declaration that parser keeps. Three presets stay static, one
 *     reason each:
 *       sv-deck, unstacked here to a static, non-overlapping layout
 *         because its fly-away slice needs clamp();
 *       sv-split-rise, no fallback rule, its animating selector is an
 *         :is() the old parser drops whole;
 *       sv-spread, no fallback rule either, its selector parses fine and
 *         there is simply no translate/rotate left to apply.
 *     sv-reading falls back to fully-visible text; sv-counter and
 *     sv-view-* stay progressive.
 *
 * Syntax floor stays the consumer's job: the dist ships ES2020; if you must
 * PARSE on very old engines, let your bundler downlevel it (Next.js already
 * transpiles per browserslist via transpilePackages).
 */

const FALLBACK_CSS = `
.sv, [data-sv] { --sv-live: 0; }
.sv.sv-live { --sv-live: 1; }
.sv-on .sv .sv-rise, .sv-on .sv .sv-fade, .sv-on .sv .sv-slide-l,
.sv-on .sv .sv-slide-r, .sv-on .sv.sv-auto > :not(.sv-skip) {
  opacity: var(--sv-live, 0);
  transition:
    opacity var(--sv-duration, 800ms) var(--sv-ease, ease-out),
    transform var(--sv-duration, 800ms) var(--sv-ease, ease-out);
  transition-delay: calc(var(--sv-order, 0) * var(--sv-stagger, 90ms));
}
.sv-on .sv .sv-rise, .sv-on .sv.sv-auto > :not(.sv-skip) {
  transform: translateY(calc((1 - var(--sv-live, 0)) * var(--sv-distance, 6rem)));
}
.sv-on .sv .sv-slide-l { transform: translateX(calc((1 - var(--sv-live, 0)) * var(--sv-distance, 6rem) * -2)); }
.sv-on .sv .sv-slide-r { transform: translateX(calc((1 - var(--sv-live, 0)) * var(--sv-distance, 6rem) * 2)); }
.sv .sv-drift {
  opacity: 1; /* fallback: max() postdates the floor: old engines keep this */
  opacity: calc(1 - max(var(--sv-view, 0), -1 * var(--sv-view, 0)));
  transform: translateY(calc(var(--sv-view, 0) * var(--sv-distance, 6rem) * -1));
}
.sv .sv-curtain-l { transform: translateX(calc(var(--sv-pin, 0) * -101%)); }
.sv .sv-curtain-r { transform: translateX(calc(var(--sv-pin, 0) * 101%)); }
.sv .sv-rail { transform: translateX(calc(var(--sv-pin, 0) * (100vw - 100%))); }
.sv .sv-reading > * { opacity: 1; }
/* The fly-away slice (--sv-slice, pin.css) is bounded 0..1 by a comparison
   function; below the floor that function ships on, it is unparseable and
   drops the whole transform, which leaves every card stacked in pin.css's
   shared grid cell (sv-deck's stacking mechanism, not the transform).
   Unstack statically instead: no comparison function needed, no animation
   either. */
.sv .sv-deck { display: block; }
.sv .sv-deck > * { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .sv-on .sv .sv-rise, .sv-on .sv .sv-fade, .sv-on .sv .sv-slide-l,
  .sv-on .sv .sv-slide-r, .sv-on .sv.sv-auto > :not(.sv-skip),
  .sv .sv-drift, .sv .sv-curtain-l, .sv .sv-curtain-r, .sv .sv-rail,
  .sv .sv-deck > * {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
`

interface RoEntryStub {
  target: Element
  contentRect: { width: number; height: number }
  contentBoxSize: Array<{ inlineSize: number; blockSize: number }>
}

// Content box in CSS pixels, from the LAYOUT box like a real
// ResizeObserverEntry: clientWidth/clientHeight exclude the border and
// include the padding, so one padding subtraction is the content box.
// getBoundingClientRect() is the PAINT box and scales with an ancestor
// `transform: scale()`: a canvas under `scale(2)` reported a doubled
// content box and settled its backing store there forever. clientWidth is
// transform-immune, which is why the canvas harness's causal probe reads
// it too. The cost is rounding to whole pixels, where a native contentRect
// keeps fractions.
function measureContentRect(el: Element) {
  const style = window.getComputedStyle(el)
  const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
  return {
    width: Math.max(0, (el as HTMLElement).clientWidth - paddingX),
    height: Math.max(0, (el as HTMLElement).clientHeight - paddingY),
    // contentBoxSize is logical, contentRect physical: a vertical writing
    // mode runs the inline axis down the block box, swapping the two.
    vertical: (style.writingMode || '').indexOf('vertical') === 0,
  }
}

function measureEntry(el: Element): RoEntryStub {
  const { width, height, vertical } = measureContentRect(el)
  return {
    target: el,
    contentRect: { width, height },
    contentBoxSize: [
      vertical ? { inlineSize: height, blockSize: width } : { inlineSize: width, blockSize: height },
    ],
  }
}

// viewport-resize-backed stand-in: enough for the driver's re-measures.
// Ships a contentRect/contentBoxSize on every entry (mountEffect's
// measureLayout() reads entry.contentRect.width/height directly and would
// throw on a bare `{ target }` record).
function makeResizeObserverStub() {
  return class ResizeObserverStub {
    private cb: (entries: RoEntryStub[]) => void
    private els = new Set<Element>()
    private fire: () => void
    constructor(cb: (entries: RoEntryStub[]) => void) {
      this.cb = cb
      this.fire = () => {
        const entries: RoEntryStub[] = []
        this.els.forEach((el) => entries.push(measureEntry(el)))
        this.cb(entries)
      }
      window.addEventListener('resize', this.fire)
      window.addEventListener('orientationchange', this.fire)
    }
    observe(el: Element) {
      this.els.add(el)
      this.cb([measureEntry(el)]) // like the real one: an initial observation
    }
    unobserve(el: Element) {
      this.els.delete(el)
    }
    disconnect() {
      this.els.clear()
      window.removeEventListener('resize', this.fire)
      window.removeEventListener('orientationchange', this.fire)
    }
  }
}

/** Apply the patches this browser needs. Returns true if anything was patched. */
export function compat(): boolean {
  if (typeof window === 'undefined') return false
  let patched = false
  const w = window as any

  if (!('ResizeObserver' in w)) {
    w.ResizeObserver = makeResizeObserverStub()
    patched = true
  }

  if (!('IntersectionObserver' in w)) {
    // always-visible stand-in: ambient canvases just never auto-pause
    class IntersectionObserverStub {
      private cb: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void
      constructor(cb: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void) {
        this.cb = cb
      }
      observe(el: Element) {
        this.cb([{ target: el, isIntersecting: true }])
      }
      unobserve() {}
      disconnect() {}
    }
    w.IntersectionObserver = IntersectionObserverStub
    patched = true
  }

  const cssApi = w.CSS
  const hasIndividualTransforms =
    cssApi && cssApi.supports && cssApi.supports('translate', '0px')
  if (!hasIndividualTransforms && !document.querySelector('style[data-sv-compat]')) {
    const style = document.createElement('style')
    style.setAttribute('data-sv-compat', '')
    style.textContent = FALLBACK_CSS
    document.head.appendChild(style)
    patched = true
  }

  return patched
}
