const $ = id => document.getElementById(id);
const screens = { landing:$('landing'), lobby:$('lobby'), game:$('game') };
let name = '';
let roomCode = '';
let playerId = 'local';
let socket = null;
let online = false;
let matchStarted = false;
let timeLeft = 600;
let lastFrame = performance.now();
let raf = 0;
let keys = new Set();
let mouse = {x:640,y:360,down:false};
let projectiles = [];
let meleeFlash = 0;
let local = {id:'local',name:'Wizard',x:640,y:520,vx:0,vy:0,hp:100,kills:0,fuel:100,respawn:0};
let players = new Map();
let bots = [];

function show(screen){Object.values(screens).forEach(s=>s.classList.remove('active')); screens[screen].classList.add('active');}
function cleanName(){return $('playerName').value.trim().replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,16);}
function setError(text=''){ $('nameError').textContent=text; }
function connect(){
  if(location.protocol === 'file:') return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  try { socket = new WebSocket(`${proto}://${location.host}`); } catch { return; }
  socket.onopen=()=>{online=true}; socket.onclose=()=>{online=false};
  socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return} ; handleServer(m)};
}
function send(msg){if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify(msg));}
function handleServer(m){
  if(m.type==='error'){ $('roomInfo').classList.remove('hidden'); $('roomInfo').innerHTML=`<b>Could not join:</b> ${m.message}`; return; }
  if(m.type==='room_created'||m.type==='room_joined'){roomCode=m.room;playerId=m.id;showRoomInfo();}
  if(m.type==='roster'||m.type==='state') syncPlayers(m.players||[]);
  if(m.type==='match_start'){matchStarted=true;timeLeft=m.timeLeft??600;startGame(false);}
  if(m.type==='tick'){timeLeft=m.timeLeft??timeLeft;}
  if(m.type==='player_state'){
    const p=m.player;if(p.id!==playerId){const old=players.get(p.id)||{x:p.x,y:p.y};players.set(p.id,{...old,...p});}
  }
  if(m.type==='score'){const p=players.get(m.id);if(p)p.kills=m.kills;if(m.id===playerId)local.kills=m.kills;}
  if(m.type==='match_end'){timeLeft=0;endMatch(m.winner,m.scores||[]);}
}
function syncPlayers(list){
  const next=new Map(); for(const p of list){if(p.id===playerId){local={...local,...p,id:playerId,name};}else next.set(p.id,{...p,vx:0,vy:0});} players=next; updateScoreboard();}
function showRoomInfo(){const box=$('roomInfo');box.classList.remove('hidden');box.innerHTML=`<div>ROOM CODE</div><div class="room-code">${roomCode}</div><div style="color:#9ca3c7;margin-top:8px">Share this code. The match begins when a second wizard joins.</div><button id="startRoom" class="secondary" style="margin-top:14px">START PRACTICE MATCH</button>`;$('startRoom').onclick=()=>{send({type:'start'});startGame(true)};}
function ensureName(){name=cleanName();if(!name){setError('Pick a wizard name first.');$('playerName').focus();return false}setError('');return true;}
function createRoom(){if(!ensureName())return;show('lobby');if(online)send({type:'create',name});else{roomCode=randomCode();showRoomInfo();}}
function joinRoom(){if(!ensureName())return;const code=$('roomCode').value.trim().toUpperCase();if(code.length!==6){$('roomInfo').classList.remove('hidden');$('roomInfo').innerHTML='<b>Enter a 6-character room code.</b>';return}if(online)send({type:'join',room:code,name});else{roomCode=code;showRoomInfo();}}
function randomCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function startGame(practice){show('game');matchStarted=true;timeLeft=600;projectiles=[];meleeFlash=0;local={id:playerId,name,x:640,y:520,vx:0,vy:0,hp:100,kills:0,fuel:100,respawn:0};players=new Map();bots=[];if(practice||!online){for(let i=0;i<3;i++){bots.push({id:`bot-${i}`,name:['Ember Adept','Frost Hex','Rune Rat'][i],x:220+i*380,y:280,vx:0,vy:0,hp:100,kills:0,fuel:100,respawn:0,shot:0})}}$('roomBadge').textContent=`ROOM ${roomCode}`;$('matchEnd').classList.add('hidden');lastFrame=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function loop(now){const dt=Math.min(.033,(now-lastFrame)/1000);lastFrame=now;if(!matchStarted)return;update(dt);draw();raf=requestAnimationFrame(loop)}
function update(dt){if(timeLeft<=0){endMatch(null,[local,...bots,...players.values()]);return}timeLeft=Math.max(0,timeLeft-dt);$('timer').textContent=formatTime(timeLeft);if(local.respawn>0){local.respawn-=dt;if(local.respawn<=0){local.x=640;local.y=520;local.hp=100;local.fuel=100}}else updateLocal(dt);bots.forEach(b=>updateBot(b,dt));for(const p of players.values()){p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,55,1225);p.y=clamp(p.y,55,665)}updateProjectiles(dt);meleeFlash=Math.max(0,meleeFlash-dt);if(online)send({type:'state',x:local.x,y:local.y,hp:local.hp});updateHud();}
function updateLocal(dt){let axis=(keys.has('a')||keys.has('ArrowLeft')?-1:0)+(keys.has('d')||keys.has('ArrowRight')?1:0);local.vx += (axis*320-local.vx)*Math.min(1,10*dt);if(keys.has(' ')&&local.fuel>0){local.vy-=900*dt;local.fuel=Math.max(0,local.fuel-55*dt)}else{local.vy+=1100*dt;local.fuel=Math.min(100,local.fuel+22*dt)}local.vy=clamp(local.vy,-650,750);local.x+=local.vx*dt;local.y+=local.vy*dt;collideWalls(local);if(mouse.down)cast();}
function collideWalls(p){if(p.x<58){p.x=58;p.vx=Math.abs(p.vx)*.45}if(p.x>1222){p.x=1222;p.vx=-Math.abs(p.vx)*.45}if(p.y<58){p.y=58;p.vy=Math.abs(p.vy)*.45}if(p.y>662){p.y=662;p.vy=-Math.abs(p.vy)*.45}}
function updateBot(b,dt){if(b.respawn>0){b.respawn-=dt;return}const target=local;const dx=target.x-b.x;const dy=target.y-b.y;b.vx+=(Math.sign(dx)*180-b.vx)*dt*2;b.vy+=(Math.sign(dy)*60-b.vy)*dt;if(Math.abs(dx)<650&&Math.random()<dt*.9)botCast(b);b.x+=b.vx*dt;b.y+=b.vy*dt;collideWalls(b);b.shot=Math.max(0,b.shot-dt)}
function botCast(b){if(b.shot>0)return;b.shot=.7;const a=Math.atan2(local.y-b.y,local.x-b.x);projectiles.push({owner:b.id,x:b.x,y:b.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:1.8,damage:18});}
function cast(){if(!cast.cool||cast.cool<=0){cast.cool=.16;const a=Math.atan2(mouse.y-local.y,mouse.x-local.x);projectiles.push({owner:playerId,x:local.x,y:local.y,vx:Math.cos(a)*760,vy:Math.sin(a)*760,life:1.5,damage:22});}else cast.cool-=1/60}
function melee(){if(local.respawn>0)return;meleeFlash=.18;const targets=[...bots,...players.values()];for(const t of targets){if(t.respawn>0)continue;const dx=t.x-local.x,dy=t.y-local.y;if(Math.hypot(dx,dy)<86){t.hp-=30;t.vx+=(dx>0?1:-1)*420;t.vy-=180;if(t.hp<=0)scoreKill(local,t)}}}
function scoreKill(killer,target){killer.kills++;target.hp=100;target.respawn=1.2;target.x=640;target.y=520;if(killer===local&&online)send({type:'kill',target:target.id});updateScoreboard()}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.x<50||p.x>1230||p.y<50||p.y>670)p.life=0;const targets=[local,...bots,...players.values()];for(const t of targets){if(t.id===p.owner||t.respawn>0)continue;if(Math.hypot(t.x-p.x,t.y-p.y)<22){t.hp-=p.damage;p.life=0;t.vx+=(p.vx>0?1:-1)*140;t.vy-=80;if(t.hp<=0){const killer=p.owner===playerId?local:players.get(p.owner)||bots.find(b=>b.id===p.owner);if(killer)scoreKill(killer,t)}break}}if(p.life<=0)projectiles.splice(i,1)}}
function updateHud(){$('hpBar').style.width=`${local.hp}%`;$('fuelBar').style.width=`${local.fuel}%`;updateScoreboard()}
function updateScoreboard(){const all=[local,...bots,...players.values()].sort((a,b)=>b.kills-a.kills);$('scoreboard').innerHTML=all.map(p=>`<div class="score-row ${p.id===playerId?'me':''}"><span>${escapeHtml(p.name)}</span><b>${p.kills}</b></div>`).join('')}
function draw(){const c=$('gameCanvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#070817';ctx.fillRect(0,0,c.width,c.height);const g=ctx.createRadialGradient(640,340,50,640,340,650);g.addColorStop(0,'#211c4b');g.addColorStop(1,'#08091b');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);drawArena(ctx);for(const p of projectiles)drawSpell(ctx,p);for(const b of bots)drawWizard(ctx,b,'#f97316');for(const p of players.values())drawWizard(ctx,p,'#38bdf8');drawWizard(ctx,local,'#a78bfa',true);if(meleeFlash>0){ctx.strokeStyle=`rgba(221,214,254,${meleeFlash/.18})`;ctx.lineWidth=10;ctx.beginPath();ctx.arc(local.x,local.y,70,-.9,.9);ctx.stroke()}}
function drawArena(ctx){ctx.strokeStyle='#8b5cf6';ctx.lineWidth=6;ctx.strokeRect(40,40,1200,640);ctx.fillStyle='#312e81';for(const r of [[45,398,210,24],[1025,398,210,24],[490,528,300,24],[255,239,190,22],[835,239,190,22],[565,340,150,20]])ctx.fillRect(...r);ctx.strokeStyle='#a78bfa';ctx.lineWidth=2;for(const r of [[45,398,210,24],[1025,398,210,24],[490,528,300,24],[255,239,190,22],[835,239,190,22],[565,340,150,20]]){ctx.strokeRect(...r)}}
function drawSpell(ctx,p){const grd=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,15);grd.addColorStop(0,'#fff');grd.addColorStop(.3,'#fde68a');grd.addColorStop(1,'#f97316');ctx.fillStyle=grd;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();}
function drawWizard(ctx,p,glow,me=false){ctx.save();ctx.translate(p.x,p.y);const a=Math.atan2(mouse.y-p.y,mouse.x-p.x);ctx.shadowBlur=me?28:18;ctx.shadowColor=glow;ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(-20,28);ctx.lineTo(0,-5);ctx.lineTo(20,28);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f2c7a5';ctx.beginPath();ctx.arc(0,-16,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#312e81';ctx.beginPath();ctx.moveTo(-19,-21);ctx.lineTo(0,-52);ctx.lineTo(19,-21);ctx.closePath();ctx.fill();ctx.fillStyle='#f97316';ctx.fillRect(-17,28,8,14);ctx.fillRect(9,28,8,14);ctx.strokeStyle='#fef3c7';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*30,Math.sin(a)*30);ctx.stroke();ctx.restore();}
function endMatch(winner,scores){matchStarted=false;cancelAnimationFrame(raf);const all=(scores||[local,...bots,...players.values()]).sort((a,b)=>b.kills-a.kills);const champ=winner||all[0]?.name||'Nobody';$('winnerText').textContent=`${champ} rules the arena ✦`;$('finalScores').innerHTML=all.map(p=>`<div class="final-score"><span>${escapeHtml(p.name)}</span><b>${p.kills} kills</b></div>`).join('');$('matchEnd').classList.remove('hidden');}
function formatTime(t){const n=Math.ceil(t);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

$('playNow').onclick=()=>{if(!ensureName())return;show('lobby');$('createRoom').focus()};
$('createRoom').onclick=()=>{if(!ensureName())return;if(online)send({type:'create',name});else{roomCode=randomCode();showRoomInfo()}};
$('joinRoom').onclick=joinRoom;
$('leaveGame').onclick=()=>{send({type:'leave'});matchStarted=false;show('lobby');};
$('playAgain').onclick=()=>{if(online)send({type:'start'});startGame(true)};
$('closeHow').onclick=()=>$('howDialog').close();
document.querySelector('[data-action="how"]').onclick=()=>$('howDialog').showModal();
document.querySelector('[data-action="back"]').onclick=()=>show('landing');
window.addEventListener('keydown',e=>{keys.add(e.key);if([' ','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='f')melee();if(e.key==='Enter'&&screens.landing.classList.contains('active'))$('playNow').click()});
window.addEventListener('keyup',e=>keys.delete(e.key));
$('gameCanvas').addEventListener('mousemove',e=>{const r=e.currentTarget.getBoundingClientRect();mouse.x=(e.clientX-r.left)*1280/r.width;mouse.y=(e.clientY-r.top)*720/r.height});
$('gameCanvas').addEventListener('mousedown',e=>{if(e.button===0)mouse.down=true});window.addEventListener('mouseup',e=>{if(e.button===0)mouse.down=false});
connect();
