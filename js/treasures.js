(function(K){
  'use strict';
  var CONFIG={
    tutorialDungeon:[{floor:10,item:'trialTreasure',returning:true}],
    normalDungeon:[{fromFloor:27,item:'eternalTreasure',returning:true}],
    mysteryDungeon:[{fromFloor:27,item:'deepTreasure',returning:true},{floor:50,item:'moonTreasure',rank:'50F'},{floor:99,item:'abyssTreasure',rank:'99F'}]
  };
  function list(state){return CONFIG[state.dungeonId]||[];}
  function hasItem(state,id){
    return (state.inventory||[]).some(function(i){return i.id===id;})||(state.groundItems||[]).some(function(i){return i.id===id;});
  }
  function applies(entry,floor){return entry.floor===floor||(entry.fromFloor!==undefined&&floor>=entry.fromFloor);}
  function safeCell(state){
    var rooms=(state.rooms||[]).slice().reverse();
    for(var i=0;i<rooms.length;i++){
      var room=rooms[i];
      for(var y=room.y;y<room.y+room.h;y++)for(var x=room.x;x<room.x+room.w;x++)if(K.Map.walkable(state,x,y)&&!K.Map.occupied(state,x,y)&&!(state.traps||[]).some(function(trap){return trap.x===x&&trap.y===y;}))return{x:x,y:y};
    }
    for(var yy=0;yy<K.Config.height;yy++)for(var xx=0;xx<K.Config.width;xx++)if(K.Map.walkable(state,xx,yy)&&!K.Map.occupied(state,xx,yy)&&!(state.traps||[]).some(function(trap){return trap.x===xx&&trap.y===yy;}))return{x:xx,y:yy};
    for(var fy=0;fy<K.Config.height;fy++)for(var fx=0;fx<K.Config.width;fx++)if(K.Map.walkable(state,fx,fy)&&!(state.player.x===fx&&state.player.y===fy)&&!(state.stairs&&state.stairs.x===fx&&state.stairs.y===fy)&&!(state.enemies||[]).some(function(enemy){return enemy.x===fx&&enemy.y===fy;})&&!(state.traps||[]).some(function(trap){return trap.x===fx&&trap.y===fy;})){state.groundItems=state.groundItems.filter(function(item){return item.x!==fx||item.y!==fy;});return{x:fx,y:fy};}
    return null;
  }
  function placeForFloor(state){
    state.treasureState=state.treasureState||{returning:false,obtained:{},rank:{}};
    list(state).forEach(function(entry){
      if(!applies(entry,state.floor)||state.treasureState.obtained[entry.item]||hasItem(state,entry.item))return;
      var p=safeCell(state);
      if(p)state.groundItems.push(K.Items.create(entry.item,p.x,p.y,state.dungeonId));
    });
  }
  function onPickup(state,item){
    if(!item||item.category!=='treasure')return;
    state.treasureState=state.treasureState||{returning:false,obtained:{},rank:{}};
    state.treasureState.obtained[item.id]=true;
    var entry=list(state).find(function(e){return e.item===item.id;});
    if(entry&&entry.returning){
      state.treasureState.returning=true;
      if(state.stairs&&!state.stairs.disabled)state.stairs.type='up';else state.stairs={x:state.player.x,y:state.player.y,type:'up'};
      K.State.addLog(K.Items.name(item)+'を手に入れた。階段が地上へ戻る道に変わった。');
    }else if(entry&&entry.rank){
      state.treasureState.rank[entry.rank]=true;
      K.State.addLog(K.Items.name(item)+'を手に入れた。持ち帰れば記録に残る宝だ。');
    }
  }
  function isReturning(state){return !!(state&&state.treasureState&&state.treasureState.returning);}
  function resetFloorEffects(state){
    state.vision={traps:false,items:false,enemies:false,mapAll:false,mapOnly:false};
  }
  function clearMessage(state){
    var ranks=state.treasureState&&state.treasureState.rank?Object.keys(state.treasureState.rank).filter(function(k){return state.treasureState.rank[k];}):[];
    if(ranks.length){
      try{
        var key='eternal_labyrinth_treasure_ranking',list=JSON.parse(localStorage.getItem(key)||'[]');
        list.unshift({dungeonId:state.dungeonId,floor:state.floor,turn:state.turn,treasures:ranks,time:new Date().toISOString()});
        localStorage.setItem(key,JSON.stringify(list.slice(0,10)));
      }catch(e){}
    }
    return '宝を持ち帰り、悠久の迷宮から帰還した。'+(ranks.length?' 記録宝: '+ranks.join('、'):'');
  }
  K.Treasures={placeForFloor:placeForFloor,onPickup:onPickup,isReturning:isReturning,resetFloorEffects:resetFloorEffects,clearMessage:clearMessage,config:CONFIG};
})(window.Kiri=window.Kiri||{});
