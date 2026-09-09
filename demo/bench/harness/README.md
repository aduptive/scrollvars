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
