'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};global.addEventListener=()=>{};function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','item-details','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(n=>load('js/'+n+'.js'));
function arena(room){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=room?[{x:1,y:1,w:8,h:8}]:[{x:10,y:10,w:8,h:8}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:1};s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.spawnPolicy={nextSpawnTurn:999,maxEnemies:10,naturalSpawnInterval:30};return s;}
Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{}};Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{}};load('js/game.js');

// Shared diagonal melee rule: rooms allow it, corridors do not.
let s=arena(true),enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=50;enemy.maxHp=50;enemy.status.sleep=8;s.enemies=[enemy];let hp=enemy.hp;assert(Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,enemy));Kiri.Game.actions.attack();assert(enemy.hp<hp);
s=arena(false);enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=50;enemy.maxHp=50;enemy.status.sleep=8;s.enemies=[enemy];hp=enemy.hp;assert(!Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,enemy));Kiri.Game.actions.attack();assert.equal(enemy.hp,hp);assert(s.log.some(x=>x.includes('通路では斜め')));
s=arena(true);enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert(s.player.hp<hp);
s=arena(false);enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert.equal(s.player.hp,hp);

// Corner clipping remains blocked, while ranged item rays remain diagonal in corridors.
s=arena(false);s.map[2][3]=0;assert.equal(Kiri.Map.canStep(s,3,3,1,1),false);s.map[2][3]=1;s.map[3][2]=0;assert.equal(Kiri.Map.canStep(s,3,3,1,1),false);
function diagonalTarget(){s=arena(false);enemy=Kiri.Entities.createEnemy(1,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=80;enemy.maxHp=80;s.enemies=[enemy];return enemy;}
enemy=diagonalTarget();let arrow=Kiri.Items.create('reedArrow',0,0,s.dungeonId);arrow.quantity=2;s.inventory=[arrow];hp=enemy.hp;Kiri.ItemActions.perform('shoot',s,arrow);assert(enemy.hp<hp);
enemy=diagonalTarget();let staff=Kiri.Items.create('sleepStaff',0,0,s.dungeonId);s.inventory=[staff];Kiri.ItemActions.perform('wave',s,staff);assert(enemy.status.sleep>0);
enemy=diagonalTarget();let food=Kiri.Items.create('nutBread',0,0,s.dungeonId);s.inventory=[food];hp=enemy.hp;Kiri.ItemActions.perform('throw',s,food);assert(enemy.hp<hp);

// Enemy information and item details expose useful, non-hidden data.
Kiri.UI={init:()=>{},draw:()=>{}};load('js/stage12-ui.js');enemy=Kiri.Entities.createEnemy(18,{x:3,y:3},Kiri.Dungeons.get('normalDungeon'),'spiralEye');enemy.status.confuse=3;let info=Kiri.UI.enemyInfo(enemy);assert(info.name&&info.description);assert.equal(info.behavior,'追跡');assert.equal(info.ability,'混乱にらみ');assert(info.danger);assert(info.status.includes('混乱'));
let item=Kiri.Items.create('thunderStaff',0,0,'normalDungeon'),detail=Kiri.ItemDetails.forItem(item);assert(detail.description.includes('雷光'));assert(!detail.metadata.some(x=>x.includes('用途')));assert(detail.metadata.some(x=>x.includes('残り回数')));item=Kiri.Items.create('emberBlade',0,0,'normalDungeon');detail=Kiri.ItemDetails.forItem(item);assert(detail.metadata.some(x=>x.includes('攻撃補正')));assert(detail.metadata.some(x=>x.includes('呪い: 未判明')));

// 1-30F plans grow in danger while preserving food, healing and support weights.
assert.deepStrictEqual(Kiri.Balance.floorPlan('normalDungeon',1),{items:7,traps:1,guaranteedHeal:true,guaranteedFood:true});assert.equal(Kiri.Balance.floorPlan('normalDungeon',30).traps,4);const early=Kiri.Balance.itemTable('normalDungeon',3),deep=Kiri.Balance.itemTable('normalDungeon',25);assert(deep.moonHerb>early.moonHerb);assert(deep.sleepStaff>early.sleepStaff);assert(deep.nutBread>early.nutBread);
const earlyEnemies=Kiri.EnemyCatalog.tableFor('normalDungeon',4),deepEnemies=Kiri.EnemyCatalog.tableFor('normalDungeon',28);assert(earlyEnemies.every(e=>['none'].includes(e.specialAbility)));assert(deepEnemies.some(e=>e.tier>=4));assert(deepEnemies.some(e=>e.specialAbility!=='none'));assert(!Kiri.EnemyCatalog.tableFor('normalDungeon',10).some(e=>['weakenGear','split','phase'].includes(e.specialAbility)));
for(let floor=1;floor<=30;floor++){s=Kiri.State.reset('normalDungeon');s.floor=floor;Kiri.Game.buildFloor();const plan=Kiri.Balance.floorPlan('normalDungeon',floor);assert.equal(s.groundItems.length,plan.items);assert.equal(s.traps.length,plan.traps);assert(s.enemies.every(e=>Kiri.EnemyCatalog.tableFor('normalDungeon',floor).some(d=>d.id===e.definitionId)));}

const legacy=Kiri.State.fresh();delete legacy.player.facingDirection;store[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());assert(Kiri.State.data.player.facingDirection);
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');assert(html.includes('id="enemyInfo"'));assert(html.includes('js/stage12-ui.js'));assert(html.includes('js/balance.js'));assert(css.includes('.enemy-info.pinned'));assert(css.includes('@media(max-width:520px)'));
console.log('stage 12 smoke: room melee, enemy/item info, 30F balance and migration passed');
