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
headroom improved; visible fluidity did not. The option is unreleased and
does not change the already published 1.15.2 package.

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
