'use client'

import React, { useCallback, useRef } from 'react'
import { Glass } from 'scrollvars/react/glass'
import { useTrack } from 'scrollvars/react'
import type { GlassHandle } from 'scrollvars/glass'
import type { EffectFrame } from 'scrollvars/canvas'
import 'scrollvars/styles/glass.css'
import './glass.css'

/** A complete explicit text/gradient scene; arbitrary HTML is not captured. */
export function GlassExample() {
  const glass = useRef<GlassHandle>(null)
  const texture = useRef<HTMLCanvasElement | null>(null)
  const source = useCallback((fx: EffectFrame) => {
    const canvas = texture.current ??= document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(fx.width * fx.dpr))
    canvas.height = Math.max(1, Math.round(fx.height * fx.dpr))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Scene requires Canvas 2D')
    ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0)
    const gradient = ctx.createLinearGradient(0, 0, fx.width, 0)
    gradient.addColorStop(0, '#d7fff7'); gradient.addColorStop(1, '#a69aff')
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, fx.width, fx.height)
    ctx.fillStyle = '#24126c'; ctx.font = `${fx.width * .08}px Arial`
    ctx.textBaseline = 'top'; ctx.fillText('Technology that connects.', fx.width * .06, fx.height * .36)
    return canvas
  }, [])
  const section = useTrack<HTMLDivElement>({ view: false, onTravel: t => glass.current?.update({ position: 20 + 50 * t }) })
  return <div ref={section}>
    <Glass ref={glass} source={source} className="glass-example" edgeWidth={8} refraction={55} dispersion={60} interior={0}>
      <h2>Technology that connects.</h2>
    </Glass>
  </div>
}
