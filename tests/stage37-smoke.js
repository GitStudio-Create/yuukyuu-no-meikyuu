'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.addEventListener=(type,fn)=>{listeners['window:'+type]=fn;};
global.performance={now:()=>0};
let listeners={};
function elem(id){return document.nodes[id]||(document.nodes[id]=makeNode(id));}
function makeNode(id){
  return{ id, textContent:'', innerHTML:'', value:'', className:'', style:{}, dataset:{}, children:[],
    classList:{classes:new Set(),add(c){this.classes.add(c);},remove(c){this.classes.delete(c);},toggle(c,on){if(on===undefined? !this.classes.has(c):on)this.classes.add(c);else this.classes.delete(c);},contains(c){return this.classes.has(c);}},
    setAttribute(){}, appendChild(n){this.children.push(n);}, addEventListener(type,fn){listeners[id+':'+type]=fn;},
    getBoundingClientRect(){return id==='game'?{left:0,top:0,width:320,height:240}:{width:180,height:80,left:0,top:0};},
    getContext(){return new Proxy({measureText:t=>({width:String(t).length*6}),save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},rect(){},ellipse(){},closePath(){},clearRect(){},fillRect(){},strokeRect(){},fillText(){}},{set:(o,k,v)=>(o[k]=v,true)});},
    closest(){return null;}, querySelector(){return null;}, querySelectorAll(){return[];}
  };
}
global.document={nodes:{},createElement:()=>makeNode('tmp'),querySelector(q){if(q==='#game'){let n=elem('game');n.width=640;n.height=480;return n;}return q[0]==='#'?elem(q.slice(1)):null;},querySelectorAll(){return[];}};
global.window.innerWidth=640;global.window.innerHeight=480;
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','spawns','dungeons','themes','enemy-catalog','items','inventory','state','map','visibility','combat-rules','entities','item-actions','item-details','stage33-projectile-rules'].forEach(load);
Kiri.UI={draw(){},toggleStatus(){this.open=!this.open;},isStatusOpen(){return !!this.open;},hideTooltip(){elem('itemTooltip').classList.add('hidden');},stage21RenderCamera(){return{x:0,y:0};}};
load('stage37-status-floor-items');
listeners['window:DOMContentLoaded']&&listeners['window:DOMContentLoaded']();
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.power=8;s.player.maxPower=8;s.player.maxFood=100;s.player.equipment={weapon:null,shield:null,ring:null};s.groundItems=[];s.enemies=[];s.traps=[];s.stairs={x:20,y:10,type:'down'};Kiri.Visibility.update(s);return s;}
let s=arena();
Kiri.UI.draw(s);
assert.equal(elem('weaponStrengthText').textContent,'0（攻撃力：5）');
assert.equal(elem('shieldStrengthText').textContent,'0（防御力：0）');
let weapon=Kiri.Items.create('mistSaber',undefined,undefined,s.dungeonId);weapon.modifier=2;weapon.bonus=weapon.basePower+2;weapon.equipped=true;s.player.equipment.weapon=weapon;
let shield=Kiri.Items.create('barkShield',undefined,undefined,s.dungeonId);shield.modifier=1;shield.bonus=shield.basePower+1;shield.equipped=true;s.player.equipment.shield=shield;
let ring=Kiri.Items.create('mightRing',undefined,undefined,s.dungeonId);ring.equipped=true;s.player.equipment.ring=ring;
s.player.level=10;
Kiri.UI.draw(s);
assert.equal(Kiri.EquipmentStats.weaponStrength(s),6);
assert.equal(Kiri.EquipmentStats.shieldStrength(s),3);
assert.deepStrictEqual(Kiri.Items.displayPower(s),{current:11,max:11,bonus:3});
assert.equal(elem('weaponStrengthText').textContent,'6（攻撃力：'+Kiri.Items.attackPower(s)+'）');
assert.equal(elem('shieldStrengthText').textContent,'3（防御力：'+Kiri.Items.defensePower(s)+'）');
assert.notEqual(Kiri.Items.attackPower(s),Kiri.EquipmentStats.weaponStrength(s),'攻撃力と剣の強さは別値');
assert.notEqual(Kiri.Items.defensePower(s),Kiri.EquipmentStats.shieldStrength(s)+999,'防御力は既存計算を使用');

Kiri.UI.toggleStatus(s);
Kiri.UI.draw(s);
const html=elem('statusGrid').innerHTML;
['階層','レベル','HP','満腹度','剣の強さ','盾の強さ','武器','盾','ちから','指輪','累計経験値','所持金','ターン数','状態異常','刀の呪い','盾の呪い','次のレベルまで'].forEach(label=>assert(html.includes(label)));
assert(html.includes('11/11'));
assert(html.indexOf('剣の強さ')<html.indexOf('武器'));
assert(html.includes('status-full-row'));

s=arena();let item=Kiri.Items.create('flameHerb',3,2,s.dungeonId);s.groundItems=[item];Kiri.Visibility.update(s);
listeners['game:pointermove']({pointerType:'mouse',clientX:3*16+3,clientY:2*16+3});
assert(!elem('itemTooltip').classList.contains('hidden'),'見えている床アイテムはホバー表示');
assert(elem('tooltipTitle').textContent.includes('火ふき草'));
listeners['game:pointermove']({pointerType:'mouse',clientX:18*16,clientY:12*16});
assert(elem('itemTooltip').classList.contains('hidden'),'別マスで消える');
s.groundItems=[Kiri.Items.create('nutBread',12,12,s.dungeonId)];s.visible={};listeners['game:pointermove']({pointerType:'mouse',clientX:12*16,clientY:12*16});
assert(elem('itemTooltip').classList.contains('hidden'),'視界外は表示しない');
listeners['game:pointermove']({pointerType:'touch',clientX:3*16,clientY:2*16});
assert(elem('itemTooltip').classList.contains('hidden'),'タッチではホバーしない');
console.log('stage 37 smoke: equipment strength status, ordered record and floor item hover passed');
