(function(K){
  'use strict';
  function renderProgression(state){
    if(!K.UI.isStatusOpen())return;
    var grid=document.querySelector('#statusGrid');
    if(!grid)return;
    var remaining=K.Progression.remaining(state.player);
    grid.innerHTML=grid.innerHTML
      .replace('<span>経験値</span>','<span>累計経験値</span>')
      .replace(/<div data-stage28-exp>[\s\S]*?<\/div>/g,'');
    grid.innerHTML+='<div data-stage28-exp><span>次のレベルまで</span><strong>'+
      (remaining===null?'最大':remaining+'ポイント')+'</strong></div>';
  }
  var oldDraw=K.UI.draw,oldToggle=K.UI.toggleStatus;
  K.UI.draw=function(state){oldDraw.call(K.UI,state);renderProgression(state);};
  K.UI.toggleStatus=function(state){oldToggle.call(K.UI,state);renderProgression(state);};
  K.UI.renderProgressionStatus=renderProgression;
})(window.Kiri=window.Kiri||{});
