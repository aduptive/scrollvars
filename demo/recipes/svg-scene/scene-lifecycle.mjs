// Recipe-local lifecycle, shared with the benchmark controls; not a library API.
export function mountScene(section, { connect, paint, reduced, onMotion }) {
  let disposed = false, visible = false, sized = false, stop, observer, resize, unMotion
  let generation = 0
  const pause = (settle = true) => {
    generation++
    const release = stop
    stop = undefined
    try { release?.() } finally {
      section.removeAttribute('data-running')
      if (settle) paint(0.5)
    }
  }
  const sync = () => {
    if (disposed) return
    if (!visible || !sized || document.hidden || reduced()) { pause(); return }
    if (stop) return
    const token = ++generation
    section.setAttribute('data-running', '')
    try {
      stop = connect(t => { if (!disposed && token === generation) paint(t) })
    } catch (error) {
      try { destroy() } catch { /* preserve attachment failure */ }
      throw error
    }
  }
  const destroy = () => {
    if (disposed) return
    disposed = true
    // Attempt all releases, even if a consumer's cleanup throws.
    let first, failed = false
    for (const release of [() => pause(false), () => observer?.disconnect(), () => resize?.disconnect(),
      () => unMotion?.(), () => document.removeEventListener('visibilitychange', sync), () => paint.restore?.()]) {
      try { release() } catch (error) { if (!failed) { first = error; failed = true } }
    }
    if (failed) throw first
  }
  try {
    // Unsupported observers leave the complete static artwork and text intact.
    if (typeof IntersectionObserver !== 'function' || typeof ResizeObserver !== 'function') return destroy
    observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    resize = new ResizeObserver(([entry]) => { sized = entry.contentRect.width > 0 && entry.contentRect.height > 0; sync() })
    observer.observe(section)
    resize.observe(section)
    unMotion = onMotion(sync)
    document.addEventListener('visibilitychange', sync)
  } catch (error) {
    try { destroy() } catch { /* preserve setup failure */ }
    throw error
  }
  return destroy
}

export function paintScene(section) {
  const groups = [...section.querySelectorAll('[data-piece]')]
  const saved = groups.map(el => [el.style.getPropertyValue('transform'), el.style.getPropertyPriority('transform')])
  const last = [], values = []
  const paint = raw => {
    const t = Number(raw.toFixed(4)) // Match the public CSS clock's precision.
    for (let i = 0; i < groups.length; i++) {
      const direction = i % 2 ? -1 : 1
      const value = `translateX(${(t - 0.5) * direction * 120}px) rotate(${(t - 0.5) * direction * 24}deg)`
      if (values[i] !== value) { groups[i].style.setProperty('transform', value); values[i] = value; last[i] = groups[i].style.getPropertyValue('transform') }
    }
  }
  paint.restore = () => groups.forEach((el, i) => {
    if (el.style.getPropertyValue('transform') !== last[i] || el.style.getPropertyPriority('transform')) return
    const [value, priority] = saved[i]
    if (value) el.style.setProperty('transform', value, priority)
    else el.style.removeProperty('transform')
  })
  return paint
}
