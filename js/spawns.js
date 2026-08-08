(function(K){
  'use strict';
  function range(a,b){return a+K.Util.rand(b-a+1);}
  function limit(id){return id==='tutorialDungeon'?6:id==='normalDungeon'?10:14;}
  function interval(id,floor){
    var fastest=Math.max(25,38-Math.floor(floor/5)),base=range(fastest,40),mode=K.Dungeons&&K.Dungeons.get(id);
    return Math.max(25,Math.min(40,Math.round(base*(mode&&mode.naturalSpawnMultiplier||1))));
  }
  K.Spawns={
    enemyCount:function(id,f){if(id==='tutorialDungeon')return f===1?range(2,3):f<=3?range(3,4):range(4,5);if(id==='normalDungeon')return f<=5?range(3,5):f<=15?range(4,6):range(5,8);return f<=15?range(4,6):f<=40?range(5,8):range(7,10);},
    maxEnemies:limit,
    nextInterval:function(floor,id){return interval(id||K.Config.defaultDungeon,floor);},
    policy:function(id,floor,currentTurn){var next=interval(id,floor);return{initialCount:this.enemyCount(id,floor),naturalSpawnInterval:next,nextSpawnTurn:(currentTurn||0)+next,maxEnemies:limit(id)};},
    findSpawnCell:function(state){for(var i=0;i<180;i++){var p=K.Map.freeCell(state,0);if(p&&K.Util.distance(p,state.player)>8&&!state.seen[K.Util.key(p.x,p.y)]&&K.Util.distance(p,state.stairs)>3)return p;}return null;},
    tryNaturalSpawn:function(state){var policy=state.spawnPolicy;if(!policy||state.turn<policy.nextSpawnTurn)return false;var next=interval(state.dungeonId,state.floor);policy.nextSpawnTurn=state.turn+next;policy.naturalSpawnInterval=next;if(state.enemies.length>=policy.maxEnemies)return false;var p=this.findSpawnCell(state);if(!p)return false;var def=K.EnemyCatalog.pickForState?K.EnemyCatalog.pickForState(state):K.EnemyCatalog.pick(state.dungeonId,state.floor);state.enemies.push(K.Entities.createEnemy(state.floor,p,K.Dungeons.get(state.dungeonId),def.id));K.State.addLog('遠くの回廊から、新たな気配が近づいた。');return true;}
  };
})(window.Kiri=window.Kiri||{});
