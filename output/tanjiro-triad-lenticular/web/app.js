import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = id => document.getElementById(id);
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22, 1, .1, 100);
camera.position.set(0, 0, 32);
const root = new THREE.Group(); scene.add(root);
const inverse = new THREE.Matrix4();
let config, uniforms, angle = Number(new URLSearchParams(location.search).get('angle') || 0), pitchTilt = 0, back = false, auto = false, dragging = false, lastX = 0, lastY = 0;

const vertex = `varying vec2 vUv; varying vec3 vView; uniform mat4 uRootInverse;
void main(){ vUv=vec2(uv.x,1.-uv.y); vec4 w=modelMatrix*vec4(position,1.); vView=(uRootInverse*vec4(cameraPosition,1.)).xyz-(uRootInverse*w).xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const common = `precision highp float; varying vec2 vUv; varying vec3 vView;
uniform sampler2D tA,tB,tC,tText,tLineA,tLineB,tLineC; uniform float uFlip,uSoft,uSweep,uPitch,uStripe,uRefract,uDepth,uFoil,uParticles,uGlow,uText,uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} vec3 spectrum(float t){return .55+.45*cos(6.283*(t+vec3(0.,.32,.66)));}
vec2 phase(vec3 V,out float lens){float aa=clamp(1.-fwidth(vUv.x*uPitch)*1.5,0.,1.);float a=degrees(atan(V.x,max(V.z,.05)))+(vUv.x-.5)*uSweep;float p=abs(a)/uFlip;lens=fract(vUv.x*uPitch)-.5;float q=p+lens*uStripe*.5*aa;return vec2(smoothstep(.5-uSoft,.5+uSoft,q),1.-step(0.,a));}
vec2 artUV(vec3 V,float lens){return clamp(vUv+V.xy/max(abs(V.z),.35)*uDepth*.14+vec2(lens*uRefract/uPitch,0.),0.,1.);}`;
const front = common + `void main(){vec3 V=normalize(vView);float lens;vec2 m=phase(V,lens);vec2 uv=artUV(V,lens);vec3 tilted=mix(texture2D(tB,uv).rgb,texture2D(tC,uv).rgb,m.y);vec3 c=mix(texture2D(tA,uv).rgb,tilted,m.x);vec4 txt=texture2D(tText,vUv);c=mix(c,txt.rgb,txt.a*uText);gl_FragColor=vec4(c,1.);}`;
const effect = kind => common + `void main(){vec3 V=normalize(vView);float lens;vec2 m=phase(V,lens);vec2 uv=artUV(V,lens);vec3 c=vec3(0.);float a=0.;` +
  (kind === 'foil' ? `float w=.5+.5*sin((vUv.x*.848-vUv.y*.530+V.x*2.4)*6.283*.55);c=spectrum(w+.2*V.x)*1.8;a=pow(w,12.)*uFoil*.15;` :
   kind === 'lines' ? `float line=mix(texture2D(tLineA,uv).r,mix(texture2D(tLineB,uv).r,texture2D(tLineC,uv).r,m.y),m.x);c=vec3(3.,1.7,.7);a=line*uGlow*.09;` :
   `vec2 q=vUv*105.,id=floor(q),f=fract(q)-.5;float seed=hash(id);float star=1.-smoothstep(.03,.13,length(f));float blink=pow(.5+.5*sin(uTime*1.7+seed*28.+V.x*26.),8.);c=vec3(3.5,3.,1.8);a=star*step(.975,seed)*blink*uParticles;`) +
  `if(a<.0001)discard;gl_FragColor=vec4(c,a);}`;
function mat(fragment, transparent=false){return new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent,depthWrite:!transparent,side:THREE.DoubleSide});}
function update(){$('angle').value=angle;$('angleValue').value=Math.round(angle)+'°';$('angel').setAttribute('aria-pressed',String(Math.abs(angle)<8&&!back));$('devil').setAttribute('aria-pressed',String(angle<=-8&&!back));$('third').setAttribute('aria-pressed',String(angle>=8&&!back));$('auto').setAttribute('aria-pressed',String(auto));}
function setTilt(n){angle=n;back=false;auto=false;update();}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=2*Math.atan(Math.max(5.12,3.55/camera.aspect)/32)*180/Math.PI;camera.updateProjectionMatrix();}
async function init(){config=await fetch('card-config.json').then(r=>r.json());document.title=(config.title||'三相光栅')+' · 收藏卡';$('card-title').textContent=config.title;$('card-description').textContent=config.description;$('angel').textContent=config.states.a.label;$('devil').textContent=config.states.b.label;$('third').textContent=config.states.c.label;$('caption-a').textContent=config.states.a.caption;$('caption-b').textContent=config.states.b.caption;$('caption-c').textContent=config.states.c.caption;$('card-edition').textContent=(config.collection||'HOLO')+' / '+(config.edition||'LENTICULAR');
 const loader=new THREE.TextureLoader();const tex=await Promise.all(['image_a','image_b','image_c','text','line_a','line_b','line_c'].map(n=>loader.loadAsync('./assets/'+n+'.png'+(n==='text'?'?rev=20260913-minimal':''))));tex.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;});const l=config.lenticular,fx=config.effects||{};uniforms={uRootInverse:{value:inverse},tA:{value:tex[0]},tB:{value:tex[1]},tC:{value:tex[2]},tText:{value:tex[3]},tLineA:{value:tex[4]},tLineB:{value:tex[5]},tLineC:{value:tex[6]},uFlip:{value:l.flipAngle},uSoft:{value:l.softness},uSweep:{value:l.sweep},uPitch:{value:l.pitch},uStripe:{value:l.stripe},uRefract:{value:l.refract},uDepth:{value:l.depth},uFoil:{value:l.foil},uParticles:{value:fx.particles},uGlow:{value:fx.glow},uText:{value:1},uTime:{value:0}};
 const materials={web_front:mat(front),web_foil:mat(effect('foil'),true),web_lines:mat(effect('lines'),true),web_particles:mat(effect('particles'),true),web_edge:new THREE.MeshBasicMaterial({color:0x222a37}),web_gold:new THREE.MeshBasicMaterial({color:0xd1b476}),web_back:new THREE.MeshBasicMaterial({color:0x182338})};const gltf=await new GLTFLoader().loadAsync('./assets/card.glb');root.add(gltf.scene);gltf.scene.traverse(o=>{if(!o.isMesh)return;const role=o.material.name;o.material=materials[role]||materials.web_edge;o.renderOrder={web_front:0,web_foil:1,web_lines:2,web_particles:3}[role]||0;});
 for(const [id,key] of [['foil','uFoil'],['particles','uParticles'],['glow','uGlow']]){const input=$(id);input.value=uniforms[key].value;const change=()=>{$(id+'Value').value=Math.round(+input.value*100)+'%';uniforms[key].value=+input.value;};input.oninput=change;change();}$('loading').remove();new ResizeObserver(resize).observe(stage);resize();update();window.__triCard={ready:true,setTilt,renderer,root,uniforms,getState:()=>({angle,pitchTilt,back,auto})};animate();}
function animate(time=0){requestAnimationFrame(animate);if(!uniforms)return;if(auto)angle=Math.sin(time*.00055)*42;root.rotation.set(pitchTilt,THREE.MathUtils.degToRad(angle)+(back?Math.PI:0),0);root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();uniforms.uTime.value=time/1000;renderer.render(scene,camera);}
$('angel').onclick=()=>setTilt(0);$('devil').onclick=()=>setTilt(-18);$('third').onclick=()=>setTilt(18);$('reset').onclick=()=>setTilt(0);$('auto').onclick=()=>{auto=!auto;back=false;update();};$('back').onclick=()=>{back=!back;auto=false;update();};$('angle').oninput=e=>setTilt(+e.target.value);$('effects-off').onclick=()=>{for(const id of ['foil','particles','glow']){$(id).value=0;$(id).dispatchEvent(new Event('input'));}};$('save').onclick=()=>{const a=document.createElement('a');a.download=(config.title||'card')+'-triad.png';a.href=renderer.domElement.toDataURL('image/png');a.click();};$('compare').onclick=()=>$('comparison').showModal();$('close-compare').onclick=()=>$('comparison').close();
$('art-text').onclick=()=>{const visible=uniforms.uText.value<.5;uniforms.uText.value=visible?1:0;$('art-text').textContent=visible?'隐藏卡面字':'显示卡面字';$('art-text').setAttribute('aria-pressed',String(visible));};
stage.onpointerdown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;auto=false;stage.setPointerCapture(e.pointerId);};stage.onpointermove=e=>{if(!dragging)return;angle=THREE.MathUtils.clamp(angle+(e.clientX-lastX)*.18,-45,45);pitchTilt=THREE.MathUtils.clamp(pitchTilt+(e.clientY-lastY)*.003,-.25,.25);lastX=e.clientX;lastY=e.clientY;update();};stage.onpointerup=stage.onpointercancel=()=>dragging=false;stage.onkeydown=e=>{if(e.key==='ArrowLeft')setTilt(angle-3);if(e.key==='ArrowRight')setTilt(angle+3);if(e.key.toLowerCase()==='r')setTilt(0);if(e.key.toLowerCase()==='f'){back=!back;update();}};
init().catch(e=>{$('loading').textContent='载入失败：'+e.message;console.error(e);});
