/* Final sprite fix: use the exact source coordinates stored for each champion. */
function applyCharacterCardSprites(){document.querySelectorAll('.char-sprite').forEach((el,i)=>{const c=MAGIC_CHARACTERS[i];if(!c)return;el.style.width='64px';el.style.height='64px';el.style.margin='0 auto 10px';el.style.backgroundImage=`url(${MAGIC_SHEET.src})`;el.style.backgroundRepeat='no-repeat';el.style.backgroundSize='356px 216px';el.style.backgroundPosition=`-${c.sx*4}px -${c.sy*4}px`;el.style.imageRendering='pixelated';el.style.backgroundColor='#0b0918';el.style.borderRadius='10px';});}
const originalRenderChars=typeof renderChars==='function'?renderChars:null;
if(originalRenderChars){renderChars=function(){originalRenderChars();applyCharacterCardSprites();};}
const originalDrawWizard=drawWizard;
drawWizard=function(ctx,p,glow,me=false){if(p===local&&selectedCharacter&&MAGIC_SHEET.complete){ctx.save();ctx.translate(p.x,p.y);ctx.imageSmoothingEnabled=false;ctx.shadowBlur=me?22:12;ctx.shadowColor=glow||'#a78bfa';ctx.drawImage(MAGIC_SHEET,selectedCharacter.sx*4,selectedCharacter.sy*4,64,64,-32,-56,64,64);ctx.restore();return;}originalDrawWizard(ctx,p,glow,me);};
setTimeout(applyCharacterCardSprites,50);
new MutationObserver(applyCharacterCardSprites).observe(document.body,{childList:true,subtree:true});
