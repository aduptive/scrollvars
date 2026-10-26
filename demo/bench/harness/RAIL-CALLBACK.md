# Gallery rail callback screen, 2026-10-26

The numeric onPin callback reduced inherited-clock work in this controlled rail fixture. Keep the shipped preset unchanged: the experimental direct controller covers only the default rail start and manually authored height. It is not a drop-in replacement for the pin helper, custom start values, compat behavior or arbitrary consumer content.

## Method

Markup comes directly from the horizontal-rail entry in scripts/fx-data.mjs (five cards). Both arms use the shipped pin stylesheet, the same 80%-width stage, authored 240vh wrapper, motion/teardown fallback CSS and view:false. The CSS arm sets pin:true; the direct arm uses onPin without pin and caches dimensions with ResizeObserver. This isolates the clock writer; it is not an end-to-end timing of the entire gallery page or the stock pin-string helper. The optional stress profile adds 50 decorative span descendants to each card, without changing layout.

Apple M2 Max / 32 GB / macOS 26.6.2, 155.0.8059.85. Six alternating pairs per profile, 180 delivered frames each, steady-state scroll after preflight; startup excluded. Desktop 1280×800; mobile simulation 390×800 at 4x CPU throttling. No physical phone. Same work and sampled card positions must match before timings are accepted.

|Width|Extra descendants/card|Mode|Task ms|Script ms|Style ms|Task range ms|
|---:|---:|---|---:|---:|---:|---:|
|1280|0|css|154.9|18.6|45.2|107.1–167.3|
|1280|0|direct|120.1|19.3|12.2|97.4–134.8|
|1280|50|css|158.6|13.1|72.7|88.3–210.5|
|1280|50|direct|120.6|17.8|10.8|64.2–158.7|
|390|0|css|162.4|14.9|41.6|156.4–181.7|
|390|0|direct|121.0|14.0|10.4|75.5–163.1|
|390|50|css|228.4|12.5|97.9|217.6–339.2|
|390|50|direct|169.0|15.6|10.8|141.5–211.9|

With the five original cards, direct reduces median style cost by 72.9% desktop / 75.0% simulated mobile, and task time by 22.4% / 25.5%. The stress profile reduces median task time by 24.0% / 26.0%. No measured interval exceeded 25 ms; all runs delivered 179 measured intervals and no FPS gain is established. Individual task samples are noisy, so use repeated real-consumer measurements before making a default choice.

Gzip: CSS entry 5888 bytes; direct entry 6079 bytes. The direct option costs more code and requires measurement/invalidation and motion cleanup. Both entries include ScrollVars. This is a runtime-cost experiment, not an npm/bundle reduction.

Chromium, Firefox and WebKit gates pass at both widths and densities: initial/intermediate/end/reverse movement, last-card reachability, viewport resize, a 64px sticky offset, reduced motion and restoration, and idempotent teardown. The source and bundle hashes and every run are in [raw results](results/rail-callback/2026-10-26.json).

Run from the repo root with Node from .nvmrc and the existing harness dependencies:

```sh
node demo/bench/harness/rail-cost.mjs --gates
node demo/bench/harness/rail-cost.mjs
```

RAIL_RESULTS selects the output directory; --browser=chromium|firefox|webkit restricts functional gates. The main API and gallery recipes are unchanged. The supported callback-only path is worth documenting for measured heavy scenes; a new general API is not justified by these fixtures alone.
