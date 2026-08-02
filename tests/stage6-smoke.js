'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};
const storage={};global.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]};global.addEventListener=()=>{};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','stage33-projectile-rules'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.facingDirection={dx:1,dy:0};s.player.power=8;s.player.maxPower=8;s.stairs={x:30,y:22};s.groundItems=[];s.enemies=[];s.traps=[];return s;}
function item(id,s){const i=Kiri.Items.create(id,undefined,undefined,s.dungeonId);s.inventory.push(i);return i;}
function expectedAttack(s){const f=Kiri.Items.attackFormula(s);return Math.max(0,Math.min(255,f.baseAttack+Kiri.Items.roundAttackBonus(f.baseAttack*(f.weaponPower+f.strengthOffset)/16)));}

assert.equal(Object.values(Kiri.Items.definitions).filter(d=>d.category==='weapon').length,5);assert.equal(Object.values(Kiri.Items.definitions).filter(d=>d.category==='shield').length,6);assert.equal(Object.values(Kiri.Items.definitions).filter(d=>d.category==='ring').length,6);assert.equal(Object.values(Kiri.Items.definitions).filter(d=>d.category==='staff').length,8);assert.equal(Object.values(Kiri.Items.definitions).filter(d=>d.category==='scroll').length,12);

let s=arena(),weapon=item('stoneAxe',s),base=Kiri.Items.attackPower(s);assert.equal(base,5);s.player.power=9;assert.equal(Kiri.Items.attackPower(s),5);s.player.power=7;assert.equal(Kiri.Items.attackPower(s),5);s.player.power=8;assert(Kiri.ItemActions.perform('equip',s,weapon).success);assert.equal(Kiri.Items.attackPower(s),expectedAttack(s));s.player.power=9;assert.equal(Kiri.Items.attackPower(s),expectedAttack(s));s.player.power=7;assert.equal(Kiri.Items.attackPower(s),expectedAttack(s));s.player.power=8;weapon.cursed=true;assert(!Kiri.ItemActions.perform('unequip',s,weapon).success);weapon.cursed=false;assert(Kiri.ItemActions.perform('unequip',s,weapon).success);
let shield=item('emberShield',s);Kiri.ItemActions.perform('equip',s,shield);assert(Kiri.Items.defensePower(s)>=shield.bonus);assert(Kiri.Items.hasEffect(s,'fireHalf'));
let ring=item('fastingRing',s);Kiri.ItemActions.perform('equip',s,ring);assert(Kiri.Items.hasEffect(s,'noHunger'));

s=arena();s.player.hp=1;let herb=item('moonHerb',s);assert(Kiri.ItemActions.perform('drink',s,herb).success);assert.equal(s.player.hp,24);assert(!s.inventory.includes(herb));
s=arena();let poison=item('poisonHerb',s);s.enemies=[{x:4,y:2,hp:20,maxHp:20,power:5,status:{sleep:0,confuse:0}}];assert(Kiri.ItemActions.perform('throw',s,poison).success);assert(s.enemies[0].hp<20&&s.enemies[0].power<5);

s=arena();let scroll=item('mapScroll',s);assert(Kiri.ItemActions.perform('read',s,scroll).success);assert.equal(Object.keys(s.seen).length,32*24);assert(!s.inventory.includes(scroll));
s=arena();let staff=item('thunderStaff',s),charges=staff.charges;s.enemies=[{x:5,y:2,hp:40,maxHp:40,power:2,status:{sleep:0,confuse:0}}];assert(Kiri.ItemActions.perform('wave',s,staff).success);assert.equal(staff.charges,charges-1);assert.equal(s.enemies[0].hp,18);

s=arena();let arrows=item('reedArrow',s),quantity=arrows.quantity;s.enemies=[{x:5,y:2,hp:20,maxHp:20,power:2,status:{}}];assert(Kiri.ItemActions.perform('shoot',s,arrows).success);assert.equal(arrows.quantity,quantity-1);assert(s.enemies[0].hp<20);
s=arena();let piercing=item('pierceArrow',s);s.enemies=[{x:4,y:2,hp:30,maxHp:30,power:2,status:{}},{x:7,y:2,hp:30,maxHp:30,power:2,status:{}}];Kiri.ItemActions.perform('shoot',s,piercing);assert(s.enemies.every(e=>e.hp<30));

s=arena();s.player.food=0;let food=item('bigBread',s);Kiri.ItemActions.perform('eat',s,food);assert.equal(s.player.food,100);
s=arena();let thrown=item('willowBlade',s);Kiri.ItemActions.perform('throw',s,thrown);assert(s.groundItems.includes(thrown));
s=arena();let placed=item('barkShield',s);Kiri.ItemActions.perform('place',s,placed);assert.equal(placed.x,s.player.x);assert.equal(placed.y,s.player.y);

const old={version:2,floor:1,turn:0,player:{x:1,y:1,hp:10,maxHp:20,food:50,power:4},inventory:[{id:'emberBlade'}],groundItems:[],map:[],rooms:[],enemies:[],seen:{},stairs:{x:2,y:2},gameOver:false};storage[Kiri.Config.saveKey]=JSON.stringify(old);assert(Kiri.State.load());assert(Kiri.State.data.player.equipment&&Kiri.State.data.player.status);assert(Kiri.State.data.inventory[0].modifier!==undefined);

// Game integration: failed actions are free; successful actions advance one turn.
Kiri.UI={draw:()=>{},showItemMenu:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showStairs:()=>{},closeStairs:()=>{}};Kiri.Input={resetModes:()=>{}};load('js/game.js');
s=arena();weapon=item('emberBlade',s);weapon.equipped=true;weapon.cursed=true;s.player.equipment.weapon=weapon;Kiri.Game.actions.openItem(0);Kiri.Game.actions.itemAction('unequip');assert.equal(s.turn,0);weapon.cursed=false;Kiri.Game.actions.openItem(0);Kiri.Game.actions.itemAction('unequip');assert.equal(s.turn,1);
s=arena();shield=item('leatherShield',s);Kiri.ItemActions.perform('equip',s,shield);for(let i=0;i<9;i++)Kiri.Game.endTurn();assert.equal(s.player.food,100);Kiri.Game.endTurn();assert.equal(s.player.food,99);
s=arena();ring=item('fastingRing',s);Kiri.ItemActions.perform('equip',s,ring);for(let i=0;i<20;i++)Kiri.Game.endTurn();assert.equal(s.player.food,100);
s=arena();ring=item('fastingRing',s);Kiri.ItemActions.perform('equip',s,ring);s.player.food=77;const hunger=Kiri.Traps.applyPlayer(s,{x:s.player.x,y:s.player.y,id:'hungerMoss',revealed:false,identified:false});assert.equal(s.player.food,77);assert(hunger.message.includes('防いだ'));
s=arena();ring=item('safeRing',s);Kiri.ItemActions.perform('equip',s,ring);s.traps=[{x:3,y:2,id:'mistNeedle',revealed:false}];const hp=s.player.hp;Kiri.Game.actions.move(1,0);assert.equal(s.player.hp,hp);
console.log('stage 6 smoke: equipment, items, rays, effects and v2 migration passed');
