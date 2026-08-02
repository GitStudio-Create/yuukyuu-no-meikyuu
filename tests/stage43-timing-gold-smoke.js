'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.addEventListener=()=>{};
let scheduled=null,clearCount=0;
global.setTimeout=(fn,ms)=>{scheduled={fn,ms};return 99;};
global.clearTimeout=()=>{clearCount++;scheduled=null;};
global.document={querySelector:()=>null,body:{classList:{toggle(){}}}};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','state','stage8-state','stage10-state','stage15-state','items','inventory','item-details','damage-descriptions','map','visibility','combat-rules','entities','traps','balance'].forEach(load);
Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},isMapOnlyOpen:()=>false};
Kiri.Input={resetModes:()=>{}};
Kiri.Audio={setForState:()=>{},setTheme:()=>{}};
load('item-actions');load('game');load('stage38-combat-gold-vitals');

function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:32,h:24,cx:2,cy:2},{x:0,y:0,w:32,h:24,cx:10,cy:10}];
  s.player.x=2;s.player.y=2;s.player.hp=50;s.player.maxHp=50;s.player.food=100;s.player.facingDirection={dx:1,dy:0};
  s.stairs={x:10,y:10,type:'down'};s.groundItems=[];s.traps=[];s.enemies=[];s.seen={};s.log=[];
  return s;
}

let s=arena(),enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'dewMote');
enemy.hp=20;enemy.power=3;s.enemies=[enemy];Kiri.State.data=s;scheduled=null;
Kiri.Game.actions.attack();
assert.equal(scheduled.ms,500);
assert.equal(s.turnLocked,true);
const hpAfterPlayerAction=s.player.hp,enemyHpAfterPlayerAction=enemy.hp;
Kiri.Game.actions.attack();
assert.equal(enemy.hp,enemyHpAfterPlayerAction);
assert.equal(s.player.hp,hpAfterPlayerAction);
scheduled.fn();
assert.equal(s.turnLocked,false);
assert(s.player.hp<hpAfterPlayerAction);

s=arena();enemy=Kiri.Entities.createEnemy(1,{x:20,y:20},Kiri.Dungeons.get(s.dungeonId),'dewMote');s.enemies=[enemy];Kiri.State.data=s;scheduled=null;
Kiri.Game.actions.move(1,0);
assert.equal(scheduled,null);
assert.equal(s.turnLocked,false);

s=arena();enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'dewMote');enemy.hp=20;s.enemies=[enemy];Kiri.State.data=s;scheduled=null;clearCount=0;Kiri.Game.actions.attack();Kiri.Game.actions.newGame('normalDungeon');assert(clearCount>0);assert.equal(Kiri.State.data.turnLocked,false);

const oldRandom=Math.random;
Math.random=()=>0;assert.equal(Kiri.Gold.amountForFloor(1),1);
Math.random=()=>0.999;assert.equal(Kiri.Gold.amountForFloor(99),100);
Math.random=oldRandom;

s=arena();enemy=Kiri.Entities.createEnemy(1,{x:4,y:4},Kiri.Dungeons.get(s.dungeonId),'mudBrute');enemy.dropRate=1;enemy.dropCategories=['gold'];enemy.hp=0;s.enemies=[enemy];Kiri.State.data=s;
const seq=[0,0,0.999],next=()=>seq.length?seq.shift():0;
Math.random=next;const reward=Kiri.Entities.rewardDefeat(s,enemy,true);Math.random=oldRandom;
const gold=s.groundItems.find(i=>i.category==='gold');
assert(gold&&gold.amount>=1&&gold.amount<=100);
assert(reward.drop.includes(gold.amount+'G'));

s=arena();s.player.gold=10;s.groundItems=[Kiri.Gold.create(37,s.player.x,s.player.y)];Kiri.Gold.collectAtPlayer(s);
assert.equal(s.player.gold,47);assert.equal(s.groundItems.length,0);
s.groundItems=[Kiri.Gold.create(25,5,5)];Kiri.State.save();assert(Kiri.State.load());assert.equal(Kiri.State.data.player.gold,47);assert.equal(Kiri.State.data.groundItems[0].amount,25);

Kiri.Ranking.recordGameOver({player:{gold:100,level:3},floor:5,turn:9});
Kiri.Ranking.recordGameOver({player:{gold:250,level:4},floor:7,turn:10});
Kiri.Ranking.recordGameOver({player:{gold:100,level:3},floor:5,turn:9});
const ranks=Kiri.Ranking.list();
assert.equal(ranks[0].gold,250);
assert.equal(ranks.filter(r=>r.gold===100&&r.floor===5&&r.turn===9).length,1);
for(let i=0;i<12;i++)Kiri.Ranking.recordGameOver({player:{gold:i,level:1},floor:1,turn:100+i});
assert(Kiri.Ranking.list().length<=10);

console.log('stage 43 timing/gold smoke: delayed enemy turn, common 1-100G, pickup/save/ranking passed');
