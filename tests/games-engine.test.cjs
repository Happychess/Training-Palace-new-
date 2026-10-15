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
test('flapping moves upwards; gravity and boundaries can end the game',()=>{
 const game=new Flappy(()=>0.5),start=game.player.y;game.action();for(let i=0;i<20;i++)game.step(1/120);assert.ok(game.player.y<start);for(let i=0;i<600&&!game.over;i++)game.step(1/120);assert.ok(game.over);assert.equal(game.score,0);
});
test('flappy gates can be passed and each counts once',()=>{
 const game=new Flappy(()=>0.5);for(let i=0;i<2400&&!game.over;i++){if(game.player.y>275&&game.player.vy>0)game.action();game.step(1/120)}assert.ok(!game.over);assert.ok(game.score>=9);assert.ok(game.pipes.length<5);
});
