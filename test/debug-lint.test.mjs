import assert from 'node:assert/strict'
import { test } from 'node:test'

import { lintDeclaration, scanCssText, stripComments } from '../dist/debug/lint.js'

test('lintDeclaration: direct read into a non-compositable property flags', () => {
  const violation = lintDeclaration('.hero', 'width', 'var(--sv-t)')
  assert.ok(violation)
  assert.equal(violation.selector, '.hero')
  assert.equal(violation.property, 'width')
})

test('lintDeclaration: indirect read through a custom property flags', () => {
  const props = new Map([['--x', ['calc(var(--sv-view) * 10px)']]])
  const violation = lintDeclaration('.hero', 'margin-top', 'var(--x)', props)
  assert.ok(violation)
})

test('lintDeclaration: an ambiguous name (more than one candidate value) flags if any candidate reads --sv-*', () => {
  const props = new Map([['--x', ['10px', 'var(--sv-t)']]])
  const violation = lintDeclaration('.hero', 'width', 'var(--x)', props)
  assert.ok(violation)
})

test('lintDeclaration: an ambiguous name flags nothing when NO candidate reads --sv-*', () => {
  const props = new Map([['--x', ['10px', '20px']]])
  assert.equal(lintDeclaration('.hero', 'width', 'var(--x)', props), null)
})

test('lintDeclaration: transform is compositable, never flags even with a --sv-* read', () => {
  assert.equal(lintDeclaration('.hero', 'transform', 'translateY(calc(var(--sv-t) * 1px))'), null)
})

test('lintDeclaration: --sv-viewx is an author-defined name, not the engine\'s --sv-view (bounded matching, ADU-198)', () => {
  // A substring check like value.includes('--sv-v') would also match
  // "--sv-viewx" and flag someone's own custom property; the matcher checks
  // the whole captured identifier against the known engine outputs instead.
  assert.equal(lintDeclaration('.hero', 'width', 'var(--sv-viewx)'), null)
})

test('lintDeclaration: no property reading a --sv-* value at all', () => {
  assert.equal(lintDeclaration('.hero', 'width', '10px'), null)
})

test('stripComments removes /* */ blocks', () => {
  assert.equal(stripComments('.a { width: 1px; /* var(--sv-t) */ }'), '.a { width: 1px;  }')
})

test('scanCssText: a --sv-* reference living only in a comment is not a violation', () => {
  const css = '/* uses var(--sv-t) somewhere else */\n.hero { width: 10px; }'
  assert.deepEqual(scanCssText(css), [])
})

test('scanCssText: a real violation is reported with selector, property and a reason', () => {
  const css = '.hero { top: var(--sv-t); }'
  const violations = scanCssText(css)
  assert.equal(violations.length, 1)
  assert.equal(violations[0].selector, '.hero')
  assert.equal(violations[0].property, 'top')
  assert.match(violations[0].reason, /--sv-t/)
})

test('scanCssText: transform stays clean even mixed with a real violation in the same file', () => {
  const css = '.hero { transform: translateY(calc(var(--sv-t) * 1px)); } .hero { height: var(--sv-t); }'
  const violations = scanCssText(css)
  assert.equal(violations.length, 1)
  assert.equal(violations[0].property, 'height')
})

// Review finding: a custom-property indirection map that is global BY NAME
// (not scoped to the rule that declares it) missed .a's violation, or
// falsely resolved it to .b's value, depending on which rule the scanner
// happened to visit last. Proved in both source orders.
test('scanCssText: a same-rule custom property resolves to ITS OWN value, not another rule\'s later redeclaration', () => {
  const css = '.a { --x: var(--sv-t); width: var(--x); } .b { --x: 10px; }'
  const violations = scanCssText(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].selector, '.a')
  assert.equal(violations[0].property, 'width')
})

test('scanCssText: the same case with the unrelated rule declared FIRST still resolves .a to its own value', () => {
  const css = '.b { --x: 10px; } .a { --x: var(--sv-t); width: var(--x); }'
  const violations = scanCssText(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].selector, '.a')
  assert.equal(violations[0].property, 'width')
})
