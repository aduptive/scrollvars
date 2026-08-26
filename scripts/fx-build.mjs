#!/usr/bin/env node
/**
 * Builds the /fx/ gallery: one page per effect + hub + llms.txt, all
 * generated from the EFFECTS array below. Adding an effect = add an entry,
 * run `npm run fx:build` (demo:deploy chains it). Shared assets:
 *   fx/sv.js  — the engine, IIFE bundle from dist (esbuild)
 *   fx/sv.css — the full preset stylesheet (copy of styles.css)
 */
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'demo', 'fx')
mkdirSync(out, { recursive: true })

/* ─────────────────────────── effects data ─────────────────────────── */

const EFFECTS = [
  {
    slug: 'staggered-reveal',
    category: 'Reveals',
    title: 'Staggered reveal',
    tagline: 'Children rise in sequence when the section enters the viewport.',
    when: 'Heroes, editorial sections, any "content arrives" moment.',
    knobs: '--sv-distance (travel), --sv-stagger (delay step), --sv-duration, --sv-ease',
    runway: true,
    preview: `<section data-sv class="fxstage">
  <h3 class="sv-rise fxh">The headline</h3>
  <p class="sv-rise fxp" style="--sv-order: 1">Rises second.</p>
  <p class="sv-rise fxp" style="--sv-order: 2">Rises third.</p>
</section>`,
    css: `<section data-sv>            <!-- tracked; gets .sv-live in the band -->
  <h2 class="sv-rise">Title</h2>
  <p class="sv-rise" style="--sv-order: 1">Copy</p>
</section>

/* needs styles/core.css (or paste the preset): */
.sv-on .sv .sv-rise { opacity: 0; translate: 0 var(--sv-distance, 6rem);
  transition: opacity .8s var(--sv-ease), translate .8s var(--sv-ease);
  transition-delay: calc(var(--sv-order, 0) * var(--sv-stagger, 90ms)); }
.sv-on .sv.sv-live .sv-rise { opacity: 1; translate: 0 0; }`,
    tailwind: `<section data-sv data-sv-once class="py-24">
  <h2 class="sv-rise text-4xl font-bold">Title</h2>
  <p class="sv-rise [--sv-order:1]">Copy</p>
  <p class="sv-rise [--sv-order:2] [--sv-distance:3rem]">More</p>
</section>
<!-- once: import 'scrollvars/styles/core.css' + <ScrollVarsBoot /> in the layout -->
<!-- arbitrary classes are for static one-offs. Mapped content: use
     style={{'--sv-order': i}} (the JIT can't see dynamic class names).
     Sequential lists: add sv-stagger to the parent, drop per-child order. -->`,
    react: `<Reveal auto>            {/* every direct child, stagger for free */}
  <h2>Title</h2>
  <p>Copy</p>
</Reveal>

// or per-child knobs as props:
<Reveal stagger={140}>
  <Item order={0}>first</Item>
  <Item order={1} effect="slide-l" distance="4rem">second</Item>
</Reveal>`,
  },
  {
    slug: 'deck-spread',
    category: 'Reveals',
    title: 'Deck spread',
    tagline: 'A centered card deck deals itself into the grid — on arrival or scrubbed.',
    when: 'Feature cards, pricing tiers, portfolio grids that deserve an entrance.',
    knobs: '--sv-mid = (N−1)/2, --sv-order per card, --sv-gap; map --sv-spread yourself to scrub',
    runway: true,
    preview: `<section data-sv class="fxstage">
  <div class="sv-spread sv-spread-in" style="--sv-gap: 14px">
    <div class="fxcard" style="--sv-order: 0">01</div>
    <div class="fxcard" style="--sv-order: 1">02</div>
    <div class="fxcard" style="--sv-order: 2">03</div>
  </div>
</section>`,
    css: `<section data-sv>
  <div class="sv-spread sv-spread-in">
    <div style="--sv-order: 0">…</div>
    <div style="--sv-order: 1">…</div>
    <div style="--sv-order: 2">…</div>
  </div>
</section>

/* styles/core.css ships it; the math, if you want it inline: */
.sv-spread { display: flex; gap: var(--sv-gap, 16px); justify-content: center; }
.sv-spread > * { --sv-d: calc(var(--sv-order, 0) - var(--sv-mid, 1));
  translate: calc(var(--sv-d) * (var(--sv-spread, 0) - 1) * (100% + var(--sv-gap, 16px))) 0;
  rotate: calc(var(--sv-d) * (1 - var(--sv-spread, 0)) * -5deg); }

/* scrub instead of play: */
.mine > * { --sv-spread: clamp(0, calc(var(--sv-t) * 2), 1); }`,
    tailwind: `<section data-sv class="py-24">
  <div class="sv-spread sv-spread-in [--sv-gap:14px]">
    <div class="[--sv-order:0] rounded-xl border p-8">01</div>
    <div class="[--sv-order:1] rounded-xl border p-8">02</div>
    <div class="[--sv-order:2] rounded-xl border p-8">03</div>
  </div>
</section>`,
    react: `<Track>
  <div className="sv-spread sv-spread-in">
    {cards.map((c, i) => (
      <Item key={c.id} order={i}><Card {...c} /></Item>
    ))}
  </div>
</Track>
{/* Item carries the vars as props — no style attr; sv-spread targets
   direct children, and the Item wrapper IS the direct child. */}`,
  },
  {
    slug: 'curtain',
    category: 'Pinned scenes',
    title: 'Curtain',
    tagline: 'Two panels slide apart as you scroll through a pinned stretch.',
    when: 'Chapter breaks, big reveals, section transitions.',
    knobs: 'outer height = scroll length; panel content/colors are yours',
    preview: `<div data-sv data-sv-pin class="fxouter">
  <div class="fxsticky">
    <div class="fxreveal">revealed</div>
    <div class="fxpanel sv-curtain-l">scroll</div>
    <div class="fxpanel sv-curtain-r" style="left:50%">vars</div>
  </div>
</div>`,
    css: `<div data-sv data-sv-pin class="outer">   <!-- height: 250vh -->
  <div class="sticky">                        <!-- sticky; top:0; h:100vh; overflow:hidden -->
    <div class="revealed-content">…</div>
    <div class="panel-left sv-curtain-l">…</div>
    <div class="panel-right sv-curtain-r">…</div>
  </div>
</div>

/* the preset (styles/pin.css): */
.sv .sv-curtain-l { translate: calc(var(--sv-pin, 0) * -101%) 0; }
.sv .sv-curtain-r { translate: calc(var(--sv-pin, 0) * 101%) 0; }`,
    tailwind: `<div data-sv data-sv-pin class="relative h-[250vh]">
  <div class="sticky top-0 h-screen overflow-hidden">
    <div class="grid h-full place-items-center">revealed content</div>
    <div class="sv-curtain-l absolute inset-y-0 left-0 w-1/2 bg-zinc-900"></div>
    <div class="sv-curtain-r absolute inset-y-0 right-0 w-1/2 bg-zinc-900"></div>
  </div>
</div>`,
    react: `<Track pin className="relative h-[250vh]">
  <div className="sticky top-0 h-screen overflow-hidden">
    <Revealed />
    <div className="sv-curtain-l …" />
    <div className="sv-curtain-r …" />
  </div>
</Track>`,
  },
  {
    slug: 'horizontal-rail',
    category: 'Pinned scenes',
    title: 'Horizontal rail',
    tagline: 'Vertical scroll travels a horizontal track through a pinned stage.',
    when: 'Process steps, timelines, galleries that read left-to-right.',
    knobs: 'outer height = scroll length; works at any viewport width (min() keeps it moving)',
    preview: `<div data-sv data-sv-pin class="fxouter">
  <div class="fxsticky" style="display:flex;align-items:center">
    <div class="sv-rail" style="display:flex;gap:14px;padding:0 8vw">
      <div class="fxcard">01</div><div class="fxcard">02</div><div class="fxcard">03</div>
      <div class="fxcard">04</div><div class="fxcard">05</div>
    </div>
  </div>
</div>`,
    css: `<div data-sv data-sv-pin class="outer">   <!-- height: 300vh -->
  <div class="sticky">                        <!-- sticky stage, flex center -->
    <div class="sv-rail">…cards…</div>
  </div>
</div>

/* the preset (styles/pin.css): */
.sv .sv-rail { width: max-content;
  translate: calc((1 - var(--sv-pin, 0)) * 100vw + var(--sv-pin, 0) * min(100vw - 100%, 0px)) 0; }`,
    tailwind: `<div data-sv data-sv-pin class="relative h-[300vh]">
  <div class="sticky top-0 flex h-screen items-center overflow-hidden">
    <div class="sv-rail flex gap-4 px-[10vw]">
      {cards.map(c => <Card key={c.id} class="w-80 shrink-0" />)}
    </div>
  </div>
</div>`,
    react: `<Track pin className="relative h-[300vh]">
  <div className="sticky top-0 flex h-screen items-center overflow-hidden">
    <div className="sv-rail flex gap-4 px-[10vw]">{cards}</div>
  </div>
</Track>`,
  },
  {
    slug: 'sequenced-scrub',
    category: 'Pinned scenes',
    title: 'Sequenced scrub',
    tagline: 'Each child animates over its own slice of the pin — choreography without a timeline.',
    when: 'Pinned stories where A plays over 0–40%, B over 30–70%, C over 60–100%.',
    knobs: '--sv-from / --sv-to per child (slice of the clock), --sv-distance; override --sv-clock to pick the clock',
    preview: `<div data-sv data-sv-pin class="fxouter">
  <div class="fxsticky" style="display:grid;place-items:center">
    <div class="sv-range sv-range-rise" style="display:grid;gap:12px;text-align:center">
      <h3 class="fxh" style="--sv-from:0; --sv-to:.4">First this</h3>
      <p class="fxp" style="--sv-from:.3; --sv-to:.7">then this</p>
      <p class="fxp fxaccent" style="--sv-from:.6; --sv-to:1">then this</p>
    </div>
  </div>
</div>`,
    css: `<div data-sv data-sv-pin class="outer">   <!-- height: 250vh -->
  <div class="sticky">
    <div class="sv-range sv-range-rise">
      <h2 style="--sv-from: 0; --sv-to: .4">First</h2>
      <p style="--sv-from: .3; --sv-to: .7">Second</p>
      <p style="--sv-from: .6; --sv-to: 1">Third</p>
    </div>
  </div>
</div>

/* styles/pin.css ships it; the mechanism, if you want it inline: */
.sv .sv-range > * {
  --sv-clock: var(--sv-pin, var(--sv-t, 0));
  --sv-r: clamp(0, calc((var(--sv-clock) - var(--sv-from, 0)) /
                        (var(--sv-to, 1) - var(--sv-from, 0))), 1);
}
/* consume --sv-r however you like — ALWAYS with a fallback of 1: */
.mine > * { opacity: var(--sv-r, 1); scale: calc(.8 + var(--sv-r, 1) * .2); }`,
    tailwind: `<div data-sv data-sv-pin class="relative h-[250vh]">
  <div class="sticky top-0 grid h-screen place-items-center">
    <div class="sv-range sv-range-rise grid gap-3">
      <h2 class="[--sv-from:0] [--sv-to:.4] text-4xl font-bold">First</h2>
      <p class="[--sv-from:.3] [--sv-to:.7]">Second</p>
      <p class="[--sv-from:.6] [--sv-to:1]">Third</p>
    </div>
  </div>
</div>
<!-- needs calc() division by var: Chrome 112 / Safari 16.4 / FF 112.
     Older engines settle at the end state (consume as var(--sv-r, 1)). -->`,
    react: `<Track pin className="relative h-[250vh]">
  <div className="sticky top-0 grid h-screen place-items-center">
    <div className="sv-range sv-range-rise grid gap-3">
      {steps.map((s, i, all) => (
        <Step key={s.id} style={{ '--sv-from': i / all.length, '--sv-to': (i + 1.6) / all.length }} {...s} />
      ))}
    </div>
  </div>
</Track>

// JS twin for canvas/WebGL consumers:
// track(el, { pin: true, onPin: (p) => uniform.set(mapRange(p, 0.3, 0.7)) })`,
  },
  {
    slug: 'rotating-words',
    category: 'Text',
    title: 'Rotating words',
    tagline: 'One word exits up, the next rises from below — a clipped column on one variable.',
    when: 'Hero headlines: "We build ______".',
    knobs: '--sv-word (index), --sv-duration; drive it from state, scenes or an interval',
    preview: `<section data-sv class="fxstage">
  <h3 class="fxh">we build <b class="sv-words fxaccent" id="fxwords"><span>brands</span><span>websites</span><span>products</span></b></h3>
</section>
<script>let fxi=0;setInterval(()=>{document.getElementById('fxwords').style.setProperty('--sv-word',(fxi=(fxi+1)%3))},1800)</script>`,
    css: `<h1>we build
  <span class="sv-words">
    <span>brands</span><span>websites</span><span>products</span>
  </span>
</h1>

/* the preset (styles/state.css): */
.sv-words { display: inline-flex; flex-direction: column;
  vertical-align: bottom; height: 1.15em; overflow: hidden; }
.sv-words > * { display: block; height: 1.15em; line-height: 1.15;
  translate: 0 calc(var(--sv-word, 0) * -1.15em);
  transition: translate .65s var(--sv-ease, cubic-bezier(.28,.84,.42,1)); }

// drive it (state, scenes, or a timer):
el.style.setProperty('--sv-word', nextIndex)`,
    tailwind: `<h1 class="text-5xl font-extrabold">
  we build
  <span class="sv-words text-violet-400">
    <span>brands</span><span>websites</span><span>products</span>
  </span>
</h1>
<!-- set --sv-word from your state; scenes drive it for free in pinned stories -->`,
    react: `const [word, setWord] = useState(0)
<h1>we build{' '}
  <span className="sv-words" style={{ '--sv-word': word }}>
    {words.map(w => <span key={w}>{w}</span>)}
  </span>
</h1>`,
  },
  {
    slug: 'pointer-tilt',
    category: 'Pointer',
    title: 'Pointer tilt',
    tagline: 'Cards tilt toward the cursor with a moving glare — one delegated listener.',
    when: 'Product cards, team grids, anything that should feel physical.',
    knobs: 'tilt degrees and glare live in the preset — override .sv-tilt to taste',
    preview: `<section class="fxstage" id="fxtiltrow" style="display:flex;gap:16px;justify-content:center">
  <div class="sv-tilt fxcard">hover</div>
  <div class="sv-tilt fxcard">me</div>
</section>
<script>addEventListener('load',()=>SV.trackPointer(document.getElementById('fxtiltrow')))</script>`,
    css: `<div class="grid">          <!-- any container -->
  <div class="sv-tilt">…</div>
  <div class="sv-tilt">…</div>
</div>

<script type="module">
  import { trackPointer } from 'scrollvars'
  trackPointer(document.querySelector('.grid'))
</script>
/* preset in styles/tilt.css — tilt + glare from --mx/--my */`,
    tailwind: `<div ref={rowRef} class="grid grid-cols-3 gap-6">
  <div class="sv-tilt rounded-2xl border p-10">…</div>
</div>
<!-- tilt/glare read --mx/--my; restyle .sv-tilt::after for the glare -->`,
    react: `const ref = usePointer()
<div ref={ref} className="grid grid-cols-3 gap-6">
  {cards.map(c => <div key={c.id} className="sv-tilt">…</div>)}
</div>`,
  },
  {
    slug: 'coverflow-slider',
    category: 'Sliders',
    title: 'Coverflow slider',
    tagline: 'Native-scroll carousel; slides scale, fade and turn by their distance from center.',
    when: 'Anywhere you were about to install Swiper.',
    knobs: '--sd per slide (written by slider()); --sv-per-view breakpoints; chrome vars --sv-arrow-*/--sv-dot-*',
    preview: `<div class="fxstage">
  <div class="sv-slider" id="fxslider" style="padding:20px calc(50% - 110px)">
    <div class="fxcard fxslide">01</div><div class="fxcard fxslide">02</div>
    <div class="fxcard fxslide">03</div><div class="fxcard fxslide">04</div>
  </div>
</div>
<style>#fxslider{scrollbar-width:none}.fxslide{scale:calc(1 - min(max(var(--sd,0),-1*var(--sd,0))*.12,.3));opacity:calc(1 - min(max(var(--sd,0),-1*var(--sd,0))*.35,.7));transform:perspective(900px) rotateY(clamp(-24deg,calc(var(--sd,0)*-16deg),24deg))}</style>
<script>addEventListener('load',()=>SV.slider(document.getElementById('fxslider'),{duration:900}))</script>`,
    css: `<div class="sv-slider" id="cards">
  <div class="slide">…</div> ×N
</div>

<script type="module">
  import { slider } from 'scrollvars'
  slider(document.getElementById('cards'))
</script>

/* the coverflow is pure CSS on --sd: */
.slide { scale: calc(1 - min(abs(var(--sd, 0)) * 0.12, 0.3));
  opacity: calc(1 - abs(var(--sd, 0)) * 0.35);
  transform: perspective(900px) rotateY(calc(var(--sd, 0) * -16deg)); }`,
    tailwind: `<Slider perView={{ base: 1.2, md: 2.5, xl: 4 }} gap={16} arrows dots
  className="[--sv-arrow-bg:theme(colors.zinc.900/60)]">
  {cards.map(c => (
    <Slide key={c.id} className="[scale:calc(1-min(abs(var(--sd,0))*0.12,0.3))]">
      <Card {...c} />
    </Slide>
  ))}
</Slider>`,
    react: `<Slider perView={{ base: 1.2, md: 2.5, xl: 4 }} gap={16} arrows dots autoplay={5000}>
  {cards.map(c => <Slide key={c.id}><Card {...c} /></Slide>)}
</Slider>
// chrome: --sv-arrow-* / --sv-dot-* vars, prevIcon/nextIcon, renderDot, or your own UI via ref`,
  },
  {
    slug: 'marquee',
    category: 'Sliders',
    title: 'Marquee',
    tagline: 'An infinite strip — logos, taglines — that pauses on hover.',
    when: 'Logo walls, ticker bands. The honest replacement for Swiper loop.',
    knobs: '--sv-marquee-duration (one loop), --sv-gap; --sv-marquee-hover: running disables the pause',
    preview: `<div class="sv-marquee fxstage" style="padding:28px 0">
  <div class="sv-marquee-track fxmarq">
    <span>scrollvars</span><span>·</span><span>one rAF in</span><span>·</span>
    <span>CSS variables out</span><span>·</span>
    <span aria-hidden="true" style="display:contents"><span>scrollvars</span><span>·</span><span>one rAF in</span><span>·</span><span>CSS variables out</span><span>·</span></span>
  </div>
</div>`,
    css: `<div class="sv-marquee">
  <div class="sv-marquee-track">
    …content… …content again (aria-hidden)…
  </div>
</div>

/* the preset (styles/ui.css): */
.sv-marquee { overflow: hidden; display: flex; }
.sv-marquee-track { display: flex; gap: var(--sv-gap, 48px); width: max-content;
  padding-right: var(--sv-gap, 48px);
  animation: sv-marquee var(--sv-marquee-duration, 30s) linear infinite; }
.sv-marquee:hover .sv-marquee-track { animation-play-state: paused; }
@keyframes sv-marquee { to { translate: -50% 0; } }`,
    tailwind: `<div class="sv-marquee [--sv-marquee-duration:24s] [--sv-gap:64px] py-8">
  <div class="sv-marquee-track">
    {logos}{/* duplicate once, aria-hidden */}
  </div>
</div>`,
    react: `<Marquee speed={24}>
  {logos.map(l => <img key={l.id} src={l.src} alt={l.name} className="h-8" />)}
</Marquee>`,
  },
]

/* ─────────────────────────── shared assets ─────────────────────────── */

execSync(
  `npx esbuild ${join(root, 'dist/index.js')} --bundle --minify --format=iife --global-name=SV --outfile=${join(out, 'sv.js')}`,
  { stdio: 'pipe' }
)
// boot: track every [data-sv] on fx pages
writeFileSync(join(out, 'sv.js'), readFileSync(join(out, 'sv.js'), 'utf8') + '\nSV.scan();\n')
copyFileSync(join(root, 'styles.css'), join(out, 'sv.css'))

/* ─────────────────────────── templates ─────────────────────────── */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SHELL_CSS = `
  * { box-sizing: border-box; margin: 0; }
  :root { --ink:#121118; --surface:#1b1a24; --line:rgba(230,228,240,.09);
    --text:#e6e4f0; --muted:#8f8ca6; --accent:#a78bfa;
    --mono:ui-monospace,"SF Mono",Menlo,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  body { background:var(--ink); color:var(--text); font:16px/1.6 var(--sans); }
  a { color: var(--accent); }
  header.fx { position:fixed; top:0; left:0; right:0; z-index:20; height:56px;
    display:flex; justify-content:space-between; align-items:center; gap:16px;
    padding:0 24px; font-size:14px; background:rgba(18,17,24,.88);
    backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
  footer.fx { border-top:1px solid var(--line); padding:26px 24px; color:var(--muted);
    font-size:13px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
  footer.fx b { color: var(--text); }
  h1 { font-size: 30px; margin: 6px 0 4px; }
  p.tag { color: var(--muted); margin-bottom: 6px; }
  p.meta { color: var(--muted); font-size: 13px; margin-bottom: 22px; }
  p.meta b { color: var(--text); font-weight: 600; }
  .fxstage { background:#17151f; border:1px solid var(--line); border-radius:16px;
    padding:40px 24px; text-align:center; margin: 18px 0; overflow:hidden; }
  /* on-arrival effects need the stage to start BELOW the live band, or the driver
     flags it live on the first frame and the entrance is over before it is seen */
  .fxrunway { padding: 62vh 0 46vh; position: relative; }
  .fxrunway::before { content:"scroll ↓"; position:absolute; top:28vh; left:0; right:0;
    text-align:center; font:600 12px var(--mono); letter-spacing:.14em;
    text-transform:uppercase; color:var(--muted); }
  .fxouter { height: 240vh; position: relative; border-radius:16px; margin:18px 0; }
  .fxsticky { position: sticky; top: 0; height: 100vh; overflow: hidden;
    background:#17151f; border:1px solid var(--line); border-radius:16px; }
  .fxpanel { position:absolute; inset:0 auto 0 0; width:50%; background:#221f31;
    display:grid; place-items:center; font:600 22px var(--mono); color:var(--accent); }
  .fxreveal { position:absolute; inset:0; display:grid; place-items:center;
    font:700 34px var(--sans); }
  .fxh { font-size: 30px; font-weight: 800; }
  .fxp { color: var(--muted); }
  .fxaccent { color: var(--accent); }
  .fxcard { width:150px; height:110px; flex:0 0 auto; border-radius:12px;
    border:1px solid var(--line); background:linear-gradient(150deg,#221f31,var(--surface) 70%);
    display:grid; place-items:center; font:600 15px var(--mono); }
  .fxmarq span { font: 600 22px var(--mono); color: var(--muted); padding: 0 10px; }
  .tabs { display:flex; gap:8px; margin: 26px 0 0; }
  .tabs button { font:600 13px var(--mono); padding:8px 16px; border-radius:8px 8px 0 0;
    border:1px solid var(--line); border-bottom:0; background:transparent;
    color:var(--muted); cursor:pointer; }
  .tabs button.on { background:#17151f; color:var(--accent); }
  .code { position: relative; }
  .code pre { background:#17151f; border:1px solid var(--line); border-radius:0 12px 12px 12px;
    padding:20px; overflow-x:auto; font:13px/1.6 var(--mono); color:#cfcbe4; display:none; }
  .code pre.on { display:block; }
  .copy { position:absolute; top:10px; right:10px; font:600 12px var(--mono);
    padding:6px 12px; border-radius:8px; border:1px solid var(--line);
    background:rgba(0,0,0,.4); color:var(--muted); cursor:pointer; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
  .fxlink { display:block; padding:20px; border:1px solid var(--line); border-radius:14px;
    text-decoration:none; color:var(--text); background:#17151f; }
  .fxlink:hover { border-color: var(--accent); }
  .fxlink b { display:block; margin-bottom:6px; }
  .fxlink span { color:var(--muted); font-size:13px; }
  .fxcat { font:600 12px var(--mono); text-transform:uppercase; letter-spacing:.14em;
    color:var(--muted); margin:30px 0 12px; }
  .fxwrap { display:grid; grid-template-columns:240px minmax(0,1fr); padding-top:56px;
    min-height:100vh; }
  .fxwrap > main { max-width:1000px; padding:44px clamp(24px,4vw,64px) 96px; }
  .fxside { border-right:1px solid var(--line); }
  .fxsidein { position:sticky; top:56px; max-height:calc(100vh - 56px); overflow-y:auto;
    padding:24px 20px 40px; font-size:14px; }
  .fxnav[open] > summary { display:none; }
  .fxnav > summary { cursor:pointer; font:600 12px var(--mono); color:var(--muted); }
  .fxnav nav details { padding:8px 0; border-top:1px solid var(--line); }
  .fxnav nav details:first-child { border-top:0; padding-top:0; }
  .fxnav nav summary { cursor:pointer; user-select:none; font:600 11px/2.2 var(--mono);
    text-transform:uppercase; letter-spacing:.14em; color:var(--muted); }
  .fxnav nav summary:hover { color:var(--text); }
  .fxnav nav a { display:block; padding:4px 0 4px 14px; margin-left:5px; color:var(--text);
    opacity:.85; text-decoration:none; border-left:1px solid var(--line); }
  .fxnav nav a:hover { opacity:1; color:var(--accent); }
  .fxnav nav a[aria-current] { opacity:1; color:var(--accent); font-weight:600;
    border-left-color:var(--accent); }
  @media (max-width: 919px) {
    .fxwrap { display:block; }
    .fxside { border-right:0; }
    .fxsidein { position:static; max-height:none; padding:20px 20px 0; }
    .fxnav > summary, .fxnav[open] > summary { display:list-item; cursor:pointer;
      font:600 14px var(--sans);
      padding:12px 16px; border:1px solid var(--line); border-radius:12px; background:#17151f; }
    .fxnav[open] > summary { border-radius:12px 12px 0 0; }
    .fxnav nav { border:1px solid var(--line); border-top:0; border-radius:0 0 12px 12px;
      padding:10px 16px 14px; background:#17151f; }
  }
`

const header = (sub) => `<header class="fx">
  <div><a href="${sub ? '.' : '../'}" style="text-decoration:none"><b>scrollvars</b>${sub ? ' <span style="color:var(--muted)">/ fx</span>' : ''}</a></div>
  <div><a href="${sub ? '../' : './'}">demo</a> · <a href="${sub ? '../bench/' : 'bench/'}">bench</a> · <a href="${sub ? 'llms.txt' : 'fx/llms.txt'}">llms.txt</a></div>
</header>`

/* categorized accordion sidebar — same markup on every fx page; native <details>.
   Mobile starts collapsed (script below); desktop hides the outer summary only
   while [open], so a closed nav is always reopenable at any width */
const CATEGORIES = [...new Set(EFFECTS.map((e) => e.category))]
const sidebar = (current) => `<aside class="fxside"><div class="fxsidein">
  <details class="fxnav" open>
    <summary>All effects</summary>
    <nav>
      ${CATEGORIES.map(
        (cat) => `<details open><summary>${cat}</summary>
        ${EFFECTS.filter((e) => e.category === cat)
          .map((e) => `<a href="${e.slug}.html"${e.slug === current ? ' aria-current="page"' : ''}>${e.title}</a>`)
          .join('\n        ')}
      </details>`
      ).join('\n      ')}
    </nav>
  </details>
</div></aside>`
const NAV_COLLAPSE = `<script>(()=>{const q=matchMedia('(max-width:919px)'),n=document.querySelector('.fxnav'),f=()=>n.toggleAttribute('open',!q.matches);f();q.addEventListener('change',f)})()</script>`
const footer = `<footer class="fx">
  <div><b>scrollvars</b> — one scroll listener in, CSS variables out. MIT.</div>
  <div><a href="../">demo</a> · <a href="../bench/">bench</a> · <a href="llms.txt">llms.txt</a> · <a href="registry.json">registry</a></div>
</footer>`

for (const fx of EFFECTS) {
  const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fx.title} — scrollvars fx</title>
<meta name="description" content="${fx.tagline} Copy-paste in Tailwind, CSS or React.">
<link rel="stylesheet" href="sv.css">
<style>${SHELL_CSS}</style>
</head><body>
${header(true)}
<div class="fxwrap">
${sidebar(fx.slug)}
<main>
  <h1>${fx.title}</h1>
  <p class="tag">${fx.tagline}</p>
  <p class="meta"><b>Use it for:</b> ${fx.when}<br><b>Knobs:</b> ${fx.knobs}</p>
  ${fx.runway ? `<div class="fxrunway">${fx.preview}</div>` : fx.preview}
  <div class="tabs">
    <button class="on" data-tab="tailwind">Tailwind</button>
    <button data-tab="css">CSS</button>
    <button data-tab="react">React</button>
  </div>
  <div class="code">
    <button class="copy">copy</button>
    <pre class="on" data-pane="tailwind"><code>${esc(fx.tailwind)}</code></pre>
    <pre data-pane="css"><code>${esc(fx.css)}</code></pre>
    <pre data-pane="react"><code>${esc(fx.react)}</code></pre>
  </div>
  <p class="meta" style="margin-top:20px">Engine: <code>npm i scrollvars</code> — driver 1.2 KB gzip.
  All effects respect <code>prefers-reduced-motion</code> and render complete without JS.</p>
</main>
</div>
${footer}
${NAV_COLLAPSE}
<script src="sv.js"></script>
<script>
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.code pre').forEach(p =>
      p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
  }));
  document.querySelector('.copy').addEventListener('click', function () {
    navigator.clipboard.writeText(document.querySelector('.code pre.on code').innerText);
    this.textContent = 'copied!';
    setTimeout(() => (this.textContent = 'copy'), 1200);
  });
</script>
</body></html>`
  writeFileSync(join(out, `${fx.slug}.html`), page)
}

/* hub */
const hub = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>scrollvars fx — copy-paste scroll effects</title>
<meta name="description" content="A growing library of scroll, pointer and state effects in Tailwind and CSS — powered by a 1.2 KB engine. Copy-paste for humans and AIs.">
<style>${SHELL_CSS}</style>
</head><body>
${header(true)}
<div class="fxwrap">
${sidebar()}
<main>
  <h1>fx — copy-paste effects</h1>
  <p class="tag">Award-site patterns as Tailwind + CSS you can actually paste — no 47 KB tax.
  Each effect ships three formats and full knobs. Machine-readable: <a href="llms.txt">llms.txt</a>.</p>
  ${CATEGORIES.map(
    (cat) => `<h2 class="fxcat">${cat}</h2>
  <div class="grid">
    ${EFFECTS.filter((e) => e.category === cat)
      .map((fx) => `<a class="fxlink" href="${fx.slug}.html"><b>${fx.title}</b><span>${fx.tagline}</span></a>`)
      .join('\n    ')}
  </div>`
  ).join('\n  ')}
  <p class="meta" style="margin-top:28px">Growing over time. Engine + 28-pattern showcase:
  <a href="../">scrollvars.vercel.app</a> · benchmarks: <a href="../bench/">/bench/</a></p>
</main>
</div>
${footer}
${NAV_COLLAPSE}
</body></html>`
writeFileSync(join(out, 'index.html'), hub)

/* llms.txt for the gallery */
const llms = `# scrollvars fx — llms.txt (copy-paste effects)

> A growing library of scroll/pointer/state effects on the scrollvars engine
> (npm i scrollvars — driver 1.2 KB gzip). Each effect below includes when to
> use it, its knobs, and three ready formats. Engine API: see
> https://scrollvars.vercel.app/llms.txt

${EFFECTS.map(
  (fx) => `## ${fx.title} (${fx.slug})

${fx.tagline}
Category: ${fx.category}
Use for: ${fx.when}
Knobs: ${fx.knobs}

### Tailwind
\`\`\`html
${fx.tailwind}
\`\`\`

### CSS
\`\`\`html
${fx.css}
\`\`\`

### React
\`\`\`tsx
${fx.react}
\`\`\`
`
).join('\n')}`
writeFileSync(join(out, 'llms.txt'), llms)


/* ─────────── shadcn-style registry: complete component files ─────────── */

const COMPONENTS = {
  'sequenced-scrub': {
    file: 'SequencedScrub.tsx',
    content: `// scrollvars fx · sequenced-scrub
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (layout)
// Each child animates over its own slice of the pin: pass ranges as
// [from, to] pairs (0..1); overlapping ranges are fine — that's the point.
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

export function SequencedScrub({
  children,
  ranges,
  height = '250vh',
  className,
}: {
  children: React.ReactNode
  /** One [from, to] per child; defaults to evenly staggered overlapping slices. */
  ranges?: [number, number][]
  height?: string
  className?: string
}) {
  const count = React.Children.count(children)
  return (
    <Track pin className={className} style={{ position: 'relative', height }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="sv-range sv-range-rise" style={{ display: 'grid', gap: 12 }}>
          {React.Children.map(children, (child, i) => {
            const [from, to] = ranges?.[i] ?? [i / count, Math.min((i + 1.6) / count, 1)]
            return (
              <div style={{ '--sv-from': from, '--sv-to': to } as React.CSSProperties}>{child}</div>
            )
          })}
        </div>
      </div>
    </Track>
  )
}
`,
  },
  'staggered-reveal': {
    file: 'StaggeredReveal.tsx',
    content: `// scrollvars fx · staggered-reveal
// Requires: npm i scrollvars · import 'scrollvars/styles/core.css' (layout)
'use client'
import * as React from 'react'
import { Reveal } from 'scrollvars/react'

export function StaggeredReveal({ children, ...rest }: React.ComponentProps<typeof Reveal>) {
  return (
    <Reveal auto {...rest}>
      {children}
    </Reveal>
  )
}
`,
  },
  'deck-spread': {
    file: 'DeckSpread.tsx',
    content: `// scrollvars fx · deck-spread
// Requires: npm i scrollvars · import 'scrollvars/styles/core.css' (layout)
// Knobs: gap, --sv-mid = (children-1)/2 is set for you.
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

export function DeckSpread({
  children,
  gap = 16,
  className,
}: {
  children: React.ReactNode
  gap?: number
  className?: string
}) {
  const count = React.Children.count(children)
  return (
    <Track className={className}>
      <div
        className="sv-spread sv-spread-in"
        style={{ '--sv-gap': gap + 'px', '--sv-mid': (count - 1) / 2 } as React.CSSProperties}
      >
        {React.Children.map(children, (child, i) => (
          <div style={{ '--sv-order': i } as React.CSSProperties}>{child}</div>
        ))}
      </div>
    </Track>
  )
}
`,
  },
  curtain: {
    file: 'Curtain.tsx',
    content: `// scrollvars fx · curtain
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (layout)
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

export function Curtain({
  children,
  panelClassName = 'bg-zinc-900',
  height = '250vh',
}: {
  children: React.ReactNode // the revealed content
  panelClassName?: string
  height?: string
}) {
  return (
    <Track pin className="relative" style={{ height }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="grid h-full place-items-center">{children}</div>
        <div className={\`sv-curtain-l absolute inset-y-0 left-0 w-1/2 \${panelClassName}\`} />
        <div className={\`sv-curtain-r absolute inset-y-0 right-0 w-1/2 \${panelClassName}\`} />
      </div>
    </Track>
  )
}
`,
  },
  'horizontal-rail': {
    file: 'HorizontalRail.tsx',
    content: `// scrollvars fx · horizontal-rail
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (layout)
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

export function HorizontalRail({
  children,
  height = '300vh',
}: {
  children: React.ReactNode // the cards (give each a fixed width + shrink-0)
  height?: string
}) {
  return (
    <Track pin className="relative" style={{ height }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="sv-rail flex gap-4 px-[10vw]">{children}</div>
      </div>
    </Track>
  )
}
`,
  },
  'rotating-words': {
    file: 'RotatingWords.tsx',
    content: `// scrollvars fx · rotating-words
// Requires: npm i scrollvars · import 'scrollvars/styles/state.css' (layout)
'use client'
import * as React from 'react'

export function RotatingWords({
  words,
  interval = 2000,
  className,
}: {
  words: string[]
  interval?: number
  className?: string
}) {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [words.length, interval])
  return (
    <span className={className ? \`sv-words \${className}\` : 'sv-words'}
      style={{ '--sv-word': index } as React.CSSProperties}>
      {words.map((w) => (
        <span key={w}>{w}</span>
      ))}
    </span>
  )
}
`,
  },
  'pointer-tilt': {
    file: 'PointerTiltGrid.tsx',
    content: `// scrollvars fx · pointer-tilt
// Requires: npm i scrollvars · import 'scrollvars/styles/tilt.css' (layout)
// Give each card the sv-tilt class; one delegated listener covers the grid.
'use client'
import * as React from 'react'
import { usePointer } from 'scrollvars/react'

export function PointerTiltGrid({
  children,
  className = 'grid grid-cols-3 gap-6',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = usePointer<HTMLDivElement>()
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
`,
  },
  'coverflow-slider': {
    file: 'CoverflowSlider.tsx',
    content: `// scrollvars fx · coverflow-slider
// Requires: npm i scrollvars · import 'scrollvars/styles/slider.css' (layout)
// Chrome knobs: --sv-arrow-* / --sv-dot-* on this element or :root.
'use client'
import * as React from 'react'
import { Slide, Slider } from 'scrollvars/react'

const coverflow = {
  scale: 'calc(1 - min(max(var(--sd, 0), -1 * var(--sd, 0)) * 0.12, 0.3))',
  opacity: 'calc(1 - min(max(var(--sd, 0), -1 * var(--sd, 0)) * 0.35, 0.7))',
  transform: 'perspective(900px) rotateY(clamp(-24deg, calc(var(--sd, 0) * -16deg), 24deg))',
} as React.CSSProperties

export function CoverflowSlider({
  children,
  perView = { base: 1.2, md: 2.5, xl: 4 },
  ...rest
}: React.ComponentProps<typeof Slider>) {
  return (
    <Slider perView={perView} gap={16} arrows dots {...rest}>
      {React.Children.map(children, (child) => (
        <Slide style={coverflow}>{child}</Slide>
      ))}
    </Slider>
  )
}
`,
  },
  marquee: {
    file: 'LogoMarquee.tsx',
    content: `// scrollvars fx · marquee
// Requires: npm i scrollvars · import 'scrollvars/styles/ui.css' (layout)
'use client'
import * as React from 'react'
import { Marquee } from 'scrollvars/react'

export function LogoMarquee({
  children,
  speed = 24,
  className,
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  return (
    <Marquee speed={speed} className={className}>
      {children}
    </Marquee>
  )
}
`,
  },
}

const registry = EFFECTS.map((fx) => ({
  slug: fx.slug,
  category: fx.category,
  title: fx.title,
  tagline: fx.tagline,
  page: `https://scrollvars.vercel.app/fx/${fx.slug}.html`,
  file: COMPONENTS[fx.slug].file,
  content: COMPONENTS[fx.slug].content,
}))
writeFileSync(join(out, 'registry.json'), JSON.stringify({ version: 1, effects: registry }, null, 2))

console.log(`fx built: ${EFFECTS.length} effects + hub + llms.txt + registry.json + sv.js/sv.css`)
