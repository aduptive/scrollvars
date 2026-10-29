# Glass acceptance

From the repository root, under Node 20:

```sh
node demo/bench/harness/glass-review.mjs
```

Open the printed localhost URL in the target browser. This builds the current
Glass source with production React, independent of any historical prototype.
Click **Run component checks**, then **Run failure checks**. Results are saved under
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

## Current evidence (2026-10-28 to 2026-10-29)

Chrome 156, installed Firefox Developer Edition 160 and native Safari 26.6.2
passed all 11 component checks at DPR 2. Visual inspection showed continuous
blur rather than the old sparse filter's separated text copies. Safari also
passed manual blur 0/6/24, material extremes and forward/reverse position checks.
All three browsers passed three real failure-path checks: source failure keeps semantic
content visible, explicit remount recovers, and WEBGL_lose_context terminates the
instance without restarting on update/resume. Shader allocation failures remain
covered by unit stubs. Physical mobile and the final consumer scene remain
unmeasured. A release must not inherit acceptance from an older prototype or
from a different browser engine.

The native Safari component result and all three browsers' failure-path results
are preserved in `results/2026-10-29/` with timestamps and the fixture bundle
SHA-256. These receipts use the same current fixture bundle; the earlier Chrome
and Firefox component checks predate the failure-test instrumentation, with
unchanged production Glass source. Diagnostic draw timings are not performance
targets or evidence of a speedup.
