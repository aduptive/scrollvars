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

/** customProps: declared-name -> every distinct value seen for it, for
 * one-level indirection (`top: var(--x); --x: var(--sv-t)`). A name can have
 * more than one candidate value (the caller resolves same-rule declarations
 * unambiguously; a name declared in more than one rule, without a real
 * cascade, can only be "one of these"), so every candidate is checked: any
 * of them reading a --sv-* value is enough to flag the declaration, rather
 * than picking whichever a plain last-write-wins map happened to keep.
 * Resolution stops after a few hops to stay cheap and never loop on a
 * self-referencing custom property. */
export function lintDeclaration(
  selector: string,
  property: string,
  value: string,
  customProps: Map<string, string[]> = new Map()
): LintViolation | null {
  if (!NON_COMPOSITABLE.has(property)) return null
  const seen = new Set<string>()
  const usesSv = (val: string, depth: number): boolean => {
    if (depth > 5) return false
    if (svRefs(val).length) return true
    for (const ref of customRefs(val)) {
      if (seen.has(ref)) continue
      seen.add(ref)
      const candidates = customProps.get(ref)
      if (candidates?.some((candidate) => usesSv(candidate, depth + 1))) return true
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
 * overlay.ts's scanStylesheets() uses the real CSSOM the same way: a name
 * declared and consumed inside the SAME rule resolves to that rule's own
 * value regardless of stylesheet order; a name declared elsewhere falls
 * back to every distinct value seen for it anywhere (ADU review: a global
 * last-write-wins map missed a same-rule violation depending on the order
 * two unrelated rules happened to declare the same custom property name). */
export function scanCssText(cssText: string): LintViolation[] {
  const clean = stripComments(cssText)
  const blocks = [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ selector: m[1].trim(), body: m[2] }))
    .filter((b) => b.selector && !b.selector.startsWith('@'))

  const globalValues = new Map<string, string[]>()
  const localProps = blocks.map((block) => {
    const local = new Map<string, string>()
    for (const m of block.body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
      local.set(m[1], m[2])
      if (!globalValues.has(m[1])) globalValues.set(m[1], [])
      globalValues.get(m[1])!.push(m[2])
    }
    return local
  })

  const violations: LintViolation[] = []
  blocks.forEach((block, i) => {
    const local = localProps[i]
    const resolver = new Map<string, string[]>()
    for (const name of globalValues.keys()) resolver.set(name, local.has(name) ? [local.get(name)!] : globalValues.get(name)!)
    for (const decl of block.body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)) {
      const property = decl[1].trim()
      if (property.startsWith('--')) continue
      const violation = lintDeclaration(block.selector, property, decl[2].trim(), resolver)
      if (violation) violations.push(violation)
    }
  })
  return violations
}
