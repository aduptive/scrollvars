'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { ScrollVarsOptions } from '../core/driver'
import { register, scrollToKeyframe } from '../core/driver'

type Callbacks = Pick<ScrollVarsOptions, 'onActive' | 'onKeyframe' | 'onProgress'>

/**
 * Register an element with the scroll driver.
 * No React state is touched on scroll — values land as CSS variables.
 */
export function useScrollVars<T extends HTMLElement = HTMLDivElement>(
  options: ScrollVarsOptions = {}
) {
  const ref = useRef<T>(null)

  // latest-ref pattern: callbacks never force a re-register
  const callbacksRef = useRef<Callbacks>({})
  callbacksRef.current = {
    onActive: options.onActive,
    onKeyframe: options.onKeyframe,
    onProgress: options.onProgress,
  }

  const { distance, progress, keyframes, snap, once } = options

  useEffect(() => {
    if (!ref.current) return
    return register(ref.current, {
      distance,
      progress,
      keyframes,
      snap,
      once,
      onActive: (active) => callbacksRef.current.onActive?.(active),
      onKeyframe: (index) => callbacksRef.current.onKeyframe?.(index),
      onProgress: options.onProgress
        ? (p) => callbacksRef.current.onProgress?.(p)
        : undefined,
    })
  }, [distance, progress, keyframes, snap, once])

  return ref
}

export interface AnimatedProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onProgress'>,
    ScrollVarsOptions {
  as?: React.ElementType
}

/** Convenience wrapper: a tag registered with the driver. */
export const Animated: React.FC<AnimatedProps> = ({
  as: Tag = 'div',
  distance,
  progress,
  keyframes,
  snap,
  once,
  onActive,
  onKeyframe,
  onProgress,
  className,
  children,
  ...rest
}) => {
  const ref = useScrollVars({
    distance,
    progress,
    keyframes,
    snap,
    once,
    onActive,
    onKeyframe,
    onProgress,
  })

  return (
    <Tag ref={ref} className={className ? `sv ${className}` : 'sv'} {...rest}>
      {children}
    </Tag>
  )
}

export interface UseKeyframesResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>
  /** Current snapped keyframe index (re-renders only on integer change). */
  index: number
  moveTo: (index: number, smooth?: boolean) => void
}

/**
 * Scroll-driven keyframe sections: `index` is React state (for content),
 * the continuous `--kf` variable stays on the element (for styling).
 */
export function useKeyframes<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options: Omit<ScrollVarsOptions, 'keyframes' | 'onKeyframe'> = {}
): UseKeyframesResult<T> {
  const [index, setIndex] = useState(0)

  const ref = useScrollVars<T>({
    ...options,
    progress: true,
    keyframes: count,
    onKeyframe: setIndex,
  })

  const moveTo = useCallback(
    (target: number, smooth = true) => {
      if (ref.current) scrollToKeyframe(ref.current, target, count, smooth)
    },
    [count]
  )

  return { ref, index, moveTo }
}
