// Independent IDs are essential: cancelling one unit must not cancel a sibling.
export function lifecycleEnv() {
  const saved = new Map()
  const put = (key, value) => { saved.set(key, globalThis[key]); globalThis[key] = value }
  let id = 0
  const frames = new Map(), timers = new Map(), observers = new Set(), listeners = new Set(), errors = []
  const deliveries = []
  const events = (node) => {
    const handlers = new Map()
    node.addEventListener = (type, fn) => {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type).add(fn); listeners.add(fn)
    }
    node.removeEventListener = (type, fn) => { handlers.get(type)?.delete(fn); listeners.delete(fn) }
    node.fire = (type, event = {}) => { for (const fn of [...(handlers.get(type) ?? [])]) fn({ target: node, ...event }) }
    node.handlers = handlers
    return node
  }
  const element = (attrs = {}) => {
    const values = new Map(), priorities = new Map(), classes = new Set()
    const node = events({ attrs: { ...attrs }, classes, children: [], parentElement: null, offsetParent: null,
      offsetLeft: 0, offsetTop: 0, offsetWidth: 100, offsetHeight: 100,
      clientWidth: 100, clientHeight: 100, clientLeft: 0, clientTop: 0,
      scrollWidth: 300, scrollHeight: 100, scrollLeft: 0, scrollTop: 0,
      getAttribute: key => node.attrs[key] ?? null,
      hasAttribute: key => key in node.attrs,
      setAttribute: (key, value) => { node.attrs[key] = String(value) },
      removeAttribute: key => { delete node.attrs[key] },
      contains(other) { for (; other; other = other.parentElement) if (other === node) return true; return false },
      matches(selector) { return selector[0] === '.' ? classes.has(selector.slice(1)) : selector === '[data-sv-toggle]' && node.hasAttribute('data-sv-toggle') },
      closest(selector) { for (let n = node; n; n = n.parentElement) if (n.matches(selector)) return n; return null },
      querySelectorAll(selector) { return node.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]) },
      querySelector(selector) { return node.querySelectorAll(selector)[0] ?? null },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      focus() {},
    })
    node.classList = { contains: key => classes.has(key), add: (...keys) => keys.forEach(key => classes.add(key)), remove: (...keys) => keys.forEach(key => classes.delete(key)), toggle(key, on = !classes.has(key)) { on ? classes.add(key) : classes.delete(key); return on } }
    node.style = { getPropertyValue: key => values.get(key) ?? '', getPropertyPriority: key => priorities.get(key) ?? '',
      setProperty(key, value, priority = '') { values.set(key, String(value)); priorities.set(key, priority) },
      removeProperty(key) { values.delete(key); priorities.delete(key) } }
    for (const [prop, css] of Object.entries({ scrollSnapType: 'scroll-snap-type', width: 'width', height: 'height', boxSizing: 'box-sizing', aspectRatio: 'aspect-ratio' }))
      Object.defineProperty(node.style, prop, { get: () => node.style.getPropertyValue(css), set: value => node.style.setProperty(css, value) })
    Object.defineProperty(node, 'tabIndex', { get: () => Number(node.getAttribute('tabindex') ?? -1), set: value => node.setAttribute('tabindex', value) })
    node.append = child => { node.children.push(child); child.parentElement = child.offsetParent = node }
    return node
  }
  // The motion service is page-scoped. Count instance DPR subscriptions;
  // its persistent OS listener and html observer are outside this baseline.
  const window = events({ devicePixelRatio: 2, matchMedia: query => query.includes('prefers-reduced-motion') ? { matches: false, addEventListener() {}, removeEventListener() {} } : events({ matches: false }), getComputedStyle: node => ({ direction: 'ltr', scrollSnapType: node.style.scrollSnapType, aspectRatio: `auto ${node.width} / ${node.height}`, paddingLeft: '0', paddingRight: '0', paddingTop: '0', paddingBottom: '0', borderLeftWidth: '0', borderRightWidth: '0', borderTopWidth: '0', borderBottomWidth: '0' }) })
  put('window', window)
  put('document', events({ visibilityState: 'visible', documentElement: element() }))
  put('getComputedStyle', window.getComputedStyle)
  put('requestAnimationFrame', fn => { frames.set(++id, fn); return id })
  put('cancelAnimationFrame', key => frames.delete(key))
  put('setTimeout', fn => { timers.set(++id, fn); return id })
  put('clearTimeout', key => timers.delete(key))
  put('reportError', error => errors.push(error))
  for (const kind of ['ResizeObserver', 'MutationObserver', 'IntersectionObserver']) {
    put(kind, class {
      constructor(cb) { this.cb = cb; this.kind = kind; this.targets = new Set(); deliveries.push(this) }
      observe(node) { if (node === document.documentElement) { const index = deliveries.indexOf(this); if (index >= 0) deliveries.splice(index, 1); return }; this.targets.add(node); observers.add(this) }
      disconnect() { this.targets.clear(); observers.delete(this) }
    })
  }
  const rail = () => { const node = element(); for (let i = 0; i < 3; i++) { const slide = element(); slide.offsetLeft = i * 100; node.append(slide) } return node }
  const canvas = () => { const node = element(); for (const [key, fallback] of [['width', 300], ['height', 150]]) Object.defineProperty(node, key, { get: () => Number(node.getAttribute(key) ?? fallback), set: value => node.setAttribute(key, value) }); node.style.width = '100px'; node.style.height = '100px'; node.getContext = () => ({ setTransform() {} }); return node }
  return { element, rail, canvas, frames, timers, observers, listeners, deliveries, errors, window,
    flush() { const batch = [...frames]; frames.clear(); for (const [, fn] of batch) fn(16) },
    baseline: () => [listeners.size, observers.size, frames.size, timers.size],
    restore() { for (const [key, value] of saved) value === undefined ? delete globalThis[key] : globalThis[key] = value },
  }
}
