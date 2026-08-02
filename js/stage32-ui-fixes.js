(function(K){
  'use strict';
  var mapOpen=false,overlayCanvas=null,mapOnlyOpen=false,mapOnlyScreen=null,mapOnlyCanvas=null;

  function cloneArrow(item,state){var copy=K.Items.create(item.id,undefined,undefined,state.dungeonId);['identified','displayName','trueName','basePower','effect','chargesKnown','curseKnown'].forEach(function(k){if(item[k]!==undefined)copy[k]=item[k];});copy.quantity=1;copy.equipped=false;return copy;}
  function removeEmptyArrow(state,item){if(item.quantity>0)return;var index=state.inventory.indexOf(item);if(index>=0)state.inventory.splice(index,1);if(state.player.equipment.arrow===item)state.player.equipment.arrow=null;}
  function equipmentSlot(item){return item.category==='arrow'?'arrow':item.category;}
  function canDetach(state,item,blockedMessage){if(!item.equipped)return{ok:true};if(item.cursed)return{ok:false,message:blockedMessage};state.player.equipment[equipmentSlot(item)]=null;item.equipped=false;return{ok:true};}

  var oldActions=K.ItemActions.actionsFor;
  K.ItemActions.actionsFor=function(item){if(item.category==='arrow'&&!item.equipped)return[{id:'equip',label:'装備'},{id:'shoot',label:'撃つ'},{id:'place',label:'置く'}];if(item.equipped&&item.category==='arrow')return[{id:'unequip',label:'外す'},{id:'shoot',label:'撃つ'},{id:'place',label:'置く'}];if(item.equipped&&['weapon','shield','ring'].indexOf(item.category)>=0)return[{id:'unequip',label:'外す'},{id:'throw',label:'投げる'},{id:'place',label:'置く'}];return oldActions.call(this,item);};

  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    if((action==='throw'||action==='place')&&item.equipped&&['weapon','shield','ring'].indexOf(item.category)>=0){var detached=canDetach(state,item,action==='throw'?'呪われていて投げられない。':'呪われていて置けない。');if(!detached.ok)return{success:false,message:detached.message};return oldPerform.call(this,action,state,item);}
    if(action==='place'&&item.equipped&&item.category==='arrow'){var detachArrow=canDetach(state,item,'呪われていて置けない。');if(!detachArrow.ok)return{success:false,message:detachArrow.message};return oldPerform.call(this,action,state,item);}
    if(action==='throw'&&item.equipped&&item.category==='arrow'){if(item.cursed)return{success:false,message:'呪われていて投げられない。'};var one=cloneArrow(item,state),result=oldPerform.call(this,'throw',state,one);if(result.success){item.quantity--;removeEmptyArrow(state,item);}return result;}
    return oldPerform.apply(this,arguments);
  };

  function circle(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function mapCellKnown(state,x,y){return K.Visibility.isMapped(state,x,y);}
  function floorMapData(state){
    var data={tiles:[],player:state.player,enemies:[],items:[],traps:[],stairs:null,floor:state.floor,themeName:state.floorTheme||(K.Themes&&K.Themes.forFloor?K.Themes.forFloor(state.floor).name:''),dungeonName:K.Dungeons&&K.Dungeons.get?K.Dungeons.get(state.dungeonId).name:''};
    for(var y=0;y<K.Config.height;y++)for(var x=0;x<K.Config.width;x++){if(!mapCellKnown(state,x,y))continue;data.tiles.push({x:x,y:y,floor:!!(state.map[y]&&state.map[y][x]===1),visible:K.Visibility.isVisible(state,x,y)});}
    (state.groundItems||[]).forEach(function(item){if(K.Visibility.shouldShowItemOnMap?K.Visibility.shouldShowItemOnMap(state,item):mapCellKnown(state,item.x,item.y))data.items.push(item);});
    (state.traps||[]).forEach(function(trap){if(K.Visibility.shouldShowTrapOnMap?K.Visibility.shouldShowTrapOnMap(state,trap):(trap.revealed&&mapCellKnown(state,trap.x,trap.y)))data.traps.push(trap);});
    if(state.stairs&&mapCellKnown(state,state.stairs.x,state.stairs.y))data.stairs=state.stairs;
    (state.enemies||[]).forEach(function(enemy){if(K.Visibility.shouldShowEnemyOnMap?K.Visibility.shouldShowEnemyOnMap(state,enemy):K.Visibility.isEntityVisible(state,enemy.x,enemy.y))data.enemies.push(enemy);});
    return data;
  }
  function scaleFor(canvas,padding){var w=canvas.width-(padding||0)*2,h=canvas.height-(padding||0)*2;return Math.max(2,Math.floor(Math.min(w/K.Config.width,h/K.Config.height)));}
  function drawMap(ctx,canvas,data,mode){
    var pad=mode==='standalone'?36:0,s=mode==='standalone'?scaleFor(canvas,pad):Math.min(canvas.width/K.Config.width,canvas.height/K.Config.height),ox=(canvas.width-K.Config.width*s)/2,oy=(canvas.height-K.Config.height*s)/2;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(mode==='standalone'){ctx.fillStyle='#050706';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f2eac5';ctx.font='18px system-ui';ctx.textAlign='left';ctx.fillText((data.themeName||data.dungeonName||'迷宮')+'　'+data.floor+'F',22,28);ctx.font='13px system-ui';ctx.fillStyle='#aeb9a7';ctx.fillText('フロアマップ　Shift+M / Esc：戻る',22,49);}
    data.tiles.forEach(function(t){ctx.fillStyle=t.floor?(t.visible?(mode==='standalone'?'#52685f':'rgba(118,174,202,.30)'):(mode==='standalone'?'#26342f':'rgba(76,110,132,.20)')):(t.visible?(mode==='standalone'?'#323a3a':'rgba(74,86,92,.24)'):(mode==='standalone'?'#141918':'rgba(42,52,58,.16)'));ctx.fillRect(Math.round(ox+t.x*s),Math.round(oy+t.y*s),Math.ceil(s),Math.ceil(s));});
    data.items.forEach(function(item){circle(ctx,ox+item.x*s+s/2,oy+item.y*s+s/2,Math.max(2,s*.34),'#42e1f0');});
    data.traps.forEach(function(trap){if(K.TrapRenderer)K.TrapRenderer.drawMini(ctx,trap,ox+trap.x*s+s/2,oy+trap.y*s+s/2,s);else{ctx.fillStyle='#d269ff';ctx.fillRect(ox+trap.x*s+s*.25,oy+trap.y*s+s*.25,Math.max(2,s*.5),Math.max(2,s*.5));}});
    if(data.stairs){ctx.strokeStyle='#42d9e8';ctx.lineWidth=mode==='standalone'?Math.max(2,s*.16):2;ctx.strokeRect(ox+data.stairs.x*s+s*.2,oy+data.stairs.y*s+s*.2,s*.6,s*.6);}
    data.enemies.forEach(function(enemy){circle(ctx,ox+enemy.x*s+s/2,oy+enemy.y*s+s/2,Math.max(2,s*.34),'#ff453a');if(enemy.spawnSleep||enemy.effectSleep>0){ctx.fillStyle='#ffd8d8';ctx.font=Math.max(5,Math.round(s*.62))+'px sans-serif';ctx.fillText('z',ox+enemy.x*s+s*.55,oy+enemy.y*s+s*.25);}});
    circle(ctx,ox+data.player.x*s+s/2,oy+data.player.y*s+s/2,Math.max(3,s*.44),'#ffd51f');ctx.strokeStyle='#fff6a8';ctx.lineWidth=mode==='standalone'?2:1;ctx.strokeRect(ox+data.player.x*s+s*.18,oy+data.player.y*s+s*.18,s*.64,s*.64);
  }
  function drawFullMap(state){if(!overlayCanvas||!mapOpen||!state)return;drawMap(overlayCanvas.getContext('2d'),overlayCanvas,floorMapData(state),'overlay');}
  function drawMapOnly(state){if(!mapOnlyCanvas||!mapOnlyOpen||!state)return;drawMap(mapOnlyCanvas.getContext('2d'),mapOnlyCanvas,floorMapData(state),'standalone');}
  function setMapButtons(){document.querySelectorAll('[data-map-toggle]').forEach(function(b){b.classList.toggle('active',mapOpen);b.setAttribute('aria-pressed',String(mapOpen));});document.querySelectorAll('[data-map-only-toggle]').forEach(function(b){b.classList.toggle('active',mapOnlyOpen);b.setAttribute('aria-pressed',String(mapOnlyOpen));});}
  function toggleMap(force){mapOpen=force===undefined?!mapOpen:!!force;if(overlayCanvas){overlayCanvas.classList.toggle('hidden',!mapOpen);overlayCanvas.setAttribute('aria-hidden',String(!mapOpen));}document.body.classList.toggle('full-map-active',mapOpen);setMapButtons();if(mapOpen)drawFullMap(K.State.data);}
  function resizeMapOnly(){if(!mapOnlyCanvas)return;mapOnlyCanvas.width=Math.max(320,Math.min(window.innerWidth-32,920));mapOnlyCanvas.height=Math.max(300,Math.min(window.innerHeight-140,680));drawMapOnly(K.State&&K.State.data);}
  function toggleMapOnly(force){mapOnlyOpen=force===undefined?!mapOnlyOpen:!!force;if(mapOnlyScreen){mapOnlyScreen.classList.toggle('hidden',!mapOnlyOpen);mapOnlyScreen.setAttribute('aria-hidden',String(!mapOnlyOpen));}document.body.classList.toggle('map-only-active',mapOnlyOpen);setMapButtons();if(mapOnlyOpen)resizeMapOnly();}
  function editingTarget(target){return target&&target.closest&&target.closest('input,textarea,select,[contenteditable="true"]');}

  var oldDraw=K.UI.draw;
  K.UI.draw=function(state){oldDraw.call(this,state);drawFullMap(state);drawMapOnly(state);};
  K.UI.isFullMapOpen=function(){return mapOpen;};
  K.UI.toggleFullMap=toggleMap;
  K.UI.isMapOnlyOpen=function(){return mapOnlyOpen;};
  K.UI.toggleMapOnly=toggleMapOnly;
  K.UI.floorMapData=floorMapData;
  K.UI.drawFloorMap=drawMap;

  addEventListener('DOMContentLoaded',function(){
    var wrap=document.querySelector('.canvas-wrap');
    if(wrap&&!document.querySelector('#fullMapOverlay')){overlayCanvas=document.createElement('canvas');overlayCanvas.id='fullMapOverlay';overlayCanvas.className='full-map-overlay hidden';overlayCanvas.width=640;overlayCanvas.height=480;overlayCanvas.setAttribute('aria-hidden','true');wrap.appendChild(overlayCanvas);}
    if(!document.querySelector('#mapOnlyScreen')){mapOnlyScreen=document.createElement('section');mapOnlyScreen.id='mapOnlyScreen';mapOnlyScreen.className='map-only-screen hidden';mapOnlyScreen.setAttribute('aria-label','マップのみ表示');mapOnlyScreen.setAttribute('aria-hidden','true');mapOnlyScreen.innerHTML='<div class="map-only-card"><div class="map-only-heading"><div><small>FLOOR MAP</small><h2>フロアマップ</h2></div><button type="button" data-map-only-close>ゲームに戻る</button></div><canvas id="mapOnlyCanvas" width="760" height="560" aria-label="フロアマップ"></canvas><p>PC: Shift+M / Escで戻る</p></div>';document.body.appendChild(mapOnlyScreen);mapOnlyCanvas=mapOnlyScreen.querySelector('#mapOnlyCanvas');mapOnlyScreen.querySelector('[data-map-only-close]').addEventListener('click',function(e){e.preventDefault();toggleMapOnly(false);});}
    var pad=document.querySelector('.action-pad');
    if(pad&&!pad.querySelector('[data-action="map"]')){var mobile=document.createElement('button');mobile.type='button';mobile.dataset.action='map';mobile.dataset.mapToggle='mobile';mobile.setAttribute('aria-pressed','false');mobile.textContent='マップ';pad.appendChild(mobile);mobile.addEventListener('click',function(e){e.preventDefault();toggleMap();});}
    if(pad&&!pad.querySelector('[data-action="map-only"]')){var check=document.createElement('button');check.type='button';check.dataset.action='map-only';check.dataset.mapOnlyToggle='mobile';check.setAttribute('aria-pressed','false');check.textContent='地図確認';pad.appendChild(check);check.addEventListener('click',function(e){e.preventDefault();toggleMapOnly();});}
    addEventListener('keydown',function(e){if(editingTarget(e.target))return;if(mapOnlyOpen){if(e.key==='Escape'||((e.key==='m'||e.key==='M')&&e.shiftKey)){e.preventDefault();e.stopImmediatePropagation();toggleMapOnly(false);return;}e.preventDefault();e.stopImmediatePropagation();return;}if((e.key==='m'||e.key==='M')&&e.shiftKey){e.preventDefault();e.stopImmediatePropagation();toggleMapOnly(true);return;}if(e.key==='m'||e.key==='M'){e.preventDefault();toggleMap();return;}},true);
    addEventListener('resize',function(){if(mapOnlyOpen)resizeMapOnly();});
  });
})(window.Kiri=window.Kiri||{});
