/* Stable final champion renderer. Loaded after characters.js so it owns the picker and canvas drawing. */
(() => {
  const SHEET_URL = './sprites/basic2.svg';
  const sheet = new Image();
  sheet.src = SHEET_URL;
  let ready = false;
  sheet.onload = () => { ready = true; renderCards(); };
  const data = [
    ['adept-necromancer','Adept Necromancer','Soul Reaper','HP 115 · Damage 27 · Regen on kill',115,1,1.23,1,.16,1,86],
    ['corrupted-treant','Corrupted Treant','Rotten Armor','HP 145 · Damage 25 · Speed 78%',145,.78,1.14,.9,.19,1.1,92],
    ['deft-sorceress','Deft Sorceress','Arcane Rush','Speed 125% · Damage 20 · Fire rate 135%',85,1.25,.91,1.05,.115,.85,82],
    ['earth-elemental','Earth Elemental','Stoneheart','HP 165 · Damage 34 · Speed 62%',165,.62,1.55,.78,.23,1.35,100],
    ['expert-druid','Expert Druid','Verdant Ward','HP 125 · Fuel 135% · Damage 24',125,1.03,1.09,1,.16,1,86],
    ['fire-elemental','Fire Elemental','Inferno','Damage 34 · Fast bolts · HP 95',95,1.08,1.55,1.18,.18,.9,84],
    ['fluttering-pixie','Fluttering Pixie','Fairy Flight','Speed 155% · Fuel 150% · HP 70',70,1.55,.78,1.25,.13,.7,76],
    ['glowing-wisp','Glowing Wisp','Starbolt','Projectile speed 150% · Damage 24 · HP 80',80,1.3,1.09,1.5,.15,.75,80],
    ['grizzled-treant','Grizzled Treant','Barkbreaker','HP 155 · Melee 48 · Speed 70%',155,.7,1.18,.82,.19,1.6,110],
    ['ice-golem','Ice Golem','Frostbite','HP 150 · Damage 30 · Speed 68%',150,.68,1.36,.82,.21,1.25,96],
    ['iron-golem','Iron Golem','Iron Will','HP 180 · Damage 28 · Speed 55%',180,.55,1.27,.75,.24,1.5,105],
    ['magical-fairy','Magical Fairy','Mystic Spark','Balanced · Damage 25 · Fuel 120%',100,1.12,1.14,1.08,.15,.95,86],
    ['novice-pyromancer','Novice Pyromancer','Kindle','Damage 29 · Fire rate 120% · HP 90',90,1.02,1.32,1.08,.133,.8,80],
    ['vile-witch','Vile Witch','Hexbolt','Damage 26 · Projectile life 2.2s · HP 100',100,.98,1.18,1.05,.16,1.05,90],
    ['water-elemental','Water Elemental','Tidal Flow','HP 120 · Fuel 170% · Damage 22',120,1.05,1,1.02,.17,1,88]
  ].map((d,i) => ({id:d[0],name:d[1],power:d[2],stats:d[3],maxHp:d[4],speed:d[5],damage:d[6],projectileSpeed:d[7],cooldown:d[8],meleeDamage:d[9],meleeRange:d[10],col:i%5,row:Math.floor(i/5)}));
  let selected = data[0];
  const picker = document.getElementById('characterPicker');
  const grid = document.getElementById('characterGrid');
  const selectedName = document.getElementById('selectedCharacterName');
  if (!picker || !grid) return;
  const style = document.createElement('style');
  style.textContent = `.char-sprite{width:100%;height:88px;background:#0b0918 url('${SHEET_URL}') no-repeat;background-size:356px 216px;border-radius:10px;margin-bottom:10px;image-rendering:pixelated}#characterPicker{z-index:99999!important}`;
  document.head.appendChild(style);
  function renderCards(){
    grid.innerHTML = data.map(c => `<button class="char-card ${c.id===selected.id?'selected':''}" data-char="${c.id}"><div class="char-sprite" style="background-position:${-(c.col*71.2).toFixed(2)}px ${-(c.row*72).toFixed(2)}px"></div><h3>${c.name}</h3><div class="power">${c.power}</div><div class="stats">${c.stats}</div></button>`).join('');
    grid.querySelectorAll('.char-card').forEach(card => card.onclick = () => { selected = data.find(c => c.id === card.dataset.char) || data[0]; selectedName.textContent = selected.name; renderCards(); });
    selectedName.textContent = selected.name;
  }
  function openPicker(){ picker.classList.add('open'); renderCards(); }
  document.getElementById('confirmCharacter').onclick = () => { picker.classList.remove('open'); if (typeof show === 'function') show('lobby'); document.getElementById('createRoom')?.focus(); };
  document.getElementById('playNow').onclick = () => { if (!ensureName()) return; openPicker(); };
  const oldStartGame = window.startGame;
  window.startGame = function(practice){ if (typeof oldStartGame === 'function') oldStartGame(practice); local.maxHp=selected.maxHp; local.hp=selected.maxHp; local.fuel=100*selected.fuel; local.character=selected.id; local.characterName=selected.name; };
  const oldSend = window.send;
  window.send = function(msg){ if (msg && (msg.type==='create'||msg.type==='join')) msg={...msg,character:selected.id}; return oldSend(msg); };
  const oldUpdateHud = window.updateHud;
  window.updateHud = function(){ if (typeof oldUpdateHud==='function') oldUpdateHud(); document.getElementById('hpBar').style.width=`${Math.max(0,Math.min(100,local.hp/selected.maxHp*100))}%`; document.getElementById('fuelBar').style.width=`${Math.max(0,Math.min(100,local.fuel/(100*selected.fuel)*100))}%`; };
  const oldDrawWizard = window.drawWizard;
  window.drawWizard = function(ctx,p,glow,me=false){
    if (p===local && ready) {
      const sx=selected.col*71.2, sy=selected.row*72;
      ctx.save(); ctx.translate(p.x,p.y); ctx.imageSmoothingEnabled=false; ctx.shadowBlur=me?22:14; ctx.shadowColor=glow||'#a78bfa'; ctx.drawImage(sheet,sx,sy,71.2,72,-36,-62,72,72); ctx.restore(); return;
    }
    if (typeof oldDrawWizard==='function') oldDrawWizard(ctx,p,glow,me);
  };
  renderCards();
  setTimeout(openPicker,220);
})();
