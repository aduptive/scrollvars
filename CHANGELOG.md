# Changelog

## 1.13.0 (2026-09-05)

Second source-level review round (Kimi K3 and Codex gpt-6-astra on a clean
clone): every confirmed defect fixed, plus the primitives both reviewers
said premium sections would need.

### Sections in the fx gallery
- New category **Sections**: `hero-cinematic`, `timeline-scrub`,
  `sticky-steps`, `stats-countup`. Whole blocks built only on the presets,
  each with CSS / Tailwind / React snippets and a CLI component
  (`npx scrollvars add <slug>`). They are also the dogfooding that surfaced
  the items below.

### Driver
- `--sv-page` (0..1 through the document) and `--sv-v` (signed velocity in
  viewport-heights per second, decays to 0 after the scroll stops) are written
  on `<html>` every frame: reading-progress bars and skew/stretch effects need
  no JS.
- `--sv-scenes` (the scene count) is written next to `--sv-scene`, so a
  progress bar is `calc(var(--sv-scene) / (var(--sv-scenes) - 1))` instead of a
  hard-coded divisor.
- Pin helper: `pin: '320vh'` / `data-sv-pin="320vh"` / `<Track pin="320vh">`
  sets the wrapper's height and `position: relative`; with the new `.sv-stage`
  preset (sticky viewport) the pinned skeleton is no longer hand-written.
  Under reduced motion the wrapper stays in flow.
- Culling now gives every entry one geometry pass on a scroll jump longer than
  a viewport (anchors, `scrollTo`, restored positions): an element carried from
  far below to far above no longer keeps stale variables.
- `html.sv-on` lands last, after every observer is built, and never if the
  `ResizeObserver` constructor throws. `window.__scrollvars` marks arrival.
- `scrollToScene` uses the rendered height (like the pin math) and takes an
  optional `root` scroller; `useScenes().goTo` passes the root it tracks with.

### React
- `<ScrollVarsBoot />` renders a tiny pre-paint script: `html.sv-on` is set
  before first paint (no visible-then-hidden flash on SSR entrances) and
  removed again after 3s if the driver never booted. Place it first in
  `<body>`.
- `<Scenes>` forwards `root`, `enter`, `exit`; its stage is `.sv-stage` and
  returns to flow under reduced motion.
- `useTrack` only hands the driver an `onScene` when the consumer has one, so
  `once` entries are actually released.
- Slider autoplay wraps when the rail reaches its end (multi-slide views never
  make the last slide active), and pauses on focus anywhere in the shell
  (arrows, dots, pause button), not only inside the rail.

### Slider
- Geometry is rect-based and container-local: active slide and `goTo` targets
  no longer depend on which ancestor is the `offsetParent`; RTL mirrors
  against the container's own right edge.
- `goTo(i, false)` after `seek()`, and a plain click that interrupted a glide,
  restore the authored `scroll-snap-type`.
- Orientation/drag classes follow the options on re-init and are removed on
  `destroy()`; `state().position` is clamped to `count - 1`.

### Presets and no-JS
- Knob defaults moved from `.sv` to `:where(:root)`: an author `:root`
  override now wins regardless of import order.
- `.sv` resets `--sv-pin`, so a nested tracked element never reads an
  ancestor's pin clock.
- Split entrances get the nested-ownership guard; the reduced-motion override
  now outranks the nested hide rules.
- SSR markup carries `.sv` before the driver runs: rail, deck, curtain,
  reading, counter, spread and acts render their finished state without JS
  (`html:not(.sv-on)` rules). `--sv-r` is a registered property (initial 1).
- `.sv-tilt` angle is a knob: `--sv-tilt` (default 14deg).
- compat: the transform fallback honours `sv-skip`; the ResizeObserver shim
  delivers an initial observation, so legacy canvases start.

### Sticky headers, knobs, interaction
- `--sv-pin-offset` (one CSS declaration, e.g. `:root { --sv-pin-offset: 64px }`)
  is read by both `.sv-stage` and the driver's pin math, so a sticky header no
  longer breaks pinned sections; `scrollToScene` accounts for it too.
- `--sv-rail-start` (rail inside a narrower stage), `--sv-reading-floor`
  (default .55 so unread words keep a 4.5:1 contrast; was .13), and the
  sv-range clock now lives on the container at zero specificity, so
  `.mine { --sv-clock: var(--sv-t) }` overrides it.
- StickySteps marks inactive shots `inert` + `aria-hidden` after mount, so a
  crossfaded shot cannot keep focusable links.
- e2e invariants: an SSR-shaped sweep (`.sv` already on the markup, no JS) and
  a reduced-motion sweep (JS on, whole page scrolled) over every fx page.
- Home page: `<main>` landmark; the guided-reading demo passes color-contrast.

### Canvas, debug, CLI, split
- `setup()` may return a cleanup, called on `destroy()`; `resize()` also runs
  once after `setup()`. The three-scene component disposes its GPU resources.
- Debug overlay renders element names as text, never markup.
- CLI: a flag value is not a positional (`add --dir src/ui marquee` works),
  registry file names are validated as bare names, the fallback registry is
  the real second host.
- `split(…, { by: 'char' })` splits on grapheme clusters when
  `Intl.Segmenter` exists (emoji and combining marks stay whole).
- `--mx`/`--my` are clamped to -1..1.

### One source for the shared facts
- `scripts/docs-data.mjs` holds the variables table and measures every size at
  build; `docs-stamp.mjs` writes them into README and AGENTS between markers,
  generates `demo/llms.txt` from AGENTS.md, and `bench-tables.mjs` stamps the
  benchmark table into README, AGENTS and the bench page from the committed
  results. CI fails if any of those files differ from what the build produces.
- The gallery data (`EFFECTS`, `COMPONENTS`) lives in `scripts/fx-data.mjs`
  with no side effects; `test/cli-components.test.mjs` compiles all 16 CLI
  components with esbuild, renders the React ones with `react-dom/server`, and
  checks that each uses the preset vocabulary its preview shows.
- Registry entries declare `requires` (stylesheets, peer deps, minimum
  scrollvars); `npx scrollvars add` prints them and checks the installed
  version.
- Slider tests for a rail inside a positioned ancestor and for a vertical rail.

### Docs and release
- Sizes re-measured and stated once: ESM core 4.3 KB gz, driver 1.4, slider
  1.8, stylesheets core 1.9 / pin 1.8 / slider 1.3 / tilt 0.5 / state 1.5 /
  ui 0.8. Stale claims fixed across README, AGENTS, llms.txt, docs, fx
  recipes (rotating-words `vertical-align`, split's sr-only span, "SplitText
  gap", `.sv-open` toggle example, Parallax reads `--sv-view`, and more).
- e2e invariants: every fx page must render every text node without JS; the
  split invariant follows the sr-only contract.
- Release workflow fails when CHANGELOG has no entry for the tagged version.
- Brand name is written ScrollVars in prose; every identifier stays
  `scrollvars`.

## 1.12.4 (2026-09-02)

- `<Split>` / `split()` drop `aria-label` on the container (axe
  `aria-prohibited-attr` on generic roles); the full text stays in a
  visually-hidden span, the animated spans are `aria-hidden`.

## 1.12.3 (2026-09-01)

Fixes a regression from 1.7.0's drag-click fix.

- **Slider: mouse drag no longer fights native text-selection.** 1.7.0
  removed `preventDefault()` from `pointerdown` to stop drags from eating
  clicks on links/buttons inside slides. But that also removed the only
  thing killing the browser's native text-selection-drag. Without it, a
  drag that leaves the container starts a live selection, and the browser
  auto-scrolls toward the pointer to extend it. Fighting the slider's own
  `scrollLeft` writes every frame (visible as jitter/trembling, plus
  visible text selection). Fix: `preventDefault()` is back on `pointerdown`
  for mouse (kills selection-drag at the source, same as pre-1.7.0), and
  the one real side effect. It also suppresses the browser's native
  focus-on-mousedown. Is repaired by manually restoring focus in `endDrag`
  when the press turns out to be a plain click, not a drag. The click event
  itself was never suppressed by `preventDefault` (confirmed in 1.7.0's own
  fix notes), so link/button activation was never at risk. Only focus was.
  Verified with a real mouse-drag test (Puppeteer, dragging 480px outside
  the slider): zero text selection, smooth monotonic `scrollLeft`, no
  jitter. And a unit test locks in both halves (preventDefault fires,
  focus restores on a plain click) so this can't quietly regress again.


## 1.12.0 (2026-08-27)

The last executable items from the review panel's path-to-9, plus launch
readiness.

- **`split`: SplitText-lite.** Word/char spans carrying `--sv-order`
  (+ `--sv-count` on the container), aria-label kept, spans aria-hidden,
  fully restorable. Zero-wrapper: `data-sv-split` / `data-sv-split="char"`.
  React: `<Split>` renders the spans **on the server**. No client-side
  splitting, no layout shift, no hydration flash. New presets `sv-split` /
  `sv-split-rise`; pairs with `sv-reading` for scrubbed text. New fx entry
  + CLI component: `split-reveal`.
- **Progressive-enhancement invariants, proven.** `npm run test:e2e`
  (harness): no-JS renders complete, nothing is ever hidden before
  `html.sv-on` exists (probed from the first frame), attribute knobs land.
  All green; wired into CI.
- **CI** (GitHub Actions): build + 21 unit tests + the e2e invariants on
  every push/PR.
- **Low-end bench profile**: the harness runs the 4× CPU-throttle suite
  headful (headless Chrome never produces frames under throttle. Found
  the hard way) and publishes `results/throttled-4x.json` + a table on
  /bench/.
- **Launch assets**: og:image social card on every page, README hero GIF
  (generated by `harness/make-gif.mjs` from a real scroll), and
  `article/launch-kit.md`, Show HN, thread, newsletter pitch, ready to
  fire on publish day.
- `ScrollVarsBoot` mounts the debug overlay on `?sv-debug` (code-split;
  free otherwise). Release tags v1.7.0–v1.11.1 pushed.


## 1.11.1 (2026-08-27)

- **`sv-words` aligns to the text baseline at any host line-height.** The
  preset used `vertical-align: bottom`, which only lined up when the host
  line-height was ~1.15. Inside a loose-leading heading the rotating word
  sat visibly low. Now `vertical-align: baseline`: an inline flex container
  exports its first item's baseline, so the rotator self-aligns by
  construction (all words share the same metrics, so every word lands on
  it).
- Demo: the pizzeria wheel is height-driven. Px caps removed (58vh/46vw),
  and on vertical screens (`max-aspect-ratio: 1/1`) the height rules
  (52vh radius, 48vh slices) so the wheel keeps ~60vh of presence instead
  of shrinking with the width.


## 1.11.0 (2026-08-27)

- **Attribute knobs: the style attribute is now optional everywhere.**
  `data-sv-order`, `data-sv-distance`, `data-sv-from`, `data-sv-to` become
  the matching CSS variables, written once on mount by `scan()` (and for
  route-change nodes via the existing MutationObserver). Never in the
  frame loop, zero global CSS, safe for mapped CMS content where Tailwind's
  JIT can't interpolate classes. When typed CSS `attr()` settles, this
  mapping becomes pure CSS.
- Docs: "One knob, four ways" before/after table (style attr vs attribute
  vs React prop vs arbitrary class vs sv-stagger) and a Browser support
  section on /docs/. The full matrix plus the `scrollvars/compat` legacy
  answer (previously README-only).
- fx: staggered-reveal and sequenced-scrub teach the attribute path in
  their Tailwind tabs; the sequenced-scrub preview dogfoods it.


## 1.10.0 (2026-08-27)

"Hitting the ceiling never means rewriting". Interop as official recipes,
not adapter modules (no new dependencies, the scope boundary stays).

- **Canvas harness works for WebGL/Three**: `mountEffect(canvas, { context:
  null })` grabs no 2D context. Your renderer owns the canvas, the harness
  keeps the lifecycle (DPR cap, resize, pause offscreen/hidden, delta-time,
  reduced-motion, cleanup). `EffectFrame` gains `canvas`; `ctx` is null in
  that mode. `useCanvasEffect` forwards the option.
- **Two Interop fx recipes** (new gallery category): `gsap-scrub`: author a
  GSAP timeline, scrub it via `onPin` (one listener, one writer; with the
  honest per-page bundle note) (and `three-scene`) a Three.js torus-knot
  scrubbed by the pin on the harness. Both ship CLI components
  (`npx scrollvars add gsap-scrub|three-scene`).
- Docs interop section links both recipes; AGENTS/llms carry the pattern.


## 1.9.0 (2026-08-26)

Driven by the third blind-review round (Kimi K3 moved 7 → 8; the remaining
criticisms became this release).

- **Offscreen culling.** Entries far outside a one-viewport margin skip the
  per-frame `getBoundingClientRect` (IntersectionObserver-gated; entries
  with a custom `root` and `once`-completed entries are handled; tested).
  Long pages stop paying for sections nowhere near the screen. And the
  main bench scenario's total CPU flipped in scrollvars' favor with it.
- **`scrollvars/debug`**: the devtools story: a dev overlay listing every
  tracked element with live variable values, live badge, tracked-element
  outlines and click-to-scroll. `import('scrollvars/debug').then(m => m.debug())`.
- **Honest numbers, mechanically enforced.** The demo footer version and
  wire sizes are stamped at build time from the actual dist (esbuild+gzip);
  fx pages compute the engine size from the real bundle; every stale
  1.2/3.1 KB claim corrected to measured values (driver 1.4 KB gz, full
  core 3.9, slider 1.7, core.css 1.8). The demo page's inline driver is
  labeled as that page's teaching copy. The package in dist/ is the
  source of truth.
- **Benchmark: medians of 5 runs** (was 3) and a precisely-stated headline
  claim: not faster frames: the same frames for ~12× less bundle and a
  fraction of the heap, with total CPU trading blows (scrollvars wins
  shallow scenarios, batched GSAP wins deep subtrees; both published).


## 1.8.0 (2026-08-25)

The "path to 8" release. Everything the external review panel said would
move the score, minus the parts only the real world can provide.

- **`sv-range`: sequenced scrub choreography without a timeline.** Each
  child of `.sv-range` derives `--sv-r` (0..1) from its `--sv-from`/`--sv-to`
  slice of the parent clock (`--sv-pin`, else `--sv-t`); `sv-range-rise` is
  the ready-made flavor; `mapRange(t, from, to, ease?)` is the JS twin for
  `onPin`/`onTravel` consumers. Reduced motion settles ranges at the end
  state. New fx entry + CLI component: `sequenced-scrub`.
- **Custom root scroller + configurable live band.** `track(el, { root })`
  measures against an inner scroll container (root rects read once per root
  per frame, still strictly read-then-write); `enter`/`exit` options: also
  `data-sv-enter`/`data-sv-exit` and `<Track>` props. Replace the
  hard-coded 75%/25% band.
- **Reproducible benchmark.** `demo/bench/harness` (puppeteer-core + CDP)
  reproduces every published number: symmetric pairings both directions
  (idiomatic AND batched one-trigger-per-section GSAP), medians of N runs,
  rotated engine order, calibrated CPU throttle, raw JSON committed. The
  bench page tables regenerate from `results/latest.json`
  (`scripts/bench-tables.mjs`); the inline engine resyncs from dist on
  every build; the 900-trigger Lighthouse row is labeled a stress test.
- **The style-recalc curve, published. Including where it loses.**
  `?deep=N` gives every box a realistic subtree; at 50 nodes/box the
  batched GSAP build wins total CPU. The measured curve and the authoring
  rule (keep tracked elements thin; static content next to, not inside,
  animated elements) are on /bench/ and in the docs.
- **APG carousel contract for `<Slider>`.** `role=region` +
  `aria-roledescription` + `label` prop; per-slide "i of n" annotation in
  place; visible pause/resume control whenever autoplay is set (`.sv-pause`,
  arrow knob family); `aria-live` off-while-rotating / polite otherwise;
  `renderDot` keeps focus indication. Marquee pauses on focus-within.
- **First React-layer tests**: `renderToStaticMarkup` in plain node (also
  guards SSR): carousel contract, `<Scenes>` prop hygiene, inert marquee
  duplicate. react/react-dom join as devDependencies.
- **Human docs** at /docs/: quickstart, the six variables, every export,
  preset vocabulary, coming-from-GSAP mapping (with the honest "keep GSAP"
  row), when-NOT-to-use, interop recipe, per-surface accessibility
  contract, troubleshooting, rendered changelog. Version visible on every
  gallery page.


## 1.7.0 (2026-08-25)

Fix release driven by a four-model external review panel (blind site
evaluations + source-level code reviews). Everything below was independently
found by at least one reviewer and verified before fixing.

Core driver:

- **Nested scrollers now work**: the scroll listener runs in the capture
  phase, so scrolls inside modals and inner panels reach the driver.
- **Travel/pin math uses the rendered box** (`rect.height`) instead of
  `scrollHeight`. Progress reaches 1 on fixed-height elements with
  overflowing content.
- **`once` is fire-and-forget**: after going live, entries with no
  continuous outputs (travel/pin/scenes/callbacks) stop paying the
  per-frame `getBoundingClientRect`. `--sv-view` freezes at its last value.
- `scan()`/`toggles()` no longer throw during SSR (default params were
  evaluated before the environment guard).

Slider:

- **RTL support**: positions normalize to logical coordinates (0 → range
  from the content start); arrows mirror; progress/seek/goTo correct under
  `dir="rtl"`.
- **Drag no longer eats clicks**: a 5px movement threshold separates clicks
  from drags (links and inputs inside slides work again, focus included),
  and the accidental click after a real drag is swallowed.
- Arrow keys typed into inputs inside slides no longer move the carousel.
- A glide interrupted by touch (or with `drag: false`) no longer leaves
  native snap suspended forever.
- The scripted glide respects `prefers-reduced-motion` (jumps instead).

React:

- **`<Slider ref>` works**: the forwarded handle is a stable proxy that
  delegates at call time (it was permanently `null`).
- **`<Scenes>` honors its declared props**: tracking options reach the
  driver, `onScene`/`as`/VarProps work, and nothing leaks to the DOM.
- `useSlider` forwards `onScroll` (it was typed but dropped).
- Responsive `perView` breakpoints emit in ascending order (`{xl: 4, md: 2}`
  no longer lets `md` win at desktop widths).
- Autoplay pauses while keyboard focus is inside the slider (WCAG 2.2.2)
  and reads the last IntersectionObserver record, not the first.
- The Marquee duplicate is `inert`, so its links aren't tabbable.

Canvas & pointer:

- Canvas re-applies its backing size when the monitor's DPR changes.
- Pointer tilt can't get stuck by a leave racing the queued rAF.
- Legacy-guard consistency: the canvas module uses the same optional
  `matchMedia` listener calls as the driver.

Styles & packaging:

- Nested tracked sections: a live ancestor no longer reveals entrance
  children of an inner `.sv` that hasn't gone live (plain CSS3 selectors).
- Reduced motion on `sv-deck` lays cards out in flow instead of leaving
  them stacked in one grid cell.
- The compat drift preset carries an `opacity: 1` fallback where `max()`
  doesn't parse (the advertised Chrome 61 floor).
- `sideEffects` glob is `**/*.css`, `styles/*.css` imports survive
  tree-shaking.
- `engines.node >= 18`; `pretest` builds before testing; `prepare` builds
  on git installs (`npm i github:aduptive/scrollvars` works).
- README: documented stagger default corrected to 90ms (matches the CSS).


## 1.6.0 (2026-08-24)

- **The fx gallery** (/fx/ on the demo site): a growing library of
  copy-paste effects. Live preview, Tailwind + CSS + React tabs with copy
  button, knobs documented, per-gallery llms.txt for AI ingestion. Built
  from one data file (`scripts/fx-build.mjs`); 8 seed effects.
- **shadcn-style CLI**: `npx scrollvars list` / `npx scrollvars add <slug>
  [--dir] [--force]`. Fetches a remote registry (registry.json on the fx
  site) and writes a complete component file into the project; the library
  grows without package releases.

## 1.5.0 (2026-08-24)

- **React component kit**: `<Slider>`/`<Slide>` (the Swiper replacement:
  `perView` number or responsive map. Breakpoints ARE media queries; `gap`,
  `span` per slide, arrows/dots chrome on stable classes + var knobs,
  `prevIcon`/`nextIcon`/`renderDot`, external control via ref exposing the
  full SliderHandle, `autoplay` that pauses on hover/offscreen/hidden),
  `<Marquee>` (infinite strip, the honest answer to Swiper loop),
  `<Accordion>` (native details + interpolate-size animation, exclusive
  groups via name), `<Modal>` (native dialog + sv-pop).
- CSS: `sv-cols` column sizing (`--sv-per-view`, fractional = peek;
  `--sv-span` per slide), slider chrome, `styles/ui.css` (marquee,
  accordion). `useSlider` now returns the handle and accepts
  duration/axis.

## 1.4.0 (2026-08-24)

- **`sv-spread`**: the deck-to-grid pattern: children live in their final
  flex row and a per-card translate collapses them onto the center (slight
  fan) while `--sv-spread` is 0. Two clocks: `.sv-spread-in` plays on
  arrival (sv-live + transition + stagger, re-deals on re-entry), or map
  the variable from `--sv-t`/`--sv-pin` to scrub it. Demo case 18, zero
  bespoke JS.

## 1.3.0 (2026-08-24)

- **`sv-acts`: multi-act timelines in pure CSS**: a registered custom
  property (`--sv-act`) transitions 0 → N when `sv-open` (click) or
  `sv-live` (scroll) arrives; acts are the same `clamp()` slices as the
  scroll scenes. One idiom for every timeline. Relative retiming
  (`--sv-acts-duration` rescales all acts), reversible and interruptible
  by construction. Older browsers snap to the finished state.

## 1.2.0 (2026-08-24)

- **Click states: the third input**: `toggles()` (wired by ScrollVarsBoot):
`data-sv-toggle`/`data-sv-target` flip a class, write `--sv-state` and keep
  `aria-expanded` in sync. Deliberately one click = one state change; no
  timeline engine.
- **Presets** (`styles/state.css`): `sv-pop`: popover/dialog/panel entry-exit
  via `@starting-style` + `allow-discrete`; `sv-words`: rotating words
  (clipped column, `--sv-word: n`), promoted from the pizza demo.

## 1.1.0 (2026-08-23)

- **Modular stylesheets**: `scrollvars/styles/core.css` (1.2 KB gz.
Entrances, stagger, drift, native view()-tier), `pin.css` (1.3 KB),
  `slider.css` (0.4 KB), `tilt.css` (0.5 KB). `styles.css` remains as the
  generated aggregate (scripts/build-styles.mjs). Fully backwards
  compatible, selector set verified identical.
- README "Pay for what you use": measured per-import JS costs: a typical
  reveal page ships ~2.2 KB gzipped total (track + core.css).

## 1.0.0 (2026-08-21)

- **API freeze.** The 0.x surface ships as-is: driver (`track`, `scan`,
  `slider`, `trackPointer`, `scrollToScene`, `refresh`), React layer
  (`Track/Reveal/Parallax/Scenes/Item`, `ScrollVarsBoot`, hooks, VarProps
  attribute API), `scrollvars/canvas`, `scrollvars/compat`, styles.css presets.
- `SliderState` type now exported from the root.
- Packaging: `sideEffects` scoped to CSS (bundlers no longer risk
  tree-shaking the stylesheet import), repository/homepage/bugs metadata,
  `prepublishOnly` runs build + tests. README gains a Defaults table.
- Demo tooling: `npm run demo:sync` / `demo:deploy` (dist-inline sync with
  parse checks; deploy re-points the alias and verifies). Driver core test
  suite added, 9 test files green.

## 0.12.0 (2026-08-20)

- **`scrollvars/compat`**: opt-in legacy module: ResizeObserver stub
  (viewport-resize backed), always-visible IntersectionObserver stub, and a
  `transform:`-based preset fallback stylesheet (no `:is()`/`clamp()`/
  `min()`). Free on modern browsers (feature-checks and exits). With the
  consumer bundler downleveling ES2020, the animated floor extends to
  ~Chrome 61 / Firefox 60 / Safari 11.

## 0.11.4 (2026-08-20)

- Keyboard navigation glides: arrow keys (axis-aware), Home and End go
  through the same soft glide instead of native 40px key-scroll steps +
  hard snap settle. Containers are made focusable (`tabindex=0`) so this
  works in Safari too.

## 0.11.3 (2026-08-20)

- Mouse drag: `preventDefault()` on pointerdown: native text selection was
  starting under the drag, and selection auto-scroll inside the scrollable
  container fought the gesture (the opposite-direction tug). Note: mousedown
  no longer focuses elements inside slides; irrelevant for carousels.

## 0.11.2 (2026-08-20)

- Wheel-assist only reacts when the gesture's dominant axis matches the
  slider's axis: vertical page scrolling over the carousel (trackpad
  gestures are always slightly diagonal) was triggering mid-gesture
  `goTo(nearest)` and made multi-slide travel feel impossible. Quiet
  window 160 → 200ms.

## 0.11.1 (2026-08-20)

- Mouse drag survives leaving the container: move/up listeners live on
  `window` while dragging (pointer capture on scrollable containers is
  unreliable). Release happens on the real pointerup, anywhere on the page.

## 0.11.0 (2026-08-20)

- **Slider state & chaining**: `state()` and `onScroll(state)` expose
  active/count/position (continuous)/progress/dragging/gliding; container
  gets `--sv-progress`; new `seek(progress)` for followers: two sliders
  chain in one line (Swiper controller/thumbs, unidirectional).
- **`axis: 'y'`**: vertical sliders (`.sv-slider-y`), same API.
- Size reference measured: this module 3.1 KB min / 1.4 KB gzip vs Swiper 11
  bundle 151 KB min / 42 KB gzip (+18 KB CSS).

## 0.10.3 (2026-08-20)

- Glide is now an exponential lerp (velocity ∝ remaining distance) instead of
  a fixed-duration tween: short drag-release settles feel as soft as long
  button glides. The tween front-loaded short distances and read as a dry
  snap. Retargets stay continuous. `duration` calibrates the settle time.

## 0.10.2 (2026-08-20)

- Rapid `next()`/`prev()` clicks accumulate: relative steps count from the
  in-flight glide destination (pending target), not from the lagging active
  index. Five fast clicks land five slides ahead.

## 0.10.1 (2026-08-20)

- Drag release and trackpad pan now glide too: snap is suspended via inline
  style for the whole interaction (authored inline value preserved), and a
  wheel-quiet debounce replaces the native fast settle with the slow glide.
  Skipped on instances authored with `scroll-snap-type: none`.
- Grab cursor only on draggable instances (`sv-draggable`), `drag: false`
  sliders no longer advertise a hand they can't honor.

## 0.10.0 (2026-08-20)

- **Slider glide**: own eased scrollLeft animation (ease-out) with a
  configurable `duration` for next/prev/goTo AND the drag release. Native
  smooth scrolling is fast and not configurable. Snap suspends while gliding
  (`sv-gliding`); pointerdown cancels the glide (the user takes over).

## 0.9.0 (2026-08-20)

- **`slider()` / `useSlider`**: featherweight Swiper: native scroll +
  scroll-snap, mouse drag, active-slide observer as `--sd` per slide (signed
  distance from center) + `.sv-active`, `next/prev/goTo`. `.sv-slider` CSS
  in styles.css.
- Demo case 10/11: regional scroll-snap (onLive toggles the magnet) and the
  four snap flavors. Case 12: the treasure map: scroll drives a camera along
  an SVG path with heading + counter-rotating stations.

## 0.8.0 (2026-08-20)

- **`onPin` callback** on TrackOptions and the React layer. Raw 0..1 across
  the pinned stretch, for frame scrubbing and camera tours. The demo already
  taught it; now the package has it.
- Demo code samples audited against the current API: `--sv-y` leftover fixed,
  deck/reading/counter samples now show the official presets, `useScenes`
  misuse replaced by `useTrack({ scenes })`.

## 0.7.0 (2026-08-19)

- **Zero-wrapper mode**: `scan()` tracks every `[data-sv]` element (options
  via `data-sv-once/pin/travel/scenes`) and follows DOM mutations;
  `<ScrollVarsBoot />` wraps it for Next.js layouts. Pages stay 100% RSC.
- **Presets promoted from the demo**: `sv-deck` (pinned card pile),
  `sv-reading` (guided reading), `sv-counter` (`@property` + `counter()`).
- ESM-correct relative imports (`.js` extensions). Dist now runs in plain
  Node too, not only through bundlers.

## 0.6.0 (2026-08-19)

- **`--sv-view` reformulated**: now the signed position relative to the live
  band. The same 75%/25% lines the `sv-live` class uses, so the variable and
  the class always agree. −1 with the top at the viewport's bottom edge,
  0 across the whole band, +1 once the bottom clears the exit line.
  Entrance/exit ramps are shorter than before (0.25 vh each); `sv-drift`
  reacts a touch snappier near the edges.
- `LICENSE` file and this changelog.

## 0.5.0 (2026-08-19)

- **Attribute API for React** (Felipe's feedback): `order`, `distance`,
  `stagger`, `duration`, `ease` as props on `Track`/`Reveal`/`Parallax`.
They compile to the CSS variables; new `<Item effect="rise|fade|slide-l|
  slide-r|drift|tilt">` for children. The variables remain the real API.
- `sv-rail` fixed on wide windows: starts one viewport offscreen right, ends
  right-edge aligned (`min()` keeps it moving when the track fits).

## 0.4.0 (2026-08-18)

- **`scrollvars/canvas`**: `mountEffect` / `useCanvasEffect`: lifecycle
  harness for ambient (time-driven) canvas effects: resize, DPR cap (2),
  delta-time loop, auto-pause offscreen and on hidden tab, live
  reduced-motion flag, full cleanup. Simulations stay in userland.
- `AGENTS.md` (agent-facing docs, shipped in the npm package) and
  `test/canvas.test.mjs`.

## 0.3.0 (2026-08-18)

- **Pointer module**: `trackPointer` / `usePointer` write `--mx`/`--my`
  (−1..1 from the element's center) with one delegated listener; `sv-tilt`
  preset (3D tilt + glare).

## 0.2.0 (2026-08-17)

- Vocabulary finalized: `--sv-view`, `--sv-t`, `--sv-pin`, `--sv-scene`,
  `.sv-live`, `html.sv-on` guard. React layer: `Track`, `Reveal`, `Parallax`,
  `Scenes`, `useTrack`, `useScenes`. Presets incl. `sv-curtain-l/r`,
  `sv-rail`, `sv-auto` stagger, `sv-view-*` pure-CSS tier.

## 0.1.0 (2026-08-17)

- First cut: single global driver (one passive scroll listener + one rAF,
  batched read → write), CSS variables as the entire output surface, zero
  React renders during scroll.
