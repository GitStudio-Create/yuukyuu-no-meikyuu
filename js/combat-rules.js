(function(K){
  'use strict';
  function roomAt(state,x,y){return state.rooms.find(function(r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;})||null;}
  function canDiagonalMeleeAttack(state,attacker,target){
    if(!attacker||!target)return false;
    var dx=target.x-attacker.x,dy=target.y-attacker.y;
    if(!dx||!dy)return true;
    var attackerRoom=roomAt(state,attacker.x,attacker.y),targetRoom=roomAt(state,target.x,target.y);
    return!!attackerRoom&&attackerRoom===targetRoom;
  }
  function canMeleeAttack(state,actor,target){
    var dx=target.x-actor.x,dy=target.y-actor.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))!==1)return false;
    return!dx||!dy||canDiagonalMeleeAttack(state,actor,target);
  }
  K.CombatRules={roomAt:roomAt,isRoomTile:function(state,x,y){return!!roomAt(state,x,y);},canDiagonalMeleeAttack:canDiagonalMeleeAttack,canMeleeAttack:canMeleeAttack};
})(window.Kiri=window.Kiri||{});
