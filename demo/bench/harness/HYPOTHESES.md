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

6. **Ask Astra for a fresh list** after 1 to 5 are settled, with everything
   above as the excluded set. Take only ideas outside the invalidation frame.

## Done

- **Opt-in scoped clocks** (`styles/scoped.css`): SHIPPED on
  `perf/page-outputs-cost`. Seven pages behind the hardened gate: deep-50
  -27.5% task, home -10.5%, sticky-steps -12%, case-study-rail noise,
  main-900 +4%, timeline-scrub +7%, hero-cinematic +12%, editorial-manifesto
  +9%. Pays per registered holder, saves per non-inheriting descendant; the
  docs say so with the numbers, the path rule and the fallback clause.
- **Containment on tracked elements**: REJECTED. deep-50 800 against 783.5ms,
  noise. Containment does not touch style resolution, which is the cost.
- **Trace of the non-style time**: SETTLED. sticky-steps: style 24%, our JS
  22%, frame production 23%, scroll event 6%, scheduler 23%. deep-50: style
  36%, Layerize 15%, scheduler 15%, JS 9%. The remainder is what any engine
  pays to scroll; style is the whole of the gap to GSAP.
- **Geometry cache, allocation reuse** (Astra 3 and 4): DROPPED by their own
  5% threshold. The entire JS slice is 9% on the losing profile.
