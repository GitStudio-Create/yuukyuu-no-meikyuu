(function(K){
  'use strict';
  function play(name,variant){if(K.Sound)K.Sound.play(name,variant);}
  function levelUp(){play('levelUp');if(K.Fanfare)K.Fanfare.play();}
  function enemyHp(state){return state.enemies.reduce(function(n,e){return n+Math.max(0,e.hp);},0);}
  function hasWeapon(state){return !!(state&&state.player&&state.player.equipment&&state.player.equipment.weapon);}
  function attackVariant(state,miss){return hasWeapon(state)?(miss?'swordMiss':'swordAttack'):(miss?'unarmedMiss':'unarmedAttack');}
  function posList(state){return (state.enemies||[]).map(function(e){return e.x+','+e.y;}).join('|');}
  function playerPos(state){return state.player.x+','+state.player.y;}
  var oldAttack=K.Entities.attack;K.Entities.attack=function(state,enemy){var hp=enemy.hp,level=state.player.level,enemyPos=enemy.x+','+enemy.y;var result=oldAttack.apply(this,arguments);if(enemy.hp<hp){play('playerAttack',attackVariant(state,false));play('enemyDamage');}if(enemy.x+','+enemy.y!==enemyPos)play('warp');if(state.player.level>level)levelUp();return result;};
  var oldEnemyAct=K.Entities.enemyAct;K.Entities.enemyAct=function(state,enemy){var hp=state.player.hp,power=state.player.power,prevAi=enemy.aiState,result=oldEnemyAct.apply(this,arguments),specialAi=enemy.aiState;if(specialAi!==prevAi&&(specialAi==='にらみ'||specialAi==='杖術'))play('enemySpecial');if(state.player.power<power)play('poison');if(state.player.hp<hp){play('enemyAttack');play('playerDamage');}return result;};
  var oldTrap=K.Traps.applyPlayer;K.Traps.applyPlayer=function(state,trap){var hp=state.player.hp,power=state.player.power,before=playerPos(state),result=oldTrap.apply(this,arguments);if(!(result&&result.soundPlayed))play('trap');if(state.player.power<power&&!(result&&result.soundPlayed))play('poison');if(trap)delete trap._trapSoundPlayed;if(playerPos(state)!==before)play('warp');if(state.player.hp<hp)play('playerDamage');return result;};
  function herbSound(action,state,item,beforeHp,beforeMaxHp,beforePower){if(action!=='drink'||!item||item.category!=='herb')return false;if((item.effect==='heal25'||item.effect==='heal100')&&state.player.maxHp>beforeMaxHp){play('herbHpUp');return true;}if((item.effect==='heal25'||item.effect==='heal100')&&state.player.hp>beforeHp){play('herbHeal');return true;}if(item.effect==='powerMend'&&state.player.power>beforePower){play('powerRecover');return true;}return false;}
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){var before=enemyHp(state),level=state.player.level,pBefore=playerPos(state),eBefore=posList(state),hpBefore=state.player.hp,maxHpBefore=state.player.maxHp,powerBefore=state.player.power,result=oldPerform.apply(this,arguments);if(result&&result.success){var sound={throw:'throwItem',wave:'wand',shoot:'arrow',equip:'equip'}[action]||'itemUse';if(!herbSound(action,state,item,hpBefore,maxHpBefore,powerBefore))play(sound);if(playerPos(state)!==pBefore||posList(state)!==eBefore&&item&&item.effect==='warp')play('warp');if(enemyHp(state)<before)play('enemyDamage');if(state.player.level>level)levelUp();}return result;};
  var oldGameOver=K.UI.showGameOver;K.UI.showGameOver=function(){play('gameOver');return oldGameOver.apply(this,arguments);};
  var a=K.Game.actions;
  function wrap(name,before,after){var old=a[name];if(!old)return;a[name]=function(){if(before)before.apply(this,arguments);var result=old.apply(this,arguments);if(after)after.call(this,result);return result;};}
  var attackHpBefore=0,attackMaySound=false;
  wrap('attack',function(){var s=K.State.data;if(K.Sound&&K.Sound.markInput)K.Sound.markInput('attack');attackHpBefore=enemyHp(s);attackMaySound=!(K.Game.isInputLocked&&K.Game.isInputLocked())&&!(s.player.status&&s.player.status.sleep>0);},function(){if(attackMaySound&&enemyHp(K.State.data)===attackHpBefore)play('playerAttack',attackVariant(K.State.data,true));});
  var oldMove=a.move;a.move=function(){return oldMove.apply(this,arguments);};
  wrap('descend',null,function(result){if(result)play('stairs');});wrap('stayStairs',function(){play('menuCancel');});
  wrap('requestItemAction',null,function(result){if(result)play('menuSelect');});wrap('confirmItemAction',null,function(result){if(result)play('menuSelect');});wrap('cancelItemAction',function(){play('menuCancel');});wrap('closeItemDetails',function(){play('menuCancel');});
  var statusWasOpen=false;
  wrap('toggleStatus',function(){statusWasOpen=!!(K.UI&&K.UI.isStatusOpen&&K.UI.isStatusOpen());},function(result){play(statusWasOpen?'menuCancel':'menuOpen');});
})(window.Kiri=window.Kiri||{});
