'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=()=>{};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','state','stage8-state','map','visibility','combat-rules','entities','item-actions','balance'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.floor=12;s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=80;s.player.maxHp=80;s.player.status={sleep:0,confuse:0,haste:0,blind:0,invisible:0};s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.seen={};s.spawnPolicy={maxEnemies:14};Kiri.State.data=s;Kiri.Visibility.update(s);return s;}

let early=Kiri.Entities.createEnemy(1,{x:1,y:1},Kiri.Dungeons.get('normalDungeon'),'stoneBeak');
let deep=Kiri.Entities.createEnemy(21,{x:1,y:1},Kiri.Dungeons.get('normalDungeon'),'stoneBeak');
assert.equal(deep.power,early.power);
assert.equal(early.power,Kiri.EnemyCatalog.get('stoneBeak').attack);
assert(Kiri.EnemyCatalog.get('abyssOracle').attack>Kiri.EnemyCatalog.get('spiralEye').attack);

const wanderIds=Kiri.EnemyCatalog.list.filter(d=>d.behaviorType==='wander').map(d=>d.id).sort();
assert.deepStrictEqual(wanderIds,['driftMoth','wallWraith']);

const random=Math.random;Math.random=()=>0;
let s=arena(),eye=Kiri.Entities.createEnemy(12,{x:8,y:2},Kiri.Dungeons.get(s.dungeonId),'spiralEye');eye.spawnSleep=false;eye.awake=true;s.enemies=[eye];Kiri.Entities.enemyAct(s,eye);assert(s.player.status.confuse>0);assert(s.log[0].includes('にらみ'));

s=arena();s.player.status.blind=5;eye=Kiri.Entities.createEnemy(12,{x:8,y:2},Kiri.Dungeons.get(s.dungeonId),'spiralEye');eye.spawnSleep=false;eye.awake=true;s.enemies=[eye];Kiri.Entities.enemyAct(s,eye);assert.equal(s.player.status.confuse,0);
s=arena();s.player.status.invisible=5;eye=Kiri.Entities.createEnemy(12,{x:8,y:2},Kiri.Dungeons.get(s.dungeonId),'spiralEye');eye.spawnSleep=false;eye.awake=true;s.enemies=[eye];Kiri.Entities.enemyAct(s,eye);assert.equal(s.player.status.confuse,0);

s=arena();let herb=Kiri.Items.create('blindHerb',0,0,s.dungeonId);Kiri.ItemActions.perform('drink',s,herb);assert(s.player.status.blind>0);
s=arena();herb=Kiri.Items.create('invisibleHerb',0,0,s.dungeonId);Kiri.ItemActions.perform('drink',s,herb);assert(s.player.status.invisible>0);
s=arena();let staff=Kiri.Items.create('invisibleStaff',0,0,s.dungeonId);s.inventory=[staff];Kiri.ItemActions.perform('wave',s,staff);assert(s.player.status.invisible>0);
s=arena();s.player.facingDirection={dx:1,dy:0,id:'E'};eye=Kiri.Entities.createEnemy(12,{x:4,y:2},Kiri.Dungeons.get(s.dungeonId),'spiralEye');eye.spawnSleep=false;eye.awake=true;s.enemies=[eye];staff=Kiri.Items.create('blindStaff',0,0,s.dungeonId);s.inventory=[staff];Kiri.ItemActions.perform('wave',s,staff);assert(eye.status.blind>0);
Math.random=random;

console.log('enemy strength and confusion gaze smoke passed');
