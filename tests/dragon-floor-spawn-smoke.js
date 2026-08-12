'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.addEventListener=()=>{};
global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-limits','state','stage8-state','map','visibility','combat-rules','entities','item-actions','balance','stage33-projectile-rules'].forEach(load);
function has(id,floor,dungeon='normalDungeon'){return Kiri.EnemyCatalog.tableFor(dungeon,floor).some(e=>e.id===id);}
function share(ids,floor){const pool=Kiri.EnemyCatalog.tableFor('normalDungeon',floor),total=pool.reduce((n,e)=>n+Kiri.EnemyCatalog.spawnWeightFor(e,floor),0),part=pool.filter(e=>ids.includes(e.id)).reduce((n,e)=>n+Kiri.EnemyCatalog.spawnWeightFor(e,floor),0);return part/total;}

assert.equal(Kiri.EnemyCatalog.list.length,33);
assert(!has('rockDragon',22));assert(has('rockDragon',23));assert(has('rockDragon',40));assert(!has('rockDragon',41));
assert(!has('flameDragon',24));assert(has('flameDragon',25));assert(has('flameDragon',60));assert(!has('flameDragon',61));
assert(!has('shadowDragon',49));assert(has('shadowDragon',50));assert(has('shadowDragon',99));
const rock=Kiri.EnemyCatalog.get('rockDragon'),flame=Kiri.EnemyCatalog.get('flameDragon');
assert.equal(Kiri.EnemyCatalog.spawnWeightFor(rock,23),1);assert.equal(Kiri.EnemyCatalog.spawnWeightFor(rock,24),2);assert.equal(Kiri.EnemyCatalog.spawnWeightFor(rock,25),5);
assert.equal(Kiri.EnemyCatalog.spawnWeightFor(flame,25),1);assert.equal(Kiri.EnemyCatalog.spawnWeightFor(flame,26),2);assert.equal(Kiri.EnemyCatalog.spawnWeightFor(flame,27),4);
assert(share(['rockDragon'],23)<.1);assert(share(['rockDragon'],24)<.15);assert(share(['rockDragon','flameDragon'],25)<.25);assert(share(['rockDragon','flameDragon'],26)<.25);
const floor27=Kiri.EnemyCatalog.tableFor('normalDungeon',27);assert(floor27.some(e=>e.id==='rockDragon')&&floor27.some(e=>e.id==='flameDragon'));assert(floor27.some(e=>!e.tags.includes('dragon')));assert(share(['rockDragon','flameDragon'],27)<.3);

function arena(){const s=Kiri.State.reset('normalDungeon');s.floor=27;s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=200;s.player.maxHp=200;s.player.equipment={weapon:null,shield:null,ring:null,arrow:null};s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.spawnPolicy=Kiri.Spawns.policy(s.dungeonId,s.floor);Kiri.State.data=s;return s;}
const oldRandom=Math.random;Math.random=()=>0;
let s=arena(),axe=Kiri.Items.create('stoneAxe',undefined,undefined,s.dungeonId);axe.modifier=0;axe.bonus=axe.basePower;axe.equipped=true;s.inventory=[axe];s.player.equipment.weapon=axe;let enemy=Kiri.Entities.createEnemy(27,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'rockDragon');enemy.spawnSleep=false;enemy.awake=true;s.enemies=[enemy];Kiri.Entities.attack(s,enemy);assert(s.log[0].includes('効果はばつぐん'));
s=arena();let sword=Kiri.Items.create('dragonBlade',undefined,undefined,s.dungeonId);sword.modifier=0;sword.bonus=sword.basePower;sword.equipped=true;s.inventory=[sword];s.player.equipment.weapon=sword;enemy=Kiri.Entities.createEnemy(27,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'flameDragon');enemy.spawnSleep=false;enemy.awake=true;s.enemies=[enemy];Kiri.Entities.attack(s,enemy);assert(s.log[0].includes('効果はばつぐん'));
s=arena();let shield=Kiri.Items.create('emberShield',undefined,undefined,s.dungeonId);shield.modifier=0;shield.bonus=shield.basePower;shield.equipped=true;s.inventory=[shield];s.player.equipment.shield=shield;enemy=Kiri.Entities.createEnemy(27,{x:7,y:2},Kiri.Dungeons.get(s.dungeonId),'flameDragon');enemy.spawnSleep=false;enemy.awake=true;s.enemies=[enemy];const hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert.equal(hp-s.player.hp,8);Math.random=oldRandom;

s=arena();s.enemies=[Kiri.Entities.createEnemy(27,{x:8,y:8},Kiri.Dungeons.get(s.dungeonId),'rockDragon'),Kiri.Entities.createEnemy(27,{x:9,y:8},Kiri.Dungeons.get(s.dungeonId),'flameDragon')];Kiri.State.save();Kiri.State.data=Kiri.State.fresh();assert(Kiri.State.load());assert.deepStrictEqual(Kiri.State.data.enemies.map(e=>e.definitionId),['rockDragon','flameDragon']);
console.log('dragon floor spawn smoke: ranges, ramped weights, mixed 27F, equipment effects and save/load passed');
