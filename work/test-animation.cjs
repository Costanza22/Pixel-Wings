const assert=require('node:assert/strict'),E=require('../outputs/duelo-dos-dragoes/engine.js'),A=require('../outputs/duelo-dos-dragoes/animation.js');
const s=E.create(),p=s.player;
assert.equal(A.pose(p,0).kind,'idle');
const sequence=new Set();for(let i=0;i<30;i++){E.update(s,{move:1},1/60,{});sequence.add(A.pose(p,s.time).index);}assert.equal(sequence.size,4);
E.update(s,{jump:true},1/60,{});assert.equal(A.pose(p,s.time).kind,'jump');
p.y=E.FLOOR;p.vy=0;E.update(s,{block:true},1/60,{});assert.equal(A.pose(p,s.time).kind,'block');
E.update(s,{claw:true},1/60,{});assert.equal(A.pose(p,s.time).kind,'claw');
p.attack=0;E.update(s,{fire:true},1/60,{});assert.equal(A.pose(p,s.time).kind,'fire');
E.hit(p,1,p.x+100);assert.equal(A.pose(p,s.time).kind,'hit');
p.hp=0;assert.equal(A.pose(p,s.time).kind,'defeat');
s.result='loss';const hp=s.enemy.hp,before=A.pose(p,s.time);for(let i=0;i<120;i++)E.update(s,{},1/60,{});const after=A.pose(p,s.time);assert.ok(p.death>1.8);assert.equal(s.enemy.hp,hp);assert.equal(after.index,6);assert.ok(after.sy<before.sy);assert.equal(s.shots.length,0);
for(const f of A.frames){assert.ok(f[0]>=0&&f[1]>=0&&f[0]+f[2]<=1536&&f[1]+f[3]<=1024);}
console.log('8 estados visuais, 4 quadros de caminhada, queda até repouso sem dano adicional e limites dos recortes: OK');
