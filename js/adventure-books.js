(function(K){
  'use strict';
  var BOOK_VERSION=1,KEY_PREFIX='eternal_labyrinth_adventure_book_',SELECTED_KEY='eternal_labyrinth_selected_book';
  var selected=0,current=null,sessionStarted=0,lastError='';
  var oldSave=K.State.save,oldLoad=K.State.load,oldClear=K.State.clearSave;

  function key(slot){return KEY_PREFIX+slot;}
  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function initialStory(){return{openingSeen:false,questAccepted:false,cleared:{tutorialDungeon:false,normalDungeon:false,mysteryDungeon:false},treasureChest:{obtained:false,opened:false},events:{deepEntranceSeen:false,endingSeen:false}};}
  function normalizeStory(story){
    var base=initialStory(),s=story||{};
    base.openingSeen=!!s.openingSeen;base.questAccepted=!!s.questAccepted;
    Object.keys(base.cleared).forEach(function(id){base.cleared[id]=!!(s.cleared&&s.cleared[id]);});
    base.treasureChest.obtained=!!(s.treasureChest&&s.treasureChest.obtained);
    base.treasureChest.opened=base.treasureChest.obtained&&!!(s.treasureChest&&s.treasureChest.opened);
    Object.keys(base.events).forEach(function(id){base.events[id]=!!(s.events&&s.events[id]);});
    return base;
  }
  function summary(state,screen,story){
    var p=state&&state.player,mode=state&&K.Dungeons.get(state.dungeonId);
    return{level:p?p.level:1,location:screen==='dungeon'&&mode?mode.name:'王城',floor:screen==='dungeon'&&state?state.floor:0,dungeonId:state?state.dungeonId:'',chest:story.treasureChest.opened?'開封済み':story.treasureChest.obtained?'未開封':'未入手',cleared:Object.keys(story.cleared).filter(function(id){return story.cleared[id];})};
  }
  function parseSlot(slot){
    try{
      var raw=localStorage.getItem(key(slot));if(!raw)return{slot:slot,empty:true};
      var data=JSON.parse(raw);
      if(!data||data.saveVersion!==BOOK_VERSION||data.slot!==slot||!data.story)return{slot:slot,error:true,message:'対応していないセーブデータです。'};
      data.story=normalizeStory(data.story);data.playTimeMs=Math.max(0,data.playTimeMs||0);return{slot:slot,data:data};
    }catch(e){return{slot:slot,error:true,message:'セーブデータを読み取れませんでした。'};}
  }
  function elapsed(){return current?Math.max(0,Date.now()-sessionStarted):0;}
  function write(screen,state,options){
    if(!selected||!current)return false;
    var now=new Date().toISOString(),active=screen==='dungeon'&&state&&!state.gameOver;
    current.saveVersion=BOOK_VERSION;current.slot=selected;current.updatedAt=now;current.createdAt=current.createdAt||now;
    current.playTimeMs=Math.max(0,current.playTimeMs||0)+elapsed();sessionStarted=Date.now();
    current.screen=active?'dungeon':'base';current.dungeonActive=active;
    current.story=normalizeStory(current.story);
    current.gameState=active?clone(state):null;
    current.summary=summary(state,current.screen,current.story);
    if(options&&options.keepSummary&&options.summary)current.summary=options.summary;
    try{localStorage.setItem(key(selected),JSON.stringify(current));lastError='';return true;}catch(e){lastError='冒険の書へ記録できませんでした。';return false;}
  }
  function select(slot){var result=parseSlot(slot);if(result.error)return result;selected=slot;current=result.data||null;sessionStarted=Date.now();try{localStorage.setItem(SELECTED_KEY,String(slot));}catch(e){}return result;}
  function create(slot){
    var now=new Date().toISOString();selected=slot;sessionStarted=Date.now();current={saveVersion:BOOK_VERSION,slot:slot,createdAt:now,updatedAt:now,playTimeMs:0,screen:'base',dungeonActive:false,story:initialStory(),gameState:null};
    current.summary=summary(null,'base',current.story);
    try{localStorage.setItem(key(slot),JSON.stringify(current));localStorage.setItem(SELECTED_KEY,String(slot));return true;}catch(e){lastError='新しい冒険の書を作れませんでした。';current=null;selected=0;return false;}
  }
  function loadSelected(){
    if(!current||!current.dungeonActive||!current.gameState)return false;
    var state=clone(current.gameState);if(!state||state.gameOver)return false;
    K.State.data=K.State.migrate(state);K.State.data.turnLocked=false;return true;
  }
  function remove(slot){try{localStorage.removeItem(key(slot));if(selected===slot){selected=0;current=null;localStorage.removeItem(SELECTED_KEY);}return true;}catch(e){lastError='冒険の書を消せませんでした。';return false;}}
  function markBase(state){
    var old=current&&current.summary?clone(current.summary):summary(state,'base',current?current.story:initialStory());
    if(state&&state.player){old.level=state.player.level;old.location='王城';old.floor=0;old.dungeonId='';}
    return write('base',state,{keepSummary:true,summary:old});
  }
  K.AdventureBooks={
    saveVersion:BOOK_VERSION,keyPrefix:KEY_PREFIX,selectedKey:SELECTED_KEY,slots:function(){return[1,2,3].map(parseSlot);},select:select,create:create,remove:remove,
    current:function(){return current;},selectedSlot:function(){return selected;},story:function(){return current?current.story:null;},loadSelected:loadSelected,
    saveDungeon:function(){return write('dungeon',K.State.data);},saveBase:markBase,lastError:function(){return lastError;},
    debug:function(){return{slot:selected,saveVersion:BOOK_VERSION,story:current&&current.story,dungeonId:K.State.data&&K.State.data.dungeonId,dungeonActive:!!(current&&current.dungeonActive),updatedAt:current&&current.updatedAt};}
  };
  K.State.save=function(){if(K.Mode&&K.Mode.current&&K.Mode.current()==='gm')return oldSave.apply(this,arguments);if(selected&&current)return write('dungeon',this.data);return false;};
  K.State.load=function(){if(K.Mode&&K.Mode.current&&K.Mode.current()==='gm')return oldLoad.apply(this,arguments);return loadSelected();};
  K.State.clearSave=function(){if(K.Mode&&K.Mode.current&&K.Mode.current()==='gm')return oldClear.apply(this,arguments);return markBase(this.data);};
})(window.Kiri=window.Kiri||{});
