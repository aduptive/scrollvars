/**
 * Extended compatibility: OPT-IN module for old browsers. Call `compat()`
 * once, before anything else from scrollvars:
 *
 *   import { compat } from 'scrollvars/compat'
 *   compat()
 *
 * On a modern browser it runs two feature checks and returns false. No
 * stubs, no styles, effectively free. On an old one it patches the gaps:
 *
 *   - ResizeObserver missing (Safari < 13.1): a window-resize-backed stub:
*     re-measures on viewport changes (misses pure content growth; the page
 *     still works, call `refresh()` after big DOM swaps if needed).
 *   - IntersectionObserver missing (Safari < 12.1): an always-visible stub:
*     the canvas harness simply never auto-pauses offscreen.
 *   - Individual transform properties missing (`translate:`, Chrome < 104,
 *     Firefox < 72, Safari < 14.1): injects a fallback stylesheet that
 *     re-expresses the presets with `transform:`. Written without :is(),
 *     clamp() or min() so the old parser accepts it. sv-reading falls back
 *     to fully-visible text; sv-counter and sv-view-* stay progressive.
 *
 * Syntax floor stays the consumer's job: the dist ships ES2020; if you must
 * PARSE on very old engines, let your bundler downlevel it (Next.js already
 * transpiles per browserslist via transpilePackages).
 */

const FALLBACK_CSS = `
.sv-on .sv .sv-rise, .sv-on .sv .sv-fade, .sv-on .sv .sv-slide-l,
.sv-on .sv .sv-slide-r, .sv-on .sv.sv-auto > :not(.sv-skip) {
  opacity: 0;
  transition:
    opacity var(--sv-duration, 800ms) var(--sv-ease, ease-out),
    transform var(--sv-duration, 800ms) var(--sv-ease, ease-out);
  transition-delay: calc(var(--sv-order, 0) * var(--sv-stagger, 110ms));
}
.sv-on .sv .sv-rise, .sv-on .sv.sv-auto > :not(.sv-skip) {
  transform: translateY(var(--sv-distance, 6rem));
}
.sv-on .sv .sv-slide-l { transform: translateX(calc(var(--sv-distance, 6rem) * -2)); }
.sv-on .sv .sv-slide-r { transform: translateX(calc(var(--sv-distance, 6rem) * 2)); }
.sv-on .sv.sv-live .sv-rise, .sv-on .sv.sv-live .sv-fade,
.sv-on .sv.sv-live .sv-slide-l, .sv-on .sv.sv-live .sv-slide-r,
.sv-on .sv.sv-live.sv-auto > * {
  opacity: 1;
  transform: none;
}
.sv .sv-drift {
  opacity: 1; /* fallback: max() postdates the floor: old engines keep this */
  opacity: calc(1 - max(var(--sv-view, 0), -1 * var(--sv-view, 0)));
  transform: translateY(calc(var(--sv-view, 0) * var(--sv-distance, 6rem) * -1));
}
.sv .sv-curtain-l { transform: translateX(calc(var(--sv-pin, 0) * -101%)); }
.sv .sv-curtain-r { transform: translateX(calc(var(--sv-pin, 0) * 101%)); }
.sv .sv-rail { transform: translateX(calc(var(--sv-pin, 0) * (100vw - 100%))); }
.sv .sv-reading > * { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .sv-on .sv .sv-rise, .sv-on .sv .sv-fade, .sv-on .sv .sv-slide-l,
  .sv-on .sv .sv-slide-r, .sv-on .sv.sv-auto > :not(.sv-skip),
  .sv .sv-drift, .sv .sv-curtain-l, .sv .sv-curtain-r, .sv .sv-rail {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
`

/** Apply the patches this browser needs. Returns true if anything was patched. */
export function compat(): boolean {
  if (typeof window === 'undefined') return false
  let patched = false
  const w = window as any

  if (!('ResizeObserver' in w)) {
    // viewport-resize-backed stand-in: enough for the driver's re-measures
    class ResizeObserverStub {
      private cb: (entries: Array<{ target: Element }>) => void
      private els = new Set<Element>()
      private fire: () => void
      constructor(cb: (entries: Array<{ target: Element }>) => void) {
        this.cb = cb
        this.fire = () => {
          const entries: Array<{ target: Element }> = []
          this.els.forEach((el) => entries.push({ target: el }))
          this.cb(entries)
        }
        window.addEventListener('resize', this.fire)
        window.addEventListener('orientationchange', this.fire)
      }
      observe(el: Element) {
        this.els.add(el)
        this.cb([{ target: el }]) // like the real one: an initial observation
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
    w.ResizeObserver = ResizeObserverStub
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
