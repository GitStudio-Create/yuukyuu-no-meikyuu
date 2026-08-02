'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
load('js/config.js');load('js/map.js');
const count=Number(process.argv[2]||500);
const requested=process.argv[3];
const types=requested?[requested]:['standard','horizontal','vertical','branch','bigMixed','perimeter'];
const summary={count,types:{}};
for(const type of types){
  const row={generated:count,success:0,regenerated:0,finalFailures:0,reasons:{},problemSeeds:[]};
  for(let i=0;i<count;i++){
    const seed=`${type}-${i}`;
    let n=String(seed).split('').reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,2166136261);
    const old=Math.random;
    Math.random=function(){n=(n*1664525+1013904223)>>>0;return n/4294967296;};
    try{
      const g=Kiri.Map.generate({floor:12,terrainType:type,dungeonId:'normalDungeon'});
      const valid=Kiri.Map.validateGenerated(g)&&Kiri.Map.validateRoomEntrances(g);
      const stats=(g.debug&&g.debug.generationStats)||{};
      if(valid&&!stats.finalFailure)row.success++;
      else{row.finalFailures++;row.problemSeeds.push(seed);}
      row.regenerated+=stats.regenerations||0;
      Object.entries(stats.failureReasons||{}).forEach(([reason,num])=>{row.reasons[reason]=(row.reasons[reason]||0)+num;});
    }finally{Math.random=old;}
  }
  summary.types[type]=row;
}
Object.entries(summary.types).forEach(([type,row])=>{
  assert.equal(row.finalFailures,0,type+' final failures');
  assert.equal(row.success,row.generated,type+' success count');
});
console.log(JSON.stringify(summary,null,2));
