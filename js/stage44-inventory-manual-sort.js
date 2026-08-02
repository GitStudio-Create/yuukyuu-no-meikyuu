(function(K){
  'use strict';
  function canSort(){
    return !(K.Game&&K.Game.isInputLocked&&K.Game.isInputLocked())&&!(K.UI&&K.UI.isStairOpen&&K.UI.isStairOpen())&&!(K.UI&&K.UI.isStatusOpen&&K.UI.isStatusOpen());
  }
  function sortBag(){
    var s=K.State&&K.State.data;
    if(!s||!K.Inventory)return false;
    K.Inventory.manualSort(s);
    K.State.addLog('道具袋を整理した。');
    if(K.State.save)K.State.save();
    if(K.UI&&K.UI.draw)K.UI.draw(s);
    return true;
  }
  addEventListener('DOMContentLoaded',function(){
    addEventListener('keydown',function(e){
      if(e.key!=='r'&&e.key!=='R')return;
      if(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(!canSort())return;
      e.preventDefault();
      sortBag();
    },true);
    var button=document.querySelector('[data-inventory-sort]');
    if(button)button.addEventListener('click',function(e){e.preventDefault();if(canSort())sortBag();});
  });
})(window.Kiri=window.Kiri||{});
