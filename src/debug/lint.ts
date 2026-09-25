/**
 * Performance lint matcher: is a declaration reading a --sv-* value (direct
 * or through one level of custom-property indirection) into a property that
 * cannot be composited? Pure, so it is unit-testable without a browser; the
 * runtime scanner in index.ts walks the real CSSOM and calls lintDeclaration
 * per rule.
 */
export const NON_COMPOSITABLE = new Set([
  'width', 'height',
  'top', 'left', 'right', 'bottom', 'inset', 'inset-block', 'inset-inline',
  'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'font-size', 'filter', 'backdrop-filter', 'box-shadow',
  'background-position', 'background-position-x', 'background-position-y',
  'clip-path', 'mask',
])

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

// The driver's own output variables (README/CLAUDE.md's list) plus --sv-r
// (the registered range property) and --sv-stage-width (the pinned stage
// width the driver republishes). An author's own custom property that
// merely starts with "--sv-" (their own namespace choice, e.g. a design
// token) is not one of these and is never flagged.
const KNOWN_SV_VARS = new Set([
  '--sv-view', '--sv-t', '--sv-pin', '--sv-scene', '--sv-page', '--sv-v', '--sv-r', '--sv-stage-width', '--mx', '--my',
])

// Coarse match (any var(--sv-*) or var(--mx/--my)) captures the WHOLE
// identifier, then each candidate is re-tested against the known set: a
// substring check like value.includes('--sv-v') would also match
// '--sv-viewx', an unrelated author-defined property (ADU-198's
// [style*="--sv-v"] trap, applied here to var() extraction).
function svRefs(value: string): string[] {
  const candidates = [...value.matchAll(/var\(\s*(--(?:sv-[\w-]+|mx|my))/g)].map((m) => m[1])
  return candidates.filter((name) => KNOWN_SV_VARS.has(name))
}
function customRefs(value: string): string[] {
  return [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])
}

export interface LintViolation {
  selector: string
  property: string
  reason: string
}

/** customProps: declared-name -> raw value, for one-level indirection
 * (`top: var(--x); --x: var(--sv-t)`). Resolution stops after a few hops to
 * stay cheap and never loop on a self-referencing custom property. */
export function lintDeclaration(
  selector: string,
  property: string,
  value: string,
  customProps: Map<string, string> = new Map()
): LintViolation | null {
  if (!NON_COMPOSITABLE.has(property)) return null
  const seen = new Set<string>()
  const usesSv = (val: string, depth: number): boolean => {
    if (depth > 5) return false
    if (svRefs(val).length) return true
    for (const ref of customRefs(val)) {
      if (seen.has(ref)) continue
      seen.add(ref)
      const resolved = customProps.get(ref)
      if (resolved !== undefined && usesSv(resolved, depth + 1)) return true
    }
    return false
  }
  if (!usesSv(value, 0)) return null
  return {
    selector,
    property,
    reason: `${property} cannot be composited; it reads a --sv-* value through "${value.trim()}" and will run layout or paint every frame`,
  }
}

/** Naive selector { decls } extraction for unit tests: not a CSS parser,
 * good enough for fixture text (no nested @media). The runtime scanner in
 * index.ts uses the real CSSOM instead. */
export function scanCssText(cssText: string): LintViolation[] {
  const clean = stripComments(cssText)
  const customProps = new Map<string, string>()
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) customProps.set(m[1], m[2])
  const violations: LintViolation[] = []
  for (const rule of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim()
    if (!selector || selector.startsWith('@')) continue
    for (const decl of rule[2].matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)) {
      const property = decl[1].trim()
      if (property.startsWith('--')) continue
      const violation = lintDeclaration(selector, property, decl[2].trim(), customProps)
      if (violation) violations.push(violation)
    }
  }
  return violations
}
