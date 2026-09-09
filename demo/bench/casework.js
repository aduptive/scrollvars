// Experiment on the actual generated CaseStudyRail, not a shipped component API.
window.mountCaseworkExperiment = ({ direct = false, rich = false } = {}) => {
  const root = document.querySelector('.sv-casework > .sv')
  const stage = root.querySelector('.sv-stage')
  const rail = root.querySelector('.work-rail')
  if (rich) {
    // Same visible text/layout; model a CMS's deeply wrapped rich text.
    for (const paragraph of rail.querySelectorAll('p')) {
      const words = paragraph.textContent.split(' ')
      paragraph.replaceChildren(...words.map(word => {
        const outer = document.createElement('span')
        let inner = outer
        for (let i = 0; i < 12; i++) inner = inner.appendChild(document.createElement('span'))
        inner.textContent = word + ' '
        return outer
      }))
    }
  }
  const audit = window.__railAudit = { callbacks:0, changes:0, min:1, max:0, last:null }
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const supported = CSS.supports('width', '1cqw')
  const original = ['transform', '--sv-pin'].map(name => [name, rail.style.getPropertyValue(name), rail.style.getPropertyPriority(name)])
  let end = 0, previous = null, flow = false
  const resetTransform = () => {
    rail.style.setProperty('transform', original[0][1], original[0][2])
    previous = null
  }
  const measure = () => {
    end = Math.min(stage.clientWidth - rail.getBoundingClientRect().width, 0)
    previous = null
    SV.refresh()
  }
  const onMotion = () => { resetTransform(); measure() }
  let observer
  if (direct) {
    // The wrapper keeps the public clock/helper. This rail does not consume
    // that inherited clock; the boundary stops propagating it into the cards.
    rail.style.setProperty('--sv-pin', '0')
    observer = new ResizeObserver(measure)
    observer.observe(stage)
    observer.observe(rail)
    motion.addEventListener('change', onMotion)
  }
  const stop = SV.track(root, {
    pin:'300vh', view:false,
    onFlow:value => { flow = value; if (direct && flow) resetTransform() },
    onPin:raw => {
      const p = raw.toFixed(4)
      audit.callbacks++
      if (p !== audit.last) { audit.changes++; audit.last = p }
      audit.min = Math.min(audit.min, raw)
      audit.max = Math.max(audit.max, raw)
      if (!direct || flow || motion.matches || !supported || p === previous) return
      previous = p
      rail.style.transform = `translateX(${+p * end}px)`
    },
  })
  if (direct) measure()
  return () => {
    observer?.disconnect()
    motion.removeEventListener('change', onMotion)
    stop()
    for (const [name, value, priority] of original) rail.style.setProperty(name, value, priority)
  }
}
