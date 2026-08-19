# scrollvars

Tiny scroll-driven animation engine for the web: **one rAF loop in, CSS variables out.** Zero dependencies, React layer optional, ~2 KB of driver.

## Why

Most scroll-animation setups pipe scroll values through framework state (a re-render per frame per element) and interleave layout reads with style writes (layout thrashing). scrollvars fixes the transport:

- **One global driver** — a single passive scroll listener + a single `requestAnimationFrame` for the whole page.
- **Batched read → write phases** — all rects first, all CSS variables after.
- **No framework in the hot path** — React renders zero times during scroll.
- **Fails visible** — hiding styles are gated on `html.sv-on` (set by the driver), so if JS never loads the page is a normal static page.
- **`prefers-reduced-motion`** respected by driver and presets.

## Install

```bash
npm i scrollvars
```

```ts
// app/globals.css or layout
import 'scrollvars/styles.css'
```

## Mental model

The driver **tracks** elements and writes three variables + one class:

| Output | Range | Meaning |
| --- | --- | --- |
| `--sv-view` | −1 → 0 → 1 | Below the scene → in scene → gone above |
| `--sv-t` | 0 → 1 | Travel through the viewport (same semantics as native `view()`) |
| `--sv-pin` | 0 → 1 | Raw progress across a pinned (sticky) stretch — curtains, horizontal carousels |
| `--sv-scene` | 0 → N−1 | Scene index across a pinned section (eased + snapped) |
| `.sv-live` | class | On while the element is in the live band (75%/25%) |

Anything that reads them is a preset. The shipped ones:

| Class | Effect |
| --- | --- |
| `sv-rise` / `sv-fade` / `sv-slide-l` / `sv-slide-r` | Entrance transitions, triggered by `.sv-live` |
| `sv-auto` (on the container) | Every direct child rises in DOM order — no classes on children (`sv-skip` opts out) |
| `sv-drift` | Continuous drift tied to `--sv-view` — follows the finger, no transition |
| `sv-view-fade` / `sv-view-rise` | Pure CSS, zero JS, where `animation-timeline: view()` exists |

Knobs (set anywhere in CSS or inline): `--sv-distance` (travel length), `--sv-order` (stagger position), `--sv-stagger`, `--sv-duration`, `--sv-ease`.

## React

```tsx
import { Reveal, Parallax, Scenes, Item } from 'scrollvars/react'

// Entrance — children stagger automatically
<Reveal as="section" auto>
  <h2>Title</h2>
  <p>Copy</p>
  <button>CTA</button>
</Reveal>

// Continuous drift
<Parallax distance="10rem">
  <img src="…" alt="" />
</Parallax>

// Knobs are attributes — sugar for the CSS variables (no style ceremony)
<Reveal stagger={140} duration={900}>
  <Item order={0}>first</Item>
  <Item order={1} effect="slide-l" distance="4rem">second</Item>
</Reveal>

// Pinned storytelling (the sticky/keyframes pattern)
<Scenes count={4}>
  {({ scene, goTo }) => (
    <div>
      Slide {scene + 1}
      {/* continuous progress, pure CSS, no re-render: */}
      <i style={{ width: 'calc(var(--sv-scene) / 3 * 100%)' }} />
    </div>
  )}
</Scenes>
```

Lower level: `<Track>` (the base component) and `useTrack(options)` / `useScenes(count)`.

## Pointer tilt

Same philosophy, different input — the pointer becomes `--mx`/`--my` (−1..1 from each card's center):

```tsx
const ref = usePointer()          // or trackPointer(container) in vanilla
<div ref={ref} className="grid">
  <div className="sv-tilt">…</div>   {/* tilt + glare from styles.css */}
</div>
```

## Video scrub & WebGL

`onTravel` fires every frame with the raw 0..1 value — feed it to whatever JS needs to follow the scroll:

```tsx
useTrack({ onTravel: (t) => { video.currentTime = t * video.duration } })
useScenes(4, {})            // or drive an R3F camera from onScene / onTravel
```

## Canvas effects (`scrollvars/canvas`)

For ambient canvas work (particle spheres, generative heroes) the simulation is
yours — the harness handles the lifecycle everyone rewrites badly: resize, DPR
cap, delta-time loop, **pause when offscreen or the tab is hidden**,
`prefers-reduced-motion`, cleanup. Drawing space is CSS pixels.

```tsx
const ref = useCanvasEffect({
  setup: (fx) => { points = makeSphere(1000) },
  frame: (fx, dt) => {
    fx.ctx.clearRect(0, 0, fx.width, fx.height)
    angle += (fx.reducedMotion ? 0.05 : 1) * dt
    drawSphere(fx.ctx, points, angle)
  },
})
<canvas ref={ref} className="h-full w-full" />
```

Vanilla: `mountEffect(canvas, { setup, frame })` returns
`{ pause, resume, destroy }`. Feed it scroll/pointer inputs from the driver
(`onTravel`, `--mx`) through your own closure — the modules stay decoupled.

## Vanilla

```ts
import { track } from 'scrollvars'

const untrack = track(el, { scenes: 4, onScene: (i) => console.log('scene', i) })
```

## License

MIT
