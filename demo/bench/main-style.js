// Diagnostic variants of the SAME main-900 page. Not a shipped renderer.
// Public clocks keep their inheritance; direct output is an explicit variant.
window.mountMainStyleExperiment = function (mode) {
  const direct = mode.startsWith('direct')
  if (mode === 'typed') {
    for (const name of ['--sv-page', '--sv-v'])
      CSS.registerProperty({ name, syntax: '<number>', inherits: true, initialValue: '0' })
  }
  if (mode === 'visibility') {
    const style = document.createElement('style')
    style.textContent = 'section { content-visibility: auto; }'
    document.head.append(style)
  }
  SV.setPageOutputs(!mode.endsWith('-off'))
  const sections = new Map()
  for (const box of boxes) {
    if (!sections.has(box.sec)) sections.set(box.sec, [])
    sections.get(box.sec).push(box)
  }
  window.__railAudit = { callbacks: 0, changes: 0, min: 1, max: 0 }
  const stops = []
  for (const [section, children] of sections) {
    let last
    stops.push(SV.track(section, { view: false, travel: !direct, onTravel(value) {
      const t = +value.toFixed(4) // same serialization as the CSS clock
      const audit = window.__railAudit
      audit.callbacks++
      if (last === t) return
      last = t
      audit.changes++
      audit.min = Math.min(audit.min, t)
      audit.max = Math.max(audit.max, t)
      if (direct) for (const box of children) {
        box.el.style.translate = `0 ${(0.5 - t) * box.speed}px`
        box.el.style.opacity = String(0.3 + t * 0.7)
      }
    } }))
  }
  // Out of the timed window: verify identical visible transforms and opacity,
  // plus inherited page/velocity values with global outputs still enabled.
  window.__styleCheck = async () => {
    const section = [...sections.keys()][25]
    const results = []
    for (const p of [.2, .5, .8, .5, .2]) {
      const top = scrollY + section.getBoundingClientRect().top
      scrollTo(0, top - innerHeight + (section.offsetHeight + innerHeight) * p)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const rect = section.getBoundingClientRect()
      const t = +Math.max(0, Math.min((innerHeight - rect.top) / (rect.height + innerHeight), 1)).toFixed(4)
      for (const box of sections.get(section)) {
        const css = getComputedStyle(box.el)
        const y = parseFloat(css.translate.split(' ')[1])
        if (Math.abs(y - (0.5 - t) * box.speed) > .02 || Math.abs(+css.opacity - (0.3 + t * .7)) > .0001)
          throw Error(`${mode}: visual mismatch at ${p}: ${css.translate}/${css.opacity}`)
      }
      if (!mode.endsWith('-off')) {
        const root = getComputedStyle(document.documentElement)
        const child = getComputedStyle(sections.get(section)[0].el)
        for (const name of ['--sv-page', '--sv-v']) {
          if (Math.abs(+root.getPropertyValue(name) - +child.getPropertyValue(name)) > .00001)
            throw Error(`${mode}: lost inheritance of ${name}`)
        }
      }
      results.push(t)
    }
    scrollTo(0, 0)
    return results
  }
  return () => stops.forEach(stop => stop())
}
