/* Apresentação e entrada. O motor recebe intenções, sem conhecer teclas. */
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const t=key=>MedievalI18n.t(key);
const overlay=document.querySelector('#overlay'),title=document.querySelector('#title'),message=document.querySelector('#message'),start=document.querySelector('#start'),pause=document.querySelector('#pause'),statusText=document.querySelector('#status');
const arena=new Image(),dragon=new Image(),blueDragon=new Image();arena.src='arena.png';
let spriteSurface=null,blueSurface=null;
start.disabled=true;start.textContent=t('loading');
function prepareSprite(source){
  // Chave de cor em memória: a imagem embutida também funciona em file://.
  // Elimina o quadriculado neutro claro preservando as escamas vermelhas/douradas.
  const surface=document.createElement('canvas');surface.width=source.naturalWidth;surface.height=source.naturalHeight;
  const painter=surface.getContext('2d',{willReadFrequently:true});painter.drawImage(source,0,0);
  const pixels=painter.getImageData(0,0,surface.width,surface.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const low=Math.min(d[i],d[i+1],d[i+2]),spread=Math.max(d[i],d[i+1],d[i+2])-low;
    if(low>165&&spread<55)d[i+3]=0;
    else if(low>150&&spread<75)d[i+3]=Math.round(d[i+3]*Math.max((spread-55)/20,(165-low)/15));
  }
  painter.putImageData(pixels,0,0);return surface;
}
function ready(){if(spriteSurface&&blueSurface){start.disabled=false;syncUI();}}
dragon.onload=()=>{spriteSurface=prepareSprite(dragon);ready();};
blueDragon.onload=()=>{blueSurface=prepareSprite(blueDragon);ready();};
dragon.onerror=()=>{assetError=true;syncUI();};
blueDragon.onerror=dragon.onerror;
dragon.src=window.DRAGON_SPRITE_DATA;
blueDragon.src=window.BLUE_DRAGON_SPRITE_DATA;
let state=DragonEngine.create(),mode='ready',last=0,acc=0,trail=[100,100],visualDt=0,assetError=false;
const soundtrack=new DragonSoundtrack();
const musicButton=document.querySelector('#music');
musicButton.onclick=()=>{soundtrack.setEnabled(!soundtrack.enabled);syncUI();};
document.querySelector('#music-volume').oninput=e=>soundtrack.setVolume(Number(e.target.value)/100);
const keys=new Set(),pending=new Set();
function syncUI(){
  MedievalI18n.set(MedievalI18n.lang);
  pause.textContent=t(mode==='paused'?'resume':'pause');
  musicButton.textContent=t(musicButton.disabled?'audioError':soundtrack.enabled?'musicOn':'musicOff');musicButton.setAttribute('aria-pressed',String(soundtrack.enabled));
  const resultKey=state.result==='win'?'win':state.result==='loss'?'loss':'draw';
  title.textContent=t(mode==='ended'?resultKey:mode==='paused'?'pausedTitle':'readyTitle');
  message.textContent=t(mode==='ended'?'endMessage':mode==='paused'?'pausedMessage':'readyMessage');
  start.textContent=t(assetError?'artError':!spriteSurface||!blueSurface?'loading':mode==='ended'?'again':mode==='paused'?'resume':'start');
  statusText.textContent=t(assetError?'loadError':mode==='ended'?resultKey:mode==='paused'?'pausedStatus':mode==='playing'?'playingStatus':'readyStatus');
}
document.querySelector('#language').onchange=e=>{MedievalI18n.set(e.target.value);syncUI();};
function queue(k){if(!keys.has(k)&&mode==='playing'&&['w','arrowup','j','k'].includes(k))pending.add(k);keys.add(k);}
function begin(){if(!spriteSurface||!blueSurface)return;soundtrack.pause();soundtrack.start(true);state=DragonEngine.create();trail=[100,100];acc=0;mode='playing';keys.clear();pending.clear();overlay.hidden=true;syncUI();}
function toggle(){if(mode==='playing'){mode='paused';soundtrack.pause();keys.clear();pending.clear();overlay.hidden=false;syncUI();}else if(mode==='paused'){mode='playing';soundtrack.start();overlay.hidden=true;syncUI();}}
start.onclick=()=>mode==='paused'?toggle():begin();pause.onclick=toggle;
window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;const k=e.key.toLowerCase();if(['a','d','w','j','k','l','p','r','arrowleft','arrowright','arrowup'].includes(k)){e.preventDefault();queue(k);if(!e.repeat&&k==='p')toggle();if(!e.repeat&&k==='r')begin();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(mode==='playing')toggle();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);queue(b.dataset.key);});b.addEventListener('click',e=>{if(e.detail===0&&['w','j','k'].includes(b.dataset.key)&&mode==='playing')pending.add(b.dataset.key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(b.dataset.key));});
function drawBar(x,y,w,value,blue=false,energy=false,damage=value){
  const h=energy?21:34,v=Math.max(0,Math.min(100,value)),fill=w*v/100;
  ctx.save();ctx.shadowBlur=energy?7:14;ctx.shadowColor=energy?'#ffbe3644':blue?'#1b9eff88':'#ff542f88';
  const metal=ctx.createLinearGradient(0,y-3,0,y+h+3);metal.addColorStop(0,'#ffe4a0');metal.addColorStop(.35,'#8d642b');metal.addColorStop(1,'#e6b663');ctx.fillStyle=metal;ctx.beginPath();ctx.roundRect(x-3,y-3,w+6,h+6,5);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#080e1c';ctx.fillRect(x,y,w,h);ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle='#ffe6a7';const dw=w*Math.max(v,damage)/100;ctx.fillRect(blue?x+w-dw:x,y,dw,h);
  const color=ctx.createLinearGradient(0,y,0,y+h);color.addColorStop(0,energy?'#fff4a3':blue?'#b9f6ff':'#ffd1a0');color.addColorStop(.28,energy?'#ffc93b':blue?'#24c7ff':'#ff6943');color.addColorStop(.6,energy?'#d88409':blue?'#0579cf':'#c92324');color.addColorStop(1,energy?'#ffe06a':blue?'#31ccff':'#ff6039');ctx.fillStyle=color;ctx.fillRect(blue?x+w-fill:x,y,fill,h);
  ctx.fillStyle='#ffffff35';ctx.fillRect(blue?x+w-fill:x,y+1,fill,h*.3);
  if(!energy){ctx.strokeStyle='#06112255';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+w*i/4,y+2);ctx.lineTo(x+w*i/4,y+h-2);ctx.stroke();}}
  ctx.font=energy?'bold 13px system-ui':'bold 16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillStyle='#fff';ctx.fillText(t(energy?'energy':'health')+' '+Math.ceil(v)+' / 100',x+w/2,y+h/2+1);ctx.restore();
}
function drawFighter(a,blue){
  const pose=DragonAnimation.pose(a,state.time),f=DragonAnimation.frames[pose.index];
  ctx.save();ctx.translate(a.x,DragonEngine.FLOOR);ctx.fillStyle='#0006';ctx.beginPath();const shadowScale=Math.max(.45,1-(DragonEngine.FLOOR-a.y)/350);ctx.ellipse(0,0,85*shadowScale,12*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(a.x,a.y);ctx.scale(a.dir,1);ctx.translate(pose.offset,0);ctx.rotate(pose.angle);ctx.scale(pose.sx,pose.sy);
  ctx.filter=a.flash>0&&a.hp>0?'brightness(1.6)':'none';
  if(spriteSurface&&blueSurface){const scale=.68;ctx.drawImage(blue?blueSurface:spriteSurface,...f,-f[2]*scale*.57,-f[3]*scale,f[2]*scale,f[3]*scale);}
  ctx.restore();
  if(a.hp<=0&&a.death>.65&&a.death<1.6){const t=(a.death-.65)/.95;ctx.save();ctx.globalAlpha=(1-t)*.65;ctx.fillStyle='#d6b98b';for(let i=0;i<12;i++){const dx=(i-5.5)*14*(t+.3),dy=-Math.sin(t*Math.PI)*(10+(i%3)*8);ctx.beginPath();ctx.arc(a.x+dx,a.y+dy,3+(i%4)*2,0,Math.PI*2);ctx.fill();}ctx.restore();}
  if(a.block){ctx.strokeStyle='#9edaff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(a.x+a.dir*55,a.y-85,35,85,0,0,Math.PI*2);ctx.stroke();}
  if(a.hp>0&&(a.shieldFlash>0||a.guardBroken>0)){ctx.save();ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillStyle=a.guardBroken>0?'#ffbd72':'#a5faff';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(t(a.guardBroken>0?'broken':'blocked'),a.x,a.y-170);ctx.restore();}
  if(a.attack>0&&a.attackType==='claw'){ctx.save();ctx.translate(a.x,a.y-75);ctx.scale(a.dir,1);ctx.strokeStyle=blue?'#98dfff':'#ffd79a';ctx.globalAlpha=a.attack/.3;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(65+i*10,-i*12,45,-1.1,1.1);ctx.stroke();}ctx.restore();}
}
function render(){
  ctx.clearRect(0,0,1120,630);if(arena.complete&&arena.naturalWidth)ctx.drawImage(arena,0,0,1120,630);else{ctx.fillStyle='#142139';ctx.fillRect(0,0,1120,630);}
  const shade=ctx.createLinearGradient(0,0,0,200);shade.addColorStop(0,'#050914e8');shade.addColorStop(1,'#05091400');ctx.fillStyle=shade;ctx.fillRect(0,0,1120,200);
  ctx.fillStyle='#fff0d3';ctx.font='bold 20px Georgia';ctx.textAlign='left';ctx.fillText('IGNIS · '+t('you'),35,40);ctx.textAlign='right';ctx.fillText('AZUR · '+t('computer'),1085,40);
  [state.player,state.enemy].forEach((a,i)=>{if(mode==='playing'&&a.flash<=0)trail[i]=Math.max(a.hp,trail[i]-visualDt*30);});
  drawBar(35,58,410,state.player.hp,false,false,trail[0]);drawBar(675,58,410,state.enemy.hp,true,false,trail[1]);drawBar(35,105,250,state.player.energy,false,true);drawBar(835,105,250,state.enemy.energy,true,true);
  ctx.textAlign='center';ctx.font='26px Georgia';ctx.fillStyle='#ffe0a3';ctx.fillText('VS',560,78);ctx.font='14px system-ui';ctx.fillText(Math.floor(state.time)+' s',560,105);
  drawFighter(state.player,false);drawFighter(state.enemy,true);
  for(const q of state.shots){const blue=q.owner===state.enemy;ctx.save();ctx.shadowBlur=22;ctx.shadowColor=blue?'#59c7ff':'#ff7929';ctx.fillStyle=blue?'#b8efff':'#ffdc82';ctx.beginPath();ctx.ellipse(q.x,q.y,24,12,0,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;visualDt=dt;if(mode==='playing'){acc+=dt;while(acc>=1/60){DragonEngine.update(state,{move:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),jump:pending.has('w')||pending.has('arrowup'),claw:keys.has('j')||pending.has('j'),fire:keys.has('k')||pending.has('k'),block:keys.has('l')},1/60);pending.clear();acc-=1/60;}if(state.result&&Math.max(state.player.death,state.enemy.death)>=1.8){mode='ended';soundtrack.pause();overlay.hidden=false;syncUI();}}else acc=0;render();requestAnimationFrame(frame);}
syncUI();requestAnimationFrame(frame);
