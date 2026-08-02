'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','dungeons','enemy-catalog'].forEach(load);

let floor11=Kiri.EnemyCatalog.tableFor('tutorialDungeon',11).map(e=>e.id);
assert(!floor11.includes('dewMote'));
assert(!floor11.includes('driftMoth'));
assert(floor11.length>0);
assert(floor11.every(id=>Kiri.EnemyCatalog.byId[id].floorRange[0]<=11&&Kiri.EnemyCatalog.byId[id].floorRange[1]>=11));

let normal11=Kiri.EnemyCatalog.tableFor('normalDungeon',11).map(e=>e.id);
assert.deepStrictEqual(floor11,normal11);

console.log('enemy floor range smoke: tutorial overflow floors use normal floor-appropriate enemy table');
