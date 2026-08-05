(function(K){
  'use strict';

  var oldInit=K.Input.init;
  var REPEAT_DELAY_MS=200,REPEAT_INTERVAL_MS=85;

  K.Input.init=function(actions){
    oldInit.call(K.Input,actions);

    var faceNext=false,runNext=false,diagonalNext=false;
    var faceButton,runButton,diagonalButton;
    var repeatDelayTimer=null,repeatTimer=null,repeatButton=null;

    function setNext(button,on){
      if(!button)return;
      button.classList.toggle('active',on);
      button.setAttribute('aria-pressed',String(on));
    }
    function resetNext(){
      faceNext=false;runNext=false;diagonalNext=false;
      setNext(faceButton,false);
      setNext(runButton,false);
      setNext(diagonalButton,false);
    }
    function menuBlocked(){
      var itemMenu=document.querySelector('#itemMenu');
      var confirm=document.querySelector('#confirmScreen');
      return !!(
        (K.UI.isStairOpen&&K.UI.isStairOpen())||
        (K.UI.isStatusOpen&&K.UI.isStatusOpen())||
        (K.UI.isSuspendOpen&&K.UI.isSuspendOpen())||
        (itemMenu&&!itemMenu.classList.contains('hidden'))||
        (confirm&&!confirm.classList.contains('hidden'))
      );
    }
    function turnBlocked(){return !!(K.Game&&K.Game.isInputLocked&&K.Game.isInputLocked());}
    function uiBlocked(){return menuBlocked()||turnBlocked();}
    function stopRepeat(){
      if(repeatDelayTimer)clearTimeout(repeatDelayTimer);
      if(repeatTimer)clearTimeout(repeatTimer);
      repeatDelayTimer=null;
      repeatTimer=null;
      repeatButton=null;
    }
    function repeatDirection(){
      repeatTimer=null;
      if(!repeatButton)return;
      if(menuBlocked())return stopRepeat();
      if(!turnBlocked())performDirection(repeatButton);
      if(repeatButton)repeatTimer=setTimeout(repeatDirection,REPEAT_INTERVAL_MS);
    }
    function performDirection(button){
      if(!button||uiBlocked())return false;
      var d=K.Directions[button.dataset.dir];
      if(!d)return false;
      if(faceNext){
        actions.face(d[0],d[1]);
        resetNext();
        return true;
      }
      if(runNext){
        actions.run(d[0],d[1]);
        resetNext();
        return true;
      }
      if(diagonalNext){
        if(!(d[0]&&d[1]))return false;
        actions.move(d[0],d[1]);
        resetNext();
        return true;
      }
      actions.move(d[0],d[1]);
      return true;
    }

    addEventListener('keydown',function(e){
      if(K.UI.isSuspendOpen&&K.UI.isSuspendOpen()){
        if(e.key==='Escape'||e.key==='Enter'||e.key==='q'||e.key==='Q'){
          e.preventDefault();
          actions.resume();
        }
        return;
      }
      if((e.key==='g'||e.key==='G')&&!K.UI.isStairOpen()&&!K.UI.isStatusOpen()){
        e.preventDefault();
        actions.pickup();
      }else if((e.key==='q'||e.key==='Q')&&!K.UI.isStairOpen()&&!K.UI.isStatusOpen()){
        e.preventDefault();
        actions.suspend();
      }
    });

    document.querySelectorAll('[data-dir]').forEach(function(button){
      button.addEventListener('pointerdown',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        stopRepeat();
        var oneShot=faceNext||runNext||diagonalNext;
        if(!performDirection(button))return;
        if(oneShot)return;
        repeatButton=button;
        repeatDelayTimer=setTimeout(function(){repeatDelayTimer=null;repeatDirection();},REPEAT_DELAY_MS);
      },true);
      button.addEventListener('pointerup',stopRepeat);
      button.addEventListener('pointercancel',stopRepeat);
      button.addEventListener('pointerleave',stopRepeat);
    });
    document.addEventListener('pointerup',stopRepeat);
    addEventListener('blur',stopRepeat);

    document.querySelector('[data-floor-pickup]').addEventListener('click',actions.pickup);
    document.querySelector('[data-floor-stairs]').addEventListener('click',function(){
      if(K.State.data.player.x===K.State.data.stairs.x&&K.State.data.player.y===K.State.data.stairs.y)K.UI.showStairs();
    });
    document.querySelector('[data-floor-step]').addEventListener('click',actions.step);
    document.querySelector('[data-floor-attack]').addEventListener('click',actions.attack);
    document.querySelector('[data-floor-shoot]').addEventListener('click',actions.shootArrow);

    faceButton=document.querySelector('[data-floor-face]');
    runButton=document.querySelector('[data-floor-run]');
    diagonalButton=document.querySelector('[data-floor-diagonal]');
    faceButton.addEventListener('click',function(){resetNext();faceNext=true;setNext(faceButton,true);});
    runButton.addEventListener('click',function(){resetNext();runNext=true;setNext(runButton,true);});
    diagonalButton.addEventListener('click',function(){resetNext();diagonalNext=true;setNext(diagonalButton,true);});

    document.querySelector('[data-floor-status]').addEventListener('click',actions.toggleStatus);
    document.querySelector('[data-floor-map]').addEventListener('click',function(){if(K.UI&&K.UI.toggleFullMap)K.UI.toggleFullMap();});
    document.querySelector('[data-floor-map-only]').addEventListener('click',function(){if(K.UI&&K.UI.toggleMapOnly)K.UI.toggleMapOnly();});
    document.querySelector('[data-floor-suspend]').addEventListener('click',actions.suspend);
    document.querySelector('[data-resume]').addEventListener('click',actions.resume);
  };
})(window.Kiri=window.Kiri||{});
