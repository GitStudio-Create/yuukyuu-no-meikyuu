'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;

function classes(){return{values:new Set(),toggle(name,on){if(on)this.values.add(name);else this.values.delete(name);},contains(name){return this.values.has(name);}};}
function button(dir){return{dataset:dir?{dir}:{},classList:classes(),attributes:{},listeners:{},addEventListener(type,fn){(this.listeners[type]=this.listeners[type]||[]).push(fn);},setAttribute(name,value){this.attributes[name]=String(value);},fire(type){(this.listeners[type]||[]).forEach(fn=>fn({preventDefault(){},stopImmediatePropagation(){}}));}};}

const directionButtons=['N','S','W','E','NW','NE','SW','SE'].map(button);
const hooks={};
['[data-floor-pickup]','[data-floor-stairs]','[data-floor-step]','[data-floor-attack]','[data-floor-shoot]','[data-floor-face]','[data-floor-run]','[data-floor-diagonal]','[data-floor-status]','[data-floor-map]','[data-floor-map-only]','[data-floor-suspend]','[data-resume]'].forEach(selector=>hooks[selector]=button());
const itemMenu={classList:{contains:()=>true}},confirmScreen={classList:{contains:()=>true}};
global.document={addEventListener(){},querySelectorAll:selector=>selector==='[data-dir]'?directionButtons:[],querySelector:selector=>selector==='#itemMenu'?itemMenu:selector==='#confirmScreen'?confirmScreen:hooks[selector]};
const windowListeners={};global.addEventListener=(type,fn)=>{(windowListeners[type]=windowListeners[type]||[]).push(fn);};

let nextTimer=1,timers=new Map();
global.setTimeout=(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,ms});return id;};
global.clearTimeout=id=>timers.delete(id);
function next(ms){const match=[...timers.entries()].find(([,timer])=>timer.ms===ms);assert(match,'expected '+ms+'ms timer');timers.delete(match[0]);match[1].fn();}

let locked=false,moves=[];
global.Kiri={
  Directions:{N:[0,-1],S:[0,1],W:[-1,0],E:[1,0],NW:[-1,-1],NE:[1,-1],SW:[-1,1],SE:[1,1]},
  Input:{init(){},resetModes(){}},
  Game:{isInputLocked:()=>locked},
  UI:{isStairOpen:()=>false,isStatusOpen:()=>false,isSuspendOpen:()=>false,toggleFullMap(){},toggleMapOnly(){}},
  State:{data:{player:{x:0,y:0},stairs:{x:9,y:9}}}
};
vm.runInThisContext(fs.readFileSync('js/stage14-input.js','utf8'),{filename:'js/stage14-input.js'});
const actions={move:(dx,dy)=>moves.push([dx,dy]),face(){},run(){},pickup(){},step(){},attack(){},shootArrow(){},toggleStatus(){},suspend(){},resume(){}};
Kiri.Input.init(actions);

directionButtons[0].fire('pointerdown');
assert.deepStrictEqual(moves,[[0,-1]],'pointerdown moves immediately once');
assert.equal([...timers.values()][0].ms,200,'repeat begins after 200ms');
next(200);
assert.deepStrictEqual(moves,[[0,-1],[0,-1]],'first repeat occurs when the delay expires');
assert.equal([...timers.values()][0].ms,85,'later repeats use an 85ms interval');

locked=true;next(85);
assert.equal(moves.length,2,'turn-locked repeat is discarded');
assert.equal([...timers.values()][0].ms,85,'holding continues without queuing input');
locked=false;next(85);
assert.equal(moves.length,3,'movement resumes after the turn lock clears');

directionButtons[0].fire('pointerup');
assert.equal(timers.size,0,'pointerup stops all repeat timers');
directionButtons[7].fire('pointerdown');
assert.deepStrictEqual(moves.at(-1),[1,1],'diagonal buttons use the same repeat path');
directionButtons[7].fire('pointerleave');
assert.equal(timers.size,0,'pointerleave stops repeating');

directionButtons[1].fire('pointerdown');
directionButtons[2].fire('pointerdown');
assert.equal(timers.size,1,'a new press replaces the previous timer');
directionButtons[2].fire('pointercancel');
assert.equal(timers.size,0,'pointercancel stops repeating');
console.log('mobile direction repeat smoke: passed');
