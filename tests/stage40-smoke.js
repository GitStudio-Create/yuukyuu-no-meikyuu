'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const storage={};
global.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]};
global.addEventListener=()=>{};
global.document={querySelector:()=>null,querySelectorAll:()=>[]};
global.confirm=()=>true;
function load(n){vm.runInThisContext(fs.readFileSync('js/'+n+'.js','utf8'),{filename:n});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-details','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','stage33-projectile-rules'].forEach(load);
Kiri.UI={draw:()=>{},showItemDetails:()=>{},closeConfirm:()=>{},closeItemMenu:()=>{},showConfirm:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showStairs:()=>{},closeStairs:()=>{},showSuspend:()=>{},closeSuspend:()=>{}};
Kiri.Input={resetModes:()=>{}};
load('game');
load('stage38-combat-gold-vitals');
load('stage40-floor-hunger-shortcuts');
function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:32,h:24,cx:2,cy:2,id:1}];
  s.player.x=2;s.player.y=2;s.player.facingDirection={dx:1,dy:0};s.player.power=8;s.player.maxPower=8;s.player.maxFood=100;
  s.stairs={x:30,y:22,type:'down'};s.groundItems=[];s.enemies=[];s.traps=[];s.inventory=[];s.seen={};
  return s;
}
function item(id,s){const i=Kiri.Items.create(id,undefined,undefined,s.dungeonId);s.inventory.push(i);return i;}
function ground(id,s,x=2,y=2){const i=Kiri.Items.create(id,x,y,s.dungeonId);s.groundItems.push(i);return i;}

let s=arena();
assert.equal(Kiri.Hunger.perTurn(s),10);
for(let i=0;i<9;i++)Kiri.Hunger.processTurn(s);
assert.equal(s.player.food,100);
Kiri.Hunger.processTurn(s);assert.equal(s.player.food,99);

s=arena();let shield=item('leatherShield',s);Kiri.ItemActions.perform('equip',s,shield);
assert(Kiri.Items.hasEffect(s,'hungerHalf'));
assert.equal(Kiri.Hunger.perTurn(s),5);
for(let i=0;i<19;i++)Kiri.Hunger.processTurn(s);
assert.equal(s.player.food,100);
Kiri.Hunger.processTurn(s);assert.equal(s.player.food,99);
assert.equal(Kiri.Items.definitions.barkShield.effect,null);
assert(Kiri.Items.definitions.leatherShield.description.includes('半分'));

s=arena();s.player.food=1;s.player.hungerAccumulator=90;const hp=s.player.hp;
Kiri.Hunger.processTurn(s);assert.equal(s.player.food,0);assert.equal(s.player.hp,hp);assert(s.log[0].includes('お腹'));
Kiri.Hunger.processTurn(s);assert.equal(s.player.hp,hp-1);assert.equal(s.player.lastHungerDamage,1);

s=arena();s.inventory=Array.from({length:Kiri.Config.inventoryMax},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));let herb=ground('moonHerb',s);let detailCalls=0,confirmCalls=0;
Kiri.UI.showItemDetails=()=>detailCalls++;Kiri.UI.showConfirm=()=>confirmCalls++;
assert.equal(Kiri.Game.actions.pickup(),'floor-menu');
assert.equal(s.inventory.length,Kiri.Config.inventoryMax);assert.equal(s.groundItems.includes(herb),true);assert.equal(s.turn,0);assert.equal(detailCalls,1);
assert.equal(Kiri.Game.actions.requestItemAction('describe'),false);assert.equal(s.turn,0);
assert.equal(Kiri.Game.actions.requestItemAction('drink'),true);assert.equal(confirmCalls,1);
Kiri.Game.actions.confirmItemAction();
assert.equal(s.groundItems.includes(herb),false);assert.equal(s.inventory.length,Kiri.Config.inventoryMax);assert.equal(s.turn,1);

s=arena();s.inventory=Array.from({length:Kiri.Config.inventoryMax},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));let floorBread=ground('bigBread',s);
Kiri.Game.actions.pickup();assert.equal(Kiri.Game.actions.requestItemAction('exchange'),false);
assert.equal(Kiri.Game.actions.requestItemAction('exchange:0'),true);Kiri.Game.actions.confirmItemAction();
assert(s.inventory.some(i=>i===floorBread));assert.equal(s.groundItems.length,1);assert.equal(s.turn,1);

s=arena();s.inventory=Array.from({length:Kiri.Config.inventoryMax},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));let floorShield=ground('leatherShield',s);
Kiri.Game.actions.pickup();assert.equal(Kiri.Game.actions.requestItemAction('equip'),true);Kiri.Game.actions.confirmItemAction();
assert.equal(s.player.equipment.shield,null);assert.equal(s.turn,0);assert(s.groundItems.includes(floorShield));
s=arena();let oldShield=item('barkShield',s);oldShield.equipped=true;s.player.equipment.shield=oldShield;while(s.inventory.length<Kiri.Config.inventoryMax)s.inventory.push(Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));floorShield=ground('leatherShield',s);
Kiri.Game.actions.pickup();assert.equal(Kiri.Game.actions.requestItemAction('equip'),true);Kiri.Game.actions.confirmItemAction();
assert.equal(s.player.equipment.shield,floorShield);assert(s.groundItems.includes(oldShield));assert.equal(s.turn,1);

s=arena();s.inventory=Array.from({length:Kiri.Config.inventoryMax},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));let gold=Kiri.Gold.create(80,2,2);s.groundItems.push(gold);
assert.equal(Kiri.Game.actions.pickup(),true);assert.equal(s.player.gold,80);assert.equal(s.inventory.length,Kiri.Config.inventoryMax);

s=arena();s.inventory=[Kiri.Gold.create(10),Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId)];
s.inventory[1].quantity=78;assert.equal(Kiri.Hunger.bagUsed(s),1);

console.log('stage 40 smoke: floor full-item actions, exchange, gold pickup, hunger accumulator and leather shield passed');
