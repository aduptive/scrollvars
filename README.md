# ScrollVars

![scrollvars: words arriving one by one on scroll](https://scrollvars.dev/media/readme.gif)


Tiny scroll-driven animation engine for the web: **one rAF loop in, CSS variables out.** Zero dependencies, React layer optional. Measured (JS min+gzip, CSS gzip as shipped): driver 3.0 KB, full core incl. the slider 7.1 KB, styles 9.2 KB for every preset or 2.4 KB for the core part. A typical page ships ~5.4 KB on the wire.

## Why

Most scroll-animation setups pipe scroll values through framework state (a re-render per frame per element) and interleave layout reads with style writes (layout thrashing). ScrollVars fixes the transport:

- **One global driver**: a single passive scroll listener, one rAF for all scroll tracking; slider, pointer and canvas schedule their own.
- **Batched read → write phases**. All rects first, all CSS variables after.
- **No framework in the hot path**, React renders zero times per frame
  during scroll (`useScenes`/`useSlider` re-render only on a discrete index
  change).
- **Fails visible**: hiding styles are gated on `html.sv-on` (set by the driver), so if JS never loads the page is a normal static page.
- **`prefers-reduced-motion`** respected by driver and presets.

## The receipts (measured: why the design holds up)

Public, reproducible benchmark: https://scrollvars.dev/bench/:
identical DOM and animations, four engine builds (including the batched
expert GSAP variant, symmetric to ScrollVars' one-tracker-per-section).
Frame delivery ties (every competent engine animates only the viewport);
what differs is what those frames cost:

<!-- bench:start -->
| engine | bundle (gzip) | JS script (12 s, 900 el) | style recalc | JS heap |
|---|---|---|---|---|
| ScrollVars | 7.1 KB | 100 ms | 195 ms | **1.4 MB** |
| gsap + ScrollTrigger (idiomatic) | 46.3 KB | 233 ms | 85 ms | 6.2 MB |
| gsap + ScrollTrigger (batched, symmetric) | 46.3 KB | 175 ms | 86 ms | 6.7 MB |
| framer-motion | 46.9 KB (+ React) | 740 ms | 48 ms | 11.1 MB |
<!-- bench:end -->

Medians of 5 runs from the committed harness (`demo/bench/harness`,
`npm i && node measure.mjs --runs=5` reproduces every number, engine order
rotated; the low-end profile's 4× CPU throttle is set through CDP, nominal, not independently calibrated). Frame delivery ties at 60 fps in every row. The
precise claim: not faster frames, the same frames for ~7× less bundle
and a fraction of the heap; total CPU trades blows (ScrollVars wins
shallow, batched GSAP wins deep subtrees. The published curve).

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
  (`/bench/`, ?deep=N) shows batched GSAP winning total CPU once every
  animated box carries a 50-node subtree. The authoring rule that keeps you
  on the cheap side: keep tracked elements thin: big static content lives
  next to, not inside, the animated elements. Read the bench sources before
  quoting it.
- **Honest scope.** Input-driven animation (scroll/pointer/gesture) is this
  lib's job; time-driven orchestration (timelines, springs, exit
  transitions) legitimately belongs to GSAP/Framer. Pick per page.

## Install

```bash
npm i scrollvars
# or pin to a git ref (the `prepare` script builds on install):
npm i github:aduptive/scrollvars#v1.13.0   # pin the ref
```

```ts
// app/layout.tsx (or any entry file). Everything:
import 'scrollvars/styles.css'
// …or only what the page uses (modular since 1.1):
import 'scrollvars/styles/core.css'    // entrances, stagger, drift, spread, native view()-tier, 2.4 KB gz
import 'scrollvars/styles/pin.css'     // sv-stage, curtain, rail, deck, reading, counter, range, 3.2 KB gz
import 'scrollvars/styles/slider.css'  // carousel rails, 1.3 KB gz
import 'scrollvars/styles/tilt.css'    // pointer tilt, 0.6 KB gz
import 'scrollvars/styles/state.css'   // toggles, popover/dialog, rotating words, acts (a scroll-driven acts clock needs core.css too), 2.2 KB gz
import 'scrollvars/styles/ui.css'      // marquee, accordion, 1.1 KB gz
```

## Pay for what you use

The package is fully tree-shakeable (ESM, side-effect-free JS); measured
<!-- sizes:start -->
Named imports for `track` / `track` + `scan`; other rows are complete module entries, measured from dist by `scripts/docs-stamp.mjs` (JS min+gzip, CSS gzip as shipped):

| you import | JS on the wire |
| --- | --- |
| `track` (the driver) | 3.0 KB |
| `track` + `scan` (zero-wrapper mode) | 4.3 KB |
| `slider` | 2.3 KB |
| `trackPointer` | 0.5 KB |
| `mountEffect` (canvas) | 1.6 KB |
| everything in `scrollvars` (the core entry) | 7.1 KB |
| `scrollvars/react` (wrappers + kit, React external) | 12.9 KB |
<!-- sizes:end -->

A typical page (reveals + stagger) ships `track` + `styles/core.css`:
**~5.4 KB gzipped, total.**

## Mental model

<!-- vars:start -->
The driver **tracks** elements and writes these outputs (anything that reads them is a preset):

| output | range | meaning |
| --- | --- | --- |
| `--sv-view` | −1 → 0 → 1 | Below the live band → inside it (flat at 0) → gone above |
| `--sv-t` | 0 → 1 | Travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | Progress across a pinned (sticky) stretch: curtains, rails, scrubbing |
| `--sv-stage-width` | px | Measured inner width of a pinned .sv-stage; the rail uses it instead of the window width |
| `--sv-scene` | 0 → n−1 | Scene index of a pinned section, eased and snapped |
| `--sv-scenes` | n | Scene count, next to `--sv-scene`: progress is `var(--sv-scene) / (var(--sv-scenes) - 1)` |
| `--sv-page` / `--sv-v` | 0 → 1 / ±20 viewport-heights/s | On `<html>` once anything is tracked: progress through the document, and signed velocity in viewport-heights per second, clamped to ±20, back to 0 within ~80 ms of the last scroll event |
| `--mx` / `--my` | −1 → 1 | Pointer offset from the element's center, clamped (pointer module) |
| `.sv-live` | class | On while inside the activation band (enter 75%, exit 25% of the viewport); `once` latches it |

Derived by presets and components, not the driver: `--sv-r` (sv-range slice), `--sd` and `--sv-progress` (slider), `--sv-state` (toggles), `--sv-act` (sv-acts).
<!-- vars:end -->

The opt-in outputs are not written by default: `--sv-t` needs
`travel: true` (or `data-sv-travel`), `--sv-pin` needs `pin` (or
`data-sv-pin`), `--sv-scene` (and `--sv-scenes` next to it) needs `scenes`
greater than 1 (or `data-sv-scenes="4"`), `--mx`/`--my` need the pointer
module (`trackPointer()` / `usePointer`). Skip the option and the driver
never writes that variable.

Anything that reads them is a preset. The shipped ones:

| Class | Effect |
| --- | --- |
| `sv-rise` / `sv-fade` / `sv-slide-l` / `sv-slide-r` | Entrance transitions, triggered by `.sv-live` |
| `sv-auto` (on the container) | Every direct child rises in DOM order, no classes on children (`sv-skip` opts out); the first 10 children get their own beat (orders 0 to 9), children beyond 10 share order 10 |
| `sv-drift` | Continuous drift tied to `--sv-view`. Follows the finger, no transition |
| `sv-spread` | Centered deck fans out into its flex row, `.sv-spread-in` plays on arrival, or map `--sv-spread` from `--sv-t` (needs `travel: true` on the tracker) to scrub |
| `sv-view-fade` / `sv-view-rise` | Pure CSS, zero JS, where `animation-timeline: view()` exists |
| `sv-deck` | Pinned card pile: each child flies away across its slice of the pin (`--sv-count`) |
| `sv-reading` | Guided reading: word spans lit progressively across the pin (`--sv-count` + `--sv-order`); unread words sit at `--sv-reading-floor` (.55 keeps 4.5:1 on the default dark palette, check your own colors; .13 for drama) |
| `sv-counter` | Integer counted up by the scroll via `@property` + `counter()`. Set `--sv-max` |

Knobs (set anywhere in CSS or inline; the defaults live at zero specificity, so a `:root` override always wins): `--sv-distance` (travel length), `--sv-order` (stagger position), `--sv-stagger`, `--sv-duration`, `--sv-ease`. Exception: for auto-ordered children `--sv-order` is declared on the child itself, by `.sv-auto > :nth-child(n)` and `.sv-stagger > :nth-child(n)`, and a value inherited from `:root` never applies where the child declares its own. Those rules are (0,2,0), so overriding one takes an inline `style="--sv-order: 3"` or a rule at least as specific: a plain `.card { --sv-order: 3 }` loses (or skip `sv-auto`/`sv-stagger` and order by hand).

Pinning: `data-sv-pin="320vh"` (or `pin: '320vh'` / `<Track pin="320vh">`) sets the height and, when the wrapper is static, `position: relative` (authored positioning is kept); put `class="sv-stage"` on the sticky child. That is the whole pinned skeleton, and it returns to flow without JS, under reduced motion, or below the individual-transform floor without `compat()`. Sticky header? `:root { --sv-pin-offset: 64px }`: the stage sits below it and the pin math starts there. The driver reads the stage's computed `top`, so CSS resolves `calc()`, `env()`, percentages and viewport units in the actual layout. Without a `.sv-stage` (custom `onPin` markup), only px, rem (root font-size), em (the wrapper's font-size), vh (svh, lvh and dvh resolve like vh) and vw resolve in the fallback parser; use a stage for other lengths.

For content that might exceed the stage (CMS copy, text zoom), wrap its layout in `<div class="sv-stage"><div data-sv-fit>…</div></div>`. If that inner box exceeds the available height, the driver marks the tracker `data-sv-flow`, restores its authored height and position, and the pin presets return to flow. This stays latched until retracked; `onFlow(boolean)` reports the initial state and fallback so custom media can release `inert`. TimelineScrub and StickySteps include it.

## React

```tsx
import { Reveal, Parallax, Scenes, Item } from 'scrollvars/react'

// Entrance: children stagger automatically
<Reveal as="section" auto>
  <h2>Title</h2>
  <p>Copy</p>
  <button>CTA</button>
</Reveal>

// Continuous drift
<Parallax distance="10rem">
  <img src="…" alt="" />
</Parallax>

// Knobs are attributes: sugar for the CSS variables (no style ceremony)
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
      <i aria-hidden="true" style={{ display: 'block', height: 4, background: 'currentColor', transformOrigin: 'left', scale: 'calc(var(--sv-scene) / 3) 1' }} />
    </div>
  )}
</Scenes>
```

Lower level: `<Track>` (the base component) and `useTrack(options)` / `useScenes(count)`.

**Zero-wrapper mode:** drop one `<ScrollVarsBoot />` in the root layout and write
plain server components with `data-sv` attributes. No client wrappers anywhere:

```tsx
// app/layout.tsx
<body><ScrollVarsBoot />{children}</body>

// any RSC: stays on the server
<section data-sv data-sv-once>
  <h2 className="sv-rise">Title</h2>
</section>
```

Attributes: `data-sv` (track), `data-sv-once`, `data-sv-pin`, `data-sv-travel`,
`data-sv-scenes="4"`. New nodes from route changes are picked up automatically
(vanilla: `scan()`).

One more attribute is the driver's own, not yours to set: `data-sv-off`, the
released twin of `html.sv-on`. It lands on a released element (an unmounted
`<Track>`, a stopped `scan()`) and comes off the moment that element is
tracked again; it settles every preset under it to the no-JS rendering
(curtains gone, deck unstacked, `sv-range` finished, `.sv-stage` back in
flow). A released ancestor still holding a tracked descendant keeps waiting:
it only takes the marker once nothing inside it is tracked any more. A
settled `once` entry never takes this marker either: it keeps `sv-live` and
the inline `--sv-live: 1`, so it stays live and untracked instead of
released.

`scrollvars/compat`'s `compat()` writes one more, `data-sv-compat` on
`<html>`, only when its fallback stylesheet actually installs (never a
marker you set by hand). It changes what the below-the-floor net in
`styles/pin.css` releases: see Browser support.

## The fx gallery: copy-paste effects (+ shadcn-style CLI)

A growing library of effects at **https://scrollvars.dev/fx/**. Each
one live, with Tailwind, CSS and React formats, knobs documented, and a
machine-readable [fx/llms.txt](https://scrollvars.dev/fx/llms.txt)
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

Batteries-included wrappers over the same engine. Less React, less JS,
less CSS than the usual suspects:

```tsx
import { Slider, Slide, Marquee, Accordion, Modal } from 'scrollvars/react'

// the Swiper replacement: breakpoints ARE media queries (or a familiar map):
<Slider perView={{ base: 1.2, md: 2.5, xl: 4 }} gap={16} arrows dots autoplay={5000}>
  {cards.map(c => <Slide key={c.id}><Card {...c} /></Slide>)}
  <Slide span={2}>a wide feature slide</Slide>   {/* per-slide override */}
</Slider>

<Marquee speed={24}>{logos}</Marquee>            // infinite strip, pauses on hover
<Accordion title="Question?" group="faq">…</Accordion>  // native <details>, animated
<Modal open={open} onClose={…}>…</Modal>         // native <dialog> + sv-pop
```

**Customizing the Slider chrome**: three layers, pick your depth:
1. **Var knobs** (`--sv-arrow-size/-inset/-bg/-color/-radius`, `--sv-dot-size/
   -gap/-color/-active`, `--sv-dots-justify/-offset`). Set on `:root` for the
   whole project, or on one slider via className/style.
2. **Stable classes** (`sv-slider-shell`, `sv-arrow[-prev/-next]`, `sv-dots`,
   `sv-dot.on`). Restyle or reposition freely in project CSS.
3. **Full control**: `prevIcon`/`nextIcon`, `renderDot(i, active)`, or turn the
   chrome off and drive an external UI through the ref (`SliderHandle`:
   next/prev/goTo/seek/state) placed anywhere in the page.

`perView` fractional gives the peek (`1.2`); responsive via the map above,
media queries, or Tailwind: `className="sv-cols [--sv-per-view:1.2] md:[--sv-per-view:2.5]"`
(`sv-cols` does the column math whether it sits on the slider itself or one
level up on the Slider shell, where React's `className` prop lands;
`perView` adds the class for you automatically).
Vars cascade, so every knob has a global default and a per-instance (or
per-slide) override. No `loop` in v1: where Swiper's loop is used, a
`<Marquee>` is usually the honest fit.

## Slider (Swiper, featherweight)

Native scroll + scroll-snap do the carousel; the module adds mouse drag,
the active-slide observer and controls. Slides get `--sd` (signed distance
from center, in slide widths) and `.sv-active`. Any CSS reading them
animates the carousel with no per-frame JS of yours (the slider itself measures `--sd` on scroll frames):

```tsx
const { ref, active, next, prev } = useSlider()   // or slider(el) in vanilla
<div ref={ref}>{slides.map(…)}</div>

/* coverflow in two lines */
.slide { scale: calc(1 - min(max(var(--sd), -1 * var(--sd)) * 0.12, 0.3)); opacity: calc(1 - abs(var(--sd)) * 0.35); }
```

Options: `snap: 'mandatory' | 'proximity'`, `drag: false`, `duration` (glide
settle ms; default 600: raise for softer), `axis: 'y'` (vertical),
`onScroll(state)` (full state per frame: active/count/position/progress/
dragging/gliding. Also on the container as `--sv-progress`). Two return
shapes: `slider(el)` returns the handle itself, `next/prev/goTo/seek/active/
state/destroy`; `useSlider()` returns `{ ref, active, next, prev, goTo,
handle }`, where `handle` is a ref to that same handle for `seek`, `state`
and `destroy`.

Chain two sliders (Swiper's controller/thumbs, one line, unidirectional):

```ts
const thumbs = slider(thumbsEl, { axis: 'y', drag: false })  // author it with scroll-snap-type: none
slider(mainEl, { onScroll: (s) => thumbs.seek(s.progress) })
```

Size, measured: this module 2.3 KB gzip; Swiper 11 bundle
151 KB min / 42 KB gzip (+ 18 KB CSS).

## Interaction states (click)

The third input. One delegated listener turns clicks into classes and
variables; CSS animates: same contract as scroll:

```html
<button data-sv-toggle="sv-open" data-sv-target="#menu">menu</button>
<nav id="menu" class="sv-pop">…</nav>   <!-- animated show/hide, aria-expanded synced -->
```

`<ScrollVarsBoot />` wires it automatically (vanilla: `toggles()`). Presets in
`styles/state.css`:

- `sv-pop`: entry/exit for `[popover]`, `<dialog>` and class-toggled panels
  via `@starting-style` + `allow-discrete` (the modern replacement for the
  checkbox hack. With accessibility the hack never had)
- `sv-words`. Rotating words: a clipped column, slide with `--sv-word: n`

**Multi-act sequences**: `sv-acts` is a time-driven master clock in pure
CSS: a registered custom property transitions 0 → N when the class arrives
(`sv-open` from a click, or `sv-live` from the scroll. Timed choreography
with zero JS). Acts are the same `clamp()` slices the scroll scenes use, so
one idiom drives every timeline; the clock is reversible and interruptible
(class removed mid-flight = the transition retargets, no restart). What it
deliberately doesn't do: branching, per-act JS callbacks, physics. That's
GSAP.

```css
.hero { --a1: clamp(0, var(--sv-act), 1); --a2: clamp(0, calc(var(--sv-act) - 1), 1); }
.hero h1 { opacity: var(--a1); translate: 0 calc((1 - var(--a1)) * 2rem); }
.hero .cards { scale: calc(0.9 + var(--a2) * 0.1); }
```

Three tricks worth knowing before writing any JS: on an element the driver
does not track (a hand-flipped `.sv`, a `toggles()`-driven widget), removing
`sv-live` and adding it back on the next frame replays the whole entrance
system on demand; on a tracked (or released) element the driver pins
`--sv-live` inline, which outranks a rule of your own without `!important`,
so re-tracking is what replays the entrance there instead. A settled
`once` entry carries that same inline value without being tracked or
released, so the class trick alone cannot replay it there; re-tracking
still can, exactly as on a tracked element. Two shapes it cannot replay:
entrance CSS of your own that hard-codes its duration instead of reading
`--sv-duration`/`--sv-stagger`, and `--sv-duration` or `--sv-stagger`
declared on a DESCENDANT rather than inherited from the tracked element,
which is what `<Item duration>` and `<Split duration>` emit (a bare
`<Split>`, or a descendant `--sv-order`/`--sv-distance`, replays fine).
Neither one enters: re-tracked from a plain task (a click handler, an
effect body) nothing visibly changes, and from inside a rAF callback they
dip and reverse instead. `:has()` puts
state anywhere (`body:has(#tab-2:checked) .panel-2`); the Popover API
opens/closes with zero JS. One-shot intros on load are plain CSS keyframes.
Timed multi-act sequences are `sv-acts` (above); branching, physics or
callback-heavy timelines remain GSAP's turf.

## Pointer tilt

Same philosophy, different input: the pointer becomes `--mx`/`--my` (−1..1 from each card's center):

```tsx
const ref = usePointer()          // or trackPointer(container) in vanilla
<div ref={ref} className="grid">
  <div className="sv-tilt">…</div>   {/* tilt + glare from styles.css */}
</div>
```

## Video scrub & WebGL

`onTravel` fires on every driver frame while the element is near the viewport, with the raw 0..1 value. Feed it to whatever JS needs to follow the scroll. Track it with a custom `root` and that near-viewport culling never applies, by design: the callback fires every frame no matter where the root itself sits on screen.

```tsx
useTrack({ onTravel: (t) => drawFrame(Math.round(t * (frames.length - 1))) }) // frame sequence, never video.currentTime
useScenes(4, {})            // or drive an R3F camera from onScene / onTravel
```

## Canvas effects (`scrollvars/canvas`)

For ambient canvas work (particle spheres, generative heroes) the simulation is
yours. The harness handles the lifecycle everyone rewrites badly: resize, DPR
cap, delta-time loop, **pause when offscreen or the tab is hidden**,
`prefers-reduced-motion`, cleanup. Drawing space is CSS pixels.

```tsx
const ref = useCanvasEffect({
  setup: (fx) => { points = makeSphere(1000) },
  frame: (fx, dt) => {
    if (!fx.ctx) return // typed nullable: `context: null` effects own the canvas
    fx.ctx.clearRect(0, 0, fx.width, fx.height)
    angle += (fx.reducedMotion ? 0.05 : 1) * dt
    drawSphere(fx.ctx, points, angle)
  },
})
<canvas ref={ref} className="h-full w-full" />
```

Vanilla: `mountEffect(canvas, { setup, frame })` returns
`{ pause, resume, destroy }`. Feed it scroll/pointer inputs from the driver
(`onTravel`, `--mx`) through your own closure. The modules stay decoupled.

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
| Stagger step | `--sv-stagger: 90ms` | styles.css |
| Entrance duration | `--sv-duration: 800ms` | styles.css |
| Slider glide settle | `duration: 600` ms (exponential lerp) | slider |
| Slider wheel-quiet window | 200 ms | slider |
| Canvas DPR cap | 2 (`dprCap`) | canvas harness |

## Sequenced scrub (`sv-range`): choreography without a timeline

The routine reason a timeline library gets pulled into a scroll page is not
springs. It is "A animates over 0–40% of the pin, B over 30–70%, C over
60–100%". `sv-range` derives a per-child `--sv-r` (0..1) from a slice of the
parent clock (`--sv-pin` when pinned, else `--sv-t`):

```html
<div data-sv data-sv-pin="320vh">
  <div class="sv-stage">
    <div class="sv-range sv-range-rise">
      <h2 style="--sv-from: 0; --sv-to: .4">First</h2>
      <p style="--sv-from: .3; --sv-to: .7">Second</p>
      <p style="--sv-from: .6; --sv-to: 1">Third</p>
    </div>
  </div>
</div>
```

`sv-range-rise` is the ready-made flavor (rise + fade per range); or consume
`--sv-r` yourself: always as `var(--sv-r, 1)`: the derivation needs calc()
division by a variable (Chrome 112 / Safari 16.4 / FF 112). `--sv-r` is a
registered property (`@property`, `initial-value: 1`), so an engine that
can't compute the division resolves it to that initial value instead of
turning invalid; the `var(--sv-r, 1)` you write is habit, not the reason
older engines settle at the end state, and never fires on your range
children either way, since `--sv-r` is always set. The JS twin is
`mapRange(t, from, to, ease?)` for `onTravel`/`onPin` consumers (canvas,
WebGL uniforms). Overlapping ranges are fine: that is the point.

## Nested scrollers & custom live band

`track(el, { root: scrollerEl })` measures against an inner scroll container
instead of the window, brand-center layouts with inner panels stop being a
disqualifier (the capture-phase listener already hears those scrolls; `root`
makes the geometry agree). A root with borders is measured from its client
box, inside the border, so `track()`'s pin math and `scrollToScene()`'s
scroll target share one origin. `enter`/`exit` (fractions, defaults
0.75/0.25) tune the live band per element. Also as `data-sv-enter="0.6"` /
`data-sv-exit="0.2"` in zero-wrapper mode and as props on `<Track>`/
`<Reveal>`. A `.sv-stage` pinned inside a root reads `--sv-stage-height`
instead of the default `100vh`: set it to the root's own height.

## When to use what

The honest boundary: ScrollVars maps **inputs to values**. If the animation
happens because the *user did something* (scroll, pointer, gesture), it does
the job at a fraction of the cost. If it happens because *time passes*, use
the tools built for that.

| You need | Use |
| --- | --- |
| Reveals, parallax, pinned stories, scrubbing, carousels, tilt, camera paths | **ScrollVars** |
| Orchestrated timelines (`tl.to(a).to(b, "-=0.2")`), elastic/bounce easings, SVG morphing, animating arbitrary JS values | **GSAP** |
| Interruptible spring physics, layout/`layoutId` "magic motion", exit animations on React unmount, `whileDrag` gestures | **Framer Motion** |
| A one-shot intro that plays on load | plain **CSS keyframes** (before reaching for a library) |

Known gaps inside ScrollVars' own territory (candidates for 1.x, tell us if
you hit them): declared smooth-scroll (Lenis) interop and a `loop` mode for
the slider. (Pinning got its helper in 1.13, text splitting shipped in 1.12.)
(Nested scrollers work since 1.7. The driver listens in the capture phase.)

Mixing is fine: GSAP for one intro timeline + ScrollVars for everything
scroll-driven coexist without conflict. That page just gives up the bundle
argument.

## Browser support

The floor is set by two things: the dist ships ES2020 (optional chaining) and
the presets use individual transform properties (`translate:`/`rotate:`/`scale:`).

| Browser | Fully animated | Notes |
| --- | --- | --- |
| Chrome / Edge | **104+** (Aug 2022) | `sv-view-*` native zero-JS tier: 115+ |
| Firefox | **78+** (Jun 2020, `:is()`/`:where()`) | `sv-counter` preset needs 128+ (Jul 2024) |
| Safari / iOS | **14.1+** (Apr 2021) | `sv-counter` preset needs 16.4+ (Mar 2023) |
| Anything older, or no JS | content 100% visible, static | `html.sv-on` guard for no JS. With JS running below the transform floor and without `compat()`, `pin.css`'s own net keeps the stage, curtains and deck in flow and readable (see below); with `compat()` installed the stage stays pinned instead, so its own fallback keeps animating the curtains and rail, and content taller than the stage clips there (see below); `sv-rail` is the one exception either way, its track stays unwrapped and can run past the viewport edge, reachable by a page-wide horizontal scroll; `compat()`'s rail fallback ignores `--sv-rail-start` and starts at `translateX(0)` instead of offscreen, so it is stationary whenever the track's own width equals the viewport |

The component kit (Modal, Accordion, `sv-pop`, `sv-acts`) additionally uses `<dialog>`, `inert`, `@starting-style` and `@property`; older engines render those pieces static: closed panels stay closed, open ones open, no animation, and a Modal without `<dialog>` support is an open static panel: `state.css` deliberately hides nothing there, and the `open` attribute tracks state in both directions so your own CSS can hide it. Under reduced motion the driver zeroes `--sv-view`, the travel/pin/scene clocks keep scrubbing (scroll-linked, not motion), entrances show their final state and pinned stages return to flow.

Below the transform floor, with JS still running, `styles/pin.css` carries
its own `@supports not (translate: 0)` net, but only for four of its rules:
the stage, both curtains and the deck. The curtains sit parted and static
rather than animated, the deck unstacks to a static, non-overlapping
layout, and, without `compat()` installed, the stage resets to flow so
nothing is clipped by the stage itself (`sv-reading`, `sv-range` and
`sv-counter` need no net of their own, they settle for unrelated reasons).
With `compat()` installed the net exempts `.sv-stage` instead (its own
`data-sv-compat` marker on `<html>` is the switch): the module's fallback
sheet still animates the curtains and rail from `--sv-pin`, measured off
that stage, so releasing it there would snap them over one pixel instead.
The trade is real: measured on a four-card `sv-deck` pinned below the
floor with `compat()` installed, the stage stayed a fixed height while the
deck unstacked to its full static column, so cards three and four sat
past the clip, unreachable, for the roughly 1800px of scroll the pin
still consumed doing nothing visible. A page whose below-floor deck
matters more than its below-floor animation gets the flow layout back by
not calling `compat()` there, the same escape the closing paragraph below
already promises. `sv-rail` stays the one exception either way:
with JS running the no-JS guard's `width: auto; flex-wrap: wrap` does not
apply, so a track built wider than the viewport runs past the right edge,
reachable only by a page-wide horizontal scroll, and not at all under an
`overflow-x: hidden` ancestor. `compat()`'s own `sv-rail` fallback does
not really fix that: it ignores `--sv-rail-start`, starts at
`translateX(0)` instead of entering from offscreen, and is stationary
whenever the track's own width equals the viewport, so wrap the rail
yourself below the floor regardless. One
more caveat until ADU-150 lands: a released stage can also leave a parked
curtain panel sitting outside it, extending the document so a reader can
scroll sideways to an empty panel.

**Extended floor**: `scrollvars/compat`, an opt-in module for legacy
targets. On modern browsers it runs three feature checks (ResizeObserver, IntersectionObserver, individual transforms) and exits (free);
on old ones it installs a ResizeObserver stub (viewport-resize backed), an
always-visible IntersectionObserver stub, and a `transform:`-based fallback
stylesheet for
the reveal presets (`sv-rise`, `sv-fade`, `sv-slide-l`, `sv-slide-r`,
`sv-auto`, `sv-drift`) and the pin presets `sv-curtain-l`, `sv-curtain-r`
and `sv-rail`
(written without `:is()`/`clamp()`/`min()`;
the one `max()` left, drift's fade, sits behind a plain `opacity`
declaration that old parsers keep). `sv-deck` unstacks to a static,
non-overlapping layout instead of animating (its fly-away slice needs
`clamp()`); `sv-spread` stays static below the floor too, no fallback
rule, its rule parses fine but has no `translate`/`rotate` to apply down
there. `sv-split-rise` has no fallback rule either, but its floor is not
one line: below `:is()` support its animating rule, written with `:is()`,
is dropped whole by a parser that predates it, fully static; between
`:is()` support and the individual-transform floor the rule still
matches and its `opacity` declaration still transitions, so the text
fades in without rising.
Text splitting itself still works down to the same floor: `split()`
no longer depends on `Array.prototype.flatMap`, missing on Chrome 61-68 and
Safari 11. Combined with your bundler downleveling the ES2020 dist (Next.js
already does per browserslist), the reveal and pin presets above animate
on roughly Chrome 61+ / Firefox 60+ / Safari 11+; `sv-deck`,
`sv-spread`, `sv-counter` and `sv-view-*` stay static or
progressive. Call it once, before anything else:

```ts
import { compat } from 'scrollvars/compat'
compat()
```

Per-module gates, if you need finer grain: driver = ES2020 + ResizeObserver
(Safari 13.1); presets = individual transform properties (Chrome 104 /
Firefox 78 / Safari 14.1); canvas harness adds IntersectionObserver
(Safari 12.1); slider/pointer = Pointer Events (Safari 13). The design rule
that makes the table safe for companies: **the supported presets fail visible when their feature gates are unmet.**
Consumer code and the React version have their own JavaScript/browser requirements;
transpilation alone does not polyfill runtime APIs. Skip `compat()` for static rendering; nothing
overlapping or clipped (curtains parted, deck unstacked, `.sv-stage` back
in flow; `sv-rail`'s own exception is above); call it and the page animates instead, on roughly
Chrome 61+ / Firefox 60+ / Safari 11+. Animation is progressive
enhancement, never a dependency.

## Declarative pointer and timing knobs

`scan()` / `<ScrollVarsBoot />` also owns `[data-sv-pointer]` containers, including an element passed as the scan root. Empty `data-sv-pointer` delegates to `.sv-tilt`; `data-sv-pointer=".card"` selects another target. Added subtrees attach automatically; removal or stopping the scan releases their listeners and pointer values. Attributes are read on mount, not watched for changes.

`data-sv-duration="800ms"`, `data-sv-stagger="100ms"` and `data-sv-ease="ease-out"` map to their CSS variables. Timing attributes take CSS units; React's numeric timing props take milliseconds.

`<Slider nonce={nonce} perView={{base: 1, md: 3}}>` passes the nonce to its generated responsive stylesheet. Autoplay pauses on hover, stops on keyboard focus until explicitly resumed, and sets its live region to polite while paused. `<Marquee>` includes a keyboard-operable “Pause animation” toggle (`aria-pressed`); it stays static without its click driver. The bare `.sv-marquee` CSS class remains an ambient animation: supply a pause control when using it directly. `toggles()` synchronizes an existing `aria-pressed` instead of `aria-expanded` for pressed-state buttons.

## License

MIT
