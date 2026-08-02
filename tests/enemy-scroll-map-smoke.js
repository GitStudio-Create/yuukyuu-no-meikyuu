const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(p){vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
['config','directions','progression','spawns','dungeons','themes','items','state','map','visibility','combat-rules','enemy-catalog','entities','item-actions','traps'].forEach(n=>load('js/'+n+'.js'));

function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.floor=8;
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:8,h:8,id:1},{x:20,y:16,w:8,h:6,id:2}];
  s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;
  s.stairs={x:30,y:22,type:'down'};
  s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];
  s.visible={};s.mapped={};s.seen={};
  Kiri.Visibility.update(s);
  return s;
}
function enemyAt(x,y,id){
  const e=Kiri.Entities.createEnemy(8,{x:x,y:y},Kiri.Dungeons.get('normalDungeon'),id||'chaser');
  e.hp=10;e.maxHp=10;
  return e;
}

let s=arena();
let visible=enemyAt(3,3),hidden=enemyAt(24,18),sleeping=enemyAt(25,18,'sleeper');
sleeping.spawnSleep=true;sleeping.awake=false;
s.enemies=[visible,hidden,sleeping];
Kiri.Visibility.update(s);

assert(Kiri.Visibility.shouldShowEnemyOnMap(s,visible));
assert(!Kiri.Visibility.shouldShowEnemyOnMap(s,hidden));
assert(!Kiri.Visibility.shouldShowEnemyOnMap(s,sleeping));
const mappedBefore=Object.keys(s.mapped).length;
const trap={x:22,y:18,id:'dreamSeal',revealed:false,identified:false};
s.traps=[trap];
const item=Kiri.Items.create('moonHerb',21,18,s.dungeonId);
s.groundItems=[item];

let scroll=Kiri.Items.create('enemyScroll',undefined,undefined,s.dungeonId);
s.inventory=[scroll];
let result=Kiri.ItemActions.perform('read',s,scroll);
assert(result.success);
assert.equal(s.vision.enemies,true);
assert.equal(s.vision.mapAll,false);
assert.equal(s.vision.traps,false);
assert.equal(s.vision.items,false);
assert.equal(Object.keys(s.mapped).length,mappedBefore);
assert.equal(trap.revealed,false);
assert(!Kiri.Visibility.isMapped(s,item.x,item.y));
assert(Kiri.Visibility.shouldShowEnemyOnMap(s,hidden));
assert(Kiri.Visibility.shouldShowEnemyOnMap(s,sleeping));

hidden.x=23;hidden.y=18;
assert(Kiri.Visibility.shouldShowEnemyOnMap(s,hidden));
hidden.hp=0;
assert(!Kiri.Visibility.shouldShowEnemyOnMap(s,hidden));

s.floor++;
s.vision={traps:false,items:false,enemies:false};
assert(!Kiri.Visibility.shouldShowEnemyOnMap(s,sleeping));

let saved=Kiri.State.migrate({dungeonId:'normalDungeon',floor:8,deepestFloor:8,vision:{enemies:true},player:Kiri.State.fresh().player,inventory:[],groundItems:[],traps:[],rooms:[],enemies:[{x:7,y:7,hp:5,maxHp:5,power:1}],log:[]});
assert(saved.vision.enemies);
assert(Kiri.Visibility.shouldShowEnemyOnMap(saved,saved.enemies[0]));

console.log('enemy scroll map smoke: passed');
