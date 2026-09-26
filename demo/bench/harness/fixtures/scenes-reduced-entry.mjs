// Bundled with esbuild (dist/react + react + react-dom) for the reduced-motion
// Scenes invariant in e2e-invariants.mjs (ADU-354 blocker 1): a real React
// mount of the exact `<Scenes>` render-prop shape the guide documents, so the
// invariant proves the compiled component, not a description of it.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Scenes } from '../../../../dist/react/index.js'

window.mountScenesFixture = (el, count) => {
  const root = createRoot(el)
  root.render(
    React.createElement(Scenes, { count }, ({ scene }) =>
      React.createElement('p', { className: 'scene-text' }, 'Slide ' + (scene + 1))
    )
  )
  return root
}
