'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=()=>{};
function load(n){vm.runInThisContext(fs.readFileSync('js/'+n+'.js','utf8'),{filename:n});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-details','item-icons','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','stage33-projectile-rules','stage38-combat-gold-vitals'].forEach(load);
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,cx:2,cy:2,id:0}];s.player.x=2;s.player.y=2;s.player.power=8;s.player.maxPower=8;s.player.facingDirection={dx:1,dy:0};s.stairs={x:30,y:22};s.groundItems=[];s.enemies=[];s.traps=[];s.inventory=[];return s;}
function item(id,s){const i=Kiri.Items.create(id,undefined,undefined,s.dungeonId);s.inventory.push(i);return i;}

let s=arena();
assert.equal(Kiri.Items.baseAttackForLevel(1),5);
assert.equal(Kiri.Items.baseAttackForLevel(10),29);
assert.equal(Kiri.Items.baseAttackForLevel(37),100);
assert.equal(Kiri.Items.attackPower(s),5);
s.player.level=10;assert.equal(Kiri.Items.attackPower(s),29);
s.player.level=14;s.player.power=2;let weapon=item('emberBlade',s);weapon.bonus=2;s.player.equipment.weapon=weapon;assert.equal(Kiri.Items.attackPower(s),34);
s=arena();s.player.level=16;s.player.power=7;weapon=item('emberBlade',s);weapon.bonus=2;s.player.equipment.weapon=weapon;assert.equal(Kiri.Items.attackPower(s),60);

s=arena();s.player.hp=100;s.player.maxHp=150;assert.equal(Kiri.PlayerVitals.processNaturalHpRecovery(s),1);assert.equal(s.player.hp,101);
s=arena();s.player.hp=100;s.player.maxHp=300;assert.equal(Kiri.PlayerVitals.processNaturalHpRecovery(s),2);assert.equal(s.player.hp,102);
s=arena();s.player.hp=10;s.player.maxHp=50;Kiri.PlayerVitals.processNaturalHpRecovery(s);Kiri.PlayerVitals.processNaturalHpRecovery(s);assert.equal(s.player.hp,10);Kiri.PlayerVitals.processNaturalHpRecovery(s);assert.equal(s.player.hp,11);
s=arena();s.player.hp=10;s.player.maxHp=150;s.player.food=0;assert.equal(Kiri.PlayerVitals.processNaturalHpRecovery(s),0);assert.equal(s.player.hp,10);
s=arena();s.player.hp=s.player.maxHp;s.player.hpRegenAccumulator=.9;Kiri.PlayerVitals.processNaturalHpRecovery(s);assert.equal(s.player.hpRegenAccumulator,0);

s=arena();s.player.power=8;assert.equal(Kiri.PlayerVitals.applyStrengthDamage(s,1,'毒',{silent:true}),1);assert.equal(s.player.power,7);assert.equal(s.player.maxPower,8);
s=arena();s.player.power=8;s.traps=[{x:2,y:2,id:'bileBloom'}];let trap=Kiri.Traps.applyPlayer(s,s.traps[0]);assert.equal(s.player.power,7);assert.equal(s.player.hp,24);assert(trap.message.includes('ちからが1下がった'));
s=arena();s.player.hp=20;s.player.food=1;let bread=item('spoiledBread',s),result=Kiri.ItemActions.perform('eat',s,bread);assert.equal(s.player.food,100);assert.equal(s.player.hp,15);assert.equal(s.player.power,7);assert(result.message.includes('HP'));
s=arena();s.player.hp=20;s.player.power=2;let poison=item('poisonHerb',s);result=Kiri.ItemActions.perform('drink',s,poison);assert.equal(s.player.hp,15);assert.equal(s.player.power,0);
s=arena();s.player.power=5;let mend=item('powerMendHerb',s);result=Kiri.ItemActions.perform('drink',s,mend);assert.equal(s.player.power,8);assert(result.message.includes('回復'));
s=arena();let ring=item('antidoteRing',s);s.player.equipment.ring=ring;assert.equal(Kiri.PlayerVitals.applyStrengthDamage(s,3,'毒',{silent:true}),0);assert.equal(s.player.power,8);poison=item('poisonHerb',s);s.player.hp=20;result=Kiri.ItemActions.perform('drink',s,poison);assert.equal(s.player.hp,20);assert.equal(s.player.power,8);assert.equal(s.player.status.poison,0);

s=arena();let gold=Kiri.Gold.dropAt(s,33,4,4);assert(gold);assert.equal(s.groundItems.length,1);assert.equal(Kiri.Items.name(gold),'33G');assert(Kiri.ItemDetails.forItem(gold).description.includes('所持金'));s.player.x=4;s.player.y=4;Kiri.Gold.collectAtPlayer(s);assert.equal(s.player.gold,33);assert.equal(s.groundItems.length,0);
s=arena();s.inventory=Array.from({length:20},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));gold=Kiri.Gold.dropAt(s,25,3,2);s.player.x=3;s.player.y=2;Kiri.Gold.collectAtPlayer(s);assert.equal(s.player.gold,25);assert.equal(s.inventory.length,20);

['standard','horizontal','vertical','branch','bigMixed','perimeter'].forEach(type=>{
  for(let i=0;i<100;i++){
    const g=Kiri.Map.generate({floor:12,terrainType:type});
    assert(Kiri.Map.validateGenerated(g),type+' validation failed');
    assert(Kiri.Map.validateRoomEntrances(g),type+' entrance validation failed');
  }
});
console.log('stage 38 smoke: level attack, gold, natural recovery, poison and corridor validation passed');
