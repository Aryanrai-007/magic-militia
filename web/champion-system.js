/* Magic Militia: isolated champion system. Loaded after the stable game app. */
(() => {
  const champions = [
    ['Adept Necromancer','SOUL REAPER','HP 115 · Damage 27 · Regen on kill',115,1.00,1.23,1.00,1.00,0],
    ['Corrupted Treant','ROTTEN ARMOR','HP 145 · Damage 25 · Speed 78%',145,.78,1.14,.90,1.10,1],
    ['Deft Sorceress','ARCANE RUSH','Speed 125% · Damage 20 · Fire rate 135%',85,1.25,.91,1.35,.85,2],
    ['Earth Elemental','STONEHEART','HP 165 · Damage 34 · Speed 62%',165,.62,1.55,.78,1.35,3],
    ['Expert Druid','VERDANT WARD','HP 125 · Fuel 135% · Damage 24',125,1.03,1.09,1.00,1.00,4],
    ['Fire Elemental','INFERNO','Damage 34 · Fast bolts · HP 95',95,1.08,1.55,1.18,.90,5],
    ['Fluttering Pixie','FAIRY FLIGHT','Speed 155% · Fuel 150% · HP 70',70,1.55,.78,1.25,.70,6],
    ['Glowing Wisp','STARBOLT','Projectile speed 150% · Damage 24 · HP 80',80,1.30,1.09,1.50,.75,7],
    ['Grizzled Treant','BARKBREAKER','HP 155 · Melee 48 · Speed 70%',155,.70,1.18,.82,1.60,8],
    ['Ice Golem','FROSTBITE','HP 150 · Damage 30 · Speed 68%',150,.68,1.36,.82,1.25,9],
    ['Iron Golem','IRON WILL','HP 180 · Damage 28 · Speed 55%',180,.55,1.27,.75,1.50,10],
    ['Magical Fairy','MYSTIC SPARK','Balanced · Damage 25 · Fuel 120%',100,1.12,1.14,1.08,.95,11],
    ['Novice Pyromancer','KINDLE','Damage 29 · Fire rate 120% · HP 90',90,1.02,1.32,1.20,.80,12],
    ['Vile Witch','HEXBOLT','Damage 26 · Projectile life 2.2s · HP 100',100,.98,1.18,1.05,1.05,13],
    ['Water Elemental','TIDAL FLOW','HP 120 · Fuel 170% · Damage 22',120,1.05,1.00,1.02,1.00,14]
  ].map((x,i)=>({name:x[0],power:x[1],desc:x[2],hp:x[3],speed:x[4],damage:x[5],fireRate:x[6],melee:x[7],index:x[8],col:i%5,row:Math.floor(i/5)}));

  let selected = champions[0];
  let sheet = null;

  function boot(){
    sheet = window.MAGIC_SHEET || null;
    if (!sheet) {
      const s=document.createElement('script');
      s.src='./characters.js';
      s.onload=()=>{sheet=window.MAGIC_SHEET||null; install();};
      document.head.appendChild(s);
    } else install();
  }

  function install(){
    addStyles();
    addPicker();
    patchStartAndCombat();
    // Replace the stable Play Now handler only; the underlying game loop remains untouched.
    const play=document.getElementById('playNow');
    if(play) play.onclick=()=>{ if(typeof ensureName==='function' && !ensureName()) return; openPicker(); };
  }

  function addPicker(){
    if(document.getElementById('championPicker')) return;
    const el=document.createElement('section');
    el.id='championPicker'; el.className='champion-picker';
    el.innerHTML=`<div class="champion-panel"><div class="champion-head"><div><p class="eyebrow">CHOOSE YOUR MILITIA</p><h2>Pick one champion.</h2><p>Every champion has a different power set. Your choice changes how you fly, cast and fight.</p></div><div class="chosen"><span>SELECTED</span><b id="chosenChampion">${selected.name}</b></div></div><div id="championGrid" class="champion-grid"></div><div class="champion-actions"><button id="championConfirm" class="primary">ENTER THE LOBBY ✦</button></div></div>`;
    document.body.appendChild(el);
    renderCards();
    document.getElementById('championConfirm').onclick=()=>{el.classList.remove('open'); if(typeof show==='function') show('lobby'); document.getElementById('createRoom')?.focus();};
  }

  function renderCards(){
    const grid=document.getElementById('championGrid'); if(!grid) return;
    grid.innerHTML=champions.map(c=>`<button class="champion-card ${c===selected?'selected':''}" data-index="${c.index}"><div class="champion-sprite" data-col="${c.col}" data-row="${c.row}"></div><strong>${c.name}</strong><em>${c.power}</em><small>${c.desc}</small></button>`).join('');
    grid.querySelectorAll('.champion-card').forEach(card=>card.onclick=()=>{selected=champions[Number(card.dataset.index)]; document.getElementById('chosenChampion').textContent=selected.name; renderCards();});
    drawCardSprites();
  }

  function drawCardSprites(){
    document.querySelectorAll('.champion-sprite').forEach(el=>{
      const col=Number(el.dataset.col), row=Number(el.dataset.row);
      el.style.backgroundImage=sheet?'url("'+sheet.src+'")':'none';
      el.style.backgroundPosition=`${-(col*71.2)}px ${-(row*72)}px`;
    });
  }

  function openPicker(){ document.getElementById('championPicker')?.classList.add('open'); renderCards(); }

  function patchStartAndCombat(){
    if(typeof startGame==='function'){
      const originalStart=startGame;
      startGame=function(practice){ originalStart(practice); local.maxHp=selected.hp; local.hp=selected.hp; local.fuel=100*selected.speed; local.character=selected.name; };
    }
    if(typeof updateLocal==='function'){
      const originalUpdate=updateLocal;
      updateLocal=function(dt){
        const oldFuel=local.fuel;
        originalUpdate(dt);
        // Scale horizontal acceleration and jetpack fuel capacity without replacing the stable physics loop.
        local.vx*=Math.max(.75,Math.min(1.12,selected.speed));
        if(selected.speed>1) local.fuel=Math.min(100*selected.speed,oldFuel + (local.fuel-oldFuel)*selected.speed);
      };
    }
    if(typeof cast==='function'){
      const originalCast=cast;
      cast=function(){
        if(!cast.cool || cast.cool<=0){
          const oldPush=projectiles.push;
          projectiles.push=function(p){p.damage=selected.damage*18;p.vx*=selected.fireRate;p.life=1.5*selected.fireRate;return oldPush.call(this,p);};
          originalCast();
          projectiles.push=oldPush;
        } else originalCast();
      };
    }
    if(typeof melee==='function'){
      const originalMelee=melee;
      melee=function(){
        const before=[];
        for(const t of [...bots,...players.values()]) before.push([t,t.hp]);
        originalMelee();
        for(const [t,hp] of before){if(t.hp<hp){const dealt=hp-t.hp; t.hp=Math.min(t.hp+dealt,t.hp+dealt*(selected.melee-1));}}
      };
    }
    const originalDraw=drawWizard;
    drawWizard=function(ctx,p,glow,me=false){
      if(p===local && sheet && sheet.complete){
        const sx=selected.col*71.2, sy=selected.row*72;
        ctx.save(); ctx.translate(p.x,p.y); ctx.imageSmoothingEnabled=false; ctx.shadowBlur=me?24:16; ctx.shadowColor=glow||'#a78bfa';
        ctx.drawImage(sheet,sx,sy,71.2,72,-36,-58,72,72); ctx.restore(); return;
      }
      originalDraw(ctx,p,glow,me);
    };
  }

  function addStyles(){
    if(document.getElementById('championStyles')) return;
    const s=document.createElement('style'); s.id='championStyles'; s.textContent=`
      .champion-picker{position:fixed;inset:0;z-index:100000;display:none;overflow:auto;background:radial-gradient(circle at 50% 20%,#21184b 0,#080816 60%);padding:28px}
      .champion-picker.open{display:block}.champion-panel{max-width:1180px;margin:0 auto;border:1px solid #7654e8;border-radius:24px;background:rgba(13,11,32,.96);box-shadow:0 30px 100px #000b;padding:28px}
      .champion-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:20px}.champion-head h2{font-size:34px;margin:5px 0}.champion-head p:not(.eyebrow){color:#a9a5c7;margin:0;max-width:650px}.chosen{border:1px solid #7654e8;border-radius:14px;padding:12px 16px;min-width:180px;background:#15112c}.chosen span{display:block;font-size:10px;color:#9387bd;letter-spacing:.15em}.chosen b{display:block;margin-top:5px;color:#e9ddff}.champion-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.champion-card{appearance:none;text-align:left;border:1px solid #292445;background:#15122b;border-radius:14px;padding:10px;color:#eee;cursor:pointer;transition:.15s}.champion-card:hover{transform:translateY(-2px);border-color:#7654e8}.champion-card.selected{border:2px solid #a78bfa;background:#201a40;box-shadow:0 0 24px #7c3aed44}.champion-sprite{height:92px;border-radius:9px;background-color:#090818;background-repeat:no-repeat;background-size:356px 216px;image-rendering:pixelated;margin-bottom:8px}.champion-card strong,.champion-card em,.champion-card small{display:block}.champion-card strong{font-size:14px}.champion-card em{font-style:normal;color:#b99cff;text-transform:uppercase;font-size:10px;font-weight:800;margin:4px 0}.champion-card small{color:#aaa5c4;line-height:1.35;font-size:11px}.champion-actions{text-align:right;margin-top:18px}@media(max-width:900px){.champion-grid{grid-template-columns:repeat(3,1fr)}.champion-head{flex-direction:column}}@media(max-width:600px){.champion-grid{grid-template-columns:repeat(2,1fr)}.champion-picker{padding:12px}.champion-panel{padding:16px}}
    `; document.head.appendChild(s);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
