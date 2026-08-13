/* Apply the embedded sprite sheet to dynamically-rendered champion cards. */
function applyCharacterCardSprites(){document.querySelectorAll('.char-sprite').forEach(el=>{el.style.backgroundImage=`url(${MAGIC_SHEET.src})`;});}
applyCharacterCardSprites();
new MutationObserver(applyCharacterCardSprites).observe(document.getElementById('characterGrid'),{childList:true});
