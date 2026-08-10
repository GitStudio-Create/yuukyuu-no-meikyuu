'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>delete store[k]};
global.addEventListener=()=>{};global.document={addEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[]};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-details','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','crystal-walls','item-actions','stage10-items','balance','traps','stage33-projectile-rules','stage38-combat-gold-vitals'].forEach(load);
Kiri.UI={draw:()=>{},updateStatus:()=>{},updateInventory:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},showStairs:()=>{},closeStairs:()=>{}};
Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{},playSe:()=>{}};load('game');load('stage45-item-revision');

function arena(){const s=Kiri.State.reset('normalDungeon');s.floor=20;s.map=Array.from({length:10},()=>Array(12).fill(1));s.rooms=[{x:0,y:0,w:12,h:10,cx:6,cy:5}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.power=10;s.player.facingDirection={dx:1,dy:0};s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];s.stairs={x:10,y:8,type:'down'};s.vision={mapAll:false,mapOnly:false,enemies:false,items:false,traps:false};return s;}
function equip(s,id,slot){const item=Kiri.Items.create(id,undefined,undefined,s.dungeonId);if(slot==='weapon'||slot==='shield'){item.modifier=0;item.bonus=item.basePower;}item.equipped=true;s.inventory.push(item);s.player.equipment[slot]=item;return item;}
function fixedEnemy(s,id,x=3,y=2){const e=Kiri.Entities.createEnemy(20,{x,y},Kiri.Dungeons.get(s.dungeonId),id);e.hp=e.maxHp=999;e.defense=0;s.enemies=[e];return e;}

// New weapons, values, tags and staged floor availability.
assert.equal(Kiri.Items.definitions.barkShield.basePower,1);assert.equal(Kiri.Items.definitions.pierceArrow.arrowStrength,7);
assert.equal(Kiri.Balance.itemTable('normalDungeon',4).beastBlade,0);assert(Kiri.Balance.itemTable('normalDungeon',5).beastBlade>0);
assert.equal(Kiri.Balance.itemTable('normalDungeon',14).magicBlade,0);assert(Kiri.Balance.itemTable('normalDungeon',15).magicBlade>0);
assert.equal(Kiri.Balance.itemTable('normalDungeon',24).dragonBlade,0);assert(Kiri.Balance.itemTable('normalDungeon',25).dragonBlade>0);
assert(Kiri.EnemyCatalog.get('dozeBud').tags.includes('plant'));assert(Kiri.EnemyCatalog.get('emberHorn').tags.includes('dragon'));
['beastBlade','magicBlade','dragonBlade'].forEach(id=>assert(Kiri.Items.create(id)));

// A matching slayer is multiplied once, while a non-matching target is not.
let s=arena(),weapon=equip(s,'emberBlade','weapon'),target=fixedEnemy(s,'dozeBud');const oldRandom=Math.random;Math.random=()=>.5;
let before=target.hp;Kiri.Entities.attack(s,target);const effective=before-target.hp;assert(s.log.some(v=>v.includes('効果はばつぐんだ')));
s=arena();weapon=equip(s,'emberBlade','weapon');target=fixedEnemy(s,'bileToad');before=target.hp;Kiri.Entities.attack(s,target);const normal=before-target.hp;assert(effective>normal);assert(!s.log.some(v=>v.includes('効果はばつぐんだ')));
s=arena();weapon=equip(s,'emberBlade','weapon');target=fixedEnemy(s,'dozeBud');target.tags=['plant','ice'];before=target.hp;Kiri.Entities.attack(s,target);assert.equal(before-target.hp,effective);

// Mirror shield reflects only light/magic projectiles; fire shield halves fire.
s=arena();let shield=equip(s,'clearShield','shield');target=fixedEnemy(s,'roomWatcher',6,2);target.specialChance=1;target.specialType='lightShot';let playerHp=s.player.hp,enemyHp=target.hp;Math.random=()=>0;Kiri.Entities.takeEnemyTurns(s);assert.equal(s.player.hp,playerHp);assert(target.hp<enemyHp);assert(s.log.some(v=>v.includes('反射')));
s=arena();shield=equip(s,'clearShield','shield');target=fixedEnemy(s,'reedSniper',6,2);target.specialChance=1;target.specialType='rangedShot';playerHp=s.player.hp;Kiri.Entities.takeEnemyTurns(s);assert(s.player.hp<playerHp);
s=arena();shield=equip(s,'emberShield','shield');shield.modifier=0;shield.bonus=shield.basePower;target=fixedEnemy(s,'emberHorn',3,2);target.specialChance=1;target.specialType='fireBreath';target.rangedDamage=16;playerHp=s.player.hp;Kiri.Entities.takeEnemyTurns(s);assert.equal(playerHp-s.player.hp,5);
s=arena();shield=equip(s,'emberShield','shield');shield.modifier=0;shield.bonus=shield.basePower;target=fixedEnemy(s,'bileToad',3,2);target.specialChance=0;target.power=16;playerHp=s.player.hp;Kiri.Entities.takeEnemyTurns(s);assert.equal(playerHp-s.player.hp,11);

// Stone shield protects itself from weakening; mirror shield does not.
s=arena();shield=equip(s,'everShield','shield');let bonus=shield.bonus;Kiri.Traps.applyPlayer(s,{id:'dullingAsh',x:2,y:2});assert.equal(shield.bonus,bonus);
s=arena();shield=equip(s,'clearShield','shield');bonus=shield.bonus;Kiri.Traps.applyPlayer(s,{id:'dullingAsh',x:2,y:2});assert.equal(shield.bonus,bonus-1);
s=arena();shield=equip(s,'everShield','shield');target=fixedEnemy(s,'rustMaw',3,2);target.specialChance=1;target.specialType='rust';bonus=shield.bonus;Math.random=()=>0;Kiri.Entities.takeEnemyTurns(s);assert.equal(shield.bonus,bonus);
s=arena();shield=equip(s,'everShield','shield');weapon=equip(s,'emberBlade','weapon');bonus=weapon.bonus;Kiri.Traps.applyPlayer(s,{id:'dullingAsh',x:2,y:2});assert.equal(weapon.bonus,bonus-1);assert.equal(shield.bonus,shield.basePower+shield.modifier);

// Poison ring blocks poison completely; poison shield blocks strength loss only.
s=arena();equip(s,'antidoteRing','ring');let powerBefore=s.player.power;Kiri.Traps.applyPlayer(s,{id:'bileBloom',x:2,y:2});assert.equal(s.player.status.poison,0);assert.equal(s.player.power,powerBefore);
s=arena();equip(s,'mossShield','shield');powerBefore=s.player.power;Kiri.Traps.applyPlayer(s,{id:'bileBloom',x:2,y:2});assert(s.player.status.poison>0);assert.equal(s.player.power,powerBefore);

// Map scroll reveals terrain and stairs, not actors/items/traps.
s=arena();target=fixedEnemy(s,'bileToad',8,8);s.groundItems=[Object.assign(Kiri.Items.create('nutBread'),{x:7,y:7})];s.traps=[{id:'mistNeedle',x:6,y:6,revealed:false}];const scroll=Kiri.Items.create('mapScroll');s.inventory=[scroll];Kiri.ItemActions.perform('read',s,scroll);s.visible={'2,2':1};s.entityVisible={'2,2':1};assert(s.vision.mapAll&&s.vision.mapOnly);assert(!Kiri.Visibility.shouldShowEnemyOnMap(s,target));assert(!Kiri.Visibility.shouldShowItemOnMap(s,s.groundItems[0]));assert.equal(s.traps[0].revealed,false);
s=arena();s.traps=[{id:'mistNeedle',x:8,y:8,revealed:false,identified:false}];const trapScroll=Kiri.Items.create('trapScroll');s.inventory=[trapScroll];Kiri.ItemActions.perform('read',s,trapScroll);assert(s.traps[0].revealed&&s.traps[0].identified);

// Sight herb reveals adjacent traps and starts a 20-turn status.
s=arena();s.traps=[{id:'mistNeedle',x:3,y:2,revealed:false},{id:'mistNeedle',x:5,y:5,revealed:false}];const herb=Kiri.Items.create('sightHerb');s.inventory=[herb];Kiri.ItemActions.perform('drink',s,herb);assert.equal(s.traps[0].revealed,true);assert.equal(s.traps[1].revealed,false);assert.equal(s.player.status.trapSight,20);

// Invisible staff affects an enemy; crystal reflection applies the same effect to the player.
s=arena();target=fixedEnemy(s,'bileToad',4,2);let staff=Kiri.Items.create('invisibleStaff');s.inventory=[staff];Kiri.ItemActions.perform('wave',s,staff);assert.equal(target.status.invisible,10);assert.equal(s.player.status.invisible||0,0);
s=arena();staff=Kiri.Items.create('invisibleStaff');s.inventory=[staff];s.map[2][3]=0;s.crystalWalls=[{x:3,y:2}];Kiri.ItemActions.perform('wave',s,staff);assert.equal(s.player.status.invisible,10);
s=arena();target=fixedEnemy(s,'bileToad',4,2);staff=Kiri.Items.create('invisibleStaff');s.inventory=[staff];Kiri.ItemActions.perform('throw',s,staff);assert.equal(target.status.invisible,10);
s=arena();const invisibleHerb=Kiri.Items.create('invisibleHerb');s.inventory=[invisibleHerb];Kiri.ItemActions.perform('drink',s,invisibleHerb);assert.equal(s.player.status.invisible,8);

// Revised details describe the actual effects and unchanged arrow strength.
assert.equal(Kiri.Items.definitions.ironArrow.arrowStrength,9);
['levelHerb','poisonHerb','weaponScroll','shieldScroll','chargeScroll','flameHerb'].forEach(id=>assert(Kiri.Items.definitions[id].description&&Kiri.Items.definitions[id].description.length>10));
assert(Kiri.Items.definitions.levelHerb.description.includes('レベルが1上がる'));assert(Kiri.Items.definitions.flameHerb.description.includes('満腹度が1'));

// Old saves receive current definitions without losing enhancement values.
const legacy=Kiri.State.fresh();const oldSword=Kiri.Items.create('emberBlade');oldSword.modifier=2;oldSword.bonus=oldSword.basePower+2;legacy.inventory=[oldSword];store[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());assert.equal(Kiri.State.data.inventory[0].modifier,2);assert.equal(Kiri.State.data.inventory[0].bonus,Kiri.Items.definitions.emberBlade.basePower+2);

Math.random=oldRandom;
console.log('item revision smoke: weapons, shields, poison, map, sight, staff and save migration passed');
