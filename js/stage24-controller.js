(function(K){
  'use strict';
  var actions=K.Game.actions,busy=false,suppress=false,pendingTimer=0,selectedItem=null;
  function projectileKind(action,item){if(action==='wave')return'wand';if(action==='throw')return'throw';if(action==='shoot')return'arrow';if(action==='drink'&&item&&item.effect==='flame')return'wand';return'';}
  function duration(state){var p=state.player,f=p.facingDirection||{dx:0,dy:1},steps=0;for(var n=1;n<=10;n++){var x=p.x+f.dx*n,y=p.y+f.dy*n;if(!K.Map.walkable(state,x,y))break;steps++;if(state.enemies.some(function(e){return e.x===x&&e.y===y;}))break;}return Math.max(70,steps*48)+140;}
  function begin(state,kind,item,complete){if(busy)return false;busy=true;K.Animation.launch(state,kind,item);pendingTimer=setTimeout(function(){pendingTimer=0;suppress=true;try{complete();}finally{suppress=false;busy=false;}},duration(state));return true;}
  var oldOpen=actions.openItem;actions.openItem=function(index){if(busy)return false;selectedItem=K.State.data.inventory[index]||null;return oldOpen.apply(this,arguments);};
  function sleeping(state){return !!(state&&state.player&&state.player.status&&state.player.status.sleep>0);}
  function turnLocked(){return !!(K.Game&&K.Game.isInputLocked&&K.Game.isInputLocked());}
  function prepayArrow(state,item){if(!item||item.category!=='arrow'||item.quantity<=1)return false;item.quantity--;if(K.UI&&K.UI.draw)K.UI.draw(state);return true;}
  var oldItemAction=actions.itemAction;actions.itemAction=function(action){var state=K.State.data,item=selectedItem,kind=projectileKind(action,item),prepaid=false;if(busy||turnLocked())return false;if(action==='shoot'&&sleeping(state))return oldItemAction.apply(this,arguments);if(!kind)return oldItemAction.apply(this,arguments);if(action==='shoot')prepaid=prepayArrow(state,item);return begin(state,kind,item,function(){if(prepaid)item.quantity++;oldItemAction.call(actions,action);});};
  var oldShoot=actions.shootArrow;actions.shootArrow=function(){var state=K.State.data,item=state.player.equipment.arrow,prepaid=false;if(busy||turnLocked())return false;if(sleeping(state))return oldShoot.apply(this,arguments);if(!item||item.quantity<=0)return oldShoot.apply(this,arguments);prepaid=prepayArrow(state,item);return begin(state,'arrow',item,function(){if(prepaid)item.quantity++;oldShoot.call(actions);});};
  ['move','run','face','attack','step','pickup','suspend','openItem','requestItemAction','confirmItemAction','toggleStatus','descend','stayStairs'].forEach(function(name){if(name==='openItem'||!actions[name])return;var old=actions[name];actions[name]=function(){if(busy)return false;return old.apply(this,arguments);};});
  K.ActionSequence={isBusy:function(){return busy;},get suppressLaunch(){return suppress;},flush:function(){if(!pendingTimer)return false;clearTimeout(pendingTimer);pendingTimer=0;var wasBusy=busy;busy=false;return wasBusy;}};
})(window.Kiri=window.Kiri||{});
