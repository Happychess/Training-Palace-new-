(function(){
 const $=s=>document.querySelector(s),recordKey='training-palace-games-v1';
 const titles={runner:'Dino Run',flappy:'Flappy Palace'};
 const skins=[{id:'classic',name:'Happy Gold',cost:0,body:'#f5ca53',light:'#ffe394',shade:'#bf993f'},{id:'mint',name:'Mint Move',cost:15,body:'#77d2b8',light:'#d0fff0',shade:'#387f70'},{id:'royal',name:'Royal Violet',cost:40,body:'#b59aff',light:'#eee4ff',shade:'#7754ba'},{id:'pink',name:'Pixel Pink',cost:80,body:'#f08ebc',light:'#ffd7ed',shade:'#a64e7d'}];
 const duckSources=new Set();
 let game='runner',engine=null,mode='ready',raf=null,last=0,accumulator=0,records=normalizeProgress(),creditedCoins=0,attemptedCoins=0,ctx;
 function normalizeProgress(stored){
  const result={runner:0,flappy:0,coins:0,ownedSkins:['classic'],equippedSkin:'classic'};
  for(const key of ['runner','flappy','coins'])if(Number.isSafeInteger(stored?.[key])&&stored[key]>=0)result[key]=stored[key];
  if(Array.isArray(stored?.ownedSkins))result.ownedSkins=[...new Set(['classic',...stored.ownedSkins.filter(id=>skins.some(s=>s.id===id))])];
  if(result.ownedSkins.includes(stored?.equippedSkin))result.equippedSkin=stored.equippedSkin;return result;
 }
 function readRecords(){try{records=normalizeProgress(JSON.parse(localStorage.getItem(recordKey)))}catch{$('#game-storage-status').textContent='Je spelvoortgang kan niet geladen worden in deze browser.'}}
 function changeProgress(change){
  try{
   const stored=localStorage.getItem(recordKey);let fresh;try{fresh=normalizeProgress(JSON.parse(stored))}catch{fresh=normalizeProgress()}
   fresh.runner=Math.max(fresh.runner,records.runner);fresh.flappy=Math.max(fresh.flappy,records.flappy);
   const next=change(fresh);if(!next){records=fresh;shopUi();return false}
   localStorage.setItem(recordKey,JSON.stringify(next));records=next;$('#game-storage-status').textContent='';shopUi();return true;
  }catch{$('#game-storage-status').textContent='Opslaan lukt niet. Nieuwe coins zijn nog niet bewaard; aankopen worden niet uitgevoerd.';return false}
 }
 function bankCoins(force=false){if(game!=='runner'||!Number.isSafeInteger(engine?.coinsCollected))return;const earned=engine.coinsCollected;if(earned<=creditedCoins||(!force&&earned===attemptedCoins))return;attemptedCoins=earned;const delta=earned-creditedCoins;if(changeProgress(next=>{next.coins=Math.min(Number.MAX_SAFE_INTEGER,next.coins+delta);return next}))creditedCoins=earned}
 function persistBest(){bankCoins(true);if(!engine||engine.score<=records[game])return;records[game]=engine.score;changeProgress(next=>next)}
 function skinPreview(skin){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');
  for(const [d,fill]of [['M29 6h27v22H43v8h10v6H42v11h7v5H36V47H26v11H15V42H9V29H3V18h7v8h7v5h12V22h-4V6z',skin.body],['M46 11h5v5h-5zM44 23h12v3H44z','#172034']]){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);path.setAttribute('fill',fill);svg.append(path)}return svg;
 }
 function buildShop(){
  for(const skin of skins){const card=document.createElement('article');card.className='skin-card';card.dataset.skin=skin.id;const preview=document.createElement('div');preview.className='skin-preview';preview.style.setProperty('--skin-color',skin.body);preview.append(skinPreview(skin));const name=document.createElement('h3');name.textContent=skin.name;const label=document.createElement('span');label.className='skin-label';const button=document.createElement('button');button.className='secondary-button';button.dataset.skinAction=skin.id;button.onclick=()=>chooseSkin(skin);card.append(preview,name,label,button);$('#skin-grid').append(card)}
 }
 function shopUi(){
  $('#shop-wallet').textContent=records.coins;
  $('.runner-art svg').style.color=(skins.find(s=>s.id===records.equippedSkin)||skins[0]).body;
  for(const skin of skins){const card=$(`[data-skin="${skin.id}"]`);if(!card)continue;const owned=records.ownedSkins.includes(skin.id),active=records.equippedSkin===skin.id,button=card.querySelector('button');card.classList.toggle('equipped',active);card.querySelector('.skin-label').textContent=active?'Jouw huidige skin':owned?'In bezit':`${skin.cost} coins`;button.textContent=active?'Geselecteerd':owned?'Gebruiken':`Kopen · ${skin.cost} ◈`;button.disabled=active||(!owned&&records.coins<skin.cost);button.setAttribute('aria-label',active?skin.name+' geselecteerd':owned?skin.name+' gebruiken':skin.name+' kopen voor '+skin.cost+' coins');if(owned)button.setAttribute('aria-pressed',String(active));else button.removeAttribute('aria-pressed')}
 }
 function chooseSkin(skin){
  pause();let bought=false,insufficient=false;
  const saved=changeProgress(next=>{if(!next.ownedSkins.includes(skin.id)){if(next.coins<skin.cost){insufficient=true;return null}next.coins-=skin.cost;next.ownedSkins.push(skin.id);bought=true}next.equippedSkin=skin.id;return next});
  $('#shop-status').textContent=saved?(bought?skin.name+' gekocht en aangetrokken.':skin.name+' aangetrokken.'):insufficient?'Je hebt nog niet genoeg coins voor deze skin.':'Je skin kon niet worden opgeslagen. Er zijn geen coins uitgegeven.';draw();
 }
 function sync(){
  $('#game-title').textContent=titles[game];$('#game-score').textContent=engine.score;$('#game-best').textContent=Math.max(records[game],engine.score);$('#runner-record').textContent=records.runner;$('#flappy-record').textContent=records.flappy;
  $('#game-stage').classList.toggle('is-flappy',game==='flappy');$('#game-stage').dataset.state=mode;
  $('#game-instructions').textContent=game==='runner'?'Spring over cactussen. Vogelzwerm? Houd ↓ of Bukken ingedrukt: erover springen kan niet. Spring vanuit bukken voor een supersprong en pak de hoge coins!':'Vlieg tussen de poorten. Spatie, pijltje omhoog of tikken om te fladderen.';
  $('#game-start').textContent=mode==='paused'?'Hervatten':mode==='over'?'Opnieuw spelen':mode==='running'?'Opnieuw beginnen':'Start spel';
  $('#game-pause').disabled=mode!=='running';$('#game-action').disabled=mode!=='running';$('#game-duck').hidden=game!=='runner';$('#game-duck').disabled=mode!=='running';$('#game-key-hint').textContent=game==='runner'?'Spatie / ↑: spring · ↓ + spring: super · P: pauze':'Spatie / ↑: fladder · P: pauze';$('#dino-shop').hidden=game!=='runner';$('#game-run-coins-group').hidden=game!=='runner';$('#game-coins').textContent=engine.coinsCollected||0;duckUi();shopUi();
  $('#game-overlay').hidden=mode==='running';$('#game-overlay-title').textContent=mode==='paused'?'Even pauze.':mode==='over'?'Nog een rondje?':'Klaar voor een kleine pauze?';
  $('#game-overlay-text').textContent=mode==='paused'?'Je score blijft staan. Hervat wanneer je wilt.':mode==='over'?`Je score: ${engine.score}.${game==='runner'?` Gepakt: ${engine.coinsCollected} coins.`:''} Druk op Spatie of kies Opnieuw spelen.`:'Druk op Start, Spatie of tik op het speelveld.';
  $('#game-status').textContent=mode==='over'?`Spel afgelopen. Score ${engine.score}.`:mode==='paused'?'Spel gepauzeerd.':mode==='running'?'Spel gestart.':titles[game]+' staat klaar.';
 }
 function duckUi(){const held=duckSources.size>0,ducking=game==='runner'&&!!engine?.player.ducking;$('#game-duck').classList.toggle('held',held);$('#game-duck').setAttribute('aria-pressed',String(held));$('#game-stage').dataset.ducking=String(ducking);$('#game-stage').dataset.superJump=String(game==='runner'&&!!engine?.player.superJump);const label=game==='runner'?(ducking?'Super ↑':'Spring ↑'):'Fladder ↑';if($('#game-action').textContent!==label)$('#game-action').textContent=label}
 function duckInput(source,held){if(held&&game==='runner'&&mode==='running')duckSources.add(source);else duckSources.delete(source);engine?.duck?.(game==='runner'&&mode==='running'&&duckSources.size>0);duckUi();draw()}
 function clearDuck(){duckSources.clear();engine?.duck?.(false);duckUi()}
 function stopFrame(){cancelAnimationFrame(raf);raf=null;last=0;accumulator=0}
 function reset(){bankCoins(true);clearDuck();stopFrame();engine=game==='runner'?new PalaceGamesEngine.Runner():new PalaceGamesEngine.Flappy();creditedCoins=0;attemptedCoins=0;mode='ready';const canvas=$('#game-canvas');canvas.width=engine.width;canvas.height=engine.height;sync();draw()}
 function start(){if(mode==='running')persistBest();if(mode!=='paused')reset();mode='running';last=0;accumulator=0;sync();$('#game-stage').focus({preventScroll:true});raf=requestAnimationFrame(frame)}
 function pause(){if(mode!=='running')return;clearDuck();stopFrame();mode='paused';persistBest();sync();draw()}
 function action(){if(mode==='paused')return;if(mode!=='running')start();engine.action();duckUi();draw()}
 function frame(time){
  if(mode!=='running')return;if(!last)last=time;accumulator+=Math.min((time-last)/1000,0.1);last=time;
  while(accumulator>=1/120&&mode==='running'){engine.step(1/120);accumulator-=1/120;if(engine.over){clearDuck();mode='over';persistBest();stopFrame();sync()}}
  bankCoins();$('#game-score').textContent=engine.score;$('#game-best').textContent=Math.max(records[game],engine.score);$('#game-coins').textContent=engine.coinsCollected||0;duckUi();draw();if(mode==='running')raf=requestAnimationFrame(frame);
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
  const {body,light,shade}=skins.find(s=>s.id===records.equippedSkin)||skins[0];
  if(engine.player.ducking){
   box(x+5,y+10,37,13,body);box(x+28,y+8,18,14,body);box(x+37,y,26,17,body);box(x-4,y+7,13,8,body);box(x+54,y+4,4,4,'#172034');box(x+50,y+12,13,2,shade);
   const stride=mode==='running'?Math.floor(engine.elapsed*12)%2:0;box(x+14,y+21,7,stride?4:7,body);box(x+32,y+21,7,stride?7:4,body);box(x+14,y+(stride?24:27),12,1,light);box(x+32,y+(stride?27:24),12,1,light);return;
  }
  box(x+20,y,26,23,body);box(x+17,y+16,22,26,body);box(x+5,y+25,27,19,body);box(x,y+19,9,20,body);box(x-5,y+15,7,14,body);box(x+29,y+29,15,5,body);box(x+39,y+29,4,9,body);
  const stride=mode==='running'&&engine.player.vy===0?Math.floor(engine.elapsed*12)%2:0;box(x+10,y+41,7,stride?8:14,body);box(x+23,y+41,7,stride?14:8,body);box(x+10,y+(stride?47:53),12,3,light);box(x+23,y+(stride?53:47),12,3,light);box(x+36,y+5,4,4,'#172034');box(x+34,y+17,12,3,shade);
 }
 function bird(x,y,index){
  ctx.save();ctx.translate(x+58,y);ctx.scale(-1,1);
  box(12,11,32,12,'#ea9874');box(39,7,15,13,'#f5c18a');box(49,10,3,3,'#172034');box(53,16,5,4,'#f5ca53');box(0,14,15,5,'#dc7b66');
  const wing=Math.floor(engine.elapsed*9+index)%2;box(23,wing?17:2,9,wing?12:14,'#f5b188');box(30,wing?23:1,9,5,'#f5b188');ctx.restore();
 }
 function drawRunner(){
  for(const coin of engine.coins){circle(coin.x,coin.y,coin.r+3,'#f5ca5318');circle(coin.x,coin.y,coin.r,'#d99e27');circle(coin.x,coin.y,coin.r-2,'#f5ca53');box(coin.x-1,coin.y-4,2,8,'#fff1b2')}
  for(const obstacle of engine.obstacles){const x=obstacle.x,y=obstacle.y,w=obstacle.w,h=obstacle.h;
   if(obstacle.type==='bird'){
    for(let i=0;i<7;i++)bird(x,y+i*(h-30)/6,i);
    ctx.fillStyle='#f5c18a';ctx.font='bold 12px monospace';ctx.fillText('BUK ↓',x+7,engine.ground+49);continue;
   }
   box(x+w*.35,y,w*.4,h,'#78b19b');box(x,y+h*.35,w*.4,7,'#78b19b');box(x,y+h*.17,6,h*.25,'#78b19b');box(x+w*.65,y+h*.53,w*.35,7,'#78b19b');box(x+w-6,y+h*.3,6,h*.3,'#78b19b');box(x+w*.47,y+5,3,h-6,'#b6d5ad')}
  const p=engine.player;if(p.superJump){const skin=skins.find(s=>s.id===records.equippedSkin)||skins[0];for(let i=1;i<5;i++)box(p.x-i*12,p.y+30+i*6,6,6,skin.light+(i%2?'aa':'55'));ctx.fillStyle=skin.light;ctx.font='bold 12px monospace';ctx.fillText('SUPER!',p.x-2,Math.max(17,p.y-12))}dino(p.x,p.y);
  if(mode==='ready'){box(590,252,12,54,'#395c56');box(580,270,14,7,'#395c56');box(580,260,5,13,'#395c56')}
 }
 function drawFlappy(){
  for(const pipe of engine.pipes){box(pipe.x,0,pipe.w,pipe.top,'#508c7c');box(pipe.x+7,0,8,pipe.top,'#75b29c');box(pipe.x-5,pipe.top-21,pipe.w+10,21,'#89b99b');box(pipe.x,pipe.bottom,pipe.w,engine.ground-pipe.bottom,'#508c7c');box(pipe.x+7,pipe.bottom,8,engine.ground-pipe.bottom,'#75b29c');box(pipe.x-5,pipe.bottom,pipe.w+10,21,'#89b99b')}
  const p=engine.player;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.max(-0.4,Math.min(0.9,p.vy/600)));circle(0,0,17,'#f5ca53');circle(-5,5,10,'#e5a63c');box(-13,2,15,6,'#ffe6a3');circle(7,-5,7,'#fff6da');circle(9,-5,3,'#172034');box(13,2,12,6,'#ed8a57');ctx.restore();
 }
 function draw(){if(!ctx||!engine)return;scenery();if(game==='runner')drawRunner();else drawFlappy()}
 window.GameArcade={
  init(){ctx=$('#game-canvas').getContext('2d');if(!ctx){$('#game-status').textContent='Je browser ondersteunt dit speelveld niet.';$('#game-start').disabled=true;return}readRecords();buildShop();reset();
   document.querySelectorAll('[data-game]').forEach(button=>button.onclick=()=>{persistBest();game=button.dataset.game;document.querySelectorAll('[data-game]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});reset()});
   $('#game-start').onclick=start;$('#game-pause').onclick=pause;
   const jump=()=>{if(mode==='running'){action();$('#game-stage').focus({preventScroll:true})}};
   $('#game-action').addEventListener('pointerdown',e=>{if(e.button===0){e.preventDefault();jump()}});$('#game-action').onclick=e=>{if(e.detail===0)jump()};
   $('#game-canvas').addEventListener('pointerdown',e=>{e.preventDefault();action();$('#game-stage').focus({preventScroll:true})});
   $('#game-stage').addEventListener('keydown',e=>{if(e.code==='ArrowDown'){e.preventDefault();if(!e.repeat)duckInput('keyboard',true);return}if(['Space','ArrowUp','KeyP','Escape'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(['KeyP','Escape'].includes(e.code)){if(mode==='running')pause();else if(mode==='paused'&&e.code==='KeyP')start()}else action()}});
   const duck=$('#game-duck');
   duck.addEventListener('pointerdown',e=>{if(e.button!==0||game!=='runner'||mode!=='running')return;e.preventDefault();try{duck.setPointerCapture(e.pointerId)}catch{}duckInput('pointer-'+e.pointerId,true);$('#game-stage').focus({preventScroll:true})});
   for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>duckInput('pointer-'+e.pointerId,false));
   duck.addEventListener('lostpointercapture',e=>duckInput('pointer-'+e.pointerId,false));duck.addEventListener('contextmenu',e=>e.preventDefault());
   duck.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)duckInput('button-key',true)}});
   duck.addEventListener('blur',()=>duckInput('button-key',false));
   window.addEventListener('keyup',e=>{if(e.code==='ArrowDown')duckInput('keyboard',false);if(['Space','Enter'].includes(e.code))duckInput('button-key',false)});
   $('#game-stage').addEventListener('blur',()=>duckInput('keyboard',false));
   document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',pause);
   window.addEventListener('storage',e=>{if(e.key===recordKey||e.key===null){readRecords();sync();draw()}});
  },
  show(){if(!engine)return;draw();sync()},hide(){pause();clearDuck()}
 };
})();
