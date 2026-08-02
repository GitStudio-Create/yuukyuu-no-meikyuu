const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.innerWidth=900;global.innerHeight=700;
const listeners={};global.addEventListener=(t,f,opt)=>{(listeners[t]=listeners[t]||[]).push(f);};
const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
function load(file){vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});}
['config','directions','progression','spawns','dungeons','themes','items','item-details','state','stage8-state','map','visibility','combat-rules','enemy-catalog','entities','item-actions','traps','trap-renderer'].forEach(n=>load('js/'+n+'.js'));

function cls(){return{values:new Set(),add(v){this.values.add(v);},remove(v){this.values.delete(v);},toggle(v,on){if(on===undefined?!this.values.has(v):on)this.add(v);else this.remove(v);},contains(v){return this.values.has(v);}};}
function node(tag){
  const n={tagName:tag,children:[],dataset:{},style:{},classList:cls(),attributes:{},textContent:'',appendChild(c){this.children.push(c);return c;},setAttribute(k,v){this.attributes[k]=String(v);},getContext(){return fakeCtx();},addEventListener(){},querySelector(q){if(q==='#mapOnlyCanvas')return this._canvas;if(q==='[data-map-only-close]')return this._close;return null;}};
  Object.defineProperty(n,'innerHTML',{set(){n._canvas=node('canvas');n._close=node('button');},get(){return'';}});
  return n;
}
function fakeCtx(){return new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});}
const wrap=node('div'),pad=node('div'),statusButtons=[],body=node('body');
global.document={
  body,
  createElement:tag=>node(tag),
  querySelector(q){if(q==='.canvas-wrap')return wrap;if(q==='.action-pad')return pad;if(q==='#fullMapOverlay')return null;if(q==='#mapOnlyScreen')return null;return null;},
  querySelectorAll(q){return q==='[data-map-toggle]'||q==='[data-map-only-toggle]'?statusButtons:[];}
};

Kiri.UI={draw:function(){},init:function(){},renderStage16Minimap:function(){}};
load('js/stage32-ui-fixes.js');
let equippedArrow=Kiri.Items.create('reedArrow',undefined,undefined,'normalDungeon');
equippedArrow.equipped=true;
assert.deepStrictEqual(Kiri.ItemActions.actionsFor(equippedArrow).map(a=>a.label),['外す','撃つ','置く']);

function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(0));
  for(let y=1;y<6;y++)for(let x=1;x<8;x++)s.map[y][x]=1;
  for(let y=18;y<22;y++)for(let x=22;x<29;x++)s.map[y][x]=1;
  s.rooms=[{x:1,y:1,w:7,h:5,id:1},{x:22,y:18,w:7,h:4,id:2}];
  s.player.x=2;s.player.y=2;s.stairs={x:27,y:20,type:'down'};
  s.enemies=[Kiri.Entities.createEnemy(8,{x:24,y:19},Kiri.Dungeons.get('normalDungeon'),'dewMote')];
  s.groundItems=[Kiri.Items.create('moonHerb',25,19,s.dungeonId)];
  s.traps=[{x:26,y:19,id:'dreamSeal',revealed:false,identified:false}];
  s.inventory=[];s.seen={};s.mapped={};s.visible={};Kiri.Visibility.update(s);
  return s;
}

let s=arena(),data=Kiri.UI.floorMapData(s);
assert(data.tiles.some(t=>t.x===2&&t.y===2));
assert(!data.tiles.some(t=>t.x===24&&t.y===19));
assert.equal(data.enemies.length,0);
assert.equal(data.items.length,0);
assert.equal(data.traps.length,0);
assert.equal(data.stairs,null);

s.vision.enemies=true;
data=Kiri.UI.floorMapData(s);
assert.equal(data.enemies.length,1);
assert(!data.tiles.some(t=>t.x===24&&t.y===19));
assert.equal(data.items.length,0);

s=arena();
Kiri.ItemActions.perform('read',s,Kiri.Items.create('itemScroll',undefined,undefined,s.dungeonId));
data=Kiri.UI.floorMapData(s);
assert.equal(s.vision.items,true);
assert.equal(data.items.length,1);
assert(!data.tiles.some(t=>t.x===25&&t.y===19));
assert(Kiri.Visibility.shouldShowItemOnMap(s,s.groundItems[0]));

s=arena();
Kiri.ItemActions.perform('drink',s,Kiri.Items.create('sightHerb',undefined,undefined,s.dungeonId));
data=Kiri.UI.floorMapData(s);
assert.equal(s.vision.traps,true);
assert(s.traps.every(t=>t.revealed&&t.identified));
assert.equal(data.traps.length,1);
assert(!data.tiles.some(t=>t.x===26&&t.y===19));

s=arena();
Kiri.ItemActions.perform('read',s,Kiri.Items.create('mapScroll',undefined,undefined,s.dungeonId));
data=Kiri.UI.floorMapData(s);
assert(data.tiles.some(t=>t.x===24&&t.y===19));
assert.equal(data.enemies.length,0);
assert.equal(data.items.length,1);
assert.equal(data.traps.length,1);
assert(data.stairs);

Kiri.ItemActions.perform('read',s,Kiri.Items.create('enemyScroll',undefined,undefined,s.dungeonId));
data=Kiri.UI.floorMapData(s);
assert.equal(data.enemies.length,1);

listeners.DOMContentLoaded.forEach(f=>f());
assert.equal(Kiri.UI.isMapOnlyOpen(),false);
Kiri.UI.toggleMapOnly(true);
assert.equal(Kiri.UI.isMapOnlyOpen(),true);
let prevented=0,stopped=0;
listeners.keydown.forEach(f=>f({key:'ArrowRight',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;},target:null}));
assert(prevented>0&&stopped>0);
listeners.keydown.forEach(f=>f({key:'Escape',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;},target:null}));
assert.equal(Kiri.UI.isMapOnlyOpen(),false);
listeners.keydown.forEach(f=>f({key:'m',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;},target:null}));
assert(body.classList.contains('full-map-active'));
listeners.keydown.forEach(f=>f({key:'Escape',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;},target:null}));
assert(body.classList.contains('full-map-active'));
listeners.keydown.forEach(f=>f({key:'m',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;},target:null}));
assert(!body.classList.contains('full-map-active'));

console.log('map only smoke: passed');
