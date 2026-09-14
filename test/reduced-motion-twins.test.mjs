import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

// Every `@media (prefers-reduced-motion: reduce)` block in the shipped
// stylesheets has a twin that applies under `html[data-sv-motion="reduce"]`,
// the page's own switch (core/motion.ts). The twin carries the same rules
// with the same declarations; only the selectors gain the attribute, wrapped
// in :where() so specificity and source order stay exactly what the media
// block relies on. This derives both from the files, so a reduced-motion rule
// added without its twin fails here instead of on a user's toggle.

const root = new URL('../styles/', import.meta.url)
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const norm = (s) => s.replace(/\s+/g, ' ').trim()

// Walks the sheet once: top-level rules, and the rules inside every @media
// block whose query names the preference (a query may combine it with
// others, as tilt.css does with hover: none).
const parse = (css) => {
  const top = [], reduced = []
  let lastReducedEnd = -1
  let i = 0
  const readBlock = (from) => { // from points at '{'; returns [content, indexAfterClose]
    let depth = 0
    for (let j = from; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}' && --depth === 0) return [css.slice(from + 1, j), j + 1]
    }
    throw Error('unbalanced braces')
  }
  const rulesOf = (body) => [...body.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [norm(m[1]), norm(m[2])])
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) break
    const head = css.slice(i, open)
    const [content, next] = readBlock(open)
    if (/^\s*@/.test(head)) {
      if (/@media[^{]*prefers-reduced-motion:\s*reduce/.test(head)) { reduced.push(...rulesOf(content)); lastReducedEnd = next }
      // other at-rules (@supports, other @media) are not top level for this test
    } else top.push([norm(head), norm(content), i])
    i = next
  }
  return { top, reduced, lastReducedEnd }
}

// The twin of a selector: the attribute lives on <html>, so a selector that
// already starts on <html> (.sv-on) compounds with it; any other gets it as
// an ancestor. :where() keeps specificity untouched.
// Split a selector list on its top-level commas only: the ones inside
// :is(.sv, [data-sv]) belong to that selector (the first version of this
// split every comma and the generator made the same mistake, so the test
// was green on garbage; a twin is checked in a browser too, e2e).
const splitTop = (list) => {
  const out = []
  let depth = 0, start = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++
    else if (list[i] === ')') depth--
    else if (list[i] === ',' && depth === 0) { out.push(list.slice(start, i)); start = i + 1 }
  }
  out.push(list.slice(start))
  return out.map((s) => s.trim()).filter(Boolean)
}
export const twin = (selector, where = true) => {
  const attr = where ? ':where([data-sv-motion="reduce"])' : '[data-sv-motion="reduce"]'
  return splitTop(selector).map((s) => s.startsWith('.sv-on') ? `.sv-on${attr}${s.slice(6)}` : `${attr} ${s}`).join(', ')
}

const sheets = readdirSync(root).filter((f) => f.endsWith('.css')).map((f) => [f, strip(readFileSync(new URL(f, root), 'utf8'))])

test('every reduced-motion block in styles/*.css has its data-sv-motion twin', () => {
  let checked = 0
  for (const [file, css] of sheets) {
    const { top, reduced, lastReducedEnd } = parse(css)
    for (const [selector, body] of reduced) {
      checked++
      const expected = norm(twin(selector))
      const found = top.find(([sel]) => norm(sel) === expected)
      assert.ok(found, `${file}: no twin rule "${expected}" for the reduced-motion rule "${selector}"`)
      assert.equal(found[1], body, `${file}: the twin of "${selector}" carries different declarations`)
      // :where() keeps the twin at the media rule's specificity, so it wins
      // the way that rule does: by coming later in the source than what it
      // overrides. A twin moved above the block loses (review, ADU-243).
      assert.ok(found[2] >= lastReducedEnd, `${file}: the twin of "${selector}" sits before the reduced-motion block; it has to come after it`)
    }
  }
  assert.ok(checked >= 10, `the derivation found only ${checked} reduced-motion rules: it is broken, not the sheets`)
})

// The site's own CSS: the gallery effects (scripts/fx-data.mjs, panes and
// installed components in template literals) and the home page. Markup and
// CSS share those files, so the reduced-motion blocks are found by brace
// matching in the raw text and each twin rule is searched for, normalized,
// after the block it mirrors.
test('the gallery effects and the home page carry a twin for every reduced-motion rule', () => {
  const files = ['../scripts/fx-data.mjs', '../demo/index.html']
  let checked = 0
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8')
    const re = /@media \(prefers-reduced-motion: reduce\)[^{]*\{/g
    let m
    while ((m = re.exec(text))) {
      let depth = 0, end = -1
      for (let k = m.index + m[0].length - 1; k < text.length; k++) {
        if (text[k] === '{') depth++
        else if (text[k] === '}' && --depth === 0) { end = k + 1; break }
      }
      assert.ok(end > 0, `${file}: unbalanced reduced-motion block at ${m.index}`)
      const after = norm(strip(text.slice(end)))
      for (const [selector, body] of [...strip(text.slice(m.index + m[0].length, end - 1)).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((r) => [norm(r[1]), norm(r[2])])) {
        checked++
        const expected = norm(`${twin(selector)} { ${body.split(';').map((d) => d.trim()).filter(Boolean).map((d) => d + ';').join(' ')} }`)
        assert.ok(after.includes(expected), `${file}: no twin after the block for "${selector}" (expected "${expected.slice(0, 120)}")`)
      }
      re.lastIndex = end
    }
  }
  assert.ok(checked >= 30, `the derivation found only ${checked} rules in the site's reduced-motion blocks: it is broken, not the site`)
})

test('the compat fallback sheet carries the twin too, without :where() for the engines it serves', () => {
  const source = readFileSync(new URL('../src/compat/index.ts', import.meta.url), 'utf8')
  // the template literal that holds the sheet: the nearest backticks around
  // the media query, since the module has other literals with braces
  const at = source.indexOf('prefers-reduced-motion')
  const css = strip(source.slice(source.lastIndexOf('`', at) + 1, source.indexOf('`', at)))
  const { top, reduced } = parse(css)
  assert.ok(reduced.length > 0, 'the compat sheet has a reduced-motion block')
  for (const [selector, body] of reduced) {
    const expected = norm(twin(selector, false))
    const found = top.find(([sel]) => norm(sel) === expected)
    assert.ok(found, `compat: no twin rule "${expected}"`)
    assert.equal(found[1], body, `compat: the twin of "${selector}" carries different declarations`)
  }
})
