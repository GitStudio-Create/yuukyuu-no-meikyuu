(function(K){
  'use strict';
  function clone(o){var n={};Object.keys(o).forEach(function(k){n[k]=o[k];});return n;}
  function plan(id,floor){
    if(id==='tutorialDungeon')return{items:floor<=3?7:floor<=7?6:7,traps:floor<=3?0:floor<=7?1:2,guaranteedHeal:floor<=3,guaranteedFood:floor<=2};
    if(id==='normalDungeon')return floor<=5?{items:7,traps:1,guaranteedHeal:true,guaranteedFood:floor<=3}:floor<=10?{items:7,traps:2,guaranteedHeal:false,guaranteedFood:false}:floor<=20?{items:8,traps:3,guaranteedHeal:false,guaranteedFood:false}:{items:8,traps:4,guaranteedHeal:false,guaranteedFood:false};
    return{items:floor<=10?7:8,traps:Math.min(5,2+Math.floor(floor/7)),guaranteedHeal:floor<=2,guaranteedFood:floor<=2};
  }
  function itemTable(id,floor){
    var table=clone(K.Dungeons.get(id).itemSpawnTable),support=['thunderStaff','slowStaff','sleepStaff','confuseStaff','blindStaff','invisibleStaff','warpStaff','blastScroll','trapScroll','mapScroll','enemyScroll','uncurseScroll'];
    if(floor>=11)support.forEach(function(k){table[k]=(table[k]||0)+2;});
    if(floor>=9)table.ironArrow=(table.ironArrow||0)+2;
    if(floor>=21){support.forEach(function(k){table[k]=(table[k]||0)+2;});table.moonHerb=(table.moonHerb||0)+4;table.starHerb=(table.starHerb||0)+3;table.nutBread=(table.nutBread||0)+3;table.bigBread=(table.bigBread||0)+2;table.ironArrow=(table.ironArrow||0)+2;table.pierceArrow=(table.pierceArrow||0)+2;}
    return table;
  }
  K.Balance={floorPlan:plan,itemTable:itemTable};
  K.Items.randomForFloor=function(f,x,y,dungeonId){return K.Items.create(K.Items.weightedId(itemTable(dungeonId,f)),x,y,dungeonId);};
})(window.Kiri=window.Kiri||{});
