'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};const listeners={};global.addEventListener=(t,f)=>listeners[t]=f;
const storage={};global.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]};
function load(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
load('js/config.js');load('js/spawns.js');load('js/dungeons.js');load('js/themes.js');load('js/enemy-catalog.js');load('js/items.js');load('js/state.js');load('js/map.js');load('js/visibility.js');load('js/combat-rules.js');load('js/entities.js');load('js/item-actions.js');load('js/stage10-items.js');load('js/balance.js');load('js/traps.js');load('js/ui.js');

// Tutorial never creates cursed gear, and its helpful weights dominate gear/rings.
for(let i=0;i<500;i++)assert.equal(Kiri.Items.create(i%2?'emberBlade':'mightRing',0,0,'tutorialDungeon').cursed,false);
const tt=Kiri.Dungeons.get('tutorialDungeon').itemSpawnTable,nt=Kiri.Dungeons.get('normalDungeon').itemSpawnTable,mt=Kiri.Dungeons.get('mysteryDungeon').itemSpawnTable;
assert(tt.nutBread>tt.emberBlade&&tt.moonHerb>tt.mightRing);assert(nt.mightRing<nt.emberBlade);assert(mt.mightRing>0&&mt.emberBlade>0);

// v2 migration supplies every new status field and an equipment object.
const legacy={version:2,floor:5,turn:9,player:{x:1,y:1,hp:10,maxHp:20,food:50,power:4},inventory:[],groundItems:[],map:[],rooms:[],enemies:[],seen:{},stairs:{x:2,y:2},gameOver:false};
storage[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());assert.equal(Kiri.State.data.player.level,1);assert.deepStrictEqual(Kiri.State.data.player.equipment,{weapon:null,shield:null,ring:null});assert.equal(Kiri.State.data.deepestFloor,5);

// Status values safely render unequipped slots.
const values=Kiri.UI.statusValues(Kiri.State.data),asObject=Object.fromEntries(values);assert.equal(asObject['武器'],'なし');assert.equal(asObject['盾'],'なし');assert.equal(asObject['指輪'],'なし');assert.equal(values.length,17);

// Theme boundaries produce distinct names and colors.
assert.equal(Kiri.Themes.forFloor(1).name,'入口の迷宮');assert.equal(Kiri.Themes.forFloor(3).name,'石灯りの回廊');assert.equal(Kiri.Themes.forFloor(27).name,'深淵の聖域');assert.notEqual(Kiri.Themes.forFloor(2).floor,Kiri.Themes.forFloor(3).floor);

// Generate tutorial floors repeatedly and check safety guarantees.
Kiri.UI={draw:()=>{},hideOverlay:()=>{},closeStatus:()=>{},showGameOver:()=>{},toggleStatus:()=>{},showStairs:()=>{},closeStairs:()=>{}};Kiri.Input={resetModes:()=>{}};load('js/game.js');
for(let floor=1;floor<=3;floor++)for(let run=0;run<60;run++){const s=Kiri.State.reset('tutorialDungeon');s.floor=floor;Kiri.Game.buildFloor();assert.equal(s.traps.length,0);assert(s.enemies.every(e=>Kiri.Util.distance(e,s.player)>6));assert(s.enemies.every(e=>e.power<=4));if(floor<=2)assert(s.groundItems.some(i=>i.id==='moonHerb'||i.id==='starHerb'));if(floor===1)assert(s.enemies.length>=2&&s.enemies.length<=3);assert(s.groundItems.every(i=>!i.cursed));}

// X is routed to the same status action used by the mobile button.
const fake=()=>({dataset:{},classList:{toggle:()=>{}},setAttribute:()=>{},addEventListener:()=>{}});global.document={querySelectorAll:()=>[],querySelector:()=>fake()};Kiri.UI.isStairOpen=()=>false;Kiri.UI.isStatusOpen=()=>false;load('js/input.js');let toggles=0;Kiri.Input.init({toggleStatus:()=>toggles++,move:()=>{},run:()=>{},face:()=>{},attack:()=>{},step:()=>{},useItem:()=>{},newGame:()=>{}});listeners.keydown({key:'x',preventDefault:()=>{}});assert.equal(toggles,1);
console.log('stage 5 smoke: balance, tables, status, themes and v2 migration passed');
