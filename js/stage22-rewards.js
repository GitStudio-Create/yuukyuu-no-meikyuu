(function(K){
  'use strict';
  var mimic=K.EnemyCatalog.byId.shyShell;if(mimic){mimic.dropRate=1;mimic.dropCategories=['treasure'];}
  function rewardDead(state,enemies,includeDefeat){var messages=[];enemies.forEach(function(enemy){if(enemy.hp>0||enemy.rewarded)return;var reward=K.Entities.rewardDefeat(state,enemy,true);messages.push((includeDefeat?enemy.name+'を倒した。 ':'')+reward.text);});return messages;}
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){var enemies=state.enemies.slice(),result=oldPerform.apply(this,arguments),messages=rewardDead(state,enemies,false);if(result&&messages.length)result.message=(result.message?result.message+' ':'')+messages.join(' ');return result;};
  var oldTurns=K.Entities.takeEnemyTurns;K.Entities.takeEnemyTurns=function(state){var enemies=state.enemies.slice(),result=oldTurns.apply(this,arguments),messages=rewardDead(state,enemies,true);messages.forEach(function(message){K.State.addLog(message);});return result;};
})(window.Kiri=window.Kiri||{});
