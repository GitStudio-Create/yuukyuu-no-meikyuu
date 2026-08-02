(function(K){
  'use strict';
  var oldDraw=K.Sprites.drawEnemy;
  function r(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function decorate(ctx,e,x,y,time){var id=e.spriteId||e.definitionId||e.id,light='#f6e7a8',dark='#241f1b',pulse=Math.floor(time/180)%2,side=K.Direction8&&K.Direction8.side(K.Direction8.fromActor(e)),flip=side==='left'?-1:1;ctx.save();ctx.translate(x+16,y);ctx.scale(flip,1);ctx.translate(-16,0);
    switch(id){
      case'dewMote':r(ctx,'#b8f4ff',15,5,3,4);r(ctx,'#4aaed0',8,23,4,3);break;
      case'driftMoth':r(ctx,'#dbc7ff',4,5,4,2);r(ctx,'#dbc7ff',25,5,4,2);r(ctx,dark,16,20,2,6);break;
      case'dozeBud':r(ctx,'#f2cf55',8,5,4,4);r(ctx,'#f2cf55',20,4,4,4);r(ctx,'#6a8e4c',10,26,5,3);break;
      case'stoneBeak':r(ctx,light,25,14,6,3);r(ctx,'#77736c',8,4,5,4);r(ctx,'#77736c',20,4,5,4);break;
      case'bileToad':r(ctx,'#d5ec59',7,20,5,3);r(ctx,'#4b6838',23,21,5,3);r(ctx,dark,6,14,3,3);break;
      case'dreamWisp':r(ctx,'#d9c7ff',4,22,5,5);r(ctx,'#d9c7ff',14,25,5,4);r(ctx,'#d9c7ff',24,21,5,6);break;
      case'needleWing':r(ctx,'#ddbf72',2,4+pulse*2,7,2);r(ctx,'#ddbf72',24,4+pulse*2,7,2);r(ctx,'#8a4a35',15,22,3,7);break;
      case'mudBrute':r(ctx,'#b59a6d',4,8,5,7);r(ctx,'#b59a6d',26,8,5,7);r(ctx,'#4b4135',13,22,8,4);break;
      case'reedSniper':r(ctx,'#d9c999',27,4,2,24);r(ctx,'#98b36c',3,10,5,12);r(ctx,light,23,6,7,2);break;
      case'pocketImp':r(ctx,'#e8d38c',7,3,4,7);r(ctx,'#e8d38c',23,3,4,7);r(ctx,'#8c4d40',24,22,6,6);break;
      case'shyShell':r(ctx,'#efc55f',7,7,20,3);r(ctx,'#fff0bd',11,25,3,4);r(ctx,'#fff0bd',20,25,3,4);break;
      case'spiralEye':r(ctx,'#d88ed0',4,14,4,4);r(ctx,'#d88ed0',26,14,4,4);r(ctx,'#fff',17,13,2,2);break;
      case'rustMaw':r(ctx,'#d27643',4,3,5,8);r(ctx,'#d27643',24,3,5,8);r(ctx,dark,14,22,7,3);break;
      case'hungerShade':r(ctx,'#9a79c4',5,24,4,5);r(ctx,'#9a79c4',14,26,4,4);r(ctx,'#9a79c4',24,23,4,6);break;
      case'mirrorSeed':r(ctx,'#a8e4d7',5,3,5,5);r(ctx,'#d7ffff',23,4,5,5);r(ctx,'#6f9f84',15,25,3,5);break;
      case'riftFox':r(ctx,'#f1c47f',2,11,7,3);r(ctx,'#f1c47f',1,15,8,3);r(ctx,'#f1c47f',25,4,4,6);break;
      case'wallWraith':r(ctx,'#b5c4dd',2,9,4,13);r(ctx,'#b5c4dd',27,8,4,14);r(ctx,'#ecf4ff',15,4,4,3);break;
      case'oakGiant':r(ctx,'#8fa45d',2,7,6,18);r(ctx,'#8fa45d',26,7,6,18);r(ctx,'#594631',14,2,7,6);break;
      case'emberHorn':r(ctx,'#ffbd55',3,2,5,10);r(ctx,'#ffbd55',25,2,5,10);r(ctx,'#ff6a38',14,25,7,5);break;
      case'staffAdept':r(ctx,'#b992e7',27,3,3,26);r(ctx,'#70fff2',25,1,7,7);r(ctx,'#e9dcff',7,5,4,4);break;
      case'roomWatcher':r(ctx,'#f2cf56',3,14,5,3);r(ctx,'#f2cf56',26,14,5,3);r(ctx,'#8cf5ff',15,2,5,5);break;
      case'frostCrown':r(ctx,'#d8fbff',7,2,4,8);r(ctx,'#d8fbff',22,2,4,8);r(ctx,'#7bd9ef',13,1,8,4);break;
      case'voidKnight':r(ctx,'#dbe2f2',27,3,3,27);r(ctx,'#663f7d',4,12,5,15);r(ctx,'#f0cf65',15,4,4,4);break;
      case'manyCore':r(ctx,'#f0b2bf',3,6,5,3);r(ctx,'#f0b2bf',25,6,5,3);r(ctx,'#6d2538',15,14,4,4);break;
      case'abyssOracle':r(ctx,'#ffcc69',2,2,3,27);r(ctx,'#ffcc69',27,2,3,27);r(ctx,'#c198ff',13,1,8,5);break;
    }ctx.restore();
  }
  K.Sprites.drawEnemy=function(ctx,e,x,y,anim,time){oldDraw(ctx,e,x,y,anim,time);decorate(ctx,e,x,y,time);};K.Sprites.drawEnemyDetail=decorate;
})(window.Kiri=window.Kiri||{});
