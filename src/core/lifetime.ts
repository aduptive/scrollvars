/** Private acquisition and callback boundary for independently mounted units. */
export function reportFailure(error: unknown): void {
  if (typeof reportError === 'function') reportError(error)
  else console.error(error)
}

export function lifetime() {
  let stopped = false
  let acquiring = true
  const releases: (() => void)[] = []
  const stop = () => {
    if (stopped) return
    stopped = true
    let first: unknown
    let failed = false
    for (const release of releases.splice(0).reverse()) {
      try { release() } catch (error) { if (!failed) { first = error; failed = true } }
    }
    if (failed) throw first
  }
  const fail = (error: unknown) => {
    try { stop() } catch { /* retain the original failure */ }
    reportFailure(error)
  }
  return {
    get stopped() { return stopped },
    defer(release: () => void) { if (stopped) release(); else releases.push(release) },
    stop,
    guard<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
      return (...args) => {
        if (stopped) return
        try { fn(...args) } catch (error) {
          if (acquiring) throw error
          fail(error)
        }
      }
    },
    setup(fn: () => void) {
      try { fn(); acquiring = false } catch (error) {
        try { stop() } catch { /* retain the acquisition error */ }
        throw error
      }
    },
  }
}

/** Restore only our last write. A later author write becomes the new baseline. */
export function ownership() {
  type Write = { read: () => unknown; write: (value: any) => void; before: unknown; last: unknown }
  const nodes = new Map<object, Map<string, Write>>()
  const set = <T>(node: object, key: string, read: () => T, write: (v: T) => void, value: T) => {
    let entries = nodes.get(node)
    if (!entries) nodes.set(node, entries = new Map())
    let entry = entries.get(key)
    const current = read()
    if (!entry) entries.set(key, entry = { read, write, before: current, last: value })
    else if (current !== entry.last) entry.before = current
    entry.last = value
    // The bookkeeping above (before/last) runs every call, restore()'s
    // correctness depends on it; only the DOM write itself is skippable,
    // and only when the value already reads back as what we're about to
    // write (a per-frame `--sd`/`--sv-progress` write is very often the
    // same number two frames running). Perf-1 #3a.
    if (current !== value) write(value)
  }
  const restore = (node?: object, key?: string) => {
    let first: unknown, failed = false
    nodes.forEach((entries, target) => {
      if (node && target !== node) return
      entries.forEach((entry, name) => {
        if (key && name !== key) return
        entries.delete(name)
        try { if (entry.read() === entry.last) entry.write(entry.before) }
        catch (error) { if (!failed) { failed = true; first = error } }
      })
      if (!entries.size) nodes.delete(target)
    })
    if (failed) throw first
  }
  return {
    restore,
    style(el: HTMLElement, key: string, value: string, priority = '') {
      const read = () => JSON.stringify([el.style.getPropertyValue?.(key) ?? '', el.style.getPropertyPriority?.(key) ?? ''])
      set(el, `style:${key}`, read, (saved) => {
        const [v, p] = JSON.parse(saved)
        if (v) el.style.setProperty(key, v, p)
        else el.style.removeProperty?.(key)
      }, JSON.stringify([value, priority]))
    },
    class(el: HTMLElement, key: string, value: boolean) {
      set(el, `class:${key}`, () => el.classList.contains?.(key) ?? false,
        v => { if (typeof el.classList.toggle === 'function') el.classList.toggle(key, v); else if (v) el.classList.add(key); else el.classList.remove(key) }, value)
    },
    attr(el: HTMLElement, key: string, value: string | null) {
      set(el, `attr:${key}`, () => el.getAttribute(key),
        v => { if (v === null) el.removeAttribute(key); else el.setAttribute(key, v) }, value)
    },
    property<T extends object, K extends keyof T>(el: T, key: K, value: T[K]) {
      set(el, `property:${String(key)}`, () => el[key], v => { el[key] = v }, value)
    },
  }
}
