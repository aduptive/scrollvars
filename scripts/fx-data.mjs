/**
 * The fx gallery data: EFFECTS (one entry per gallery page: preview + the three
 * snippets + knobs + requirements) and COMPONENTS (the React file `npx scrollvars
 * add <slug>` installs). Pure data, no side effects, so tests can import it and
 * prove that every component compiles and renders with the presets its preview
 * uses. scripts/fx-build.mjs turns this into pages, llms.txt and registry.json.
 */
export const EFFECTS = [
  {
    slug: 'staggered-reveal',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['core'], min: '1.9.0' },
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
  <p class="sv-rise" data-sv-order="1">Copy</p>
  <p class="sv-rise" data-sv-order="2" data-sv-distance="3rem">More</p>
</section>
<!-- once: import 'scrollvars/styles/core.css' + <ScrollVarsBoot /> in the layout -->
<!-- data-sv-order/-distance/-from/-to become the CSS vars on mount. No
     style attr, works with mapped CMS content, adds zero global CSS.
     Also fine: [--sv-order:1] arbitrary classes for static one-offs;
     sv-stagger on the parent for sequential lists (no attrs at all). -->`,
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['core', 'pin'], min: '1.9.0' },
    category: 'Reveals',
    title: 'Deck spread',
    tagline: 'A centered card deck deals itself into the grid. On arrival or scrubbed.',
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
{/* Item carries the vars as props. No style attr; sv-spread targets
   direct children, and the Item wrapper IS the direct child. */}`,
  },
  {
    slug: 'curtain',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], min: '1.9.0' },
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], min: '1.9.0' },
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], min: '1.9.0' },
    category: 'Pinned scenes',
    title: 'Sequenced scrub',
    tagline: 'Each child animates over its own slice of the pin. Choreography without a timeline.',
    when: 'Pinned stories where A plays over 0–40%, B over 30–70%, C over 60–100%.',
    knobs: '--sv-from / --sv-to per child (slice of the clock), --sv-distance; override --sv-clock to pick the clock',
    preview: `<div data-sv data-sv-pin class="fxouter">
  <div class="fxsticky" style="display:grid;place-items:center">
    <div class="sv-range sv-range-rise" style="display:grid;gap:12px;text-align:center">
      <h3 class="fxh" data-sv-from="0" data-sv-to=".4">First this</h3>
      <p class="fxp" data-sv-from=".3" data-sv-to=".7">then this</p>
      <p class="fxp fxaccent" data-sv-from=".6" data-sv-to="1">then this</p>
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
/* consume --sv-r however you like, ALWAYS with a fallback of 1: */
.mine > * { opacity: var(--sv-r, 1); scale: calc(.8 + var(--sv-r, 1) * .2); }`,
    tailwind: `<div data-sv data-sv-pin class="relative h-[250vh]">
  <div class="sticky top-0 grid h-screen place-items-center">
    <div class="sv-range sv-range-rise grid gap-3">
      <h2 data-sv-from="0" data-sv-to=".4" class="text-4xl font-bold">First</h2>
      <p data-sv-from=".3" data-sv-to=".7">Second</p>
      <p data-sv-from=".6" data-sv-to="1">Third</p>
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
    slug: 'gsap-scrub',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], deps: { gsap: '^3' }, min: '1.9.0' },
    category: 'Interop',
    title: 'GSAP timeline under scrub',
    tagline: 'Author the choreography in GSAP, let ScrollVars drive it. One listener, one writer.',
    when: 'The page that genuinely needs timeline authoring. You keep the driver; GSAP renders.',
    knobs: 'the timeline is yours; ScrollVars owns scroll (pin/onPin). Never let GSAP add its own scroll listener',
    preview: `<div class="fxouter" id="fxgsap-outer">
  <div class="fxsticky" style="display:grid;place-items:center;overflow:hidden">
    <div id="fxgsap" style="display:flex;gap:14px">
      <div class="fxcard">sv</div><div class="fxcard">drives</div><div class="fxcard">gsap</div>
    </div>
  </div>
</div>
<p class="meta" style="margin-top:8px"><b>Honesty:</b> this page pays GSAP's ~46 KB. Adopt it per page
that needs timeline authoring, never globally, or the bundle argument dies for that page.</p>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script>addEventListener('load', () => {
  const tl = gsap.timeline({ paused: true })
    .from('#fxgsap > *', { y: 140, opacity: 0, rotate: 10, stagger: 0.2, ease: 'power2.out' })
    .to('#fxgsap > *', { scale: 1.12, stagger: 0.12, ease: 'none' })
  // reduced motion: GSAP owns these styles, so settle the timeline instead of scrubbing it
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) tl.progress(1)
  else SV.track(document.getElementById('fxgsap-outer'), { pin: true, onPin: (p) => tl.progress(p) })
})</script>`,
    css: `<div class="outer">          <!-- height: 250vh; position: relative -->
  <div class="sticky">…stage…</div>  <!-- sticky; top:0; h:100vh -->
</div>

<script>
  // author in time-space, consume as a scrub. This stays input-driven:
  const tl = gsap.timeline({ paused: true })
    .from('.stage > *', { y: 140, opacity: 0, stagger: 0.2 })

  track(document.querySelector('.outer'), {
    pin: true,
    onPin: (p) => tl.progress(p), // ScrollVars steers, GSAP renders
  })
  // Do NOT also create a ScrollTrigger. One scroll listener, one writer.
</script>`,
    tailwind: `<div data-x class="relative h-[250vh]">   <!-- no data-sv: this one is tracked in JS -->
  <div class="sticky top-0 grid h-screen place-items-center">…</div>
</div>
<!-- zero-wrapper pages can keep data-sv-pin and read the var instead:
     gsap.ticker.add(() => tl.progress(
       parseFloat(getComputedStyle(el).getPropertyValue('--sv-pin')) || 0)) -->`,
    react: `const tl = useRef<gsap.core.Timeline>(null)
useEffect(() => {
  tl.current = gsap.timeline({ paused: true })
    .from('.stage > *', { y: 140, opacity: 0, stagger: 0.2 })
  return () => tl.current?.kill()
}, [])

<Track pin onPin={(p) => tl.current?.progress(p)} className="relative h-[250vh]">
  <div className="sticky top-0 h-screen">…</div>
</Track>`,
  },
  {
    slug: 'three-scene',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], deps: { three: '>=0.147' }, min: '1.11.0' },
    category: 'Interop',
    title: 'Three.js scene on the pin',
    tagline: 'A WebGL scene scrubbed by scroll. The canvas harness runs the lifecycle, Three renders.',
    when: 'Hero 3D moments, product tours, camera paths, WebGL driven by the same variables.',
    knobs: "mountEffect({ context: null }) hands you the raw canvas; feed progress via onPin/onTravel closures",
    preview: `<div class="fxouter" id="fxthree-outer">
  <div class="fxsticky" style="display:grid;place-items:center">
    <canvas id="fxthree" style="width:min(90%,560px);height:60vh"></canvas>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>
<script src="sv-canvas.js"></script>
<script>addEventListener('load', () => {
  let progress = 0
  let renderer, scene, camera, mesh
  SVC.mountEffect(document.getElementById('fxthree'), {
    context: null, // WebGL owns the canvas; the harness owns the lifecycle
    setup(fx) {
      renderer = new THREE.WebGLRenderer({ canvas: fx.canvas, alpha: true, antialias: true })
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.1, 0.34, 160, 24),
        new THREE.MeshNormalMaterial({ wireframe: true })
      )
      scene.add(mesh)
    },
    resize(fx) {
      renderer.setPixelRatio(fx.dpr)
      renderer.setSize(fx.width, fx.height, false)
      camera.aspect = fx.width / fx.height
      camera.updateProjectionMatrix()
    },
    frame(fx, dt) {
      mesh.rotation.y += fx.reducedMotion ? 0 : dt * 0.15 // idle drift
      mesh.rotation.x = progress * Math.PI
      camera.position.z = 6 - progress * 2.2
      renderer.render(scene, camera)
    },
  })
  SV.track(document.getElementById('fxthree-outer'), { pin: true, onPin: (p) => (progress = p) })
})</script>`,
    css: `<div class="outer">              <!-- height: 250vh -->
  <div class="sticky"><canvas id="scene"></canvas></div>
</div>

<script type="module">
  import { track } from 'scrollvars'
  import { mountEffect } from 'scrollvars/canvas'
  import * as THREE from 'three'

  let progress = 0
  mountEffect(document.getElementById('scene'), {
    context: null,                       // you own the WebGL context
    setup(fx)  { /* renderer/scene/camera on fx.canvas */ },
    resize(fx) { /* setSize(fx.width, fx.height); setPixelRatio(fx.dpr) */ },
    frame(fx, dt) { /* advance + render; respect fx.reducedMotion */ },
  })
  track(outer, { pin: true, onPin: (p) => (progress = p) })
  // The harness gives you: DPR cap, resize, pause offscreen/hidden tab,
  // delta-time loop, reduced-motion flag, cleanup, Three stays userland.
</script>`,
    tailwind: `<div class="relative h-[250vh]">
  <div class="sticky top-0 grid h-screen place-items-center">
    <canvas id="scene" class="h-[60vh] w-full max-w-xl"></canvas>
  </div>
</div>
<!-- same JS as the CSS tab, Tailwind only does the skeleton here -->`,
    react: `'use client'
const progress = useRef(0)
const canvasRef = useCanvasEffect({
  context: null,
  setup(fx)  { /* THREE renderer on fx.canvas */ },
  resize(fx) { /* size + DPR */ },
  frame(fx, dt) { /* render with progress.current */ },
})

<Track pin onPin={(p) => (progress.current = p)} className="relative h-[250vh]">
  <div className="sticky top-0 grid h-screen place-items-center">
    <canvas ref={canvasRef} className="h-[60vh] w-full max-w-xl" />
  </div>
</Track>`,
  },
  {
    slug: 'split-reveal',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['core'], min: '1.12.4' },
    category: 'Text',
    title: 'Split reveal',
    tagline: 'A headline broken into words, each rising on its own beat, SplitText without the engine.',
    when: 'Hero headlines, section titles, any text that deserves an entrance.',
    knobs: 'data-sv-split (word|char) does the splitting; --sv-stagger (beat), --sv-duration; pair with sv-reading to scrub instead',
    runway: true,
    preview: `<section data-sv data-sv-once class="fxstage">
  <h3 class="fxh sv-split-rise" data-sv-split>Words arrive one by one</h3>
  <p class="fxp sv-rise" style="--sv-order: 5">and the copy follows.</p>
</section>`,
    css: `<section data-sv data-sv-once>
  <h2 class="sv-split-rise" data-sv-split>Words arrive one by one</h2>
</section>
<!-- data-sv-split wraps each word in a span with --sv-order; the full text
     stays in a visually-hidden span for AT and the animated spans are
     aria-hidden. char mode: data-sv-split="char". -->

/* the preset (styles/core.css): */
.sv-on .sv .sv-split-rise > span {
  opacity: 0; translate: 0 .6em;
  transition: opacity var(--sv-duration) var(--sv-ease),
              translate var(--sv-duration) var(--sv-ease);
  transition-delay: calc(var(--sv-order, 0) * var(--sv-stagger));
}
.sv-on .sv.sv-live .sv-split-rise > span { opacity: 1; translate: 0 0; }

/* scrub instead of play: the same spans feed sv-reading directly */
<h2 class="sv-reading" data-sv-split>…</h2>   <!-- inside a data-sv-pin -->`,
    tailwind: `<section data-sv data-sv-once class="py-24">
  <h2 class="sv-split-rise text-5xl font-extrabold" data-sv-split>
    Words arrive one by one
  </h2>
</section>
<!-- knobs per element: [--sv-stagger:60ms] [--sv-duration:600ms] -->`,
    react: `import { Split } from 'scrollvars/react'

<Reveal>
  <Split as="h2" className="sv-split-rise" stagger={60}>
    Words arrive one by one
  </Split>
</Reveal>

{/* <Split> renders the spans ON THE SERVER. The split markup is in the
   HTML, so no client-side splitting, no layout shift, no hydration
   flash. by="char" for letters. */}`,
  },
  {
    slug: 'rotating-words',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['state'], min: '1.11.1' },
    category: 'Text',
    title: 'Rotating words',
    tagline: 'One word exits up, the next rises from below. A clipped column on one variable.',
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
  vertical-align: baseline; height: 1.15em; overflow: hidden; }
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['tilt'], min: '1.9.0' },
    category: 'Pointer',
    title: 'Pointer tilt',
    tagline: 'Cards tilt toward the cursor with a moving glare. One delegated listener.',
    when: 'Product cards, team grids, anything that should feel physical.',
    knobs: 'tilt degrees and glare live in the preset. Override .sv-tilt to taste',
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
/* preset in styles/tilt.css. Tilt + glare from --mx/--my */`,
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['slider'], min: '1.12.3' },
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
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['ui'], min: '1.9.0' },
    category: 'Sliders',
    title: 'Marquee',
    tagline: 'An infinite strip (logos, taglines) that pauses on hover.',
    when: 'Logo walls, ticker bands. The honest replacement for Swiper loop.',
    knobs: '--sv-marquee-duration (one loop), --sv-gap; --sv-marquee-hover: running disables the pause',
    preview: `<div class="sv-marquee fxstage" style="padding:28px 0">
  <div class="sv-marquee-track fxmarq">
    <span>ScrollVars</span><span>·</span><span>one rAF in</span><span>·</span>
    <span>CSS variables out</span><span>·</span>
    <span aria-hidden="true" style="display:contents"><span>ScrollVars</span><span>·</span><span>one rAF in</span><span>·</span><span>CSS variables out</span><span>·</span></span>
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
  // ── Sections: whole premium blocks, not single effects. Same rules: presets +
  //    a few CSS lines, no JS in the hot path, complete without JS, reduced-motion safe.
  {
    slug: 'hero-cinematic',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['core', 'ui'], min: '1.13.0' },
    category: 'Sections',
    title: 'Cinematic hero',
    tagline: 'Split headline rising on a beat, pointer-parallax glow, a marquee strip, and the whole block fades out as you scroll past (--sv-t).',
    when: 'Landing pages, studio reels, product launches. The first fold that has to land.',
    knobs: '--sv-stagger (word beat), --hero-parallax (px of pointer drift), --sv-marquee-duration; swap the orbs for images or video',
    preview: `<style>
.sv-hero { position: relative; min-height: 86vh; display: grid; place-items: center; overflow: hidden; isolation: isolate; text-align: center; padding: 0; }
.hero-orb { position: absolute; width: 52vmin; height: 52vmin; border-radius: 50%; filter: blur(70px); opacity: .5; z-index: -1;
  translate: calc(var(--mx, 0) * var(--hero-parallax, 40px)) calc(var(--my, 0) * var(--hero-parallax, 40px)); transition: translate .5s ease-out; }
.hero-orb.a { background: var(--accent); top: -14%; left: -8%; }
.hero-orb.b { background: #ffb454; bottom: -16%; right: -10%; --hero-parallax: -60px; }
.hero-inner { padding: 60px 24px 90px; --hero-out: clamp(0, (var(--sv-t, .5) - .5) * 2, 1); opacity: calc(1 - var(--hero-out)); scale: calc(1 - var(--hero-out) * .12); }
.hero-eyebrow { font: 600 12px var(--mono); letter-spacing: .18em; text-transform: uppercase; color: var(--accent); }
.hero-title { font-size: clamp(36px, 6.4vw, 78px); line-height: 1.02; letter-spacing: -.03em; max-width: 14ch; margin: 14px auto 18px; font-weight: 800; }
.hero-sub { color: var(--muted); max-width: 42ch; margin: 0 auto 26px; font-size: 17px; }
.hero-cta { display: inline-block; padding: 12px 22px; border-radius: 999px; background: var(--accent); color: #121118; font-weight: 700; text-decoration: none; }
.hero-strip { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 0; border-top: 1px solid var(--line); font: 600 13px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.hero-strip span { margin: 0 18px; }
</style>
<section data-sv data-sv-travel class="sv-hero fxstage" id="fxhero" style="--sv-stagger: 70ms">
  <div class="hero-orb a"></div><div class="hero-orb b"></div>
  <div class="hero-inner">
    <p class="hero-eyebrow sv-rise">Studio · 2026 reel</p>
    <h3 class="hero-title sv-split-rise" data-sv-split>Sites that move with intent</h3>
    <p class="hero-sub sv-rise" data-sv-order="6">One scroll listener, one frame, and CSS does the rest. This hero is 40 lines of CSS on top of the presets.</p>
    <p class="sv-rise" data-sv-order="7"><a class="hero-cta" href="#">See the work</a></p>
  </div>
  <div class="sv-marquee hero-strip"><div class="sv-marquee-track">
    <span>Brand</span><span>·</span><span>Motion</span><span>·</span><span>Web</span><span>·</span><span>Type</span><span>·</span>
    <span aria-hidden="true" style="display:contents"><span>Brand</span><span>·</span><span>Motion</span><span>·</span><span>Web</span><span>·</span><span>Type</span><span>·</span></span>
  </div></div>
</section>
<script>addEventListener('load', () => SV.trackPointer(document.getElementById('fxhero'), { selector: '.sv-hero' }))</script>`,
    css: `<section data-sv data-sv-travel class="sv-hero" id="hero">   <!-- travel: --sv-t 0..1 through the viewport -->
  <div class="hero-orb a"></div><div class="hero-orb b"></div>
  <div class="hero-inner">
    <p class="sv-rise">Eyebrow</p>
    <h1 class="sv-split-rise" data-sv-split>Sites that move with intent</h1>
    <p class="sv-rise" data-sv-order="6">Sub copy.</p>
    <p class="sv-rise" data-sv-order="7"><a class="cta" href="#">See the work</a></p>
  </div>
  <div class="sv-marquee hero-strip"><div class="sv-marquee-track">
    <span>Brand</span><span>·</span><span>Motion</span><span>·</span>
    <span aria-hidden="true" style="display:contents"><span>Brand</span><span>·</span><span>Motion</span><span>·</span></span>
  </div></div>
</section>
<script>SV.trackPointer(document.getElementById('hero'), { selector: '.sv-hero' })</script>   <!-- --mx/--my (-1..1) on the section itself -->

/* presets do the entrance (core.css) and the strip (ui.css); this is the whole section: */
.sv-hero { position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; isolation: isolate; }
.hero-orb { position: absolute; width: 52vmin; height: 52vmin; border-radius: 50%; filter: blur(70px); opacity: .5; z-index: -1;
  translate: calc(var(--mx, 0) * var(--hero-parallax, 40px)) calc(var(--my, 0) * var(--hero-parallax, 40px));
  transition: translate .5s ease-out; }
.hero-orb.b { --hero-parallax: -60px; }                       /* opposite drift = depth */
.hero-inner { --hero-out: clamp(0, (var(--sv-t, .5) - .5) * 2, 1);   /* --sv-t is .5 with the hero at rest, 1 when it has left */
  opacity: calc(1 - var(--hero-out)); scale: calc(1 - var(--hero-out) * .12); }
.hero-strip { position: absolute; left: 0; right: 0; bottom: 0; }
/* no JS: --sv-t and --mx/--my are unset → the fallbacks render the finished hero. */`,
    tailwind: `<section data-sv data-sv-travel id="hero" class="relative grid min-h-svh place-items-center overflow-hidden isolate
  [&_.inner]:[--hero-out:clamp(0,(var(--sv-t,.5)-.5)*2,1)] [&_.inner]:[opacity:calc(1-var(--hero-out))] [&_.inner]:[scale:calc(1-var(--hero-out)*.12)]">
  <div class="absolute -top-[14%] -left-[8%] size-[52vmin] rounded-full bg-violet-400/50 blur-3xl -z-10
    [translate:calc(var(--mx,0)*40px)_calc(var(--my,0)*40px)] transition-[translate] duration-500"></div>
  <div class="inner text-center">
    <p class="sv-rise text-xs tracking-[.18em] uppercase text-violet-400">Eyebrow</p>
    <h1 class="sv-split-rise text-6xl font-extrabold tracking-tight" data-sv-split>Sites that move with intent</h1>
    <p class="sv-rise text-neutral-400" data-sv-order="6">Sub copy.</p>
  </div>
  <div class="sv-marquee absolute inset-x-0 bottom-0 border-t py-3"><div class="sv-marquee-track">…</div></div>
</section>
<script>SV.trackPointer(document.getElementById('hero'), { selector: '.sv-hero' })</script>`,
    react: `import { Track, Split, Marquee, usePointer } from 'scrollvars/react'

function Hero() {
  const ref = usePointer<HTMLElement>({ selector: '.sv-hero' })   // --mx/--my (-1..1) on the section
  return (
    <section ref={ref} className="sv-hero">
      <div className="hero-orb a" /><div className="hero-orb b" />
      <Track travel>                              {/* .sv-live for the entrance, --sv-t for the exit */}
        <div className="hero-inner">
          <p className="sv-rise">Eyebrow</p>
          <Split as="h1" className="sv-split-rise">Sites that move with intent</Split>
          <p className="sv-rise" style={{ '--sv-order': 6 }}>Sub copy.</p>
        </div>
      </Track>
      <Marquee className="hero-strip"><span>Brand</span><span>·</span><span>Motion</span><span>·</span></Marquee>
    </section>
  )
}
// npx scrollvars add hero-cinematic → components/fx/HeroCinematic.tsx (CSS included)`,
  },
  {
    slug: 'timeline-scrub',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], min: '1.13.0' },
    category: 'Sections',
    title: 'Pinned timeline',
    tagline: 'Pin the section; the scroll draws the line, counts the year and lights each milestone over its own slice of the pin.',
    when: 'Company history, case-study process, roadmap, "how we got here". Any ordered story.',
    knobs: '--tl-from/--tl-span (year counter), data-sv-from/to per milestone (its slice of the pin), --sv-distance (milestone travel), wrapper height (scroll length)',
    preview: `<style>
.tl { --tl-from: 2019; --tl-span: 7; height: 320vh; }
.tl-sticky { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); align-items: center; gap: 40px; padding: 0 clamp(20px, 5vw, 64px); }
.tl-year { font: 700 clamp(64px, 12vw, 150px)/1 var(--mono); letter-spacing: -.04em; color: var(--accent); font-variant-numeric: tabular-nums;
  counter-reset: tl-year calc(var(--tl-from) + var(--sv-pin, 1) * var(--tl-span)); }
.tl-year::after { content: counter(tl-year); }
.tl-cap { display: block; margin-top: 10px; color: var(--muted); font: 600 12px var(--mono); letter-spacing: .16em; text-transform: uppercase; }
.tl-track { position: relative; padding-left: 34px; }
.tl-line { position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: var(--line); }
.tl-line::after { content: ""; position: absolute; inset: 0; background: var(--accent); transform-origin: top; scale: 1 var(--sv-pin, 1); }
.tl-items { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(18px, 4vh, 40px); text-align: left; }
.tl-items > li { position: relative; --sv-distance: 1.6rem; }
.tl-items > li::before { content: ""; position: absolute; left: -32px; top: 6px; width: 12px; height: 12px; border-radius: 50%;
  background: color-mix(in oklab, var(--accent) calc(var(--sv-r, 1) * 100%), var(--line)); box-shadow: 0 0 0 4px #17151f; }
.tl-items b { display: block; font: 700 12px var(--mono); letter-spacing: .12em; color: var(--accent); margin-bottom: 4px; }
.tl-items p { margin: 0; color: var(--text); font-size: 15px; max-width: 34ch; }
@media (max-width: 640px) { .tl-sticky { grid-template-columns: 1fr; align-content: center; gap: 22px; } .tl-year { font-size: clamp(56px, 18vw, 96px); } }
</style>
<div data-sv data-sv-pin class="fxouter tl">
  <div class="fxsticky tl-sticky">
    <div><span class="tl-year"></span><span class="tl-cap">years of shipping</span></div>
    <div class="tl-track"><i class="tl-line"></i>
      <ol class="sv-range sv-range-rise tl-items">
        <li data-sv-from="0" data-sv-to=".28"><b>2019</b><p>First client site on a hand-rolled scroll engine.</p></li>
        <li data-sv-from=".22" data-sv-to=".52"><b>2021</b><p>The engine becomes a package; five sites share one codebase.</p></li>
        <li data-sv-from=".46" data-sv-to=".76"><b>2024</b><p>Benchmarks published, CSS-variable API frozen.</p></li>
        <li data-sv-from=".7" data-sv-to="1"><b>2026</b><p>ScrollVars ships on npm. This timeline is one pinned block and four ranges.</p></li>
      </ol>
    </div>
  </div>
</div>`,
    css: `<div data-sv data-sv-pin="320vh" class="tl" style="--tl-from: 2019; --tl-span: 7">   <!-- pin helper: the value is the scroll length -->
  <div class="sv-stage tl-sticky">                                                     <!-- preset: sticky viewport; flow again without JS -->
    <span class="tl-year"></span>
    <div class="tl-track"><i class="tl-line"></i>
      <ol class="sv-range sv-range-rise tl-items">                              <!-- preset: --sv-r per child -->
        <li data-sv-from="0"   data-sv-to=".28"><b>2019</b><p>…</p></li>
        <li data-sv-from=".22" data-sv-to=".52"><b>2021</b><p>…</p></li>
        <li data-sv-from=".7"  data-sv-to="1"><b>2026</b><p>…</p></li>
      </ol>
    </div>
  </div>
</div>

.tl-sticky { display: grid; grid-template-columns: 1fr 1.2fr; align-items: center; }   /* sv-stage does the pinning */
/* the year is a CSS counter driven by the pin. No JS, no innerText */
.tl-year { counter-reset: tl-year calc(var(--tl-from) + var(--sv-pin, 1) * var(--tl-span)); font-variant-numeric: tabular-nums; }
.tl-year::after { content: counter(tl-year); }
/* the line fills with the pin */
.tl-line { position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: var(--line); }
.tl-line::after { content: ""; position: absolute; inset: 0; background: var(--accent); transform-origin: top; scale: 1 var(--sv-pin, 1); }
/* each milestone rises over its own slice (sv-range-rise) and its dot lights with --sv-r */
.tl-items > li::before { content: ""; width: 12px; height: 12px; border-radius: 50%; position: absolute; left: -32px;
  background: color-mix(in oklab, var(--accent) calc(var(--sv-r, 1) * 100%), var(--line)); }
/* no JS / old engines: --sv-pin and --sv-r fall back to 1 → the finished timeline renders. */`,
    tailwind: `<div data-sv data-sv-pin class="relative h-[320vh] [--tl-from:2019] [--tl-span:7]">
  <div class="sticky top-0 grid h-screen grid-cols-[1fr_1.2fr] items-center gap-10 px-12">
    <span class="tl-year font-mono text-[9rem] font-bold tabular-nums text-violet-400
      [counter-reset:tl-year_calc(var(--tl-from)+var(--sv-pin,1)*var(--tl-span))] after:content-[counter(tl-year)]"></span>
    <ol class="sv-range sv-range-rise relative grid gap-8 border-l-2 border-white/10 pl-8">
      <li data-sv-from="0"   data-sv-to=".28"><b class="font-mono text-xs text-violet-400">2019</b><p>…</p></li>
      <li data-sv-from=".22" data-sv-to=".52"><b class="font-mono text-xs text-violet-400">2021</b><p>…</p></li>
      <li data-sv-from=".7"  data-sv-to="1"><b class="font-mono text-xs text-violet-400">2026</b><p>…</p></li>
    </ol>
  </div>
</div>
<!-- the filling line: a pseudo-element with [scale:1_var(--sv-pin,1)] origin-top (see CSS tab) -->`,
    react: `import { Track } from 'scrollvars/react'

const steps = [
  { year: 2019, range: [0, .28], text: '…' },
  { year: 2021, range: [.22, .52], text: '…' },
  { year: 2026, range: [.7, 1], text: '…' },
]
function Timeline() {
  return (
    <Track pin="320vh" className="tl" style={{ '--tl-from': 2019, '--tl-span': 7 }}>
      <div className="sv-stage tl-sticky">
        <span className="tl-year" />
        <div className="tl-track"><i className="tl-line" />
          <ol className="sv-range sv-range-rise tl-items">
            {steps.map((s) => (
              <li key={s.year} style={{ '--sv-from': s.range[0], '--sv-to': s.range[1] }}>
                <b>{s.year}</b><p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Track>
  )
}
// npx scrollvars add timeline-scrub → components/fx/TimelineScrub.tsx (CSS included)`,
  },
  {
    slug: 'sticky-steps',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['pin'], min: '1.13.0' },
    category: 'Sections',
    title: 'Sticky steps',
    tagline: 'Media stays put while the copy scrolls; each step swaps the shot. The product-page pattern, with --sv-scene doing the swapping.',
    when: 'Product features, "how it works", case-study walkthroughs, onboarding explainers.',
    knobs: 'data-sv-scenes (step count), wrapper height (scroll per step), --i on each shot/step, the crossfade math (see CSS)',
    preview: `<style>
.st { height: 300vh; }
.st-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: center; gap: clamp(24px, 5vw, 64px); padding: 0 clamp(20px, 5vw, 64px); }
.st-media { position: relative; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; border: 1px solid var(--line); background: #221f31; display: grid; }
.st-shot { margin: 0; display: grid; place-items: center; font: 800 clamp(48px, 9vw, 110px) var(--mono); color: var(--accent); background: linear-gradient(160deg, #221f31, #17151f 70%); }
.st-shot:nth-child(2) { background: linear-gradient(160deg, #1f2a3a, #17151f 70%); color: #7dd3fc; }
.st-shot:nth-child(3) { background: linear-gradient(160deg, #3a2a1f, #17151f 70%); color: #ffb454; }
/* distance from the active scene, 0..1 (abs() without abs(): max(x, -x)) */
.st-shot, .st-steps > li { --st-d: min(1, max(calc(var(--sv-scene, 0) - var(--i)), calc(var(--i) - var(--sv-scene, 0)))); }
.sv-on .st-shot { position: absolute; inset: 0; opacity: calc(1 - var(--st-d)); scale: calc(1.06 - var(--st-d) * .06); }
@media (prefers-reduced-motion: reduce) { .sv-on .st-shot { position: static; opacity: 1; scale: none; } .st-media { gap: 8px; aspect-ratio: auto; } }   /* no crossfade: the shots stack */
.st-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(20px, 5vh, 44px); text-align: left; }
.st-steps > li { opacity: calc(.3 + .7 * (1 - var(--st-d))); translate: calc(var(--st-d) * -8px) 0; }
.st-steps b { display: block; font: 700 12px var(--mono); letter-spacing: .12em; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; }
.st-steps h4 { margin: 0 0 6px; font-size: clamp(20px, 2.6vw, 28px); }
.st-steps p { margin: 0; color: var(--muted); max-width: 36ch; }
.st-dots { position: absolute; left: 50%; bottom: 18px; translate: -50% 0; display: flex; gap: 8px; }
.st-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line); --st-d: min(1, max(calc(var(--sv-scene, 0) - var(--i)), calc(var(--i) - var(--sv-scene, 0)))); opacity: calc(1 - var(--st-d) * .7); scale: calc(1.6 - var(--st-d) * .6); background: var(--accent); }
html:not(.sv-on) .st-steps > li { opacity: 1; }
@media (max-width: 640px) { .st-grid { grid-template-columns: 1fr; align-content: center; gap: 18px; } .st-steps { gap: 12px; } }
</style>
<div data-sv data-sv-pin data-sv-scenes="3" class="fxouter st">
  <div class="fxsticky st-grid">
    <div class="st-media">
      <figure class="st-shot" style="--i: 0">01</figure>
      <figure class="st-shot" style="--i: 1">02</figure>
      <figure class="st-shot" style="--i: 2">03</figure>
    </div>
    <ol class="st-steps">
      <li style="--i: 0"><b>Step 1</b><h4>Track the section</h4><p>One data-sv-pin wrapper, one sticky child. The driver writes --sv-scene as you scroll.</p></li>
      <li style="--i: 1"><b>Step 2</b><h4>Give each piece an index</h4><p>Shots and steps carry --i. Distance to the scene is one max(). That is the crossfade.</p></li>
      <li style="--i: 2"><b>Step 3</b><h4>Ship it</h4><p>No observers per step, no timeline library. Three scenes here; make it thirty.</p></li>
    </ol>
    <div class="st-dots"><i style="--i: 0"></i><i style="--i: 1"></i><i style="--i: 2"></i></div>
  </div>
</div>`,
    css: `<div data-sv data-sv-pin="300vh" data-sv-scenes="3" class="st">   <!-- --sv-scene: 0..2, eased + snapped; 100vh per scene -->
  <div class="sv-stage st-sticky">
    <div class="st-media">
      <img class="st-shot" style="--i: 0" src="shot-1.jpg" alt="">
      <img class="st-shot" style="--i: 1" src="shot-2.jpg" alt="">
      <img class="st-shot" style="--i: 2" src="shot-3.jpg" alt="">
    </div>
    <ol class="st-steps">
      <li style="--i: 0"><h3>Track the section</h3><p>…</p></li>
      <li style="--i: 1"><h3>Give each piece an index</h3><p>…</p></li>
      <li style="--i: 2"><h3>Ship it</h3><p>…</p></li>
    </ol>
  </div>
</div>

.st-sticky { display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; }   /* sv-stage pins it */
.st-media { position: relative; aspect-ratio: 4 / 3; display: grid; }
/* distance from the active scene, clamped 0..1. Abs() spelled as max(x, -x) for older engines */
.st-shot, .st-steps > li { --st-d: min(1, max(calc(var(--sv-scene, 0) - var(--i)), calc(var(--i) - var(--sv-scene, 0)))); }
.sv-on .st-shot { position: absolute; inset: 0; opacity: calc(1 - var(--st-d)); scale: calc(1.06 - var(--st-d) * .06); }
@media (prefers-reduced-motion: reduce) { .sv-on .st-shot { position: static; opacity: 1; scale: none; } .st-media { gap: 8px; aspect-ratio: auto; } }   /* no crossfade: the shots stack */
.st-steps > li { opacity: calc(.3 + .7 * (1 - var(--st-d))); }
html:not(.sv-on) .st-steps > li { opacity: 1; }                 /* no JS: shots stack, every step readable */`,
    tailwind: `<div data-sv data-sv-pin data-sv-scenes="3" class="relative h-[300vh]">
  <div class="sticky top-0 grid h-screen grid-cols-[1.1fr_1fr] items-center gap-12 px-12">
    <div class="relative grid aspect-[4/3] overflow-hidden rounded-2xl">
      <img class="st-shot [--i:0]" src="shot-1.jpg" alt="">
      <img class="st-shot [--i:1]" src="shot-2.jpg" alt="">
      <img class="st-shot [--i:2]" src="shot-3.jpg" alt="">
    </div>
    <ol class="grid gap-10">
      <li class="[--i:0] [opacity:calc(.3+.7*(1-var(--st-d)))]"><h3>Track the section</h3></li>
      <li class="[--i:1] [opacity:calc(.3+.7*(1-var(--st-d)))]"><h3>Give each piece an index</h3></li>
      <li class="[--i:2] [opacity:calc(.3+.7*(1-var(--st-d)))]"><h3>Ship it</h3></li>
    </ol>
  </div>
</div>
<!-- --st-d and the .st-shot crossfade are 3 lines of global CSS (CSS tab); the math does not fit a class name -->`,
    react: `import { Track } from 'scrollvars/react'

const steps = [
  { title: 'Track the section', text: '…', src: 'shot-1.jpg' },
  { title: 'Give each piece an index', text: '…', src: 'shot-2.jpg' },
  { title: 'Ship it', text: '…', src: 'shot-3.jpg' },
]
function StickySteps() {
  return (
    <Track pin={steps.length * 100 + 'vh'} scenes={steps.length} className="st">
      <div className="sv-stage st-sticky">
        <div className="st-media">
          {steps.map((s, i) => <img key={i} className="st-shot" style={{ '--i': i }} src={s.src} alt="" />)}
        </div>
        <ol className="st-steps">
          {steps.map((s, i) => <li key={i} style={{ '--i': i }}><h3>{s.title}</h3><p>{s.text}</p></li>)}
        </ol>
      </div>
    </Track>
  )
}
// npx scrollvars add sticky-steps → components/fx/StickySteps.tsx (CSS included)`,
  },
  {
    slug: 'stats-countup',
    // what the installed component needs: stylesheets (scrollvars/styles/<x>.css), peer deps, minimum scrollvars
    requires: { styles: ['state'], min: '1.13.0' },
    category: 'Sections',
    title: 'Stats count-up',
    tagline: 'Numbers count from zero when the block enters. CSS counters + a registered property. The transition IS the animation.',
    when: 'Proof strips ("248 sites shipped"), pricing pages, investor-style KPI rows.',
    knobs: '--sv-max per number, --sv-acts-duration (count time), data-suffix ("%", "+", "k"), --sv-acts-count stays 1',
    runway: true,
    preview: `<style>
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin: 0; padding: 10px 0; }
.stats > div { padding: 22px 12px; border-radius: 14px; border: 1px solid var(--line); background: linear-gradient(160deg, #221f31, #17151f 80%); }
.stats dt { order: 2; color: var(--muted); font-size: 13px; margin-top: 8px; }
.stats dd { margin: 0; font: 800 clamp(34px, 6vw, 64px)/1 var(--mono); letter-spacing: -.03em; color: var(--accent); font-variant-numeric: tabular-nums; }
.stats > div { display: flex; flex-direction: column; }
.stats .stat { counter-reset: n calc(var(--sv-act, 1) * var(--sv-max)); }
.stats .stat::after { content: counter(n) attr(data-suffix); }
html:not(.sv-on) .stats .stat { counter-reset: n var(--sv-max); }
@media (max-width: 640px) { .stats { grid-template-columns: 1fr; } }
</style>
<section data-sv data-sv-once class="fxstage sv-acts" style="--sv-acts-count: 1; --sv-acts-duration: 1.8s">
  <dl class="stats">
    <div><dt>client sites shipped</dt><dd class="stat" style="--sv-max: 248" data-suffix="+"></dd></div>
    <div><dt>median Lighthouse performance</dt><dd class="stat" style="--sv-max: 99"></dd></div>
    <div><dt>KB of engine, gzipped</dt><dd class="stat" style="--sv-max: 4"></dd></div>
  </dl>
</section>`,
    css: `<section data-sv data-sv-once class="sv-acts" style="--sv-acts-count: 1; --sv-acts-duration: 1.8s">
  <dl class="stats">
    <div><dt>client sites shipped</dt><dd class="stat" style="--sv-max: 248" data-suffix="+"></dd></div>
    <div><dt>median Lighthouse performance</dt><dd class="stat" style="--sv-max: 99"></dd></div>
  </dl>
</section>

/* sv-acts (styles/state.css) transitions the registered --sv-act 0 → 1 when the
   block goes live; the counter re-renders every frame of that transition. */
.stats .stat { counter-reset: n calc(var(--sv-act, 1) * var(--sv-max)); font-variant-numeric: tabular-nums; }
.stats .stat::after { content: counter(n) attr(data-suffix); }
html:not(.sv-on) .stats .stat { counter-reset: n var(--sv-max); }   /* no JS: final numbers */
/* reduced motion: sv-acts snaps (.01ms) → final numbers, no count. Needs @property (Chrome 85 / FF 128 / Safari 16.4);
   older engines show the final numbers immediately. */`,
    tailwind: `<section data-sv data-sv-once class="sv-acts py-24 [--sv-acts-count:1] [--sv-acts-duration:1.8s]">
  <dl class="grid grid-cols-3 gap-6 text-center">
    <div><dd class="stat font-mono text-6xl font-extrabold tabular-nums text-violet-400 [--sv-max:248]" data-suffix="+"></dd><dt class="text-neutral-400">client sites shipped</dt></div>
    <div><dd class="stat font-mono text-6xl font-extrabold tabular-nums text-violet-400 [--sv-max:99]"></dd><dt class="text-neutral-400">median Lighthouse</dt></div>
  </dl>
</section>
<!-- .stat's counter-reset / ::after are 3 lines of global CSS (CSS tab) -->`,
    react: `import { Track } from 'scrollvars/react'

const stats = [
  { label: 'client sites shipped', max: 248, suffix: '+' },
  { label: 'median Lighthouse performance', max: 99 },
  { label: 'KB of engine, gzipped', max: 4 },
]
function Stats() {
  return (
    <Track once className="sv-acts" style={{ '--sv-acts-count': 1, '--sv-acts-duration': '1.8s' }}>
      <dl className="stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="stat" style={{ '--sv-max': s.max }} data-suffix={s.suffix ?? ''} />
            <dt>{s.label}</dt>
          </div>
        ))}
      </dl>
    </Track>
  )
}
// npx scrollvars add stats-countup → components/fx/StatsCountup.tsx (CSS included)`,
  },
]

export const COMPONENTS = {
  'hero-cinematic': {
    file: 'HeroCinematic.tsx',
    content: `// ScrollVars fx · hero-cinematic
// Requires: npm i scrollvars · import 'scrollvars/styles/core.css' and 'scrollvars/styles/ui.css'
// Split headline rising on a beat, pointer-parallax glow, marquee strip; the block
// fades and scales out as it leaves (--sv-t). The CSS below is the whole section.
'use client'
import * as React from 'react'
import { Track, Split, Marquee, usePointer } from 'scrollvars/react'

const css = \`
.sv-hero { position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; isolation: isolate; text-align: center; }
.sv-hero .hero-orb { position: absolute; width: 52vmin; height: 52vmin; border-radius: 50%; filter: blur(70px); opacity: .5; z-index: -1;
  translate: calc(var(--mx, 0) * var(--hero-parallax, 40px)) calc(var(--my, 0) * var(--hero-parallax, 40px)); transition: translate .5s ease-out; }
.sv-hero .hero-orb.a { background: var(--hero-glow, #a78bfa); top: -14%; left: -8%; }
.sv-hero .hero-orb.b { background: var(--hero-glow-2, #ffb454); bottom: -16%; right: -10%; --hero-parallax: -60px; }
.sv-hero .hero-inner { padding: 60px 24px 90px; --hero-out: clamp(0, (var(--sv-t, .5) - .5) * 2, 1); opacity: calc(1 - var(--hero-out)); scale: calc(1 - var(--hero-out) * .12); }
.sv-hero .hero-eyebrow { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; opacity: .8; }
.sv-hero .hero-title { font-size: clamp(36px, 6.4vw, 78px); line-height: 1.02; letter-spacing: -.03em; max-width: 14ch; margin: 14px auto 18px; font-weight: 800; }
.sv-hero .hero-sub { max-width: 42ch; margin: 0 auto 26px; font-size: 17px; opacity: .75; }
.sv-hero .hero-strip { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 0; border-top: 1px solid rgba(128,128,128,.25); font-size: 13px; letter-spacing: .12em; text-transform: uppercase; opacity: .7; }
.sv-hero .hero-strip span { margin: 0 18px; }
\`

export function HeroCinematic({
  eyebrow,
  title,
  copy,
  cta,
  strip = ['Brand', '·', 'Motion', '·', 'Web', '·', 'Type', '·'],
  className,
}: {
  eyebrow?: string
  /** Plain text: it is split into words on the server, each rising on its own beat. */
  title: string
  copy?: React.ReactNode
  cta?: React.ReactNode
  strip?: string[]
  className?: string
}) {
  const ref = usePointer<HTMLElement>({ selector: '.sv-hero' }) // --mx/--my (-1..1) on the section itself
  return (
    <section ref={ref} className={className ? 'sv-hero ' + className : 'sv-hero'}>
      <style>{css}</style>
      <div className="hero-orb a" />
      <div className="hero-orb b" />
      <Track travel>
        <div className="hero-inner">
          {eyebrow && <p className="hero-eyebrow sv-rise">{eyebrow}</p>}
          <Split as="h1" className="hero-title sv-split-rise">
            {title}
          </Split>
          {copy && (
            <p className="hero-sub sv-rise" style={{ '--sv-order': 6 } as React.CSSProperties}>
              {copy}
            </p>
          )}
          {cta && (
            <p className="sv-rise" style={{ '--sv-order': 7 } as React.CSSProperties}>
              {cta}
            </p>
          )}
        </div>
      </Track>
      <Marquee className="hero-strip">
        {strip.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </Marquee>
    </section>
  )
}
`,
  },
  'timeline-scrub': {
    file: 'TimelineScrub.tsx',
    content: `// ScrollVars fx · timeline-scrub
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (sv-stage, sv-range)
// Pinned: the scroll draws the line, counts the year (a CSS counter) and lights each
// milestone over its own slice of the pin. No JS beyond the driver.
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

const css = \`
.sv-timeline .tl-sticky { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); align-items: center; gap: 40px; padding: 0 clamp(20px, 5vw, 64px); }
.sv-timeline .tl-year { font-size: clamp(64px, 12vw, 150px); line-height: 1; font-weight: 700; letter-spacing: -.04em; font-variant-numeric: tabular-nums;
  counter-reset: tl-year calc(var(--tl-from) + var(--sv-pin, 1) * var(--tl-span)); }
.sv-timeline .tl-year::after { content: counter(tl-year); }
.sv-timeline .tl-cap { display: block; margin-top: 10px; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; opacity: .7; }
.sv-timeline .tl-track { position: relative; padding-left: 34px; }
.sv-timeline .tl-line { position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: rgba(128,128,128,.25); }
.sv-timeline .tl-line::after { content: ""; position: absolute; inset: 0; background: currentColor; transform-origin: top; scale: 1 var(--sv-pin, 1); }
.sv-timeline .tl-items { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(18px, 4vh, 40px); }
.sv-timeline .tl-items > li { position: relative; --sv-distance: 1.6rem; }
.sv-timeline .tl-items > li::before { content: ""; position: absolute; left: -32px; top: 6px; width: 12px; height: 12px; border-radius: 50%;
  background: color-mix(in oklab, currentColor calc(var(--sv-r, 1) * 100%), rgba(128,128,128,.35)); }
.sv-timeline .tl-items b { display: block; font-size: 12px; letter-spacing: .12em; margin-bottom: 4px; }
.sv-timeline .tl-items p { margin: 0; max-width: 34ch; }
@media (max-width: 640px) { .sv-timeline .tl-sticky { grid-template-columns: 1fr; align-content: center; gap: 22px; } }
\`

export interface TimelineStep {
  year: number
  text: React.ReactNode
  /** Slice of the pin (0..1) this milestone animates over; defaults to evenly staggered, overlapping. */
  range?: [number, number]
}

export function TimelineScrub({
  steps,
  caption = 'years of shipping',
  height = '320vh',
  className,
}: {
  steps: TimelineStep[]
  caption?: string
  /** Scroll length of the pinned stretch. */
  height?: string
  className?: string
}) {
  const from = steps[0]?.year ?? 0
  const span = (steps[steps.length - 1]?.year ?? from) - from
  const n = steps.length
  return (
    <Track
      pin={height}
      className={className ? 'sv-timeline ' + className : 'sv-timeline'}
      style={{ '--tl-from': from, '--tl-span': span } as React.CSSProperties}
    >
      <style>{css}</style>
      <div className="sv-stage tl-sticky">
        <div>
          <span className="tl-year" aria-label={String(from + span)} />
          <span className="tl-cap">{caption}</span>
        </div>
        <div className="tl-track">
          <i className="tl-line" />
          <ol className="sv-range sv-range-rise tl-items">
            {steps.map((s, i) => {
              const [a, b] = s.range ?? [i / n, Math.min((i + 1.4) / n, 1)]
              return (
                <li key={s.year} style={{ '--sv-from': a, '--sv-to': b } as React.CSSProperties}>
                  <b>{s.year}</b>
                  <p>{s.text}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </Track>
  )
}
`,
  },
  'sticky-steps': {
    file: 'StickySteps.tsx',
    content: `// ScrollVars fx · sticky-steps
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (sv-stage)
// Media stays put while the copy scrolls; each step swaps the shot. --sv-scene does the
// swapping, the crossfade is one max() per element. Without JS the shots stack in flow.
'use client'
import * as React from 'react'
import { useScenes } from 'scrollvars/react'

const css = \`
.sv-steps .st-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: center; gap: clamp(24px, 5vw, 64px); padding: 0 clamp(20px, 5vw, 64px); }
.sv-steps .st-media { position: relative; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; display: grid; }
.sv-steps .st-shot { margin: 0; display: grid; place-items: center; }
.sv-steps .st-shot > * { width: 100%; height: 100%; object-fit: cover; }
.sv-steps .st-shot, .sv-steps .st-steps > li, .sv-steps .st-dots i {
  --st-d: min(1, max(calc(var(--sv-scene, 0) - var(--i)), calc(var(--i) - var(--sv-scene, 0)))); }
.sv-on .sv-steps .st-shot { position: absolute; inset: 0; opacity: calc(1 - var(--st-d)); scale: calc(1.06 - var(--st-d) * .06); }
@media (prefers-reduced-motion: reduce) { .sv-on .sv-steps .st-shot { position: static; opacity: 1; scale: none; } .sv-steps .st-media { gap: 8px; aspect-ratio: auto; } }
.sv-steps .st-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: clamp(20px, 5vh, 44px); }
.sv-steps .st-steps > li { opacity: calc(.3 + .7 * (1 - var(--st-d))); translate: calc(var(--st-d) * -8px) 0; }
html:not(.sv-on) .sv-steps .st-steps > li { opacity: 1; translate: none; }
.sv-steps .st-steps b { display: block; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
.sv-steps .st-steps h3 { margin: 0 0 6px; font-size: clamp(20px, 2.6vw, 28px); }
.sv-steps .st-steps p { margin: 0; max-width: 36ch; opacity: .75; }
.sv-steps .st-dots { position: absolute; left: 50%; bottom: 18px; translate: -50% 0; display: flex; gap: 8px; }
.sv-steps .st-dots i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: calc(1 - var(--st-d) * .7); scale: calc(1.6 - var(--st-d) * .6); }
@media (max-width: 640px) { .sv-steps .st-grid { grid-template-columns: 1fr; align-content: center; gap: 18px; } }
\`

export interface StickyStep {
  title: React.ReactNode
  text?: React.ReactNode
  /** The shot for this step: an <img>, <video>, or any node. */
  media: React.ReactNode
  label?: string
}

export function StickySteps({ steps, className }: { steps: StickyStep[]; className?: string }) {
  // the active index (integer changes only) makes the inactive shots inert, so a
  // crossfaded shot cannot keep focusable links; applied after mount so the
  // server markup stays fully usable without JS
  const { ref, scene } = useScenes<HTMLDivElement>(steps.length, { pin: steps.length * 100 + 'vh' })
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <div ref={ref} className={className ? 'sv-steps ' + className : 'sv-steps'}>
      <style>{css}</style>
      <div className="sv-stage st-grid">
        <div className="st-media">
          {steps.map((s, i) => (
            <figure
              key={i}
              className="st-shot"
              style={{ '--i': i } as React.CSSProperties}
              inert={mounted && i !== scene ? true : undefined}
              aria-hidden={mounted && i !== scene ? true : undefined}
            >
              {s.media}
            </figure>
          ))}
        </div>
        <ol className="st-steps">
          {steps.map((s, i) => (
            <li key={i} style={{ '--i': i } as React.CSSProperties}>
              <b>{s.label ?? 'Step ' + (i + 1)}</b>
              <h3>{s.title}</h3>
              {s.text && <p>{s.text}</p>}
            </li>
          ))}
        </ol>
        <div className="st-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <i key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  )
}
`,
  },
  'stats-countup': {
    file: 'StatsCountup.tsx',
    content: `// ScrollVars fx · stats-countup
// Requires: npm i scrollvars · import 'scrollvars/styles/state.css' (sv-acts)
// Numbers count from zero when the block enters: a CSS counter driven by the
// registered --sv-act transition. No JS, no innerText. Without JS or under
// reduced motion the final numbers render immediately.
'use client'
import * as React from 'react'
import { Track } from 'scrollvars/react'

const css = \`
.sv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 18px; margin: 0; }
.sv-stats > div { display: flex; flex-direction: column; padding: 22px 12px; border-radius: 14px; border: 1px solid rgba(128,128,128,.25); text-align: center; }
.sv-stats dt { order: 2; font-size: 13px; margin-top: 8px; opacity: .7; }
.sv-stats dd { margin: 0; font-size: clamp(34px, 6vw, 64px); line-height: 1; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.sv-stats .stat { counter-reset: n calc(var(--sv-act, 1) * var(--sv-max)); }
.sv-stats .stat::after { content: counter(n) attr(data-suffix); }
html:not(.sv-on) .sv-stats .stat { counter-reset: n var(--sv-max); }
\`

export interface Stat {
  label: React.ReactNode
  value: number
  suffix?: string
}

export function StatsCountup({
  stats,
  duration = 1.8,
  className,
}: {
  stats: Stat[]
  /** Seconds the count takes. */
  duration?: number
  className?: string
}) {
  return (
    <Track
      once
      className={className ? 'sv-acts ' + className : 'sv-acts'}
      style={{ '--sv-acts-count': 1, '--sv-acts-duration': duration + 's' } as React.CSSProperties}
    >
      <style>{css}</style>
      <dl className="sv-stats">
        {stats.map((s, i) => (
          <div key={i}>
            <dd
              className="stat"
              style={{ '--sv-max': s.value } as React.CSSProperties}
              data-suffix={s.suffix ?? ''}
              aria-label={s.value + (s.suffix ?? '')}
            />
            <dt>{s.label}</dt>
          </div>
        ))}
      </dl>
    </Track>
  )
}
`,
  },
  'sequenced-scrub': {
    file: 'SequencedScrub.tsx',
    content: `// ScrollVars fx · sequenced-scrub
// Requires: npm i scrollvars · import 'scrollvars/styles/pin.css' (layout)
// Each child animates over its own slice of the pin: pass ranges as
// [from, to] pairs (0..1); overlapping ranges are fine: that's the point.
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
  'gsap-scrub': {
    file: 'GsapScrub.tsx',
    content: `// ScrollVars fx · gsap-scrub
// Requires: npm i scrollvars gsap · import 'scrollvars/styles/pin.css'
// Author choreography in GSAP, let ScrollVars drive it: one scroll
// listener, one writer. Never ALSO create a ScrollTrigger for it.
// Honesty: this page pays GSAP's bundle. Adopt per page, not globally.
'use client'
import * as React from 'react'
import gsap from 'gsap'
import { Track } from 'scrollvars/react'

export function GsapScrub({
  children,
  buildTimeline,
  height = '250vh',
  className,
}: {
  children: React.ReactNode
  /** Build and return a PAUSED timeline over the given stage element. */
  buildTimeline: (stage: HTMLDivElement) => gsap.core.Timeline
  height?: string
  className?: string
}) {
  const stage = React.useRef<HTMLDivElement>(null)
  const tl = React.useRef<gsap.core.Timeline>(null)
  React.useEffect(() => {
    if (stage.current) tl.current = buildTimeline(stage.current)
    return () => { tl.current?.kill() }
  }, [buildTimeline])
  return (
    <Track pin onPin={(p) => tl.current?.progress(p)} className={className} style={{ position: 'relative', height }}>
      <div ref={stage} style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', placeItems: 'center' }}>
        {children}
      </div>
    </Track>
  )
}
`,
  },
  'three-scene': {
    file: 'ThreeScene.tsx',
    content: `// ScrollVars fx · three-scene
// Requires: npm i scrollvars three · import 'scrollvars/styles/pin.css'
// The canvas harness owns the lifecycle (DPR, resize, pause offscreen,
// reduced motion, cleanup); Three owns the rendering; scroll feeds progress.
'use client'
import * as React from 'react'
import * as THREE from 'three'
import { Track, useCanvasEffect } from 'scrollvars/react'

export function ThreeScene({ height = '250vh', className }: { height?: string; className?: string }) {
  const progress = React.useRef(0)
  const three = React.useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; mesh: THREE.Mesh }>(null)

  const canvasRef = useCanvasEffect({
    context: null, // WebGL owns the canvas
    setup(fx) {
      const renderer = new THREE.WebGLRenderer({ canvas: fx.canvas, alpha: true, antialias: true })
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.1, 0.34, 160, 24),
        new THREE.MeshNormalMaterial({ wireframe: true })
      )
      scene.add(mesh)
      three.current = { renderer, scene, camera, mesh }
      return () => {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        renderer.dispose()
        three.current = null
      }
    },
    resize(fx) {
      const t = three.current
      if (!t) return
      t.renderer.setPixelRatio(fx.dpr)
      t.renderer.setSize(fx.width, fx.height, false)
      t.camera.aspect = fx.width / fx.height
      t.camera.updateProjectionMatrix()
    },
    frame(fx, dt) {
      const t = three.current
      if (!t) return
      t.mesh.rotation.y += fx.reducedMotion ? 0 : dt * 0.15
      t.mesh.rotation.x = progress.current * Math.PI
      t.camera.position.z = 6 - progress.current * 2.2
      t.renderer.render(t.scene, t.camera)
    },
  })

  return (
    <Track pin onPin={(p) => (progress.current = p)} className={className} style={{ position: 'relative', height }}>
      <div style={{ position: 'sticky', top: 0, display: 'grid', placeItems: 'center', height: '100vh' }}>
        <canvas ref={canvasRef} style={{ width: 'min(90%, 560px)', height: '60vh' }} />
      </div>
    </Track>
  )
}
`,
  },
  'split-reveal': {
    file: 'SplitReveal.tsx',
    content: `// ScrollVars fx · split-reveal
// Requires: npm i scrollvars · import 'scrollvars/styles/core.css' (layout)
// <Split> renders word/char spans on the server: no client splitting,
// no CLS, no hydration flash. The full text stays in a visually-hidden span for AT.
'use client'
import * as React from 'react'
import { Reveal, Split } from 'scrollvars/react'

export function SplitReveal({
  children,
  by = 'word',
  stagger = 60,
  className,
}: {
  children: string
  by?: 'word' | 'char'
  stagger?: number
  className?: string
}) {
  return (
    <Reveal once>
      <Split as="h2" by={by} stagger={stagger} className={className ? \`sv-split-rise \${className}\` : 'sv-split-rise'}>
        {children}
      </Split>
    </Reveal>
  )
}
`,
  },
  'staggered-reveal': {
    file: 'StaggeredReveal.tsx',
    content: `// ScrollVars fx · staggered-reveal
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
    content: `// ScrollVars fx · deck-spread
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
    content: `// ScrollVars fx · curtain
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
    content: `// ScrollVars fx · horizontal-rail
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
    content: `// ScrollVars fx · rotating-words
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
    content: `// ScrollVars fx · pointer-tilt
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
    content: `// ScrollVars fx · coverflow-slider
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
    content: `// ScrollVars fx · marquee
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
