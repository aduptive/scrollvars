/**
 * SplitText-lite: break an element's text into word/char spans carrying
 * `--sv-order` (and `--sv-count` on the container), so every order-driven
 * preset (entrances with stagger, `sv-reading`, `sv-range` slices) works
 * on text with no manual markup.
 *
 * Accessibility: the full text is kept as a visually-hidden first child
 * (aria-label is prohibited on generic roles like p/span/div. Axe
 * `aria-prohibited-attr`); the animated spans are `aria-hidden`. The original content is restored by the returned
 * function. Markup inside the element is flattened to text. Split plain
 * text, not rich fragments.
 */

/** Visually-hidden text, inline so it needs no stylesheet. */
export const SR_ONLY_CSS =
  'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap'

export interface SplitOptions {
  /** 'word' (default) or 'char'. */
  by?: 'word' | 'char'
}

/** Pure splitter: returns the animated parts (whitespace stays out. The
 * DOM/React layers re-insert it as plain text so wrapping stays natural). */
export function splitParts(text: string, by: 'word' | 'char' = 'word'): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (by === 'word') return words
  return words.flatMap(chars)
}

/** Grapheme clusters when the engine has Intl.Segmenter (emoji, combining
 * marks stay whole); code points otherwise. */
function chars(word: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter
  if (!Segmenter) return Array.from(word)
  return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(word), (s) => s.segment)
}

export function split(el: HTMLElement, { by = 'word' }: SplitOptions = {}): () => void {
  if (typeof window === 'undefined') return () => {}
  const original = el.innerHTML
  const text = (el.textContent ?? '').trim()
  if (!text) return () => {}

  el.classList.add('sv-split')
  el.innerHTML = ''
  const sr = document.createElement('span')
  sr.textContent = text
  sr.style.cssText = SR_ONLY_CSS
  el.appendChild(sr)

  let order = 0
  const append = (word: string) => {
    if (by === 'word') {
      const span = document.createElement('span')
      span.textContent = word
      span.setAttribute('aria-hidden', 'true')
      span.style.setProperty('--sv-order', String(order++))
      el.appendChild(span)
    } else {
      for (const ch of chars(word)) {
        const span = document.createElement('span')
        span.textContent = ch
        span.setAttribute('aria-hidden', 'true')
        span.style.setProperty('--sv-order', String(order++))
        el.appendChild(span)
      }
    }
  }
  const words = text.split(/\s+/).filter(Boolean)
  words.forEach((word, i) => {
    if (i > 0) el.appendChild(document.createTextNode(' '))
    append(word)
  })
  el.style.setProperty('--sv-count', String(order))

  return () => {
    el.innerHTML = original
    el.classList.remove('sv-split')
    el.style.removeProperty('--sv-count')
  }
}
