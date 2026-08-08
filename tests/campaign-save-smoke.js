'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
const store={};
global.localStorage={getItem:key=>Object.prototype.hasOwnProperty.call(store,key)?store[key]:null,setItem:(key,value)=>{store[key]=String(value);},removeItem:key=>{delete store[key];}};
global.document={createElement:()=>({set textContent(v){this._text=v;},get innerHTML(){return this._text||'';}})};
global.Kiri={
  State:{data:null,save(){},load(){return false;},clearSave(){},migrate:value=>value},
  Mode:{current:()=> 'normal'},
  Dungeons:{get:id=>({id:id,name:{tutorialDungeon:'ちょっと不思議',normalDungeon:'不思議',mysteryDungeon:'もっと不思議'}[id]||id,shortName:id})}
};
function load(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
load('js/adventure-books.js');

function state(id,floor,turn){return{version:2,dungeonId:id,floor:floor,turn:turn,gameOver:false,player:{level:6,hp:17,maxHp:30,food:64,maxFood:100,power:7,maxPower:8,gold:88,equipment:{weapon:{id:'emberBlade',modifier:2},shield:null,ring:null},status:{sleep:0}},inventory:[{id:'nutBread',quantity:2}],enemies:[{id:'dewMote',x:4,y:5}],groundItems:[],traps:[],stairs:{x:9,y:9},map:[[1]],seen:{'0,0':1},log:['保存確認']};}

assert(Kiri.AdventureBooks.create(1));
Kiri.AdventureBooks.story().questAccepted=true;
Kiri.State.data=state('normalDungeon',5,42);
assert(Kiri.AdventureBooks.saveDungeon());
assert(Kiri.AdventureBooks.create(2));
Kiri.AdventureBooks.story().treasureChest.obtained=true;
Kiri.AdventureBooks.saveBase();

let slots=Kiri.AdventureBooks.slots();
assert(!slots[0].data.story.treasureChest.obtained,'slot 1 story stays independent');
assert(slots[1].data.story.treasureChest.obtained,'slot 2 keeps its own chest flag');
assert(slots[2].empty);

assert(!Kiri.AdventureBooks.select(1).error);
assert(Kiri.AdventureBooks.loadSelected());
assert.equal(Kiri.State.data.floor,5);
assert.equal(Kiri.State.data.turn,42,'loading does not advance the turn');
assert.equal(Kiri.State.data.inventory[0].quantity,2);
assert.equal(Kiri.State.data.player.equipment.weapon.modifier,2);

store.eternal_labyrinth_adventure_book_3='{broken';
slots=Kiri.AdventureBooks.slots();
assert(slots[2].error,'broken JSON is isolated to its slot');
assert(Kiri.AdventureBooks.remove(2));
assert(Kiri.AdventureBooks.slots()[0].data,'deleting slot 2 does not affect slot 1');

load('js/campaign.js');
const noChest={treasureChest:{obtained:false,opened:false}},closed={treasureChest:{obtained:true,opened:false}},opened={treasureChest:{obtained:true,opened:true}};
assert.equal(Kiri.Campaign.resolveDungeon('normalDungeon',noChest),'normalDungeon');
assert.equal(Kiri.Campaign.resolveDungeon('normalDungeon',closed),'normalDungeon');
assert.equal(Kiri.Campaign.resolveDungeon('normalDungeon',opened),'mysteryDungeon');
assert.equal(Kiri.Campaign.resolveDungeon('tutorialDungeon',opened),'tutorialDungeon');

console.log('campaign save smoke: three books, corruption isolation, exact resume and chest branch passed');
