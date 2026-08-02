(function(K){
  'use strict';
  K.State.addLog=function(message){
    String(message||'').split('\n').filter(Boolean).forEach(function(line){K.State.data.log.unshift(line);});
    this.data.log.length=Math.min(this.data.log.length,10);
  };
  var baseEntityVisible=K.Visibility.isEntityVisible;
  K.Visibility.isEntityVisible=function(state,x,y){return!!(state.vision&&state.vision.mapAll)||baseEntityVisible.call(K.Visibility,state,x,y);};
  var originalMini=K.UI.renderStage16Minimap;
  function sightOnlyMini(state){if(!originalMini)return;var mapAll=state.vision&&state.vision.mapAll;if(state.vision)state.vision.mapAll=false;try{originalMini(state);}finally{if(state.vision)state.vision.mapAll=mapAll;}}
  if(originalMini)K.UI.renderStage16Minimap=sightOnlyMini;
  var oldDraw=K.UI.draw,userBrowsing=false,programmatic=false;
  function area(){var message=document.querySelector('#message');return message&&message.parentElement;}
  function atTop(box){return!box||box.scrollTop<6;}
  function renderLog(state){
    var message=document.querySelector('#message'),box=area();if(!message)return;
    message.innerHTML='';
    state.log.slice(0,10).forEach(function(text,index){var span=document.createElement('span');span.textContent=text;if(index===0)span.className='latest';message.appendChild(span);});
    if(box&&!userBrowsing){programmatic=true;box.scrollTop=0;programmatic=false;}
  }
  K.UI.draw=function(state){oldDraw.call(K.UI,state);if(state.vision&&state.vision.mapAll)sightOnlyMini(state);renderLog(state);};
  var oldInit=K.UI.init;
  K.UI.init=function(){oldInit.call(K.UI);var box=area();if(box)box.addEventListener('scroll',function(){if(programmatic)return;userBrowsing=!atTop(box);},{passive:true});};
  K.UI.renderScrollableLog=renderLog;
  K.UI.isBrowsingLog=function(){return userBrowsing;};
})(window.Kiri=window.Kiri||{});
