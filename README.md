# scrollvars

Tiny scroll-driven animation engine for the web: **one rAF loop in, CSS variables out.** Zero dependencies, React layer optional. Measured (min+gzip): driver 1.2 KB, full core incl. the slider 3.1 KB, presets CSS 2.8 KB — the whole library is under 6 KB on the wire.

## Why

Most scroll-animation setups pipe scroll values through framework state (a re-render per frame per element) and interleave layout reads with style writes (layout thrashing). scrollvars fixes the transport:

- **One global driver** — a single passive scroll listener + a single `requestAnimationFrame` for the whole page.
- **Batched read → write phases** — all rects first, all CSS variables after.
- **No framework in the hot path** — React renders zero times during scroll.
- **Fails visible** — hiding styles are gated on `html.sv-on` (set by the driver), so if JS never loads the page is a normal static page.
- **`prefers-reduced-motion`** respected by driver and presets.

## The receipts (measured — why the design holds up)

Public, reproducible benchmark: https://scrollvars.vercel.app/bench/ —
identical DOM and animations, three engines, headless Chrome + CDP with a
verified CPU throttle. Frame delivery ties (every competent engine animates
only the viewport); what differs is what those frames cost:

| engine | bundle (gzip) | CPU total (12 s, 900 elements) | JS heap | Lighthouse mobile |
|---|---|---|---|---|
| scrollvars | 3.1 KB | 421 ms | 1.3 MB | **100** |
| gsap + ScrollTrigger | 46.3 KB | 476 ms | 7.2 MB | 88 |
| framer-motion | 46.9 KB (+ React) | 918 ms | 10.8 MB | 94 |

Why the numbers come out this way — each is a design decision, not tuning:

- **The hot path writes CSS variables and nothing else.** The browser's own
  transition/animation machinery does the animating; JS only steers. That is
  why 900 animated elements cost 155 ms of script in 12 s.
- **One passive scroll listener + one rAF for the whole page**, strict
  read-phase-then-write-phase. Layout thrashing is impossible by
  construction, not by discipline.
- **Scroll state never enters the framework.** React renders zero times
  during scroll — the per-frame framework bill is never paid.
- **Fails visible.** Hiding styles are gated on `html.sv-on` (set by the
  driver), so without JS the page is a complete static page — SSR, SEO and
  the Lighthouse load profile stay untouched.
- **Cheap, not free.** Writing vars invalidates descendant styles — scrollvars
  posts the *highest* style-recalc in its own table (266 ms vs GSAP's 118 ms)
  and still wins total CPU. The workload is scroll-scrub, this lib's home turf,
  and the GSAP page uses 900 idiomatic per-element triggers, not a hand-tuned
  batch. Read the bench sources before quoting it.
- **Honest scope.** Input-driven animation (scroll/pointer/gesture) is this
  lib's job; time-driven orchestration (timelines, springs, exit
  transitions) legitimately belongs to GSAP/Framer. Pick per page.

## Install

```bash
npm i scrollvars
# or pin to a git ref (the `prepare` script builds on install):
npm i github:aduptive/scrollvars
```

```ts
// app/globals.css or layout — everything:
import 'scrollvars/styles.css'
// …or only what the page uses (modular since 1.1):
import 'scrollvars/styles/core.css'    // entrances, stagger, drift, native view()-tier — 1.2 KB gz
import 'scrollvars/styles/pin.css'     // curtain, rail, deck, reading, counter — 1.3 KB gz
import 'scrollvars/styles/slider.css'  // carousel rails — 0.4 KB gz
import 'scrollvars/styles/tilt.css'    // pointer tilt — 0.5 KB gz
```

## Pay for what you use

The package is fully tree-shakeable (ESM, side-effect-free JS); measured
min+gzip per import:

| you import | JS on the wire |
| --- | --- |
| `track` (the driver) | 1.0 KB |
| `track` + `scan` (zero-wrapper mode) | 1.3 KB |
| `slider` | 1.5 KB |
| `trackPointer` | 0.4 KB |
| `mountEffect` (canvas) | 0.7 KB |
| everything | 3.1 KB |

A typical page (reveals + stagger) ships `track` + `styles/core.css`:
**~2.2 KB gzipped, total.**

## Mental model

The driver **tracks** elements and writes three variables + one class:

| Output | Range | Meaning |
| --- | --- | --- |
| `--sv-view` | −1 → 0 → 1 | Below the scene → in scene → gone above |
| `--sv-t` | 0 → 1 | Travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | Raw progress across a pinned (sticky) stretch — curtains, horizontal carousels |
| `--sv-scene` | 0 → N−1 | Scene index across a pinned section (eased + snapped) |
| `.sv-live` | class | On while the element is in the live band (75%/25%) |

Anything that reads them is a preset. The shipped ones:

| Class | Effect |
| --- | --- |
| `sv-rise` / `sv-fade` / `sv-slide-l` / `sv-slide-r` | Entrance transitions, triggered by `.sv-live` |
| `sv-auto` (on the container) | Every direct child rises in DOM order — no classes on children (`sv-skip` opts out) |
| `sv-drift` | Continuous drift tied to `--sv-view` — follows the finger, no transition |
| `sv-spread` | Centered deck fans out into its flex row — `.sv-spread-in` plays on arrival, or map `--sv-spread` from `--sv-t` to scrub |
| `sv-view-fade` / `sv-view-rise` | Pure CSS, zero JS, where `animation-timeline: view()` exists |
| `sv-deck` | Pinned card pile — each child flies away across its slice of the pin (`--sv-count`) |
| `sv-reading` | Guided reading: word spans lit progressively across the pin (`--sv-count` + `--sv-order`) |
| `sv-counter` | Integer counted up by the scroll via `@property` + `counter()` — set `--sv-max` |

Knobs (set anywhere in CSS or inline): `--sv-distance` (travel length), `--sv-order` (stagger position), `--sv-stagger`, `--sv-duration`, `--sv-ease`.

## React

```tsx
import { Reveal, Parallax, Scenes, Item } from 'scrollvars/react'

// Entrance — children stagger automatically
<Reveal as="section" auto>
  <h2>Title</h2>
  <p>Copy</p>
  <button>CTA</button>
</Reveal>

// Continuous drift
<Parallax distance="10rem">
  <img src="…" alt="" />
</Parallax>

// Knobs are attributes — sugar for the CSS variables (no style ceremony)
<Reveal stagger={140} duration={900}>
  <Item order={0}>first</Item>
  <Item order={1} effect="slide-l" distance="4rem">second</Item>
</Reveal>

// Pinned storytelling (the sticky/keyframes pattern)
<Scenes count={4}>
  {({ scene, goTo }) => (
    <div>
      Slide {scene + 1}
      {/* continuous progress, pure CSS, no re-render: */}
      <i style={{ width: 'calc(var(--sv-scene) / 3 * 100%)' }} />
    </div>
  )}
</Scenes>
```

Lower level: `<Track>` (the base component) and `useTrack(options)` / `useScenes(count)`.

**Zero-wrapper mode:** drop one `<ScrollVarsBoot />` in the root layout and write
plain server components with `data-sv` attributes — no client wrappers anywhere:

```tsx
// app/layout.tsx
<body><ScrollVarsBoot />{children}</body>

// any RSC — stays on the server
<section data-sv data-sv-once>
  <h2 className="sv-rise">Title</h2>
</section>
```

Attributes: `data-sv` (track), `data-sv-once`, `data-sv-pin`, `data-sv-travel`,
`data-sv-scenes="4"`. New nodes from route changes are picked up automatically
(vanilla: `scan()`).

## The fx gallery — copy-paste effects (+ shadcn-style CLI)

A growing library of effects at **https://scrollvars.vercel.app/fx/** — each
one live, with Tailwind, CSS and React formats, knobs documented, and a
machine-readable [fx/llms.txt](https://scrollvars.vercel.app/fx/llms.txt)
so AI assistants can ingest the whole collection in one request. Install an
effect straight into your project:

```bash
npx scrollvars list
npx scrollvars add coverflow-slider            # → components/fx/CoverflowSlider.tsx
npx scrollvars add marquee --dir src/ui
```

The CLI fetches a remote registry, so the library grows without package
releases.

## The component kit (React)

Batteries-included wrappers over the same engine — less React, less JS,
less CSS than the usual suspects:

```tsx
import { Slider, Slide, Marquee, Accordion, Modal } from 'scrollvars/react'

// the Swiper replacement — breakpoints ARE media queries (or a familiar map):
<Slider perView={{ base: 1.2, md: 2.5, xl: 4 }} gap={16} arrows dots autoplay={5000}>
  {cards.map(c => <Slide key={c.id}><Card {...c} /></Slide>)}
  <Slide span={2}>a wide feature slide</Slide>   {/* per-slide override */}
</Slider>

<Marquee speed={24}>{logos}</Marquee>            // infinite strip, pauses on hover
<Accordion title="Question?" group="faq">…</Accordion>  // native <details>, animated
<Modal open={open} onClose={…}>…</Modal>         // native <dialog> + sv-pop
```

**Customizing the Slider chrome** — three layers, pick your depth:
1. **Var knobs** (`--sv-arrow-size/-inset/-bg/-color/-radius`, `--sv-dot-size/
   -gap/-color/-active`, `--sv-dots-justify/-offset`) — set on `:root` for the
   whole project, or on one slider via className/style.
2. **Stable classes** (`sv-slider-shell`, `sv-arrow[-prev/-next]`, `sv-dots`,
   `sv-dot.on`) — restyle or reposition freely in project CSS.
3. **Full control** — `prevIcon`/`nextIcon`, `renderDot(i, active)`, or turn the
   chrome off and drive an external UI through the ref (`SliderHandle`:
   next/prev/goTo/seek/state) placed anywhere in the page.

`perView` fractional gives the peek (`1.2`); responsive via the map above,
media queries, or Tailwind: `className="[--sv-per-view:1.2] md:[--sv-per-view:2.5]"`.
Vars cascade, so every knob has a global default and a per-instance (or
per-slide) override. No `loop` in v1 — where Swiper's loop is used, a
`<Marquee>` is usually the honest fit.

## Slider (Swiper, featherweight)

Native scroll + scroll-snap do the carousel; the module adds mouse drag,
the active-slide observer and controls. Slides get `--sd` (signed distance
from center, in slide widths) and `.sv-active` — any CSS reading them
animates the carousel with zero per-frame JS:

```tsx
const { ref, active, next, prev } = useSlider()   // or slider(el) in vanilla
<div ref={ref}>{slides.map(…)}</div>

/* coverflow in two lines */
.slide { scale: calc(1 - min(abs(var(--sd)) * 0.12, 0.3)); opacity: calc(1 - abs(var(--sd)) * 0.35); }
```

Options: `snap: 'mandatory' | 'proximity'`, `drag: false`, `duration` (glide
settle ms; default 600 — raise for softer), `axis: 'y'` (vertical),
`onScroll(state)` (full state per frame: active/count/position/progress/
dragging/gliding — also on the container as `--sv-progress`). Handle:
`next/prev/goTo/seek/active/state/destroy`.

Chain two sliders (Swiper's controller/thumbs, one line, unidirectional):

```ts
const thumbs = slider(thumbsEl, { axis: 'y', drag: false })  // author it with scroll-snap-type: none
slider(mainEl, { onScroll: (s) => thumbs.seek(s.progress) })
```

Size, measured: this module 3.1 KB min / 1.4 KB gzip; Swiper 11 bundle
151 KB min / 42 KB gzip (+ 18 KB CSS).

## Interaction states (click)

The third input. One delegated listener turns clicks into classes and
variables; CSS animates — same contract as scroll:

```html
<button data-sv-toggle="open" data-sv-target="#menu">menu</button>
<nav id="menu" class="sv-pop">…</nav>   <!-- animated show/hide, aria-expanded synced -->
```

`<ScrollVarsBoot />` wires it automatically (vanilla: `toggles()`). Presets in
`styles/state.css`:

- `sv-pop` — entry/exit for `[popover]`, `<dialog>` and class-toggled panels
  via `@starting-style` + `allow-discrete` (the modern replacement for the
  checkbox hack — with accessibility the hack never had)
- `sv-words` — rotating words: a clipped column, slide with `--sv-word: n`

**Multi-act sequences** — `sv-acts` is a time-driven master clock in pure
CSS: a registered custom property transitions 0 → N when the class arrives
(`sv-open` from a click, or `sv-live` from the scroll — timed choreography
with zero JS). Acts are the same `clamp()` slices the scroll scenes use, so
one idiom drives every timeline; the clock is reversible and interruptible
(class removed mid-flight = the transition retargets, no restart). What it
deliberately doesn't do: branching, per-act JS callbacks, physics — that's
GSAP.

```css
.hero { --a1: clamp(0, var(--sv-act), 1); --a2: clamp(0, calc(var(--sv-act) - 1), 1); }
.hero h1 { opacity: var(--a1); translate: 0 calc((1 - var(--a1)) * 2rem); }
.hero .cards { scale: calc(0.9 + var(--a2) * 0.1); }
```

Three tricks worth knowing before writing any JS: toggling `sv-live` by hand
replays the whole entrance system on demand; `:has()` puts state anywhere
(`body:has(#tab-2:checked) .panel-2`); the Popover API opens/closes with zero
JS. One-shot intros on load are plain CSS keyframes. Orchestrated multi-act
timelines remain GSAP's turf — this module is one click, one state change.

## Pointer tilt

Same philosophy, different input — the pointer becomes `--mx`/`--my` (−1..1 from each card's center):

```tsx
const ref = usePointer()          // or trackPointer(container) in vanilla
<div ref={ref} className="grid">
  <div className="sv-tilt">…</div>   {/* tilt + glare from styles.css */}
</div>
```

## Video scrub & WebGL

`onTravel` fires every frame with the raw 0..1 value — feed it to whatever JS needs to follow the scroll:

```tsx
useTrack({ onTravel: (t) => { video.currentTime = t * video.duration } })
useScenes(4, {})            // or drive an R3F camera from onScene / onTravel
```

## Canvas effects (`scrollvars/canvas`)

For ambient canvas work (particle spheres, generative heroes) the simulation is
yours — the harness handles the lifecycle everyone rewrites badly: resize, DPR
cap, delta-time loop, **pause when offscreen or the tab is hidden**,
`prefers-reduced-motion`, cleanup. Drawing space is CSS pixels.

```tsx
const ref = useCanvasEffect({
  setup: (fx) => { points = makeSphere(1000) },
  frame: (fx, dt) => {
    fx.ctx.clearRect(0, 0, fx.width, fx.height)
    angle += (fx.reducedMotion ? 0.05 : 1) * dt
    drawSphere(fx.ctx, points, angle)
  },
})
<canvas ref={ref} className="h-full w-full" />
```

Vanilla: `mountEffect(canvas, { setup, frame })` returns
`{ pause, resume, destroy }`. Feed it scroll/pointer inputs from the driver
(`onTravel`, `--mx`) through your own closure — the modules stay decoupled.

## Vanilla

```ts
import { track } from 'scrollvars'

const untrack = track(el, { scenes: 4, onScene: (i) => console.log('scene', i) })
```

## Defaults (the tuned knobs)

| Knob | Default | Where |
| --- | --- | --- |
| Live band | enter 75% / exit 25% of viewport | driver (`sv-live`, `--sv-view` ramps) |
| Scene snap dead-zone | 0.4 (`snap` option; `false` disables) | driver `scenes` |
| Entrance distance | `--sv-distance: 6rem` | styles.css |
| Stagger step | `--sv-stagger: 110ms` | styles.css |
| Entrance duration | `--sv-duration: 800ms` | styles.css |
| Slider glide settle | `duration: 600` ms (exponential lerp) | slider |
| Slider wheel-quiet window | 200 ms | slider |
| Canvas DPR cap | 2 (`dprCap`) | canvas harness |

## When to use what

The honest boundary: scrollvars maps **inputs to values** — if the animation
happens because the *user did something* (scroll, pointer, gesture), it does
the job at a fraction of the cost. If it happens because *time passes*, use
the tools built for that.

| You need | Use |
| --- | --- |
| Reveals, parallax, pinned stories, scrubbing, carousels, tilt, camera paths | **scrollvars** |
| Orchestrated timelines (`tl.to(a).to(b, "-=0.2")`), elastic/bounce easings, SVG morphing, animating arbitrary JS values | **GSAP** |
| Interruptible spring physics, layout/`layoutId` "magic motion", exit animations on React unmount, `whileDrag` gestures | **Framer Motion** |
| A one-shot intro that plays on load | plain **CSS keyframes** (before reaching for a library) |

Known gaps inside scrollvars' own territory (candidates for 1.x, tell us if
you hit them): nested scrollers (the driver tracks window scroll only),
automatic pinning (the sticky skeleton is hand-written), declared smooth-scroll
(Lenis) interop, and a SplitText-style text splitter.

Mixing is fine: GSAP for one intro timeline + scrollvars for everything
scroll-driven coexist without conflict — that page just gives up the bundle
argument.

## Browser support

The floor is set by two things: the dist ships ES2020 (optional chaining) and
the presets use individual transform properties (`translate:`/`rotate:`/`scale:`).

| Browser | Fully animated | Notes |
| --- | --- | --- |
| Chrome / Edge | **104+** (Aug 2022) | `sv-view-*` native zero-JS tier: 115+ |
| Firefox | **74+** (Mar 2020) | `sv-counter` preset needs 128+ (Jul 2024) |
| Safari / iOS | **14.1+** (Apr 2021) | `sv-counter` preset needs 16.4+ (Mar 2023) |
| Anything older, or no JS | content 100% visible, static | `html.sv-on` guard: hiding styles only apply after the driver boots |

**Extended floor** — `scrollvars/compat`, an opt-in module for legacy
targets. On modern browsers it runs two feature checks and exits (free);
on old ones it installs a ResizeObserver stub (viewport-resize backed), an
always-visible IntersectionObserver stub, and a `transform:`-based fallback
stylesheet for the presets (written without `:is()`/`clamp()`/`min()`).
Combined with your bundler downleveling the ES2020 dist (Next.js already
does per browserslist), the core reveal/pin presets animate on roughly
Chrome 61+ / Firefox 60+ / Safari 11+; sv-counter and sv-view-* stay
progressive. Call it once, before anything else:

```ts
import { compat } from 'scrollvars/compat'
compat()
```

Per-module gates, if you need finer grain: driver = ES2020 + ResizeObserver
(Safari 13.1); presets = individual transform properties (Chrome 104 /
Firefox 72 / Safari 14.1); canvas harness adds IntersectionObserver
(Safari 12.1); slider/pointer = Pointer Events (Safari 13). The design rule
that makes the table safe for companies: **below the floor nothing breaks —
the page renders complete and static.** Animation is progressive enhancement,
never a dependency.

## License

MIT
