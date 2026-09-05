# One rAF in, CSS variables out: why I built ScrollVars

*A 2 KB scroll-animation engine, a 26-pattern public demo, and the five
hard-won lessons that shaped it.*

---

## The diagnosis

It started with a production site that janked.

The animations were tasteful: reveals, parallax, a pinned 3D-ish sequence.
But scrolling felt like dragging a stone across gravel. When I read the code,
the architecture explained everything: scroll values were piped through
framework state. Every tracked section had its own scroll listener feeding a
React `useState`, which meant **a re-render per frame, per element**. Layout
reads (`getBoundingClientRect`) were interleaved with style writes, so the
browser recalculated layout several times per frame. The classic thrashing
pattern. On a fast laptop it merely stuttered. On phones it crawled.

None of this was exotic bad code. It's what naturally happens when you build
scroll animation the way most tutorials teach it: state in, JSX out. The
framework's render loop becomes your animation loop, and the framework's
render loop was never meant to run at 120 Hz.

## The one rule

ScrollVars is the result of asking: what's the *minimum* transport between
scroll position and animated pixels?

The answer fits in a sentence: **one passive scroll listener and one
`requestAnimationFrame` for the whole page; each frame batches every layout
read, then batches every write; and the only thing ever written is CSS custom
properties.**

```
scroll ──► one rAF ──► read all rects ──► write a handful of variables
                                              │
                                   CSS does literally everything else
```

The driver tracks elements and maintains a tiny vocabulary on each:

| variable | range | meaning |
| --- | --- | --- |
| `--sv-view` | −1 → 0 → 1 | entering → on stage → leaving |
| `--sv-t` | 0 → 1 | travel through the viewport |
| `--sv-pin` | 0 → 1 | progress across a pinned (sticky) stretch |
| `--sv-scene` | 0 → n−1 | scene of a pinned story, eased and snapped |

JavaScript never animates. React never re-renders on scroll. The driver
writes variables, and any CSS that reads them is a valid effect. A parallax
is one declaration. A curtain is two. The presets that ship with the library
are just examples of that contract.

## What falls out for free

Committing to "variables out" bought more than performance:

- **Server rendering.** Content lives in ordinary server-rendered markup;
  the React layer is a set of thin `'use client'` wrappers whose children
  stay server components. In Next.js you can drop one `<ScrollVarsBoot />`
  in the layout and write plain `data-sv` attributes. Zero client
  components in your pages.
- **It fails visible.** Hiding styles are gated behind an `html.sv-on` class
  that only the driver adds. If JavaScript never loads: old browser, blocked
  script, crawler. The page renders complete and static. Animation is
  progressive enhancement, never a dependency.
- **It's testable.** The whole engine is pure geometry: rect in, numbers
  out. The test suite stubs a DOM in ~40 lines and asserts exact variable
  values at exact scroll positions.
- **Zero dependencies**, ~2 KB of driver.

## The stress test: 26 patterns in public

A transport claim is cheap until you push real weight through it, so the
[public demo](https://scrollvars.dev) became a stress test: every
pattern I could steal from award-site land, implemented on the same four
variables. A few highlights:

- **A camera-path page**: a 2400×1800 world, a dashed route, and the scroll
  flying a camera along an SVG path (`getPointAtLength` for position, a
  sample just ahead + `atan2` for heading). The page doesn't scroll; the
  camera travels.
- **A below-the-fold flavor wheel**. A rotating pizza carousel whose hub
  sits under the viewport's bottom edge. The scroll owns the rotation;
  the arrow buttons just scroll the page to the matching stop, so the two
  inputs can never fight.
- **A 1.4 KB carousel.** Native scroll rails + scroll-snap magnetism + an
  observer that writes each slide's signed distance from center (`--sd`)
  as a variable. Coverflow is then two CSS declarations. Measured against
  Swiper 11 from the same CDN: 42 KB gzipped (plus 18 KB of CSS) vs 1.4 KB.
Because the browser already ships the hard parts.

The demo is served unminified on purpose: view-source is the documentation.

For scale, measured from the same CDN (min / gzip):

| engine | minified | gzipped |
| --- | --- | --- |
| framer-motion 11 | 144 KB | 46.9 KB |
| GSAP core + ScrollTrigger | 117 KB | 46.3 KB |
| Swiper 11 bundle | 151 KB | 42 KB |
| **ScrollVars, everything** (core + slider + presets CSS) | 15.8 KB | **5.9 KB** |
| **ScrollVars driver alone** | 2.3 KB | **1.2 KB** |

And because a size table invites the obvious question, there is a
[public benchmark](https://scrollvars.dev/bench/). Identical DOM,
identical scroll driver, 150 and 900 scrubbed elements, only the engine
varies. Two honest findings. First: **on capable
hardware all three deliver the same 60 fps**. Every competent engine
animates only the viewport, so frame parity in scrubbing is structural.
Second, and this is where they separate: **what those frames cost.**
Measured over the identical run via CDP (script + style recalc + layout):
ScrollVars 421 ms of CPU and 1.3 MB of JS heap; GSAP 476 ms and 7.2 MB;
framer-motion 918 ms and 10.8 MB. Same frames at 2.2× less CPU and 8× less
memory than Framer. On phones that's battery and headroom for your own
code, and it's why stacked Framer pages fold on weak devices first. GSAP
is genuinely efficient; against it the difference is the 15× bundle, the
heap, and the no-JS/SSR story. And on Google's own ruler, Lighthouse
mobile, the PageSpeed profile. The load cost decides it: ScrollVars 100,
framer-motion 94, GSAP + ScrollTrigger 88, the latter losing 230 ms of
Total Blocking Time just building its 900 triggers on a throttled main
thread. Run it all on your own machine; that's what it's for.

## Five lessons that cost real hours

**1. Safari will wedge if you scrub video.** Driving `video.currentTime`
from scroll works in Chromium and freezes WebKit's decoder under fast
bidirectional seeking. Permanently, until a full `load()`. Every workaround
(seek serialization, watchdogs, `fastSeek`) eventually lost. The bulletproof
answer is the one Apple themselves use: pre-extract frames
(`ffmpeg -vf fps=6`) and `drawImage` them onto a canvas. Images are
stateless; decoders are not.

**2. The performance ceiling is the painted layer, not the transform.**
The camera-path world originally painted its grid and route across the full
world div, promoted with `will-change`. Modern GPUs shrugged; a 2015
MacBook choked: fluid at first, then janking as the camera entered
territory whose tiles weren't rasterized yet. The fix wasn't a smaller
transform (transforms are nearly free) but a smaller *painting*: the
transformed div now paints only its five content cards (sparse tiles), while
grid and route are redrawn per frame on a viewport-sized canvas. ~25 strokes
per frame runs anywhere.

**3. Individual transform properties have a fixed order.** `translate:`,
`rotate:` and `scale:` always apply translate→rotate→scale, regardless of
declaration order. For radial math (wheels, orbits) you need the
`transform:` shorthand, where order is literal:
`transform: rotate(var(--spoke)) translateY(-radius)`.

**4. One writer per scroll position.** Every mysterious "jump" in the
carousel had the same root cause: two things writing the same `scrollLeft`.
Native snap vs the glide animation, selection auto-scroll vs the drag,
the scroll-driven mapping vs a direct swipe. The rule that ended the
whack-a-mole: for any scrolling surface, decide who the single writer is,
and disable the others while it works (suspend snap during glides, prevent
text selection on drag, `overflow: hidden` on scroll-driven instances).

**5. Retargeted transitions jitter; exponential lerp doesn't.** Animating a
continuously-updating value with a CSS transition re-targets the easing
every frame and stutters. Fixed-duration tweens front-load short distances
and read as a dry snap. The answer, everywhere it mattered. Parallax lag,
carousel glide, wheel inertia. Was the same three lines of physics:
`current += (target − current) × factor`. Velocity proportional to remaining
distance; every travel equally soft; retargets free.

## When you should not use it

ScrollVars maps *inputs to values*. If your animation is driven by time
rather than input. Orchestrated timelines, spring physics, staggered
sequences that play on their own. That's GSAP's turf and GSAP is excellent
at it. Likewise, ambient canvas simulations (particles, generative heroes)
are their own paradigm; ScrollVars only offers them a lifecycle harness
(resize, DPR cap, pause-when-offscreen) and hands your simulation the loop.

## Try it

The demo: 26 live patterns, each with its skeleton and source:
**https://scrollvars.dev**

`npm i scrollvars`: MIT, zero dependencies, Chrome/Edge 104+, Firefox 74+,
Safari 14.1+ fully animated; everything older gets the complete page, static.
