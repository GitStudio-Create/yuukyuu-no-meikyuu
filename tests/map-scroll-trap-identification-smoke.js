const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(p){vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
['config','directions','progression','spawns','dungeons','themes','items','item-details','state','stage8-state','map','visibility'].forEach(n=>load('js/'+n+'.js'));
Kiri.UI={renderStage16Minimap:function(){},draw:function(){},init:function(){}};
load('js/stage26-fixes.js');
['item-actions','traps','trap-renderer'].forEach(n=>load('js/'+n+'.js'));

function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:10,h:10,id:1},{x:18,y:18,w:6,h:5,id:2}];
  s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;
  s.stairs={x:30,y:22,type:'down'};
  s.enemies=[{x:20,y:20,hp:10,maxHp:10,power:1,defense:0,name:'遠い敵'}];
  s.groundItems=[Kiri.Items.create('moonHerb',20,19,s.dungeonId)];
  s.inventory=[];
  s.traps=[
    {x:6,y:6,id:'dreamSeal',revealed:false,identified:false},
    {x:7,y:6,id:'spiralMark',revealed:true,identified:false},
    {x:8,y:6,id:'bileBloom',revealed:false,identified:false}
  ];
  s.seen={};s.mapped={};s.visible={};
  Kiri.Visibility.update(s);
  return s;
}

let s=arena();
assert.equal(Kiri.TrapRenderer.knowledgeState(s.traps[0]),'hidden');
assert.equal(Kiri.TrapRenderer.knowledgeState(s.traps[1]),'discovered');
assert.equal(Kiri.TrapRenderer.detail(s.traps[1]).name,'正体不明の罠');

let scroll=Kiri.Items.create('mapScroll',undefined,undefined,s.dungeonId);
assert(Kiri.ItemDetails.forItem(scroll).description.includes('罠の位置と種類'));
s.inventory=[scroll];
let result=Kiri.ItemActions.perform('read',s,scroll);
assert(result.success);
assert.equal(s.vision.mapAll,true);
assert.equal(s.vision.traps,true);
assert.equal(s.vision.enemies,false);
assert.equal(s.vision.items,true);
assert(Kiri.Visibility.isVisible(s,20,20));
assert(Kiri.Visibility.isEntityVisible(s,20,20));
assert.equal(Kiri.Visibility.shouldShowEnemyOnMap(s,s.enemies[0]),false);
assert(Kiri.Visibility.isMapped(s,20,19));
assert(s.traps.every(t=>t.revealed&&t.identified));
assert.equal(Kiri.TrapRenderer.knowledgeState(s.traps[0]),'identified');
assert.equal(Kiri.TrapRenderer.detail(s.traps[0]).name,'眠り糸の印');
assert(Kiri.TrapRenderer.detail(s.traps[0]).description.includes('眠'));
assert.equal(Kiri.TrapRenderer.detail(s.traps[1]).name,'渦目の印');

// ワナ見えの紙片も、位置だけでなく種類まで判明する。
let trapOnly=arena();
let trapScroll=Kiri.Items.create('trapScroll',undefined,undefined,trapOnly.dungeonId);
result=Kiri.ItemActions.perform('read',trapOnly,trapScroll);
assert(result.success);
assert.equal(trapOnly.vision.traps,true);
assert.equal(trapOnly.vision.mapAll,false);
assert.equal(trapOnly.vision.items,false);
assert(trapOnly.traps.every(t=>t.revealed&&t.identified));
assert.equal(Kiri.TrapRenderer.knowledgeState(trapOnly.traps[0]),'identified');
assert.equal(Kiri.TrapRenderer.detail(trapOnly.traps[0]).name,'眠り糸の印');

// ワナ見え草は効果中、隣接した罠だけを識別する（遠い罠は変化しない）。
let herbOnly=arena();
let sightHerb=Kiri.Items.create('sightHerb',undefined,undefined,herbOnly.dungeonId);
result=Kiri.ItemActions.perform('drink',herbOnly,sightHerb);
assert(result.success);
assert.equal(herbOnly.vision.traps,false);
assert.equal(herbOnly.vision.mapAll,false);
assert.equal(herbOnly.vision.items,false);
assert.equal(herbOnly.player.status.trapSight,20);
assert.equal(herbOnly.traps[0].revealed,false);
assert.equal(Kiri.TrapRenderer.knowledgeState(herbOnly.traps[0]),'hidden');

// 踏んで判明した罠と、紙片で判明した罠は同じ固有表示状態になる。
let stepped={x:9,y:6,id:'dreamSeal',revealed:false,identified:false};
Kiri.Traps.applyPlayer(s,stepped);
assert.equal(Kiri.TrapRenderer.knowledgeState(stepped),Kiri.TrapRenderer.knowledgeState(s.traps[0]));

// 先に敵見えを使っていた場合、道標を読んでも敵赤点は消えない。
let combined=arena();
combined.vision.enemies=true;
Kiri.ItemActions.perform('read',combined,Kiri.Items.create('mapScroll',undefined,undefined,combined.dungeonId));
assert.equal(combined.vision.enemies,true);
assert(Kiri.Visibility.shouldShowEnemyOnMap(combined,combined.enemies[0]));

// 道標のあとに敵見えを使うと、地形公開と敵赤点が併用される。
let reverse=arena();
Kiri.ItemActions.perform('read',reverse,Kiri.Items.create('mapScroll',undefined,undefined,reverse.dungeonId));
assert.equal(Kiri.Visibility.shouldShowEnemyOnMap(reverse,reverse.enemies[0]),false);
Kiri.ItemActions.perform('read',reverse,Kiri.Items.create('enemyScroll',undefined,undefined,reverse.dungeonId));
assert.equal(reverse.vision.mapAll,true);
assert.equal(reverse.vision.enemies,true);
assert(Kiri.Visibility.shouldShowEnemyOnMap(reverse,reverse.enemies[0]));

// セーブ移行でも identified が保持される。
let migrated=Kiri.State.migrate({dungeonId:'normalDungeon',floor:1,deepestFloor:1,vision:{},player:Kiri.State.fresh().player,inventory:[],groundItems:[],traps:[{x:1,y:1,id:'bileBloom',revealed:true,identified:true}],rooms:[],enemies:[],log:[]});
assert.equal(migrated.traps[0].identified,true);

// 新しい階の罠は既存どおり未発見で始められる。
let fresh=Kiri.Traps.createRandom(s,{x:3,y:3});
assert.equal(fresh.revealed,false);
assert.equal(fresh.identified,false);

console.log('map scroll trap identification smoke: passed');
