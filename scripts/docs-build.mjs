#!/usr/bin/env node
/**
 * Builds demo/docs/index.html — the human-facing reference (llms.txt stays
 * the machine-facing one). Content lives here; changelog + version are read
 * from the repo so the page can never drift from the release.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'demo', 'docs')
mkdirSync(out, { recursive: true })
const VERSION = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version

/* CHANGELOG.md → minimal HTML (headers, bullets, inline code, bold) */
const mdLite = (md) =>
  md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# .+$/gm, '')
    .replace(/^([A-Z][^\n<]*:)$/gm, '<p class="grp">$1</p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?)(?=\n(?!<li>|\s)|$)/g, '$1')
    .replace(/(?:^|\n)(<li>[\s\S]*?<\/li>)(?=\n(?!<li>))/g, '\n<ul>$1</ul>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
const changelogHtml = mdLite(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'))

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ScrollVars docs — the human reference</title>
<meta property="og:image" content="https://scrollvars.dev/media/og.png">
<meta name="description" content="Quickstart, the six variables, every export, coming-from-GSAP mapping, accessibility contract, troubleshooting, changelog.">
<style>
  * { box-sizing: border-box; margin: 0; }
  :root { --ink:#121118; --line:rgba(230,228,240,.09); --text:#e6e4f0; --muted:#8f8ca6;
    --accent:#a78bfa; --mono:ui-monospace,"SF Mono",Menlo,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  body { background:var(--ink); color:var(--text); font:16px/1.65 var(--sans); }
  a { color: var(--accent); }
  header { position:sticky; top:0; z-index:9; display:flex; justify-content:space-between;
    align-items:center; padding:0 24px; height:56px; background:rgba(18,17,24,.9);
    backdrop-filter:blur(10px); border-bottom:1px solid var(--line); font-size:14px; }
  header .v { color:var(--muted); font:600 12px var(--mono); }
  main { max-width: 880px; margin: 0 auto; padding: 40px 24px 100px; }
  h1 { font-size: 30px; margin: 10px 0 6px; }
  h2 { font-size: 21px; margin: 44px 0 10px; padding-top: 18px; border-top: 1px solid var(--line); }
  h3 { font-size: 16px; margin: 22px 0 8px; }
  p, li { color: #cfcbe4; } p.lead { color: var(--muted); }
  p.grp { font: 600 12px var(--mono); text-transform: uppercase; letter-spacing: .12em;
    color: var(--muted); margin-top: 14px; }
  code { font: 13px var(--mono); background:#1b1a24; padding: 1px 5px; border-radius: 5px; }
  pre { background:#17151f; border:1px solid var(--line); border-radius:12px; padding:16px;
    overflow-x:auto; font:13px/1.6 var(--mono); margin: 12px 0; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; margin: 12px 0; }
  th, td { text-align: left; padding: 7px 12px 7px 0; border-bottom: 1px solid var(--line);
    vertical-align: top; }
  th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase;
    letter-spacing: .08em; }
  ul { padding-left: 20px; margin: 8px 0; }
  .toc { display:flex; flex-wrap:wrap; gap:8px 16px; margin:16px 0 0; font-size:14px; }
</style>
</head><body>
<header><div><a href="../" style="text-decoration:none"><b style="color:var(--text)">ScrollVars</b></a> <span style="color:var(--muted)">/ docs</span></div>
<div><span class="v">v${VERSION}</span> &nbsp;·&nbsp; <a href="../">demo</a> · <a href="../fx/">fx</a> · <a href="../bench/">bench</a> · <a href="../llms.txt">llms.txt</a> · <a href="https://github.com/aduptive/scrollvars">GitHub</a></div></header>
<main>
<h1>The human reference</h1>
<p class="lead">One rAF in, CSS variables out. This page is for people; AIs get
<a href="../llms.txt">llms.txt</a>. Live patterns: <a href="../">the demo</a> (view-source is
the spec) and <a href="../fx/">the fx gallery</a> (copy-paste, three formats each).</p>
<nav class="toc">
<a href="#quickstart">Quickstart</a> <a href="#vars">The six variables</a>
<a href="#exports">Every export</a> <a href="#presets">Preset vocabulary</a>
<a href="#knobs">One knob, four ways</a>
<a href="#gsap">Coming from GSAP</a> <a href="#not">When NOT to use it</a>
<a href="#browsers">Browser support</a>
<a href="#interop">Interop</a> <a href="#a11y">Accessibility contract</a>
<a href="#trouble">Troubleshooting</a> <a href="#changelog">Changelog</a>
</nav>

<h2 id="quickstart">Quickstart</h2>
<pre><code>npm i scrollvars            # or pin: npm i github:aduptive/scrollvars</code></pre>
<p><b>Next.js (zero-wrapper, recommended):</b> one boot in the root layout, then plain
server components with data attributes.</p>
<pre><code>// app/layout.tsx
import 'scrollvars/styles/core.css'          // or styles.css for everything
import { ScrollVarsBoot } from 'scrollvars/react'
// &lt;ScrollVarsBoot /&gt; once inside &lt;body&gt;

// any page — no client components needed:
&lt;section data-sv data-sv-once&gt;
  &lt;h2 className="sv-rise"&gt;Title&lt;/h2&gt;
  &lt;p className="sv-rise" data-sv-order="1"&gt;Copy&lt;/p&gt;
&lt;/section&gt;</code></pre>
<p>Per-element knobs are attributes too: <code>data-sv-order</code>,
<code>data-sv-distance</code>, <code>data-sv-from</code>/<code>data-sv-to</code> become the
matching CSS variables on mount — no style attribute, safe for mapped CMS content, zero
global CSS. (React props on <code>&lt;Item&gt;</code>/<code>&lt;Reveal&gt;</code> compile the
same way; <code>sv-stagger</code> on a parent needs no per-child anything.)</p>
<p><b>Vanilla:</b> <code>import { scan } from 'scrollvars'; scan()</code> — same attributes.
<b>React components:</b> <code>&lt;Reveal auto&gt;</code>, <code>&lt;Track pin&gt;</code>,
<code>&lt;Scenes count={4}&gt;</code> when you want props instead of attributes.</p>

<h2 id="vars">The six variables (the entire API surface)</h2>
<table>
<tr><th>name</th><th>range</th><th>meaning</th></tr>
<tr><td><code>--sv-view</code></td><td>−1 → 1</td><td>signed position vs the live band (0 while inside)</td></tr>
<tr><td><code>--sv-t</code></td><td>0 → 1</td><td>travel through the viewport (native <code>view()</code> semantics)</td></tr>
<tr><td><code>--sv-pin</code></td><td>0 → 1</td><td>progress across a pinned (sticky) stretch</td></tr>
<tr><td><code>--sv-scene</code></td><td>0 → n−1</td><td>eased, snapped scene index of a pinned section</td></tr>
<tr><td><code>--sv-r</code></td><td>0 → 1</td><td>per-child slice of the clock (sv-range choreography)</td></tr>
<tr><td><code>--mx</code> / <code>--my</code></td><td>−1 → 1</td><td>pointer offset from an element's center</td></tr>
</table>
<p>Plus the class <code>.sv-live</code> (inside the band; enter/exit lines default 75%/25%,
tunable per element via <code>enter</code>/<code>exit</code> or
<code>data-sv-enter</code>/<code>data-sv-exit</code>) and the no-JS guard: hiding styles apply
only under <code>html.sv-on</code>, so without JavaScript the page renders complete.</p>

<h2 id="knobs">One knob, four ways (de/para)</h2>
<p>Same result — a child rising second, 3rem of travel — pick the authoring style
that fits the context. You never need the style attribute unless the value is
computed in JS at runtime:</p>
<table>
<tr><th>context</th><th>before (works, but…)</th><th>after (preferred)</th></tr>
<tr><td>HTML / CMS / RSC</td>
<td><code>&lt;p class="sv-rise" style="--sv-order: 1; --sv-distance: 3rem"&gt;</code></td>
<td><code>&lt;p class="sv-rise" data-sv-order="1" data-sv-distance="3rem"&gt;</code></td></tr>
<tr><td>React</td>
<td><code>&lt;p className="sv-rise" style={{ '--sv-order': 1 }}&gt;</code></td>
<td><code>&lt;Item order={1} distance="3rem"&gt;…&lt;/Item&gt;</code></td></tr>
<tr><td>Tailwind, static value</td>
<td><code>&lt;p class="sv-rise" style="--sv-order: 1"&gt;</code></td>
<td><code>&lt;p class="sv-rise [--sv-order:1]"&gt;</code></td></tr>
<tr><td>Sequential list</td>
<td>an order per child, by hand</td>
<td><code>&lt;div class="sv-stagger"&gt;</code> on the parent — nth-child does it, zero per-child anything</td></tr>
<tr><td>Mapped data (CMS loop)</td>
<td><code>style={{ '--sv-order': i }}</code></td>
<td><code>data-sv-order={i}</code> — attributes interpolate; Tailwind classes don't (the JIT scans statically)</td></tr>
<tr><td>sv-range slices</td>
<td><code>style="--sv-from: .3; --sv-to: .7"</code></td>
<td><code>data-sv-from=".3" data-sv-to=".7"</code></td></tr>
</table>
<p>The attributes (<code>data-sv-order</code>, <code>data-sv-distance</code>,
<code>data-sv-from</code>, <code>data-sv-to</code>) are written once as the matching CSS
variable on mount by <code>scan()</code>/<code>&lt;ScrollVarsBoot /&gt;</code> — never in the
frame loop, zero global CSS. When typed CSS <code>attr()</code> settles cross-browser this
mapping becomes pure CSS.</p>

<h2 id="exports">Every export</h2>
<p class="grp">scrollvars (vanilla core)</p>
<table>
<tr><td><code>track(el, opts?)</code></td><td>drive one element; opts: <code>view/travel/pin/scenes/snap/once/root/enter/exit</code> + <code>onLive/onScene/onTravel/onPin</code>. Returns untrack.</td></tr>
<tr><td><code>scan(root?)</code></td><td>zero-wrapper mode: tracks every <code>[data-sv]</code>, MutationObserver keeps route changes covered.</td></tr>
<tr><td><code>slider(el, opts?)</code></td><td>featherweight carousel on native scroll+snap; returns <code>next/prev/goTo/seek/active/state/destroy</code>.</td></tr>
<tr><td><code>toggles(root?)</code></td><td>click states: <code>data-sv-toggle</code>/<code>data-sv-target</code> → class + <code>--sv-state</code> + aria-expanded.</td></tr>
<tr><td><code>trackPointer(el, opts?)</code></td><td>pointer module: writes <code>--mx/--my</code> on <code>.sv-tilt</code> matches.</td></tr>
<tr><td><code>scrollToScene(el, i, n, smooth?)</code></td><td>scroll the window to scene i of a pinned section.</td></tr>
<tr><td><code>split(el, { by })</code> / <code>splitParts</code></td><td>SplitText-lite: word/char spans with <code>--sv-order</code> + <code>--sv-count</code>, aria-safe, restorable — also zero-wrapper via <code>data-sv-split</code>.</td></tr>
<tr><td><code>mapRange(t, from, to, ease?)</code></td><td>JS twin of sv-range for <code>onTravel/onPin</code> consumers.</td></tr>
<tr><td><code>clamp / snapProgress / easeOutCubic / refresh / prefersReducedMotion</code></td><td>utilities.</td></tr>
</table>
<p class="grp">scrollvars/react ('use client' wrappers — children stay RSC)</p>
<table>
<tr><td><code>&lt;ScrollVarsBoot /&gt;</code></td><td>mounts <code>scan()</code> + <code>toggles()</code> once.</td></tr>
<tr><td><code>&lt;Track&gt; &lt;Reveal&gt; &lt;Parallax&gt; &lt;Item&gt; &lt;Scenes&gt; &lt;Split&gt;</code></td><td>attribute API — <code>order/distance/stagger/duration/ease</code> props compile to the vars.</td></tr>
<tr><td><code>&lt;Slider&gt; &lt;Slide&gt; &lt;Marquee&gt; &lt;Accordion&gt; &lt;Modal&gt;</code></td><td>the component kit (see the accessibility contract below).</td></tr>
<tr><td><code>useTrack / useScenes / useSlider / usePointer / useCanvasEffect</code></td><td>hooks under the components.</td></tr>
</table>
<p class="grp">scrollvars/canvas · scrollvars/compat</p>
<p><code>mountEffect(canvas, effect)</code> — lifecycle harness for ambient canvas scenes
(DPR cap, delta-time loop, auto-pause offscreen/hidden, reduced-motion flag).
<code>scrollvars/compat</code> — opt-in legacy floor (~Chrome 61/FF 60/Safari 11): RO/IO stubs +
transform-fallback CSS.</p>

<h2 id="presets">Preset vocabulary</h2>
<p>Each name is a class; live previews with copy-paste code in
<a href="../fx/">the fx gallery</a>. Import only the parts a page uses
(<code>styles/core.css</code> 1.2&nbsp;KB gz · pin 1.3 · slider 0.4 · tilt 0.5 · ui).</p>
<table>
<tr><th>part</th><th>classes</th></tr>
<tr><td>core (entrances)</td><td><code>sv-rise sv-fade sv-slide-l sv-slide-r sv-auto sv-stagger sv-skip sv-split sv-split-rise sv-drift sv-spread sv-spread-in sv-view-fade sv-view-rise</code></td></tr>
<tr><td>pin (scrub)</td><td><code>sv-curtain-l sv-curtain-r sv-rail sv-deck sv-reading sv-counter sv-range sv-range-rise sv-acts</code></td></tr>
<tr><td>slider</td><td><code>sv-slider sv-cols sv-active sv-arrow sv-dots sv-dot sv-pause</code> + <code>--sd</code> per slide</td></tr>
<tr><td>state / ui</td><td><code>sv-open sv-pop sv-words sv-marquee sv-accordion sv-tilt</code></td></tr>
</table>

<h2 id="gsap">Coming from GSAP + ScrollTrigger</h2>
<table>
<tr><th>you write in GSAP</th><th>here</th><th>notes</th></tr>
<tr><td><code>scrollTrigger: { trigger, scrub }</code></td><td><code>data-sv-travel</code> → style with <code>--sv-t</code></td><td>CSS consumes the var; no tween object</td></tr>
<tr><td><code>pin: true</code></td><td>tall wrapper + <code>position: sticky</code> + <code>data-sv-pin</code></td><td>the sticky skeleton is yours (explicit, SSR-safe)</td></tr>
<tr><td><code>start/end: 'top 80%'</code></td><td><code>enter</code>/<code>exit</code> options (fractions)</td><td>band lines, not arbitrary expressions</td></tr>
<tr><td><code>tl.to(a).to(b, '-=.2')</code> scrubbed</td><td><code>sv-range</code>: <code>--sv-from/--sv-to</code> per child</td><td>overlapping slices = the choreography</td></tr>
<tr><td><code>ScrollTrigger.batch()</code> reveals</td><td><code>sv-auto</code> / <code>sv-stagger</code></td><td>nth-child order for free</td></tr>
<tr><td><code>scroller: el</code></td><td><code>root: el</code></td><td>nested scroll panels</td></tr>
<tr><td><code>onUpdate(self.progress)</code></td><td><code>onTravel</code>/<code>onPin</code> callbacks</td><td>canvas, WebGL, video scrub</td></tr>
<tr><td>timelines with springs/exits/SVG morph</td><td><b>keep GSAP</b></td><td>time-driven work is out of scope here — honestly</td></tr>
</table>

<h2 id="not">When NOT to use ScrollVars</h2>
<ul>
<li><b>Time-driven orchestration</b> — interruptible springs, layout/exit transitions, SVG
morphing, choreographed intros on a clock: GSAP or Motion are the right tools.</li>
<li><b>One load-in animation</b> — plain CSS keyframes; no library at all.</li>
<li><b>App-like gesture physics</b> (drag with momentum between arbitrary states) — Motion.</li>
<li>Chromium-only projects that can require the native tier — pure CSS scroll-driven
animations, no JS; ScrollVars' <code>sv-view-*</code> tier is exactly that where supported.</li>
</ul>

<h2 id="interop">Interop: ScrollVars alongside GSAP on one page</h2>
<p>They don't conflict — different writers on different properties. Keep each element owned by
exactly one engine. GSAP can also <i>consume</i> the vars for the rare mixed case:</p>
<pre><code>// GSAP reading ScrollVars' clock (no second scroll listener):
gsap.ticker.add(() =&gt; {
  const t = parseFloat(getComputedStyle(section).getPropertyValue('--sv-t')) || 0
  heavyTimeline.progress(t)   // ScrollVars steers, GSAP renders
})</code></pre>
<p>The page pays GSAP's bundle then — do it for the page that needs it, not globally.
Both patterns exist as official fx recipes with live previews:
<a href="../fx/gsap-scrub.html">GSAP timeline under scrub</a> (author in time-space, consume as
a scrub — still input-driven) and <a href="../fx/three-scene.html">Three.js scene on the pin</a>
(the canvas harness with <code>context: null</code> owns the lifecycle, Three owns the WebGL,
scroll feeds progress). Hitting the scope ceiling never means rewriting: the driver stays, you
plug in what's missing.</p>

<h2 id="a11y">Accessibility contract</h2>
<table>
<tr><th>surface</th><th>guarantees</th></tr>
<tr><td>every preset</td><td>hiding gated on <code>html.sv-on</code> (no-JS = fully visible); complete <code>prefers-reduced-motion</code> blocks — entrances render final state, scrub presets settle at end state, deck lays out in flow</td></tr>
<tr><td>Slider</td><td>APG carousel: <code>role=region</code> + <code>aria-roledescription=carousel</code> + <code>label</code> prop; slides annotated "i of n"; arrows/dots labeled; keyboard: arrows/Home/End on the focusable track, arrow keys inside form fields stay theirs; autoplay pauses on hover, keyboard focus, offscreen and hidden tab, renders a visible pause/resume control, track is <code>aria-live=polite</code> when not rotating; drag never steals plain clicks or focus</td></tr>
<tr><td>Marquee</td><td>duplicate copy <code>aria-hidden</code> + <code>inert</code>; pauses on hover and keyboard focus-within; reduced motion stops it</td></tr>
<tr><td>Modal / Accordion</td><td>native <code>&lt;dialog&gt;</code> / <code>&lt;details&gt;</code> — focus management, Escape, exclusivity from the platform</td></tr>
<tr><td>pinned scenes</td><td>native scroll is never hijacked — the driver only reads; snap is optional and never <code>mandatory</code> on pins</td></tr>
</table>

<h2 id="browsers">Browser support — and the answer for older ones</h2>
<table>
<tr><th>browser</th><th>fully animated</th><th>notes</th></tr>
<tr><td>Chrome / Edge</td><td><b>104+</b> (Aug 2022)</td><td>native zero-JS <code>sv-view-*</code> tier: 115+ · <code>sv-range</code> needs 112+ · Accordion height animation 129+</td></tr>
<tr><td>Firefox</td><td><b>74+</b> (Mar 2020)</td><td><code>sv-counter</code> 128+ · <code>sv-range</code> 112+</td></tr>
<tr><td>Safari / iOS</td><td><b>14.1+</b> (Apr 2021)</td><td><code>sv-counter</code> and <code>sv-range</code> 16.4+</td></tr>
<tr><td>anything older, or no JS</td><td>content 100% visible, static</td><td>the <code>html.sv-on</code> guard: hiding styles only apply after the driver boots</td></tr>
</table>
<p><b>The design rule that makes this table safe to sign off:</b> below the floor nothing
breaks — the page renders complete and static. Animation is progressive enhancement, never a
dependency. Presets that lean on newer CSS (<code>sv-range</code>, <code>sv-counter</code>)
degrade to their end state individually.</p>
<p><b>Older targets:</b> <code>scrollvars/compat</code>, opt-in. On modern browsers it runs
two feature checks and exits (free); on old ones it installs ResizeObserver/
IntersectionObserver stubs and a <code>transform:</code>-based fallback stylesheet written
without <code>:is()</code>/<code>clamp()</code>/<code>min()</code>. With your bundler
downleveling the ES2020 dist (Next.js already does), the core reveal/pin presets animate on
roughly <b>Chrome 61+ / Firefox 60+ / Safari 11+</b>:</p>
<pre><code>import { compat } from 'scrollvars/compat'
compat()   // once, before anything else</code></pre>

<h2 id="trouble">Troubleshooting</h2>
<table>
<tr><th>symptom</th><th>cause → fix</th></tr>
<tr><td>content hidden until first scroll</td><td>entrance CSS not gated on <code>.sv-on</code> — use the shipped presets or copy their guard pattern</td></tr>
<tr><td>Tailwind arbitrary class does nothing for mapped data</td><td>the JIT never generates interpolated class names — use <code>data-sv-order={i}</code> (or a style var) for dynamic values; static one-offs like <code>[--sv-order:1]</code> are fine</td></tr>
<tr><td>animation inside a modal/panel doesn't run</td><td>tracked element lives in a nested scroller — pass <code>root: scrollerEl</code> so geometry matches (the listener already hears it)</td></tr>
<tr><td>rotate/translate combo lands wrong</td><td>individual transform properties apply in fixed order (translate→rotate→scale) — radial math needs the <code>transform:</code> shorthand</td></tr>
<tr><td>parallax rubber-bands</td><td>never put a <code>transition</code> on a property driven by a continuous var — transitions are for state flips (<code>sv-live</code>), continuous motion is direct</td></tr>
<tr><td><code>--sv-r</code> stuck at end state</td><td>engine lacks calc() division by var (needs Chrome 112/Safari 16.4/FF 112) — expected degradation; keep consuming as <code>var(--sv-r, 1)</code></td></tr>
<tr><td>style-recalc heavy on giant sections</td><td>an inherited var pays per-descendant — keep tracked elements thin: big static content lives next to, not inside, the animated elements (measured curve on <a href="../bench/">/bench/</a>)</td></tr>
</table>

<h2 id="changelog">Changelog</h2>
${changelogHtml}
</main>
</body></html>`

writeFileSync(join(out, 'index.html'), page)
console.log(`docs built (v${VERSION})`)
