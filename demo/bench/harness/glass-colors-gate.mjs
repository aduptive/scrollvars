// Exercise the actual scene uploader with real GL textures, without compositor timing.
import assert from 'node:assert/strict'
import { buildSync } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const script = buildSync({entryPoints:[root + 'src/glass/upload.ts'],bundle:true,format:'iife',globalName:'UploadModule',write:false}).outputFiles[0].text
const engines = {chromium,firefox,webkit}
for (const name of process.env.BROWSERS?.split(',') ?? Object.keys(engines)) {
  assert.ok(engines[name], `Unknown browser: ${name}`)
  const browser = await engines[name].launch({headless:process.env.GL_HEADFUL!=='1',
    ...(name==='firefox'?{firefoxUserPrefs:{'webgl.force-enabled':true,'gfx.webrender.software':true}}:{}),
    ...(name==='chromium'&&process.env.CHROME?{executablePath:process.env.CHROME}:{})})
  try {
    const results=[]
    for (const swapped of [false,true]) {
      const page=await browser.newPage()
      await page.setContent('<canvas></canvas>')
      await page.addScriptTag({content:script})
      const result=await page.evaluate(swapped=>{
        const gl=document.querySelector('canvas').getContext('webgl')
        if(!gl)throw Error('WebGL unavailable')
        const native=gl.texImage2D.bind(gl),counts={direct:0,pixels:0}
        gl.texImage2D=(...args)=>{
          if(args.length===6 && args[5] instanceof HTMLCanvasElement) {
            counts.direct++
            if(swapped) {
              const source=args[5],image=source.getContext('2d').getImageData(0,0,source.width,source.height)
              for(let i=0;i<image.data.length;i+=4){const red=image.data[i];image.data[i]=image.data[i+2];image.data[i+2]=red}
              return native(args[0],args[1],args[2],source.width,source.height,0,args[3],args[4],new Uint8Array(image.data.buffer))
            }
          }else if(args.length===9 && args[8] instanceof Uint8Array) counts.pixels++
          return native(...args)
        }
        const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture)
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
        const upload=UploadModule.createSceneUploader(gl)
        const source=document.createElement('canvas');source.width=512;source.height=256
        const ctx=source.getContext('2d'),samples=[]
        for(const color of ['#1234d2','#d23412']) {
          ctx.fillStyle=color;ctx.fillRect(0,0,source.width,source.height)
          upload(source)
          if(gl.getParameter(gl.FRAMEBUFFER_BINDING)!==null)throw Error('Probe left a framebuffer bound')
          const frame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,frame)
          gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0)
          if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Texture incomplete')
          const pixel=new Uint8Array(4);gl.readPixels(256,128,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel)
          samples.push([...pixel]);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(frame)
        }
        const error=gl.getError();gl.deleteTexture(texture)
        return {samples,counts,error}
      },swapped)
      assert.equal(result.error,0)
      assert.deepEqual(result.samples,[[18,52,210,255],[210,52,18,255]],`${name}: preserve actual RGBA`)
      assert.deepEqual(result.counts,swapped?{direct:1,pixels:2}:{direct:3,pixels:0},'probe once; fallback only on affected contexts')
      results.push(result.samples);await page.close()
    }
    assert.deepEqual(results[0],results[1])
    console.log(`${name}: direct and simulated R/B-swapped uploads preserve identical RGBA; one probe and framebuffer cleanup PASS`)
  }finally{await browser.close()}
}
