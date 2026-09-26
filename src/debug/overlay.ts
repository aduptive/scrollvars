/**
 * DOM pieces that read live geometry and the CSSOM: the ScrollTrigger-style
 * markers layer and the perf lint scan. Split from index.ts so the pure
 * geometry (markers.ts) and matcher (lint.ts) stay unit-testable without a
 * browser.
 */
import { pinLines, readBand, travelLines } from './markers.js'
import { lintDeclaration, type LintViolation } from './lint.js'

function elName(el: Element): string {
  return (
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : '') +
    (el.classList.length
      ? '.' + [...el.classList].filter((c) => c !== 'sv' && c !== 'sv-live').slice(0, 2).join('.')
      : '')
  )
}

// The used value of `top` on a sticky element is always resolved to px by
// the browser once --sv-pin-offset lands in it (pin.css: top: var(...)), so
// reading the computed px is enough; a stage-less fallback (onPin alone)
// reads the raw variable and only handles the unitless/px case. Ponytail:
// the full unit table (vh/rem/em/vw) lives in driver.ts's readPinOffset and
// is not duplicated here, markers are an approximation for visualization.
function readPinOffsetLite(stage: HTMLElement): number {
  const computed = getComputedStyle(stage)
  if (/^-?[\d.]+px$/.test(computed.top)) return parseFloat(computed.top)
  return parseFloat(computed.getPropertyValue('--sv-pin-offset').trim()) || 0
}

// The stage the DRIVER would own for this tracker: its own `.sv-stage`, not
// a nested tracker's (a `.sv` or `data-sv` ancestor between it and `el`
// disqualifies it), the same rule driver.ts's ownedStage applies. Debug
// never imports core, so this is a lite reimplementation (ADU-354 item 10).
function ownedStageLite(el: HTMLElement): HTMLElement | undefined {
  return Array.from(el.querySelectorAll<HTMLElement>('.sv-stage')).find((stage) => {
    if (stage.hasAttribute('data-sv') || stage.classList.contains('sv')) return false
    for (let parent = stage.parentElement; parent && parent !== el; parent = parent.parentElement) {
      if (parent.classList.contains('sv') || parent.hasAttribute('data-sv')) return false
    }
    return true
  })
}

// The stage's normal-flow offset (a heading or padding before it): briefly
// releases sticky positioning and reads the offsetTop chain difference, the
// same trick driver.ts's readStageOrigin uses.
function readStageOriginLite(el: HTMLElement, stage: HTMLElement): number {
  if (typeof stage.offsetTop !== 'number') return 0
  const position = stage.style.getPropertyValue('position')
  const priority = stage.style.getPropertyPriority('position')
  stage.style.setProperty('position', 'static', 'important')
  try {
    const chain = (from: HTMLElement) => {
      let value = 0
      for (let current: HTMLElement | null = from; current; current = current.offsetParent as HTMLElement | null) {
        value += current.offsetTop || 0
        value += (current.offsetParent as HTMLElement | null)?.clientTop || 0
      }
      return value
    }
    return chain(stage) - chain(el)
  } finally {
    stage.style.setProperty('position', position, priority)
  }
}

export function drawMarkers(): () => void {
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:2147483000'
  document.body.appendChild(layer)

  const line = (y: number, label: string, color: string): HTMLElement => {
    const el = document.createElement('div')
    el.style.cssText =
      `position:absolute;left:0;top:${Math.round(y)}px;width:100%;border-top:1px dashed ${color};` +
      `font:10px/1.4 ui-monospace,Menlo,monospace;color:${color};padding-left:4px;pointer-events:none`
    el.textContent = label
    return el
  }

  const draw = () => {
    layer.replaceChildren()
    const vp = window.innerHeight
    const scrollY = window.scrollY
    document.querySelectorAll<HTMLElement>('.sv').forEach((el) => {
      const rect = el.getBoundingClientRect()
      const enter = readBand(el.dataset.svEnter, 0.75)
      const exit = readBand(el.dataset.svExit, 0.25)
      const { enter: enterY, exit: exitY } = travelLines(rect, scrollY, vp, enter, exit)
      const label = elName(el)
      layer.append(line(enterY, `${label} view 0`, '#6ee7a0'), line(exitY, `${label} view 1`, '#f0a35a'))

      const stage = ownedStageLite(el)
      if (stage) {
        const offset = readPinOffsetLite(stage)
        const origin = readStageOriginLite(el, stage)
        const { start, end } = pinLines(
          { wrapperTop: rect.top, wrapperHeight: el.offsetHeight, stageHeight: stage.offsetHeight },
          scrollY,
          offset,
          origin
        )
        layer.append(line(start, `${label} pin start`, '#a78bfa'), line(end, `${label} pin end`, '#a78bfa'))
      }
    })
  }
  draw()

  let resizeRaf = 0
  const onResize = () => {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(draw)
  }
  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(resizeRaf)
    layer.remove()
  }
}

// Grouping rules (@media, @supports, @layer block) all expose their own
// cssRules; walking by duck type covers every one without naming each
// constructor (CSSLayerBlockRule is not in every lib.dom.d.ts).
function collectRules(sheetLike: { cssRules: CSSRuleList }, styleRules: CSSStyleRule[], onCrossOrigin: () => void): void {
  let rules: CSSRuleList
  try {
    rules = sheetLike.cssRules
  } catch {
    onCrossOrigin()
    return
  }
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      styleRules.push(rule)
    } else if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) collectRules(rule.styleSheet, styleRules, onCrossOrigin)
    } else if ('cssRules' in rule) {
      collectRules(rule as unknown as { cssRules: CSSRuleList }, styleRules, onCrossOrigin)
    }
  }
}

export function scanStylesheets(): { violations: LintViolation[]; skipped: number } {
  const styleRules: CSSStyleRule[] = []
  let skipped = 0
  for (const sheet of Array.from(document.styleSheets)) collectRules(sheet, styleRules, () => skipped++)

  // A name declared and consumed inside the SAME rule resolves to that
  // rule's own value, whatever order the stylesheet lists its rules in; a
  // name declared elsewhere falls back to every distinct value seen for it
  // anywhere (a global last-write-wins map missed a same-rule violation
  // depending on rule order, review finding).
  const globalValues = new Map<string, string[]>()
  const localProps = styleRules.map((rule) => {
    const local = new Map<string, string>()
    for (let i = 0; i < rule.style.length; i++) {
      const prop = rule.style[i]
      if (!prop.startsWith('--')) continue
      const value = rule.style.getPropertyValue(prop)
      local.set(prop, value)
      if (!globalValues.has(prop)) globalValues.set(prop, [])
      globalValues.get(prop)!.push(value)
    }
    return local
  })

  const seen = new Set<string>()
  const violations: LintViolation[] = []
  styleRules.forEach((rule, i) => {
    const local = localProps[i]
    const resolver = new Map<string, string[]>()
    for (const name of globalValues.keys()) resolver.set(name, local.has(name) ? [local.get(name)!] : globalValues.get(name)!)
    for (let j = 0; j < rule.style.length; j++) {
      const prop = rule.style[j]
      if (prop.startsWith('--')) continue
      const violation = lintDeclaration(rule.selectorText, prop, rule.style.getPropertyValue(prop), resolver)
      if (!violation) continue
      const key = `${violation.selector}|${violation.property}`
      if (seen.has(key)) continue
      seen.add(key)
      violations.push(violation)
    }
  })
  return { violations, skipped }
}

export function runLint(): () => void {
  const { violations, skipped } = scanStylesheets()
  if (!violations.length && !skipped) return () => {}

  const lines = violations.map((v) => `${v.selector} { ${v.property} }: ${v.reason}`)
  if (skipped) lines.push(`${skipped} cross-origin stylesheet(s) skipped`)
  if (violations.length) console.warn('[scrollvars debug] perf lint:\n' + lines.join('\n'))

  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText =
    'position:fixed;top:12px;left:12px;z-index:2147483647;max-width:360px;max-height:40vh;overflow:auto;' +
    'background:rgba(60,10,10,.92);color:#ffd7d7;border:1px solid rgba(240,120,120,.5);border-radius:10px;' +
    'padding:10px 12px;font:11px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap'
  box.innerHTML = '<b style="color:#f08787">ScrollVars perf lint</b>\n<span></span>'
  ;(box.lastElementChild as HTMLElement).textContent = lines.join('\n')
  document.body.appendChild(box)

  return () => box.remove()
}
