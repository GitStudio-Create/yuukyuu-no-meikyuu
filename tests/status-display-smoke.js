'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function node(){return{textContent:'',innerHTML:'',style:{},children:[],classList:{add(){},remove(){},toggle(){}},removeChild(){this.children.pop();},get lastElementChild(){return this.children[this.children.length-1];},getContext(){return ctx;}};}
const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,save(){},restore(){},beginPath(){},arc(){},fill(){},fillRect(){},strokeRect(){},moveTo(){},lineTo(){},stroke(){},measureText:t=>({width:String(t).length*8}),fillText(){}};
const nodes={};
global.document={
  querySelector:q=>nodes[q]||(nodes[q]=node()),
  createElement:()=>({textContent:'',get innerHTML(){return this.textContent;}})
};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
load('config');
Kiri.Themes={forFloor:()=>({wall:'#000',floor:'#111',corridor:'#222',grid:'#333',name:'入口の迷宮'})};
Kiri.Items={name:()=>'',attackPower:()=>5,defensePower:()=>0};
Kiri.Dungeons={get:()=>({name:'入口の迷宮'})};
load('ui');
Kiri.UI.init();
const state={
  floor:1,floorTheme:'入口の迷宮',bgmThemeName:'',seen:{},map:Array.from({length:24},()=>Array(32).fill(0)),rooms:[],
  stairs:{x:30,y:22},traps:[],groundItems:[],enemies:[],inventory:[],vision:{},log:[],turn:0,dungeonId:'tutorialDungeon',
  player:{x:2,y:2,hp:24,maxHp:24,food:100,maxFood:100,power:8,maxPower:8,level:1,exp:0,gold:0,equipment:{},facingDirection:{dx:0,dy:1}}
};
Kiri.UI.draw(state);
assert.equal(nodes['#hpText'].textContent,'24/24');
assert.equal(nodes['#foodText'].textContent,'100/100');
assert.equal(nodes['#hpBar'].style.width,'100%');
assert.equal(nodes['#foodBar'].style.width,'100%');
state.player.hp=9;state.player.food=37;Kiri.UI.draw(state);
assert.equal(nodes['#hpText'].textContent,'9/24');
assert.equal(nodes['#foodText'].textContent,'37/100');
assert.equal(nodes['#hpBar'].style.width,'37.5%');
assert.equal(nodes['#foodBar'].style.width,'37%');
global.document.querySelectorAll=()=>[];
load('stage11-ui');
state.player.level=3;Kiri.UI.draw(state);
assert.equal(nodes['#levelText'].textContent,3);
console.log('status display smoke: HP, food, bars and level text update passed');
