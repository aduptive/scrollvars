import { mountScene, paintScene } from '../../../../recipes/svg-scene/scene-lifecycle.mjs'
import { mountSvgScene } from '../../../../recipes/svg-scene/scene.mjs'
import { track, onMotionChange, prefersReducedMotion } from 'scrollvars'

// Deliberately specialized benchmark control: window scroll, this one section,
// no scan, pin, nested roots, accessibility presets or public library contract.
function nativeTrack(section, draw) {
  let frame = 0, stopped = false
  const update = () => {
    frame = 0
    if (stopped) return
    const rect = section.getBoundingClientRect()
    draw(Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height))))
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(update) }
  const ro = new ResizeObserver(request)
  ro.observe(section)
  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', request)
  request()
  return () => { stopped = true; cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener('scroll', request); window.removeEventListener('resize', request) }
}
const media = matchMedia('(prefers-reduced-motion: reduce)')
const nativeReduced = () => media.matches || document.documentElement.getAttribute('data-sv-motion') === 'reduce'
function nativeMotion(fn) {
  const mo = new MutationObserver(fn)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sv-motion'] })
  media.addEventListener('change', fn)
  return () => { mo.disconnect(); media.removeEventListener('change', fn) }
}
const section = document.querySelector('.scene')
section.dataset.renderer = SCENE_MODE
const draw = SCENE_MODE === 'css' ? () => {} : paintScene(section)
const mount = () => SCENE_MODE === 'direct' ? mountSvgScene(section) : mountScene(section, {
  connect: SCENE_MODE === 'native' ? fn => nativeTrack(section, fn) : fn => track(section, { view: false, travel: SCENE_MODE === 'css', onTravel: fn }),
  paint: draw,
  reduced: SCENE_MODE === 'native' ? nativeReduced : prefersReducedMotion,
  onMotion: SCENE_MODE === 'native' ? nativeMotion : onMotionChange,
})
window.sceneDestroy = mount()
window.sceneMount = () => { window.sceneDestroy(); window.sceneDestroy = mount() }
