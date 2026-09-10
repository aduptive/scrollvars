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
- Native view() timelines match our semantics exactly and save 5%: the style
  resolution is the cost, not the JavaScript.
- Rejected: precision, partial suppression, tighter culling, dropping an
  unread view clock, direct writes, WAAPI scrubbing, will-change, transform
  shorthand.

## Open, ranked by expected value

1. **Opt-in scoped clocks, shipped properly.** Register `--sv-t`/`--sv-view`
   non-inheriting behind `SV.scopeClocks()` (or a `data-sv-scoped` root
   attribute) and have the shipped presets forward with `--sv-t: inherit` on
   their consumer selectors, so `.sv-drift` and `.sv-range` keep working.
   Document the depth ratio at which it pays. Gate: deep-50 within 10% of the
   forward screen (504ms), main-900 not worse than 5%, every gallery page
   and the home page passing the rendered-output gate, e2e green.
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

(none yet in this file; earlier rounds are in README.md)
