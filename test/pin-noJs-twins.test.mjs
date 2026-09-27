import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// loop8-7 C3 (Astra review): pin.css's no-JS resets (curtain hide, rail wrap,
// deck unstack, reading/range/counter finished state) are written with
// `:is()`. Firefox 72-77 has individual transforms but no `:is()`, below the
// README floor of Firefox 78: without JS the whole `:is()` list is dropped,
// curtains stay closed, the deck stays stacked and the rail stays offscreen.
// This parses pin.css's `html:not(.sv-on) :is(` rules and checks each has a
// plain (`:is()`/`:where()`-free) twin, same shape as
// compat-motion-switch.test.mjs, with the same declarations.

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const norm = (s) => s.replace(/\s+/g, ' ').trim()

function declSet(body) {
  return new Set(
    norm(body)
      .split(';')
      .map((d) => norm(d))
      .filter(Boolean)
  )
}

function parseRules(css) {
  const rules = []
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selector: norm(m[1]), body: m[2] })
  }
  return rules
}

const pinCss = strip(readFileSync(new URL('../styles/pin.css', import.meta.url), 'utf8'))
const allRules = parseRules(pinCss)
const isRules = allRules.filter((r) => r.selector.includes('html:not(.sv-on) :is('))

test('pin.css: every no-JS html:not(.sv-on) :is( rule has an :is()/:where()-free twin with the same declarations', () => {
  assert.ok(isRules.length > 0, 'fixture assumption broke: no html:not(.sv-on) :is( rules found in pin.css')

  const targets = [
    { name: 'curtain-l hide', find: '.sv-curtain-l', decls: ['display: none'] },
    { name: 'curtain-r hide', find: '.sv-curtain-r', decls: ['display: none'] },
    { name: 'rail reset', find: '.sv-rail', decls: ['translate: none', 'width: auto', 'flex-wrap: wrap'] },
    { name: 'deck unstack', find: '.sv-deck {', decls: ['display: block'] },
    { name: 'deck children reset', find: '.sv-deck > *', decls: ['translate: none', 'rotate: none', 'scale: none'] },
    { name: 'reading finished', find: '.sv-reading > *', decls: ['opacity: 1'] },
    { name: 'range finished', find: '.sv-range > *', decls: ['--sv-r: 1'] },
    { name: 'counter finished', find: '.sv-counter', decls: ['--sv-int: var(--sv-max, 100)'] },
  ]

  for (const { name, find, decls } of targets) {
    const findPlain = find.replace(' {', '')
    const isRule = allRules.find((r) => r.selector.includes('html:not(.sv-on)') && r.selector.includes(':is(') && r.selector.includes(findPlain))
    assert.ok(isRule, `pin.css has no html:not(.sv-on) :is() rule mentioning ${findPlain} (fixture assumption broke)`)

    const twin = allRules.find((r) => {
      if (!r.selector.includes('html:not(.sv-on)') || /:is\(|:where\(/.test(r.selector) || !r.selector.includes(findPlain)) return false
      const twinDecls = declSet(r.body)
      return decls.every((decl) => twinDecls.has(decl))
    })
    assert.ok(twin, `pin.css has no :is()/:where()-free twin for ${name} with the same declarations`)
  }
})
