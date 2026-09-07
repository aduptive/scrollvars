import assert from 'node:assert/strict'
import { test } from 'node:test'

import { splitPane } from '../demo/bench/harness/installed-gate.mjs'

// The gallery CSS tab is one authored string: markup, a blank line, then the
// CSS a reader pastes. If a reformat of scripts/fx-data.mjs ever collapses
// that blank line, splitPane must fail loudly rather than hand back `markup`
// as nearly the whole pane and `css` as one character (ADU-155 round 3: that
// silent failure made every reduced-motion probe pass on no applied
// stylesheet at all, not on the behavior it claims to check).
test('splitPane: throws when the markup/CSS blank line is missing', () => {
  const collapsed = '<div>hi</div>\n.foo { color: red }'
  assert.throws(() => splitPane(collapsed), /no blank line/)
})

test('splitPane: splits on the first blank line when present', () => {
  const pane = '<div>hi</div>\n\n.foo { color: red }'
  const { markup, css } = splitPane(pane)
  assert.equal(markup, '<div>hi</div>')
  assert.equal(css.trim(), '.foo { color: red }')
})
