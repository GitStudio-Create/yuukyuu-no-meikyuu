(function(K){
  'use strict';
  var actions=K.Game.actions;
  function direction(){return K.State.data.player.facingDirection||{dx:1,dy:0};}
  var oldMove=actions.move;actions.move=function(dx,dy){var p=K.State.data.player,x=p.x,y=p.y,result=oldMove.apply(this,arguments);if(p.x!==x||p.y!==y){K.Animation.player('walk',220,{dx:dx,dy:dy,fromX:x,fromY:y,toX:p.x,toY:p.y});K.UI.draw(K.State.data);}return result;};
  var oldAttackAction=actions.attack;actions.attack=function(){K.Animation.player('attack',260,direction());return oldAttackAction.apply(this,arguments);};
  var oldArrow=actions.shootArrow;actions.shootArrow=function(){K.Animation.player('arrow',300,direction());return oldArrow.apply(this,arguments);};
  var oldEnemyAttack=K.Entities.attack;K.Entities.attack=function(state,enemy){var hp=enemy.hp;K.Animation.player('attack',260,direction());var result=oldEnemyAttack.apply(this,arguments);if(enemy.hp<hp)K.Animation.enemy(enemy,'damage',240);return result;};
  var oldEnemyAct=K.Entities.enemyAct;K.Entities.enemyAct=function(state,enemy){var hp=state.player.hp,x=enemy.x,y=enemy.y,result=oldEnemyAct.apply(this,arguments);if(state.player.hp<hp){K.Animation.enemy(enemy,'attack',240,{dx:state.player.x-enemy.x,dy:state.player.y-enemy.y});K.Animation.player('damage',300,{dx:enemy.x-state.player.x,dy:0});}else if(enemy.x!==x||enemy.y!==y)K.Animation.enemy(enemy,'walk',220,{dx:enemy.x-x,dy:enemy.y-y,fromX:x,fromY:y,toX:enemy.x,toY:enemy.y});return result;};
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){var before=new Map(state.enemies.map(function(e){return[e,e.hp];}));if(action==='wave')K.Animation.player('staff',340,direction());else if(action==='shoot')K.Animation.player('arrow',300,direction());var result=oldPerform.apply(this,arguments);before.forEach(function(hp,enemy){if(enemy.hp<hp)K.Animation.enemy(enemy,'damage',240);});return result;};
  var oldTrap=K.Traps.applyPlayer;K.Traps.applyPlayer=function(state,trap){var hp=state.player.hp,result=oldTrap.apply(this,arguments);if(state.player.hp<hp)K.Animation.player('damage',300,direction());return result;};
  var oldGameOver=K.UI.showGameOver;K.UI.showGameOver=function(){var args=arguments,self=this;K.Animation.player('death',1450,direction());setTimeout(function(){oldGameOver.apply(self,args);},1350);};
})(window.Kiri=window.Kiri||{});
