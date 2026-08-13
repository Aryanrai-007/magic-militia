/* Keep the browser game loop alive if a rendering edge case throws. */
const stableLoop=loop;
loop=function(now){
  try{stableLoop(now);}catch(err){
    console.error('Magic Militia frame error:',err);
    if(matchStarted){
      timeLeft=Math.max(0,timeLeft-0.016);
      const timerEl=document.getElementById('timer');
      if(timerEl)timerEl.textContent=formatTime(timeLeft);
      raf=requestAnimationFrame(loop);
    }
  }
};
