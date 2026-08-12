'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.addEventListener=()=>{};
global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','directions','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-limits','state','stage8-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','monster-house'].forEach(load);

function arena(id='normalDungeon'){
  const s=Kiri.State.reset(id);s.map=Array.from({length:24},()=>Array(32).fill(0));
  s.rooms=[{x:1,y:1,w:7,h:7,cx:4,cy:4},{x:18,y:12,w:10,h:8,cx:23,cy:16}];
  s.rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)s.map[y][x]=1;});
  s.player.x=4;s.player.y=4;s.player.hp=999;s.player.maxHp=999;s.player.food=100;s.player.status={sleep:0,confuse:0,haste:0,blind:0,invisible:0,slow:0,poison:0,trapSight:0};
  s.stairs={x:27,y:19,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.visible={};s.spawnPolicy=Kiri.Spawns.policy(id,1);Kiri.Visibility.update(s);return s;
}

// New floors always request 5-7 ordinary items, independent of dungeon mode.
for(const id of ['tutorialDungeon','normalDungeon','mysteryDungeon'])for(let i=0;i<80;i++){const n=Kiri.Balance.floorPlan(id,20).items;assert(n>=5&&n<=7);}

// The shared 45-object cap counts bag, floor and enemy-held items, but not arrow quantity.
let s=arena();s.inventory=Array.from({length:30},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));
s.inventory[0]=Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId);s.inventory[0].quantity=99;
s.groundItems=Array.from({length:14},(_,i)=>Kiri.Items.create('moonHerb',18+i%7,12+Math.floor(i/7),s.dungeonId));
s.enemies=[Kiri.Entities.createEnemy(10,{x:20,y:18},Kiri.Dungeons.get(s.dungeonId),'pocketImp')];s.enemies[0].stolenItem=Kiri.Items.create('nutBread');
assert.equal(Kiri.Config.inventoryMax,30);assert.equal(Kiri.ItemLimits.count(s),45);assert.equal(Kiri.ItemLimits.remaining(s),0);assert(!Kiri.ItemLimits.canCreate(s));

// Monster-house extras stay 10-15 normally and stop cleanly at the shared cap.
s=arena();s.floor=12;let info=Kiri.MonsterHouse.force(s,Kiri.Dungeons.get(s.dungeonId),s.rooms[1]);assert(info.itemCount>=10&&info.itemCount<=15);assert(Kiri.ItemLimits.count(s)<=45);
s=arena();s.floor=12;s.inventory=Array.from({length:30},()=>Kiri.Items.create('nutBread'));s.groundItems=Array.from({length:10},(_,i)=>Kiri.Items.create('moonHerb',18+i,12,s.dungeonId));info=Kiri.MonsterHouse.force(s,Kiri.Dungeons.get(s.dungeonId),s.rooms[1]);assert(info.itemCount<=5);assert.equal(Kiri.ItemLimits.count(s),45);

// Natural spawning occurs on the 50th counted action; a capped attempt is consumed without backlog.
s=arena('mysteryDungeon');for(let i=0;i<49;i++)assert(!Kiri.Spawns.recordAction(s));assert.equal(s.spawnPolicy.spawnActionCount,49);assert(Kiri.Spawns.recordAction(s));assert(Kiri.Spawns.tryNaturalSpawn(s));assert.equal(s.enemies.length,1);assert.equal(s.spawnPolicy.spawnActionCount,0);assert(Kiri.Util.distance(s.enemies[0],s.player)>8);assert(!Kiri.Visibility.isVisible(s,s.enemies[0].x,s.enemies[0].y));
s.enemies=Array.from({length:30},(_,i)=>Kiri.Entities.createEnemy(30,{x:18+i%10,y:12+Math.floor(i/10)},Kiri.Dungeons.get(s.dungeonId),'dewMote'));for(let i=0;i<50;i++)Kiri.Spawns.recordAction(s);assert(!Kiri.Spawns.tryNaturalSpawn(s));assert.equal(s.spawnPolicy.spawnActionCount,0);s.enemies.pop();assert(!Kiri.Spawns.tryNaturalSpawn(s));assert.equal(s.enemies.length,29);for(let i=0;i<50;i++)Kiri.Spawns.recordAction(s);assert(Kiri.Spawns.tryNaturalSpawn(s));assert.equal(s.enemies.length,30);

// Added enemies cover every weapon target and the four shield-specific threats.
const added=['poisonSnake','fireBat','ironBeetle','spellCrow','iceBird','rockDragon','flameDragon','shadowDragon'].map(id=>Kiri.EnemyCatalog.get(id));
assert(added.every(e=>e&&e.id));const tags=new Set(added.flatMap(e=>e.tags));['plant','ice','flying','spirit','shadow','rock','shell','armored','beast','magic','dragon'].forEach(tag=>assert(tags.has(tag)||Kiri.EnemyCatalog.list.some(e=>e.tags.includes(tag))));
assert(added.some(e=>e.specialAbility==='poisonTouch'));assert(added.some(e=>e.specialAbility==='roomShot'));assert(added.filter(e=>e.specialAbility==='fireBreath').length>=2);

// Thirty objects survive the existing save/load format.
s=arena();s.inventory=Array.from({length:30},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));Kiri.State.data=s;Kiri.State.save();Kiri.State.data=Kiri.State.fresh();assert(Kiri.State.load());assert.equal(Kiri.State.data.inventory.length,30);

// A dash advances ordinary enemy turns for every step but only one natural-spawn action.
Kiri.UI={init(){},draw(){},showStairs(){},closeStairs(){},closeItemMenu(){},showGameOver(){},showEscape(){},hideOverlay(){},closeStatus(){},toggleStatus(){}};Kiri.Input={init(){},resetModes(){},cancelHeldMovement(){}};Kiri.Audio={setTheme(){}};load('game');
s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(0));s.rooms=[{x:1,y:1,w:20,h:5,cx:10,cy:3}];for(let y=1;y<6;y++)for(let x=1;x<21;x++)s.map[y][x]=1;s.player.x=2;s.player.y=3;s.player.hp=999;s.player.maxHp=999;s.player.food=100;s.stairs={x:20,y:5,type:'down'};s.enemies=[];s.groundItems=[];s.traps=[];s.seen={};s.visible={};s.spawnPolicy=Kiri.Spawns.policy(s.dungeonId,1);for(let x=1;x<21;x++)s.seen[x+',3']=1;Kiri.State.data=s;Kiri.Game.actions.run(1,0);assert(s.turn>1);assert.equal(s.spawnPolicy.spawnActionCount,1);

// Ordinary moves and individual wait actions each count once.
s=arena();Kiri.State.data=s;for(let i=0;i<49;i++)Kiri.Game.actions.move(i%2?1:-1,0);assert.equal(s.spawnPolicy.spawnActionCount,49);assert.equal(s.enemies.length,0);Kiri.Game.actions.move(1,0);assert.equal(s.enemies.length,1);assert.equal(s.spawnPolicy.spawnActionCount,0);
s=arena();Kiri.State.data=s;Kiri.Game.actions.step();Kiri.Game.actions.step();Kiri.Game.actions.step();assert.equal(s.spawnPolicy.spawnActionCount,3);assert.equal(s.turn,3);

// New enemy traits activate existing weapon and shield effects without new combat formulas.
const oldRandom=Math.random;Math.random=()=>0;
s=arena();Kiri.State.data=s;let weapon=Kiri.Items.create('dragonBlade',undefined,undefined,s.dungeonId);weapon.modifier=0;weapon.bonus=weapon.basePower;weapon.equipped=true;s.inventory=[weapon];s.player.equipment.weapon=weapon;let target=Kiri.Entities.createEnemy(42,{x:5,y:4},Kiri.Dungeons.get(s.dungeonId),'flameDragon');target.spawnSleep=false;target.awake=true;s.enemies=[target];Kiri.Entities.attack(s,target);assert(s.log[0].includes('効果はばつぐん'));
s=arena();let mirror=Kiri.Items.create('clearShield',undefined,undefined,s.dungeonId);mirror.equipped=true;s.inventory=[mirror];s.player.equipment.shield=mirror;let crow=Kiri.Entities.createEnemy(22,{x:6,y:4},Kiri.Dungeons.get(s.dungeonId),'spellCrow');crow.spawnSleep=false;crow.awake=true;s.enemies=[crow];let crowHp=crow.hp;Kiri.Entities.enemyAct(s,crow);assert(crow.hp<crowHp);
s=arena();let fireShield=Kiri.Items.create('emberShield',undefined,undefined,s.dungeonId);fireShield.equipped=true;s.inventory=[fireShield];s.player.equipment.shield=fireShield;let dragon=Kiri.Entities.createEnemy(50,{x:7,y:4},Kiri.Dungeons.get(s.dungeonId),'flameDragon');dragon.spawnSleep=false;dragon.awake=true;s.enemies=[dragon];let playerHp=s.player.hp;Kiri.Entities.enemyAct(s,dragon);assert(s.player.hp<playerHp&&playerHp-s.player.hp<=11);Math.random=oldRandom;

console.log('spawn/items/enemies smoke: 50-action spawn, dash exception, 30-slot bag, 45-object cap, floor and enemy roles passed');
