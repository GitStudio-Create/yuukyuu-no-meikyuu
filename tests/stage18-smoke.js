'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,id:1}];s.player.x=2;s.player.y=2;s.player.facingDirection={dx:1,dy:0};s.stairs={x:30,y:22};s.groundItems=[];s.enemies=[];s.traps=[];s.inventory=[];return s;}
function enemy(name,x,hp){return{name:name,x:x,y:2,hp:hp,maxHp:hp,power:2,defense:0,exp:1,status:{sleep:0,confuse:0,poison:0,bind:0}};}
function item(id,s){const i=Kiri.Items.create(id,undefined,undefined,s.dungeonId);s.inventory.push(i);return i;}
function damageIn(message,name){const match=message.match(new RegExp(name+'に(\\d+)(?:の)?ダメージ'));assert(match,message);return Number(match[1]);}

let s=arena(),arrow=item('reedArrow',s),foe=enemy('ぷるる',5,30),before=foe.hp;s.enemies=[foe];let result=Kiri.ItemActions.perform('shoot',s,arrow);assert(result.message.includes('ぷるる'));assert.equal(damageIn(result.message,'ぷるる'),before-foe.hp);
s=arena();arrow=item('reedArrow',s);result=Kiri.ItemActions.perform('shoot',s,arrow);assert(result.message.includes('撃ったが、外れた。'));
s=arena();arrow=item('pierceArrow',s);let a=enemy('灯コウモリ',4,30),b=enemy('石守り',7,30),ah=a.hp,bh=b.hp;s.enemies=[a,b];result=Kiri.ItemActions.perform('shoot',s,arrow);assert.equal(damageIn(result.message,a.name),ah-a.hp);assert.equal(damageIn(result.message,b.name),bh-b.hp);
s=arena();arrow=item('reedArrow',s);foe=enemy('小さな影',4,1);s.enemies=[foe];result=Kiri.ItemActions.perform('shoot',s,arrow);assert(result.message.includes('小さな影を倒した。'));

s=arena();let food=item('nutBread',s);foe=enemy('まどろみコウモリ',5,20);before=foe.hp;s.enemies=[foe];result=Kiri.ItemActions.perform('throw',s,food);assert.equal(damageIn(result.message,foe.name),before-foe.hp);
s=arena();let poison=item('poisonHerb',s);foe=enemy('ぷるる',5,4);s.enemies=[foe];result=Kiri.ItemActions.perform('throw',s,poison);assert(result.message.includes('ぷるるに5ダメージを与えた。'));assert(result.message.includes('ぷるるを倒した。'));
s=arena();let sleep=item('sleepHerb',s);foe=enemy('眠らず石',5,20);s.enemies=[foe];result=Kiri.ItemActions.perform('throw',s,sleep);assert(result.message.includes('眠らず石を眠らせた。'));
s=arena();food=item('nutBread',s);result=Kiri.ItemActions.perform('throw',s,food);assert(result.message.includes('外れて床に落ちた。'));assert(s.groundItems.includes(food));
s=arena();s.map[2][4]=0;food=item('nutBread',s);result=Kiri.ItemActions.perform('throw',s,food);assert(result.message.includes('壁に当たって床に落ちた。'));

s=arena();let wand=item('thunderStaff',s);foe=enemy('石守り',5,40);before=foe.hp;s.enemies=[foe];result=Kiri.ItemActions.perform('wave',s,wand);assert.equal(damageIn(result.message,foe.name),before-foe.hp);
s=arena();wand=item('sleepStaff',s);foe=enemy('灯コウモリ',5,30);s.enemies=[foe];result=Kiri.ItemActions.perform('wave',s,wand);assert(result.message.includes('灯コウモリを眠らせた。'));
s=arena();wand=item('slowStaff',s);foe=enemy('石守り',5,30);s.enemies=[foe];result=Kiri.ItemActions.perform('wave',s,wand);assert(result.message.includes('石守りを鈍足にした。'));
s=arena();wand=item('thunderStaff',s);result=Kiri.ItemActions.perform('wave',s,wand);assert(result.message.includes('振ったが、外れた。'));
s=arena();wand=item('thunderStaff',s);foe=enemy('深層の影',5,1);s.enemies=[foe];result=Kiri.ItemActions.perform('wave',s,wand);assert(result.message.includes('深層の影を倒した。'));

s=arena();foe=enemy('ぷるる',3,40);s.enemies=[foe];before=foe.hp;Kiri.State.data=s;Kiri.Entities.attack(s,foe);assert.equal(damageIn(s.log[0],foe.name),before-foe.hp);
s=arena();foe=enemy('ぷるる',3,1);s.enemies=[foe];Kiri.State.data=s;Kiri.Entities.attack(s,foe);assert(s.log[0].includes('ぷるるを倒した。'));
assert(fs.readFileSync('js/game.js','utf8').includes("S.addLog('攻撃は外れた。')"));

console.log('stage 18 smoke: actual damage, targets, misses, wall drops, effects and defeats passed');
