'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.addEventListener=()=>{};global.Kiri={};global.matchMedia=()=>({matches:true});
const store={eternal_labyrinth_mode:'gm'};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.document={querySelector:()=>null,body:{dataset:{appState:'DUNGEON'},classList:{toggle(){}}}};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','progression','spawns','dungeons','themes','enemy-catalog','state','stage8-state','stage10-state','stage15-state','items','inventory','item-details','map','visibility','combat-rules','entities','ui','gm-mode'].forEach(n=>load('js/'+n+'.js'));

assert.equal(Kiri.DEBUG_MODE,true);
assert.equal(Kiri.Mode.current(),'normal','stored GM mode is ignored after reload');
assert.equal(Kiri.GM.launcherVisible(),false,'GM launcher starts hidden');
let prevented=0,stopped=0,event={key:'G',ctrlKey:true,shiftKey:true,target:null,preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}};
assert(Kiri.GM.shortcut(event));assert(Kiri.GM.launcherVisible());assert.equal(prevented,1);assert.equal(stopped,1);
assert(Kiri.GM.shortcut(event));assert.equal(Kiri.GM.launcherVisible(),false);
assert.equal(Kiri.GM.shortcut({key:'G',ctrlKey:true,shiftKey:true,target:{closest:()=>true},preventDefault(){},stopImmediatePropagation(){}}),false,'text editing ignores the shortcut');

let s=Kiri.State.reset('normalDungeon');s.player.gold=123;Kiri.State.save();
assert(store.eternal_labyrinth_normal_save);assert(!store.eternal_labyrinth_gm_save);
const snapshot=JSON.stringify({floor:s.floor,hp:s.player.hp,food:s.player.food,gold:s.player.gold});
let bookDungeonSaves=0,bookBaseSaves=0;Kiri.AdventureBooks={saveDungeon(){bookDungeonSaves++;return true;},saveBase(){bookBaseSaves++;return true;}};
assert(Kiri.GM.openCurrent());assert.equal(Kiri.Mode.current(),'gm');assert(Kiri.GM.active());assert(store.eternal_labyrinth_gm_save);
s.player.gold=999;Kiri.State.save();assert.equal(JSON.parse(store.eternal_labyrinth_normal_save).player.gold,123);assert.equal(JSON.parse(store.eternal_labyrinth_gm_save).player.gold,999);
assert(Kiri.AdventureBooks.saveDungeon());assert(Kiri.AdventureBooks.saveBase());assert.equal(bookDungeonSaves,0);assert.equal(bookBaseSaves,0);
assert.equal(JSON.stringify({floor:JSON.parse(store.eternal_labyrinth_normal_save).floor,hp:JSON.parse(store.eternal_labyrinth_normal_save).player.hp,food:JSON.parse(store.eternal_labyrinth_normal_save).player.food,gold:JSON.parse(store.eternal_labyrinth_normal_save).player.gold}),snapshot);

let a,b;Kiri.GM.seeded('12345',()=>{a=Kiri.Map.generate();});Kiri.GM.seeded('12345',()=>{b=Kiri.Map.generate();});assert.deepStrictEqual(a.tiles,b.tiles);assert.deepStrictEqual(a.rooms,b.rooms);
global.matchMedia=()=>({matches:false});assert.equal(Kiri.GM.shortcut(event),false,'mobile input cannot reveal GM controls');assert.equal(Kiri.GM.openCurrent(),false,'mobile input cannot enter GM mode');

const gmSource=fs.readFileSync('js/gm-mode.js','utf8'),campaignSource=fs.readFileSync('js/campaign.js','utf8'),hungerSource=fs.readFileSync('js/stage40-floor-hunger-shortcuts.js','utf8');
assert(gmSource.includes('data-gm-turn-count')&&gmSource.includes('max="10000"')&&gmSource.includes('data-gm-turn-custom'),'arbitrary 1-10000 turn UI exists');
assert(gmSource.includes('setTimeout(chunk,0)'),'large turn batches yield to the browser');
assert(campaignSource.includes('<details class="gm-save-details">')&&campaignSource.includes('<summary>セーブデータ確認</summary>'),'save debug starts collapsed');
assert(!hungerSource.includes('data-gm-place-foot-item')&&!hungerSource.includes('data-gm-equip-leather'),'duplicate item controls removed from hunger section');

console.log('stage 31 smoke: hidden PC shortcut, mobile lockout, non-persistent mode and save separation passed');
