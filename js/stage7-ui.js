(function(K){
  'use strict';
  var originalInit=K.UI.init,originalDraw=K.UI.draw,nodes={},selectedItem=-1,selectedAction=0,currentActions=[];
  function esc(v){var d=document.createElement('div');d.textContent=v;return d.innerHTML;}
  function firstEnabled(actions){for(var i=0;i<actions.length;i++)if(!actions[i].disabled)return i;return 0;}
  function markItem(){document.querySelectorAll('#inventory [data-item]').forEach(function(b){b.classList.toggle('keyboard-selected',Number(b.dataset.item)===selectedItem);b.setAttribute('aria-selected',String(Number(b.dataset.item)===selectedItem));});}
  K.UI.init=function(){originalInit.call(K.UI);nodes={menu:document.querySelector('#itemMenu'),title:document.querySelector('#itemMenuTitle'),category:document.querySelector('#itemCategory'),description:document.querySelector('#itemDescription'),metadata:document.querySelector('#itemMetadata'),usage:document.querySelector('#itemUsage'),actions:document.querySelector('#itemActions'),confirm:document.querySelector('#confirmScreen'),confirmText:document.querySelector('#confirmText'),tooltip:document.querySelector('#itemTooltip'),tooltipTitle:document.querySelector('#tooltipTitle'),tooltipCategory:document.querySelector('#tooltipCategory'),tooltipDescription:document.querySelector('#tooltipDescription'),tooltipActions:document.querySelector('#tooltipActions')};};
  K.UI.draw=function(state){originalDraw.call(K.UI,state);markItem();};
  K.UI.showItemDetails=function(detail,actions){
    currentActions=actions;selectedAction=firstEnabled(actions);
    nodes.title.textContent=detail.name;nodes.category.textContent=detail.category;nodes.description.textContent=detail.description;
    nodes.metadata.innerHTML=detail.metadata.map(function(x){return'<span>'+esc(x)+'</span>';}).join('');
    nodes.usage.textContent='使用方法: '+detail.usage;
    nodes.actions.innerHTML=actions.map(function(a,i){return'<button data-item-action="'+a.id+'"'+(a.disabled?' disabled aria-disabled="true"':'')+(i===selectedAction?' class="selected"':'')+'>'+esc(a.label)+'</button>';}).join('')+'<button data-menu-cancel>キャンセル</button>';
    nodes.menu.classList.remove('hidden');
  };
  K.UI.showItemMenu=function(name,actions){K.UI.showItemDetails({name:name,category:'道具',description:'詳細を読み込んでいる。',metadata:[],usage:'行動を選択'},actions);};
  K.UI.closeItemMenu=function(){if(nodes.menu)nodes.menu.classList.add('hidden');currentActions=[];};
  K.UI.showConfirm=function(text){nodes.confirmText.textContent=text;nodes.confirm.classList.remove('hidden');document.querySelector('#confirmExecute').focus();};
  K.UI.closeConfirm=function(){if(nodes.confirm)nodes.confirm.classList.add('hidden');};
  K.UI.showTooltip=function(detail,actions,x,y){nodes.tooltipTitle.textContent=detail.name;nodes.tooltipCategory.textContent=detail.category;nodes.tooltipDescription.textContent=detail.description+(detail.metadata.length?' '+detail.metadata.join(' / '):'');nodes.tooltipActions.textContent='行動: '+actions.map(function(a){return a.label;}).join('・');nodes.tooltip.classList.remove('hidden');var rect=nodes.tooltip.getBoundingClientRect(),left=Math.min(x+14,window.innerWidth-rect.width-8),top=Math.min(y+14,window.innerHeight-rect.height-8);nodes.tooltip.style.left=Math.max(8,left)+'px';nodes.tooltip.style.top=Math.max(8,top)+'px';};
  K.UI.hideTooltip=function(){if(nodes.tooltip)nodes.tooltip.classList.add('hidden');};
  K.UI.setInventorySelection=function(index,focused){selectedItem=focused?index:-1;document.querySelector('.inventory-panel').classList.toggle('inventory-focused',focused);markItem();if(focused&&index>=0){var b=document.querySelector('#inventory [data-item="'+index+'"]');if(b)b.scrollIntoView({block:'nearest'});}};
  K.UI.selectAction=function(delta){if(!currentActions.length)return;for(var n=0;n<currentActions.length;n++){selectedAction=(selectedAction+delta+currentActions.length)%currentActions.length;if(!currentActions[selectedAction].disabled)break;}nodes.actions.querySelectorAll('[data-item-action]').forEach(function(b,i){b.classList.toggle('selected',i===selectedAction);});};
  K.UI.selectedAction=function(){var action=currentActions[selectedAction];return action&&!action.disabled&&action.id;};
  K.UI.inventoryColumns=function(){var grid=document.querySelector('#inventory'),style=getComputedStyle(grid);return style.gridTemplateColumns.split(' ').length||1;};
})(window.Kiri=window.Kiri||{});
