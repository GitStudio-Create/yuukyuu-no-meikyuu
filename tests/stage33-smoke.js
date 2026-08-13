'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};
const storage={};global.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]};global.addEventListener=()=>{};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','progression','spawns','dungeons','themes','enemy-catalog','state','items','inventory','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','stage33-projectile-rules'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,cx:2,cy:2}];s.player.x=2;s.player.y=2;s.player.power=8;s.player.maxPower=8;s.player.facingDirection={dx:1,dy:0};s.stairs={x:30,y:22};s.groundItems=[];s.enemies=[];s.traps=[];return s;}
function item(id,s){const i=Kiri.Items.create(id,undefined,undefined,s.dungeonId);s.inventory.push(i);return i;}
function blockWallAt(s,x,y){s.map[y][x]=0;}
function ground(id,x,y,s){const i=Kiri.Items.create(id,x,y,s.dungeonId);s.groundItems.push(i);return i;}
function trap(x,y,s){s.traps.push({x:x,y:y,id:'mistNeedle',revealed:true});}
function expectedAttack(s){const f=Kiri.Items.attackFormula(s);return Math.max(0,Math.min(255,f.baseAttack+Kiri.Items.roundAttackBonus(f.baseAttack*(f.weaponPower+f.strengthOffset)/16)));}

let s=arena();
assert.equal(Kiri.Items.attackPower(s),5);
s.player.power=9;assert.equal(Kiri.Items.attackPower(s),5);
s.player.power=7;assert.equal(Kiri.Items.attackPower(s),5);
let weapon=item('willowBlade',s);weapon.basePower=3;weapon.modifier=0;weapon.bonus=3;s.player.power=8;Kiri.ItemActions.perform('equip',s,weapon);assert.equal(Kiri.Items.attackPower(s),6);
weapon.bonus=5;assert.equal(Kiri.Items.attackPower(s),7);
s.player.level=5;assert(Kiri.Items.baseAttackForLevel(5)>5);assert.equal(Kiri.Items.attackPower(s),expectedAttack(s));
s.player.power=7;assert.equal(Kiri.Items.attackPower(s),expectedAttack(s));

s=arena();blockWallAt(s,5,2);ground('nutBread',4,2,s);trap(3,1,s);trap(4,1,s);trap(5,1,s);trap(3,2,s);trap(5,2,s);trap(3,3,s);trap(5,3,s);
let thrown=item('barkShield',s),result=Kiri.ItemActions.perform('throw',s,thrown),dropped=s.groundItems.find(i=>i===thrown);
assert(result.success);assert(dropped);assert.notEqual(dropped.x+','+dropped.y,'4,2');assert.equal(dropped.x+','+dropped.y,'4,3');assert(!s.traps.some(t=>t.x===dropped.x&&t.y===dropped.y));

s=arena();blockWallAt(s,5,2);ground('nutBread',4,2,s);for(let y=1;y<=3;y++)for(let x=3;x<=5;x++)trap(x,y,s);
thrown=item('clearShield',s);result=Kiri.ItemActions.perform('throw',s,thrown);
assert(result.success);assert(!s.groundItems.includes(thrown));assert(result.message.includes('落ちる場所がなく消えた'));

s=arena();blockWallAt(s,5,2);ground('nutBread',4,2,s);trap(3,1,s);trap(4,1,s);trap(5,1,s);trap(3,2,s);trap(5,2,s);trap(3,3,s);trap(5,3,s);
let arrows=item('reedArrow',s);result=Kiri.ItemActions.perform('shoot',s,arrows);let arrowDrop=s.groundItems.find(i=>i.category==='arrow');
assert(result.success);assert(arrowDrop);assert.equal(arrowDrop.x+','+arrowDrop.y,'4,3');

s=arena();blockWallAt(s,5,2);let iron=item('ironArrow',s);result=Kiri.ItemActions.perform('shoot',s,iron);arrowDrop=s.groundItems.find(i=>i.id==='ironArrow');
assert(result.success);assert(arrowDrop);assert.equal(arrowDrop.x+','+arrowDrop.y,'4,2');assert.equal(iron.arrowStrength,12);

s=arena();let pierce=item('pierceArrow',s);s.enemies=[{x:4,y:2,hp:30,maxHp:30,power:1,defense:0,status:{}},{x:7,y:2,hp:30,maxHp:30,power:1,defense:0,status:{}}];
result=Kiri.ItemActions.perform('shoot',s,pierce);
assert(s.enemies.every(e=>e.hp<30));assert(!s.groundItems.some(i=>i.category==='arrow'));assert(result.message.includes('遠くへ飛んで消えた'));

s=arena();blockWallAt(s,7,2);pierce=item('pierceArrow',s);s.enemies=[{x:4,y:2,hp:30,maxHp:30,power:1,defense:0,status:{}}];
result=Kiri.ItemActions.perform('shoot',s,pierce);
arrowDrop=s.groundItems.find(i=>i.category==='arrow');
assert(arrowDrop);assert.equal(arrowDrop.x+','+arrowDrop.y,'6,2');

console.log('stage 33 smoke: base attack and shared projectile landing rules passed');
