(function(K){'use strict';
var originalOpen=K.Game.actions.openItem,currentIndex=-1,pendingAction=null;
function valid(index){return index>=0&&index<K.State.data.inventory.length;}
K.Game.actions.openItem=function(index){if(!valid(index))return false;currentIndex=index;originalOpen(index);var item=K.State.data.inventory[index];K.UI.showItemDetails(K.ItemDetails.forItem(item),K.ItemActions.actionsFor(item));K.UI.hideTooltip();return true;};
K.Game.actions.previewItem=function(index,x,y){if(!valid(index))return;var item=K.State.data.inventory[index];K.UI.showTooltip(K.ItemDetails.forItem(item),K.ItemActions.actionsFor(item),x,y);};
K.Game.actions.hideItemPreview=function(){K.UI.hideTooltip();};
K.Game.actions.requestItemAction=function(action){if(!valid(currentIndex))return false;pendingAction=action;K.UI.showConfirm(K.ItemDetails.prompt(K.State.data.inventory[currentIndex],action));return true;};
K.Game.actions.confirmItemAction=function(){if(!pendingAction)return false;var action=pendingAction;pendingAction=null;K.UI.closeConfirm();K.Game.actions.itemAction(action);K.UI.closeItemMenu();currentIndex=-1;return true;};
K.Game.actions.cancelItemAction=function(){pendingAction=null;K.UI.closeConfirm();};
K.Game.actions.closeItemDetails=function(){pendingAction=null;currentIndex=-1;K.UI.closeConfirm();K.UI.closeItemMenu();};
K.Game.actions.inventoryCount=function(){return K.State.data.inventory.length;};
K.Game.actions.selectInventory=function(index,focused){K.UI.setInventorySelection(index,focused);};
})(window.Kiri=window.Kiri||{});
