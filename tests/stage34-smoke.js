'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
const listeners={};global.addEventListener=(type,fn)=>{listeners[type]=fn;};
const storage={};global.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]};
function load(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
load('js/config.js');load('js/spawns.js');load('js/dungeons.js');load('js/themes.js');load('js/enemy-catalog.js');load('js/items.js');load('js/state.js');load('js/map.js');load('js/visibility.js');load('js/combat-rules.js');load('js/entities.js');load('js/balance.js');

const old=Kiri.State.fresh();delete old.dungeonId;delete old.player.facingDirection;delete old.player.recoveryClock;old.inventory=[{id:'moonHerb'}];
storage[Kiri.Config.saveKey]=JSON.stringify(old);assert(Kiri.State.load());assert.deepStrictEqual(Kiri.State.data.player.facingDirection,{dx:0,dy:1});assert.equal(Kiri.State.data.dungeonId,'tutorialDungeon');assert.equal(Kiri.State.data.inventory[0].trueName,'回復草');

const required=['food','herb','scroll','staff','ring','weapon','shield','arrow'].sort();assert.deepStrictEqual([...new Set(Object.values(Kiri.Items.definitions).map(x=>x.category))].sort(),required);
const tutorial=Kiri.Items.create('mightRing',0,0,'tutorialDungeon');assert(tutorial.identified&&tutorial.curseKnown);
const normal=Kiri.Items.create('mightRing',0,0,'normalDungeon');assert(normal.identified&&!normal.curseKnown);
const mysteryHerb=Kiri.Items.create('moonHerb',0,0,'mysteryDungeon');assert(!mysteryHerb.identified&&mysteryHerb.displayName!==mysteryHerb.trueName);
const mysteryWeapon=Kiri.Items.create('emberBlade',0,0,'mysteryDungeon');assert(mysteryWeapon.identified&&!mysteryWeapon.curseKnown);
const staff=Kiri.Items.create('thunderStaff',0,0,'mysteryDungeon');assert(!staff.chargesKnown&&Kiri.Items.name(staff).includes('回数不明'));Kiri.Items.identify(staff);assert(Kiri.Items.name(staff).includes('残り'));

// The canvas renderer draws a short direction marker from the player center.
let facingLine=null;const context=new Proxy({lineTo:(x,y)=>{facingLine=[x,y];}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});const element={style:{},classList:{add:()=>{},remove:()=>{}}};
global.document={createElement:()=>({set textContent(v){this._v=v;},get innerHTML(){return this._v||'';}}),querySelector:q=>q==='#game'?{width:640,height:480,getContext:()=>context}:element};load('js/ui.js');Kiri.UI.init();
const render=Kiri.State.fresh();render.map=Array.from({length:24},()=>Array(32).fill(1));render.player.x=2;render.player.y=2;render.player.facingDirection={dx:1,dy:-1};render.seen={'2,2':1};render.stairs={x:3,y:3};Kiri.UI.draw(render);assert.deepStrictEqual(facingLine,[59,41]);

Kiri.UI={draw:()=>{},hideOverlay:()=>{},showGameOver:()=>{},showStairs:()=>{},closeStairs:()=>{}};Kiri.Input={resetModes:()=>{}};load('js/game.js');
function arena(){const s=Kiri.State.reset('tutorialDungeon');s.map=Array.from({length:5},()=>Array(5).fill(1));s.player.x=2;s.player.y=2;s.player.hp=20;s.enemies=[];s.groundItems=[];s.traps=[];s.stairs={x:4,y:4};s.seen={};return s;}
let s=arena();Kiri.Game.actions.face(1,-1);assert.deepStrictEqual(s.player.facingDirection,{dx:1,dy:-1});assert.equal(s.turn,0);assert.deepStrictEqual([s.player.x,s.player.y],[2,2]);
s.enemies=[{x:3,y:1,hp:20,maxHp:20,power:1,speed:1,energy:0,kind:0}];Kiri.Game.actions.attack();assert.equal(s.enemies[0].hp,20);assert(s.log.some(x=>x.includes('通路では斜めに通常攻撃できない')));assert.equal(s.turn,1);
s=arena();s.player.recoveryClock=2;Kiri.Game.actions.step();assert.equal(s.player.hp,20);assert.equal(s.turn,1);
s=arena();Kiri.Game.actions.move(1,-1);assert.deepStrictEqual([s.player.x,s.player.y],[3,1]);assert.equal(s.turn,1);

const calls=[];const fake=()=>({dataset:{},classList:{toggle:()=>{}},setAttribute:()=>{},addEventListener:()=>{}});global.document={querySelectorAll:()=>[],querySelector:()=>fake()};Kiri.UI.isStairOpen=()=>false;Kiri.UI.isStatusOpen=()=>false;load('js/input.js');
Kiri.Input.init({move:(x,y)=>calls.push(['move',x,y]),face:(x,y)=>calls.push(['face',x,y]),attack:()=>calls.push(['attack']),step:()=>calls.push(['step']),useItem:()=>{},newGame:()=>{}});
const event=(key,extra={})=>Object.assign({key,preventDefault:()=>{},shiftKey:false,ctrlKey:false},extra);
listeners.keydown(event('ArrowLeft',{shiftKey:true}));listeners.keyup(event('ArrowLeft'));listeners.keydown(event(' '));listeners.keydown(event('z'));listeners.keydown(event('ArrowUp',{ctrlKey:true}));listeners.keydown(event('ArrowRight',{ctrlKey:true}));
assert.deepStrictEqual(calls.slice(0,3),[['face',-1,0],['attack'],['step']]);assert.deepStrictEqual(calls[3],['move',1,-1]);
console.log('stage 3-4 smoke: save, actions, input and identification passed');
