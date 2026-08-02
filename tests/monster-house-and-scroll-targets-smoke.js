const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.document={querySelector(){return null;},addEventListener(){}};global.addEventListener=function(){};
global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(p){vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
['config','directions','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','monster-house','audio'].forEach(n=>load('js/'+n+'.js'));

function arena(floor){
  const s=Kiri.State.reset('normalDungeon');
  s.floor=floor||3;
  s.map=Array.from({length:24},()=>Array(32).fill(0));
  s.rooms=[{x:1,y:1,w:6,h:6,cx:3,cy:3,id:0},{x:10,y:3,w:9,h:8,cx:14,cy:7,id:1},{x:21,y:10,w:8,h:8,cx:25,cy:14,id:2}];
  s.rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)s.map[y][x]=1;});
  s.player.x=3;s.player.y=3;s.player.hp=100;s.player.maxHp=100;s.player.equipment={weapon:null,shield:null,ring:null,arrow:null};
  s.stairs={x:25,y:14,type:'down'};
  s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];s.seen={};s.visible={};s.mapped={};
  s.spawnPolicy={maxEnemies:30,nextSpawnTurn:999,naturalSpawnInterval:30};
  return s;
}

// Monster house does not generate on 1F/2F, and can be force-generated on 3F+.
let s=arena(2);
assert.equal(Kiri.MonsterHouse.force(s,Kiri.Dungeons.get(s.dungeonId),s.rooms[1]),null);
s=arena(3);
let info=Kiri.MonsterHouse.force(s,Kiri.Dungeons.get(s.dungeonId),s.rooms[1]);
assert(info);
assert(s.rooms[1].isMonsterHouse);
assert(info.itemCount>=10&&info.itemCount<=15);
assert(info.trapCount>=3&&info.trapCount<=5);
assert(info.enemyCount>=6);
const occupied=new Set();
s.groundItems.concat(s.traps).concat(s.enemies).forEach(o=>{
  const key=o.x+','+o.y;
  assert(!occupied.has(key));
  occupied.add(key);
  assert(Kiri.Map.walkable(s,o.x,o.y));
  assert(!(s.stairs.x===o.x&&s.stairs.y===o.y));
  assert(!(s.player.x===o.x&&s.player.y===o.y));
});
assert(s.enemies.every(e=>e.spawnSource==='monsterHouse'&&!e.awake&&e.spawnSleep));

// Entry wakes only the monster-house enemies and marks them as acted for the coming enemy turn.
let other=Kiri.Entities.createEnemy(s.floor,{x:2,y:2},Kiri.Dungeons.get(s.dungeonId),'chaser');
other.spawnSleep=true;other.awake=false;s.enemies.push(other);
s.player.x=14;s.player.y=7;
assert(Kiri.MonsterHouse.checkEntry(s));
assert(s.monsterHouse.triggered&&s.monsterHouse.bgmActive);
assert(s.enemies.filter(e=>e.spawnSource==='monsterHouse').every(e=>e.awake&&e.wokeOnTurn===s.turn+1));
assert(!other.awake);

// Audio helper prefers monster-house BGM when the floor state says it is active.
assert.equal(Kiri.Audio.fileForSpecial('monsterHouse'),'モンスターハウス（竜騎兵）.mp3');

// Minimal UI/action harness for target-selection scrolls.
load('js/game.js');
let shownActions=[],confirmed='',logs=[];
Kiri.State.data=arena(3);
Kiri.UI={showItemDetails(detail,actions){shownActions=actions;},showConfirm(text){confirmed=text;},closeConfirm(){},closeItemMenu(){},init(){},draw(){},hideOverlay(){},closeStatus(){},closeStairs(){}};
Kiri.Sound={play(){}};
Kiri.Input={init(){},resetModes(){}};
Kiri.Game.actions.openItem=function(index){Kiri.__selected=index;};
Kiri.Game.actions.requestItemAction=function(){return true;};
Kiri.Game.actions.confirmItemAction=function(){return true;};
Kiri.Game.actions.cancelItemAction=function(){return true;};
Kiri.Game.actions.closeItemDetails=function(){return true;};
Kiri.Game.actions.pickup=function(){return true;};
Kiri.Game.endTurn=function(){Kiri.__ended=(Kiri.__ended||0)+1;};
Kiri.State.addLog=function(text){logs.unshift(text);};
load('js/stage41-identify-selection.js');

s=Kiri.State.data;
const charge=Kiri.Items.create('chargeScroll',undefined,undefined,s.dungeonId);
const heldStaff=Kiri.Items.create('sleepStaff',undefined,undefined,s.dungeonId);heldStaff.charges=0;
const floorStaff=Kiri.Items.create('sleepStaff',s.player.x,s.player.y,s.dungeonId);floorStaff.charges=1;
s.inventory=[charge,heldStaff];s.groundItems=[floorStaff];
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
assert(shownActions.some(a=>a.label.includes('（手持ち）')));
assert(shownActions.some(a=>a.label.includes('（足元）')));
Kiri.Game.actions.requestItemAction(shownActions.find(a=>a.label.includes('（足元）')).id);
assert(confirmed.includes('直しますか'));
Kiri.Game.actions.confirmItemAction();
assert(s.groundItems.includes(floorStaff));
assert(floorStaff.charges>1);
assert(!s.inventory.includes(charge));

const weaponScroll=Kiri.Items.create('weaponScroll',undefined,undefined,s.dungeonId);
const weapon=Kiri.Items.create('willowBlade',undefined,undefined,s.dungeonId);weapon.equipped=true;s.player.equipment.weapon=weapon;
const floorWeapon=Kiri.Items.create('emberBlade',s.player.x,s.player.y,s.dungeonId);
s.inventory=[weaponScroll,weapon];s.groundItems=[floorWeapon];shownActions=[];
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
assert(shownActions.some(a=>a.label.includes('（装備中）')));
assert(shownActions.some(a=>a.label.includes('（足元）')));
let before=weapon.bonus;
Kiri.Game.actions.requestItemAction(shownActions.find(a=>a.label.includes('（装備中）')).id);
Kiri.Game.actions.confirmItemAction();
assert.equal(weapon.bonus,before+1);

const shieldScroll=Kiri.Items.create('shieldScroll',undefined,undefined,s.dungeonId);
const shield=Kiri.Items.create('barkShield',undefined,undefined,s.dungeonId);shield.equipped=true;s.player.equipment.shield=shield;
const floorShield=Kiri.Items.create('everShield',s.player.x,s.player.y,s.dungeonId);
s.inventory=[shieldScroll,shield];s.groundItems=[floorShield];shownActions=[];
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
assert(shownActions.some(a=>a.label.includes('（装備中）')));
assert(shownActions.some(a=>a.label.includes('（足元）')));
before=shield.bonus;
Kiri.Game.actions.requestItemAction(shownActions.find(a=>a.label.includes('（装備中）')).id);
Kiri.Game.actions.confirmItemAction();
assert.equal(shield.bonus,before+1);

console.log('monster house and scroll targets smoke: passed');
