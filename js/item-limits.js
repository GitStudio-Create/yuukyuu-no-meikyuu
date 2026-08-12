(function(K){
  'use strict';
  var FLOOR_TOTAL_MAX=45;
  function count(state){
    if(!state)return 0;
    var bag=(state.inventory||[]).length,ground=(state.groundItems||[]).length,held=(state.enemies||[]).reduce(function(n,e){return n+(e&&e.stolenItem?1:0);},0);
    return bag+ground+held;
  }
  function remaining(state){return Math.max(0,FLOOR_TOTAL_MAX-count(state));}
  function canCreate(state,amount){return remaining(state)>=Math.max(1,Math.floor(amount||1));}
  K.ItemLimits={floorTotalMax:FLOOR_TOTAL_MAX,count:count,remaining:remaining,canCreate:canCreate};
})(window.Kiri=window.Kiri||{});
