# Gallery rail callback screen, 2026-10-26

The numeric onPin callback reduced inherited-clock work in this controlled rail fixture. Keep the shipped preset unchanged: the experimental direct controller covers only the default rail start and manually authored height. It is not a drop-in replacement for the pin helper, custom start values, compat behavior or arbitrary consumer content.

## Method

Markup comes directly from the horizontal-rail entry in scripts/fx-data.mjs (five cards). Both arms use the shipped pin stylesheet, the same 80%-width stage, authored 240vh wrapper, motion/teardown fallback CSS and view:false. The CSS arm sets pin:true; the direct arm uses onPin without pin and caches dimensions with ResizeObserver. This isolates the clock writer; it is not an end-to-end timing of the entire gallery page or the stock pin-string helper. The optional stress profile adds 50 decorative span descendants to each card, without changing layout.

Apple M2 Max / 32 GB / macOS 26.6.2, 155.0.8059.85. Six alternating pairs per profile, 180 delivered frames each, steady-state scroll after preflight; startup excluded. Desktop 1280×800; mobile simulation 390×800 at 4x CPU throttling. No physical phone. Same work and sampled card positions must match before timings are accepted.

|Width|Extra descendants/card|Mode|Task ms|Script ms|Style ms|Task range ms|
|---:|---:|---|---:|---:|---:|---:|
|1280|0|css|62.0|7.6|16.9|50.3–81.6|
|1280|0|direct|46.9|7.6|4.4|44.3–52.7|
|1280|50|css|108.4|8.4|52.5|72.9–131.6|
|1280|50|direct|58.1|8.4|4.9|37.5–72.4|
|390|0|css|134.1|11.3|36.7|118.1–171.7|
|390|0|direct|92.9|9.9|6.4|78.8–109.5|
|390|50|css|248.9|14.8|93.4|194.9–387.7|
|390|50|direct|136.4|13.4|9.0|112.7–245.3|

With the five original cards, direct reduces median style cost by 74.1% desktop / 82.4% simulated mobile, and task time by 24.4% / 30.7%. The stress profile reduces median task time by 46.4% / 45.2%. No measured interval exceeded 25 ms; all runs delivered 179 measured intervals and no FPS gain is established. Individual task samples are noisy, so use repeated real-consumer measurements before making a default choice.

Gzip: CSS entry 5889 bytes; direct entry 6067 bytes. The direct option costs more code and requires measurement/invalidation and motion cleanup. Both entries include ScrollVars. This is a runtime-cost experiment, not an npm/bundle reduction.

Chromium, Firefox and WebKit gates pass at both widths and densities: initial/intermediate/end/reverse movement, last-card reachability, viewport resize, a 64px sticky offset, reduced motion and restoration, and idempotent teardown. The source and bundle hashes and every run are in [raw results](results/rail-callback/2026-10-26.json).

Run from the repo root with Node from .nvmrc and the existing harness dependencies:

```sh
node demo/bench/harness/rail-cost.mjs --gates
node demo/bench/harness/rail-cost.mjs
```

RAIL_RESULTS selects the output directory; --browser=chromium|firefox|webkit restricts functional gates. The main API and gallery recipes are unchanged. The supported callback-only path is worth documenting for measured heavy scenes; a new general API is not justified by these fixtures alone.
