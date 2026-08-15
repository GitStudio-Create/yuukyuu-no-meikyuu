'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','state','stage8-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(load);
Kiri.UI={draw(){},showStairs(){},closeStairs(){},closeItemMenu(){},showGameOver(){},showEscape(){},hideOverlay(){},closeStatus(){},toggleStatus(){}};
Kiri.Input={resetModes(){},cancelHeldMovement(){}};
load('game');

function entranceMap(startX){
  const state=Kiri.State.reset('normalDungeon');
  state.map=Array.from({length:24},()=>Array(32).fill(0));
  for(let x=1;x<=9;x++)state.map[2][x]=1;
  state.rooms=[{x:1,y:1,w:3,h:3},{x:7,y:1,w:3,h:3}];
  state.player.x=startX;state.player.y=2;state.stairs={x:20,y:20,type:'down'};
  state.groundItems=[];state.enemies=[];state.traps=[];state.seen={};
  for(let x=1;x<=9;x++)state.seen[x+',2']=1;
  Kiri.State.data=state;
  return state;
}

let state=entranceMap(1),result=Kiri.Game.actions.run(1,0);
assert.equal(state.player.x,3,'room to corridor stops on the room-side entrance');
assert(result.stoppedAtEntrance);
Kiri.Game.actions.run(1,0);
assert.equal(state.player.x,3,'a held dash cannot restart across the entrance');
Kiri.Game.releaseRunEntranceStop();
result=Kiri.Game.actions.run(1,0);
assert.equal(state.player.x,6,'a new dash crosses the first entrance and stops before the next room');
assert(result.stoppedAtEntrance);
Kiri.Game.releaseRunEntranceStop();
Kiri.Game.actions.move(1,0);
assert.equal(state.player.x,7,'normal movement remains able to cross the entrance');

state=entranceMap(9);result=Kiri.Game.actions.run(-1,0);
assert.equal(state.player.x,7,'room to corridor also stops when travelling left');
assert(result.stoppedAtEntrance);
Kiri.Game.releaseRunEntranceStop();
result=Kiri.Game.actions.run(-1,0);
assert.equal(state.player.x,4,'corridor to room stops on the corridor-side entrance');
assert(result.stoppedAtEntrance);
console.log('dash entrance smoke: both entrance directions, held dash lock and normal movement passed');
