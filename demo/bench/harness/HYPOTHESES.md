# Performance hypotheses, the queue the research loop works through

Every screen goes through `ab-runner.mjs` and its rendered-output gate. A
timing that did not pass the gate does not exist. Results, positive or
negative, are appended to `README.md` here with the numbers, and the entry
below moves to Done with a one-line verdict. The loop stops when this list
is empty or the deadline passes. Deadline: Friday 2026-09-11, 22:00 BRT.

Baseline facts the loop must not re-derive:
- Flat DOM (main-900) is at parity with gsap-batched (954 against 903ms).
- Deep DOM (deep-50) loses by 49%, and all of it is style recalculation from
  inherited custom properties invalidating large subtrees.
- Narrowing the invalidation (mirror or forward) wins about 60% of that
  recalculation at 52x depth, 8% at the home page's 18.5x, and loses at 1x.
- Native view() timelines: UNTESTED. The 5% screen never applied its variant.
- Rejected: precision, partial suppression, tighter culling, dropping an
  unread view clock, direct writes, WAAPI scrubbing, will-change, transform
  shorthand.

## Open, ranked by expected value

2. **`contain: layout style paint` on tracked elements that are not pinned.**
   Not about inheritance: containment lets Blink skip the subtree in layout
   and paint when only the element's own style changed. Screen on deep-50
   and the home page. Risk: containment changes overflow and stacking.
3. **Trace where the non-style time goes.** On sticky-steps task is 267ms
   with 47ms script and 91ms style; the remaining 130ms is paint, compositing
   and the scroll itself. A CDP trace (`disabled-by-default-devtools.timeline`)
   over one run says whether any of it is ours. If it is all the browser's,
   record that and stop chasing it.
4. **Astra's geometry cache** (its idea 3): cache section document
   coordinates after layout settles and derive viewport positions from
   scrollY, refreshing on resize. Astra's own guess is 0 to 25ms. Screen once
   on main-900; drop if under 5%.
5. **Astra's allocation churn** (its idea 4): reuse the per-frame Map, array
   and geometry records. Guess 0 to 10ms. Screen once; drop if under 5%.
6. **Ask Astra for a fresh list** after 1 to 5 are settled, with everything
   above as the excluded set. Take only ideas outside the invalidation frame.

## Done

- **Opt-in scoped clocks** (`styles/scoped.css`): SHIPPED on
  `perf/page-outputs-cost`. Seven pages behind the hardened gate: deep-50
  -27.5% task, home -10.5%, sticky-steps -12%, case-study-rail noise,
  main-900 +4%, timeline-scrub +7%, hero-cinematic +12%, editorial-manifesto
  +9%. Pays per registered holder, saves per non-inheriting descendant; the
  docs say so with the numbers, the path rule and the fallback clause.
