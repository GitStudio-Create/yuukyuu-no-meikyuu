'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Kiri={};
function load(name){vm.runInThisContext(fs.readFileSync('js/'+name+'.js','utf8'),{filename:name});}
['config','progression','dungeons','enemy-catalog','spawns'].forEach(load);

const RUNS=Number(process.argv[2])||500;
const PROFILES={
  low:{label:'戦闘少なめ',initialKill:.50,turns:40,naturalKill:0},
  standard:{label:'標準',initialKill:.75,turns:75,naturalKill:.50},
  high:{label:'戦闘多め',initialKill:1,turns:110,naturalKill:.80}
};
const DUNGEONS={
  tutorialDungeon:{label:'ちょっと不思議',maxFloor:10,checkpoints:[5,10]},
  normalDungeon:{label:'不思議',maxFloor:27,checkpoints:[5,10,15,20,27]},
  mysteryDungeon:{label:'もっと不思議',maxFloor:99,checkpoints:[5,10,15,20,27,30,40,50,70,99]}
};
const BANDS=[[1,5],[6,10],[11,15],[16,20],[21,27],[28,40],[41,50],[51,70],[71,99]];
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function levelFor(exp){let level=1;while(level<Kiri.Progression.MAX_LEVEL&&exp>=Kiri.Progression.EXP_TABLE[level])level++;return level;}
function add(map,key,value){map[key]=(map[key]||0)+value;}
function bandFor(floor){const b=BANDS.find(([a,z])=>floor>=a&&floor<=z);return b?b[0]+'-'+b[1]+'F':null;}
function killEnemy(result,def,floor,profile,source,splitSensitivity,splitRandom){
  result.exp+=def.exp;add(result.enemyExp,def.name,def.exp);add(result.enemyKills,def.name,1);add(result.bandExp,bandFor(floor),def.exp);
  if(splitSensitivity&&def.specialAbility==='split'&&splitRandom()<(def.splitChance||0)&&splitRandom()<profile.initialKill){
    const cloneExp=Math.max(1,Math.floor(def.exp/4));
    result.exp+=cloneExp;add(result.enemyExp,def.name,cloneExp);add(result.enemyKills,def.name,1);add(result.bandExp,bandFor(floor),cloneExp);add(result.splitExtra,def.name,cloneExp);
  }
}
function simulate(dungeonId,profile,seed,options={}){
  const oldRandom=Math.random;Math.random=rng(seed);const splitRandom=rng(seed^0x5f3759df),dungeon=DUNGEONS[dungeonId],result={exp:0,points:{},bandExp:{},enemyExp:{},enemyKills:{},splitExtra:{}};
  try{
    for(let floor=1;floor<=dungeon.maxFloor;floor++){
      if(dungeon.checkpoints.includes(floor))result.points[floor]={exp:result.exp,level:levelFor(result.exp)};
      const spawnState={dungeonId,floor,enemies:[]};
      const initial=Kiri.Spawns.enemyCount(dungeonId,floor);
      for(let i=0;i<initial;i++){
        const def=Kiri.EnemyCatalog.pick(dungeonId,floor);
        if(Math.random()<profile.initialKill)killEnemy(result,def,floor,profile,'initial',options.splitSensitivity,splitRandom);
        else spawnState.enemies.push({definitionId:def.id});
      }
      if(options.natural!==false){
        const natural=Math.floor(profile.turns/Kiri.Spawns.nextInterval());
        for(let i=0;i<natural;i++){
          const def=Kiri.EnemyCatalog.pickForState(spawnState);
          if(Math.random()<profile.naturalKill)killEnemy(result,def,floor,profile,'natural',options.splitSensitivity,splitRandom);
          else spawnState.enemies.push({definitionId:def.id});
        }
      }
    }
    return result;
  }finally{Math.random=oldRandom;}
}
function median(values){const a=values.slice().sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function summarize(results,dungeon){
  const points={};for(const floor of dungeon.checkpoints){const rows=results.map(r=>r.points[floor]);points[floor]={avgLevel:rows.reduce((n,r)=>n+r.level,0)/rows.length,medianLevel:median(rows.map(r=>r.level)),minLevel:Math.min(...rows.map(r=>r.level)),maxLevel:Math.max(...rows.map(r=>r.level)),avgExp:rows.reduce((n,r)=>n+r.exp,0)/rows.length};}
  const aggregate=key=>{const out={};for(const r of results)for(const [name,value] of Object.entries(r[key]))add(out,name,value/results.length);return out;};
  return{points,bandExp:aggregate('bandExp'),enemyExp:aggregate('enemyExp'),enemyKills:aggregate('enemyKills'),splitExtra:aggregate('splitExtra')};
}
function runSet(dungeonId,profileKey,options={}){const dungeon=DUNGEONS[dungeonId],profile=PROFILES[profileKey],salt=(dungeonId.length*100000)+(profileKey.length*1000);return summarize(Array.from({length:RUNS},(_,i)=>simulate(dungeonId,profile,salt+i+1,options)),dungeon);}

assert.equal(Kiri.Progression.EXP_TABLE.length,37);
assert.equal(Kiri.Spawns.nextInterval(),50);
assert.equal(Kiri.EnemyCatalog.list.length,33);
const output={runs:RUNS,profiles:PROFILES,dungeons:{},standardNaturalComparison:{},splitSensitivity:{}};
for(const dungeonId of Object.keys(DUNGEONS)){
  output.dungeons[dungeonId]={};for(const profileKey of Object.keys(PROFILES))output.dungeons[dungeonId][profileKey]=runSet(dungeonId,profileKey);
  output.standardNaturalComparison[dungeonId]={withNatural:output.dungeons[dungeonId].standard,initialOnly:runSet(dungeonId,'standard',{natural:false})};
  output.splitSensitivity[dungeonId]=runSet(dungeonId,'standard',{splitSensitivity:true});
}
console.log(JSON.stringify(output,null,2));
