(function(K){
  'use strict';
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){return oldPerform.apply(this,arguments);};
  var actions=K.Game.actions,oldPickup=actions.pickup,oldSuspend=actions.suspend,oldResume=actions.resume;
  ['move','run','face','attack','shootArrow','step','openItem','itemAction','toggleStatus','descend'].forEach(function(name){var old=actions[name];if(!old)return;actions[name]=function(){if(K.UI.isSuspendOpen&&K.UI.isSuspendOpen())return false;return old.apply(this,arguments);};});
  actions.pickup=function(){var result=oldPickup.apply(this,arguments);if(result&&K.Sound)K.Sound.play('itemUse');return result;};
  actions.suspend=function(){if(K.Sound)K.Sound.play('menuOpen');return oldSuspend.apply(this,arguments);};
  actions.resume=function(){if(K.Sound)K.Sound.play('menuCancel');return oldResume.apply(this,arguments);};
})(window.Kiri=window.Kiri||{});
