/* Final character sprite/game fix. Uses the supplied Basic 4x sprite sheet directly. */
const CHARACTER_SPRITE_POSITIONS=Array.from({length:15},(_,i)=>({x:[0,71,142,213,284][i%5],y:[0,72,144][Math.floor(i/5)]}));
function selectedSpriteIndex(){const i=MAGIC_CHARACTERS.findIndex(c=>c.id===selectedCharacter.id);return Math.max(0,i);}
function applyCharacterCardSprites(){document.querySelectorAll('.char-sprite').forEach((el,i)=>{const p=CHARACTER_SPRITE_POSITIONS[i%15];el.style.width='64px';el.style.height='64px';el.style.margin='0 auto 10px';el.style.backgroundImage=`url(${MAGIC_SHEET.src})`;el.style.backgroundRepeat='no-repeat';el.style.backgroundSize='356px 216px';el.style.backgroundPosition=`-${p.x}px -${p.y}px`;el.style.imageRendering='pixelated';el.style.backgroundColor='#0b0918';el.style.borderRadius='10px';});}
const originalRenderChars=typeof renderChars==='function'?renderChars:null;
if(originalRenderChars){renderChars=function(){originalRenderChars();applyCharacterCardSprites();};}
const originalDrawWizard=drawWizard;
drawWizard=function(ctx,p,glow,me=false){if(p===local&&selectedCharacter&&MAGIC_SHEET.complete){const pos=CHARACTER_SPRITE_POSITIONS[selectedSpriteIndex()];ctx.save();ctx.translate(p.x,p.y);ctx.imageSmoothingEnabled=false;ctx.shadowBlur=me?22:12;ctx.shadowColor=glow||'#a78bfa';ctx.drawImage(MAGIC_SHEET,pos.x,pos.y,64,64,-32,-56,64,64);ctx.restore();return;}originalDrawWizard(ctx,p,glow,me);};
const originalStartGame=startGame;
startGame=function(practice){originalStartGame(practice);const s=currentStats();local.maxHp=s.maxHp;local.hp=s.maxHp;local.fuel=100*s.fuel;local.character=selectedCharacter.id;local.characterName=selectedCharacter.name;};
function openChampionPicker(){picker.classList.add('open');if(typeof renderChars==='function')renderChars();applyCharacterCardSprites();}
const confirmButton=document.getElementById('confirmCharacter');
if(confirmButton){confirmButton.onclick=()=>{characterConfirmed=true;picker.classList.remove('open');show('landing');$('playerName').focus();};}
setTimeout(()=>openChampionPicker(),150);
setTimeout(applyCharacterCardSprites,50);
new MutationObserver(applyCharacterCardSprites).observe(document.body,{childList:true,subtree:true});
