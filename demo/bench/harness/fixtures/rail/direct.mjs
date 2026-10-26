import { track, onMotionChange, prefersReducedMotion } from 'scrollvars'

// Experimental gallery control: this fixture uses the preset's default start,
// a single rail, and authored height. Not a replacement for the pin helper.
const outer = document.querySelector('.fxouter')
const stage = outer.querySelector('.sv-stage'), rail = stage.querySelector('.sv-rail')
let width = 0, overflow = 0, progress = 0, last, stopped = false, observer, unsubscribe
const paint = () => {
  if (stopped) return
  if (prefersReducedMotion() || outer.hasAttribute('data-sv-off') || outer.hasAttribute('data-sv-flow')) {
    rail.style.removeProperty('translate'); last = undefined; return
  }
  const p = Number(progress.toFixed(4))
  const value = `${(1 - p) * width + p * Math.min(overflow, 0)}px 0px`
  if (last !== value) { rail.style.translate = value; last = value }
}
if (DIRECT_RAIL) {
  const measure = () => {
    width = stage.clientWidth
    overflow = width - rail.getBoundingClientRect().width
    paint()
  }
  observer = new ResizeObserver(measure)
  observer.observe(stage); observer.observe(rail)
  unsubscribe = onMotionChange(measure)
  measure()
}
const release = track(outer, {
  view: false,
  pin: !DIRECT_RAIL,
  onPin: DIRECT_RAIL ? p => { progress = p; paint() } : undefined,
  onStatus: DIRECT_RAIL ? status => { if (status === 'failed' || status === 'released') { rail.style.removeProperty('translate'); last = undefined } } : undefined,
})
window.railDestroy = () => {
  if (stopped) return
  stopped = true
  try { release() } finally {
    observer?.disconnect(); unsubscribe?.(); rail.style.removeProperty('translate')
  }
}
