import assert from 'node:assert/strict'
import { test } from 'node:test'

import { between as docsBetween, stamp, floorRow, spliceOne as docsSpliceOne } from '../scripts/docs-stamp.mjs'
import { between as demoBetween, spliceOne as demoSpliceOne } from '../scripts/demo-sync.mjs'
import { spliceAll, newerMain } from '../scripts/bench-tables.mjs'
import { spliceStage } from '../scripts/fx-render.mjs'

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

// ADU-196: three `.replace()` calls (docs-stamp.mjs's total size stamp and
// slider size stamp, demo-sync.mjs's version line) ran with NO guard at
// all, the worse half of ADU-195's defect: a plain `.replace()` that
// matches zero times reports success and writes the file back unchanged,
// the old number still on the page. spliceOne() (docs-stamp.mjs and its own
// copy in demo-sync.mjs) closes that: it throws on zero matches exactly
// like the missing-anchor case elsewhere, and on more than one like
// floorRow(). The sweep also found two more unguarded calls in the same
// file (AGENTS.md's two styles import lines), fixed with the same helper.

test('docs-stamp spliceOne(): throws when the pattern is not found', () => {
  assert.throws(
    () => docsSpliceOne('no numbers here', /\d+ KB/, '5 KB', 'fixture label'),
    /^Error: fixture label not found$/
  )
})

test('docs-stamp spliceOne(): throws when the pattern matches more than once', () => {
  assert.throws(
    () => docsSpliceOne('driver 2 KB, core 3 KB', /\d+ KB/, '5 KB', 'fixture label'),
    /^Error: fixture label is ambiguous, found 2 times$/
  )
})

test('docs-stamp spliceOne(): splices correctly when the pattern is unique', () => {
  const result = docsSpliceOne('driver 2 KB total', /\d+ KB/, '5 KB', 'fixture label')
  assert.equal(result, 'driver 5 KB total')
})

test('demo-sync spliceOne(): throws when the pattern is not found', () => {
  assert.throws(
    () => demoSpliceOne('no numbers here', /\d+ KB/, '5 KB', 'fixture label'),
    /^Error: demo\/index\.html: fixture label not found$/
  )
})

test('demo-sync spliceOne(): throws when the pattern matches more than once', () => {
  assert.throws(
    () => demoSpliceOne('driver 2 KB, core 3 KB', /\d+ KB/, '5 KB', 'fixture label'),
    /^Error: demo\/index\.html: fixture label is ambiguous, found 2 times$/
  )
})

test('demo-sync spliceOne(): splices correctly when the pattern is unique', () => {
  const result = demoSpliceOne('driver 2 KB total', /\d+ KB/, '5 KB', 'fixture label')
  assert.equal(result, 'driver 5 KB total')
})

// bench-tables.mjs's runner config splice (the bench page's three per-engine
// bundle-size cells) is the mirror image of spliceOne: a repeated match
// there is the intended shape (all three occurrences are meant to update
// together), so spliceAll() takes its own expected count instead of
// requiring exactly one. The fix-pass defect it exists to close is PARTIAL
// coverage: the old "any count greater than zero" check let one of the
// three matches break (a stray quote, a moved anchor) while the other two
// silently updated and the third was silently left stale, exit 0 either
// way. `count !== matches` (not `matches === 0`) is what catches that.

test('bench-tables spliceAll(): throws when no match is found', () => {
  assert.throws(
    () => spliceAll('no numbers here', /\d+ KB/, '5 KB', 3, 'fixture label'),
    /^Error: fixture label: expected 3 matches, found 0$/
  )
})

test('bench-tables spliceAll(): throws on partial coverage, not only on zero matches', () => {
  assert.throws(
    () => spliceAll('driver 2 KB, core 3 KB', /\d+ KB/, '5 KB', 3, 'fixture label'),
    /^Error: fixture label: expected 3 matches, found 2$/
  )
})

test('bench-tables spliceAll(): replaces every match when the count matches exactly', () => {
  const result = spliceAll('driver 2 KB, core 3 KB', /\d+ KB/, '5 KB', 2, 'fixture label')
  assert.equal(result, 'driver 5 KB, core 5 KB')
})

// fx-render.mjs's sv-stage splice (fix pass, was unconditional): a missing
// anchor is a legitimate no-op for a Section that never renders .sv-stage
// (hero-cinematic, stats-countup), but throws for a pin-based one, which
// ships .sv-stage by contract.

test('fx-render spliceStage(): no-op when the anchor is missing on a non-pin Section', () => {
  const fx = { slug: 'hero-cinematic', requires: { styles: ['core', 'ui'] } }
  const result = spliceStage('<div class="sv-hero">x</div>', fx)
  assert.equal(result, '<div class="sv-hero">x</div>')
})

test('fx-render spliceStage(): throws when the anchor is missing on a pin-based Section', () => {
  const fx = { slug: 'timeline-scrub', requires: { styles: ['pin'] } }
  assert.throws(
    () => spliceStage('<div class="sv-hero">x</div>', fx),
    /^Error: timeline-scrub: pin-based Section preview lost its \.sv-stage$/
  )
})

test('fx-render spliceStage(): splices the fxsticky class when the anchor is present', () => {
  const fx = { slug: 'timeline-scrub', requires: { styles: ['pin'] } }
  const result = spliceStage('<div class="sv-stage">x</div>', fx)
  assert.equal(result, '<div class="sv-stage fxsticky">x</div>')
})


test('bench main refresh uses its own snapshot, while a later full run wins', () => {
  const full = { meta: { date: '2026-09-08T00:00:00Z' } }
  const main = { meta: { date: '2026-09-09T00:00:00Z', throttle: 1 }, scenarios: [{ name: 'main-900' }] }
  assert.equal(newerMain(full, main), main)
  assert.equal(newerMain(full, null), full)
  assert.equal(newerMain(full, { ...main, scenarios: [] }), full)
  assert.equal(newerMain(full, { ...main, meta: { ...main.meta, throttle: 4 } }), full)
  assert.equal(newerMain({ ...full, meta: { date: '2026-09-10T00:00:00Z' } }, main).meta.date, '2026-09-10T00:00:00Z')
})
