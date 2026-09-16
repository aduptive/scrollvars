// Browser instrumentation wraps platform boundaries, never installed source.
export function instrumentResources() {
  const frames = new Set(), listeners = new Set(), observers = new Set()
  const request = window.requestAnimationFrame.bind(window)
  const cancel = window.cancelAnimationFrame.bind(window)
  window.requestAnimationFrame = callback => {
    const id = request(time => { frames.delete(id); callback(time) })
    frames.add(id)
    return id
  }
  window.cancelAnimationFrame = id => { frames.delete(id); cancel(id) }
  const add = EventTarget.prototype.addEventListener
  const remove = EventTarget.prototype.removeEventListener
  const capture = options => typeof options === 'boolean' ? options : !!options?.capture
  EventTarget.prototype.addEventListener = function(type, callback, options) {
    if (!callback || options?.signal?.aborted) return add.call(this, type, callback, options)
    let record = [...listeners].find(r => r.target === this && r.type === type && r.callback === callback && r.capture === capture(options))
    if (!record) {
      record = { target: this, type, callback, capture: capture(options) }
      record.wrapper = function(event) {
        if (options?.once) listeners.delete(record)
        if (typeof callback === 'function') callback.call(this, event)
        else callback.handleEvent(event)
      }
      listeners.add(record)
      if (options?.signal) add.call(options.signal, 'abort', () => listeners.delete(record), { once: true })
    }
    return add.call(this, type, record.wrapper, options)
  }
  EventTarget.prototype.removeEventListener = function(type, callback, options) {
    const record = [...listeners].find(r => r.target === this && r.type === type && r.callback === callback && r.capture === capture(options))
    if (record) listeners.delete(record)
    return remove.call(this, type, record?.wrapper || callback, options)
  }
  for (const name of ['ResizeObserver', 'IntersectionObserver', 'MutationObserver']) {
    const Native = window[name]
    window[name] = class extends Native {
      constructor(callback) { super(callback); this.targets = new Set(); this.kind = name }
      observe(target, options) { super.observe(target, options); this.targets.add(target); observers.add(this) }
      unobserve(target) { super.unobserve(target); this.targets.delete(target); if (!this.targets.size) observers.delete(this) }
      disconnect() { super.disconnect(); this.targets.clear(); observers.delete(this) }
    }
  }
  // Playwright's injected script adds its own window listeners whenever it
  // first acts in a document, before or after the baseline depending on the
  // run: a hit-target interceptor (one callback on auxclick, contextmenu,
  // dblclick and the pointer events, capture) and a `__playwright_*` check
  // event. Nothing in the library listens to contextmenu or dblclick, so a
  // callback registered on all three is the tool's, not the package's.
  const playwrightCallbacks = () => {
    const on = type => new Set([...listeners].filter(r => r.target === window && r.type === type && r.capture).map(r => r.callback))
    const [a, b, c] = ['auxclick', 'contextmenu', 'dblclick'].map(on)
    return new Set([...a].filter(fn => b.has(fn) && c.has(fn)))
  }
  window.packedResources = (tool = playwrightCallbacks()) => ({
    // Detached DOM listeners (React delegation and controls) have no live event
    // source and are GC-owned. Global, media-query and connected DOM listeners
    // remain counted, including every library subscription on those targets.
    listeners: [...listeners].filter(r => !(r.target instanceof Node) || r.target.isConnected)
      .filter(r => !tool.has(r.callback) && !String(r.type).startsWith('__playwright'))
      .map(r => `${r.target === window ? 'window' : r.target === document ? 'document' : r.target.nodeName || 'media'}:${r.type}:${r.capture}`).sort(),
    observers: [...observers].map(o => `${o.kind}:${o.targets.size}`).sort(),
    frames: frames.size,
  })
  // Harness settling uses the native scheduler so it cannot count itself.
  window.packedSettle = () => new Promise(resolve => request(() => request(resolve)))
  window.packedFaults = []
  window.addEventListener('error', event => {
    if (window.packedFaultArmed && event.message.includes('packed fixture: measurement')) {
      window.packedFaults.push(event.message)
      event.preventDefault()
    }
  })
}

export const clientSource = `import * as React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import * as SV from 'scrollvars'
import { App } from './app'
const container = document.getElementById('app')
const markup = container.innerHTML
container.innerHTML = ''
// Establish the documented process-wide driver and React delegation baseline
// on an empty route, before any Section or kit component mounts.
const warm = createRoot(container)
flushSync(() => warm.render(null))
warm.unmount()
const stop = SV.scan(container)
stop()
// The driver can still hold one deferred frame right after stop(): settle
// until no frame is pending, so the baseline is the quiescent route and a
// leaked loop after unmount reads as extra frames, never as "the same one".
;(async () => {
  for (let i = 0; i < 20; i++) { await window.packedSettle(); if (!window.packedResources().frames) break }
  window.packedBaseline = window.packedResources()
  container.innerHTML = markup
  window.packedHydrationErrors = []
  let root = hydrateRoot(container, <App />, { onRecoverableError: error => window.packedHydrationErrors.push(String(error)) })
  window.packed = {
    SV,
    unmount() { root.unmount() },
    mount() { root = createRoot(container); flushSync(() => root.render(<App />)) },
    fail() {
      const el = document.querySelector('#failed-section .sv-steps')
      window.packedFaultArmed = true
      el.getBoundingClientRect = () => { throw Error('packed fixture: measurement') }
      SV.refresh()
    },
    restore() { delete document.querySelector('#failed-section .sv-steps').getBoundingClientRect },
  }
})()
`
