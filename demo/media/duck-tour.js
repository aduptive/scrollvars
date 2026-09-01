
(()=>{var Gl=(()=>{for(var i=new Uint8Array(128),e=0;e<64;e++)i[e<26?e+65:e<52?e+71:e<62?e-4:e*4-205]=e;return t=>{for(var n=t.length,s=new Uint8Array((n-(t[n-1]=="=")-(t[n-2]=="="))*3/4|0),r=0,a=0;r<n;){var o=i[t.charCodeAt(r++)],c=i[t.charCodeAt(r++)],l=i[t.charCodeAt(r++)],h=i[t.charCodeAt(r++)];s[a++]=o<<2|c>>4,s[a++]=c<<4|l>>2,s[a++]=l<<6|h}return s}})();var Th=0,fc=1,Ch=2;var or=1,Eh=2,xs=3,fn=0,zt=1,rn=2,En=0,Si=1,pc=2,mc=3,gc=4,wh=5;var ri=100,Rh=101,Ih=102,Ph=103,Lh=104,Nh=200,Dh=201,Uh=202,Fh=203,Zr=204,$r=205,Oh=206,zh=207,kh=208,Vh=209,Hh=210,Gh=211,Wh=212,Xh=213,qh=214,Jr=0,jr=1,Qr=2,bi=3,ea=4,ta=5,na=6,ia=7,_c=0,Yh=1,Kh=2,mn=0,xc=1,vc=2,yc=3,Ac=4,Bc=5,Mc=6,Sc=7,ec="attached",Zh="detached",bc=300,ui=301,Ni=302,Ma=303,Sa=304,cr=306,ai=1e3,sn=1001,is=1002,ft=1003,ba=1004;var Di=1005;var pt=1006,vs=1007;var gn=1008;var Xt=1009,Tc=1010,Cc=1011,ys=1012,Ta=1013,_n=1014,Qt=1015,wn=1016,Ca=1017,Ea=1018,As=1020,Ec=35902,wc=35899,Rc=1021,Ic=1022,en=1023,Sn=1026,di=1027,wa=1028,Ra=1029,fi=1030,Ia=1031;var Pa=1033,lr=33776,hr=33777,ur=33778,dr=33779,La=35840,Na=35841,Da=35842,Ua=35843,Fa=36196,Oa=37492,za=37496,ka=37488,Va=37489,fr=37490,Ha=37491,Ga=37808,Wa=37809,Xa=37810,qa=37811,Ya=37812,Ka=37813,Za=37814,$a=37815,Ja=37816,ja=37817,Qa=37818,eo=37819,to=37820,no=37821,io=36492,so=36494,ro=36495,ao=36283,oo=36284,pr=36285,co=36286;var Ti=2300,Ci=2301,Kr=2302,tc=2303,nc=2400,ic=2401,sc=2402,$h=2500;var Pc=0,mr=1,Bs=2,Jh=3200;var lo=0,jh=1,Kn="",Bt="srgb",Ut="srgb-linear",Fs="linear",Ke="srgb";var Bi=7680;var rc=519,Qh=512,eu=513,tu=514,ho=515,nu=516,iu=517,uo=518,su=519,sa=35044;var Lc="300 es",un=2e3,ss=2001;function rd(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ad(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function rs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ru(){let i=rs("canvas");return i.style.display="block",i}var Wl={},as=null;function Os(...i){let e="THREE."+i.shift();as?as("log",e,...i):console.log(e,...i)}function au(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function ye(...i){i=au(i);let e="THREE."+i.shift();if(as)as("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Ee(...i){i=au(i);let e="THREE."+i.shift();if(as)as("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Mi(...i){let e=i.join(" ");e in Wl||(Wl[e]=!0,ye(...i))}function ou(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var cu={[Jr]:jr,[Qr]:na,[ea]:ia,[bi]:ta,[jr]:Jr,[na]:Qr,[ia]:ea,[ta]:bi},bn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},It=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Xl=1234567,Ds=Math.PI/180,Ei=180/Math.PI;function dn(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(It[i&255]+It[i>>8&255]+It[i>>16&255]+It[i>>24&255]+"-"+It[e&255]+It[e>>8&255]+"-"+It[e>>16&15|64]+It[e>>24&255]+"-"+It[t&63|128]+It[t>>8&255]+"-"+It[t>>16&255]+It[t>>24&255]+It[n&255]+It[n>>8&255]+It[n>>16&255]+It[n>>24&255]).toLowerCase()}function Ve(i,e,t){return Math.max(e,Math.min(t,i))}function Nc(i,e){return(i%e+e)%e}function od(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function cd(i,e,t){return i!==e?(t-i)/(e-i):0}function Us(i,e,t){return(1-t)*i+t*e}function ld(i,e,t,n){return Us(i,e,1-Math.exp(-t*n))}function hd(i,e=1){return e-Math.abs(Nc(i,e*2)-e)}function ud(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function dd(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function fd(i,e){return i+Math.floor(Math.random()*(e-i+1))}function pd(i,e){return i+Math.random()*(e-i)}function md(i){return i*(.5-Math.random())}function gd(i){i!==void 0&&(Xl=i);let e=Xl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function _d(i){return i*Ds}function xd(i){return i*Ei}function vd(i){return(i&i-1)===0&&i!==0}function yd(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Ad(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Bd(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),c=a(t/2),l=r((e+n)/2),h=a((e+n)/2),d=r((e-n)/2),u=a((e-n)/2),f=r((n-e)/2),_=a((n-e)/2);switch(s){case"XYX":i.set(o*h,c*d,c*u,o*l);break;case"YZY":i.set(c*u,o*h,c*d,o*l);break;case"ZXZ":i.set(c*d,c*u,o*h,o*l);break;case"XZX":i.set(o*h,c*_,c*f,o*l);break;case"YXY":i.set(c*f,o*h,c*_,o*l);break;case"ZYZ":i.set(c*_,c*f,o*h,o*l);break;default:ye("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function hn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function $e(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Dc={DEG2RAD:Ds,RAD2DEG:Ei,generateUUID:dn,clamp:Ve,euclideanModulo:Nc,mapLinear:od,inverseLerp:cd,lerp:Us,damp:ld,pingpong:hd,smoothstep:ud,smootherstep:dd,randInt:fd,randFloat:pd,randFloatSpread:md,seededRandom:gd,degToRad:_d,radToDeg:xd,isPowerOfTwo:vd,ceilPowerOfTwo:yd,floorPowerOfTwo:Ad,setQuaternionFromProperEuler:Bd,normalize:$e,denormalize:hn},ze=class i{static{i.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},$t=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3],u=r[a+0],f=r[a+1],_=r[a+2],y=r[a+3];if(d!==y||c!==u||l!==f||h!==_){let m=c*u+l*f+h*_+d*y;m<0&&(u=-u,f=-f,_=-_,y=-y,m=-m);let p=1-o;if(m<.9995){let T=Math.acos(m),C=Math.sin(T);p=Math.sin(p*T)/C,o=Math.sin(o*T)/C,c=c*p+u*o,l=l*p+f*o,h=h*p+_*o,d=d*p+y*o}else{c=c*p+u*o,l=l*p+f*o,h=h*p+_*o,d=d*p+y*o;let T=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=T,l*=T,h*=T,d*=T}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=r[a],u=r[a+1],f=r[a+2],_=r[a+3];return e[t]=o*_+h*d+c*f-l*u,e[t+1]=c*_+h*u+l*d-o*f,e[t+2]=l*_+h*f+o*u-c*d,e[t+3]=h*_-o*d-c*u-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(s/2),d=o(r/2),u=c(n/2),f=c(s/2),_=c(r/2);switch(a){case"XYZ":this._x=u*h*d+l*f*_,this._y=l*f*d-u*h*_,this._z=l*h*_+u*f*d,this._w=l*h*d-u*f*_;break;case"YXZ":this._x=u*h*d+l*f*_,this._y=l*f*d-u*h*_,this._z=l*h*_-u*f*d,this._w=l*h*d+u*f*_;break;case"ZXY":this._x=u*h*d-l*f*_,this._y=l*f*d+u*h*_,this._z=l*h*_+u*f*d,this._w=l*h*d-u*f*_;break;case"ZYX":this._x=u*h*d-l*f*_,this._y=l*f*d+u*h*_,this._z=l*h*_-u*f*d,this._w=l*h*d+u*f*_;break;case"YZX":this._x=u*h*d+l*f*_,this._y=l*f*d+u*h*_,this._z=l*h*_-u*f*d,this._w=l*h*d-u*f*_;break;case"XZY":this._x=u*h*d-l*f*_,this._y=l*f*d-u*h*_,this._z=l*h*_+u*f*d,this._w=l*h*d+u*f*_;break;default:ye("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],c=t[9],l=t[2],h=t[6],d=t[10],u=n+o+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(a-s)*f}else if(n>o&&n>d){let f=2*Math.sqrt(1+n-o-d);this._w=(h-c)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+l)/f}else if(o>d){let f=2*Math.sqrt(1+o-n-d);this._w=(r-l)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+d-n-o);this._w=(a-s)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ve(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+a*o+s*l-r*c,this._y=s*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-s*o,this._w=a*h-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-t;if(o<.9995){let l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},N=class i{static{i.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ql.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ql.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*s-o*n),h=2*(o*t-r*s),d=2*(r*n-a*t);return this.x=t+c*l+a*d-o*h,this.y=n+c*h+o*l-r*d,this.z=s+c*d+r*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Eo.copy(this).projectOnVector(e),this.sub(Eo)}reflect(e){return this.sub(Eo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Eo=new N,ql=new $t,Ie=class i{static{i.prototype.isMatrix3=!0}constructor(e,t,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l)}set(e,t,n,s,r,a,o,c,l){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],d=n[7],u=n[2],f=n[5],_=n[8],y=s[0],m=s[3],p=s[6],T=s[1],C=s[4],A=s[7],b=s[2],M=s[5],E=s[8];return r[0]=a*y+o*T+c*b,r[3]=a*m+o*C+c*M,r[6]=a*p+o*A+c*E,r[1]=l*y+h*T+d*b,r[4]=l*m+h*C+d*M,r[7]=l*p+h*A+d*E,r[2]=u*y+f*T+_*b,r[5]=u*m+f*C+_*M,r[8]=u*p+f*A+_*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*o*l-n*r*h+n*o*c+s*r*l-s*a*c}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=h*a-o*l,u=o*c-h*r,f=l*r-a*c,_=t*d+n*u+s*f;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/_;return e[0]=d*y,e[1]=(s*l-h*n)*y,e[2]=(o*n-s*a)*y,e[3]=u*y,e[4]=(h*t-s*c)*y,e[5]=(s*r-o*t)*y,e[6]=f*y,e[7]=(n*c-l*t)*y,e[8]=(a*t-n*r)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-s*l,s*c,-s*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return Mi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(wo.makeScale(e,t)),this}rotate(e){return Mi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(wo.makeRotation(-e)),this}translate(e,t){return Mi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(wo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},wo=new Ie,Yl=new Ie().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Kl=new Ie().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Md(){let i={enabled:!0,workingColorSpace:Ut,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===Ke&&(s.r=kn(s.r),s.g=kn(s.g),s.b=kn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Ke&&(s.r=ns(s.r),s.g=ns(s.g),s.b=ns(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Kn?Fs:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Mi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Mi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ut]:{primaries:e,whitePoint:n,transfer:Fs,toXYZ:Yl,fromXYZ:Kl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Bt},outputColorSpaceConfig:{drawingBufferColorSpace:Bt}},[Bt]:{primaries:e,whitePoint:n,transfer:Ke,toXYZ:Yl,fromXYZ:Kl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Bt}}}),i}var Oe=Md();function kn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ns(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Hi,ra=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Hi===void 0&&(Hi=rs("canvas")),Hi.width=e.width,Hi.height=e.height;let s=Hi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Hi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=rs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=kn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(kn(t[n]/255)*255):t[n]=kn(t[n]);return{data:t,width:e.width,height:e.height}}else return ye("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Sd=0,os=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Sd++}),this.uuid=dn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Ro(s[a].image)):r.push(Ro(s[a]))}else r=Ro(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Ro(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ra.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(ye("Texture: Unable to serialize Texture."),{})}var bd=0,Io=new N,Ct=class i extends bn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=sn,s=sn,r=pt,a=gn,o=en,c=Xt,l=i.DEFAULT_ANISOTROPY,h=Kn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:bd++}),this.uuid=dn(),this.name="",this.source=new os(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new ze(0,0),this.repeat=new ze(1,1),this.center=new ze(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ie,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Io).x}get height(){return this.source.getSize(Io).y}get depth(){return this.source.getSize(Io).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){ye(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){ye(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==bc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ai:e.x=e.x-Math.floor(e.x);break;case sn:e.x=e.x<0?0:1;break;case is:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ai:e.y=e.y-Math.floor(e.y);break;case sn:e.y=e.y<0?0:1;break;case is:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ct.DEFAULT_IMAGE=null;Ct.DEFAULT_MAPPING=bc;Ct.DEFAULT_ANISOTROPY=1;var Je=class i{static{i.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,c=e.elements,l=c[0],h=c[4],d=c[8],u=c[1],f=c[5],_=c[9],y=c[2],m=c[6],p=c[10];if(Math.abs(h-u)<.01&&Math.abs(d-y)<.01&&Math.abs(_-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+y)<.1&&Math.abs(_+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let C=(l+1)/2,A=(f+1)/2,b=(p+1)/2,M=(h+u)/4,E=(d+y)/4,x=(_+m)/4;return C>A&&C>b?C<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(C),s=M/n,r=E/n):A>b?A<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(A),n=M/s,r=x/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=E/r,s=x/r),this.set(n,s,r,t),this}let T=Math.sqrt((m-_)*(m-_)+(d-y)*(d-y)+(u-h)*(u-h));return Math.abs(T)<.001&&(T=1),this.x=(m-_)/T,this.y=(d-y)/T,this.z=(u-h)/T,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this.w=Ve(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this.w=Ve(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},aa=class extends bn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:pt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Je(0,0,e,t),this.scissorTest=!1,this.viewport=new Je(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new Ct(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:pt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new os(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Jt=class extends aa{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},zs=class extends Ct{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ft,this.minFilter=ft,this.wrapR=sn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var oa=class extends Ct{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ft,this.minFilter=ft,this.wrapR=sn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var De=class i{static{i.prototype.isMatrix4=!0}constructor(e,t,n,s,r,a,o,c,l,h,d,u,f,_,y,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l,h,d,u,f,_,y,m)}set(e,t,n,s,r,a,o,c,l,h,d,u,f,_,y,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=h,p[10]=d,p[14]=u,p[3]=f,p[7]=_,p[11]=y,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Gi.setFromMatrixColumn(e,0).length(),r=1/Gi.setFromMatrixColumn(e,1).length(),a=1/Gi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let u=a*h,f=a*d,_=o*h,y=o*d;t[0]=c*h,t[4]=-c*d,t[8]=l,t[1]=f+_*l,t[5]=u-y*l,t[9]=-o*c,t[2]=y-u*l,t[6]=_+f*l,t[10]=a*c}else if(e.order==="YXZ"){let u=c*h,f=c*d,_=l*h,y=l*d;t[0]=u+y*o,t[4]=_*o-f,t[8]=a*l,t[1]=a*d,t[5]=a*h,t[9]=-o,t[2]=f*o-_,t[6]=y+u*o,t[10]=a*c}else if(e.order==="ZXY"){let u=c*h,f=c*d,_=l*h,y=l*d;t[0]=u-y*o,t[4]=-a*d,t[8]=_+f*o,t[1]=f+_*o,t[5]=a*h,t[9]=y-u*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){let u=a*h,f=a*d,_=o*h,y=o*d;t[0]=c*h,t[4]=_*l-f,t[8]=u*l+y,t[1]=c*d,t[5]=y*l+u,t[9]=f*l-_,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){let u=a*c,f=a*l,_=o*c,y=o*l;t[0]=c*h,t[4]=y-u*d,t[8]=_*d+f,t[1]=d,t[5]=a*h,t[9]=-o*h,t[2]=-l*h,t[6]=f*d+_,t[10]=u-y*d}else if(e.order==="XZY"){let u=a*c,f=a*l,_=o*c,y=o*l;t[0]=c*h,t[4]=-d,t[8]=l*h,t[1]=u*d+y,t[5]=a*h,t[9]=f*d-_,t[2]=_*d-f,t[6]=o*h,t[10]=y*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Td,e,Cd)}lookAt(e,t,n){let s=this.elements;return Yt.subVectors(e,t),Yt.lengthSq()===0&&(Yt.z=1),Yt.normalize(),jn.crossVectors(n,Yt),jn.lengthSq()===0&&(Math.abs(n.z)===1?Yt.x+=1e-4:Yt.z+=1e-4,Yt.normalize(),jn.crossVectors(n,Yt)),jn.normalize(),Br.crossVectors(Yt,jn),s[0]=jn.x,s[4]=Br.x,s[8]=Yt.x,s[1]=jn.y,s[5]=Br.y,s[9]=Yt.y,s[2]=jn.z,s[6]=Br.z,s[10]=Yt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],d=n[5],u=n[9],f=n[13],_=n[2],y=n[6],m=n[10],p=n[14],T=n[3],C=n[7],A=n[11],b=n[15],M=s[0],E=s[4],x=s[8],S=s[12],P=s[1],w=s[5],U=s[9],q=s[13],Z=s[2],z=s[6],X=s[10],H=s[14],J=s[3],Q=s[7],he=s[11],pe=s[15];return r[0]=a*M+o*P+c*Z+l*J,r[4]=a*E+o*w+c*z+l*Q,r[8]=a*x+o*U+c*X+l*he,r[12]=a*S+o*q+c*H+l*pe,r[1]=h*M+d*P+u*Z+f*J,r[5]=h*E+d*w+u*z+f*Q,r[9]=h*x+d*U+u*X+f*he,r[13]=h*S+d*q+u*H+f*pe,r[2]=_*M+y*P+m*Z+p*J,r[6]=_*E+y*w+m*z+p*Q,r[10]=_*x+y*U+m*X+p*he,r[14]=_*S+y*q+m*H+p*pe,r[3]=T*M+C*P+A*Z+b*J,r[7]=T*E+C*w+A*z+b*Q,r[11]=T*x+C*U+A*X+b*he,r[15]=T*S+C*q+A*H+b*pe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],c=e[9],l=e[13],h=e[2],d=e[6],u=e[10],f=e[14],_=e[3],y=e[7],m=e[11],p=e[15],T=c*f-l*u,C=o*f-l*d,A=o*u-c*d,b=a*f-l*h,M=a*u-c*h,E=a*d-o*h;return t*(y*T-m*C+p*A)-n*(_*T-m*b+p*M)+s*(_*C-y*b+p*E)-r*(_*A-y*M+m*E)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],c=e[2],l=e[6],h=e[10];return t*(a*h-o*l)-n*(r*h-o*c)+s*(r*l-a*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=e[9],u=e[10],f=e[11],_=e[12],y=e[13],m=e[14],p=e[15],T=t*o-n*a,C=t*c-s*a,A=t*l-r*a,b=n*c-s*o,M=n*l-r*o,E=s*l-r*c,x=h*y-d*_,S=h*m-u*_,P=h*p-f*_,w=d*m-u*y,U=d*p-f*y,q=u*p-f*m,Z=T*q-C*U+A*w+b*P-M*S+E*x;if(Z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let z=1/Z;return e[0]=(o*q-c*U+l*w)*z,e[1]=(s*U-n*q-r*w)*z,e[2]=(y*E-m*M+p*b)*z,e[3]=(u*M-d*E-f*b)*z,e[4]=(c*P-a*q-l*S)*z,e[5]=(t*q-s*P+r*S)*z,e[6]=(m*A-_*E-p*C)*z,e[7]=(h*E-u*A+f*C)*z,e[8]=(a*U-o*P+l*x)*z,e[9]=(n*P-t*U-r*x)*z,e[10]=(_*M-y*A+p*T)*z,e[11]=(d*A-h*M-f*T)*z,e[12]=(o*S-a*w-c*x)*z,e[13]=(t*w-n*S+s*x)*z,e[14]=(y*C-_*b-m*T)*z,e[15]=(h*b-d*C+u*T)*z,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,h*o+n,h*c-s*a,0,l*c-s*o,h*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,l=r+r,h=a+a,d=o+o,u=r*l,f=r*h,_=r*d,y=a*h,m=a*d,p=o*d,T=c*l,C=c*h,A=c*d,b=n.x,M=n.y,E=n.z;return s[0]=(1-(y+p))*b,s[1]=(f+A)*b,s[2]=(_-C)*b,s[3]=0,s[4]=(f-A)*M,s[5]=(1-(u+p))*M,s[6]=(m+T)*M,s[7]=0,s[8]=(_+C)*E,s[9]=(m-T)*E,s[10]=(1-(u+y))*E,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Gi.set(s[0],s[1],s[2]).length(),o=Gi.set(s[4],s[5],s[6]).length(),c=Gi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),on.copy(this);let l=1/a,h=1/o,d=1/c;return on.elements[0]*=l,on.elements[1]*=l,on.elements[2]*=l,on.elements[4]*=h,on.elements[5]*=h,on.elements[6]*=h,on.elements[8]*=d,on.elements[9]*=d,on.elements[10]*=d,t.setFromRotationMatrix(on),n.x=a,n.y=o,n.z=c,this}makePerspective(e,t,n,s,r,a,o=un,c=!1){let l=this.elements,h=2*r/(t-e),d=2*r/(n-s),u=(t+e)/(t-e),f=(n+s)/(n-s),_,y;if(c)_=r/(a-r),y=a*r/(a-r);else if(o===un)_=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===ss)_=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=un,c=!1){let l=this.elements,h=2/(t-e),d=2/(n-s),u=-(t+e)/(t-e),f=-(n+s)/(n-s),_,y;if(c)_=1/(a-r),y=a/(a-r);else if(o===un)_=-2/(a-r),y=-(a+r)/(a-r);else if(o===ss)_=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=d,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Gi=new N,on=new De,Td=new N(0,0,0),Cd=new N(1,1,1),jn=new N,Br=new N,Yt=new N,Zl=new De,$l=new $t,Vn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ve(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ve(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ve(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ve(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:ye("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Zl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Zl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return $l.setFromEuler(this),this.setFromQuaternion($l,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Vn.DEFAULT_ORDER="XYZ";var ks=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Ed=0,Jl=new N,Wi=new $t,Nn=new De,Mr=new N,Cs=new N,wd=new N,Rd=new $t,jl=new N(1,0,0),Ql=new N(0,1,0),eh=new N(0,0,1),th={type:"added"},Id={type:"removed"},Xi={type:"childadded",child:null},Po={type:"childremoved",child:null},rt=class i extends bn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ed++}),this.uuid=dn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new N,t=new Vn,n=new $t,s=new N(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new De},normalMatrix:{value:new Ie}}),this.matrix=new De,this.matrixWorld=new De,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ks,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(jl,e)}rotateY(e){return this.rotateOnAxis(Ql,e)}rotateZ(e){return this.rotateOnAxis(eh,e)}translateOnAxis(e,t){return Jl.copy(e).applyQuaternion(this.quaternion),this.position.add(Jl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(jl,e)}translateY(e){return this.translateOnAxis(Ql,e)}translateZ(e){return this.translateOnAxis(eh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Mr.copy(e):Mr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Cs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(Cs,Mr,this.up):Nn.lookAt(Mr,Cs,this.up),this.quaternion.setFromRotationMatrix(Nn),s&&(Nn.extractRotation(s.matrixWorld),Wi.setFromRotationMatrix(Nn),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ee("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(th),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):Ee("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Id),Po.child=e,this.dispatchEvent(Po),Po.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(th),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,e,wd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,Rd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let d=c[l];r(e.shapes,d)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];s.animations.push(r(e.animations,c))}}if(t){let o=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),d=a(e.shapes),u=a(e.skeletons),f=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){let c=[];for(let l in o){let h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};rt.DEFAULT_UP=new N(0,1,0);rt.DEFAULT_MATRIX_AUTO_UPDATE=!0;rt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Zt=class extends rt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Pd={type:"move"},cs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Zt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Zt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Zt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(let y of e.hand.values()){let m=t.getJointPose(y,n),p=this._getHandJoint(l,y);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,_=.005;l.inputState.pinching&&u>f+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=f-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Pd)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Zt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},lu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qn={h:0,s:0,l:0},Sr={h:0,s:0,l:0};function Lo(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var we=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Bt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Oe.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Oe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Oe.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Oe.workingColorSpace){if(e=Nc(e,1),t=Ve(t,0,1),n=Ve(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Lo(a,r,e+1/3),this.g=Lo(a,r,e),this.b=Lo(a,r,e-1/3)}return Oe.colorSpaceToWorking(this,s),this}setStyle(e,t=Bt){function n(r){r!==void 0&&parseFloat(r)<1&&ye("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:ye("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);ye("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Bt){let n=lu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):ye("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=kn(e.r),this.g=kn(e.g),this.b=kn(e.b),this}copyLinearToSRGB(e){return this.r=ns(e.r),this.g=ns(e.g),this.b=ns(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Bt){return Oe.workingToColorSpace(Pt.copy(this),e),Math.round(Ve(Pt.r*255,0,255))*65536+Math.round(Ve(Pt.g*255,0,255))*256+Math.round(Ve(Pt.b*255,0,255))}getHexString(e=Bt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Oe.workingColorSpace){Oe.workingToColorSpace(Pt.copy(this),t);let n=Pt.r,s=Pt.g,r=Pt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),c,l,h=(o+a)/2;if(o===a)c=0,l=0;else{let d=a-o;switch(l=h<=.5?d/(a+o):d/(2-a-o),a){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=Oe.workingColorSpace){return Oe.workingToColorSpace(Pt.copy(this),t),e.r=Pt.r,e.g=Pt.g,e.b=Pt.b,e}getStyle(e=Bt){Oe.workingToColorSpace(Pt.copy(this),e);let t=Pt.r,n=Pt.g,s=Pt.b;return e!==Bt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Qn),this.setHSL(Qn.h+e,Qn.s+t,Qn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Qn),e.getHSL(Sr);let n=Us(Qn.h,Sr.h,t),s=Us(Qn.s,Sr.s,t),r=Us(Qn.l,Sr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Pt=new we;we.NAMES=lu;var Vs=class extends rt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Vn,this.environmentIntensity=1,this.environmentRotation=new Vn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},cn=new N,Dn=new N,No=new N,Un=new N,qi=new N,Yi=new N,nh=new N,Do=new N,Uo=new N,Fo=new N,Oo=new Je,zo=new Je,ko=new Je,si=class i{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),cn.subVectors(e,t),s.cross(cn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){cn.subVectors(s,t),Dn.subVectors(n,t),No.subVectors(e,t);let a=cn.dot(cn),o=cn.dot(Dn),c=cn.dot(No),l=Dn.dot(Dn),h=Dn.dot(No),d=a*l-o*o;if(d===0)return r.set(0,0,0),null;let u=1/d,f=(l*c-o*h)*u,_=(a*h-o*c)*u;return r.set(1-f-_,_,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(e,t,n,s,r,a,o,c){return this.getBarycoord(e,t,n,s,Un)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Un.x),c.addScaledVector(a,Un.y),c.addScaledVector(o,Un.z),c)}static getInterpolatedAttribute(e,t,n,s,r,a){return Oo.setScalar(0),zo.setScalar(0),ko.setScalar(0),Oo.fromBufferAttribute(e,t),zo.fromBufferAttribute(e,n),ko.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Oo,r.x),a.addScaledVector(zo,r.y),a.addScaledVector(ko,r.z),a}static isFrontFacing(e,t,n,s){return cn.subVectors(n,t),Dn.subVectors(e,t),cn.cross(Dn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),Dn.subVectors(this.a,this.b),cn.cross(Dn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;qi.subVectors(s,n),Yi.subVectors(r,n),Do.subVectors(e,n);let c=qi.dot(Do),l=Yi.dot(Do);if(c<=0&&l<=0)return t.copy(n);Uo.subVectors(e,s);let h=qi.dot(Uo),d=Yi.dot(Uo);if(h>=0&&d<=h)return t.copy(s);let u=c*d-h*l;if(u<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(n).addScaledVector(qi,a);Fo.subVectors(e,r);let f=qi.dot(Fo),_=Yi.dot(Fo);if(_>=0&&f<=_)return t.copy(r);let y=f*l-c*_;if(y<=0&&l>=0&&_<=0)return o=l/(l-_),t.copy(n).addScaledVector(Yi,o);let m=h*_-f*d;if(m<=0&&d-h>=0&&f-_>=0)return nh.subVectors(r,s),o=(d-h)/(d-h+(f-_)),t.copy(s).addScaledVector(nh,o);let p=1/(m+y+u);return a=y*p,o=u*p,t.copy(n).addScaledVector(qi,a).addScaledVector(Yi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ft=class{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,ln):ln.fromBufferAttribute(r,a),ln.applyMatrix4(e.matrixWorld),this.expandByPoint(ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),br.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),br.copy(n.boundingBox)),br.applyMatrix4(e.matrixWorld),this.union(br)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ln),ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Es),Tr.subVectors(this.max,Es),Ki.subVectors(e.a,Es),Zi.subVectors(e.b,Es),$i.subVectors(e.c,Es),ei.subVectors(Zi,Ki),ti.subVectors($i,Zi),xi.subVectors(Ki,$i);let t=[0,-ei.z,ei.y,0,-ti.z,ti.y,0,-xi.z,xi.y,ei.z,0,-ei.x,ti.z,0,-ti.x,xi.z,0,-xi.x,-ei.y,ei.x,0,-ti.y,ti.x,0,-xi.y,xi.x,0];return!Vo(t,Ki,Zi,$i,Tr)||(t=[1,0,0,0,1,0,0,0,1],!Vo(t,Ki,Zi,$i,Tr))?!1:(Cr.crossVectors(ei,ti),t=[Cr.x,Cr.y,Cr.z],Vo(t,Ki,Zi,$i,Tr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Fn=[new N,new N,new N,new N,new N,new N,new N,new N],ln=new N,br=new Ft,Ki=new N,Zi=new N,$i=new N,ei=new N,ti=new N,xi=new N,Es=new N,Tr=new N,Cr=new N,vi=new N;function Vo(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){vi.fromArray(i,r);let o=s.x*Math.abs(vi.x)+s.y*Math.abs(vi.y)+s.z*Math.abs(vi.z),c=e.dot(vi),l=t.dot(vi),h=n.dot(vi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}var xt=new N,Er=new ze,Ld=0,yt=class extends bn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ld++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=sa,this.updateRanges=[],this.gpuType=Qt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Er.fromBufferAttribute(this,t),Er.applyMatrix3(e),this.setXY(t,Er.x,Er.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix3(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix4(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyNormalMatrix(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.transformDirection(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=hn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=hn(t,this.array)),t}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=hn(t,this.array)),t}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=hn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=hn(t,this.array)),t}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array),r=$e(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==sa&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Hs=class extends yt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Gs=class extends yt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Dt=class extends yt{constructor(e,t,n){super(new Float32Array(e),t,n)}},Nd=new Ft,ws=new N,Ho=new N,Vt=class{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Nd.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ws.subVectors(e,this.center);let t=ws.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(ws,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ho.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ws.copy(e.center).add(Ho)),this.expandByPoint(ws.copy(e.center).sub(Ho))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Dd=0,nn=new De,Go=new rt,Ji=new N,Kt=new Ft,Rs=new Ft,Tt=new N,Ot=class i extends bn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Dd++}),this.uuid=dn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(rd(e)?Gs:Hs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ie().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return nn.makeRotationFromQuaternion(e),this.applyMatrix4(nn),this}rotateX(e){return nn.makeRotationX(e),this.applyMatrix4(nn),this}rotateY(e){return nn.makeRotationY(e),this.applyMatrix4(nn),this}rotateZ(e){return nn.makeRotationZ(e),this.applyMatrix4(nn),this}translate(e,t,n){return nn.makeTranslation(e,t,n),this.applyMatrix4(nn),this}scale(e,t,n){return nn.makeScale(e,t,n),this.applyMatrix4(nn),this}lookAt(e){return Go.lookAt(e),Go.updateMatrix(),this.applyMatrix4(Go.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ji).negate(),this.translate(Ji.x,Ji.y,Ji.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Dt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&ye("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ft);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ee("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Kt.setFromBufferAttribute(r),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ee('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ee("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){let n=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Rs.setFromBufferAttribute(o),this.morphTargetsRelative?(Tt.addVectors(Kt.min,Rs.min),Kt.expandByPoint(Tt),Tt.addVectors(Kt.max,Rs.max),Kt.expandByPoint(Tt)):(Kt.expandByPoint(Rs.min),Kt.expandByPoint(Rs.max))}Kt.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Tt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Tt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Tt.fromBufferAttribute(o,l),c&&(Ji.fromBufferAttribute(e,l),Tt.add(Ji)),s=Math.max(s,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Ee('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ee("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new yt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],c=[];for(let x=0;x<n.count;x++)o[x]=new N,c[x]=new N;let l=new N,h=new N,d=new N,u=new ze,f=new ze,_=new ze,y=new N,m=new N;function p(x,S,P){l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,S),d.fromBufferAttribute(n,P),u.fromBufferAttribute(r,x),f.fromBufferAttribute(r,S),_.fromBufferAttribute(r,P),h.sub(l),d.sub(l),f.sub(u),_.sub(u);let w=1/(f.x*_.y-_.x*f.y);isFinite(w)&&(y.copy(h).multiplyScalar(_.y).addScaledVector(d,-f.y).multiplyScalar(w),m.copy(d).multiplyScalar(f.x).addScaledVector(h,-_.x).multiplyScalar(w),o[x].add(y),o[S].add(y),o[P].add(y),c[x].add(m),c[S].add(m),c[P].add(m))}let T=this.groups;T.length===0&&(T=[{start:0,count:e.count}]);for(let x=0,S=T.length;x<S;++x){let P=T[x],w=P.start,U=P.count;for(let q=w,Z=w+U;q<Z;q+=3)p(e.getX(q+0),e.getX(q+1),e.getX(q+2))}let C=new N,A=new N,b=new N,M=new N;function E(x){b.fromBufferAttribute(s,x),M.copy(b);let S=o[x];C.copy(S),C.sub(b.multiplyScalar(b.dot(S))).normalize(),A.crossVectors(M,S);let w=A.dot(c[x])<0?-1:1;a.setXYZW(x,C.x,C.y,C.z,w)}for(let x=0,S=T.length;x<S;++x){let P=T[x],w=P.start,U=P.count;for(let q=w,Z=w+U;q<Z;q+=3)E(e.getX(q+0)),E(e.getX(q+1)),E(e.getX(q+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new yt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);let s=new N,r=new N,a=new N,o=new N,c=new N,l=new N,h=new N,d=new N;if(e)for(let u=0,f=e.count;u<f;u+=3){let _=e.getX(u+0),y=e.getX(u+1),m=e.getX(u+2);s.fromBufferAttribute(t,_),r.fromBufferAttribute(t,y),a.fromBufferAttribute(t,m),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,m),o.add(h),c.add(h),l.add(h),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let u=0,f=t.count;u<f;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(o,c){let l=o.array,h=o.itemSize,d=o.normalized,u=new l.constructor(c.length*h),f=0,_=0;for(let y=0,m=c.length;y<m;y++){o.isInterleavedBufferAttribute?f=c[y]*o.data.stride+o.offset:f=c[y]*h;for(let p=0;p<h;p++)u[_++]=l[f++]}return new yt(u,h,d)}if(this.index===null)return ye("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let c=s[o],l=e(c,n);t.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let c=[],l=r[o];for(let h=0,d=l.length;h<d;h++){let u=l[h],f=e(u,n);c.push(f)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let d=0,u=l.length;d<u;d++){let f=l[d];h.push(f.toJSON(e.data))}h.length>0&&(s[c]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],d=r[l];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let l=0,h=a.length;l<h;l++){let d=a[l];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},ls=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=sa,this.updateRanges=[],this.version=0,this.uuid=dn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=dn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=dn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Nt=new N,hs=class i{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Nt.fromBufferAttribute(this,t),Nt.applyMatrix4(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Nt.fromBufferAttribute(this,t),Nt.applyNormalMatrix(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Nt.fromBufferAttribute(this,t),Nt.transformDirection(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=hn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=hn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=hn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=hn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=hn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array),r=$e(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){Os("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new yt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new i(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Os("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Ud=0,Ht=class extends bn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ud++}),this.uuid=dn(),this.name="",this.type="Material",this.blending=Si,this.side=fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Zr,this.blendDst=$r,this.blendEquation=ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new we(0,0,0),this.blendAlpha=0,this.depthFunc=bi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=rc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bi,this.stencilZFail=Bi,this.stencilZPass=Bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){ye(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){ye(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Si&&(n.blending=this.blending),this.side!==fn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Zr&&(n.blendSrc=this.blendSrc),this.blendDst!==$r&&(n.blendDst=this.blendDst),this.blendEquation!==ri&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==bi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==rc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Bi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Bi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let c=r[o];delete c.metadata,a.push(c)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new we().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ze().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ze().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var On=new N,Wo=new N,wr=new N,ni=new N,Xo=new N,Rr=new N,qo=new N,wi=class{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,On)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=On.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(On.copy(this.origin).addScaledVector(this.direction,t),On.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Wo.copy(e).add(t).multiplyScalar(.5),wr.copy(t).sub(e).normalize(),ni.copy(this.origin).sub(Wo);let r=e.distanceTo(t)*.5,a=-this.direction.dot(wr),o=ni.dot(this.direction),c=-ni.dot(wr),l=ni.lengthSq(),h=Math.abs(1-a*a),d,u,f,_;if(h>0)if(d=a*c-o,u=a*o-c,_=r*h,d>=0)if(u>=-_)if(u<=_){let y=1/h;d*=y,u*=y,f=d*(d+a*u+2*o)+u*(a*d+u+2*c)+l}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*c)+l;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*c)+l;else u<=-_?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l):u<=_?(d=0,u=Math.min(Math.max(-r,-c),r),f=u*(u+2*c)+l):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Wo).addScaledVector(wr,u),f}intersectSphere(e,t){On.subVectors(e.center,this.origin);let n=On.dot(this.direction),s=On.dot(On)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,c,l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return l>=0?(n=(e.min.x-u.x)*l,s=(e.max.x-u.x)*l):(n=(e.max.x-u.x)*l,s=(e.min.x-u.x)*l),h>=0?(r=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(e.min.z-u.z)*d,c=(e.max.z-u.z)*d):(o=(e.max.z-u.z)*d,c=(e.min.z-u.z)*d),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,On)!==null}intersectTriangle(e,t,n,s,r){Xo.subVectors(t,e),Rr.subVectors(n,e),qo.crossVectors(Xo,Rr);let a=this.direction.dot(qo),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ni.subVectors(this.origin,e);let c=o*this.direction.dot(Rr.crossVectors(ni,Rr));if(c<0)return null;let l=o*this.direction.dot(Xo.cross(ni));if(l<0||c+l>a)return null;let h=-o*ni.dot(qo);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},pn=class extends Ht{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new we(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Vn,this.combine=_c,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ih=new De,yi=new wi,Ir=new Vt,sh=new N,Pr=new N,Lr=new N,Nr=new N,Yo=new N,Dr=new N,rh=new N,Ur=new N,wt=class extends rt{constructor(e=new Ot,t=new pn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Dr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=o[c],d=r[c];h!==0&&(Yo.fromBufferAttribute(d,e),a?Dr.addScaledVector(Yo,h):Dr.addScaledVector(Yo.sub(t),h))}t.add(Dr)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ir.copy(n.boundingSphere),Ir.applyMatrix4(r),yi.copy(e.ray).recast(e.near),!(Ir.containsPoint(yi.origin)===!1&&(yi.intersectSphere(Ir,sh)===null||yi.origin.distanceToSquared(sh)>(e.far-e.near)**2))&&(ih.copy(r).invert(),yi.copy(e.ray).applyMatrix4(ih),!(n.boundingBox!==null&&yi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,yi)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,y=u.length;_<y;_++){let m=u[_],p=a[m.materialIndex],T=Math.max(m.start,f.start),C=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let A=T,b=C;A<b;A+=3){let M=o.getX(A),E=o.getX(A+1),x=o.getX(A+2);s=Fr(this,p,e,n,l,h,d,M,E,x),s&&(s.faceIndex=Math.floor(A/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let _=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let m=_,p=y;m<p;m+=3){let T=o.getX(m),C=o.getX(m+1),A=o.getX(m+2);s=Fr(this,a,e,n,l,h,d,T,C,A),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,y=u.length;_<y;_++){let m=u[_],p=a[m.materialIndex],T=Math.max(m.start,f.start),C=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let A=T,b=C;A<b;A+=3){let M=A,E=A+1,x=A+2;s=Fr(this,p,e,n,l,h,d,M,E,x),s&&(s.faceIndex=Math.floor(A/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let _=Math.max(0,f.start),y=Math.min(c.count,f.start+f.count);for(let m=_,p=y;m<p;m+=3){let T=m,C=m+1,A=m+2;s=Fr(this,a,e,n,l,h,d,T,C,A),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function Fd(i,e,t,n,s,r,a,o){let c;if(e.side===zt?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,e.side===fn,o),c===null)return null;Ur.copy(o),Ur.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(Ur);return l<t.near||l>t.far?null:{distance:l,point:Ur.clone(),object:i}}function Fr(i,e,t,n,s,r,a,o,c,l){i.getVertexPosition(o,Pr),i.getVertexPosition(c,Lr),i.getVertexPosition(l,Nr);let h=Fd(i,e,t,n,Pr,Lr,Nr,rh);if(h){let d=new N;si.getBarycoord(rh,Pr,Lr,Nr,d),s&&(h.uv=si.getInterpolatedAttribute(s,o,c,l,d,new ze)),r&&(h.uv1=si.getInterpolatedAttribute(r,o,c,l,d,new ze)),a&&(h.normal=si.getInterpolatedAttribute(a,o,c,l,d,new N),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:c,c:l,normal:new N,materialIndex:0};si.getNormal(Pr,Lr,Nr,u.normal),h.face=u,h.barycoord=d}return h}var Is=new Je,ah=new Je,oh=new Je,Od=new Je,ch=new De,Or=new N,Ko=new Vt,lh=new De,Zo=new wi,Ws=class extends wt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=ec,this.bindMatrix=new De,this.bindMatrixInverse=new De,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ft),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Or),this.boundingBox.expandByPoint(Or)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Vt),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Or),this.boundingSphere.expandByPoint(Or)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ko.copy(this.boundingSphere),Ko.applyMatrix4(s),e.ray.intersectsSphere(Ko)!==!1&&(lh.copy(s).invert(),Zo.copy(e.ray).applyMatrix4(lh),!(this.boundingBox!==null&&Zo.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Zo)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Je,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===ec?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Zh?this.bindMatrixInverse.copy(this.bindMatrix).invert():ye("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,s=this.geometry;ah.fromBufferAttribute(s.attributes.skinIndex,e),oh.fromBufferAttribute(s.attributes.skinWeight,e),t.isVector4?(Is.copy(t),t.set(0,0,0,0)):(Is.set(...t,1),t.set(0,0,0)),Is.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let a=oh.getComponent(r);if(a!==0){let o=ah.getComponent(r);ch.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(Od.copy(Is).applyMatrix4(ch),a)}}return t.isVector4&&(t.w=Is.w),t.applyMatrix4(this.bindMatrixInverse)}},us=class extends rt{constructor(){super(),this.isBone=!0,this.type="Bone"}},ds=class extends Ct{constructor(e=null,t=1,n=1,s,r,a,o,c,l=ft,h=ft,d,u){super(null,a,o,c,l,h,s,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},hh=new De,zd=new De,Xs=class i{constructor(e=[],t=[]){this.uuid=dn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){ye("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new De)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new De;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,a=e.length;r<a;r++){let o=e[r]?e[r].matrixWorld:zd;hh.multiplyMatrices(o,t[r]),hh.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new i(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new ds(t,e,e,en,Qt);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){let r=e.bones[n],a=t[r];a===void 0&&(ye("Skeleton: No bone found with UUID:",r),a=new us),this.bones.push(a),this.boneInverses.push(new De().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let a=t[s];e.bones.push(a.uuid);let o=n[s];e.boneInverses.push(o.toArray())}return e}},oi=class extends yt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},ji=new De,uh=new De,zr=[],dh=new Ft,kd=new De,Ps=new wt,Ls=new Vt,qs=class extends wt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new oi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,kd)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ft),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ji),dh.copy(e.boundingBox).applyMatrix4(ji),this.boundingBox.union(dh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Vt),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ji),Ls.copy(e.boundingSphere).applyMatrix4(ji),this.boundingSphere.union(Ls)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Ps.geometry=this.geometry,Ps.material=this.material,Ps.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ls.copy(this.boundingSphere),Ls.applyMatrix4(n),e.ray.intersectsSphere(Ls)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,ji),uh.multiplyMatrices(n,ji),Ps.matrixWorld=uh,Ps.raycast(e,zr);for(let a=0,o=zr.length;a<o;a++){let c=zr[a];c.instanceId=r,c.object=this,t.push(c)}zr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new oi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ds(new Float32Array(s*this.count),s,this.count,wa,Qt));let r=this.morphTexture.source.data.data,a=0;for(let l=0;l<n.length;l++)a+=n[l];let o=this.geometry.morphTargetsRelative?1:1-a,c=s*e;return r[c]=o,r.set(n,c+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},$o=new N,Vd=new N,Hd=new Ie,Bn=class{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=$o.subVectors(n,t).cross(Vd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta($o),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Hd.getNormalMatrix(e),s=this.coplanarPoint($o).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ai=new Vt,Gd=new ze(.5,.5),kr=new N,fs=class{constructor(e=new Bn,t=new Bn,n=new Bn,s=new Bn,r=new Bn,a=new Bn){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=un,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],c=r[2],l=r[3],h=r[4],d=r[5],u=r[6],f=r[7],_=r[8],y=r[9],m=r[10],p=r[11],T=r[12],C=r[13],A=r[14],b=r[15];if(s[0].setComponents(l-a,f-h,p-_,b-T).normalize(),s[1].setComponents(l+a,f+h,p+_,b+T).normalize(),s[2].setComponents(l+o,f+d,p+y,b+C).normalize(),s[3].setComponents(l-o,f-d,p-y,b-C).normalize(),n)s[4].setComponents(c,u,m,A).normalize(),s[5].setComponents(l-c,f-u,p-m,b-A).normalize();else if(s[4].setComponents(l-c,f-u,p-m,b-A).normalize(),t===un)s[5].setComponents(l+c,f+u,p+m,b+A).normalize();else if(t===ss)s[5].setComponents(c,u,m,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ai.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ai.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ai)}intersectsSprite(e){Ai.center.set(0,0,0);let t=Gd.distanceTo(e.center);return Ai.radius=.7071067811865476+t,Ai.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ai)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(kr.x=s.normal.x>0?e.max.x:e.min.x,kr.y=s.normal.y>0?e.max.y:e.min.y,kr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(kr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ps=class extends Ht{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new we(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ca=new N,la=new N,fh=new De,Ns=new wi,Vr=new Vt,Jo=new N,ph=new N,Ri=class extends rt{constructor(e=new Ot,t=new ps){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)ca.fromBufferAttribute(t,s-1),la.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=ca.distanceTo(la);e.setAttribute("lineDistance",new Dt(n,1))}else ye("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Vr.copy(n.boundingSphere),Vr.applyMatrix4(s),Vr.radius+=r,e.ray.intersectsSphere(Vr)===!1)return;fh.copy(s).invert(),Ns.copy(e.ray).applyMatrix4(fh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){let f=Math.max(0,a.start),_=Math.min(h.count,a.start+a.count);for(let y=f,m=_-1;y<m;y+=l){let p=h.getX(y),T=h.getX(y+1),C=Hr(this,e,Ns,c,p,T,y);C&&t.push(C)}if(this.isLineLoop){let y=h.getX(_-1),m=h.getX(f),p=Hr(this,e,Ns,c,y,m,_-1);p&&t.push(p)}}else{let f=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let y=f,m=_-1;y<m;y+=l){let p=Hr(this,e,Ns,c,y,y+1,y);p&&t.push(p)}if(this.isLineLoop){let y=Hr(this,e,Ns,c,_-1,f,_-1);y&&t.push(y)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Hr(i,e,t,n,s,r,a){let o=i.geometry.attributes.position;if(ca.fromBufferAttribute(o,s),la.fromBufferAttribute(o,r),t.distanceSqToSegment(ca,la,Jo,ph)>n)return;Jo.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(Jo);if(!(l<e.near||l>e.far))return{distance:l,point:ph.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var mh=new N,gh=new N,Ys=class extends Ri{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)mh.fromBufferAttribute(t,s),gh.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+mh.distanceTo(gh);e.setAttribute("lineDistance",new Dt(n,1))}else ye("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Ks=class extends Ri{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},ms=class extends Ht{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new we(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},_h=new De,ac=new wi,Gr=new Vt,Wr=new N,Zs=class extends rt{constructor(e=new Ot,t=new ms){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Gr.copy(n.boundingSphere),Gr.applyMatrix4(s),Gr.radius+=r,e.ray.intersectsSphere(Gr)===!1)return;_h.copy(s).invert(),ac.copy(e.ray).applyMatrix4(_h);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,d=n.attributes.position;if(l!==null){let u=Math.max(0,a.start),f=Math.min(l.count,a.start+a.count);for(let _=u,y=f;_<y;_++){let m=l.getX(_);Wr.fromBufferAttribute(d,m),xh(Wr,m,c,s,e,t,this)}}else{let u=Math.max(0,a.start),f=Math.min(d.count,a.start+a.count);for(let _=u,y=f;_<y;_++)Wr.fromBufferAttribute(d,_),xh(Wr,_,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function xh(i,e,t,n,s,r,a){let o=ac.distanceSqToPoint(i);if(o<t){let c=new N;ac.closestPointToPoint(i,c),c.applyMatrix4(n);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var $s=class extends Ct{constructor(e=[],t=ui,n,s,r,a,o,c,l,h){super(e,t,n,s,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Hn=class extends Ct{constructor(e,t,n=_n,s,r,a,o=ft,c=ft,l,h=Sn,d=1){if(h!==Sn&&h!==di)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,s,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new os(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ha=class extends Hn{constructor(e,t=_n,n=ui,s,r,a=ft,o=ft,c,l=Sn){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Js=class extends Ct{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},gs=class i extends Ot{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let c=[],l=[],h=[],d=[],u=0,f=0;_("z","y","x",-1,-1,n,t,e,a,r,0),_("z","y","x",1,-1,n,t,-e,a,r,1),_("x","z","y",1,1,e,n,t,s,a,2),_("x","z","y",1,-1,e,n,-t,s,a,3),_("x","y","z",1,-1,e,t,n,s,r,4),_("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Dt(l,3)),this.setAttribute("normal",new Dt(h,3)),this.setAttribute("uv",new Dt(d,2));function _(y,m,p,T,C,A,b,M,E,x,S){let P=A/E,w=b/x,U=A/2,q=b/2,Z=M/2,z=E+1,X=x+1,H=0,J=0,Q=new N;for(let he=0;he<X;he++){let pe=he*w-q;for(let _e=0;_e<z;_e++){let Xe=_e*P-U;Q[y]=Xe*T,Q[m]=pe*C,Q[p]=Z,l.push(Q.x,Q.y,Q.z),Q[y]=0,Q[m]=0,Q[p]=M>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(_e/E),d.push(1-he/x),H+=1}}for(let he=0;he<x;he++)for(let pe=0;pe<E;pe++){let _e=u+pe+z*he,Xe=u+pe+z*(he+1),at=u+(pe+1)+z*(he+1),qe=u+(pe+1)+z*he;c.push(_e,Xe,qe),c.push(Xe,at,qe),J+=6}o.addGroup(f,J,S),f+=J,u+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var js=class i extends Ot{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(s),l=o+1,h=c+1,d=e/o,u=t/c,f=[],_=[],y=[],m=[];for(let p=0;p<h;p++){let T=p*u-a;for(let C=0;C<l;C++){let A=C*d-r;_.push(A,-T,0),y.push(0,0,1),m.push(C/o),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let T=0;T<o;T++){let C=T+l*p,A=T+l*(p+1),b=T+1+l*(p+1),M=T+1+l*p;f.push(C,A,M),f.push(A,b,M)}this.setIndex(f),this.setAttribute("position",new Dt(_,3)),this.setAttribute("normal",new Dt(y,3)),this.setAttribute("uv",new Dt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};function Ui(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(vh(s))s.isRenderTargetTexture?(ye("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(vh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Lt(i){let e={};for(let t=0;t<i.length;t++){let n=Ui(i[t]);for(let s in n)e[s]=n[s]}return e}function vh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Wd(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Uc(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Oe.workingColorSpace}var hu={clone:Ui,merge:Lt},Xd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,jt=class extends Ht{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Xd,this.fragmentShader=qd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ui(e.uniforms),this.uniformsGroups=Wd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new we().setHex(s.value);break;case"v2":this.uniforms[n].value=new ze().fromArray(s.value);break;case"v3":this.uniforms[n].value=new N().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Je().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Ie().fromArray(s.value);break;case"m4":this.uniforms[n].value=new De().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ua=class extends jt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Ii=class extends Ht{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new we(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new we(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=lo,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Vn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Gt=class extends Ii{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ze(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ve(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new we(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new we(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new we(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var da=class extends Ht{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Jh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},fa=class extends Ht{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Xr(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Yd(i){function e(s,r){return i[s]-i[r]}let t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function yh(i,e,t){let n=i.length,s=new i.constructor(n);for(let r=0,a=0;a!==n;++r){let o=t[r]*e;for(let c=0;c!==e;++c)s[a++]=i[o+c]}return s}function Kd(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push(...a)),r=i[s++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=i[s++];while(r!==void 0)}var Tn=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},pa=class extends Tn{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:nc,endingEnd:nc}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],c=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case ic:r=e,o=2*t-n;break;case sc:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case ic:a=e,c=2*n-t;break;case sc:a=1,c=n+s[1]-s[0];break;default:a=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-o),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,_=(n-t)/(s-t),y=_*_,m=y*_,p=-u*m+2*u*y-u*_,T=(1+u)*m+(-1.5-2*u)*y+(-.5+u)*_+1,C=(-1-f)*m+(1.5+f)*y+.5*_,A=f*m-f*y;for(let b=0;b!==o;++b)r[b]=p*a[h+b]+T*a[l+b]+C*a[c+b]+A*a[d+b];return r}},ma=class extends Tn{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=(n-t)/(s-t),d=1-h;for(let u=0;u!==o;++u)r[u]=a[l+u]*d+a[c+u]*h;return r}},ga=class extends Tn{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},_a=class extends Tn{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=this.inTangents,d=this.outTangents;if(!h||!d){let _=(n-t)/(s-t),y=1-_;for(let m=0;m!==o;++m)r[m]=a[l+m]*y+a[c+m]*_;return r}let u=o*2,f=e-1;for(let _=0;_!==o;++_){let y=a[l+_],m=a[c+_],p=f*u+_*2,T=d[p],C=d[p+1],A=e*u+_*2,b=h[A],M=h[A+1],E=(n-t)/(s-t),x,S,P,w,U;for(let q=0;q<8;q++){x=E*E,S=x*E,P=1-E,w=P*P,U=w*P;let z=U*t+3*w*E*T+3*P*x*b+S*s-n;if(Math.abs(z)<1e-10)break;let X=3*w*(T-t)+6*P*E*(b-T)+3*x*(s-b);if(Math.abs(X)<1e-10)break;E=E-z/X,E=Math.max(0,Math.min(1,E))}r[_]=U*y+3*w*E*C+3*P*x*M+S*m}return r}},Wt=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Xr(t,this.TimeBufferType),this.values=Xr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Xr(e.times,Array),values:Xr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ga(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ma(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new pa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new _a(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ti:t=this.InterpolantFactoryMethodDiscrete;break;case Ci:t=this.InterpolantFactoryMethodLinear;break;case Kr:t=this.InterpolantFactoryMethodSmooth;break;case tc:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return ye("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ti;case this.InterpolantFactoryMethodLinear:return Ci;case this.InterpolantFactoryMethodSmooth:return Kr;case this.InterpolantFactoryMethodBezier:return tc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Ee("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Ee("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let c=n[o];if(typeof c=="number"&&isNaN(c)){Ee("KeyframeTrack: Time is not a valid number.",this,o,c),e=!1;break}if(a!==null&&a>c){Ee("KeyframeTrack: Out of order keys.",this,o,c,a),e=!1;break}a=c}if(s!==void 0&&ad(s))for(let o=0,c=s.length;o!==c;++o){let l=s[o];if(isNaN(l)){Ee("KeyframeTrack: Value is not a valid number.",this,o,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Kr,r=e.length-1,a=1;for(let o=1;o<r;++o){let c=!1,l=e[o],h=e[o+1];if(l!==h&&(o!==1||l!==e[0]))if(s)c=!0;else{let d=o*n,u=d-n,f=d+n;for(let _=0;_!==n;++_){let y=t[d+_];if(y!==t[u+_]||y!==t[f+_]){c=!0;break}}}if(c){if(o!==a){e[a]=e[o];let d=o*n,u=a*n;for(let f=0;f!==n;++f)t[u+f]=t[d+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,c=a*n,l=0;l!==n;++l)t[c+l]=t[o+l];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};Wt.prototype.ValueTypeName="";Wt.prototype.TimeBufferType=Float32Array;Wt.prototype.ValueBufferType=Float32Array;Wt.prototype.DefaultInterpolation=Ci;var Gn=class extends Wt{constructor(e,t,n){super(e,t,n)}};Gn.prototype.ValueTypeName="bool";Gn.prototype.ValueBufferType=Array;Gn.prototype.DefaultInterpolation=Ti;Gn.prototype.InterpolantFactoryMethodLinear=void 0;Gn.prototype.InterpolantFactoryMethodSmooth=void 0;var Qs=class extends Wt{constructor(e,t,n,s){super(e,t,n,s)}};Qs.prototype.ValueTypeName="color";var Wn=class extends Wt{constructor(e,t,n,s){super(e,t,n,s)}};Wn.prototype.ValueTypeName="number";var xa=class extends Tn{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-t)/(s-t),l=e*o;for(let h=l+o;l!==h;l+=4)$t.slerpFlat(r,0,a,l-o,a,l,c);return r}},Xn=class extends Wt{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new xa(this.times,this.values,this.getValueSize(),e)}};Xn.prototype.ValueTypeName="quaternion";Xn.prototype.InterpolantFactoryMethodSmooth=void 0;var qn=class extends Wt{constructor(e,t,n){super(e,t,n)}};qn.prototype.ValueTypeName="string";qn.prototype.ValueBufferType=Array;qn.prototype.DefaultInterpolation=Ti;qn.prototype.InterpolantFactoryMethodLinear=void 0;qn.prototype.InterpolantFactoryMethodSmooth=void 0;var ci=class extends Wt{constructor(e,t,n,s){super(e,t,n,s)}};ci.prototype.ValueTypeName="vector";var er=class{constructor(e="",t=-1,n=[],s=$h){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=dn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,s=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push($d(n[a]).scale(s));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,a=n.length;r!==a;++r)t.push(Wt.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){let r=t.length,a=[];for(let o=0;o<r;o++){let c=[],l=[];c.push((o+r-1)%r,o,(o+1)%r),l.push(0,1,0);let h=Yd(c);c=yh(c,1,h),l=yh(l,1,h),!s&&c[0]===0&&(c.push(r),l.push(l[0])),a.push(new Wn(".morphTargetInfluences["+t[o].name+"]",c,l).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let s={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,c=e.length;o<c;o++){let l=e[o],h=l.name.match(r);if(h&&h.length>1){let d=h[1],u=s[d];u||(s[d]=u=[]),u.push(l)}}let a=[];for(let o in s)a.push(this.CreateFromMorphTargetSequence(o,s[o],t,n));return a}resetDuration(){let e=this.tracks,t=0;for(let n=0,s=e.length;n!==s;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function Zd(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Wn;case"vector":case"vector2":case"vector3":case"vector4":return ci;case"color":return Qs;case"quaternion":return Xn;case"bool":case"boolean":return Gn;case"string":return qn}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function $d(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Zd(i.type);if(i.times===void 0){let t=[],n=[];Kd(i.keys,t,n,"value"),i.times=t,i.values=n}return e.parse!==void 0?e.parse(i):new e(i.name,i.times,i.values,i.interpolation)}var Mn={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(Ah(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!Ah(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function Ah(i){try{let e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var va=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,d){return l.push(h,d),this},this.removeHandler=function(h){let d=l.indexOf(h);return d!==-1&&l.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=l.length;d<u;d+=2){let f=l[d],_=l[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},uu=new va,Cn=class{constructor(e){this.manager=e!==void 0?e:uu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Cn.DEFAULT_MATERIAL_NAME="__DEFAULT";var zn={},oc=class extends Error{constructor(e,t){super(e),this.response=t}},_s=class extends Cn{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=Mn.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(zn[e]!==void 0){zn[e].push({onLoad:t,onProgress:n,onError:s});return}zn[e]=[],zn[e].push({onLoad:t,onProgress:n,onError:s});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,c=this.responseType;fetch(a).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&ye("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=zn[e],d=l.body.getReader(),u=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=u?parseInt(u):0,_=f!==0,y=0,m=new ReadableStream({start(p){T();function T(){d.read().then(({done:C,value:A})=>{if(C)p.close();else{y+=A.byteLength;let b=new ProgressEvent("progress",{lengthComputable:_,loaded:y,total:f});for(let M=0,E=h.length;M<E;M++){let x=h[M];x.onProgress&&x.onProgress(b)}p.enqueue(A),T()}},C=>{p.error(C)})}}});return new Response(m)}else throw new oc(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return l.json();default:if(o==="")return l.text();{let d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,f=new TextDecoder(u);return l.arrayBuffer().then(_=>f.decode(_))}}}).then(l=>{Mn.add(`file:${e}`,l);let h=zn[e];delete zn[e];for(let d=0,u=h.length;d<u;d++){let f=h[d];f.onLoad&&f.onLoad(l)}}).catch(l=>{let h=zn[e];if(h===void 0)throw this.manager.itemError(e),l;delete zn[e];for(let d=0,u=h.length;d<u;d++){let f=h[d];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Qi=new WeakMap,ya=class extends Cn{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Mn.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let d=Qi.get(a);d===void 0&&(d=[],Qi.set(a,d)),d.push({onLoad:t,onError:s})}return a}let o=rs("img");function c(){h(),t&&t(this);let d=Qi.get(this)||[];for(let u=0;u<d.length;u++){let f=d[u];f.onLoad&&f.onLoad(this)}Qi.delete(this),r.manager.itemEnd(e)}function l(d){h(),s&&s(d),Mn.remove(`image:${e}`);let u=Qi.get(this)||[];for(let f=0;f<u.length;f++){let _=u[f];_.onError&&_.onError(d)}Qi.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",c,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Mn.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}};var tr=class extends Cn{constructor(e){super(e)}load(e,t,n,s){let r=new Ct,a=new ya(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},Pi=class extends rt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new we(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var jo=new De,Bh=new N,Mh=new N,nr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ze(512,512),this.mapType=Xt,this.map=null,this.mapPass=null,this.matrix=new De,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new fs,this._frameExtents=new ze(1,1),this._viewportCount=1,this._viewports=[new Je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Bh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Bh),Mh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Mh),t.updateMatrixWorld(),jo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(jo,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===ss||t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(jo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},qr=new N,Yr=new $t,An=new N,ir=class extends rt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new De,this.projectionMatrix=new De,this.projectionMatrixInverse=new De,this.coordinateSystem=un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(qr,Yr,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qr,Yr,An.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(qr,Yr,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qr,Yr,An.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ii=new N,Sh=new ze,bh=new ze,vt=class extends ir{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ei*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ds*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ei*2*Math.atan(Math.tan(Ds*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ii.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ii.x,ii.y).multiplyScalar(-e/ii.z),ii.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ii.x,ii.y).multiplyScalar(-e/ii.z)}getViewSize(e,t){return this.getViewBounds(e,Sh,bh),t.subVectors(bh,Sh)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ds*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,t-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},cc=class extends nr{constructor(){super(new vt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=Ei*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},sr=class extends Pi{constructor(e,t,n=0,s=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(rt.DEFAULT_UP),this.updateMatrix(),this.target=new rt,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new cc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},lc=class extends nr{constructor(){super(new vt(90,1,.5,500)),this.isPointLightShadow=!0}},li=class extends Pi{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new lc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},hi=class extends ir{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},hc=class extends nr{constructor(){super(new hi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Li=class extends Pi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(rt.DEFAULT_UP),this.updateMatrix(),this.target=new rt,this.shadow=new hc}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},rr=class extends Pi{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var Yn=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var Qo=new WeakMap,ar=class extends Cn{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&ye("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&ye("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Mn.get(`image-bitmap:${e}`);if(a!==void 0){if(r.manager.itemStart(e),a.then){a.then(l=>{Qo.has(a)===!0?(s&&s(Qo.get(a)),r.manager.itemError(e),r.manager.itemEnd(e)):(t&&t(l),r.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let c=fetch(e,o).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){Mn.add(`image-bitmap:${e}`,l),t&&t(l),r.manager.itemEnd(e)}).catch(function(l){s&&s(l),Qo.set(c,l),Mn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Mn.add(`image-bitmap:${e}`,c),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var es=-90,ts=1,Aa=class extends rt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new vt(es,ts,e,t);s.layers=this.layers,this.add(s);let r=new vt(es,ts,e,t);r.layers=this.layers,this.add(r);let a=new vt(es,ts,e,t);a.layers=this.layers,this.add(a);let o=new vt(es,ts,e,t);o.layers=this.layers,this.add(o);let c=new vt(es,ts,e,t);c.layers=this.layers,this.add(c);let l=new vt(es,ts,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,c]=t;for(let l of t)this.remove(l);if(e===un)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===ss)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,c,l,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.generateMipmaps=y,e.setRenderTarget(n,5,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}},Ba=class extends vt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Fc="\\[\\]\\.:\\/",Jd=new RegExp("["+Fc+"]","g"),Oc="[^"+Fc+"]",jd="[^"+Fc.replace("\\.","")+"]",Qd=/((?:WC+[\/:])*)/.source.replace("WC",Oc),ef=/(WCOD+)?/.source.replace("WCOD",jd),tf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Oc),nf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Oc),sf=new RegExp("^"+Qd+ef+tf+nf+"$"),rf=["material","materials","bones","map"],uc=class{constructor(e,t,n){let s=n||nt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},nt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Jd,"")}static parseTrackName(e){let t=sf.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);rf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let c=n(o.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){ye("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){Ee("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ee("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ee("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ee("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ee("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ee("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){Ee("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let a=e[s];if(a===void 0){let l=t.nodeName;Ee("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Ee("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ee("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};nt.Composite=uc;nt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};nt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};nt.prototype.GetterByBindingType=[nt.prototype._getValue_direct,nt.prototype._getValue_array,nt.prototype._getValue_arrayElement,nt.prototype._getValue_toArray];nt.prototype.SetterByBindingTypeAndVersioning=[[nt.prototype._setValue_direct,nt.prototype._setValue_direct_setNeedsUpdate,nt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[nt.prototype._setValue_array,nt.prototype._setValue_array_setNeedsUpdate,nt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[nt.prototype._setValue_arrayElement,nt.prototype._setValue_arrayElement_setNeedsUpdate,nt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[nt.prototype._setValue_fromArray,nt.prototype._setValue_fromArray_setNeedsUpdate,nt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var u_=new Float32Array(1);var dc=class i{static{i.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};function zc(i,e,t,n){let s=af(n);switch(t){case Rc:return i*e;case wa:return i*e/s.components*s.byteLength;case Ra:return i*e/s.components*s.byteLength;case fi:return i*e*2/s.components*s.byteLength;case Ia:return i*e*2/s.components*s.byteLength;case Ic:return i*e*3/s.components*s.byteLength;case en:return i*e*4/s.components*s.byteLength;case Pa:return i*e*4/s.components*s.byteLength;case lr:case hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ur:case dr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Na:case Ua:return Math.max(i,16)*Math.max(e,8)/4;case La:case Da:return Math.max(i,8)*Math.max(e,8)/2;case Fa:case Oa:case ka:case Va:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case za:case fr:case Ha:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ga:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Wa:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Xa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case qa:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ya:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Ka:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Za:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case $a:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Ja:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case ja:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Qa:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case eo:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case to:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case no:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case io:case so:case ro:return Math.ceil(i/4)*Math.ceil(e/4)*16;case ao:case oo:return Math.ceil(i/4)*Math.ceil(e/4)*8;case pr:case co:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function af(i){switch(i){case Xt:case Tc:return{byteLength:1,components:1};case ys:case Cc:case wn:return{byteLength:2,components:1};case Ca:case Ea:return{byteLength:2,components:4};case _n:case Ta:case Qt:return{byteLength:4,components:1};case Ec:case wc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?ye("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");function Nu(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function cf(i){let e=new WeakMap;function t(o,c){let l=o.array,h=o.usage,d=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,h),o.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,c,l){let h=c.array,d=c.updateRanges;if(i.bindBuffer(l,o),d.length===0)i.bufferSubData(l,0,h);else{d.sort((f,_)=>f.start-_.start);let u=0;for(let f=1;f<d.length;f++){let _=d[u],y=d[f];y.start<=_.start+_.count+1?_.count=Math.max(_.count,y.start+y.count-_.start):(++u,d[u]=y)}d.length=u+1;for(let f=0,_=d.length;f<_;f++){let y=d[f];i.bufferSubData(l,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var lf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,hf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,uf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,df=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ff=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,pf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,mf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,gf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,_f=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,xf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,vf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,yf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Af=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Bf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Mf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Sf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,bf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Tf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Cf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ef=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,wf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Rf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,If=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Pf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Lf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Nf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Df=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Uf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ff=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Of=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,zf="gl_FragColor = linearToOutputTexel( gl_FragColor );",kf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Vf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Hf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Gf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Wf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Xf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,qf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Yf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Kf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Zf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,$f=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Jf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,jf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Qf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ep=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,tp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,np=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ip=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,sp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ap=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,op=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,cp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,hp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,up=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,dp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,fp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,pp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,mp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,gp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,_p=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,xp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,vp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ap=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Bp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Mp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Sp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,bp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Tp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Ep=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,wp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Rp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ip=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Pp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Lp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Np=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Dp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Up=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Fp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Op=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,zp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,kp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Vp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Hp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Gp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Wp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Xp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,qp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Yp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Kp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Zp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,$p=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Jp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,jp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Qp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,em=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,im=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,sm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,rm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,am=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,cm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,lm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,hm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,um=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,gm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,_m=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,xm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,vm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ym=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Am=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Bm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Sm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Em=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Rm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Im=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Nm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Um=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Fm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Om=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,zm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,km=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Hm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ue={alphahash_fragment:lf,alphahash_pars_fragment:hf,alphamap_fragment:uf,alphamap_pars_fragment:df,alphatest_fragment:ff,alphatest_pars_fragment:pf,aomap_fragment:mf,aomap_pars_fragment:gf,batching_pars_vertex:_f,batching_vertex:xf,begin_vertex:vf,beginnormal_vertex:yf,bsdfs:Af,iridescence_fragment:Bf,bumpmap_pars_fragment:Mf,clipping_planes_fragment:Sf,clipping_planes_pars_fragment:bf,clipping_planes_pars_vertex:Tf,clipping_planes_vertex:Cf,color_fragment:Ef,color_pars_fragment:wf,color_pars_vertex:Rf,color_vertex:If,common:Pf,cube_uv_reflection_fragment:Lf,defaultnormal_vertex:Nf,displacementmap_pars_vertex:Df,displacementmap_vertex:Uf,emissivemap_fragment:Ff,emissivemap_pars_fragment:Of,colorspace_fragment:zf,colorspace_pars_fragment:kf,envmap_fragment:Vf,envmap_common_pars_fragment:Hf,envmap_pars_fragment:Gf,envmap_pars_vertex:Wf,envmap_physical_pars_fragment:tp,envmap_vertex:Xf,fog_vertex:qf,fog_pars_vertex:Yf,fog_fragment:Kf,fog_pars_fragment:Zf,gradientmap_pars_fragment:$f,lightmap_pars_fragment:Jf,lights_lambert_fragment:jf,lights_lambert_pars_fragment:Qf,lights_pars_begin:ep,lights_toon_fragment:np,lights_toon_pars_fragment:ip,lights_phong_fragment:sp,lights_phong_pars_fragment:rp,lights_physical_fragment:ap,lights_physical_pars_fragment:op,lights_fragment_begin:cp,lights_fragment_maps:lp,lights_fragment_end:hp,lightprobes_pars_fragment:up,logdepthbuf_fragment:dp,logdepthbuf_pars_fragment:fp,logdepthbuf_pars_vertex:pp,logdepthbuf_vertex:mp,map_fragment:gp,map_pars_fragment:_p,map_particle_fragment:xp,map_particle_pars_fragment:vp,metalnessmap_fragment:yp,metalnessmap_pars_fragment:Ap,morphinstance_vertex:Bp,morphcolor_vertex:Mp,morphnormal_vertex:Sp,morphtarget_pars_vertex:bp,morphtarget_vertex:Tp,normal_fragment_begin:Cp,normal_fragment_maps:Ep,normal_pars_fragment:wp,normal_pars_vertex:Rp,normal_vertex:Ip,normalmap_pars_fragment:Pp,clearcoat_normal_fragment_begin:Lp,clearcoat_normal_fragment_maps:Np,clearcoat_pars_fragment:Dp,iridescence_pars_fragment:Up,opaque_fragment:Fp,packing:Op,premultiplied_alpha_fragment:zp,project_vertex:kp,dithering_fragment:Vp,dithering_pars_fragment:Hp,roughnessmap_fragment:Gp,roughnessmap_pars_fragment:Wp,shadowmap_pars_fragment:Xp,shadowmap_pars_vertex:qp,shadowmap_vertex:Yp,shadowmask_pars_fragment:Kp,skinbase_vertex:Zp,skinning_pars_vertex:$p,skinning_vertex:Jp,skinnormal_vertex:jp,specularmap_fragment:Qp,specularmap_pars_fragment:em,tonemapping_fragment:tm,tonemapping_pars_fragment:nm,transmission_fragment:im,transmission_pars_fragment:sm,uv_pars_fragment:rm,uv_pars_vertex:am,uv_vertex:om,worldpos_vertex:cm,background_vert:lm,background_frag:hm,backgroundCube_vert:um,backgroundCube_frag:dm,cube_vert:fm,cube_frag:pm,depth_vert:mm,depth_frag:gm,distance_vert:_m,distance_frag:xm,equirect_vert:vm,equirect_frag:ym,linedashed_vert:Am,linedashed_frag:Bm,meshbasic_vert:Mm,meshbasic_frag:Sm,meshlambert_vert:bm,meshlambert_frag:Tm,meshmatcap_vert:Cm,meshmatcap_frag:Em,meshnormal_vert:wm,meshnormal_frag:Rm,meshphong_vert:Im,meshphong_frag:Pm,meshphysical_vert:Lm,meshphysical_frag:Nm,meshtoon_vert:Dm,meshtoon_frag:Um,points_vert:Fm,points_frag:Om,shadow_vert:zm,shadow_frag:km,sprite_vert:Vm,sprite_frag:Hm},le={common:{diffuse:{value:new we(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ie}},envmap:{envMap:{value:null},envMapRotation:{value:new Ie},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ie}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ie}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ie},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ie},normalScale:{value:new ze(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ie},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ie}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ie}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ie}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new we(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new N},probesMax:{value:new N},probesResolution:{value:new N}},points:{diffuse:{value:new we(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0},uvTransform:{value:new Ie}},sprite:{diffuse:{value:new we(16777215)},opacity:{value:1},center:{value:new ze(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}}},In={basic:{uniforms:Lt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Ue.meshbasic_vert,fragmentShader:Ue.meshbasic_frag},lambert:{uniforms:Lt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new we(0)},envMapIntensity:{value:1}}]),vertexShader:Ue.meshlambert_vert,fragmentShader:Ue.meshlambert_frag},phong:{uniforms:Lt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new we(0)},specular:{value:new we(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ue.meshphong_vert,fragmentShader:Ue.meshphong_frag},standard:{uniforms:Lt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new we(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ue.meshphysical_vert,fragmentShader:Ue.meshphysical_frag},toon:{uniforms:Lt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new we(0)}}]),vertexShader:Ue.meshtoon_vert,fragmentShader:Ue.meshtoon_frag},matcap:{uniforms:Lt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Ue.meshmatcap_vert,fragmentShader:Ue.meshmatcap_frag},points:{uniforms:Lt([le.points,le.fog]),vertexShader:Ue.points_vert,fragmentShader:Ue.points_frag},dashed:{uniforms:Lt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ue.linedashed_vert,fragmentShader:Ue.linedashed_frag},depth:{uniforms:Lt([le.common,le.displacementmap]),vertexShader:Ue.depth_vert,fragmentShader:Ue.depth_frag},normal:{uniforms:Lt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Ue.meshnormal_vert,fragmentShader:Ue.meshnormal_frag},sprite:{uniforms:Lt([le.sprite,le.fog]),vertexShader:Ue.sprite_vert,fragmentShader:Ue.sprite_frag},background:{uniforms:{uvTransform:{value:new Ie},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ue.background_vert,fragmentShader:Ue.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ie}},vertexShader:Ue.backgroundCube_vert,fragmentShader:Ue.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ue.cube_vert,fragmentShader:Ue.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ue.equirect_vert,fragmentShader:Ue.equirect_frag},distance:{uniforms:Lt([le.common,le.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ue.distance_vert,fragmentShader:Ue.distance_frag},shadow:{uniforms:Lt([le.lights,le.fog,{color:{value:new we(0)},opacity:{value:1}}]),vertexShader:Ue.shadow_vert,fragmentShader:Ue.shadow_frag}};In.physical={uniforms:Lt([In.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ie},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ie},clearcoatNormalScale:{value:new ze(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ie},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ie},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ie},sheen:{value:0},sheenColor:{value:new we(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ie},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ie},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ie},transmissionSamplerSize:{value:new ze},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ie},attenuationDistance:{value:0},attenuationColor:{value:new we(0)},specularColor:{value:new we(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ie},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ie},anisotropyVector:{value:new ze},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ie}}]),vertexShader:Ue.meshphysical_vert,fragmentShader:Ue.meshphysical_frag};var fo={r:0,b:0,g:0},Gm=new De,Du=new Ie;Du.set(-1,0,0,0,1,0,0,0,1);function Wm(i,e,t,n,s,r){let a=new we(0),o=s===!0?0:1,c,l,h=null,d=0,u=null;function f(T){let C=T.isScene===!0?T.background:null;if(C&&C.isTexture){let A=T.backgroundBlurriness>0;C=e.get(C,A)}return C}function _(T){let C=!1,A=f(T);A===null?m(a,o):A&&A.isColor&&(m(A,1),C=!0);let b=i.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||C)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(T,C){let A=f(C);A&&(A.isCubeTexture||A.mapping===cr)?(l===void 0&&(l=new wt(new gs(1,1,1),new jt({name:"BackgroundCubeMaterial",uniforms:Ui(In.backgroundCube.uniforms),vertexShader:In.backgroundCube.vertexShader,fragmentShader:In.backgroundCube.fragmentShader,side:zt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,M,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=A,l.material.uniforms.backgroundBlurriness.value=C.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Gm.makeRotationFromEuler(C.backgroundRotation)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Du),l.material.toneMapped=Oe.getTransfer(A.colorSpace)!==Ke,(h!==A||d!==A.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=A,d=A.version,u=i.toneMapping),l.layers.enableAll(),T.unshift(l,l.geometry,l.material,0,0,null)):A&&A.isTexture&&(c===void 0&&(c=new wt(new js(2,2),new jt({name:"BackgroundMaterial",uniforms:Ui(In.background.uniforms),vertexShader:In.background.vertexShader,fragmentShader:In.background.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=A,c.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,c.material.toneMapped=Oe.getTransfer(A.colorSpace)!==Ke,A.matrixAutoUpdate===!0&&A.updateMatrix(),c.material.uniforms.uvTransform.value.copy(A.matrix),(h!==A||d!==A.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=A,d=A.version,u=i.toneMapping),c.layers.enableAll(),T.unshift(c,c.geometry,c.material,0,0,null))}function m(T,C){T.getRGB(fo,Uc(i)),t.buffers.color.setClear(fo.r,fo.g,fo.b,C,r)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(T,C=1){a.set(T),o=C,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(T){o=T,m(a,o)},render:_,addToRenderList:y,dispose:p}}function Xm(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(w,U,q,Z,z){let X=!1,H=d(w,Z,q,U);r!==H&&(r=H,l(r.object)),X=f(w,Z,q,z),X&&_(w,Z,q,z),z!==null&&e.update(z,i.ELEMENT_ARRAY_BUFFER),(X||a)&&(a=!1,A(w,U,q,Z),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(z).buffer))}function c(){return i.createVertexArray()}function l(w){return i.bindVertexArray(w)}function h(w){return i.deleteVertexArray(w)}function d(w,U,q,Z){let z=Z.wireframe===!0,X=n[U.id];X===void 0&&(X={},n[U.id]=X);let H=w.isInstancedMesh===!0?w.id:0,J=X[H];J===void 0&&(J={},X[H]=J);let Q=J[q.id];Q===void 0&&(Q={},J[q.id]=Q);let he=Q[z];return he===void 0&&(he=u(c()),Q[z]=he),he}function u(w){let U=[],q=[],Z=[];for(let z=0;z<t;z++)U[z]=0,q[z]=0,Z[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:q,attributeDivisors:Z,object:w,attributes:{},index:null}}function f(w,U,q,Z){let z=r.attributes,X=U.attributes,H=0,J=q.getAttributes();for(let Q in J)if(J[Q].location>=0){let pe=z[Q],_e=X[Q];if(_e===void 0&&(Q==="instanceMatrix"&&w.instanceMatrix&&(_e=w.instanceMatrix),Q==="instanceColor"&&w.instanceColor&&(_e=w.instanceColor)),pe===void 0||pe.attribute!==_e||_e&&pe.data!==_e.data)return!0;H++}return r.attributesNum!==H||r.index!==Z}function _(w,U,q,Z){let z={},X=U.attributes,H=0,J=q.getAttributes();for(let Q in J)if(J[Q].location>=0){let pe=X[Q];pe===void 0&&(Q==="instanceMatrix"&&w.instanceMatrix&&(pe=w.instanceMatrix),Q==="instanceColor"&&w.instanceColor&&(pe=w.instanceColor));let _e={};_e.attribute=pe,pe&&pe.data&&(_e.data=pe.data),z[Q]=_e,H++}r.attributes=z,r.attributesNum=H,r.index=Z}function y(){let w=r.newAttributes;for(let U=0,q=w.length;U<q;U++)w[U]=0}function m(w){p(w,0)}function p(w,U){let q=r.newAttributes,Z=r.enabledAttributes,z=r.attributeDivisors;q[w]=1,Z[w]===0&&(i.enableVertexAttribArray(w),Z[w]=1),z[w]!==U&&(i.vertexAttribDivisor(w,U),z[w]=U)}function T(){let w=r.newAttributes,U=r.enabledAttributes;for(let q=0,Z=U.length;q<Z;q++)U[q]!==w[q]&&(i.disableVertexAttribArray(q),U[q]=0)}function C(w,U,q,Z,z,X,H){H===!0?i.vertexAttribIPointer(w,U,q,z,X):i.vertexAttribPointer(w,U,q,Z,z,X)}function A(w,U,q,Z){y();let z=Z.attributes,X=q.getAttributes(),H=U.defaultAttributeValues;for(let J in X){let Q=X[J];if(Q.location>=0){let he=z[J];if(he===void 0&&(J==="instanceMatrix"&&w.instanceMatrix&&(he=w.instanceMatrix),J==="instanceColor"&&w.instanceColor&&(he=w.instanceColor)),he!==void 0){let pe=he.normalized,_e=he.itemSize,Xe=e.get(he);if(Xe===void 0)continue;let at=Xe.buffer,qe=Xe.type,$=Xe.bytesPerElement,ie=qe===i.INT||qe===i.UNSIGNED_INT||he.gpuType===Ta;if(he.isInterleavedBufferAttribute){let ee=he.data,Re=ee.stride,Pe=he.offset;if(ee.isInstancedInterleavedBuffer){for(let Te=0;Te<Q.locationSize;Te++)p(Q.location+Te,ee.meshPerAttribute);w.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let Te=0;Te<Q.locationSize;Te++)m(Q.location+Te);i.bindBuffer(i.ARRAY_BUFFER,at);for(let Te=0;Te<Q.locationSize;Te++)C(Q.location+Te,_e/Q.locationSize,qe,pe,Re*$,(Pe+_e/Q.locationSize*Te)*$,ie)}else{if(he.isInstancedBufferAttribute){for(let ee=0;ee<Q.locationSize;ee++)p(Q.location+ee,he.meshPerAttribute);w.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let ee=0;ee<Q.locationSize;ee++)m(Q.location+ee);i.bindBuffer(i.ARRAY_BUFFER,at);for(let ee=0;ee<Q.locationSize;ee++)C(Q.location+ee,_e/Q.locationSize,qe,pe,_e*$,_e/Q.locationSize*ee*$,ie)}}else if(H!==void 0){let pe=H[J];if(pe!==void 0)switch(pe.length){case 2:i.vertexAttrib2fv(Q.location,pe);break;case 3:i.vertexAttrib3fv(Q.location,pe);break;case 4:i.vertexAttrib4fv(Q.location,pe);break;default:i.vertexAttrib1fv(Q.location,pe)}}}}T()}function b(){S();for(let w in n){let U=n[w];for(let q in U){let Z=U[q];for(let z in Z){let X=Z[z];for(let H in X)h(X[H].object),delete X[H];delete Z[z]}}delete n[w]}}function M(w){if(n[w.id]===void 0)return;let U=n[w.id];for(let q in U){let Z=U[q];for(let z in Z){let X=Z[z];for(let H in X)h(X[H].object),delete X[H];delete Z[z]}}delete n[w.id]}function E(w){for(let U in n){let q=n[U];for(let Z in q){let z=q[Z];if(z[w.id]===void 0)continue;let X=z[w.id];for(let H in X)h(X[H].object),delete X[H];delete z[w.id]}}}function x(w){for(let U in n){let q=n[U],Z=w.isInstancedMesh===!0?w.id:0,z=q[Z];if(z!==void 0){for(let X in z){let H=z[X];for(let J in H)h(H[J].object),delete H[J];delete z[X]}delete q[Z],Object.keys(q).length===0&&delete n[U]}}}function S(){P(),a=!0,r!==s&&(r=s,l(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:S,resetDefaultState:P,dispose:b,releaseStatesOfGeometry:M,releaseStatesOfObject:x,releaseStatesOfProgram:E,initAttributes:y,enableAttribute:m,disableUnusedAttributes:T}}function qm(i,e,t){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function a(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),t.update(l,n,h))}function o(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let u=0;for(let f=0;f<h;f++)u+=l[f];t.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Ym(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let E=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(E){return!(E!==en&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){let x=E===wn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==Xt&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==Qt&&!x)}function c(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(ye("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&ye("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),T=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),C=i.getParameter(i.MAX_VARYING_VECTORS),A=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),M=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:_,maxTextureSize:y,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:T,maxVaryings:C,maxFragmentUniforms:A,maxSamples:b,samples:M}}function Km(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Bn,o=new Ie,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||n!==0||s;return s=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){let _=d.clippingPlanes,y=d.clipIntersection,m=d.clipShadows,p=i.get(d);if(!s||_===null||_.length===0||r&&!m)r?h(null):l();else{let T=r?0:n,C=T*4,A=p.clippingState||null;c.value=A,A=h(_,u,C,f);for(let b=0;b!==C;++b)A[b]=t[b];p.clippingState=A,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=T}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,u,f,_){let y=d!==null?d.length:0,m=null;if(y!==0){if(m=c.value,_!==!0||m===null){let p=f+y*4,T=u.matrixWorldInverse;o.getNormalMatrix(T),(m===null||m.length<p)&&(m=new Float32Array(p));for(let C=0,A=f;C!==y;++C,A+=4)a.copy(d[C]).applyMatrix4(T,o),a.normal.toArray(m,A),m[A+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}var pi=4,du=[.125,.215,.35,.446,.526,.582],Fi=20,Zm=256,gr=new hi,fu=new we,kc=null,Vc=0,Hc=0,Gc=!1,$m=new N,mo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=$m}=r;kc=this._renderer.getRenderTarget(),Vc=this._renderer.getActiveCubeFace(),Hc=this._renderer.getActiveMipmapLevel(),Gc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=mu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(kc,Vc,Hc),this._renderer.xr.enabled=Gc,e.scissorTest=!1,Ms(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ui||e.mapping===Ni?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),kc=this._renderer.getRenderTarget(),Vc=this._renderer.getActiveCubeFace(),Hc=this._renderer.getActiveMipmapLevel(),Gc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:pt,minFilter:pt,generateMipmaps:!1,type:wn,format:en,colorSpace:Ut,depthBuffer:!1},s=pu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pu(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Jm(r)),this._blurMaterial=Qm(r,e,t),this._ggxMaterial=jm(r,e,t)}return s}_compileMaterial(e){let t=new wt(new Ot,e);this._renderer.compile(t,gr)}_sceneToCubeUV(e,t,n,s,r){let c=new vt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(fu),d.toneMapping=mn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new wt(new gs,new pn({name:"PMREM.Background",side:zt,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,m=y.material,p=!1,T=e.background;T?T.isColor&&(m.color.copy(T),e.background=null,p=!0):(m.color.copy(fu),p=!0);for(let C=0;C<6;C++){let A=C%3;A===0?(c.up.set(0,l[C],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[C],r.y,r.z)):A===1?(c.up.set(0,0,l[C]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[C],r.z)):(c.up.set(0,l[C],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[C]));let b=this._cubeSize;Ms(s,A*b,C>2?b:0,b,b),d.setRenderTarget(s),p&&d.render(y,c),d.render(e,c)}d.toneMapping=f,d.autoClear=u,e.background=T}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===ui||e.mapping===Ni;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=mu());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let c=this._cubeSize;Ms(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,gr)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let c=a.uniforms,l=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(l*l-h*h),u=0+l*1.25,f=d*u,{_lodMax:_}=this,y=this._sizeLods[n],m=3*y*(n>_-pi?n-_+pi:0),p=4*(this._cubeSize-y);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=_-t,Ms(r,m,p,3*y,2*y),s.setRenderTarget(r),s.render(o,gr),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=_-n,Ms(e,m,p,3*y,2*y),s.setRenderTarget(e),s.render(o,gr)}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Ee("blur direction must be either latitudinal or longitudinal!");let h=3,d=this._lodMeshes[s];d.material=l;let u=l.uniforms,f=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Fi-1),y=r/_,m=isFinite(r)?1+Math.floor(h*y):Fi;m>Fi&&ye(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Fi}`);let p=[],T=0;for(let E=0;E<Fi;++E){let x=E/y,S=Math.exp(-x*x/2);p.push(S),E===0?T+=S:E<m&&(T+=2*S)}for(let E=0;E<p.length;E++)p[E]=p[E]/T;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=p,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:C}=this;u.dTheta.value=_,u.mipInt.value=C-n;let A=this._sizeLods[s],b=3*A*(s>C-pi?s-C+pi:0),M=4*(this._cubeSize-A);Ms(t,b,M,3*A,2*A),c.setRenderTarget(t),c.render(d,gr)}};function Jm(i){let e=[],t=[],n=[],s=i,r=i-pi+1+du.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let c=1/o;a>i-pi?c=du[a-i+pi-1]:a===0&&(c=0),t.push(c);let l=1/(o-2),h=-l,d=1+l,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,_=6,y=3,m=2,p=1,T=new Float32Array(y*_*f),C=new Float32Array(m*_*f),A=new Float32Array(p*_*f);for(let M=0;M<f;M++){let E=M%3*2/3-1,x=M>2?0:-1,S=[E,x,0,E+2/3,x,0,E+2/3,x+1,0,E,x,0,E+2/3,x+1,0,E,x+1,0];T.set(S,y*_*M),C.set(u,m*_*M);let P=[M,M,M,M,M,M];A.set(P,p*_*M)}let b=new Ot;b.setAttribute("position",new yt(T,y)),b.setAttribute("uv",new yt(C,m)),b.setAttribute("faceIndex",new yt(A,p)),n.push(new wt(b,null)),s>pi&&s--}return{lodMeshes:n,sizeLods:e,sigmas:t}}function pu(i,e,t){let n=new Jt(i,e,t);return n.texture.mapping=cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ms(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function jm(i,e,t){return new jt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Zm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:xo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:En,depthTest:!1,depthWrite:!1})}function Qm(i,e,t){let n=new Float32Array(Fi),s=new N(0,1,0);return new jt({name:"SphericalGaussianBlur",defines:{n:Fi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:xo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:En,depthTest:!1,depthWrite:!1})}function mu(){return new jt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:xo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:En,depthTest:!1,depthWrite:!1})}function gu(){return new jt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:xo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:En,depthTest:!1,depthWrite:!1})}function xo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var go=class extends Jt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new $s(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new gs(5,5,5),r=new jt({name:"CubemapFromEquirect",uniforms:Ui(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:zt,blending:En});r.uniforms.tEquirect.value=t;let a=new wt(s,r),o=t.minFilter;return t.minFilter===gn&&(t.minFilter=pt),new Aa(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}};function eg(i){let e=new WeakMap,t=new WeakMap,n=null;function s(u,f=!1){return u==null?null:f?a(u):r(u)}function r(u){if(u&&u.isTexture){let f=u.mapping;if(f===Ma||f===Sa)if(e.has(u)){let _=e.get(u).texture;return o(_,u.mapping)}else{let _=u.image;if(_&&_.height>0){let y=new go(_.height);return y.fromEquirectangularTexture(i,u),e.set(u,y),u.addEventListener("dispose",l),o(y.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let f=u.mapping,_=f===Ma||f===Sa,y=f===ui||f===Ni;if(_||y){let m=t.get(u),p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new mo(i)),m=_?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{let T=u.image;return _&&T&&T.height>0||y&&T&&c(T)?(n===null&&(n=new mo(i)),m=_?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,f){return f===Ma?u.mapping=ui:f===Sa&&(u.mapping=Ni),u}function c(u){let f=0,_=6;for(let y=0;y<_;y++)u[y]!==void 0&&f++;return f===_}function l(u){let f=u.target;f.removeEventListener("dispose",l);let _=e.get(f);_!==void 0&&(e.delete(f),_.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let _=t.get(f);_!==void 0&&(t.delete(f),_.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function tg(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Mi("WebGLRenderer: "+n+" extension not supported."),s}}}function ng(i,e,t,n){let s={},r=new WeakMap;function a(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let _ in u.attributes)e.remove(u.attributes[_]);u.removeEventListener("dispose",a),delete s[u.id];let f=r.get(u);f&&(e.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,t.memory.geometries++),u}function c(d){let u=d.attributes;for(let f in u)e.update(u[f],i.ARRAY_BUFFER)}function l(d){let u=[],f=d.index,_=d.attributes.position,y=0;if(_===void 0)return;if(f!==null){let T=f.array;y=f.version;for(let C=0,A=T.length;C<A;C+=3){let b=T[C+0],M=T[C+1],E=T[C+2];u.push(b,M,M,E,E,b)}}else{let T=_.array;y=_.version;for(let C=0,A=T.length/3-1;C<A;C+=3){let b=C+0,M=C+1,E=C+2;u.push(b,M,M,E,E,b)}}let m=new(_.count>=65535?Gs:Hs)(u,1);m.version=y;let p=r.get(d);p&&e.remove(p),r.set(d,m)}function h(d){let u=r.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&l(d)}else l(d);return r.get(d)}return{get:o,update:c,getWireframeAttribute:h}}function ig(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function c(d,u){i.drawElements(n,u,r,d*a),t.update(u,n,1)}function l(d,u,f){f!==0&&(i.drawElementsInstanced(n,u,r,d*a,f),t.update(u,n,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,f);let y=0;for(let m=0;m<f;m++)y+=u[m];t.update(y,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function sg(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Ee("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function rg(i,e,t){let n=new WeakMap,s=new Je;function r(a,o,c){let l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==d){let S=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",S)};u!==void 0&&u.texture.dispose();let f=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],T=o.morphAttributes.color||[],C=0;f===!0&&(C=1),_===!0&&(C=2),y===!0&&(C=3);let A=o.attributes.position.count*C,b=1;A>e.maxTextureSize&&(b=Math.ceil(A/e.maxTextureSize),A=e.maxTextureSize);let M=new Float32Array(A*b*4*d),E=new zs(M,A,b,d);E.type=Qt,E.needsUpdate=!0;let x=C*4;for(let P=0;P<d;P++){let w=m[P],U=p[P],q=T[P],Z=A*b*4*P;for(let z=0;z<w.count;z++){let X=z*x;f===!0&&(s.fromBufferAttribute(w,z),M[Z+X+0]=s.x,M[Z+X+1]=s.y,M[Z+X+2]=s.z,M[Z+X+3]=0),_===!0&&(s.fromBufferAttribute(U,z),M[Z+X+4]=s.x,M[Z+X+5]=s.y,M[Z+X+6]=s.z,M[Z+X+7]=0),y===!0&&(s.fromBufferAttribute(q,z),M[Z+X+8]=s.x,M[Z+X+9]=s.y,M[Z+X+10]=s.z,M[Z+X+11]=q.itemSize===4?s.w:1)}}u={count:d,texture:E,size:new ze(A,b)},n.set(o,u),o.addEventListener("dispose",S)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let f=0;for(let y=0;y<l.length;y++)f+=l[y];let _=o.morphTargetsRelative?1:1-f;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function ag(i,e,t,n,s){let r=new WeakMap;function a(l){let h=s.render.frame,d=l.geometry,u=e.get(l,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){let f=l.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function o(){r=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var og={[xc]:"LINEAR_TONE_MAPPING",[vc]:"REINHARD_TONE_MAPPING",[yc]:"CINEON_TONE_MAPPING",[Ac]:"ACES_FILMIC_TONE_MAPPING",[Mc]:"AGX_TONE_MAPPING",[Sc]:"NEUTRAL_TONE_MAPPING",[Bc]:"CUSTOM_TONE_MAPPING"};function cg(i,e,t,n,s,r){let a=new Jt(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,depthTexture:s?new Hn(e,t):void 0}),o=new Jt(e,t,{type:wn,depthBuffer:!1,stencilBuffer:!1}),c=new Ot;c.setAttribute("position",new Dt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Dt([0,2,0,0,2,0],2));let l=new ua({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new wt(c,l),d=new hi(-1,1,1,-1,0,1),u=null,f=null,_=!1,y,m=null,p=[],T=!1;this.setSize=function(C,A){a.setSize(C,A),o.setSize(C,A);for(let b=0;b<p.length;b++){let M=p[b];M.setSize&&M.setSize(C,A)}},this.setEffects=function(C){p=C,T=p.length>0&&p[0].isRenderPass===!0;let A=a.width,b=a.height;for(let M=0;M<p.length;M++){let E=p[M];E.setSize&&E.setSize(A,b)}},this.begin=function(C,A){if(_||C.toneMapping===mn&&p.length===0)return!1;if(m=A,A!==null){let b=A.width,M=A.height;(a.width!==b||a.height!==M)&&this.setSize(b,M)}return T===!1&&C.setRenderTarget(a),y=C.toneMapping,C.toneMapping=mn,!0},this.hasRenderPass=function(){return T},this.end=function(C,A){C.toneMapping=y,_=!0;let b=a,M=o;for(let E=0;E<p.length;E++){let x=p[E];if(x.enabled!==!1&&(x.render(C,M,b,A),x.needsSwap!==!1)){let S=b;b=M,M=S}}if(u!==C.outputColorSpace||f!==C.toneMapping){u=C.outputColorSpace,f=C.toneMapping,l.defines={},Oe.getTransfer(u)===Ke&&(l.defines.SRGB_TRANSFER="");let E=og[f];E&&(l.defines[E]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=b.texture,C.setRenderTarget(m),C.render(h,d),m=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),c.dispose(),l.dispose()}}var Uu=new Ct,qc=new Hn(1,1),Fu=new zs,Ou=new oa,zu=new $s,_u=[],xu=[],vu=new Float32Array(16),yu=new Float32Array(9),Au=new Float32Array(4);function bs(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=_u[s];if(r===void 0&&(r=new Float32Array(s),_u[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Mt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function St(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function vo(i,e){let t=xu[e];t===void 0&&(t=new Int32Array(e),xu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function lg(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function hg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2fv(this.addr,e),St(t,e)}}function ug(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;i.uniform3fv(this.addr,e),St(t,e)}}function dg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4fv(this.addr,e),St(t,e)}}function fg(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,n))return;Au.set(n),i.uniformMatrix2fv(this.addr,!1,Au),St(t,n)}}function pg(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,n))return;yu.set(n),i.uniformMatrix3fv(this.addr,!1,yu),St(t,n)}}function mg(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),St(t,e)}else{if(Mt(t,n))return;vu.set(n),i.uniformMatrix4fv(this.addr,!1,vu),St(t,n)}}function gg(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function _g(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2iv(this.addr,e),St(t,e)}}function xg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;i.uniform3iv(this.addr,e),St(t,e)}}function vg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4iv(this.addr,e),St(t,e)}}function yg(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Ag(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2uiv(this.addr,e),St(t,e)}}function Bg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;i.uniform3uiv(this.addr,e),St(t,e)}}function Mg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4uiv(this.addr,e),St(t,e)}}function Sg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(qc.compareFunction=t.isReversedDepthBuffer()?uo:ho,r=qc):r=Uu,t.setTexture2D(e||r,s)}function bg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Ou,s)}function Tg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||zu,s)}function Cg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Fu,s)}function Eg(i){switch(i){case 5126:return lg;case 35664:return hg;case 35665:return ug;case 35666:return dg;case 35674:return fg;case 35675:return pg;case 35676:return mg;case 5124:case 35670:return gg;case 35667:case 35671:return _g;case 35668:case 35672:return xg;case 35669:case 35673:return vg;case 5125:return yg;case 36294:return Ag;case 36295:return Bg;case 36296:return Mg;case 35678:case 36198:case 36298:case 36306:case 35682:return Sg;case 35679:case 36299:case 36307:return bg;case 35680:case 36300:case 36308:case 36293:return Tg;case 36289:case 36303:case 36311:case 36292:return Cg}}function wg(i,e){i.uniform1fv(this.addr,e)}function Rg(i,e){let t=bs(e,this.size,2);i.uniform2fv(this.addr,t)}function Ig(i,e){let t=bs(e,this.size,3);i.uniform3fv(this.addr,t)}function Pg(i,e){let t=bs(e,this.size,4);i.uniform4fv(this.addr,t)}function Lg(i,e){let t=bs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Ng(i,e){let t=bs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Dg(i,e){let t=bs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Ug(i,e){i.uniform1iv(this.addr,e)}function Fg(i,e){i.uniform2iv(this.addr,e)}function Og(i,e){i.uniform3iv(this.addr,e)}function zg(i,e){i.uniform4iv(this.addr,e)}function kg(i,e){i.uniform1uiv(this.addr,e)}function Vg(i,e){i.uniform2uiv(this.addr,e)}function Hg(i,e){i.uniform3uiv(this.addr,e)}function Gg(i,e){i.uniform4uiv(this.addr,e)}function Wg(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Mt(n,r)||(i.uniform1iv(this.addr,r),St(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=qc:a=Uu;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function Xg(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Mt(n,r)||(i.uniform1iv(this.addr,r),St(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Ou,r[a])}function qg(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Mt(n,r)||(i.uniform1iv(this.addr,r),St(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||zu,r[a])}function Yg(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Mt(n,r)||(i.uniform1iv(this.addr,r),St(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Fu,r[a])}function Kg(i){switch(i){case 5126:return wg;case 35664:return Rg;case 35665:return Ig;case 35666:return Pg;case 35674:return Lg;case 35675:return Ng;case 35676:return Dg;case 5124:case 35670:return Ug;case 35667:case 35671:return Fg;case 35668:case 35672:return Og;case 35669:case 35673:return zg;case 5125:return kg;case 36294:return Vg;case 36295:return Hg;case 36296:return Gg;case 35678:case 36198:case 36298:case 36306:case 35682:return Wg;case 35679:case 36299:case 36307:return Xg;case 35680:case 36300:case 36308:case 36293:return qg;case 36289:case 36303:case 36311:case 36292:return Yg}}var Yc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Eg(t.type)}},Kc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Kg(t.type)}},Zc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Wc=/(\w+)(\])?(\[|\.)?/g;function Bu(i,e){i.seq.push(e),i.map[e.id]=e}function Zg(i,e,t){let n=i.name,s=n.length;for(Wc.lastIndex=0;;){let r=Wc.exec(n),a=Wc.lastIndex,o=r[1],c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Bu(t,l===void 0?new Yc(o,i,e):new Kc(o,i,e));break}else{let d=t.map[o];d===void 0&&(d=new Zc(o),Bu(t,d)),t=d}}}var Ss=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);Zg(o,c,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function Mu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var $g=37297,Jg=0;function jg(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Su=new Ie;function Qg(i){Oe._getMatrix(Su,Oe.workingColorSpace,i);let e=`mat3( ${Su.elements.map(t=>t.toFixed(4))} )`;switch(Oe.getTransfer(i)){case Fs:return[e,"LinearTransferOETF"];case Ke:return[e,"sRGBTransferOETF"];default:return ye("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function bu(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+jg(i.getShaderSource(e),o)}else return r}function e0(i,e){let t=Qg(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var t0={[xc]:"Linear",[vc]:"Reinhard",[yc]:"Cineon",[Ac]:"ACESFilmic",[Mc]:"AgX",[Sc]:"Neutral",[Bc]:"Custom"};function n0(i,e){let t=t0[e];return t===void 0?(ye("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var po=new N;function i0(){Oe.getLuminanceCoefficients(po);let i=po.x.toFixed(4),e=po.y.toFixed(4),t=po.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function s0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xr).join(`
`)}function r0(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function a0(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function xr(i){return i!==""}function Tu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Cu(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var o0=/^[ \t]*#include +<([\w\d./]+)>/gm;function $c(i){return i.replace(o0,l0)}var c0=new Map;function l0(i,e){let t=Ue[e];if(t===void 0){let n=c0.get(e);if(n!==void 0)t=Ue[n],ye('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return $c(t)}var h0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Eu(i){return i.replace(h0,u0)}function u0(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function wu(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var d0={[or]:"SHADOWMAP_TYPE_PCF",[xs]:"SHADOWMAP_TYPE_VSM"};function f0(i){return d0[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var p0={[ui]:"ENVMAP_TYPE_CUBE",[Ni]:"ENVMAP_TYPE_CUBE",[cr]:"ENVMAP_TYPE_CUBE_UV"};function m0(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":p0[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var g0={[Ni]:"ENVMAP_MODE_REFRACTION"};function _0(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":g0[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var x0={[_c]:"ENVMAP_BLENDING_MULTIPLY",[Yh]:"ENVMAP_BLENDING_MIX",[Kh]:"ENVMAP_BLENDING_ADD"};function v0(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":x0[i.combine]||"ENVMAP_BLENDING_NONE"}function y0(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function A0(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,c=f0(t),l=m0(t),h=_0(t),d=v0(t),u=y0(t),f=s0(t),_=r0(r),y=s.createProgram(),m,p,T=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xr).join(`
`),p.length>0&&(p+=`
`)):(m=[wu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xr).join(`
`),p=[wu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==mn?"#define TONE_MAPPING":"",t.toneMapping!==mn?Ue.tonemapping_pars_fragment:"",t.toneMapping!==mn?n0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ue.colorspace_pars_fragment,e0("linearToOutputTexel",t.outputColorSpace),i0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(xr).join(`
`)),a=$c(a),a=Tu(a,t),a=Cu(a,t),o=$c(o),o=Tu(o,t),o=Cu(o,t),a=Eu(a),o=Eu(o),t.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Lc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Lc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let C=T+m+a,A=T+p+o,b=Mu(s,s.VERTEX_SHADER,C),M=Mu(s,s.FRAGMENT_SHADER,A);s.attachShader(y,b),s.attachShader(y,M),t.index0AttributeName!==void 0?s.bindAttribLocation(y,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function E(w){if(i.debug.checkShaderErrors){let U=s.getProgramInfoLog(y)||"",q=s.getShaderInfoLog(b)||"",Z=s.getShaderInfoLog(M)||"",z=U.trim(),X=q.trim(),H=Z.trim(),J=!0,Q=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,b,M);else{let he=bu(s,b,"vertex"),pe=bu(s,M,"fragment");Ee("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+w.name+`
Material Type: `+w.type+`

Program Info Log: `+z+`
`+he+`
`+pe)}else z!==""?ye("WebGLProgram: Program Info Log:",z):(X===""||H==="")&&(Q=!1);Q&&(w.diagnostics={runnable:J,programLog:z,vertexShader:{log:X,prefix:m},fragmentShader:{log:H,prefix:p}})}s.deleteShader(b),s.deleteShader(M),x=new Ss(s,y),S=a0(s,y)}let x;this.getUniforms=function(){return x===void 0&&E(this),x};let S;this.getAttributes=function(){return S===void 0&&E(this),S};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=s.getProgramParameter(y,$g)),P},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Jg++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=b,this.fragmentShader=M,this}var B0=0,Jc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new jc(e),t.set(e,n)),n}},jc=class{constructor(e){this.id=B0++,this.code=e,this.usedTimes=0}};function M0(i){return i===fi||i===fr||i===pr}function S0(i,e,t,n,s,r){let a=new ks,o=new Jc,c=new Set,l=[],h=new Map,d=n.logarithmicDepthBuffer,u=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(x){return c.add(x),x===0?"uv":`uv${x}`}function y(x,S,P,w,U,q){let Z=w.fog,z=U.geometry,X=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?w.environment:null,H=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,J=e.get(x.envMap||X,H),Q=J&&J.mapping===cr?J.image.height:null,he=f[x.type];x.precision!==null&&(u=n.getMaxPrecision(x.precision),u!==x.precision&&ye("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));let pe=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,_e=pe!==void 0?pe.length:0,Xe=0;z.morphAttributes.position!==void 0&&(Xe=1),z.morphAttributes.normal!==void 0&&(Xe=2),z.morphAttributes.color!==void 0&&(Xe=3);let at,qe,$,ie;if(he){let xe=In[he];at=xe.vertexShader,qe=xe.fragmentShader}else{at=x.vertexShader,qe=x.fragmentShader;let xe=o.getVertexShaderStage(x),ct=o.getFragmentShaderStage(x);o.update(x,xe,ct),$=xe.id,ie=ct.id}let ee=i.getRenderTarget(),Re=i.state.buffers.depth.getReversed(),Pe=U.isInstancedMesh===!0,Te=U.isBatchedMesh===!0,ht=!!x.map,He=!!x.matcap,Qe=!!J,Ye=!!x.aoMap,Ge=!!x.lightMap,gt=!!x.bumpMap&&x.wireframe===!1,At=!!x.normalMap,bt=!!x.displacementMap,Et=!!x.emissiveMap,ot=!!x.metalnessMap,_t=!!x.roughnessMap,I=x.anisotropy>0,kt=x.clearcoat>0,Ze=x.dispersion>0,B=x.iridescence>0,g=x.sheen>0,D=x.transmission>0,k=I&&!!x.anisotropyMap,G=kt&&!!x.clearcoatMap,te=kt&&!!x.clearcoatNormalMap,se=kt&&!!x.clearcoatRoughnessMap,W=B&&!!x.iridescenceMap,K=B&&!!x.iridescenceThicknessMap,re=g&&!!x.sheenColorMap,Be=g&&!!x.sheenRoughnessMap,ce=!!x.specularMap,ae=!!x.specularColorMap,be=!!x.specularIntensityMap,Ce=D&&!!x.transmissionMap,Le=D&&!!x.thicknessMap,R=!!x.gradientMap,ne=!!x.alphaMap,Y=x.alphaTest>0,oe=!!x.alphaHash,fe=!!x.extensions,j=mn;x.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(j=i.toneMapping);let Ae={shaderID:he,shaderType:x.type,shaderName:x.name,vertexShader:at,fragmentShader:qe,defines:x.defines,customVertexShaderID:$,customFragmentShaderID:ie,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:Te,batchingColor:Te&&U._colorsTexture!==null,instancing:Pe,instancingColor:Pe&&U.instanceColor!==null,instancingMorph:Pe&&U.morphTexture!==null,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:Oe.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:ht,matcap:He,envMap:Qe,envMapMode:Qe&&J.mapping,envMapCubeUVHeight:Q,aoMap:Ye,lightMap:Ge,bumpMap:gt,normalMap:At,displacementMap:bt,emissiveMap:Et,normalMapObjectSpace:At&&x.normalMapType===jh,normalMapTangentSpace:At&&x.normalMapType===lo,packedNormalMap:At&&x.normalMapType===lo&&M0(x.normalMap.format),metalnessMap:ot,roughnessMap:_t,anisotropy:I,anisotropyMap:k,clearcoat:kt,clearcoatMap:G,clearcoatNormalMap:te,clearcoatRoughnessMap:se,dispersion:Ze,iridescence:B,iridescenceMap:W,iridescenceThicknessMap:K,sheen:g,sheenColorMap:re,sheenRoughnessMap:Be,specularMap:ce,specularColorMap:ae,specularIntensityMap:be,transmission:D,transmissionMap:Ce,thicknessMap:Le,gradientMap:R,opaque:x.transparent===!1&&x.blending===Si&&x.alphaToCoverage===!1,alphaMap:ne,alphaTest:Y,alphaHash:oe,combine:x.combine,mapUv:ht&&_(x.map.channel),aoMapUv:Ye&&_(x.aoMap.channel),lightMapUv:Ge&&_(x.lightMap.channel),bumpMapUv:gt&&_(x.bumpMap.channel),normalMapUv:At&&_(x.normalMap.channel),displacementMapUv:bt&&_(x.displacementMap.channel),emissiveMapUv:Et&&_(x.emissiveMap.channel),metalnessMapUv:ot&&_(x.metalnessMap.channel),roughnessMapUv:_t&&_(x.roughnessMap.channel),anisotropyMapUv:k&&_(x.anisotropyMap.channel),clearcoatMapUv:G&&_(x.clearcoatMap.channel),clearcoatNormalMapUv:te&&_(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:se&&_(x.clearcoatRoughnessMap.channel),iridescenceMapUv:W&&_(x.iridescenceMap.channel),iridescenceThicknessMapUv:K&&_(x.iridescenceThicknessMap.channel),sheenColorMapUv:re&&_(x.sheenColorMap.channel),sheenRoughnessMapUv:Be&&_(x.sheenRoughnessMap.channel),specularMapUv:ce&&_(x.specularMap.channel),specularColorMapUv:ae&&_(x.specularColorMap.channel),specularIntensityMapUv:be&&_(x.specularIntensityMap.channel),transmissionMapUv:Ce&&_(x.transmissionMap.channel),thicknessMapUv:Le&&_(x.thicknessMap.channel),alphaMapUv:ne&&_(x.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(At||I),vertexNormals:!!z.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!z.attributes.uv&&(ht||ne),fog:!!Z,useFog:x.fog===!0,fogExp2:!!Z&&Z.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||z.attributes.normal===void 0&&At===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Re,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:Xe,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:q.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:j,decodeVideoTexture:ht&&x.map.isVideoTexture===!0&&Oe.getTransfer(x.map.colorSpace)===Ke,decodeVideoTextureEmissive:Et&&x.emissiveMap.isVideoTexture===!0&&Oe.getTransfer(x.emissiveMap.colorSpace)===Ke,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===rn,flipSided:x.side===zt,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:fe&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(fe&&x.extensions.multiDraw===!0||Te)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ae.vertexUv1s=c.has(1),Ae.vertexUv2s=c.has(2),Ae.vertexUv3s=c.has(3),c.clear(),Ae}function m(x){let S=[];if(x.shaderID?S.push(x.shaderID):(S.push(x.customVertexShaderID),S.push(x.customFragmentShaderID)),x.defines!==void 0)for(let P in x.defines)S.push(P),S.push(x.defines[P]);return x.isRawShaderMaterial===!1&&(p(S,x),T(S,x),S.push(i.outputColorSpace)),S.push(x.customProgramCacheKey),S.join()}function p(x,S){x.push(S.precision),x.push(S.outputColorSpace),x.push(S.envMapMode),x.push(S.envMapCubeUVHeight),x.push(S.mapUv),x.push(S.alphaMapUv),x.push(S.lightMapUv),x.push(S.aoMapUv),x.push(S.bumpMapUv),x.push(S.normalMapUv),x.push(S.displacementMapUv),x.push(S.emissiveMapUv),x.push(S.metalnessMapUv),x.push(S.roughnessMapUv),x.push(S.anisotropyMapUv),x.push(S.clearcoatMapUv),x.push(S.clearcoatNormalMapUv),x.push(S.clearcoatRoughnessMapUv),x.push(S.iridescenceMapUv),x.push(S.iridescenceThicknessMapUv),x.push(S.sheenColorMapUv),x.push(S.sheenRoughnessMapUv),x.push(S.specularMapUv),x.push(S.specularColorMapUv),x.push(S.specularIntensityMapUv),x.push(S.transmissionMapUv),x.push(S.thicknessMapUv),x.push(S.combine),x.push(S.fogExp2),x.push(S.sizeAttenuation),x.push(S.morphTargetsCount),x.push(S.morphAttributeCount),x.push(S.numDirLights),x.push(S.numPointLights),x.push(S.numSpotLights),x.push(S.numSpotLightMaps),x.push(S.numHemiLights),x.push(S.numRectAreaLights),x.push(S.numDirLightShadows),x.push(S.numPointLightShadows),x.push(S.numSpotLightShadows),x.push(S.numSpotLightShadowsWithMaps),x.push(S.numLightProbes),x.push(S.shadowMapType),x.push(S.toneMapping),x.push(S.numClippingPlanes),x.push(S.numClipIntersection),x.push(S.depthPacking)}function T(x,S){a.disableAll(),S.instancing&&a.enable(0),S.instancingColor&&a.enable(1),S.instancingMorph&&a.enable(2),S.matcap&&a.enable(3),S.envMap&&a.enable(4),S.normalMapObjectSpace&&a.enable(5),S.normalMapTangentSpace&&a.enable(6),S.clearcoat&&a.enable(7),S.iridescence&&a.enable(8),S.alphaTest&&a.enable(9),S.vertexColors&&a.enable(10),S.vertexAlphas&&a.enable(11),S.vertexUv1s&&a.enable(12),S.vertexUv2s&&a.enable(13),S.vertexUv3s&&a.enable(14),S.vertexTangents&&a.enable(15),S.anisotropy&&a.enable(16),S.alphaHash&&a.enable(17),S.batching&&a.enable(18),S.dispersion&&a.enable(19),S.batchingColor&&a.enable(20),S.gradientMap&&a.enable(21),S.packedNormalMap&&a.enable(22),S.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),S.numLightProbeGrids>0&&a.enable(22),S.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function C(x){let S=f[x.type],P;if(S){let w=In[S];P=hu.clone(w.uniforms)}else P=x.uniforms;return P}function A(x,S){let P=h.get(S);return P!==void 0?++P.usedTimes:(P=new A0(i,S,x,s),l.push(P),h.set(S,P)),P}function b(x){if(--x.usedTimes===0){let S=l.indexOf(x);l[S]=l[l.length-1],l.pop(),h.delete(x.cacheKey),x.destroy()}}function M(x){o.remove(x)}function E(){o.dispose()}return{getParameters:y,getProgramCacheKey:m,getUniforms:C,acquireProgram:A,releaseProgram:b,releaseShaderCache:M,programs:l,dispose:E}}function b0(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function T0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Ru(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Iu(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,_,y,m,p){let T=i[e];return T===void 0?(T={id:u.id,object:u,geometry:f,material:_,materialVariant:a(u),groupOrder:y,renderOrder:u.renderOrder,z:m,group:p},i[e]=T):(T.id=u.id,T.object=u,T.geometry=f,T.material=_,T.materialVariant=a(u),T.groupOrder=y,T.renderOrder=u.renderOrder,T.z=m,T.group=p),e++,T}function c(u,f,_,y,m,p){let T=o(u,f,_,y,m,p);_.transmission>0?n.push(T):_.transparent===!0?s.push(T):t.push(T)}function l(u,f,_,y,m,p){let T=o(u,f,_,y,m,p);_.transmission>0?n.unshift(T):_.transparent===!0?s.unshift(T):t.unshift(T)}function h(u,f,_){t.length>1&&t.sort(u||T0),n.length>1&&n.sort(f||Ru),s.length>1&&s.sort(f||Ru),_&&(t.reverse(),n.reverse(),s.reverse())}function d(){for(let u=e,f=i.length;u<f;u++){let _=i[u];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:d,sort:h}}function C0(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Iu,i.set(n,[a])):s>=r.length?(a=new Iu,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function E0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new N,color:new we};break;case"SpotLight":t={position:new N,direction:new N,color:new we,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new N,color:new we,distance:0,decay:0};break;case"HemisphereLight":t={direction:new N,skyColor:new we,groundColor:new we};break;case"RectAreaLight":t={color:new we,position:new N,halfWidth:new N,halfHeight:new N};break}return i[e.id]=t,t}}}function w0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var R0=0;function I0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function P0(i){let e=new E0,t=w0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new N);let s=new N,r=new De,a=new De;function o(l){let h=0,d=0,u=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let f=0,_=0,y=0,m=0,p=0,T=0,C=0,A=0,b=0,M=0,E=0;l.sort(I0);for(let S=0,P=l.length;S<P;S++){let w=l[S],U=w.color,q=w.intensity,Z=w.distance,z=null;if(w.shadow&&w.shadow.map&&(w.shadow.map.texture.format===fi?z=w.shadow.map.texture:z=w.shadow.map.depthTexture||w.shadow.map.texture),w.isAmbientLight)h+=U.r*q,d+=U.g*q,u+=U.b*q;else if(w.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(w.sh.coefficients[X],q);E++}else if(w.isDirectionalLight){let X=e.get(w);if(X.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){let H=w.shadow,J=t.get(w);J.shadowIntensity=H.intensity,J.shadowBias=H.bias,J.shadowNormalBias=H.normalBias,J.shadowRadius=H.radius,J.shadowMapSize=H.mapSize,n.directionalShadow[f]=J,n.directionalShadowMap[f]=z,n.directionalShadowMatrix[f]=w.shadow.matrix,T++}n.directional[f]=X,f++}else if(w.isSpotLight){let X=e.get(w);X.position.setFromMatrixPosition(w.matrixWorld),X.color.copy(U).multiplyScalar(q),X.distance=Z,X.coneCos=Math.cos(w.angle),X.penumbraCos=Math.cos(w.angle*(1-w.penumbra)),X.decay=w.decay,n.spot[y]=X;let H=w.shadow;if(w.map&&(n.spotLightMap[b]=w.map,b++,H.updateMatrices(w),w.castShadow&&M++),n.spotLightMatrix[y]=H.matrix,w.castShadow){let J=t.get(w);J.shadowIntensity=H.intensity,J.shadowBias=H.bias,J.shadowNormalBias=H.normalBias,J.shadowRadius=H.radius,J.shadowMapSize=H.mapSize,n.spotShadow[y]=J,n.spotShadowMap[y]=z,A++}y++}else if(w.isRectAreaLight){let X=e.get(w);X.color.copy(U).multiplyScalar(q),X.halfWidth.set(w.width*.5,0,0),X.halfHeight.set(0,w.height*.5,0),n.rectArea[m]=X,m++}else if(w.isPointLight){let X=e.get(w);if(X.color.copy(w.color).multiplyScalar(w.intensity),X.distance=w.distance,X.decay=w.decay,w.castShadow){let H=w.shadow,J=t.get(w);J.shadowIntensity=H.intensity,J.shadowBias=H.bias,J.shadowNormalBias=H.normalBias,J.shadowRadius=H.radius,J.shadowMapSize=H.mapSize,J.shadowCameraNear=H.camera.near,J.shadowCameraFar=H.camera.far,n.pointShadow[_]=J,n.pointShadowMap[_]=z,n.pointShadowMatrix[_]=w.shadow.matrix,C++}n.point[_]=X,_++}else if(w.isHemisphereLight){let X=e.get(w);X.skyColor.copy(w.color).multiplyScalar(q),X.groundColor.copy(w.groundColor).multiplyScalar(q),n.hemi[p]=X,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=le.LTC_FLOAT_1,n.rectAreaLTC2=le.LTC_FLOAT_2):(n.rectAreaLTC1=le.LTC_HALF_1,n.rectAreaLTC2=le.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;let x=n.hash;(x.directionalLength!==f||x.pointLength!==_||x.spotLength!==y||x.rectAreaLength!==m||x.hemiLength!==p||x.numDirectionalShadows!==T||x.numPointShadows!==C||x.numSpotShadows!==A||x.numSpotMaps!==b||x.numLightProbes!==E)&&(n.directional.length=f,n.spot.length=y,n.rectArea.length=m,n.point.length=_,n.hemi.length=p,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.pointShadow.length=C,n.pointShadowMap.length=C,n.spotShadow.length=A,n.spotShadowMap.length=A,n.directionalShadowMatrix.length=T,n.pointShadowMatrix.length=C,n.spotLightMatrix.length=A+b-M,n.spotLightMap.length=b,n.numSpotLightShadowsWithMaps=M,n.numLightProbes=E,x.directionalLength=f,x.pointLength=_,x.spotLength=y,x.rectAreaLength=m,x.hemiLength=p,x.numDirectionalShadows=T,x.numPointShadows=C,x.numSpotShadows=A,x.numSpotMaps=b,x.numLightProbes=E,n.version=R0++)}function c(l,h){let d=0,u=0,f=0,_=0,y=0,m=h.matrixWorldInverse;for(let p=0,T=l.length;p<T;p++){let C=l[p];if(C.isDirectionalLight){let A=n.directional[d];A.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),A.direction.sub(s),A.direction.transformDirection(m),d++}else if(C.isSpotLight){let A=n.spot[f];A.position.setFromMatrixPosition(C.matrixWorld),A.position.applyMatrix4(m),A.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),A.direction.sub(s),A.direction.transformDirection(m),f++}else if(C.isRectAreaLight){let A=n.rectArea[_];A.position.setFromMatrixPosition(C.matrixWorld),A.position.applyMatrix4(m),a.identity(),r.copy(C.matrixWorld),r.premultiply(m),a.extractRotation(r),A.halfWidth.set(C.width*.5,0,0),A.halfHeight.set(0,C.height*.5,0),A.halfWidth.applyMatrix4(a),A.halfHeight.applyMatrix4(a),_++}else if(C.isPointLight){let A=n.point[u];A.position.setFromMatrixPosition(C.matrixWorld),A.position.applyMatrix4(m),u++}else if(C.isHemisphereLight){let A=n.hemi[y];A.direction.setFromMatrixPosition(C.matrixWorld),A.direction.transformDirection(m),y++}}}return{setup:o,setupView:c,state:n}}function Pu(i){let e=new P0(i),t=[],n=[],s=[];function r(u){d.camera=u,t.length=0,n.length=0,s.length=0}function a(u){t.push(u)}function o(u){n.push(u)}function c(u){s.push(u)}function l(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function L0(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Pu(i),e.set(s,[o])):r>=a.length?(o=new Pu(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var N0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,D0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,U0=[new N(1,0,0),new N(-1,0,0),new N(0,1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1)],F0=[new N(0,-1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1),new N(0,-1,0),new N(0,-1,0)],Lu=new De,_r=new N,Xc=new N;function O0(i,e,t){let n=new fs,s=new ze,r=new ze,a=new Je,o=new da,c=new fa,l={},h=t.maxTextureSize,d={[fn]:zt,[zt]:fn,[rn]:rn},u=new jt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ze},radius:{value:4}},vertexShader:N0,fragmentShader:D0}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let _=new Ot;_.setAttribute("position",new yt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new wt(_,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=or;let p=this.type;this.render=function(M,E,x){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||M.length===0)return;this.type===Eh&&(ye("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=or);let S=i.getRenderTarget(),P=i.getActiveCubeFace(),w=i.getActiveMipmapLevel(),U=i.state;U.setBlending(En),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let q=p!==this.type;q&&E.traverse(function(Z){Z.material&&(Array.isArray(Z.material)?Z.material.forEach(z=>z.needsUpdate=!0):Z.material.needsUpdate=!0)});for(let Z=0,z=M.length;Z<z;Z++){let X=M[Z],H=X.shadow;if(H===void 0){ye("WebGLShadowMap:",X,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);let J=H.getFrameExtents();s.multiply(J),r.copy(H.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/J.x),s.x=r.x*J.x,H.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/J.y),s.y=r.y*J.y,H.mapSize.y=r.y));let Q=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=Q,H.map===null||q===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===xs){if(X.isPointLight){ye("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new Jt(s.x,s.y,{format:fi,type:wn,minFilter:pt,magFilter:pt,generateMipmaps:!1}),H.map.texture.name=X.name+".shadowMap",H.map.depthTexture=new Hn(s.x,s.y,Qt),H.map.depthTexture.name=X.name+".shadowMapDepth",H.map.depthTexture.format=Sn,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=ft,H.map.depthTexture.magFilter=ft}else X.isPointLight?(H.map=new go(s.x),H.map.depthTexture=new ha(s.x,_n)):(H.map=new Jt(s.x,s.y),H.map.depthTexture=new Hn(s.x,s.y,_n)),H.map.depthTexture.name=X.name+".shadowMap",H.map.depthTexture.format=Sn,this.type===or?(H.map.depthTexture.compareFunction=Q?uo:ho,H.map.depthTexture.minFilter=pt,H.map.depthTexture.magFilter=pt):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=ft,H.map.depthTexture.magFilter=ft);H.camera.updateProjectionMatrix()}let he=H.map.isWebGLCubeRenderTarget?6:1;for(let pe=0;pe<he;pe++){if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,pe),i.clear();else{pe===0&&(i.setRenderTarget(H.map),i.clear());let _e=H.getViewport(pe);a.set(r.x*_e.x,r.y*_e.y,r.x*_e.z,r.y*_e.w),U.viewport(a)}if(X.isPointLight){let _e=H.camera,Xe=H.matrix,at=X.distance||_e.far;at!==_e.far&&(_e.far=at,_e.updateProjectionMatrix()),_r.setFromMatrixPosition(X.matrixWorld),_e.position.copy(_r),Xc.copy(_e.position),Xc.add(U0[pe]),_e.up.copy(F0[pe]),_e.lookAt(Xc),_e.updateMatrixWorld(),Xe.makeTranslation(-_r.x,-_r.y,-_r.z),Lu.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),H._frustum.setFromProjectionMatrix(Lu,_e.coordinateSystem,_e.reversedDepth)}else H.updateMatrices(X);n=H.getFrustum(),A(E,x,H.camera,X,this.type)}H.isPointLightShadow!==!0&&this.type===xs&&T(H,x),H.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(S,P,w)};function T(M,E){let x=e.update(y);u.defines.VSM_SAMPLES!==M.blurSamples&&(u.defines.VSM_SAMPLES=M.blurSamples,f.defines.VSM_SAMPLES=M.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new Jt(s.x,s.y,{format:fi,type:wn})),u.uniforms.shadow_pass.value=M.map.depthTexture,u.uniforms.resolution.value=M.mapSize,u.uniforms.radius.value=M.radius,i.setRenderTarget(M.mapPass),i.clear(),i.renderBufferDirect(E,null,x,u,y,null),f.uniforms.shadow_pass.value=M.mapPass.texture,f.uniforms.resolution.value=M.mapSize,f.uniforms.radius.value=M.radius,i.setRenderTarget(M.map),i.clear(),i.renderBufferDirect(E,null,x,f,y,null)}function C(M,E,x,S){let P=null,w=x.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(w!==void 0)P=w;else if(P=x.isPointLight===!0?c:o,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){let U=P.uuid,q=E.uuid,Z=l[U];Z===void 0&&(Z={},l[U]=Z);let z=Z[q];z===void 0&&(z=P.clone(),Z[q]=z,E.addEventListener("dispose",b)),P=z}if(P.visible=E.visible,P.wireframe=E.wireframe,S===xs?P.side=E.shadowSide!==null?E.shadowSide:E.side:P.side=E.shadowSide!==null?E.shadowSide:d[E.side],P.alphaMap=E.alphaMap,P.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,P.map=E.map,P.clipShadows=E.clipShadows,P.clippingPlanes=E.clippingPlanes,P.clipIntersection=E.clipIntersection,P.displacementMap=E.displacementMap,P.displacementScale=E.displacementScale,P.displacementBias=E.displacementBias,P.wireframeLinewidth=E.wireframeLinewidth,P.linewidth=E.linewidth,x.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let U=i.properties.get(P);U.light=x}return P}function A(M,E,x,S,P){if(M.visible===!1)return;if(M.layers.test(E.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&P===xs)&&(!M.frustumCulled||n.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,M.matrixWorld);let q=e.update(M),Z=M.material;if(Array.isArray(Z)){let z=q.groups;for(let X=0,H=z.length;X<H;X++){let J=z[X],Q=Z[J.materialIndex];if(Q&&Q.visible){let he=C(M,Q,S,P);M.onBeforeShadow(i,M,E,x,q,he,J),i.renderBufferDirect(x,null,q,he,M,J),M.onAfterShadow(i,M,E,x,q,he,J)}}}else if(Z.visible){let z=C(M,Z,S,P);M.onBeforeShadow(i,M,E,x,q,z,null),i.renderBufferDirect(x,null,q,z,M,null),M.onAfterShadow(i,M,E,x,q,z,null)}}let U=M.children;for(let q=0,Z=U.length;q<Z;q++)A(U[q],E,x,S,P)}function b(M){M.target.removeEventListener("dispose",b);for(let x in l){let S=l[x],P=M.target.uuid;P in S&&(S[P].dispose(),delete S[P])}}}function z0(i,e){function t(){let R=!1,ne=new Je,Y=null,oe=new Je(0,0,0,0);return{setMask:function(fe){Y!==fe&&!R&&(i.colorMask(fe,fe,fe,fe),Y=fe)},setLocked:function(fe){R=fe},setClear:function(fe,j,Ae,xe,ct){ct===!0&&(fe*=xe,j*=xe,Ae*=xe),ne.set(fe,j,Ae,xe),oe.equals(ne)===!1&&(i.clearColor(fe,j,Ae,xe),oe.copy(ne))},reset:function(){R=!1,Y=null,oe.set(-1,0,0,0)}}}function n(){let R=!1,ne=!1,Y=null,oe=null,fe=null;return{setReversed:function(j){if(ne!==j){let Ae=e.get("EXT_clip_control");j?Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.ZERO_TO_ONE_EXT):Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.NEGATIVE_ONE_TO_ONE_EXT),ne=j;let xe=fe;fe=null,this.setClear(xe)}},getReversed:function(){return ne},setTest:function(j){j?ee(i.DEPTH_TEST):Re(i.DEPTH_TEST)},setMask:function(j){Y!==j&&!R&&(i.depthMask(j),Y=j)},setFunc:function(j){if(ne&&(j=cu[j]),oe!==j){switch(j){case Jr:i.depthFunc(i.NEVER);break;case jr:i.depthFunc(i.ALWAYS);break;case Qr:i.depthFunc(i.LESS);break;case bi:i.depthFunc(i.LEQUAL);break;case ea:i.depthFunc(i.EQUAL);break;case ta:i.depthFunc(i.GEQUAL);break;case na:i.depthFunc(i.GREATER);break;case ia:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}oe=j}},setLocked:function(j){R=j},setClear:function(j){fe!==j&&(fe=j,ne&&(j=1-j),i.clearDepth(j))},reset:function(){R=!1,Y=null,oe=null,fe=null,ne=!1}}}function s(){let R=!1,ne=null,Y=null,oe=null,fe=null,j=null,Ae=null,xe=null,ct=null;return{setTest:function(it){R||(it?ee(i.STENCIL_TEST):Re(i.STENCIL_TEST))},setMask:function(it){ne!==it&&!R&&(i.stencilMask(it),ne=it)},setFunc:function(it,xn,vn){(Y!==it||oe!==xn||fe!==vn)&&(i.stencilFunc(it,xn,vn),Y=it,oe=xn,fe=vn)},setOp:function(it,xn,vn){(j!==it||Ae!==xn||xe!==vn)&&(i.stencilOp(it,xn,vn),j=it,Ae=xn,xe=vn)},setLocked:function(it){R=it},setClear:function(it){ct!==it&&(i.clearStencil(it),ct=it)},reset:function(){R=!1,ne=null,Y=null,oe=null,fe=null,j=null,Ae=null,xe=null,ct=null}}}let r=new t,a=new n,o=new s,c=new WeakMap,l=new WeakMap,h={},d={},u={},f=new WeakMap,_=[],y=null,m=!1,p=null,T=null,C=null,A=null,b=null,M=null,E=null,x=new we(0,0,0),S=0,P=!1,w=null,U=null,q=null,Z=null,z=null,X=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,J=0,Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(Q)[1]),H=J>=1):Q.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),H=J>=2);let he=null,pe={},_e=i.getParameter(i.SCISSOR_BOX),Xe=i.getParameter(i.VIEWPORT),at=new Je().fromArray(_e),qe=new Je().fromArray(Xe);function $(R,ne,Y,oe){let fe=new Uint8Array(4),j=i.createTexture();i.bindTexture(R,j),i.texParameteri(R,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(R,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ae=0;Ae<Y;Ae++)R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY?i.texImage3D(ne,0,i.RGBA,1,1,oe,0,i.RGBA,i.UNSIGNED_BYTE,fe):i.texImage2D(ne+Ae,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,fe);return j}let ie={};ie[i.TEXTURE_2D]=$(i.TEXTURE_2D,i.TEXTURE_2D,1),ie[i.TEXTURE_CUBE_MAP]=$(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),ie[i.TEXTURE_2D_ARRAY]=$(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),ie[i.TEXTURE_3D]=$(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ee(i.DEPTH_TEST),a.setFunc(bi),gt(!1),At(fc),ee(i.CULL_FACE),Ye(En);function ee(R){h[R]!==!0&&(i.enable(R),h[R]=!0)}function Re(R){h[R]!==!1&&(i.disable(R),h[R]=!1)}function Pe(R,ne){return u[R]!==ne?(i.bindFramebuffer(R,ne),u[R]=ne,R===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ne),R===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ne),!0):!1}function Te(R,ne){let Y=_,oe=!1;if(R){Y=f.get(ne),Y===void 0&&(Y=[],f.set(ne,Y));let fe=R.textures;if(Y.length!==fe.length||Y[0]!==i.COLOR_ATTACHMENT0){for(let j=0,Ae=fe.length;j<Ae;j++)Y[j]=i.COLOR_ATTACHMENT0+j;Y.length=fe.length,oe=!0}}else Y[0]!==i.BACK&&(Y[0]=i.BACK,oe=!0);oe&&i.drawBuffers(Y)}function ht(R){return y!==R?(i.useProgram(R),y=R,!0):!1}let He={[ri]:i.FUNC_ADD,[Rh]:i.FUNC_SUBTRACT,[Ih]:i.FUNC_REVERSE_SUBTRACT};He[Ph]=i.MIN,He[Lh]=i.MAX;let Qe={[Nh]:i.ZERO,[Dh]:i.ONE,[Uh]:i.SRC_COLOR,[Zr]:i.SRC_ALPHA,[Hh]:i.SRC_ALPHA_SATURATE,[kh]:i.DST_COLOR,[Oh]:i.DST_ALPHA,[Fh]:i.ONE_MINUS_SRC_COLOR,[$r]:i.ONE_MINUS_SRC_ALPHA,[Vh]:i.ONE_MINUS_DST_COLOR,[zh]:i.ONE_MINUS_DST_ALPHA,[Gh]:i.CONSTANT_COLOR,[Wh]:i.ONE_MINUS_CONSTANT_COLOR,[Xh]:i.CONSTANT_ALPHA,[qh]:i.ONE_MINUS_CONSTANT_ALPHA};function Ye(R,ne,Y,oe,fe,j,Ae,xe,ct,it){if(R===En){m===!0&&(Re(i.BLEND),m=!1);return}if(m===!1&&(ee(i.BLEND),m=!0),R!==wh){if(R!==p||it!==P){if((T!==ri||b!==ri)&&(i.blendEquation(i.FUNC_ADD),T=ri,b=ri),it)switch(R){case Si:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case pc:i.blendFunc(i.ONE,i.ONE);break;case mc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case gc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Ee("WebGLState: Invalid blending: ",R);break}else switch(R){case Si:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case pc:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case mc:Ee("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case gc:Ee("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ee("WebGLState: Invalid blending: ",R);break}C=null,A=null,M=null,E=null,x.set(0,0,0),S=0,p=R,P=it}return}fe=fe||ne,j=j||Y,Ae=Ae||oe,(ne!==T||fe!==b)&&(i.blendEquationSeparate(He[ne],He[fe]),T=ne,b=fe),(Y!==C||oe!==A||j!==M||Ae!==E)&&(i.blendFuncSeparate(Qe[Y],Qe[oe],Qe[j],Qe[Ae]),C=Y,A=oe,M=j,E=Ae),(xe.equals(x)===!1||ct!==S)&&(i.blendColor(xe.r,xe.g,xe.b,ct),x.copy(xe),S=ct),p=R,P=!1}function Ge(R,ne){R.side===rn?Re(i.CULL_FACE):ee(i.CULL_FACE);let Y=R.side===zt;ne&&(Y=!Y),gt(Y),R.blending===Si&&R.transparent===!1?Ye(En):Ye(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),a.setFunc(R.depthFunc),a.setTest(R.depthTest),a.setMask(R.depthWrite),r.setMask(R.colorWrite);let oe=R.stencilWrite;o.setTest(oe),oe&&(o.setMask(R.stencilWriteMask),o.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),o.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),Et(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):Re(i.SAMPLE_ALPHA_TO_COVERAGE)}function gt(R){w!==R&&(R?i.frontFace(i.CW):i.frontFace(i.CCW),w=R)}function At(R){R!==Th?(ee(i.CULL_FACE),R!==U&&(R===fc?i.cullFace(i.BACK):R===Ch?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Re(i.CULL_FACE),U=R}function bt(R){R!==q&&(H&&i.lineWidth(R),q=R)}function Et(R,ne,Y){R?(ee(i.POLYGON_OFFSET_FILL),(Z!==ne||z!==Y)&&(Z=ne,z=Y,a.getReversed()&&(ne=-ne),i.polygonOffset(ne,Y))):Re(i.POLYGON_OFFSET_FILL)}function ot(R){R?ee(i.SCISSOR_TEST):Re(i.SCISSOR_TEST)}function _t(R){R===void 0&&(R=i.TEXTURE0+X-1),he!==R&&(i.activeTexture(R),he=R)}function I(R,ne,Y){Y===void 0&&(he===null?Y=i.TEXTURE0+X-1:Y=he);let oe=pe[Y];oe===void 0&&(oe={type:void 0,texture:void 0},pe[Y]=oe),(oe.type!==R||oe.texture!==ne)&&(he!==Y&&(i.activeTexture(Y),he=Y),i.bindTexture(R,ne||ie[R]),oe.type=R,oe.texture=ne)}function kt(){let R=pe[he];R!==void 0&&R.type!==void 0&&(i.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function Ze(){try{i.compressedTexImage2D(...arguments)}catch(R){Ee("WebGLState:",R)}}function B(){try{i.compressedTexImage3D(...arguments)}catch(R){Ee("WebGLState:",R)}}function g(){try{i.texSubImage2D(...arguments)}catch(R){Ee("WebGLState:",R)}}function D(){try{i.texSubImage3D(...arguments)}catch(R){Ee("WebGLState:",R)}}function k(){try{i.compressedTexSubImage2D(...arguments)}catch(R){Ee("WebGLState:",R)}}function G(){try{i.compressedTexSubImage3D(...arguments)}catch(R){Ee("WebGLState:",R)}}function te(){try{i.texStorage2D(...arguments)}catch(R){Ee("WebGLState:",R)}}function se(){try{i.texStorage3D(...arguments)}catch(R){Ee("WebGLState:",R)}}function W(){try{i.texImage2D(...arguments)}catch(R){Ee("WebGLState:",R)}}function K(){try{i.texImage3D(...arguments)}catch(R){Ee("WebGLState:",R)}}function re(R){return d[R]!==void 0?d[R]:i.getParameter(R)}function Be(R,ne){d[R]!==ne&&(i.pixelStorei(R,ne),d[R]=ne)}function ce(R){at.equals(R)===!1&&(i.scissor(R.x,R.y,R.z,R.w),at.copy(R))}function ae(R){qe.equals(R)===!1&&(i.viewport(R.x,R.y,R.z,R.w),qe.copy(R))}function be(R,ne){let Y=l.get(ne);Y===void 0&&(Y=new WeakMap,l.set(ne,Y));let oe=Y.get(R);oe===void 0&&(oe=i.getUniformBlockIndex(ne,R.name),Y.set(R,oe))}function Ce(R,ne){let oe=l.get(ne).get(R);c.get(ne)!==oe&&(i.uniformBlockBinding(ne,oe,R.__bindingPointIndex),c.set(ne,oe))}function Le(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},he=null,pe={},u={},f=new WeakMap,_=[],y=null,m=!1,p=null,T=null,C=null,A=null,b=null,M=null,E=null,x=new we(0,0,0),S=0,P=!1,w=null,U=null,q=null,Z=null,z=null,at.set(0,0,i.canvas.width,i.canvas.height),qe.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ee,disable:Re,bindFramebuffer:Pe,drawBuffers:Te,useProgram:ht,setBlending:Ye,setMaterial:Ge,setFlipSided:gt,setCullFace:At,setLineWidth:bt,setPolygonOffset:Et,setScissorTest:ot,activeTexture:_t,bindTexture:I,unbindTexture:kt,compressedTexImage2D:Ze,compressedTexImage3D:B,texImage2D:W,texImage3D:K,pixelStorei:Be,getParameter:re,updateUBOMapping:be,uniformBlockBinding:Ce,texStorage2D:te,texStorage3D:se,texSubImage2D:g,texSubImage3D:D,compressedTexSubImage2D:k,compressedTexSubImage3D:G,scissor:ce,viewport:ae,reset:Le}}function k0(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ze,h=new WeakMap,d=new Set,u,f=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(B,g){return _?new OffscreenCanvas(B,g):rs("canvas")}function m(B,g,D){let k=1,G=Ze(B);if((G.width>D||G.height>D)&&(k=D/Math.max(G.width,G.height)),k<1)if(typeof HTMLImageElement<"u"&&B instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&B instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&B instanceof ImageBitmap||typeof VideoFrame<"u"&&B instanceof VideoFrame){let te=Math.floor(k*G.width),se=Math.floor(k*G.height);u===void 0&&(u=y(te,se));let W=g?y(te,se):u;return W.width=te,W.height=se,W.getContext("2d").drawImage(B,0,0,te,se),ye("WebGLRenderer: Texture has been resized from ("+G.width+"x"+G.height+") to ("+te+"x"+se+")."),W}else return"data"in B&&ye("WebGLRenderer: Image in DataTexture is too big ("+G.width+"x"+G.height+")."),B;return B}function p(B){return B.generateMipmaps}function T(B){i.generateMipmap(B)}function C(B){return B.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:B.isWebGL3DRenderTarget?i.TEXTURE_3D:B.isWebGLArrayRenderTarget||B.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(B,g,D,k,G,te=!1){if(B!==null){if(i[B]!==void 0)return i[B];ye("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+B+"'")}let se;k&&(se=e.get("EXT_texture_norm16"),se||ye("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let W=g;if(g===i.RED&&(D===i.FLOAT&&(W=i.R32F),D===i.HALF_FLOAT&&(W=i.R16F),D===i.UNSIGNED_BYTE&&(W=i.R8),D===i.UNSIGNED_SHORT&&se&&(W=se.R16_EXT),D===i.SHORT&&se&&(W=se.R16_SNORM_EXT)),g===i.RED_INTEGER&&(D===i.UNSIGNED_BYTE&&(W=i.R8UI),D===i.UNSIGNED_SHORT&&(W=i.R16UI),D===i.UNSIGNED_INT&&(W=i.R32UI),D===i.BYTE&&(W=i.R8I),D===i.SHORT&&(W=i.R16I),D===i.INT&&(W=i.R32I)),g===i.RG&&(D===i.FLOAT&&(W=i.RG32F),D===i.HALF_FLOAT&&(W=i.RG16F),D===i.UNSIGNED_BYTE&&(W=i.RG8),D===i.UNSIGNED_SHORT&&se&&(W=se.RG16_EXT),D===i.SHORT&&se&&(W=se.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(D===i.UNSIGNED_BYTE&&(W=i.RG8UI),D===i.UNSIGNED_SHORT&&(W=i.RG16UI),D===i.UNSIGNED_INT&&(W=i.RG32UI),D===i.BYTE&&(W=i.RG8I),D===i.SHORT&&(W=i.RG16I),D===i.INT&&(W=i.RG32I)),g===i.RGB_INTEGER&&(D===i.UNSIGNED_BYTE&&(W=i.RGB8UI),D===i.UNSIGNED_SHORT&&(W=i.RGB16UI),D===i.UNSIGNED_INT&&(W=i.RGB32UI),D===i.BYTE&&(W=i.RGB8I),D===i.SHORT&&(W=i.RGB16I),D===i.INT&&(W=i.RGB32I)),g===i.RGBA_INTEGER&&(D===i.UNSIGNED_BYTE&&(W=i.RGBA8UI),D===i.UNSIGNED_SHORT&&(W=i.RGBA16UI),D===i.UNSIGNED_INT&&(W=i.RGBA32UI),D===i.BYTE&&(W=i.RGBA8I),D===i.SHORT&&(W=i.RGBA16I),D===i.INT&&(W=i.RGBA32I)),g===i.RGB&&(D===i.UNSIGNED_SHORT&&se&&(W=se.RGB16_EXT),D===i.SHORT&&se&&(W=se.RGB16_SNORM_EXT),D===i.UNSIGNED_INT_5_9_9_9_REV&&(W=i.RGB9_E5),D===i.UNSIGNED_INT_10F_11F_11F_REV&&(W=i.R11F_G11F_B10F)),g===i.RGBA){let K=te?Fs:Oe.getTransfer(G);D===i.FLOAT&&(W=i.RGBA32F),D===i.HALF_FLOAT&&(W=i.RGBA16F),D===i.UNSIGNED_BYTE&&(W=K===Ke?i.SRGB8_ALPHA8:i.RGBA8),D===i.UNSIGNED_SHORT&&se&&(W=se.RGBA16_EXT),D===i.SHORT&&se&&(W=se.RGBA16_SNORM_EXT),D===i.UNSIGNED_SHORT_4_4_4_4&&(W=i.RGBA4),D===i.UNSIGNED_SHORT_5_5_5_1&&(W=i.RGB5_A1)}return(W===i.R16F||W===i.R32F||W===i.RG16F||W===i.RG32F||W===i.RGBA16F||W===i.RGBA32F)&&e.get("EXT_color_buffer_float"),W}function b(B,g){let D;return B?g===null||g===_n||g===As?D=i.DEPTH24_STENCIL8:g===Qt?D=i.DEPTH32F_STENCIL8:g===ys&&(D=i.DEPTH24_STENCIL8,ye("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===_n||g===As?D=i.DEPTH_COMPONENT24:g===Qt?D=i.DEPTH_COMPONENT32F:g===ys&&(D=i.DEPTH_COMPONENT16),D}function M(B,g){return p(B)===!0||B.isFramebufferTexture&&B.minFilter!==ft&&B.minFilter!==pt?Math.log2(Math.max(g.width,g.height))+1:B.mipmaps!==void 0&&B.mipmaps.length>0?B.mipmaps.length:B.isCompressedTexture&&Array.isArray(B.image)?g.mipmaps.length:1}function E(B){let g=B.target;g.removeEventListener("dispose",E),S(g),g.isVideoTexture&&h.delete(g),g.isHTMLTexture&&d.delete(g)}function x(B){let g=B.target;g.removeEventListener("dispose",x),w(g)}function S(B){let g=n.get(B);if(g.__webglInit===void 0)return;let D=B.source,k=f.get(D);if(k){let G=k[g.__cacheKey];G.usedTimes--,G.usedTimes===0&&P(B),Object.keys(k).length===0&&f.delete(D)}n.remove(B)}function P(B){let g=n.get(B);i.deleteTexture(g.__webglTexture);let D=B.source,k=f.get(D);delete k[g.__cacheKey],a.memory.textures--}function w(B){let g=n.get(B);if(B.depthTexture&&(B.depthTexture.dispose(),n.remove(B.depthTexture)),B.isWebGLCubeRenderTarget)for(let k=0;k<6;k++){if(Array.isArray(g.__webglFramebuffer[k]))for(let G=0;G<g.__webglFramebuffer[k].length;G++)i.deleteFramebuffer(g.__webglFramebuffer[k][G]);else i.deleteFramebuffer(g.__webglFramebuffer[k]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[k])}else{if(Array.isArray(g.__webglFramebuffer))for(let k=0;k<g.__webglFramebuffer.length;k++)i.deleteFramebuffer(g.__webglFramebuffer[k]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let k=0;k<g.__webglColorRenderbuffer.length;k++)g.__webglColorRenderbuffer[k]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[k]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let D=B.textures;for(let k=0,G=D.length;k<G;k++){let te=n.get(D[k]);te.__webglTexture&&(i.deleteTexture(te.__webglTexture),a.memory.textures--),n.remove(D[k])}n.remove(B)}let U=0;function q(){U=0}function Z(){return U}function z(B){U=B}function X(){let B=U;return B>=s.maxTextures&&ye("WebGLTextures: Trying to use "+B+" texture units while this GPU supports only "+s.maxTextures),U+=1,B}function H(B){let g=[];return g.push(B.wrapS),g.push(B.wrapT),g.push(B.wrapR||0),g.push(B.magFilter),g.push(B.minFilter),g.push(B.anisotropy),g.push(B.internalFormat),g.push(B.format),g.push(B.type),g.push(B.generateMipmaps),g.push(B.premultiplyAlpha),g.push(B.flipY),g.push(B.unpackAlignment),g.push(B.colorSpace),g.join()}function J(B,g){let D=n.get(B);if(B.isVideoTexture&&I(B),B.isRenderTargetTexture===!1&&B.isExternalTexture!==!0&&B.version>0&&D.__version!==B.version){let k=B.image;if(k===null)ye("WebGLRenderer: Texture marked for update but no image data found.");else if(k.complete===!1)ye("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(D,B,g);return}}else B.isExternalTexture&&(D.__webglTexture=B.sourceTexture?B.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,D.__webglTexture,i.TEXTURE0+g)}function Q(B,g){let D=n.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&D.__version!==B.version){Re(D,B,g);return}else B.isExternalTexture&&(D.__webglTexture=B.sourceTexture?B.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,D.__webglTexture,i.TEXTURE0+g)}function he(B,g){let D=n.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&D.__version!==B.version){Re(D,B,g);return}t.bindTexture(i.TEXTURE_3D,D.__webglTexture,i.TEXTURE0+g)}function pe(B,g){let D=n.get(B);if(B.isCubeDepthTexture!==!0&&B.version>0&&D.__version!==B.version){Pe(D,B,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,D.__webglTexture,i.TEXTURE0+g)}let _e={[ai]:i.REPEAT,[sn]:i.CLAMP_TO_EDGE,[is]:i.MIRRORED_REPEAT},Xe={[ft]:i.NEAREST,[ba]:i.NEAREST_MIPMAP_NEAREST,[Di]:i.NEAREST_MIPMAP_LINEAR,[pt]:i.LINEAR,[vs]:i.LINEAR_MIPMAP_NEAREST,[gn]:i.LINEAR_MIPMAP_LINEAR},at={[Qh]:i.NEVER,[su]:i.ALWAYS,[eu]:i.LESS,[ho]:i.LEQUAL,[tu]:i.EQUAL,[uo]:i.GEQUAL,[nu]:i.GREATER,[iu]:i.NOTEQUAL};function qe(B,g){if(g.type===Qt&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===pt||g.magFilter===vs||g.magFilter===Di||g.magFilter===gn||g.minFilter===pt||g.minFilter===vs||g.minFilter===Di||g.minFilter===gn)&&ye("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(B,i.TEXTURE_WRAP_S,_e[g.wrapS]),i.texParameteri(B,i.TEXTURE_WRAP_T,_e[g.wrapT]),(B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY)&&i.texParameteri(B,i.TEXTURE_WRAP_R,_e[g.wrapR]),i.texParameteri(B,i.TEXTURE_MAG_FILTER,Xe[g.magFilter]),i.texParameteri(B,i.TEXTURE_MIN_FILTER,Xe[g.minFilter]),g.compareFunction&&(i.texParameteri(B,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(B,i.TEXTURE_COMPARE_FUNC,at[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===ft||g.minFilter!==Di&&g.minFilter!==gn||g.type===Qt&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){let D=e.get("EXT_texture_filter_anisotropic");i.texParameterf(B,D.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function $(B,g){let D=!1;B.__webglInit===void 0&&(B.__webglInit=!0,g.addEventListener("dispose",E));let k=g.source,G=f.get(k);G===void 0&&(G={},f.set(k,G));let te=H(g);if(te!==B.__cacheKey){G[te]===void 0&&(G[te]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,D=!0),G[te].usedTimes++;let se=G[B.__cacheKey];se!==void 0&&(G[B.__cacheKey].usedTimes--,se.usedTimes===0&&P(g)),B.__cacheKey=te,B.__webglTexture=G[te].texture}return D}function ie(B,g,D){return Math.floor(Math.floor(B/D)/g)}function ee(B,g,D,k){let te=B.updateRanges;if(te.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,D,k,g.data);else{te.sort((Be,ce)=>Be.start-ce.start);let se=0;for(let Be=1;Be<te.length;Be++){let ce=te[se],ae=te[Be],be=ce.start+ce.count,Ce=ie(ae.start,g.width,4),Le=ie(ce.start,g.width,4);ae.start<=be+1&&Ce===Le&&ie(ae.start+ae.count-1,g.width,4)===Ce?ce.count=Math.max(ce.count,ae.start+ae.count-ce.start):(++se,te[se]=ae)}te.length=se+1;let W=t.getParameter(i.UNPACK_ROW_LENGTH),K=t.getParameter(i.UNPACK_SKIP_PIXELS),re=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let Be=0,ce=te.length;Be<ce;Be++){let ae=te[Be],be=Math.floor(ae.start/4),Ce=Math.ceil(ae.count/4),Le=be%g.width,R=Math.floor(be/g.width),ne=Ce,Y=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Le),t.pixelStorei(i.UNPACK_SKIP_ROWS,R),t.texSubImage2D(i.TEXTURE_2D,0,Le,R,ne,Y,D,k,g.data)}B.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,W),t.pixelStorei(i.UNPACK_SKIP_PIXELS,K),t.pixelStorei(i.UNPACK_SKIP_ROWS,re)}}function Re(B,g,D){let k=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(k=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(k=i.TEXTURE_3D);let G=$(B,g),te=g.source;t.bindTexture(k,B.__webglTexture,i.TEXTURE0+D);let se=n.get(te);if(te.version!==se.__version||G===!0){if(t.activeTexture(i.TEXTURE0+D),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){let Y=Oe.getPrimaries(Oe.workingColorSpace),oe=g.colorSpace===Kn?null:Oe.getPrimaries(g.colorSpace),fe=g.colorSpace===Kn||Y===oe?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe)}t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let K=m(g.image,!1,s.maxTextureSize);K=kt(g,K);let re=r.convert(g.format,g.colorSpace),Be=r.convert(g.type),ce=A(g.internalFormat,re,Be,g.normalized,g.colorSpace,g.isVideoTexture);qe(k,g);let ae,be=g.mipmaps,Ce=g.isVideoTexture!==!0,Le=se.__version===void 0||G===!0,R=te.dataReady,ne=M(g,K);if(g.isDepthTexture)ce=b(g.format===di,g.type),Le&&(Ce?t.texStorage2D(i.TEXTURE_2D,1,ce,K.width,K.height):t.texImage2D(i.TEXTURE_2D,0,ce,K.width,K.height,0,re,Be,null));else if(g.isDataTexture)if(be.length>0){Ce&&Le&&t.texStorage2D(i.TEXTURE_2D,ne,ce,be[0].width,be[0].height);for(let Y=0,oe=be.length;Y<oe;Y++)ae=be[Y],Ce?R&&t.texSubImage2D(i.TEXTURE_2D,Y,0,0,ae.width,ae.height,re,Be,ae.data):t.texImage2D(i.TEXTURE_2D,Y,ce,ae.width,ae.height,0,re,Be,ae.data);g.generateMipmaps=!1}else Ce?(Le&&t.texStorage2D(i.TEXTURE_2D,ne,ce,K.width,K.height),R&&ee(g,K,re,Be)):t.texImage2D(i.TEXTURE_2D,0,ce,K.width,K.height,0,re,Be,K.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Ce&&Le&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ne,ce,be[0].width,be[0].height,K.depth);for(let Y=0,oe=be.length;Y<oe;Y++)if(ae=be[Y],g.format!==en)if(re!==null)if(Ce){if(R)if(g.layerUpdates.size>0){let fe=zc(ae.width,ae.height,g.format,g.type);for(let j of g.layerUpdates){let Ae=ae.data.subarray(j*fe/ae.data.BYTES_PER_ELEMENT,(j+1)*fe/ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,j,ae.width,ae.height,1,re,Ae)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,ae.width,ae.height,K.depth,re,ae.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Y,ce,ae.width,ae.height,K.depth,0,ae.data,0,0);else ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ce?R&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,ae.width,ae.height,K.depth,re,Be,ae.data):t.texImage3D(i.TEXTURE_2D_ARRAY,Y,ce,ae.width,ae.height,K.depth,0,re,Be,ae.data)}else{Ce&&Le&&t.texStorage2D(i.TEXTURE_2D,ne,ce,be[0].width,be[0].height);for(let Y=0,oe=be.length;Y<oe;Y++)ae=be[Y],g.format!==en?re!==null?Ce?R&&t.compressedTexSubImage2D(i.TEXTURE_2D,Y,0,0,ae.width,ae.height,re,ae.data):t.compressedTexImage2D(i.TEXTURE_2D,Y,ce,ae.width,ae.height,0,ae.data):ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ce?R&&t.texSubImage2D(i.TEXTURE_2D,Y,0,0,ae.width,ae.height,re,Be,ae.data):t.texImage2D(i.TEXTURE_2D,Y,ce,ae.width,ae.height,0,re,Be,ae.data)}else if(g.isDataArrayTexture)if(Ce){if(Le&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ne,ce,K.width,K.height,K.depth),R)if(g.layerUpdates.size>0){let Y=zc(K.width,K.height,g.format,g.type);for(let oe of g.layerUpdates){let fe=K.data.subarray(oe*Y/K.data.BYTES_PER_ELEMENT,(oe+1)*Y/K.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,oe,K.width,K.height,1,re,Be,fe)}g.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,re,Be,K.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ce,K.width,K.height,K.depth,0,re,Be,K.data);else if(g.isData3DTexture)Ce?(Le&&t.texStorage3D(i.TEXTURE_3D,ne,ce,K.width,K.height,K.depth),R&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,re,Be,K.data)):t.texImage3D(i.TEXTURE_3D,0,ce,K.width,K.height,K.depth,0,re,Be,K.data);else if(g.isFramebufferTexture){if(Le)if(Ce)t.texStorage2D(i.TEXTURE_2D,ne,ce,K.width,K.height);else{let Y=K.width,oe=K.height;for(let fe=0;fe<ne;fe++)t.texImage2D(i.TEXTURE_2D,fe,ce,Y,oe,0,re,Be,null),Y>>=1,oe>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){let Y=i.canvas;if(Y.hasAttribute("layoutsubtree")||Y.setAttribute("layoutsubtree","true"),K.parentNode!==Y){Y.appendChild(K),d.add(g),Y.onpaint=oe=>{let fe=oe.changedElements;for(let j of d)fe.includes(j.image)&&(j.needsUpdate=!0)},Y.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,K);else{let fe=i.RGBA,j=i.RGBA,Ae=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,fe,j,Ae,K)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(be.length>0){if(Ce&&Le){let Y=Ze(be[0]);t.texStorage2D(i.TEXTURE_2D,ne,ce,Y.width,Y.height)}for(let Y=0,oe=be.length;Y<oe;Y++)ae=be[Y],Ce?R&&t.texSubImage2D(i.TEXTURE_2D,Y,0,0,re,Be,ae):t.texImage2D(i.TEXTURE_2D,Y,ce,re,Be,ae);g.generateMipmaps=!1}else if(Ce){if(Le){let Y=Ze(K);t.texStorage2D(i.TEXTURE_2D,ne,ce,Y.width,Y.height)}R&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,re,Be,K)}else t.texImage2D(i.TEXTURE_2D,0,ce,re,Be,K);p(g)&&T(k),se.__version=te.version,g.onUpdate&&g.onUpdate(g)}B.__version=g.version}function Pe(B,g,D){if(g.image.length!==6)return;let k=$(B,g),G=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+D);let te=n.get(G);if(G.version!==te.__version||k===!0){t.activeTexture(i.TEXTURE0+D);let se=Oe.getPrimaries(Oe.workingColorSpace),W=g.colorSpace===Kn?null:Oe.getPrimaries(g.colorSpace),K=g.colorSpace===Kn||se===W?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,K);let re=g.isCompressedTexture||g.image[0].isCompressedTexture,Be=g.image[0]&&g.image[0].isDataTexture,ce=[];for(let j=0;j<6;j++)!re&&!Be?ce[j]=m(g.image[j],!0,s.maxCubemapSize):ce[j]=Be?g.image[j].image:g.image[j],ce[j]=kt(g,ce[j]);let ae=ce[0],be=r.convert(g.format,g.colorSpace),Ce=r.convert(g.type),Le=A(g.internalFormat,be,Ce,g.normalized,g.colorSpace),R=g.isVideoTexture!==!0,ne=te.__version===void 0||k===!0,Y=G.dataReady,oe=M(g,ae);qe(i.TEXTURE_CUBE_MAP,g);let fe;if(re){R&&ne&&t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Le,ae.width,ae.height);for(let j=0;j<6;j++){fe=ce[j].mipmaps;for(let Ae=0;Ae<fe.length;Ae++){let xe=fe[Ae];g.format!==en?be!==null?R?Y&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae,0,0,xe.width,xe.height,be,xe.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae,Le,xe.width,xe.height,0,xe.data):ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):R?Y&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae,0,0,xe.width,xe.height,be,Ce,xe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae,Le,xe.width,xe.height,0,be,Ce,xe.data)}}}else{if(fe=g.mipmaps,R&&ne){fe.length>0&&oe++;let j=Ze(ce[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Le,j.width,j.height)}for(let j=0;j<6;j++)if(Be){R?Y&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ce[j].width,ce[j].height,be,Ce,ce[j].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Le,ce[j].width,ce[j].height,0,be,Ce,ce[j].data);for(let Ae=0;Ae<fe.length;Ae++){let ct=fe[Ae].image[j].image;R?Y&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae+1,0,0,ct.width,ct.height,be,Ce,ct.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae+1,Le,ct.width,ct.height,0,be,Ce,ct.data)}}else{R?Y&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,be,Ce,ce[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Le,be,Ce,ce[j]);for(let Ae=0;Ae<fe.length;Ae++){let xe=fe[Ae];R?Y&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae+1,0,0,be,Ce,xe.image[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,Ae+1,Le,be,Ce,xe.image[j])}}}p(g)&&T(i.TEXTURE_CUBE_MAP),te.__version=G.version,g.onUpdate&&g.onUpdate(g)}B.__version=g.version}function Te(B,g,D,k,G,te){let se=r.convert(D.format,D.colorSpace),W=r.convert(D.type),K=A(D.internalFormat,se,W,D.normalized,D.colorSpace),re=n.get(g),Be=n.get(D);if(Be.__renderTarget=g,!re.__hasExternalTextures){let ce=Math.max(1,g.width>>te),ae=Math.max(1,g.height>>te);G===i.TEXTURE_3D||G===i.TEXTURE_2D_ARRAY?t.texImage3D(G,te,K,ce,ae,g.depth,0,se,W,null):t.texImage2D(G,te,K,ce,ae,0,se,W,null)}t.bindFramebuffer(i.FRAMEBUFFER,B),_t(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,k,G,Be.__webglTexture,0,ot(g)):(G===i.TEXTURE_2D||G>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&G<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,k,G,Be.__webglTexture,te),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ht(B,g,D){if(i.bindRenderbuffer(i.RENDERBUFFER,B),g.depthBuffer){let k=g.depthTexture,G=k&&k.isDepthTexture?k.type:null,te=b(g.stencilBuffer,G),se=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;_t(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot(g),te,g.width,g.height):D?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot(g),te,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,te,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,se,i.RENDERBUFFER,B)}else{let k=g.textures;for(let G=0;G<k.length;G++){let te=k[G],se=r.convert(te.format,te.colorSpace),W=r.convert(te.type),K=A(te.internalFormat,se,W,te.normalized,te.colorSpace);_t(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot(g),K,g.width,g.height):D?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot(g),K,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,K,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function He(B,g,D){let k=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,B),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let G=n.get(g.depthTexture);if(G.__renderTarget=g,(!G.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),k){if(G.__webglInit===void 0&&(G.__webglInit=!0,g.depthTexture.addEventListener("dispose",E)),G.__webglTexture===void 0){G.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,G.__webglTexture),qe(i.TEXTURE_CUBE_MAP,g.depthTexture);let re=r.convert(g.depthTexture.format),Be=r.convert(g.depthTexture.type),ce;g.depthTexture.format===Sn?ce=i.DEPTH_COMPONENT24:g.depthTexture.format===di&&(ce=i.DEPTH24_STENCIL8);for(let ae=0;ae<6;ae++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,ce,g.width,g.height,0,re,Be,null)}}else J(g.depthTexture,0);let te=G.__webglTexture,se=ot(g),W=k?i.TEXTURE_CUBE_MAP_POSITIVE_X+D:i.TEXTURE_2D,K=g.depthTexture.format===di?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===Sn)_t(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,W,te,0,se):i.framebufferTexture2D(i.FRAMEBUFFER,K,W,te,0);else if(g.depthTexture.format===di)_t(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,W,te,0,se):i.framebufferTexture2D(i.FRAMEBUFFER,K,W,te,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Qe(B){let g=n.get(B),D=B.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==B.depthTexture){let k=B.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),k){let G=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,k.removeEventListener("dispose",G)};k.addEventListener("dispose",G),g.__depthDisposeCallback=G}g.__boundDepthTexture=k}if(B.depthTexture&&!g.__autoAllocateDepthBuffer)if(D)for(let k=0;k<6;k++)He(g.__webglFramebuffer[k],B,k);else{let k=B.texture.mipmaps;k&&k.length>0?He(g.__webglFramebuffer[0],B,0):He(g.__webglFramebuffer,B,0)}else if(D){g.__webglDepthbuffer=[];for(let k=0;k<6;k++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[k]),g.__webglDepthbuffer[k]===void 0)g.__webglDepthbuffer[k]=i.createRenderbuffer(),ht(g.__webglDepthbuffer[k],B,!1);else{let G=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,te=g.__webglDepthbuffer[k];i.bindRenderbuffer(i.RENDERBUFFER,te),i.framebufferRenderbuffer(i.FRAMEBUFFER,G,i.RENDERBUFFER,te)}}else{let k=B.texture.mipmaps;if(k&&k.length>0?t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),ht(g.__webglDepthbuffer,B,!1);else{let G=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,te=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,te),i.framebufferRenderbuffer(i.FRAMEBUFFER,G,i.RENDERBUFFER,te)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ye(B,g,D){let k=n.get(B);g!==void 0&&Te(k.__webglFramebuffer,B,B.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),D!==void 0&&Qe(B)}function Ge(B){let g=B.texture,D=n.get(B),k=n.get(g);B.addEventListener("dispose",x);let G=B.textures,te=B.isWebGLCubeRenderTarget===!0,se=G.length>1;if(se||(k.__webglTexture===void 0&&(k.__webglTexture=i.createTexture()),k.__version=g.version,a.memory.textures++),te){D.__webglFramebuffer=[];for(let W=0;W<6;W++)if(g.mipmaps&&g.mipmaps.length>0){D.__webglFramebuffer[W]=[];for(let K=0;K<g.mipmaps.length;K++)D.__webglFramebuffer[W][K]=i.createFramebuffer()}else D.__webglFramebuffer[W]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){D.__webglFramebuffer=[];for(let W=0;W<g.mipmaps.length;W++)D.__webglFramebuffer[W]=i.createFramebuffer()}else D.__webglFramebuffer=i.createFramebuffer();if(se)for(let W=0,K=G.length;W<K;W++){let re=n.get(G[W]);re.__webglTexture===void 0&&(re.__webglTexture=i.createTexture(),a.memory.textures++)}if(B.samples>0&&_t(B)===!1){D.__webglMultisampledFramebuffer=i.createFramebuffer(),D.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,D.__webglMultisampledFramebuffer);for(let W=0;W<G.length;W++){let K=G[W];D.__webglColorRenderbuffer[W]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,D.__webglColorRenderbuffer[W]);let re=r.convert(K.format,K.colorSpace),Be=r.convert(K.type),ce=A(K.internalFormat,re,Be,K.normalized,K.colorSpace,B.isXRRenderTarget===!0),ae=ot(B);i.renderbufferStorageMultisample(i.RENDERBUFFER,ae,ce,B.width,B.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+W,i.RENDERBUFFER,D.__webglColorRenderbuffer[W])}i.bindRenderbuffer(i.RENDERBUFFER,null),B.depthBuffer&&(D.__webglDepthRenderbuffer=i.createRenderbuffer(),ht(D.__webglDepthRenderbuffer,B,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(te){t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture),qe(i.TEXTURE_CUBE_MAP,g);for(let W=0;W<6;W++)if(g.mipmaps&&g.mipmaps.length>0)for(let K=0;K<g.mipmaps.length;K++)Te(D.__webglFramebuffer[W][K],B,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+W,K);else Te(D.__webglFramebuffer[W],B,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+W,0);p(g)&&T(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(se){for(let W=0,K=G.length;W<K;W++){let re=G[W],Be=n.get(re),ce=i.TEXTURE_2D;(B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)&&(ce=B.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,Be.__webglTexture),qe(ce,re),Te(D.__webglFramebuffer,B,re,i.COLOR_ATTACHMENT0+W,ce,0),p(re)&&T(ce)}t.unbindTexture()}else{let W=i.TEXTURE_2D;if((B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)&&(W=B.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(W,k.__webglTexture),qe(W,g),g.mipmaps&&g.mipmaps.length>0)for(let K=0;K<g.mipmaps.length;K++)Te(D.__webglFramebuffer[K],B,g,i.COLOR_ATTACHMENT0,W,K);else Te(D.__webglFramebuffer,B,g,i.COLOR_ATTACHMENT0,W,0);p(g)&&T(W),t.unbindTexture()}B.depthBuffer&&Qe(B)}function gt(B){let g=B.textures;for(let D=0,k=g.length;D<k;D++){let G=g[D];if(p(G)){let te=C(B),se=n.get(G).__webglTexture;t.bindTexture(te,se),T(te),t.unbindTexture()}}}let At=[],bt=[];function Et(B){if(B.samples>0){if(_t(B)===!1){let g=B.textures,D=B.width,k=B.height,G=i.COLOR_BUFFER_BIT,te=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,se=n.get(B),W=g.length>1;if(W)for(let re=0;re<g.length;re++)t.bindFramebuffer(i.FRAMEBUFFER,se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,se.__webglMultisampledFramebuffer);let K=B.texture.mipmaps;K&&K.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglFramebuffer);for(let re=0;re<g.length;re++){if(B.resolveDepthBuffer&&(B.depthBuffer&&(G|=i.DEPTH_BUFFER_BIT),B.stencilBuffer&&B.resolveStencilBuffer&&(G|=i.STENCIL_BUFFER_BIT)),W){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,se.__webglColorRenderbuffer[re]);let Be=n.get(g[re]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Be,0)}i.blitFramebuffer(0,0,D,k,0,0,D,k,G,i.NEAREST),c===!0&&(At.length=0,bt.length=0,At.push(i.COLOR_ATTACHMENT0+re),B.depthBuffer&&B.resolveDepthBuffer===!1&&(At.push(te),bt.push(te),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,bt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,At))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),W)for(let re=0;re<g.length;re++){t.bindFramebuffer(i.FRAMEBUFFER,se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,se.__webglColorRenderbuffer[re]);let Be=n.get(g[re]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,Be,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglMultisampledFramebuffer)}else if(B.depthBuffer&&B.resolveDepthBuffer===!1&&c){let g=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function ot(B){return Math.min(s.maxSamples,B.samples)}function _t(B){let g=n.get(B);return B.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function I(B){let g=a.render.frame;h.get(B)!==g&&(h.set(B,g),B.update())}function kt(B,g){let D=B.colorSpace,k=B.format,G=B.type;return B.isCompressedTexture===!0||B.isVideoTexture===!0||D!==Ut&&D!==Kn&&(Oe.getTransfer(D)===Ke?(k!==en||G!==Xt)&&ye("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ee("WebGLTextures: Unsupported texture color space:",D)),g}function Ze(B){return typeof HTMLImageElement<"u"&&B instanceof HTMLImageElement?(l.width=B.naturalWidth||B.width,l.height=B.naturalHeight||B.height):typeof VideoFrame<"u"&&B instanceof VideoFrame?(l.width=B.displayWidth,l.height=B.displayHeight):(l.width=B.width,l.height=B.height),l}this.allocateTextureUnit=X,this.resetTextureUnits=q,this.getTextureUnits=Z,this.setTextureUnits=z,this.setTexture2D=J,this.setTexture2DArray=Q,this.setTexture3D=he,this.setTextureCube=pe,this.rebindTextures=Ye,this.setupRenderTarget=Ge,this.updateRenderTargetMipmap=gt,this.updateMultisampleRenderTarget=Et,this.setupDepthRenderbuffer=Qe,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=_t,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function V0(i,e){function t(n,s=Kn){let r,a=Oe.getTransfer(s);if(n===Xt)return i.UNSIGNED_BYTE;if(n===Ca)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ea)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ec)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===wc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Tc)return i.BYTE;if(n===Cc)return i.SHORT;if(n===ys)return i.UNSIGNED_SHORT;if(n===Ta)return i.INT;if(n===_n)return i.UNSIGNED_INT;if(n===Qt)return i.FLOAT;if(n===wn)return i.HALF_FLOAT;if(n===Rc)return i.ALPHA;if(n===Ic)return i.RGB;if(n===en)return i.RGBA;if(n===Sn)return i.DEPTH_COMPONENT;if(n===di)return i.DEPTH_STENCIL;if(n===wa)return i.RED;if(n===Ra)return i.RED_INTEGER;if(n===fi)return i.RG;if(n===Ia)return i.RG_INTEGER;if(n===Pa)return i.RGBA_INTEGER;if(n===lr||n===hr||n===ur||n===dr)if(a===Ke)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===lr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===lr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===La||n===Na||n===Da||n===Ua)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===La)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Na)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Da)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ua)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Fa||n===Oa||n===za||n===ka||n===Va||n===fr||n===Ha)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Fa||n===Oa)return a===Ke?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===za)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===ka)return r.COMPRESSED_R11_EAC;if(n===Va)return r.COMPRESSED_SIGNED_R11_EAC;if(n===fr)return r.COMPRESSED_RG11_EAC;if(n===Ha)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ga||n===Wa||n===Xa||n===qa||n===Ya||n===Ka||n===Za||n===$a||n===Ja||n===ja||n===Qa||n===eo||n===to||n===no)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ga)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Wa)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Xa)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===qa)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ya)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ka)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Za)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===$a)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ja)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ja)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Qa)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===eo)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===to)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===no)return a===Ke?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===io||n===so||n===ro)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===io)return a===Ke?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===so)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ro)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ao||n===oo||n===pr||n===co)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===ao)return r.COMPRESSED_RED_RGTC1_EXT;if(n===oo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===pr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===co)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===As?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var H0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,G0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Qc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Js(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new jt({vertexShader:H0,fragmentShader:G0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new wt(new js(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},el=class extends bn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,d=null,u=null,f=null,_=null,y=typeof XRWebGLBinding<"u",m=new Qc,p={},T=t.getContextAttributes(),C=null,A=null,b=[],M=[],E=new ze,x=null,S=new vt;S.viewport=new Je;let P=new vt;P.viewport=new Je;let w=[S,P],U=new Ba,q=null,Z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ie=b[$];return ie===void 0&&(ie=new cs,b[$]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function($){let ie=b[$];return ie===void 0&&(ie=new cs,b[$]=ie),ie.getGripSpace()},this.getHand=function($){let ie=b[$];return ie===void 0&&(ie=new cs,b[$]=ie),ie.getHandSpace()};function z($){let ie=M.indexOf($.inputSource);if(ie===-1)return;let ee=b[ie];ee!==void 0&&(ee.update($.inputSource,$.frame,l||a),ee.dispatchEvent({type:$.type,data:$.inputSource}))}function X(){s.removeEventListener("select",z),s.removeEventListener("selectstart",z),s.removeEventListener("selectend",z),s.removeEventListener("squeeze",z),s.removeEventListener("squeezestart",z),s.removeEventListener("squeezeend",z),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",H);for(let $=0;$<b.length;$++){let ie=M[$];ie!==null&&(M[$]=null,b[$].disconnect(ie))}q=null,Z=null,m.reset();for(let $ in p)delete p[$];e.setRenderTarget(C),f=null,u=null,d=null,s=null,A=null,qe.stop(),n.isPresenting=!1,e.setPixelRatio(x),e.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&ye("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&ye("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(C=e.getRenderTarget(),s.addEventListener("select",z),s.addEventListener("selectstart",z),s.addEventListener("selectend",z),s.addEventListener("squeeze",z),s.addEventListener("squeezestart",z),s.addEventListener("squeezeend",z),s.addEventListener("end",X),s.addEventListener("inputsourceschange",H),T.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(E),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let ee=null,Re=null,Pe=null;T.depth&&(Pe=T.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ee=T.stencil?di:Sn,Re=T.stencil?As:_n);let Te={colorFormat:t.RGBA8,depthFormat:Pe,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(Te),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),A=new Jt(u.textureWidth,u.textureHeight,{format:en,type:Xt,depthTexture:new Hn(u.textureWidth,u.textureHeight,Re,void 0,void 0,void 0,void 0,void 0,void 0,ee),stencilBuffer:T.stencil,colorSpace:e.outputColorSpace,samples:T.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let ee={antialias:T.antialias,alpha:!0,depth:T.depth,stencil:T.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,ee),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),A=new Jt(f.framebufferWidth,f.framebufferHeight,{format:en,type:Xt,colorSpace:e.outputColorSpace,stencilBuffer:T.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),qe.setContext(s),qe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function H($){for(let ie=0;ie<$.removed.length;ie++){let ee=$.removed[ie],Re=M.indexOf(ee);Re>=0&&(M[Re]=null,b[Re].disconnect(ee))}for(let ie=0;ie<$.added.length;ie++){let ee=$.added[ie],Re=M.indexOf(ee);if(Re===-1){for(let Te=0;Te<b.length;Te++)if(Te>=M.length){M.push(ee),Re=Te;break}else if(M[Te]===null){M[Te]=ee,Re=Te;break}if(Re===-1)break}let Pe=b[Re];Pe&&Pe.connect(ee)}}let J=new N,Q=new N;function he($,ie,ee){J.setFromMatrixPosition(ie.matrixWorld),Q.setFromMatrixPosition(ee.matrixWorld);let Re=J.distanceTo(Q),Pe=ie.projectionMatrix.elements,Te=ee.projectionMatrix.elements,ht=Pe[14]/(Pe[10]-1),He=Pe[14]/(Pe[10]+1),Qe=(Pe[9]+1)/Pe[5],Ye=(Pe[9]-1)/Pe[5],Ge=(Pe[8]-1)/Pe[0],gt=(Te[8]+1)/Te[0],At=ht*Ge,bt=ht*gt,Et=Re/(-Ge+gt),ot=Et*-Ge;if(ie.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(ot),$.translateZ(Et),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Pe[10]===-1)$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let _t=ht+Et,I=He+Et,kt=At-ot,Ze=bt+(Re-ot),B=Qe*He/I*_t,g=Ye*He/I*_t;$.projectionMatrix.makePerspective(kt,Ze,B,g,_t,I),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function pe($,ie){ie===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ie.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let ie=$.near,ee=$.far;m.texture!==null&&(m.depthNear>0&&(ie=m.depthNear),m.depthFar>0&&(ee=m.depthFar)),U.near=P.near=S.near=ie,U.far=P.far=S.far=ee,(q!==U.near||Z!==U.far)&&(s.updateRenderState({depthNear:U.near,depthFar:U.far}),q=U.near,Z=U.far),U.layers.mask=$.layers.mask|6,S.layers.mask=U.layers.mask&-5,P.layers.mask=U.layers.mask&-3;let Re=$.parent,Pe=U.cameras;pe(U,Re);for(let Te=0;Te<Pe.length;Te++)pe(Pe[Te],Re);Pe.length===2?he(U,S,P):U.projectionMatrix.copy(S.projectionMatrix),_e($,U,Re)};function _e($,ie,ee){ee===null?$.matrix.copy(ie.matrixWorld):($.matrix.copy(ee.matrixWorld),$.matrix.invert(),$.matrix.multiply(ie.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Ei*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(u===null&&f===null))return c},this.setFoveation=function($){c=$,u!==null&&(u.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(U)},this.getCameraTexture=function($){return p[$]};let Xe=null;function at($,ie){if(h=ie.getViewerPose(l||a),_=ie,h!==null){let ee=h.views;f!==null&&(e.setRenderTargetFramebuffer(A,f.framebuffer),e.setRenderTarget(A));let Re=!1;ee.length!==U.cameras.length&&(U.cameras.length=0,Re=!0);for(let He=0;He<ee.length;He++){let Qe=ee[He],Ye=null;if(f!==null)Ye=f.getViewport(Qe);else{let gt=d.getViewSubImage(u,Qe);Ye=gt.viewport,He===0&&(e.setRenderTargetTextures(A,gt.colorTexture,gt.depthStencilTexture),e.setRenderTarget(A))}let Ge=w[He];Ge===void 0&&(Ge=new vt,Ge.layers.enable(He),Ge.viewport=new Je,w[He]=Ge),Ge.matrix.fromArray(Qe.transform.matrix),Ge.matrix.decompose(Ge.position,Ge.quaternion,Ge.scale),Ge.projectionMatrix.fromArray(Qe.projectionMatrix),Ge.projectionMatrixInverse.copy(Ge.projectionMatrix).invert(),Ge.viewport.set(Ye.x,Ye.y,Ye.width,Ye.height),He===0&&(U.matrix.copy(Ge.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Re===!0&&U.cameras.push(Ge)}let Pe=s.enabledFeatures;if(Pe&&Pe.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){d=n.getBinding();let He=d.getDepthInformation(ee[0]);He&&He.isValid&&He.texture&&m.init(He,s.renderState)}if(Pe&&Pe.includes("camera-access")&&y){e.state.unbindTexture(),d=n.getBinding();for(let He=0;He<ee.length;He++){let Qe=ee[He].camera;if(Qe){let Ye=p[Qe];Ye||(Ye=new Js,p[Qe]=Ye);let Ge=d.getCameraImage(Qe);Ye.sourceTexture=Ge}}}}for(let ee=0;ee<b.length;ee++){let Re=M[ee],Pe=b[ee];Re!==null&&Pe!==void 0&&Pe.update(Re,ie,l||a)}Xe&&Xe($,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),_=null}let qe=new Nu;qe.setAnimationLoop(at),this.setAnimationLoop=function($){Xe=$},this.dispose=function(){}}},W0=new De,ku=new Ie;ku.set(-1,0,0,0,1,0,0,0,1);function X0(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Uc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,T,C,A){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),d(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),u(m,p),p.isMeshPhysicalMaterial&&f(m,p,A)):p.isMeshMatcapMaterial?(r(m,p),_(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),y(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?c(m,p,T,C):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===zt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===zt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let T=e.get(p),C=T.envMap,A=T.envMapRotation;C&&(m.envMap.value=C,m.envMapRotation.value.setFromMatrix4(W0.makeRotationFromEuler(A)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(ku),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,T,C){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*T,m.scale.value=C*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function d(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,T){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===zt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=T.texture,m.transmissionSamplerSize.value.set(T.width,T.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function y(m,p){let T=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(T.matrixWorld),m.nearDistance.value=T.shadow.camera.near,m.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function q0(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(A,b){let M=b.program;n.uniformBlockBinding(A,M)}function l(A,b){let M=s[A.id];M===void 0&&(m(A),M=h(A),s[A.id]=M,A.addEventListener("dispose",T));let E=b.program;n.updateUBOMapping(A,E);let x=e.render.frame;r[A.id]!==x&&(u(A),r[A.id]=x)}function h(A){let b=d();A.__bindingPointIndex=b;let M=i.createBuffer(),E=A.__size,x=A.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,E,x),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,M),M}function d(){for(let A=0;A<o;A++)if(a.indexOf(A)===-1)return a.push(A),A;return Ee("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(A){let b=s[A.id],M=A.uniforms,E=A.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let x=0,S=M.length;x<S;x++){let P=M[x];if(Array.isArray(P))for(let w=0,U=P.length;w<U;w++)f(P[w],x,w,E);else f(P,x,0,E)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(A,b,M,E){if(y(A,b,M,E)===!0){let x=A.__offset,S=A.value;if(Array.isArray(S)){let P=0;for(let w=0;w<S.length;w++){let U=S[w],q=p(U);_(U,A.__data,P),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(P+=q.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(S,A.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,x,A.__data)}}function _(A,b,M){typeof A=="number"||typeof A=="boolean"?b[0]=A:A.isMatrix3?(b[0]=A.elements[0],b[1]=A.elements[1],b[2]=A.elements[2],b[3]=0,b[4]=A.elements[3],b[5]=A.elements[4],b[6]=A.elements[5],b[7]=0,b[8]=A.elements[6],b[9]=A.elements[7],b[10]=A.elements[8],b[11]=0):ArrayBuffer.isView(A)?b.set(new A.constructor(A.buffer,A.byteOffset,b.length)):A.toArray(b,M)}function y(A,b,M,E){let x=A.value,S=b+"_"+M;if(E[S]===void 0)return typeof x=="number"||typeof x=="boolean"?E[S]=x:ArrayBuffer.isView(x)?E[S]=x.slice():E[S]=x.clone(),!0;{let P=E[S];if(typeof x=="number"||typeof x=="boolean"){if(P!==x)return E[S]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(P.equals(x)===!1)return P.copy(x),!0}}return!1}function m(A){let b=A.uniforms,M=0,E=16;for(let S=0,P=b.length;S<P;S++){let w=Array.isArray(b[S])?b[S]:[b[S]];for(let U=0,q=w.length;U<q;U++){let Z=w[U],z=Array.isArray(Z.value)?Z.value:[Z.value];for(let X=0,H=z.length;X<H;X++){let J=z[X],Q=p(J),he=M%E,pe=he%Q.boundary,_e=he+pe;M+=pe,_e!==0&&E-_e<Q.storage&&(M+=E-_e),Z.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),Z.__offset=M,M+=Q.storage}}}let x=M%E;return x>0&&(M+=E-x),A.__size=M,A.__cache={},this}function p(A){let b={boundary:0,storage:0};return typeof A=="number"||typeof A=="boolean"?(b.boundary=4,b.storage=4):A.isVector2?(b.boundary=8,b.storage=8):A.isVector3||A.isColor?(b.boundary=16,b.storage=12):A.isVector4?(b.boundary=16,b.storage=16):A.isMatrix3?(b.boundary=48,b.storage=48):A.isMatrix4?(b.boundary=64,b.storage=64):A.isTexture?ye("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(A)?(b.boundary=16,b.storage=A.byteLength):ye("WebGLRenderer: Unsupported uniform value type.",A),b}function T(A){let b=A.target;b.removeEventListener("dispose",T);let M=a.indexOf(b.__bindingPointIndex);a.splice(M,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function C(){for(let A in s)i.deleteBuffer(s[A]);a=[],s={},r={}}return{bind:c,update:l,dispose:C}}var Y0=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Rn=null;function K0(){return Rn===null&&(Rn=new ds(Y0,16,16,fi,wn),Rn.name="DFG_LUT",Rn.minFilter=pt,Rn.magFilter=pt,Rn.wrapS=sn,Rn.wrapT=sn,Rn.generateMipmaps=!1,Rn.needsUpdate=!0),Rn}var _o=class{constructor(e={}){let{canvas:t=ru(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=Xt}=e;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;let y=f,m=new Set([Pa,Ia,Ra]),p=new Set([Xt,_n,ys,As,Ca,Ea]),T=new Uint32Array(4),C=new Int32Array(4),A=new N,b=null,M=null,E=[],x=[],S=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=mn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,w=!1,U=null,q=null,Z=null,z=null;this._outputColorSpace=Bt;let X=0,H=0,J=null,Q=-1,he=null,pe=new Je,_e=new Je,Xe=null,at=new we(0),qe=0,$=t.width,ie=t.height,ee=1,Re=null,Pe=null,Te=new Je(0,0,$,ie),ht=new Je(0,0,$,ie),He=!1,Qe=new fs,Ye=!1,Ge=!1,gt=new De,At=new N,bt=new Je,Et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ot=!1;function _t(){return J===null?ee:1}let I=n;function kt(v,L){return t.getContext(v,L)}try{let v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"185"}`),t.addEventListener("webglcontextlost",ct,!1),t.addEventListener("webglcontextrestored",it,!1),t.addEventListener("webglcontextcreationerror",xn,!1),I===null){let L="webgl2";if(I=kt(L,v),I===null)throw kt(L)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(v){throw Ee("WebGLRenderer: "+v.message),v}let Ze,B,g,D,k,G,te,se,W,K,re,Be,ce,ae,be,Ce,Le,R,ne,Y,oe,fe,j;function Ae(){Ze=new tg(I),Ze.init(),oe=new V0(I,Ze),B=new Ym(I,Ze,e,oe),g=new z0(I,Ze),B.reversedDepthBuffer&&u&&g.buffers.depth.setReversed(!0),q=I.createFramebuffer(),Z=I.createFramebuffer(),z=I.createFramebuffer(),D=new sg(I),k=new b0,G=new k0(I,Ze,g,k,B,oe,D),te=new eg(P),se=new cf(I),fe=new Xm(I,se),W=new ng(I,se,D,fe),K=new ag(I,W,se,fe,D),R=new rg(I,B,G),be=new Km(k),re=new S0(P,te,Ze,B,fe,be),Be=new X0(P,k),ce=new C0,ae=new L0(Ze),Le=new Wm(P,te,g,K,_,c),Ce=new O0(P,K,B),j=new q0(I,D,B,g),ne=new qm(I,Ze,D),Y=new ig(I,Ze,D),D.programs=re.programs,P.capabilities=B,P.extensions=Ze,P.properties=k,P.renderLists=ce,P.shadowMap=Ce,P.state=g,P.info=D}Ae(),y!==Xt&&(S=new cg(y,t.width,t.height,o,s,r));let xe=new el(P,I);this.xr=xe,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let v=Ze.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=Ze.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(v){v!==void 0&&(ee=v,this.setSize($,ie,!1))},this.getSize=function(v){return v.set($,ie)},this.setSize=function(v,L,V=!0){if(xe.isPresenting){ye("WebGLRenderer: Can't change size while VR device is presenting.");return}$=v,ie=L,t.width=Math.floor(v*ee),t.height=Math.floor(L*ee),V===!0&&(t.style.width=v+"px",t.style.height=L+"px"),S!==null&&S.setSize(t.width,t.height),this.setViewport(0,0,v,L)},this.getDrawingBufferSize=function(v){return v.set($*ee,ie*ee).floor()},this.setDrawingBufferSize=function(v,L,V){$=v,ie=L,ee=V,t.width=Math.floor(v*V),t.height=Math.floor(L*V),this.setViewport(0,0,v,L)},this.setEffects=function(v){if(y===Xt){Ee("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let L=0;L<v.length;L++)if(v[L].isOutputPass===!0){ye("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}S.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(pe)},this.getViewport=function(v){return v.copy(Te)},this.setViewport=function(v,L,V,F){v.isVector4?Te.set(v.x,v.y,v.z,v.w):Te.set(v,L,V,F),g.viewport(pe.copy(Te).multiplyScalar(ee).round())},this.getScissor=function(v){return v.copy(ht)},this.setScissor=function(v,L,V,F){v.isVector4?ht.set(v.x,v.y,v.z,v.w):ht.set(v,L,V,F),g.scissor(_e.copy(ht).multiplyScalar(ee).round())},this.getScissorTest=function(){return He},this.setScissorTest=function(v){g.setScissorTest(He=v)},this.setOpaqueSort=function(v){Re=v},this.setTransparentSort=function(v){Pe=v},this.getClearColor=function(v){return v.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(v=!0,L=!0,V=!0){let F=0;if(v){let O=!1;if(J!==null){let de=J.texture.format;O=m.has(de)}if(O){let de=J.texture.type,ge=p.has(de),ue=Le.getClearColor(),ve=Le.getClearAlpha(),Me=ue.r,Ne=ue.g,Fe=ue.b;ge?(T[0]=Me,T[1]=Ne,T[2]=Fe,T[3]=ve,I.clearBufferuiv(I.COLOR,0,T)):(C[0]=Me,C[1]=Ne,C[2]=Fe,C[3]=ve,I.clearBufferiv(I.COLOR,0,C))}else F|=I.COLOR_BUFFER_BIT}L&&(F|=I.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),V&&(F|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&I.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),U=v},this.dispose=function(){t.removeEventListener("webglcontextlost",ct,!1),t.removeEventListener("webglcontextrestored",it,!1),t.removeEventListener("webglcontextcreationerror",xn,!1),Le.dispose(),ce.dispose(),ae.dispose(),k.dispose(),te.dispose(),K.dispose(),fe.dispose(),j.dispose(),re.dispose(),xe.dispose(),xe.removeEventListener("sessionstart",Dl),xe.removeEventListener("sessionend",Ul),_i.stop()};function ct(v){v.preventDefault(),Os("WebGLRenderer: Context Lost."),w=!0}function it(){Os("WebGLRenderer: Context Restored."),w=!1;let v=D.autoReset,L=Ce.enabled,V=Ce.autoUpdate,F=Ce.needsUpdate,O=Ce.type;Ae(),D.autoReset=v,Ce.enabled=L,Ce.autoUpdate=V,Ce.needsUpdate=F,Ce.type=O}function xn(v){Ee("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function vn(v){let L=v.target;L.removeEventListener("dispose",vn),ju(L)}function ju(v){Qu(v),k.remove(v)}function Qu(v){let L=k.get(v).programs;L!==void 0&&(L.forEach(function(V){re.releaseProgram(V)}),v.isShaderMaterial&&re.releaseShaderCache(v))}this.renderBufferDirect=function(v,L,V,F,O,de){L===null&&(L=Et);let ge=O.isMesh&&O.matrixWorld.determinantAffine()<0,ue=nd(v,L,V,F,O);g.setMaterial(F,ge);let ve=V.index,Me=1;if(F.wireframe===!0){if(ve=W.getWireframeAttribute(V),ve===void 0)return;Me=2}let Ne=V.drawRange,Fe=V.attributes.position,Se=Ne.start*Me,je=(Ne.start+Ne.count)*Me;de!==null&&(Se=Math.max(Se,de.start*Me),je=Math.min(je,(de.start+de.count)*Me)),ve!==null?(Se=Math.max(Se,0),je=Math.min(je,ve.count)):Fe!=null&&(Se=Math.max(Se,0),je=Math.min(je,Fe.count));let ut=je-Se;if(ut<0||ut===1/0)return;fe.setup(O,F,ue,V,ve);let lt,et=ne;if(ve!==null&&(lt=se.get(ve),et=Y,et.setIndex(lt)),O.isMesh)F.wireframe===!0?(g.setLineWidth(F.wireframeLinewidth*_t()),et.setMode(I.LINES)):et.setMode(I.TRIANGLES);else if(O.isLine){let Rt=F.linewidth;Rt===void 0&&(Rt=1),g.setLineWidth(Rt*_t()),O.isLineSegments?et.setMode(I.LINES):O.isLineLoop?et.setMode(I.LINE_LOOP):et.setMode(I.LINE_STRIP)}else O.isPoints?et.setMode(I.POINTS):O.isSprite&&et.setMode(I.TRIANGLES);if(O.isBatchedMesh)if(Ze.get("WEBGL_multi_draw"))et.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Rt=O._multiDrawStarts,me=O._multiDrawCounts,qt=O._multiDrawCount,We=ve?se.get(ve).bytesPerElement:1,tn=k.get(F).currentProgram.getUniforms();for(let yn=0;yn<qt;yn++)tn.setValue(I,"_gl_DrawID",yn),et.render(Rt[yn]/We,me[yn])}else if(O.isInstancedMesh)et.renderInstances(Se,ut,O.count);else if(V.isInstancedBufferGeometry){let Rt=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,me=Math.min(V.instanceCount,Rt);et.renderInstances(Se,ut,me)}else et.render(Se,ut)};function Nl(v,L,V){v.transparent===!0&&v.side===rn&&v.forceSinglePass===!1?(v.side=zt,v.needsUpdate=!0,Ar(v,L,V),v.side=fn,v.needsUpdate=!0,Ar(v,L,V),v.side=rn):Ar(v,L,V)}this.compile=function(v,L,V=null){V===null&&(V=v),M=ae.get(V),M.init(L),x.push(M),V.traverseVisible(function(O){O.isLight&&O.layers.test(L.layers)&&(M.pushLight(O),O.castShadow&&M.pushShadow(O))}),v!==V&&v.traverseVisible(function(O){O.isLight&&O.layers.test(L.layers)&&(M.pushLight(O),O.castShadow&&M.pushShadow(O))}),M.setupLights();let F=new Set;return v.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let de=O.material;if(de)if(Array.isArray(de))for(let ge=0;ge<de.length;ge++){let ue=de[ge];Nl(ue,V,O),F.add(ue)}else Nl(de,V,O),F.add(de)}),M=x.pop(),F},this.compileAsync=function(v,L,V=null){let F=this.compile(v,L,V);return new Promise(O=>{function de(){if(F.forEach(function(ge){k.get(ge).currentProgram.isReady()&&F.delete(ge)}),F.size===0){O(v);return}setTimeout(de,10)}Ze.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let To=null;function ed(v){To&&To(v)}function Dl(){_i.stop()}function Ul(){_i.start()}let _i=new Nu;_i.setAnimationLoop(ed),typeof self<"u"&&_i.setContext(self),this.setAnimationLoop=function(v){To=v,xe.setAnimationLoop(v),v===null?_i.stop():_i.start()},xe.addEventListener("sessionstart",Dl),xe.addEventListener("sessionend",Ul),this.render=function(v,L){if(L!==void 0&&L.isCamera!==!0){Ee("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;U!==null&&U.renderStart(v,L);let V=xe.enabled===!0&&xe.isPresenting===!0,F=S!==null&&(J===null||V)&&S.begin(P,J);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),xe.enabled===!0&&xe.isPresenting===!0&&(S===null||S.isCompositing()===!1)&&(xe.cameraAutoUpdate===!0&&xe.updateCamera(L),L=xe.getCamera()),v.isScene===!0&&v.onBeforeRender(P,v,L,J),M=ae.get(v,x.length),M.init(L),M.state.textureUnits=G.getTextureUnits(),x.push(M),gt.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Qe.setFromProjectionMatrix(gt,un,L.reversedDepth),Ge=this.localClippingEnabled,Ye=be.init(this.clippingPlanes,Ge),b=ce.get(v,E.length),b.init(),E.push(b),xe.enabled===!0&&xe.isPresenting===!0){let ge=P.xr.getDepthSensingMesh();ge!==null&&Co(ge,L,-1/0,P.sortObjects)}Co(v,L,0,P.sortObjects),b.finish(),P.sortObjects===!0&&b.sort(Re,Pe,L.reversedDepth),ot=xe.enabled===!1||xe.isPresenting===!1||xe.hasDepthSensing()===!1,ot&&Le.addToRenderList(b,v),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Ye===!0&&be.beginShadows();let O=M.state.shadowsArray;if(Ce.render(O,v,L),Ye===!0&&be.endShadows(),(F&&S.hasRenderPass())===!1){let ge=b.opaque,ue=b.transmissive;if(M.setupLights(),L.isArrayCamera){let ve=L.cameras;if(ue.length>0)for(let Me=0,Ne=ve.length;Me<Ne;Me++){let Fe=ve[Me];Ol(ge,ue,v,Fe)}ot&&Le.render(v);for(let Me=0,Ne=ve.length;Me<Ne;Me++){let Fe=ve[Me];Fl(b,v,Fe,Fe.viewport)}}else ue.length>0&&Ol(ge,ue,v,L),ot&&Le.render(v),Fl(b,v,L)}J!==null&&H===0&&(G.updateMultisampleRenderTarget(J),G.updateRenderTargetMipmap(J)),F&&S.end(P),v.isScene===!0&&v.onAfterRender(P,v,L),fe.resetDefaultState(),Q=-1,he=null,x.pop(),x.length>0?(M=x[x.length-1],G.setTextureUnits(M.state.textureUnits),Ye===!0&&be.setGlobalState(P.clippingPlanes,M.state.camera)):M=null,E.pop(),E.length>0?b=E[E.length-1]:b=null,U!==null&&U.renderEnd()};function Co(v,L,V,F){if(v.visible===!1)return;if(v.layers.test(L.layers)){if(v.isGroup)V=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(L);else if(v.isLightProbeGrid)M.pushLightProbeGrid(v);else if(v.isLight)M.pushLight(v),v.castShadow&&M.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Qe.intersectsSprite(v)){F&&bt.setFromMatrixPosition(v.matrixWorld).applyMatrix4(gt);let ge=K.update(v),ue=v.material;ue.visible&&b.push(v,ge,ue,V,bt.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Qe.intersectsObject(v))){let ge=K.update(v),ue=v.material;if(F&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),bt.copy(v.boundingSphere.center)):(ge.boundingSphere===null&&ge.computeBoundingSphere(),bt.copy(ge.boundingSphere.center)),bt.applyMatrix4(v.matrixWorld).applyMatrix4(gt)),Array.isArray(ue)){let ve=ge.groups;for(let Me=0,Ne=ve.length;Me<Ne;Me++){let Fe=ve[Me],Se=ue[Fe.materialIndex];Se&&Se.visible&&b.push(v,ge,Se,V,bt.z,Fe)}}else ue.visible&&b.push(v,ge,ue,V,bt.z,null)}}let de=v.children;for(let ge=0,ue=de.length;ge<ue;ge++)Co(de[ge],L,V,F)}function Fl(v,L,V,F){let{opaque:O,transmissive:de,transparent:ge}=v;M.setupLightsView(V),Ye===!0&&be.setGlobalState(P.clippingPlanes,V),F&&g.viewport(pe.copy(F)),O.length>0&&yr(O,L,V),de.length>0&&yr(de,L,V),ge.length>0&&yr(ge,L,V),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function Ol(v,L,V,F){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;if(M.state.transmissionRenderTarget[F.id]===void 0){let Se=Ze.has("EXT_color_buffer_half_float")||Ze.has("EXT_color_buffer_float");M.state.transmissionRenderTarget[F.id]=new Jt(1,1,{generateMipmaps:!0,type:Se?wn:Xt,minFilter:gn,samples:Math.max(4,B.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Oe.workingColorSpace})}let de=M.state.transmissionRenderTarget[F.id],ge=F.viewport||pe;de.setSize(ge.z*P.transmissionResolutionScale,ge.w*P.transmissionResolutionScale);let ue=P.getRenderTarget(),ve=P.getActiveCubeFace(),Me=P.getActiveMipmapLevel();P.setRenderTarget(de),P.getClearColor(at),qe=P.getClearAlpha(),qe<1&&P.setClearColor(16777215,.5),P.clear(),ot&&Le.render(V);let Ne=P.toneMapping;P.toneMapping=mn;let Fe=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),M.setupLightsView(F),Ye===!0&&be.setGlobalState(P.clippingPlanes,F),yr(v,V,F),G.updateMultisampleRenderTarget(de),G.updateRenderTargetMipmap(de),Ze.has("WEBGL_multisampled_render_to_texture")===!1){let Se=!1;for(let je=0,ut=L.length;je<ut;je++){let lt=L[je],{object:et,geometry:Rt,material:me,group:qt}=lt;if(me.side===rn&&et.layers.test(F.layers)){let We=me.side;me.side=zt,me.needsUpdate=!0,zl(et,V,F,Rt,me,qt),me.side=We,me.needsUpdate=!0,Se=!0}}Se===!0&&(G.updateMultisampleRenderTarget(de),G.updateRenderTargetMipmap(de))}P.setRenderTarget(ue,ve,Me),P.setClearColor(at,qe),Fe!==void 0&&(F.viewport=Fe),P.toneMapping=Ne}function yr(v,L,V){let F=L.isScene===!0?L.overrideMaterial:null;for(let O=0,de=v.length;O<de;O++){let ge=v[O],{object:ue,geometry:ve,group:Me}=ge,Ne=ge.material;Ne.allowOverride===!0&&F!==null&&(Ne=F),ue.layers.test(V.layers)&&zl(ue,L,V,ve,Ne,Me)}}function zl(v,L,V,F,O,de){v.onBeforeRender(P,L,V,F,O,de),v.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),O.onBeforeRender(P,L,V,F,v,de),O.transparent===!0&&O.side===rn&&O.forceSinglePass===!1?(O.side=zt,O.needsUpdate=!0,P.renderBufferDirect(V,L,F,O,v,de),O.side=fn,O.needsUpdate=!0,P.renderBufferDirect(V,L,F,O,v,de),O.side=rn):P.renderBufferDirect(V,L,F,O,v,de),v.onAfterRender(P,L,V,F,O,de)}function Ar(v,L,V){L.isScene!==!0&&(L=Et);let F=k.get(v),O=M.state.lights,de=M.state.shadowsArray,ge=O.state.version,ue=re.getParameters(v,O.state,de,L,V,M.state.lightProbeGridArray),ve=re.getProgramCacheKey(ue),Me=F.programs;F.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?L.environment:null,F.fog=L.fog;let Ne=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;F.envMap=te.get(v.envMap||F.environment,Ne),F.envMapRotation=F.environment!==null&&v.envMap===null?L.environmentRotation:v.envMapRotation,Me===void 0&&(v.addEventListener("dispose",vn),Me=new Map,F.programs=Me);let Fe=Me.get(ve);if(Fe!==void 0){if(F.currentProgram===Fe&&F.lightsStateVersion===ge)return Vl(v,ue),Fe}else ue.uniforms=re.getUniforms(v),U!==null&&v.isNodeMaterial&&U.build(v,V,ue),v.onBeforeCompile(ue,P),Fe=re.acquireProgram(ue,ve),Me.set(ve,Fe),F.uniforms=ue.uniforms;let Se=F.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Se.clippingPlanes=be.uniform),Vl(v,ue),F.needsLights=sd(v),F.lightsStateVersion=ge,F.needsLights&&(Se.ambientLightColor.value=O.state.ambient,Se.lightProbe.value=O.state.probe,Se.directionalLights.value=O.state.directional,Se.directionalLightShadows.value=O.state.directionalShadow,Se.spotLights.value=O.state.spot,Se.spotLightShadows.value=O.state.spotShadow,Se.rectAreaLights.value=O.state.rectArea,Se.ltc_1.value=O.state.rectAreaLTC1,Se.ltc_2.value=O.state.rectAreaLTC2,Se.pointLights.value=O.state.point,Se.pointLightShadows.value=O.state.pointShadow,Se.hemisphereLights.value=O.state.hemi,Se.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Se.spotLightMatrix.value=O.state.spotLightMatrix,Se.spotLightMap.value=O.state.spotLightMap,Se.pointShadowMatrix.value=O.state.pointShadowMatrix),F.lightProbeGrid=M.state.lightProbeGridArray.length>0,F.currentProgram=Fe,F.uniformsList=null,Fe}function kl(v){if(v.uniformsList===null){let L=v.currentProgram.getUniforms();v.uniformsList=Ss.seqWithValue(L.seq,v.uniforms)}return v.uniformsList}function Vl(v,L){let V=k.get(v);V.outputColorSpace=L.outputColorSpace,V.batching=L.batching,V.batchingColor=L.batchingColor,V.instancing=L.instancing,V.instancingColor=L.instancingColor,V.instancingMorph=L.instancingMorph,V.skinning=L.skinning,V.morphTargets=L.morphTargets,V.morphNormals=L.morphNormals,V.morphColors=L.morphColors,V.morphTargetsCount=L.morphTargetsCount,V.numClippingPlanes=L.numClippingPlanes,V.numIntersection=L.numClipIntersection,V.vertexAlphas=L.vertexAlphas,V.vertexTangents=L.vertexTangents,V.toneMapping=L.toneMapping}function td(v,L){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;A.setFromMatrixPosition(L.matrixWorld);for(let V=0,F=v.length;V<F;V++){let O=v[V];if(O.texture!==null&&O.boundingBox.containsPoint(A))return O}return null}function nd(v,L,V,F,O){L.isScene!==!0&&(L=Et),G.resetTextureUnits();let de=L.fog,ge=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?L.environment:null,ue=J===null?P.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Oe.workingColorSpace,ve=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,Me=te.get(F.envMap||ge,ve),Ne=F.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Fe=!!V.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),Se=!!V.morphAttributes.position,je=!!V.morphAttributes.normal,ut=!!V.morphAttributes.color,lt=mn;F.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(lt=P.toneMapping);let et=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Rt=et!==void 0?et.length:0,me=k.get(F),qt=M.state.lights;if(Ye===!0&&(Ge===!0||v!==he)){let st=v===he&&F.id===Q;be.setState(F,v,st)}let We=!1;F.version===me.__version?(me.needsLights&&me.lightsStateVersion!==qt.state.version||me.outputColorSpace!==ue||O.isBatchedMesh&&me.batching===!1||!O.isBatchedMesh&&me.batching===!0||O.isBatchedMesh&&me.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&me.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&me.instancing===!1||!O.isInstancedMesh&&me.instancing===!0||O.isSkinnedMesh&&me.skinning===!1||!O.isSkinnedMesh&&me.skinning===!0||O.isInstancedMesh&&me.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&me.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&me.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&me.instancingMorph===!1&&O.morphTexture!==null||me.envMap!==Me||F.fog===!0&&me.fog!==de||me.numClippingPlanes!==void 0&&(me.numClippingPlanes!==be.numPlanes||me.numIntersection!==be.numIntersection)||me.vertexAlphas!==Ne||me.vertexTangents!==Fe||me.morphTargets!==Se||me.morphNormals!==je||me.morphColors!==ut||me.toneMapping!==lt||me.morphTargetsCount!==Rt||!!me.lightProbeGrid!=M.state.lightProbeGridArray.length>0)&&(We=!0):(We=!0,me.__version=F.version);let tn=me.currentProgram;We===!0&&(tn=Ar(F,L,O),U&&F.isNodeMaterial&&U.onUpdateProgram(F,tn,me));let yn=!1,Zn=!1,ki=!1,tt=tn.getUniforms(),dt=me.uniforms;if(g.useProgram(tn.program)&&(yn=!0,Zn=!0,ki=!0),F.id!==Q&&(Q=F.id,Zn=!0),me.needsLights){let st=td(M.state.lightProbeGridArray,O);me.lightProbeGrid!==st&&(me.lightProbeGrid=st,Zn=!0)}if(yn||he!==v){g.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),tt.setValue(I,"projectionMatrix",v.projectionMatrix),tt.setValue(I,"viewMatrix",v.matrixWorldInverse);let Jn=tt.map.cameraPosition;Jn!==void 0&&Jn.setValue(I,At.setFromMatrixPosition(v.matrixWorld)),B.logarithmicDepthBuffer&&tt.setValue(I,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&tt.setValue(I,"isOrthographic",v.isOrthographicCamera===!0),he!==v&&(he=v,Zn=!0,ki=!0)}if(me.needsLights&&(qt.state.directionalShadowMap.length>0&&tt.setValue(I,"directionalShadowMap",qt.state.directionalShadowMap,G),qt.state.spotShadowMap.length>0&&tt.setValue(I,"spotShadowMap",qt.state.spotShadowMap,G),qt.state.pointShadowMap.length>0&&tt.setValue(I,"pointShadowMap",qt.state.pointShadowMap,G)),O.isSkinnedMesh){tt.setOptional(I,O,"bindMatrix"),tt.setOptional(I,O,"bindMatrixInverse");let st=O.skeleton;st&&(st.boneTexture===null&&st.computeBoneTexture(),tt.setValue(I,"boneTexture",st.boneTexture,G))}O.isBatchedMesh&&(tt.setOptional(I,O,"batchingTexture"),tt.setValue(I,"batchingTexture",O._matricesTexture,G),tt.setOptional(I,O,"batchingIdTexture"),tt.setValue(I,"batchingIdTexture",O._indirectTexture,G),tt.setOptional(I,O,"batchingColorTexture"),O._colorsTexture!==null&&tt.setValue(I,"batchingColorTexture",O._colorsTexture,G));let $n=V.morphAttributes;if(($n.position!==void 0||$n.normal!==void 0||$n.color!==void 0)&&R.update(O,V,tn),(Zn||me.receiveShadow!==O.receiveShadow)&&(me.receiveShadow=O.receiveShadow,tt.setValue(I,"receiveShadow",O.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&L.environment!==null&&(dt.envMapIntensity.value=L.environmentIntensity),dt.dfgLUT!==void 0&&(dt.dfgLUT.value=K0()),Zn){if(tt.setValue(I,"toneMappingExposure",P.toneMappingExposure),me.needsLights&&id(dt,ki),de&&F.fog===!0&&Be.refreshFogUniforms(dt,de),Be.refreshMaterialUniforms(dt,F,ee,ie,M.state.transmissionRenderTarget[v.id]),me.needsLights&&me.lightProbeGrid){let st=me.lightProbeGrid;dt.probesSH.value=st.texture,dt.probesMin.value.copy(st.boundingBox.min),dt.probesMax.value.copy(st.boundingBox.max),dt.probesResolution.value.copy(st.resolution)}Ss.upload(I,kl(me),dt,G)}if(F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(Ss.upload(I,kl(me),dt,G),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&tt.setValue(I,"center",O.center),tt.setValue(I,"modelViewMatrix",O.modelViewMatrix),tt.setValue(I,"normalMatrix",O.normalMatrix),tt.setValue(I,"modelMatrix",O.matrixWorld),F.uniformsGroups!==void 0){let st=F.uniformsGroups;for(let Jn=0,Vi=st.length;Jn<Vi;Jn++){let Hl=st[Jn];j.update(Hl,tn),j.bind(Hl,tn)}}return tn}function id(v,L){v.ambientLightColor.needsUpdate=L,v.lightProbe.needsUpdate=L,v.directionalLights.needsUpdate=L,v.directionalLightShadows.needsUpdate=L,v.pointLights.needsUpdate=L,v.pointLightShadows.needsUpdate=L,v.spotLights.needsUpdate=L,v.spotLightShadows.needsUpdate=L,v.rectAreaLights.needsUpdate=L,v.hemisphereLights.needsUpdate=L}function sd(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return X},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(v,L,V){let F=k.get(v);F.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),k.get(v.texture).__webglTexture=L,k.get(v.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:V,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,L){let V=k.get(v);V.__webglFramebuffer=L,V.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(v,L=0,V=0){J=v,X=L,H=V;let F=null,O=!1,de=!1;if(v){let ue=k.get(v);if(ue.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(I.FRAMEBUFFER,ue.__webglFramebuffer),pe.copy(v.viewport),_e.copy(v.scissor),Xe=v.scissorTest,g.viewport(pe),g.scissor(_e),g.setScissorTest(Xe),Q=-1;return}else if(ue.__webglFramebuffer===void 0)G.setupRenderTarget(v);else if(ue.__hasExternalTextures)G.rebindTextures(v,k.get(v.texture).__webglTexture,k.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Ne=v.depthTexture;if(ue.__boundDepthTexture!==Ne){if(Ne!==null&&k.has(Ne)&&(v.width!==Ne.image.width||v.height!==Ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");G.setupDepthRenderbuffer(v)}}let ve=v.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(de=!0);let Me=k.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Me[L])?F=Me[L][V]:F=Me[L],O=!0):v.samples>0&&G.useMultisampledRTT(v)===!1?F=k.get(v).__webglMultisampledFramebuffer:Array.isArray(Me)?F=Me[V]:F=Me,pe.copy(v.viewport),_e.copy(v.scissor),Xe=v.scissorTest}else pe.copy(Te).multiplyScalar(ee).floor(),_e.copy(ht).multiplyScalar(ee).floor(),Xe=He;if(V!==0&&(F=q),g.bindFramebuffer(I.FRAMEBUFFER,F)&&g.drawBuffers(v,F),g.viewport(pe),g.scissor(_e),g.setScissorTest(Xe),O){let ue=k.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+L,ue.__webglTexture,V)}else if(de){let ue=L;for(let ve=0;ve<v.textures.length;ve++){let Me=k.get(v.textures[ve]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+ve,Me.__webglTexture,V,ue)}}else if(v!==null&&V!==0){let ue=k.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ue.__webglTexture,V)}Q=-1},this.readRenderTargetPixels=function(v,L,V,F,O,de,ge,ue=0){if(!(v&&v.isWebGLRenderTarget)){Ee("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=k.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ge!==void 0&&(ve=ve[ge]),ve){g.bindFramebuffer(I.FRAMEBUFFER,ve);try{let Me=v.textures[ue],Ne=Me.format,Fe=Me.type;if(v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+ue),!B.textureFormatReadable(Ne)){Ee("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!B.textureTypeReadable(Fe)){Ee("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=v.width-F&&V>=0&&V<=v.height-O&&I.readPixels(L,V,F,O,oe.convert(Ne),oe.convert(Fe),de)}finally{let Me=J!==null?k.get(J).__webglFramebuffer:null;g.bindFramebuffer(I.FRAMEBUFFER,Me)}}},this.readRenderTargetPixelsAsync=async function(v,L,V,F,O,de,ge,ue=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=k.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ge!==void 0&&(ve=ve[ge]),ve)if(L>=0&&L<=v.width-F&&V>=0&&V<=v.height-O){g.bindFramebuffer(I.FRAMEBUFFER,ve);let Me=v.textures[ue],Ne=Me.format,Fe=Me.type;if(v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+ue),!B.textureFormatReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!B.textureTypeReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Se=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Se),I.bufferData(I.PIXEL_PACK_BUFFER,de.byteLength,I.STREAM_READ),I.readPixels(L,V,F,O,oe.convert(Ne),oe.convert(Fe),0);let je=J!==null?k.get(J).__webglFramebuffer:null;g.bindFramebuffer(I.FRAMEBUFFER,je);let ut=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await ou(I,ut,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Se),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,de),I.deleteBuffer(Se),I.deleteSync(ut),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,L=null,V=0){let F=Math.pow(2,-V),O=Math.floor(v.image.width*F),de=Math.floor(v.image.height*F),ge=L!==null?L.x:0,ue=L!==null?L.y:0;G.setTexture2D(v,0),I.copyTexSubImage2D(I.TEXTURE_2D,V,0,0,ge,ue,O,de),g.unbindTexture()},this.copyTextureToTexture=function(v,L,V=null,F=null,O=0,de=0){let ge,ue,ve,Me,Ne,Fe,Se,je,ut,lt=v.isCompressedTexture?v.mipmaps[de]:v.image;if(V!==null)ge=V.max.x-V.min.x,ue=V.max.y-V.min.y,ve=V.isBox3?V.max.z-V.min.z:1,Me=V.min.x,Ne=V.min.y,Fe=V.isBox3?V.min.z:0;else{let dt=Math.pow(2,-O);ge=Math.floor(lt.width*dt),ue=Math.floor(lt.height*dt),v.isDataArrayTexture?ve=lt.depth:v.isData3DTexture?ve=Math.floor(lt.depth*dt):ve=1,Me=0,Ne=0,Fe=0}F!==null?(Se=F.x,je=F.y,ut=F.z):(Se=0,je=0,ut=0);let et=oe.convert(L.format),Rt=oe.convert(L.type),me;L.isData3DTexture?(G.setTexture3D(L,0),me=I.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(G.setTexture2DArray(L,0),me=I.TEXTURE_2D_ARRAY):(G.setTexture2D(L,0),me=I.TEXTURE_2D),g.activeTexture(I.TEXTURE0),g.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,L.flipY),g.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),g.pixelStorei(I.UNPACK_ALIGNMENT,L.unpackAlignment);let qt=g.getParameter(I.UNPACK_ROW_LENGTH),We=g.getParameter(I.UNPACK_IMAGE_HEIGHT),tn=g.getParameter(I.UNPACK_SKIP_PIXELS),yn=g.getParameter(I.UNPACK_SKIP_ROWS),Zn=g.getParameter(I.UNPACK_SKIP_IMAGES);g.pixelStorei(I.UNPACK_ROW_LENGTH,lt.width),g.pixelStorei(I.UNPACK_IMAGE_HEIGHT,lt.height),g.pixelStorei(I.UNPACK_SKIP_PIXELS,Me),g.pixelStorei(I.UNPACK_SKIP_ROWS,Ne),g.pixelStorei(I.UNPACK_SKIP_IMAGES,Fe);let ki=v.isDataArrayTexture||v.isData3DTexture,tt=L.isDataArrayTexture||L.isData3DTexture;if(v.isDepthTexture){let dt=k.get(v),$n=k.get(L),st=k.get(dt.__renderTarget),Jn=k.get($n.__renderTarget);g.bindFramebuffer(I.READ_FRAMEBUFFER,st.__webglFramebuffer),g.bindFramebuffer(I.DRAW_FRAMEBUFFER,Jn.__webglFramebuffer);for(let Vi=0;Vi<ve;Vi++)ki&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,k.get(v).__webglTexture,O,Fe+Vi),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,k.get(L).__webglTexture,de,ut+Vi)),I.blitFramebuffer(Me,Ne,ge,ue,Se,je,ge,ue,I.DEPTH_BUFFER_BIT,I.NEAREST);g.bindFramebuffer(I.READ_FRAMEBUFFER,null),g.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(O!==0||v.isRenderTargetTexture||k.has(v)){let dt=k.get(v),$n=k.get(L);g.bindFramebuffer(I.READ_FRAMEBUFFER,Z),g.bindFramebuffer(I.DRAW_FRAMEBUFFER,z);for(let st=0;st<ve;st++)ki?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,dt.__webglTexture,O,Fe+st):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,dt.__webglTexture,O),tt?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,$n.__webglTexture,de,ut+st):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,$n.__webglTexture,de),O!==0?I.blitFramebuffer(Me,Ne,ge,ue,Se,je,ge,ue,I.COLOR_BUFFER_BIT,I.NEAREST):tt?I.copyTexSubImage3D(me,de,Se,je,ut+st,Me,Ne,ge,ue):I.copyTexSubImage2D(me,de,Se,je,Me,Ne,ge,ue);g.bindFramebuffer(I.READ_FRAMEBUFFER,null),g.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else tt?v.isDataTexture||v.isData3DTexture?I.texSubImage3D(me,de,Se,je,ut,ge,ue,ve,et,Rt,lt.data):L.isCompressedArrayTexture?I.compressedTexSubImage3D(me,de,Se,je,ut,ge,ue,ve,et,lt.data):I.texSubImage3D(me,de,Se,je,ut,ge,ue,ve,et,Rt,lt):v.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,de,Se,je,ge,ue,et,Rt,lt.data):v.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,de,Se,je,lt.width,lt.height,et,lt.data):I.texSubImage2D(I.TEXTURE_2D,de,Se,je,ge,ue,et,Rt,lt);g.pixelStorei(I.UNPACK_ROW_LENGTH,qt),g.pixelStorei(I.UNPACK_IMAGE_HEIGHT,We),g.pixelStorei(I.UNPACK_SKIP_PIXELS,tn),g.pixelStorei(I.UNPACK_SKIP_ROWS,yn),g.pixelStorei(I.UNPACK_SKIP_IMAGES,Zn),de===0&&L.generateMipmaps&&I.generateMipmap(me),g.unbindTexture()},this.initRenderTarget=function(v){k.get(v).__webglFramebuffer===void 0&&G.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?G.setTextureCube(v,0):v.isData3DTexture?G.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?G.setTexture2DArray(v,0):G.setTexture2D(v,0),g.unbindTexture()},this.resetState=function(){X=0,H=0,J=null,g.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Oe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Oe._getUnpackColorSpace()}};function tl(i,e){if(e===Pc)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===Bs||e===mr){let t=i.getIndex();if(t===null){let a=[],o=i.getAttribute("position");if(o!==void 0){for(let c=0;c<o.count;c++)a.push(c);i.setIndex(a),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}let n=t.count-2,s=[];if(e===Bs)for(let a=1;a<=n;a++)s.push(t.getX(0)),s.push(t.getX(a)),s.push(t.getX(a+1));else for(let a=0;a<n;a++)a%2===0?(s.push(t.getX(a)),s.push(t.getX(a+1)),s.push(t.getX(a+2))):(s.push(t.getX(a+2)),s.push(t.getX(a+1)),s.push(t.getX(a)));s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=i.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}function Vu(i){let e=new Map,t=new Map,n=i.clone();return Hu(i,n,function(s,r){e.set(r,s),t.set(s,r)}),n.traverse(function(s){if(!s.isSkinnedMesh)return;let r=s,a=e.get(s),o=a.skeleton.bones;r.skeleton=a.skeleton.clone(),r.bindMatrix.copy(a.bindMatrix),r.skeleton.bones=o.map(function(c){return t.get(c)}),r.bind(r.skeleton,r.bindMatrix)}),n}function Hu(i,e,t){t(i,e);for(let n=0;n<i.children.length;n++)Hu(i.children[n],e.children[n],t)}var yo=class extends Cn{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new cl(t)}),this.register(function(t){return new ll(t)}),this.register(function(t){return new xl(t)}),this.register(function(t){return new vl(t)}),this.register(function(t){return new yl(t)}),this.register(function(t){return new ul(t)}),this.register(function(t){return new dl(t)}),this.register(function(t){return new fl(t)}),this.register(function(t){return new pl(t)}),this.register(function(t){return new ol(t)}),this.register(function(t){return new ml(t)}),this.register(function(t){return new hl(t)}),this.register(function(t){return new _l(t)}),this.register(function(t){return new gl(t)}),this.register(function(t){return new rl(t)}),this.register(function(t){return new Ao(t,ke.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new Ao(t,ke.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new Al(t)})}load(e,t,n,s){let r=this,a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){let l=Yn.extractUrlBase(e);a=Yn.resolveURL(l,this.path)}else a=Yn.extractUrlBase(e);this.manager.itemStart(e);let o=function(l){s?s(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new _s(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r,a={},o={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===Yu){try{a[ke.KHR_BINARY_GLTF]=new Bl(e)}catch(d){s&&s(d);return}r=JSON.parse(a[ke.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new wl(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let d=this.pluginCallbacks[h](l);d.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[d.name]=d,a[d.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let d=r.extensionsUsed[h],u=r.extensionsRequired||[];switch(d){case ke.KHR_MATERIALS_UNLIT:a[d]=new al;break;case ke.KHR_DRACO_MESH_COMPRESSION:a[d]=new Ml(r,this.dracoLoader);break;case ke.KHR_TEXTURE_TRANSFORM:a[d]=new Sl;break;case ke.KHR_MESH_QUANTIZATION:a[d]=new bl;break;default:u.indexOf(d)>=0&&o[d]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+d+'".')}}l.setExtensions(a),l.setPlugins(o),l.parse(n,s)}parseAsync(e,t){let n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}};function $0(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}function mt(i,e,t){let n=i.json.materials[e];return n.extensions&&n.extensions[t]?n.extensions[t]:null}var ke={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},rl=class{constructor(e){this.parser=e,this.name=ke.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,s=t.cache.get(n);if(s)return s;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,h=new we(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],Ut);let d=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new Li(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new li(h),l.distance=d;break;case"spot":l=new sr(h),l.distance=d,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),Pn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),s=Promise.resolve(l),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(c){return n._getNodeRef(t.cache,o,c)})}},al=class{constructor(){this.name=ke.KHR_MATERIALS_UNLIT}getMaterialType(){return pn}extendParams(e,t,n){let s=[];e.color=new we(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Ut),e.opacity=a[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,Bt))}return Promise.all(s)}},ol=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}},cl=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&s.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&s.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(s.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){let r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ze(r,r)}return Promise.all(s)}},ll=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_DISPERSION}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion!==void 0?n.dispersion:0),Promise.resolve()}},hl=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&s.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&s.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture)),Promise.all(s)}},ul=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_SHEEN}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];if(t.sheenColor=new we(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],Ut)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&s.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Bt)),n.sheenRoughnessTexture!==void 0&&s.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture)),Promise.all(s)}},dl=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&s.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture)),Promise.all(s)}},fl=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_VOLUME}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0&&s.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;let r=n.attenuationColor||[1,1,1];return t.attenuationColor=new we().setRGB(r[0],r[1],r[2],Ut),Promise.all(s)}},pl=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_IOR}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);return n===null||(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},ml=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_SPECULAR}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0&&s.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));let r=n.specularColorFactor||[1,1,1];return t.specularColor=new we().setRGB(r[0],r[1],r[2],Ut),n.specularColorTexture!==void 0&&s.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Bt)),Promise.all(s)}},gl=class{constructor(e){this.parser=e,this.name=ke.EXT_MATERIALS_BUMP}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0&&s.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture)),Promise.all(s)}},_l=class{constructor(e){this.parser=e,this.name=ke.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return mt(this.parser,e,this.name)!==null?Gt:null}extendMaterialParams(e,t){let n=mt(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&s.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture)),Promise.all(s)}},xl=class{constructor(e){this.parser=e,this.name=ke.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;let r=s.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}},vl=class{constructor(e){this.parser=e,this.name=ke.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let a=r.extensions[t],o=s.images[a.source],c=n.textureLoader;if(o.uri){let l=n.options.manager.getHandler(o.uri);l!==null&&(c=l)}return n.loadTextureImage(e,a.source,c)}},yl=class{constructor(e){this.parser=e,this.name=ke.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let a=r.extensions[t],o=s.images[a.source],c=n.textureLoader;if(o.uri){let l=n.options.manager.getHandler(o.uri);l!==null&&(c=l)}return n.loadTextureImage(e,a.source,c)}},Ao=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){let c=s.byteOffset||0,l=s.byteLength||0,h=s.count,d=s.byteStride,u=new Uint8Array(o,c,l);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,d,u,s.mode,s.filter).then(function(f){return f.buffer}):a.ready.then(function(){let f=new ArrayBuffer(h*d);return a.decodeGltfBuffer(new Uint8Array(f),h,d,u,s.mode,s.filter),f})})}else return null}},Al=class{constructor(e){this.name=ke.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let s=t.meshes[n.mesh];for(let l of s.primitives)if(l.mode!==an.TRIANGLES&&l.mode!==an.TRIANGLE_STRIP&&l.mode!==an.TRIANGLE_FAN&&l.mode!==void 0)return null;let a=n.extensions[this.name].attributes,o=[],c={};for(let l in a)o.push(this.parser.getDependency("accessor",a[l]).then(h=>(c[l]=h,c[l])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(l=>{let h=l.pop(),d=h.isGroup?h.children:[h],u=l[0].count,f=[];for(let _ of d){let y=new De,m=new N,p=new $t,T=new N(1,1,1),C=new qs(_.geometry,_.material,u);for(let A=0;A<u;A++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,A),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,A),c.SCALE&&T.fromBufferAttribute(c.SCALE,A),C.setMatrixAt(A,y.compose(m,p,T));for(let A in c)if(A==="_COLOR_0"){let b=c[A];C.instanceColor=new oi(b.array,b.itemSize,b.normalized)}else A!=="TRANSLATION"&&A!=="ROTATION"&&A!=="SCALE"&&_.geometry.setAttribute(A,c[A]);rt.prototype.copy.call(C,_),this.parser.assignFinalMaterial(C),f.push(C)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},Yu="glTF",vr=12,Gu={JSON:1313821514,BIN:5130562},Bl=class{constructor(e){this.name=ke.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,vr),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Yu)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let s=this.header.length-vr,r=new DataView(e,vr),a=0;for(;a<s;){let o=r.getUint32(a,!0);a+=4;let c=r.getUint32(a,!0);if(a+=4,c===Gu.JSON){let l=new Uint8Array(e,vr+a,o);this.content=n.decode(l)}else if(c===Gu.BIN){let l=vr+a;this.body=e.slice(l,l+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},Ml=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ke.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},c={},l={};for(let h in a){let d=Cl[h]||h.toLowerCase();o[d]=a[h]}for(let h in e.attributes){let d=Cl[h]||h.toLowerCase();if(a[h]!==void 0){let u=n.accessors[e.attributes[h]],f=Ts[u.componentType];l[d]=f.name,c[d]=u.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(d,u){s.decodeDracoFile(h,function(f){for(let _ in f.attributes){let y=f.attributes[_],m=c[_];m!==void 0&&(y.normalized=m)}d(f)},o,l,Ut,u)})})}},Sl=class{constructor(){this.name=ke.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},bl=class{constructor(){this.name=ke.KHR_MESH_QUANTIZATION}},Bo=class extends Tn{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let a=0;a!==s;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=o*2,l=o*3,h=s-t,d=(n-t)/h,u=d*d,f=u*d,_=e*l,y=_-l,m=-2*f+3*u,p=f-u,T=1-m,C=p-u+d;for(let A=0;A!==o;A++){let b=a[y+A+o],M=a[y+A+c]*h,E=a[_+A+o],x=a[_+A]*h;r[A]=T*b+C*M+m*E+p*x}return r}},J0=new $t,Tl=class extends Bo{interpolate_(e,t,n,s){let r=super.interpolate_(e,t,n,s);return J0.fromArray(r).normalize().toArray(r),r}},an={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Ts={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Wu={9728:ft,9729:pt,9984:ba,9985:vs,9986:Di,9987:gn},Xu={33071:sn,33648:is,10497:ai},nl={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Cl={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},mi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},j0={CUBICSPLINE:void 0,LINEAR:Ci,STEP:Ti},il={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Q0(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Ii({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:fn})),i.DefaultMaterial}function Oi(i,e,t){for(let n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Pn(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function e_(i,e,t){let n=!1,s=!1,r=!1;for(let l=0,h=e.length;l<h;l++){let d=e[l];if(d.POSITION!==void 0&&(n=!0),d.NORMAL!==void 0&&(s=!0),d.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);let a=[],o=[],c=[];for(let l=0,h=e.length;l<h;l++){let d=e[l];if(n){let u=d.POSITION!==void 0?t.getDependency("accessor",d.POSITION):i.attributes.position;a.push(u)}if(s){let u=d.NORMAL!==void 0?t.getDependency("accessor",d.NORMAL):i.attributes.normal;o.push(u)}if(r){let u=d.COLOR_0!==void 0?t.getDependency("accessor",d.COLOR_0):i.attributes.color;c.push(u)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(c)]).then(function(l){let h=l[0],d=l[1],u=l[2];return n&&(i.morphAttributes.position=h),s&&(i.morphAttributes.normal=d),r&&(i.morphAttributes.color=u),i.morphTargetsRelative=!0,i})}function t_(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function n_(i){let e,t=i.extensions&&i.extensions[ke.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+sl(t.attributes):e=i.indices+":"+sl(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+sl(i.targets[n]);return e}function sl(i){let e="",t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function El(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function i_(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var s_=new De,wl=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new $0,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,a=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;let c=o.match(/Version\/(\d+)/);s=n&&c?parseInt(c[1],10):-1,r=o.indexOf("Firefox")>-1,a=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&s<17||r&&a<98?this.textureLoader=new tr(this.options.manager):this.textureLoader=new ar(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new _s(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){let o={scene:a[0][s.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:s.asset,parser:n,userData:{}};return Oi(r,o,s),Pn(o,s),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(o)})).then(function(){for(let c of o.scenes)c.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){let a=t[s].joints;for(let o=0,c=a.length;o<c;o++)e[a[o]].isBone=!0}for(let s=0,r=e.length;s<r;s++){let a=e[s];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let s=n.clone(),r=(a,o)=>{let c=this.associations.get(a);c!=null&&this.associations.set(o,c);for(let[l,h]of a.children.entries())r(h,o.children[l])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let s=e(t[n]);if(s)return s}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let s=0;s<t.length;s++){let r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ke.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(r,a){n.load(Yn.resolveURL(t.uri,s.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){let t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){let a=nl[s.type],o=Ts[s.componentType],c=s.normalized===!0,l=new o(s.count*a);return Promise.resolve(new yt(l,a,c))}let r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(a){let o=a[0],c=nl[s.type],l=Ts[s.componentType],h=l.BYTES_PER_ELEMENT,d=h*c,u=s.byteOffset||0,f=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,_=s.normalized===!0,y,m;if(f&&f!==d){let p=Math.floor(u/f),T="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+p+":"+s.count,C=t.cache.get(T);C||(y=new l(o,p*f,s.count*f/h),C=new ls(y,f/h),t.cache.add(T,C)),m=new hs(C,c,u%f/h,_)}else o===null?y=new l(s.count*c):y=new l(o,u,s.count*c),m=new yt(y,c,_);if(s.sparse!==void 0){let p=nl.SCALAR,T=Ts[s.sparse.indices.componentType],C=s.sparse.indices.byteOffset||0,A=s.sparse.values.byteOffset||0,b=new T(a[1],C,s.sparse.count*p),M=new l(a[2],A,s.sparse.count*c);o!==null&&(m=new yt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let E=0,x=b.length;E<x;E++){let S=b[E];if(m.setX(S,M[E*c]),c>=2&&m.setY(S,M[E*c+1]),c>=3&&m.setZ(S,M[E*c+2]),c>=4&&m.setW(S,M[E*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=_}return m})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,a=t.images[r],o=this.textureLoader;if(a.uri){let c=n.manager.getHandler(a.uri);c!==null&&(o=c)}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){let s=this,r=this.json,a=r.textures[e],o=r.images[t],c=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);let u=(r.samplers||{})[a.sampler]||{};return h.magFilter=Wu[u.magFilter]||pt,h.minFilter=Wu[u.minFilter]||gn,h.wrapS=Xu[u.wrapS]||ai,h.wrapT=Xu[u.wrapT]||ai,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==ft&&h.minFilter!==pt,s.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(d=>d.clone());let a=s.images[e],o=self.URL||self.webkitURL,c=a.uri||"",l=!1;if(a.bufferView!==void 0)c=n.getDependency("bufferView",a.bufferView).then(function(d){l=!0;let u=new Blob([d],{type:a.mimeType});return c=o.createObjectURL(u),c});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(c).then(function(d){return new Promise(function(u,f){let _=u;t.isImageBitmapLoader===!0&&(_=function(y){let m=new Ct(y);m.needsUpdate=!0,u(m)}),t.load(Yn.resolveURL(d,r.path),_,void 0,f)})}).then(function(d){return l===!0&&o.revokeObjectURL(c),Pn(d,a),d.userData.mimeType=a.mimeType||i_(a.uri),d}).catch(function(d){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),d});return this.sourceCache[e]=h,h}assignTexture(e,t,n,s){let r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),r.extensions[ke.KHR_TEXTURE_TRANSFORM]){let o=n.extensions!==void 0?n.extensions[ke.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let c=r.associations.get(a);a=r.extensions[ke.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,c)}}return s!==void 0&&(a.colorSpace=s),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,n=e.material,s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+n.uuid,c=this.cache.get(o);c||(c=new ms,Ht.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(o,c)),n=c}else if(e.isLine){let o="LineBasicMaterial:"+n.uuid,c=this.cache.get(o);c||(c=new ps,Ht.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(o,c)),n=c}if(s||r||a){let o="ClonedMaterial:"+n.uuid+":";s&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let c=this.cache.get(o);c||(c=n.clone(),r&&(c.vertexColors=!0),a&&(c.flatShading=!0),s&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(o,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return Ii}loadMaterial(e){let t=this,n=this.json,s=this.extensions,r=n.materials[e],a,o={},c=r.extensions||{},l=[];if(c[ke.KHR_MATERIALS_UNLIT]){let d=s[ke.KHR_MATERIALS_UNLIT];a=d.getMaterialType(),l.push(d.extendParams(o,r,t))}else{let d=r.pbrMetallicRoughness||{};if(o.color=new we(1,1,1),o.opacity=1,Array.isArray(d.baseColorFactor)){let u=d.baseColorFactor;o.color.setRGB(u[0],u[1],u[2],Ut),o.opacity=u[3]}d.baseColorTexture!==void 0&&l.push(t.assignTexture(o,"map",d.baseColorTexture,Bt)),o.metalness=d.metallicFactor!==void 0?d.metallicFactor:1,o.roughness=d.roughnessFactor!==void 0?d.roughnessFactor:1,d.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(o,"metalnessMap",d.metallicRoughnessTexture)),l.push(t.assignTexture(o,"roughnessMap",d.metallicRoughnessTexture))),a=this._invokeOne(function(u){return u.getMaterialType&&u.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(u){return u.extendMaterialParams&&u.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=rn);let h=r.alphaMode||il.OPAQUE;if(h===il.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===il.MASK&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==pn&&(l.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new ze(1,1),r.normalTexture.scale!==void 0)){let d=r.normalTexture.scale;o.normalScale.set(d,d)}if(r.occlusionTexture!==void 0&&a!==pn&&(l.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==pn){let d=r.emissiveFactor;o.emissive=new we().setRGB(d[0],d[1],d[2],Ut)}return r.emissiveTexture!==void 0&&a!==pn&&l.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Bt)),Promise.all(l).then(function(){let d=new a(o);return r.name&&(d.name=r.name),Pn(d,r),t.associations.set(d,{materials:e}),r.extensions&&Oi(s,d,r),d})}createUniqueName(e){let t=nt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,s=this.primitiveCache;function r(o){return n[ke.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(c){return qu(c,o,t)})}let a=[];for(let o=0,c=e.length;o<c;o++){let l=e[o],h=n_(l),d=s[h];if(d)a.push(d.promise);else{let u;l.extensions&&l.extensions[ke.KHR_DRACO_MESH_COMPRESSION]?u=r(l):u=qu(new Ot,l,t),s[h]={primitive:l,promise:u},a.push(u)}}return Promise.all(a)}loadMesh(e){let t=this,n=this.json,s=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let c=0,l=a.length;c<l;c++){let h=a[c].material===void 0?Q0(this.cache):this.getDependency("material",a[c].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(c){let l=c.slice(0,c.length-1),h=c[c.length-1],d=[];for(let f=0,_=h.length;f<_;f++){let y=h[f],m=a[f],p,T=l[f];if(m.mode===an.TRIANGLES||m.mode===an.TRIANGLE_STRIP||m.mode===an.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new Ws(y,T):new wt(y,T),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===an.TRIANGLE_STRIP?p.geometry=tl(p.geometry,mr):m.mode===an.TRIANGLE_FAN&&(p.geometry=tl(p.geometry,Bs));else if(m.mode===an.LINES)p=new Ys(y,T);else if(m.mode===an.LINE_STRIP)p=new Ri(y,T);else if(m.mode===an.LINE_LOOP)p=new Ks(y,T);else if(m.mode===an.POINTS)p=new Zs(y,T);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&t_(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),Pn(p,r),m.extensions&&Oi(s,p,m),t.assignFinalMaterial(p),d.push(p)}for(let f=0,_=d.length;f<_;f++)t.associations.set(d[f],{meshes:e,primitives:f});if(d.length===1)return r.extensions&&Oi(s,d[0],r),d[0];let u=new Zt;r.extensions&&Oi(s,u,r),t.associations.set(u,{meshes:e});for(let f=0,_=d.length;f<_;f++)u.add(d[f]);return u})}loadCamera(e){let t,n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new vt(Dc.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new hi(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Pn(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){let r=s.pop(),a=s,o=[],c=[];for(let l=0,h=a.length;l<h;l++){let d=a[l];if(d){o.push(d);let u=new De;r!==null&&u.fromArray(r.array,l*16),c.push(u)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Xs(o,c)})}loadAnimation(e){let t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,a=[],o=[],c=[],l=[],h=[];for(let d=0,u=s.channels.length;d<u;d++){let f=s.channels[d],_=s.samplers[f.sampler],y=f.target,m=y.node,p=s.parameters!==void 0?s.parameters[_.input]:_.input,T=s.parameters!==void 0?s.parameters[_.output]:_.output;y.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",T)),l.push(_),h.push(y))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(d){let u=d[0],f=d[1],_=d[2],y=d[3],m=d[4],p=[];for(let C=0,A=u.length;C<A;C++){let b=u[C],M=f[C],E=_[C],x=y[C],S=m[C];if(b===void 0)continue;b.updateMatrix&&b.updateMatrix();let P=n._createAnimationTracks(b,M,E,x,S);if(P)for(let w=0;w<P.length;w++)p.push(P[w])}let T=new er(r,void 0,p);return Pn(T,s),T})}createNodeMesh(e){let t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){let a=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let c=0,l=s.weights.length;c<l;c++)o.morphTargetInfluences[c]=s.weights[c]}),a})}loadNode(e){let t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),a=[],o=s.children||[];for(let l=0,h=o.length;l<h;l++)a.push(n.getDependency("node",o[l]));let c=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(a),c]).then(function(l){let h=l[0],d=l[1],u=l[2];u!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(u,s_)});for(let f=0,_=d.length;f<_;f++)h.add(d[f]);if(h.userData.pivot!==void 0&&d.length>0){let f=h.userData.pivot,_=d[0];h.pivot=new N().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],_.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){let t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],a=r.name?s.createUniqueName(r.name):"",o=[],c=s._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&o.push(c),r.camera!==void 0&&o.push(s.getDependency("camera",r.camera).then(function(l){return s._getNodeRef(s.cameraCache,r.camera,l)})),s._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){o.push(l)}),this.nodeCache[e]=Promise.all(o).then(function(l){let h;if(r.isBone===!0?h=new us:l.length>1?h=new Zt:l.length===1?h=l[0]:h=new rt,h!==l[0])for(let d=0,u=l.length;d<u;d++)h.add(l[d]);if(r.name&&(h.userData.name=r.name,h.name=a),Pn(h,r),r.extensions&&Oi(n,h,r),r.matrix!==void 0){let d=new De;d.fromArray(r.matrix),h.applyMatrix4(d)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!s.associations.has(h))s.associations.set(h,{});else if(r.mesh!==void 0&&s.meshCache.refs[r.mesh]>1){let d=s.associations.get(h);s.associations.set(h,{...d})}return s.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],s=this,r=new Zt;n.name&&(r.name=s.createUniqueName(n.name)),Pn(r,n),n.extensions&&Oi(t,r,n);let a=n.nodes||[],o=[];for(let c=0,l=a.length;c<l;c++)o.push(s.getDependency("node",a[c]));return Promise.all(o).then(function(c){for(let h=0,d=c.length;h<d;h++){let u=c[h];u.parent!==null?r.add(Vu(u)):r.add(u)}let l=h=>{let d=new Map;for(let[u,f]of s.associations)(u instanceof Ht||u instanceof Ct)&&d.set(u,f);return h.traverse(u=>{let f=s.associations.get(u);f!=null&&d.set(u,f)}),d};return s.associations=l(r),r})}_createAnimationTracks(e,t,n,s,r){let a=[],o=e.name?e.name:e.uuid,c=[];function l(f){f.morphTargetInfluences&&c.push(f.name?f.name:f.uuid)}mi[r.path]===mi.weights?(l(e),e.isGroup&&e.children.forEach(l)):c.push(o);let h;switch(mi[r.path]){case mi.weights:h=Wn;break;case mi.rotation:h=Xn;break;case mi.translation:case mi.scale:h=ci;break;default:switch(n.itemSize){case 1:h=Wn;break;case 2:case 3:default:h=ci;break}break}let d=s.interpolation!==void 0?j0[s.interpolation]:Ci,u=this._getArrayFromAccessor(n);for(let f=0,_=c.length;f<_;f++){let y=new h(c[f]+"."+mi[r.path],t.array,u,d);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(y),a.push(y)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=El(t.constructor),s=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let s=this instanceof Xn?Tl:Bo;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function r_(i,e,t){let n=e.attributes,s=new Ft;if(n.POSITION!==void 0){let o=t.json.accessors[n.POSITION],c=o.min,l=o.max;if(c!==void 0&&l!==void 0){if(s.set(new N(c[0],c[1],c[2]),new N(l[0],l[1],l[2])),o.normalized){let h=El(Ts[o.componentType]);s.min.multiplyScalar(h),s.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let o=new N,c=new N;for(let l=0,h=r.length;l<h;l++){let d=r[l];if(d.POSITION!==void 0){let u=t.json.accessors[d.POSITION],f=u.min,_=u.max;if(f!==void 0&&_!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(_[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(_[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(_[2]))),u.normalized){let y=El(Ts[u.componentType]);c.multiplyScalar(y)}o.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(o)}i.boundingBox=s;let a=new Vt;s.getCenter(a.center),a.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=a}function qu(i,e,t){let n=e.attributes,s=[];function r(a,o){return t.getDependency("accessor",a).then(function(c){i.setAttribute(o,c)})}for(let a in n){let o=Cl[a]||a.toLowerCase();o in i.attributes||s.push(r(n[a],o))}if(e.indices!==void 0&&!i.index){let a=t.getDependency("accessor",e.indices).then(function(o){i.setIndex(o)});s.push(a)}return Oe.workingColorSpace!==Ut&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Oe.workingColorSpace}" not supported.`),Pn(i,e),r_(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?e_(i,e.targets,t):i})}var Ku=Gl("Z2xURgIAAACk1gEAQAgAAEpTT057ImFzc2V0Ijp7ImdlbmVyYXRvciI6IkNPTExBREEyR0xURiIsInZlcnNpb24iOiIyLjAifSwic2NlbmUiOjAsInNjZW5lcyI6W3sibm9kZXMiOlswXX1dLCJub2RlcyI6W3siY2hpbGRyZW4iOlsyLDFdLCJtYXRyaXgiOlswLjAwOTk5OTk5OTc3NjQ4MjU4MiwwLjAsMC4wLDAuMCwwLjAsMC4wMDk5OTk5OTk3NzY0ODI1ODIsMC4wLDAuMCwwLjAsMC4wLDAuMDA5OTk5OTk5Nzc2NDgyNTgyLDAuMCwwLjAsMC4wLDAuMCwxLjBdfSx7Im1hdHJpeCI6Wy0wLjcyODk2ODY3OTkwNDkzNzcsMC4wLC0wLjY4NDU0NzA2NjY4ODUzNzYsMC4wLC0wLjQyNTIwNDkwMjg4NzM0NDM4LDAuNzgzNjkzNDMyODA3OTIyNCwwLjQ1Mjc5NzI5MzY2MzAyNDksMC4wLDAuNTM2NDc1MDYyMzcwMzAwMywwLjYyMTE0NzgxMTQxMjgxMTMsLTAuNTcxMjg3OTg5NjE2Mzk0LDAuMCw0MDAuMTEzMDA2NTkxNzk2OSw0NjMuMjY0MDA3NTY4MzU5NCwtNDMxLjA3ODAzMzQ0NzI2NTYsMS4wXSwiY2FtZXJhIjowfSx7Im1lc2giOjB9XSwiY2FtZXJhcyI6W3sicGVyc3BlY3RpdmUiOnsiYXNwZWN0UmF0aW8iOjEuNSwieWZvdiI6MC42NjA1OTI1NTU5OTk3NTU5LCJ6ZmFyIjoxMDAwMC4wLCJ6bmVhciI6MS4wfSwidHlwZSI6InBlcnNwZWN0aXZlIn1dLCJtZXNoZXMiOlt7InByaW1pdGl2ZXMiOlt7ImF0dHJpYnV0ZXMiOnsiTk9STUFMIjoxLCJQT1NJVElPTiI6MiwiVEVYQ09PUkRfMCI6M30sImluZGljZXMiOjAsIm1vZGUiOjQsIm1hdGVyaWFsIjowfV0sIm5hbWUiOiJMT0Qzc3BTaGFwZSJ9XSwiYWNjZXNzb3JzIjpbeyJidWZmZXJWaWV3IjowLCJieXRlT2Zmc2V0IjowLCJjb21wb25lbnRUeXBlIjo1MTIzLCJjb3VudCI6MTI2MzYsIm1heCI6WzIzOThdLCJtaW4iOlswXSwidHlwZSI6IlNDQUxBUiJ9LHsiYnVmZmVyVmlldyI6MSwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjIzOTksIm1heCI6WzAuOTk5NTk4OTc5OTQ5OTUxMiwwLjk5OTU4MDk3OTM0NzIyOSwwLjk5ODQzNTk3NDEyMTA5MzhdLCJtaW4iOlstMC45OTkwODM5OTU4MTkwOTE4LC0xLjAsLTAuOTk5ODMxOTc0NTA2Mzc4Ml0sInR5cGUiOiJWRUMzIn0seyJidWZmZXJWaWV3IjoxLCJieXRlT2Zmc2V0IjoyODc4OCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjIzOTksIm1heCI6Wzk2LjE3OTkwMTEyMzA0Njg4LDE2My45NzAwMDEyMjA3MDMxMyw1My45MjUxOTc2MDEzMTgzNl0sIm1pbiI6Wy02OS4yOTg1MDAwNjEwMzUxNiw5LjkyOTM2OTkyNjQ1MjYzNywtNjEuMzI4MTk3NDc5MjQ4MDVdLCJ0eXBlIjoiVkVDMyJ9LHsiYnVmZmVyVmlldyI6MiwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjIzOTksIm1heCI6WzAuOTgzMzQ1OTg1NDEyNTk3NywwLjk4MDAzNjk3Mzk1MzI0NzFdLCJtaW4iOlswLjAyNjQwOTAwMDE1ODMwOTkzOCwwLjAxOTk2MzAyNjA0Njc1MjkzXSwidHlwZSI6IlZFQzIifV0sIm1hdGVyaWFscyI6W3sicGJyTWV0YWxsaWNSb3VnaG5lc3MiOnsiYmFzZUNvbG9yVGV4dHVyZSI6eyJpbmRleCI6MH0sIm1ldGFsbGljRmFjdG9yIjowLjB9LCJlbWlzc2l2ZUZhY3RvciI6WzAuMCwwLjAsMC4wXSwibmFtZSI6ImJsaW5uMy1meCJ9XSwidGV4dHVyZXMiOlt7InNhbXBsZXIiOjAsInNvdXJjZSI6MH1dLCJpbWFnZXMiOlt7ImJ1ZmZlclZpZXciOjMsIm1pbWVUeXBlIjoiaW1hZ2UvcG5nIn1dLCJzYW1wbGVycyI6W3sibWFnRmlsdGVyIjo5NzI5LCJtaW5GaWx0ZXIiOjk5ODYsIndyYXBTIjoxMDQ5Nywid3JhcFQiOjEwNDk3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IAAgACoAHwAqACkAKwArACkALAAtACkAKAAoACkAIAApAC0ALAAsAC0ALgAvADAAMQAxADAAMgAyADAALAAsADAAKwAzADIALgAuADIALAAzADQAMgAyADQAMQA1ADYANwA3ADYAOAA2AC8AOAA4AC8AMQA0ADkAMQAxADkAOAA5ADoAOAA4ADoANwA7ADwAPQA9ADwAPgA8ADUAPgA+ADUANwA6AD8ANwA3AD8APgA/AEAAPgA+AEAAPQBBAEIAQwBDAEIARABDAEQARQBFAEQARgBEAEcARgBGAEcASABHAEQASQBJAEQAQgBKAEsATABMAEsATQBLAEoATgBOAEoATwBKAEMATwBPAEMARQBDAEoAQQBBAEoATABPAFAATgBOAFAAUQBPAEUAUABQAEUAUgBTAFQAVQBVAFQAVgBXAFgAWQBZAFgAWgBYAFsAWgBaAFsAXABUAFMAXQBdAFMAXgBfAGAAYQBhAGAAYgBgAFMAYgBiAFMAVQBTAGAAXgBeAGAAYwBgAF8AYwBjAF8AZABlAGYAZABkAGYAYwBmAGcAYwBjAGcAXgBnAGYAaABoAGYAaQBmAGUAaQBpAGUAagBrAGwAbQBtAGwAbgBuAGwAbwBvAGwAcABsAGUAcABwAGUAZABsAGsAZQBlAGsAagBxABgAIwAjABgAFAAYAHEAGQAZAHEAcgBxAHMAcgByAHMAdABzAHEAJQAlAHEAIwB1AHYAdwB3AHYAeAB2AHkAeAB4AHkAegAkAHsAJQAlAHsAfAB7AH0AfAB8AH0AfgB9AHsAfwB/AHsAgAB7ACQAgACAACQAJgBzAIEAdAB0AIEAggCBAIMAggCCAIMAhACDAIEAfgB+AIEAfACBAHMAfAB8AHMAJQCFAIYAhwCHAIYAiAB5AIUAegB6AIUAhwCJAIoAiwCLAIoAjACNAI4ATQBNAI4ATACOAI8ATABMAI8AQQCQAJEAkgCSAJEAkwCRAJQAkwCTAJQAlQCWAJcAmACYAJcAmQCXADsAmQCZADsAPQCaAJsASQBJAJsARwCbAJwARwBHAJwASACcAJsAlgCWAJsAlwCbAJoAlwCXAJoAOwBAAJ0APQA9AJ0AmQCdAJ4AmQCZAJ4AmACfAFIARgBGAFIARQBGAEgAnwCfAEgAoAChAKIAXABcAKIAWgCiAKMAWgBaAKMAWQCjAKIAlQCVAKIAkwCiAKEAkwCTAKEAkgCkAKUApgCmAKUApwClAKgApwCnAKgAqQCoAKUAbwBvAKUAbgClAKQAbgBuAKQAbQCqAKsAoQChAKsAkgCsAK0AaABoAK0AZwCtAF0AZwBnAF0AXgBbAKoAXABcAKoAoQBwAK4AbwBvAK4AqACoAK4AqQCpAK4ArwCuAF8ArwCvAF8AYQBfAK4AZABkAK4AcACeALAAmACYALAAsQCwALIAsQCxALIAswC0ALUAtgC2ALUAoAC1ALQAtwC3ALQAuAC0ALkAuAC4ALkAugC5ALQAlgCWALQAtgC6ALkAswCzALkAsQCxALkAmACYALkAlgC1ALsAoACgALsAnwC7ALwAnwCfALwAUgC8ALsAvQC9ALsAvgC7ALUAvgC+ALUAtwC/AMAADwAPAMAADgDBAMIAwwDDAMIAxADCAL8AxADEAL8ADwDFAMYAAwADAMYAAgDAAMcADgAOAMcAGwDIAMkAxADEAMkAwwDJAMgAygDKAMgAywDIAAoAywDLAAoADAAKAMgADwAPAMgAxADGAMwAAgACAMwAEQDMAM0AEQARAM0AFQDOAM8A0ADQAM8A0QDPANIA0QDRANIA0wDUANUA1gDWANUA1wDVANQA2ADYANQA2QDSANoA0wDTANoA2wDbANoA3ADcANoA3QDeAN8A4ADgAN8A4QDfANYA4QDhANYA1wDiAOMA3QDdAOMA3ADjAOIA5ADkAOIA5QDmAOcA6ADoAOcA6QDnAN4A6QDpAN4A4ADqAJoA6wDrAJoASQCaAOoAOwA7AOoAPADqAOwAPAA8AOwANQCcALYASABIALYAoAC2AJwAlgDsAO0ANQA1AO0ANgDtAO4ANgA2AO4ALwDuAO8ALwAvAO8AMAAwAO8AKwArAO8A8ADxACoA8ADwACoAKwAqAPEAHwAfAPEA8gDzAPQAywDLAPQAygDzAB0A8gDyAB0AHwAdAPMADAAMAPMAywDNAPUAFQAVAPUAIgD1APYAIgAiAPYAJgD2APcAJgAmAPcAgAD3APgAgACAAPgAfwD5APoA+wD7APoA/AD4APkAfwB/APkA+wD9AP4A+gD6AP4A/AD+AP0A/wD/AP0AiQAAAQEBhgCGAAEBiAACAQMBAAEAAQMBAQGLAI8AiQCJAI8A/wAEAUIAiwBCAEEAiwCLAEEAjwAFAQYB9wD3AAYB+AAHAQgBCQEJAQgBCgELAQcBDAEMAQcBCQENAQUB9gD2AAUB9wAOAQ8B+QD5AA8B+gAQAREBEgESAREBEwEIARABCgEKARABEgEGAQ4B+AD4AA4B+QDzABQB9AD0ABQBFQEWARcBGAEYARcBGQEaARsBHAEcARsBHQEUAfMAHgEeAfMA8gAfAQ0B9QD1AA0B9gAgAQsBIQEhAQsBDAHxACIB8gDyACIBHgEcAR0BIwEjAR0BJAEjASQBJQElASQBJgEiAfEAJwEnAfEA8ADvACgB8ADwACgBJwElASYBKQEpASYBKgErASkBLAEsASkBKgEtASgB7gDuACgB7wAuAS8B6gDqAC8B7AAwATEBMgEyATEBMwE0ATUBNgE2ATUBNwE4AS4B6wDrAC4B6gA5AS0B7QDtAC0B7gA6ASsBOwE7ASsBLAExAToBMwEzAToBOwEvATkB7ADsADkB7QD9ADwBiQCJADwBigA9AT4BPwE/AT4BQAE/AUABEQERAUABEwE8Af0ADwEPAf0A+gBBAUIBPQE9AUIBPgFDAUQBQQFBAUQBQgFFAUYBegB6AEYBeAB3AHgARwFHAXgARgFIAUkBiACIAEkBhwB6AIcARQFFAYcASQFKAc4ASwFLAc4A0ADZAEwB2ADYAEwBTQFHAU4BdwB3AE4BdQDYAE0B1QDVAE0BTwHVAE8B1wDXAE8BUAHXAFAB4QDhAFABUQHgAOEAUgFSAeEAUQFTAVQB6ADoAFQB5gDkAOUAVQFVAeUAVgFSAVcB4ADgAFcB6QDoAOkAUwFTAekAVwFYAQEBWQFZAQEBAwFIAYgAWAFYAYgAAQFZAQMBWgFaAQMBAgFaAQIBWwFbAQIBXAFcAeQAWwFbAeQAVQEAAV0BAgECAV0BXAHjAF0B3ADcAF0BXgFfAV4BhQCFAF4BhgBfAWAB2wDbAGAB0wBhAWABdgB2AGABeQBhAWIB0QDRAGIB0ABiAXUAYwFjAXUATgFiAWMB0ADQAGMBSwFkASABZQFlASABIQFmAWcBFQEVAWcB9ABnAWgB9AD0AGgBygBpAWgBzADMAGgBzQDJAGkBwwDDAGkBagFrAWoBxQDFAGoBxgAQAQgBSQFJAQgBRQERARABSAFIARABSQELASABRwFHASABTgEIAQcBRQFFAQcBRgEHAQsBRgFGAQsBRwFYAT8BSAFIAT8BEQE/AVgBPQE9AVgBWQEgAWQBTgFOAWQBYwEXARYBZQFlARYBZAFPASMBUAFQASMBJQEjAU8BHAEcAU8BTQEYAUoBFgEWAUoBSwFMARoBTQFNARoBHAEpAVEBJQElAVEBUAEpASsBUQFRASsBUgErAToBUgFSAToBVwE6ATEBVwFXATEBUwFDATQBRAFEATQBNgE0AUMBVQFVAUMBWwExATABUwFTATABVAE1ATQBVgFWATQBVQFaAUEBWQFZAUEBPQEaAGwBHAAcAGwBbQFsARoAbgFuARoAGwAnAG8BKAAoAG8BcAFvAScAbQFtAScAHAAtAHEBLgAuAHEBcgFxAS0AcAFwAS0AKABzAXQBMwAzAHQBNAByAXMBLgAuAHMBMwB1AXYBOQA5AHYBOgB0AXUBNAA0AHUBOQB3AXgBPwA/AHgBQAB2AXcBOgA6AHcBPwB5AXoBnQCdAHoBngCdAEAAeQF5AUAAeAF7AXwBsACwAHwBsgCwAJ4AewF7AZ4AegHHAH0BGwAbAH0BbgF+AVAAvAC8AFAAUgBQAH4BUQBRAH4BfwF+AYABfwF/AYABgQF+AbwAgAGAAbwAvQCCAYMBvQC9AIMBgAGDAYQBgAGAAYQBgQGEAYMBhQGFAYMBhgGDAYIBhgGGAYIBhwGIAYkBtwC3AIkBvgCJAYIBvgC+AIIBvQCCAYkBhwGHAYkBigGJAYgBigGKAYgBiwGMAYgBuAC4AIgBtwCIAYwBiwGLAYwBjQGNAYwBjgGOAYwBjwGMAbgAjwGPAbgAugCOAY8BkAGQAY8BkQGPAboAkQGRAboAswCyAJIBswCzAJIBkQGRAZIBkAGQAZIBkwF8AZQBsgCyAJQBkgGUAZUBkgGSAZUBkwGLAIwABAEEAYwAlgEEAesAQgBCAOsASQCWATgBBAEEATgB6wBqAWsBwwDDAGsBwQBqAWkBxgDGAGkBzADKAGgByQDJAGgBaQFoAWcBzQDNAGcB9QD1AGcBHwEfAWcBZgFjAWQBSwFLAWQBFgFiAWEBdQB1AGEBdgBgAWEB0wDTAGEB0QBgAV8BeQB5AF8BhQDcAF4B2wDbAF4BXwGGAF4BAAEAAV4BXQHkAFwB4wDjAFwBXQFbAUMBWgFaAUMBQQEIAAkAlwGXAQkAmAEJABcAmAGYARcAmQEXABkAmQGZARkAmgFsAZsBbQFtAZsBnAFuAZ0BbAFsAZ0BmwFvAZ4BcAFwAZ4BnwFvAW0BngGeAW0BnAFxAaABcgFyAaABoQFwAZ8BcQFxAZ8BoAFzAaIBdAF0AaIBowFyAaEBcwFzAaEBogF1AaQBdgF2AaQBpQF0AaMBdQF1AaMBpAF4AXcBpgGmAXcBpwF2AaUBdwF3AaUBpwGoAakBqgGqAakBqwGsAa0BqAGoAa0BqQGuAa8BrAGsAa8BrQFVAFYAsAGwAVYAsQGyAbMBtAG0AbMBtQFhAGIAtgG2AWIAtwFiAFUAtwG3AVUAsAEZAHIAmgGaAXIAuAG5AboBuwG7AboBvAG9Ab4BvwG/Ab4BwAGqAasBwQHBAasBwgF5AcMBegF6AcMBxAF4AaYBeQF5AaYBwwHFAcYBtQG1AcYBtAG/AcABxQHFAcABxgGmAKcAxwHHAacAyAGnAKkAyAHIAakAyQGpAK8AyQHJAa8AygGvAGEAygHKAWEAtgF7AcsBfAF8AcsBzAF6AcQBewF7AcQBywHNAc4BrgGuAc4BrwHPAdABzQHNAdABzgF9AdEBbgFuAdEBnQHSAdMBzwHPAdMB0AHUAdUB0gHSAdUB0wGVAZQB1gHWAZQB1wGUAXwB1wHXAXwBzAHYAdkB2gHaAdkB2wHcAdgB3QHdAdgB2gHeAdwB3wHfAdwB3QHgAd4B4QHhAd4B3wHiAeMB5AHkAeMB5QHjAeYB5QHlAeYB5wHZAdgB6AHoAdgB6QHYAdwB6QHpAdwB6gHrAewB6gHqAewB6QHsAe0B6QHpAe0B6AHcAd4B6gHqAd4B7gHeAeAB7gHuAeAB7wHwAfEB7wHvAfEB7gHxAesB7gHuAesB6gHmAeMB8gHyAeMB8wHjAeIB8wHzAeIB9AH1AfYB9wH3AfYB+AH2AeIB+AH4AeIB5AHtAewB+QH5AewB+gHsAesB+gH6AesB+wH8Af0B+wH7Af0B+gH9Af4B+gH6Af4B+QHiAfYB9AH0AfYB/wH2AfUB/wH/AfUBAAIBAvUBAgICAvUB9wEDAgECBAIEAgECAgL1AQECAAIAAgECBQIBAgMCBQIFAgMCBgIHAggCCQIJAggCCgIKAgMCCQIJAgMCBAIDAgoCBgIGAgoCCwIIAgwCCgIKAgwCCwINAg4CDwIPAg4CEAIIAgcCEAIQAgcCDwIMAggCEQIRAggCEAIOAhICEAIQAhICEQITAhQCFQIVAhQCFgIOAg0CFgIWAg0CFQISAg4CFwIXAg4CFgIUAhgCFgIWAhgCFwIZAhoCGwIbAhoCHAIaAh0CHAIcAh0CHgIfAiACHgIeAiACHAIgAiECHAIcAiECGwIiAiMCJAIkAiMCJQIjAiYCJQIlAiYCJwIdAhoCJwInAhoCJQIaAhkCJQIlAhkCJAInAiYCKAIoAiYCKQInAigCHQIdAigCKgIrAiwCLQItAiwCLgIvAjACMQIxAjACMgIzAjQCMgIyAjQCMQI1AisCNgI2AisCLQI3AjgCOQI5AjgCOgIsAisCOgI6AisCOQIrAjUCOQI5AjUCOwI8AjcCOwI7AjcCOQI9AjwCPgI+AjwCOwI1Aj8COwI7Aj8CPgI/AkACPgI+AkACQQJCAj0CQQJBAj0CPgJDAkQCRQJFAkQCRgJGAkcCRQJFAkcCSAI8Aj0CSAJIAj0CRQJCAkMCPQI9AkMCRQLrAfEB+wH7AfEBSQLxAfABSQJJAvABSgJLAkwCSgJKAkwCSQJMAvwBSQJJAvwB+wFNAk4CTwJPAk4CUAJRAlICUAJQAlICTwL9AfwBUwJTAvwBVAJVAlYCVAJUAlYCUwJWAlcCUwJTAlcCWAL+Af0BWAJYAv0BUwJMAksCWQJZAksCWgJbAlwCWgJaAlwCWQJcAlUCWQJZAlUCVAL8AUwCVAJUAkwCWQJdAl4CXwJfAl4CYAJSAlECYAJgAlECXwJhAmICYwJjAmICZAJlAiICZgJmAiICJAIZAmcCJAIkAmcCZgJoAmkCagJqAmkCawJsAm0CawJrAm0CagJuAm8CcAJwAm8CcQIUAhMCcQJxAhMCcAJyAiECcwJzAiECIAIfAnQCIAIgAnQCcwJ0Am4CcwJzAm4CcAITAnICcAJwAnICcwIYAhQCdQJ1AhQCcQJvAnYCcQJxAnYCdQJ3Ah4CKgIqAh4CHQJ4Ah8CdwJ3Ah8CHgJ5AjMCegJ6AjMCMgIwAnsCMgIyAnsCegJ7AmwCegJ6AmwCawJpAnkCawJrAnkCegJ8An0CfgJ+An0CfwKAAoECfwJ/AoECfgKBAkcCfgJ+AkcCRgJEAnwCRgJGAnwCfgJ5AmkCggKCAmkCgwJAAj8ChAKEAj8ChQI1AjYCPwI/AjYChQI0AjMCggKCAjMCeQJHAoECSAJIAoEChgKBAoAChgKGAoAChwI4AjcChwKHAjcChgI3AjwChgKGAjwCSAJ2Am8CiAKIAm8CiQKKAosCiQKJAosCiAJ4AowCjQKNAowCjgKMAo8CjgKOAo8CkAKQApECjgKOApECkgKSAm4CjgKOAm4CjQKRAooCkgKSAooCiQJvAm4CiQKJAm4CkgKMAngCkwKTAngCdwIqApQCdwJ3ApQCkwKUApUCkwKTApUClgKPAowClgKWAowCkwLmAZcC5wHnAZcCmAKZApoCmwKbApoCnALnAZgCnAKcApgCmwLZAZ0C2wHbAZ0CngKXAuYBnwKfAuYB8gGaAqACnAKcAqACoQKgAqICoQKhAqICowLkAeUBowKjAuUBoQLlAecBoQKhAucBnAKdAtkBpAKkAtkB6AHtAaUC6AHoAaUCpAKmAqcCqAKoAqcCqQKqAqsCqQKpAqsCqAKsAq0CrgKuAq0CrwKtArACrwKvArACsQKrAqoCsgKyAqoCswK0ArUCswKzArUCsgK2ArcCuAK4ArcCuQK5AqwCuAK4AqwCrgK1ArQCugK6ArQCuwK7ArwCugK6ArwCvQK+Ar8CwALAAr8CwQK3ArYCwQLBArYCwAIhAnICwgLCAnICwwJyAhMCwwLDAhMCFQINAsQCFQIVAsQCwwIfAngCdAJ0AngCjQKNAm4CdALEAg0CxQLFAg0CDwIHAsYCDwIPAsYCxQLGAgcCxwLHAgcCCQIJAgQCxwLHAgQCyAIEAgICyALIAgICyQICAvcByQLJAvcBygKiAssCowKjAssCzAL3AfgBygLKAvgBzAL4AeQBzALMAuQBowKlAu0BzQLNAu0B+QH+Ac4C+QH5Ac4CzQLOAv4BzwLPAv4BWAJXAtACWAJYAtACzwLRAtIC0wLTAtIC1ALQAlcC1ALUAlcC0wLRAtUC0gLSAtUC1gLVAtcC1gLWAtcCZAJdAtgCXgJeAtgC2QLaAtkC2wLbAtkC2ALXAmcCZAJkAmcCYwLcAmMCGwJjAmcCGwJnAhkCGwLQAt0CzwLPAt0C3gLfAuAC4QLhAuAC4gLjAuQC3wLfAuQC4ALlAs4C3gLeAs4CzwLSAuYC1ALUAuYC5wLoAukC6gLqAukC6wLhAuIC6ALoAuIC6QLdAtAC5wLnAtAC1ALMAssC7ALsAssC7QLuAu8C8ALwAu8C8QLyAvMC9AL0AvMC9QLKAswC9gL2AswC7ALOAuUCzQLNAuUC9wL4AvkC4wLjAvkC5ALJAsoC+gL6AsoC9gLzAvsC9QL1AvsC/AL7Av0C/AL8Av0C/gLIAskC/wL/AskC+gLHAsgCAAMAA8gC/wL9AgED/gL+AgEDAgMDAwQDAQMBAwQDAgMFA8YCAAMAA8YCxwLEAgYDwwLDAgYDBwMIAwkDCgMKAwkDCwMMAw0DDgMOAw0DDwMQA8ICBwMHA8ICwwLGAgUDxQLFAgUDEQMSAxMDAwMDAxMDBAMKAwsDEgMSAwsDEwMGA8QCEQMRA8QCxQLWAmQCFAMUA2QCYgIVAxYDFwMXAxYDGAMWA+oCGAMYA+oC6wLSAtYC5gLmAtYCFAMZAxUDGgMaAxUDFwMbAxkDHAMcAxkDGgMdA1ECHgMeA1ECUAIeA1ACHwMfA1ACTgIgA10CIQMhA10CXwIhA18CHQMdA18CUQIiAyMDpgKmAiMDpwKxArACJAMkA7ACJQMfA04CJgMmA04CTQInAyUDrQKtAiUDsAKtAqwCJwMnA6wCKAMpAygDuQK5AigDrAIpA7kCKgMqA7kCtwIrA78CLAMsA78CvgItA70CLgMuA70CvAIqA7cCLwMvA7cCwQIvA8ECKwMrA8ECvwIwAzED2ALYAjED2wLYAl0CMAMwA10CIAMxAzID2wLbAjID2gIyAzMD2gLaAjMDNAMuA7wCMwMzA7wCNAPZAtoCNQM1A9oCNAO0AjYDuwK7AjYDNQNeAjYDYAJgAjYDNwOqAjgDswKzAjgDNwNSAjgDTwJPAjgDOQOnAjoDqQKpAjoDOQMmA00COwM7A00COgMjAzsDpwKnAjsDOgP5AvgCPAM8A/gCPQPLAj4D7QLtAj4DPwOiAkADywLLAkADPgOlAkADpAKkAkADQQOgApoCQQNBA5oCQgOdAkIDngKeAkIDQwMdA+ECIQMhA+EC6ALqAiAD6ALoAiADIQPjAh8D+AL4Ah8DJgPhAh0D3wLfAh0DHgMfA+MCHgMeA+MC3wIwAyADFgMWAyAD6gIxAzADFQMVAzADFgP4AiYDPQM9AyYDOwM9A+4CPAM8A+4C8AInAygD+wL7AigD/QIlAycD8wLzAicD+wIjAyID7gLuAiID7wIkAyUD8gLyAiUD8wIoAykD/QL9AikDAQMqAwMDKQMpAwMDAQMDAyoDEgMSAyoDLwMrAwoDLwMvAwoDEgMbAxwDDAMMAxwDDQMMAy4DGwMbAy4DMwMKAysDCAMIAysDLAMuAwwDLQMtAwwDDgMyAzEDGQMZAzEDFQNEA+ABRQNFA+AB4QHgAUQD7wHvAUQDRgNHA/ABRgNGA/AB7wHzAfQBmwGbAfQBnAHyAfMBnQGdAfMBmwH/AQACngGeAQACnwH0Af8BnAGcAf8BngEGAqEBBQIFAqEBoAEAAgUCnwGfAQUCoAEMAqMBCwILAqMBogGhAQYCogGiAQYCCwISAqUBEQIRAqUBpAGjAQwCpAGkAQwCEQIYAqYBFwIXAqYBpwGlARICpwGnARICFwIjAiICqQGpASICqwEmAiMCrQGtASMCqQEmAq0BKQIpAq0BrwEsAkgDLgIuAkgDSQO0ATACsgGyATACLwI4AkoDOgI6AkoDSwNIAywCSwNLAywCOgLwAUcDSgJKAkcDTAO5AUsCTANMA0sCSgJLArkBWgJaArkBuwFNA1sCuwG7AVsCWgJsAsABbQJtAsABvgGrASICwgHCASICZQJ2AsQBdQJ1AsQBwwF1AsMBGAIYAsMBpgF7AjACxgHGATACtAFsAnsCwAHAAXsCxgF9Ak4DfwJ/Ak4DTwNQA4ACTwNPA4ACfwKAAlADhwKHAlADUQNKAzgCUQNRAzgChwKLAswBiAKIAswBywGIAssBdgJ2AssBxAEpAq8BUgNSA68BzgHQAVMDzgHOAVMDUgOfAvIB0QHRAfIBnQEqAigClAKUAigCVAMoAikCVANUAykCUgNTA1UDUgNSA1UDVANVA5UCVANUA5UClAJTA9ABVgNWA9AB0wFXA1YD1QHVAVYD0wGVAlUDWANYA1UDWQNVA1MDWQNZA1MDVgNXA1oDVgNWA1oDWQNbA1gDWgNaA1gDWQNcA48CXQNdA48ClgKWApUCXQNdA5UCWANbA14DWANYA14DXQNeA18DXQNdA18DXAOQAo8CYANgA48CXANfA2EDXANcA2EDYANhA2IDYANgA2IDYwORApACYwNjA5ACYANiA2QDYwNjA2QDZQOKApECZQNlA5ECYwOLAooCZgNmA4oCZQNkA2cDZQNlA2cDZgPMAYsC1wHXAYsCZgNnA9YBZgNmA9YB1wFoA2kDagNqA2kDawNsA20DaANoA20DaQNuA28DbANsA28DbQNwA3EDbgNuA3EDbwNyA3MDcANwA3MDcQN0A3UDcgNyA3UDcwN2A3cDdAN0A3cDdQN4A3kDdgN2A3kDdwN4A3oDeQN5A3oDewN6A3wDewN7A3wDfQN+A38DfAN8A38DfQOAA4EDfgN+A4EDfwOCA4MDhAOEA4MDhQNpA4YDawNrA4YDhwNtA4gDaQNpA4gDhgNvA4kDbQNtA4kDiANxA4oDbwNvA4oDiQNzA4sDcQNxA4sDigN1A4wDcwNzA4wDiwN3A40DdQN1A40DjAN5A44DdwN3A44DjQN5A3sDjgOOA3sDjwN7A30DjwOPA30DkAN/A5EDfQN9A5EDkAOSA4EDkwOTA4EDhQOGA5QDhwOHA5QDlQOIA5YDhgOGA5YDlAOJA5cDiAOIA5cDlgOKA5gDiQOJA5gDlwOLA5kDigOKA5kDmAOMA5oDiwOLA5oDmQONA5sDjAOMA5sDmgOOA5wDjQONA5wDmwOOA48DnAOcA48DnQOQA54DjwOPA54DnQORA58DkAOQA58DngOgA5IDoQOhA5IDkwOVA5QDogOiA5QDowOWA6QDlAOUA6QDowOXA6UDlgOWA6UDpAOYA6YDlwOXA6YDpQOZA6cDmAOYA6cDpgOaA6gDmQOZA6gDpwObA6kDmgOaA6kDqAOcA6oDmwObA6oDqQOcA50DqgOqA50DqwOeA6wDnQOdA6wDqwOfA60DngOeA60DrAOuA6ADrwOvA6ADoQOiA6MDsAOwA6MDsQOkA7IDowOjA7IDsQOlA7MDpAOkA7MDsgOmA7QDpQOlA7QDswOnA7UDpgOmA7UDtAOoA7YDpwOnA7YDtQOpA7cDqAOoA7cDtgOqA7gDqQOpA7gDtwOqA6sDuAO4A6sDuQOsA7oDqwOrA7oDuQOtA7sDrAOsA7sDugO8A64DvQO9A64DrwOwA7EDvgO+A7EDvwOyA8ADsQOxA8ADvwOzA8EDsgOyA8EDwAO0A8IDswOzA8IDwQO1A8MDtAO0A8MDwgO2A8QDtQO1A8QDwwO3A8UDtgO2A8UDxAO4A8YDtwO3A8YDxQO4A7kDxgPGA7kDxwO5A7oDxwPHA7oDyAO7A8kDugO6A8kDyAOHAbwDhgGGAbwDvQO+A78DygPKA78DywPAA8wDvwO/A8wDywPBA80DwAPAA80DzAPCA84DwQPBA84DzQPDA88DwgPCA88DzgPEA9ADwwPDA9ADzwPFA9EDxAPEA9ED0APGA9IDxQPFA9ID0QPGA8cD0gPSA8cD0wPHA8gD0wPTA8gD1APJA9UDyAPIA9UD1APKA8sD1gPWA8sD1wPMA9gDywPLA9gD1wPNA9kDzAPMA9kD2APOA9oDzQPNA9oD2QPPA9sDzgPOA9sD2gPQA9wDzwPPA9wD2wPRA90D0APQA90D3APSA94D0QPRA94D3QPSA9MD3gPeA9MD3wPTA9QD3wPfA9QD4APVA+ED1APUA+ED4APWA9cD4gPiA9cD4wPYA+QD1wPXA+QD4wPZA+UD2APYA+UD5APaA+YD2QPZA+YD5QPbA+cD2gPaA+cD5gPcA+gD2wPbA+gD5wPdA+kD3APcA+kD6APeA+oD3QPdA+oD6QPeA98D6gPqA98D6wPfA+AD6wPrA+AD7APhA+0D4APgA+0D7APiA+MD7gPuA+MD7wPkA/AD4wPjA/AD7wPlA/ED5APkA/ED8APmA/ID5QPlA/ID8QPnA/MD5gPmA/MD8gPoA/QD5wPnA/QD8wPpA/UD6APoA/UD9APpA+oD9QP1A+oD9gPqA+sD9gP2A+sD9wPrA+wD9wP3A+wD+APsA+0D+AP4A+0D+QPuA+8D+gP6A+8D+wPwA/wD7wPvA/wD+wPxA/0D8APwA/0D/APyA/4D8QPxA/4D/QPzA/8D8gPyA/8D/gP0AwAE8wPzAwAE/wP1AwEE9AP0AwEEAAT1A/YDAQQBBPYDAgT2A/cDAgQCBPcDAwT4AwQE9wP3AwQEAwT4A/kDBAQEBPkDBQT6A/sDBgQGBPsDBwT7A/wDBwQHBPwDCAT8A/0DCAQIBP0DCQT9A/4DCQQJBP4DCgT/AwsE/gP+AwsECgQABAwE/wP/AwwECwQBBA0EAAQABA0EDAQBBAIEDQQNBAIEDgQDBA8EAgQCBA8EDgQEBBAEAwQDBBAEDwQFBBEEBAQEBBEEEAQGBAcEEgQSBAcEEwQHBAgEEwQTBAgEFAQIBAkEFAQUBAkEFQQMBA0EFgQOBBcEDQQNBBcEFgQPBBgEDgQOBBgEFwQQBBkEDwQPBBkEGAQRBBoEEAQQBBoEGQQSBBMEGwQbBBMEHAQTBBQEHAQcBBQEHQQbBBwEHgQeBBwEHwQdBCAEHAQcBCAEHwQhBCIEGAQYBCIEFwQZBCMEGAQYBCMEIQQaBCQEGQQZBCQEIwQeBB8EJQQlBB8EJgQgBCcEHwQfBCcEJgQoBCIEKQQpBCIEIQQhBCMEKQQpBCMEKgQkBCsEIwQjBCsEKgQlBCYELAQsBCYELQQmBCcELQQtBCcELgQvBDAEKQQpBDAEKAQpBCoELwQvBCoEMQQrBDIEKgQqBDIEMQQsBC0EMwQzBC0ENAQtBC4ENAQ0BC4ENQQwBC8ENgQ2BC8ENwQvBDEENwQ3BDEEOAQxBDIEOAQ4BDIEOQQyBDoEOQQ5BDoEOwQ8BDoEPQQ9BDoEPgQzBDQEPwQ/BDQEQAQ0BDUEQARABDUEQQRCBEMERAREBEMERQRoA2oDRgRsA2gDRgRuA2wDRgRwA24DRgRyA3ADRgR0A3IDRgR2A3QDRgR4A3YDRgR6A3gDRgR8A3oDRgR+A3wDRgR+A0YEgAOCA4QDRgRHBEgESQRJBEgESgRJBEsERwRHBEsETARNBE4ESQRJBE4ESwRJBEoETQRNBEoETwRQBFEEUgRSBFEEUwRSBFQEUARQBFQEVQRHBEwEUgRSBEwEVARSBFMERwRHBFMESARWBFcEWARYBFcEWQRYBFoEVgRWBFoEWwRQBFUEWARYBFUEWgRYBFkEUARQBFkEUQRcBF0EXgReBF0EXwRfBGAEXgReBGAEYQRWBFsEXwRfBFsEYARfBF0EVgRWBF0EVwRiBGMEZARkBGMEZQRhBGIEXgReBGIEZARkBGUEZgRmBGUEZwRoBGkEagRqBGkEawRsBG0EawRrBG0EagRjBGwEZQRlBGwEawRpBGcEawRrBGcEZQRuBG8EcARwBG8EcQRyBHMEcQRxBHMEcARtBHIEagRqBHIEcQRvBGgEcQRxBGgEagR0BHUEdgR2BHUEdwR4BHkEdwR3BHkEdgRzBHgEcARwBHgEdwR1BG4EdwR3BG4EcAR6BHsEfAR8BHsEfQR+BH8EfQR9BH8EfAR5BH4EdgR2BH4EfQR7BHQEfQR9BHQEdgRNBE8EgASABE8EgQSABIIETQRNBIIETgR8BH8EgASABH8EggSABIEEfAR8BIEEegR1BHQESgRKBHQETwSDBIQEhQSFBIQEhgSHBIgEiQSJBIgEhgSKBIsEjASMBIsEjQSOBI8EkASQBI8EjQSRBJIEkASQBJIEkwSUBJUEhQSFBJUEkwSWBJcEmASYBJcEiQSZBJoEmwSbBJoElwScBJ0EmwSbBJ0EngSfBJ4EoASgBJ4EoQSiBKMEpASkBKMEpQSmBKMEpwSnBKMEoQSoBKkEqgSqBKkEpQSrBKkErASsBKkErQSuBK8EsASwBK8ErQSxBK8EsgSyBK8EswS0BLUEtgS2BLUEswS3BLUEuAS4BLUEuQS6BLsEvAS8BLsEuQS9BLsEvgS+BLsEjARaBL8EWwRbBL8EwATBBFoEwgTCBFoEVQRLBMMETARMBMMExATFBEsExgTGBEsETgRUBMcEVQRVBMcEyATJBFQEygTKBFQETARgBMsEYQRhBMsEzATNBGAEzgTOBGAEWwSCBM8ETgROBM8E0ATRBIIE0gTSBIIEfwRjBGIE0wTTBGIE1ARiBGEE1QTVBGEE1gR/BH4E1wTXBH4E2AR+BHkE2QTZBHkE2gRtBGwE2wTbBGwE3ARsBGME3QTdBGME3gR5BHgE3wTfBHgE4AR4BHME4QThBHME4gRzBHIE4wTjBHIE5ARyBG0E5QTlBG0E5gTnBJoE6AToBJoEmQSaBOkEhwSHBOkE6gTrBJUE7ATsBJUElASOBJUE7QTtBJUE7gSHBO8EiASIBO8E8ATxBJQE8gTyBJQEiATzBJ8E9AT0BJ8EoAT1BJkE9gT2BJkEnwT3BPgEjgSOBPgEjwS+BI8E+QT5BI8E+gT7BKIE/AT8BKIEpAT9BKAE/gT+BKAEogT/BAAFvgS+BAAFvQS4BL0EAQUBBb0EAgUDBasEBAUEBasErAQFBaQEBgUGBaQEqwQHBQgFuAS4BAgFtwSyBLcECQUJBbcECgWyBAsFsQSxBAsFDAUNBawEDgUOBawEsQSmBA8FqgSqBA8FEAWmBKcEDwUPBacEEQWoBBIFsASwBBIFEwUSBagEEAUQBagEqgSYBIQEFAUUBYQEFQWEBIMEFQUVBYMEFgW0BBcFvAS8BBcFGAUXBbQEGQUZBbQEtgSRBIsEGgUaBYsEGwUbBYsEHAUcBYsEigSDBJIEFgUWBZIEHQWSBJEEHQUdBZEEGgWcBJYEHgUeBZYEHwWWBJgEHwUfBZgEFAWnBJ0EEQURBZ0EIAWdBJwEIAUgBZwEHgWuBCEFtgS2BCEFGQUhBa4EEwUTBa4EsAS6BCIFigSKBCIFHAUiBboEGAUYBboEvAQjBSQFDwUPBSQFEAUlBSMFEQURBSMFDwUSBSYFEwUTBSYFJwUmBRIFJAUkBRIFEAUoBSkFFQUVBSkFFAUqBSgFFgUWBSgFFQUXBSsFGAUYBSsFLAUrBRcFLQUtBRcFGQUbBS4FGgUaBS4FLwUuBRsFMAUwBRsFHAUxBSoFHQUdBSoFFgUvBTEFGgUaBTEFHQUyBTMFHwUfBTMFHgUpBTIFFAUUBTIFHwU0BSUFIAUgBSUFEQUzBTQFHgUeBTQFIAUhBTUFGQUZBTUFLQU1BSEFJwUnBSEFEwUiBTYFHAUcBTYFMAU2BSIFLAUsBSIFGAV7BHoEdAR0BHoETwR6BIEETwRIBFMEbgRuBFMEbwRKBEgEdQR1BEgEbgRTBFEEbwRvBFEEaARdBFwEVwRnBFcEZgRXBFwEZgRZBGkEUQRRBGkEaARmBFwEZARkBFwEXgRXBGcEWQRZBGcEaQQkBSMFNwU3BSMFOAUjBSUFOAU4BSUFNgQmBTkFJwUnBTkFOgUoBRYEKQUpBRYEFwQoBSoFFgQWBCoFDAQrBS4ELAUsBS4EJwQtBTUEKwUrBTUELgQvBS4FCgQKBC4FFQQuBTAFFQQVBDAFHQQxBQsEKgUqBQsEDAQxBS8FCwQLBC8FCgQzBTIFKAQoBDIFIgQyBSkFIgQiBCkFFwQ0BTMFMAQwBDMFKAQtBTUFNQQ1BDUFQQQnBToFNQU1BToFQQQwBTYFHQQdBDYFIAQ2BSwFIAQgBCwFJwQkBTcFJgUmBTcFOQUdBBQEFQQVBAkECgQ0BTAEJQUlBTAENgQ7BTwFPQU8BT4FPwU/BT4FPQVABUEFQgVCBUEFQwVBBUAFRAVEBUAFRQVGBUcFQAVABUcFRQVIBUkFSgVKBUkFRgVGBUAFSgVKBUAFQgVLBUwFTQVNBUwFTgVPBU4FUAVQBU4FTAVRBVIFUwVTBVIFVAVVBVQFVgVWBVQFVwVMBVgFWQVZBVgFWgVYBVsFXAVcBVsFXQVbBVgFXgVeBVgFXwVYBUwFXwVfBUwFSwVgBWEFYgViBWEFYwVNBWMFSwVLBWMFYQVkBWUFZgVmBWUFZwVlBWgFZwVnBWgFaQVoBWUFagVqBWUFawVrBWUFZAVsBW0FUwVTBW0FbgVtBWwFbwVvBWwFcAVsBXEFcAVwBXEFcgVxBXMFcgVyBXMFdAVzBXEFVQVVBXEFVAVxBWwFVAVUBWwFUwV1BXYFdwV3BXYFeAV4BXYFYAVgBXYFYQV2BV8FYQVhBV8FSwV2BXUFXwVfBXUFXgVpBWgFeQV5BWgFegV6BWgFewV8BX0FfgV+BX0FfwV9BXwFgAWABXwFgQWCBYMFhAWEBYMFhQWFBYMFhgWGBYMFhwWDBX0FhwWHBX0FgAWDBYIFfQV9BYIFfwWIBYkFigWKBYkFiwWJBYwFiwWLBYwFjQWOBY8FkAWQBY8FkQWOBTwFjwWPBTwFOwWSBZMFkAWQBZMFjgWOBZQFPAU8BZQFPgWUBY4FlQWVBY4FkwWWBZcFmAWYBZcFmQWXBUEFmQWZBUEFRAVBBZcFQwVDBZcFmgWXBZYFmgWaBZYFmwViBZwFYAVgBZwFnQWeBZ0FnwWfBZ0FnAWgBaEFogWiBaEFowWhBaQFowWjBaQFpQWkBaEFkQWRBaEFkAWmBaAFpwWnBaAFogWTBZIFqAWpBagFkgWpBaYFeQV5BaYFqgWmBacFqgWqBacFqwWsBaQFrQWtBaQFkQWkBawFpQWlBawFrgWsBa8FrgWuBa8FsAWvBawFsQWxBawFrQWyBbMFtAW0BbMFtQW2BbUFtwW3BbUFswW4BbkFugW6BbkFuwW5BbwFuwW7BbwFvQW8BbkFvgW+BbkFvwW5BbgFvwW/BbgFwAXBBcIFwwXDBcIFxAXCBcUFxAXEBcUFjQXCBbgFxQXFBbgFugW4BcIFwAXABcIFwQXGBccFyAXIBccFyQXHBcoFyQXJBcoFywXKBccFtgW2BccFtQXHBcYFtQW1BcYFtAXMBbwFzQXNBbwFvgW8BcwFvQW9BcwFzgXMBc8FzgXOBc8F0AXPBcwF0QXRBcwFzQW3BdIFtgW2BdIFygXTBcsF0gXSBcsFygXUBdUF1gXWBdUF1wXVBdQF0AXQBdQFzgXOBdQFvQW9BdQFuwXUBdYFuwW7BdYFugXYBdkFcAVwBdkFbwXZBdgF2gXaBdgF2wXcBd0F3gXeBd0F3wWTBeAFlQWVBeAF4QXiBeMF5AXkBeMF4QXYBeUF2wXbBeUF5gXlBecF5gXmBecF6AXnBeUFdAV0BeUFcgXlBdgFcgVyBdgFcAXpBZYF4wXjBZYFmAWWBekFmwWbBekF6gXpBesF6gXqBesF7AXrBekF4gXiBekF4wXtBe4F2wXbBe4F2gXdBe8F3wXfBe8F8AXxBeIF8gXyBeIF5AXzBfQF6AXoBfQF5gX0Be0F5gXmBe0F2wXrBfUF7AXsBfUF9gX1BesF8QXxBesF4gXvBXwF8AXwBXwFfgWGBYcF8wXzBYcF9AWHBYAF9AX0BYAF7QX3BfgF+QX5BfgF+gX4BfcFngWeBfcFnQX3BXgFnQWdBXgFYAV4BfcFdwV3BfcF+QX7BfwFsAWwBfwFrgX8Bf0FrgWuBf0FpQX9BfwFvgW+BfwFzQX8BfsFzQXNBfsF0QX+Bf8FwwXDBf8FAAb/BQEGAAYABgEGqwWfBQIGngWeBQIGAwa0BQMGsgWyBQMGAgYEBgUGwAXABQUGvwUFBv0FvwW/Bf0FvgX9BQUGpQWlBQUGowUFBgQGowWjBQQGogXTBdIFiAWIBdIFiQXSBbcFiQWJBbcFjAW3BbMFjAWMBbMFBgazBbIFBgYGBrIF/gWfBZwFAQYBBpwFBwacBWIFBwYHBmIFaQViBWMFaQVpBWMFZwVjBU0FZwVnBU0FZgUIBmQFCQYJBmQFZgUKBmoFawXcBdkF3QXdBdkF2gXuBe8F2gXaBe8F3QWBBXwF7gXuBXwF7wULBlsFDAYMBlsFDQYNBlsFDgYOBlsFXgV1BQ8GXgVeBQ8GDgYPBnUFEAYQBnUFdwX5BREGdwV3BREGEAb5BfoFEQYRBvoFEgb6BRMGEgYSBhMGFAYTBsgFFAYUBsgFFQbIBckFFQYVBskFFgbJBcsFFgYWBssFFwbLBdMFFwYXBtMFGAbTBYgFGAYYBogFGQYaBhsGigWKBRsGHAYbBhoGHQYdBhoG1wUeBtUFHwYfBtUF0AXVBR4G1wXXBR4GHQbPBSAG0AXQBSAGHwYgBs8FIQYhBs8F0QUiBvsFIwYjBvsFsAX7BSIG0QXRBSIGIQavBSQGsAWwBSQGIwYkBq8FJQYlBq8FsQVJBUgFsQWxBUgFJQaCBSYGfwV/BSYGJwYmBvUFJwYnBvUF8QX1BSYG9gX2BSYGKAYmBoIFKAYoBoIFhAUZBogFHAYcBogFigUpBqgF3gXeBagFKgaoBSkGkwWTBSkG4AUpBisG4AXgBSsGLAYrBikG3wXfBSkG3gUBBgcGqwWrBQcGqgWqBQcGeQV5BQcGaQUtBisG8AXwBSsG3wUrBi0GLAYsBi0GLgYEBi8GogWiBS8GpwWnBS8GqwWrBS8GAAYvBsEFAAYABsEFwwUvBgQGwQXBBQQGwAUwBi0GfgV+BS0G8AUtBjAGLgYuBjAG8gWMBQYGjQWNBQYGxAUGBv4FxAXEBf4FwwUnBjAGfwV/BTAGfgUaBjEG1wXXBTEG1gUxBsUF1gXWBcUFugXFBTEGjQWNBTEGiwUxBhoGiwWLBRoGigWABYEF7QXtBYEF7gVNBU4FZgVmBU4FMgZ5BXoFqQV6BSoGqQWoBakFKgYzBkkFrQWtBUkFsQVJBTMGRgVGBTMGRwWPBTMGkQWRBTMGrQX4BTQG+gX6BTQGEwY0BsYFEwYTBsYFyAXGBTQGtAW0BTQGAwY0BvgFAwYDBvgFngWyBQIG/gX+BQIG/wUCBp8F/wX/BZ8FAQaSBaAFqQWpBaAFpgWhBaAFkAWQBaAFkgUsBi4G5AXkBS4G8gXgBSwG4QXhBSwG5AXyBTAG8QXxBTAGJwbjBZgF4QXhBZgFlQWZBZQFmAWYBZQFlQWUBZkFPgU+BZkFRAVEBUUFPgU+BUUFPQVHBTsFRQVFBTsFPQUzBo8FRwVHBY8FOwU1BjYGNwY3BjYGOAY5BjYGOQU5BTYGRQQ5BUUEOgU6BUUEQwRABEEEQwRDBEEEOgU/BEAEQgRCBEAEQwQ6BjsGPAY8BjsGPQY+BjsGNgQ2BDsGOAU/BkAGQQZBBkAGQgZDBkQGRQZFBkQGOwQ6BjkGNwU3BTkGOQU/Bj4GNwQ3BD4GNgRGBkcGZAVkBUcGawVTBW4FSAZIBm4FSQZKBkAGOQQ5BEAGOARuBWsFSwZLBmsFTAY2BjUGRQRFBDUGRAREBkMGTQZNBkMGTgZPBjYGUAZQBjYGOQZRBjkGUgZSBjkGOgY4BTsGNwU3BTsGOgY7Bj4GUwZTBj4GVAY+Bj8GVQZVBj8GVgZABj8GOAQ4BD8GNwRABkoGVwZXBkoGWAZKBkQGWQZZBkQGWgZbBtwFKgYqBtwF3gXZBdwFbwVvBdwFWwZtBW8FXAZcBm8FWwZbBioGewV7BSoGegVcBlsGCgYKBlsGewVcBgoGbgVuBQoGawVuBW0FXAYKBnsFagVqBXsFaAU5BDsESgZKBjsERAaBA5IDfwN/A5IDkQOSA6ADkQORA6ADnwOgA64DnwOfA64DrQOuA7wDrQOtA7wDuwO7A7wDyQPJA7wDhwGHAYoByQPJA4oB1QMrBD4EMgQyBD4EOgRrA10GagNqA10GXgZdBl8GXgZeBl8GYAZfBmEGYAZgBmEGYgZhBmMGYgZiBmMGZAZjBmUGZAZkBmUGZgZlBmcGZgZmBmcGaAZnBmkGaAZoBmkGagZpBmsGagZqBmsGbAZsBmsGbQZtBmsGbgZtBm4GbwZvBm4GcAZwBnEGbwZvBnEGcgZxBnMGcgZyBnMGdAZzBnUGdAZ0BnUGdgaHA3cGawNrA3cGXQZ3BngGXQZdBngGXwZ4BnkGXwZfBnkGYQZ5BnoGYQZhBnoGYwZ6BnsGYwZjBnsGZQZ7BnwGZQZlBnwGZwZ8Bn0GZwZnBn0GaQZ9Bn4GaQZpBn4GawZrBn4GbgZuBn4GfwZuBn8GcAZwBn8GgAaABoEGcAZwBoEGcQaCBoMGcwZzBoMGdQaVA4QGhwOHA4QGdwaEBoUGdwZ3BoUGeAaFBoYGeAZ4BoYGeQaGBocGeQZ5BocGegaHBogGegZ6BogGewaIBokGewZ7BokGfAaJBooGfAZ8BooGfQaKBosGfQZ9BosGfgZ+BosGfwZ/BosGjAZ/BowGgAaABowGjQaABo0GgQaBBo0GjgaPBpAGggaCBpAGgwaVA6IDhAaEBqIDkQaRBpIGhAaEBpIGhQaSBpMGhQaFBpMGhgaTBpQGhgaGBpQGhwaUBpUGhwaHBpUGiAaVBpYGiAaIBpYGiQaWBpcGiQaJBpcGigaXBpgGigaKBpgGiwaLBpgGjAaMBpgGmQaZBpoGjAaMBpoGjQaNBpoGjgaOBpoGmwacBp0GjwaPBp0GkAaiA7ADkQaRBrADngaeBp8GkQaRBp8GkgafBqAGkgaSBqAGkwagBqEGkwaTBqEGlAahBqIGlAaUBqIGlQaiBqMGlQaVBqMGlgajBqQGlgaWBqQGlwakBqUGlwaXBqUGmAaYBqUGmQaZBqUGpgamBqcGmQaZBqcGmganBqgGmgaaBqgGmwapBqoGnAacBqoGnQawA74DngaeBr4DqwarBqwGngaeBqwGnwasBq0GnwafBq0GoAatBq4GoAagBq4GoQauBq8GoQahBq8GogavBrAGogaiBrAGowawBrEGowajBrEGpAaxBrIGpAakBrIGpQalBrIGpgamBrIGswazBrQGpgamBrQGpwa0BrUGpwanBrUGqAa2BqoG1AHUAaoG1QG+A8oDqwarBsoDtwa3BrgGqwarBrgGrAa4BrkGrAasBrkGrQa5BroGrQatBroGrga6BrsGrgauBrsGrwa7BrwGrwavBrwGsAa8Br0GsAawBr0GsQa9Br4GsQaxBr4GsgayBr4GswazBr4GvwazBr8GtAa0Br8GwAbABsEGtAa0BsEGtQbKA9YDtwa3BtYDwgbCBsMGtwa3BsMGuAbDBsQGuAa4BsQGuQbEBsUGuQa5BsUGugbFBsYGuga6BsYGuwbGBscGuwa7BscGvAbHBsgGvAa8BsgGvQbIBskGvQa9BskGvga+BskGvwa/BskGygbKBssGvwa/BssGwAbLBswGwAbABswGwQbWA+IDwgbCBuIDzQbNBs4GwgbCBs4GwwbOBs8GwwbDBs8GxAbPBtAGxAbEBtAGxQbQBtEGxQbFBtEGxgbRBtIGxgbGBtIGxwbSBtMGxwbHBtMGyAbTBtQGyAbIBtQGyQbJBtQGygbKBtQG1QbVBtYGygbKBtYGywbWBtcGywbLBtcGzAbiA+4DzQbNBu4D2AbYBtkGzQbNBtkGzgbZBtoGzgbOBtoGzwbaBtsGzwbPBtsG0AbbBtwG0AbQBtwG0QbcBt0G0QbRBt0G0gbdBt4G0gbSBt4G0wbeBt8G0wbTBt8G1AbUBt8G1QbVBt8G4AbVBuAG1gbWBuAG4QbWBuEG1wbXBuEG4gbuA/oD2AbYBvoD4wbjBuQG2AbYBuQG2QbkBuUG2QbZBuUG2gblBuYG2gbaBuYG2wbmBucG2wbbBucG3AbnBugG3AbcBugG3QboBukG3QbdBukG3gbeBukG3wbfBukG6gbfBuoG4AbgBuoG6wbgBusG4QbhBusG7AbhBuwG4gbiBuwG7Qb6AwYE4wbjBgYE7gbjBu4G5AbkBu4G7wbkBu8G5QblBu8G8AblBvAG5gbmBvAG8QbxBvIG5gbmBvIG5wbyBvMG5wbnBvMG6AbzBvQG6AboBvQG6QbpBvQG6gbqBvQG9QbqBvUG6wbrBvUG9gbrBvYG7AbsBvYG9wbsBvcG7QbtBvcG+AYGBBIE7gbuBhIE+QbuBvkG7wbvBvkG+gbvBvoG8AbwBvoG+wbzBvwG9Ab8Bv0G9Ab0Bv0G9Qb9Bv4G9Qb1Bv4G9gb+Bv8G9gb2Bv8G9wb3Bv8G+Ab4Bv8GAAcSBBsE+Qb5BhsEAQf5BgEH+gb6BgEHAgcbBB4EAQcBBx4EAwcDBwQHAQcBBwQHAgcFB/4GBgcGB/4G/QYFBwcH/gb+BgcH/wb/BgcHAAcABwcHCAceBCUEAwcDByUECQcJBwoHAwcDBwoHBAcFBwYHCwcLBwYHDAcFBwsHBwcHBwsHDQcHBw0HCAcIBw0HDgclBCwECQcJBywEDwcJBw8HCgcKBw8HEAcRBwsHEgcSBwsHDAcLBxEHDQcNBxEHEwcNBxMHDgcOBxMHFAcsBDMEDwcPBzMEFQcPBxUHEAcQBxUHFgcXBxEHGAcYBxEHEgcRBxcHEwcTBxcHGQcTBxkHFAcUBxkHGgcUBxoHGwcbBxoHHAcbBzwEHQcdBzwEPQQzBD8EFQcVBz8EHgcVBx4HFgcWBx4HHwdCBEQEIAcgB0QEIQdeBkYEagNgBkYEXgZiBkYEYAZkBkYEYgZmBkYEZAZoBkYEZgZqBkYEaAZsBkYEagZtBkYEbAZvBkYEbQZyBkYEbwZyBnQGRgR2BkYEdAYiByMHJAckByMHJQcjByIHJgcmByIHJwcoByMHKQcpByMHJgcjBygHJQclBygHKgcrBywHLQctBywHLgcsBysHLwcvBysHMAciBywHJwcnBywHLwcsByIHLgcuByIHJAcxBzIHMwczBzIHNAcyBzEHNQc1BzEHNgcrBzIHMAcwBzIHNQcyBysHNAc0BysHLQc3BzgHOQc5BzgHOgc3BzkHOwc7BzkHPAcxBzcHNgc2BzcHOwc3BzEHOAc4BzEHMwc9Bz4HPwc/Bz4HQAc/B0AHOQc5B0AHPAc/B0EHPQc9B0EHQgdDB0QHRQdFB0QHRgdFB0cHQwdDB0cHSAdDB0gHPQc9B0gHPgc9B0IHQwdDB0IHRAdJB0oHSwdLB0oHTAdLB00HSQdJB00HTgdJB04HRQdFB04HRwdFB0YHSQdJB0YHSgdPB1AHUQdRB1AHUgdRB1MHTwdPB1MHVAdPB1QHSwdLB1QHTQdLB0wHTwdPB0wHUAdVB1YHVwdXB1YHWAdXB1kHVQdVB1kHWgdVB1oHUQdRB1oHUwdRB1IHVQdVB1IHVgcoB1sHKgcqB1sHXAdbBygHXQddBygHKQdXB1sHWQdZB1sHXQdbB1cHXAdcB1cHWAcqB1IHJQclB1IHUAdeB18HYAdgB18HYQdiB2MHZAdkB2MHYQdlB2YHZwdnB2YHaAdpB2oHawdrB2oHaAdsB2oHbQdtB2oHbgdvB18HcAdwB18HbgdxB3IHcwdzB3IHYwd0B3UHdgd2B3UHcwd3B3UHeAd4B3UHeQd6B3sHeQd5B3sHfAd9B34Hfwd/B34HgAeBB4IHfwd/B4IHfAeDB4QHhQeFB4QHgAeGB4cHhQeFB4cHiAeJB4oHiweLB4oHiAeMB40HiweLB40HjgePB5AHkQeRB5AHjgeSB5MHkQeRB5MHlAeVB5YHlweXB5YHlAeYB5kHlweXB5kHZgeaB5sHNgc2B5sHNQecB50HNQc1B50HMAeeB58HJwcnB58HJgegB6EHJgcmB6EHKQeiB6MHMAcwB6MHLwekB6UHLwcvB6UHJwemB6cHPAc8B6cHOweoB6kHOwc7B6kHNgeqB6sHKQcpB6sHXQesB60HXQddB60HWQc+B64HQAdAB64HrwewBzwHsQexBzwHQAdZB7IHWgdaB7IHswe0B1MHtQe1B1MHWgdHB7YHSAdIB7YHtwe4Bz4HuQe5Bz4HSAdTB7oHVAdUB7oHuwe8B00HvQe9B00HVAdNB74HTgdOB74HvwfAB0cHwQfBB0cHTgfCB8MHdgd2B8MHdAd2B2IHxAfEB2IHxQfGB8cHcAdwB8cHbwfIB3AHyQfJB3AHaQfKB8sHZAdkB8sHYgdkB28HzAfMB28HzQfOB88Hegd6B88Hewd6B3QH0AfQB3QH0QfSB2kH0wfTB2kHawfUB2sH1QfVB2sHmQfWB9cHfQd9B9cHfgd9B3sH2AfYB3sH2QfaB5kH2wfbB5kHmAfcB5gH3QfdB5gHkwfeB98HhgeGB98HhweGB34H4AfgB34H4QfiB5MH4wfjB5MHkgfkB5IH5QflB5IHjQfmB+cHjAeMB+cHjQeMB4cH6AfoB4cH6QfqB+sHhAeEB+sHgQfsB4IH6wfrB4IHgQftB+4HigeKB+4HgwfuB+oHgweDB+oHhAdyB+8HYAdgB+8H8AfxB14H8AfwB14HYAfyB/MHlgeWB/MHjwfzB/QHjwePB/QHkAdsB/UHZwdnB/UH9gf2B/cHZwdnB/cHZQdeB/EHbQdtB/EH+Af1B2wH+Af4B2wHbQd3B/kHcQdxB/kH+gfvB3IH+gf6B3IHcQeCB+wHeAd4B+wH+wf5B3cH+wf7B3cHeAf0B/wHkAeQB/wHiQf8B+0HiQeJB+0Higf3B/0HZQdlB/0HlQf9B/IHlQeVB/IHlgfqB/4H6wfrB/4H/wcACOwH/wf/B+wH6wfuB+0HAQgBCO0HAgjqB+4H/gf+B+4HAQjvBwMI8AfwBwMIBAgFCPEHBAgECPEH8AfzB/IHBggGCPIHBwj0B/MHCAgICPMHBgj2B/UHCQgJCPUHCgj3B/YHCwgLCPYHCQjxBwUI+Af4BwUIDAgKCPUHDAgMCPUH+Af5Bw0I+gf6Bw0IDggDCO8HDggOCO8H+gfsBwAI+wf7BwAIDwgNCPkHDwgPCPkH+wf8B/QHEAgQCPQHCAjtB/wHAggCCPwHEAj9B/cHEQgRCPcHCwjyB/0HBwgHCP0HEQhWB1IHWAdSByoHWAcqB1wHWAckB0wHLgcuB0wHSgclB1AHJAckB1AHTAcuB0oHLQctB0oHRgc4BzMHOgdCB0EHMwczB0EHOgdGB0QHLQctB0QHNAc5BzoHPwc/BzoHQQczBzQHQgdCBzQHRAf+BxII/wf/BxIIEwj/BxMIAAgACBMIGAcUCBUIAggCCBUIAQj9BvwGAwgDCPwGBAgECPwGBQgFCPwG8wYKBxAHBwgHCBAHBggQBxYHBggGCBYHCAgKCPEGCQgJCPEG+wYJCPsGCwgLCPsGAgfzBvIGBQgFCPIGDAgMCPIGCggKCPIG8QYNCAwHDggOCAwHBgcOCAYHAwgDCAYH/QYPCBIHDQgNCBIHDAcICBYHEAgQCBYHHwcfBxQIEAgQCBQIAggLCAIHEQgRCAIHBAcRCAQHBwgHCAQHCgcVCBIIAQgBCBII/gcCB/sG+gb7BvEG8AYPCAAIEgcSBwAIGAcWCBcIGAgXCBkIGAgYCBkIFggaCEIFGwgbCEIFQwUcCBoIHQgdCBoIGwgaCBwIHggeCBwIHwhKBR4ISAVIBR4IIAhCBRoISgVKBRoIHgghCCIIIwgjCCIIJAgiCCEIJQglCCEIJggnCCgIKQgpCCgIKghVBSsIJwgnCCsILAgiCC0ILgguCC0ILwgwCDEIMggyCDEILggxCDMILgguCDMINAgkCCIINAg0CCIILgg1CDYINwg3CDYIOAgjCCQINQg1CCQINgg5CDoIOwg7CDoIPAg9CD4IPAg8CD4IOwg+CD8IOwg/CEAIOwg7CEAIOQhBCCkIQghCCCkIQwhECEEIRQhFCEEIQghBCEQIRghGCEQIRwh0BXMFRwhHCHMFRghzBVUFRghGCFUFJwgpCEEIJwgnCEEIRghICEkISghKCEkISwhLCDgISghKCDgINggkCDQINgg2CDQISggzCEgINAg0CEgISgg9CEwIPgg+CEwITQhNCE4IPghPCFAIUQhRCFAIUghQCFMIUghSCFMIVAhVCIQFVghWCIQFhQWFBYYFVghWCIYFVwhTCFAIVwhXCFAIVghPCFUIUAhQCFUIVghYCFkIWghaCFkIWwhcCF0IWwhbCF0IWgheCF8IYAhgCF8IYQhiCBYIXwhfCBYIYQhhCGMIYAhgCGMIZAgZCGUIFggWCGUIYQhlCGYIYQhhCGYIYwhnCGgIaQhpCGgIaghoCB0IaghqCB0IGwgbCEMFaghqCEMFmgWbBWkImgWaBWkIagg3CDgIawhrCDgIbAhrCGwIbQhtCGwIbghvCHAIcQhxCHAIcghzCHQIcghyCHQIcQh0CF4IcQhxCF4IYAhwCG8IdQh1CG8IdghjCHcIZAh4CGQIdwh4CEwIdgh2CEwIeQh6CHUIeQh5CHUIdgheCHQIewh7CHQIfAh0CHMIfAh8CHMIfQh+CH8IfQh9CH8IfAh/CIAIfAh8CIAIewiBCIIIgwiDCIIIhAiCCIEIhQiFCIEIhgiHCIgIiQiJCIgIigiLCIwIigiKCIwIiQiMCI0IiQiJCI0IjgiPCIcIjgiOCIcIiQiQCJEIkgiSCJEIkwhcCJQIkwiTCJQIkgiICIcIlAiUCIcIkgiHCI8IkgiSCI8IkAiVCJYIlwiXCJYImAiZCJoImAiYCJoIlwiaCIYIlwiXCIYIgQiDCJUIgQiBCJUIlwiNCIwImwibCIwInAiMCIsInAicCIsInQieCJ8InQidCJ8InAifCKAInAicCKAImwiFCIYIoQihCIYImgiiCKEImQiZCKEImgijCKQIpQilCKQIpgikCJ4IpgimCJ4InQidCIsIpgimCIsIigiICKUIigiKCKUIpginCEQIqAioCEQIRQipCKcIqgiqCKcIqAirCKwIrQitCKwIrghjCGYIrwivCGYIsAiwCLEIsgiyCLEIswinCKkItAi0CKkItQjoBecFtQi1COcFtAjnBXQFtAi0CHQFRwhECKcIRwhHCKcItAhnCGkIsQixCGkItghpCJsFtgi2CJsF6gXsBbcI6gXqBbcItgi3CLMItgi2CLMIsQi4CKkIuQi5CKkIqgisCKsIugi6CKsIuwiyCLMIvAi8CLMIvQjzBegFvgi+COgFtQipCLgItQi1CLgIvgi3COwFvwi/COwF9gWzCLcIvQi9CLcIvwi6CLsIUghSCLsIUQiGBfMFVwhXCPMFvgi4CFMIvgi+CFMIVwjACMEIwgjCCMEIwwjBCG4IwwjDCG4IbAg4CEsIbAhsCEsIwwhLCEkIwwjDCEkIwgjECH4IxQjFCH4IfQhzCMYIfQh9CMYIxQjGCI0IxQjFCI0ImwigCMQImwibCMQIxQjHCJEIyAjICJEIyQh6CMoIyQjJCMoIyAhtCG4IywjLCG4IzAiDCIQIzAjMCIQIywjNCI8IzgjOCI8IjgiNCMYIjgiOCMYIzgjGCHMIzgjOCHMIcghwCM0IcghyCM0IzgiiCFgIoQihCFgIWghdCIUIWghaCIUIoQiFCF0IggiCCF0IzwjHCIQIzwjPCIQIgghtCMoIawhrCMoI0Ag9CDcI0AjQCDcIawg3CD0INQg1CD0IPAg6CCMIPAg8CCMINQg6CDkI0QjRCDkI0gjTCEAIPwiuCKwIqAioCKwIqgisCLoIqgiqCLoIuQi6CFIIuQi5CFIIVAjUCA0G1QjVCA0GMQgNBg4GMQgxCA4GMwgOBg8GMwgzCA8GSAgPBhAGSAhICBAGSQgQBhEGSQhJCBEGwggSBsAIEQYRBsAIwgjACBIG1gjWCBIGFAYVBpYIFAYUBpYI1giWCBUGmAiYCBUGFgYXBpkIFgYWBpkImAgYBqIIFwYXBqIImQgZBlgIGAYYBlgIoggcBhsGWQhZCBsG1wgbBh0G1wjXCB0GowgeBh8GpAikCB8GnggdBh4GowijCB4GpAgfBiAGngieCCAGnwggBiEGnwifCCEGoAgiBiMGxAjECCMGfgghBiIGoAigCCIGxAgjBiQGfgh+CCQGfwgkBiUGfwh/CCUGgAglBkgFgAiACEgFIAhVCE8I2AjYCE8I2Qi9CL8I2QjZCL8I2Ai/CPYF2AjYCPYFKAaEBVUIKAYoBlUI2AgZBhwGWAhYCBwGWQjaCHcIrQitCHcI2wh3CGMI2wjbCGMIrwjcCN0IrwivCN0I2wjdCKsI2wjbCKsIrQjKCHoI0AjQCHoIeQg9CNAITAhMCNAIeQirCN0Iuwi7CN0I3gjdCNwI3gjeCNwI3wjNCHAI4AjgCHAIdQh1CHoI4AjgCHoIyQiRCJAIyQjJCJAI4AiPCM0IkAiQCM0I4Ai7CN4IUQhRCN4I4QjfCLwI3gjeCLwI4QhdCFwIzwjPCFwIkwiRCMcIkwiTCMcIzwjZCE8I4QjhCE8IUQjXCKMI4gjiCKMIpQiICJQIpQilCJQI4giUCFwI4gjiCFwIWwhZCNcIWwhbCNcI4ghTCLgIVAhUCLgIuQgjCDoIIQghCDoI4whMCHgITQhNCHgI2gh3CNoIeAiACCAIewh7CCAI5AggCB4I5AgeCB8I5AhfCF4I5AjkCF4IewjBCMAI5QjlCMAI1giWCJUI1gjWCJUI5QiVCIMI5QjlCIMIzAhuCMEIzAjMCMEI5QiECMcIywjLCMcIyAjKCG0IyAjICG0IywhkCHgIbwhvCHgIdghkCG8IYAhgCG8IcQjcCLII3wjfCLIIvAiyCNwIsAiwCNwIrwi8CL0I4QjhCL0I2QhmCGcIsAiwCGcIsQhoCGcIZQhlCGcIZghlCBkIaAhoCBkIHQgXCBwIGQgZCBwIHQgfCBwIYghiCBwIFwjkCB8IXwhfCB8IYgjmCOcI6AjoCOcINQYhB+cIFQgVCOcI6QgVCBQIIQchBxQIIAcUCB8HIAcgBx8HHgc/BEIEHgceB0IEIAfqCOsI7AjsCOsI7QgYBxMI7gjuCBMI7QjvCPAI8QjxCPAI8ggcB/MIRQZFBvMIQwYVCOkIEggSCOkI7AgYB+4IFwcXB+4I8gg5CEAI9Aj0CEAI9QgpCPYIQwhDCPYI9wgZB/AIGgcaB/AI+Aj5CEAI+gj6CEAIQwhEBDUGIQchBzUG5wj7CEMG/Aj8CEMG8wj9CP4I5wjnCP4I6Qj/CAAJ6QjpCAAJ7AgTCBII7QjtCBII7AgBCe4IAgkCCe4I7QgDCfIIBAkECfII7ggXB/IIGQcZB/II8AgFCfgIBgkGCfgI8AgHCfMICAkICfMI+AgJCdoIrgiuCNoIrQgJCa4IRQhFCK4IqAgJCUUICgkKCUUIQghNCNoITghOCNoICQlOCAkJ0wjTCAkJCglACNMIQwhDCNMICglDCAoJQgg+CE4IPwg/CE4I0wgaB/gIHAccB/gI8wiBBoIGcQZxBoIGcwaOBo8GgQaBBo8GggabBpwGjgaOBpwGjwaoBqkGmwabBqkGnAaoBrUGqQapBrUGVwPBBloDtQa1BloDVwMIBx0HZwMOBxQHHQcdBxQHGweSBIMEkwSTBIMEhQSEBJgEhgSGBJgEiQSIBJQEhgSGBJQEhQSVBI4EkwSTBI4EkASaBIcElwSXBIcEiQSLBJEEjQSNBJEEkASWBJwElwSXBJwEmwSPBL4EjQSNBL4EjASfBJkEngSeBJkEmwSKBIwEugS6BIwEuwSnBKEEnQSdBKEEngS4BLkEvQS9BLkEuwSgBKEEogSiBKEEowS8BLkEtAS0BLkEtQSqBKUEpgSmBKUEowSyBLMEtwS3BLMEtQSkBKUEqwSrBKUEqQS2BLMErgSuBLMErwSwBK0EqASoBK0EqQSsBK0EsQSxBK0ErwRgB2EHcgdyB2EHYwdtB24HXgdeB24HXwdkB2EHbwdvB2EHXwd2B3MHYgdiB3MHYwdwB24HaQdpB24HagdxB3MHdwd3B3MHdQdnB2gHbAdsB2gHagd6B3kHdAd0B3kHdQdrB2gHmQeZB2gHZgeCB3gHfAd8B3gHeQdlB5UHZgdmB5UHlwd7B30HfAd8B30HfweTB5gHlAeUB5gHlweEB4EHgAeAB4EHfweWB48HlAeUB48HkQd+B4YHgAeAB4YHhQeNB5IHjgeOB5IHkQeKB4MHiAeIB4MHhQeQB4kHjgeOB4kHiweHB4wHiAeIB4wHiwdjAtwCYQJhAtwCCwkhAsICGwIbAsIC3AILCdwCEAMQA9wCwgKaApkCQgNCA5kCQwOkAkEDnQKdAkEDQgOiAqACQANAA6ACQQPNAj4DpQKlAj4DQAPNAvcCPgM+A/cCPwPuAj0DIwMjAz0DOwNPAjkDTQJNAjkDOgOpAjkDqgKqAjkDOANgAjcDUgJSAjcDOAOzAjcDtAK0AjcDNgNeAtkCNgM2A9kCNQO8ArsCNAM0A7sCNQMZAxsDMgMyAxsDMwPtBvgGYQNhA/gGYgPiBu0GXwNfA+0GYQPXBuIGXgNeA+IGXwPMBtcGWwNbA9cGXgNkA2IDAAcAB2ID+AZnA2QDCAcIB2QDAAdnAx0H1gHWAR0HPQTWAT0ElQGVAT0EPgRaA8EGWwNbA8EGzAYMCXYGDQkNCXYGdQZXA9UBqQapBtUBqgYOCQ0JgwaDBg0JdQYPCQ4JkAaQBg4JgwYPCZAGEAkQCZAGnQa2BhAJqgaqBhAJnQa7AbwBTQNNA7wBEQlyAHQAuAG4AXQAugERBJABGgQaBJABkwERBAUEkAGQAQUEjgGBA4ADhQOFA4ADhAOFAYYBEgkSCYYBvQMTCZMDgwODA5MDhQMUCaEDEwkTCaEDkwMVCa8DFAkUCa8DoQMSCb0DFQkVCb0DrwPhA9UDiwGLAdUDigGLAY0B4QPhA40B7QPtA40B+QP5A40BjgEFBPkDjgGVAT4EFgkWCZMBlQEcB0UGGwcbB0UGPAQ6BDwEOwQ7BDwERQYBABcJAwADABcJGAkEABkJAQABABkJFwkHABoJBAAEABoJGQkIABsJBwAHABsJGgnAAL8AHAkcCb8AHQnCAMEAHgkeCcEAHwm/AMIAHQkdCcIAHgkDABgJxQDFABgJIAnHAMAAIQkhCcAAHAnFACAJawFrASAJIgl9AccAIwkjCccAIQlrASIJwQDBACIJHwkbCQgAJAkkCQgAlwF9ASMJ0QHRASMJJQnaAdsBJgkmCdsBJwndAdoBKAkoCdoBJgnfAd0BKQkpCd0BKAnfASkJ4QHhASkJKgmXAisJmAKYAisJLAmbAi0JmQKZAi0JLgmYAiwJmwKbAiwJLQnbAZ4CJwknCZ4CLwmfAjAJlwKXAjAJKwmeAkMDLwkvCUMDMQnhASoJRQNFAyoJMgnRASUJnwKfAiUJMAlDA5kCMQkxCZkCLgkYCRcJMwkXCRkJMwkZCRoJMwkaCRsJMwkcCR0JMwkeCR8JMwkdCR4JMwkgCRgJMwkhCRwJMwkiCSAJMwkjCSEJMwkfCSIJMwkbCSQJMwkkCTIJMwklCSMJMwkmCScJMwkoCSYJMwkpCSgJMwkqCSkJMwksCSsJMwkuCS0JMwktCSwJMwknCS8JMwkrCTAJMwkvCTEJMwkyCSoJMwkwCSUJMwkxCS4JMwk+BCsEFgkWCSsEJAQaBJMBJAQkBJMBFgkIBw4HHQcyCSQJRQNFAyQJlwFZADQJVwBXADQJNQlGA0QDmQGZAUQDmAFEA0UDmAGYAUUDlwFHA0YDmgGaAUYDmQFHA5oBTANMA5oBuAFMA7gBuQG5AbgBugF0AIIAugG6AYIAvAGCAIQAvAG8AYQAEQlOAzYJTwNPAzYJNwlPAzcJUANQAzcJOAlQAzgJUQNRAzgJOQlRAzkJSgNKAzkJOglLA0oDOwk7CUoDOglIA0sDPAk8CUsDOwlIAzwJSQNJAzwJPQk0CVkAPgk+CVkAowCVAD8JowCjAD8JPgmUAEAJlQCVAEAJPwmNAE0AwQHBAU0AqgFLAKgBTQBNAKgBqgFOAKwBSwBLAKwBqAFOAFEArAGsAVEArgFRAH8BrgGuAX8BzQF/AYEBzQHNAYEBzwGEAdIBgQGBAdIBzwGFAdQBhAGEAdQB0gESCbYGhQGFAbYG1AEVCRAJEgkSCRAJtgYVCRQJEAkQCRQJDwkUCRMJDwkPCRMJDgkTCYMDDgkOCYMDDQmDA4IDDQkNCYIDDAlGBAwJggN2BgwJRgRGBIQDgAM+AUEJQAFAAUEJQglEAUMJQgFCAUMJRAlCAUQJPgE+AUQJQQkMAQkBRQlFCQkBRgkKARIBRwlHCRIBSAkJAQoBRglGCQoBRwkhAQwBSQlJCQwBRQlAAUIJEwETAUIJSgkSARMBSAlICRMBSgkbARQBHQEdARQBHgFlAUsJFwEXAUsJTAkXAUwJGQEZAUwJTQkdAR4BJAEkAR4BIgFlASEBSwlLCSEBSQkkASIBJgEmASIBJwEmAScBKgEqAScBKAEsASoBLQEtASoBKAE7ASwBOQE5ASwBLQE2ATcBTglOCTcBTwkzATsBLwEvATsBOQEyATMBLgEuATMBLwFEATYBQwlDCTYBTgkcAxoDUAlQCRoDUQkXAxgDUglSCRgDUwkaAxcDUQlRCRcDUgniAlQJ6QLpAlQJVQnkAlYJ4ALgAlYJVwngAlcJ4gLiAlcJVAn5AlgJ5ALkAlgJVgkYA+sCUwlTCesCWQnpAlUJ6wLrAlUJWQk8A/ACWglaCfACWwn0AvUC7ALsAvUC9gLwAvECWwlbCfECXAn1AvwC9gL2AvwC+gI8A1oJ+QL5AloJWAn8Av4C+gL6Av4C/wL+AgID/wL/AgIDAAMEAwUDAgMCAwUDAAMTAxEDBAMEAxEDBQMLAwYDEwMTAwYDEQMNA10JDwMPA10JXgkJAwcDCwMLAwcDBgMcA1AJDQMNA1AJXQliCBcIFgg9BTwFPwWJUE5HDQoaCgAAAA1JSERSAAACAAAAAgAIAwAAAMOmJMgAAACiUExURf/YAP9+AP/JAP++AP/WAP+4AP/TAAAAAP/////XAP/QAP/VAP/PAP/CAP+7AP/NAP/IAP+9AP/DAP/EAP/GAP/SAP/AAP/LAP+DAP+uAP+MAP+cABkZGf/97zg4OP/dG9/f321tbf/the/v7//ypv/gNdDQ0KKiov/51v/2wlZWVv/kToeHh//++P/oZ//74rq6uvnAAPXHAPTPAPDLAOG/ALnLHRQAAD7HSURBVHheYjA1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");var So,zi,gi,Ln,Il=!1,bo,Pl=0,Zu=0,$u=0,Ll=1,Ju=1;function o_(){Il=!0,bo=document.getElementById("phone-canvas"),So=new _o({canvas:bo,antialias:!0,alpha:!0}),So.setPixelRatio(Math.min(2,window.devicePixelRatio)),zi=new Vs,gi=new vt(32,1,.1,80),zi.add(new rr(16777215,.9));let i=new Li(16777215,2.6);i.position.set(4,7,6),zi.add(i);let e=new li(10980346,40);e.position.set(-6,2,-5),zi.add(e);let t=new li(16757844,18);t.position.set(5,-3,3),zi.add(t),new yo().parse(Ku.buffer,"",n=>{Ln=n.scene;let s=new Ft().setFromObject(Ln),r=s.getCenter(new N);Ln.position.sub(r);let a=new Zt;a.add(Ln),Ln=a;let o=s.getSize(new N);Ll=o.y/2*1.5,Ju=Math.max(o.x,o.z)/2*1.35,zi.add(Ln),window.__phoneSetPin(Pl)})}function c_(){let i=bo.clientWidth||1,e=bo.clientHeight||1;(i!==Zu||e!==$u)&&(Zu=i,$u=e,So.setSize(i,e,!1),gi.aspect=i/e,gi.updateProjectionMatrix());let t=gi.fov*Math.PI/180,n=Ll/Math.tan(t/2),s=Ju/(Math.tan(t/2)*gi.aspect);return Math.max(n,s)}var Rl=[{ry:-.55,rx:.05,zoom:1.12,up:.22},{ry:Math.PI/2+.25,rx:.12,zoom:1.02,up:.18},{ry:Math.PI+.45,rx:-.12,zoom:1.05,up:.3},{ry:Math.PI*2-.55,rx:.5,zoom:1.3,up:.45}],l_=i=>i*i*(3-2*i),Mo=(i,e,t)=>i+(e-i)*t;window.__phoneSetPin=function(i){if(Pl=i,!Il){o_();return}if(!Ln)return;let e=c_(),t=Rl.length-1,n=Math.min(Math.max(i,0),1)*t,s=Math.min(Math.floor(n),t-1),r=l_(n-s),a=Rl[s],o=Rl[s+1];Ln.rotation.y=Mo(a.ry,o.ry,r),Ln.rotation.x=Mo(a.rx,o.rx,r),gi.position.set(0,Ll*Mo(a.up,o.up,r),e*Mo(a.zoom,o.zoom,r)),gi.lookAt(0,0,0),So.render(zi,gi)};window.addEventListener("resize",()=>{Il&&Ln&&window.__phoneSetPin(Pl)});})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/

