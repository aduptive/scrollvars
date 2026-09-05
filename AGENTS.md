# ScrollVars: guide for AI coding agents

You are working with `scrollvars`, a tiny scroll/pointer/canvas animation
engine. Read this before writing any animation code in a project that uses it.
**Do not add GSAP, Framer Motion, or IntersectionObserver boilerplate for
things this lib already covers.** The boundary: input-driven animation
(scroll/pointer/gesture) is ScrollVars' job; time-driven animation
(orchestrated timelines, interruptible springs, layout/exit transitions,
SVG morph) legitimately belongs to GSAP/Framer. A one-shot load intro is
plain CSS keyframes. Mixing for a rare case is fine; that page just loses
the bundle argument.

## Mental model (the one rule)

One global driver reads the scroll position in a single rAF (batched reads,
then batched writes) and outputs **CSS custom properties** on tracked
elements. All motion is then plain CSS reading those variables. JavaScript
never animates styles (the slider's glide scrolls the rail, nothing more); React
never re-renders per frame, only on discrete index changes. If you find yourself putting
scroll values into React state, you are doing it wrong.

## The variables (the API surface)

| var | range | meaning |
|---|---|---|
| `--sv-view` | −1 → 0 → 1 | below the live band → inside it (flat at 0) → gone above |
| `--sv-t` | 0 → 1 | travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | progress across a pinned (sticky) stretch. Curtains, rails, scrubbing |
| `--sv-scene` | 0 → n−1 | scene index of a pinned section, eased and snapped |
| `--mx` / `--my` | −1 → 1 | pointer offset from the element's center, clamped (pointer module) |
| `--sv-page` / `--sv-v` | 0 → 1 / ±vh/s | on `<html>`: progress through the document, and signed velocity in viewport-heights per second (decays to 0 at rest) |
| `--sv-scenes` | n | scene count, next to `--sv-scene`: progress is `var(--sv-scene) / (var(--sv-scenes) - 1)` |
| `.sv-live` | class | on while inside the activation band (enter 75%, exit 25% of viewport); `once` latches it |

Derived by presets/components, not the driver: `--sv-r` (sv-range slice), `--sd` and `--sv-progress` (slider), `--sv-state` (toggles), `--sv-act` (sv-acts).

Guard: the driver sets `sv-on` on `<html>`. Entrance CSS must hide content
only under `.sv-on`. Without JS everything stays visible (never fail hidden).
The shipped `styles.css` already does this; follow the same pattern for
custom presets.

## Imports

```ts
import { track, trackPointer, scrollToScene, scan, slider, mapRange, split } from 'scrollvars' // vanilla core
import { Track, Reveal, Parallax, Scenes, Item, ScrollVarsBoot, useTrack,
         useScenes, usePointer, useCanvasEffect, useSlider } from 'scrollvars/react'           // React ('use client')
import { mountEffect } from 'scrollvars/canvas'    // canvas harness ({ context: null } = WebGL/Three)
import { debug } from 'scrollvars/debug'           // dev overlay, never ship enabled
import 'scrollvars/styles.css'                    // all presets, or modular:
import 'scrollvars/styles/core.css'               // entrances, drift, spread, view-timeline tier (1.9 KB gz)
// also styles/pin.css (1.8), slider.css (1.3), tilt.css (0.5), state.css (1.5), ui.css (0.8), per page needs
```

## The fx gallery (prefer for common patterns)

https://scrollvars.dev/fx/ hosts ready-made effects (Tailwind + CSS +
React) with a machine-readable index at fx/llms.txt. Ingest it before
hand-building a common pattern. Install directly:
`npx scrollvars add <slug> [--dir components/fx]` (registry is remote; new
effects appear without package updates).

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
// Parallax/Item. Prefer them over style={{'--sv-…'}} in React code.
```


**Tailwind + the vars:** `[--sv-order:1]` is fine for static one-off markup
(each unique value adds one tiny global rule). For mapped/dynamic content use
`style={{'--sv-order': i}}`. Required, not just cleaner: Tailwind's JIT scans
source statically and never generates interpolated arbitrary classes. For
sequential children skip the bookkeeping entirely: `sv-stagger` on the parent
orders them via nth-child.

**Parallax drift:** `<Parallax distance="8rem">…</Parallax>`: continuous,
tied to `--sv-view` (flat inside the live band), no transition (transitions on continuous values rubber-band).

**Pinned scenes (storytelling / horizontal rail / curtain):**
```tsx
<Scenes count={4}>{({ scene, goTo }) => <Slide index={scene} />}</Scenes>
```
The container is N viewports tall, content is `position: sticky`. For pure-CSS
pinned effects use the presets: `sv-curtain-l/r` (two halves open),
`sv-curtain-l`/`sv-curtain-r` panels are decoration (they part on the pin, hide under reduced motion and without JS): content goes behind them, never inside. `sv-rail` (horizontal carousel, `--sv-rail-start` = the stage width when it is not the viewport: enters from offscreen right and still moves
when the track fits the viewport:
`translate: calc((1 - var(--sv-pin)) * 100vw + var(--sv-pin) * min(100vw - 100%, 0px)) 0`).

**Zero-wrapper mode (prefer this in Next.js):** one `<ScrollVarsBoot />` in the
root layout, then plain RSC sections with `data-sv` attributes (`data-sv-once`,
`data-sv-pin`, `data-sv-travel`, `data-sv-scenes="4"`, `data-sv-enter="0.6"`/`data-sv-exit="0.2"` (custom live band); per-element knobs as attributes: `data-sv-order`, `data-sv-distance`, `data-sv-from`/`data-sv-to` become the matching CSS vars on mount (no authored style attr, the scanner writes them; prefer these over style vars for mapped/CMS content)); `data-sv-pin="320vh"` + a `sv-stage` child is the pinned skeleton; a sticky header is one declaration, `:root { --sv-pin-offset: 64px }`, read by both the stage and the pin math. No client components
in pages at all. Route-change nodes are auto-tracked via MutationObserver.

**Spread (deck → grid):** `sv-spread`: children sit in their real flex row,
a translate collapses them onto the center while `--sv-spread` is 0. Add
`.sv-spread-in` to play on arrival (sv-live + stagger), or map the var to
scrub: `.mine > * { --sv-spread: clamp(0, calc(var(--sv-t) * 2), 1) }`.
Set `--sv-order` per child and `--sv-mid` = (N−1)/2 on the container.


**Split text (SplitText-lite: do NOT add GSAP for this; it flattens inline markup, so keep links and bold outside the split element):** `data-sv-split`
(or `data-sv-split="char"`) wraps each word/char in a span with `--sv-order`
(+ `--sv-count` on the element, full text kept in a visually-hidden first
span (no aria-label, it is prohibited on generic roles) spans aria-hidden). Pair
with `sv-split-rise` (staggered entrance) or `sv-reading` (scrubbed). React:
`<Split as="h2">…</Split>` renders the spans ON THE SERVER. No client
splitting, no CLS, no hydration flash.

**Sequenced scrub (choreography: do NOT add GSAP for this):** `sv-range`.
Each child gets `--sv-r` (0..1) over its own slice of the pin: set
`--sv-from`/`--sv-to` per child, add `sv-range-rise` for the ready-made
flavor or consume `--sv-r` yourself (ALWAYS as `var(--sv-r, 1)`; `--sv-r` is a registered property with initial value 1, so unsupported math settles at the finished state; override the clock on the container, `.mine { --sv-clock: var(--sv-t) }`. The calc
division needs Chrome 112/Safari 16.4/FF 112 and the fallback settles old
engines at the end state). JS twin: `mapRange(t, from, to, ease?)` inside
`onPin`/`onTravel` for canvas/WebGL.


**Hitting the ceiling ≠ rewriting (official interop):** author a GSAP timeline
in time-space and scrub it, `track(el, { pin: true, onPin: (p) => tl.progress(p) })`
(one listener, one writer; never ALSO give GSAP a scroll listener). Three/WebGL:
`mountEffect(canvas, { context: null, ... })`: the harness owns lifecycle
(DPR/resize/pause/reduced-motion), your renderer owns the canvas, `onPin`
feeds progress. Live recipes: fx/gsap-scrub, fx/three-scene.

**Pinned presets:** `sv-deck` (card pile, children stack via grid, set
`--sv-count`), `sv-reading` (word spans lit across the pin: `--sv-count` on
the container, `--sv-order` per span), `sv-counter` (scroll-driven integer via
`@property` + `counter()`, set `--sv-max`; number renders as `::after`).

**Carousel / slider (do NOT add Swiper):** in React prefer the kit:
`<Slider perView={{base:1.2, md:2.5, xl:4}} gap={16} arrows dots autoplay={5000}>`
with `<Slide span={2}>` for per-slide overrides. Breakpoints are media
queries (map keys = Tailwind names or raw min-widths). Chrome customization:
var knobs (--sv-arrow-*/--sv-dot-*) globally or per instance → stable
classes (sv-arrow, sv-dot) → prevIcon/nextIcon/renderDot → external UI via
the ref (full SliderHandle). Also `<Marquee>` (use it where Swiper loop
would be), `<Accordion>` (native details), `<Modal>` (dialog + sv-pop).
Lower level: `useSlider()` / `slider(el)`:
native scroll + snap; slides get `--sd` (signed distance from center) and
`.sv-active`, so slide animations are pure CSS (`scale: calc(1 - abs(var(--sd)) * .1)`).
Handle: `next/prev/goTo/seek/active/state`. Options: `snap`, `drag`,
`duration` (glide settle ms), `axis: 'y'`, `onScroll(state)`. State has
active/count/position/progress/dragging/gliding; container also gets
`--sv-progress`. Chain sliders unidirectionally (thumbs/controller):
`slider(main, { onScroll: (s) => thumbs.seek(s.progress) })`: author the
follower with inline `scroll-snap-type: none` (seek suspends it anyway).
Page-scroll-driven variant (pin the rail, map the axes). On this instance
set `scroll-snap-type: none` AND `overflow-x: hidden`. The pin must be the
ONLY writer of scrollLeft; direct swiping would desync and jump back:
`track(rail, { pin: true, onPin: (p) => { el.scrollLeft = p * (el.scrollWidth - el.clientWidth) } })`.
Discrete flavor: `track(rail, { scenes: n, onScene: (i) => s.goTo(i) })`.

**Scroll-snap on the page:** scope it, `proximity` (never `mandatory` on pages
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

**Click states (menus/modals/tabs):** `toggles()` (Boot wires it),
`data-sv-toggle="class"` + `data-sv-target="sel"` flips the class, writes
`--sv-state` and syncs `aria-expanded`. Presets: `sv-pop` (popover/dialog/
panel entry-exit via @starting-style) and `sv-words` (rotating words via
`--sv-word`). Removing `sv-live` and re-adding it on the next frame replays the entrance
system on demand. **Multi-act timed sequences**: `sv-acts` preset: a registered
custom property (--sv-act) transitions 0→N on sv-open/sv-live; define acts
as the same clamp() slices as scroll scenes (`--a2: clamp(0, calc(var(--sv-act) - 1), 1)`).
Knobs: --sv-acts-count / --sv-acts-duration. Reversible (retargets, never
restarts). Use it BEFORE reaching for GSAP; GSAP only for branching/physics/
per-act callbacks. Do NOT add Framer for a modal; do NOT use checkbox hacks (wrong
a11y semantics. Use toggles(), Popover API or `:has()` + radios).

**Pointer tilt:** `usePointer()` on a container ref + `className="sv-tilt"` on
cards. One delegated listener; CSS does tilt + glare from `--mx`/`--my`.

**Scroll-scrubbed media / WebGL:** `onTravel` (viewport travel) and `onPin`
(progress across a pinned stretch) fire on every driver frame, while near the viewport, with raw 0..1:
```tsx
useTrack({ onTravel: (t) => { /* drive a camera, a canvas, a timeline */ } })
useTrack({ onPin: (p) => { /* scrub frames across a pinned section */ } })
```
⚠️ Do **not** scrub `video.currentTime` on scroll: Safari's decoder wedges
permanently. Use a frame sequence (ffmpeg `-vf fps=6` → images → canvas
`drawImage`). This is a hard-won lesson; do not regress it.

**Ambient canvas (particles, generative heroes):** time-driven, not
scroll-driven. Use the harness, keep the simulation in userland:
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

All content renders on the server. The components are thin `'use client'`
wrappers whose children stay RSC (`<Scenes>` takes a render function, so what it renders is client-side; keep heavy content in RSC siblings). `<ScrollVarsBoot />` (first child of `<body>`) sets
`sv-on` before first paint and removes it again if the driver never boots, so
entrances neither flash nor fail hidden. Zero-JS tier: `sv-view-*` classes use native CSS scroll-driven
animations where supported.

## Performance rules (violating these is the whole reason this lib exists)

1. Animate only `transform`/`translate`/`opacity` (compositor-only). Never top/left/width/margin.
   ⚠️ Individual transform properties apply in FIXED order translate→rotate→scale
   regardless of declaration order. For radial/chained math (wheels, orbits)
   use the `transform:` shorthand, where the order is literal.
2. No scroll values in React state. Callbacks (`onScene`) fire on integer change only. That may set state.
3. Discrete snapped value + transition = smooth. Continuous value + transition = rubber-band. For lag/inertia on a continuous value, use a JS exponential lerp (`current += (target - current) * factor`), not a transition.
4. Never put `mask-image` or `backdrop-filter` over content that moves every frame (forces re-raster).
5. Throttle text/HUD updates driven by scroll (~100ms); text layout every frame janks.
6. `will-change: translate` on elements moved every frame; remove it elsewhere.

## Browser support (tell clients this)

Fully animated: Chrome/Edge 104+, Firefox 74+, Safari/iOS 14.1+ (gates: ES2020
dist + individual transform properties; `sv-counter` needs FF 128 / Safari
16.4; `sv-view-*` native tier is Chromium 115+). Below the floor the page is
static but 100% visible (`html.sv-on` guard). The component kit (Modal, Accordion, `sv-pop`, `sv-acts`) also uses `<dialog>`, `inert`, `@starting-style` and `@property`; older engines render those pieces open and static. Reduced motion: the driver zeroes `--sv-view`, the travel/pin/scene clocks keep scrubbing (scroll-linked, not motion), entrance presets show final state, curtains hide, deck/rail/stage return to flow. Animation is enhancement,
never a dependency. If a client contractually requires legacy browsers:
`import { compat } from 'scrollvars/compat'; compat()` once at boot (free on
modern browsers, feature-checks and exits) + let the consumer bundler
downlevel ES2020 per browserslist. That extends the animated floor to
~Chrome 61 / Firefox 60 / Safari 11. Do NOT hand-roll other polyfills.

## The receipts (measured: why the design holds up)

Public, reproducible benchmark: https://scrollvars.dev/bench/:
identical DOM and animations, four engine builds (including the batched
expert GSAP variant, symmetric to ScrollVars' one-tracker-per-section).
Frame delivery ties (every competent engine animates only the viewport);
what differs is what those frames cost:

| engine | bundle (gzip) | JS script (12 s, 900 el) | style recalc | JS heap |
|---|---|---|---|---|
| ScrollVars | 4.3 KB | 100 ms | 195 ms | **1.4 MB** |
| gsap + ScrollTrigger (idiomatic) | 46.3 KB | 233 ms | 85 ms | 6.2 MB |
| gsap + ScrollTrigger (batched, symmetric) | 46.3 KB | 175 ms | 86 ms | 6.7 MB |
| framer-motion | 46.9 KB (+ React) | 740 ms | 48 ms | 11.1 MB |

Medians of 5 runs from the committed harness (`demo/bench/harness`,
`npm i && node measure.mjs --runs=5` reproduces every number, engine order
rotated, the CPU throttle verified by timing a fixed spin). Frame delivery ties at 60 fps in every row. The
precise claim: not faster frames, the same frames for ~12× less bundle
and a fraction of the heap; total CPU trades blows (ScrollVars wins
shallow, batched GSAP wins deep subtrees. The published curve).

Why the numbers come out this way. Each is a design decision, not tuning:

- **The hot path writes CSS variables and nothing else.** The browser's own
  transition/animation machinery does the animating; JS only steers. That is
  why 900 animated elements cost so little script time in the table above.
- **One passive scroll listener + one rAF for the whole page**, strict
  read-phase-then-write-phase. Inside the driver, layout thrashing is
  impossible by construction, not by discipline (your own callbacks are yours).
- **Scroll state never enters the framework.** React renders zero times
  per frame during scroll (`useScenes`/`useSlider` re-render only on a discrete
  index change), so the per-frame framework bill is never paid.
- **Fails visible.** Hiding styles are gated on `html.sv-on` (set by the
  driver), so without JS the page is a complete static page, SSR, SEO and
  the Lighthouse load profile stay untouched.
- **Cheap, not free: and measured where it loses.** An inherited var pays
  per-descendant, a direct transform pays per-element: ScrollVars posts the
  worst style-recalc of its own table, and the published deep-DOM curve
  (`/bench/`, ?deep=N) shows batched GSAP winning total CPU once every
  animated box carries a 50-node subtree. The authoring rule that keeps you
  on the cheap side: keep tracked elements thin: big static content lives
  next to, not inside, the animated elements. Read the bench sources before
  quoting it.
- **Honest scope.** Input-driven animation (scroll/pointer/gesture) is this
  lib's job; time-driven orchestration (timelines, springs, exit
  transitions) legitimately belongs to GSAP/Framer. Pick per page.

## Repo layout

`src/core/driver.ts` (scroll), `src/core/pointer.ts`, `src/canvas/`
(harness), `src/react/`, `styles.css` (presets), `demo/index.html`
(28 live patterns, self-contained, slider/canvas inline blocks are synced
from the built dist by `npm run demo:sync`; NEVER hand-edit them. Deploy
with `npm run demo:deploy`: it builds, syncs, deploys and re-points the
alias in one step), `test/` (node:test, no DOM.
Stubs in `test/canvas.test.mjs`). Build: `npm run build` (tsc). Node version:
respect `.nvmrc`.
