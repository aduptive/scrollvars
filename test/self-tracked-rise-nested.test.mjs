import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// Verifier fix on PR #117: a self-tracked sv-rise NESTED inside another
// tracker (`<div data-sv><p data-sv class="sv-rise">`, the guide's own
// zero-wrapper example shape) still flickered: the descendant selector
// `.sv-on :is(.sv, [data-sv]) .sv-rise` only cares that SOME ancestor is
// tracked, not that the .sv-rise element itself is untracked, so it still
// translated the inner <p>, and the driver measures that same (now-moved)
// box. Both the translating rule and every override that must out-rank it
// (compat's reduce block, data-sv-motion twin and :focus-within override)
// now exclude an element that is itself .sv or [data-sv]. core.css uses
// :where() so the exclusion costs no specificity there; compat cannot (it
// targets engines below the :where()/:is() floor), so its matching
// overrides carry the same exclusion to stay ahead in the cascade.

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const norm = (s) => s.replace(/\s+/g, ' ').trim()

function parseRules(css) {
  const rules = []
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selector: norm(m[1]), body: m[2] })
  }
  return rules
}

const coreCss = strip(readFileSync(new URL('../styles/core.css', import.meta.url), 'utf8'))
const coreRules = parseRules(coreCss)

test('core.css: the sv-rise translate rule excludes an element that is itself tracked, at zero added specificity', () => {
  const translate = coreRules.find((r) => r.selector.includes('.sv-rise') && r.body.includes('translate: 0 calc((1 - var(--sv-live))'))
  assert.ok(translate, 'fixture assumption broke: no sv-rise translate rule found')
  assert.match(translate.selector, /\.sv-rise:where\(:not\(\.sv\):not\(\[data-sv\]\)\)/, 'the exclusion must be wrapped in :where() so it costs no specificity')
})

const compatSource = readFileSync(new URL('../src/compat/index.ts', import.meta.url), 'utf8')
const fallbackAt = compatSource.indexOf('const FALLBACK_CSS')
const fallbackCss = strip(compatSource.slice(compatSource.indexOf('`', fallbackAt) + 1, compatSource.lastIndexOf('`')))
const compatRules = parseRules(fallbackCss)

test('compat: the sv-rise transform rule excludes an element that is itself tracked (.sv or [data-sv])', () => {
  const translate = compatRules.find((r) => r.selector.includes('.sv-rise') && r.body.includes('transform: translateY'))
  assert.ok(translate, 'fixture assumption broke: no sv-rise transform rule found in compat')
  assert.match(translate.selector, /\.sv-on \.sv \.sv-rise:not\(\.sv\):not\(\[data-sv\]\)/, 'the descendant arm must exclude a self-tracked sv-rise')
})

test('compat: every override that must out-rank the sv-rise transform rule carries the same exclusion (specificity parity)', () => {
  // the shared reduce block (transform: none), the data-sv-motion twin and
  // the :focus-within override each declare a `.sv .sv-rise` descendant
  // arm that sets `transform`, so each must carry the same
  // :not(.sv):not([data-sv]) exclusion the translateY rule gained, or the
  // translateY rule (now with two extra :not() clauses of its own) would
  // out-specify them for the ordinary (non-self-tracked) nested case. The
  // opacity-only rule is exempt: it is not in specificity conflict with
  // the translateY rule (different property, and self-tracked sv-rise is
  // meant to keep fading).
  const transformRules = compatRules.filter((r) => /transform\s*:/.test(r.body) && /(^|,)\s*[^,]*\.sv \.sv-rise\b/.test(r.selector))
  assert.ok(transformRules.length >= 3, `fixture assumption broke: found only ${transformRules.length} transform-bearing rules with a .sv .sv-rise descendant arm`)
  for (const rule of transformRules) {
    const arm = rule.selector.split(',').map((s) => s.trim()).find((s) => /\.sv \.sv-rise\b/.test(s) && !/\.sv \.sv-fade\b/.test(s))
    assert.ok(arm, `no isolatable .sv .sv-rise arm in "${rule.selector}"`)
    assert.match(arm, /\.sv \.sv-rise:not\(\.sv\):not\(\[data-sv\]\)/, `"${arm}" is missing the :not(.sv):not([data-sv]) exclusion needed to stay ahead of the translateY rule`)
  }
})
