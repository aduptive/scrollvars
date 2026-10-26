import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ownership } from '../dist/core/lifetime.js'
import { lifecycleEnv } from './lifecycle-fixture.mjs'

test('style ownership rolls back an important declaration when its replacement throws', () => {
  const env = lifecycleEnv()
  try {
    const el = env.element(), owned = ownership(), set = el.style.setProperty
    const error = Error('replacement failed')
    el.style.setProperty('--x', 'author', 'important')
    el.style.setProperty = (key, value, priority = '') => {
      if (!priority) throw error
      set(key, value, priority)
    }
    assert.throws(() => owned.style(el, '--x', '0.5'), e => e === error)
    owned.restore()
    assert.equal(el.style.getPropertyValue('--x'), 'author')
    assert.equal(el.style.getPropertyPriority('--x'), 'important')
  } finally { env.restore() }
})

test('style ownership restores priorities when CSSOM requires removal before demotion', () => {
  const env = lifecycleEnv()
  try {
    const el = env.element(), owned = ownership(), set = el.style.setProperty
    el.style.setProperty = (key, value, priority = '') => {
      if (el.style.getPropertyPriority(key) === 'important' && priority === '') return
      set(key, value, priority)
    }
    el.style.setProperty('--x', 'author')
    owned.style(el, '--x', '0.75', 'important')
    owned.style(el, '--x', '0.5')
    assert.equal(el.style.getPropertyValue('--x'), '0.5')
    assert.equal(el.style.getPropertyPriority('--x'), '')
    owned.style(el, '--x', '1', 'important')
    owned.restore()
    assert.equal(el.style.getPropertyValue('--x'), 'author')
    assert.equal(el.style.getPropertyPriority('--x'), '')
  } finally { env.restore() }
})

test('style ownership preserves arbitrary values, priority changes and author edits', () => {
  const env = lifecycleEnv()
  try {
    for (const value of ['0', '1', 'important', '"quoted\\value"\nnext', 'calc(1 + var(--x))', '']) {
      for (const priority of ['', 'important']) {
        const el = env.element(), owned = ownership()
        if (value) el.style.setProperty('--x', value, priority)
        owned.style(el, '--x', '0.5', 'important')
        owned.style(el, '--x', '0.75')
        owned.restore()
        assert.equal(el.style.getPropertyValue('--x'), value)
        assert.equal(el.style.getPropertyPriority('--x'), value ? priority : '')
      }
    }
    const el = env.element(), owned = ownership()
    owned.style(el, '--x', '0.5')
    el.style.setProperty('--x', '0.5', 'important')
    owned.style(el, '--x', '0.75')
    owned.restore()
    assert.equal(el.style.getPropertyValue('--x'), '0.5')
    assert.equal(el.style.getPropertyPriority('--x'), 'important')
    owned.style(el, '--x', '1')
    el.style.setProperty('--x', 'author', 'important')
    owned.restore()
    assert.equal(el.style.getPropertyValue('--x'), 'author')
    assert.equal(el.style.getPropertyPriority('--x'), 'important')
  } finally { env.restore() }
})
