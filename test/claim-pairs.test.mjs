import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPAT_PRESETS } from '../scripts/docs-data.mjs'

// Some prose claims live in BOTH a shipped source comment (tsc emits it
// verbatim into dist) and README.md. Nothing enforced the two stayed
// equal, and the same pair escaped three times: ADU-159 shipped a false
// sentence to npm through src/compat/index.ts's header, ADU-168's
// narrowing missed the driver's own pin comment, ADU-170's first pass
// missed it again. Each test below extracts the claim from the real
// files and compares it to the code or prose it describes, never to a
// copy hand-typed a third time in here: if the anchor text around a
// claim moves, the match fails with "anchor not found" instead of
// silently comparing nothing.
//
// The compat fallback preset list is not here: it had a THIRD hand-typed
// mirror in scripts/docs-build.mjs, and a pairwise test would have needed
// a third pair. It is stamped from scripts/docs-data.mjs into all three
// surfaces instead (ADU-176), so what is left to check is the data
// against the stylesheet it describes.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const compatSrc = readFileSync(join(root, 'src/compat/index.ts'), 'utf8')
const driverSrc = readFileSync(join(root, 'src/core/driver.ts'), 'utf8')

function extract(text, re, label) {
  const m = text.match(re)
  assert.ok(m, `${label}: anchor text not found, wording moved`)
  return m
}

// Strips `//` and JSDoc ` * ` line markers and backticks, then collapses
// wrapped lines to one space, so a comment split across source lines
// compares equal to README's unwrapped prose.
const norm = (s) => s.replace(/^\s*(?:\/\/|\*)\s?/gm, '').replace(/`/g, '').replace(/\s+/g, ' ').trim()
const uniq = (list) => [...new Set(list)].sort()
const UNIT = /\b(?:px|rem|em|svh|lvh|dvh|vh|vw)\b/g

// COMPAT_PRESETS splits the fallback presets into a "reveal" group and a
// "pin" group, and every surface repeats that split in prose. The split is
// a claim about the stylesheet: the pin group is exactly the presets whose
// fallback rule animates from --sv-pin, which is why the same comment says
// the module marks <html data-sv-compat> and pin.css keeps the stage
// pinned. A member in the wrong group is a wrong claim about which module
// a consumer needs, and every token-set comparison stays green through it.
// ponytail: rules are matched by class name, no CSS parser. The @media
// reduced-motion block resets all of them and declares no var, so it can
// neither satisfy nor break either half.
const FALLBACK_CSS = extract(
  compatSrc,
  /const FALLBACK_CSS = `([\s\S]*?)`\n/,
  'src/compat/index.ts FALLBACK_CSS'
)[1]
const fallbackRules = (cls) =>
  [...FALLBACK_CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, selector]) => new RegExp(`\\.${cls}(?![\\w-])`).test(selector))
    .map(([, , body]) => body)

test('COMPAT_PRESETS groups match the fallback stylesheet: pin presets animate from --sv-pin, reveal presets do not', () => {
  for (const cls of [...COMPAT_PRESETS.reveal, ...COMPAT_PRESETS.pin]) {
    assert.ok(fallbackRules(cls).length > 0, `${cls}: no rule in compat's FALLBACK_CSS`)
  }
  const driven = (cls) => fallbackRules(cls).some((body) => body.includes('var(--sv-pin'))
  assert.deepEqual(COMPAT_PRESETS.pin.filter(driven), COMPAT_PRESETS.pin, 'a pin preset has no --sv-pin rule')
  assert.deepEqual(COMPAT_PRESETS.reveal.filter(driven), [], 'a reveal preset animates from --sv-pin')
})

// The test above only checks the list against the sheet, so a rule added
// for a NEW preset leaves the source comment, README and /docs/ stale with
// everything green. This is the missing inverse: every class the sheet has
// a rule for is either named by COMPAT_PRESETS or on this exception list.
// sv-deck and sv-reading get fallback rules on purpose (static unstacking,
// a no-op opacity reset) but are not entrance/pin presets and carry no
// stamped claim.
const STATE_CLASSES = new Set(['sv', 'sv-on', 'sv-live', 'sv-skip'])
const RULE_EXCEPTIONS = new Set(['sv-deck', 'sv-reading'])

test('every class the fallback stylesheet has a rule for is named by COMPAT_PRESETS or the documented exception', () => {
  // A /* comment */ can carry a stray ".word" (e.g. "pin.css's") that reads
  // as a class to a plain selector scan; strip comments first.
  const noComments = FALLBACK_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  const ruleSelectors = [...noComments.matchAll(/([^{}]+)\{/g)].map(([, selector]) => selector)
  const named = new Set([...COMPAT_PRESETS.reveal, ...COMPAT_PRESETS.pin])
  const found = new Set()
  for (const selector of ruleSelectors) {
    for (const [, cls] of selector.matchAll(/\.([a-z][\w-]*)/g)) {
      if (!STATE_CLASSES.has(cls)) found.add(cls)
    }
  }
  for (const cls of found) {
    assert.ok(
      named.has(cls) || RULE_EXCEPTIONS.has(cls),
      `${cls}: has a fallback rule but is named by neither COMPAT_PRESETS nor the exception list`
    )
  }
})

test('driver pin-helper comment and README pinning paragraph state the same release condition', () => {
  const src = extract(
    driverSrc,
    /tall relative wrapper\);\s*([\s\S]*?), the wrapper stays in flow/,
    'src/core/driver.ts pin helper comment'
  )[1]
  const doc = extract(
    readme,
    /returns to flow without JS, ([\s\S]*?)\. Sticky header\?/,
    'README.md pinning paragraph'
  )[1]
  assert.equal(norm(src), norm(doc))
})

// readPinOffset's own switch is the fact both prose copies describe. A unit
// LIST cannot tell "vh resolves against innerHeight" from "vh resolves
// against innerWidth": every token survives that edit. These read the
// switch and compare the groups, unit to what it resolves against.
function switchGroups() {
  const body = extract(
    driverSrc,
    /switch \(match\?\.\[2\]\?\.toLowerCase\(\)\) \{([\s\S]*?)\n {2}\}/,
    'src/core/driver.ts readPinOffset switch'
  )[1]
  const groups = {}
  let pending = []
  for (const line of body.split('\n')) {
    const label = line.match(/^\s*case '([a-z]+)':/)
    if (label) {
      pending.push(label[1])
      continue
    }
    const ret = line.match(/^\s*return (.+)$/)
    if (!ret || pending.length === 0) continue // `default:` falls through to here
    const target = ret[1].match(
      /window\.inner(?:Height|Width)|document\.documentElement\)\.fontSize|getComputedStyle\(el\)\.fontSize/
    )
    assert.ok(target, `readPinOffset: unknown resolution target in "${ret[1]}"`)
    ;(groups[target[0]] ??= []).push(...pending)
    pending = []
  }
  return groups
}

test('--sv-pin-offset: the driver comment resolves each unit against what readPinOffset resolves it against', () => {
  const groups = switchGroups()
  const fromCode = Object.fromEntries(
    Object.entries(groups)
      .filter(([target]) => target.startsWith('window.'))
      .map(([target, units]) => [target, uniq(units)])
  )
  const comment = norm(
    extract(
      driverSrc,
      /`--sv-pin-offset` as a number of px[\s\S]*?falls back to parseFloat as px\./,
      'src/core/driver.ts readPinOffset comment'
    )[0]
  )
  // "vh/svh/lvh/dvh (window.innerHeight) and vw (window.innerWidth)". Two
  // groups naming one target merge, they do not overwrite each other: the
  // failure then reads as the wrong units, not as a missing group.
  const fromComment = {}
  for (const [, units, target] of comment.matchAll(/([a-z][a-z/]*) \(([^)]+)\)/g)) {
    if (!target.startsWith('window.')) continue
    fromComment[target] = uniq([...(fromComment[target] ?? []), ...units.split('/')])
  }
  assert.deepEqual(fromComment, fromCode)
})

test('--sv-pin-offset: README names the units readPinOffset resolves, and the same vh group', () => {
  const doc = extract(readme, /Only px[\s\S]*?resolve there today/, 'README.md pinning paragraph')[0]
  // px is the fallthrough (`default:`), the only resolved unit with no case
  assert.deepEqual(uniq(doc.match(UNIT) ?? []), uniq(['px', ...Object.values(switchGroups()).flat()]))
  const likeVh = extract(doc, /vh \(([^)]+)\) and vw/, 'README.md vh group')[1]
  assert.deepEqual(uniq(likeVh.match(UNIT) ?? []), uniq(switchGroups()['window.innerHeight']))
})
