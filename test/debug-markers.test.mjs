import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pinLines, readBand, travelLines } from '../dist/debug/markers.js'

test('readBand: an explicit data-sv-enter="0" is a valid band, not "unset" (0 is falsy but finite)', () => {
  assert.equal(readBand('0', 0.75), 0)
  assert.equal(readBand('0.25', 0.75), 0.25)
})

test('readBand: an unset or unparsable attribute falls back', () => {
  assert.equal(readBand(undefined, 0.75), 0.75)
  assert.equal(readBand('', 0.75), 0.75)
  assert.equal(readBand('nope', 0.75), 0.75)
})

test('travelLines: enter line sits above the element by vp * enter, exit line is the element bottom', () => {
  const geo = { top: 100, bottom: 300 }
  const lines = travelLines(geo, /* scrollY */ 1000, /* vp */ 800, 0.75, 0.25)
  // enter = pageTop - vp*enter = (100+1000) - 600 = 500
  assert.equal(lines.enter, 500)
  // exit = pageBottom = 300+1000
  assert.equal(lines.exit, 1300)
})

test('travelLines: a taller enter fraction pushes the enter line further up the page', () => {
  const geo = { top: 100, bottom: 300 }
  const shallow = travelLines(geo, 1000, 800, 0.5, 0.25)
  const deep = travelLines(geo, 1000, 800, 0.9, 0.25)
  assert.ok(deep.enter < shallow.enter)
})

test('travelLines: default enter/exit match the driver constants (0.75/0.25)', () => {
  const geo = { top: 0, bottom: 0 }
  const lines = travelLines(geo, 0, 800)
  assert.equal(lines.enter, -600)
})

test('pinLines: start sits at the wrapper top minus the pin offset', () => {
  const geo = { wrapperTop: 200, wrapperHeight: 2000, stageHeight: 600 }
  const lines = pinLines(geo, /* scrollY */ 500, /* offset */ 80)
  // pageTop = 200 + 500 = 700; start = 700 - 80 = 620
  assert.equal(lines.start, 620)
  // span = wrapperHeight - stageHeight = 1400; end = start + span
  assert.equal(lines.end, 2020)
})

test('pinLines: span never goes below 1px even for a stage taller than the wrapper', () => {
  const geo = { wrapperTop: 0, wrapperHeight: 100, stageHeight: 900 }
  const lines = pinLines(geo, 0, 0)
  assert.equal(lines.end - lines.start, 1)
})
