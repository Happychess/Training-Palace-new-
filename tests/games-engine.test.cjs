const {test}=require('node:test');const assert=require('node:assert/strict');const {Runner,Flappy}=require('../games-engine');
test('runner jump rises, blocks midair jumps and lands on the floor',()=>{
 const game=new Runner(()=>0.5),floor=game.player.y;game.action();game.step(1/120);assert.ok(game.player.y<floor);const velocity=game.player.vy;game.action();assert.equal(game.player.vy,velocity);
 for(let i=0;i<100;i++)game.step(1/120);assert.equal(game.player.y,floor);assert.equal(game.player.vy,0);
});
test('runner obstacles cause a game over and simulation freezes afterwards',()=>{
 const game=new Runner(()=>0.5);for(let i=0;i<1200&&!game.over;i++)game.step(1/120);assert.ok(game.over);assert.ok(game.score>0);const score=game.score,x=game.obstacles[0].x;game.step(1);assert.equal(game.score,score);assert.equal(game.obstacles[0].x,x);
});
test('runner is playable: correctly timed jumps clear several obstacles',()=>{
 const game=new Runner(()=>0.5);for(let i=0;i<1200&&!game.over;i++){const obstacle=game.obstacles.find(o=>o.x+o.w>game.player.x);if(obstacle&&obstacle.x-game.player.x<135)game.action();game.step(1/120)}assert.ok(!game.over);assert.ok(game.score>=99);
});
test('ducking lowers and widens the runner while keeping its feet on the ground',()=>{
 const game=new Runner(),standing={...game.player};game.duck(true);
 assert.ok(game.player.ducking);assert.ok(game.player.h<standing.h);assert.ok(game.player.w>standing.w);assert.equal(game.player.y+game.player.h,game.ground);
 game.duck(false);assert.deepEqual(game.player,standing);
});
test('flying obstacles hit a standing runner but a ducking runner passes underneath',()=>{
 for(const ducking of [false,true]){
  const game=new Runner();game.spawnIn=100;game.obstacles=[{type:'bird',x:150,y:game.ground-68,w:58,h:30}];game.duck(ducking);
  for(let i=0;i<60&&!game.over;i++)game.step(1/120);
  assert.equal(game.over,!ducking);if(ducking)assert.ok(game.obstacles[0].x+58<game.player.x);
 }
});
test('ducking cannot avoid a cactus; releasing duck beneath a bird causes a collision',()=>{
 const cactus=new Runner();cactus.spawnIn=100;cactus.obstacles=[{type:'cactus',x:100,y:cactus.ground-54,w:30,h:54}];cactus.duck(true);cactus.step(1/120);assert.ok(cactus.over);
 const bird=new Runner();bird.spawnIn=100;bird.obstacles=[{type:'bird',x:100,y:bird.ground-68,w:58,h:30}];bird.duck(true);bird.step(1/120);assert.ok(!bird.over);bird.duck(false);bird.step(1/120);assert.ok(bird.over);
});
test('duck input is queued in midair and jumping from a crouch returns to crouching on landing',()=>{
 const game=new Runner();game.spawnIn=100;game.action();game.step(1/120);const airborne={...game.player};game.duck(true);assert.deepEqual(game.player,airborne);
 for(let i=0;i<100;i++)game.step(1/120);assert.ok(game.player.ducking);assert.equal(game.player.y+game.player.h,game.ground);
 game.action();assert.ok(!game.player.ducking);assert.ok(game.player.vy<0);for(let i=0;i<100;i++)game.step(1/120);assert.ok(game.player.ducking);
});
test('a mixture of jumping and ducking clears both obstacle types as the runner speeds up',()=>{
 const game=new Runner(()=>0.5),seen=new Set();
 for(let i=0;i<7200&&!game.over;i++){
  const obstacle=game.obstacles.find(o=>o.x+o.w>game.player.x+7);
  if(obstacle){seen.add(obstacle.type);game.duck(obstacle.type==='bird'&&obstacle.x-game.player.x<200);if(obstacle.type==='cactus'&&obstacle.x-game.player.x<140)game.action()}else game.duck(false);
  game.step(1/120);
 }
 assert.ok(!game.over);assert.ok(game.score>=599);assert.deepEqual([...seen].sort(),['bird','cactus']);
});
test('flapping moves upwards; gravity and boundaries can end the game',()=>{
 const game=new Flappy(()=>0.5),start=game.player.y;game.action();for(let i=0;i<20;i++)game.step(1/120);assert.ok(game.player.y<start);for(let i=0;i<600&&!game.over;i++)game.step(1/120);assert.ok(game.over);assert.equal(game.score,0);
});
test('flappy gates can be passed and each counts once',()=>{
 const game=new Flappy(()=>0.5);for(let i=0;i<2400&&!game.over;i++){if(game.player.y>275&&game.player.vy>0)game.action();game.step(1/120)}assert.ok(!game.over);assert.ok(game.score>=9);assert.ok(game.pipes.length<5);
});
