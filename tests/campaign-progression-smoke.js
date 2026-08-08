'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
function classes(){return{set:new Set(['hidden']),add(v){this.set.add(v);},remove(v){this.set.delete(v);},contains(v){return this.set.has(v);}};}
function node(){return{className:'',classList:classes(),attributes:{},listeners:{},innerHTML:'',textContent:'',addEventListener(t,f){this.listeners[t]=f;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},querySelector(){return null;},insertAdjacentHTML(){}};}
const root=node(),shell=node(),titleButton=node(),body={classList:classes()},globalListeners={};
global.document={body,createElement:()=>node(),querySelector(q){if(q==='#campaignScreen')return root;if(q==='.game-shell')return shell;if(q==='#newGame')return titleButton;if(q==='#gmPanel .gm-grid')return null;if(q==='[data-campaign-debug]')return null;return null;}};
global.addEventListener=(t,f)=>{globalListeners[t]=f;};
let story={openingSeen:true,questAccepted:true,cleared:{tutorialDungeon:false,normalDungeon:false,mysteryDungeon:false},treasureChest:{obtained:false,opened:false},events:{deepEntranceSeen:false,endingSeen:false}},dungeonSaves=0,baseSaves=0,logs=[];
global.Kiri={
  AdventureBooks:{slots:()=>[],story:()=>story,saveDungeon:()=>{dungeonSaves++;return true;},saveBase:()=>{baseSaves++;return true;},debug:()=>({slot:1}),lastError:()=>''},
  StoryEvents:{opening:[],deepEntrance:[],deepEntranceShort:[],ending:[]},
  Dungeons:{get:id=>({name:id,shortName:id})},State:{data:null,addLog:text=>logs.push(text)},UI:{draw(){},closeSuspend(){}},Map:{reveal(){}},Audio:null
};
vm.runInThisContext(fs.readFileSync('js/campaign.js','utf8'),{filename:'js/campaign.js'});
Kiri.Campaign.boot();

const inventory=Array.from({length:20},(_,i)=>({id:'item'+i})),chest={id:'eternalTreasure',category:'treasure'},state={dungeonId:'normalDungeon',floor:27,gameOver:false,player:{level:4},inventory,groundItems:[chest],stairs:{x:2,y:2,type:'down'},treasureState:{returning:false,obtained:{},rank:{}}};
Kiri.State.data=state;
assert(Kiri.Campaign.collectTreasure(state,chest,0));
assert.equal(state.groundItems.length,0,'important treasure is removed even with a full bag');
assert.equal(state.inventory.length,20,'important treasure never consumes a bag slot');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'take-treasure'}})}});
assert(story.treasureChest.obtained);
assert.equal(story.treasureChest.opened,false);
assert.equal(state.stairs.type,'up');
assert.equal(dungeonSaves,1);
assert(logs.some(text=>text.includes('大切な宝箱')));

assert(Kiri.Campaign.onDungeonReturn(state));
assert(story.cleared.normalDungeon);
assert(baseSaves>0);

const deathState={dungeonId:'normalDungeon',floor:8,gameOver:false,player:{level:2}};
Kiri.Campaign.onGameOver(deathState);
assert(deathState.gameOver);
assert(baseSaves>1,'game over ends the active challenge while keeping the book');
console.log('campaign progression smoke: full-bag treasure, return clear and game-over book retention passed');
