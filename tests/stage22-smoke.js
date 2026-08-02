'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};let clock=100;global.performance={now:()=>clock};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','item-icons','state','map','visibility','combat-rules','entities','enemy-renderer','sprites','animation','item-actions','stage10-items','balance','traps','stairs','stage22-rewards','stage33-projectile-rules','stage38-combat-gold-vitals'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,id:1}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:0};s.stairs={x:30,y:22};s.enemies=[];s.groundItems=[];s.traps=[];s.inventory=[];s.spawnPolicy={maxEnemies:10};return s;}
function target(s,id,hp){const e=Kiri.Entities.createEnemy(s.floor,{x:4,y:2},Kiri.Dungeons.get(s.dungeonId),id||'dewMote');e.hp=hp;e.maxHp=Math.max(e.maxHp,hp);e.spawnSleep=false;e.awake=true;e.dropRate=0;s.enemies=[e];return e;}

// Enemy movement uses independent interpolation in all directions.
let s=arena(),enemy=target(s,'driftMoth',20);Kiri.Animation.enemy(enemy,'walk',200,{dx:-1,dy:1,fromX:5,fromY:1,toX:4,toY:2});let frame=Kiri.Animation.enemyFrame(enemy,100);assert.equal(frame.offsetX,1);assert.equal(frame.offsetY,-1);frame=Kiri.Animation.enemyFrame(enemy,200);assert.equal(frame.offsetX,.5);assert.equal(frame.offsetY,-.5);

// Every definition owns adjustable drop metadata, including zero and guaranteed rates.
assert(Kiri.EnemyCatalog.list.every(d=>typeof d.dropRate==='number'&&Array.isArray(d.dropCategories)&&d.dropCategories.length));assert.equal(Kiri.EnemyCatalog.byId.hungerShade.dropRate,.08);assert.equal(Kiri.EnemyCatalog.byId.shyShell.dropRate,1);

// Melee grants the enemy's real EXP and keeps EXP plus level-up in the defeat log.
s=arena();s.player.exp=9;enemy=target(s,'dewMote',1);enemy.exp=6;let before=s.player.exp;Kiri.State.data=s;Kiri.Entities.attack(s,enemy);assert.equal(s.player.exp-before,6);assert(s.log[0].includes('6ポイントの経験値を得た。'));assert(s.log[0].includes('レベルが2に上がった！'));assert(Kiri.Animation.deathFrames(110).length>0);

// Arrow, wand and thrown item kills use the same reward path.
function rangedReward(action,itemId){const state=arena(),foe=target(state,'driftMoth',1),item=Kiri.Items.create(itemId,undefined,undefined,state.dungeonId),exp=foe.exp;state.inventory=[item];const result=Kiri.ItemActions.perform(action,state,item);assert.equal(state.player.exp,exp);assert(result.message.includes(exp+'ポイントの経験値を得た。'));return result;}
rangedReward('shoot','reedArrow');rangedReward('wave','thunderStaff');rangedReward('throw','nutBread');

// Guaranteed gold and category drops land on the defeated tile and report naturally.
const random=Math.random;Math.random=()=>0;s=arena();enemy=target(s,'mudBrute',1);enemy.dropRate=1;enemy.dropCategories=['gold'];Kiri.State.data=s;Kiri.Entities.attack(s,enemy);assert(s.groundItems.some(i=>i.category==='gold'));assert(s.log[0].includes('Gを落とした。'));
s=arena();enemy=target(s,'dozeBud',1);enemy.dropRate=1;enemy.dropCategories=['herb'];Kiri.State.data=s;Kiri.Entities.attack(s,enemy);assert.equal(s.groundItems.length,1);assert.equal(s.groundItems[0].category,'herb');assert(s.log[0].includes('を落とした。'));Math.random=random;

const html=fs.readFileSync('index.html','utf8');assert(html.includes('js/stage22-rewards.js'));
console.log('stage 22 smoke: enemy motion, shared EXP rewards, drops and death effects passed');
