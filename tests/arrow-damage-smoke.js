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
function arrow(id){const a=Kiri.Items.create(id,undefined,undefined,'normalDungeon');a.quantity=10;return a;}
function shootDamage(state,id='reedArrow',randomValue=.5){
  const random=Math.random;Math.random=()=>randomValue;
  try{
    const before=state.enemies[0].hp,shot=arrow(id);
    state.inventory=[shot];
    Kiri.ItemActions.perform('shoot',state,shot);
    return before-state.enemies[0].hp;
  }finally{Math.random=random;}
}

const expected={
  reedArrow:{strength:4,powers:{1:4,10:22,20:55,30:70}},
  ironArrow:{strength:12,powers:{1:6,10:36,20:93,30:118}},
  pierceArrow:{strength:12,powers:{1:6,10:36,20:93,30:118}}
};
Object.entries(expected).forEach(([id,data])=>{
  const shot=arrow(id);assert.equal(shot.arrowStrength,data.strength);
  Object.entries(data.powers).forEach(([level,power])=>assert.equal(Kiri.Items.arrowAttackPower(arena(Number(level),8,0,0),shot),power));
});

let s=arena(14,8,0,0),shot=arrow('ironArrow'),baseline=Kiri.Items.arrowAttackPower(s,shot);
assert.equal(baseline,Kiri.Items.arrowAttackPower(arena(14,4,20,0),shot));
s=arena(14,20,99,0);s.player.maxPower=20;s.player.equipment.ring={effect:'maxPower'};
assert.equal(baseline,Kiri.Items.arrowAttackPower(s,shot));
assert(shootDamage(arena(16,8,0,0))>shootDamage(arena(1,8,0,0)));
assert(shootDamage(arena(14,8,0,10))<shootDamage(arena(14,8,0,0)));
assert.equal(shootDamage(arena(10,8,0,0),'ironArrow',.01),35);
assert.equal(shootDamage(arena(10,8,0,0),'ironArrow',.5),36);
assert.equal(shootDamage(arena(10,8,0,0),'ironArrow',.99),37);
assert.equal(shootDamage(arena(1,8,0,999),'reedArrow',.01),1);

console.log('arrow damage smoke: all arrow strengths, level scaling, independence, variance, defense and minimum damage passed');
