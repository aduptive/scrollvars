/**
 * Dev overlay — the "what is the driver doing" panel. Zero coupling with the
 * core: it finds tracked elements by the `.sv` class and reads their computed
 * variables each frame. Costs what it costs; never ship it enabled.
 *
 *   import('scrollvars/debug').then((m) => m.debug())
 */
const VARS = ['--sv-view', '--sv-t', '--sv-pin', '--sv-scene', '--sv-r'] as const

export interface DebugOptions {
  /** Also outline every tracked element on the page. Default true. */
  outlines?: boolean
}

export function debug({ outlines = true }: DebugOptions = {}): () => void {
  if (typeof window === 'undefined') return () => {}

  const panel = document.createElement('div')
  panel.style.cssText =
    'position:fixed;bottom:12px;right:12px;z-index:2147483647;max-height:45vh;' +
    'overflow:auto;background:rgba(10,9,14,.92);color:#e6e4f0;border:1px solid ' +
    'rgba(167,139,250,.4);border-radius:10px;padding:10px 12px;font:11px/1.5 ' +
    'ui-monospace,Menlo,monospace;min-width:260px;backdrop-filter:blur(6px)'
  panel.innerHTML = '<b style="color:#a78bfa">scrollvars debug</b><div></div>'
  const list = panel.lastElementChild as HTMLElement
  document.body.appendChild(panel)

  const style = document.createElement('style')
  if (outlines)
    style.textContent =
      '.sv{outline:1px dashed rgba(167,139,250,.5);outline-offset:-1px}' +
      '.sv.sv-live{outline-color:rgba(110,231,160,.7)}'
  document.head.appendChild(style)

  const name = (el: Element) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : '') +
    (el.classList.length ? '.' + [...el.classList].filter((c) => c !== 'sv' && c !== 'sv-live').slice(0, 2).join('.') : '')

  let raf = 0
  const rows = new Map<Element, HTMLElement>()
  const tick = () => {
    const tracked = document.querySelectorAll('.sv')
    tracked.forEach((el) => {
      let row = rows.get(el)
      if (!row) {
        row = document.createElement('div')
        row.style.cssText = 'white-space:nowrap;cursor:pointer'
        row.addEventListener('click', () => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
        rows.set(el, row)
        list.appendChild(row)
      }
      const cs = getComputedStyle(el)
      const vals = VARS.map((v) => {
        const raw = cs.getPropertyValue(v).trim()
        return raw ? `${v.slice(5)} ${(+raw).toFixed(2)}` : ''
      })
        .filter(Boolean)
        .join(' · ')
      const live = el.classList.contains('sv-live')
      row.innerHTML =
        `<span style="color:${live ? '#6ee7a0' : '#8f8ca6'}">${live ? '●' : '○'}</span> ` +
        `<span style="color:#cfcbe4">${name(el)}</span> ` +
        `<span style="color:#8f8ca6">${vals}</span>`
    })
    rows.forEach((row, el) => {
      if (!el.isConnected) {
        row.remove()
        rows.delete(el)
      }
    })
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(raf)
    panel.remove()
    style.remove()
  }
}
