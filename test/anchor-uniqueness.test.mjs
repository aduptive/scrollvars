import assert from 'node:assert/strict'
import { test } from 'node:test'

import { between as docsBetween, stamp, floorRow } from '../scripts/docs-stamp.mjs'
import { between as demoBetween } from '../scripts/demo-sync.mjs'

// ADU-195: a between()-style splice starts its non-greedy match at the
// FIRST occurrence of `before`. If `before` repeats, that first match can
// absorb the other occurrences silently, so the compound match still
// reports "found one". The guard has to count the literal `before` text
// on its own, which is exactly what these fixtures exercise.

test('docs-stamp between(): throws when the leading anchor repeats', () => {
  const text = 'AAA marker one BBB marker two CCC'
  assert.throws(
    () => docsBetween(text, 'marker', ' CCC', 'X', 'fixture label'),
    /fixture label: anchor "marker" is ambiguous, found 2 times/
  )
})

test('docs-stamp between(): splices correctly when the anchor is unique', () => {
  const text = 'AAA START body END BBB'
  const result = docsBetween(text, 'START ', ' END', 'REPLACED', 'fixture label')
  assert.equal(result, 'AAA START REPLACED END BBB')
})

test('docs-stamp between(): still throws, same message shape, when the anchor is missing', () => {
  assert.throws(
    () => docsBetween('no markers here', 'START', 'END', 'x', 'fixture label'),
    /fixture label: anchor text not found, wording moved/
  )
})

test('demo-sync between(): throws when the leading anchor repeats', () => {
  const text = 'AAA marker one BBB marker two CCC'
  assert.throws(
    () => demoBetween(text, 'marker', ' CCC', 'X', 'fixture label'),
    /demo\/index\.html: fixture label, anchor "marker" is ambiguous, found 2 times/
  )
})

test('demo-sync between(): splices correctly when the anchor is unique', () => {
  const text = 'AAA START body END BBB'
  const result = demoBetween(text, 'START ', ' END', 'REPLACED', 'fixture label')
  assert.equal(result, 'AAA START REPLACED END BBB')
})

test('demo-sync between(): still throws, same message shape, when the anchor is missing', () => {
  assert.throws(
    () => demoBetween('no markers here', 'START', 'END', 'x', 'fixture label'),
    /demo\/index\.html: fixture label, anchor text not found/
  )
})

test('stamp(): throws when the start marker repeats', () => {
  const dup = '<!-- x:start -->a<!-- x:end --> ... <!-- x:start -->b<!-- x:end -->'
  assert.throws(() => stamp(dup, 'x', 'NEW'), /x markers ambiguous: "<!-- x:start -->" found 2 times/)
})

test('stamp(): splices correctly when the marker pair is unique', () => {
  const text = 'before <!-- x:start -->old<!-- x:end --> after'
  const result = stamp(text, 'x', 'NEW')
  assert.equal(result, 'before <!-- x:start -->\nNEW\n<!-- x:end --> after')
})

test('floorRow(): throws when the same row shape repeats', () => {
  const dup = '| Chrome / Edge | **100+** (Jan 2020) |\n| Chrome / Edge | **100+** (Jan 2020) |'
  assert.throws(
    () => floorRow(dup, 'Chrome / Edge', '**200+** (Feb 2021)', 'fixture'),
    /fixture: browser floor row for "Chrome \/ Edge" is ambiguous, found 2 times/
  )
})

test('floorRow(): splices correctly when the row is unique', () => {
  const text = '| Chrome / Edge | **100+** (Jan 2020) | notes |'
  const result = floorRow(text, 'Chrome / Edge', '**200+** (Feb 2021)', 'fixture')
  assert.equal(result, '| Chrome / Edge | **200+** (Feb 2021) | notes |')
})

// The uniqueness check must count the WHOLE regex, not the bare label: a
// label that repeats with a different cell shape (the real case is
// demo-sync.mjs's cpuRow/gsapRow, whose "ScrollVars" label also names a row
// in the Lighthouse table with different units) is not ambiguous for this
// splice and must not throw.
test('floorRow(): a repeated label with a non-matching cell shape is not ambiguous', () => {
  const text = '| Chrome / Edge | **100+** (Jan 2020) |\n| Chrome / Edge | not a browser-floor cell at all |'
  const result = floorRow(text, 'Chrome / Edge', '**200+** (Feb 2021)', 'fixture')
  assert.equal(result, '| Chrome / Edge | **200+** (Feb 2021) |\n| Chrome / Edge | not a browser-floor cell at all |')
})
