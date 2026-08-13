/* Apply embedded sprite sheet to cards and the in-game player sprite. */
function applyCharacterCardSprites(){document.querySelectorAll('.char-sprite').forEach(el=>{el.style.backgroundImage=`url(${MAGIC_SHEET.src})`;});}
applyCharacterCardSprites();
new MutationObserver(applyCharacterCardSprites).observe(document.getElementById('characterGrid'),{childList:true});
const characterDraw=drawWizard;
drawWizard=(ctx,p,glow,me=false)=>{if(p===local&&selectedCharacter){ctx.save();ctx.translate(p.x,p.y);ctx.imageSmoothingEnabled=false;ctx.shadowBlur=me?22:12;ctx.shadowColor=glow;if(MAGIC_SHEET.complete)ctx.drawImage(MAGIC_SHEET,selectedCharacter.sx*4,selectedCharacter.sy*4,64,64,-32,-56,64,64);ctx.restore();return}characterDraw(ctx,p,glow,me)};
let characterConfirmed=false;
const confirmCharacter=document.getElementById('confirmCharacter');
confirmCharacter.onclick=()=>{characterConfirmed=true;picker.classList.remove('open');show('landing');$('playerName').focus();};
$('playNow').onclick=()=>{if(!ensureName())return;if(characterConfirmed){show('lobby');$('createRoom').focus();}else{picker.classList.add('open');renderChars();}};
const change=document.createElement('button');change.className='ghost';change.textContent='Change Champion';change.style.marginTop='8px';change.onclick=()=>{picker.classList.add('open');renderChars()};document.querySelector('.entry-card').appendChild(change);
setTimeout(()=>{picker.classList.add('open');renderChars();},250);
