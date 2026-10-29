'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { mountGlass, type GlassHandle, type GlassOptions } from '../glass/index.js'

export interface GlassProps extends GlassOptions {
  as?: 'div' | 'span'
  className?: string
  children?: React.ReactNode
}

/** Import scrollvars/styles/glass.css. Children remain semantic HTML, not a texture capture. */
export const Glass = forwardRef<GlassHandle, GlassProps>(function Glass({
  as: Tag = 'div', className, children, source, onError, dprCap,
  edgeWidth = 8, refraction = 55, dispersion = 60, interior = 0, position = 42,
  opacity = 100, color = '#ffffff', blur = 0, edgeGlow = 12,
  lightMode = 'static', lightX = 25, lightY = 0,
}, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const handle = useRef<GlassHandle | null>(null)
  const latest = useRef({ source, onError })
  latest.current = { source, onError }
  useImperativeHandle(ref, () => ({
    update: next => handle.current?.update(next),
    invalidateSource: () => handle.current?.invalidateSource(),
    pause: () => handle.current?.pause(),
    resume: () => handle.current?.resume(),
    destroy: () => handle.current?.destroy(),
  }), [])
  useEffect(() => {
    if (!canvas.current) return
    const mounted = mountGlass(canvas.current, {
      dprCap, source: fx => latest.current.source(fx),
      onError: error => { if (latest.current.onError) latest.current.onError(error); else console.error(error) },
    })
    handle.current = mounted
    return () => { handle.current = null; mounted.destroy() }
  }, [Tag, dprCap])
  useEffect(() => {
    handle.current?.update({ edgeWidth, refraction, dispersion, interior, position, opacity, color, blur, edgeGlow, lightMode, lightX, lightY })
  }, [Tag, dprCap, edgeWidth, refraction, dispersion, interior, position, opacity, color, blur, edgeGlow, lightMode, lightX, lightY])
  useEffect(() => { handle.current?.invalidateSource() }, [source])
  return <Tag className={['sv-glass', className].filter(Boolean).join(' ')}>
    {children}<canvas className="sv-glass-canvas" ref={canvas} aria-hidden="true" hidden />
  </Tag>
})
