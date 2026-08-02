'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};let scheduled=null;global.setTimeout=fn=>{scheduled=fn;return 1;};global.clearTimeout=()=>{scheduled=null;};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','item-icons','item-details','state','stage8-state','stage10-state','stage15-state','map','visibility','combat-rules','entities','enemy-renderer','sprites','animation','item-actions','stage10-items','balance','traps','stairs','stage23-combat','stage22-rewards','stage25-wake'].forEach(n=>load('js/'+n+'.js'));
Kiri.UI={draw:()=>{},showItemMenu:()=>{},closeItemMenu:()=>{},showItemDetails:()=>{},hideTooltip:()=>{},showConfirm:()=>{},closeConfirm:()=>{},setInventorySelection:()=>{},showStairs:()=>{},closeStairs:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showSuspend:()=>{},closeSuspend:()=>{}};Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{}};load('js/game.js');load('js/stage7-controller.js');load('js/stage17-controller.js');load('js/stage24-controller.js');
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,id:1}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:0};s.stairs={x:30,y:22};s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];s.spawnPolicy={nextSpawnTurn:999,maxEnemies:10,naturalSpawnInterval:30};Kiri.State.data=s;return s;}
function sleeper(s,x,y){const e=Kiri.Entities.createEnemy(1,{x:x,y:y},Kiri.Dungeons.get(s.dungeonId),'driftMoth');e.hp=200;e.maxHp=200;e.dropRate=0;e.spawnSleep=true;e.awake=false;e.effectSleep=0;e.status.sleep=0;s.enemies.push(e);return e;}
function finish(){const callback=scheduled;scheduled=null;assert(callback);callback();}

// Arrow impact always wakes, reserves the following enemy turn, and acts only next turn.
let s=arena(),enemy=sleeper(s,3,2),arrow=Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId);arrow.quantity=3;arrow.equipped=true;s.player.equipment.arrow=arrow;s.inventory=[arrow];let playerHp=s.player.hp;Kiri.Game.actions.shootArrow();assert(!enemy.awake);finish();assert(enemy.awake&&!enemy.spawnSleep);assert.equal(enemy.wokeOnTurn,s.turn);assert.equal(s.player.hp,playerHp);assert(s.log.some(line=>line.includes(enemy.name+'は目を覚ました。')));Kiri.Game.actions.step();assert(s.player.hp<playerHp);

// Timed item sleep is cleared by damage as well.
s=arena();enemy=sleeper(s,3,2);enemy.spawnSleep=false;enemy.awake=true;enemy.effectSleep=5;enemy.status.sleep=5;arrow=Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId);arrow.quantity=2;arrow.equipped=true;s.player.equipment.arrow=arrow;s.inventory=[arrow];Kiri.Game.actions.shootArrow();finish();assert.equal(enemy.effectSleep,0);assert.equal(enemy.status.sleep,0);assert.equal(enemy.wokeOnTurn,s.turn);

// Thrown items, damage wands and offensive herbs share the same wake rule.
function itemWake(id,action){const state=arena(),foe=sleeper(state,3,2),item=Kiri.Items.create(id,undefined,undefined,state.dungeonId);state.inventory=[item];Kiri.Game.actions.openItem(0);Kiri.Game.actions.itemAction(action);assert(!foe.awake);finish();assert(foe.awake);assert.equal(foe.wokeOnTurn,state.turn);return state;}
itemWake('nutBread','throw');itemWake('thunderStaff','wave');itemWake('flameHerb','drink');

// A miss wakes only sleepers adjacent to the landing point, using an adjustable chance.
const random=Math.random;Math.random=()=>0;s=arena();s.rooms=[];enemy=sleeper(s,12,3);let far=sleeper(s,20,20);arrow=Kiri.Items.create('reedArrow',undefined,undefined,s.dungeonId);arrow.quantity=2;arrow.equipped=true;s.player.equipment.arrow=arrow;s.inventory=[arrow];Kiri.Game.actions.shootArrow();finish();assert(enemy.awake);assert(!far.awake);assert(s.log.some(line=>line.includes('物音で'+enemy.name+'は目を覚ました。')));Math.random=random;assert.equal(Kiri.WakeRules.PROJECTILE_MISS_WAKE_CHANCE,.5);

const html=fs.readFileSync('index.html','utf8');assert(html.includes('js/stage25-wake.js'));
console.log('stage 25 smoke: impact wake, miss noise and same-turn action guard passed');
