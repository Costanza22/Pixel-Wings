/* Regras puras do combate: não dependem de desenho nem de teclado. */
(function(root){
  const FLOOR=490;
  function fighter(x,dir){return {x,y:FLOOR,vy:0,dir,hp:100,energy:100,claw:0,fire:0,flash:0,block:false,attack:0,attackType:null,move:0,stride:0,death:0,guardBroken:0,shieldFlash:0};}
  function create(){return {player:fighter(260,1),enemy:fighter(860,-1),shots:[],time:0,result:null};}
  function hit(target,damage,sourceX){
    const facing=(sourceX-target.x)*target.dir>=0;
    const guarded=target.block&&facing&&target.energy>0;
    if(guarded){target.energy=Math.max(0,target.energy-8);target.shieldFlash=.2;if(target.energy===0){target.block=false;target.guardBroken=.8;}return;}
    target.hp=Math.max(0,target.hp-damage);target.flash=.16;
  }
  // Resolve ambas as defesas antes de qualquer ataque: a ordem dos jogadores
  // não pode fazer o escudo usar o estado do quadro anterior.
  function prepare(a,b,input,dt){
    a.dir=b.x>=a.x?1:-1;a.guardBroken=Math.max(0,a.guardBroken-dt);
    a.block=!!input.block&&a.energy>0&&a.y>=FLOOR&&a.guardBroken===0;
    if(a.block){a.energy=Math.max(0,a.energy-13*dt);if(a.energy===0){a.block=false;a.guardBroken=.8;}}
    else a.energy=Math.min(100,a.energy+19*dt);
  }
  function act(s,a,b,input,dt){
    for(const k of ['claw','fire','flash','attack','shieldFlash'])a[k]=Math.max(0,a[k]-dt);
    const oldX=a.x;
    a.x=Math.max(90,Math.min(1030,a.x+(input.move||0)*(a.block?65:210)*dt));
    a.move=(a.x-oldX)/dt;
    if(a.y>=FLOOR)a.stride+=Math.abs(a.x-oldX)/22;
    if(input.jump&&a.y>=FLOOR&&!a.block)a.vy=-490;
    a.vy+=1100*dt;a.y+=a.vy*dt;
    if(a.y>=FLOOR){a.y=FLOOR;a.vy=0;}
    if(input.claw&&!a.block&&a.claw<=0){
      a.claw=.6;a.attack=.3;a.attackType='claw';
      if(Math.abs(a.x-b.x)<165&&Math.abs(a.y-b.y)<100)hit(b,12,a.x);
    }
    if(input.fire&&!a.block&&a.fire<=0&&a.energy>=28){
      a.energy-=28;a.fire=.85;a.attack=.36;a.attackType='fire';
      s.shots.push({x:a.x+a.dir*90,y:a.y-75,vx:a.dir*470,owner:a,life:2.5});
    }
  }
  function update(s,input,dt,enemyInput){
    if(s.result){s.shots=[];for(const a of [s.player,s.enemy]){a.block=false;a.attack=0;a.move=0;a.flash=Math.max(0,a.flash-dt);if(a.hp<=0)a.death+=dt;a.vy+=1100*dt;a.y=Math.min(FLOOR,a.y+a.vy*dt);}return;}s.time+=dt;
    const p=s.player,e=s.enemy,dist=Math.abs(p.x-e.x);
    const ai=enemyInput||{move:dist>145?Math.sign(p.x-e.x):0,claw:dist<160,fire:dist>230,block:dist<180&&s.time%2.8<.65,jump:s.shots.some(q=>q.owner===p&&Math.abs(q.x-e.x)<185)&&e.y===FLOOR};
    prepare(p,e,input,dt);prepare(e,p,ai,dt);
    act(s,p,e,input,dt);act(s,e,p,ai,dt);
    if(Math.abs(p.x-e.x)<95&&Math.abs(p.y-e.y)<95){const sign=p.x<e.x?-1:1;const push=(95-Math.abs(p.x-e.x))/2;p.x=Math.max(90,Math.min(1030,p.x+sign*push));e.x=Math.max(90,Math.min(1030,e.x-sign*push));}
    for(const q of s.shots){q.x+=q.vx*dt;q.life-=dt;const t=q.owner===p?e:p;if(Math.abs(q.x-t.x)<60&&q.y>t.y-150&&q.y<t.y){hit(t,17,q.x-q.vx*dt);q.life=0;}}
    s.shots=s.shots.filter(q=>q.life>0&&q.x>-50&&q.x<1170);
    if(p.hp<=0||e.hp<=0)s.result=p.hp<=0?(e.hp<=0?'draw':'loss'):'win';
  }
  const api={create,update,hit,FLOOR};root.DragonEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
