'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};global.addEventListener=()=>{};function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','item-details','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(n=>load('js/'+n+'.js'));
function arena(rooms){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=rooms;s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:1};s.stairs={x:8,y:8,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.spawnPolicy={nextSpawnTurn:999,maxEnemies:10,naturalSpawnInterval:30};return s;}

// Diagonal melee needs both actors in the exact same room.
let same=[{x:1,y:1,w:7,h:7}],s=arena(same),target={x:3,y:3};assert(Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,target));assert(Kiri.CombatRules.canMeleeAttack(s,s.player,target));
s=arena([{x:1,y:1,w:2,h:2}]);target={x:3,y:3};assert(!Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,target));
s=arena([{x:2,y:2,w:1,h:1},{x:3,y:3,w:1,h:1}]);target={x:3,y:3};assert(!Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,target));
s=arena([{x:3,y:3,w:2,h:2}]);target={x:3,y:3};assert(!Kiri.CombatRules.canDiagonalMeleeAttack(s,s.player,target));

// Normal enemies cannot diagonal-melee across a corridor boundary; ranged enemies can shoot diagonally.
s=arena([{x:3,y:3,w:3,h:3}]);let enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];let hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert.equal(s.player.hp,hp);
s=arena([]);enemy=Kiri.Entities.createEnemy(10,{x:6,y:6},Kiri.Dungeons.get(s.dungeonId),'ranged');s.enemies=[enemy];hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert(s.player.hp<hp);

// Minimal game/UI surface for hook verification.
Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showItemMenu:()=>{},showItemDetails:()=>{},hideTooltip:()=>{},showTooltip:()=>{},showConfirm:()=>{},closeConfirm:()=>{},setInventorySelection:()=>{},selectAction:()=>{},isStatusOpen:()=>false};Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{}};load('js/game.js');load('js/stage7-controller.js');

// Generated Web Audio patterns, settings and no-audio fallback.
load('js/sound.js');let started=0;const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};const fakeContext={currentTime:0,destination:{},createOscillator:()=>({frequency:param,connect(){},start(){started++;},stop(){}}),createGain:()=>({gain:param,connect(){}})};Kiri.Sound._setContext(fakeContext);const names=['playerAttack','enemyAttack','playerDamage','enemyDamage','throwItem','wand','arrow','menuOpen','menuSelect','menuCancel','itemUse','stairs','trap','levelUp','gameOver'];names.forEach(name=>assert.doesNotThrow(()=>Kiri.Sound.play(name)));assert(started>0);let before=Kiri.Sound.settings().enabled;assert.equal(Kiri.Sound.toggle(),!before);assert.equal(Kiri.Sound.setVolume(.27),.27);assert.equal(Kiri.Sound.settings().volume,.27);Kiri.Sound._setContext(null);assert.doesNotThrow(()=>Kiri.Sound.play('trap'));

// Hooks emit the requested event names without depending on sound hardware.
Kiri.Sound.toggle();Kiri.Sound.clearEvents();load('js/sound-hooks.js');s=arena(same);enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=50;enemy.maxHp=50;enemy.status.sleep=8;s.enemies=[enemy];Kiri.Game.actions.attack();assert(Kiri.Sound.events().includes('playerAttack'));assert(Kiri.Sound.events().includes('enemyDamage'));
Kiri.Sound.clearEvents();s=arena(same);enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];Kiri.Entities.enemyAct(s,enemy);assert(Kiri.Sound.events().includes('enemyAttack'));assert(Kiri.Sound.events().includes('playerDamage'));
Kiri.Sound.clearEvents();s=arena(same);let item=Kiri.Items.create('nutBread',0,0,s.dungeonId);s.inventory=[item];Kiri.ItemActions.perform('throw',s,item);assert(Kiri.Sound.events().includes('throwItem'));item=Kiri.Items.create('thunderStaff',0,0,s.dungeonId);s.inventory=[item];Kiri.ItemActions.perform('wave',s,item);assert(Kiri.Sound.events().includes('wand'));item=Kiri.Items.create('reedArrow',0,0,s.dungeonId);s.inventory=[item];Kiri.ItemActions.perform('shoot',s,item);assert(Kiri.Sound.events().includes('arrow'));item=Kiri.Items.create('moonHerb',0,0,s.dungeonId);s.inventory=[item];Kiri.ItemActions.perform('drink',s,item);assert(Kiri.Sound.events().includes('itemUse'));
Kiri.Sound.clearEvents();s=arena(same);Kiri.Traps.applyPlayer(s,{id:'mistNeedle',x:2,y:2,revealed:false});assert(Kiri.Sound.events().includes('trap'));assert(Kiri.Sound.events().includes('playerDamage'));
Kiri.Sound.clearEvents();s=arena(same);s.player.x=s.stairs.x;s.player.y=s.stairs.y;Kiri.Game.actions.descend();assert(Kiri.Sound.events().includes('stairs'));
Kiri.Sound.clearEvents();Kiri.UI.showGameOver(s);assert(Kiri.Sound.events().includes('gameOver'));

// Level-up and menu sounds.
Kiri.Sound.clearEvents();s=arena(same);s.player.exp=9;enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=1;s.enemies=[enemy];Kiri.Entities.attack(s,enemy);assert(Kiri.Sound.events().includes('levelUp'));item=Kiri.Items.create('nutBread',0,0,s.dungeonId);s.inventory=[item];Kiri.Game.actions.openItem(0);Kiri.Game.actions.requestItemAction('eat');Kiri.Game.actions.cancelItemAction();let events=Kiri.Sound.events();assert(events.includes('menuOpen'));assert(events.includes('menuSelect'));assert(events.includes('menuCancel'));

// CSS/HTML use one shared width and expose independent SE controls.
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');assert(html.includes('data-se-toggle'));assert(html.includes('data-se-volume'));assert(html.includes('js/sound.js'));assert(html.includes('js/sound-hooks.js'));assert(css.includes('.status,.canvas-wrap,.message-area{width:min(100%,640px)'));
const legacy=Kiri.State.fresh();store[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());
console.log('stage 13 smoke: shared-room melee, unified width, generated SE and migration passed');
