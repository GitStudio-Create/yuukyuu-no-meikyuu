(function(K){
  'use strict';
  var EXP_TABLE=Object.freeze([0,10,30,60,100,150,230,350,500,700,950,1200,1500,1800,2300,3000,4000,6000,9000,15000,23000,33000,45000,60000,80000,100000,130000,180000,240000,300000,400000,500000,600000,700000,800000,900000,999999]),MAX_LEVEL=37;
  function threshold(level){return level>=MAX_LEVEL?null:EXP_TABLE[level];}
  function applyLevels(player){var levels=[];while(player.level<MAX_LEVEL&&player.exp>=EXP_TABLE[player.level]){var gain=3;player.level++;player.maxHp+=gain;player.hp=Math.min(player.maxHp,(player.hp||0)+gain);levels.push(player.level);}return levels;}
  K.Progression={EXP_TABLE:EXP_TABLE,MAX_LEVEL:MAX_LEVEL,nextThreshold:threshold,remaining:function(player){var next=threshold(player.level);return next===null?null:Math.max(0,next-player.exp);},addExp:function(player,amount){player.exp=Math.max(0,(player.exp||0)+Math.max(0,amount||0));return applyLevels(player);},applyLevels:applyLevels,grantNextLevel:function(player){var next=threshold(player.level);if(next===null)return[];player.exp=Math.max(player.exp||0,next);return applyLevels(player);}};
})(window.Kiri=window.Kiri||{});
