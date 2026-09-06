# Changelog

## Unreleased

Blind review round 3 (Codex gpt-6-astra on commit 677656b): the CSS
enhancement contract holds in every documented case. Second pass (verifier
findings on the same round): three more defects fixed.

### Driver
- `track()`'s returned untrack is identity-guarded: it deletes and unobserves
  only if it is still the current entry for that element
  (`entries.get(el) === entry`), so tracking the same element twice and
  calling the first untrack no longer deletes the replacement. An explicit
  untrack now also removes `sv-live` and every variable that entry wrote
  (plus `--sv-scenes`); `.sv` stays, and the `once` fire-and-forget path
  keeps `sv-live` (its self-delete already left the entry map, so the guard
  makes the later untrack call a no-op there, which is the intended
  behavior).
- `init()` is transactional: it constructs the `ResizeObserver` before
  installing any listener, so a throwing constructor leaves nothing to undo.
  `track()` checks `initialized` after calling `init()` and returns a no-op
  (no entry, no pin helper, no schedule, no `.sv` class) when it failed,
  so the page stays static until `compat()` shims a `ResizeObserver` in and
  a later `track()` call retries `init()` clean.
- `refresh()` now forces one geometry pass through every entry on the very
  next frame, including culled ones (`near === false`): content changes that
  do not fire a resize (an accordion opening, an image swapped for a taller
  one) previously left offscreen trackers stale until they scrolled back
  into the culling margin.
- A tracked element with a `root` now measures against `root.clientTop` and
  `root.clientHeight` instead of the root's bounding rect, so a bordered
  scroll container shares one origin between `track()`'s pin math and
  `scrollToScene()`'s scroll target. `track()` also observes the `root`
  with the `ResizeObserver`, so a resize of the scroller itself
  reschedules a measure.
- `--sv-pin-offset` now resolves `rem` (root font-size), `em` (the
  element's own font-size), `vh`/`svh`/`lvh`/`dvh` (`window.innerHeight`)
  and `vw` (`window.innerWidth`) to pixels; a bare number still reads as px.
- `--sv-page` and `--sv-v` skip the style write when the serialized value
  did not change from the previous frame.
- Second pass (verifier findings on 00436db): `track()` on an element that
  is already tracked replaced its entry in place, which left the identity
  guard on the first entry's untrack blocking forever, so a variable only
  the first entry ever wrote (`--sv-t` from `{travel: true}` followed by
  `{}`) stayed inline. A replacing `track()` now releases the previous
  entry's outputs first (its written vars, `--sv-scenes`, its pin helper,
  both observers), so it is exactly untrack then track. A root element
  that is also tracked standalone lost its `ResizeObserver` watch the
  moment the standalone entry was untracked, because `unobserve(el)` fired
  for the shared element with no regard for the entries still using it as
  their `root`. `untrack()` now checks whether any other live entry still
  needs that element watched, either as its own tracked element or as its
  `root`, before unobserving it.
- Third pass (verifier finding on 130395a): the `once` fire-and-forget branch
  in `apply()` still unconditionally unobserved its own element on the
  ResizeObserver when it self-released, bypassing the `stillNeeded()` guard
  the second pass added elsewhere. An element that is both a `once` entry
  and another entry's `root` lost that other entry's resize watch the
  moment the `once` entry went live and settled. The branch now checks
  `stillNeeded()` before unobserving, same as `releaseEntry()`, but keeps
  settling `--sv-view` and latching `sv-live` itself: it still does not
  route through `releaseEntry()`.
- Fourth pass (verifier finding on 293b1dc): the third pass guarded the
  `once` branch's unobserve of its own element, but never released its own
  `root`. A `{ once: true, root }` entry that self-released kept the
  root's `ResizeObserver` watch forever, since `releaseEntry()` is never
  called on that path. The two guarded unobserves (the tracked element and
  its `root`) are now one `unobserveIfUnneeded()` helper, used by both
  `releaseEntry()` and the `once` branch, so the two paths cannot drift
  apart again.

### Presets and no-JS
- `.sv-split` word/char spans compute to `display: inline-block`, so
  `sv-split-rise` can actually apply `translate` to them (non-replaced
  inline boxes ignore it).
- The reduced-motion override for `.sv-auto` now matches the same
  `:not(.sv-skip)` compound as the normal entrance rule, so it wins on
  specificity instead of losing to it.
- The no-JS guards for curtain, rail, deck, reading, range and counter now
  match `[data-sv]` as well as `.sv`: markup that has not been scanned yet
  (data-sv only, no JS run) no longer leaves curtain panels as absolute
  overlays over the revealed content.
- `sv-spread` and `sv-acts` are driven from the inherited `--sv-live` flag,
  like the entrance presets: a nested tracker that is not itself live no
  longer inherits a live ancestor's spread or acts clock.
- `.sv-acts.sv-open` now also outranks the live-driven rule
  (`.sv-acts:not(.sv-open)` on both selectors): an opened widget sitting
  inside, or itself, a tracker that is not live keeps its finished
  `--sv-act` instead of being reset to 0.
- `.sv-auto > :nth-child(1)` (and `.sv-stagger`) resets `--sv-order` to 0,
  so the first child never inherits an ancestor's order.
- `.sv-slider.sv-cols` also matches `.sv-cols .sv-slider > *`, so a
  `className="sv-cols"` on the Slider shell (one level up from
  `.sv-slider`, where React's `className` prop lands) works too.

### Click driver
- `toggles()` now marks `sv-ui` on the element it actually controls (the
  resolved `data-sv-target`, or the trigger itself when there is no
  target), not on `<html>`. Marking `<html>` unconditionally meant an
  unrelated scroll-revealed `sv-acts` widget on a page without a booted
  scroll driver was wrongly exempted from the no-JS finished-state guard
  and stayed hidden at act zero forever. The guard is now
  `html:not(.sv-on) .sv-acts:not(.sv-ui)`: scoped to the widget itself. A
  target added to the DOM after boot gets `sv-ui` on its first click, so
  that first click shows the finished state with no visible transition.
- Third pass: marking a boot-present target `sv-ui` now holds its inline
  `transition` at `none` for two animation frames. Without that, a target
  closed by default (`.sv-acts` without `.sv-open`) settled from the no-JS
  finished value down to 0 with the acts transition still running, a
  visible un-animation the instant `toggles()` took over.
- Fourth pass: that hold read and wrote the inline `transition` shorthand
  (save, set to `none`, restore). Two defects, both reproduced in Chrome:
  an inline transition longhand (e.g. `style="transition-duration: 400ms"`)
  reads back as `''` through the shorthand getter, so the "restore" erased
  it for good; and `transition: none` stopped every transition on the
  element for the hold, not just the acts one, snapping an unrelated
  in-flight transform transition. The hold now sets an internal
  `--sv-acts-settle` custom property to `0s` instead, new and additive:
  `.sv-acts`'s own transition reads its duration from it
  (styles/state.css), and `toggles()` never touches `style.transition`.
- Fifth pass: `--sv-acts-settle` only reaches the duration the stylesheet
  itself declares on `.sv-acts`. An element that also carries its own
  inline `transition-duration` LONGHAND (the fixture's `#longhand-target`,
  `style="transition-duration: 400ms"`) outranks that knob by cascade
  origin no matter what it is set to, so the settle for that element still
  played out over the longhand's own duration instead of 0s, reproduced in
  Chrome (`3, 2.876, ... 0` over 400ms): the exact un-animation this
  feature exists to remove. The shipped e2e case only asserted the
  attribute string survived and never sampled `--sv-act` on that element,
  so it stayed green. `toggles()` now also saves that inline longhand's
  exact value and priority, holds it at `0s` for the same two frames (or
  until a click inside the hold cancels it, restored immediately there
  too), and restores it exact, through the longhand getter/setter only,
  never the shorthand. A target without an inline longhand never has one
  written, so an unrelated in-flight transition on it is untouched. What
  remains unguarded: an author RULE, not an inline style, that overrides
  `transition-duration` or the whole `transition` shorthand on `.sv-acts`
  at higher specificity than the preset's own rule still owns the settle
  timing (styles/state.css).
- Sixth pass: the whole settle (`--sv-acts-settle` and the inline
  `transition-duration` hold) now only runs on `.sv-acts` targets, gated
  only on `sv-ui` before. `getPropertyValue('transition-duration')` cannot
  tell an authored longhand from the browser's own expansion of an
  unrelated inline `transition` shorthand, so a plain toggle target with
  one (this module's own `<nav id="menu">` example, most of the time) had
  it forced to `0s` for two frames regardless, snapping any change to it
  that landed inside the window instead of animating. A target that is not
  `.sv-acts` still gets `sv-ui`, nothing else.

### Compat
- `compat()`'s fallback stylesheet gets a `transform:`-based `sv-deck`
  rule for engines missing individual transform properties.
- `splitParts` no longer uses `Array.prototype.flatMap` (missing on Chrome
  61-68 and Safari 11, the floor compat claims).

### Testing
- The no-JS "pin stages never cover their revealed text" e2e sweep now
  scrolls each candidate into view before measuring: 6 of the 7 pin fx
  pages were previously off-viewport at scroll position 0 and silently
  skipped. The sweep asserts and prints a minimum examined count per pin
  page, so a regression back to zero coverage fails it instead of passing
  by omission.
- The boot-settle e2e fixture (toggles-boot-settle.html) gained two more
  targets: one with an inline `transition-duration` longhand, one with an
  unrelated in-flight `translate` transition, proving the settle hold
  leaves both alone. Its post-click assertion now samples `--sv-act`
  across frames instead of only the final value, so a transition silently
  reduced to zero duration would fail it instead of passing by omission.
- Fifth pass: `#longhand-target`'s `--sv-act` is now sampled per frame like
  the main target, so a settle silently governed by the longhand instead
  of `--sv-acts-settle` fails the sweep instead of passing on the attribute
  string alone. A new `#longhand-important-target`
  (`transition-duration: 400ms !important`) proves the same hold and
  restore keep the original priority, not just the value. Unit tests cover
  the longhand hold-and-restore lifecycle exact (value and priority), that
  a target with no inline longhand never has one written, and that a click
  inside the hold restores it immediately alongside the knob.

### Canvas
- `mountEffect()`'s `applySize()` stops the unsized-canvas DPR feedback loop
  (ADU-107): a canvas with no CSS width/height lays out at its own
  backing-store size, so writing `canvas.width`/`height` after every resize
  would otherwise feed straight back into the next resize, unbounded. Eight
  earlier passes (each one a verifier or panel finding, reproduced in real
  Chrome) all tried to catch that loop by measuring: a border-box-rect-vs-
  content-box-attribute equality guard that both missed a bordered unsized
  canvas and mispinned a legitimately CSS-sized one; a padding-inflated
  read; a fractional-padding rounding residual; a fallback re-measure that
  disagreed with a bit-exact ResizeObserverEntry for reasons that had
  nothing to do with feedback (fractional padding, a transform); a flat 1px
  tolerance that took dozens of passes to notice a small canvas's small
  move; a ratio check whose `dpr > 1` guard missed a zoomed-out page
  entirely and whose transform-inflated fallback read mispinned a padded,
  transformed canvas; a value- and timing-based "echo window" (matching a
  later ResizeObserverEntry's `contentRect` against the exact size just
  written, within two animation frames) that could not tell a genuine CSS
  resize landing on that same number apart from its own echo (a 300x150
  canvas at dpr 2, doubled to 600x300 by a class applied a frame after
  mount, lands exactly on the 600x300 the harness itself had just written),
  because a comparison of two numbers never asks WHY they match, only THAT
  they do; and (eighth pass) a causal probe that bumped `canvas.width`/
  `height` up by a flat `+1` EACH and read `canvas.clientWidth`/
  `clientHeight`, pinning both `style.width` and `style.height` together
  whenever either axis followed. That probe was genuinely causal, not a
  coincidence check, but three more verifier findings on it (all reproduced
  in real Chrome) showed it asked the wrong shape of question: a flat,
  per-axis `+1` perturbs the RATIO between width and height, not just their
  size, so an ordinary `width: 100%; height: auto` canvas (no CSS height at
  all, the auto height derived from the intrinsic ratio) could read as
  having moved on height and get wrongly pinned, at dpr 0.5, 0.8 and 1.25;
  pinning both axes together assumes both need it, so a `max-width: 100%`
  canvas not yet at its cap correctly got pinned on mount, but a later
  container shrink that engaged the cap left the pinned height frozen,
  distorting a 150x150 box instead of scaling it to 150x75; and a bare
  `<canvas width="300" height="150" style="max-width: 400px">` at dpr 2 had
  its backing-store write (600) clamped by the cap (400) before the probe
  ever ran, so it read no follow at all and settled visually inflated at
  400x200, never pinned to its true, uncapped 300x150.
  The ninth-pass design narrowed the question: PROPORTIONAL, and about ONE
  axis. Right after `applySize()` writes the backing store
  (`canvas.width = W`, `canvas.height = H`), it perturbed both attributes
  together by the same factor (so the ratio between them holds steady) and
  forced one layout read (`canvas.clientWidth`), then restored `W`/`H` and
  read again. If the two readings differ, WIDTH follows the attribute
  (unsized on width, whatever height does, which is what catches the
  `max-width` cases above); if they are equal, width is CSS-sized, whatever
  its literal source (a percentage, a fixed px value, or itself derived
  from a fixed CSS height through the intrinsic ratio), and nothing about
  height enters that conclusion. Only WIDTH gets pinned, to the CSS content
  width `applySize()` measured right before the write, forcing
  `box-sizing: content-box`; height is left alone, deliberately, so it
  keeps deriving from the intrinsic ratio exactly as this harness's own
  proportional writes keep it stable, and a later `max-width` shrink
  correctly recomputes it from the new width instead of fighting a frozen
  number. The ninth pass chose `Math.floor(W / 2)`/`Math.floor(H / 2)`
  (halving) as that factor.
  Tenth pass, two more verifier findings on the ninth pass, both reproduced
  in real Chrome. Finding 1: `Math.floor` on a halved value does not
  preserve the ratio between `W` and `H` when they have different parity
  (one odd, one even), so a fixed-CSS-height, auto-width canvas (the mirror
  case: the auto width derives from the fixed height through exactly that
  ratio, e.g. `style="height: 101px"`) could have its floored ratio read
  back a fraction off the true one, flipping the before/after comparison
  even though the CSS height never moved; swept across heights 99-151 and
  dprs 0.5-2, this hit 27 of 42 combinations, wrongly pinning an ordinary,
  fully-responsive canvas and then distorting it on the next CSS height
  change. Finding 2: `<canvas style="max-width: 100px">` with the default
  300x150 attributes settles unpinned with a crisp backing store (the cap
  scaled by dpr) at every DPR above 1, which is CORRECT, not inflation: a
  cap at or below the canvas's natural size binds before the harness ever
  touches the attributes, so the box is already the cap's own size, and
  pinning it would be the bug, not the fix (the opposite of a bare
  `max-width: 400px` above the natural size, which stays the inflation
  case and must still be pinned). The probe now tries GROWING first
  (double `W`/`H` together: exact for any pair of integers, whatever their
  parity, which is what fixes finding 1) and, only if that shows no follow,
  also tries SHRINKING (halve `W`/`H` together, exact only when both are
  even, so it can never reintroduce finding 1's flooring bug) to catch a
  cap already binding on the just-written, dpr-inflated attribute that
  growing alone cannot reveal (growing further only stays behind a cap
  already behind it). At or below dpr 1, a cap at or below the natural
  size is a narrower guarantee: below 1 the just-written attribute can
  itself land below the cap, a genuine risk (the same unbounded loop this
  module exists to stop, just shrinking instead of growing), correctly
  pinned; at exactly dpr 1 the attribute lands exactly on the cap,
  genuinely stable, but the shrinking probe cannot tell that apart from
  just above it and pins here too, a narrow, documented, harmless over-pin
  (the pin lands on exactly what the cap already renders). Growing is
  skipped past the browser's own canvas-size limit (8192: doubling could
  itself trip it), and shrinking needs even parity, so a giant canvas with
  an odd dimension on either axis has no safe direction to probe in at all
  and is treated as already sized.
  A canvas with a genuine CSS size on both axes is never pinned and always
  follows a later resize, whatever its border, padding (integer or
  fractional), transform, or the current device pixel ratio (above 1,
  below 1, or exactly 1). Cost: two forced layouts per probe run, up to
  four per resize event when growing alone does not already decide it,
  never per animation frame, measured against real Chrome to settle in
  exactly one `resize()` callback for most size/DPR pairs, the pin running
  synchronously inside the same callback that delivered the entry, before
  the browser ever renders the unpinned intermediate box.
  Two remaining trade-offs, both documented in the module doc: a canvas
  with no CSS size on either axis still gets its width pinned inline by the
  harness (give it real CSS dimensions to keep control of its own size);
  and, because this harness rounds each backing-store axis independently
  (correct in general: two CSS-sized axes share no ratio), a non-square
  canvas at a DPR where that rounding is asymmetric (300x150 at dpr 1.25,
  verified in Chrome) costs one further, still-bounded resize pass while
  the free height axis settles an imperceptible sub-pixel residual, the
  same class the fourth pass already documented for fractional padding.

### Installed components (blind review round 3)
- `StickySteps`'s `inert` spread now casts like the core does
  (`as unknown as Record<string, never>`): the previous inline ternary put a
  `string | boolean` into a `boolean` prop, failing `tsc` under React 19
  types. It also now subscribes to the `prefers-reduced-motion` media
  query's `change` event instead of reading it once, so a live switch drops,
  or restores, `inert`/`aria-hidden` on the stacked shots immediately.
- `GsapScrub` and `ThreeScene` declare their mutable refs as
  `useRef<T | null>(null)`, not `useRef<T>(null)`: read-only under React 18
  types. `GsapScrub` also drives the timeline through
  `prefersReducedMotion()` (imported from `scrollvars`), so a
  reduced-motion visitor gets the finished frame instead of a scrubbed one.
- `gsap-scrub` and `three-scene` declare `min: '1.13.0'`: the string pin
  helper and `.sv-stage` they both use are 1.13.0 features, not the
  1.9.0/1.11.0 previously declared.
- `curtain`, `horizontal-rail` and `pointer-tilt` declare
  `requires.tailwind: true`: their installed content leans on Tailwind
  utility classes with no component-owned CSS backing them. The CLI prints
  "Tailwind utilities: required" for these effects; the registry gains the
  `tailwind` flag.
- `CoverflowSlider`'s coverflow transform moved from an inline `style`
  object into a `.cf-slide` class with a `prefers-reduced-motion: reduce`
  override, matching the preset policy that scroll-linked transforms return
  to flow under reduced motion. The Tailwind tab of `hero-cinematic` gained
  matching `motion-reduce:` variants for the orb and the inner block.
- `TimelineScrub` renders the year as visually-hidden real text plus an
  aria-hidden counter span, instead of `aria-label` on a bare `<span>`
  (prohibited on generic roles, Axe `aria-prohibited-attr`). `StatsCountup`
  emits `<dt>` before `<dd>` (order was reversed), and renders the final
  value as visually-hidden text with the counter itself `aria-hidden`.

### Installed components (blind review round 3, second pass)
- The CLI component `tsc` gate was vacuous under a config-level error: a
  bad `moduleResolution` prints as `tsconfig.json(9,25): error TS6046`,
  which never matches the per-file `<name>.tsx(line,col)` regex, so every
  fixture reported "type-checks: pass" while tsc never actually checked
  any of them. The gate now counts every `error TS\d+` line in the raw
  output against the lines it can attribute to a fixture file and fails
  loudly, with the raw output, on any mismatch or on a non-zero exit with
  no per-file diagnostics. Proved red on a deliberately invalid
  `moduleResolution` before landing, green again after reverting it.
- `hero-cinematic`'s Tailwind tab: the `motion-reduce:` override for
  `.inner` sat on the `.inner` div itself (`[opacity:1]`/`[scale:none]`,
  a one-class selector, specificity 0,1,0) while the base rule reaches
  `.inner` through the section's `[&_.inner]:` variants (a two-class
  selector, 0,2,0), so the override never won and reduced-motion visitors
  still got the scroll-driven fade and scale. The override now lives on
  the section in the same `[&_.inner]:` shape, after the base variants,
  so equal specificity lets source order settle it.
- The condensed `react:` doc snippets for `timeline-scrub` and
  `stats-countup` referenced `<span style={SR_ONLY}>` without defining
  it, unlike every other self-contained snippet (`SR_ONLY` is not
  exported from `scrollvars`). Both now inline the sr-only style object
  literal at the point of use.

### Installed components (blind review round 3, third pass)
- The second pass's `tsc` gate fix counted every `error TS\d+` line against
  the lines it could attribute to a fixture file, but the ambient stubs
  `gsap.d.ts` / `three.d.ts` compile in the same scope (needed to
  type-check `gsap-scrub`/`three-scene`) and are not one of the EFFECTS
  fixtures the per-file loop asserts on: a syntax error injected into
  `AMBIENT_GSAP` attributed cleanly to `gsap.d.ts(line,col)`, so the count
  matched, the "not vacuous" meta-test passed, and all 17 fixture tests
  reported "type-checks: pass" while tsc had exited 1 the whole time. The
  gate now fails the whole test file on any non-zero tsc exit, no matter
  how the diagnostics are attributed, printing the raw output; per-fixture
  attribution stays for the nicer message. Proved red by injecting a
  syntax error into the ambient stub (the gate failed with the raw
  `gsap.d.ts` diagnostics, every fixture test still green), green again
  after removing it; a per-file error (injected into `marquee`) still
  fails only that fixture's test plus the file-level gate.

### Installed components (blind review round 3, fourth pass)
- The CLI component `tsc` gate spawned `tsc` with a generated tsconfig that
  had no `paths` redirect for `react`, so the subprocess always resolved the
  root's React 19 `@types`, even under `npm run test:react18`: the
  `--import` loader hook only redirects the parent process's own runtime
  imports, never a subprocess it spawns. No `tsc` run anywhere checked the
  installed fixtures against React 18 types, so reverting `GsapScrub`'s
  `useRef<T | null>(null)` fix stayed green everywhere. `react18-register.mjs`
  now sets `SV_REACT18_DIR` (its value read straight from
  `react18-paths.mjs`, the same module `react18-tsc.mjs` already used for
  `src/`), and the gate adds the same `paths` redirect and canary when that
  variable is set. Proved red by reverting the `GsapScrub` fix under
  `npm run test:react18` (the gate failed with "Cannot assign to 'current'
  because it is a read-only property"), green again after restoring it.
- With the gate actually checking React 18 types, four more fixtures failed
  it: `HeroCinematic`, `PointerTiltGrid`, `StickySteps` and `ThreeScene` all
  pass a hook's `RefObject<T | null>` (the same shape `GsapScrub` needed to
  satisfy both majors) straight into a host element's `ref`. React 18's
  types compare that generic argument literally against `RefObject<T>`
  instead of expanding both to `{ current: T | null }`, so `T | null` fails
  where `T` succeeds even though the two are structurally identical. Each
  now casts the ref to `React.RefObject<T>` at the JSX call site, the same
  shape `GsapScrub` already needed for its own mutable `useRef`.

### Tooling
- `npm run demo:sync` is idempotent again: the bench page's inlined engine
  marker was lazy on the content but only matched a fixed 3-newline gap
  before `</script>`, and the replacement kept the fresh IIFE's own
  trailing newline on top of that gap, so every run against a live driver
  added one more blank line and `demo/bench/scrollvars.html` never
  settled. The marker now consumes however many blank lines already
  accumulated instead of a fixed count, so it self-heals instead of
  drifting. `.github/workflows/ci.yml` and `.github/workflows/release.yml`
  now include `demo/bench/scrollvars.html` in the generated-files gate.

### Slider
Blind review round 3 (GPT-6 Astra), findings 8, 9 and 10, verified in real
Chrome with a puppeteer-core probe (5 slides of 100px, container 300px
wide, scrollWidth 500).
- `slideStart()` walked the offsetParent chain and always subtracted the
  container's own border (`clientLeft`/`clientTop`), even when the
  container itself was the slide's offsetParent. offsetLeft is already
  measured against the offsetParent's padding edge in that case, so the
  border was subtracted twice: a bordered, positioned container gave -10
  for its first slide instead of 0. The walk now stops the moment it
  reaches the container and only falls back to the absolute-position
  subtraction (plus the border) when the container is skipped entirely
  (a statically positioned rail whose real offsetParent sits further up).
- RTL mirrored the slide start against `scrollWidth` instead of
  `clientWidth`: measured in Chrome, a position:relative RTL rail gave 200
  for its first slide instead of 0. The mirror now uses the container's
  own client box.
- `measure()` tracked only the active index, not the active element. A
  MutationObserver-driven replacement of that element (same index, new
  node, e.g. a framework re-render) left `sv-active` on the detached old
  node and never moved it to the new one. `measure()` now remembers the
  active node as well: a changed node at the same index moves `sv-active`
  and `--sv-slide` without firing `onSlide` for an index that never
  changed.

### React
- `useTrack`, `usePointer`, `useSlider` and `useCanvasEffect` now attach
  through the ref itself instead of a mount-effect: the returned ref's
  `current` is an accessor, so React's own attach/detach (any object with
  a `current` property, unchanged between React 18 and 19) runs the
  track/untrack. A conditionally rendered target that mounts after the
  first render, or a node replaced by a new one, used to sit untracked
  until an unrelated option changed forced the effect to rerun; both are
  now tracked the moment the node attaches, and untracked on detach.
  Option changes still retrack the current node. The ref type is declared
  `React.RefObject<T>`, same as before.
- `<Scenes pin>` now takes a string that wins over `height` and the
  one-viewport-per-scene default (`pin="320vh"`), matching `<Track pin>`.
  `pin={false}` still disables the pin helper.
- `<ScrollVarsBoot nonce>`: forwarded to the pre-paint script tag, for a
  strict CSP with no `'unsafe-inline'`. Additive, no existing prop changes.
- `<ScrollVarsBoot>`'s debug overlay (`?sv-debug`) no longer mounts if the
  component unmounts before its dynamic import resolves: the effect
  cleanup now sets a `disposed` flag the import's callback checks first.
- `useSlider`'s `handleRef` kept pointing at a destroyed `SliderHandle`
  after the tracked node detached (a conditional unmount, a node swap):
  `next()`, `prev()`, `goTo()` and `handle.current` on a detached slider
  drove a dead container, including starting a new glide `requestAnimationFrame`
  loop nothing could stop. The `useAttachedRef` cleanup now also sets
  `handleRef.current = null` before destroying the handle. Checked every
  other hook built on `useAttachedRef` for the same shape (`useCanvasEffect`,
  `usePointer`): neither keeps a handle ref beside it, so only `useSlider`
  needed the fix.

### CI
- CI now proves the React layer on React 18, not only the React 19 the
  root installs: a new `test-react-18` job (`npm run test:react18`, also
  runnable locally) installs react@18, react-dom@18 and their `@types`
  into `node_modules/.cache/react18` (its own package.json, `--no-save`,
  never the root `package-lock.json`), type-checks `src/` against those
  `@types` instead of the root's through a generated tsconfig `paths`
  entry (guarded by a canary that fails loudly if the redirect ever
  silently falls back to React 19), and runs `test/react.test.mjs` and
  `test/cli-components.test.mjs` with a `node --import` loader hook that
  redirects every `react`/`react-dom` import to that install for the
  process (`NODE_PATH` does not affect ESM resolution).
- `react: Marquee duplicate is aria-hidden and inert` now asserts the
  literal wire format `inert=""`, not just the attribute's presence: the
  case both React majors must agree on (`{ inert: '' }` under 18,
  `{ inert: true }` under 19).

### React types
- Proved, with a new fixture, that the natural consumer idiom
  (`const ref = usePointer<HTMLDivElement>(); return <div ref={ref} />`,
  no cast) type-checks under both React 18 and 19 for `usePointer`,
  `useTrack`, `useScenes`, `useCanvasEffect` and `useSlider`: each hook's
  return type has been `React.RefObject<T>` since ADU-106, which already
  satisfies a JSX ref under both majors' types. `test/cli-components.test.mjs`
  now compiles a `HookRefIdioms.tsx` fixture alongside the installed CLI
  components under the same tsc gate (both `npm test` and
  `npm run test:react18`), and fails loudly if a future signature change
  regresses back to a nullable `RefObject<T | null>`. The `as
  React.RefObject<T>` casts ADU-108 added around `usePointer`/`useTrack` in
  `HeroCinematic`, `StickySteps`, `ThreeScene` and `PointerTiltGrid` are
  redundant now, left in place to avoid touching lines the fx gallery work
  in flight also edits. No type or runtime change: `dist/react/index.js` is
  byte-identical before and after.

### Gallery
- The gallery preview for the four Sections (`hero-cinematic`, `timeline-scrub`,
  `sticky-steps`, `stats-countup`) is no longer a hand-typed HTML string: it is
  the installed component itself, compiled with esbuild and rendered with
  `react-dom/server` (the same pipeline `test/cli-components.test.mjs` already
  proves every fixture against), with a small `previewProps` object per
  Section (`scripts/fx-data.mjs`) standing in for real content. Preview and
  component now share one source, so they cannot drift. A component that
  attaches via a client hook (`usePointer`, `useScenes`, a bare `<Track pin>`)
  has no scannable `data-sv` attribute in its server markup, so its gallery
  page keeps a tiny `previewScript` (documented on the effect entry) that
  calls the vanilla driver directly once `sv.js` loads.
- `test/cli-components.test.mjs`'s class-token parity check (installed
  component vs. hand-written preview) is replaced, for these four, by an
  assertion that `demo/fx/<slug>.html` literally contains the component's own
  render; the check for every effect that still has a hand-written preview
  is unchanged. Rendering with `previewProps` also fails the test on any
  React warning to stderr.
- `demo/bench/harness/e2e-invariants.mjs`'s pin-stage occlusion sweep no
  longer flags the visually-hidden sr-only text used alongside an
  aria-hidden visual counter (`Split`, `TimelineScrub`'s year,
  `StatsCountup`'s count: `clip-path: inset(50%)`, by design the same text
  and position as the digit it describes): nothing on screen for it to
  cover or be covered by. The rendered `TimelineScrub` preview is the first
  page that put this pattern inside a `.sv-stage`, where the sweep actually
  looks.
- Second pass (verifier finding on 8ecd8f1): that sr-only exclusion tested
  `clip-path !== 'none'` alone, which also excludes a normal-sized element
  that only wears a decorative `clip-path` mask (a circular reveal effect,
  for instance), so visible text covered by a panel there would silently
  drop out of the sweep. Real sr-only text is pinpoint-sized (1px by 1px,
  matching `SR_ONLY_CSS` in `src/core/split.ts` and `SR_ONLY` in
  `src/react/index.tsx`) in addition to being `clip-path`'d, so the
  predicate now requires both. A new negative fixture
  (`demo/bench/harness/fixtures/pin-stage-clip-path-occlusion.html`) proves
  a masked, normal-sized element under an opaque panel is still examined
  and reported.
- Third pass (verifier finding on 4f637e0): the pinpoint-size half of that
  same predicate read `el.getBoundingClientRect()`, which measures the
  painted rect. A real sr-only span nested under a `transform: scale(2)`
  ancestor (`sv-tilt` and `sv-deck` both transform their content) paints
  at 2px by 2px, so it read as "not pinpoint", escaped the exclusion, and
  became a false occlusion candidate. The predicate now reads
  `offsetWidth`/`offsetHeight` instead, the layout box, which an ancestor
  transform never changes. The same fixture gained a positive case: a
  genuine sr-only span under a scaled ancestor, covered by nothing, that
  must be excluded outright (not examined, no false occlusion) while the
  existing masked, normal-sized element is still reported.

### Docs
Blind review round 3 (GPT-6 Astra), section 2: wording that had drifted
from the code it describes.
- README's size intro: the "min+gzip" label now reads "JS min+gzip, CSS
  gzip as shipped", and the "typical page" number is stamped from
  `docs-data`'s `typical` size instead of hand-typed; the sizes table intro
  reads "per module entry", not "per import"; the VARS table's velocity
  column reads "viewport-heights/s", not "vh/s".
- `sv-auto`'s doc row says children beyond 10 share order 10, not "the
  rest". The pin helper doc says it sets `position: relative` only when
  the wrapper is static, keeping authored positioning otherwise. The
  sequenced-scrub example uses `data-sv-pin="320vh"` and a `sv-stage`
  child, not the empty attribute and `.outer`/`.sticky`.
- The slider's two return shapes are documented separately: `slider()`
  returns the handle itself (`next/prev/goTo/seek/active/state/destroy`);
  `useSlider()` returns `{ ref, active, next, prev, goTo, handle }`, where
  `handle` is a ref to that same handle.
- The no-JS "complete static page" claim lists its two exceptions by
  design (class-toggled panels stay closed, native `sv-view-*` still
  runs), and that a click-driven `sv-acts` target needs `toggles()` to
  start at zero. Nested scrollers documents `--sv-stage-height` and that a
  bordered root is measured from its client box. `Split`'s char mode
  documents its `Intl.Segmenter` requirement on both server and client
  render (Firefox 125+), or emoji and combining marks can split
  differently across hydration.
- `<Scenes>`'s render function is documented as server-rendered inside a
  client component boundary, not "client-side"; and a string `pin` wins
  over `height`. `<ScrollVarsBoot>`'s pre-paint hiding is documented as
  gated on `IntersectionObserver` and `ResizeObserver`. The compat floor
  explicitly covers `sv-deck` and no longer depends on
  `Array.prototype.flatMap`. AGENTS.md's build line now names
  `scripts/build-styles.mjs`.
- `scripts/docs-build.mjs`'s CHANGELOG-to-HTML renderer (`mdLite`) fixed
  two bugs: a `### ` sub-heading rendered as literal text instead of a
  heading, and a multi-line bullet only wrapped its first line in `<li>`,
  dropping every continuation line from the rendered list. Rewritten line
  by line instead of by regex backtracking: `### ` now renders as `<h4>`,
  and a bullet's indented continuation lines join into the same `<li>`.
- Second pass (verifier finding on 31ee8af): `scripts/docs-build.mjs`'s
  generated browser-support table hardcoded Firefox at 74+ (Mar 2020),
  contradicting README's and AGENTS's 78+ (Jun 2020, `:is()`/`:where()`),
  the version core.css actually needs. Fixed to 78+ (Jun 2020). The same
  sweep found the table's per-part CSS sizes (core, pin, slider, tilt,
  state, ui) hand-typed and stale against what `docs-stamp.mjs` measures
  and stamps into README (core read 1.9 KB against a measured 2.2, pin 1.8
  against 2.5, state 1.5 against 2.1, ui 0.8 against 0.7; slider and tilt
  happened to still match). `scripts/docs-build.mjs` now imports
  `measureSizes` from `docs-data.mjs`, the same source `docs-stamp.mjs`
  reads, so the generated docs page and README render the same measured
  numbers instead of two hand-typed copies that can drift apart.

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

### Review round 2 (Codex gpt-6-astra, 17 findings, all fixed)
- Entrance presets now animate from an inherited `--sv-live` flag (0/1) owned
  by the nearest tracker: nesting can no longer leak a parent's state, server
  markup with `data-sv` hides before `scan()` runs, and the reduced-motion
  override always wins. The compat fallback uses the same flag.
- Pinning: `--sv-pin-offset` is read for every pin consumer (`scenes`, `onPin`
  too) and re-read on `refresh()`; the pin helper remembers the inline styles
  it replaced, restores them on untrack, and follows live reduced-motion
  changes. `<Scenes>` no longer writes inline stage geometry: it uses the pin
  helper and `.sv-stage` (needs `styles/pin.css`). `.sv-stage` gets
  `--sv-stage-height` for inner scrollers; rails wrap under reduced motion.
- `once` entries settle `--sv-view` before releasing (a drift child measured
  below the screen stayed invisible); `--sv-page`/`--sv-v` keep following the
  scroll after the last entry released itself.
- Slider: geometry from offset chains again (transform-immune, container-local,
  RTL against the content width), reads batched before writes, slides observed
  for size and childList changes, drag only on the primary button and never on
  native controls (inputs, textareas, selects, contenteditable).
- React: `onScene` added later now re-tracks; `<Split by="char">` renders the
  graphemes it counts; `inert` is rendered as `inert=""` so React 18 keeps it;
  Modal falls back to an open static panel without `showModal`.
- Toggles: `aria-expanded` synced on boot and across every trigger of a target.
- Gallery: every pinned preview and installed component uses the pin helper and
  `.sv-stage` (no hand-written sticky skeleton anywhere); the hero stops its
  pointer drift and exit scaling under reduced motion; StickySteps drops
  `inert` when it stacks the shots; Tailwind tabs carry the selector classes
  their JS/CSS needs; minimum versions bumped for the migrated components.
- CLI: the registry fallback is the committed copy on GitHub (an independent
  host), `--dir` without a value is rejected, the registry is only fetched for
  `list`/`add`.
- Docs: Firefox floor is 78 (`:is()`), the bundle ratio is computed from the
  stamped sizes, throttle wording is honest (set through CDP, nominal), the
  scroll-tracking rAF claim is scoped, pointer has two listeners, page
  variables document their clamp and decay, the canvas example guards `ctx`.

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
- Sizes are measured at build and stamped into every document (see README for
  the current numbers; nothing is typed by hand any more). Stale claims fixed
  across README, AGENTS, llms.txt, docs, fx
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
