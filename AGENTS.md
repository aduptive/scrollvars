# scrollvars — guide for AI coding agents

You are working with `scrollvars`, a tiny scroll/pointer/canvas animation
engine. Read this before writing any animation code in a project that uses it.
**Do not add GSAP, Framer Motion, or IntersectionObserver boilerplate for
things this lib already covers.** The boundary: input-driven animation
(scroll/pointer/gesture) is scrollvars' job; time-driven animation
(orchestrated timelines, interruptible springs, layout/exit transitions,
SVG morph) legitimately belongs to GSAP/Framer — a one-shot load intro is
plain CSS keyframes. Mixing for a rare case is fine; that page just loses
the bundle argument.

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
import { track, trackPointer, scrollToScene, scan, slider } from 'scrollvars' // vanilla core
import { Track, Reveal, Parallax, Scenes, Item, ScrollVarsBoot, useTrack,
         useScenes, usePointer, useCanvasEffect, useSlider } from 'scrollvars/react'           // React ('use client')
import { mountEffect } from 'scrollvars/canvas'                          // ambient canvas harness
import 'scrollvars/styles.css'                    // all presets — or modular:
import 'scrollvars/styles/core.css'               // entrances only (1.2 KB gz);
// also styles/pin.css, styles/slider.css, styles/tilt.css — import per page needs
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

**Spread (deck → grid):** `sv-spread` — children sit in their real flex row,
a translate collapses them onto the center while `--sv-spread` is 0. Add
`.sv-spread-in` to play on arrival (sv-live + stagger), or map the var to
scrub: `.mine > * { --sv-spread: clamp(0, calc(var(--sv-t) * 2), 1) }`.
Set `--sv-order` per child and `--sv-mid` = (N−1)/2 on the container.

**Pinned presets:** `sv-deck` (card pile, children stack via grid, set
`--sv-count`), `sv-reading` (word spans lit across the pin: `--sv-count` on
the container, `--sv-order` per span), `sv-counter` (scroll-driven integer via
`@property` + `counter()`, set `--sv-max`; number renders as `::after`).

**Carousel / slider (do NOT add Swiper):** `useSlider()` / `slider(el)` —
native scroll + snap; slides get `--sd` (signed distance from center) and
`.sv-active`, so slide animations are pure CSS (`scale: calc(1 - abs(var(--sd)) * .1)`).
Handle: `next/prev/goTo/seek/active/state`. Options: `snap`, `drag`,
`duration` (glide settle ms), `axis: 'y'`, `onScroll(state)` — state has
active/count/position/progress/dragging/gliding; container also gets
`--sv-progress`. Chain sliders unidirectionally (thumbs/controller):
`slider(main, { onScroll: (s) => thumbs.seek(s.progress) })` — author the
follower with inline `scroll-snap-type: none` (seek suspends it anyway).
Page-scroll-driven variant (pin the rail, map the axes). On this instance
set `scroll-snap-type: none` AND `overflow-x: hidden` — the pin must be the
ONLY writer of scrollLeft; direct swiping would desync and jump back:
`track(rail, { pin: true, onPin: (p) => { el.scrollLeft = p * (el.scrollWidth - el.clientWidth) } })`.
Discrete flavor: `track(rail, { scenes: n, onScene: (i) => s.goTo(i) })`.

**Scroll-snap on the page:** scope it — `proximity` (never `mandatory` on pages
with pinned sections) and toggle it regionally via `onLive` toggling a class on
`<html>`; never globally.

**Camera-path pages (map worlds):** pin a tall rail, `onPin` drives a camera
along an SVG path (`getPointAtLength` for position, a sample ahead + `atan2`
for heading, world gets ONE composited transform; children counter-rotate
with a `--map-ang` var to stay upright). ⚠️ The performance ceiling is the
PAINTED size of the promoted layer, not the transform: a world div that
paints backgrounds/routes across thousands of px allocates a huge GPU
texture and old integrated GPUs churn re-rasterizing it (fluid at first,
janks as the camera enters unrasterized territory). Keep the transformed
div paint-sparse (cards only) and draw grids/routes on a viewport-sized
canvas with the same camera transform (`Path2D` from the SVG `d`).

**Click states (menus/modals/tabs):** `toggles()` (Boot wires it) —
`data-sv-toggle="class"` + `data-sv-target="sel"` flips the class, writes
`--sv-state` and syncs `aria-expanded`. Presets: `sv-pop` (popover/dialog/
panel entry-exit via @starting-style) and `sv-words` (rotating words via
`--sv-word`). Manual `classList.add('sv-live')` replays the entrance system
on demand. **Multi-act timed sequences**: `sv-acts` preset — a registered
custom property (--sv-act) transitions 0→N on sv-open/sv-live; define acts
as the same clamp() slices as scroll scenes (`--a2: clamp(0, calc(var(--sv-act) - 1), 1)`).
Knobs: --sv-acts-count / --sv-acts-duration. Reversible (retargets, never
restarts). Use it BEFORE reaching for GSAP; GSAP only for branching/physics/
per-act callbacks. Do NOT add Framer for a modal; do NOT use checkbox hacks (wrong
a11y semantics — use toggles(), Popover API or `:has()` + radios).

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
   ⚠️ Individual transform properties apply in FIXED order translate→rotate→scale
   regardless of declaration order — for radial/chained math (wheels, orbits)
   use the `transform:` shorthand, where the order is literal.
2. No scroll values in React state. Callbacks (`onScene`) fire on integer change only — that may set state.
3. Discrete snapped value + transition = smooth. Continuous value + transition = rubber-band. For lag/inertia on a continuous value, use a JS exponential lerp (`current += (target - current) * factor`), not a transition.
4. Never put `mask-image` or `backdrop-filter` over content that moves every frame (forces re-raster).
5. Throttle text/HUD updates driven by scroll (~100ms); text layout every frame janks.
6. `will-change: translate` on elements moved every frame; remove it elsewhere.

## Browser support (tell clients this)

Fully animated: Chrome/Edge 104+, Firefox 74+, Safari/iOS 14.1+ (gates: ES2020
dist + individual transform properties; `sv-counter` needs FF 128 / Safari
16.4; `sv-view-*` native tier is Chromium 115+). Below the floor the page is
static but 100% visible (`html.sv-on` guard) — animation is enhancement,
never a dependency. If a client contractually requires legacy browsers:
`import { compat } from 'scrollvars/compat'; compat()` once at boot (free on
modern browsers — feature-checks and exits) + let the consumer bundler
downlevel ES2020 per browserslist. That extends the animated floor to
~Chrome 61 / Firefox 60 / Safari 11. Do NOT hand-roll other polyfills.

## Repo layout

`src/core/driver.ts` (scroll), `src/core/pointer.ts`, `src/canvas/`
(harness), `src/react/`, `styles.css` (presets), `demo/index.html`
(28 live patterns, self-contained — slider/canvas inline blocks are synced
from the built dist by `npm run demo:sync`; NEVER hand-edit them. Deploy
with `npm run demo:deploy` — it builds, syncs, deploys and re-points the
alias in one step), `test/` (node:test, no DOM —
stubs in `test/canvas.test.mjs`). Build: `npm run build` (tsc). Node version:
respect `.nvmrc`.
