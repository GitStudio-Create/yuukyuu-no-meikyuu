(function(K){
  'use strict';
  var oldInit=K.UI.init,oldDraw=K.UI.draw,suspendScreen;
  function footItem(state){return state.groundItems.find(function(i){return i.x===state.player.x&&i.y===state.player.y;});}
  function drawGroundIcons(state){var canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');state.groundItems.forEach(function(item){if(!(state.seen[K.Util.key(item.x,item.y)]||state.vision.items))return;if(state.player.x===item.x&&state.player.y===item.y)return;if(state.enemies.some(function(e){return e.x===item.x&&e.y===item.y;}))return;K.ItemIcons.draw(ctx,item.category,item.x*K.Config.tile+1,item.y*K.Config.tile+1,18);});}
  function drawBagIcons(state){document.querySelectorAll('#inventory [data-item]').forEach(function(button){var index=Number(button.dataset.item),item=state.inventory[index],icon=document.createElement('canvas');if(!item)return;icon.width=20;icon.height=20;icon.className='bag-item-icon';icon.setAttribute('aria-hidden','true');button.insertBefore(icon,button.firstChild);K.ItemIcons.draw(icon.getContext('2d'),item.category,0,0,20);});}
  function updateFloorCommands(state){var item=footItem(state),pick=document.querySelector('[data-floor-pickup]'),stairs=document.querySelector('[data-floor-stairs]'),full=state.inventory.length>=K.Config.inventoryMax;if(pick){pick.disabled=!item;pick.classList.toggle('full',!!item&&full);pick.textContent=item?'拾う: '+K.Items.name(item):'拾う';}if(stairs)stairs.disabled=!(state.stairs&&state.player.x===state.stairs.x&&state.player.y===state.stairs.y);}
  K.UI.init=function(){oldInit.call(K.UI);suspendScreen=document.querySelector('#suspendScreen');};
  K.UI.draw=function(state){oldDraw.call(K.UI,state);drawGroundIcons(state);drawBagIcons(state);updateFloorCommands(state);};
  K.UI.showSuspend=function(){suspendScreen.classList.remove('hidden');document.querySelector('[data-resume]').focus();};
  K.UI.closeSuspend=function(){if(suspendScreen)suspendScreen.classList.add('hidden');};
  K.UI.isSuspendOpen=function(){return!!suspendScreen&&!suspendScreen.classList.contains('hidden');};
})(window.Kiri=window.Kiri||{});
