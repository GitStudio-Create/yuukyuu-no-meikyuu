'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','stage33-projectile-rules'].forEach(load);
function arena(floor=10,id='mysteryDungeon'){
  const s=Kiri.State.reset(id);s.floor=floor;s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=80;s.player.maxHp=80;s.player.food=100;
  s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];s.seen={};
  s.spawnPolicy={maxEnemies:14,nextSpawnTurn:0};Kiri.Map.reveal(s);return s;
}
assert.equal(Kiri.EnemyCatalog.list.length,33);
assert(Kiri.EnemyCatalog.list.every(d=>d.role&&Number.isFinite(d.spawnWeight)&&d.spawnWeight>0&&Number.isFinite(d.maxPerFloor)&&d.maxPerFloor>0));
assert(Kiri.EnemyCatalog.list.every(d=>Number.isFinite(d.hp)&&Number.isFinite(d.attack)&&Number.isFinite(d.defense)&&Number.isFinite(d.exp)));
assert(Kiri.EnemyCatalog.tableFor('mysteryDungeon',2).every(d=>d.specialAbility==='none'));
assert(Kiri.EnemyCatalog.tableFor('normalDungeon',10).some(d=>d.id==='reedSniper'));
assert(!Kiri.EnemyCatalog.tableFor('normalDungeon',10).some(d=>['rustMaw','mirrorSeed','wallWraith'].includes(d.id)));
assert(Kiri.EnemyCatalog.get('pocketImp').specialChance>0);
assert(Kiri.EnemyCatalog.get('reedSniper').specialRange===7);

let s=arena(9),enemy=Kiri.Entities.createEnemy(9,{x:7,y:2},Kiri.Dungeons.get(s.dungeonId),'reedSniper');
assert.equal(enemy.role,'ranged');assert.equal(enemy.rangedDamage,Kiri.EnemyCatalog.get('reedSniper').rangedDamage);assert.equal(enemy.specialRange,7);
s.enemies=[enemy,Kiri.Entities.createEnemy(9,{x:4,y:2},Kiri.Dungeons.get(s.dungeonId),'dewMote')];
let hp=s.player.hp;Math.random=()=>0;Kiri.Entities.enemyAct(s,enemy);assert.equal(s.player.hp,hp,'他の敵越しに遠距離攻撃しない');
s.enemies=[enemy];Kiri.Entities.enemyAct(s,enemy);assert(s.player.hp<hp,'射線が通ると遠距離攻撃する');

s=arena(10);let item=Kiri.Items.create('nutBread');item.equipped=true;s.inventory=[item];
enemy=Kiri.Entities.createEnemy(10,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'pocketImp');s.enemies=[enemy];hp=s.player.hp;
Kiri.Entities.enemyAct(s,enemy);assert.equal(s.inventory.length,1,'装備品は盗まない');assert(s.player.hp<hp,'盗む物がなければ通常攻撃');

s=arena(20);enemy=Kiri.Entities.createEnemy(20,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'mirrorSeed');s.enemies=[enemy];s.traps=[{x:6,y:5,type:'spike'}];s.groundItems=[Kiri.Items.create('nutBread',4,5,s.dungeonId)];s.stairs={x:5,y:6,type:'down'};s.player.x=2;s.player.y=2;
Math.random=()=>0;Kiri.Entities.attack(s,enemy);
const clones=s.enemies.filter(e=>e!==enemy);
assert(clones.length>=1,'分裂する');assert(!clones.some(e=>e.x===6&&e.y===5),'罠上に分裂しない');assert(!clones.some(e=>e.x===4&&e.y===5),'アイテム上に分裂しない');assert(!clones.some(e=>e.x===5&&e.y===6),'階段上に分裂しない');assert(clones.every(e=>e.wokeOnTurn===s.turn),'分裂直後は同ターン行動済み扱い');

s=arena(31);let def=Kiri.EnemyCatalog.get('manyCore');for(let i=0;i<def.maxPerFloor;i++)s.enemies.push(Kiri.Entities.createEnemy(31,{x:10+i,y:10},Kiri.Dungeons.get(s.dungeonId),def.id));
assert.equal(Kiri.EnemyCatalog.canSpawnMore(s,def),false);
assert.notEqual(Kiri.EnemyCatalog.pickForState(s).id,'manyCore','上限に達した敵は自然湧き抽選から外れる');

def=Kiri.EnemyCatalog.get('wallWraith');assert.equal(def.name,'壁すべり');assert.equal(def.specialAbility,'wallSprint');assert.notEqual(def.role,'phase');
s=arena(21);enemy=Kiri.Entities.createEnemy(21,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'wallWraith');enemy.spawnSleep=false;enemy.awake=true;enemy.wokeOnTurn=-1;s.enemies=[enemy];s.map[5][4]=0;
let acts=0,originalAct=Kiri.Entities.enemyAct;Kiri.Entities.enemyAct=function(){acts++;};Kiri.Entities.takeEnemyTurns(s);assert.equal(acts,2,'壁際では最大2回行動');
acts=0;enemy.energy=0;s.map[5][4]=1;Kiri.Entities.takeEnemyTurns(s);assert.equal(acts,1,'壁から離れると通常速度');Kiri.Entities.enemyAct=originalAct;
s.player.x=3;s.player.y=5;s.map[5][4]=0;enemy.x=5;enemy.y=5;Kiri.Entities.enemyAct(s,enemy);assert.notDeepStrictEqual({x:enemy.x,y:enemy.y},{x:4,y:5},'壁へ侵入しない');assert(Kiri.Map.walkable(s,enemy.x,enemy.y),'移動後も床または通路にいる');

console.log('stage 36 smoke: monster roles, specials, wall sprint, line-of-sight, stealing and split limits passed');
