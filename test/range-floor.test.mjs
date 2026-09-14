import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// sv-range-rise fades a child in from --sv-range-floor (default .55) rather
// than from 0, so a child waiting for its slice keeps its text readable. The
// rule is public behavior: this pins its shape and its arithmetic at the
// three points that matter (waiting, waiting with the floor off, arrived).

const css = readFileSync(new URL('../styles/pin.css', import.meta.url), 'utf8')
const rule = css.match(/\.sv \.sv-range\.sv-range-rise > \* \{([^}]*)\}/)
const opacity = rule && rule[1].match(/opacity:\s*([^;]+);/)?.[1].trim()

// the expression, evaluated the way the browser would with a given floor and --sv-r
const evaluate = (expr, floor, r) => {
  const src = expr
    .replace(/var\(--sv-range-floor,\s*([\d.]+)\)/g, (_, d) => String(floor ?? d))
    .replace(/var\(--sv-r,\s*([\d.]+)\)/g, (_, d) => String(r ?? d))
    .replace(/^calc\((.*)\)$/, '$1')
  assert.match(src, /^[\d.\s+\-*/()]+$/, `the expression must reduce to arithmetic: ${src}`)
  return Function(`return (${src})`)()
}

test('sv-range-rise floors its fade at --sv-range-floor, .55 by default', () => {
  assert.ok(opacity, 'the flavor declares an opacity')
  assert.match(opacity, /var\(--sv-range-floor,\s*0?\.55\)/, 'the default floor is .55')
  assert.equal(evaluate(opacity, undefined, 0), 0.55, 'a child waiting for its slice sits at the floor')
  assert.equal(evaluate(opacity, 0, 0), 0, 'the floor set to 0 gives the old fade from nothing')
  assert.equal(evaluate(opacity, undefined, 1), 1, 'a child that arrived is fully opaque')
  assert.equal(evaluate(opacity, undefined, undefined), 1, 'without the driver the fallback of 1 is the end state')
})
