'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.addEventListener=()=>{};global.Kiri={};
const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.document={querySelector:()=>null,body:{classList:{toggle(){}}}};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','progression','spawns','dungeons','themes','enemy-catalog','state','stage8-state','stage10-state','stage15-state','items','inventory','item-details','map','visibility','combat-rules','entities','ui','gm-mode'].forEach(n=>load('js/'+n+'.js'));

assert.equal(Kiri.DEBUG_MODE,true);
assert.equal(Kiri.Mode.current(),'normal');
let s=Kiri.State.reset('normalDungeon');s.player.gold=123;Kiri.State.save();
assert(store.eternal_labyrinth_normal_save);
assert(!store.eternal_labyrinth_gm_save);

Kiri.Mode.set('gm');
s=Kiri.State.reset('tutorialDungeon');s.gmMode=true;s.player.gold=999;Kiri.State.save();
assert(store.eternal_labyrinth_gm_save);
assert.notEqual(JSON.parse(store.eternal_labyrinth_normal_save).player.gold,JSON.parse(store.eternal_labyrinth_gm_save).player.gold);

Kiri.Mode.set('normal');
assert(Kiri.State.load());
assert.equal(Kiri.State.data.player.gold,123);
assert.equal(Kiri.State.data.gmMode,false);
Kiri.Mode.set('gm');
assert(Kiri.State.load());
assert.equal(Kiri.State.data.player.gold,999);
assert.equal(Kiri.State.data.gmMode,true);

Kiri.Mode.set('normal');
s=Kiri.State.reset('normalDungeon');
s.floor=7;s.player.hp=13;s.player.food=44;s.player.gold=321;s.inventory=[Kiri.Items.create('moonHerb',undefined,undefined,'normalDungeon')];s.enemies=[{x:2,y:2,name:'テスト敵'}];
const snapshot=JSON.stringify({floor:s.floor,hp:s.player.hp,food:s.player.food,gold:s.player.gold,items:s.inventory.length,enemies:s.enemies.length});
Kiri.GM.openCurrent();
assert.equal(Kiri.Mode.current(),'gm');
assert.equal(Kiri.State.data.gmMode,true);
assert.equal(JSON.stringify({floor:Kiri.State.data.floor,hp:Kiri.State.data.player.hp,food:Kiri.State.data.player.food,gold:Kiri.State.data.player.gold,items:Kiri.State.data.inventory.length,enemies:Kiri.State.data.enemies.length}),snapshot);
assert(store.eternal_labyrinth_gm_save);

let a,b;
Kiri.GM.seeded('12345',()=>{a=Kiri.Map.generate();});
Kiri.GM.seeded('12345',()=>{b=Kiri.Map.generate();});
assert.deepStrictEqual(a.tiles,b.tiles);
assert.deepStrictEqual(a.rooms,b.rooms);

console.log('stage 31 smoke: GM mode save separation, mode switching and seeded generation passed');
