# Bench harness

Reproduces every number on /bench/ — including the CPU split the in-page
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

Scenarios: `main-900` (60 sections x 15 boxes; scrollvars vs idiomatic GSAP
vs batched GSAP — one trigger per section, the expert version — vs
framer-motion) and `deep-{5,20,50}` (a realistic subtree under every box:
the style-recalc curve as DOM depth grows; scrollvars vs batched GSAP).

Output: median-of-N tables on stdout + `../results/latest.json`. Engine
order rotates every repetition; the throttle is verified with a spin-loop
calibration and reported in the JSON.
