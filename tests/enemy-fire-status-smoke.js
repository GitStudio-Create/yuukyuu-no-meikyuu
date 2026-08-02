'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=()=>{};
function load(n){vm.runInThisContext(fs.readFileSync('js/'+n+'.js','utf8'),{filename:'js/'+n+'.js'});}
['config','spawns','dungeons','themes','enemy-catalog','items','state','map','visibility','combat-rules','animation','entities','item-actions','balance'].forEach(load);
function arena(){const s=Kiri.State.reset('normalDungeon');s.floor=23;s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=80;s.player.maxHp=80;s.player.status={sleep:0,confuse:0,haste:0,blind:0,invisible:0};s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.seen={};s.spawnPolicy={maxEnemies:14,nextSpawnTurn:999};Kiri.State.data=s;Kiri.Visibility.update(s);return s;}

const random=Math.random;Math.random=()=>0;
let s=arena(),enemy=Kiri.Entities.createEnemy(23,{x:8,y:2},Kiri.Dungeons.get(s.dungeonId),'emberHorn');enemy.spawnSleep=false;enemy.awake=true;s.enemies=[enemy];const hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert(s.player.hp<hp);let frames=Kiri.Animation.projectileFrames(performance.now()+50);assert(frames.some(f=>f.kind==='enemyFire'&&f.dx===-1&&f.dy===0));
Math.random=random;

Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{},showSuspend:()=>{},closeSuspend:()=>{}};
Kiri.Input={resetModes:()=>{}};
Kiri.Audio={setTheme:()=>{}};
load('game');
s=arena();s.player.status.confuse=1;s.player.status.sleep=1;s.player.status.blind=1;s.player.status.invisible=1;s.player.status.haste=1;Kiri.Game.endTurn({skipEnemy:true});
assert(s.log.some(x=>x.includes('混乱が解けた')));
assert(s.log.some(x=>x.includes('眠りから目を覚ました')));
assert(s.log.some(x=>x.includes('目つぶしが治った')));
assert(s.log.some(x=>x.includes('透明の効果が切れた')));
assert(s.log.some(x=>x.includes('倍速の効果が切れた')));

console.log('enemy fire projectile and player status recovery log smoke passed');
