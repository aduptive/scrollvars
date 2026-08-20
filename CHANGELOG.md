# Changelog

## 0.6.0 — 2026-08-19

- **`--sv-view` reformulated**: now the signed position relative to the live
  band — the same 75%/25% lines the `sv-live` class uses, so the variable and
  the class always agree. −1 with the top at the viewport's bottom edge,
  0 across the whole band, +1 once the bottom clears the exit line.
  Entrance/exit ramps are shorter than before (0.25 vh each); `sv-drift`
  reacts a touch snappier near the edges.
- `LICENSE` file and this changelog.

## 0.5.0 — 2026-08-19

- **Attribute API for React** (Felipe's feedback): `order`, `distance`,
  `stagger`, `duration`, `ease` as props on `Track`/`Reveal`/`Parallax` —
  they compile to the CSS variables; new `<Item effect="rise|fade|slide-l|
  slide-r|drift|tilt">` for children. The variables remain the real API.
- `sv-rail` fixed on wide windows: starts one viewport offscreen right, ends
  right-edge aligned (`min()` keeps it moving when the track fits).

## 0.4.0 — 2026-08-18

- **`scrollvars/canvas`**: `mountEffect` / `useCanvasEffect` — lifecycle
  harness for ambient (time-driven) canvas effects: resize, DPR cap (2),
  delta-time loop, auto-pause offscreen and on hidden tab, live
  reduced-motion flag, full cleanup. Simulations stay in userland.
- `AGENTS.md` (agent-facing docs, shipped in the npm package) and
  `test/canvas.test.mjs`.

## 0.3.0 — 2026-08-18

- **Pointer module**: `trackPointer` / `usePointer` write `--mx`/`--my`
  (−1..1 from the element's center) with one delegated listener; `sv-tilt`
  preset (3D tilt + glare).

## 0.2.0 — 2026-08-17

- Vocabulary finalized: `--sv-view`, `--sv-t`, `--sv-pin`, `--sv-scene`,
  `.sv-live`, `html.sv-on` guard. React layer: `Track`, `Reveal`, `Parallax`,
  `Scenes`, `useTrack`, `useScenes`. Presets incl. `sv-curtain-l/r`,
  `sv-rail`, `sv-auto` stagger, `sv-view-*` pure-CSS tier.

## 0.1.0 — 2026-08-17

- First cut: single global driver (one passive scroll listener + one rAF,
  batched read → write), CSS variables as the entire output surface, zero
  React renders during scroll.
