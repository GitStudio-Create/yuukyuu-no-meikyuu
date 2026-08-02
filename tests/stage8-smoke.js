'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};let domReady=null;global.addEventListener=(t,f)=>{if(t==='DOMContentLoaded')domReady=f;};function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
load('js/config.js');load('js/spawns.js');load('js/dungeons.js');load('js/themes.js');load('js/enemy-catalog.js');load('js/items.js');load('js/inventory.js');load('js/state.js');load('js/stage8-state.js');load('js/map.js');load('js/visibility.js');load('js/combat-rules.js');load('js/entities.js');load('js/item-actions.js');load('js/stage10-items.js');load('js/balance.js');load('js/traps.js');load('js/stairs.js');

// Audio maps every floor range, persists settings and does not reload inside one theme.
let loads=0,plays=0,errorHandler=null;const audio={paused:true,volume:0,loop:false,src:'',play(){plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},load(){loads++;},removeAttribute(){this.src='';},addEventListener(t,f){if(t==='error')errorHandler=f;}};const toggle={textContent:'',setAttribute(){},addEventListener(){},click(){}},range={value:'35',addEventListener(){}};global.document={querySelector:q=>q==='#bgmAudio'?audio:q.includes('toggle')?toggle:range,addEventListener:()=>{}};load('js/audio.js');Kiri.Audio.init();assert(Kiri.Audio.fileForFloor(1).includes('心淵の扉_1F~2F'));assert.notEqual(Kiri.Audio.fileForFloor(2),Kiri.Audio.fileForFloor(3));Kiri.Audio.setTheme(1);const once=loads;Kiri.Audio.setTheme(2);assert.equal(loads,once);Kiri.Audio.setTheme(3);assert.equal(loads,once+1);assert.doesNotThrow(()=>errorHandler());

let stairShown=0;Kiri.UI={draw:()=>{},showStairs:()=>stairShown++,closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{}};Kiri.Input={resetModes:()=>{}};load('js/game.js');function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.stairs={x:3,y:2,type:'down'};s.groundItems=[];s.enemies=[];s.traps=[];s.seen={};for(let y=0;y<24;y++)for(let x=0;x<32;x++)s.seen[x+','+y]=1;return s;}

let s=arena(),turn=s.turn;Kiri.Game.actions.move(1,0);assert.equal(s.floor,1);assert.equal(s.turn,turn+1);assert.equal(stairShown,1);Kiri.Game.actions.stayStairs();assert.equal(s.floor,1);Kiri.Game.actions.descend();assert.equal(Kiri.State.data.floor,2);

// Running stops on items, branches, stairs and visible enemies.
s=arena();s.player.x=1;s.stairs={x:20,y:20,type:'down'};s.groundItems=[Kiri.Items.create('nutBread',4,2,s.dungeonId)];Kiri.Game.actions.run(1,0);assert.equal(s.player.x,4);assert(s.inventory.some(i=>i.id==='nutBread'));
s=arena();s.map=Array.from({length:24},()=>Array(32).fill(0));for(let x=1;x<=7;x++)s.map[2][x]=1;s.map[1][3]=1;s.rooms=[];s.player.x=1;s.player.y=2;s.stairs={x:7,y:2,type:'down'};Kiri.Game.actions.run(1,0);assert.equal(s.player.x,3);
s=arena();s.player.x=1;s.stairs={x:4,y:2,type:'down'};Kiri.Game.actions.run(1,0);assert.equal(s.player.x,4);
s=arena();s.player.x=1;s.stairs={x:20,y:20,type:'down'};s.enemies=[{x:6,y:2,hp:9,maxHp:9,power:1,energy:0,speed:1,status:{sleep:0,confuse:0}}];Kiri.Game.actions.run(1,0);assert.equal(s.player.x,1);

// Spawn ranges and placement safety.
for(let i=0;i<100;i++){let n=Kiri.Spawns.enemyCount('tutorialDungeon',1);assert(n>=2&&n<=3);n=Kiri.Spawns.enemyCount('normalDungeon',20);assert(n>=5&&n<=8);n=Kiri.Spawns.enemyCount('mysteryDungeon',60);assert(n>=7&&n<=10);}for(const id of ['tutorialDungeon','normalDungeon','mysteryDungeon']){s=Kiri.State.reset(id);s.floor=id==='mysteryDungeon'?45:8;Kiri.Game.buildFloor();assert(s.enemies.every(e=>Kiri.Util.distance(e,s.player)>6&&Kiri.Util.distance(e,s.stairs)>3));assert(s.spawnPolicy&&s.spawnPolicy.naturalSpawnInterval>=25&&s.spawnPolicy.naturalSpawnInterval<=40);}

// Existing v2 stairs gain a direction.
const old=Kiri.State.fresh();old.stairs={x:2,y:2};store[Kiri.Config.saveKey]=JSON.stringify(old);assert(Kiri.State.load());assert.equal(Kiri.State.data.stairs.type,'down');

// Canvas stair symbols expose both future directions.
let strokes=0;const ctx=new Proxy({save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}},{set:(o,k,v)=>(o[k]=v,true)});Kiri.Stairs.drawDown(ctx,0,0);Kiri.Stairs.drawUp(ctx,0,0);assert(strokes>=10);

// Keyboard routing for Esc and B+direction.
const listeners={};global.addEventListener=(t,f)=>listeners[t]=f;function node(){return{addEventListener:()=>{},classList:{toggle:()=>{},contains:()=>false},setAttribute:()=>{}};}global.document={querySelectorAll:()=>[],querySelector:()=>node()};let statusOpen=true,stairOpen=false,runs=0,statusToggles=0,stays=0;Kiri.UI.isStatusOpen=()=>statusOpen;Kiri.UI.isStairOpen=()=>stairOpen;Kiri.UI.inventoryColumns=()=>2;Kiri.UI.selectAction=()=>{};Kiri.UI.selectedAction=()=>null;load('js/input.js');Kiri.Input.init({toggleStatus:()=>{statusToggles++;statusOpen=false;},stayStairs:()=>stays++,descend:()=>{},run:()=>runs++,move:()=>{},face:()=>{},attack:()=>{},step:()=>{},inventoryCount:()=>0,selectInventory:()=>{},openItem:()=>false,closeItemDetails:()=>{},previewItem:()=>{},hideItemPreview:()=>{},requestItemAction:()=>false,cancelItemAction:()=>{},confirmItemAction:()=>{},newGame:()=>{}});const key=k=>listeners.keydown({key:k,preventDefault:()=>{}});key('Escape');assert.equal(statusToggles,1);key('b');key('ArrowRight');assert.equal(runs,1);stairOpen=true;key('Escape');assert.equal(stays,1);
console.log('stage 8 smoke: stairs, running, spawns, audio and Esc routing passed');
