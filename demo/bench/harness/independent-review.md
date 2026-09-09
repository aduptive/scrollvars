# Independent CLI review — 2026-09-09 UTC

Snapshot: `73b538c`. Kimi CLI, configured model
`kimi-code/kimi-for-coding`, reviewed numbered source excerpts from the
driver, slider, measurement harness and rail experiment. The focused query
completed with tools and MCP servers disabled; this is static advice, not
an independently run benchmark. A broader query was stopped without a
response. Claude was attempted with `claude-fable-5-1`, but authentication
expired before inference; no Claude opinion or model-availability check
was obtained. Do not repeatedly retry that login during the hourly cycle.

## Triage

| Suggestion | Checked against the code | Decision |
| --- | --- | --- |
| Cache slide geometry instead of reading every slide each frame | `src/core/slider.ts:218` reads all sizes and centers before writes. Repeated O(N) reads exist; the review's claim of O(N) forced layouts does not follow. | Keep as a measurement hypothesis, not a confirmed bottleneck or a promised 2× gain. |
| Invalidate that cache only on ResizeObserver and child-list mutation | `src/core/slider.ts:299` observes box sizes and direct child-list changes. Changing CSS gap can move slides without either notification. | Reject this invalidation strategy as incomplete. |
| Short-circuit computed pixel pin offsets and cache root font size | The pixel short-circuit already exists at `src/core/driver.ts:328`; root font size is only read in the custom-markup rem fallback at line 335. Batched reads do not imply one style recalculation per call. The rail-200 fixture contains one pinned section, not 200. | Reject the claimed easy win; profile many custom-markup pins before adding caching. |
| Isolate each benchmark variant in a fresh context | Already done in `demo/bench/harness/measure.mjs:94`. | No change needed. |
| Strengthen run-order/warm-up controls | Order rotates at `measure.mjs:147`, but three repetitions of two variants give the first slot to one variant twice. Fresh contexts do not isolate browser/OS thermal state. | Useful follow-up: balanced even-numbered repetitions and an A/A control before adopting small differences. More sampling does not establish a specific bias by itself. |

## Check performed during triage

In Chromium, Firefox and WebKit, a 300px flex container with two fixed
100×50px children was observed along with both children. After its initial
ResizeObserver delivery, changing `gap:10px` to `gap:40px` moved the second
child by **30px with zero new ResizeObserver notifications** after three
animation frames. This is a counterexample to the proposed cache's safety,
not a defect in the current slider, which reads fresh geometry on scroll.
Font loading, responsive positioning, margins and dynamic styles also need
coverage before adopting cached positions. Transforms generally do not
change layout offsets; the review's transform caveat is not a substitute
for these invalidation cases.

## Next experiments, in order

1. Keep the proven direct-rail candidate and validate real CaseStudyRail
   content, teardown, reduced motion and fit-to-flow as described in README.
   Compare a private non-inheriting rail output if it preserves CSS authoring
   with equivalent savings; do not alter public inherited clocks.
2. Add an A/A benchmark control and use balanced repetitions when evaluating
   small changes. Keep cold startup separate from steady scroll costs.
3. Profile a realistic long slider before introducing geometry caches. Use
   the gap counterexample as a regression gate for any proposed cache.

No runtime change was made based solely on this review. The measured rail
results remain CPU savings at the same 60fps, not a universal ranking against
other animation libraries or a physical-device guarantee.

Follow-up: the private-clock experiment and per-sample progress-delivery
audit are now recorded in README. The private clock has not shown a
consistent advantage over direct writes and is not approved for adoption.
Read those results before repeating this experiment.
