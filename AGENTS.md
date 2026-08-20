# scrollvars — guide for AI coding agents

You are working with `scrollvars`, a tiny scroll/pointer/canvas animation
engine. Read this before writing any animation code in a project that uses it.
**Do not add GSAP, Framer Motion, or IntersectionObserver boilerplate for
things this lib already covers.**

## Mental model (the one rule)

One global driver reads the scroll position in a single rAF (batched reads,
then batched writes) and outputs **CSS custom properties** on tracked
elements. All motion is then plain CSS reading those variables. JavaScript
never animates; React never re-renders on scroll. If you find yourself putting
scroll values into React state, you are doing it wrong.

## The variables (the entire API surface)

| var | range | meaning |
|---|---|---|
| `--sv-view` | −1 → 0 → 1 | entering from below → centered → leaving above |
| `--sv-t` | 0 → 1 | travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | progress across a pinned (sticky) stretch — curtains, rails, scrubbing |
| `--sv-scene` | 0 → n−1 | scene index of a pinned section, eased and snapped |
| `--mx` / `--my` | −1 → 1 | pointer offset from the element's center (pointer module) |
| `.sv-live` | class | on while inside the activation band (enter 75%, exit 25% of viewport) |

Guard: the driver sets `sv-on` on `<html>`. Entrance CSS must hide content
only under `.sv-on` — without JS everything stays visible (never fail hidden).
The shipped `styles.css` already does this; follow the same pattern for
custom presets.

## Imports

```ts
import { track, trackPointer, scrollToScene, scan } from 'scrollvars'    // vanilla core
import { Track, Reveal, Parallax, Scenes, Item, ScrollVarsBoot, useTrack,
         useScenes, usePointer, useCanvasEffect } from 'scrollvars/react'           // React ('use client')
import { mountEffect } from 'scrollvars/canvas'                          // ambient canvas harness
import 'scrollvars/styles.css'                                           // presets
```

## Recipes

**Entrance reveal (most common):** wrap the section, mark children.
```tsx
<Reveal auto>            {/* every direct child rises with a stagger */}
  <h2>Title</h2><p>Body</p>
</Reveal>
// or per-child control, all knobs as attributes (they compile to the vars):
<Reveal stagger={140}>
  <Item order={0}>first</Item>
  <Item order={1} effect="slide-l" distance="4rem">second</Item>
</Reveal>
// VarProps (order, distance, stagger, duration, ease) work on Track/Reveal/
// Parallax/Item — prefer them over style={{'--sv-…'}} in React code.
```

**Parallax drift:** `<Parallax distance="8rem">…</Parallax>` — continuous,
tied to `--sv-t`, no transition (transitions on continuous values rubber-band).

**Pinned scenes (storytelling / horizontal rail / curtain):**
```tsx
<Scenes count={4}>{({ scene, goTo }) => <Slide index={scene} />}</Scenes>
```
The container is N viewports tall, content is `position: sticky`. For pure-CSS
pinned effects use the presets: `sv-curtain-l/r` (two halves open),
`sv-rail` (horizontal carousel — enters from offscreen right and still moves
when the track fits the viewport:
`translate: calc((1 - var(--sv-pin)) * 100vw + var(--sv-pin) * min(100vw - 100%, 0px)) 0`).

**Zero-wrapper mode (prefer this in Next.js):** one `<ScrollVarsBoot />` in the
root layout, then plain RSC sections with `data-sv` attributes (`data-sv-once`,
`data-sv-pin`, `data-sv-travel`, `data-sv-scenes="4"`) — no client components
in pages at all. Route-change nodes are auto-tracked via MutationObserver.

**Pinned presets:** `sv-deck` (card pile, children stack via grid, set
`--sv-count`), `sv-reading` (word spans lit across the pin: `--sv-count` on
the container, `--sv-order` per span), `sv-counter` (scroll-driven integer via
`@property` + `counter()`, set `--sv-max`; number renders as `::after`).

**Pointer tilt:** `usePointer()` on a container ref + `className="sv-tilt"` on
cards. One delegated listener; CSS does tilt + glare from `--mx`/`--my`.

**Scroll-scrubbed media / WebGL:** `onTravel` (viewport travel) and `onPin`
(progress across a pinned stretch) fire every frame with raw 0..1:
```tsx
useTrack({ onTravel: (t) => { /* drive a camera, a canvas, a timeline */ } })
useTrack({ onPin: (p) => { /* scrub frames across a pinned section */ } })
```
⚠️ Do **not** scrub `video.currentTime` on scroll — Safari's decoder wedges
permanently. Use a frame sequence (ffmpeg `-vf fps=6` → images → canvas
`drawImage`). This is a hard-won lesson; do not regress it.

**Ambient canvas (particles, generative heroes):** time-driven, not
scroll-driven — use the harness, keep the simulation in userland:
```tsx
const ref = useCanvasEffect({
  setup: (fx) => { /* build state once, sizes known */ },
  frame: (fx, dt) => { /* one step; dt seconds (clamped 50ms), ctx pre-scaled to CSS px */ },
})
```
The harness owns resize, DPR cap (2), auto-pause offscreen/hidden tab,
`fx.reducedMotion` (live), cleanup. Cross scroll into the sim via closure:
`track(section, { onTravel: (t) => { amplitude = t } })`. Never give an
ambient canvas its own unmanaged `requestAnimationFrame` loop.

## SSR / Next.js

All content renders on the server — the components are thin `'use client'`
wrappers whose children stay RSC. Entrance states are applied by CSS only
after `sv-on` lands, so there is no hydration flash and no JS-dependent
content. Zero-JS tier: `sv-view-*` classes use native CSS scroll-driven
animations where supported.

## Performance rules (violating these is the whole reason this lib exists)

1. Animate only `transform`/`translate`/`opacity` (compositor-only). Never top/left/width/margin.
2. No scroll values in React state. Callbacks (`onScene`) fire on integer change only — that may set state.
3. Discrete snapped value + transition = smooth. Continuous value + transition = rubber-band. For lag/inertia on a continuous value, use a JS exponential lerp (`current += (target - current) * factor`), not a transition.
4. Never put `mask-image` or `backdrop-filter` over content that moves every frame (forces re-raster).
5. Throttle text/HUD updates driven by scroll (~100ms); text layout every frame janks.
6. `will-change: translate` on elements moved every frame; remove it elsewhere.

## Repo layout

`src/core/driver.ts` (scroll), `src/core/pointer.ts`, `src/canvas/`
(harness), `src/react/`, `styles.css` (presets), `demo/index.html`
(21 live patterns, self-contained — its driver copy is the **built dist**,
inlined verbatim; never hand-edit that copy), `test/` (node:test, no DOM —
stubs in `test/canvas.test.mjs`). Build: `npm run build` (tsc). Node version:
respect `.nvmrc`.
