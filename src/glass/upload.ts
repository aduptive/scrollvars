/** Detect accelerated Canvas2D uploads swapping R/B (Firefox/Linux, Mozilla 2092687).
 * Run once per Glass context, before its first Canvas2D scene upload. */
function canvasNeedsPixelUpload(gl: WebGLRenderingContext): boolean {
  const canvas = document.createElement('canvas')
  // Small canvases bypass the accelerated path where the driver defect occurs.
  canvas.width = canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Glass canvas upload probe requires Canvas 2D')
  context.fillStyle = '#0000ff'
  context.fillRect(0, 0, 512, 512)
  const framebuffer = gl.createFramebuffer()
  if (!framebuffer) throw new Error('Glass upload probe framebuffer allocation failed')
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.getParameter(gl.TEXTURE_BINDING_2D), 0)
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error('Glass upload probe framebuffer incomplete')
    const pixel = new Uint8Array(4)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
    if (gl.getError() !== gl.NO_ERROR) throw new Error('Glass upload probe failed')
    if (pixel[0] < 5 && pixel[1] < 5 && pixel[2] > 250 && pixel[3] > 250) return false
    if (pixel[0] > 250 && pixel[1] < 5 && pixel[2] < 5 && pixel[3] > 250) return true
    throw new Error('Glass canvas upload returned unexpected colors')
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(framebuffer)
    canvas.width = canvas.height = 0
  }
}

export function createSceneUploader(gl: WebGLRenderingContext) {
  let pixelUpload: boolean | undefined
  return (source: TexImageSource) => {
    const context = 'getContext' in source ? (source as HTMLCanvasElement).getContext('2d') : null
    if (context) pixelUpload ??= canvasNeedsPixelUpload(gl)
    if (context && pixelUpload) {
      const { data, width, height } = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
    } else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  }
}
