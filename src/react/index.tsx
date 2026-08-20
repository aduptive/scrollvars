'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { EffectOptions } from '../canvas/index.js'
import { mountEffect } from '../canvas/index.js'
import type { TrackOptions } from '../core/driver.js'
import { scrollToScene, track } from '../core/driver.js'
import type { PointerOptions } from '../core/pointer.js'
import { trackPointer } from '../core/pointer.js'
import { scan } from '../core/scan.js'

/**
 * Zero-wrapper mode: drop one `<ScrollVarsBoot />` in the root layout and
 * write plain server components with `data-sv` attributes — no client
 * wrappers anywhere else. New nodes (route changes, streamed content) are
 * picked up automatically.
 *
 *   // app/layout.tsx
 *   <body><ScrollVarsBoot />{children}</body>
 *
 *   // any RSC — stays on the server
 *   <section data-sv data-sv-once className="…">
 *     <h2 className="sv-rise">Title</h2>
 *   </section>
 */
export const ScrollVarsBoot: React.FC = () => {
  useEffect(() => scan(), [])
  return null
}

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

/**
 * Animation knobs as component attributes — sugar that compiles to the
 * corresponding CSS variables. The variables stay the real API; these
 * props just save the `style={{'--sv-…'}}` ceremony.
 */
export interface VarProps {
  /** Stagger position (`--sv-order`). */
  order?: number
  /** Travel distance, any CSS length (`--sv-distance`). */
  distance?: string
  /** Per-order delay in ms (`--sv-stagger`). */
  stagger?: number
  /** Transition duration in ms (`--sv-duration`). */
  duration?: number
  /** Timing function (`--sv-ease`). */
  ease?: string
}

function varStyle(
  { order, distance, stagger, duration, ease }: VarProps,
  style?: React.CSSProperties
): React.CSSProperties | undefined {
  if (
    order === undefined &&
    distance === undefined &&
    stagger === undefined &&
    duration === undefined &&
    ease === undefined
  ) {
    return style
  }
  const s: Record<string, string | number> = { ...style }
  if (order !== undefined) s['--sv-order'] = order
  if (distance !== undefined) s['--sv-distance'] = distance
  if (stagger !== undefined) s['--sv-stagger'] = `${stagger}ms`
  if (duration !== undefined) s['--sv-duration'] = `${duration}ms`
  if (ease !== undefined) s['--sv-ease'] = ease
  return s as React.CSSProperties
}

export interface TrackProps
  extends React.HTMLAttributes<HTMLElement>,
    TrackOptions,
    VarProps {
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
  order,
  distance,
  stagger,
  duration,
  ease,
  className,
  style,
  children,
  ...rest
}) => {
  const ref = useTrack({ view, travel, scenes, snap, once, pin, onLive, onScene, onTravel })

  return (
    <Tag
      ref={ref}
      className={className ? `sv ${className}` : 'sv'}
      style={varStyle({ order, distance, stagger, duration, ease }, style)}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export type ItemEffect = 'rise' | 'fade' | 'slide-l' | 'slide-r' | 'drift' | 'tilt'

export interface ItemProps extends React.HTMLAttributes<HTMLElement>, VarProps {
  as?: React.ElementType
  /** Which preset animates this element (default 'rise'). */
  effect?: ItemEffect
}

/**
 * A child of a tracked section, fully configured by attributes:
 * `<Item effect="rise" order={2} distance="4rem">` — no classes, no
 * style-variable ceremony. Renders `sv-<effect>` + the vars.
 */
export const Item: React.FC<ItemProps> = ({
  as: Tag = 'div',
  effect = 'rise',
  order,
  distance,
  stagger,
  duration,
  ease,
  className,
  style,
  ...rest
}) => (
  <Tag
    className={className ? `sv-${effect} ${className}` : `sv-${effect}`}
    style={varStyle({ order, distance, stagger, duration, ease }, style)}
    {...rest}
  />
)

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

export interface ParallaxProps extends Omit<TrackProps, 'scenes'> {}

/** Continuous drift tied to the scroll position — no transition lag. */
export const Parallax: React.FC<ParallaxProps> = ({ children, ...rest }) => (
  <Track {...rest}>
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
