'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','dungeons','themes','items','state'].forEach(load);

let shown=null,confirmText='',closedConfirm=0,closedMenu=0,turns=0,oldCalled=0;
Kiri.UI={
  showItemDetails:(detail,actions)=>{shown={detail,actions};},
  showConfirm:text=>{confirmText=text;},
  closeConfirm:()=>{closedConfirm++;},
  closeItemMenu:()=>{closedMenu++;}
};
Kiri.Sound={play:()=>{}};
Kiri.Game={actions:{
  openItem:()=>true,
  pickup:()=>true,
  requestItemAction:()=>{oldCalled++;return true;},
  confirmItemAction:()=>{oldCalled++;return true;},
  cancelItemAction:()=>{closedConfirm++;return true;},
  closeItemDetails:()=>{closedMenu++;return true;}
},endTurn:()=>{turns++;}};
load('stage41-identify-selection');

function reset(inv){
  Kiri.State.data={inventory:inv,log:[]};
  shown=null;confirmText='';closedConfirm=0;closedMenu=0;turns=0;oldCalled=0;
}
function item(id){return Kiri.Items.create(id,undefined,undefined,'normalDungeon');}

let scroll=item('chargeScroll'),staffA=item('thunderStaff'),staffB=item('sleepStaff'),bread=item('nutBread');
staffA.charges=0;staffB.charges=2;reset([scroll,staffA,bread,staffB]);
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(shown.detail.name,'直す杖を選ぶ');
assert.deepStrictEqual(shown.actions.map(a=>a.id),['charge-target:inventory:1','charge-target:inventory:3']);

const random=Math.random;Math.random=()=>.99;
assert.equal(Kiri.Game.actions.requestItemAction('charge-target:inventory:1'),true);
assert(confirmText.includes('を直しますか？'));
assert.equal(Kiri.Game.actions.confirmItemAction(),true);
assert.equal(staffA.charges,3);
assert.equal(staffB.charges,2);
assert.equal(Kiri.State.data.inventory.includes(scroll),false);
assert.equal(turns,1);
assert(Kiri.State.data.log[0].includes('使用回数が3回復した。'));
Math.random=random;

scroll=item('chargeScroll');staffA=item('thunderStaff');staffB=item('thunderStaff');
staffA.charges=0;staffB.charges=0;staffB.identified=false;staffB.displayName='黒節の杖';staffB.chargesKnown=false;
reset([scroll,staffA,staffB]);
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
Kiri.Game.actions.requestItemAction('charge-target:inventory:2');
Math.random=()=>0;Kiri.Game.actions.confirmItemAction();Math.random=random;
assert.equal(staffA.charges,0);
assert.equal(staffB.charges,1);
assert.equal(staffB.identified,false);
assert.equal(staffB.chargesKnown,true);

scroll=item('chargeScroll');reset([scroll,item('nutBread'),item('moonHerb')]);
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(Kiri.State.data.inventory.includes(scroll),true);
assert.equal(turns,0);
assert(Kiri.State.data.log[0].includes('直せる杖を持っていない。'));

scroll=item('chargeScroll');staffA=item('thunderStaff');staffA.charges=5;staffA.maxCharges=5;reset([scroll,staffA]);
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
assert.equal(Kiri.Game.actions.requestItemAction('charge-target:inventory:1'),false);
assert.equal(staffA.charges,5);
assert.equal(Kiri.State.data.inventory.includes(scroll),true);
assert.equal(turns,0);

scroll=item('chargeScroll');staffA=item('thunderStaff');staffA.charges=0;reset([scroll,staffA]);
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
Kiri.Game.actions.requestItemAction('charge-target:inventory:1');
Kiri.Game.actions.cancelItemAction();
assert.equal(staffA.charges,0);
assert.equal(Kiri.State.data.inventory.includes(scroll),true);
assert.equal(turns,0);

scroll=item('identifyScroll');staffA=item('thunderStaff');staffA.identified=false;staffA.displayName='花紋の杖';reset([scroll,staffA]);
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(shown.detail.name,'識別する道具を選ぶ');

console.log('stage 41 charge selection smoke: staff target selection, consumption, cancel and identify compatibility passed');
