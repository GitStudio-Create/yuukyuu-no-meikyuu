'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
global.addEventListener=()=>{};
let now=1000;Date.now=()=>now+=30;
const played=[];
global.Audio=function(src){this.src=src;this.volume=0;this.currentTime=12;this.preload='';this.load=()=>{};this.play=()=>{played.push({src:this.src,volume:this.volume,currentTime:this.currentTime});return Promise.resolve();};};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
load('js/sound.js');
Kiri.Sound._setContext({});
[
  ['throwItem','物を投げる時の音.mp3'],
  ['warp','ワープ.mp3'],
  ['arrow','弓を射る音.mp3'],
  ['swordAttack','剣で斬る.mp3'],
  ['swordMiss','剣の空振り.mp3'],
  ['enemyDamage','自分や敵にダメージを与えた音.mp3'],
  ['playerDamage','自分や敵にダメージを与えた音.mp3'],
  ['unarmedAttack','素手で殴る.mp3'],
  ['equip','装備する音.mp3'],
  ['unarmedMiss','パンチの素振り.mp3'],
  ['menuCancel','キャンセルする音.mp3'],
  ['menuOpen','メニューを開く音.mp3'],
  ['menuSelect','決定した音.mp3'],
  ['itemUse','決定した音.mp3'],
  ['stairs','階段を上り下りする音.mp3']
].forEach(([name,file],index)=>{
  assert(fs.existsSync('BGM/SE/'+file),file);
  assert(Kiri.Sound.play(name),name);
  assert(played[index].src.includes('BGM/SE/'+file),name);
});
assert.equal(played.find(p=>p.src.includes('決定した音.mp3')).volume,played.find(p=>p.src.includes('メニューを開く音.mp3')).volume);
assert(played.every(p=>p.currentTime===0),'preloaded SE pool restarts sounds without creating playback delay');
Kiri.Sound.clearEvents();
assert(Kiri.Sound.play('playerAttack','swordAttack'));
assert.deepStrictEqual(Kiri.Sound.events(),['playerAttack']);
assert(played[played.length-1].src.includes('剣で斬る.mp3'));
const hooks=fs.readFileSync('js/sound-hooks.js','utf8');
['swordAttack','swordMiss','unarmedAttack','unarmedMiss','equip','warp','menuCancel','menuOpen','menuSelect','itemUse'].forEach(name=>assert(hooks.includes(name),name));
assert(hooks.includes("wrap('confirmItemAction'"));
assert(!hooks.includes("wrap('shootArrow'"),'arrow SE must wait for projectile arrival through ItemActions.perform');
assert(!hooks.includes('K.UI.selectAction=function(){play'));
Kiri.Entities={attack(){},enemyAct(){}};
Kiri.Traps={applyPlayer(){}};
Kiri.ItemActions={perform(){return {success:false};}};
let statusOpen=false;
Kiri.UI={showGameOver(){},isStatusOpen:()=>statusOpen};
Kiri.Game={actions:{
  attack(){},shootArrow(){return false;},descend(){return false;},stayStairs(){return true;},
  requestItemAction(){return true;},confirmItemAction(){return true;},cancelItemAction(){return true;},
  closeItemDetails(){return true;},toggleStatus(){statusOpen=!statusOpen;return true;}
}};
Kiri.Sound.clearEvents();
load('js/sound-hooks.js');
Kiri.Game.actions.toggleStatus();
Kiri.Game.actions.toggleStatus();
Kiri.Game.actions.confirmItemAction();
Kiri.Game.actions.cancelItemAction();
assert.deepStrictEqual(Kiri.Sound.events().slice(-4),['menuOpen','menuCancel','menuSelect','menuCancel']);
let bufferStarts=0;
const lowLatencyContext={state:'running',destination:{},createBufferSource:()=>({buffer:null,connect(){},start(when){assert.equal(when,0);bufferStarts++;}}),createGain:()=>({gain:{value:0},connect(){}})};
Kiri.Sound._setContext(lowLatencyContext);Kiri.Sound._setBuffer('swordAttack',{});Kiri.Sound.clearTimings();
Kiri.Sound.markInput('attack');Kiri.Sound.play('playerAttack','swordAttack');
const timing=Kiri.Sound.timings().pop();
assert.equal(bufferStarts,1,'decoded SE starts through a fresh AudioBufferSourceNode');
assert.equal(timing.backend,'webaudio');
assert(timing.called-timing.input<10,'attack input reaches playSE synchronously');
assert(timing.started-timing.called<10,'playSE reaches source.start synchronously');
assert(fs.readFileSync('js/sound.js','utf8').includes('decodeAudioData'));
console.log('system se mp3 smoke: SE files and MP3 mappings passed; input->play '+(timing.called-timing.input).toFixed(3)+'ms, play->start '+(timing.started-timing.called).toFixed(3)+'ms');
