const {test}=require('node:test');const assert=require('node:assert/strict');const {Runner,Flappy}=require('../games-engine');
test('runner jump rises, blocks midair jumps and lands on the floor',()=>{
 const game=new Runner(()=>0.5),floor=game.player.y;game.action();game.step(1/120);assert.ok(game.player.y<floor);const velocity=game.player.vy;game.action();assert.equal(game.player.vy,velocity);
 for(let i=0;i<100;i++)game.step(1/120);assert.equal(game.player.y,floor);assert.equal(game.player.vy,0);
});
test('runner obstacles cause a game over and simulation freezes afterwards',()=>{
 const game=new Runner(()=>0.5);for(let i=0;i<1200&&!game.over;i++)game.step(1/120);assert.ok(game.over);assert.ok(game.score>0);const score=game.score,x=game.obstacles[0].x;game.step(1);assert.equal(game.score,score);assert.equal(game.obstacles[0].x,x);
});
test('neither a normal jump nor a super jump can pass over a bird flock',()=>{
 for(const boost of [false,true]){
  const game=new Runner();game.spawnIn=100;game.obstacles=[{type:'bird',x:260,y:0,w:58,h:game.ground-38}];game.duck(boost);game.action();game.duck(false);
  for(let i=0;i<150&&!game.over;i++)game.step(1/120);assert.ok(game.over);
 }
});
test('ducking lowers and widens the runner while keeping its feet on the ground',()=>{
 const game=new Runner(),standing={...game.player};game.duck(true);
 assert.ok(game.player.ducking);assert.ok(game.player.h<standing.h);assert.ok(game.player.w>standing.w);assert.equal(game.player.y+game.player.h,game.ground);
 game.duck(false);assert.deepEqual(game.player,standing);
});
test('flying obstacles hit a standing runner but a ducking runner passes underneath',()=>{
 for(const ducking of [false,true]){
  const game=new Runner();game.spawnIn=100;game.obstacles=[{type:'bird',x:150,y:0,w:58,h:game.ground-38}];game.duck(ducking);
  for(let i=0;i<60&&!game.over;i++)game.step(1/120);
  assert.equal(game.over,!ducking);if(ducking)assert.ok(game.obstacles[0].x+58<game.player.x);
 }
});
test('ducking cannot avoid a cactus; releasing duck beneath a bird causes a collision',()=>{
 const cactus=new Runner();cactus.spawnIn=100;cactus.obstacles=[{type:'cactus',x:100,y:cactus.ground-54,w:30,h:54}];cactus.duck(true);cactus.step(1/120);assert.ok(cactus.over);
 const bird=new Runner();bird.spawnIn=100;bird.obstacles=[{type:'bird',x:100,y:0,w:58,h:bird.ground-38}];bird.duck(true);bird.step(1/120);assert.ok(!bird.over);bird.duck(false);bird.step(1/120);assert.ok(bird.over);
});
test('duck input is queued in midair and jumping from a crouch returns to crouching on landing',()=>{
 const game=new Runner();game.spawnIn=100;game.action();game.step(1/120);const airborne={...game.player};game.duck(true);assert.deepEqual(game.player,airborne);
 for(let i=0;i<100;i++)game.step(1/120);assert.ok(game.player.ducking);assert.equal(game.player.y+game.player.h,game.ground);
 game.action();assert.ok(!game.player.ducking);assert.ok(game.player.superJump);for(let i=0;i<120;i++)game.step(1/120);assert.ok(game.player.ducking);assert.ok(!game.player.superJump);
});
test('a crouching super jump reaches higher coins than a standing jump, with no extra jump in midair',()=>{
 const heights=[];
 for(const boost of [false,true]){
  const game=new Runner();game.spawnIn=100;game.coins=[{x:235,y:65,r:9}];game.duck(boost);game.action();let highest=game.player.y;
  for(let i=0;i<120;i++){const velocity=game.player.vy;if(i===15){game.action();assert.equal(game.player.vy,velocity)}game.step(1/120);highest=Math.min(highest,game.player.y)}
  heights.push(highest);assert.equal(game.coinsCollected,boost?1:0);assert.equal(game.player.y+game.player.h,game.ground);
 }
 assert.ok(heights[1]<heights[0]-80);
});
test('coins require contact, count once, stay gone and are not awarded on a fatal frame',()=>{
 const game=new Runner();game.spawnIn=100;game.coins=[{x:110,y:285,r:9},{x:110,y:50,r:9}];game.step(1/120);assert.equal(game.coinsCollected,1);assert.equal(game.coins.length,1);
 for(let i=0;i<120;i++)game.step(1/120);assert.equal(game.coinsCollected,1);assert.equal(game.coins.length,0);
 const fatal=new Runner();fatal.spawnIn=100;fatal.coins=[{x:110,y:285,r:9}];fatal.obstacles=[{type:'cactus',x:100,y:252,w:30,h:54}];fatal.step(1/120);assert.ok(fatal.over);assert.equal(fatal.coinsCollected,0);fatal.step(1);assert.equal(fatal.coinsCollected,0);
});
test('a mixture of jumping and ducking clears both obstacle types as the runner speeds up',()=>{
 const game=new Runner(()=>0.5),seen=new Set();
 for(let i=0;i<7200&&!game.over;i++){
  const obstacle=game.obstacles.find(o=>o.x+o.w>game.player.x+7);
  if(obstacle){seen.add(obstacle.type);game.duck(obstacle.type==='bird'&&obstacle.x-game.player.x<200);if(obstacle.type==='cactus'&&obstacle.x-game.player.x<140)game.action()}else game.duck(false);
  game.step(1/120);
 }
 assert.ok(!game.over);assert.ok(game.score>=599);assert.deepEqual([...seen].sort(),['bird','cactus']);assert.ok(game.coinsCollected>10);assert.ok(game.coins.length<30);
});
test('short and long obstacle gaps remain playable when mixing normal jumps, super jumps and ducking',()=>{
 for(const random of [0,0.5,0.999]){
  const game=new Runner(()=>random);let boosts=0;
  for(let i=0;i<14400&&!game.over;i++){
   const p=game.player,obstacle=game.obstacles.find(o=>o.x+o.w>p.x+7);
   const high=obstacle?.type==='cactus'&&game.coins.some(c=>c.y<100&&Math.abs(c.x-obstacle.x)<100);
   game.duck(!!obstacle&&((obstacle.type==='bird'&&obstacle.x-p.x<200)||(high&&obstacle.x-p.x<170)));
   if(obstacle?.type==='cactus'&&obstacle.x-p.x<(high?170:140)&&p.vy===0){game.action();if(p.superJump)boosts++}
   game.step(1/120);
  }
  assert.ok(!game.over);assert.ok(game.score>=1199);assert.ok(game.coinsCollected>50);if(random>0)assert.ok(boosts>0);
 }
});
test('flapping moves upwards; gravity and boundaries can end the game',()=>{
 const game=new Flappy(()=>0.5),start=game.player.y;game.action();for(let i=0;i<20;i++)game.step(1/120);assert.ok(game.player.y<start);for(let i=0;i<600&&!game.over;i++)game.step(1/120);assert.ok(game.over);assert.equal(game.score,0);
});
test('flappy gates can be passed and each counts once',()=>{
 const game=new Flappy(()=>0.5);for(let i=0;i<2400&&!game.over;i++){if(game.player.y>275&&game.player.vy>0)game.action();game.step(1/120)}assert.ok(!game.over);assert.ok(game.score>=9);assert.ok(game.pipes.length<5);
});
