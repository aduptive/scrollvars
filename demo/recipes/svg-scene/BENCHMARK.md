# SVG recipe benchmark, 2026-10-26

The tested dense SVG benefits from using ScrollVars numeric callbacks to write transforms directly. No library implementation change or new public helper was needed. This supports a recipe-level choice, not replacing all CSS-variable effects.

## Method

Apple M2 Max, 32 GB RAM, macOS 26.6.2; Chrome/155.0.8059.85. Six rotating/reversed runs per mode and profile, 180 delivered animation frames each. Same SVG, geometry, scroll path, transform precision and lifecycle. Simple artwork has three groups with three shapes each; the stress profile adds 120 circles per group (360 extra descendants). Visual gates compare intermediate and reverse-scroll transforms in Chromium, Firefox and WebKit, including mobile viewport and the dense profile. CPU timing uses Chrome only.

Desktop: 1280×800, unthrottled. Mobile simulation: 390×844, 4× CPU throttle. **No physical phone was tested.** Scroll timing excludes startup and records accumulated main-thread task time, not CPU percentage. Final heap samples and frame tails are in the [raw results](benchmark-2026-10-26.json), together with source and bundle hashes. The commit identifies the checked-out parent; source and bundle hashes identify the candidate measured with the cleanup and motion-preference reader fixes.

## Medians per 180-frame scroll

|Profile|Scene|Implementation|Task ms|Script ms|Style ms|Layout ms|Task min–max ms|
|---|---|---|---:|---:|---:|---:|---:|
|desktop|Simple|css|119.3|12.7|24.4|16.3|95.4–124.7|
|desktop|Simple|direct|88.8|14.1|7.5|13.4|79.0–141.4|
|desktop|Simple|native|109.4|13.9|9.7|17.3|99.6–124.0|
|desktop|Dense stress|css|213.3|10.1|95.0|13.5|173.0–278.7|
|desktop|Dense stress|direct|147.4|13.7|7.0|17.2|100.7–158.9|
|desktop|Dense stress|native|130.2|10.3|6.7|15.7|96.6–164.6|
|mobile-simulated|Simple|css|133.6|11.4|25.5|20.7|118.1–215.7|
|mobile-simulated|Simple|direct|156.1|19.5|10.6|26.4|76.3–193.9|
|mobile-simulated|Simple|native|91.0|9.1|8.1|15.5|82.5–165.8|
|mobile-simulated|Dense stress|css|539.5|17.8|236.7|37.5|416.0–637.9|
|mobile-simulated|Dense stress|direct|278.0|19.8|11.6|30.0|242.1–327.1|
|mobile-simulated|Dense stress|native|267.9|13.0|10.5|29.1|244.7–285.6|

CSS means an inherited ScrollVars travel clock; direct means the production recipe's numeric ScrollVars callback; native means a specialized controller without ScrollVars. All share the same local lifecycle. The native build gate verifies that no dist implementation contributes bytes.

In the dense scene, direct reduces median style time by 92.6% on desktop and 95.1% in mobile simulation versus CSS; median task time falls 30.9% and 48.5%. Direct and specialized native samples do not establish a consistent winner. The simple case has broad overlapping ranges; the direct mobile-simulated median is actually higher (156.1 vs 133.6 ms) despite lower style time. Do not replace simple CSS effects on the strength of the dense-scene result.

Every timed run delivered 179 measured frame intervals, with none above 25 ms; median p95 is approximately 16.7–16.8 ms. **No FPS improvement is demonstrated.** Results may differ in real pages, GPUs, background load and browsers. Screenshot inspection confirms the intended illustration; computed-transform equivalence is not a pixel-diff test of every rasterization.

## Bundle tradeoff

These are complete benchmark entry bundles, including recipe lifecycle, not the standalone library size. Gzip level 9; no source maps.

|Mode|Minified bytes|Gzip bytes|
|---|---:|---:|
|css|17528|6262|
|direct|18186|6497|
|native|2630|1183|

The specialized control is substantially smaller because it omits general library behavior (scan, pin, nested roots and other integration contracts). The direct recipe is not a bundle-size optimization. An earlier exploratory round retained unused library code in the native bundle; it is excluded from this report.

## Validation and decision

Browser gates cover effective motion changes from the page and OS, waking without a new scroll, offscreen and zero-area pause, synthetic document visibility, idempotent teardown/remount, preserved author transforms and later priority-only overrides and no-JS content. Synthetic visibility is not a real OS background test. All 660 repository tests pass. An additional regression test checks that a motion subscriber registered before driver initialization reads the new OS preference during notification. Browser gates exercise OS preference changes without a size change masking that ordering bug. Two new unit tests cover stale callbacks and cleanup continuation after a throwing release.

Keep this as a ready-to-copy integration recipe. Preserve existing CSS presets and public API. Before introducing a renderer-neutral helper, reproduce the need in a second real consumer and test a physical phone. Nothing in this experiment was deployed or published as a new npm version.
