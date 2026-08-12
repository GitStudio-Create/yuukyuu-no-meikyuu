(function(K){
  'use strict';
  var SPAWN_RATE=.12,ITEM_MIN=10,ITEM_MAX=15,TRAP_MIN=3,TRAP_MAX=5;
  function randRange(a,b){return a+K.Util.rand(b-a+1);}
  function contains(room,x,y){return room&&x>=room.x&&x<room.x+room.w&&y>=room.y&&y<room.y+room.h;}
  function roomCells(room,inner){
    var cells=[];
    for(var y=room.y+(inner?1:0);y<room.y+room.h-(inner?1:0);y++)for(var x=room.x+(inner?1:0);x<room.x+room.w-(inner?1:0);x++)cells.push({x:x,y:y});
    return cells.length?cells:roomCells(room,false);
  }
  function blocked(state,x,y){
    return !K.Map.walkable(state,x,y)||
      (state.player.x===x&&state.player.y===y)||
      (state.stairs&&state.stairs.x===x&&state.stairs.y===y)||
      (state.groundItems||[]).some(function(i){return i.x===x&&i.y===y;})||
      (state.traps||[]).some(function(t){return t.x===x&&t.y===y;})||
      (state.enemies||[]).some(function(e){return e.x===x&&e.y===y;});
  }
  function freeCells(state,room){
    var inner=roomCells(room,true).filter(function(c){return !blocked(state,c.x,c.y);});
    if(inner.length>=22)return inner;
    return roomCells(room,false).filter(function(c){return !blocked(state,c.x,c.y);});
  }
  function roomIndex(state,room){return (state.rooms||[]).indexOf(room);}
  function eligibleRooms(state){
    if((state.floor||1)<3||(state.dungeonId==='tutorialDungeon'&&(state.floor||1)<=3))return[];
    var start=state.rooms&&state.rooms[0],stairs=state.stairs;
    return (state.rooms||[]).filter(function(room){
      var area=(room.w||0)*(room.h||0);
      if(room===start)return false;
      if(area<28)return false;
      if(stairs&&contains(room,stairs.x,stairs.y)&&area<36)return false;
      return freeCells(state,room).length>=18;
    });
  }
  function createEnemyCount(room){
    var area=(room.w||0)*(room.h||0);
    if(area<48)return randRange(6,8);
    if(area<96)return randRange(8,12);
    return Math.min(18,10+Math.floor(area/24)+K.Util.rand(3));
  }
  function takeCell(state,room){
    var cells=K.Util.shuffle(freeCells(state,room));
    return cells[0]||null;
  }
  function placeItems(state,room,count){
    var placed=0;
    for(var i=0;i<count;i++){
      if(K.ItemLimits&&!K.ItemLimits.canCreate(state))break;
      var p=takeCell(state,room);if(!p)break;
      var item=K.Items.randomForFloor(state.floor,p.x,p.y,state.dungeonId);
      if(item){state.groundItems.push(item);placed++;}
    }
    return placed;
  }
  function placeTraps(state,room,count){
    var placed=0;
    for(var i=0;i<count;i++){
      var p=takeCell(state,room);if(!p)break;
      state.traps.push(K.Traps.createRandom(state,p));placed++;
    }
    return placed;
  }
  function placeEnemies(state,room,count,mode,houseId){
    var placed=0;
    for(var i=0;i<count;i++){
      var p=takeCell(state,room);if(!p)break;
      var enemy=K.Entities.createEnemy(state.floor,p,mode);
      enemy.spawnSleep=true;
      enemy.awake=false;
      enemy.status=enemy.status||{};
      enemy.status.sleep=0;
      enemy.effectSleep=0;
      enemy.spawnSource='monsterHouse';
      enemy.monsterHouseId=houseId;
      state.enemies.push(enemy);placed++;
    }
    return placed;
  }
  function createInRoom(state,room,mode){
    var id='mh-'+state.floor+'-'+roomIndex(state,room),items=randRange(ITEM_MIN,ITEM_MAX),traps=randRange(TRAP_MIN,TRAP_MAX),enemies=createEnemyCount(room);
    room.isMonsterHouse=true;
    room.monsterHouseTriggered=false;
    room.monsterHouseId=id;
    var info={id:id,roomIndex:roomIndex(state,room),triggered:false,bgmActive:false,itemCount:0,trapCount:0,enemyCount:0};
    state.monsterHouse=info;
    info.itemCount=placeItems(state,room,items);
    info.trapCount=placeTraps(state,room,traps);
    info.enemyCount=placeEnemies(state,room,enemies,mode,id);
    return info;
  }
  function tryCreate(state,mode,options){
    options=options||{};
    state.monsterHouse=null;
    if((state.floor||1)<3||(state.dungeonId==='tutorialDungeon'&&(state.floor||1)<=3))return null;
    if(!options.force&&Math.random()>=SPAWN_RATE)return null;
    var rooms=eligibleRooms(state);
    if(!rooms.length)return null;
    var room=options.room||rooms[K.Util.rand(rooms.length)];
    return createInRoom(state,room,mode);
  }
  function currentRoom(state){
    var p=state.player;
    return (state.rooms||[]).find(function(r){return contains(r,p.x,p.y);})||null;
  }
  function trigger(state,room){
    var info=state.monsterHouse;
    if(!info||info.triggered||!room||!room.isMonsterHouse)return false;
    info.triggered=true;
    info.bgmActive=true;
    room.monsterHouseTriggered=true;
    (state.enemies||[]).forEach(function(enemy){
      if(enemy.monsterHouseId!==info.id)return;
      enemy.spawnSleep=false;
      enemy.effectSleep=0;
      enemy.awake=true;
      enemy.wokeOnTurn=(state.turn||0)+1;
      enemy.aiState='モンスターハウス起床';
    });
    K.State.addLog('モンスターハウスだ！');
    if(K.Audio&&K.Audio.setSpecial)K.Audio.setSpecial('monsterHouse');
    return true;
  }
  function checkEntry(state){
    var room=currentRoom(state);
    return trigger(state,room);
  }
  function normalize(state){
    if(!state)return state;
    if(!state.monsterHouse)return state;
    var room=(state.rooms||[])[state.monsterHouse.roomIndex];
    if(room){room.isMonsterHouse=true;room.monsterHouseId=state.monsterHouse.id;room.monsterHouseTriggered=!!state.monsterHouse.triggered;}
    return state;
  }
  K.MonsterHouse={SPAWN_RATE:SPAWN_RATE,tryCreate:tryCreate,force:function(state,mode,room){return tryCreate(state,mode,{force:true,room:room});},checkEntry:checkEntry,normalize:normalize,eligibleRooms:eligibleRooms};
})(window.Kiri=window.Kiri||{});
