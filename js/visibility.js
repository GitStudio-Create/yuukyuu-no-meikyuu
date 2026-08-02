(function(K){
  'use strict';
  function roomAt(state,x,y){return state.rooms.find(function(r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;})||null;}
  function mark(object,x,y){if(x>=0&&y>=0&&x<K.Config.width&&y<K.Config.height)object[K.Util.key(x,y)]=1;}
  function lineOfSight(state,a,b){var x=a.x,y=a.y,dx=Math.abs(b.x-x),sx=x<b.x?1:-1,dy=-Math.abs(b.y-y),sy=y<b.y?1:-1,err=dx+dy;while(x!==b.x||y!==b.y){var e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}if(x===b.x&&y===b.y)return true;if(!K.Map.walkable(state,x,y))return false;}return true;}
  function update(state){var p=state.player,sight={},visible,mapped;if(state.mappedFloor!==state.floor){mapped=state.seen||{};state.mappedFloor=state.floor;}else mapped=state.mapped||state.seen||{};var room=roomAt(state,p.x,p.y);if(room){for(var y=room.y-1;y<=room.y+room.h;y++)for(var x=room.x-1;x<=room.x+room.w;x++){mark(sight,x,y);mark(mapped,x,y);}}else{for(var yy=p.y-1;yy<=p.y+1;yy++)for(var xx=p.x-1;xx<=p.x+1;xx++){mark(sight,xx,yy);mark(mapped,xx,yy);}}if(state.vision&&state.vision.mapAll){visible={};for(var ay=0;ay<K.Config.height;ay++)for(var ax=0;ax<K.Config.width;ax++){mark(visible,ax,ay);mark(mapped,ax,ay);}}else visible=sight;state.entityVisible=sight;state.visible=visible;state.mapped=mapped;state.seen=mapped;return visible;}
  function enemyCanSee(state,enemy,player){if(player&&player.status&&player.status.invisible>0)return false;var er=roomAt(state,enemy.x,enemy.y),pr=roomAt(state,player.x,player.y);if(er&&er===pr)return true;if(K.Util.distance(enemy,player)>8)return false;return lineOfSight(state,enemy,player);}
  function entitySight(state,x,y){var sight=state.entityVisible||state.visible;return!!(sight&&sight[K.Util.key(x,y)]);}
  function isMapped(state,x,y){return!!((state.mapped||state.seen||{})[K.Util.key(x,y)]);}
  function shouldShowItemOnMap(state,item){return!!(item&&((state.vision&&state.vision.items)||isMapped(state,item.x,item.y)||entitySight(state,item.x,item.y)));}
  function shouldShowTrapOnMap(state,trap){return!!(trap&&trap.revealed&&((state.vision&&state.vision.traps)||isMapped(state,trap.x,trap.y)||entitySight(state,trap.x,trap.y)));}
  K.Visibility={update:update,roomAt:roomAt,lineOfSight:lineOfSight,isVisible:function(state,x,y){return!!(state.visible&&state.visible[K.Util.key(x,y)]);},isEntityVisible:function(state,x,y){return entitySight(state,x,y);},shouldShowEnemyOnMap:function(state,enemy){return!!(enemy&&enemy.hp>0&&!enemy.rewarded&&((state.vision&&state.vision.enemies)||entitySight(state,enemy.x,enemy.y)));},shouldShowItemOnMap:shouldShowItemOnMap,shouldShowTrapOnMap:shouldShowTrapOnMap,isMapped:isMapped,enemyCanSee:enemyCanSee};
  K.Map.reveal=function(state){return update(state);};
})(window.Kiri=window.Kiri||{});
