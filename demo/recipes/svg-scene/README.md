# SVG/DOM scroll recipe

A decorative SVG illustration driven by numeric ScrollVars progress. It uses the
existing public API, with no new library export or dependency. Text, navigation
and the finished artwork stay available without JavaScript.

## Use in a project

Copy `scene.mjs`, `scene-lifecycle.mjs` and `scene.css`. Use the markup in
`index.html`, import the stylesheet through your application's usual pipeline,
then call `mountSvgScene(sectionElement)` after mounting and call its returned
cleanup on unmount. In React, use an effect and a DOM ref; do not put progress
in state. `entry.mjs` demonstrates a plain-page integration including bfcache
restoration. Bundle the entry with your existing bundler; the HTML expects the
result as `entry.js`. Import `scrollvars` from the installed package.

`[data-piece]` identifies the SVG groups whose transform this renderer owns.
Keep layout, positions and artwork in the SVG; only change the transform formula
in `paintScene` when changing choreography. Essential text belongs outside the
`aria-hidden` graphic. The CSS declarations with `data-renderer="css"` are only
for the benchmark control and can be omitted in a copied direct-render recipe.

The lifecycle attaches tracking only when the section intersects the viewport,
has nonzero size, the tab is visible and motion is permitted. It subscribes to
`onMotionChange` independently of tracking, so a paused section wakes when the
preference changes. No private rAF, CSS reads per frame, or React frame updates
are needed. Disposal rejects stale input callbacks, releases observers/listeners,
and restores owned inline transforms without overwriting a later author edit.
Missing observers leave the static scene intact. The lifecycle module is local
recipe code, not a proposed general-purpose library helper.

## Preview and compare

From the repository root, use the Node version in `.nvmrc`, build the library,
and use the benchmark harness dependencies already described in its README:

```sh
npm run build
node demo/bench/harness/svg-scene.mjs --serve
node demo/bench/harness/svg-scene.mjs --gates
node demo/bench/harness/svg-scene.mjs
```

The local server prints its loopback URL. Choose `?mode=direct` (this recipe),
`?mode=css` (inherited travel clock), or `?mode=native` (specialized scroll code
without ScrollVars). Add `&deep=1` for 120 extra SVG descendants per group.
This stress profile is explicitly separate from the simple illustration.

`SCENE_RESULTS` selects an output directory (default `node_modules/.cache/svg-scene`);
`SCENE_PORT` selects a preview port. The runner builds each variant separately,
verifies that the native bundle contains no ScrollVars implementation, and saves
source/bundle hashes and raw results. Browser gates compare intermediate and
reverse-scroll transforms, including resize and the deep profile, before timing.
They also exercise motion changes, zero size, synthetic document visibility,
teardown/remount and no-JS content. Synthetic visibility is a lifecycle test,
not proof of real OS background scheduling.

Timing uses six rotating/reversed rounds per variant, with 180 frames per run,
on desktop and a 390px viewport with 4x CPU throttling. This is **mobile
simulation, not a physical-phone measurement**. CPU/script/style/layout, final
heap sample, frame tails and gzip are separate metrics. Gates run in Chromium,
Firefox and WebKit; timings use the installed Chrome. Startup is excluded from
the timed scroll, and runs with different amounts of delivered work must not
be treated as equivalent wins. The specialized native control deliberately
omits the library's scan, pin, nested-root and other general features.
