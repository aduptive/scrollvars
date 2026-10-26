import { track, onMotionChange, prefersReducedMotion } from 'scrollvars'
import { mountScene, paintScene } from './scene-lifecycle.mjs'

export function mountSvgScene(section) {
  return mountScene(section, {
    connect: draw => track(section, { view: false, onTravel: draw }),
    paint: paintScene(section),
    reduced: prefersReducedMotion,
    onMotion: onMotionChange,
  })
}
