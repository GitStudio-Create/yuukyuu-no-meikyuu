(function(K){
  'use strict';
  function sleeping(state){return !!(state&&state.player&&state.player.status&&state.player.status.sleep>0);}
  var actions=K.Game.actions,oldShoot=actions.shootArrow;actions.shootArrow=function(){var state=K.State.data,arrow=state.player.equipment.arrow;if(!sleeping(state)&&arrow&&arrow.quantity>0&&!(K.ActionSequence&&K.ActionSequence.suppressLaunch))K.Animation.launch(state,'arrow',arrow);return oldShoot.apply(this,arguments);};
  var oldPerform=K.ItemActions.perform;K.ItemActions.perform=function(action,state,item){if(!(K.ActionSequence&&K.ActionSequence.suppressLaunch)){if(action==='wave')K.Animation.launch(state,'wand',item);else if(action==='shoot'&&!sleeping(state))K.Animation.launch(state,'arrow',item);else if(action==='throw')K.Animation.launch(state,'throw',item);}return oldPerform.apply(this,arguments);};
})(window.Kiri=window.Kiri||{});
