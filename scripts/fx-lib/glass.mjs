// The preview and copyable examples paint the same scene at its measured size.
const source = `({ width, height, dpr }) => {
  const texture = document.createElement('canvas')
  texture.width = Math.max(1, Math.round(width * dpr))
  texture.height = Math.max(1, Math.round(height * dpr))
  const ctx = texture.getContext('2d')
  if (!ctx) throw new Error('Glass scene requires Canvas 2D')
  ctx.scale(dpr, dpr)
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#e9efff')
  gradient.addColorStop(1, '#87a3ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ed502d'
  ctx.beginPath()
  ctx.arc(width * .73, height * .5, width * .16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#162049'
  ctx.font = 'bold ' + width * .12 + 'px Arial'
  ctx.textBaseline = 'middle'
  ctx.fillText('Refraction', width * .06, height * .5)
  return texture
}`

const css = `.glass-study {
  aspect-ratio: 2 / 1; overflow: hidden; container-type: inline-size;
  background: linear-gradient(to right, #e9efff, #87a3ff); color: #162049;
}
.glass-study::before {
  content: ''; position: absolute; width: 32%; aspect-ratio: 1;
  top: 50%; left: 73%; transform: translate(-50%, -50%);
  border-radius: 50%; background: #ed502d;
}
.glass-study h2 {
  position: absolute; top: 50%; left: 6%; transform: translateY(-50%);
  margin: 0; font: bold 12cqi/1 Arial, sans-serif; color: inherit;
}`

const scene = `<div class="sv-glass glass-study">
  <h2>Refraction</h2>
  <canvas class="sv-glass-canvas" aria-hidden="true" hidden></canvas>
</div>`
const setup = `const source = ${source}
const glass = mountGlass(document.querySelector('.glass-study canvas'), {
  source, blur: 6, edgeGlow: 85, lightMode: 'static'
})
// On teardown: glass.destroy()`

export const glassComponent = {
  file: 'GlassStudy.tsx',
  content: `'use client'
import * as React from 'react'
import { Glass } from 'scrollvars/react/glass'
import type { GlassMaterial, GlassOptions } from 'scrollvars/glass'
// Import 'scrollvars/styles/glass.css' in your site's stylesheet entry.

const source: GlassOptions['source'] = ${source}

const css = \`${css}\`

export function GlassStudy({ nonce, ...material }: GlassMaterial & { nonce?: string }) {
  return <Glass className="glass-study" source={source} blur={6} edgeGlow={85} {...material}>
    <style nonce={nonce} dangerouslySetInnerHTML={{ __html: css }} />
    <h2>Refraction</h2>
  </Glass>
}
`,
}

export const glassEffect = {
  slug: 'glass',
  title: 'Glass',
  category: 'WebGL',
  requires: { styles: ['glass'], min: '1.20.0' },
  tagline: 'Refract a graphic through a moving glass edge, with adjustable Gaussian blur and a localized highlight.',
  when: 'A hero or product graphic with a known scene texture. The heading stays readable when WebGL is unavailable.',
  knobs: 'Blur sets the Gaussian radius in CSS pixels. Position slides the glass. Light can stay fixed, follow the mouse or float on a slow orbit.',
  preview: `<link rel="stylesheet" href="glass.css">
<style>${css}
.glass-controls { display:flex; flex-wrap:wrap; gap:1.5rem; align-items:center; margin:1rem 0; padding:1rem; border:1px solid var(--line); }
.glass-controls label { display:grid; gap:.4em; }
</style>
${scene}
<fieldset class="glass-controls" disabled>
  <legend>Glass controls</legend>
  <label>Gaussian blur <output id="glass-radius">6 px</output><input name="blur" type="range" min="0" max="24" value="6"></label>
  <label>Glass position<input name="position" type="range" min="0" max="100" value="42"></label>
  <label>Light<select name="lightMode"><option value="static">Fixed</option><option value="pointer">Mouse</option><option value="float">Floating</option></select></label>
</fieldset>
<p role="status" id="glass-status"></p>
<script src="sv-glass.js"></script>
<script>(() => {
  const controls = document.querySelector('.glass-controls')
  const radius = document.getElementById('glass-radius')
  const source = ${source}
  controls.disabled = false
  const glass = SVGlass.mountGlass(document.querySelector('.glass-study canvas'), {
    source, blur: 6, edgeGlow: 85,
    onError() {
      controls.disabled = true
      document.getElementById('glass-status').textContent = 'Glass is unavailable. Showing the original scene.'
    }
  })
  controls.addEventListener('input', () => {
    const { blur, position, lightMode } = controls.elements
    radius.value = blur.value + ' px'
    glass.update({ blur: blur.valueAsNumber, position: position.valueAsNumber, lightMode: lightMode.value })
  })
})()</script>`,
  css: `${scene}
<style>${css}</style>
<script type="module">
import 'scrollvars/styles/glass.css'
import { mountGlass } from 'scrollvars/glass'
${setup}
</script>`,
  tailwind: `// From your frontend package root: npx scrollvars add glass
import 'scrollvars/styles/glass.css'
import { GlassStudy } from './components/fx/GlassStudy'

export function Hero() {
  return <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl">
    <GlassStudy blur={6} lightMode="pointer" />
  </div>
}`,
  react: glassComponent.content,
}
