(function(K){
  'use strict';
  function ensureTools(){
    var status=document.querySelector('.status');
    if(!status)return null;
    var tools=document.querySelector('.status-tools');
    if(!tools){
      tools=document.createElement('section');
      tools.className='status-tools';
      tools.setAttribute('aria-label','フロアと操作補助');
      tools.innerHTML='<div class="status-theme"><span>階層テーマ</span><strong data-status-theme>入口の迷宮</strong></div><div class="status-map-buttons"><button type="button" class="full-map-toggle" data-map-toggle="status" aria-pressed="false">全体マップ</button><button type="button" class="full-map-toggle map-only-toggle" data-map-only-toggle="status" aria-pressed="false">地図確認</button></div><div class="status-audio"></div>';
      status.insertAdjacentElement('afterend',tools);
      var mapButton=tools.querySelector('[data-map-toggle]');
      mapButton.addEventListener('click',function(e){
        e.preventDefault();
        if(K.UI&&K.UI.toggleFullMap)K.UI.toggleFullMap();
      });
      var mapOnlyButton=tools.querySelector('[data-map-only-toggle]');
      mapOnlyButton.addEventListener('click',function(e){
        e.preventDefault();
        if(K.UI&&K.UI.toggleMapOnly)K.UI.toggleMapOnly();
      });
    }
    var audio=document.querySelector('.audio-controls'),slot=tools.querySelector('.status-audio');
    if(audio&&slot&&!slot.contains(audio))slot.appendChild(audio);
    return tools;
  }
  function updateTools(state){
    var tools=ensureTools();
    if(!tools||!state)return;
    var theme=tools.querySelector('[data-status-theme]');
    if(theme)theme.textContent=state.floorTheme||(K.Themes&&K.Themes.forFloor?K.Themes.forFloor(state.floor).name:'');
  }
  var oldDraw=K.UI.draw;
  K.UI.draw=function(state){
    oldDraw.call(this,state);
    updateTools(state);
  };
  addEventListener('DOMContentLoaded',function(){ensureTools();});
})(window.Kiri=window.Kiri||{});
