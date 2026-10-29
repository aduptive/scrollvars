import { mountEffect, type EffectFrame, type EffectHandle } from '../canvas/index.js'
import { lifetime, reportFailure } from '../core/lifetime.js'
import { vertex, fragment } from './shaders.js'
import { createGaussianBlur } from './blur.js'

export interface GlassMaterial {
  /** Percent of scene width, 1–20. Default 8. */
  edgeWidth?: number
  /** 0–100, default 55. */
  refraction?: number
  /** 0–100, default 60. */
  dispersion?: number
  /** 0–100, default 0: flat beyond the edge band. */
  interior?: number
  /** Horizontal position, 0–100, default 42. */
  position?: number
  /** Overlay opacity, 0–100. Default 100. */
  opacity?: number
  /** Glass tint and edge-light color, #RGB or #RRGGBB. Default white. */
  color?: string
  /** Scene softening radius in CSS pixels, 0–24. Default 0. */
  blur?: number
  /** Thin edge-light intensity, 0–100. Default 12. */
  edgeGlow?: number
  /** Fixed point, pointer-following point, or a slow 120-second orbit. */
  lightMode?: 'static' | 'pointer' | 'float'
  /** Fixed light coordinates as percent of the scene, 0–100. */
  lightX?: number
  lightY?: number
}

export interface GlassOptions extends GlassMaterial {
  /** Explicit scene texture. Called on first render, resize and invalidateSource.
   * Paint at fx.width/height (CSS pixels), or return a loaded same-origin/CORS image.
   * This does not capture arbitrary HTML children. */
  source: (fx: EffectFrame) => TexImageSource
  dprCap?: number
  onError?: (error: unknown) => void
}

export interface GlassHandle extends EffectHandle {
  update: (material: GlassMaterial) => void
  invalidateSource: () => void
}

const defaults = { edgeWidth: 8, refraction: 55, dispersion: 60, interior: 0, position: 42, opacity: 100, blur: 0, edgeGlow: 12, lightX: 25, lightY: 0 }
function normalize(input: GlassMaterial, previous = { ...defaults, color: '#ffffff', lightMode: 'static' as 'static' | 'pointer' | 'float' }) {
  const next = { ...previous }
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const value = input[key]
    if (value === undefined) continue
    if (!Number.isFinite(value)) throw new TypeError(`Glass ${key} must be finite`)
    const max = key === 'edgeWidth' ? 20 : key === 'blur' ? 24 : 100
    next[key] = Math.max(key === 'edgeWidth' ? 1 : 0, Math.min(max, value))
  }
  if (input.color !== undefined) {
    if (typeof input.color !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(input.color))
      throw new TypeError('Glass color must be #RGB or #RRGGBB')
    const hex = input.color.slice(1).toLowerCase()
    next.color = '#' + (hex.length === 3 ? [...hex].map(c => c + c).join('') : hex)
  }
  if (input.lightMode !== undefined) {
    if (!['static', 'pointer', 'float'].includes(input.lightMode)) throw new TypeError('Glass lightMode must be static, pointer or float')
    next.lightMode = input.lightMode
  }
  return next
}

/** Decorative WebGL overlay; the caller keeps accessible content underneath. */
export function mountGlass(canvas: HTMLCanvasElement, options: GlassOptions): GlassHandle {
  let material = normalize(options)
  if (options.dprCap !== undefined && (!Number.isFinite(options.dprCap) || options.dprCap <= 0))
    throw new TypeError('Glass dprCap must be positive and finite')
  const life = lifetime()
  let effect: EffectHandle | undefined
  let render: ((fx: EffectFrame) => void) | undefined
  let dirty = true, upload = true, lastReduced: boolean | undefined
  let phase = 0, pointer: [number, number] | undefined
  const oldHidden = canvas.hidden
  const fail = (error: unknown) => {
    if (life.stopped) return
    try { life.stop() } finally { canvas.hidden = true }
    try { options.onError ? options.onError(error) : reportFailure(error) }
    catch (callbackError) { reportFailure(callbackError) }
  }
  const safely = (fn: () => void) => { if (!life.stopped) { try { fn() } catch (error) { fail(error) } } }
  life.setup(() => {
    // An empty transparent canvas must participate in layout for the harness to measure it.
    canvas.hidden = false
    life.defer(() => { canvas.hidden = oldHidden })
    // Register before setup can run synchronously in an observer implementation.
    life.defer(() => effect?.destroy())
    const target = canvas.parentElement ?? canvas
    // Pointer events feed uniforms; the canvas harness remains the only frame scheduler.
    const move = (event: PointerEvent) => {
      if (material.lightMode !== 'pointer') return
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer = [Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))]
      dirty = true
    }
    const leave = () => { if (pointer) { pointer = undefined; dirty = true } }
    target.addEventListener('pointermove', move)
    life.defer(() => target.removeEventListener('pointermove', move))
    target.addEventListener('pointerleave', leave)
    life.defer(() => target.removeEventListener('pointerleave', leave))
    effect = mountEffect(canvas, {
      context: null,
      dprCap: options.dprCap,
      setup() {
        safely(() => {
          const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true })
          if (!gl) throw new Error('Glass requires WebGL')
          const compile = (type: number, text: string) => {
            const shader = gl.createShader(type)
            if (!shader) throw new Error('Glass shader allocation failed')
            life.defer(() => gl.deleteShader(shader))
            gl.shaderSource(shader, text); gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Glass shader compilation failed')
            return shader
          }
          const program = gl.createProgram()
          if (!program) throw new Error('Glass program allocation failed')
          life.defer(() => gl.deleteProgram(program))
          gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex))
          gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program)
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Glass program link failed')
          gl.useProgram(program)
          const buffer = gl.createBuffer()
          if (buffer) life.defer(() => gl.deleteBuffer(buffer))
          const texture = gl.createTexture()
          if (texture) life.defer(() => gl.deleteTexture(texture))
          if (!buffer || !texture) throw new Error('Glass buffer allocation failed')
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
          const attribute = gl.getAttribLocation(program, 'a_position')
          gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
          gl.bindTexture(gl.TEXTURE_2D, texture)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          const uniforms = Object.fromEntries(['u_size','u_points[0]','u_strength','u_dispersion','u_interior','u_edge_width','u_opacity','u_color','u_edge_glow','u_light'].map(name => [name, gl.getUniformLocation(program, name)]))
          gl.uniform1i(gl.getUniformLocation(program, 'u_scene'), 0)
          if ('drawingBufferColorSpace' in gl) gl.drawingBufferColorSpace = 'srgb'
          const lost = (event: Event) => { event.preventDefault(); fail(new Error('Glass WebGL context lost; remount to retry')) }
          canvas.addEventListener('webglcontextlost', lost)
          life.defer(() => canvas.removeEventListener('webglcontextlost', lost))
          let blurPass: ReturnType<typeof createGaussianBlur> | undefined
          let blurred: WebGLTexture | undefined, blurredFor = -1
          render = fx => {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            if (upload) {
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options.source(fx))
              upload = false
              blurredFor = -1
            }
            const { width, height } = fx
            if (material.blur > 0 && blurredFor !== material.blur) {
              blurPass ??= createGaussianBlur(gl, compile, release => life.defer(release))
              blurred = blurPass(texture, width, height, material.blur)
              blurredFor = material.blur
            }
            gl.useProgram(program)
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
            gl.bindTexture(gl.TEXTURE_2D, material.blur > 0 ? blurred! : texture)
            const shift = ((fx.reducedMotion ? defaults.position : material.position) - 50) / 100
            const points = [[.29+shift,.08],[.73+shift,.27],[1.01+shift,1.5],[.55+shift,1.5],[.21+shift,.21]].flatMap(([x,y]) => [x*width,y*height])
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.uniform2f(uniforms.u_size, width, height)
            gl.uniform2fv(uniforms['u_points[0]'], new Float32Array(points))
            gl.uniform1f(uniforms.u_strength, material.refraction / 100)
            gl.uniform1f(uniforms.u_dispersion, material.dispersion / 100)
            gl.uniform1f(uniforms.u_interior, material.interior / 100)
            gl.uniform1f(uniforms.u_edge_width, material.edgeWidth / 100)
            gl.uniform1f(uniforms.u_opacity, material.opacity / 100)
            gl.uniform1f(uniforms.u_edge_glow, material.edgeGlow / 100)
            let light = [material.lightX / 100, material.lightY / 100]
            if (!fx.reducedMotion && material.lightMode === 'pointer' && pointer) light = pointer
            if (!fx.reducedMotion && material.lightMode === 'float') light = [.5 + .45 * Math.cos(phase), .35 + .55 * Math.sin(phase)]
            gl.uniform2f(uniforms.u_light, light[0], light[1])
            gl.uniform3fv(uniforms.u_color, new Float32Array([1,3,5].map(i => parseInt(material.color.slice(i, i + 2), 16) / 255)))
            gl.drawArrays(gl.TRIANGLES, 0, 6)
            if (gl.getError() !== gl.NO_ERROR) throw new Error('Glass texture or draw failed (check image readiness and CORS)')
            canvas.hidden = false
          }
        })
        return () => {
          if (!life.stopped) {
            try { life.stop() } finally { canvas.hidden = true }
          }
        }
      },
      resize() { dirty = upload = true },
      frame(fx, dt) {
        if (fx.reducedMotion !== lastReduced) { dirty = true; lastReduced = fx.reducedMotion }
        if (material.lightMode === 'float' && !fx.reducedMotion && material.edgeGlow > 0) { phase = (phase + dt * Math.PI / 60) % (Math.PI * 2); dirty = true }
        if (!dirty) return
        safely(() => { render?.(fx); dirty = false })
      },
    })
    if (life.stopped) effect.destroy()
  })
  return {
    update(next) {
      if (life.stopped) return
      const normalized = normalize(next, material)
      if (normalized.lightMode !== material.lightMode || normalized.color !== material.color || Object.keys(defaults).some(key => normalized[key as keyof typeof defaults] !== material[key as keyof typeof defaults])) {
        material = normalized; dirty = true
      }
    },
    invalidateSource() { if (!life.stopped) dirty = upload = true },
    pause() { if (!life.stopped) effect?.pause() },
    resume() { if (!life.stopped) effect?.resume() },
    destroy: life.stop,
  }
}
