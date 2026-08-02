(function(K){
  'use strict';
  var oldDraw=K.UI.draw,TILE=32,VW=20,VH=15;
  function cameraAt(x,y){return{x:Math.max(0,Math.min(K.Config.width-VW,x-Math.floor(VW/2))),y:Math.max(0,Math.min(K.Config.height-VH,y-Math.floor(VH/2)))};}
  function camera(state){return cameraAt(state.player.x,state.player.y);}
  function screen(cam,x,y){return{x:Math.round((x-cam.x)*TILE),y:Math.round((y-cam.y)*TILE)};}
  function inView(cam,x,y){return x+1>cam.x&&y+1>cam.y&&x<cam.x+VW&&y<cam.y+VH;}
  function circle(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function roomAt(state,x,y){return K.Visibility.roomAt(state,x,y);}
  function hash01(state,x,y,salt){var n=Math.sin((x+1)*12.9898+(y+1)*78.233+(state.floor||1)*37.719+(salt||0)*19.19)*43758.5453;return n-Math.floor(n);}
  function nearFloor(state,x,y){return [[1,0],[-1,0],[0,1],[0,-1]].some(function(d){var yy=y+d[1],xx=x+d[0];return state.map[yy]&&state.map[yy][xx]===1;});}
  function line(ctx,x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawWallDecoration(ctx,state,x,y,pos,v){
    if(!nearFloor(state,x,y)||hash01(state,x,y,4)>.04)return;
    if(v.decorationStyle==='flowerVine'){
      ctx.fillStyle=v.accent2;ctx.fillRect(pos.x+14,pos.y+8,4,16);
      ctx.fillStyle=v.accent;circle(ctx,pos.x+11,pos.y+12,2.2,v.accent);circle(ctx,pos.x+21,pos.y+18,2.2,v.accent);
    }else if(v.decorationStyle==='icicle'||v.decorationStyle==='crystal'){
      ctx.fillStyle=v.accent;ctx.beginPath();ctx.moveTo(pos.x+16,pos.y+5);ctx.lineTo(pos.x+23,pos.y+22);ctx.lineTo(pos.x+10,pos.y+22);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(pos.x+15,pos.y+9,2,8);
    }else if(v.decorationStyle==='gear'){
      ctx.strokeStyle=v.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(pos.x+16,pos.y+16,7,0,Math.PI*2);ctx.stroke();
      line(ctx,pos.x+16,pos.y+6,pos.x+16,pos.y+26);line(ctx,pos.x+6,pos.y+16,pos.x+26,pos.y+16);
    }else if(v.decorationStyle==='stainedGlass'){
      ctx.fillStyle='rgba(88,160,210,.55)';ctx.fillRect(pos.x+10,pos.y+6,12,18);
      ctx.fillStyle='rgba(214,122,72,.45)';ctx.fillRect(pos.x+13,pos.y+9,6,12);
    }else if(v.decorationStyle==='droplet'){
      ctx.fillStyle=v.accent;ctx.beginPath();ctx.ellipse(pos.x+16,pos.y+15,3,7,0,0,Math.PI*2);ctx.fill();
    }else if(v.decorationStyle==='glyph'){
      ctx.strokeStyle=v.accent;ctx.lineWidth=1.5;ctx.strokeRect(pos.x+10,pos.y+9,12,12);line(ctx,pos.x+13,pos.y+12,pos.x+19,pos.y+18);
    }else{
      ctx.fillStyle='#5b3921';ctx.fillRect(pos.x+14,pos.y+9,4,14);
      ctx.fillStyle=v.accent;ctx.beginPath();ctx.arc(pos.x+16,pos.y+8,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,204,104,.22)';ctx.beginPath();ctx.arc(pos.x+16,pos.y+10,10,0,Math.PI*2);ctx.fill();
    }
  }
  function drawCastleWall(ctx,state,x,y,pos,theme){
    var v=theme.visual;
    ctx.fillStyle=v.wall;
    ctx.fillRect(pos.x,pos.y,TILE,TILE);
    ctx.fillStyle=hash01(state,x,y,1)>.5?v.wallDark:v.wallLight;
    ctx.globalAlpha*=.28;
    ctx.fillRect(pos.x+2,pos.y+2,TILE-4,7);
    ctx.fillRect(pos.x+2,pos.y+17,TILE-4,8);
    ctx.globalAlpha/=.28;
    ctx.strokeStyle='rgba(12,14,16,.48)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(pos.x,pos.y+12.5);ctx.lineTo(pos.x+TILE,pos.y+12.5);
    ctx.moveTo(pos.x,pos.y+25.5);ctx.lineTo(pos.x+TILE,pos.y+25.5);
    ctx.moveTo(pos.x+((x+y)%2?12.5:18.5),pos.y);ctx.lineTo(pos.x+((x+y)%2?12.5:18.5),pos.y+TILE);
    ctx.stroke();
    if(v.wallStyle==='iceWall'||v.wallStyle==='lakeWall'||v.wallStyle==='abyssWall'){
      ctx.strokeStyle='rgba(210,245,255,.22)';
      line(ctx,pos.x+5,pos.y+27,pos.x+27,pos.y+5);
      if(hash01(state,x,y,11)<.22){ctx.fillStyle=v.accent;ctx.fillRect(pos.x+6,pos.y+6,3,3);}
    }else if(v.wallStyle==='metalWall'){
      ctx.strokeStyle='rgba(240,185,72,.28)';
      line(ctx,pos.x+4,pos.y+4,pos.x+28,pos.y+4);line(ctx,pos.x+4,pos.y+28,pos.x+28,pos.y+28);
      ctx.fillStyle=v.accent;ctx.fillRect(pos.x+7,pos.y+7,3,3);ctx.fillRect(pos.x+22,pos.y+22,3,3);
    }else if(v.wallStyle==='vineStone'){
      ctx.strokeStyle='rgba(112,168,76,.25)';
      line(ctx,pos.x+8,pos.y+2,pos.x+24,pos.y+30);
    }
    drawWallDecoration(ctx,state,x,y,pos,v);
  }
  function drawCastleRoom(ctx,state,x,y,pos,theme,room){
    var v=theme.visual;
    ctx.fillStyle=v.carpet;
    ctx.fillRect(pos.x,pos.y,TILE,TILE);
    ctx.strokeStyle='rgba(45,13,18,.45)';
    ctx.strokeRect(pos.x+.5,pos.y+.5,TILE-1,TILE-1);
    ctx.strokeStyle='rgba(170,99,52,.55)';
    ctx.lineWidth=2;
    if(!roomAt(state,x,y-1)){ctx.beginPath();ctx.moveTo(pos.x+2,pos.y+3);ctx.lineTo(pos.x+TILE-2,pos.y+3);ctx.stroke();}
    if(!roomAt(state,x,y+1)){ctx.beginPath();ctx.moveTo(pos.x+2,pos.y+TILE-4);ctx.lineTo(pos.x+TILE-2,pos.y+TILE-4);ctx.stroke();}
    if(!roomAt(state,x-1,y)){ctx.beginPath();ctx.moveTo(pos.x+3,pos.y+2);ctx.lineTo(pos.x+3,pos.y+TILE-2);ctx.stroke();}
    if(!roomAt(state,x+1,y)){ctx.beginPath();ctx.moveTo(pos.x+TILE-4,pos.y+2);ctx.lineTo(pos.x+TILE-4,pos.y+TILE-2);ctx.stroke();}
    ctx.strokeStyle='rgba(18,16,14,.24)';
    if(v.roomFloorStyle==='whiteTile'||v.roomFloorStyle==='mosaic'||v.roomFloorStyle==='metalPlate'){
      line(ctx,pos.x+16.5,pos.y,pos.x+16.5,pos.y+TILE);line(ctx,pos.x,pos.y+16.5,pos.x+TILE,pos.y+16.5);
      if(v.roomFloorStyle==='mosaic'){line(ctx,pos.x,pos.y,pos.x+TILE,pos.y+TILE);line(ctx,pos.x+TILE,pos.y,pos.x,pos.y+TILE);}
    }else if(v.roomFloorStyle==='wetFloor'||v.roomFloorStyle==='iceFloor'||v.roomFloorStyle==='blueRock'){
      ctx.strokeStyle='rgba(180,230,245,.24)';
      line(ctx,pos.x+5,pos.y+12,pos.x+27,pos.y+10);line(ctx,pos.x+7,pos.y+22,pos.x+25,pos.y+24);
    }else if(v.roomFloorStyle==='violetCrystal'){
      ctx.strokeStyle='rgba(224,120,255,.22)';
      line(ctx,pos.x+5,pos.y+27,pos.x+27,pos.y+5);
    }
  }
  function drawCastleCorridor(ctx,state,x,y,pos,theme){
    var v=theme.visual;
    ctx.fillStyle=v.stone;
    ctx.fillRect(pos.x,pos.y,TILE,TILE);
    ctx.strokeStyle='rgba(31,35,38,.55)';
    ctx.lineWidth=1;
    ctx.strokeRect(pos.x+.5,pos.y+.5,TILE-1,TILE-1);
    ctx.beginPath();
    ctx.moveTo(pos.x,pos.y+16.5);ctx.lineTo(pos.x+TILE,pos.y+16.5);
    ctx.moveTo(pos.x+16.5,pos.y);ctx.lineTo(pos.x+16.5,pos.y+TILE);
    ctx.stroke();
    if(v.corridorStyle==='icePath'||v.corridorStyle==='waterStone'){
      ctx.strokeStyle='rgba(190,238,248,.32)';
      line(ctx,pos.x+4,pos.y+12,pos.x+28,pos.y+10);
    }else if(v.corridorStyle==='goldPlate'||v.corridorStyle==='violetPath'){
      ctx.strokeStyle='rgba(246,205,94,.26)';
      line(ctx,pos.x+3,pos.y+3,pos.x+29,pos.y+29);
    }else if(v.corridorStyle==='whiteStone'){
      ctx.fillStyle='rgba(255,248,220,.18)';
      ctx.fillRect(pos.x+6,pos.y+6,20,4);
    }
  }
  function drawTerrainTile(ctx,state,theme,x,y,pos,floor){
    var visual=theme.visual,room=floor&&roomAt(state,x,y);
    if(!visual){
      ctx.fillStyle=floor?(room?theme.floor:theme.corridor):theme.wall;
      ctx.fillRect(pos.x,pos.y,TILE,TILE);
      if(floor){ctx.strokeStyle=theme.grid;ctx.strokeRect(pos.x+.5,pos.y+.5,TILE-1,TILE-1);}
      return;
    }
    if(!floor)return drawCastleWall(ctx,state,x,y,pos,theme);
    if(room)return drawCastleRoom(ctx,state,x,y,pos,theme,room);
    drawCastleCorridor(ctx,state,x,y,pos,theme);
  }
  function drawFacingArrow(ctx,x,y,facing){var f=facing||{dx:0,dy:1},length=Math.sqrt(f.dx*f.dx+f.dy*f.dy)||1,dx=f.dx/length,dy=f.dy/length,cx=x+16,cy=y+16,tipX=cx+dx*18,tipY=cy+dy*18,baseX=cx+dx*10,baseY=cy+dy*10,px=-dy,py=dx;ctx.save();ctx.strokeStyle='rgba(20,24,20,.88)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(baseX,baseY);ctx.lineTo(tipX,tipY);ctx.moveTo(tipX,tipY);ctx.lineTo(tipX-dx*5+px*4,tipY-dy*5+py*4);ctx.moveTo(tipX,tipY);ctx.lineTo(tipX-dx*5-px*4,tipY-dy*5-py*4);ctx.stroke();ctx.strokeStyle='#fff0a2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(baseX,baseY);ctx.lineTo(tipX,tipY);ctx.moveTo(tipX,tipY);ctx.lineTo(tipX-dx*5+px*4,tipY-dy*5+py*4);ctx.moveTo(tipX,tipY);ctx.lineTo(tipX-dx*5-px*4,tipY-dy*5-py*4);ctx.stroke();ctx.restore();}
  function renderMain(state,time){var canvas=document.querySelector('#game');if(!canvas)return;var ctx=canvas.getContext('2d'),theme=K.Themes.forFloor(state.floor),frame=K.Animation.playerFrame(time),renderX=state.player.x+(frame.offsetX||0),renderY=state.player.y+(frame.offsetY||0),cam=cameraAt(renderX,renderY),startX=Math.max(0,Math.floor(cam.x)),startY=Math.max(0,Math.floor(cam.y)),endX=Math.min(K.Config.width,Math.ceil(cam.x+VW)),endY=Math.min(K.Config.height,Math.ceil(cam.y+VH));ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;ctx.fillStyle='#020302';ctx.fillRect(0,0,canvas.width,canvas.height);for(var y=startY;y<endY;y++)for(var x=startX;x<endX;x++){if(!K.Visibility.isMapped(state,x,y))continue;var visible=K.Visibility.isVisible(state,x,y),floor=state.map[y]&&state.map[y][x]===1,pos=screen(cam,x,y);ctx.save();ctx.globalAlpha=visible?1:.3;drawTerrainTile(ctx,state,theme,x,y,pos,floor);ctx.restore();}ctx.globalAlpha=1;if(state.stairs&&K.Visibility.isVisible(state,state.stairs.x,state.stairs.y)&&inView(cam,state.stairs.x,state.stairs.y)){var st=screen(cam,state.stairs.x,state.stairs.y);K.Stairs[state.stairs.type==='up'?'drawUp':'drawDown'](ctx,st.x+6,st.y+6);}
    state.traps.forEach(function(trap){if(trap.revealed&&K.Visibility.isVisible(state,trap.x,trap.y)&&inView(cam,trap.x,trap.y)){var p=screen(cam,trap.x,trap.y);if(K.TrapRenderer)K.TrapRenderer.draw(ctx,trap,p.x,p.y,32);else{ctx.strokeStyle='#bd79d0';ctx.beginPath();ctx.arc(p.x+16,p.y+16,8,0,Math.PI*2);ctx.stroke();}}});
    state.groundItems.forEach(function(item){if(K.Visibility.isVisible(state,item.x,item.y)&&inView(cam,item.x,item.y)&&!(state.player.x===item.x&&state.player.y===item.y)){var p=screen(cam,item.x,item.y);K.ItemIcons.draw(ctx,item.category,p.x+3,p.y+3,26);}});
    state.enemies.forEach(function(enemy){var enemyFrame=K.Animation.enemyFrame(enemy,time),enemyX=enemy.x+(enemyFrame.offsetX||0),enemyY=enemy.y+(enemyFrame.offsetY||0);if(!K.Visibility.isEntityVisible(state,enemy.x,enemy.y)||!inView(cam,enemyX,enemyY))return;var p=screen(cam,enemyX,enemyY);K.Sprites.drawEnemy(ctx,enemy,p.x,p.y,enemyFrame,time);if(enemy.spawnSleep||enemy.effectSleep>0){ctx.fillStyle='#d8e4ff';ctx.font='bold 10px sans-serif';ctx.fillText('z',p.x+23,p.y+7);}});K.Animation.deathFrames(time).forEach(function(death){var enemy=death.enemy;if(!inView(cam,enemy.x,enemy.y))return;var p=screen(cam,enemy.x,enemy.y);ctx.save();ctx.globalAlpha=Math.max(0,1-death.progress);if(Math.floor(death.progress*8)%2===0)ctx.globalAlpha*=.35;K.Sprites.drawEnemy(ctx,enemy,p.x,p.y,{type:'damage',progress:death.progress},time);ctx.restore();});var pp=screen(cam,renderX,renderY);K.Sprites.drawPlayer(ctx,pp.x,pp.y,frame,time,(K.Direction8&&K.Direction8.fromActor(state.player))||frame.facing,state.player);var name=K.Themes.forFloor(state.floor).name;ctx.globalAlpha=.68;ctx.fillStyle='#080a08';ctx.fillRect(5,5,Math.ceil(ctx.measureText(name).width)+12,21);ctx.globalAlpha=1;ctx.fillStyle='#f2eac5';ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText(name,11,19);}
  function renderMini(state){var canvas=document.querySelector('#minimap');if(!canvas)return;var ctx=canvas.getContext('2d'),s=5;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(2,3,2,.72)';ctx.fillRect(0,0,canvas.width,canvas.height);for(var y=0;y<K.Config.height;y++)for(var x=0;x<K.Config.width;x++){if(!K.Visibility.isMapped(state,x,y))continue;var visible=K.Visibility.isVisible(state,x,y),floor=state.map[y]&&state.map[y][x]===1;ctx.fillStyle=floor?(visible?'#747d6b':'#343a31'):(visible?'#51584c':'#20241f');ctx.fillRect(x*s,y*s,s,s);}state.groundItems.forEach(function(item){if(K.Visibility.isMapped(state,item.x,item.y))circle(ctx,item.x*s+2.5,item.y*s+2.5,2,'#43d5ec');});state.enemies.forEach(function(enemy){if(K.Visibility.shouldShowEnemyOnMap?K.Visibility.shouldShowEnemyOnMap(state,enemy):K.Visibility.isEntityVisible(state,enemy.x,enemy.y)){circle(ctx,enemy.x*s+2.5,enemy.y*s+2.5,2,'#ed382f');if(enemy.spawnSleep||enemy.effectSleep>0){ctx.fillStyle='#ffd8d8';ctx.font='5px sans-serif';ctx.fillText('z',enemy.x*s+3.5,enemy.y*s+1.5);}}});state.traps.forEach(function(trap){if(K.Visibility.shouldShowTrapOnMap?K.Visibility.shouldShowTrapOnMap(state,trap):(trap.revealed&&K.Visibility.isMapped(state,trap.x,trap.y))){if(K.TrapRenderer)K.TrapRenderer.drawMini(ctx,trap,trap.x*s+2.5,trap.y*s+2.5,s);else circle(ctx,trap.x*s+2.5,trap.y*s+2.5,1.7,'#bd55d9');}});if(state.stairs&&K.Visibility.isMapped(state,state.stairs.x,state.stairs.y)){ctx.strokeStyle='#42d9e8';ctx.lineWidth=1.5;ctx.strokeRect(state.stairs.x*s+.75,state.stairs.y*s+.75,3.5,3.5);}circle(ctx,state.player.x*s+2.5,state.player.y*s+2.5,2.3,'#ffd51f');}
  K.UI.draw=function(state){oldDraw.call(K.UI,state);var time=typeof performance!=='undefined'?performance.now():Date.now();renderMain(state,time);renderMini(state);};K.UI.renderAnimationFrame=function(state,time){renderMain(state,time);};K.UI.renderStage16Minimap=renderMini;K.UI.stage16Camera=camera;K.UI.stage21RenderCamera=function(state,time){var frame=K.Animation.playerFrame(time);return cameraAt(state.player.x+(frame.offsetX||0),state.player.y+(frame.offsetY||0));};K.UI.drawFacingArrow=drawFacingArrow;
})(window.Kiri=window.Kiri||{});

