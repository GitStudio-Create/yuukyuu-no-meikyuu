'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
load('js/config.js');load('js/map.js');
function seed(value,fn){let n=String(value).split('').reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,2166136261),old=Math.random;Math.random=function(){n=(n*1664525+1013904223)>>>0;return n/4294967296;};try{return fn();}finally{Math.random=old;}}
function reachable(g){
  const start=g.rooms[0],map=g.tiles,seen=new Set([start.cx+','+start.cy]),q=[[start.cx,start.cy]];
  while(q.length){const [x,y]=q.shift();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy,k=nx+','+ny;if(ny>=0&&ny<map.length&&nx>=0&&nx<map[0].length&&map[ny][nx]&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}});}
  return seen;
}
function validate(g,type){
  assert(g.rooms.length>=2,type+' room count');
  assert(Kiri.Map.validateGenerated(g),type+' generated validation');
  const seen=reachable(g);
  g.rooms.forEach(r=>assert(seen.has(r.cx+','+r.cy),type+' disconnected room '+r.id));
  assert(!g.tiles[0].some(Boolean)&&!g.tiles.at(-1).some(Boolean)&&!g.tiles.some(row=>row[0]||row.at(-1)),type+' boundary leak');
  assert(g.terrainType&&g.terrainType.name,type+' terrain name');
}
['standard','horizontal','vertical','branch','bigMixed','perimeter'].forEach(type=>{
  for(let i=0;i<30;i++)validate(Kiri.Map.generate({floor:12,terrainType:type}),type);
});
assert.deepStrictEqual(Kiri.Map.terrainTableFor(1).map(x=>x.id),['standard','horizontal','vertical']);
assert(Kiri.Map.terrainTableFor(6).some(x=>x.id==='branch'));
assert(Kiri.Map.terrainTableFor(12).some(x=>x.id==='perimeter'));
const a=seed('same-seed',()=>Kiri.Map.generate({floor:18,dungeonId:'normalDungeon'}));
const b=seed('same-seed',()=>Kiri.Map.generate({floor:18,dungeonId:'normalDungeon'}));
assert.deepStrictEqual(a.tiles,b.tiles);
assert.deepStrictEqual(a.rooms,b.rooms);
assert.equal(a.terrainType.id,b.terrainType.id);
console.log('stage 35 smoke: terrain groups, validation and seeded maps passed');
