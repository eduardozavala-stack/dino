'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const hint=document.getElementById('hint'),statusEl=document.getElementById('status'),pauseButton=document.getElementById('pause');
let best=0;try{best=Number(localStorage.getItem('dino-rift-best'))||0}catch{}
let state='ready',score=0,speed=6,tick=0,ground=0,next=90,obstacles=[],clouds=[{x:170,y:44},{x:440,y:65},{x:610,y:24}],last=0,deadAt=0;
const dino={x:42,y:0,vy:0,duck:false};
const standing=['00000000111111111100','00000001111111111110','00000001101111111110','00000001111111111110','00000001111111111110','00000001111100000000','00000001111111100000','10000011111000000000','10000111111000000000','11001111111110000000','11111111111010000000','11111111111000000000','01111111110000000000','00111111110000000000','00011111100000000000','00001101100000000000','00001100110000000000','00001100010000000000','00001110011000000000'];
function rect(x,y,w,h){ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawDino(){ctx.save();ctx.translate(dino.x-42,0);const y=166-dino.y;if(dino.duck&&dino.y===0){rect(42,y-21,36,15);rect(74,y-25,25,15);ctx.clearRect(79,y-22,3,3);rect(38,y-25,5,12);rect(51,y-7,5,7);rect(77,y-7,5,7)}else{standing.forEach((r,j)=>[...r].forEach((p,i)=>{if(p==='1')rect(42+i*2,y-38+j*2,2,2)}));if(state==='running'&&dino.y===0){ctx.clearRect(tick%16<8?50:60,y-6,8,6);rect(tick%16<8?50:60,y-9,8,3)}if(state==='dead'){rect(58,y-34,6,2);rect(60,y-36,2,6)}}ctx.restore()}
function cactus(o){for(let n=0;n<o.count;n++){let x=o.x+n*17,y=166,h=o.h;rect(x+6,y-h,6,h);rect(x,y-h+9,4,15);rect(x+3,y-h+21,6,4);rect(x+14,y-h+5,4,16);rect(x+10,y-h+17,7,4)}}
function bird(o){rect(o.x+10,o.y+7,23,8);rect(o.x,o.y+7,13,3);rect(o.x+8,o.y,9,13);let flap=tick%24<12;rect(o.x+19,flap?o.y-12:o.y+13,7,16);rect(o.x+24,flap?o.y-18:o.y+23,5,9);rect(o.x+31,o.y+9,10,3)}
function label(text,x,y,size=14,align='left'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillText(text,x,y)}

// Simulation uses 60 Hz units; small substeps keep fast DASH collisions accurate.
const zones=[
 {name:'DESIERTO',mode:'land',bg:'#ffffff',ink:'#535353',accent:'#535353',tip:'Salta cactus y grietas. ↓ para esquivar aves.'},
 {name:'MEDIANOCHE',mode:'land',bg:'#171925',ink:'#e2e5f7',accent:'#b2a0ff',tip:'Cuidado con las grietas y los meteoritos señalados.'},
 {name:'ARRECIFE ABISAL',mode:'water',bg:'#062e42',ink:'#a4f6ee',accent:'#48dfef',tip:'↑ para nadar. Evita coral, medusas y megalodones.'},
 {name:'ESPECTRO',mode:'land',bg:'#291044',ink:'#fff0fc',accent:'#fa90e8',tip:'Salta las grietas. Usa DASH para atravesar peligros.'},
 {name:'MAR NEÓN',mode:'water',bg:'#102a49',ink:'#c5fff0',accent:'#78f1d3',tip:'Nada entre medusas. DASH atraviesa al megalodón.'},
 {name:'CIELOS DEL CRETÁCICO',mode:'air',bg:'#261931',ink:'#fff1d7',accent:'#ffbf7d',tip:'Mantén ↑ o Volar para subir. Suelta para planear. ↓ para descender.'}
];
let zoneIndex=0,level=1,zoneTime=0,dashTime=0,dashCooldown=0,deathReason='',trail=[],themeKey='';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const zoneEl=document.getElementById('zone'),dashEl=document.getElementById('dash'),dashFill=document.getElementById('dash-fill'),dashText=document.getElementById('dash-text');
const isWater=()=>zones[zoneIndex].mode==='water';
const isAir=()=>zones[zoneIndex].mode==='air';
const flightBounds={min:8,max:116};
const flightUp=new Set(),flightDown=new Set();
const flyButton=document.getElementById('jump'),duckButton=document.getElementById('duck');
const primaryAction=document.getElementById('primary-action');

function clearFlightControls(){
 flightUp.clear();
 flightDown.clear();
}

function syncFlightHelp(){
 const airborne=isAir();
 flyButton.textContent=airborne?'↑ Volar':'↑ Saltar / nadar';
 primaryAction.textContent=airborne?'mantener para volar y soltar para planear':'saltar o nadar';
 canvas.setAttribute('aria-label',airborne
  ?'Mantén Espacio o arriba para volar. Suelta para planear, abajo para descender, X o Shift para DASH.'
  :'Espacio o arriba para saltar o nadar, abajo para bajar, X o Shift para DASH.');
}

function moveFlight(dt,wind){
 const holdingControl=flightDown.size||flightUp.size;
 const targetSpeed=flightDown.size?-3.25:flightUp.size?2.65:-0.55;
 const correction=(holdingControl?0.34:0.72)*dt;
 const difference=targetSpeed+wind-dino.vy;
 dino.vy+=Math.max(-correction,Math.min(correction,difference));
 dino.y=Math.max(flightBounds.min,Math.min(flightBounds.max,dino.y+dino.vy*dt));
 if(dino.y===flightBounds.min||dino.y===flightBounds.max)dino.vy=0;
}
function playerBox(){const low=dino.duck&&dino.y===0&&!isWater();return{x:dino.x+6,y:166-dino.y-(low?22:35),w:low?45:25,h:low?20:33}}
function intersects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function hitBox(o){switch(o.type){case 'bird':return{x:o.x+5,y:o.y+2,w:30,h:15};case 'shark':return{x:o.x+8,y:o.y+4,w:83,h:27};case 'jelly':return{x:o.x+3,y:o.y+3,w:26,h:35};case 'meteor':return{x:o.x+4,y:o.y+4,w:23,h:23};default:return{x:o.x+3,y:169-o.h,w:o.w-4,h:o.h-3}}}
function applyTheme(){let z=zones[zoneIndex],bg=z.bg,ink=z.ink,accent=z.accent;if(zoneIndex>=3&&!isAir()&&!reducedMotion){let hue=(zoneTime*.12+zoneIndex*65)%360;bg=`hsl(${hue} 55% 13%)`;ink=`hsl(${(hue+150)%360} 95% 86%)`;accent=`hsl(${(hue+100)%360} 95% 70%)`}const key=bg+ink;if(key!==themeKey){themeKey=key;document.body.style.background=bg;document.body.style.color=ink;document.body.style.setProperty('--accent',accent)}return{bg,ink,accent}}

// Start times are in simulation ticks. Obstacles enter on the right and
// scroll into range, giving Dino room to find the opening before each pass.
const flightPatterns=[
 {at:100, threats:[
  {type:'pterosaur',x:652,y:72,w:44,h:21}
 ]},
 {at:305, threats:[
  {type:'gust',x:536,y:41,w:120,h:75,force:-1.05,warning:29},
  {type:'cliff',x:652,y:0,w:88,h:40},
  {type:'cliff',x:652,y:114,w:94,h:52}
 ]},
 {at:518, threats:[
  {type:'ash',x:652,y:0,w:125,h:59,warning:44},
  {type:'predator',x:672,y:117,w:74,h:49,extra:0.45}
 ]},
 {at:730, threats:[
  {type:'skyMeteor',x:652,y:-30,w:32,h:28,impactY:55,warning:41},
  {type:'cliff',x:633,y:0,w:95,h:69}
 ]},
 {at:935, threats:[
  {type:'gust',x:542,y:38,w:148,h:114,force:0.9,warning:29},
  {type:'cliff',x:644,y:102,w:105,h:64},
  {type:'pterosaur',x:693,y:115,w:44,h:21},
  {type:'predator',x:770,y:119,w:74,h:47,extra:0.45}
 ]}
];
const flightDeathReasons={
 pterosaur:'Te alcanzó un pterosaurio',
 cliff:'Choque con un acantilado',
 predator:'Te alcanzó un depredador',
 ash:'Entraste en ceniza volcánica',
 skyMeteor:'Impacto de meteorito'
};

function hitsFlightThreat(player,threat){
 const {type,x,y,w,h}=threat;
 if(type==='pterosaur')return intersects(player,{x:x+1,y:y+7,w:w-3,h:12});
 if(type==='predator'){
  return intersects(player,{x:x+3,y,w:w*.47,h:21})
   ||intersects(player,{x:x+1,y:y+15,w:w-2,h:h-28})
   ||intersects(player,{x:x+23,y:y+h-15,w:35,h:15});
 }
 return intersects(player,threat);
}

function stepFlight(dt,dashing){
 for(const pattern of flightPatterns){
  if(zoneTime-dt<pattern.at&&zoneTime>=pattern.at){
   for(const threat of pattern.threats)obstacles.push({...threat});
  }
 }
 for(const threat of obstacles){
  threat.x-=(speed+(threat.extra||0))*dt;
  if(threat.warning>0)threat.warning=Math.max(0,threat.warning-dt);
  if(threat.type==='skyMeteor'&&threat.warning===0){
   threat.y=Math.min(threat.impactY,threat.y+8.5*dt);
  }
 }
 obstacles=obstacles.filter(threat=>threat.x+threat.w>0);
 if(!dashing){
  let wind=0;
  const player=playerBox();
  for(const threat of obstacles){
   if(threat.type==='gust'&&threat.warning===0&&intersects(player,threat)){
    wind=threat.force;
    break;
   }
  }
  moveFlight(dt,wind);
 }
 const player=playerBox();
 for(const threat of obstacles){
  if(threat.passed||threat.warning>0||threat.type==='gust'||!hitsFlightThreat(player,threat))continue;
  if(dashing){
   threat.passed=true;
  }else{
   die(flightDeathReasons[threat.type]);
   break;
  }
 }
}
function changeZone(){
 level++;
 zoneIndex=(level-1)%zones.length;
 zoneTime=0;
 obstacles=[];
 next=125;
 dino.y=isAir()?(flightBounds.min+flightBounds.max)/2:isWater()?48:0;
 dino.vy=0;
 dino.duck=false;
 dino.x=42;
 dashTime=0;
 dashCooldown=0;
 trail=[];
 clearFlightControls();
 syncFlightHelp();
 const zone=zones[zoneIndex];
 hint.textContent=zone.tip;
 zoneEl.textContent=`${String(level).padStart(2,'0')} / ${zone.name}`;
 statusEl.textContent=`Nivel ${level}. ${zone.tip}`;
}
function start(){
 state='running';
 score=0;
 speed=6;
 tick=0;
 ground=0;
 next=95;
 obstacles=[];
 zoneIndex=0;
 level=1;
 zoneTime=0;
 dashTime=0;
 dashCooldown=0;
 deathReason='';
 trail=[];
 Object.assign(dino,{x:42,y:0,vy:0,duck:false});
 clearFlightControls();
 syncFlightHelp();
 hint.textContent=zones[0].tip;
 zoneEl.textContent='01 / DESIERTO';
 statusEl.textContent='Partida iniciada';
 syncPause();
}

function jump(){
 if(state==='dead'&&performance.now()-deadAt<350)return;
 if(state==='ready'||state==='dead')start();
 if(state!=='running'||isAir())return;
 if(isWater()||dino.y===0){
  dino.duck=false;
  dino.vy=isWater()?5:11.5;
 }
}
function dash(){if(state!=='running'||dashCooldown>0||dashTime>0)return false;dashTime=16;dashCooldown=210;dino.duck=false;statusEl.textContent='DASH activado';return true}
function syncPause(){pauseButton.textContent=state==='paused'?'▶ Continuar':'Ⅱ Pausa';pauseButton.setAttribute('aria-label',state==='paused'?'Continuar partida':'Pausar partida')}
function pause(){
 if(state==='running'){
  state='paused';
  clearFlightControls();
  if(isAir())dino.vy=0;
  hint.textContent='Partida en pausa. P para continuar.';
 }else if(state==='paused'){
  state='running';
  hint.textContent=zones[zoneIndex].tip;
 }
 syncPause();
}
function die(reason='Choque con un cactus'){
 state='dead';
 clearFlightControls();
 deadAt=performance.now();
 deathReason=reason;
 best=Math.max(best,Math.floor(score));
 try{localStorage.setItem('dino-rift-best',String(best))}catch{}
 hint.textContent=`${reason}. Espacio o toca el juego para reintentar.`;
 statusEl.textContent=`${reason}. Fin de la partida. ${Math.floor(score)} puntos.`;
}
function spawn(){let r=Math.random();if(isWater()){if(r<.38){obstacles.push({type:'shark',x:705,y:[65,110,134][Math.floor(Math.random()*3)],w:102,extra:1.2})}else if(r<.7){obstacles.push({type:'jelly',x:690,y:[68,115][Math.floor(Math.random()*2)],baseY:0,phase:Math.random()*6,w:32})}else obstacles.push({type:'coral',x:680,h:38+Math.random()*15,count:2,w:34});}else if(r<.22&&score>55){obstacles.push({type:'gap',x:680,w:72+Math.random()*30})}else if(r<.43&&score>80){obstacles.push({type:'bird',x:680,y:[115,137][Math.floor(Math.random()*2)],w:40})}else if(r<.62&&zoneIndex!==0){obstacles.push({type:'meteor',x:680,y:-25,w:30,warning:48,vy:0})}else{let count=1+Math.floor(Math.random()*2);obstacles.push({type:'cactus',x:680,h:30+Math.random()*12,count,w:count*17})}
 // Enough room to land or recover before the next threat, including at top speed.
 next=(330+Math.random()*150+speed*22)/speed;
}
function step(dt){tick+=dt;zoneTime+=dt;score+=dt*.22;speed=Math.min(10,6+(level-1)*.55+zoneTime/5000);ground+=speed*dt;if(zoneTime>=1200){changeZone();return}clouds.forEach(c=>{c.x-=.3*dt;if(c.x< -50)c.x=670});dashCooldown=Math.max(0,dashCooldown-dt);const active=dashTime>0;if(active){dashTime=Math.max(0,dashTime-dt);dino.x=Math.min(206,dino.x+10.25*dt);trail.push({x:dino.x,y:dino.y,life:10});}else dino.x=Math.max(42,dino.x-3.8*dt);trail.forEach(t=>t.life-=dt);trail=trail.filter(t=>t.life>0);
 if(isAir()){stepFlight(dt,active);return;}
 if(isWater()){if(!active){dino.vy-=(dino.duck?.32:.1)*dt;dino.y+=dino.vy*dt;if(dino.y<0){dino.y=0;dino.vy=0}if(dino.y>95){dino.y=95;dino.vy=Math.min(0,dino.vy)}}}else if(!active&&(dino.y>0||dino.vy>0)){dino.y+=dino.vy*dt;dino.vy-=(dino.duck?1.3:.6)*dt;if(dino.y<0){dino.y=0;dino.vy=0}}
 next-=dt;if(next<=0)spawn();for(const o of obstacles){o.x-=(speed+(o.extra||0))*dt;if(o.type==='meteor'){o.warning-=dt;if(o.warning<=0){o.vy+=.2*dt;o.y=Math.min(140,o.y+o.vy*dt)}}if(o.type==='jelly'){if(!o.baseY)o.baseY=o.y;o.y=o.baseY+Math.sin(tick*.045+o.phase)*10}}obstacles=obstacles.filter(o=>o.x+o.w> -30&&o.y<215||o.x+o.w> -30&&o.y===undefined);
 const box=playerBox();for(const o of obstacles){if(o.passed)continue;if(o.type==='gap'){if(box.x+box.w>o.x+7&&box.x<o.x+o.w-7&&dino.y<7&&!active){die('Caíste en una grieta');break}continue}if(o.type==='meteor'&&o.warning>0)continue;if(intersects(box,hitBox(o))){if(active){o.passed=true;continue}die(({bird:'Te alcanzó un pterodáctilo',shark:'Te atrapó el megalodón',jelly:'Descarga de una medusa',coral:'Choque con coral afilado',meteor:'Impacto de meteorito'})[o.type]||'Choque con un cactus');break}}
}
function update(dt){let remaining=Math.min(dt,3);while(remaining>0&&state==='running'){let n=Math.min(.25,remaining);step(n);remaining-=n}}
function shark(o){ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));rect(12,8,66,24);rect(5,14,12,12);rect(0,19,12,6);rect(24,3,43,8);rect(41,-10,8,18);rect(36,-4,8,12);rect(75,14,13,12);rect(86,5,8,32);rect(94,1,6,11);rect(94,30,6,12);ctx.fillStyle='#062e42';rect(15,14,4,4);rect(3,25,33,6);ctx.fillStyle='#f4ffff';for(let i=0;i<5;i++)rect(9+i*5,25,2,3);ctx.restore()}
function jelly(o){rect(o.x+5,o.y,22,5);rect(o.x,o.y+5,32,15);rect(o.x+4,o.y+20,24,4);for(let i=0;i<4;i++){let sway=Math.round(Math.sin(tick*.1+i)*3);rect(o.x+4+i*7,o.y+23,3,8);rect(o.x+4+i*7+sway,o.y+30,3,8)}}
const flightSky=ctx.createLinearGradient(0,0,0,166);
flightSky.addColorStop(0,'#332342');
flightSky.addColorStop(.57,'#a05a63');
flightSky.addColorStop(1,'#ffc394');

function fillPolygon(points){
 ctx.beginPath();
 ctx.moveTo(points[0][0],points[0][1]);
 for(const [x,y] of points.slice(1))ctx.lineTo(x,y);
 ctx.closePath();
 ctx.fill();
}

function drawFlightScenery(){
 ctx.fillStyle=flightSky;
 rect(0,0,640,166);
 ctx.fillStyle='#ffc986';
 fillPolygon([[500,44],[536,44],[536,50],[548,50],[548,62],[554,62],[554,83],[548,83],[548,95],[536,95],[536,101],[500,101],[500,95],[488,95],[488,83],[482,83],[482,62],[488,62],[488,50],[500,50]]);
 ctx.fillStyle='#f6aa80';
 rect(477,75,87,4);
 rect(482,89,75,3);
 const parallax=reducedMotion?0:ground;
 ctx.fillStyle='#88536c';
 for(let index=0;index<4;index++){
  const x=index*214-((parallax*.09)%214);
  const peak=index%2===0?106:121;
  fillPolygon([[x,167],[x+31,148],[x+53,148],[x+90,peak],[x+119,peak],[x+156,144],[x+182,144],[x+214,166],[x+214,190],[x,190]]);
 }
 ctx.fillStyle='#4c324e';
 for(let index=0;index<5;index++){
  const x=index*168-((parallax*.19)%168);
  fillPolygon([[x,190],[x,157],[x+24,157],[x+32,143],[x+68,143],[x+73,157],[x+128,157],[x+150,168],[x+168,168],[x+168,190]]);
 }
 ctx.fillStyle='#2e203a';
 rect(0,166,640,44);
 ctx.fillStyle='#bf776e';
 rect(0,166,640,2);
 for(let index=0;index<10;index++){
  const x=((index*78-parallax*.28)%720+720)%720-34;
  if(x<418)rect(x,179+(index%3)*7,10+index%5*4,2);
 }
}

function drawFlightWarning(x,y,w,h){
 ctx.fillStyle='#4d283e';
 ctx.globalAlpha=.32;
 rect(x,y,w,h);
 ctx.globalAlpha=1;
 ctx.save();
 ctx.strokeStyle='#2e203a';
 ctx.lineWidth=4;
 ctx.strokeRect(x+1,y+1,w-2,h-2);
 ctx.strokeStyle='#ffde9a';
 ctx.lineWidth=2;
 ctx.setLineDash([6,4]);
 ctx.strokeRect(x+1,y+1,w-2,h-2);
 ctx.restore();
}

function drawFlightThreat(threat){
 const {x,y,w,h,type}=threat;
 if(type==='gust'){
  const direction=Math.sign(threat.force);
  ctx.fillStyle='#3a344d';
  ctx.globalAlpha=.78;
  rect(x,y,w,h);
  ctx.globalAlpha=1;
  if(threat.warning>0)drawFlightWarning(x,y,w,h);
  ctx.fillStyle='#c4f7ed';
  for(let offset=14;offset<w-6;offset+=25){
   const center=y+h/2+(offset%3-1)*9;
   rect(x+offset,center-8,3,16);
   const tip=center-direction*8;
   fillPolygon([[x+offset-6,tip+direction*3],[x+offset+1.5,tip-direction*5],[x+offset+9,tip+direction*3]]);
  }
  return;
 }
 if(threat.warning>0){
  const targetY=type==='skyMeteor'?threat.impactY:y;
  drawFlightWarning(x,targetY,w,h);
  ctx.fillStyle='#fff1d7';
  label('!',x+w/2,targetY+h/2+7,21,'center');
  if(type==='skyMeteor'){
   for(let mark=5;mark<targetY;mark+=9)rect(x+w/2-1,mark,2,5);
  }
  return;
 }
 ctx.globalAlpha=threat.passed?.28:1;
 if(type==='pterosaur'){
  const raised=reducedMotion||tick%20<10;
  ctx.fillStyle='#3d2442';
  rect(x+2,y+7,13,9);
  rect(x,y+12,10,4);
  rect(x+9,y+10,28,8);
  fillPolygon([[x+35,y+10],[x+w,y+13],[x+35,y+18]]);
  ctx.fillStyle='#793c60';
  const wingTip=raised?y:y+h;
  fillPolygon([[x+15,y+13],[x+30,wingTip],[x+41,wingTip],[x+31,y+14]]);
  ctx.fillStyle='#ffe2a3';
  rect(x+6,y+9,3,2);
 }else if(type==='cliff'){
  ctx.fillStyle='#38253e';
  rect(x,y,w,h);
  ctx.fillStyle='#ada1bb';
  rect(x,y===0?y+h-3:y,w,3);
  ctx.fillStyle='#664a6a';
  for(let offset=8;offset<w-12;offset+=21){
   rect(x+offset,y+10,10,3);
   rect(x+offset+4,y+h-13,5,3);
  }
 }else if(type==='predator'){
  ctx.fillStyle='#53263d';
  rect(x+1,y+15,w-2,h-28);
  rect(x+3,y,w*.47,21);
  rect(x+w-16,y+12,15,7);
  rect(x+23,y+h-15,12,15);
  rect(x+48,y+h-15,10,15);
  ctx.fillStyle='#ffc183';
  rect(x+8,y+6,5,4);
  for(let offset=6;offset<w*.42;offset+=8)rect(x+offset,y+15,4,5);
 }else if(type==='ash'){
  ctx.fillStyle='#4e3148';
  rect(x,y,w,h);
  ctx.fillStyle='#e1a29c';
  for(let offset=0;offset<w-6;offset+=13){
   rect(x+offset,y+h-3,9,3);
   rect(x+offset+3,y+8+offset%(h-16),4,3);
  }
 }else if(type==='skyMeteor'){
  ctx.fillStyle='#ffb770';
  rect(x+5,y-13,w-10,17);
  ctx.fillStyle='#652e47';
  rect(x,y,w,h);
  ctx.fillStyle='#ff905c';
  rect(x+4,y+4,w-8,h-8);
  ctx.fillStyle='#ffda96';
  rect(x+9,y+5,w-17,5);
  rect(x+5,y+h-9,5,5);
 }
 ctx.globalAlpha=1;
}

function drawFlightDino(theme){
 const x=dino.x,y=166-dino.y;
 const wingTip=reducedMotion||!flightUp.size||tick%16<8?y-40:y-11;
 ctx.fillStyle='#442940';
 fillPolygon([[x+17,y-18],[x-7,wingTip],[x-8,y-16],[x+7,y-6],[x+22,y-12]]);
 ctx.fillStyle=theme.accent;
 fillPolygon([[x+17,y-19],[x-4,wingTip+5],[x-4,y-17],[x+7,y-10]]);
 ctx.fillStyle='#442940';
 ctx.save();
 ctx.translate(1,1);
 drawDino();
 ctx.restore();
 ctx.fillStyle=dashTime>0?theme.accent:theme.ink;
 drawDino();
}

function draw(){ctx.clearRect(0,0,640,210);const z=applyTheme();ctx.fillStyle=z.ink;const water=isWater();
 if(isAir()){
  drawFlightScenery();
  for(const threat of obstacles)drawFlightThreat(threat);
 }else{
 ctx.globalAlpha=.4;if(water){for(let i=0;i<17;i++){let x=(i*47-ground*.3+1360)%680,y=60+(i*31-tick*.5)%100;ctx.strokeStyle=z.ink;ctx.strokeRect(x,y,3+i%3,3+i%3)}}else clouds.forEach(c=>{rect(c.x,c.y+8,43,1);rect(c.x+5,c.y+3,10,1);rect(c.x+15,c.y-3,13,1);rect(c.x+15,c.y-3,1,7);rect(c.x+28,c.y-2,1,6);rect(c.x+29,c.y+3,9,1);rect(c.x+38,c.y+4,1,4)});ctx.globalAlpha=1;
 if(water){ctx.globalAlpha=.1;rect(0,48,640,130);ctx.globalAlpha=.7;for(let i=0;i<34;i++)rect(i*20,48+Math.sin(i+tick*.035)*2,14,1);ctx.globalAlpha=1}rect(0,166,640,1);for(let i=0;i<25;i++){let x=((i*37-ground)%680+680)%680;rect(x,170+(i*7%11),i%3===0?7:3,1)}
 for(const o of obstacles){ctx.fillStyle=o.passed?z.accent:z.ink;ctx.globalAlpha=o.passed?.15:1;if(o.type==='gap'){ctx.fillStyle=z.bg;rect(o.x,164,o.w,24);ctx.fillStyle=z.accent;rect(o.x,166,3,25);rect(o.x+o.w-3,166,3,25);for(let n=8;n<o.w-5;n+=12)rect(o.x+n,191,5,4)}else if(o.type==='bird')bird(o);else if(o.type==='shark')shark(o);else if(o.type==='jelly')jelly(o);else if(o.type==='meteor'){if(o.warning>0){ctx.globalAlpha=.6;label('!',o.x+15,70,22,'center');rect(o.x+14,82,2,62)}else{ctx.fillStyle=z.accent;rect(o.x+4,o.y+4,23,23);rect(o.x+8,o.y-9,6,15);rect(o.x+17,o.y-17,5,24)}}else cactus(o)}ctx.globalAlpha=1;
 }
 if(!reducedMotion){for(const t of trail){ctx.globalAlpha=t.life/35;ctx.fillStyle=z.accent;rect(t.x,166-t.y-32,30,25)}ctx.globalAlpha=1}
 ctx.fillStyle=dashTime>0?z.accent:z.ink;
 if(isAir())drawFlightDino(z);else drawDino();
 if(dashTime>0){ctx.strokeStyle=z.accent;ctx.lineWidth=2;ctx.strokeRect(dino.x-5,166-dino.y-43,49,47)}
 const scoreY=isAir()?193:20;
 ctx.fillStyle=z.ink;
 ctx.globalAlpha=.6;
 label('HI '+String(Math.floor(best)).padStart(5,'0'),430,scoreY);
 ctx.globalAlpha=1;
 label(String(Math.floor(score)).padStart(5,'0'),635,scoreY,14,'right');
 ctx.fillStyle=z.accent;
 rect(0,205,640*Math.min(1,zoneTime/1200),3);
 if(state==='ready')label('¿LISTO PARA EL SIGUIENTE NIVEL?',320,86,16,'center');if(state==='running'&&zoneTime<110&&level>1){ctx.globalAlpha=Math.min(1,(110-zoneTime)/25);label(zones[zoneIndex].name,320,85,19,'center');ctx.globalAlpha=1}if(state==='dead'||state==='paused'){ctx.fillStyle=z.bg;ctx.globalAlpha=.94;rect(135,55,380,66);ctx.globalAlpha=1;ctx.fillStyle=z.ink;label(state==='dead'?'G A M E  O V E R':'PAUSA',320,82,18,'center');if(state==='dead')label(deathReason,320,107,13,'center')}
 const ready=dashCooldown===0;dashFill.style.width=`${100*(1-dashCooldown/210)}%`;dashText.textContent=dashTime>0?'DASH ACTIVO':ready?'DASH LISTO':`RECARGA ${(dashCooldown/60).toFixed(1)}s`;dashEl.disabled=state!=='running'||!ready;
}
function frame(now){const dt=last?Math.min((now-last)/16.6667,3):0;last=now;if(state==='running')update(dt);draw();requestAnimationFrame(frame)}
const ascendKeys=['Space','ArrowUp'];
const descentKey='ArrowDown';
const dashKeys=['ShiftLeft','ShiftRight','KeyX'];
addEventListener('keydown',e=>{
 if(e.defaultPrevented||(e.target.tagName==='BUTTON'&&e.code==='Space'))return;
 if(e.code==='KeyP'&&!e.repeat){pause();return;}
 if(dashKeys.includes(e.code)){
  e.preventDefault();
  if(!e.repeat)dash();
  return;
 }
 const ascending=ascendKeys.includes(e.code);
 if(!ascending&&e.code!==descentKey)return;
 e.preventDefault();
 if(isAir()&&state==='running'){
  if(!e.repeat)(ascending?flightUp:flightDown).add(e.code);
 }else if(ascending&&!e.repeat){
  jump();
 }else if(e.code===descentKey&&!isAir()){
  dino.duck=true;
 }
});
addEventListener('keyup',e=>{
 flightUp.delete(e.code);
 flightDown.delete(e.code);
 if(e.code===descentKey)dino.duck=false;
 if(!isAir()&&!isWater()&&ascendKeys.includes(e.code)&&dino.vy>5)dino.vy=5;
});
addEventListener('blur',()=>{
 dino.duck=false;
 clearFlightControls();
 if(state==='running')pause();
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&state==='running')pause();
});

function bindFlightInput(control,inputs,onLegacyDown,onLegacyUp){
 control.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  if(isAir()&&state==='running'){
   e.preventDefault();
   control.setPointerCapture(e.pointerId);
   inputs.add(e.pointerId);
  }else if(!isAir()||state==='dead'){
   onLegacyDown?.(e);
  }
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture']){
  control.addEventListener(name,e=>{
   inputs.delete(e.pointerId);
   if(!isAir())onLegacyUp?.();
  });
 }
}

function bindFlightButton(button,inputs,legacyPress,legacyRelease){
 const activationKey=code=>code==='Enter'||code==='Space';
 button.addEventListener('keydown',e=>{
  if(!activationKey(e.code))return;
  if(isAir()&&state==='running'){
   e.preventDefault();
   if(!e.repeat)inputs.add(`button-${e.code}`);
  }else if(!isAir()&&legacyPress){
   e.preventDefault();
   legacyPress();
  }
 });
 button.addEventListener('keyup',e=>{
  if(!activationKey(e.code))return;
  inputs.delete(`button-${e.code}`);
  if(!isAir())legacyRelease?.();
 });
 button.addEventListener('blur',()=>{
  for(const code of ['Space','Enter'])inputs.delete(`button-${code}`);
 });
}

bindFlightInput(canvas,flightUp,e=>{e.preventDefault();jump();});
bindFlightInput(flyButton,flightUp);
bindFlightInput(duckButton,flightDown,e=>{
 e.preventDefault();
 duckButton.setPointerCapture(e.pointerId);
 dino.duck=true;
},()=>{dino.duck=false;});
bindFlightButton(flyButton,flightUp);
bindFlightButton(duckButton,flightDown,()=>{dino.duck=true;},()=>{dino.duck=false;});
pauseButton.onclick=pause;
flyButton.onclick=jump;
dashEl.onclick=dash;
requestAnimationFrame(frame);

