# scrollvars — Client Project Integration Kit

The checklist for wiring scrollvars into a real (typically Next.js) project.
Full API reference: [AGENTS.md](../AGENTS.md) · live patterns with source:
https://scrollvars.dev

## 1 · Install

**npm** (once published):
```bash
npm i scrollvars
```

**Local / monorepo** (`file:` dependency):
```jsonc
// package.json
"scrollvars": "file:../../../scrollvars"   // adjust depth
```
```ts
// next.config.ts
transpilePackages: ['scrollvars']
```
⚠️ **pnpm COPIES `file:` dependencies** (it does not symlink them). After any
change to the lib, re-run `pnpm install` in the consuming workspace or the app
silently keeps the stale version.

Load the presets once, in the root layout:
```ts
import 'scrollvars/styles.css'
```

## 2 · Boot — pick one pattern per project

**Default (recommended): zero-wrapper.** One client component in the layout,
everything else stays RSC:
```tsx
// app/layout.tsx
import { ScrollVarsBoot } from 'scrollvars/react'
<body><ScrollVarsBoot />{children}</body>

// any page/section — plain server components
<section data-sv data-sv-once>
  <h2 className="sv-rise">Title</h2>
  <p className="sv-rise" style={{ '--sv-order': 1 }}>Copy</p>
</section>
```
Attributes: `data-sv` (track) · `data-sv-once` · `data-sv-pin` ·
`data-sv-travel` · `data-sv-scenes="4"`. Route-change nodes are picked up
automatically (MutationObserver).

**React components** — when you need callbacks or the attribute API:
```tsx
<Reveal auto>…</Reveal>
<Reveal stagger={140}><Item order={0}>a</Item><Item order={1} effect="slide-l">b</Item></Reveal>
useTrack({ scenes: 4, onScene: setIndex })
```

**Vanilla** — `track(el, opts)` / `scan()` for non-React surfaces.

## 3 · Section-type → tool map

| Section | Tool |
| --- | --- |
| Hero / entrance | `<Reveal auto>` or `data-sv data-sv-once` + `sv-rise` children |
| Editorial with per-child control | `<Item order effect distance>` (compiles to the vars) |
| Continuous parallax | `<Parallax distance="8rem">` / `sv-drift` |
| Pinned storytelling | `<Scenes count={n}>` or `data-sv-scenes` + scene-slice CSS |
| Curtain / horizontal rail / card pile / reading / counter | presets: `sv-curtain-l/r`, `sv-rail`, `sv-deck`, `sv-reading`, `sv-counter` |
| Carousel / slider (any kind) | `<Slider perView gap arrows dots>` + `<Slide>` — **never Swiper**; vanilla: `slider(el)` |
| Logo strip / infinite band | `<Marquee>` (this is what Swiper loop usually wanted to be) |
| FAQ / accordion | `<Accordion group>` (native details, animated) |
| Modal / dialog | `<Modal>` (native dialog + sv-pop) |
| Scroll-scrubbed media | `onPin` + **frame sequence on canvas** (never `video.currentTime`) |
| 3D / WebGL | three.js as a consumer: `onScene`/`onTravel` drive the camera, render-on-demand |
| Ambient canvas (particles, generative) | `mountEffect` / `useCanvasEffect` — never a bare rAF loop |
| Pointer tilt | `usePointer()` + `sv-tilt` |
| Menus, modals, tabs, accordions (click states) | `data-sv-toggle`/`data-sv-target` (Boot wires it) + `sv-pop`; tabs = radios + `:has()` |
| Timed multi-act sequence (click or scroll-triggered) | `sv-acts` + clamp() slices per act |
| Deck that deals into the grid (triggered or scrubbed) | `sv-spread` (+ `.sv-spread-in` or map `--sv-spread`) |
| Rotating hero words | `sv-words` + `--sv-word: n` |
| Legacy browser contract | `import { compat } from 'scrollvars/compat'; compat()` once at boot |

## 3b · When NOT to use scrollvars (say this to the client too)

- Animation driven by **time**, not input — orchestrated intro timelines,
  elastic/bounce easings, SVG morphing → GSAP.
- **Spring physics** that must be interruptible with velocity, layout/shared-
  element transitions (`layoutId`), exit animations on unmount, free-drag
  gestures → Framer Motion.
- A simple play-on-load intro → CSS keyframes, no library at all.
- Known gaps in our own territory (escalate if a project hits them): nested
  scrollers, automatic pinning, declared Lenis interop, text splitting.
- Mixing engines in one project is acceptable for a rare case — that page
  loses the bundle argument, nothing else breaks.

## 4 · Non-negotiables (review checklist)

- [ ] No scroll values in React state — callbacks fire on integer change only
- [ ] Only `transform`/`translate`/`opacity` animated (never top/left/width)
- [ ] Radial/chained math uses the `transform:` **shorthand** (individual
      props apply in fixed order translate→rotate→scale)
- [ ] Continuous values never get CSS transitions — lag/inertia is an
      exponential lerp (`current += (target − current) × f`)
- [ ] One writer per scrolling surface (scroll-driven slider ⇒ inline
      `scroll-snap-type: none` + `overflow-x: hidden` on that instance)
- [ ] Page-level scroll-snap: `proximity` only, scoped regionally via
      `onLive` toggling a class on `<html>` — never global `mandatory`
- [ ] No `mask-image`/`backdrop-filter` over content that moves every frame
- [ ] Camera-path/pinned worlds: promoted layers stay **paint-sparse**;
      scenery goes on a viewport-sized canvas
- [ ] Custom entrance CSS hides content only under `html.sv-on`

## 5 · Browser support (tell the client)

| Browser | Fully animated |
| --- | --- |
| Chrome / Edge | 104+ (Aug 2022) |
| Firefox | 74+ (Mar 2020) — `sv-counter` 128+ |
| Safari / iOS | 14.1+ (Apr 2021) — `sv-counter` 16.4+ |
| With `compat()` + downleveled build | ~Chrome 61 / FF 60 / Safari 11 |
| Anything older / no JS | complete page, static — nothing breaks |

## 6 · Definition of done for a client page

- [ ] `prefers-reduced-motion` pass: page fully readable, no pinned traps
- [ ] JS disabled: page renders complete and static (the `sv-on` guard)
- [ ] No horizontal overflow on mobile — `overflow-x: clip` on **both**
      `html` and `body` (iOS ignores it on body alone)
- [ ] Old-device spot check (a pre-2018 laptop or mid-range Android):
      pinned sections stay fluid end to end
- [ ] Keyboard: sliders focusable and arrow-navigable (built in — verify
      nothing swallowed focus)
- [ ] Lighthouse: no layout shifts introduced by entrances (content reserves
      its space; only transform/opacity move)
