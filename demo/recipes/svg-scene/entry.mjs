import { mountSvgScene } from './scene.mjs'
let destroy = mountSvgScene(document.querySelector('.scene'))
window.addEventListener('pagehide', () => destroy())
window.addEventListener('pageshow', event => {
  if (event.persisted) destroy = mountSvgScene(document.querySelector('.scene'))
})
