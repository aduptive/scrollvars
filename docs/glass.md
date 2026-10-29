# Glass overlay

The spectral WebGL effect is available from two opt-in entry points:

See `examples/glass.tsx` and `examples/glass.css` for a complete explicit scene
with scroll-driven position and semantic text underneath.

```tsx
import { Glass } from 'scrollvars/react/glass'
import type { GlassHandle } from 'scrollvars/glass'
import 'scrollvars/styles/glass.css'
```

`Glass` renders a `div` by default; `as="span"` renders an inline-block span.
Give the host its layout dimensions through your stylesheet. Its canvas is an
absolute, pointer-transparent, accessibility-hidden decoration. Real text, links
and accessible graphics stay in `children`, visible during SSR, without JS and
after WebGL failure. `children` are **not** automatically captured into a texture.

## Source and parameters

The required `source(fx)` callback returns a loaded `TexImageSource`: a canvas,
image, bitmap or similar WebGL-compatible source. It receives CSS `width`,
`height`, `dpr` and the effective reduced-motion preference. Match the scene's
composition and aspect ratio; the texture maps across the whole host. A canvas
source can paint charts, designs, gradients and text in the same coordinate space.
An opaque SVG scene works when loaded into an `HTMLImageElement` first. Paint
transparent SVG artwork over an opaque background in the source canvas: the
accepted shader samples scene RGB and owns the glass alpha, so transparent
images alone are not a complete background. An arbitrary SVG DOM node, HTML div
or span cannot be passed as a captured scene.

Source images must be decoded and same-origin or served with suitable CORS
headers before mount. A rejected/tainted/not-ready source hides only the overlay;
`onError(error)` reports the problem. Fix the source and remount to retry.

| Prop | Range | Default | Meaning |
| --- | --- | --- | --- |
| `edgeWidth` | 1–20 | 8 | Edge band as percent of host width |
| `refraction` | 0–100 | 55 | Edge displacement strength |
| `dispersion` | 0–100 | 60 | Spectral separation |
| `interior` | 0–100 | 0 | Interior lens strength; zero leaves only edge deformation |
| `position` | 0–100 | 42 | Horizontal glass position |
| `opacity` | 0–100 | 100 | Opacity of the whole refracted overlay |
| `color` | `#RGB` / `#RRGGBB` | `#ffffff` | Subtle glass tint and edge-light color |
| `blur` | 0–24 CSS px | 0 | Scene softening inside the glass |
| `edgeGlow` | 0–100 | 12 | Intensity of the thin illuminated outline |
| `lightMode` | `static` / `pointer` / `float` | `static` | Fixed light, mouse-following light or slow orbit |
| `lightX`, `lightY` | 0–100 | 25, 0 | Fixed light point in percent of the scene |
| `dprCap` | positive finite | 2 | Backing-store pixel ratio cap |

For brighter glints like the reference, try `edgeGlow={80}`. The highlight
falls off over 1.2 CSS pixels inward from the edge and also varies **along** each
edge with light distance and edge orientation. It is independent of the
much wider refraction band. `color` colors this light and a subtle 1.8% tint
across the glass; opacity controls the entire overlay, not just that tint.

This is a stylized localized specular-light model, not a physical diffraction
simulation. The light is localized instead of illuminating every edge uniformly. `lightMode="float"`
moves one light around an ellipse over 120 seconds of active time, pausing while
offscreen/hidden or manually paused. It draws continuously only in that mode
with nonzero edgeGlow. `pointer` listens on the canvas host (the canvas remains
pointer-transparent), and returns to the fixed point on pointerleave. Touch
users can use fixed/float mode; no essential content depends on pointer movement.
Under reduced motion both animated modes use lightX/lightY instead. Material and
light changes reuse the scene texture; no React state or extra rAF loop is used.

`blur` softens the scene, not the HTML or glass silhouette. It runs a separable
Gaussian before refraction: horizontal then vertical, with dense one-CSS-pixel
kernel samples out to three standard deviations. The value is Gaussian sigma
in CSS pixels. Intermediate textures use CSS resolution and clamp at the scene
edges; blur zero bypasses both passes and uses the original full-DPR source.

The prepass runs only when blur, source or dimensions change. Moving the light,
glass, or changing opacity/color reuses the cached texture. A radius change
does not recapture the source; it only rebuilds the filtered texture. Two extra
textures and a framebuffer are acquired lazily and disposed with the instance.
This adds memory and GPU work on invalidation, especially at large radii; no
hardware performance gain is claimed. Radius zero allocates no blur resources.

Material values clamp to their range; nonfinite values are rejected. With a
wide edge band, most of a narrow glass can be inside the band, even at interior
zero. The glass has a fixed five-sided outline. Arbitrary SVG paths,
concave shapes and CSS border-radius silhouettes are outside this first version.

The forwarded `GlassHandle` ref exposes `update(material)`, `invalidateSource()`,
`pause()`, `resume()` and `destroy()`. Declarative prop changes apply automatically.
Call `invalidateSource()` after repainting the same source canvas or changing
an image in place. Changing the `source` callback identity also invalidates it.
Changing `as` or `dprCap` remounts the renderer. After manual `destroy`, remount
the component to restart. No GPU resources are shared between instances.

## ScrollVars integration

Use an existing tracker's `onTravel`/`onPin` callback:

```tsx
const glass = useRef<GlassHandle>(null)
const section = useTrack({
  view: false,
  onTravel: t => glass.current?.update({ position: 20 + t * 50 }),
})
```

Do not put continuous progress in React state. `mountEffect` owns resize, DPR,
visibility/offscreen gates and teardown. Unchanged frames issue no GPU draw or
texture upload; the existing harness still checks a lightweight frame callback
while visible. Float light explicitly redraws while active. This is not a
promise of zero CPU work or measured battery gain.
Under reduced motion the glass stays at position 42; other static material
updates and source refreshes remain available. Hidden/offscreen instances retain
the latest dirty state until their lifecycle resumes.

Vanilla consumers use `mountGlass(canvas, options)` from `scrollvars/glass` and
keep their semantic HTML below the canvas. Call `destroy()` on replacement.
Context loss is terminal for that instance; remount after fixing the cause.

## Browser validation and limits

Unit tests cover independent instances, idle draws, cached texture updates,
resizing, pause/resume, visibility gates, invalid inputs, SSR div/span markup
and cleanup after source, shader, WebGL availability and context-loss failures.
Bundle tests keep Glass out of existing core, pointer, boot and slider imports.

Run the current-component acceptance fixture with Node 20:

```sh
node demo/bench/harness/glass-review.mjs
```

Open the printed localhost URL in each target browser and run the component
checks. The fixture uses the actual source module and production React. It
checks real WebGL pixels and lifecycle, and saves browser results outside the
published package. Inspect blur, localized light, pointer behavior and reverse
position changes visually as well. This is not a competitor benchmark or a
claim of physical-mobile performance. GPU cost depends on area, DPR, source
updates and blur radius; validate the actual consumer scene on target devices.

No arbitrary DOM capture, automatic video updates, context restoration or
physical diffraction simulation is provided. Existing scroll/slider imports do
not load this optional module. The Glass stylesheet is also opt-in and is not
included in the aggregate stylesheet.
