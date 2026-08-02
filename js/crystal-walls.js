(function(K){
  'use strict';
  var U=K.Util,C=K.Config;
  function key(x,y){return U.key(x,y);}
  function isWall(state,x,y){return x>=1&&y>=1&&x<C.width-1&&y<C.height-1&&state.map[y]&&state.map[y][x]===0;}
  function adjacentFloor(state,x,y){
    return [[1,0],[-1,0],[0,1],[0,-1]].some(function(d){return K.Map.walkable(state,x+d[0],y+d[1]);});
  }
  function candidates(state){
    var out=[],seen={};
    (state.rooms||[]).forEach(function(r){
      for(var x=r.x;x<r.x+r.w;x++){
        [[x,r.y-1],[x,r.y+r.h]].forEach(function(p){var k=key(p[0],p[1]);if(!seen[k]&&isWall(state,p[0],p[1])&&adjacentFloor(state,p[0],p[1])){seen[k]=1;out.push({x:p[0],y:p[1]});}});
      }
      for(var y=r.y;y<r.y+r.h;y++){
        [[r.x-1,y],[r.x+r.w,y]].forEach(function(p){var k=key(p[0],p[1]);if(!seen[k]&&isWall(state,p[0],p[1])&&adjacentFloor(state,p[0],p[1])){seen[k]=1;out.push({x:p[0],y:p[1]});}});
      }
    });
    return out;
  }
  function place(state){
    var list=candidates(state);
    K.Util.shuffle(list);
    state.crystalWalls=list.slice(0,Math.min(3,Math.max(1,Math.floor((state.rooms||[]).length/4)))).map(function(p){return{x:p.x,y:p.y};});
    return state.crystalWalls;
  }
  function isCrystal(state,x,y){
    return !!(state&&state.crystalWalls||[]).some(function(c){return c.x===x&&c.y===y;});
  }
  function firstInRay(state,max){
    var p=state.player,f=p.facingDirection||{dx:0,dy:1};
    for(var n=1;n<=max;n++){
      var x=p.x+f.dx*n,y=p.y+f.dy*n;
      if((state.enemies||[]).some(function(e){return e.x===x&&e.y===y;}))return null;
      if(!K.Map.walkable(state,x,y))return isCrystal(state,x,y)?{x:x,y:y,distance:n}:null;
    }
    return null;
  }
  function drawOne(ctx,x,y,size){
    var cx=x+size/2,cy=y+size/2;
    ctx.save();
    ctx.fillStyle='rgba(88,232,255,.35)';
    ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx+7,cy);ctx.lineTo(cx,cy+8);ctx.lineTo(cx-7,cy);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#bffcff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#ecffff';ctx.fillRect(Math.round(cx-1),Math.round(cy-5),2,4);
    ctx.restore();
  }
  function drawAll(state,ctx,camera,tile){
    if(!state||!ctx)return;
    tile=tile||32;camera=camera||{x:0,y:0};
    (state.crystalWalls||[]).forEach(function(c){
      if(!state.seen||!state.seen[key(c.x,c.y)]&&!state.vision.mapAll)return;
      drawOne(ctx,Math.round((c.x-camera.x)*tile),Math.round((c.y-camera.y)*tile),tile);
    });
  }
  K.CrystalWalls={place:place,isCrystal:isCrystal,firstInRay:firstInRay,drawAll:drawAll};
})(window.Kiri=window.Kiri||{});
