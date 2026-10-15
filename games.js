(function(){
 const $=s=>document.querySelector(s),recordKey='training-palace-games-v1';
 const titles={runner:'Dino Run',flappy:'Flappy Palace'};
 let game='runner',engine=null,mode='ready',raf=null,last=0,accumulator=0,records={runner:0,flappy:0},ctx;
 function readRecords(){try{const stored=JSON.parse(localStorage.getItem(recordKey));for(const key of Object.keys(records)){const value=stored?.[key];if(Number.isSafeInteger(value)&&value>=0)records[key]=value}}catch{$('#game-storage-status').textContent='Je records kunnen niet geladen worden in deze browser.'}}
 function persistBest(){if(!engine||engine.score<=records[game])return;records[game]=engine.score;try{localStorage.setItem(recordKey,JSON.stringify(records))}catch{$('#game-storage-status').textContent='Je kunt spelen, maar je record kon niet op dit toestel worden bewaard.'}}
 function sync(){
  $('#game-title').textContent=titles[game];$('#game-score').textContent=engine.score;$('#game-best').textContent=Math.max(records[game],engine.score);$('#runner-record').textContent=records.runner;$('#flappy-record').textContent=records.flappy;
  $('#game-stage').classList.toggle('is-flappy',game==='flappy');$('#game-stage').dataset.state=mode;
  $('#game-instructions').textContent=game==='runner'?'Spring over de cactussen. Spatie, pijltje omhoog of tikken om te springen.':'Vlieg tussen de poorten. Spatie, pijltje omhoog of tikken om te fladderen.';
  $('#game-start').textContent=mode==='paused'?'Hervatten':mode==='over'?'Opnieuw spelen':mode==='running'?'Opnieuw beginnen':'Start spel';
  $('#game-pause').disabled=mode!=='running';$('#game-action').textContent=game==='runner'?'Spring ↑':'Fladder ↑';$('#game-action').disabled=mode!=='running';
  $('#game-overlay').hidden=mode==='running';$('#game-overlay-title').textContent=mode==='paused'?'Even pauze.':mode==='over'?'Nog een rondje?':'Klaar voor een kleine pauze?';
  $('#game-overlay-text').textContent=mode==='paused'?'Je score blijft staan. Hervat wanneer je wilt.':mode==='over'?`Je score: ${engine.score}. Druk op Spatie of kies Opnieuw spelen.`:'Druk op Start, Spatie of tik op het speelveld.';
  $('#game-status').textContent=mode==='over'?`Spel afgelopen. Score ${engine.score}.`:mode==='paused'?'Spel gepauzeerd.':mode==='running'?'Spel gestart.':titles[game]+' staat klaar.';
 }
 function stopFrame(){cancelAnimationFrame(raf);raf=null;last=0;accumulator=0}
 function reset(){stopFrame();engine=game==='runner'?new PalaceGamesEngine.Runner():new PalaceGamesEngine.Flappy();mode='ready';const canvas=$('#game-canvas');canvas.width=engine.width;canvas.height=engine.height;sync();draw()}
 function start(){if(mode==='running')persistBest();if(mode!=='paused')reset();mode='running';last=0;accumulator=0;sync();$('#game-stage').focus({preventScroll:true});raf=requestAnimationFrame(frame)}
 function pause(){if(mode!=='running')return;stopFrame();mode='paused';persistBest();sync();draw()}
 function action(){if(mode==='paused')return;if(mode!=='running')start();engine.action();draw()}
 function frame(time){
  if(mode!=='running')return;if(!last)last=time;accumulator+=Math.min((time-last)/1000,0.1);last=time;
  while(accumulator>=1/120&&mode==='running'){engine.step(1/120);accumulator-=1/120;if(engine.over){mode='over';persistBest();stopFrame();sync()}}
  $('#game-score').textContent=engine.score;$('#game-best').textContent=Math.max(records[game],engine.score);draw();if(mode==='running')raf=requestAnimationFrame(frame);
 }
 function box(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 function scenery(){
  const w=engine.width,h=engine.height,g=engine.ground;ctx.fillStyle='#111b2f';ctx.fillRect(0,0,w,h);
  for(let i=0;i<22;i++){const x=(i*137+53)%w,y=24+(i*61)%Math.max(60,g-115);box(x,y,2,2,i%3?'#344660':'#8c8053')}
  circle(w-95,65,24,'#f6d66b');circle(w-85,58,24,'#111b2f');
  ctx.fillStyle='#1b2941';ctx.beginPath();ctx.moveTo(0,g);for(let i=0;i<=6;i++)ctx.lineTo(i*w/6,g-38-(i%2)*37);ctx.lineTo(w,g);ctx.closePath();ctx.fill();
  box(0,g,w,h-g,'#202c3f');box(0,g,w,3,'#6b8192');
  const shift=engine.elapsed*(game==='runner'?160:65)%40;for(let x=-40;x<w;x+=40)box(x-shift,g+20,18,3,'#36455c');
 }
 function dino(x,y){
  // Original pixel dinosaur silhouette; no external art assets.
  const body='#f5ca53',light='#ffe394';
  box(x+20,y,26,23,body);box(x+17,y+16,22,26,body);box(x+5,y+25,27,19,body);box(x,y+19,9,20,body);box(x-5,y+15,7,14,body);box(x+29,y+29,15,5,body);box(x+39,y+29,4,9,body);
  const stride=mode==='running'&&engine.player.vy===0?Math.floor(engine.elapsed*12)%2:0;box(x+10,y+41,7,stride?8:14,body);box(x+23,y+41,7,stride?14:8,body);box(x+10,y+(stride?47:53),12,3,light);box(x+23,y+(stride?53:47),12,3,light);box(x+36,y+5,4,4,'#172034');box(x+34,y+17,12,3,'#bf993f');
 }
 function drawRunner(){
  for(const obstacle of engine.obstacles){const x=obstacle.x,y=obstacle.y,w=obstacle.w,h=obstacle.h;box(x+w*.35,y,w*.4,h,'#78b19b');box(x,y+h*.35,w*.4,7,'#78b19b');box(x,y+h*.17,6,h*.25,'#78b19b');box(x+w*.65,y+h*.53,w*.35,7,'#78b19b');box(x+w-6,y+h*.3,6,h*.3,'#78b19b');box(x+w*.47,y+5,3,h-6,'#b6d5ad')}
  dino(engine.player.x,engine.player.y);
  if(mode==='ready'){box(590,252,12,54,'#395c56');box(580,270,14,7,'#395c56');box(580,260,5,13,'#395c56')}
 }
 function drawFlappy(){
  for(const pipe of engine.pipes){box(pipe.x,0,pipe.w,pipe.top,'#508c7c');box(pipe.x+7,0,8,pipe.top,'#75b29c');box(pipe.x-5,pipe.top-21,pipe.w+10,21,'#89b99b');box(pipe.x,pipe.bottom,pipe.w,engine.ground-pipe.bottom,'#508c7c');box(pipe.x+7,pipe.bottom,8,engine.ground-pipe.bottom,'#75b29c');box(pipe.x-5,pipe.bottom,pipe.w+10,21,'#89b99b')}
  const p=engine.player;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.max(-0.4,Math.min(0.9,p.vy/600)));circle(0,0,17,'#f5ca53');circle(-5,5,10,'#e5a63c');box(-13,2,15,6,'#ffe6a3');circle(7,-5,7,'#fff6da');circle(9,-5,3,'#172034');box(13,2,12,6,'#ed8a57');ctx.restore();
 }
 function draw(){if(!ctx||!engine)return;scenery();if(game==='runner')drawRunner();else drawFlappy()}
 window.GameArcade={
  init(){ctx=$('#game-canvas').getContext('2d');if(!ctx){$('#game-status').textContent='Je browser ondersteunt dit speelveld niet.';$('#game-start').disabled=true;return}readRecords();reset();
   document.querySelectorAll('[data-game]').forEach(button=>button.onclick=()=>{persistBest();game=button.dataset.game;document.querySelectorAll('[data-game]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});reset()});
   $('#game-start').onclick=start;$('#game-pause').onclick=pause;$('#game-action').onclick=()=>{if(mode==='running'){engine.action();$('#game-stage').focus({preventScroll:true})}};
   $('#game-canvas').addEventListener('pointerdown',e=>{e.preventDefault();$('#game-stage').focus({preventScroll:true});action()});
   $('#game-stage').addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyP','Escape'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(['KeyP','Escape'].includes(e.code)){if(mode==='running')pause();else if(mode==='paused'&&e.code==='KeyP')start()}else action()}});
   document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',pause);
  },
  show(){if(!engine)return;draw();sync()},hide(){pause()}
 };
})();
