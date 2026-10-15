/* Small deterministic game simulations, independent of drawing and browser timers. */
(function(root){
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 class Runner{
  constructor(random=Math.random){this.random=random;this.width=900;this.height=380;this.ground=306;this.elapsed=0;this.score=0;this.over=false;this.spawnIn=0.8;this.obstacleCount=0;this.duckHeld=false;this.obstacles=[];this.coins=[300,355,410].map(x=>({x,y:286,r:9}));this.coinsCollected=0;this.player={x:86,y:252,w:44,h:54,vy:0,ducking:false,superJump:false}}
  posture(ducking){const p=this.player,feet=p.y+p.h;p.ducking=ducking;p.h=ducking?28:54;p.w=ducking?62:44;p.y=feet-p.h}
  duck(held){this.duckHeld=!!held;if(!this.over&&this.player.vy===0&&this.player.y+this.player.h>=this.ground-0.1)this.posture(this.duckHeld)}
  action(){if(!this.over&&this.player.vy===0&&this.player.y+this.player.h>=this.ground-0.1){const boost=this.player.ducking;this.posture(false);this.player.superJump=boost;this.player.vy=boost?-950:-700}}
  step(dt){
   if(this.over)return;this.elapsed+=dt;this.score=Math.floor(this.elapsed*10);const p=this.player;p.vy+=2000*dt;p.y+=p.vy*dt;
   if(p.y+p.h>=this.ground){p.y=this.ground-p.h;p.vy=0;p.superJump=false;this.posture(this.duckHeld)}
   const speed=Math.min(540,290+this.elapsed*3);this.spawnIn-=dt;
   if(this.spawnIn<=0){
    this.obstacleCount++;
    const flying=this.obstacleCount>1&&(this.obstacleCount%3===0||this.random()<0.3);
    // The visible flock fills the sky; only the crouching gap beneath it is safe.
    if(flying){this.obstacles.push({type:'bird',x:this.width+30,y:0,w:58,h:this.ground-38});for(const offset of [0,38,76])this.coins.push({x:this.width+30+offset,y:this.ground-14,r:9})}
    else{const h=38+this.random()*32;this.obstacles.push({type:'cactus',x:this.width+30,y:this.ground-h,w:24+this.random()*18,h});const high=this.obstacleCount%2===0;for(let i=0;i<3;i++)this.coins.push({x:this.width-20+i*50,y:(high?[90,65,90]:[185,155,185])[i],r:9})}
    this.spawnIn=1.2+this.random()*0.7;
   }
   for(const obstacle of this.obstacles){obstacle.x-=speed*dt;if(overlaps({x:p.x+7,y:p.y+5,w:p.w-13,h:p.h-8},{x:obstacle.x+3,y:obstacle.y+3,w:obstacle.w-6,h:obstacle.h-3}))this.over=true}
   this.obstacles=this.obstacles.filter(o=>o.x+o.w>-20);
   for(const coin of this.coins){coin.x-=speed*dt;if(!this.over&&overlaps({x:p.x+4,y:p.y+3,w:p.w-8,h:p.h-4},{x:coin.x-coin.r,y:coin.y-coin.r,w:coin.r*2,h:coin.r*2})){coin.collected=true;this.coinsCollected++}}
   this.coins=this.coins.filter(coin=>!coin.collected&&coin.x+coin.r>-20);
  }
 }
 class Flappy{
  constructor(random=Math.random){this.random=random;this.width=480;this.height=600;this.ground=550;this.elapsed=0;this.score=0;this.over=false;this.spawnIn=0.6;this.pipes=[];this.player={x:116,y:245,r:15,vy:0}}
  action(){if(!this.over)this.player.vy=-340}
  step(dt){
   if(this.over)return;this.elapsed+=dt;const p=this.player;p.vy+=1050*dt;p.y+=p.vy*dt;if(p.y-p.r<0||p.y+p.r>=this.ground){this.over=true;return}
   const speed=Math.min(205,150+this.score*1.5);this.spawnIn-=dt;if(this.spawnIn<=0){const gap=Math.max(158,190-this.score*1.2),center=145+this.random()*245;this.pipes.push({x:this.width+20,w:68,top:center-gap/2,bottom:center+gap/2,passed:false});this.spawnIn=1.8}
   for(const pipe of this.pipes){pipe.x-=speed*dt;for(const rect of [{x:pipe.x,y:0,w:pipe.w,h:pipe.top},{x:pipe.x,y:pipe.bottom,w:pipe.w,h:this.ground-pipe.bottom}]){const dx=p.x-Math.max(rect.x,Math.min(p.x,rect.x+rect.w)),dy=p.y-Math.max(rect.y,Math.min(p.y,rect.y+rect.h));if(dx*dx+dy*dy<p.r*p.r)this.over=true}if(!this.over&&!pipe.passed&&pipe.x+pipe.w<p.x-p.r){pipe.passed=true;this.score++}}
   this.pipes=this.pipes.filter(pipe=>pipe.x+pipe.w>-20);
  }
 }
 const api={Runner,Flappy};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PalaceGamesEngine=api;
})(typeof window!=='undefined'?window:globalThis);
