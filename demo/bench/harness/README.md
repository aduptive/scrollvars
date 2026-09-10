# Bench harness

## Gallery browser regressions

From the repository root:

```bash
npm run demo:sync
npm ci --prefix demo/bench/harness
npx --prefix demo/bench/harness playwright install chromium firefox webkit
npm run test:browsers             # or: npm run test:browsers -- webkit
```

Runs the generated gallery in all three engines: visible scroll changes,
rail endpoints at desktop/tablet/mobile widths, long CMS content after mount,
resize, reduced motion and no-JS fallbacks for all six Sections. CI runs an
engine matrix; release publishing requires all three to pass.

WebKit with a mobile viewport is not a physical iPhone or shipping Safari.
Before claiming device coverage, manually check Safari/iPhone: full scroll
in both directions, rotation and browser-toolbar height changes, large text,
keyboard focus and reduced motion. Record device/OS and results with a release.
The fit-to-flow fallback deliberately stays released after resizing back;
retracking starts a new measurement, avoiding a surprise jump while reading.

## Performance measurements

Published measurements are dated snapshots. Check out `meta.commit` from the
raw JSON to reproduce their exact sources; a newer patch is not implicitly
covered by an older measurement. Includes the CPU split the in-page
runner cannot measure. Serves the repo's demo/ locally, drives each engine
page in headless Chrome over CDP, waits for the page's own DONE payload
(frame stats) and reads `Performance.getMetrics`.

```bash
cd demo/bench/harness
npm i
npm run measure                    # main + deep DOM + six gallery sections, 3 runs each
node measure.mjs --runs=5          # more repetitions
node measure.mjs --throttle=4      # 4x synthetic CPU throttle (fixed-work ratio recorded)
CHROME=/path/to/chrome node measure.mjs
```

Scenarios: `main-900` (60 sections x 15 boxes; ScrollVars vs idiomatic GSAP
vs batched GSAP (one trigger per section, the expert version) vs
framer-motion) and `deep-{5,20,50}` (a realistic subtree under every box:
the style-recalc curve as DOM depth grows; both ScrollVars modes vs batched GSAP).
`gallery-*` measures each of the six generated premium-section pages, including
the surrounding gallery UI, with page outputs disabled.

Output: median-of-N tables on stdout + `../results/latest.json`. Engine
order rotates every repetition. Startup and scroll costs are separate. Raw
runs, source hashes, version, frame stalls and the fixed-work throttle ratio
are recorded in JSON. No frame interval is discarded for being slow.
`scrollvars-local.html` is the same page with `setPageOutputs(false)`; it is
a variant, not a second implementation. Run without competing browser/tests
or heavy workloads. Use `--out=name.json` for experiments. Metrics are not
a guarantee of physical-device performance.

The GSAP pages pin 3.15.0 (both scripts); React and Framer URLs also pin exact versions. GSAP + ScrollTrigger measure 45.2 KB gzip (level 6, bytes/1024), summed over their two CDN scripts.

The performance runner uses Puppeteer’s default 800×600 viewport for all pages.
Responsive fit-to-flow fallbacks may apply in gallery rows; these are not
measurements of every animation state. The separate browser suite checks active
pins at 1400×900 and narrow-screen fallbacks. Inspect per-run ranges as well as medians.

The normal profile is headless; the throttled profile uses a headed Chrome
window to avoid frame starvation. Compare engines within a profile. The fixed
work ratio calibrates that JavaScript loop, not the entire rendering pipeline.

## Direct rail experiment

`node measure.mjs --scenarios=rail --runs=3 --out=rail-experiment.json`
compares the existing CSS rail with callback-only tracking that writes
`translate` directly. Both use the same driver, four-decimal progress, scroll
path, DOM, dimensions and compositing hint; page outputs and the unused view
clock are disabled in both. Each rail has 20 cards with 5, 50 or 200 text
descendants per card. The direct version caches dimensions through its own
ResizeObserver; its startup cost is included separately. `rail-direct.html`
is an alias for the same fixture with `mode=direct`, not another source file.
The browser suite verifies identical positions, reverse scroll and resizing
in Chromium, Firefox and WebKit before performance is compared in Chrome.

Decision criterion, set before measurement: seek at least 15% lower median
total task time on the two larger workloads, with consistent repetitions,
no material frame regression and no more than 10% total-task regression on
the small workload. Confirm on a second profile before adopting. A small or
inconsistent gain does not justify a new runtime path. This fixture is an
experiment only: it does not establish reduced-motion, no-JS or production
lifecycle support for a new preset. Do not change the public API on this
evidence alone. Main-thread task time includes work beyond script/style/layout;
the CDP metrics do not isolate raster or GPU cost.

### Result: keep the candidate, not a blanket replacement

Measured 2026-09-09 UTC with Chrome 152.0.7977.83: 36 executions,
12 seconds each, three alternating repetitions per variant/workload/profile.
Sources are identical across profiles (all recorded SHA-256 hashes match).
Raw normal results: [`rail-experiment.json`](../results/rail-experiment.json),
source commit `06598fd`; synthetic 4x results:
[`rail-experiment-4x.json`](../results/rail-experiment-4x.json), source commit
`4757e8e`. These are experiments, separate from the published comparison table.

All values below are medians in milliseconds; reductions compare variants
within a profile, never normal versus throttled Chrome.

| Profile | Text descendants/card | Total task: CSS → direct | Reduction | Style recalc: CSS → direct |
| --- | ---: | ---: | ---: | ---: |
| Normal, headless | 5 | 964 → 529 | 45.1% | 486 → 41 |
| Normal, headless | 50 | 2008 → 587 | 70.8% | 1503 → 42 |
| Normal, headless | 200 | 2980 → 572 | 80.8% | 2564 → 40 |
| Synthetic 4x, headed | 5 | 293 → 116 | 60.4% | 143 → 5 |
| Synthetic 4x, headed | 50 | 1351 → 174 | 87.1% | 1024 → 5 |
| Synthetic 4x, headed | 200 | 4433 → 172 | 96.1% | 4016 → 4 |

Every direct run used less total task time than every CSS run within the same
workload/profile. Both variants delivered 60 fps with zero frames over 25ms;
p95 was 16.7–16.8ms normally and 18.5ms in the headed 4x profile. This proves
CPU savings in this fixture, not a visible smoothness improvement or a higher
frame-rate ceiling. The fixed-work calibration ratio was 3.96–4.17 (median
4.06). It is not a physical phone test. Startup medians differed by at most
2ms. End-of-run JS heap was higher in the direct variant (up to 2.3MB versus
0.9–2.1MB for CSS); this is not retained memory after forced GC, and no memory
improvement is claimed. Paint/raster/GPU time was not isolated.

The candidate passes the predeclared CPU/frame criterion. Keep the existing
CSS presets and public clocks intact: the prototype uses today's `onPin`
callback with `view:false` and no `pin` output, so no new core API is needed.
The next adoption gate is the real CaseStudyRail with representative CMS
content, including images/fonts arriving late, resizing, teardown, reduced
motion and fit-to-flow. Check whether the extra callback/measurement code is
worthwhile for ordinary three-card sections too. A private, non-inheriting
output on the moving rail is another candidate to compare before adding a
general rendering mode; public inherited clocks must not change semantics.

### Local private CSS clock experiment

`node measure.mjs --scenarios=rail-local --runs=3 --out=rail-local.json`
compares the inherited preset, direct translate and `mode=localized` on the
same fixture. The third path writes a private registered numeric property
with `inherits:false` on the rail itself; CSS computes the translate from
that clock and the driver's existing stage-width measurement. It adds no
extra ResizeObserver, dimension cache or per-frame layout read. Public
clocks are unchanged. The third property is registered in every variant's
stylesheet to keep startup inputs comparable. Unsupported registration can
still render the formula as an ordinary inherited custom property; no
performance claim is made for that fallback.

Three variants × three rotating repetitions give each variant each order
slot once. Geometry, reverse and resize checks cover all three browsers.
Predeclared criterion: retain the local clock as a candidate if it saves at
least 15% total task time versus inherited CSS in the two large workloads,
stays within 10% of direct JS there and introduces no material frame
regression. If its results overlap direct writes, prefer the smaller
implementation that leaves animation math in CSS. Real-gallery lifecycle
and accessibility validation still gates adoption.

The first three-way run is retained in
[`rail-local.json`](../results/rail-local.json), source commit `73d8eec`.
Its task timings varied strongly (for example, inherited CSS with 50 text
descendants/card measured 1637, 394 and 1693ms). The local-clock median on
the largest DOM was 685ms versus 443ms direct: **55% slower**, outside the
predeclared 10% allowance. Do not promote this variant from these results.

The harness now also records `animation` per rail sample: callbacks,
four-decimal progress changes and minimum/maximum progress. All three paths
use the same audit callback, reset before the scroll window. Inspect these
alongside runner frames: a 60fps workload clock alone does not prove that
the animation received the same number of updates. Counts are retained even
when unexpected, not filtered out. Recheck anomalously cheap samples for
missing updates before attributing variation to warmup, thermal conditions
or the renderer. Historical files predate this instrumentation; their frame
counts are runner counts, not independently audited animation delivery.

[`rail-local-cadence.json`](../results/rail-local-cadence.json) records the
first audit pass (source `a938697`, one repetition per cell, nine executions).
Every sample delivered 719 quantized progress changes for 720 runner frames,
with minimum below .001 and maximum above .999. This excludes missing
progress delivery in these nine samples; it does not retrospectively prove
the cause of the earlier outlier or measure GPU presentation.

| Text descendants/card | Inherited task ms | Direct task ms | Private-clock task ms |
| --- | ---: | ---: | ---: |
| 5 | 902 | 446 | 548 |
| 50 | 2052 | 545 | 578 |
| 200 | 3038 | 669 | 669 |

This single audit pass is not a new performance verdict. The private clock
ties direct writes in the largest cell here, versus the earlier 55% higher
median. There is no consistent advantage over the direct candidate, and the
earlier acceptance gate remains unmet. Keep it benchmark-only and prioritize
the real-gallery adoption gate; do not add a general output-mode API on
these results. Geometry and non-inheritance checks pass in all three browser
engines; the core and shipped component implementations have not changed.


### Real CaseStudyRail experiment

`node demo/bench/harness/measure.mjs --scenarios=casework --runs=4 --out=casework-experiment.json`

This loads the actual generated gallery page at 1400×900 (active pin), then
retracks its preview with the existing pin helper and `view:false` in both
variants. The direct variant cuts pin inheritance on the rail, caches its
measured travel with a ResizeObserver and writes `transform` from `onPin`.
The wrapper retains its public clock, pin height, sticky offset and flow
helper. This is benchmark-only: descendant CSS that consumes the inherited
pin clock would need an explicit contract before adopting this boundary.

Standard content and an identical-looking deep rich-text variant (13 nested
spans per word) are measured. Four rotating repetitions balance first/second
order. Both retain the full gallery, including code panels outside the pin;
progress-change counts therefore need not equal full-page runner frames.
Inspect progress coverage and variant cadence before comparing CPU totals.
Predeclared gate: at least 15% lower median task time for rich content, no
more than 10% regression for standard content, and no material frame-delivery
regression. Cross-browser checks cover forward/reverse geometry, resize,
live reduced motion, late CMS overflow, latched flow and cleanup. Passing
this gate is evidence for a candidate, not automatic component adoption.


[`casework-experiment.json`](../results/casework-experiment.json) records
four balanced repetitions (source `67545f2`, Chrome 152). Median task time
fell from 696.5 to 557.5ms for standard content (20.0%) and from 785 to
612ms for deep rich text (22.0%). Recalc fell from 216.5 to 89ms and from
347 to 92.5ms respectively; script time did not improve. All 16 samples
received 307 progress changes, covered 0–1 and delivered 60fps. This meets
the CPU gate, but proves headroom rather than smoother visible frames.

Before adopting the extra JS, compare a smaller alternative: keep the
existing CSS transform and set `--sv-pin:0` only on the static cards. This
stops clock inheritance into card contents while leaving the animated rail's
clock intact. Three rotating repetitions across CSS/direct/boundary variants
balance every order slot. Retain this CSS-only candidate if it saves at
least 15% task time on rich content, stays within 10% of direct writes in
both workloads and does not worsen frames. The same inheritance contract
caveat applies; no public driver clock changes are proposed.


`node demo/bench/harness/measure.mjs --scenarios=casework-boundary --runs=3 --out=casework-boundary.json`

[`casework-boundary.json`](../results/casework-boundary.json), source
`8a724ca`, compares the three paths in every order slot. All 18 samples
received 307 progress changes across 0–1, 720 frames, 60fps and zero frames
above 25ms. No observed frame advantage distinguishes them.

| Content | CSS task ms | Direct task ms | Static-card boundary task ms |
| --- | ---: | ---: | ---: |
| Standard | 642 | 501 | 530 |
| Deep rich text | 651 | 572 | 681 |

**Do not adopt the CSS-only boundary.** It meets the standard-content gate,
but on rich text it is 4.6% more expensive than baseline and 19.1% more
expensive than direct writes. Its lower recalc (299→140ms) is insufficient:
script rises (90→141ms) and total task time rises. The experiment does not
establish why script varied; do not label this a proven JS regression caused
by the CSS rule.

Direct writes remain a candidate: standard-content savings repeat (20.0%
then 22.0%), but rich-content savings fall from 22.0% to 12.1%, below the
15% gate in this second series. Baseline rich samples range from 573 to
808ms despite equal progress/frame delivery. Do not silently adopt a public
clock inheritance boundary or add a new renderer API on this evidence.
Neither experimental variant is shipped in the component or core.

Next: run an identical-implementation A/A control to quantify run variance;
then isolate the actual active pin window (the full gallery currently spends
only 307 of 720 frames changing pin progress), retaining the full-page result
as a separate workload. Use the same visible content and record both update
cadence and total task time. Stop extending rail experiments if the added
complexity cannot clear that noise floor; profile another concrete bottleneck.


### CaseStudyRail A/A control

`node demo/bench/harness/measure.mjs --scenarios=casework-aa --runs=4 --out=casework-aa.json`

The two aliases load the same gallery URL, mount the same CSS-only baseline
with identical options and use the same HUD label. Only the result grouping
key differs. Four rotations balance their order. Standard and rich content
remain separate cells, with the same full-page scroll, viewport and cadence
audit. Compare paired task differences, medians and sample ranges; four runs
are a diagnostic control, not a statistical confidence interval. If either
cell's two identical medians differ by over 10%, do not promote a 12–22%
rail gain on this environment. Record the uncertainty and move to another
concrete bottleneck instead of tuning against noise.


[`casework-aa.json`](../results/casework-aa.json), source `bd73aa3`, has
16 identical-implementation executions. Standard medians were 824 and
842.5ms (2.2% apart); rich medians were 1007 and 995ms (1.2%). All samples
had 307 progress changes, 720 frames and no frames over 25ms. The predeclared
10% median gate passes, but individual standard pairs differed by −35.9%
to +23.8%; close medians do not prove that small gains are repeatable.

Next comparison isolates the active pin for all 12 seconds, retaining the
same real page and content. `--scenarios=casework-pin --runs=4` uses the
actual sticky offset and wrapper height, records its scroll endpoints and
balances order. Require complete forward/reverse progress delivery and at
least 20% median task savings in both content cells, with every paired run
favoring direct writes and no frame regression. This is a stronger candidate
gate, not a device-independent performance claim or permission to alter
public clock inheritance.


[`casework-pin.json`](../results/casework-pin.json), source `434b98d`,
records 16 active-pin executions. Every sample uses scroll endpoints
462.78125–2262.78125px and delivers 719 quantized progress changes over 720
frames. Minimum progress is below .001 and maximum is at least .999. All
samples deliver 60fps with zero frames over 25ms.

| Content | CSS task ms | Direct task ms | Task saving | CSS/direct recalc ms |
| --- | ---: | ---: | ---: | ---: |
| Standard | 1158.5 | 854 | 26.3% | 560 / 232.5 |
| Deep rich text | 1470 | 822.5 | 44.0% | 858.5 / 216 |

Every paired repetition favors direct writes. The predeclared active-window
gate passes. Script medians rise slightly; the saving comes from other CPU
work, particularly recalc. End heap is higher for direct (1.8–1.9MB versus
1.0–1.8MB); this is not a retained-memory comparison because GC was not
forced. Paint/raster/GPU presentation are not separately measured.

This establishes a scoped CPU candidate, not a default renderer change:
the prototype shadows the public pin clock on the rail. Shipped code must
preserve the existing inheritance contract; the prototype remains confined
to the benchmark. Do not relabel the stronger active-pin percentages as
full-page savings. Further rail benchmarking is lower priority than a
compatible integration or a separate confirmed runtime defect.

### Slider edge-glide regression

A separate real-browser reproduction found that five 200px slides inside a
300px rail tried to center the last slide at 750px, although the native
scroll range ends at 700px. With a 250ms glide, each engine attempted 12
out-of-range writes after reaching the edge, and the last `onScroll` still
reported `gliding:true` after the handle had stopped. At the starting edge,
WebKit could also round the final movement away and omit a scroll event.

The shared `goTo` path now clamps the destination to the logical scroll
range. Stopping an active glide queues one coalesced final measurement;
destroyed handles still schedule nothing. Browser regression checks count
out-of-range writes and verify completion at both edges in LTR, RTL and
vertical rails. A fitting rail is covered by a unit check that requires zero
animation frames. This removes observed useless writes; no new aggregate
CPU percentage is claimed for the slider fix.


The follow-up resize/removal reproduction started a 600ms glide toward
700px, then reduced the range to 300px after six frames. Chromium attempted
37 additional out-of-range writes; Firefox and WebKit attempted 36. The
existing ResizeObserver and child-list MutationObserver now retarget an
active glide through `goTo`; an empty rail stops and restores snap. There
are no new per-frame geometry reads or long-lived position caches. Checks
allow observer delivery, then require zero subsequent out-of-range writes
and a stopped final state for resize, removed destination and empty content.
They pass in all three engines, alongside the earlier edge/idle checks.


### Linked slider seek class-guard experiment

Run `node demo/bench/harness/slider-build.mjs` to freeze bundles from the
same v1.15.2 slider source; only the `stopGlide` class removal is guarded in
one. Both bundles load in every sample; the selected implementation varies.
The shipped core is unchanged. Browser checks cover 100 seeks (100→0 class
mutations), external class repair, real-glide interruption and destroy.

`node demo/bench/harness/measure.mjs --scenarios=slider-seek --runs=4 --out=slider-seek.json`

The 15/120-card linked sliders use the existing scroll driver and `seek()`,
with identical CSS transforms, content, precision and scroll path. The audit
counts delivered slider `onScroll` progress, not just upstream driver calls.
Four rotating repetitions balance order. Predeclared gate: retain the guard
only with at least 10% lower median task time in both cells, every paired run
favoring it and no material frame/cadence regression. Operation-count savings
alone do not establish CPU savings; keep an inconclusive guard benchmark-only
and move to a different bottleneck rather than adding geometry caches.


[`slider-seek.json`](../results/slider-seek.json), source `5b7a4c2`, contains
16 executions of the frozen 1.15.2 slider variants. The 15-card task medians
are 1115ms original and 1103.5ms guarded (1.0% less); one guarded repetition
is slower than its paired original. At 120 cards, medians are 2980.5 and
2535.5ms (14.9% less), with every pair favoring the guard. Large-slider recalc
medians are 1860→1616.5ms and script 465.5→405ms.

The predeclared gate fails in the small workload. **Do not adopt this as a
general core optimization from this experiment.** The 100→0 class mutations
remain a confirmed operation-count improvement and the large-workload result
is useful evidence, but neither makes the small gain consistent. Both
variants have occasional missed frames: 15-card delivery is 719–720 runner
frames / 717–718 slider progress changes; 120-card delivery is 717–720 /
715–718. Keep the individual samples, including those misses. There is no
established visible-fluidity gain or physical-device result.

No runtime or public API changed; the guarded implementation stays in the
benchmark fixture. Next hypothesis: measure the cost of publishing unused
slider clocks in a plain carousel, with identical non-clock-dependent CSS
in both variants. Prototype output suppression only in the benchmark first;
any future opt-in must preserve current defaults and inherited clocks for
existing consumers. Do not add a geometry cache or silently skip public
outputs based on guessed CSS usage.


### Unused slider outputs, plain carousel

`node demo/bench/harness/slider-build.mjs`

`node demo/bench/harness/measure.mjs --scenarios=slider-outputs --runs=4 --out=slider-outputs.json`

A third frozen variant omits only the writes of `--sd`, `--sv-progress` and
`--sv-slide`. It retains fresh geometry, classes, numeric state and callbacks;
it does not include the previous class-removal guard. Both compared variants
use the same plain CSS, which does not consume those clocks. The animated
scale rule is confined to the separate effects mode; suppression is rejected
there. All bundles load in every sample. No shipped API/default changes.

Cross-browser checks compare complete states/callbacks, active classes,
computed scale/color and scroll geometry through forward/reverse samples at
15 and 120 cards; only the inline output variables may differ. Four rotating
repetitions balance order. Predeclared gate: at least 20% lower median task
time for the 120-card workload, every paired large run favoring suppression,
no more than 5% median regression for 15 cards, and no material frame/cadence
regression. A successful frozen-source experiment still needs validation of
an actual opt-in implementation before adoption; default consumers must keep
their existing inherited variables.


[`slider-outputs.json`](../results/slider-outputs.json), source `cdb7ed9`,
contains 16 frozen-source executions. Task medians fall 1145.5→712.5ms
(37.8%) at 15 cards and 2764.5→1287ms (53.4%) at 120. Every pair favors
suppression. Recalc falls 373→3ms and 1512.5→24.5ms. Large-workload script
rises 652→708ms: the saving is total CPU, not universally lower JS time.
All samples deliver 718 slider updates / 720 frames at 60fps. End heap is
higher without outputs (roughly 1.9–2MB); no forced-GC retention claim.

The prototype passes the predeclared gate. Next validate an actual
`cssVars:false` option in core/useSlider/Slider, with default true. It skips
future writes of the three animation outputs; classes, callbacks, snap and
authored/existing inline values remain intact. Reuse the same two workloads
and gate for that implementation before adoption. Defaults must continue
emitting inherited outputs; no automatic CSS-usage detection.


`node demo/bench/harness/measure.mjs --scenarios=slider-api --runs=4 --out=slider-api.json`

This comparison calls the actual built core slider in both variants, once
with its default and once with `cssVars:false`; it does not substitute the
frozen implementation. The earlier bundles remain pinned to v1.15.2 in
`slider-build.mjs` so those prototypes can still be reproduced independently.
The same predeclared gate and plain-carousel workloads apply. Unit coverage
also checks existing inline values, callback/class behavior, React prop
consumption and changing the option on the same mounted rail.

[`slider-api.json`](../results/slider-api.json), clean source `6c0299c`,
records 16 actual-API executions in desktop headless Chrome. Median task
time falls 1145→615ms (46.3%) for 15 cards and 2784.5→1288ms (53.7%) for
120. Every paired run favors opting out. Recalc falls 388→2.5ms and
1553→23.5ms; large-workload script rises 656→700ms. All samples deliver
718 progress changes / 720 frames, 60fps and zero frames over 25ms.

The gate passes: retain the explicit option, with default behavior unchanged.
The 15-card opt-out includes one unusually low 102ms sample (others 641,
589 and 797ms); it remains in the data. Excluding it as a sensitivity check
would give 641ms, still 44.0% below the original median. End heap is higher
with opt-out (1.9–2MB versus 1.4–1.5MB); these samples do not establish
retained memory, paint/raster cost or physical-phone performance. CPU
headroom improved; visible fluidity did not. The option was unreleased in
this measurement snapshot; the published 1.15.2 package was unchanged.

Validation: 296 unit tests, React 18 typecheck and 98 targeted tests,
Chromium/Firefox/WebKit gallery checks (including both output modes), and
the full progressive-enhancement/installed-section invariant suite pass.

### Plain slider goTo workload

`node demo/bench/harness/measure.mjs --scenarios=slider-glide --runs=4 --out=slider-glide.json`

Compare the same actual slider with default outputs and `cssVars:false`,
15/120 cards, plain CSS, native snap, and no page-scroll driver. Twelve
commands run one second apart: slides 2,3,4,5,6,7,6,5,4,3,2,0, each using
the default 600ms glide. The remaining time is idle. The shared 12-second
runner supplies the clock/frame accounting; startup remains separate.
Audit every command's settled position and full state/callback. Reject a
run that skips a command or fails to settle. Three-browser checks compare
forward/reverse destinations and rendering with both output modes.

Predeclared scope gate: report a material benefit for this workload only
with at least 20% lower median task time at both sizes, all paired runs
favoring opt-out, matching settled trajectories and no material frame
regression. This is an API-driven carousel, not a physical swipe or phone
measurement; do not generalize the continuous-seek percentages to it.

Consumer audit: the gallery coverflow (`scripts/fx-data.mjs`) and the demo's
main carousel, vertical thumbs, wheel, window gallery and pinned carousel
all consume `--sd`. Keep their outputs enabled. The plain React slider
snippet contains an opaque user-supplied `Card`; do not assume that child
ignores the clocks or silently opt it out. No gallery consumer changes.

[`slider-glide.json`](../results/slider-glide.json), clean source `5a54861`,
contains 16 executions. Task medians fall 508.5→323.5ms (36.4%) for 15
cards and 1319→603.5ms (54.2%) for 120. All four pairs at each size favor
opt-out. Recalc falls 168→6ms and 680→6ms; large-workload script rises
309→324ms. Every sample has 720 frames, 60fps and zero frames over 25ms.
The small carousel delivers 298–302 quantized progress changes; the long
one delivers 242 in every run because the same pixel movement covers a
smaller fraction of its total range. Do not compare those counts as FPS.

All twelve settled destinations, states and callbacks match exactly across
all eight runs at each size. The local path is identical at both sizes:
182,418,654,890,1126,1362,1126,890,654,418,182,0px. The scope gate passes;
unused outputs also cost materially in this discrete goTo workload. This
does not prove touch-gesture, paint/GPU or physical-device gains. End heap
is 1.6→1.5MB for 15 cards and 1.15→1.8MB for 120; no forced-GC retained
memory claim. Runtime code and public defaults did not change this round.

Validation: the shared runner's three unit cases preserve page/pin paths,
long frames and start/end accounting; its custom driver never also scrolls
the page. The full Chromium/Firefox/WebKit gallery matrix passes, including
forward/reverse goTo parity with both output settings. Next distinct check:
retained memory and idle work after repeated slider mount/destroy cycles;
do not infer a leak from an end-of-run heap sample or repeat these CPU A/Bs.

### Slider lifecycle retention and idle probe

`node demo/bench/harness/slider-lifecycle.mjs`

Three rotated repetitions compare DOM-only controls and actual sliders with
CSS outputs on/off. Each fresh browser context warms up 20 cycles, then
runs four batches of 25 mount/destroy cycles with 120 slides. Teardown
covers idle, active glide, pending wheel settle, active mouse drag and drag
release. These synthetic events test cleanup, not physical gesture speed.
After each batch, drain timer windows, collect garbage through CDP in
separate jobs and count WeakRefs to rails/handles. Drop the probe's WeakRefs
and collect again before recording heap, DOM nodes and listener counts.
Record pending/executed slider rAF callbacks and callbacks after destroy;
the probe's own waits bypass the frame counter.

Gate: zero live weak targets, pending frames, idle frames and callbacks
after destruction in every non-retaining checkpoint. A positive control
keeps five destroyed rails/handles alive on purpose and must detect all ten
objects. Heap bytes alone do not establish a leak: inspect post-warmup
trends and the DOM-only control. This is a desktop Chrome cleanup probe,
not a heap ranking, React lifecycle test or cross-device memory guarantee.

[`slider-lifecycle.json`](../results/slider-lifecycle.json), clean source
`7da7d97`, passes all checkpoints in Chrome 152. Across six slider contexts
(three per output mode), 600 measured cycles plus 120 warm-up cycles leave
zero live rail/handle targets, pending/idle frames or post-destroy callbacks.
DOM nodes remain 8 and listeners 1, matching each context's baseline and
the three DOM-only controls. The positive control detects all ten retained
objects, so the weak-target check is not vacuously passing.

Post-GC heap plateaus by cycle 50: 873620 bytes with outputs and
873412–873436 without, unchanged through cycles 75 and 100. DOM-only
controls plateau at 766444 bytes by cycle 25. The roughly 13KB increase
after slider warm-up stops growing; these data show no accumulating
rail/handle retention. The larger uncollected opt-out heap in earlier CPU
benchmarks is not evidence of a leak. No runtime change is justified by
this probe; React teardown and application-held references remain outside
its scope.

### React output-switch teardown gate

The existing `test/react.test.mjs` suite now mounts the actual Slider under
StrictMode with autoplay, alternates explicit/default CSS outputs while a
glide or mouse drag is active, and unmounts during a glide. The existing
DOM stubs gain local observer/timer/listener accounting for this test only.
There is one autoplay interval and three active observers while mounted;
reattachment cancels old work. Unmount leaves no counted observers,
intervals, frame requests, focus/input listeners or live external ref. A
previously saved imperative facade cannot schedule work afterward.

This passes in React 18 and 19 (99 React-18 targeted checks, 298 full unit
tests). It verifies resource ownership, not browser heap retention. No
additional runtime correction was needed beyond the validated `cssVars`
option prepared for 1.16.0; the core retention probe above remains the
separate evidence for collected rails/handles.

### 1.16.0 publication receipt

Published 2026-09-09 from tag `v1.16.0`, source `6910682`, through
[release run 34337976966](https://github.com/aduptive/scrollvars/actions/runs/34337976966).
Every gate passed, including generated-file consistency, unit tests,
installed-section invariants, Chromium/Firefox/WebKit and tarball imports.
The npm registry returned version 1.16.0 and integrity
`sha512-9IrCkpe7xm7uG76UROZn0T0CkoYlzjDWiFBxk5TFmR66H7ZDOb3OEW3WgsfOQQwfEu0qQiT7xbgmWRRrwZ/47Q==`.

Demo deployment `5f308459-4aa2-4de8-bd71-1bdef35a654d`:
https://scrollvars-gns35022b-aduptives-projects.vercel.app.
Both public aliases were verified against that ID; the secondary redirects
to scrollvars.dev. Public docs show v1.16.0 and the public `/fx/sv.js` hash
matches the source bundle, `6dfad9dc399c4df5010345ac026a1711e1597b0cd963431afa666cd345ec91ae`.
The option previously described as unreleased is now available; no default
consumer was opted out and no experimental rail/class guard was shipped.

### Empty-driver and shared-root audit (1.16.0)

`node --test test/driver.test.mjs` passes all 41 cases. Two existing cases
now check the previously unasserted operation counts: after release and
draining any already-queued frame, 100 scroll/resize event pairs schedule
zero frames with page outputs disabled, make no released-element writes
and leave document outputs absent. Re-enabling page outputs still schedules
one frame without trackers. Two entries sharing a custom root read that
root's rect once per frame, then read it fresh on the next frame. Both
behaviors already existed; no runtime change or CPU-speed claim follows.

A suspected rootMargin test mismatch was also rejected by a browser probe.
An implicit-root observer with `rootMargin:'100% 0px 100% 0px'` produced:

| viewport | target top | root bounds top / bottom | intersecting |
|---|---|---|---|
| 1200×600 | 1500px | −600 / 1200px | false |
| 600×1200 | 2000px | −1200 / 2400px | true |

Installed Chromium, Firefox and WebKit agreed in all six cases (20×20px
absolute targets, fresh pages). This matches the existing fixture's height
calculation. The [specification discussion](https://github.com/w3c/IntersectionObserver/issues/391)
records the historical width/height ambiguity; do not rewrite the fixture
or recreate the culler on resize from a remembered rule that disagrees
with the tested engines. This probe is not a historical-browser guarantee.


### Main comparison refreshed for 1.16.0

`node measure.mjs --scenarios=main --runs=4 --out=main-current.json`
records the current main-only snapshot without replacing the older deep-DOM
and gallery measurements in `latest.json`. `scripts/bench-tables.mjs` uses
whichever main snapshot is newer; a later full run supersedes this refresh.
Each displayed group retains its own date/version and raw source link.

The September 9 run from clean source `e393f56` includes 20 executions,
rotating engine order. Median total task: ScrollVars defaults 4144.5ms,
page outputs off 1872ms, GSAP idiomatic 1800ms, batched GSAP 1669ms,
Framer 2111.5ms. All except the default ScrollVars row delivered median
60fps (default 59.6fps). ScrollVars local is 12.2% above batched GSAP,
4% above idiomatic GSAP and 11.3% below Framer in total task time.
The default remains 2.48 times batched GSAP's total task cost.

This does not establish a general speedup since 1.15.0: the local median
was 1743ms then, and environment/run variation prevents attributing the
new 1872ms to a regression. The published slider savings concern different
workloads. Document-wide inherited outputs remain the primary measured
weakness; changing their default would break existing consumers.
The summary tables now lead with total task CPU and FPS, keeping script,
style, memory and both output modes visible. Total task is CDP TaskDuration,
not the sum of displayed subcategories or a GPU/device measurement.

### Reentrant page-output enable (shipped in 1.16.1)

Confirmed against 1.16.0: with outputs disabled at the read phase, enabling
them inside a tracking callback published `--sv-page: 1.0000` at 50% scroll.
The frame used a placeholder span of 1 because it had not read document
height. The driver now marks that span unmeasured and skips page writes
until the frame already scheduled by `setPageOutputs(true)` reads it.
Disabling inside a callback still suppresses that frame immediately.

The regression test fails before the fix and passes afterward for
`onLive`, `onTravel`, `onPin` and `onScene`, including the reverse toggle.
It checks the intermediate frame, correct first published value and read
ordering. All 300 unit tests pass. A real-browser probe at viewport
800×1000, document height 3000 and scrollY 1000 records only `0.5000`
when enabling from `onTravel` in Chromium, Firefox and WebKit.
No additional geometry read, public default or variable inheritance change;
this is correctness evidence, not a new CPU benchmark or npm release.

### Repeated page-output enable at rest (shipped in 1.16.1)

Confirmed against source `45c791b`: calling `setPageOutputs(true)` from
`onTravel` sustained all 120 frames of a bounded unit probe without any
scroll input. The setter always scheduled another frame, even though the
setting was already true. A single guard now skips repeated enabling;
disabling still clears outputs, and a real false-to-true transition still
schedules the measured frame. The setting is not a refresh API.

The permanent test covers both `onTravel` and `onPin`, the re-enable path
and a later scroll event. All 301 unit tests pass. Browser probes compare
the bundled baseline source with the candidate on a stationary 3000px
document at viewport 800×1000. After 250ms settling, a further 250ms window
records callbacks/element rect reads of 15/15 in Chromium, 16/16 in Firefox
and 15/15 in WebKit for the baseline; every candidate records 0/0. Later
scroll input resumes callbacks in both versions and all three engines.
These counts prove removal of the idle loop in this callback pattern;
they do not quantify CPU savings or alter the published scroll benchmark.

### 1.16.1 publication receipt

Published 2026-09-09 from tag `v1.16.1`, source `a09a245`, through
[release run 34361573218](https://github.com/aduptive/scrollvars/actions/runs/34361573218).
Local gates passed: 301 unit tests, 99 React-18 checks and type checking,
installed-section integration and the Chromium/Firefox/WebKit suite.
CI repeated its release gates and passed the tarball installation/import
check before publishing with provenance. The two probes above are now
released; no defaults or public variable inheritance changed.

The registry's latest version is 1.16.1. The downloaded tarball's digest
matches its published integrity:
`sha512-I1soyioGMQ7VgDJ7MqaeeqWs0+DwLNlgnYHFWKP8wkqmwefqox7ysswJ9b9Qw3dtj2ohAVcGUDVO00Qy5DzODg==`.

Deployment `d32dfbe9-9e7b-4469-9d24-9e97f8b94e3d`:
https://scrollvars-6pz4mklpo-aduptives-projects.vercel.app.
Both aliases were verified against that ID, with the secondary redirecting
to scrollvars.dev. Public docs show v1.16.1; the public `/fx/sv.js` matches
the source hash `4588edad8fd62b301567e8dbf1ed405d1c17fd3a3e232b57e7aba60a93389154`.
The main benchmark still identifies its measured package as 1.16.0.


### Main demo page-output experiment

`node measure.mjs --scenarios=home --runs=4 --out=home-outputs.json`
uses the complete homepage at 1400×900 and the shared 12-second forward /
reverse scroll path. Fresh contexts use the same seeded Math.random for
procedural content. Both load the same HTML; after load and font readiness,
the harness sets page outputs on or off, then settles two frames before
the timed workload. Startup includes this configuration and is separate;
this experiment measures steady scrolling, not a pre-boot startup saving.
The runner records the page source hash, actual scroll range and frame tails.

The source audit finds no --sv-page/--sv-v consumers in the homepage;
register() forwards local travel/pin/scene callbacks and the HUD reads local
clocks. Before changing its boot wiring, require at least 15% lower median
TaskDuration with every rotated pair favorable, no material frame regression,
and browser checks of local clocks, HUD, pins, no-JS and reduced motion.
Keep the library default and main-900 benchmark controls unchanged.


#### Result: adopt the homepage opt-out

[`home-outputs.json`](../results/home-outputs.json), clean source `af8fabf`,
records four runs per mode, alternating first position (eight executions).
All runs traverse the same 0–82046px range. Median TaskDuration falls
5039.5→1911.5ms (**62.1%**); every pair favors outputs off. Style recalc
falls 3776.5→492.5ms. Script rises 183→260ms and layout 31→48.5ms, so this
is a total-work saving, not a reduction in every submetric. Median FPS
rises 59.25→60; slow-frame counts are [2,2,4,3] with outputs and [0,1,0,0]
without. This full-page synthetic sweep is not a physical-device guarantee
or the main-900 comparison, which remains unchanged.

The homepage generator now emits `SV.setPageOutputs(false)` before its
first registration. Chromium, Firefox and WebKit check equal local pin /
travel values, rail geometry and HUD with outputs on/off at 25%, 75% and
100% of the rail; the last card fits and reduced motion still returns the
rail to its static transform. The full existing browser matrix passes.
The 27 generator/runner checks pass; desktop rendering and mobile horizontal
scrolling of the updated results table were inspected. Homepage and bench
now share the same snapshot selector; the old partial CPU sum is replaced
by TaskDuration/FPS with date, both modes and all five engine rows.

The no-JS audit found an independent pre-existing demo defect: 18 section
headings under `section.demo.sv` have opacity 0 in both baseline and new
HTML because the page's custom entrance CSS lacks the `.sv-on` guard.
The hero heading stays visible. The opt-out does not cause this; a separate
fallback correction is still needed. Do not describe the entire homepage
as having passed a no-JS visibility gate. The shipped preset styles and fx
fallback tests are separate from this custom homepage CSS.

#### Follow-up: homepage static fallback corrected

The homepage test first failed against the unchanged page: entrance headings
and descriptions inherited opacity 0. Its authored CSS now has a shared
`html:not(.sv-on)` fallback: scenes return to flow, curtains uncover copy,
galleries show every card, the map and product-tour panels form readable
lists, and the CSS 3D card shows both faces. Canvas-only stages and inactive
controls are omitted; a noscript notice explains the static preview.
Five native carousels have named, focusable regions; the page-driven rail
restores native horizontal scrolling and the wheel keeps its vertical axis.

Chromium, Firefox and WebKit pass at 1400px and 390px with JavaScript disabled.
The check inspects ancestor opacity and real text rectangles/hit targets after
scrolling, catching occlusion and clipping as well as hidden text. Keyboard
arrows move each native carousel and its final card remains reachable.
WebKit needs an initial arrow and a settled frame after programmatic focus;
a bare overflow div reproduces this with JS enabled and disabled. The test
sends a second arrow after 100ms instead of adding page-side keyboard code.
Mobile screenshots of the rail, tour and pizza gallery were also inspected.

The existing full browser checks pass in all three engines, including the
homepage's animated pin/travel/HUD/rail endpoint and reduced-motion rail.
The build/sync and 30 generator/benchmark checks pass. This changes demo CSS
and markup only; runtime bundles, defaults and measured benchmark snapshots
stay unchanged. No new CPU improvement is claimed and no npm release is needed.

Separate pending finding: the homepage map's existing reduced-motion rule
sets height auto but leaves `contain: strict`. A Chromium mobile probe with
JS enabled and reduced motion reports a 0px stage containing a 746px world.
The no-JS fallback removes containment, but the JS-enabled reduced-motion
path still needs its own regression test and correction. Audit the other
custom homepage reduced-motion scenes in that next round; the fx gates do
not cover them.

Published from `f190293` to
https://scrollvars-i2wga8d6u-aduptives-projects.vercel.app,
deployment `50472513-c1ae-4846-b509-acc51e7f5b1c`. Both aliases were verified.
Public HTML matches the local source byte-for-byte; `/fx/sv.js` retains
hash `4588edad8fd62b301567e8dbf1ed405d1c17fd3a3e232b57e7aba60a93389154`.
A public mobile Chromium check with JS disabled confirms visible section
headings, a static rail and removed map containment. Package stays 1.16.1.

### Main-900 style-cost investigation

Priority changed back to CPU/style recalc at the user's request. The
homepage reduced-motion finding above is queued, not the performance task.
`main-style.js` mounts diagnostic variants on the existing 900-box page,
using the same driver, viewport, positions, speeds, 12-second path and
four-decimal travel values. Every variant reattaches the same sections and
records callbacks/progress changes. Geometry/opacity and inherited page
clocks are checked before the timed workload; setup remains separate.
No package renderer or default is changed.

Ranked hypotheses: typed inherited global properties might avoid unnecessary
style work; direct local translate/opacity writes might avoid variable
substitution; native content-visibility might skip offscreen style work.
The first screen (`--scenarios=main-style --runs=2`,
[`main-style-screen.json`](../results/main-style-screen.json), source files
captured in `3d51f9f`) produced these medians, in milliseconds:

| variant | TaskDuration | Style recalc |
|---|---:|---:|
| inherited CSS, globals on | 4335.5 | 3452 |
| typed globals, still inherited | 4252.5 | 3331.5 |
| direct output, globals on | 2595.5 | 1681 |
| CSS + content-visibility:auto, globals on | 2100.5 | 1001.5 |
| inherited CSS, globals off | 1949 | 427.5 |
| direct output, globals off | 1496 | 197 |

Two repetitions are screening, not a release claim. Typed globals show no
material benefit and would also change unset/fallback semantics, so reject
that route. Content-visibility is a layout-dependent authoring option,
not safe to apply to arbitrary pinned/sticky/fixed content. Its result must
not be presented as a general engine improvement or used exclusively on
ScrollVars to manufacture a competitive advantage.

The confirmation uses `--scenarios=main-style-confirm --runs=4`: CSS/direct
with globals on/off, GSAP batched and Framer in the same rotating batch.
Unlike the screening direct variant, direct-clocks also keeps the public
`--sv-t` output alongside the explicit renderer; only the consumption path
changes. The fast `node main-style-check.mjs` gate covers forward/reverse,
desktop/mobile resize, transforms, opacity and clocks in all three engines.
Require at least 15% lower median total task CPU in both matched modes,
each repetition favorable, no material frame-delivery regression and
comparable animation progress delivery. Preserve all raw runs. If it passes,
this establishes a renderer candidate, not an automatic rewrite of arbitrary
user CSS; real preset semantics and lifecycle still gate adoption.

Confirmation (`main-style-confirm.json`, clean source `3e62cbe`, four runs
per variant, 24 executions): keeping all measured clocks, direct rendering
reduces median task CPU 4128.5→2625.5ms (36.4%) with globals on; all four
repetitions favor it. Style recalc falls 3272→1666.5ms. With globals off,
task CPU falls only 1696→1612ms (5.0%), with one unfavorable repetition;
style recalc falls 368.5→225.5ms. The predeclared two-mode adoption gate
FAILS. Do not ship this as a universal fast path. In that same batch GSAP
batched records 1588ms task/171.5ms recalc, Framer 1855ms/77.5ms. The direct
globals-off prototype is close in total CPU, but still pays more style work.
All optimized runs report 60fps; the ordinary globals-on median is 59.9fps.
Geometry/clock gates passed in Chromium, Firefox and WebKit at two widths;
untimed checks wait 100ms after programmatic scroll because Firefox's async
scroll delivery also caused transient mismatches in the unmodified baseline.

Next hypothesis: paused native Web Animations driven by the same `onTravel`
may reduce style writes to one currentTime update per box. Test it against
CSS and direct output with the same clocks and both global modes; reject
unless total CPU improves without lost progress/geometry or excessive setup
cost. This remains an experiment, not a dependency or a runtime API.

Native-animation screen (`main-style-waapi.json`, clean source `7dc5df2`,
two runs per mode, 12 executions) rejects that route for this workload:
with globals on, CSS/direct/native task medians are 4316/2703.5/4494ms and
style recalc 3345/1690/3483.5ms. With globals off they are
1643/1357.5/1623.5ms task and 357.5/190.5/463.5ms recalc. Native animations
do not beat direct writes and increase style work even with globals off.
All variants preserve the 0–42600px path. Optimized direct runs deliver
60fps, no >25ms frames, and 1434–1435 progress changes; native globals-on
runs have 1425/1433 changes and 2/1 slow frames. The native experiment also
passes the cross-browser geometry/clock gate and cancels its 900 animations
on teardown, so this is a cost finding rather than an obvious missing-output
failure. Startup metrics include the untimed geometry preflight for these
diagnostic variants; do not compare them as clean startup benchmarks with
the competitor pages, which do not run that preflight.

The two-run direct globals-off improvement in this last batch (17.4%) does
not supersede the four-run confirmation's 5% and unfavorable repetition.
Retain both; do not cherry-pick the better batch or call the adoption gate
passed. The default/globals-on direct reduction is repeatable across batches,
but the package has not changed. All clocks/renderer code is experimental.

Next performance task: confirm the existing callback-only path (`view:false`,
`onTravel`, no redundant `travel:true`) against CSS and direct-with-clock
using both the main-900 and deep-DOM workloads. The first screen's 23% saving
without globals only had two runs and is not sufficient. Keep matched
geometry, progress delivery, full scroll range, raw runs and randomized or
balanced order. This measures the cost of publishing an unused local clock
separately from the cost of rendering. If it holds, validate a concrete
opt-in effect using the existing callback API (responsive dimensions,
authored styles, reduced motion, release/retrack and no-JS) before adding
an API or changing any preset. Do not silently suppress clocks used by CSS,
apply containment to arbitrary layouts, or change global defaults. The main
published benchmark and changelog stay unchanged until a runtime change is
actually adopted and measured.

#### Callback-only confirmation protocol

`node measure.mjs --scenarios=main-style-callback --runs=6 --out=main-style-callback.json`
compares CSS, direct-with-clock and callback-only direct output with global
outputs disabled in all three. Workloads: 60×15 plain boxes (900), then
30×5 boxes with 20 and 50 text descendants per box. Each uses the same
12-second forward/reverse path within its profile. Six repetitions cover
all six engine permutations, balancing positions and within-run predecessor
pairs; the raw file records the actual measurement order. No concurrent
browser tests or heavy work may run during measurement.

The `--callback` mode of `main-style-check.mjs` checks plain and deep DOM
at two viewport widths in Chromium, Firefox and WebKit, including absence
of unused clocks and matching transform/opacity. Geometry preflight stays
outside the measurement; startup contains that diagnostic work.

Predeclared promotion gate: callback-only must lower median total task CPU
by at least 15% versus CSS in all three profiles, every matched repetition
must favor it, and frame/progress delivery must not materially regress.
The middle variant isolates the cost of retaining an unused local clock;
report that difference separately. Passing permits validation of a concrete
opt-in effect, not a blanket renderer change. Failure means recording the
limit and choosing a different hypothesis, without lowering the gate.

Result (`main-style-callback.json`, clean source `1c03e6b`, 54 executions):

| profile | CSS task / recalc | direct + clock task / recalc | callback-only task / recalc |
|---|---:|---:|---:|
| 900 plain boxes | 1784.5 / 377.5 | 1574 / 217 | 1603 / 203.5 |
| 150 boxes, 20 text descendants each | 1636.5 / 526 | 1597 / 460.5 | 1368 / 189 |
| 150 boxes, 50 text descendants each | 1987 / 840.5 | 1890 / 744 | 1557.5 / 242.5 |

Milliseconds accumulated over 12 seconds; medians of six balanced runs.
Callback-only saves 10.2%, 16.4% and 21.6% task time versus CSS, and 46.1%,
64.1% and 71.1% style recalc. The all-profile gate FAILS: the plain profile
falls below 15% and one matched pair is unfavorable. Both deep profiles
favor callback-only in all six pairs. Keeping an unused local clock almost
erases the direct renderer's benefit in the deep profiles, but removing it
does not establish an improvement over direct-with-clock on plain boxes.
This supports selective avoidance of inherited outputs on large subtrees,
not a universal new renderer API. Keep the existing callbacks as the opt-in
mechanism pending a separate concrete effect gate.

Next independent hypothesis: the main fixture animates individual `translate`
but hints `will-change: transform, opacity`, while the competitor uses a
transform shorthand. `--scenarios=main-style-css` compares the unchanged CSS,
the matching `will-change: translate, opacity` hint, and a CSS-only
`transform: translate3d(...)` formula. All retain `travel:true`, the same
variables/values/appearance, globals off and original DOM. The `--css` fast
gate checks geometry, opacity, clocks, reverse and resize in all engines.
Screen two runs on main-900 and deep-50. Only consider a longer confirmation
if both show at least 15% lower task time without worse frame delivery;
do not assume a compositing hint is a fix without measurement.

The screen (`main-style-css.json`, clean source `d38ed4b`, 12 executions)
does not support either change. Main CSS/hint/transform task medians are
1754/1911.5/1663.5ms, with recalc 392/450/401ms. Deep-50 medians are
1891.5/1886/1852ms task, with recalc 780.5/822.5/786.5ms. The shorthand's
5.2%/2.1% task reductions miss the 15% screen gate; the matching hint raises
main task time and neither variant lowers median recalc. Keep the original
CSS. Cross-browser geometry checks passed; no rendering difference explains
away the negative result.

Next step: capture a separate diagnostic trace of ordinary CSS with globals
on/off and direct output, counting style-update scope and looking at where
main-thread task time goes. Use the same path and actual outputs. Trace
instrumentation must not contaminate the ordinary performance samples.
Inspect available CDP thread-time metrics as additional evidence about the
large timing spread; do not silently replace the historical TaskDuration
definition or compare different time domains. The local devtools-protocol
types expose Performance.enable timeDomain = timeTicks/threadTicks. Verify
what the installed browser actually reports before relying on it.
The target is a falsifiable new optimization of inherited-style work, not
another repetition of the failed renderer/hint/property/WAAPI screens.

#### The document-wide outputs, measured directly (`globals-cost.json`)

The renderer, hint, property and WAAPI screens all optimized inside the
`-off` configuration and treated globals-on as a control. That inverted the
question: the control condition was the finding. `globals-cost.mjs` measures
the same page and the same 12-second path in three variants: `on` (the
shipped default), `off` (`setPageOutputs(false)`), and `noinherit`, which
writes `--sv-page` and `--sv-v` exactly as `on` does but registers both with
`inherits: false`. The third variant is the discriminator: identical writes,
no subtree invalidation. Every run asserts the two properties really are
present on `<html>` (or absent in `off`) and samples a box's computed
`translate`/`opacity` at a fixed scroll position.

| profile | on task / recalc | off task / recalc | noinherit task / recalc |
|---|---:|---:|---:|
| 900 plain boxes (4 runs) | 4071.5 / 3249 | 1309.5 / 269 | 1243 / 267.5 |
| 50 boxes (3 runs) | 2047 / 1453 | 1107 / 276 | 1011 / 270 |
| 150 boxes, 50 text descendants (3 runs) | 1920 / 1222 | 1018 / 250 | 1012 / 266 |

Milliseconds over 12 seconds, medians, balanced order, Chrome 152.0.7977.85.
`noinherit` tracks `off` in all three profiles while writing both properties
every frame, so the cost is the inherited invalidation, not the write, the
velocity timer or the string formatting. The recalculation COUNT is the same
in all three (708 to 720): the same number of style updates, each traversing
the whole document instead of the animated elements. Sampled
`translate`/`opacity` are byte-identical across variants, so no variant wins
by rendering less.

Against the competitor numbers already recorded in `main-style-confirm.json`
(4 runs, same page): gsap-batched 1588ms task / 171.5ms recalc and framer
1855ms / 77.5ms, versus 4128.5ms / 3272ms for the shipped default and
1696ms / 368.5ms with the outputs off. The default is 2.6x GSAP's total task
time; without the two document-wide writes the same engine is within 7% of
GSAP and ahead of framer-motion. That gap, not the renderer, is what a
reviewer measures.

Nothing in this repository consumes either property: `grep` for
`var(--sv-page` and `var(--sv-v)` across `styles/`, `demo/`, `src/`, the
gallery and the docs returns nothing. Every page pays document-wide
invalidation on every scroll frame for two variables none of the library's
own presets or demos read.

Next step is a runtime change, not another screen: publish the page outputs
only when something can consume them. Detect the literal property names in
the document's own stylesheets at boot, treat any unreadable (cross-origin)
sheet as a consumer so the default fails safe, re-check when stylesheets
change, and keep `setPageOutputs(true)` as the explicit override for a JS
reader that CSS cannot reveal. That preserves the documented contract for
pages that use the variables and removes the cost for pages that do not.
Gate it on the published benchmark: the main-900 task median must fall to
within measurement noise of the `off` variant with the outputs suppressed
and must not move when a stylesheet does reference them.

#### Adopted, and what it cost the competitor gap (`main-after-autodetect.json`)

The runtime change landed on `perf/page-outputs-cost`: the driver asks the
document, on the first frame that could publish, whether anything can read the
two variables, and stays silent when nothing can. `demo/bench/scrollvars.html`
no longer calls `setPageOutputs(true)` on the default path, because a
benchmark page that configures the library measures the configuration rather
than the library, which is how five screens came to be run inside the very
setting that was the cost.

Same page, same path, four runs:

| engine | script | recalc | task | heap |
|---|---:|---:|---:|---:|
| scrollvars | 83ms | 322ms | 1543.5ms | 1.1MB |
| scrollvars-local | 80ms | 307ms | 1481ms | 1.0MB |
| gsap | 326.5ms | 124ms | 1394.5ms | 6.15MB |
| gsap-batched | 230.5ms | 139.5ms | 1374.5ms | 6.7MB |
| framer-motion | 917ms | 63ms | 1820.5ms | 10.6MB |

1543.5ms against 4128.5ms before, so 1.12x gsap-batched instead of 2.6x, and
0.85x framer-motion. The remaining gap is style recalculation (322ms against
139.5ms), which is what a library that writes custom properties and lets CSS
animate pays for the privilege; script time is 2.8x to 11x lower and heap is
6x to 10x lower. That is the honest shape of the trade, and it is a shape
worth publishing rather than the one the old default produced.

An adversarial review of the diff then found the same class of bug the change
exists to avoid, in a place the first fix had not reached: the inline-style
selector matches a substring, `--sv-view` matched `--sv-v`, and the driver
writes `--sv-view` inline on every tracked element, so every rescan after the
first frame said yes on every page. The invariant that should have caught it
could not: "a late stylesheet turns publishing back on" would have passed with
no consumer in that stylesheet at all. Twelve invariants now, including a late
stylesheet that reads nothing and must stay silent.

Remaining performance work, in the order the numbers justify: the style
recalculation gap itself (322ms against GSAP's 139.5ms on the same workload)
is now the largest single line, and it is the cost of writing `--sv-t` on 900
elements. The callback-only screen already measured 46 to 71 percent less
recalculation on deep DOM by not publishing an unread local clock, which is
the same shape of finding one level down. That is the next hypothesis worth a
protocol, and it should be measured against this new baseline rather than the
old one.

The stamped bench tables in README and AGENTS still carry the old numbers.
Regenerating them needs a full `measure.mjs` run (main, deep, gallery) on a
quiet machine.
