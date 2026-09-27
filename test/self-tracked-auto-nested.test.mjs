import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// D1 (loop8-8): the sv-auto child translate rule had no self-tracked
// exclusion, its twin of PR #117's sv-rise fix. A tracked child of
// sv-auto (`<section data-sv class="sv-auto"><p data-sv>`) translates
// on its OWN --sv-live, the driver measures that moved box and decides
// live from it, feeding back near the exit line (measured 65 flips on
// d0c1829). Both core.css (zero-specificity :where()) and compat's
// fallback sheet (needs the exclusion carried to every override that
// must out-rank the transform rule) now exclude a child that is itself
// .sv or [data-sv], the same shape core.css already uses for sv-rise.

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

test('core.css: the sv-auto child translate rule excludes an element that is itself tracked, at zero added specificity', () => {
  const translate = coreRules.find((r) => r.selector.includes('.sv-auto') && r.body.includes('translate: 0 calc((1 - var(--sv-live))'))
  assert.ok(translate, 'fixture assumption broke: no sv-auto translate rule found')
  assert.match(translate.selector, /\.sv-auto > :not\(\.sv-skip\):where\(:not\(\.sv\):not\(\[data-sv\]\)\)/, 'the exclusion must be wrapped in :where() so it costs no specificity')
})

const compatSource = readFileSync(new URL('../src/compat/index.ts', import.meta.url), 'utf8')
const fallbackAt = compatSource.indexOf('const FALLBACK_CSS')
const fallbackCss = strip(compatSource.slice(compatSource.indexOf('`', fallbackAt) + 1, compatSource.lastIndexOf('`')))
const compatRules = parseRules(fallbackCss)

test('compat: the sv-auto transform rule excludes a child that is itself tracked (.sv or [data-sv])', () => {
  const translate = compatRules.find((r) => r.selector.includes('.sv-auto') && r.body.includes('transform: translateY'))
  assert.ok(translate, 'fixture assumption broke: no sv-auto transform rule found in compat')
  assert.match(translate.selector, /\.sv-auto > :not\(\.sv-skip\):not\(\.sv\):not\(\[data-sv\]\)/, 'the child arm must exclude a self-tracked child')
})

test('compat: every override that must out-rank the sv-auto transform rule carries the same exclusion (specificity parity)', () => {
  const transformRules = compatRules.filter((r) => /transform\s*:\s*none|opacity\s*:\s*1/.test(r.body) && /\.sv\.sv-auto > :not\(\.sv-skip\)/.test(r.selector))
  assert.ok(transformRules.length >= 3, `fixture assumption broke: found only ${transformRules.length} reset rules with a .sv.sv-auto child arm`)
  for (const rule of transformRules) {
    const arm = rule.selector.split(',').map((s) => s.trim()).find((s) => /\.sv\.sv-auto > :not\(\.sv-skip\)/.test(s))
    assert.ok(arm, `no isolatable .sv.sv-auto arm in "${rule.selector}"`)
    assert.match(arm, /\.sv\.sv-auto > :not\(\.sv-skip\):not\(\.sv\):not\(\[data-sv\]\)/, `"${arm}" is missing the :not(.sv):not([data-sv]) exclusion needed to stay ahead of the transform rule`)
  }
})

// Verifier fix on PR #118: the exclusion above also got carried onto these
// same reset rules, which then stopped matching a TRACKED sv-auto child at
// all: the child kept the entrance opacity/transition rule (which has no
// exclusion, on purpose, since fading a self-tracked child is fine) and
// never settled under reduced motion or focus. Each reset rule needs a
// SECOND arm, with no exclusion, that matches a child which IS .sv or
// [data-sv], at specificity high enough to out-rank the entrance rule.
test('compat: every reset rule ALSO carries an unexcluded arm for a tracked sv-auto child (D1 verifier fix)', () => {
  // Plain (non-:is()) twin arms, one for .sv and one for [data-sv]: compat's
  // whole fallback sheet must parse below the :where()/:is() floor
  // (test/compat-motion-switch.test.mjs, test/compat.test.mjs), so the
  // tracked-child arm cannot use :is(.sv, [data-sv]) either.
  const resetRules = compatRules.filter((r) => /transform\s*:\s*none|opacity\s*:\s*1/.test(r.body) && /\.sv\.sv-auto > :not\(\.sv-skip\)/.test(r.selector))
  assert.ok(resetRules.length >= 3, `fixture assumption broke: found only ${resetRules.length} reset rules with a .sv.sv-auto child arm`)
  for (const rule of resetRules) {
    assert.ok(!/:is\(|:where\(/.test(rule.selector), `"${rule.selector}" uses :is()/:where(), below the compat parse floor`)
    assert.match(rule.selector, /\.sv\.sv-auto > \.sv:not\(\.sv-skip\)/, `no unexcluded .sv arm in "${rule.selector}": a tracked (.sv) sv-auto child never gets this reset`)
    assert.match(rule.selector, /\.sv\.sv-auto > \[data-sv\]:not\(\.sv-skip\)/, `no unexcluded [data-sv] arm in "${rule.selector}": a tracked ([data-sv]) sv-auto child never gets this reset`)
  }
})
