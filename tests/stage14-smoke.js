'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};global.addEventListener=()=>{};function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','item-icons','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.spawnPolicy={nextSpawnTurn:999,maxEnemies:10,naturalSpawnInterval:30};return s;}
let suspended=0,resumed=0;Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showSuspend:()=>suspended++,closeSuspend:()=>resumed++};Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{}};load('js/game.js');

// Walking onto an item auto-picks when the bag has room.
let s=arena(),item=Kiri.Items.create('nutBread',3,2,s.dungeonId);s.groundItems=[item];Kiri.Game.actions.move(1,0);assert.equal(s.player.x,3);assert.equal(s.inventory.length,1);assert.equal(s.groundItems.length,0);assert(s.inventory.includes(item));let turn=s.turn;
s=arena();turn=s.turn;assert.equal(Kiri.Game.actions.pickup(),false);assert.equal(s.turn,turn);
s=arena();s.inventory=Array.from({length:Kiri.Config.inventoryMax},()=>Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId));s.groundItems=[Kiri.Items.create('moonHerb',2,2,s.dungeonId)];turn=s.turn;assert.equal(Kiri.Game.actions.pickup(),false);assert.equal(s.turn,turn);assert.equal(s.groundItems.length,1);

// Arrow stacks merge and the bag sorts equipped items then clear categories.
s=arena();let arrow=Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId);arrow.quantity=3;s.inventory=[arrow];let floorArrow=Kiri.Items.create('reedArrow',2,2,s.dungeonId);floorArrow.quantity=4;s.groundItems=[floorArrow];Kiri.Game.actions.pickup();assert.equal(arrow.quantity,7);assert.equal(s.inventory.length,1);
s=arena();let food=Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId),herb=Kiri.Items.create('moonHerb',undefined,undefined,s.dungeonId),shield=Kiri.Items.create('barkShield',undefined,undefined,s.dungeonId),weapon=Kiri.Items.create('emberBlade',undefined,undefined,s.dungeonId);shield.equipped=true;s.inventory=[food,herb,weapon,shield];Kiri.Inventory.sort(s);assert.deepStrictEqual(s.inventory.map(i=>i.category),['shield','weapon','herb','food']);

// Manual suspension saves without advancing the turn and resumes locally.
s=arena();turn=s.turn;assert(Kiri.Game.actions.suspend());assert.equal(s.turn,turn);assert.equal(suspended,1);assert(store[Kiri.Config.saveKey]);assert(Kiri.Game.actions.resume());assert.equal(resumed,1);

// Every requested category has a Canvas-only pixel icon and text glyphs are disabled.
const operations=[];const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){operations.push(Array.from(arguments));},set fillStyle(v){},set imageSmoothingEnabled(v){}};Kiri.ItemIcons.categories.forEach(category=>{const before=operations.length;Kiri.ItemIcons.draw(ctx,category,0,0,20);assert(operations.length>before);});assert.equal(Kiri.ItemIcons.categories.length,8);assert(Object.values(Kiri.Items.definitions).every(d=>d.glyph===''));

// Successful item actions trigger another stable sort.
Kiri.Game.actions.requestItemAction=()=>true;Kiri.Game.actions.cancelItemAction=()=>{};Kiri.Game.actions.closeItemDetails=()=>{};global.Kiri.Sound=null;load('js/stage14-controller.js');s=arena();food=Kiri.Items.create('nutBread',undefined,undefined,s.dungeonId);herb=Kiri.Items.create('moonHerb',undefined,undefined,s.dungeonId);weapon=Kiri.Items.create('emberBlade',undefined,undefined,s.dungeonId);s.inventory=[food,herb,weapon];Kiri.ItemActions.perform('place',s,herb);assert.deepStrictEqual(s.inventory.map(i=>i.category),['weapon','food']);

// UI and keyboard contracts expose the four floor commands.
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');['data-floor-pickup','data-floor-stairs','data-floor-step','data-floor-suspend','data-resume'].forEach(x=>assert(html.includes(x)));assert(html.includes('js/item-icons.js'));assert(html.includes('js/stage14-input.js'));assert(css.includes('.floor-commands'));assert(css.includes('.suspend-screen'));
const legacy=Kiri.State.fresh();store[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());
console.log('stage 14 smoke: explicit pickup, suspend, pixel icons, sorting and floor commands passed');
