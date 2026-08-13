import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT || 8080);
const MAX_PLAYERS = 5;
const MATCH_SECONDS = 600;
const rooms = new Map();

function roomCode() {
  let code;
  do code = randomBytes(3).toString('hex').toUpperCase(); while (rooms.has(code));
  return code;
}
function send(ws, payload) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload)); }
function broadcast(room, payload) { for (const player of room.players.values()) send(player.ws, payload); }
function publicPlayers(room) { return [...room.players.values()].map(p => ({ id:p.id, name:p.name, kills:p.kills, x:p.x, y:p.y, hp:p.hp })); }
function snapshot(room) { return { type:'state', room:room.code, started:room.started, timeLeft:Math.max(0, MATCH_SECONDS - Math.floor((Date.now()-room.startedAt)/1000)), players:publicPlayers(room) }; }
function startRoom(room) {
  if (room.started) return;
  room.started = true; room.startedAt = Date.now();
  broadcast(room, { type:'match_start', ...snapshot(room) });
  room.timer = setInterval(() => {
    if (!rooms.has(room.code)) return clearInterval(room.timer);
    const left = Math.max(0, MATCH_SECONDS - Math.floor((Date.now()-room.startedAt)/1000));
    broadcast(room, { type:'tick', timeLeft:left });
    if (left <= 0) endRoom(room);
  }, 1000);
}
function endRoom(room) {
  clearInterval(room.timer);
  const winner = [...room.players.values()].sort((a,b)=>b.kills-a.kills)[0] || null;
  broadcast(room, { type:'match_end', winner:winner?.name || 'Nobody', scores:publicPlayers(room) });
  room.started = false;
}
function removePlayer(room, id) {
  room.players.delete(id);
  if (room.players.size === 0) { clearInterval(room.timer); rooms.delete(room.code); return; }
  broadcast(room, { type:'roster', players:publicPlayers(room) });
}

const wss = new WebSocketServer({ port: PORT });
wss.on('connection', ws => {
  let room = null; let id = null;
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'create') {
      if (room) return;
      const code = roomCode(); id = randomBytes(4).toString('hex');
      room = { code, players:new Map(), started:false, startedAt:0, timer:null };
      rooms.set(code, room); room.players.set(id, {id,name:String(msg.name||'Wizard').slice(0,16),kills:0,x:640,y:520,hp:100,ws});
      send(ws,{type:'room_created',room:code,id});
      send(ws,snapshot(room));
      return;
    }
    if (msg.type === 'join') {
      const candidate = rooms.get(String(msg.room||'').toUpperCase());
      if (!candidate) return send(ws,{type:'error',message:'Room not found.'});
      if (candidate.started) return send(ws,{type:'error',message:'That match has already started.'});
      if (candidate.players.size >= MAX_PLAYERS) return send(ws,{type:'error',message:'Room is full (5 players max).'});
      room = candidate; id = randomBytes(4).toString('hex');
      room.players.set(id,{id,name:String(msg.name||'Wizard').slice(0,16),kills:0,x:640,y:520,hp:100,ws});
      send(ws,{type:'room_joined',room:room.code,id});
      broadcast(room,{type:'roster',players:publicPlayers(room)});
      if (room.players.size >= 2) startRoom(room);
      return;
    }
    if (!room || !id) return;
    const player = room.players.get(id); if (!player) return;
    if (msg.type === 'start') startRoom(room);
    if (msg.type === 'state') {
      player.x = Number(msg.x)||player.x; player.y=Number(msg.y)||player.y; player.hp=Math.max(0,Math.min(100,Number(msg.hp)||player.hp));
      broadcast(room,{type:'player_state',player:{id,x:player.x,y:player.y,hp:player.hp,kills:player.kills}});
    }
    if (msg.type === 'kill') {
      const target = room.players.get(String(msg.target));
      if (target && target.id !== id) { player.kills += 1; target.hp=100; broadcast(room,{type:'score',id,kills:player.kills,target:target.id}); }
    }
    if (msg.type === 'leave') { removePlayer(room,id); room=null; id=null; }
  });
  ws.on('close',()=>{ if(room && id) removePlayer(room,id); });
});
console.log(`Magic Militia ephemeral room server listening on :${PORT}`);
