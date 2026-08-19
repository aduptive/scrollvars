'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { EffectOptions } from '../canvas'
import { mountEffect } from '../canvas'
import type { TrackOptions } from '../core/driver'
import { scrollToScene, track } from '../core/driver'
import type { PointerOptions } from '../core/pointer'
import { trackPointer } from '../core/pointer'

type Callbacks = Pick<TrackOptions, 'onLive' | 'onScene' | 'onTravel'>

/**
 * Track an element with the scroll driver.
 * No React state is touched on scroll — values land as CSS variables.
 */
export function useTrack<T extends HTMLElement = HTMLDivElement>(
  options: TrackOptions = {}
) {
  const ref = useRef<T>(null)

  // latest-ref pattern: callbacks never force a re-track
  const callbacksRef = useRef<Callbacks>({})
  callbacksRef.current = {
    onLive: options.onLive,
    onScene: options.onScene,
    onTravel: options.onTravel,
  }

  const { view, travel, scenes, snap, once, pin } = options
  const hasTravelCb = !!options.onTravel

  useEffect(() => {
    if (!ref.current) return
    return track(ref.current, {
      view,
      travel,
      scenes,
      snap,
      once,
      pin,
      onLive: (live) => callbacksRef.current.onLive?.(live),
      onScene: (scene) => callbacksRef.current.onScene?.(scene),
      onTravel: hasTravelCb
        ? (t) => callbacksRef.current.onTravel?.(t)
        : undefined,
    })
  }, [view, travel, scenes, snap, once, pin, hasTravelCb])

  return ref
}

export interface TrackProps
  extends React.HTMLAttributes<HTMLElement>,
    TrackOptions {
  as?: React.ElementType
}

/** The base building block: a tag tracked by the driver. */
export const Track: React.FC<TrackProps> = ({
  as: Tag = 'div',
  view,
  travel,
  scenes,
  snap,
  once,
  pin,
  onLive,
  onScene,
  onTravel,
  className,
  children,
  ...rest
}) => {
  const ref = useTrack({ view, travel, scenes, snap, once, pin, onLive, onScene, onTravel })

  return (
    <Tag ref={ref} className={className ? `sv ${className}` : 'sv'} {...rest}>
      {children}
    </Tag>
  )
}

export interface RevealProps extends Omit<TrackProps, 'scenes' | 'travel'> {
  /** Animate every direct child with an automatic stagger — no classes needed. */
  auto?: boolean
}

/**
 * Entrance section: latches once, children rise in with a stagger.
 * With `auto`, direct children animate in DOM order (opt one out with
 * `sv-skip`); without it, mark children with `sv-rise` / `sv-fade` and
 * order them via `--sv-order`.
 */
export const Reveal: React.FC<RevealProps> = ({ auto, className, ...rest }) => (
  <Track
    once
    className={[auto && 'sv-auto', className].filter(Boolean).join(' ')}
    {...rest}
  />
)

export interface ParallaxProps extends Omit<TrackProps, 'scenes'> {
  /** How far the content drifts (CSS length, default 6rem). */
  distance?: string
}

/** Continuous drift tied to the scroll position — no transition lag. */
export const Parallax: React.FC<ParallaxProps> = ({
  distance,
  className,
  children,
  style,
  ...rest
}) => (
  <Track
    className={className}
    style={distance ? ({ ...style, '--sv-distance': distance } as React.CSSProperties) : style}
    {...rest}
  >
    <div className="sv-drift">{children}</div>
  </Track>
)

export interface ScenesState {
  /** Current scene index (re-renders only on integer change). */
  scene: number
  goTo: (scene: number, smooth?: boolean) => void
}

export function useScenes<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options: Omit<TrackOptions, 'scenes' | 'onScene'> = {}
) {
  const [scene, setScene] = useState(0)

  const ref = useTrack<T>({
    ...options,
    scenes: count,
    onScene: setScene,
  })

  const goTo = useCallback(
    (target: number, smooth = true) => {
      if (ref.current) scrollToScene(ref.current, target, count, smooth)
    },
    [count]
  )

  return { ref, scene, goTo }
}

export interface ScenesProps extends Omit<TrackProps, 'scenes' | 'children'> {
  count: number
  /** Container height; defaults to one viewport per scene. */
  height?: string
  children: (state: ScenesState) => React.ReactNode
}

/**
 * Pinned storytelling: the container is N screens tall, the content sticks
 * and the scroll drives the scene index. The continuous `--sv-scene`
 * variable stays on the element for pure-CSS effects (progress bars).
 */
export const Scenes: React.FC<ScenesProps> = ({
  count,
  height,
  children,
  style,
  className,
  ...rest
}) => {
  const { ref, scene, goTo } = useScenes(count)

  return (
    <div
      ref={ref}
      className={className ? `sv ${className}` : 'sv'}
      style={{ height: height ?? `${count * 100}vh`, position: 'relative', ...style }}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {children({ scene, goTo })}
      </div>
    </div>
  )
}

/**
 * Mount a canvas effect (see `scrollvars/canvas`). Callbacks follow the
 * latest-ref pattern — changing them never remounts the effect.
 */
export function useCanvasEffect(options: EffectOptions) {
  const ref = useRef<HTMLCanvasElement>(null)

  const optionsRef = useRef(options)
  optionsRef.current = options

  const { dprCap, autoPause } = options

  useEffect(() => {
    if (!ref.current) return
    const handle = mountEffect(ref.current, {
      dprCap,
      autoPause,
      setup: (fx) => optionsRef.current.setup?.(fx),
      frame: (fx, dt) => optionsRef.current.frame(fx, dt),
      resize: (fx) => optionsRef.current.resize?.(fx),
    })
    return handle.destroy
  }, [dprCap, autoPause])

  return ref
}

/** Pointer tilt for every `.sv-tilt` descendant — one delegated listener. */
export function usePointer<T extends HTMLElement = HTMLDivElement>(
  options: PointerOptions = {}
) {
  const ref = useRef<T>(null)
  const selector = options.selector

  useEffect(() => {
    if (!ref.current) return
    return trackPointer(ref.current, { selector })
  }, [selector])

  return ref
}
