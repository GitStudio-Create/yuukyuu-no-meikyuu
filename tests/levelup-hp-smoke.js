'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
load('js/progression.js');

let player={level:1,exp:9,hp:10,maxHp:30,food:42};
let levels=Kiri.Progression.addExp(player,1);
assert.deepStrictEqual(levels,[2]);
assert.equal(player.maxHp,33);
assert.equal(player.hp,13);
assert.equal(player.food,42);

player={level:1,exp:9,hp:30,maxHp:30,food:17};
levels=Kiri.Progression.addExp(player,1);
assert.deepStrictEqual(levels,[2]);
assert.equal(player.maxHp,33);
assert.equal(player.hp,33);
assert.equal(player.food,17);

player={level:1,exp:0,hp:5,maxHp:30,food:88};
levels=Kiri.Progression.addExp(player,60);
assert.deepStrictEqual(levels,[2,3,4]);
assert.equal(player.maxHp,39);
assert.equal(player.hp,14);
assert.equal(player.food,88);

console.log('levelup hp smoke: HP increases only by max HP gain and food stays unchanged');
