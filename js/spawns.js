(function(K){
  'use strict';
  var NATURAL_SPAWN_ACTIONS=50,MAX_ENEMIES=30;
  function range(a,b){return a+K.Util.rand(b-a+1);}
  K.Spawns={
    enemyCount:function(id,f){if(id==='tutorialDungeon')return f===1?range(2,3):f<=3?range(3,4):range(4,5);if(id==='normalDungeon')return f<=5?range(3,5):f<=15?range(4,6):range(5,8);return f<=15?range(4,6):f<=40?range(5,8):range(7,10);},
    maxEnemies:function(){return MAX_ENEMIES;},
    nextInterval:function(){return NATURAL_SPAWN_ACTIONS;},
    policy:function(id,floor){return{initialCount:this.enemyCount(id,floor),naturalSpawnInterval:NATURAL_SPAWN_ACTIONS,spawnActionCount:0,nextSpawnAction:NATURAL_SPAWN_ACTIONS,maxEnemies:MAX_ENEMIES};},
    normalizePolicy:function(state){var p=state.spawnPolicy||(state.spawnPolicy=this.policy(state.dungeonId,state.floor));p.maxEnemies=MAX_ENEMIES;p.naturalSpawnInterval=NATURAL_SPAWN_ACTIONS;p.spawnActionCount=Math.max(0,Math.floor(p.spawnActionCount||0));p.nextSpawnAction=NATURAL_SPAWN_ACTIONS;return p;},
    recordAction:function(state){var p=this.normalizePolicy(state);p.spawnActionCount++;return p.spawnActionCount>=NATURAL_SPAWN_ACTIONS;},
    findSpawnCell:function(state){for(var i=0;i<180;i++){var p=K.Map.freeCell(state,0),visible=p&&K.Visibility&&K.Visibility.isVisible?K.Visibility.isVisible(state,p.x,p.y):p&&state.seen[K.Util.key(p.x,p.y)];if(p&&K.Util.distance(p,state.player)>8&&!visible&&K.Util.distance(p,state.stairs)>3)return p;}return null;},
    tryNaturalSpawn:function(state){var policy=this.normalizePolicy(state);if(policy.spawnActionCount<NATURAL_SPAWN_ACTIONS)return false;policy.spawnActionCount=0;if(state.enemies.length>=MAX_ENEMIES)return false;var p=this.findSpawnCell(state);if(!p)return false;var def=K.EnemyCatalog.pickForState?K.EnemyCatalog.pickForState(state):K.EnemyCatalog.pick(state.dungeonId,state.floor);state.enemies.push(K.Entities.createEnemy(state.floor,p,K.Dungeons.get(state.dungeonId),def.id));K.State.addLog('遠くの回廊から、新たな気配が近づいた。');return true;}
  };
})(window.Kiri=window.Kiri||{});
