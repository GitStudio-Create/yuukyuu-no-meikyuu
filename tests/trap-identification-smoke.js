const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.localStorage={_:{},getItem(k){return this._[k]||null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
function load(p){vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
['config','directions','progression','spawns','dungeons','themes','items','state','stage8-state','map','visibility','item-actions','traps','trap-renderer'].forEach(n=>load('js/'+n+'.js'));

function arena(){
  const s=Kiri.State.reset('normalDungeon');
  s.map=Array.from({length:24},()=>Array(32).fill(1));
  s.rooms=[{x:0,y:0,w:32,h:24,id:1}];
  s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.power=8;s.player.maxPower=8;s.player.food=100;
  s.player.status={sleep:0,confuse:0,haste:0};
  s.player.equipment=s.player.equipment||{};
  s.stairs={x:30,y:22,type:'down'};
  s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.visible={};s.mapped={};
  Kiri.Visibility.update(s);
  return s;
}
function ctx(){
  return{ops:[],save(){this.ops.push('save');},restore(){this.ops.push('restore');},beginPath(){this.ops.push('beginPath');},arc(){this.ops.push('arc');},fill(){this.ops.push('fill');},stroke(){this.ops.push('stroke');},moveTo(){this.ops.push('moveTo');},lineTo(){this.ops.push('lineTo');},fillText(t){this.ops.push('text:'+t);},strokeRect(){this.ops.push('strokeRect');},set fillStyle(v){this.ops.push('fillStyle:'+v);},set strokeStyle(v){this.ops.push('strokeStyle:'+v);},set lineWidth(v){this.ops.push('lineWidth:'+v);},set font(v){this.ops.push('font:'+v);},set textAlign(v){this.ops.push('textAlign:'+v);},set textBaseline(v){this.ops.push('textBaseline:'+v);}};
}

assert.equal(Object.keys(Kiri.Traps.definitions).length,9);

let hidden={id:'dreamSeal',x:2,y:2,revealed:false};
assert.equal(Kiri.TrapRenderer.knowledgeState(hidden),'hidden');
let discovered={id:'dreamSeal',x:2,y:2,revealed:true,identified:false};
assert.equal(Kiri.TrapRenderer.knowledgeState(discovered),'discovered');
assert.equal(Kiri.TrapRenderer.detail(discovered).name,'正体不明の罠');
assert(!Kiri.TrapRenderer.detail(discovered).description.includes('眠'));

let identified={id:'dreamSeal',x:2,y:2,revealed:true,identified:true};
assert.equal(Kiri.TrapRenderer.knowledgeState(identified),'identified');
assert.equal(Kiri.TrapRenderer.detail(identified).name,'眠り糸の印');
assert(Kiri.TrapRenderer.detail(identified).description.includes('眠'));

let s=arena(),trap={id:'mistNeedle',x:2,y:2,revealed:false,identified:false};
Kiri.Traps.applyPlayer(s,trap);
assert(trap.revealed);
assert(trap.identified);
assert.equal(s.player.hp,94);

s=arena();
let ring=Kiri.Items.create('safeRing',undefined,undefined,s.dungeonId);
ring.equipped=true;s.player.equipment.ring=ring;s.inventory=[ring];
trap={id:'mistNeedle',x:2,y:2,revealed:false,identified:false};
Kiri.Traps.applyPlayer(s,trap);
assert(trap.identified);
assert.equal(s.player.hp,100);

s=arena();
s.traps=[{id:'dreamSeal',x:3,y:3,revealed:false,identified:false}];
let scroll=Kiri.Items.create('trapScroll',undefined,undefined,s.dungeonId);
s.inventory=[scroll];
Kiri.ItemActions.perform('read',s,scroll);
assert(s.traps[0].revealed);
assert.equal(s.traps[0].identified,false);

let migrated=Kiri.State.migrate({dungeonId:'normalDungeon',floor:1,deepestFloor:1,vision:{},player:Kiri.State.fresh().player,inventory:[],groundItems:[],traps:[{x:1,y:1,id:'bileBloom',revealed:true}],rooms:[],enemies:[],log:[]});
assert.equal(migrated.traps[0].identified,false);

let a=ctx(),b=ctx();
Kiri.TrapRenderer.draw(a,{id:'dreamSeal',revealed:true,identified:true},0,0,32);
Kiri.TrapRenderer.draw(b,{id:'spiralMark',revealed:true,identified:true},0,0,32);
assert.notDeepStrictEqual(a.ops,b.ops);
let u=ctx();
Kiri.TrapRenderer.draw(u,{id:'dreamSeal',revealed:true,identified:false},0,0,32);
assert(u.ops.some(op=>String(op).includes('#bd55d9')));

console.log('trap identification smoke: passed');
