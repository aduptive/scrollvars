// Spectral refraction with optional scene softening and adjustable material.
export const vertex = `attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=vec2((a_position.x+1.0)*0.5,(1.0-a_position.y)*0.5);gl_Position=vec4(a_position,0.0,1.0);}`
export const fragment = `precision highp float;
 varying vec2 v_uv;
 uniform sampler2D u_scene;
 uniform vec2 u_size;
 uniform vec2 u_points[5];
 uniform float u_strength;
 uniform float u_dispersion;
 uniform float u_interior;
 uniform float u_edge_width;
 uniform float u_opacity;
 uniform vec3 u_color;
 uniform float u_edge_glow;
 uniform vec2 u_light;
 void main(){
  vec2 p=v_uv*u_size;
  float distance=100000.0;
  vec2 normal=vec2(0.0);
  for(int i=0;i<5;i++){
   vec2 a=u_points[i];vec2 b;
   if(i==4)b=u_points[0];else b=u_points[i+1];
   vec2 e=normalize(b-a);vec2 n=vec2(-e.y,e.x);
   float d=dot(p-a,n);
   if(d<distance){distance=d;normal=n;}
  }
  if(distance<0.0){gl_FragColor=vec4(0.0);return;}
  float edgeSize=u_size.x*u_edge_width;
  float edgeFade=1.0-smoothstep(edgeSize*0.5,edgeSize,distance);
  float bevel=exp(-distance/(edgeSize*0.4))*edgeFade;
  float bend=u_strength*u_size.x*0.080*bevel;
  vec2 tangent=vec2(-normal.y,normal.x);
  float wave=sin(p.y/u_size.y*13.0+p.x/u_size.x*7.0);
  vec2 curvedNormal=normalize(normal+tangent*wave*0.45);
  vec2 lensCenter=vec2(u_points[0].x+u_size.x*0.10,u_size.y*0.48);
  vec2 lensRadius=(p-lensCenter)/(u_size.x*0.24);
  vec2 lensOffset=lensRadius*exp(-dot(lensRadius,lensRadius)*2.0)*u_size.x*0.065*u_strength*u_interior;
  vec3 total=vec3(0.0),weightSum=vec3(0.0);
  for(int i=0;i<32;i++){
   float t=float(i)/31.0;
   vec3 weight=exp(-0.5*pow((vec3(t)-vec3(0.80,0.50,0.20))/0.22,vec3(2.0)));
   float shift=bend*(1.0+u_dispersion*(t-0.5)*1.8);
   vec2 uv=clamp((p+curvedNormal*shift+lensOffset)/u_size,vec2(0.001),vec2(0.999));
   vec3 sampleColor=texture2D(u_scene,uv).rgb;
   total+=pow(sampleColor,vec3(2.2))*weight;weightSum+=weight;
  }
  vec3 color=pow(total/weightSum,vec3(1.0/2.2));
  vec2 lightDelta=(u_light*u_size-p)/u_size.x;
  float facing=0.2+0.8*pow(max(dot(-normal,normalize(lightDelta+vec2(0.00001))),0.0),2.0);
  float glint=facing*exp(-dot(lightDelta,lightDelta)*18.0);
  float light=0.018+u_edge_glow*glint*exp(-distance/1.2);
  color=mix(color,u_color,clamp(light,0.0,1.0));
  gl_FragColor=vec4(color,smoothstep(0.0,0.8,distance)*u_opacity);
 }`
