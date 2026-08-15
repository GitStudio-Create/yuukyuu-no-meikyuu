'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.addEventListener=()=>{};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
function load(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
['config','spawns','dungeons','themes','enemy-catalog','items','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps','treasures'].forEach(name=>load('js/'+name+'.js'));
Kiri.UI={draw(){},hideOverlay(){},closeStatus(){},closeItemMenu(){},closeStairs(){},showStairs(){},showGameOver(){},showEscape(){},toggleStatus(){}};
Kiri.Input={resetModes(){},cancelHeldMovement(){}};
load('js/game.js');

function reachable(state,target){const queue=[{x:state.player.x,y:state.player.y}],seen=new Set([state.player.x+','+state.player.y]);while(queue.length){const p=queue.shift();if(p.x===target.x&&p.y===target.y)return true;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const x=p.x+d[0],y=p.y+d[1],key=x+','+y;if(!seen.has(key)&&Kiri.Map.walkable(state,x,y)){seen.add(key);queue.push({x,y});}});}return false;}
function generate(id,floor,item){const state=Kiri.State.reset(id);state.floor=floor;Kiri.State.data=state;Kiri.Game.buildFloor();const objectives=state.groundItems.filter(entry=>entry.id===item);assert.equal(objectives.length,1,id+' '+floor+'F objective count');const chest=objectives[0];assert(reachable(state,chest));assert(!(state.player.x===chest.x&&state.player.y===chest.y));assert(!(state.stairs&&!state.stairs.disabled&&state.stairs.x===chest.x&&state.stairs.y===chest.y));assert(!state.enemies.some(e=>e.x===chest.x&&e.y===chest.y));assert(!state.traps.some(t=>t.x===chest.x&&t.y===chest.y));return state;}
function generateWithout(id,floor,item){const state=Kiri.State.reset(id);state.floor=floor;Kiri.State.data=state;Kiri.Game.buildFloor();assert.equal(state.groundItems.filter(entry=>entry.id===item).length,0,id+' '+floor+'F has no early objective');return state;}

for(let run=0;run<3;run++){
  const tutorial=generate('tutorialDungeon',10,'trialTreasure');assert(tutorial.stairs&&tutorial.stairs.disabled,'tutorial 10F has no usable down stairs');
  generate('normalDungeon',27,'eternalTreasure');generate('normalDungeon',28,'eternalTreasure');generate('normalDungeon',29,'eternalTreasure');
  generateWithout('mysteryDungeon',29,'deepTreasure');generate('mysteryDungeon',30,'deepTreasure');generate('mysteryDungeon',31,'deepTreasure');
}

let state=generate('normalDungeon',29,'eternalTreasure');state.treasureState.obtained.eternalTreasure=true;state.treasureState.returning=true;Kiri.Game.buildFloor();assert.equal(state.groundItems.filter(i=>i.id==='eternalTreasure').length,0);assert.equal(state.stairs.type,'up');const before=state.floor;state.player.x=state.stairs.x;state.player.y=state.stairs.y;assert(Kiri.Game.actions.descend());assert.equal(state.floor,before-1);assert(state.treasureState.returning);

state=generate('tutorialDungeon',10,'trialTreasure');const trial=state.groundItems.find(i=>i.id==='trialTreasure');state.player.x=trial.x;state.player.y=trial.y;Kiri.Treasures.onPickup(state,trial);assert(state.treasureState.returning);assert.equal(state.stairs.type,'up');assert.equal(state.stairs.x,state.player.x);
let returned=0;state.floor=1;state.stairs={x:state.player.x,y:state.player.y,type:'up'};Kiri.Campaign={isOpen:()=>false,onDungeonReturn:()=>{returned++;return true;}};assert(Kiri.Game.actions.descend());assert.equal(returned,1,'0F return completes the quota without generating a floor');
console.log('objective treasure smoke: guaranteed objectives, tutorial floor cap, return route and 0F clear passed');
