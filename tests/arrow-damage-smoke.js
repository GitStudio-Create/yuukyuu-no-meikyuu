'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','animation','item-actions','stage33-projectile-rules'].forEach(load);

function arena(level,power,weaponBonus,enemyDefense){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:32,h:24,id:1}];
  s.player.x=2;s.player.y=2;s.player.level=level;s.player.power=power;
  s.player.facingDirection={dx:1,dy:0};
  s.enemies=[{x:5,y:2,name:'試験石',hp:999,maxHp:999,defense:enemyDefense||0,exp:0,dropRate:0,status:{}}];
  s.groundItems=[];s.inventory=[];s.traps=[];s.spawnPolicy={maxEnemies:10};
  if(weaponBonus!==null&&weaponBonus!==undefined)s.player.equipment.weapon={bonus:weaponBonus};
  return s;
}
function reed(){const a=Kiri.Items.create('reedArrow',undefined,undefined,'normalDungeon');a.quantity=10;return a;}
function shootDamage(state){
  const random=Math.random;Math.random=()=>.5;
  try{
    const before=state.enemies[0].hp,arrow=reed();
    state.inventory=[arrow];
    Kiri.ItemActions.perform('shoot',state,arrow);
    return before-state.enemies[0].hp;
  }finally{Math.random=random;}
}

let s=arena(1,8,0,0),arrow=reed();
assert.equal(arrow.arrowStrength,4);
assert.equal(Kiri.Items.arrowAttackPower(s,arrow),4);
s=arena(14,8,0,0);assert.equal(Kiri.Items.baseAttackForLevel(14),46);assert.equal(Kiri.Items.arrowAttackPower(s,arrow),34);
s=arena(16,8,0,0);assert.equal(Kiri.Items.baseAttackForLevel(16),56);assert.equal(Kiri.Items.arrowAttackPower(s,arrow),42);

assert.equal(Kiri.Items.arrowAttackPower(arena(14,8,0,0),arrow),Kiri.Items.arrowAttackPower(arena(14,8,20,0),arrow));
assert.equal(Kiri.Items.arrowAttackPower(arena(14,8,0,0),arrow),Kiri.Items.arrowAttackPower(arena(14,4,0,0),arrow));
assert(shootDamage(arena(16,8,0,0))>shootDamage(arena(1,8,0,0)));
assert(shootDamage(arena(14,8,0,10))<shootDamage(arena(14,8,0,0)));

console.log('arrow damage smoke: arrow strength formula, rounding, level scaling and defense passed');
