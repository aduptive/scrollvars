import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// A1/A4 (loop8-5 review): a self-tracked entrance (the tracked element IS
// the preset, e.g. `<pre data-sv class="sv-rise">`, no separate ancestor)
// matches the compound `:is(.sv, [data-sv]):is(...)` shape #108 added to the
// entrance rules, but the two reduced-motion overrides (the OS media query
// and its html[data-sv-motion="reduce"] twin) only listed the descendant
// shape, so a self-tracked entrance stayed hidden and animated under
// reduce. Same gap for `sv-split-rise`: only the descendant selector
// existed at all, entrance included, so a self-tracked split heading never
// animated even at normal motion.

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const norm = (s) => s.replace(/\s+/g, ' ').trim()

// Splits a selector list on its top-level commas only: a comma inside
// :is(.sv, [data-sv]) belongs to that selector (CLAUDE.md ADU-243).
const splitTop = (list) => {
  const out = []
  let depth = 0, start = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++
    else if (list[i] === ')') depth--
    else if (list[i] === ',' && depth === 0) { out.push(list.slice(start, i)); start = i + 1 }
  }
  out.push(list.slice(start))
  return out.map((s) => norm(s)).filter(Boolean)
}

// Walks a stylesheet once. Every top-level rule is tagged by mechanism:
// 'media' for a rule inside `@media (prefers-reduced-motion: reduce)`,
// 'attr' for a top-level rule whose selector list carries the
// data-sv-motion="reduce" twin, 'plain' for everything else (the entrance
// rules themselves).
const parse = (css) => {
  const rules = []
  let i = 0
  const readBlock = (from) => {
    let depth = 0
    for (let j = from; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}' && --depth === 0) return [css.slice(from + 1, j), j + 1]
    }
    throw Error('unbalanced braces')
  }
  const rulesOf = (body, mechanism) => {
    for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      rules.push({ selectors: splitTop(m[1]), body: norm(m[2]), mechanism })
    }
  }
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) break
    const head = css.slice(i, open)
    const [content, next] = readBlock(open)
    if (/^\s*@media[^{]*prefers-reduced-motion:\s*reduce/.test(head)) {
      rulesOf(content, 'media')
    } else if (/^\s*@/.test(head)) {
      // other at-rules are not relevant here
    } else {
      const selectors = splitTop(head)
      const mechanism = selectors.some((s) => s.includes('data-sv-motion="reduce"')) ? 'attr' : 'plain'
      rules.push({ selectors, body: norm(content), mechanism })
    }
    i = next
  }
  return rules
}

const hasReset = (rules, mechanism, selector) =>
  rules.some((r) => r.mechanism === mechanism && r.selectors.includes(norm(selector))
    && /opacity:\s*1/.test(r.body) && /(translate|transform):\s*none/.test(r.body))

const hasEntrance = (rules, selector, prop) =>
  rules.some((r) => r.mechanism === 'plain' && r.selectors.includes(norm(selector)) && r.body.includes(prop))

test('core.css: self-tracked entrances are at rest under both reduce controls', () => {
  const css = strip(readFileSync(new URL('../styles/core.css', import.meta.url), 'utf8'))
  const rules = parse(css)

  const selfEntrance = '.sv-on :is(.sv, [data-sv]):is(.sv-rise, .sv-fade, .sv-slide-l, .sv-slide-r, .sv-drift)'
  assert.ok(hasReset(rules, 'media', selfEntrance), 'media reduce block misses the self-tracked compound selector')
  assert.ok(hasReset(rules, 'attr', `.sv-on:where([data-sv-motion="reduce"]) :is(.sv, [data-sv]):is(.sv-rise, .sv-fade, .sv-slide-l, .sv-slide-r, .sv-drift)`), 'data-sv-motion twin misses the self-tracked compound selector')

  const selfSplit = '.sv-on :is(.sv, [data-sv]).sv-split-rise > span'
  assert.ok(hasReset(rules, 'media', selfSplit), 'media reduce block misses self-tracked sv-split-rise')
  assert.ok(hasReset(rules, 'attr', `.sv-on:where([data-sv-motion="reduce"]) :is(.sv, [data-sv]).sv-split-rise > span`), 'data-sv-motion twin misses self-tracked sv-split-rise')

  // A4: the self-tracked split entrance must animate at all, not just rest under reduce.
  assert.ok(hasEntrance(rules, selfSplit, 'opacity: var(--sv-live)'), 'a self-tracked sv-split-rise heading never animates')

  // B4 (loop8-6): a self-tracked sv-spread-in (the tracker IS the spread) must
  // both scrub from --sv-live and rest under both reduce controls, same gap.
  // Spread has no opacity output, so hasReset's opacity check does not apply:
  // check translate/rotate: none directly.
  const spreadAtRest = (mechanism, selector) =>
    rules.some((r) => r.mechanism === mechanism && r.selectors.includes(norm(selector))
      && /translate:\s*none/.test(r.body) && /rotate:\s*none/.test(r.body))

  const selfSpread = '.sv-on :is(.sv, [data-sv]).sv-spread.sv-spread-in > *'
  assert.ok(hasEntrance(rules, selfSpread, '--sv-spread: var(--sv-live)'), 'a self-tracked sv-spread-in never scrubs from --sv-live')
  assert.ok(hasEntrance(rules, '.sv-on .sv.sv-spread.sv-spread-in > *', 'transition:'), 'a self-tracked sv-spread-in never gets the transition twin')
  assert.ok(spreadAtRest('media', '.sv-on .sv.sv-spread.sv-spread-in > *'), 'media reduce block misses self-tracked sv-spread-in')
  assert.ok(spreadAtRest('attr', '.sv-on:where([data-sv-motion="reduce"]) .sv.sv-spread.sv-spread-in > *'), 'data-sv-motion twin misses self-tracked sv-spread-in')
})

test('compat fallback sheet: self-tracked entrances are at rest under both reduce controls', () => {
  const source = readFileSync(new URL('../src/compat/index.ts', import.meta.url), 'utf8')
  const at = source.indexOf('prefers-reduced-motion')
  const css = strip(source.slice(source.lastIndexOf('`', at) + 1, source.indexOf('`', at)))
  const rules = parse(css)

  for (const preset of ['sv-rise', 'sv-fade', 'sv-slide-l', 'sv-slide-r']) {
    assert.ok(hasReset(rules, 'media', `.sv-on .sv.${preset}`), `compat media reduce block misses the self-tracked .sv.${preset}`)
    assert.ok(hasReset(rules, 'attr', `.sv-on[data-sv-motion="reduce"] .sv.${preset}`), `compat data-sv-motion twin misses the self-tracked .sv.${preset}`)
  }
})
