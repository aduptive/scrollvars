# scrollvars

Tiny scroll-driven animation engine for the web: **one rAF loop in, CSS variables out.** Zero dependencies, React layer optional.

## Why

Most scroll-animation setups pipe scroll values through framework state, causing a re-render per frame per element, and read layout (`getBoundingClientRect`, `scrollHeight`) interleaved with style writes — layout thrashing. scrollvars fixes the transport:

- **One global driver**: a single passive scroll listener + a single `requestAnimationFrame`.
- **Batched read → write phases**: all rects are read first, all CSS variables written after. No thrashing.
- **No framework in the hot path**: values land as `--d`, `--p`, `--kf` custom properties directly on the element. React (if used) renders zero times during scroll.
- **CSS-first where possible**: `sv-view-*` presets use native `animation-timeline: view()` (zero JS) in supporting browsers.
- **`prefers-reduced-motion`** respected by both the driver and the presets.

## Install

```bash
npm i scrollvars
```

```ts
// globals.css / layout
import 'scrollvars/styles.css'
```

## Variables written by the driver

| Var | Range | Meaning |
| --- | --- | --- |
| `--d` | -1 → 0 → 1 | Distance: entering below → in view → leaving above (snapped) |
| `--p` | -1 → 1 | Continuous progress across the element's scroll travel |
| `--kf` | 0 → n | Eased/snapped keyframe value for pinned sections |

Plus the `sv-active` class when the element crosses the viewport center.

## React

```tsx
import { Animated, useKeyframes } from 'scrollvars/react'

// Entrance animation, staggered children
<Animated as="section" once>
  <h2 className="sv-rise">Title</h2>
  <p className="sv-rise" style={{ '--sv-i': 1 }}>Copy</p>
</Animated>

// Scroll-following (continuous, no transition lag)
<Animated>
  <div className="sv-rise-d">Follows the scroll exactly</div>
</Animated>

// Pinned keyframe section
function Slides() {
  const { ref, index, moveTo } = useKeyframes(4)
  return (
    <section ref={ref} style={{ height: '400vh' }}>
      <div className="sticky top-0">Slide {index + 1}</div>
    </section>
  )
}
```

## Vanilla

```ts
import { register } from 'scrollvars'

const unregister = register(element, { keyframes: 4, onKeyframe: console.log })
```

## Custom animations

The public API is the variables. Any CSS that reads them is a valid preset:

```css
.my-parallax {
  translate: 0 calc(var(--p) * -120px);
}
```

## License

MIT
