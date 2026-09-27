import test from 'node:test'
import assert from 'node:assert/strict'
import { EFFECTS } from '../scripts/fx-data.mjs'

// A3 (loop8-5 review): the staggered-reveal and split-reveal CSS panes paste
// core.css's entrance preset for a copy-paste consumer, but skipped the
// :focus-within override that makes a focused entrance child visible at once
// (WCAG 2.4.7, styles/core.css:229-237). Anyone using only the pasted CSS
// left a focused item waiting out its stagger delay. Every pane that pastes
// an entrance hide rule (`opacity: var(--sv-live)`) must carry a matching
// :focus-within rule, placed AFTER the reduce blocks (same source-order
// rule the reduce blocks themselves depend on).

const find = (slug) => EFFECTS.find((fx) => fx.slug === slug)

test('staggered-reveal CSS pane carries the :focus-within override after its reduce blocks', () => {
  const css = find('staggered-reveal').css
  const hideAt = css.indexOf('opacity: var(--sv-live)')
  assert.ok(hideAt >= 0, 'the pane no longer pastes the entrance hide rule; update this test')
  const lastReduceAt = css.lastIndexOf('prefers-reduced-motion')
  assert.ok(lastReduceAt > hideAt, 'the pane no longer carries the reduce blocks; update this test')
  const focusAt = css.indexOf('.sv-rise:focus-within')
  assert.ok(focusAt > lastReduceAt, 'no :focus-within override for .sv-rise placed after the reduce blocks')
  assert.match(css.slice(focusAt), /\.sv-rise:focus-within\s*\{[^}]*opacity:\s*1;[^}]*translate:\s*none;/)
})

test('split-reveal CSS pane carries the :focus-within override after its reduce blocks', () => {
  const css = find('split-reveal').css
  const hideAt = css.indexOf('opacity: var(--sv-live)')
  assert.ok(hideAt >= 0, 'the pane no longer pastes the entrance hide rule; update this test')
  const lastReduceAt = css.lastIndexOf('prefers-reduced-motion')
  assert.ok(lastReduceAt > hideAt, 'the pane no longer carries the reduce blocks; update this test')
  const focusAt = css.indexOf('.sv-split-rise:focus-within > span')
  assert.ok(focusAt > lastReduceAt, 'no :focus-within override for .sv-split-rise placed after the reduce blocks')
  assert.match(css.slice(focusAt), /\.sv-split-rise:focus-within > span\s*\{[^}]*opacity:\s*1;[^}]*translate:\s*none;/)
})
