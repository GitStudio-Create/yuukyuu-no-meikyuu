'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','item-actions','item-details'].forEach(load);

// Cumulative experience supports multi-level gains, caps at Lv37, and never raises strength.
assert.equal(Kiri.Progression.EXP_TABLE.length,37);
assert.equal(Kiri.Progression.MAX_LEVEL,37);
let p={level:1,exp:0,maxHp:24,hp:24,power:8,maxPower:8};
assert.deepStrictEqual(Kiri.Progression.addExp(p,9),[]);
assert.deepStrictEqual(Kiri.Progression.addExp(p,91),[2,3,4,5]);
assert.equal(p.exp,100);assert.equal(p.power,8);assert.equal(p.maxPower,8);
p.exp=999999;Kiri.Progression.applyLevels(p);assert.equal(p.level,37);assert.equal(Kiri.Progression.remaining(p),null);

// Stage 28 rules set base strength, herb behavior, hidden curse information and enemy rewards.
load('stage28-rules');
let s=Kiri.State.reset('normalDungeon');
assert.equal(s.player.power,8);assert.equal(s.player.maxPower,8);
function drink(id){const item=Kiri.Items.create(id);s.inventory=[item];return Kiri.ItemActions.perform('drink',s,item);}
drink('poisonHerb');assert.equal(s.player.power,7);assert.equal(s.player.maxPower,8);
drink('powerMendHerb');assert.equal(s.player.power,8);assert.equal(s.player.maxPower,8);
drink('powerSeedHerb');assert.equal(s.player.power,9);assert.equal(s.player.maxPower,9);
const strength=[s.player.power,s.player.maxPower],beforeLevel=s.player.level;
drink('levelHerb');assert.equal(s.player.level,beforeLevel+1);assert.deepStrictEqual([s.player.power,s.player.maxPower],strength);

let weapon=Kiri.Items.create('mistSaber',undefined,undefined,'tutorialDungeon');
assert.equal(weapon.curseKnown,false);
assert(!Kiri.ItemDetails.forItem(weapon).metadata.some(row=>row.indexOf('呪い:')===0));
s.inventory=[weapon];Kiri.ItemActions.perform('equip',s,weapon);
assert.equal(weapon.curseKnown,true);
assert.equal(weapon.curseRevealedByEquip,true);
assert(Kiri.ItemDetails.forItem(weapon).metadata.some(row=>row.indexOf('呪い:')===0));
Kiri.ItemActions.perform('unequip',s,weapon);
assert(Kiri.ItemDetails.forItem(weapon).metadata.some(row=>row.indexOf('呪い:')===0));

assert.equal(Kiri.EnemyCatalog.list.length,25);
assert(Kiri.EnemyCatalog.list.every(enemy=>Number.isFinite(enemy.exp)&&enemy.exp>0));
assert(Kiri.EnemyCatalog.list.every(enemy=>Kiri.MonsterExp[enemy.id]===enemy.exp));
assert.equal(Kiri.EnemyCatalog.get('dewMote').name,'まるスライム');
assert.equal(Kiri.EnemyCatalog.get('wallWraith').name,'すりぬけ影');
assert.equal(Kiri.EnemyCatalog.get('reedSniper').exp,28);
assert.equal(Kiri.EnemyCatalog.get('wallWraith').exp,90);
assert.equal(Kiri.EnemyCatalog.get('emberHorn').exp,110);
assert.equal(Kiri.EnemyCatalog.get('frostCrown').exp,170);
assert.equal(Kiri.EnemyCatalog.get('wallWraith').dropRate,.12);
assert.equal(Kiri.EnemyCatalog.get('hungerShade').dropRate,.08);
assert.deepStrictEqual(Kiri.EnemyCatalog.get('hungerShade').dropCategories,['goodFood','scroll']);
assert.equal(Kiri.EnemyCatalog.get('dreamWisp').dropRate,.12);
s.enemies=[];s.spawnPolicy={maxEnemies:10};
let enemy=Kiri.Entities.createEnemy(1,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'dewMote');
enemy.dropRate=0;
s.enemies=[enemy];const expBefore=s.player.exp;
const reward=Kiri.Entities.rewardDefeat(s,enemy,true);
assert.equal(reward.exp,enemy.exp);assert.equal(s.player.exp,expBefore+enemy.exp);

// The status view labels total experience and shows the remaining amount / max state.
let open=false;
const statusGrid={innerHTML:''};
global.document={querySelector:q=>q==='#statusGrid'?statusGrid:q==='#power'?{textContent:''}:{getContext:()=>({})}};
Kiri.UI={draw:()=>{},toggleStatus:()=>{open=!open;},isStatusOpen:()=>open};
Kiri.EnemyRenderer={draw:()=>{}};
load('stage10-ui');load('stage28-ui');
Kiri.UI.toggleStatus(s);
assert(statusGrid.innerHTML.includes('累計経験値'));
assert(statusGrid.innerHTML.includes('次のレベルまで'));
s.player.level=Kiri.Progression.MAX_LEVEL;Kiri.UI.renderProgressionStatus(s);
assert(statusGrid.innerHTML.includes('最大'));

const html=fs.readFileSync('index.html','utf8');
assert(html.includes('js/progression.js'));assert(html.includes('js/stage28-rules.js'));assert(html.includes('js/stage28-ui.js'));
console.log('stage 28 smoke: curse discovery, cumulative EXP, strength rules, enemy EXP and status passed');
