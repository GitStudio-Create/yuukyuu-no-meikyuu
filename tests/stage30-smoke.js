'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','item-details','damage-descriptions','state','map','visibility','combat-rules','entities','animation','item-actions','stage23-combat','stage22-rewards'].forEach(load);

assert(Kiri.ItemDetails.description(Kiri.Items.create('blastScroll',0,0,'normalDungeon')).includes('ダメージ：20'));
assert(Kiri.ItemDetails.description(Kiri.Items.create('flameHerb',0,0,'normalDungeon')).includes('ダメージ：飲む 65～75 / 投げる 35～40'));
assert(Kiri.ItemDetails.description(Kiri.Items.create('reedArrow',0,0,'normalDungeon')).includes('矢の強さ：4'));
assert(Kiri.ItemDetails.description(Kiri.Items.create('ironArrow',0,0,'normalDungeon')).includes('矢の強さ：9'));
assert(Kiri.ItemDetails.description(Kiri.Items.create('pierceArrow',0,0,'normalDungeon')).includes('矢の強さ：9'));
assert(Kiri.ItemDetails.description(Kiri.Items.create('thunderStaff',0,0,'normalDungeon')).includes('ダメージ：22'));

function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:12,h:12,id:1}];s.player.x=2;s.player.y=2;s.player.facingDirection={dx:1,dy:0};s.enemies=[];s.groundItems=[];s.inventory=[];s.spawnPolicy={maxEnemies:10};Kiri.State.data=s;return s;}
function enemy(state,id,x,hp,exp){const e=Kiri.Entities.createEnemy(1,{x:x,y:2},Kiri.Dungeons.get(state.dungeonId),id);e.hp=hp;e.maxHp=hp;e.exp=exp;e.dropRate=0;e.spawnSleep=false;e.awake=true;state.enemies.push(e);return e;}

let s=arena(),a=enemy(s,'dewMote',4,10,2),b=enemy(s,'driftMoth',7,40,3),scroll=Kiri.Items.create('blastScroll');s.inventory=[scroll];let result=Kiri.ItemActions.perform('read',s,scroll);
assert.deepStrictEqual(result.messages.length,3);assert.equal(result.messages[0],'雷の紙片を使用した。');
assert(result.messages[1].includes(a.name+'に20のダメージを与えた。'+a.name+'を倒した。2ポイントの経験値を得た。'));
assert.equal(result.messages[2],b.name+'に20のダメージを与えた。');assert.equal(s.player.exp,2);assert(!s.inventory.includes(scroll));

// Newline-delimited action results become separate newest-first history entries.
const spans=[],box={scrollHeight:300,scrollTop:0,clientHeight:50,addEventListener(){}};
const message={parentElement:box,innerHTML:'',appendChild(node){spans.push(node);}};
global.document={querySelector:q=>q==='#message'?message:null,createElement:()=>({textContent:'',className:''})};
Kiri.UI={draw:()=>{spans.length=0;},init:()=>{},renderStage16Minimap:()=>{}};load('stage26-fixes');
Kiri.State.addLog(result.message);assert.equal(s.log[0],result.messages[2]);assert.equal(s.log[1],result.messages[1]);assert.equal(s.log[2],result.messages[0]);
Kiri.UI.draw(s);assert.equal(spans[0].textContent,result.messages[2]);assert.equal(spans[0].className,'latest');assert.equal(box.scrollTop,0);

const html=fs.readFileSync('index.html','utf8');assert(html.includes('js/damage-descriptions.js'));
console.log('stage 30 smoke: damage descriptions, per-enemy rewards and newest-first logs passed');
