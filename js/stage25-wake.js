(function(K){
  'use strict';
  var MISS_WAKE_CHANCE=.5;
  function sleeping(enemy){return!!(enemy.spawnSleep||enemy.awake===false||(enemy.effectSleep||0)>0||(enemy.status&&enemy.status.sleep>0));}
  function endpoint(state){var p=state.player,f=p.facingDirection||{dx:0,dy:1},last={x:p.x,y:p.y};for(var n=1;n<=10;n++){var x=p.x+f.dx*n,y=p.y+f.dy*n;if(!K.Map.walkable(state,x,y))break;last={x:x,y:y};if(state.enemies.some(function(e){return e.x===x&&e.y===y;}))break;}return last;}
  function wake(state,enemy,noise){if(!sleeping(enemy)||enemy.hp<=0||enemy.rewarded)return false;enemy.spawnSleep=false;enemy.effectSleep=0;enemy.awake=true;enemy.status=enemy.status||{};enemy.status.sleep=0;enemy.wokeOnTurn=state.turn+1;K.State.addLog((noise?'物音で':'')+enemy.name+'は目を覚ました。');return true;}
  function observe(state,before,result,landing,allowNoise){before.forEach(function(hit){if(hit.enemy.hp<hit.hp)wake(state,hit.enemy,false);});if(allowNoise&&result&&result.missed)before.forEach(function(hit){if(sleeping(hit.enemy)&&K.Util.distance(hit.enemy,landing)<=1&&Math.random()<MISS_WAKE_CHANCE)wake(state,hit.enemy,true);});return result;}
  function relevant(action,item){if(action==='shoot'||action==='throw')return true;if(action==='wave')return['thunder','sacrifice'].indexOf(item.effect)>=0;if(action==='drink')return item.effect==='flame';return false;}
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){if(!relevant(action,item))return oldPerform.apply(this,arguments);var before=state.enemies.filter(sleeping).map(function(enemy){return{enemy:enemy,hp:enemy.hp};}),landing=endpoint(state),result=oldPerform.apply(this,arguments);return observe(state,before,result,landing,action!=='drink');};
  var oldShoot=K.ItemActions.shootEquipped;K.ItemActions.shootEquipped=function(state){var before=state.enemies.filter(sleeping).map(function(enemy){return{enemy:enemy,hp:enemy.hp};}),landing=endpoint(state),result=oldShoot.apply(this,arguments);return observe(state,before,result,landing,true);};
  K.WakeRules={PROJECTILE_MISS_WAKE_CHANCE:MISS_WAKE_CHANCE,isSleeping:sleeping,wakeFromImpact:wake};
})(window.Kiri=window.Kiri||{});
