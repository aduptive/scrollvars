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

Reproduces every number on /bench/. Including the CPU split the in-page
runner cannot measure. Serves the repo's demo/ locally, drives each engine
page in headless Chrome over CDP, waits for the page's own DONE payload
(frame stats) and reads `Performance.getMetrics`.

```bash
npm i
npm run measure                    # main table + deep-DOM curve, 3 runs each
node measure.mjs --runs=5          # more repetitions
node measure.mjs --throttle=4      # 4x CPU throttle (calibration verified)
CHROME=/path/to/chrome node measure.mjs
```

Scenarios: `main-900` (60 sections x 15 boxes; ScrollVars vs idiomatic GSAP
vs batched GSAP (one trigger per section, the expert version) vs
framer-motion) and `deep-{5,20,50}` (a realistic subtree under every box:
the style-recalc curve as DOM depth grows; ScrollVars vs batched GSAP).

Output: median-of-N tables on stdout + `../results/latest.json`. Engine
order rotates every repetition; the throttle is verified with a spin-loop
calibration and reported in the JSON.
