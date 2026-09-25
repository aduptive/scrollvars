import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ownership } from '../dist/core/lifetime.js'

function fakeStyle() {
  const values = new Map(), priorities = new Map()
  let writes = 0
  return {
    writes: () => writes,
    getPropertyValue: (key) => values.get(key) ?? '',
    getPropertyPriority: (key) => priorities.get(key) ?? '',
    setProperty(key, value, priority = '') { writes++; values.set(key, value); priorities.set(key, priority) },
    removeProperty(key) { writes++; values.delete(key); priorities.delete(key) },
  }
}

test('ownership().style: repeating the same value skips the DOM write (perf-1 #3a)', () => {
  const owned = ownership()
  const el = { style: fakeStyle() }
  owned.style(el, '--sd', '0.1234')
  assert.equal(el.style.writes(), 1, 'the first write always lands')
  owned.style(el, '--sd', '0.1234')
  assert.equal(el.style.writes(), 1, 'an identical value is not re-written')
  owned.style(el, '--sd', '0.5678')
  assert.equal(el.style.writes(), 2, 'a real change still writes')
})

test('ownership().style: skipping unchanged writes never breaks restore()', () => {
  const owned = ownership()
  const el = { style: fakeStyle() }
  el.style.setProperty('--sd', 'authored', 'important')
  const before = el.style.writes()
  owned.style(el, '--sd', '0.1', '')
  owned.style(el, '--sd', '0.1', '') // repeated, skipped
  owned.style(el, '--sd', '0.2', '') // changes, written
  assert.equal(el.style.writes(), before + 2)
  owned.restore()
  assert.equal(el.style.getPropertyValue('--sd'), 'authored')
  assert.equal(el.style.getPropertyPriority('--sd'), 'important')
})

test('ownership().style: a value someone else set back to ours is not re-written, but still tracked as authored', () => {
  const owned = ownership()
  const el = { style: fakeStyle() }
  owned.style(el, '--sd', '0.1')
  el.style.setProperty('--sd', 'author-override') // an outside write lands
  const before = el.style.writes()
  owned.style(el, '--sd', '0.1') // we write our value again: a real change from the override
  assert.equal(el.style.writes(), before + 1, 'the override made this a real change again, so it writes')
})
