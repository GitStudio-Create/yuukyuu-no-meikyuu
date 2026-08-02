'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','animation','item-actions','stage23-combat','stage22-rewards'].forEach(load);

const expected={
  emberBlade:'火の短剣',willowBlade:'風の剣',mistSaber:'白銀の刀',stoneAxe:'岩割りの斧',dawnEdge:'朝焼けの剣',
  barkShield:'木の盾',mossShield:'毒よけの盾',clearShield:'鏡の盾',emberShield:'火よけの盾',everShield:'石の盾',
  thunderStaff:'いかずちの杖',slowStaff:'鈍足の杖',sleepStaff:'眠りの杖',confuseStaff:'混乱の杖',warpStaff:'ワープの杖',changeStaff:'変化の杖',hasteStaff:'倍速の杖',sacrificeStaff:'命削りの杖',
  mightRing:'力の指輪',antidoteRing:'毒よけの指輪',wakeRing:'眠らずの指輪',fastingRing:'満腹の指輪',safeRing:'ワナよけの指輪',driftRing:'ワープの指輪',
  moonHerb:'回復草',starHerb:'大回復草',powerMendHerb:'力もどし草',powerSeedHerb:'力のたね',levelHerb:'成長草',swiftHerb:'すばやさ草',sightHerb:'ワナ見え草',poisonHerb:'毒草',confuseHerb:'混乱草',sleepHerb:'眠り草',warpHerb:'ワープ草',flameHerb:'火ふき草',
  escapeScroll:'帰りの紙片',weaponScroll:'武器強化の紙片',shieldScroll:'盾強化の紙片',uncurseScroll:'呪い消しの紙片',identifyScroll:'識別の紙片',mapScroll:'道標の紙片',trapScroll:'ワナ見えの紙片',itemScroll:'道具見えの紙片',enemyScroll:'敵見えの紙片',blastScroll:'雷の紙片',foodScroll:'食料の紙片',chargeScroll:'杖なおしの紙片',
  nutBread:'パン',bigBread:'大きなパン',spoiledBread:'くさったパン',reedArrow:'木の矢',ironArrow:'鉄の矢',pierceArrow:'貫通の矢'
};
Object.keys(expected).forEach(id=>assert.equal(Kiri.Items.definitions[id].trueName,expected[id]));
const removed=['sparkHerb','stormHerb','edgeStaff'];
removed.forEach(id=>assert.equal(Kiri.Items.definitions[id],undefined));
Object.values(Kiri.Dungeons.modes).forEach(mode=>removed.forEach(id=>assert.equal(Object.prototype.hasOwnProperty.call(mode.itemSpawnTable,id),false)));
assert.equal(Kiri.Items.create('sparkHerb'),null);

// Deleted items are discarded safely from old inventories, floor items and equipment.
let old=Kiri.State.fresh('normalDungeon');
old.inventory=[{id:'sparkHerb',trueName:'火花草',category:'herb'}];
old.groundItems=[{id:'stormHerb',trueName:'雷鳴草',category:'herb'}];
old.player.equipment.weapon={id:'edgeStaff',trueName:'薄命の杖',category:'staff'};
old=Kiri.State.migrate(old);assert.equal(old.inventory.length,0);assert.equal(old.groundItems.length,0);assert.equal(old.player.equipment.weapon,null);

function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,id:1}];s.player.x=2;s.player.y=2;s.player.facingDirection={dx:1,dy:0};s.enemies=[];s.groundItems=[];s.inventory=[];s.spawnPolicy={maxEnemies:10};return s;}
function foe(state,hp,exp){const e=Kiri.Entities.createEnemy(1,{x:5,y:2},Kiri.Dungeons.get(state.dungeonId),'dewMote');e.hp=hp;e.maxHp=hp;e.exp=exp;e.dropRate=0;e.spawnSleep=false;e.awake=true;state.enemies=[e];return e;}
const random=Math.random;Math.random=()=>0;
let s=arena(),enemy=foe(s,65,9),herb=Kiri.Items.create('flameHerb');s.inventory=[herb];let result=Kiri.ItemActions.perform('drink',s,herb);assert.equal(enemy.hp,0);assert.equal(s.player.exp,9);assert(result.message.includes('65のダメージ'));
Math.random=()=>.999999;s=arena();enemy=foe(s,100,9);herb=Kiri.Items.create('flameHerb');s.inventory=[herb];result=Kiri.ItemActions.perform('drink',s,herb);assert.equal(enemy.hp,25);assert(result.message.includes('75のダメージ'));Math.random=random;

console.log('stage 29 smoke: item removals, renames, save cleanup and fire-breath damage passed');
