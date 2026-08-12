(function(K){
  'use strict';
  function clone(o){var n={};Object.keys(o).forEach(function(k){n[k]=o[k];});return n;}
  function plan(id,floor){
    var items=5+K.Util.rand(3);
    if(id==='tutorialDungeon')return{items:items,traps:floor<=3?0:floor<=7?1:2,guaranteedHeal:floor<=3,guaranteedFood:floor<=2};
    if(id==='normalDungeon')return floor<=5?{items:items,traps:1,guaranteedHeal:true,guaranteedFood:floor<=3}:floor<=10?{items:items,traps:2,guaranteedHeal:false,guaranteedFood:false}:floor<=20?{items:items,traps:3,guaranteedHeal:false,guaranteedFood:false}:{items:items,traps:4,guaranteedHeal:false,guaranteedFood:false};
    return{items:items,traps:Math.min(5,2+Math.floor(floor/7)),guaranteedHeal:floor<=2,guaranteedFood:floor<=2};
  }
  function itemTable(id,floor){
    var table=clone(K.Dungeons.get(id).itemSpawnTable),support=['thunderStaff','slowStaff','sleepStaff','confuseStaff','blindStaff','invisibleStaff','warpStaff','blastScroll','trapScroll','mapScroll','enemyScroll','uncurseScroll'];
    if(floor>=5)table.beastBlade=3;
    if(floor>=15)table.magicBlade=2;
    if(floor>=25)table.dragonBlade=1;
    if(floor>=11)support.forEach(function(k){table[k]=(table[k]||0)+2;});
    if(floor>=9)table.ironArrow=(table.ironArrow||0)+2;
    if(floor>=21){support.forEach(function(k){table[k]=(table[k]||0)+2;});table.moonHerb=(table.moonHerb||0)+4;table.starHerb=(table.starHerb||0)+3;table.nutBread=(table.nutBread||0)+3;table.bigBread=(table.bigBread||0)+2;table.ironArrow=(table.ironArrow||0)+2;table.pierceArrow=(table.pierceArrow||0)+2;}
    return table;
  }
  K.Balance={floorPlan:function(id,floor){return clone(plan(id,floor));},itemTable:itemTable};
  K.Items.randomForFloor=function(f,x,y,dungeonId){return K.Items.create(K.Items.weightedId(itemTable(dungeonId,f)),x,y,dungeonId);};
})(window.Kiri=window.Kiri||{});
