const assert=require('node:assert/strict');
const E=require('../outputs/duelo-dos-dragoes/engine.js');
let count=0;
function test(name,fn){fn();count++;console.log('OK '+name);}
test('garras fora de alcance',()=>{const s=E.create();E.update(s,{claw:true},1/60,{});assert.equal(s.enemy.hp,100);});
test('garras próximas e intervalo',()=>{const s=E.create();s.enemy.x=390;E.update(s,{claw:true},1/60,{});assert.equal(s.enemy.hp,88);E.update(s,{claw:true},1/60,{});assert.equal(s.enemy.hp,88);});
test('fogo consome energia e respeita intervalo',()=>{const s=E.create();E.update(s,{fire:true},1/60,{});assert.equal(s.player.energy,72);assert.equal(s.shots.length,1);E.update(s,{fire:true},1/60,{});assert.equal(s.shots.length,1);});
test('sem energia não dispara',()=>{const s=E.create();s.player.energy=0;E.update(s,{fire:true},1/60,{});assert.equal(s.shots.length,0);});
test('defesa frontal bloqueia todo o dano',()=>{const t=E.create().enemy;t.block=true;E.hit(t,20,t.x-100);assert.equal(t.hp,100);assert.equal(t.energy,92);});
test('defesa não protege atrás',()=>{const t=E.create().enemy;t.block=true;E.hit(t,20,t.x+100);assert.equal(t.hp,80);});
test('projétil acerta uma vez',()=>{const s=E.create();E.update(s,{fire:true},1/60,{});for(let i=0;i<100;i++)E.update(s,{},1/60,{});assert.equal(s.enemy.hp,83);assert.equal(s.player.hp,100);assert.equal(s.shots.length,0);});
test('salto volta ao chão',()=>{const s=E.create();E.update(s,{jump:true},1/60,{});assert.ok(s.player.y<E.FLOOR);for(let i=0;i<120;i++)E.update(s,{},1/60,{});assert.equal(s.player.y,E.FLOOR);});
test('limites da arena',()=>{const s=E.create();for(let i=0;i<600;i++)E.update(s,{move:-1},1/60,{});assert.equal(s.player.x,90);});
test('vitória e imutabilidade após resultado',()=>{const s=E.create();s.enemy.hp=1;s.enemy.x=390;E.update(s,{claw:true},1/60,{});assert.equal(s.result,'win');const t=s.time;E.update(s,{},1/60,{});assert.equal(s.time,t);});
console.log(count+' testes passaram.');
