(function(K){
  'use strict';
  var oldDraw=K.UI.draw;
  function setText(selector,value){var node=document.querySelector(selector);if(node)node.textContent=value;}
  function limitLog(){var box=document.querySelector('#message');if(!box)return;while(box.children.length>3)box.removeChild(box.lastElementChild);}
  function drawTheme(state){
    var canvas=document.querySelector('#game');
    if(!canvas)return;
    var ctx=canvas.getContext('2d'),name=(K.Themes.forFloor(state.floor)||{}).name||state.floorTheme||'';
    ctx.save();ctx.font='12px system-ui, sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
    var width=Math.ceil(ctx.measureText(name).width)+12;
    ctx.fillStyle='rgba(8, 10, 8, .58)';ctx.fillRect(5,5,width,21);
    ctx.fillStyle='rgba(242, 234, 197, .82)';ctx.fillText(name,11,9);ctx.restore();
  }
  K.UI.draw=function(state){oldDraw.call(K.UI,state);setText('#levelText',state.player.level);setText('#goldText',state.player.gold+' G');limitLog();drawTheme(state);};
  K.UI.limitVisibleLog=limitLog;
  K.UI.drawThemeLabel=drawTheme;
})(window.Kiri=window.Kiri||{});
