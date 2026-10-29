import React, { createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Glass } from '../../../../../src/react/glass.tsx'
import { mountGlass } from '../../../../../src/glass/index.ts'
import { setMotion } from '../../../../../src/core/motion.ts'
import '../../../../../styles/glass.css'

const metrics = { draws: 0, uploads: 0, captures: 0, errors: [], drawSubmitMs: [], drawSyncMs: [] }
let measureDraws = false
const originalContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
  const gl = originalContext.call(this, kind, ...args)
  if (kind !== 'webgl' || !gl || gl.__instrumented) return gl
  gl.__instrumented = true
  const draw = gl.drawArrays.bind(gl), upload = gl.texImage2D.bind(gl)
  gl.drawArrays = (...values) => {
    if (measureDraws) gl.finish()
    const start = performance.now()
    draw(...values)
    metrics.drawSubmitMs.push(performance.now() - start)
    if (measureDraws) { gl.finish(); metrics.drawSyncMs.push(performance.now() - start) }
    metrics.draws++
  }
  gl.texImage2D = (...values) => { metrics.uploads++;return upload(...values) }
  return gl
}
const makeSource = text => fx => {
  metrics.captures++
  const canvas=document.createElement('canvas');canvas.width=Math.round(fx.width*fx.dpr);canvas.height=Math.round(fx.height*fx.dpr)
  const c=canvas.getContext('2d');c.scale(fx.dpr,fx.dpr)
  const gradient=c.createLinearGradient(0,0,fx.width,0);gradient.addColorStop(0,'#d7fff7');gradient.addColorStop(1,'#a69aff');c.fillStyle=gradient;c.fillRect(0,0,fx.width,fx.height)
  c.fillStyle='#222';c.font=fx.width>400?'700 44px Arial':'700 20px Arial';c.textBaseline='top';c.fillText(text,fx.width>400?30:15,fx.width>400?100:60)
  c.fillStyle='#f14a37';c.fillRect(fx.width*.76,30,20,20)
  return canvas
}
const source=makeSource('Glass without echoes'), ref=createRef(), root=createRoot(document.getElementById('react-root'))
const defaults={blur:6,edgeGlow:80,lightMode:'static',position:42,interior:0,edgeWidth:8,refraction:55,dispersion:60,opacity:100,color:'#ffffff',lightX:25,lightY:0}
let props={...defaults}, tag='div', mounted=true, narrow=false
const fail=error=>{metrics.errors.push(String(error));document.getElementById('status').textContent='FAIL: '+error}
const render=()=>flushSync(()=>root.render(mounted?<Glass {...props} as={tag} ref={ref} source={source} onError={fail} className={'scene'+(narrow?' small':'')}><span className="copy">Glass without echoes</span></Glass>:null))
render()
const second=mountGlass(document.querySelector('#vanilla canvas'),{source:makeSource('Independent scene'),blur:0,onError:fail})
const frames=async(n=4)=>{for(let i=0;i<n;i++)await new Promise(requestAnimationFrame)}
const update=next=>{props={...props,...next};render()}
const assert=(value,message)=>{if(!value)throw Error(message)}
const counts=()=>({draws:metrics.draws,uploads:metrics.uploads,captures:metrics.captures})
const pixel=()=>{
 const canvas=document.querySelector('#react-root canvas'),gl=canvas.getContext('webgl'),data=new Uint8Array(canvas.width*canvas.height*4)
 gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data)
 let sum=0,alpha=0;for(let i=0;i<data.length;i+=4){sum=(sum+data[i]*3+data[i+1]*5+data[i+2]*7)>>>0;alpha+=data[i+3]}
 return {sum,alpha}
}
for(const [id,next] of Object.entries({zero:{blur:0},six:{blur:6},max:{blur:24},fixed:{lightMode:'static'},pointer:{lightMode:'pointer'},float:{lightMode:'float'},extremes:{edgeWidth:20,refraction:100,dispersion:100,interior:100,opacity:65,color:'#f5baff',blur:24},reset:defaults}))document.getElementById(id).onclick=()=>update(next)
document.getElementById('position').oninput=e=>update({position:Number(e.target.value)})
document.getElementById('resize').onclick=()=>{narrow=!narrow;render()}
document.getElementById('span').onclick=()=>{tag=tag==='div'?'span':'div';render()}
document.getElementById('dispose').onclick=()=>{mounted=!mounted;render()}
document.getElementById('checks').onclick=async()=>{
 const button=document.getElementById('checks');button.disabled=true
 const report={userAgent:navigator.userAgent,devicePixelRatio,checks:[],timings:[],errors:metrics.errors}
 const pass=name=>report.checks.push(name)
 try {
  mounted=true;narrow=false;tag='div';props={...defaults,blur:0};render();await frames(12)
  assert(metrics.errors.length===0,'initial render failed');assert(pixel().alpha>0,'no glass pixels');pass('WebGL compiled and produced pixels')
  const a=counts();await frames(12);assert(metrics.draws===a.draws&&metrics.uploads===a.uploads,'idle GPU work');pass('unchanged frames skip draw/upload')
  const sharp=pixel();update({blur:6});await frames(6);const soft=pixel();assert(sharp.sum!==soft.sum,'blur did not change pixels');assert(metrics.captures===a.captures,'blur recaptured source');pass('blur changes pixels without source recapture')
  const b=counts();update({position:65,lightX:90});await frames(5);assert(metrics.captures===b.captures&&metrics.uploads===b.uploads,'material reuploaded texture');assert(metrics.draws===b.draws+1,'cached blur redrawn');pass('position/light reuse cached blur')
  for(const blur of [0,6,24]) {
   const canvas = document.querySelector('#react-root canvas')
   metrics.drawSyncMs = []; measureDraws = true
   update({blur}); await frames(5)
   const invalidationDrawsMs = metrics.drawSyncMs.slice()
   metrics.drawSyncMs = []
   for(let i=0;i<12;i++) { ref.current.update({position:20+i*5}); await frames(2) }
   measureDraws = false
   report.timings.push({blur,width:canvas.width,height:canvas.height,invalidationDrawsMs,cachedDrawsMs:metrics.drawSyncMs.slice(),metric:'serialized draw submission-to-completion wall time, ms; gl.finish before/after each draw; diagnostic only, not GPU timer or FPS benchmark'})
  }
  update({lightMode:'float',edgeGlow:80});await frames(6);const before=metrics.draws;await frames(8);assert(metrics.draws>before,'float did not render');pass('float redraws while active')
  setMotion('reduce');await frames(6);const reduced=metrics.draws;await frames(8);assert(metrics.draws===reduced,'reduced motion keeps floating');pass('reduced motion stops floating')
  setMotion('auto');await frames(6);assert(metrics.draws>reduced,'motion did not resume');pass('motion resumes without new scroll')
  update({lightMode:'static'});await frames(5)
  for(const as of ['span','div']){tag=as;render();await frames(8);assert(document.querySelector('#react-root .sv-glass').tagName===as.toUpperCase(),'wrong host');assert(pixel().alpha>0,'host replacement lost glass')};pass('div/span replacement')
  narrow=true;render();await frames(8);assert(document.querySelector('#react-root canvas').width<=320*devicePixelRatio+1,'resize failed');pass('resize')
  mounted=false;render();await frames(6);const dead=counts();await frames(8);assert(metrics.draws===dead.draws,'unmounted renderer still draws');pass('unmount stops GPU work')
  mounted=true;narrow=false;props={...defaults};render();await frames(8);assert(pixel().alpha>0,'remount failed');pass('remount')
  assert(metrics.errors.length===0,'runtime errors');report.passed=true
  document.getElementById('status').textContent='PASS: '+report.checks.length+' component checks'
 }catch(error){report.passed=false;report.failure=String(error);document.getElementById('status').textContent='FAIL: '+error}
 finally {
  measureDraws=false;setMotion('auto');update(defaults);button.disabled=false;report.counts=counts();document.getElementById('result').textContent=JSON.stringify(report,null,2)
  await fetch('/results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)})
 }
}
frames(12).then(() => {
 if(!metrics.errors.length)document.getElementById('status').textContent='Ready: current Glass module; '+metrics.draws+' initial GPU draws'
})
window.addEventListener('pagehide',()=>{root.unmount();second.destroy()})
