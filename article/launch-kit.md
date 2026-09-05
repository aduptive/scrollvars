# Launch kit: fire on publish day

Everything below is ready to copy-paste the day `npm publish` + repo-public
happen. Order: npm out → repo public → Show HN in the morning (US time) →
thread → newsletter pitches same day.

---

## Show HN (news.ycombinator.com/submit)

**Title:** Show HN: Scrollvars – scroll animation via CSS variables, 3.9 KB, benchmarked against GSAP

**URL:** https://scrollvars.dev

**First comment (post immediately after submitting):**

I built this after profiling a client site where scroll values flowed
through React state. A re-render per frame per element. The fix became a
library: one passive scroll listener, one rAF, batched reads then writes,
and the only output is CSS custom properties. The browser animates; JS
steers.

The part I'd like scrutiny on is the benchmark
(https://scrollvars.dev/bench/): identical DOM across engines, an
idiomatic AND a batched-expert GSAP variant, medians of N runs, committed
raw JSON, and a reproducible harness (`npm run measure` in the repo). It
publishes the scenario where it loses, inherited-variable style recalc
grows with subtree depth, and batched GSAP wins deep DOMs. The honest claim
is not "faster frames": it's the same 60fps for ~12× less bundle, a
fraction of the heap, zero React re-renders, and a page that renders
complete without JS.

Scope is deliberately narrow: input-driven animation (scroll, pointer,
gesture). Timelines, springs and exit transitions legitimately belong to
GSAP/Motion. There's a migration table in the docs that says exactly
where each wins.

---

## X/Twitter thread

1/ I kept seeing the same thing in client-site audits: 46 KB of animation
engine to make sections fade in. So I built ScrollVars: scroll animation
via CSS variables. 3.9 KB, zero deps, and the browser does the animating.
https://scrollvars.dev

2/ The model is one sentence: one rAF reads the rects, writes six CSS
variables, and your CSS does the rest. No scroll state in React, ever.
Works in plain HTML, and Next.js server components stay server components.

3/ The benchmark is the part I'm proudest of. Not because it wins, but
because it's honest: identical DOM, an expert-tuned GSAP variant included,
raw JSON committed, one-command reproducible. It even publishes the curve
where GSAP wins (deep DOM style-recalc). https://scrollvars.dev/bench/

4/ It also refuses to be a timeline engine. Scroll choreography ("A over
0–40%, B over 30–70%") is a CSS preset (sv-range). Real timeline work?
Keep GSAP: there's a migration table that tells you where each tool wins.
https://scrollvars.dev/docs/

5/ Copy-paste gallery with Tailwind/CSS/React tabs + a shadcn-style CLI:
`npx scrollvars add staggered-reveal`. And an llms.txt, so your AI
assistant adopts it correctly on the first try.
https://scrollvars.dev/fx/

---

## JavaScript Weekly / Frontend Focus pitch (email)

Subject: ScrollVars: scroll animation via CSS variables (3.9 KB, honestly benchmarked)

Hi: I just released ScrollVars (https://scrollvars.dev), an MIT scroll-
animation engine with an unusual design: the only output is CSS custom
properties, so the browser animates and React never re-renders on scroll.
3.9 KB gzip vs ~46 KB for the incumbents, Next.js RSC-first, and the page
renders complete without JavaScript.

Two things possibly worth your readers' attention beyond the library
itself: a reproducible benchmark that includes an expert-tuned build of the
competitor and publishes the scenario where it loses; and an llms.txt/
AGENTS.md pair aimed at AI-assisted adoption. Happy to answer anything.

---

## dev.to / blog crosspost

Use `article/why-i-built-scrollvars.md` as the body; add the GIF
(https://scrollvars.dev/media/readme.gif) at the top, and close with the
bench + fx links. Canonical URL: scrollvars.dev.

---

## Reddit r/webdev (self-post, not link-post)

Title: I benchmarked my 3.9 KB scroll-animation lib against GSAP and
published where it loses

Body: 2–3 paragraphs from the Show HN comment + links. Reddit rewards the
honesty angle more than the feature list.
