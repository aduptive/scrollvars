# Glass acceptance

From the repository root, under Node 20:

```sh
node demo/bench/harness/glass-review.mjs
```

Open the printed localhost URL in the target browser. This builds the current
Glass source with production React, independent of any historical prototype.
Click **Run component checks**. Results are saved under
`node_modules/.cache/glass-review`, or `GLASS_RESULTS` when set. `GLASS_PORT`
selects a stable port when needed. The server binds to loopback only.

The checks require real WebGL pixels, unchanged-frame draw/upload suppression,
blur without source recapture, cached position/light changes, float/reduced-motion
resume, div/span replacement, resize, unmount and remount. Inspect the visible
text at blur 0/6/24, material extremes, pointer light and reverse position changes.
The underlying HTML is intentionally separate from the explicit scene texture.

Timing samples serialize individual draws with `gl.finish()` before and after
each draw. They are diagnostic submission-to-completion wall times, not a GPU
timer, whole-frame cost, battery test or competitor benchmark. Timer quantization
can produce zeroes. Compare invalidation (potential blur passes) with cached
updates only within that limitation; a previously cached blur may need no prepass.
Never infer a physical mobile frame budget from this desktop fixture.

## Current evidence (2026-10-28)

Chrome 156 and installed Firefox Developer Edition 160 passed all 11 component
checks at DPR 2. Visual inspection showed continuous blur rather than the old
sparse filter's separated text copies. Native Safari acceptance remains pending.
Shader/source failure and context-loss cleanup are covered by unit stubs; that
coverage is not a native-browser fallback pass. Physical mobile and the final
consumer scene remain unmeasured. A release must not inherit acceptance from
an older prototype or from a different browser engine.
