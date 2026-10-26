# SVG recipe benchmark, 2026-10-26

The tested dense SVG benefits from using ScrollVars numeric callbacks to write transforms directly. No library implementation change or new public helper was needed. This supports a recipe-level choice, not replacing all CSS-variable effects.

## Method

Apple M2 Max, 32 GB RAM, macOS 26.6.2; Chrome/155.0.8059.85. Six rotating/reversed runs per mode and profile, 180 delivered animation frames each. Same SVG, geometry, scroll path, transform precision and lifecycle. Simple artwork has three groups with three shapes each; the stress profile adds 120 circles per group (360 extra descendants). Visual gates compare intermediate and reverse-scroll transforms in Chromium, Firefox and WebKit, including mobile viewport and the dense profile. CPU timing uses Chrome only.

Desktop: 1280×800, unthrottled. Mobile simulation: 390×844, 4× CPU throttle. **No physical phone was tested.** Scroll timing excludes startup and records accumulated main-thread task time, not CPU percentage. Final heap samples and frame tails are in the [raw results](benchmark-2026-10-26.json), together with source and bundle hashes. The commit identifies the 1.19.3 base; recipe files were uncommitted during measurement.

## Medians per 180-frame scroll

|Profile|Scene|Implementation|Task ms|Script ms|Style ms|Layout ms|Task min–max ms|
|---|---|---|---:|---:|---:|---:|---:|
|desktop|Simple|css|159.0|16.9|32.2|21.7|128.2–177.2|
|desktop|Simple|direct|148.2|23.0|12.7|23.2|81.6–183.6|
|desktop|Simple|native|122.2|15.3|11.1|18.9|78.5–189.6|
|desktop|Dense stress|css|403.5|19.1|185.7|29.1|255.6–436.3|
|desktop|Dense stress|direct|266.9|27.7|15.3|36.6|147.6–335.0|
|desktop|Dense stress|native|282.4|23.6|16.8|42.3|220.1–311.3|
|mobile-simulated|Simple|css|83.8|7.5|17.5|11.3|56.1–128.9|
|mobile-simulated|Simple|direct|54.0|7.4|3.5|7.2|44.5–107.1|
|mobile-simulated|Simple|native|74.2|7.0|6.1|11.0|48.0–132.0|
|mobile-simulated|Dense stress|css|374.2|6.1|176.5|17.3|334.7–419.9|
|mobile-simulated|Dense stress|direct|228.4|14.2|9.2|24.2|164.8–280.0|
|mobile-simulated|Dense stress|native|233.5|9.9|6.8|26.8|159.8–282.1|

CSS means an inherited ScrollVars travel clock; direct means the production recipe's numeric ScrollVars callback; native means a specialized controller without ScrollVars. All share the same local lifecycle. The native build gate verifies that no dist implementation contributes bytes.

In the dense scene, direct reduces median style time by 91.8% on desktop and 94.8% in mobile simulation versus CSS; median task time falls 33.9% and 39.0%. Direct and specialized native are close enough that these noisy samples do not establish a consistent winner. The simple case has broad overlapping ranges; do not turn its median into a guaranteed improvement.

Every timed run delivered 179 measured frame intervals, with none above 25 ms; median p95 is approximately 16.7–16.8 ms. **No FPS improvement is demonstrated.** Results may differ in real pages, GPUs, background load and browsers. Screenshot inspection confirms the intended illustration; computed-transform equivalence is not a pixel-diff test of every rasterization.

## Bundle tradeoff

These are complete benchmark entry bundles, including recipe lifecycle, not the standalone library size. Gzip level 9; no source maps.

|Mode|Minified bytes|Gzip bytes|
|---|---:|---:|
|css|17546|6263|
|direct|18162|6496|
|native|2578|1171|

The specialized control is substantially smaller because it omits general library behavior (scan, pin, nested roots and other integration contracts). The direct recipe is not a bundle-size optimization. An earlier exploratory round retained unused library code in the native bundle; it is excluded from this report.

## Validation and decision

Browser gates cover effective motion changes from the page and OS, waking without a new scroll, offscreen and zero-area pause, synthetic document visibility, idempotent teardown/remount, preserved author transforms and no-JS content. Synthetic visibility is not a real OS background test. All 659 repository tests pass. Two new unit tests cover stale callbacks and cleanup continuation after a throwing release.

Keep this as a ready-to-copy integration recipe. Preserve existing CSS presets and public API. Before introducing a renderer-neutral helper, reproduce the need in a second real consumer and test a physical phone. Nothing in this experiment was deployed or published as a new npm version.
