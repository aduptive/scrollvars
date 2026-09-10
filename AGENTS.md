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

<!-- vars:start -->
| output | range | meaning |
| --- | --- | --- |
| `--sv-view` | −1 → 0 → 1 | Below the live band → inside it (flat at 0) → gone above |
| `--sv-t` | 0 → 1 | Travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | Progress across a pinned (sticky) stretch: curtains, rails, scrubbing |
| `--sv-stage-width` | px | Measured inner width of a pinned .sv-stage; the rail uses it instead of the window width |
| `--sv-scene` | 0 → n−1 | Scene index of a pinned section, eased and snapped |
| `--sv-scenes` | n | Scene count, next to `--sv-scene`: progress is `var(--sv-scene) / (var(--sv-scenes) - 1)` |
| `--sv-page` / `--sv-v` | 0 → 1 / ±20 viewport-heights/s | On `<html>` once anything is tracked AND some CSS reads them (or `setPageOutputs(true)`): progress through the document, and signed velocity in viewport-heights per second, clamped to ±20, back to 0 within ~80 ms of the last scroll event |
| `--mx` / `--my` | −1 → 1 | Pointer offset from the element's center, clamped (pointer module) |
| `.sv-live` | class | On while inside the activation band (enter 75%, exit 25% of the viewport); `once` latches it |

Derived by presets and components, not the driver: `--sv-r` (sv-range slice), `--sd` and `--sv-progress` (slider), `--sv-state` (toggles), `--sv-act` (sv-acts).
<!-- vars:end -->

Guard: the driver sets `sv-on` on `<html>`. Entrance CSS must hide content
only under `.sv-on`. Without JS everything stays visible (never fail hidden).
The shipped `styles.css` already does this; follow the same pattern for
custom presets. `toggles()` marks a second class, `sv-ui`, on each element it
controls (the resolved `data-sv-target`, or the trigger itself when there is
no target), not on `<html>`: a click-only widget on a page whose scroll
driver never boots (no `scan()`/`track()`) still needs its own no-JS guard
to back off, or a click-driven `sv-acts` clock stays stuck at the finished
state forever, while an unrelated scroll-revealed widget elsewhere on the
same page correctly keeps that finished-state fallback. Any custom guard
keyed on `html:not(.sv-on)` for something clicks alone can finish should add
`:not(.sv-ui)` on the element itself, not on `html`. A released element (an
unmounted `<Track>`, a stopped `scan()`) gets the driver's own `data-sv-off`
instead, the per-element released twin of `sv-on`: it settles every preset
under it to the no-JS rendering and comes off the moment that element is
tracked again; a released ancestor still holding a tracked descendant keeps
waiting for it. A settled `once` entry never takes this marker: it keeps
`sv-live` and the inline `--sv-live: 1`, live and untracked instead.

## Imports

```ts
import { track, trackPointer, scrollToScene, scan, slider, mapRange, split } from 'scrollvars' // vanilla core
import { Track, Reveal, Parallax, Scenes, Item, ScrollVarsBoot, useTrack,
         useScenes, usePointer, useCanvasEffect, useSlider } from 'scrollvars/react'           // React ('use client')
import { mountEffect } from 'scrollvars/canvas'    // canvas harness ({ context: null } = WebGL/Three)
import { debug } from 'scrollvars/debug'           // dev overlay, never ship enabled
import 'scrollvars/styles.css'                    // all presets, or modular:
import 'scrollvars/styles/core.css'               // entrances, stagger, drift, spread, native view()-tier (2.4 KB gz)
// also styles/pin.css (3.2), slider.css (1.3), tilt.css (0.6), state.css (2.2, scroll-driven acts need core too), ui.css (1.1), per page needs; scoped.css (1.0) is opt-in, see Scoped clocks
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
<Reveal auto>            {/* direct children rise; order caps at 10 */}
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
orders them via nth-child: the first ten get 0–9, every later child gets 10. Set explicit per-child order for longer sequences.

**Parallax drift:** `<Parallax distance="8rem">…</Parallax>`: continuous,
tied to `--sv-view` (flat inside the live band), no transition (transitions on continuous values rubber-band).

**Pinned scenes (storytelling / horizontal rail / curtain):**
```tsx
<Scenes count={4}>{({ scene, goTo }) => <Shot index={scene} />}</Scenes>   // Shot: your component
```
The container is N viewports tall by default (one per scene); a string
`pin` (`pin="320vh"`) overrides that and wins over `height` too, matching
`<Track pin>`. Content is `position: sticky`. For pure-CSS
pinned effects use the presets: `sv-curtain-l/r` (two halves open),
`sv-curtain-l`/`sv-curtain-r` panels are decoration (they part on the pin, hide under reduced motion and without JS): content goes behind them, never inside. `sv-rail` (horizontal carousel, `--sv-stage-width` automatically measures the stage; `--sv-rail-start` overrides it: enters from offscreen right and still moves
when the track fits the viewport:
`translate: calc((1 - var(--sv-pin)) * var(--sv-stage-width, 100vw) + var(--sv-pin) * min(var(--sv-stage-width, 100vw) - 100%, 0px)) 0`).

**Zero-wrapper mode (prefer this in Next.js):** one `<ScrollVarsBoot />` in the
root layout, then plain RSC sections with `data-sv` attributes (`data-sv-once`,
`data-sv-pin`, `data-sv-travel`, `data-sv-scenes="4"`, `data-sv-enter="0.6"`/`data-sv-exit="0.2"` (custom live band); per-element knobs as attributes: `data-sv-order`, `data-sv-distance`, `data-sv-from`/`data-sv-to` become the matching CSS vars on mount (no authored style attr, the scanner writes them; prefer these over style vars for mapped/CMS content)); `data-sv-pin="320vh"` + a `sv-stage` child is the pinned skeleton (an inline static wrapper gets `position: relative` to give the stage a containing block; any other authored position is kept); a sticky header is one declaration, `:root { --sv-pin-offset: 64px }`, read by both the stage and the pin math (the driver reads the actual stage's computed `top`, so CSS resolves `calc()`, `env()`, percentages and viewport units; custom markup without `.sv-stage` still uses the limited px/rem/em/vh/vw parser). No client components
in pages at all. Route-change nodes are auto-tracked via MutationObserver.

**Spread (deck → grid):** `sv-spread`: children sit in their real flex row,
a translate collapses them onto the center while `--sv-spread` is 0. Add
`.sv-spread-in` to play on arrival (sv-live + stagger), or map the var to
scrub (needs `travel: true` on the tracker): `.mine > * { --sv-spread:
clamp(0, calc(var(--sv-t) * 2), 1) }`.
Set `--sv-order` per child and `--sv-mid` = (N−1)/2 on the container.


**Split text (SplitText-lite: do NOT add GSAP for this; it flattens inline markup, so keep links and bold outside the split element):** `data-sv-split`
(or `data-sv-split="char"`) wraps each word/char in a span with `--sv-order`
(+ `--sv-count` on the element, full text kept in a visually-hidden first
span (no aria-label, it is prohibited on generic roles) spans aria-hidden).
Word mode splits on whitespace, deterministic everywhere. Char mode splits
on grapheme clusters via `Intl.Segmenter` where it exists (emoji and
combining marks stay whole); it needs Firefox 125+ (Chrome and Safari have
had it for longer), and it must be available on BOTH the render that
produces the markup and the browser that hydrates it, or the two disagree
on where a cluster boundary falls. Pair with `sv-split-rise` (staggered
entrance) or `sv-reading` (scrubbed). React: `<Split as="h2">…</Split>`
renders the spans ON THE SERVER. No client splitting, no CLS, no hydration
flash.

**Sequenced scrub (choreography: do NOT add GSAP for this):** `sv-range`.
Each child gets `--sv-r` (0..1) over its own slice of the pin: set
`--sv-from`/`--sv-to` per child, add `sv-range-rise` for the ready-made
flavor or consume `--sv-r` yourself (ALWAYS as `var(--sv-r, 1)`; `--sv-r` is a registered property with initial value 1, so an engine that can't compute the calc division (needs Chrome 112/Safari 16.4/FF 112) resolves the property to that initial value instead of turning invalid; `var(--sv-r, 1)` is habit, not the reason older engines settle at the end state, and never fires on your range children either way, since `--sv-r` is always set; override the clock on the container, `.mine { --sv-clock: var(--sv-t) }`). JS twin: `mapRange(t, from, to, ease?)` inside
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
queries (map keys = Tailwind names, or a bare number of px as a raw
min-width, e.g. `900: 4`; a string with a unit, `'900px'`, is coerced with
`Number()` and comes out `@media (min-width:NaNpx)`, an invalid query
that never matches, so keep the key numeric). Chrome customization:
var knobs (--sv-arrow-*/--sv-dot-*) globally or per instance → stable
classes (sv-arrow, sv-dot) → prevIcon/nextIcon/renderDot → external UI via
the ref (full SliderHandle). Also `<Marquee>` (use it where Swiper loop
would be), `<Accordion>` (native details), `<Modal>` (dialog + sv-pop).
Lower level: `useSlider()` / `slider(el)`:
native scroll + snap; slides get `--sd` (signed distance from center) and
`.sv-active`, so slide animations are pure CSS (`scale: calc(1 - max(var(--sd), -1 * var(--sd)) * .1)`).
Two return shapes: `slider(el)` returns the handle itself,
`next/prev/goTo/seek/active/state/destroy`; `useSlider()` returns
`{ ref, active, next, prev, goTo, handle }`, where `handle` is a ref to
that same handle for `seek`, `state` and `destroy`. Options: `snap`,
`drag`, `duration` (glide settle ms), `axis: 'y'`, `onScroll(state)`. State
has active/count/position/progress/dragging/gliding; container also gets
`--sv-progress`. Chain sliders unidirectionally (thumbs/controller):
`slider(main, { onScroll: (s) => thumbs.seek(s.progress) })`: author the
follower with inline `scroll-snap-type: none` (seek suspends it anyway).
Page-scroll-driven variant (pin the rail, map the axes). On this instance
set `scroll-snap-type: none` AND `overflow-x: hidden`. The pin must be the
ONLY writer of scrollLeft; direct swiping would desync and jump back:
`track(rail, { pin: true, onPin: (p) => { el.scrollLeft = p * (el.scrollWidth - el.clientWidth) } })`.
Discrete flavor: `track(rail, { scenes: n, onScene: (i) => s.goTo(i) })`.

**Slider output option:** when CSS does not consume `--sd`,
`--sv-progress` or `--sv-slide`, use `slider(el, { cssVars: false })`,
`useSlider({ cssVars: false })` or `<Slider cssVars={false}>`. This skips future
writes of those outputs without removing existing inline values. Numeric
state, callbacks, active classes and snap remain available. Default `true`
preserves existing effects; do not disable it for CSS that reads the clocks.

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
`--sv-state` and syncs `aria-expanded`, and nothing else: no focus trap,
no Escape-to-close, no `aria-modal`, no tab roving-tabindex/arrow-key
semantics. Enough for a menu or a disclosure panel; a real modal wants the
kit's `<Modal>` (native `<dialog>`, focus trap and Escape included) instead
of one hand-rolled on `toggles()` alone, and a tabs widget needs its own
keyboard handling on top of the class flip (no dedicated Tabs component
yet). Presets: `sv-pop` (popover/dialog/
panel entry-exit via @starting-style) and `sv-words` (rotating words via
`--sv-word`). On an element the driver does not track (a hand-flipped `.sv`,
a `toggles()`-driven widget), removing `sv-live` and re-adding it on the
next frame replays the entrance system on demand; on a tracked (or
released) element the driver pins `--sv-live` inline (outranks a rule of
your own without `!important`), so re-tracking is what replays the entrance
there instead. A settled `once` entry carries that inline value too,
without being tracked or released, so the class trick alone cannot
replay it; re-tracking still can, exactly as on a tracked element. Two
shapes it cannot replay: entrance CSS that hard-codes its duration
instead of reading `--sv-duration`/`--sv-stagger`, and `--sv-duration` or
`--sv-stagger` declared on a descendant instead of inherited, which is
what `<Item duration>` and `<Split duration>` emit (a bare `<Split>`, or a
descendant `--sv-order`/`--sv-distance`, replays fine). Neither one
enters: re-tracked from a plain task (a click handler, an effect body)
nothing visibly changes, from inside a rAF callback they dip and reverse.
**Multi-act timed sequences**: `sv-acts` preset: a registered
custom property (--sv-act) transitions 0→N on sv-open/sv-live; define acts
as the same clamp() slices as scroll scenes (`--a2: clamp(0, calc(var(--sv-act) - 1), 1)`).
Knobs: --sv-acts-count / --sv-acts-duration. Reversible (retargets, never
restarts). Use it BEFORE reaching for GSAP; GSAP only for branching/physics/
per-act callbacks. Do NOT add Framer for a modal; do NOT use checkbox hacks
(wrong a11y semantics). For a modal use the kit's `<Modal>` (dialog-based:
focus trap and Escape included); for other click-toggled state, `toggles()`,
the Popover API, or `:has()` + radios.

**Pointer tilt:** `usePointer()` on a container ref + `className="sv-tilt"` on
cards. Two delegated listeners (pointermove, pointerout); CSS does tilt + glare from `--mx`/`--my`.

**Scroll-scrubbed media / WebGL:** `onTravel` (viewport travel) and `onPin`
(progress across a pinned stretch) fire on every driver frame, while near the viewport, with raw 0..1 (track with a custom `root` and that near-viewport culling never applies, by design: the callback fires every frame no matter where the root itself sits on screen):
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
wrappers whose children stay RSC (`<Scenes>` takes a render function, so
that function itself must live in client code; the slot pattern still lets
it hold RSC-only content: a server parent renders the heavy piece and
passes the already-rendered result down as an ordinary prop into a small
client wrapper, which closes over that prop inside the render function it
hands to `<Scenes>` and returns it there, the same trick that lets any
client component host RSC content as `props.children`). `<ScrollVarsBoot />` (first child of `<body>`) sets
`sv-on` before first paint and removes it again if the driver has not
booted within 3 seconds. That release is final: a driver that still boots
after the deadline (slow network, a bundle behind a long task) has its own
`sv-on` reverted by a watchdog-installed observer instead of re-hiding
content the visitor is already reading, so entrances neither flash nor
fail hidden. That pre-paint hiding depends on
the inline script itself running: it is gated on `IntersectionObserver` and
`ResizeObserver` both existing. Without JS neither the script nor driver runs.
Without either observer the script skips pre-paint hiding; the later driver
requires ResizeObserver but can boot without IntersectionObserver (unculled),
and then adds `sv-on`. Missing ResizeObserver keeps the driver static. Under a strict CSP with no
`'unsafe-inline'`, pass the request's nonce: `<ScrollVarsBoot nonce={nonce} />`.
Zero-JS tier: `sv-view-*` classes use native CSS scroll-driven
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
7. Deliberate exceptions inside the kit: `sv-tilt` transitions a pointer-driven transform (small, damped), `sv-counter` rewrites generated text, Accordion animates block-size. Each is local and opt-in; do not generalize them.

## Browser support (tell clients this)

Fully animated: Chrome/Edge 104+, Firefox 78+, Safari/iOS 14.1+ (gates: ES2020
dist + individual transform properties; `sv-counter` needs FF 128 / Safari
16.4; `sv-view-*` native tier is Chromium 115+). Below the floor and
without `compat()`, the page is static but 100% visible; `sv-rail` is
the one exception, its track stays unwrapped and can run past the
viewport edge, reachable by a page-wide horizontal scroll.
With `compat()` installed (`data-sv-compat` on `<html>`) the stage stays
pinned instead so the module's own fallback can keep animating the
curtains and rail from `--sv-pin`, and content taller than the stage
clips there, a real trade: skip `compat()` on a page whose below-floor
deck matters more than its below-floor animation. The component kit (Modal, Accordion, `sv-pop`, `sv-acts`) also uses `<dialog>`, `inert`, `@starting-style` and `@property`; older engines render those pieces static: closed panels stay closed, open ones open, no animation, and a Modal without `<dialog>` support is an open static panel: `state.css` deliberately hides nothing there, and the `open` attribute tracks state in both directions so your own CSS can hide it. Reduced motion: the driver zeroes `--sv-view`, the travel/pin/scene clocks keep scrubbing (scroll-linked, not motion), entrance presets show final state, curtains hide, deck/rail/stage return to flow. Animation is enhancement,
never a dependency. If a client contractually requires legacy browsers:
`import { compat } from 'scrollvars/compat'; compat()` once at boot (free on
modern browsers, feature-checks and exits) + let the consumer bundler
downlevel ES2020 per browserslist. That extends the animated floor to
~Chrome 61 / Firefox 60 / Safari 11. Do NOT hand-roll other polyfills.

## The receipts (measured: why the design holds up)

Public, reproducible benchmark: https://scrollvars.dev/bench/:
equivalent animated boxes and scroll progression, four engine builds (including the batched
expert GSAP variant, symmetric to ScrollVars' one-tracker-per-section).
Frame delivery and CPU cost are reported separately; neither is guaranteed
across workloads or devices:

<!-- bench:start -->
Measured 2026-09-10T15:05:07.331Z; package 1.16.1, 3 runs. CPU is accumulated over 12 seconds (900 elements), not per-frame time. Bundle and runtime measurements refer to this snapshot. [Raw runs](https://scrollvars.dev/bench/results/latest.json); [frame tails and methodology](https://scrollvars.dev/bench/).

| engine | total CPU (12 s) | fps | bundle (gzip) | JS script | style recalc | JS heap |
|---|---|---|---|---|---|---|
| ScrollVars | 954 ms | 60 | 8.0 KB | 54 ms | 196 ms | 1 MB |
| ScrollVars (document variables published) | 3550 ms | 59.8 | 8.0 KB | 46 ms | 2887 ms | 1.4 MB |
| gsap + ScrollTrigger (idiomatic) | 735 ms | 60 | 45.2 KB | 167 ms | 58 ms | 6.1 MB |
| gsap + ScrollTrigger (batched, symmetric) | 903 ms | 60 | 45.2 KB | 156 ms | 81 ms | 6.7 MB |
| framer-motion | 1334 ms | 60 | 46.9 KB (+ React) | 635 ms | 43 ms | 10.8 MB |
<!-- bench:end -->

The committed results record the measurement date, package version, source
hashes, individual runs and startup separately from the 12-second scroll.
The second row is not a competitor comparison: it is what the two document
variables cost when a page reads them, on this deliberately hostile workload
of 900 animated boxes. They are inherited properties on `<html>`, so
publishing them asks the browser to recalculate style for the whole document
on every frame. The default row does not pay it because nothing on that page
reads them, and the driver checks before publishing. A page that does use
them pays in proportion to its own size, not to that row.
The package ships ~6× less bundle than GSAP + ScrollTrigger; frame delivery
and CPU cost depend on the workload. CPU throttling is a synthetic profile,
not a physical phone. See the benchmark for current results and methodology.

Why the numbers come out this way. Each is a design decision, not tuning:

- **The hot path writes CSS variables and discrete state: a class, a callback.** The browser's own
  transition/animation machinery does the animating; JS only steers. That is
  why 900 animated elements cost so little script time in the table above.
- **One passive scroll listener + one rAF for all scroll tracking** (the slider, pointer and canvas modules schedule their own frames), strict
  read-phase-then-write-phase during ordinary frames. Entrance replay explicitly
  forces one computed-style read between writes to settle its reset; user
  callbacks can also force layout.
- **Scroll state never enters the framework.** React renders zero times
  per frame during scroll (`useScenes`/`useSlider` re-render only on a discrete
  index change), so the per-frame framework bill is never paid.
- **Fails visible.** Hiding styles are gated on `html.sv-on` (set by the
  driver), so on the no-JS path the page is a complete static page: SSR,
  SEO and the Lighthouse load profile stay untouched (a JS-enabled
  Lighthouse run sees the pre-paint script hide entrances before paint
  and the pin helper write heights on attach), with three exceptions by
  design: class-toggled panels (menus, modals) stay closed with no click
  driver to open them, `sv-view-*` native animations still run without
  JS where the browser supports `animation-timeline: view()`, and the
  bare CSS marquee (`ui.css`) keeps scrolling, its `@keyframes` animation never
  depends on the driver. A click-driven `sv-acts` target also needs
  `toggles()` (which marks `sv-ui` on it) to start at zero instead of
  settling at its no-JS finished state.
- **Cheap, not free: and measured where it loses.** An inherited var pays
  per-descendant, a direct transform pays per-element: ScrollVars posts the
  worst style-recalc of its own table, and the published deep-DOM curve
  (`/bench/`, ?deep=N) compares total work across several subtree sizes. Use the measured
  row for your workload, including whether page outputs are enabled. The authoring rule that keeps you
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
alias in one step), `test/` (node:test; most of it runs with no DOM against
hand-rolled element and global stubs, `test/react.test.mjs` hand-rolls a
fake DOM to mount `react-dom/client` for ref and effect tests, and
`test/canvas.test.mjs` stubs the canvas/observer APIs). Build: `npm run build`
(tsc, then `scripts/build-styles.mjs` regenerates `styles.css`). Node
version: respect `.nvmrc`.

## Fit-to-flow and declarative pointer

For pinned CMS content use `.sv-stage > [data-sv-fit]`. If that inner layout exceeds the available stage height, the driver sets `data-sv-flow` on the tracked wrapper, restores its authored height/position and the pin presets return to flow. This stays latched until retracked. `onFlow(boolean)` reports the initial state and fallback; release custom `inert` media when true. TimelineScrub and StickySteps ship this guard.

`data-sv-pointer` delegates to `.sv-tilt`, or provide a selector value. `scan()`/Boot owns its attach, subtree removal and stop lifecycle. `data-sv-duration="800ms"`, `data-sv-stagger="100ms"` and `data-sv-ease="ease-out"` also map to CSS vars on mount (CSS time units, unlike React numeric milliseconds). Attributes are not observed for later changes.

Pass `nonce` to `<Slider>` for its generated responsive `<style>`. Autoplay pauses on hover, stops on focus until explicitly resumed, and uses a polite live region while paused. `<Marquee>` has a keyboard pause button (`aria-pressed`) and is static until its click driver attaches; bare marquee CSS still animates without JS. `toggles()` synchronizes an existing `aria-pressed` instead of `aria-expanded` for a pressed-state button.

## Scoped clocks, an opt-in for deep pages

`--sv-t` and `--sv-view` are written on the tracked element, and as ordinary
custom properties they inherit: every write re-resolves style for the whole
subtree, including every node that never reads them. On the published
benchmark that resolution is the whole of the gap to GSAP on deep DOM, and
none of it on flat DOM.

`scrollvars/styles/scoped.css` registers both clocks non-inheriting, so an
invalidation stops at the tracked element. The rule it imposes is one
sentence: **a clock reaches only the elements that declare `inherit` for it,
and every element between the tracked ancestor and a reader must declare it
too.** The shipped presets that read a clock from a descendant (`sv-drift`,
`sv-range`) are forwarded inside the sheet, along the whole path down to
them. Your own reader needs one rule, covering the reader and every element
between it and the tracked ancestor:

```css
.sv :has(.my-card), .my-card { --sv-t: inherit; }
```

Just `.my-card { --sv-t: inherit; }` when it is a direct child. Put the
reader's LAST compound inside `:has()`: for a reader written as
`.copy p`, the path rule is `.sv :has(p)`, because `:has(.copy p)` is
evaluated from each candidate and `.copy` itself has no `.copy` inside it,
so it would be skipped and read the initial value. The sheet
registers nothing where `:has()` is unsupported, so a browser that could
register but not forward stays on plain inheritance.

One more consequence of registration: a registered property always has a
value, so a fallback such as `var(--sv-t, 1)` is never taken again. It
reads the initial value, 0, wherever the driver has not written yet. If your
CSS relied on that fallback (unread paragraphs fully visible until the
section is tracked, say), declare the default on the tracked element instead,
`.my-section { --sv-t: 1; }`: the driver's inline write overrides it the
moment it arrives, and the reader sees the same value it saw before.

It is not free and it is not always a win. Registration makes the browser
resolve a typed value on every element that holds one, so the sheet pays per
reader and saves per non-reading descendant. Measured behind a rendered-output
gate, same page and same scroll each time: on the benchmark's deep profile
(50 descendants per reader) 63 percent less style recalculation and 28
percent less total task time; on its flat profile (every descendant a
reader) 13 percent more recalculation and 4 percent more task time. On
scrollvars.dev's own home page, with its three readers forwarded, 10 percent
less task time and 23 percent less recalculation; on the gallery pages
sticky-steps 12 percent less, timeline-scrub 7 percent more,
hero-cinematic 12 percent more, editorial-manifesto 9 percent more and
case-study-rail within noise, each on the side its shape predicts. Import it
when a tracked wrapper holds a lot of content that does not animate; leave
it out when the tracked element's own children are the readers. Measure your
page, the benchmark harness is in the repository.

Browsers without `@property` ignore the registration and keep inheriting, so
the sheet never breaks a page below the floor; it can only make one faster
where it is understood. It is deliberately not part of `styles.css`.

## Limit animation work to its consumers

`--sv-page` and `--sv-v` live on `<html>`, and they inherit, so every write
asks the browser to recalculate style for the whole document. A page that
never reads them should never pay that, so the driver looks before it
publishes: on the first frame it scans the document's own stylesheets and
inline styles for the two names, and stays silent when neither appears. A
stylesheet added later, by a lazily mounted component or a CSS-in-JS runtime,
turns publishing back on.

Detection reads CSS, so it cannot see a JavaScript reader. Call
`setPageOutputs(true)` (import from `scrollvars`, or
`<ScrollVarsBoot pageOutputs />`) when only script reads the variables, for
instance through `getComputedStyle`. Calling `setPageOutputs()` at all takes
the decision away from detection permanently, in both directions:
`setPageOutputs(false)` keeps them off even for a page whose CSS reads them.

Anything the scan cannot read counts as a reader, so the variables keep
working. A stylesheet on another origin without CORS headers is the common
case: its rules are unreadable, so the page publishes as before. Serve that
CSS same-origin, send the header, or call `setPageOutputs(false)` yourself.

Suppressed, both document variables are removed and the idle page driver
stops after the last tracker is released. Local clocks keep working. All Boot
instances and manually attached effects share this setting.

For entrance-only tracking, `view: false` skips the unused continuous view
clock; `sv-view-fade`/`sv-view-rise` need no tracker where native view timelines
are supported. Keep continuously tracked wrappers small. Inherited variables
on a large ancestor still incur style work even if the final animated property
is a transform. Do not change public clocks to `inherits: false`: presets
consume them on descendants. Test representative CMS content and media on the
client's devices; functional browser tests alone do not establish frame budgets.
