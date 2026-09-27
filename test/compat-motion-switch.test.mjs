import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

// loop8-6 B3 (Astra review): pin.css's page-switch layout release (stage,
// curtains, rail) is written with `:where([data-sv-motion="reduce"])`, so
// the whole rule is dropped on an engine without :where() support, the same
// floor compat's own fallback sheet targets. Below that floor compat reset
// curtains to `transform: none`, their CLOSED position, so switching to
// data-sv-motion="reduce" left them covering the content for good. This
// test parses pin.css's twin block and checks compat's FALLBACK_CSS carries
// a plain (`:where`/`:is`-free) counterpart with the same declarations for
// each subject the fix targets: stage release, curtain hide, rail wrap.
// sv-counter/sv-range/sv-reading are excluded: compat's fallback sheet
// never animates those presets at all (they stay progressive, per its own
// header comment), so there is nothing for a plain twin to override.

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const norm = (s) => s.replace(/\s+/g, ' ').trim()

// Splits a declaration block into a normalized `prop:value` set, order-free.
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
const pinRules = parseRules(pinCss).filter((r) => r.selector.includes('data-sv-motion="reduce"'))

const compatSource = readFileSync(new URL('../src/compat/index.ts', import.meta.url), 'utf8')
const compatAt = compatSource.indexOf('prefers-reduced-motion')
const fallbackCss = strip(
  compatSource.slice(compatSource.lastIndexOf('`', compatAt) + 1, compatSource.indexOf('`', compatAt))
)
const compatRules = parseRules(fallbackCss).filter((r) => r.selector.includes('data-sv-motion="reduce"'))

test('compat fallback sheet: page-switch stage/curtain/rail release has a :where()-free twin', () => {
  const targets = [
    { name: 'stage release', find: '.sv-stage', decls: ['position: static', 'height: auto', 'overflow: visible'] },
    { name: 'curtain hide', find: '.sv-curtain-l', decls: ['display: none'] },
    { name: 'rail wrap', find: '.sv-rail', decls: ['width: auto', 'flex-wrap: wrap'] },
  ]

  for (const { name, find, decls } of targets) {
    const pinRule = pinRules.find((r) => r.selector.includes(find))
    assert.ok(pinRule, `pin.css has no :where() twin mentioning ${find} (fixture assumption broke)`)

    const compatRule = compatRules.find((r) => {
      if (!r.selector.includes(find) || /:where\(|:is\(/.test(r.selector)) return false
      const compatDecls = declSet(r.body)
      return decls.every((decl) => compatDecls.has(decl))
    })
    assert.ok(compatRule, `compat has no :where()/:is()-free twin for ${name} with the same declarations`)
  }

  for (const rule of compatRules) {
    assert.ok(!/:where\(|:is\(/.test(rule.selector), `compat page-switch selector "${rule.selector}" must parse below the :where()/:is() floor`)
  }
})
