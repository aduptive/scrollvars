import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

// styles/scoped.css registers --sv-t and --sv-view non-inheriting. Any shipped
// preset that reads one of them from a DESCENDANT of the tracked element then
// needs an explicit forward in that sheet, or the preset stops animating the
// moment a page imports it. This test derives the list of such readers from
// the stylesheets themselves, so adding a preset without its forward fails
// here instead of on a user's page.

const root = new URL('../styles/', import.meta.url)
const scoped = readFileSync(new URL('scoped.css', root), 'utf8')
const CLOCKS = ['--sv-t', '--sv-view']

const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Every rule in a sheet as [selectorList, body], one level deep is enough:
// the presets do not nest rules.
const unwrap = css => css.replace(/@supports[^{]*\{([\s\S]*)\}\s*$/m, '$1')
const rules = css => [...stripComments(unwrap(css)).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]])

const subject = selector => selector.split(',')[0].trim().split(/\s+/).pop().replace(/\)$/, '')
const subjects = selectorList => selectorList.split(',').map(sel => sel.trim().split(/\s+/).pop().replace(/\)$/, ''))

const descendantReaders = () => {
  const found = []
  for (const file of readdirSync(root)) {
    if (!file.endsWith('.css') || file === 'scoped.css') continue
    for (const [selector, body] of rules(readFileSync(new URL(file, root), 'utf8')))
      for (const clock of CLOCKS)
        if (new RegExp(`var\\(${clock}[,)]`).test(body) && !/^\.sv$|^\[data-sv\]$/.test(subject(selector)))
          found.push({ file, selector, clock })
  }
  return found
}

test('scoped.css registers exactly the two clocks, non-inheriting', () => {
  const registered = [...scoped.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g)].map(m => [m[1], m[2]])
  assert.deepEqual(registered.map(([name]) => name).sort(), CLOCKS.slice().sort())
  for (const [name, body] of registered) {
    assert.match(body, /inherits:\s*false/, `${name} must not inherit`)
    assert.match(body, /initial-value:\s*0\b/, `${name} initial value must match the var() fallbacks the presets use`)
  }
})

test('every preset that reads a clock from a descendant is forwarded in scoped.css', () => {
  const readers = descendantReaders()
  assert.ok(readers.length > 0, 'the derivation found no descendant readers: it is broken, not the presets')
  for (const { file, selector, clock } of readers) {
    const forward = rules(scoped).find(([sel, body]) => subjects(sel).includes(subject(selector)) && new RegExp(`${clock}:\\s*inherit`).test(body))
    assert.ok(forward, `${file}: "${selector}" reads ${clock} from a descendant and scoped.css does not forward it`)
  }
})

test('every forward also covers the path to the reader, not only the reader', () => {
  for (const { selector, clock } of descendantReaders()) {
    const reader = subject(selector)
    const path = rules(scoped).find(([sel, body]) => sel.includes(`:has(${reader})`) && new RegExp(`${clock}:\\s*inherit`).test(body))
    assert.ok(path, `${reader}: a non-inheriting clock is its initial value on every element between .sv and the reader, so the path needs \`:has(${reader})\` forwarded`)
  }
})

test('registration is guarded on :has(), so no browser can register without being able to forward', () => {
  assert.match(scoped, /@supports selector\(:has\(a\)\)\s*\{[\s\S]*@property --sv-t/)
})

test('scoped.css stays out of the aggregate styles.css', () => {
  const aggregate = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
  assert.ok(!/@property\s+--sv-t/.test(aggregate), 'the aggregate must not register the clocks: scoped mode is opt-in')
})
