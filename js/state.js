(function(K){
  'use strict';
  var C=K.Config;
  function fresh(dungeonId){
    var theme=K.Themes.forFloor(1);
    return {
      version:C.saveVersion,
      dungeonId:dungeonId||C.defaultDungeon,
      floor:1,
      deepestFloor:1,
      turn:0,
      floorTheme:theme.name,
      bgmThemeName:theme.bgmThemeName,
      vision:{traps:false,items:false,enemies:false,mapAll:false},
      identifiedItems:{},
      treasureState:{returning:false,obtained:{},rank:{}},
      player:{
        x:0,y:0,hp:24,maxHp:24,food:100,maxFood:100,power:8,maxPower:8,level:1,exp:0,gold:0,baseDefense:0,
        status:{sleep:0,confuse:0,haste:0,blind:0,invisible:0,slow:0},
        equipment:{weapon:null,shield:null,ring:null},
        facingDirection:{dx:0,dy:1,id:'S'},
        facing8:'S',
        recoveryClock:0,
        hungerClock:0
      },
      map:[],
      rooms:[],
      monsterHouse:null,
      stairs:null,
      crystalWalls:[],
      enemies:[],
      groundItems:[],
      traps:[],
      inventory:[],
      seen:{},
      log:['古い石扉の前で、冒険が始まる。'],
      gameOver:false
    };
  }
  function migrate(d){
    d.dungeonId=d.dungeonId||C.defaultDungeon;
    d.deepestFloor=Math.max(d.deepestFloor||1,d.floor||1);
    d.vision=d.vision||{};
    d.vision.traps=!!d.vision.traps;
    d.vision.items=!!d.vision.items;
    d.vision.enemies=!!d.vision.enemies;
    d.vision.mapAll=!!d.vision.mapAll;
    d.identifiedItems=d.identifiedItems||{};
    d.treasureState=d.treasureState||{returning:false,obtained:{},rank:{}};
    d.treasureState.obtained=d.treasureState.obtained||{};
    d.treasureState.rank=d.treasureState.rank||{};
    var p=d.player;
    p.facingDirection=p.facingDirection||{dx:0,dy:1,id:'S'};
    if(K.Direction8)K.Direction8.apply(p,p.facingDirection.dx,p.facingDirection.dy);
    p.recoveryClock=p.recoveryClock||0;
    p.hungerClock=p.hungerClock||0;
    p.level=p.level||1;
    p.exp=p.exp||0;
    p.gold=p.gold||0;
    p.maxFood=p.maxFood||100;
    p.maxPower=p.maxPower||p.power||8;
    p.baseDefense=p.baseDefense||0;
    p.status=p.status||{sleep:0,confuse:0,haste:0};
    p.status.sleep=p.status.sleep||0;p.status.confuse=p.status.confuse||0;p.status.haste=p.status.haste||0;p.status.blind=p.status.blind||0;p.status.invisible=p.status.invisible||0;p.status.slow=p.status.slow||0;
    p.equipment=p.equipment||{weapon:null,shield:null,ring:null};
    d.inventory=(d.inventory||[]).map(function(i){return K.Items.normalize(i,d.dungeonId);}).filter(Boolean);
    ['weapon','shield','ring','arrow'].forEach(function(slot){
      var saved=p.equipment[slot];
      if(!saved){p.equipment[slot]=null;return;}
      var match=d.inventory.find(function(i){return i.equipped&&i.id===saved.id;});
      p.equipment[slot]=match||K.Items.normalize(saved,d.dungeonId);
    });
    var theme=K.Themes.forFloor(d.floor||1);
    d.floorTheme=d.floorTheme||theme.name;
    d.bgmThemeName=d.bgmThemeName||theme.bgmThemeName;
    d.groundItems=(d.groundItems||[]).map(function(i){
      if(i&&i.category==='gold')return {id:'gold',category:'gold',trueName:'ゴールド',displayName:'ゴールド',identified:true,x:i.x,y:i.y,amount:Math.max(1,Math.floor(i.amount||1)),quantity:1};
      return K.Items.normalize(i,d.dungeonId);
    }).filter(Boolean);
    d.traps=(d.traps||[]).map(function(t){t.id=t.id||'mistNeedle';t.revealed=!!t.revealed;t.identified=!!t.identified;return t;});
    d.monsterHouse=d.monsterHouse||null;
    d.crystalWalls=(d.crystalWalls||[]).filter(function(c){return c&&Number.isFinite(c.x)&&Number.isFinite(c.y);});
    if(K.MonsterHouse&&K.MonsterHouse.normalize)K.MonsterHouse.normalize(d);
    d.log=d.log||['以前の冒険を再開した。'];
    d.enemies=(d.enemies||[]).map(function(e){e.status=e.status||{sleep:0,confuse:0};e.status.sleep=e.status.sleep||0;e.status.confuse=e.status.confuse||0;e.status.poison=e.status.poison||0;e.status.bind=e.status.bind||0;e.status.blind=e.status.blind||0;e.facingDirection=e.facingDirection||{dx:0,dy:1,id:'S'};if(K.Direction8)K.Direction8.apply(e,e.facingDirection.dx,e.facingDirection.dy);return e;});
    return d;
  }
  K.State={
    data:fresh(),
    fresh:fresh,
    reset:function(id){this.data=fresh(id);return this.data;},
    setDungeon:function(id){this.data.dungeonId=K.Dungeons.get(id).id;},
    addLog:function(s){this.data.log.unshift(s);this.data.log.length=Math.min(this.data.log.length,8);},
    save:function(){try{localStorage.setItem(C.saveKey,JSON.stringify(this.data));}catch(e){}},
    load:function(){
      try{
        var keys=[C.saveKey].concat(C.legacySaveKeys||[]),d=null,usedKey='';
        for(var i=0;i<keys.length&&!d;i++){usedKey=keys[i];d=JSON.parse(localStorage.getItem(usedKey));}
        if(d&&d.version===C.saveVersion&&d.player&&!d.gameOver){this.data=migrate(d);if(usedKey!==C.saveKey)this.save();return true;}
      }catch(e){}
      return false;
    },
    migrate:migrate,
    clearSave:function(){try{localStorage.removeItem(C.saveKey);}catch(e){}}
  };
})(window.Kiri=window.Kiri||{});
