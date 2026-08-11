'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.matchMedia=()=>({matches:true});global.addEventListener=()=>{};
const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>delete store[k]};
global.document={querySelector:()=>null,body:{dataset:{appState:'DUNGEON'},classList:{toggle(){}}}};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','floor-messages','enemy-catalog','items','inventory','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','treasures','crystal-walls'].forEach(load);
Kiri.UI={draw(){},hideOverlay(){},closeStatus(){},closeItemMenu(){},closeStairs(){}};Kiri.Input={resetModes(){},cancelHeldMovement(){}};Kiri.Audio={setForState(){}};
load('game');load('gm-mode');
function enter(id){Kiri.Mode.set('normal');Kiri.State.reset(id);Kiri.State.save();assert(Kiri.GM.openCurrent());return Kiri.State.data;}
function has(id){return Kiri.State.data.groundItems.some(item=>item&&item.id===id);}
let s=enter('tutorialDungeon');assert(Kiri.GM.jumpFloor(10));assert.equal(s.floor,10);assert(has('trialTreasure'));assert.equal(s.stairs.disabled,true);assert.equal(Kiri.GM.jumpFloor(27),false);assert.equal(s.floor,10);
s=enter('normalDungeon');assert(Kiri.GM.jumpFloor(27));assert.equal(s.floor,27);assert(has('eternalTreasure'));
s=enter('mysteryDungeon');assert(Kiri.GM.jumpFloor(27));assert.equal(s.floor,27);assert(has('deepTreasure'));assert(Kiri.GM.jumpFloor(50));assert(has('deepTreasure')&&has('moonTreasure'));assert(Kiri.GM.jumpFloor(99));assert(has('deepTreasure')&&has('abyssTreasure'));
s.player.hp=1;s.player.food=1;assert(Kiri.GM.heal());assert(Kiri.GM.feed());assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.player.food,s.player.maxFood);assert(s.enemies.length>0);assert(Kiri.GM.clearEnemies());assert.equal(s.enemies.length,0);
assert(store.eternal_labyrinth_normal_save,'normal state is saved before GM entry');assert(store.eternal_labyrinth_gm_save,'GM floors use only the GM save');
console.log('GM floor smoke: normal floor generation, limits and objective treasure placement passed');
