# SVG recipe benchmark, 2026-10-26

The tested dense SVG benefits from using ScrollVars numeric callbacks to write transforms directly. No library implementation change or new public helper was needed. This supports a recipe-level choice, not replacing all CSS-variable effects.

## Method

Apple M2 Max, 32 GB RAM, macOS 26.6.2; Chrome/155.0.8059.85. Six rotating/reversed runs per mode and profile, 180 delivered animation frames each. Same SVG, geometry, scroll path, transform precision and lifecycle. Simple artwork has three groups with three shapes each; the stress profile adds 120 circles per group (360 extra descendants). Visual gates compare intermediate and reverse-scroll transforms in Chromium, Firefox and WebKit, including mobile viewport and the dense profile. CPU timing uses Chrome only.

Desktop: 1280×800, unthrottled. Mobile simulation: 390×844, 4× CPU throttle. **No physical phone was tested.** Scroll timing excludes startup and records accumulated main-thread task time, not CPU percentage. Final heap samples and frame tails are in the [raw results](benchmark-2026-10-26.json), together with source and bundle hashes. The commit identifies the checked-out parent; source and bundle hashes identify the candidate measured with the final cleanup fixes.

## Medians per 180-frame scroll

|Profile|Scene|Implementation|Task ms|Script ms|Style ms|Layout ms|Task min–max ms|
|---|---|---|---:|---:|---:|---:|---:|
|desktop|Simple|css|122.7|13.0|25.9|16.8|86.3–222.1|
|desktop|Simple|direct|119.9|18.6|10.0|18.9|60.7–166.4|
|desktop|Simple|native|133.4|17.2|11.7|21.3|54.5–178.3|
|desktop|Dense stress|css|198.2|8.7|86.2|11.7|157.1–287.0|
|desktop|Dense stress|direct|120.9|11.9|6.1|13.7|97.8–167.4|
|desktop|Dense stress|native|118.4|9.6|6.4|14.8|93.0–139.7|
|mobile-simulated|Simple|css|120.4|7.9|23.3|17.6|84.1–224.9|
|mobile-simulated|Simple|direct|88.4|11.8|7.1|12.6|60.0–163.7|
|mobile-simulated|Simple|native|80.2|9.8|5.9|10.5|48.6–196.6|
|mobile-simulated|Dense stress|css|417.3|7.6|200.8|21.7|379.7–580.8|
|mobile-simulated|Dense stress|direct|261.8|17.4|11.1|28.3|204.8–303.0|
|mobile-simulated|Dense stress|native|219.9|11.8|7.4|20.2|183.5–268.6|

CSS means an inherited ScrollVars travel clock; direct means the production recipe's numeric ScrollVars callback; native means a specialized controller without ScrollVars. All share the same local lifecycle. The native build gate verifies that no dist implementation contributes bytes.

In the dense scene, direct reduces median style time by 93.0% on desktop and 94.5% in mobile simulation versus CSS; median task time falls 39.0% and 37.3%. Direct and specialized native samples do not establish a consistent winner. The simple case has broad overlapping ranges; do not turn its median into a guaranteed improvement.

Every timed run delivered 179 measured frame intervals, with none above 25 ms; median p95 is approximately 16.7–16.8 ms. **No FPS improvement is demonstrated.** Results may differ in real pages, GPUs, background load and browsers. Screenshot inspection confirms the intended illustration; computed-transform equivalence is not a pixel-diff test of every rasterization.

## Bundle tradeoff

These are complete benchmark entry bundles, including recipe lifecycle, not the standalone library size. Gzip level 9; no source maps.

|Mode|Minified bytes|Gzip bytes|
|---|---:|---:|
|css|17558|6270|
|direct|18216|6508|
|native|2630|1183|

The specialized control is substantially smaller because it omits general library behavior (scan, pin, nested roots and other integration contracts). The direct recipe is not a bundle-size optimization. An earlier exploratory round retained unused library code in the native bundle; it is excluded from this report.

## Validation and decision

Browser gates cover effective motion changes from the page and OS, waking without a new scroll, offscreen and zero-area pause, synthetic document visibility, idempotent teardown/remount, preserved author transforms and later priority-only overrides and no-JS content. Synthetic visibility is not a real OS background test. All 659 repository tests pass. Two new unit tests cover stale callbacks and cleanup continuation after a throwing release.

Keep this as a ready-to-copy integration recipe. Preserve existing CSS presets and public API. Before introducing a renderer-neutral helper, reproduce the need in a second real consumer and test a physical phone. Nothing in this experiment was deployed or published as a new npm version.
