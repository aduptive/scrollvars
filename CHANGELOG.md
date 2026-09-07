# Changelog

## Unreleased

### Presets (round 7, ADU-166)
- `.sv-marquee-track` under `prefers-reduced-motion: reduce` no longer
  leaves `width: max-content` inside `overflow: hidden`: everything past
  the first screen was unreachable for a reduce user while everyone else
  saw the whole strip. The reduce block now wraps the track
  (`width: auto; flex-wrap: wrap`, matching the rail's own reduce-mode
  wrap in `styles/pin.css`) and hides the aria-hidden duplicate copy
  (`.sv-marquee-track > [aria-hidden] { display: none !important }`, the
  `!important` needed because the duplicate carries its own inline
  `display: contents`, which outranks any plain selector).

### Tooling (blind review round 6)
- Git pushes no longer create Vercel deployments. Production is deployed by
  `npm run demo:deploy`, which runs `vercel deploy --prod` from `demo/` and
  reads `demo/vercel.json`, so the public site is unaffected. Every push of a
  work branch used to create a preview deployment that the project's
  ignored-build-step cancelled straight away, and a cancelled deployment
  still counts against the account's shared daily quota: 61 of the last 100
  deployments were cancelled scrollvars builds, which exhausted the
  allowance and blocked another project's production deploys.

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
- Fifth pass (verifier findings on PR #13 / ADU-130, and a panel pass): `apply()`
  kept writing `--sv-view` and `--sv-t` inline, and fired one extra
  `onTravel`, after an entry's own `onLive` untracked or re-tracked that
  same element from inside the callback. `apply()` now re-checks
  `entries.get(entry.el) === entry` right after `onLive` returns, before
  any of the writes and callbacks that follow, and skips them all when the
  callback changed the entry's identity.

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
- Blind review round 5 (Astra on 7992458), findings 7a and 7b. The
  reduced-motion overrides for `.sv-spread > *` and
  `.sv-tilt.sv-pointer-leave` lost their specificity fight against the
  animating rules they are meant to override (`.sv-on .sv
  .sv-spread.sv-spread-in > *` at four classes, `.sv-tilt.sv-pointer-leave`
  at two, both outranking the media query's plain one-class selector), so a
  live preference switch animated the reset instead of snapping to it.
  Same fix as the `.sv-auto` one above, missed on these two presets: each
  override now also carries the animating rule's own selector shape inside
  the media query, ties on specificity and wins on source order.

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
- `compat()`'s fallback stylesheet now covers `sv-deck` on engines missing
  individual transform properties: the pile unstacks into a static,
  non-overlapping layout instead of leaving every card in pin.css's shared
  grid cell.
- `splitParts` no longer uses `Array.prototype.flatMap` (missing on Chrome
  61-68 and Safari 11, the floor compat claims).
- Blind review round 4 (Astra on 7489a11), findings 3 and 4. The
  ResizeObserver stub's records now carry a `contentRect` and a
  `contentBoxSize`, not a bare `{ target }`: `mountEffect()`'s
  `measureLayout()` reads `entry.contentRect.width` directly and threw
  under the old stub. Both come from the layout box, like the native
  observer: `clientWidth`/`clientHeight` minus computed padding, never
  `getBoundingClientRect()`, which is the paint box and scales with an
  ancestor transform (under `transform: scale(2)` a 400x300 canvas
  reported an 800x600 content box and settled its backing store there
  forever). `contentBoxSize` is logical, so a vertical writing mode swaps
  `inlineSize` and `blockSize`.
- The fallback stylesheet's `sv-deck` rule bounded its `--sv-slice` with
  `max()` (shipped together with `min()`, above the floor README
  advertises) and had no plain declaration in front of it, so below that
  floor the whole `transform` was invalid and dropped, leaving every card
  stacked in pin.css's shared grid cell. The deck fallback no longer uses
  `max()`: it unstacks statically (`display: block` on the deck,
  `transform: none` on the cards) instead of animating. Every other
  `max()` in the sheet (only `sv-drift`'s fade) keeps the plain
  `opacity: 1` in front of it that old parsers fall back to, and is
  unchanged.

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

### Driver (blind review round 4)
- Releasing a tracked element now settles it VISIBLE. `.sv` and `[data-sv]`
  both declare `--sv-live: 0`, only `.sv.sv-live` lifts it to 1, and
  `html.sv-on` is never taken back off, so `stopScan()`, a
  `ScrollVarsBoot` unmount or a route teardown used to strand every section
  that had not gone live yet at opacity 0 forever, and an option change
  flashed content out and back. Release writes an inline `--sv-live: 1`
  (rather than dropping `.sv`, because server markup keeps its authored
  `data-sv`, which hides on its own); `track()` removes that inline value
  first, so tracking hands the flag back to the class.
- The `pin: '320vh'` helper no longer keeps an authored inline
  `position: static`: only a non-static authored position is kept, and a
  static one (inline or computed) gets `relative`, so the containing block
  the helper promises really exists and an absolutely positioned curtain
  cannot escape the stage.
- The `once` fire-and-forget path deletes its entry by identity
  (`entries.get(el) === entry`) BEFORE invoking `onLive`, so a callback that
  tracks the same element again keeps its replacement instead of having it
  deleted out of the map.
- The write phase skips entries that are no longer in the map: an `onLive`
  or `onScene` earlier in the same frame can untrack another element, and
  that element no longer gets one more variable write and one more callback
  after its untrack returned.
- `scrollToScene()` scrolls with `behavior: 'instant'` under
  `prefers-reduced-motion: reduce` even when the caller asked for smooth,
  mirroring the slider's glide. `useScenes().goTo` routes through it, so
  React scene navigation honors the preference too.

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
  One remaining trade-off, documented in the module doc: a canvas with no
  CSS size on either axis still gets its width pinned inline by the harness
  (give it real CSS dimensions to keep control of its own size).
  Eleventh pass, two more verifier findings on the tenth pass, both
  reproduced in real Chrome. Finding 1: the tenth pass's probe ran AFTER
  the backing-store write and rounded width and height independently every
  pass, each from whatever the LAST pass had already produced; a
  mirror-case canvas (fixed CSS height, auto width) has its free width
  computed by the CSS engine through the intrinsic ratio, which IS this
  harness's own backing-store attributes, so independent rounding nudged
  that ratio a fraction every pass and the error compounded instead of
  settling: swept at dpr 0.5 this took 51 to 77 ResizeObserver passes to
  reach a WRONG fixed point (a square box instead of the true 2:1 one), and
  at dpr 0.8 it never reached one at all (a 103px fixed height diverged to
  a 422 backing height instead of the true 206). Finding 2: the same
  post-write probe timing perturbed the just-written, DPR-scaled attribute,
  so at a DPR that does not divide evenly (roughly 1.2 to 1.9) a first pass
  could already write a backing store past a `max-width` cap before the
  probe ever ran against the canvas's true, natural size, and a second
  pass's probe then perturbed that already-inflated value and pinned at the
  inflated number instead of the true one (`max-width: 100px` false-pinned
  across that range; a bare `max-width: 400px`, natural size 300x150,
  pinned at an inflated 450x225 at dpr 1.5 instead of the true 300x150).
  The design anchors every pin, and every free-axis derivation, to values
  captured on the very first `applySize()` call (mount), before this
  harness ever writes anything: the CSS content size the author's own CSS
  and attributes already produced (`anchor`), and the ORIGINAL width/height
  attribute ratio (`ratio0`, from `w0`/`h0`). The causal probe now runs
  BEFORE this pass's own write, on `w0`/`h0` specifically, never on this
  harness's own evolving backing store, and never runs again once a canvas
  is pinned; when width follows, `style.width` is set to `anchor.width` and
  `style.aspectRatio` to `w0 / h0`, so the CSS engine derives height
  directly from the ORIGINAL attribute ratio from then on, never through
  this harness's own rounded backing-store attributes again (this also
  fixes the tenth pass's own documented sub-pixel residual on the free
  height axis: CSS `aspect-ratio` is computed exactly, not through a
  rounded attribute ratio). For a canvas that stays unpinned, a second kind
  of probe, two single-axis perturbations (width alone, height alone),
  decides which axis, if either, is ratio-derived from the other (the
  proportional, both-together probe cannot answer this on purpose: it never
  perturbs a ratio-tracking axis, which is what keeps it immune to the
  eighth pass's false-positive bug). That free axis is always computed from
  the OTHER, just-rounded axis and `ratio0`, never independently rounded
  from its own, possibly-drifted measurement, which is what stops Finding
  1's error from compounding. A dead band skips the whole pass, probe
  included, when the measured content size moved by less than 0.5 CSS
  pixels on both axes since the last write, unless the DPR itself changed;
  it absorbs the one small, self-induced residual the free axis's own write
  can still cause on its very next entry. Probing `w0`/`h0` instead of a
  DPR-scaled write fixes Finding 2's parity-mismatch inflation outright: a
  `max-width` cap at or below the natural size doubles or halves the SAME,
  never DPR-inflated pair every time, so it reads as CSS-sized across that
  whole range; a cap above the natural size still only starts to bind once
  doubling `w0`/`h0` pushes past it, and pins at the anchor, never an
  already-inflated write. It does not remove the tenth pass's dpr-BELOW-1
  case, and should not: at dpr 1 and above this harness's own write never
  drops the attribute below the cap, genuinely never pinned; below dpr 1 it
  can, unclamping the cap for real, a risk the mount-time probe (on
  `w0`/`h0`, never a DPR-scaled value, on purpose) cannot see coming. A
  separate escape check, right after computing each pass's own candidate
  write, reuses the same causal growth check against THAT candidate
  instead, and catches it there, still never over-pinning at exactly dpr 1
  the way the tenth pass did (a genuine improvement, not just a port of the
  old behavior). One narrow limitation remains in the mount-time probe
  specifically, inherited from its own halving fallback's exactness
  requirement: a cap strictly between half the natural size and the natural
  size itself can still read as a false follow if it changes AFTER this
  canvas was already found sized; documented, not fixed in this pass.
  Twelfth pass, two more verifier findings on the eleventh pass, both on
  its pin. Finding 1: the pin used `anchor.width`, the CSS content size
  MEASURED at the moment this canvas was judged unsized, which, for a
  canvas whose cap was already binding right then, IS the capped value,
  not the natural one (a `max-width: 120px` cap on a natural-300 canvas
  pinned at 120); fixed at that measured value forever, the box never grew
  back when the cap later widened, or a percentage cap's container grew, a
  symptom the eleventh pass's own "gap" limitation was really this bug
  wearing a different value. Finding 2: `style.aspectRatio` was set
  unconditionally to `w0 / h0`, silently overriding an author's own
  `aspect-ratio` (a square 300x300 canvas with `aspect-ratio: 1` snapped to
  2:1 on mount). The fix is simpler than the mechanism it replaces: an
  unsized canvas wants its intrinsic size, which is the attribute size in
  CSS px, `w0` by `h0`, and nothing measured. `style.width` is now pinned
  to `w0` always, never a measurement, so CSS caps clamp it exactly as they
  always clamp an intrinsic size, LIVE, at mount and on every later change,
  no different from an ordinary CSS-sized element under the same cap;
  `style.aspectRatio` is set to `w0 / h0` only when `getComputedStyle`
  reports a ratio that still starts with the `auto` keyword, so an
  authored ratio is kept. This removes the
  eleventh pass's "gap" limitation outright: it existed only because the
  pin froze at a measured value a cap could later escape, and pinned at
  `w0` there is no stale value to escape from. It does not remove the
  escape check (a DPR below 1 landing a pass's own candidate write below a
  cap the mount-time `w0`/`h0` probe cannot see because the cap sits below
  half `w0`, a separate blind spot, unrelated to the gap): a test proved
  that case still shrinks unboundedly without it, so it stays, retargeted
  to pin at `w0` like every other pin here instead of the candidate value.
  Also guards `ratio0` (`w0 / h0`) against a `width="0"` or `height="0"`
  attribute, which would otherwise make it 0, Infinity or NaN: such a
  canvas now skips the probe and the free-axis derivation entirely and is
  treated as CSS-sized, both axes rounded independently from the measured
  size. Stated plainly: an unsized canvas renders at its attribute size in
  CSS pixels, with a device-pixel backing store for a crisp bitmap; CSS
  caps and percentages still apply on top of that size, exactly as they
  would on any other element; give a canvas real CSS dimensions to size it
  any other way. Thirteenth pass, one verifier finding on the twelfth
  pass's own fix, live in Chrome: the `aspectRatio === 'auto'` guard never
  fired, for any canvas, authored or not. Chrome always reports a canvas's
  computed `aspectRatio` as `auto W / H`, the intrinsic width/height
  attributes appended to the keyword, never the bare `auto` string, so
  `style.aspectRatio` was never written and height kept deriving from this
  harness's own DPR-scaled attributes instead; whenever `w0 * dpr` was not
  already an integer, the rounding remainder reapplied to the current
  height on every later pass (`<canvas width="30" height="61">` at dpr 0.51
  reached a 33-million-pixel backing height after 668 passes). Fixed by
  testing `startsWith('auto')` instead of exact equality: an authored
  `aspect-ratio` computes to a bare number pair with no `auto` keyword at
  all, so the new check still fires only when the author left the ratio
  alone, and now actually fires.
- Blind review round 4 (Astra on 7489a11), findings 3 and 16.
  `measureLayout()` now falls back to its own `getBoundingClientRect()`
  measurement when a ResizeObserverEntry has no `contentRect` (a stub
  without one, not just compat()'s own, now fixed too), instead of
  throwing on `entry.contentRect.width`. A resize while `pause()` is
  active writes a fresh, blank backing store (`canvas.width = W` clears
  the bitmap) but left the tick loop stopped, so the canvas stayed blank
  until whatever resumed it; `applySize()` now paints one frame
  synchronously right after that write whenever the loop is not running,
  without starting it.
- Blind review round 5 (Astra on 7992458), finding 13 and doc row 4's
  canvas half. `getComputedStyle(canvas).aspectRatio.startsWith('auto')`
  threw a `TypeError` on any engine whose CSSOM has no `aspectRatio`
  support at all: the property is absent there, not an empty string, but
  the DOM lib types it as always a string, so nothing guarded the read.
  `pinAtW0()` threw out of both `applySize()` and `mountEffect()` on any
  such engine, below the README's own Safari 12.1 canvas gate. Fixed with
  an explicit `typeof` check ahead of `startsWith`, so a missing property
  is treated the same as `'auto'` instead of thrown on.
  `media.addEventListener?.('change', ...)` is a silent no-op on a
  `MediaQueryList` that only implements the deprecated
  `addListener`/`removeListener` pair (Safari below 14): both the
  DPR-resolution watch and the reduced-motion watch now fall back to it,
  symmetrically on mount and on `destroy()`.

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

### Installed components (blind review round 4)
- `stats-countup` declares `core.css` as well as `state.css`. The acts clock
  is `calc(var(--sv-live) * var(--sv-acts-count))` and `--sv-live` is
  declared in `core.css` alone, so a consumer who imported exactly what the
  registry asked for got `--sv-act: 0` the moment the driver booted, and
  every number rendered as 0. Without JS the numbers were correct, which is
  why nothing caught it: the gallery page loads the whole `styles.css`.
- `StatsCountup`'s markup is valid again: the screen-reader value and the
  `aria-hidden` counter both sit inside the `<dd>` (`.count`). The readable
  value used to be a `<span>` sibling of the `<dd>` inside `<dl><div>`, which
  is outside the definition-list content model, and the only `<dd>` was
  `aria-hidden`, so every term reached assistive tech with no definition.
- Every installed component renders its constant CSS with
  `dangerouslySetInnerHTML` instead of a `<style>` text child. React 18's
  `renderToStaticMarkup` escapes `>` inside `<style>` (React 19 does not),
  and `<style>` is a raw-text element, so the entity never decodes and every
  child-combinator rule was dropped: under React 18 SSR, `sticky-steps` lost
  the whole `--st-d` rule and its shots stopped crossfading. CSP is unchanged
  from any other inline `<style>`: a `style-src` nonce or hash.
- `test/cli-components.test.mjs` compares the React 18 render with the React
  19 one instead of returning early: that skip is what let the corrupted
  React 18 markup ship unseen.
- New unit gate: an effect must declare the stylesheets the presets it uses
  read variables from, so a rule reading `var(--x)` with no fallback can
  never again be one undeclared import away from computing to nothing.
- Second pass (verifier findings on 91e2b9c): the gallery's CSS tab for
  `stats-countup` still generated the number on the `<dd>` itself
  (`.stats .stat::after`), while its React tab had moved `data-suffix` onto a
  `.count` span inside that `<dd>`. Copy both tabs, which is what the page
  invites, and `::after` resolved `counter(n) ""`: the number rendered on the
  `<dd>` without its suffix, on top of the readable value in the span, so the
  block announced "248+" and then "248". The double announcement this fix
  removed, reintroduced in the documented snippet. The CSS tab, the Tailwind
  tab and the React tab now all carry the `.count` span, the rule is
  `.stats .stat .count::after`, and no `.stat::after` is left.
  `timeline-scrub` shipped the same split (`.tl-year::after` against a React
  tab with a `.tl-count` span) and is fixed the same way.
- The requires closure gate iterated `requires.styles` itself, so it could
  only ever check stylesheets an effect had already declared: a component
  using a preset from a stylesheet named nowhere had no rule to read and
  stayed green, and `sticky-steps` on `styles: ['core']`, with `.sv-stage`
  and the `pin.css` that owns it dropped, passed. Class and variable
  ownership is now mapped over all six stylesheets, and an effect must
  declare whichever one owns each class it renders, whichever one those
  rules read their variables from, and whichever one declares a variable its
  own embedded CSS reads without a fallback.

### Testing (blind review round 4)
- New harness step, the isolated installation gate
  (`demo/bench/harness/installed-gate.mjs`, `render-installed.mjs`, wired
  into `npm run test:e2e`): per effect in `demo/fx/registry.json` it installs
  the component into a temp dir with the real CLI, renders it with its
  `previewProps` under React 18 and React 19, and loads it into headless
  Chrome with ONLY the stylesheets `requires.styles` names, plus the engine.
  It asserts the page renders complete with no engine at all, that the
  effect's key behavior happens with the engine (the counters resolve above
  zero, the pin clock scrubs the year counter, the shots crossfade, the hero
  is split and live), that reduced motion hides nothing and adds no inert
  content, that a `<dl>`'s content model and terms hold, and it counts the
  focusable elements and fails if any is unreachable: the four Sections ship
  none with their preview props, so that last one is a guard, not a claim.
  Proved red on the three defects above before they were fixed.
- `npm run test:e2e` installs the isolated React 18 first
  (`scripts/react18-install.mjs`, the same one `test:react18` uses): the gate
  renders under both majors and fails loudly rather than silently halving
  its coverage.
- New unit gate on the gallery tabs of a Section: every class the React tab
  renders is shown or styled in the CSS tab, and every `content:`
  pseudo-element the CSS tab generates hangs off a class the React tab
  renders. The two tabs are one block spelled twice, and a reader pastes
  both. Proved red on both pane splits above.
- Second pass (verifier finding on fe4d844): that gallery gate compared two
  flat SETS of class names, so either half of the pane split it repaired
  stayed green on its own. The rule back on `.stats .stat::after` with the
  `.count` span still in the CSS-tab markup announces "248+" then "248"
  (`content` computing `counter(n) ""`), the original defect verbatim; the
  mirror, the rule on `.count` with the span dropped from the markup, ships a
  snippet that renders no number at all. Every `content:` rule in the CSS pane
  whose value uses `counter()` is now checked against the element it prints
  on: the class must appear in that pane's own markup, and it must be the
  class the React pane hides from assistive tech when the React pane hides
  one. Proved red on both mutations. `cssPaneClasses()` strips comments as
  `classesIn()` already did, so a class named only in prose no longer counts
  as documented.
- `installed-gate.mjs` closes its HTTP server and every page it opened in a
  `finally`: a throw in the render path no longer leaves a listening socket
  and a pile of tabs behind for the rest of the run.

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
- `<Modal open>` renders the `open` attribute: a modal that starts open is
  now open in the server markup and stays open without JS and before
  hydration (README, "open ones open"), instead of shipping a closed dialog.
  On mount the effect removes that attribute and calls `showModal()`: a
  dialog opened by the attribute is NOT modal, `showModal()` throws on an
  open NON-modal one, and the old `!dialog.open` guard skipped it and left
  it non-modal. It removes the attribute rather than calling `close()`, which
  fires a close event that a controlled parent answers by closing the modal
  it just rendered open. That promotion runs exactly once per open: a
  repeated `showModal()` on a dialog that is already modal returns early by
  spec, but dropping the attribute first walks past that early return, and
  the second call records a node inside the dialog as the element to restore
  focus to, so closing dropped focus on the body instead of the control that
  opened the modal. Visible under StrictMode, which double-invokes effects
  in development and is the default in Next.js and in the Vite and CRA
  templates. The rendered attribute is frozen at the first
  render, since from mount on the effect owns it and React writing it would
  strip `open` off a modal dialog without taking it out of the top layer.
  The no-`<dialog>` fallback path is unchanged, the attribute still tracks
  state in both directions there. No new prop, no API change.

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
- Fourth pass (panel finding): the "paste the preset" CSS snippets for
  `staggered-reveal` and `split-reveal` keyed the entrance rule on the
  `.sv-live` class, while `styles/core.css` keys it on `var(--sv-live)`.
  A consumer who pasted the snippet instead of loading `core.css` missed
  the settle-visible behavior a `once` entry gets from `releaseEntry()`
  (an inline `--sv-live: 1` with the class already removed), so the
  content silently dropped back to hidden the moment the tracker settled.
  Both snippets now copy `core.css`'s own rule shape, the `--sv-live`
  variable declarations included.

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

### React (blind review round 4)
- `<Modal>` without native `<dialog>` support now closes. The effect
  branches once on `showModal`: where the element is unknown there is no
  `open` PROPERTY, so the old `!open && dialog.open` guard could only ever
  open it. The fallback drives the attribute in both directions with
  `setAttribute`/`removeAttribute`, never `toggleAttribute`: the engines
  that reach that branch are the ones without `<dialog>` (Safari below
  15.4, Firefox below 98), and Safari 11 and Firefox 60 to 62 are inside
  the supported floor while predating `toggleAttribute`, where the effect
  would throw and React would unmount the tree.
- `useScenes()` clamps its scene to `count - 1` when the count changes. The
  driver emits nothing at all for `scenes <= 1`, so a count going from N to
  1 used to keep reporting the last index forever, and a consumer marked
  its only shot inert.

### Slider (blind review round 4)
- The wheel assist now reads the container's COMPUTED `scroll-snap-type` at
  init, not only the inline style: an instance set to `none` by a
  stylesheet or a utility class (Tailwind's `snap-none`) is left alone,
  same as an inline one, instead of being snap-suspended and scripted to
  the nearest slide.
- `state().progress` and `--sv-progress` are clamped to 0..1. Elastic
  overscroll drove them past both ends, and a follower chained through
  `onScroll` + `seek(progress)` was seeked outside its own range.

### Click driver (blind review round 4)
- `toggles()` writes `--sv-state` at boot from the target's class, so
  markup that ships open no longer disagrees with its own class until the
  first click.
- Triggers are grouped by the PAIR (resolved target element, toggled
  class) instead of by the `data-sv-target` string, so two triggers naming
  the same panel through different selectors keep each other's
  `aria-expanded` in sync, while two controls toggling different classes
  on that same panel (a hamburger on `open`, a second control on `pinned`)
  keep separate states. Grouping by the element alone made one click
  report `aria-expanded="true"` for both, the second one with its class
  absent.

### Presets and no-JS (blind review round 4)
- `.sv-counter`'s `counter-reset` and `::after` are keyed on
  `:is(.sv, [data-sv])`, like the no-JS guard that feeds them `--sv-int`:
  attribute-only markup used to get the variable but render an empty
  element without JS. The no-JS e2e sweep asserts the digits, not just the
  variable.
- `dialog.sv-pop:not([open])`'s fade is wrapped in
  `@supports selector(dialog:modal)`: the type selector also matches the
  unknown element an engine without `<dialog>` parses, which hid the
  documented static fallback panel with no UA `display: none` behind it.

### Docs (blind review round 4)
Blind review round 4 (Astra on 7489a11), section 2: eight docs mismatches
against the code ADU-129 to ADU-132 shipped.
- The docs page's "Preset vocabulary" table now notes that a scroll-driven `sv-acts`
  clock needs `core.css` as well as `state.css`, matching the import
  comments ADU-129 already fixed in README and AGENTS.
- The no-JS exception list now includes the marquee: `ui.css` animates it
  via a plain `@keyframes` rule that never depends on the driver.
- The compat floor sentence separates what the fallback animates (reveal
  presets `sv-rise`/`sv-fade`/`sv-slide-l`/`sv-slide-r`/`sv-auto`/`sv-drift`
  and pin presets `sv-curtain-l`/`sv-curtain-r`/`sv-rail`) from what stays
  static below the floor, with the real cause per preset: `sv-split-rise`
  has no fallback rule and its animating selector is an `:is()` those
  parsers drop whole, `sv-spread` has no fallback rule either but its
  selector parses fine and simply has no `translate`/`rotate` to apply.
  `src/compat`'s header comment named only curtain, rail and drift as the
  covered presets: it lists the same nine now, plus `sv-deck`,
  `sv-split-rise` and `sv-spread` with a reason each.
- `sv-deck`'s fallback is documented as ADU-131 shipped it: a static,
  non-overlapping unstack, no `max()` involved.
- Modal without `<dialog>` support is documented as an open static panel:
  `styles/state.css` scopes the closed-dialog fade to
  `@supports selector(dialog:modal)` and keeps the type selector out of the
  `display: none` rule, so nothing there hides the element in either state.
  The `open` attribute still tracks state in both directions (ADU-132), so
  the consumer's own CSS can hide it.
- AGENTS.md's pinned-skeleton line now states an inline static wrapper
  gets `position: relative` (ADU-130), matching README.
- The knobs sentence notes the one exception to zero-specificity defaults:
  `--sv-order`'s automatic-stagger value is declared on the child itself,
  by `.sv-auto > :nth-child(n)` and `.sv-stagger > :nth-child(n)`, and an
  inherited `:root` value never applies where the child declares its own.
  Those rules are (0,2,0), so an override needs an inline value or a rule
  at least as specific.
- The "SSR, SEO and the Lighthouse load profile stay untouched" claim is
  scoped to the no-JS path: a JS-enabled Lighthouse run sees the pre-paint
  script hide entrances before paint and the pin helper write heights on
  attach.

### Driver (blind review round 5)
- The driver owns the live state of every element it tracks. It writes the
  flag twice now, as the `sv-live` class and as an inline `--sv-live`, and
  re-asserts both on any measured frame where the DOM disagrees. A React
  `<Track>` renders `className={'sv ' + className}`, so a prop change
  rewrites the whole class attribute and takes the driver-added `sv-live`
  with it: the section faded back out (`.sv` alone declares `--sv-live: 0`),
  and a settled `once` section, with no tracker left to put the class back,
  stayed at opacity 0 for good. The inline flag survives the rewrite; the
  class returns on the next frame the driver measures.
- `track()` on an element that still carries a settled `once` `sv-live`
  clears the class and the inline flag before the first frame, so the new
  entry (which starts not live) and the DOM agree and the entrance replays
  when the element enters the band again.
- Precedence, on tracked elements only: `--sv-live` is now an INLINE
  declaration, and inline outranks every non-important author rule. A rule
  of your own that lifts the flag (`#hero.sv { --sv-live: 1 }`) loses to
  the driver from the first frame its live state changes (`writeLive()`
  runs on a live-state transition or a class disagreement, so an element
  that never enters the band never gets the inline flag), and the "remove
  `sv-live`, add it back next frame and the entrance replays" trick now
  works only on
  elements the driver does not track (a hand-flipped `.sv`, a
  `toggles()`-driven widget). On a tracked element the driver owns the
  flag: re-tracking replays the entrance instead.
- The identity guard runs after `onTravel` and after `onPin` too, not only
  after `onLive`: a callback that untracks its own element no longer gets
  `--sv-pin`/`--sv-scene` written inline (variables the release had already
  cleaned up, so they stayed forever) plus one extra `onScene`.
- The `prefers-reduced-motion` listener falls back to the deprecated
  `addListener` when `MediaQueryList.addEventListener` is missing (Safari
  below 14, inside the supported floor), where the optional call made the
  whole preference a no-op.

### Presets and no-JS (blind review round 5)
- **Added: the `data-sv-off` attribute** (public API, driver-managed).
  Releasing a tracked element now settles it to its no-JS RENDERING, not
  just to a visible entrance. ADU-130's inline `--sv-live: 1` covered the
  entrance presets, but `.sv` stays and `html.sv-on` never comes off, so
  after `stopScan()`, a `ScrollVarsBoot` unmount or an option change the
  pin presets kept reading a clock that had stopped: `.sv-curtain-l`/`-r`
  sat closed over the content, `.sv-deck` stayed stacked in one grid cell,
  `.sv-range` children stayed at `--sv-r: 0` (opacity 0), a `.sv-spread`
  scrubbed from `--sv-t` stayed fanned into an overlapping stack and
  `.sv-stage` kept `position: sticky`, `100vh` and `overflow: hidden`.
  `releaseEntry()` marks the element `data-sv-off`, and every
  `html:not(.sv-on)` guard in `styles/pin.css` and `styles/core.css` now
  has a `[data-sv-off]` twin, so both class markup and `[data-sv]` markup
  settle static. `track()` takes the marker back off. The guard reaches the
  DESCENDANTS these presets style, which an inline variable on the tracked
  element cannot.
- An attribute, not a class: React's `<Track>` renders
  `className={'sv ' + className}`, so a prop change rewrites the whole
  class attribute, and a released element has no tracker left to put a
  dropped class back. A class marker would have snapped the stage back to
  `position: sticky` with the curtains over the content, permanently.
- Each `[data-sv-off]` twin is its own rule, never a selector appended to
  the `:is(.sv, [data-sv])` guards next to it: a parser that predates
  `:is()` throws away the whole selector list, and Firefox 72 to 77 is
  inside the supported floor and not covered by the `@supports` block
  below.
- Second pass (verifier findings in Chrome on ce777d0): the marker is read
  as `[data-sv-off] X`, which matches through ANY depth, so a released
  ANCESTOR settled every preset under a descendant whose clock was still
  running. `track(outer)`, `track(inner, { pin: true })`, `untrack(outer)`
  left the inner tracker writing `--sv-pin` into a stage flipped back to
  `position: static`, curtains at `display: none` and a deck unstacked.
  Nested trackers are a first-class pattern here (the nearest tracker, not
  any live ancestor, owns spread), and `:has()` is far above the supported
  floor, so the driver keeps the marker honest instead: `releaseEntry()`
  marks an element only once nothing tracked is left inside it, and each
  release settles the ancestors that were waiting on it, since `stopScan()`
  releases an outer tracker before its inner one. `track()` strips the
  marker off the whole ancestor chain, not only off its own element, so a
  section re-mounting under a released one does not run its clock against
  presets already settled static.
- The `.sv-spread` twin fires when the tracked element IS the spread
  container too. Its no-JS guard (`html:not(.sv-on) .sv-spread > *`)
  requires no tracker ancestor, while the twin was a descendant combinator
  and needed a separate marked ancestor: with the documented scrub idiom on
  the container itself (`<div class="sv sv-spread" data-sv data-sv-travel>`)
  a released spread stayed at `translate: calc(100% + 16px)`,
  `rotate: 5deg`, where no JS gives `none`. Both guards with no ancestor
  requirement now carry the second marker position too
  (`.sv-spread[data-sv-off] > *`, `.sv-stage[data-sv-off]`), as plain comma
  lists rather than `:is()`. The audit compares each twin's ANCESTOR SHAPE
  with its guard's instead of stripping a selector prefix, and reads every
  file in `styles/`, not the two that carry guards today.
- `styles/pin.css` carries an `@supports not (translate: 0)` block: with
  JavaScript on and no `compat()` call, an engine without individual
  transform properties (Chrome below 104, Firefox below 72, Safari below
  14.1) runs the driver, so `html.sv-on` is set and the no-JS guards cannot
  fire, while the stacking half of these presets is plain layout and
  survives. The deck unstacks and the curtains open there too. The curtains
  open with `transform` rather than the no-JS `display: none` on purpose:
  `scrollvars/compat`'s fallback sheet re-expresses the same panels with
  that property and is appended later, so it still outranks this block and
  animates them.
- Third pass (verifier and panel findings in Chrome on f5a81eb): the marker
  had two more holes, both in the bookkeeping around the waiting set. A
  `once` entrance descendant leaves the entry map inside `apply()`, not
  through `releaseEntry()`, and that second exit never swept the elements
  waiting on it: an ancestor released while such a descendant was still
  tracked stayed unmarked for good, its `.sv-stage` sticky and clipping with
  the curtains over the content, until an unrelated later release happened to
  sweep the backlog. The sweep is its own function now and both exits call
  it, without marking the settled element itself, which stays live. And
  `track()` stripping the marker off the ancestor chain FORGOT those
  ancestors: released, unmarked, and never marked again. An ordinary
  `<Track>` prop change under a released shell reaches it, and so does
  `stopScan()` followed by one section re-mounting, which is what the
  stripping exists for. A cleared ancestor that carried the marker, or was
  still waiting for it, goes back into the waiting set, so the next release
  that empties it marks it again. The sweep returns immediately while
  nothing is waiting, so an ordinary release pays nothing for either fix.
- `markReleased()` writes the attribute with the same optional call
  `clearReleased()` removes it with (`setAttribute?.`), so both halves of the
  pair hold on the same elements.
- Size, measured, because these are published numbers: the release
  bookkeeping takes the core entry (`scrollvars`, min+gzip) from 6.0 KB to
  6.2 KB, and the stamped bundle comparison with it, from `~8× less bundle`
  than gsap + ScrollTrigger to `~7×` (the ratio is arithmetic on the stamped
  KB, 46.3 / 6.2). The released twins take `styles/pin.css` from 2.6 to
  2.9 KB gzip and `styles/core.css` from 2.3 to 2.4 KB, `styles.css` from
  8.2 to 8.6 KB and the headline typical page from ~4.7 to ~5.0 KB, with
  their comments trimmed to one note per guard family (`styles/state.css`
  is back at its 2.2 KB: the note that had moved it is in this changelog,
  which costs no bytes on the wire). `styles/core.css` crosses its rounding
  boundary on the RULES alone: 2392 bytes at the base, 2411 with the new
  selectors and no comment at all, against 2406 for 2.35 KB.
- Fourth pass (the ADU-145 docs verification, round 5): the `@supports not
  (translate: 0)` block above unstacked the deck and opened the curtains,
  but left `.sv-stage` at `position: sticky`, `height: 100vh`,
  `overflow: hidden`, whose only escapes were the no-JS, released and
  reduced-motion guards, never this block. Measured in Chrome with the
  block's declarations applied by hand: four 45vh cards in an 800px stage
  landed at 0..360, 360..720, 720..1080, 1080..1440, so the fourth card sat
  entirely outside the clip box and the third was half gone. The block now
  resets the stage the same way its reduced-motion twin already does, and
  its own comment states exactly what it guarantees: the curtains sit
  parted and static, nothing overlaps, content stays in flow.
- Size, measured: the stage reset takes `styles/pin.css` from 2.9 to 3.0 KB
  gzip (2995 to 3030 bytes; the new selector alone costs one byte against
  the file's existing repetition, the comment the rest) and `styles.css`
  from 8.6 to 8.7 KB (8845 to 8880 bytes).

### Gallery (blind review round 5)
Blind review round 5 (Astra on 7992458), findings 7c, 10, 11.
- `StickySteps`'s reduced-motion block now resets `.st-steps > li` and
  `.st-dots i` too (opacity 1, no translate, no scale), not only `.st-shot`:
  the pinned stage unpins under reduced motion by design, so `--sv-scene`
  keeps advancing, and every step not at the current scene stayed at 30%
  opacity and slid with the raw scroll forever. The installed gate's
  reduced-motion pass asserts every step and dot resets, for `sticky-steps`.
- `RotatingWords` guards an empty word list (no interval scheduled, so
  `(i + 1) % 0` never runs and `--sv-word` never goes `NaN`) and clamps the
  index on the render that sees a shrunk list, same shape as `useScenes`.
  Previously a late word list (fetched after mount) could tick once against
  an empty array, poison the index to `NaN`, and never recover once real
  words arrived; a shrinking list stranded the index past the end.
- The staggered-reveal and split-reveal "paste the preset" snippets carry a
  fallback on every `var(--sv-*)` they read (`--sv-ease`, split-reveal's
  `--sv-duration` and `--sv-stagger` too): without `core.css` the bare vars
  made the `transition` shorthand invalid and the entrance snapped instead
  of animating. split-reveal's snippet also regained
  `.sv-split > span[aria-hidden] { display: inline-block }`
  (`styles/core.css`'s own rule): without it `translate` does nothing on
  the non-replaced inline spans. The GSAP React snippet's `useRef` is typed
  `gsap.core.Timeline | null`, matching the installed `GsapScrub` twin,
  instead of a type that never allows the `null` the ref is assigned.

### Scanner (blind review round 5)
- `scan()`'s `MutationObserver` callback no longer untracks a node that is
  still connected. A DOM "replace all" (`parent.replaceChildren(...)`,
  `replaceWith`) queues one mutation record with a retained node in BOTH
  `addedNodes` and `removedNodes`, and a list reorder splits the same move
  across a removal record and an insertion record in one batch: either way
  the node was never really removed by the time the observer fires. The
  remove path now bails with `if (el.isConnected) return`, so a retained or
  reordered node keeps its live entry instead of being untracked and
  re-tracked, which used to strip its state and hide it for a frame.

### Scanner (blind review round 5, second pass)
- The remove path's connectedness check is `scope.contains(el)`, not
  `el.isConnected`. A scoped `scan(root)` only observes `root`'s own
  subtree: a tracked node moved OUT of `root` into another still-connected
  part of the document leaked forever, since it stayed `isConnected` and no
  further mutation record for it ever arrives. `scope.contains(el)`
  degrades to the same check as `isConnected` when `scope` is the document
  (the churn fix above still holds), is correct for a scoped root, and also
  fixes `scan()` on a genuinely detached root, where `isConnected` is
  always false and could never trigger the churn guard at all.

### Pointer (blind review round 5)
- `trackPointer()` only writes `--mx`/`--my` on a descendant of its own
  container. `event.target.closest(selector)` used to walk straight past
  the container, so a `.sv-tilt` ANCESTOR of the tracked container matched
  and received the pointer output. The match is now required to be inside
  the container (`container.contains(match) && match !== container`).
- Teardown now clears `--mx`, `--my` and the `sv-pointer-leave` class from
  the last hovered element. It used to only remove the listeners and cancel
  the pending frame, leaving a destroyed instance's card frozen mid-tilt.

### React (blind review round 5)
- `<Slider>` composes a consumer `onPointerEnter` / `onPointerLeave` with
  autoplay's hover pause instead of letting the props spread replace it.
  Both are public props (the component extends `HTMLAttributes`), so a
  consumer `onPointerEnter` used to silence the pause entirely, and a lone
  consumer `onPointerLeave` left the slider hovering forever, autoplay
  never resuming after the first hover.
- `<Slider>`'s responsive `perView` stylesheet is rendered as raw text
  (`dangerouslySetInnerHTML`) instead of a `<style>` child. react-dom
  18.3.1 escapes `"` to `&quot;` inside a `<style>`, 19 does not, and
  `<style>` is raw text so the entity never decodes: on React 18 the server
  dropped every `[data-sv-uid="..."]` rule the responsive map emits, and
  hydration did not repair it. Same root as the gallery sections, which
  already render their CSS this way. The raw sink also drops React's
  `</style` escaping, which is what kept an interpolated value inert, so
  `perViewCss` coerces every part it interpolates with `Number()`: a
  `perView` off untyped data (a CMS) renders `--sv-per-view:NaN`, a
  declaration the CSS parser drops, and can neither close the element nor
  emit a tag. No CSP change, the sheet is still one inline `<style>`.

### Testing (blind review round 5)
- `test/react.test.mjs`'s `flushFrames` rethrows what a frame scheduled by
  the running test throws, and keeps swallowing only frames left pending by
  earlier tests (queued callbacks carry the test that scheduled them). A
  driver or canvas frame that blew up could not fail a React test before.
  A frame scheduled from inside a running frame inherits that frame's test,
  not the flushing one, so a leftover canvas loop rescheduling itself does
  not blow up whichever later test happens to flush it twice.
  Two harness tests pin both halves.

### Docs (round 5, ADU-145)
Docs read against the code merged by the five round-5 code tickets.
- `onTravel`/`onPin` are documented as exempt from near-viewport culling
  when tracked with a custom `root`, by design: the callback fires every
  frame no matter where the root sits on screen.
- The "remove `sv-live`, add it back next frame" replay trick is now
  documented as scoped to elements the driver does not track; a tracked or
  released element pins `--sv-live` inline, which outranks a non-
  `!important` author rule, so re-tracking is what replays the entrance
  there instead.
- The outputs table now says which option activates each opt-in clock
  (`--sv-t` needs `travel`, `--sv-pin` needs `pin`, `--sv-scene` needs
  `scenes` greater than 1), and the `sv-spread` scrub recipe no longer
  reads as if `--sv-t` were always written.
- The browser-support section now documents `pin.css`'s own
  `@supports not (translate: 0)` net accurately: it covers four rules (the
  stage, both curtains, the deck), not every pin preset; the stage resets
  to flow so nothing is clipped by the stage itself. `sv-rail` is the one
  exception again: the no-JS wrap guard does not apply with JS running, so
  an unwrapped track can run past the viewport edge, reachable only by a
  page-wide horizontal scroll and not at all under an
  `overflow-x: hidden` ancestor; `compat()` restores its travel, but with
  the stage released into flow that travel mostly happens off screen.
  Also noted, as a caveat pending ADU-150: a released stage can leave a
  parked curtain panel outside it, extending the document with an empty
  sideways scroll.
- The "below the floor nothing breaks" design rule holds with or without
  `compat()`: skip it and the page renders complete and static, call it
  and the page animates instead.
- `data-sv-off`, the driver-managed released twin of `html.sv-on`, is
  documented next to it in README and AGENTS: added on release, removed on
  re-track, settles every preset under it to the no-JS rendering; a
  released ancestor still holding a tracked descendant keeps waiting.
- README's compat paragraph and `src/compat/index.ts`'s header comment
  (the two hand-kept copies) stay in agreement; this pass added text next
  to them without touching that pairing.

### Pointer (blind review round 6, ADU-152, live regression)
- `trackPointer()` accepts a container that matches its own selector again.
  Round 5's ancestor fix (`container.contains(match) && match !== container`)
  closed the ancestor case it was written for but also closed the SELF
  case, which is how the gallery's flagship hero is wired
  (`trackPointer(hero, { selector: '.sv-hero' })` on the hero itself): every
  pointermove was silently dropped, `--mx`/`--my` never wrote, and the orb
  parallax was dead. `container.contains(match)` alone still rejects an
  ancestor (an ancestor is never inside its own descendant) while allowing
  the container itself (`Node.contains()` is true for the node itself), so
  the extra `match !== container` was never needed.

### Testing (round 6, ADU-152 fix pass)
- The gallery regression guard's own selector match was a false negative:
  its `\b${cls}\b` boundaries treat a hyphen as a word edge, so a selector
  reading `.hero` passed as long as ANY sibling class started with
  `hero-` (`hero-orb`, `hero-inner`), even though no element carries the
  exact class `hero`. It now splits each `class`/`className` attribute on
  whitespace and compares tokens exactly, and requires the CSS-side match
  to not be followed by a further word character or hyphen either. Proved
  red by mutating `hero-cinematic`'s React selector to `.hero`, proved
  green again on revert.
- The same guard now also scans `previewScript`, the field `hero-cinematic`
  actually renders through in the gallery (the exact path ADU-152 broke in
  production); it previously scanned only `preview`, `css`, `tailwind` and
  `react`.
- `trackPointer()` teardown while the last hovered element IS the
  self-matched container (the hero's own wiring) is now a locked-in test:
  the runtime already cleared `--mx`, `--my` and `sv-pointer-leave`
  correctly there, this closes the coverage gap.

### Slider (blind review round 6)
- The slider re-asserts the classes it owns on every measure, the way the
  driver does for its live flag: `sv-slider`, `sv-slider-y` and
  `sv-draggable` on the rail, `sv-active` on the slide nearest the centre.
  A framework that owns the rail's `className` (React re-rendering it when
  a prop like `perView` changes, with no retrack behind it) used to drop the
  first three, and a consumer restyling a slide dropped `sv-active` until
  the active index happened to change. Each is one `classList` read per
  measure, with a write only when the DOM disagrees.
- `state().position` interpolates between adjacent slide CENTRES, so the
  documented continuous position never goes backwards. It normalized the
  distance by a single slide's own size before, which made it jump back at
  every midpoint as soon as the slides had a gap: two 100px slides 16px
  apart read 0.580 and then 0.430 one pixel of scroll later. Measured old
  against new on the same fixture: gapless sliders with equal-size slides
  read exactly as before (max difference 0.0000 over 121 samples across
  the whole range). Gapless sliders with unequal slides (`--sv-span`
  making slides different widths, `--sv-gap: 0`, a real configuration)
  differ: 0.75 old against 0.6667 new at scrollLeft 0, maximum difference
  0.0833. The new value is the one that is monotone and centre to centre;
  unequal gapless slides now reading centre to centre is the intended
  contract, not a regression.
- The wheel settle (the glide 200 ms after the last wheel event) is dropped
  by whatever takes the position over inside that window: a pointerdown,
  `goTo` and everything routed through it (arrows, keyboard, autoplay), and
  `seek`. It only listened to the next wheel event and to `destroy` before,
  so a drag started right after a trackpad pan had a glide fighting it. A
  press that drops a pending settle also resumes the snap the wheel had
  suspended, since the settle it replaced is no longer there to do it.

### React (blind review round 6)
- `<Slider>`'s engine classes survive a re-render: `perView` is not an
  attach dep, so React rewrites the rail's class attribute with no retrack,
  and a consumer's own slide `className` rewrite drops `sv-active`. Fixed
  in the core slider (above), so plain `slider()` consumers whose framework
  owns the class attribute get it too.

### Scanner (blind review round 6)
- `scan()`'s `removeSplit` now bails with the same `scope.contains(el)`
  guard as `remove()`. A retained `[data-sv-split]` node (a batch
  `replaceChildren`/`replaceWith` that keeps it, or a reorder split across
  a removal record and an insertion record in one callback) was still
  restored to its original markup and dropped `sv-split`, and nothing ever
  re-split it, since the guard added for `remove()` was not carried five
  lines down. `removeSplit` was the only other early-exit path that guard
  had skipped.

### Gallery (blind review round 6)
Blind review round 6 (Astra on 3e2c18b), finding 8a. Successor of ADU-144.
- `sticky-steps`'s CSS tab now resets `.st-steps > li` to opacity 1 under
  reduced motion too, not only `.st-shot`: ADU-144 fixed this in
  the installed component but never in the tab the docs tell a reader to
  paste, so pasted code left every non-active step at 30% opacity forever
  under reduce. The reset sits in its own
  `@media (prefers-reduced-motion: reduce)` block placed AFTER
  `.st-steps > li { opacity: calc(...) }`, mirroring the installed
  component: both selectors are `.st-steps > li`, so with equal specificity
  the later rule in source order wins whichever one the media query matches,
  and a reset written into the existing media block above the base rule
  never applies. A gate (`test/cli-components.test.mjs`) compares, for
  every Section with both a CSS tab and an installed component, the
  selectors inside each side's `@media (prefers-reduced-motion: reduce)`
  block, past the installed component's own wrapper-class scoping
  (`.sv-hero`, `.sv-steps`, ...) and past chrome the installed component
  renders that the tab never documents (sticky-steps' dots), and fails on
  any drift. Audited every other effect for the same split: `hero-cinematic`
  already agreed on both sides; `timeline-scrub` and `stats-countup` carry
  no reduced-motion block on either side; `coverflow-slider`'s tab and
  installed component reset the same three properties under its own,
  differently named class (`.slide` against `.cf-slide`), a naming choice
  the Sliders category is free to make, not drift, so the gate is scoped to
  Sections the same way the CSS/React pane-pairing gate above already is.
- Second pass (verifier findings on 29669c0): that selector-text gate could
  not see either half of the defect it was written for, because it reads
  selectors and never declarations or cascade position. The e2e harness now
  judges the rendered result instead. `demo/bench/harness/installed-gate.mjs`
  renders every Section's CSS tab on its own (the tab's markup, only the
  tab's CSS, `html.sv-on` and the driver's own variables set by hand, under
  `prefers-reduced-motion: reduce`) and runs the identical probe the
  installed component passes: the reduced-motion assertion is now one
  function shared by both spellings of a section rather than two that drift.
  Proved red in Chrome on both mutations, the wrong value and the wrong
  cascade position, each of which leaves the selector-text gate green.
- Third pass (verifier finding on the same round): `splitPane` in
  `demo/bench/harness/installed-gate.mjs` sliced a gallery CSS tab into
  markup and CSS on the first blank line without checking that one was
  found. If a reformat of `scripts/fx-data.mjs` ever collapses that blank
  line, `markup` becomes nearly the whole pane, CSS text included as
  unstyled nodes, `css` becomes one character, and the rendered page
  carries no applied stylesheet at all, so the reduced-motion probe passed
  by coincidence rather than by the behavior it claims to check, exactly
  the silent failure the file's own comment promised could not happen.
  `splitPane` now throws a named error when the separator is missing.
  Proved red by collapsing the blank line in `sticky-steps`'s CSS tab and
  green again once restored; a unit test (`test/installed-gate.test.mjs`)
  covers both the throw and the ordinary split.

### Canvas (blind review round 6)
- An engine whose CSSOM has no `aspect-ratio` at all (below the README's
  Safari 12.1 canvas gate) no longer has its canvas marked `pinned`. The
  previous pass stopped the throw there but kept the premise: the ratio
  write was dropped by the engine, yet `pinned` still switched the
  backing-store write to rounding both axes independently, which is only
  safe once the CSS engine owns the height. It was instead still derived
  from the intrinsic attribute ratio the harness itself rewrites every
  pass, so the runaway ADU-107 fixed came back below the floor: a 30x61
  canvas at DPR 0.51 walked 62, 64, 66, 68, 70 CSS px, growing 2 per pass,
  unbounded. Below the floor the harness now keeps the width pin (that
  part does land, and it is what stops the width axis from following),
  writes no ratio at all, and stays unpinned, so the free-axis derivation
  anchors height to the ORIGINAL attribute ratio and it settles on the
  second pass.

### Driver (blind review round 6)
- The pin helper no longer writes its tall wrapper height below the
  individual-transform floor (Chrome 104 / Firefox 72 / Safari 14.1),
  the same way it already skips it under reduced motion. The
  `@supports not (translate: 0)` net in `styles/pin.css` releases
  `.sv-stage` there (position static, height auto, overflow visible), so a
  pinned section renders at its natural height, but `height: 320vh` stayed
  on the wrapper: with JS on, the content sat at the top of the box with
  two blank viewports under it. The helper asks
  `CSS.supports('translate', '0px')` and takes the in-flow branch when the
  answer is an explicit `false`; an engine too old to answer at all is
  also too old for the `@supports` rule that releases the stage, so the JS
  and the CSS always agree on which side of the floor the page is.
- `prefersReducedMotion()` and `scrollToScene()` no longer return a stale
  `false` before anything has ever been tracked. The `reducedMotion` flag
  was only ever set inside `init()`, which only `track()` calls, so asking
  either function first picked the wrong answer for a reduce user. Both now
  read the media query lazily on first use, and fall back to the live
  `reducedMotion` flag once `init()` has wired its change listener (the
  `addListener` fallback for pre-Safari-14 `MediaQueryList` is untouched).

### Docs (round 6, ADU-159)
Docs read against the code merged by the seven round-6 code tickets.
- The TypeScript import block that pulls in the CSS is no longer labeled
  `app/globals.css`, a CSS file that cannot hold `import` statements: it
  now points at `app/layout.tsx` (or any entry file).
- "React renders zero times during scroll" is scoped to what actually
  never re-renders: `useScenes` and `useSlider` hold the current index in
  state and re-render on a discrete change, never per frame.
- `sv-split-rise` is documented as static only below `:is()` support,
  where its `:is()`-written rule is dropped whole; between `:is()`
  support and the individual-transform floor the rule still matches and
  its `opacity` declaration still transitions, so the text fades in
  without rising.
- The pin helper's "returns to flow" list gained a third case: below the
  individual-transform floor, matching ADU-158 (it already covered no-JS
  and reduced motion).
- `compat()`'s `sv-rail` fallback is documented as it actually behaves:
  it ignores `--sv-rail-start`, starts at `translateX(0)` instead of
  entering from offscreen, and is stationary whenever the track's own
  width equals the viewport, instead of the previous "gives it back its
  own scroll-linked travel" claim.
- Checked against the round-6 code tickets: the Modal SSR sentence
  ("open ones open") and the pin-helper wrapper description already
  match ADU-156 and ADU-158, no further change needed there beyond the
  floor case above.
- Second pass (verifier finding on 213c15b): the compat header comment in
  `src/compat/index.ts`, which `tsc` emits verbatim into the published
  `dist/compat/index.js`, still opened with the old flat claim, three
  presets stay static, one reason each, including `sv-split-rise` with
  no fallback rule at all. It now carries the same two-band split as the
  README sentence above: `sv-deck` and `sv-spread` stay static, one
  reason each; `sv-split-rise` is static only below `:is()` support and
  fades in without rising above it. The README's closing "stay static or
  progressive" list also still named `sv-split-rise`, reading like the
  old flat claim; it is dropped from that list now that the paragraph
  above it already carries the nuance.

### Slider (blind review round 7)
- The active slide is the one nearest the viewport centre in PIXELS. The
  argmin divided each distance by that slide's OWN width first, so a wide
  slide always looked nearer than a narrow neighbour: with a 100px slide
  beside a 300px one (centres 50 and 250, midpoint 150) the active flipped
  to the wide slide at centre 101. `sv-active`, `--sv-slide`, `onSlide`,
  the glide a drag release lands on and the wheel settle all took that
  index. `--sd` is unchanged, still normalized by each slide's own size,
  which is what the CSS reads; an exact tie still keeps the first slide.
  Sliders whose slides are all the same width read exactly as before.
- A destroyed slider stops moving. `destroy()` set no flag, so `next`,
  `prev`, `goTo` and `seek` still scrolled the container from a frame of
  their own, on geometry nothing measures any more. Every command is a
  no-op after `destroy()` and nothing schedules a frame, so a scroll or an
  observer record already in flight measures nothing either.

### React (blind review round 7)
- `<Slider>`'s imperative `destroy()` drops its handle instead of keeping
  it, so the autoplay interval (which reads the handle on every tick and
  returns when there is none) stops advancing a slider the consumer has
  destroyed. With the core fix above, a destroyed slider is inert from
  either side.

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
