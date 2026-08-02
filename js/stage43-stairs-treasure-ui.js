(function(K){
  'use strict';
  if(K.UI&&K.UI.showStairs){
    var oldShow=K.UI.showStairs;
    K.UI.showStairs=function(){
      var s=K.State&&K.State.data,up=s&&s.stairs&&s.stairs.type==='up',screen=document.querySelector('#stairsScreen');
      if(screen){
        var small=screen.querySelector('small'),title=screen.querySelector('h2'),text=screen.querySelector('p'),button=screen.querySelector('[data-stairs-descend]');
        if(small)small.textContent=up?'UP STAIRS':'DOWN STAIRS';
        if(title)title.textContent=up?'上り階段が続いている':'下り階段が続いている';
        if(text)text.textContent=up?'上の階へ戻りますか？':'次の階へ進みますか？';
        if(button)button.textContent=up?'上る':'下りる';
      }
      return oldShow.apply(this,arguments);
    };
  }
  if(K.UI&&K.UI.draw){
    var oldDraw=K.UI.draw;
    K.UI.draw=function(state){
      var result=oldDraw.apply(this,arguments),canvas=document.querySelector('#game');
      if(canvas&&K.CrystalWalls&&K.UI.stage16Camera)K.CrystalWalls.drawAll(state,canvas.getContext('2d'),K.UI.stage16Camera(state),32);
      return result;
    };
  }
  addEventListener('DOMContentLoaded',function(){
    var hadSave=false;
    try{hadSave=!!localStorage.getItem(K.Config.saveKey);}catch(e){}
    document.querySelectorAll('[data-new-dungeon]').forEach(function(button){
      button.addEventListener('click',function(){
        var name=button.textContent||'この迷宮';
        if(confirm(name+'を最初から始めますか？')&&K.Game&&K.Game.actions)K.Game.actions.newGame(button.dataset.newDungeon);
      });
    });
  });
})(window.Kiri=window.Kiri||{});
