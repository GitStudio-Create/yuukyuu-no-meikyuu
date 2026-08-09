'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
function classes(){return{set:new Set(['hidden']),add(v){this.set.add(v);},remove(v){this.set.delete(v);},toggle(v,force){if(force)this.set.add(v);else this.set.delete(v);},contains(v){return this.set.has(v);}};}
function node(){return{className:'',classList:classes(),attributes:{},listeners:{},innerHTML:'',textContent:'',addEventListener(t,f){this.listeners[t]=f;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},querySelector(){return null;},insertAdjacentHTML(){}};}
const root=node(),shell=node(),titleButton=node(),body={classList:classes(),dataset:{}},globalListeners={};
global.document={body,createElement:()=>node(),querySelector(q){if(q==='#campaignScreen')return root;if(q==='.game-shell')return shell;if(q==='#newGame')return titleButton;if(q==='#gmPanel .gm-grid')return null;if(q==='[data-campaign-debug]')return null;return null;}};
global.addEventListener=(t,f)=>{globalListeners[t]=f;};
let story={openingSeen:true,questAccepted:true,cleared:{tutorialDungeon:false,normalDungeon:false,mysteryDungeon:false},treasureChest:{obtained:false,opened:false},events:{deepEntranceSeen:false,endingSeen:false}},dungeonSaves=0,baseSaves=0,logs=[],saveOk=true,titleCalls=0;
global.Kiri={
  AdventureBooks:{slots:()=>[],story:()=>story,saveDungeon:()=>{dungeonSaves++;return saveOk;},saveBase:()=>{baseSaves++;return true;},debug:()=>({slot:1}),lastError:()=>'保存領域を使用できません。'},
  StoryEvents:{opening:[],deepEntrance:[],deepEntranceShort:[],ending:[]},
  Dungeons:{get:id=>({name:id,shortName:id})},State:{data:null,addLog:text=>logs.push(text)},UI:{draw(){},closeSuspend(){}},Map:{reveal(){}},Audio:{setTitle(){titleCalls++;}}
};
vm.runInThisContext(fs.readFileSync('js/campaign.js','utf8'),{filename:'js/campaign.js'});
Kiri.Campaign.boot();
assert.equal(body.dataset.appState,'TITLE');
assert.equal(shell.hidden,true,'game shell stays hidden on title');
assert.equal(titleCalls,1,'title screen selects title BGM');
root.listeners.click({target:{closest:()=>({dataset:{titleAction:'exit'}})}});
assert(root.innerHTML.includes('ゲームを終了しますか？'));
root.listeners.click({target:{closest:()=>({dataset:{campaign:'exit-game'}})}});
assert(root.innerHTML.includes('ブラウザを閉じてゲームを終了してください。'));
assert.equal(body.dataset.appState,'TITLE','safe browser exit never deletes or enters a dungeon');
Kiri.Campaign.showStart();
Kiri.Campaign.showBase();
assert(root.className.includes('castle-no-chest'),'castle uses no-chest background before treasure acquisition');
assert(/data-campaign="chest" disabled/.test(root.innerHTML),'treasure command is disabled until the chest is obtained');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'dungeons'}})}});
assert(/data-dungeon="normalDungeon" disabled/.test(root.innerHTML),'normal dungeon is locked before tutorial clear');
assert(root.innerHTML.includes('未解放 ／ ちょっと不思議をクリアすると挑戦できます'));
const lockedScreen=root.innerHTML;
root.listeners.click({target:{closest:()=>({disabled:true,dataset:{dungeon:'normalDungeon'}})}});
assert.equal(root.innerHTML,lockedScreen,'disabled dungeon cannot be activated programmatically through the UI handler');
story.cleared.tutorialDungeon=true;Kiri.Campaign.showBase();
root.listeners.click({target:{closest:()=>({dataset:{campaign:'dungeons'}})}});
assert(!/data-dungeon="normalDungeon" disabled/.test(root.innerHTML),'existing tutorial clear flag unlocks normal dungeon');
assert(root.innerHTML.includes('基本99F ／ 難易度：普通'));
story.cleared.tutorialDungeon=false;
Kiri.Campaign.showStart();

const inventory=Array.from({length:20},(_,i)=>({id:'item'+i})),chest={id:'eternalTreasure',category:'treasure'},state={dungeonId:'normalDungeon',floor:27,gameOver:false,player:{level:4},inventory,groundItems:[chest],stairs:{x:2,y:2,type:'down'},treasureState:{returning:false,obtained:{},rank:{}}};
Kiri.State.data=state;
assert(Kiri.Campaign.collectTreasure(state,chest,0));
assert.equal(body.dataset.appState,'TREASURE_EVENT');
assert.equal(state.groundItems.length,0,'important treasure is removed even with a full bag');
assert.equal(state.inventory.length,20,'important treasure never consumes a bag slot');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'take-treasure'}})}});
assert.equal(body.dataset.appState,'DUNGEON');
assert.equal(shell.hidden,false,'game shell is shown only in dungeon state');
assert(story.treasureChest.obtained);
assert.equal(story.treasureChest.opened,false);
assert.equal(state.stairs.type,'up');
assert.equal(dungeonSaves,1);
assert(logs.some(text=>text.includes('大切な宝箱')));

Kiri.Campaign.requestSuspend();
assert.equal(body.dataset.appState,'SUSPEND');
assert.equal(shell.hidden,false,'suspend overlay keeps the current dungeon visible');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'resume-game'}})}});
assert.equal(body.dataset.appState,'DUNGEON','cancel resumes the dungeon');
Kiri.Campaign.requestSuspend();
root.listeners.click({target:{closest:()=>({dataset:{campaign:'suspend-save'}})}});
assert.equal(body.dataset.appState,'ADVENTURE_BOOKS','successful suspend returns to adventure books');
assert.equal(dungeonSaves,2,'suspend saves the selected adventure book');

root.listeners.click({target:{closest:()=>({dataset:{campaign:'resume-game'}})}});
saveOk=false;Kiri.Campaign.requestSuspend();
root.listeners.click({target:{closest:()=>({dataset:{campaign:'suspend-save'}})}});
assert.equal(body.dataset.appState,'DUNGEON','failed suspend keeps the dungeon active');
assert(logs.some(text=>text.includes('冒険の記録に失敗しました。ゲームを続けます。')));
saveOk=true;

assert(Kiri.Campaign.onDungeonReturn(state));
assert(story.cleared.normalDungeon);
assert(baseSaves>0);
assert(titleCalls>=3,'returning to castle restores title BGM');
assert(root.className.includes('castle-closed-chest'),'returning with treasure uses the closed-chest background');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'king'}})}});
assert(root.className.includes('castle-closed-chest')&&root.innerHTML.includes('THE KING'),'king dialogue keeps the castle background');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'base'}})}});
root.listeners.click({target:{closest:()=>({dataset:{campaign:'dungeons'}})}});
assert(root.className.includes('castle-closed-chest')&&root.innerHTML.includes('どの迷宮へ向かいますか？'),'dungeon choice keeps the castle background');
root.listeners.click({target:{closest:()=>({dataset:{campaign:'base'}})}});
root.listeners.click({target:{closest:()=>({dataset:{campaign:'chest'}})}});
assert(root.className.includes('castle-closed-chest')&&root.innerHTML.includes('宝箱を開けますか？'));
root.listeners.click({target:{closest:()=>({dataset:{campaign:'open-chest'}})}});
assert(story.treasureChest.opened,'opening the treasure reuses the saved story flag');
assert(root.className.includes('castle-open-chest'),'opening the treasure updates the castle background without reload');

const deathState={dungeonId:'normalDungeon',floor:8,gameOver:false,player:{level:2}};
Kiri.Campaign.onGameOver(deathState);
assert.equal(body.dataset.appState,'GAME_OVER');
assert(deathState.gameOver);
assert(baseSaves>1,'game over ends the active challenge while keeping the book');
story.cleared.tutorialDungeon=false;
const trialChest={id:'trialTreasure',category:'treasure'},trialState={dungeonId:'tutorialDungeon',floor:10,gameOver:false,player:{x:7,y:6,level:2},inventory:[],groundItems:[trialChest],stairs:{x:-1,y:-1,type:'down',disabled:true},treasureState:{returning:false,obtained:{},rank:{}}};
assert(Kiri.Campaign.collectTreasure(trialState,trialChest,0));
root.listeners.click({target:{closest:()=>({dataset:{campaign:'take-treasure'}})}});
assert(trialState.treasureState.returning&&!story.cleared.tutorialDungeon,'taking the tutorial objective starts return but is not a clear');
assert.deepStrictEqual(trialState.stairs,{x:7,y:6,type:'up'});
Kiri.Campaign.onDungeonReturn(trialState);assert(story.cleared.tutorialDungeon,'tutorial clears only after the 0F return callback');
console.log('campaign progression smoke: full-bag treasure, return clear and game-over book retention passed');
