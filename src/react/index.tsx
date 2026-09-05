'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { EffectOptions } from '../canvas/index.js'
import { mountEffect } from '../canvas/index.js'
import type { TrackOptions } from '../core/driver.js'
import { scrollToScene, track } from '../core/driver.js'
import type { PointerOptions } from '../core/pointer.js'
import { trackPointer } from '../core/pointer.js'
import { scan } from '../core/scan.js'
import { toggles } from '../core/toggles.js'
import type { SliderHandle, SliderOptions } from '../core/slider.js'
import { slider } from '../core/slider.js'
import { splitParts } from '../core/split.js'

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
  useEffect(() => {
    const stopScan = scan()
    const stopToggles = toggles()
    // dev convenience: ?sv-debug mounts the overlay (code-split — costs
    // nothing unless the flag is present)
    let stopDebug: (() => void) | undefined
    if (new URLSearchParams(location.search).has('sv-debug')) {
      import('../debug/index.js').then((m) => {
        stopDebug = m.debug()
      })
    }
    return () => {
      stopScan()
      stopToggles()
      stopDebug?.()
    }
  }, [])
  return null
}

type Callbacks = Pick<TrackOptions, 'onLive' | 'onScene' | 'onTravel' | 'onPin'>

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
    onPin: options.onPin,
  }

  const { view, travel, scenes, snap, once, pin, root, enter, exit } = options
  const hasTravelCb = !!options.onTravel
  const hasPinCb = !!options.onPin

  useEffect(() => {
    if (!ref.current) return
    return track(ref.current, {
      view,
      travel,
      scenes,
      snap,
      once,
      pin,
      root,
      enter,
      exit,
      onLive: (live) => callbacksRef.current.onLive?.(live),
      onScene: (scene) => callbacksRef.current.onScene?.(scene),
      onTravel: hasTravelCb
        ? (t) => callbacksRef.current.onTravel?.(t)
        : undefined,
      onPin: hasPinCb
        ? (p) => callbacksRef.current.onPin?.(p)
        : undefined,
    })
  }, [view, travel, scenes, snap, once, pin, root, enter, exit, hasTravelCb, hasPinCb])

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
  root,
  enter,
  exit,
  onLive,
  onScene,
  onTravel,
  onPin,
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
  const ref = useTrack({ view, travel, scenes, snap, once, pin, root, enter, exit, onLive, onScene, onTravel, onPin })

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
export interface SplitProps extends React.HTMLAttributes<HTMLElement>, VarProps {
  children: string
  /** 'word' (default) or 'char'. */
  by?: 'word' | 'char'
  as?: React.ElementType
}

// aria-label is prohibited on generic roles (p/span/div) — axe
// `aria-prohibited-attr` — so the readable text is a visually-hidden child.
const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

/**
 * SplitText-lite, server-rendered: the text arrives as word/char spans with
 * `--sv-order` already in the HTML — no client-side splitting, no layout
 * shift, no hydration flash. Pair with `sv-split-rise` (staggered entrance)
 * or `sv-reading` (scrubbed) on a tracked ancestor.
 */
export const Split: React.FC<SplitProps> = ({
  children,
  by = 'word',
  as: Tag = 'span',
  className,
  style,
  order,
  distance,
  stagger,
  duration,
  ease,
  ...rest
}) => {
  const words = children.split(/\s+/).filter(Boolean)
  let index = 0
  return (
    <Tag
      className={className ? `sv-split ${className}` : 'sv-split'}
      style={{
        '--sv-count': splitParts(children, by).length,
        ...varStyle({ order, distance, stagger, duration, ease }, style),
      } as React.CSSProperties}
      {...rest}
    >
      <span style={SR_ONLY}>{children}</span>
      {words.map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          {by === 'word' ? (
            <span aria-hidden="true" style={{ '--sv-order': index++ } as React.CSSProperties}>
              {word}
            </span>
          ) : (
            Array.from(word).map((ch, c) => (
              <span
                key={c}
                aria-hidden="true"
                style={{ '--sv-order': index++ } as React.CSSProperties}
              >
                {ch}
              </span>
            ))
          )}
        </React.Fragment>
      ))}
    </Tag>
  )
}

export const Scenes: React.FC<ScenesProps> = ({
  count,
  height,
  children,
  style,
  className,
  as: Tag = 'div',
  view,
  travel,
  snap,
  once,
  pin,
  onLive,
  onScene,
  onTravel,
  onPin,
  order,
  distance,
  stagger,
  duration,
  ease,
  ...rest
}) => {
  const { ref, scene, goTo } = useScenes(count, {
    view,
    travel,
    snap,
    once,
    pin,
    onLive,
    onTravel,
    onPin,
  })
  const onSceneRef = useRef(onScene)
  onSceneRef.current = onScene
  useEffect(() => {
    onSceneRef.current?.(scene)
  }, [scene])

  return (
    <Tag
      ref={ref}
      className={className ? `sv ${className}` : 'sv'}
      style={{
        height: height ?? `${count * 100}vh`,
        position: 'relative',
        ...varStyle({ order, distance, stagger, duration, ease }, style),
      }}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {children({ scene, goTo })}
      </div>
    </Tag>
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

  const { dprCap, autoPause, context } = options

  useEffect(() => {
    if (!ref.current) return
    const handle = mountEffect(ref.current, {
      dprCap,
      autoPause,
      context,
      setup: (fx) => optionsRef.current.setup?.(fx),
      frame: (fx, dt) => optionsRef.current.frame(fx, dt),
      resize: (fx) => optionsRef.current.resize?.(fx),
    })
    return handle.destroy
  }, [dprCap, autoPause, context])

  return ref
}

/**
 * Featherweight carousel on native scroll + snap (see `scrollvars/slider`
 * docs in the core module). Returns the container ref, the active index
 * (re-renders only when it changes) and next/prev/goTo controls. Slides get
 * `--sd` / `.sv-active` for pure-CSS animation.
 */
export function useSlider(options: Omit<SliderOptions, 'onSlide'> = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const handleRef = useRef<SliderHandle | null>(null)
  const [active, setActive] = useState(0)
  const { snap, drag, duration, axis } = options
  const onScrollRef = useRef(options.onScroll)
  onScrollRef.current = options.onScroll

  useEffect(() => {
    if (!ref.current) return
    const handle = slider(ref.current, {
      snap,
      drag,
      duration,
      axis,
      onSlide: setActive,
      onScroll: (state) => onScrollRef.current?.(state),
    })
    handleRef.current = handle
    return handle.destroy
  }, [snap, drag, duration, axis])

  const next = useCallback((smooth?: boolean) => handleRef.current?.next(smooth), [])
  const prev = useCallback((smooth?: boolean) => handleRef.current?.prev(smooth), [])
  const goTo = useCallback(
    (index: number, smooth?: boolean) => handleRef.current?.goTo(index, smooth),
    []
  )

  return { ref, active, next, prev, goTo, handle: handleRef }
}

const BREAKPOINTS: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/** Media-query CSS for a responsive perView map — breakpoints ARE media
 * queries here (Tailwind-style keys or raw min-width numbers). */
function perViewCss(scope: string, perView: Record<string, number>): string {
  let css = ''
  const entries = Object.entries(perView)
    .filter(([key]) => key !== 'base')
    .sort(([a], [b]) => (BREAKPOINTS[a] ?? Number(a)) - (BREAKPOINTS[b] ?? Number(b)))
  if ('base' in perView) css += `${scope}{--sv-per-view:${perView.base}}`
  for (const [key, value] of entries) {
    css += `@media (min-width:${BREAKPOINTS[key] ?? Number(key)}px){${scope}{--sv-per-view:${value}}}`
  }
  return css
}

export interface SliderComponentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onScroll'> {
  /** Slides per view — a number, or a responsive map: `{ base: 1.2, md: 2.5, xl: 4 }`
   * (Tailwind breakpoint names or raw min-width numbers). Fractional = peek. */
  perView?: number | Record<string, number>
  /** Gap between slides (px number or CSS length). */
  gap?: number | string
  snap?: 'mandatory' | 'proximity'
  drag?: boolean
  duration?: number
  axis?: 'x' | 'y'
  arrows?: boolean
  dots?: boolean
  /** Auto-advance interval in ms (wraps to the start). Pauses on hover,
   * keyboard focus, offscreen and hidden tab; renders a visible pause/resume
   * control (APG carousel pattern). */
  autoplay?: number
  /** Accessible name for the carousel region. Default "carousel". */
  label?: string
  pauseIcon?: React.ReactNode
  playIcon?: React.ReactNode
  prevIcon?: React.ReactNode
  nextIcon?: React.ReactNode
  /** Full control over each dot's content; wiring/aria stay handled. */
  renderDot?: (index: number, active: boolean) => React.ReactNode
  onSlide?: (index: number) => void
  children: React.ReactNode
}

/**
 * The batteries-included carousel: `useSlider` + chrome. Everything visual
 * hangs off stable classes (`sv-slider-shell`, `sv-arrow`, `sv-dots`,
 * `sv-dot`) and var knobs (`--sv-arrow-*`, `--sv-dot-*`) — override them
 * globally for the project or per instance via className/style. A ref
 * exposes the full SliderHandle for external controls placed anywhere.
 */
export const Slider = React.forwardRef<SliderHandle | null, SliderComponentProps>(
  function Slider(
    {
      perView,
      gap,
      snap,
      drag,
      duration,
      axis,
      arrows,
      dots,
      autoplay,
      label = 'carousel',
      pauseIcon,
      playIcon,
      prevIcon,
      nextIcon,
      renderDot,
      onSlide,
      className,
      style,
      children,
      ...rest
    },
    apiRef
  ) {
    const { ref, active, next, prev, goTo, handle } = useSlider({ snap, drag, duration, axis })
    const uid = React.useId()
    const count = React.Children.count(children)

    React.useImperativeHandle(
      apiRef,
      // delegate at call time — the handle only exists after the passive
      // effect runs, so capturing handle.current here would freeze null
      () => ({
        next: (smooth?: boolean) => handle.current?.next(smooth),
        prev: (smooth?: boolean) => handle.current?.prev(smooth),
        goTo: (index: number, smooth?: boolean) => handle.current?.goTo(index, smooth),
        seek: (progress: number) => handle.current?.seek(progress),
        active: () => handle.current?.active() ?? 0,
        state: () =>
          handle.current?.state() ?? {
            active: 0,
            count: 0,
            position: 0,
            progress: 0,
            dragging: false,
            gliding: false,
          },
        destroy: () => handle.current?.destroy(),
      }),
      []
    )

    const onSlideRef = useRef(onSlide)
    onSlideRef.current = onSlide
    useEffect(() => {
      onSlideRef.current?.(active)
    }, [active])

    // autoplay: pauses on hover, offscreen and hidden tab
    const hovering = useRef(false)
    const [paused, setPaused] = useState(false)
    const pausedRef = useRef(paused)
    pausedRef.current = paused
    useEffect(() => {
      if (!autoplay || autoplay <= 0) return
      let onscreen = true
      let focused = false
      const io = new IntersectionObserver((entries) => {
        onscreen = entries[entries.length - 1].isIntersecting
      })
      const el = ref.current
      if (el) io.observe(el)
      // WCAG 2.2.2: the pause must be reachable without a mouse — keyboard
      // focus anywhere inside the slider halts autoplay like hover does
      const onFocusIn = () => (focused = true)
      const onFocusOut = () => (focused = false)
      el?.addEventListener('focusin', onFocusIn)
      el?.addEventListener('focusout', onFocusOut)
      const timer = setInterval(() => {
        if (
          pausedRef.current ||
          hovering.current ||
          focused ||
          !onscreen ||
          document.visibilityState === 'hidden'
        )
          return
        const h = handle.current
        if (!h) return
        const s = h.state()
        if (s.active >= s.count - 1) h.goTo(0)
        else h.next()
      }, autoplay)
      return () => {
        clearInterval(timer)
        io.disconnect()
        el?.removeEventListener('focusin', onFocusIn)
        el?.removeEventListener('focusout', onFocusOut)
      }
    }, [autoplay, handle, ref])

    const scope = `[data-sv-uid="${uid}"] .sv-slider`
    const styleVars: Record<string, string | number> = {}
    if (typeof perView === 'number') styleVars['--sv-per-view'] = perView
    if (gap !== undefined) styleVars['--sv-gap'] = typeof gap === 'number' ? `${gap}px` : gap

    const rotating = !!autoplay && autoplay > 0 && !paused
    // APG slide semantics without breaking layout: annotate each child in
    // place (no wrapper — sv-cols and --sv-span target direct children)
    const slides = React.Children.map(children, (child, i) =>
      React.isValidElement<Record<string, unknown>>(child)
        ? React.cloneElement(child, {
            role: (child.props.role as string) ?? 'group',
            'aria-roledescription': child.props['aria-roledescription'] ?? 'slide',
            'aria-label': child.props['aria-label'] ?? `${i + 1} of ${count}`,
          })
        : child
    )

    return (
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className={className ? `sv-slider-shell ${className}` : 'sv-slider-shell'}
        data-sv-uid={uid}
        style={{ ...style, ...styleVars } as React.CSSProperties}
        onPointerEnter={() => (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
        {...rest}
      >
        {perView && typeof perView === 'object' && <style>{perViewCss(scope, perView)}</style>}
        {!!autoplay && autoplay > 0 && (
          <button
            type="button"
            className="sv-pause"
            aria-label={paused ? 'start slide rotation' : 'stop slide rotation'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? (playIcon ?? '\u25b6') : (pauseIcon ?? '\u23f8')}
          </button>
        )}
        <div
          ref={ref}
          aria-live={rotating ? 'off' : 'polite'}
          className={perView !== undefined ? 'sv-slider sv-cols' : 'sv-slider'}
        >
          {slides}
        </div>
        {arrows && (
          <>
            <button
              type="button"
              className="sv-arrow sv-arrow-prev"
              aria-label="previous slide"
              onClick={() => prev()}
            >
              {prevIcon ?? '\u2039'}
            </button>
            <button
              type="button"
              className="sv-arrow sv-arrow-next"
              aria-label="next slide"
              onClick={() => next()}
            >
              {nextIcon ?? '\u203a'}
            </button>
          </>
        )}
        {dots && (
          <div className="sv-dots">
            {Array.from({ length: count }, (_, i) =>
              renderDot ? (
                <button
                  key={i}
                  type="button"
                  aria-label={`go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  style={{ all: 'unset', outline: 'revert', cursor: 'pointer' }}
                >
                  {renderDot(i, i === active)}
                </button>
              ) : (
                <button
                  key={i}
                  type="button"
                  className={i === active ? 'sv-dot on' : 'sv-dot'}
                  aria-label={`go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                />
              )
            )}
          </div>
        )}
      </div>
    )
  }
)

export interface SlideProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Columns this slide spans (per-slide override — vars cascade). */
  span?: number
}

/** One slide. Per-slide knobs are just vars: `span`, or any `--sv-*` in style. */
export const Slide: React.FC<SlideProps> = ({ span, style, ...rest }) => (
  <div
    style={span ? ({ ...style, '--sv-span': span } as React.CSSProperties) : style}
    {...rest}
  />
)

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Seconds for one full loop (default 30). */
  speed?: number
  children: React.ReactNode
}

/** Infinite strip (logos, taglines): two copies of the children on a CSS
 * animation. Pauses on hover; stops under prefers-reduced-motion. */
export const Marquee: React.FC<MarqueeProps> = ({ speed, style, className, children, ...rest }) => (
  <div
    className={className ? `sv-marquee ${className}` : 'sv-marquee'}
    style={
      speed ? ({ ...style, '--sv-marquee-duration': `${speed}s` } as React.CSSProperties) : style
    }
    {...rest}
  >
    <div className="sv-marquee-track">
      {children}
      <span aria-hidden="true" inert style={{ display: 'contents' }}>
        {children}
      </span>
    </div>
  </div>
)

export interface AccordionProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> {
  title: React.ReactNode
  /** Same name = native exclusive group (one open at a time). */
  group?: string
  children: React.ReactNode
}

/** Native <details> with animated height — accessibility for free. */
export const Accordion: React.FC<AccordionProps> = ({
  title,
  group,
  className,
  children,
  ...rest
}) => (
  <details
    className={className ? `sv-accordion ${className}` : 'sv-accordion'}
    name={group}
    {...rest}
  >
    <summary>{title}</summary>
    {children}
  </details>
)

export interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  open: boolean
  onClose?: () => void
  children: React.ReactNode
}

/** Native <dialog> + the sv-pop entry/exit preset. */
export const Modal: React.FC<ModalProps> = ({ open, onClose, className, children, ...rest }) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={className ? `sv-pop ${className}` : 'sv-pop'}
      onClose={onClose}
      {...rest}
    >
      {children}
    </dialog>
  )
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
