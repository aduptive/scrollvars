# ScrollVars

Scroll and pointer animations through CSS variables. Zero runtime dependencies,
with an optional React layer.

![Words appearing on scroll with ScrollVars](https://scrollvars.dev/media/readme.gif)

[Live demo](https://scrollvars.dev/) · [FX gallery](https://scrollvars.dev/fx/) ·
[Documentation](https://scrollvars.dev/docs/) · [Full guide](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md)

## Use it with your AI agent

```bash
npx scrollvars skill
```

Installs a skill built from AGENTS.md (the mental model, imports and
performance rules, pointing back to it) for Claude Code and Codex, matching
your installed version. `--global` for the user-level folders instead of
the current project.

## Install

```bash
npm i scrollvars
```

Use the React example below in a React project, or the HTML example with a
bundler such as Vite. Import the stylesheet once in your application entry.

<!-- react-imports:start -->
Isolated consumer bundles of ScrollVars 1.19.3, esbuild 0.25.12, browser ESM/ES2020; React external, CSS excluded. Counts the entry and all static shared chunks, excluding lazy debug chunks. Gzip level 9; bytes, not KB:

| React imports | minified bytes | gzip bytes |
| --- | ---: | ---: |
| `usePointer` | 3965 | 1830 |
| `ScrollVarsBoot` | 31208 | 10807 |
| `Slider, Slide` | 16280 | 6482 |

These are separate import fixtures, not additive route sizes or runtime benchmarks. Actual application savings depend on its import graph and bundler.
<!-- react-imports:end -->

## React: an entrance in a few lines

```tsx
'use client'

import { Reveal } from 'scrollvars/react'
import 'scrollvars/styles/core.css'

export function Intro() {
  return (
    <Reveal auto>
      <h2>A story worth scrolling for.</h2>
      <p>Your content, with a staggered entrance.</p>
    </Reveal>
  )
}
```

`auto` makes direct children rise in sequence. Change `stagger`, `duration`
and `distance` through props. Use `Item` for individual effects and order.

[React examples, hooks and lifecycle](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#react)

## Using only the slider

Import only the slider API and its stylesheet; a standalone carousel does not
need `ScrollVarsBoot` or the aggregate stylesheet:

```tsx
import { Slider, Slide } from 'scrollvars/react'
import 'scrollvars/styles/slider.css'
```

Use `useSlider` for your own React controls, or `import { slider } from
'scrollvars'` without React. With a tree-shaking bundler, these imports exclude
the scroll, pointer and canvas engines. Keep `cssVars` enabled for effects that
read the slider's variables; use `cssVars={false}` for a plain React carousel
that does not read them to skip those writes.

## HTML: mark the content you want to animate

```html
<section data-sv data-sv-once class="sv-auto">
  <h2>A story worth scrolling for.</h2>
  <p>Your content, with a staggered entrance.</p>
</section>
```

In your JavaScript entry, after the markup is available:

```js
import { scan } from 'scrollvars'
import 'scrollvars/styles/core.css'

const stop = scan()

// When your application disposes this page:
// stop()
```

For Next.js server components, add one `ScrollVarsBoot` to the root layout
and use the same data attributes in your sections.
[Boot, SSR and CSP details](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#react)

## How it works

One scroll driver measures tracked elements and writes CSS custom properties.
Your CSS reads those values to control the animation. Continuous scroll values
stay outside React state.

| Input | Output | Example |
| --- | --- | --- |
| Viewport travel | `--sv-t` | Reading progress, scrubbed effects |
| Pinned section | `--sv-pin` | Horizontal rail, curtain |
| Scene progression | `--sv-scene` | Pinned storytelling |
| Pointer position | `--mx`, `--my` | Tilt, glare |

Enable the outputs your effect needs: `travel`, `pin`, `scenes` or the pointer
module. The default `--sv-view` clock describes the live viewport band.
[All variables, presets and defaults](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#mental-model)

## Start with a complete section

The [FX gallery](https://scrollvars.dev/fx/) includes live previews and source
for heroes, timelines, rails and other effects. Install a Section into your project:

```bash
npx scrollvars add hero-cinematic
```

The CLI downloads source from the gallery registry. Sections ship as editable
React components. Other effects provide Tailwind, CSS and React examples. A
gallery component is copied into your project; it is not a `scrollvars/react`
export. Run `add` from your app's package root and use `--dir` for its component
folder. The guide below shows a Next.js `src/` and monorepo example.

[Gallery and CLI guide](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#the-fx-gallery-copy-paste-effects--shadcn-style-cli)

## What you can build

- Entrance reveals, staggered text and parallax.
- Sticky scenes, horizontal rails and scroll-driven sequences.
- Pointer tilt and glare.
- Carousels, marquees, accordions and modals through the React kit.
- Canvas and WebGL effects with a lifecycle harness.

Use GSAP or Framer Motion when you need complex time-based timelines, springs,
layout or exit transitions. ScrollVars can also drive an external timeline
through its progress callbacks.
[Choosing the right tool](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#when-to-use-what)

## Performance and accessibility

Scroll tracking shares one passive listener and one animation-frame driver,
with batched reads and writes. Slider, pointer and canvas have their own
schedulers. Import only the modules and styles your page uses.

Inherited CSS variables still cost style recalculation, especially on large
subtrees or when published on the document. ScrollVars does not win every
workload. The [benchmark](https://scrollvars.dev/bench/) reports total task time,
style recalculation and frame delivery, with versioned measurements and raw runs.

The shipped entrance presets stay visible without JavaScript and respect reduced
motion, except `sv-view-*`: those animate in without JS too, where the browser
supports `animation-timeline: view()`. Custom effects need their own motion guards. The kit provides native
dialog/details behavior and carousel controls, but your content and integration
still need accessibility testing.

[Measurements and tradeoffs](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#the-receipts-measured-why-the-design-holds-up) ·
[Bundle sizes](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#pay-for-what-you-use) ·
[Browser support](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#browser-support) ·
[Accessibility checklist](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#accessibility)

## Documentation

The npm package contains runtime modules, types, styles, the CLI and its offline
agent guidance. Full guides, release history and contributor docs live in the
repository; removing those files from npm does not change browser bundle size.

- [Full guide](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md): API examples, options, styling and lifecycle.
- [Online documentation](https://scrollvars.dev/docs/): browsable reference.
- [Integration guide](https://github.com/aduptive/scrollvars/blob/main/docs/integration.md): project setup and delivery checks.
- [Component kit](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#the-component-kit-react): Slider, Marquee, Accordion and Modal.
- [Canvas harness](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#canvas-effects-scrollvarscanvas): resize, DPR and pause lifecycle.
- [Scoped clocks](https://github.com/aduptive/scrollvars/blob/main/docs/guide.md#scoped-clocks-an-opt-in-for-deep-pages): opt-in tuning for deep DOM.
- [Changelog](https://github.com/aduptive/scrollvars/blob/main/CHANGELOG.md) and [contributing](https://github.com/aduptive/scrollvars/blob/main/CONTRIBUTING.md).
- [Agent guide](AGENTS.md) and [machine-readable docs](https://scrollvars.dev/llms.txt).

## License

[MIT](LICENSE)
