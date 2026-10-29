import { vertex } from './shaders.js'

/** Dense, separable Gaussian in CSS-pixel space. No gaps between kernel samples. */
export const gaussianFragment = `precision highp float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform vec2 u_axis;
uniform float u_sigma;
void main(){
 vec3 sum=vec3(0.0);float weights=0.0;
 for(int i=-72;i<=72;i++){
  float x=float(i);
  if(abs(x)>ceil(3.0*u_sigma))continue;
  float weight=exp(-0.5*x*x/(u_sigma*u_sigma));
  vec2 uv=clamp(v_uv+u_axis*x,vec2(0.0),vec2(1.0));
  sum+=pow(texture2D(u_scene,uv).rgb,vec3(2.2))*weight;weights+=weight;
 }
 gl_FragColor=vec4(pow(sum/weights,vec3(1.0/2.2)),1.0);
}`

export function createGaussianBlur(
  gl: WebGLRenderingContext,
  compile: (type: number, source: string) => WebGLShader,
  defer: (cleanup: () => void) => void,
) {
  const program = gl.createProgram()
  if (!program) throw new Error('Glass blur program allocation failed')
  defer(() => gl.deleteProgram(program))
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, gaussianFragment)); gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Glass blur link failed')
  const textures = [0,1].map(() => {
    const texture = gl.createTexture()
    if (!texture) throw new Error('Glass blur texture allocation failed')
    defer(() => gl.deleteTexture(texture))
    gl.bindTexture(gl.TEXTURE_2D, texture)
    for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR)
    for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE)
    return texture
  })
  const framebuffer = gl.createFramebuffer()
  if (!framebuffer) throw new Error('Glass blur framebuffer allocation failed')
  defer(() => gl.deleteFramebuffer(framebuffer))
  const axis = gl.getUniformLocation(program, 'u_axis'), sigma = gl.getUniformLocation(program, 'u_sigma')
  const attribute = gl.getAttribLocation(program, 'a_position')
  let width = 0, height = 0
  return (source: WebGLTexture, cssWidth: number, cssHeight: number, radius: number) => {
    const w = Math.max(1, Math.round(cssWidth)), h = Math.max(1, Math.round(cssHeight))
    if (w !== width || h !== height) {
      for (const texture of textures) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      }
      width = w; height = h
    }
    gl.useProgram(program); gl.uniform1i(gl.getUniformLocation(program, 'u_scene'), 0)
    gl.uniform1f(sigma, radius)
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
    gl.viewport(0, 0, w, h); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    try {
      for (let pass = 0; pass < 2; pass++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[pass], 0)
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Glass blur framebuffer incomplete')
        gl.bindTexture(gl.TEXTURE_2D, pass === 0 ? source : textures[0])
        gl.uniform2f(axis, pass === 0 ? 1/cssWidth : 0, pass === 1 ? 1/cssHeight : 0)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
    } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, null) }
    return textures[1]
  }
}
