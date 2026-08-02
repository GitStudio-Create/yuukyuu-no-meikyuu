'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','dungeons','themes','items','state'].forEach(load);

let shown=null,confirmText='',turns=0,oldCalled=0;
Kiri.UI={
  showItemDetails:(detail,actions)=>{shown={detail,actions};},
  showConfirm:text=>{confirmText=text;},
  closeConfirm:()=>{},
  closeItemMenu:()=>{}
};
Kiri.Sound={play:()=>{}};
Kiri.Game={actions:{
  openItem:()=>true,
  pickup:()=>true,
  requestItemAction:()=>{oldCalled++;return true;},
  confirmItemAction:()=>{oldCalled++;return true;},
  cancelItemAction:()=>true,
  closeItemDetails:()=>true
},endTurn:()=>{turns++;}};
load('stage41-identify-selection');

function item(id){return Kiri.Items.create(id,undefined,undefined,'normalDungeon');}
function reset(inv){
  Kiri.State.data={inventory:inv,groundItems:[],player:{equipment:{}},log:[],dungeonId:'normalDungeon'};
  shown=null;confirmText='';turns=0;oldCalled=0;
}

let scroll=item('foodScroll'),herb=item('moonHerb'),bread=item('nutBread'),spoiled=item('spoiledBread'),bigBread=item('bigBread'),weapon=item('emberBlade');
weapon.equipped=true;
reset([scroll,herb,bread,spoiled,bigBread,weapon]);
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(shown.detail.name,'食料に変える道具を選ぶ');
assert.deepStrictEqual(shown.actions.map(a=>a.id),['food-target:1','food-target:2','food-target:3','food-target:5']);
assert(shown.actions.some(a=>a.id==='food-target:2'&&a.label.includes('パン')));
assert(shown.actions.some(a=>a.id==='food-target:3'&&a.label.includes('くさったパン')));
assert(!shown.actions.some(a=>a.id==='food-target:4'));
assert.equal(shown.actions[3].disabled,true);
assert.equal(Kiri.Game.actions.requestItemAction('food-target:1'),true);
assert(confirmText.includes('食料に変えますか'));
assert.equal(Kiri.Game.actions.confirmItemAction(),true);
assert.equal(Kiri.State.data.inventory.some(i=>i===scroll),false);
assert.equal(Kiri.State.data.inventory[0].id,'bigBread');
assert.equal(Kiri.State.data.inventory.some(i=>i===weapon),true);
assert.equal(turns,1);
assert(Kiri.State.data.log.some(l=>l.includes('回復草を大きなパンに変えた。')));

scroll=item('foodScroll');bread=item('nutBread');spoiled=item('spoiledBread');bigBread=item('bigBread');reset([scroll,bread,spoiled,bigBread]);
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
assert.deepStrictEqual(shown.actions.map(a=>a.id),['food-target:1','food-target:2']);
Kiri.Game.actions.requestItemAction('food-target:2');
assert.equal(Kiri.Game.actions.confirmItemAction(),true);
assert.equal(Kiri.State.data.inventory[1].id,'bigBread');
assert.equal(Kiri.State.data.inventory.some(i=>i===bigBread),true);
assert(Kiri.State.data.log.some(l=>l.includes('くさったパンを大きなパンに変えた。')));

scroll=item('foodScroll');herb=item('moonHerb');reset([scroll,herb]);
Kiri.Game.actions.openItem(0);
Kiri.Game.actions.requestItemAction('read');
Kiri.Game.actions.requestItemAction('food-target:1');
Kiri.Game.actions.cancelItemAction();
assert.equal(Kiri.State.data.inventory.includes(scroll),true);
assert.equal(Kiri.State.data.inventory.includes(herb),true);
assert.equal(turns,0);

scroll=item('uncurseScroll');let cursedWeapon=item('emberBlade'),cleanRing=item('mightRing');
cursedWeapon.cursed=true;cursedWeapon.curseKnown=true;cursedWeapon.equipped=true;cleanRing.cursed=false;
reset([scroll,cursedWeapon,cleanRing]);
Kiri.State.data.player.equipment.weapon=cursedWeapon;
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(shown.detail.name,'呪いを消す道具を選ぶ');
assert.deepStrictEqual(shown.actions.map(a=>a.id),['uncurse-target:1']);
assert.equal(Kiri.Game.actions.requestItemAction('uncurse-target:1'),true);
assert(confirmText.includes('呪いを消しますか'));
assert.equal(Kiri.Game.actions.confirmItemAction(),true);
assert.equal(cursedWeapon.cursed,false);
assert.equal(cursedWeapon.curseKnown,true);
assert.equal(cursedWeapon.equipped,true);
assert.equal(Kiri.State.data.player.equipment.weapon,cursedWeapon);
assert.equal(Kiri.State.data.inventory.includes(scroll),false);
assert.equal(turns,1);

scroll=item('uncurseScroll');cleanRing=item('mightRing');cleanRing.cursed=false;reset([scroll,cleanRing]);
Kiri.Game.actions.openItem(0);
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(Kiri.State.data.inventory.includes(scroll),true);
assert.equal(turns,0);
assert(Kiri.State.data.log[0].includes('呪われた道具を持っていない。'));

// 床に置いた対象選択型の紙片も、道具袋から読む時と同じ対象選択へ進む。
let floorCleared=0;
scroll=item('identifyScroll');let unknownStaff=item('thunderStaff');unknownStaff.identified=false;unknownStaff.displayName='黒節の杖';
reset([unknownStaff]);
Kiri.State.data.player={x:2,y:2,equipment:{}};
Kiri.State.data.groundItems=[scroll];scroll.x=2;scroll.y=2;
Kiri.FloorItem={isOpen:()=>true,footItem:()=>scroll,clear:()=>{floorCleared++;}};
assert.equal(Kiri.Game.actions.requestItemAction('read'),false);
assert.equal(shown.detail.name,'識別する道具を選ぶ');
assert.equal(Kiri.Game.actions.requestItemAction('identify-target:0'),true);
assert.equal(Kiri.Game.actions.confirmItemAction(),true);
assert.equal(unknownStaff.identified,true);
assert.equal(Kiri.State.data.groundItems.includes(scroll),false);
assert.equal(floorCleared,1);
assert.equal(turns,1);

console.log('stage 41 scroll targets smoke: food and uncurse target selection, cancel and consumption passed');
