(function(K){
  'use strict';
  var C=K.Config,U=K.Util;
  var TERRAIN_TYPES=Object.freeze({
    standard:{id:'standard',name:'標準区画型'},
    horizontal:{id:'horizontal',name:'横長型'},
    vertical:{id:'vertical',name:'縦長型'},
    perimeter:{id:'perimeter',name:'外周型'},
    bigMixed:{id:'bigMixed',name:'大部屋混合型'},
    branch:{id:'branch',name:'分岐型'},
    maze:{id:'maze',name:'迷路型'},
    legacy:{id:'legacy',name:'既存生成型'}
  });

  function empty(){return Array.from({length:C.height},function(){return Array(C.width).fill(0);});}
  function inside(x,y){return x>=1&&y>=1&&x<C.width-1&&y<C.height-1;}
  function overlap(a,b,pad){pad=pad===undefined?1:pad;return a.x<=b.x+b.w+pad&&a.x+a.w+pad>=b.x&&a.y<=b.y+b.h+pad&&a.y+a.h+pad>=b.y;}
  function carveRoom(m,r){for(var y=r.y;y<r.y+r.h;y++)for(var x=r.x;x<r.x+r.w;x++)m[y][x]=1;}
  function lineX(m,a,b,y){for(var x=Math.min(a,b);x<=Math.max(a,b);x++)if(inside(x,y))m[y][x]=1;}
  function lineY(m,a,b,x){for(var y=Math.min(a,b);y<=Math.max(a,b);y++)if(inside(x,y))m[y][x]=1;}
  function outVec(side){return{x:side==='left'?-1:side==='right'?1:0,y:side==='top'?-1:side==='bottom'?1:0};}
  function perpendicular(side){return side==='top'||side==='bottom'?[{x:-1,y:0},{x:1,y:0}]:[{x:0,y:-1},{x:0,y:1}];}
  function entranceDistanceOk(room,side,x,y){
    var entries=room.entrances||[],small=(side==='top'||side==='bottom'?room.w:room.h)<6;
    if(small&&entries.some(function(e){return e.side===side;}))return false;
    return !entries.some(function(e){
      if(e.side!==side)return false;
      var d=side==='top'||side==='bottom'?Math.abs(e.x-x):Math.abs(e.y-y);
      return d<3;
    });
  }
  function chooseEntrance(room,side,other,connectedRoomId){
    var tries=28,x=room.cx,y=room.cy;
    while(tries--){
      if(side==='top'||side==='bottom'){
        x=Math.max(room.x+1,Math.min(room.x+room.w-2,other.cx+U.rand(7)-3));
        y=side==='top'?room.y:room.y+room.h-1;
      }else{
        x=side==='left'?room.x:room.x+room.w-1;
        y=Math.max(room.y+1,Math.min(room.y+room.h-2,other.cy+U.rand(7)-3));
      }
      if(entranceDistanceOk(room,side,x,y)){
        var v=outVec(side),len=2+U.rand(2),stem=[];
        for(var n=1;n<=len;n++)stem.push({x:x+v.x*n,y:y+v.y*n});
        return{x:x,y:y,side:side,outwardX:v.x,outwardY:v.y,stemLength:len,stem:stem,connectedRoomId:connectedRoomId};
      }
    }
    return null;
  }
  function sideToward(a,b){
    var dx=b.cx-a.cx,dy=b.cy-a.cy;
    if(Math.abs(dx)>=Math.abs(dy))return dx>0?'right':'left';
    return dy>0?'bottom':'top';
  }
  function opposite(side){return{left:'right',right:'left',top:'bottom',bottom:'top'}[side];}
  function pathLine(a,b){
    var cells=[],x=a.x,y=a.y,dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);
    cells.push({x:x,y:y});
    while(x!==b.x){x+=dx;cells.push({x:x,y:y});}
    while(y!==b.y){y+=dy;cells.push({x:x,y:y});}
    return cells;
  }
  function doglegPath(pa,pb,horizontalFirst){
    var mid=horizontalFirst?{x:pb.x,y:pa.y}:{x:pa.x,y:pb.y};
    return pathLine(pa,mid).concat(pathLine(mid,pb).slice(1));
  }
  function forbiddenWallSide(rooms,x,y,allowed){
    var k=U.key(x,y);
    if(allowed&&allowed[k])return false;
    return rooms.some(function(r){
      if(y===r.y-1&&x>=r.x&&x<r.x+r.w)return true;
      if(y===r.y+r.h&&x>=r.x&&x<r.x+r.w)return true;
      if(x===r.x-1&&y>=r.y&&y<r.y+r.h)return true;
      if(x===r.x+r.w&&y>=r.y&&y<r.y+r.h)return true;
      return false;
    });
  }
  function routedPath(m,rooms,start,goal,allowed){
    var q=[start],seen={},prev={},limit=0;seen[U.key(start.x,start.y)]=1;
    while(q.length&&limit++<2200){
      var p=q.shift(),pk=U.key(p.x,p.y);
      if(p.x===goal.x&&p.y===goal.y)break;
      var dirs=U.shuffle?U.shuffle([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]):[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      dirs.sort(function(a,b){
        return (Math.abs(p.x+a.x-goal.x)+Math.abs(p.y+a.y-goal.y))-(Math.abs(p.x+b.x-goal.x)+Math.abs(p.y+b.y-goal.y));
      });
      dirs.forEach(function(d){
        var nx=p.x+d.x,ny=p.y+d.y,nk=U.key(nx,ny);
        if(seen[nk]||!inside(nx,ny)||roomOf(rooms,nx,ny)||forbiddenWallSide(rooms,nx,ny,allowed))return;
        seen[nk]=1;prev[nk]=pk;q.push({x:nx,y:ny});
      });
    }
    var gk=U.key(goal.x,goal.y);
    if(!seen[gk])return null;
    var out=[],cur=gk;
    while(cur){var a=cur.split(',');out.push({x:Number(a[0]),y:Number(a[1])});if(cur===U.key(start.x,start.y))break;cur=prev[cur];}
    return out.reverse();
  }
  function uniquePath(cells){
    var seen={},out=[];
    cells.forEach(function(c){var k=U.key(c.x,c.y);if(!seen[k]){seen[k]=1;out.push({x:c.x,y:c.y});}});
    return out;
  }
  function connectionKey(a,b){return[a.id,b.id].sort(function(x,y){return x-y;}).join('-');}
  function sideCandidates(a,b){
    var primary=sideToward(a,b),secondary=Math.abs(b.cx-a.cx)>=Math.abs(b.cy-a.cy)?(b.cy>a.cy?'bottom':'top'):(b.cx>a.cx?'right':'left');
    var list=[primary,secondary,'top','right','bottom','left'],seen={};
    return list.filter(function(s){if(seen[s])return false;seen[s]=1;return true;});
  }
  function tempTiles(m,path){
    var t=m.map(function(row){return row.slice();});
    path.forEach(function(p){if(p.y>=0&&p.y<C.height&&p.x>=0&&p.x<C.width)t[p.y][p.x]=1;});
    return t;
  }
  function roomOf(rooms,x,y){
    return rooms.find(function(r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;});
  }
  function isEntranceCell(e,x,y){return e&&e.x===x&&e.y===y;}
  function validCandidate(m,rooms,path,ea,eb,debug){
    var invalid=(debug.invalid=debug.invalid||[]),allowed={};
    allowed[U.key(ea.x,ea.y)]=1;allowed[U.key(eb.x,eb.y)]=1;
    for(var i=0;i<path.length;i++){
      var p=path[i];
      if(!inside(p.x,p.y)){invalid.push({x:p.x,y:p.y,reason:'範囲外'});return false;}
      var r=roomOf(rooms,p.x,p.y);
      if(r&&!allowed[U.key(p.x,p.y)]){invalid.push({x:p.x,y:p.y,reason:'部屋内部を横切る'});return false;}
    }
    var tiles=tempTiles(m,path),probe={tiles:tiles,rooms:rooms};
    if(!validateEntranceList(probe,[ea,eb],debug))return false;
    if(!validateWallParallel(probe,debug,[ea,eb]))return false;
    if(!validateCorridorWidth(probe,debug))return false;
    return true;
  }
  function corridor(m,a,b,debug){
    if(!a||!b||a===b)return false;
    debug=debug||{connections:[]};
    debug.connectionKeys=debug.connectionKeys||{};
    var key=connectionKey(a,b);
    if(debug.connectionKeys[key])return false;
    var sides=sideCandidates(a,b);
    for(var attempt=0;attempt<72;attempt++){
      var sideA=sides[U.rand(sides.length)],sideB=opposite(sideA);
      var ea=chooseEntrance(a,sideA,b,b.id),eb=chooseEntrance(b,sideB,a,a.id);
      if(!ea||!eb)continue;
      var start=ea.stem[ea.stem.length-1],goal=eb.stem[eb.stem.length-1],allowed={};
      ea.stem.concat(eb.stem).forEach(function(c){allowed[U.key(c.x,c.y)]=1;});
      var middle=routedPath(m,K.MapLastRooms||[],start,goal,allowed)||doglegPath(start,goal,U.rand(2)===0);
      var path=uniquePath([{x:ea.x,y:ea.y}].concat(ea.stem,middle,eb.stem.slice().reverse(),[{x:eb.x,y:eb.y}]));
      if(!validCandidate(m,K.MapLastRooms||[],path,ea,eb,debug))continue;
      path.forEach(function(p){m[p.y][p.x]=1;});
      a.entrances=a.entrances||[];b.entrances=b.entrances||[];
      a.entrances.push(ea);b.entrances.push(eb);
      debug.connectionKeys[key]=1;
      debug.connections.push([a.id,b.id]);
      debug.corridors=debug.corridors||[];
      debug.corridors.push({fromRoomId:a.id,toRoomId:b.id,fromEntrance:ea,toEntrance:eb,path:path});
      debug.entrances=debug.entrances||[];
      debug.entrances.push({from:a.id,to:b.id,a:{x:ea.x,y:ea.y,side:ea.side,outwardX:ea.outwardX,outwardY:ea.outwardY},b:{x:eb.x,y:eb.y,side:eb.side,outwardX:eb.outwardX,outwardY:eb.outwardY}});
      return true;
    }
    debug.invalid=(debug.invalid||[]).concat([{x:a.cx,y:a.cy,reason:'通路候補を作れない: '+a.id+'-'+b.id}]);
    return false;
  }
  function addRoom(m,rooms,r,meta){
    r.x=Math.max(1,Math.min(C.width-r.w-2,r.x));
    r.y=Math.max(1,Math.min(C.height-r.h-2,r.y));
    r.cx=r.x+Math.floor(r.w/2);r.cy=r.y+Math.floor(r.h/2);r.id=rooms.length;Object.assign(r,meta||{});
    if(rooms.some(function(o){return overlap(r,o,1);}))return null;
    rooms.push(r);K.MapLastRooms=rooms;carveRoom(m,r);return r;
  }
  function randomRoomIn(cell,wide,tall){
    var minW=wide?7:4,maxW=wide?Math.max(8,cell.w-2):Math.min(8,cell.w-2);
    var minH=tall?6:4,maxH=tall?Math.max(7,cell.h-2):Math.min(7,cell.h-2);
    maxW=Math.max(minW,Math.min(maxW,cell.w-2));maxH=Math.max(minH,Math.min(maxH,cell.h-2));
    var w=Math.min(cell.w-2,minW+U.rand(Math.max(1,maxW-minW+1))),h=Math.min(cell.h-2,minH+U.rand(Math.max(1,maxH-minH+1)));
    return{x:cell.x+1+U.rand(Math.max(1,cell.w-w-1)),y:cell.y+1+U.rand(Math.max(1,cell.h-h-1)),w:w,h:h};
  }
  function gridCells(cols,rows){
    var cells=[],left=1,top=1,usableW=C.width-2,usableH=C.height-2;
    for(var gy=0;gy<rows;gy++)for(var gx=0;gx<cols;gx++){
      var x=left+Math.floor(gx*usableW/cols),nx=left+Math.floor((gx+1)*usableW/cols);
      var y=top+Math.floor(gy*usableH/rows),ny=top+Math.floor((gy+1)*usableH/rows);
      cells.push({x:x,y:y,w:nx-x,h:ny-y,gx:gx,gy:gy});
    }
    return cells;
  }
  function connectAll(m,rooms,debug,prefer){
    if(rooms.length<2)return;
    var connected=[rooms[0]],left=rooms.slice(1);
    while(left.length){
      var best=null;
      connected.forEach(function(a){left.forEach(function(b,i){
        var d=Math.abs(a.cx-b.cx)+Math.abs(a.cy-b.cy);
        if(prefer==='horizontal')d-=Math.abs(a.cx-b.cx)*.35;
        if(prefer==='vertical')d-=Math.abs(a.cy-b.cy)*.35;
        if(!best||d<best.d)best={a:a,b:b,i:i,d:d};
      });});
      corridor(m,best.a,best.b,debug);connected.push(best.b);left.splice(best.i,1);
    }
  }
  function generateStandard(type){
    var m=empty(),rooms=[],debug={zones:gridCells(3,3),connections:[]};
    debug.zones.forEach(function(cell){
      if(U.rand(100)<22&&rooms.length>=5)return;
      addRoom(m,rooms,randomRoomIn(cell),{zone:{gx:cell.gx,gy:cell.gy}});
    });
    if(rooms.length<4)debug.zones.forEach(function(cell){if(rooms.length<4)addRoom(m,rooms,randomRoomIn(cell),{zone:{gx:cell.gx,gy:cell.gy}});});
    connectAll(m,rooms,debug);
    if(rooms.length>5)corridor(m,rooms[U.rand(rooms.length)],rooms[U.rand(rooms.length)],debug);
    return{tiles:m,rooms:rooms,debug:debug,terrainType:type||TERRAIN_TYPES.standard};
  }
  function generateHorizontal(){
    var m=empty(),rooms=[],debug={zones:gridCells(4,2),connections:[]};
    debug.zones.forEach(function(cell){if(U.rand(100)<18&&rooms.length>=4)return;addRoom(m,rooms,randomRoomIn(cell,true,false),{zone:{gx:cell.gx,gy:cell.gy}});});
    connectAll(m,rooms,debug,'horizontal');
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.horizontal};
  }
  function generateVertical(){
    var m=empty(),rooms=[],debug={zones:gridCells(2,4),connections:[]};
    debug.zones.forEach(function(cell){if(U.rand(100)<18&&rooms.length>=4)return;addRoom(m,rooms,randomRoomIn(cell,false,true),{zone:{gx:cell.gx,gy:cell.gy}});});
    connectAll(m,rooms,debug,'vertical');
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.vertical};
  }
  function generateBigMixed(){
    var m=empty(),rooms=[],debug={zones:gridCells(3,3),connections:[]};
    addRoom(m,rooms,{x:8+U.rand(5),y:6+U.rand(4),w:11+U.rand(5),h:8+U.rand(4)},{big:true});
    gridCells(4,3).forEach(function(cell){if(U.rand(100)<55)return;addRoom(m,rooms,randomRoomIn(cell),{zone:{gx:cell.gx,gy:cell.gy}});});
    connectAll(m,rooms,debug);
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.bigMixed};
  }
  function generatePerimeter(){
    var m=empty(),rooms=[],debug={zones:gridCells(4,3),connections:[]},edgeRooms=[];
    [{x:2,y:2,w:7,h:5},{x:C.width-10,y:2,w:7,h:5},{x:2,y:C.height-7,w:7,h:5},{x:C.width-10,y:C.height-7,w:7,h:5}].forEach(function(r){var room=addRoom(m,rooms,r,{edge:true});if(room)edgeRooms.push(room);});
    for(var i=0;i<edgeRooms.length;i++)corridor(m,edgeRooms[i],edgeRooms[(i+1)%edgeRooms.length],debug);
    gridCells(3,2).forEach(function(cell){if(U.rand(100)<28)return;addRoom(m,rooms,randomRoomIn(cell),{zone:{gx:cell.gx,gy:cell.gy}});});
    connectAll(m,rooms,debug);
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.perimeter};
  }
  function generateBranch(){
    var m=empty(),rooms=[],debug={zones:gridCells(3,3),connections:[]},center=addRoom(m,rooms,{x:12+U.rand(3),y:8+U.rand(3),w:7,h:6},{hub:true});
    gridCells(3,3).forEach(function(cell){if(cell.gx===1&&cell.gy===1)return;if(U.rand(100)<30&&rooms.length>=5)return;var r=addRoom(m,rooms,randomRoomIn(cell),{zone:{gx:cell.gx,gy:cell.gy}});if(r&&center)corridor(m,center,r,debug);});
    connectAll(m,rooms,debug);
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.branch};
  }
  function generateMaze(){
    var m=empty(),rooms=[],debug={zones:gridCells(4,3),connections:[],maze:true};
    debug.zones.forEach(function(cell){
      if(U.rand(100)<12&&rooms.length>=6)return;
      var r=randomRoomIn(cell,false,false);
      r.w=Math.max(4,Math.min(r.w,6+U.rand(2)));
      r.h=Math.max(4,Math.min(r.h,5+U.rand(2)));
      addRoom(m,rooms,r,{zone:{gx:cell.gx,gy:cell.gy},maze:true});
    });
    connectAll(m,rooms,debug);
    for(var i=0;i<Math.min(3,rooms.length);i++)corridor(m,rooms[U.rand(rooms.length)],rooms[U.rand(rooms.length)],debug);
    return{tiles:m,rooms:rooms,debug:debug,terrainType:TERRAIN_TYPES.maze};
  }
  function legacyGenerate(){
    var m=empty(),rs=[],debug={zones:[],connections:[]};
    for(var t=0;t<180&&rs.length<10;t++){
      var w=4+U.rand(6),h=4+U.rand(5),r={x:1+U.rand(C.width-w-2),y:1+U.rand(C.height-h-2),w:w,h:h};
      r.cx=r.x+Math.floor(w/2);r.cy=r.y+Math.floor(h/2);r.id=rs.length;
      if(rs.some(function(o){return overlap(r,o,1);}))continue;
      rs.push(r);carveRoom(m,r);
    }
    if(rs.length<2)return generateStandard(TERRAIN_TYPES.legacy);
    connectAll(m,rs,debug);
    if(rs.length>=5)corridor(m,rs[U.rand(rs.length)],rs[U.rand(rs.length)],debug);
    return{tiles:m,rooms:rs,debug:debug,terrainType:TERRAIN_TYPES.legacy};
  }
  function tableFor(floor){
    if(floor>=50&&floor%10===0||floor===99)return[{id:'maze',w:45},{id:'standard',w:15},{id:'branch',w:15},{id:'bigMixed',w:15},{id:'perimeter',w:10}];
    if(floor<=3)return[{id:'standard',w:60},{id:'maze',w:10},{id:'horizontal',w:15},{id:'vertical',w:15}];
    if(floor<=8)return[{id:'standard',w:35},{id:'maze',w:10},{id:'horizontal',w:15},{id:'vertical',w:15},{id:'branch',w:15},{id:'bigMixed',w:10}];
    return[{id:'standard',w:20},{id:'maze',w:15},{id:'horizontal',w:10},{id:'vertical',w:10},{id:'branch',w:20},{id:'bigMixed',w:15},{id:'perimeter',w:10}];
  }
  function chooseTerrain(floor,forced){
    if(forced&&TERRAIN_TYPES[forced])return TERRAIN_TYPES[forced];
    var table=tableFor(floor||1),total=table.reduce(function(n,e){return n+e.w;},0),r=U.rand(total);
    for(var i=0;i<table.length;i++){r-=table[i].w;if(r<0)return TERRAIN_TYPES[table[i].id];}
    return TERRAIN_TYPES.standard;
  }
  function byType(type){
    if(type.id==='horizontal')return generateHorizontal();
    if(type.id==='vertical')return generateVertical();
    if(type.id==='perimeter')return generatePerimeter();
    if(type.id==='bigMixed')return generateBigMixed();
    if(type.id==='branch')return generateBranch();
    if(type.id==='maze')return generateMaze();
    return generateStandard(type);
  }
  function countInvalid(stats,g){
    ((g&&g.debug&&g.debug.invalid)||[]).forEach(function(e){
      stats.failureReasons[e.reason]=(stats.failureReasons[e.reason]||0)+1;
    });
  }
  function flood(tiles,start){
    var q=[[start.x,start.y]],seen={};seen[U.key(start.x,start.y)]=1;
    while(q.length){var p=q.shift();[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var x=p[0]+d[0],y=p[1]+d[1],k=U.key(x,y);if(y>=0&&y<C.height&&x>=0&&x<C.width&&tiles[y][x]&&!seen[k]){seen[k]=1;q.push([x,y]);}});}
    return seen;
  }
  function isRoomTile(g,x,y){return g.rooms.some(function(r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;});}
  function fail(debug,x,y,reason){if(debug)(debug.invalid=debug.invalid||[]).push({x:x,y:y,reason:reason});return false;}
  function entranceOnSide(room,e){
    if(!e)return false;
    if(e.side==='top')return e.y===room.y&&e.x>room.x&&e.x<room.x+room.w-1;
    if(e.side==='bottom')return e.y===room.y+room.h-1&&e.x>room.x&&e.x<room.x+room.w-1;
    if(e.side==='left')return e.x===room.x&&e.y>room.y&&e.y<room.y+room.h-1;
    if(e.side==='right')return e.x===room.x+room.w-1&&e.y>room.y&&e.y<room.y+room.h-1;
    return false;
  }
  function entranceFor(room,side,axis,extra){
    var entries=(room.entrances||[]).slice();
    (extra||[]).forEach(function(e){if(entranceOnSide(room,e))entries.push(e);});
    return entries.filter(function(e){
      if(e.side!==side)return false;
      return side==='top'||side==='bottom'?e.x===axis:e.y===axis;
    })[0];
  }
  function validateEntranceList(g,extra,debug){
    var extraByRoom={};
    (extra||[]).forEach(function(e){var id=e.connectedRoomId===undefined?null:null;});
    for(var i=0;i<g.rooms.length;i++){
      var r=g.rooms[i],entries=(r.entrances||[]).slice();
      (extra||[]).forEach(function(e){if(entranceOnSide(r,e)&&!entries.some(function(q){return q.x===e.x&&q.y===e.y&&q.side===e.side;}))entries.push(e);});
      var sideAxes={};
      for(var j=0;j<entries.length;j++){
        var e=entries[j],v=outVec(e.side);
        if(!entranceOnSide(r,e))return fail(debug,e.x,e.y,'入口が部屋外周上にない/角入口');
        var axis=e.side==='top'||e.side==='bottom'?e.x:e.y,sideKey=e.side;
        sideAxes[sideKey]=sideAxes[sideKey]||[];
        for(var a=0;a<sideAxes[sideKey].length;a++)if(Math.abs(sideAxes[sideKey][a]-axis)<3)return fail(debug,e.x,e.y,'同一辺の入口が近接');
        sideAxes[sideKey].push(axis);
        for(var step=1;step<=2;step++){
          var sx=e.x+v.x*step,sy=e.y+v.y*step;
          if(!inside(sx,sy)||!g.tiles[sy][sx]||isRoomTile(g,sx,sy))return fail(debug,sx,sy,'入口直前2マスの直線不足');
          var perps=perpendicular(e.side);
          for(var p=0;p<perps.length;p++){
            var nx=sx+perps[p].x,ny=sy+perps[p].y;
            if(inside(nx,ny)&&g.tiles[ny][nx]&&!isRoomTile(g,nx,ny))return fail(debug,nx,ny,'入口直前の曲がり/T字');
          }
        }
      }
    }
    return true;
  }
  function validateWallParallel(g,debug,extra){
    for(var i=0;i<g.rooms.length;i++){
      var r=g.rooms[i],checks=[
        {side:'top',y:r.y-1,from:r.x,to:r.x+r.w-1,h:true},
        {side:'bottom',y:r.y+r.h,from:r.x,to:r.x+r.w-1,h:true},
        {side:'left',x:r.x-1,from:r.y,to:r.y+r.h-1,h:false},
        {side:'right',x:r.x+r.w,from:r.y,to:r.y+r.h-1,h:false}
      ];
      for(var c=0;c<checks.length;c++){
        var ch=checks[c],run=0;
        for(var n=ch.from;n<=ch.to;n++){
          var x=ch.h?n:ch.x,y=ch.h?ch.y:n,axis=n,ok=inside(x,y)&&g.tiles[y][x]&&!isRoomTile(g,x,y);
          if(ok&&!entranceFor(r,ch.side,axis,extra))return fail(debug,x,y,'部屋外壁沿い通路');
          if(ok)run++;else run=0;
          if(run>=2)return fail(debug,x,y,'部屋外壁沿いの平行連続');
        }
      }
    }
    return true;
  }
  function validateCorridorWidth(g,debug){
    for(var y=1;y<C.height-1;y++)for(var x=1;x<C.width-1;x++){
      var cells=[[x,y],[x+1,y],[x,y+1],[x+1,y+1]];
      if(cells.every(function(c){return g.tiles[c[1]][c[0]]&&!isRoomTile(g,c[0],c[1]);}))return fail(debug,x,y,'部屋外2マス幅通路');
    }
    return true;
  }
  function validateDuplicateConnections(g,debug){
    var seen={};
    (g.debug&&g.debug.corridors||[]).forEach(function(c){
      var k=[c.fromRoomId,c.toRoomId].sort(function(a,b){return a-b;}).join('-');
      seen[k]=(seen[k]||0)+1;
    });
    return !Object.keys(seen).some(function(k){if(seen[k]>1){var id=Number(k.split('-')[0]),r=g.rooms[id]||g.rooms[0];return !fail(debug,r.cx,r.cy,'重複接続 '+k);}return false;});
  }
  function validateEntrances(g){
    var debug=g.debug||{};
    return validateEntranceList(g,null,debug)&&validateWallParallel(g,debug)&&validateCorridorWidth(g,debug)&&validateDuplicateConnections(g,debug);
  }
  function validate(g){
    if(!g||!g.tiles||!g.rooms||g.rooms.length<2)return false;
    if(g.tiles[0].some(Boolean)||g.tiles[C.height-1].some(Boolean)||g.tiles.some(function(row){return row[0]||row[C.width-1];}))return false;
    var start=g.rooms[0],goal=g.rooms[g.rooms.length-1];if(!g.tiles[start.cy]||!g.tiles[start.cy][start.cx]||!g.tiles[goal.cy]||!g.tiles[goal.cy][goal.cx])return false;
    if(start.cx===goal.cx&&start.cy===goal.cy)return false;
    var seen=flood(g.tiles,{x:start.cx,y:start.cy}),floors=0;
    for(var y=0;y<C.height;y++)for(var x=0;x<C.width;x++)if(g.tiles[y][x]){floors++;if(!seen[U.key(x,y)])return false;}
    if(floors<45)return false;
    for(var i=0;i<g.rooms.length;i++){var r=g.rooms[i];if(!seen[U.key(r.cx,r.cy)])return false;for(var yy=r.y;yy<r.y+r.h;yy++)for(var xx=r.x;xx<r.x+r.w;xx++)if(!g.tiles[yy]||!g.tiles[yy][xx])return false;}
    if(!validateEntrances(g))return false;
    return true;
  }
  function stateOptions(options){
    var s=K.State&&K.State.data;
    options=options||{};
    if(s){if(options.floor===undefined)options.floor=s.floor;if(options.dungeonId===undefined)options.dungeonId=s.dungeonId;if(options.terrainType===undefined)options.terrainType=s.gmTerrainType;}
    return options;
  }
  function remember(g){
    K.MapLastGenerated=g;
    if(K.State&&K.State.data){K.State.data.terrainType=g.terrainType&&g.terrainType.id;K.State.data.terrainTypeName=g.terrainType&&g.terrainType.name;K.State.data.mapDebug=g.debug||null;}
    return g;
  }
  K.Map={
    terrainTypes:TERRAIN_TYPES,
    terrainTableFor:tableFor,
    chooseTerrain:chooseTerrain,
    generateLegacy:legacyGenerate,
    generate:function(options){
      options=stateOptions(options);
      var forced=options.terrainType==='auto'?null:options.terrainType,type=chooseTerrain(options.floor||1,forced);
      var stats={requested:type.id,successType:null,attempts:0,regenerations:0,fallback:false,finalFailure:false,failureReasons:{}};
      for(var i=0;i<24;i++){var g=byType(type);stats.attempts++;if(validate(g)){stats.successType=g.terrainType.id;stats.regenerations=i;g.debug=g.debug||{};g.debug.generationStats=stats;return remember(g);}countInvalid(stats,g);}
      stats.fallback=true;
      for(var j=0;j<12;j++){var f=generateStandard(TERRAIN_TYPES.standard);stats.attempts++;if(validate(f)){stats.successType=f.terrainType.id;stats.regenerations=stats.attempts-1;f.debug=f.debug||{};f.debug.generationStats=stats;return remember(f);}countInvalid(stats,f);}
      var last=legacyGenerate();stats.attempts++;stats.successType=last.terrainType.id;stats.regenerations=stats.attempts-1;stats.finalFailure=!validate(last);last.debug=last.debug||{};last.debug.generationStats=stats;return remember(last);
    },
    validateGenerated:validate,
    validateRoomEntrances:validateEntrances,
    walkable:function(s,x,y){return x>=0&&y>=0&&x<C.width&&y<C.height&&s.map[y][x]===1;},
    canTraverse:function(s,from,x,y,dx,dy){if(!this.walkable(s,x,y))return false;if(dx&&dy&&(!this.walkable(s,from.x+dx,from.y)||!this.walkable(s,from.x,from.y+dy)))return false;return true;},
    canStep:function(s,x,y,dx,dy){return this.canTraverse(s,s.player,x,y,dx,dy);},
    occupied:function(s,x,y){return(s.player.x===x&&s.player.y===y)||s.enemies.some(function(e){return e.x===x&&e.y===y;})||s.groundItems.some(function(i){return i.x===x&&i.y===y;})||(s.stairs&&s.stairs.x===x&&s.stairs.y===y);},
    freeCell:function(s,start){for(var t=0;t<160;t++){var n=Math.min(start||0,s.rooms.length-1),r=s.rooms[n+U.rand(Math.max(1,s.rooms.length-n))],x=r.x+U.rand(r.w),y=r.y+U.rand(r.h);if(!this.occupied(s,x,y)&&!s.traps.some(function(q){return q.x===x&&q.y===y;}))return{x:x,y:y};}return null;},
    reveal:function(s){var p=s.player,r=C.visionRadius;for(var y=p.y-r;y<=p.y+r;y++)for(var x=p.x-r;x<=p.x+r;x++)if(x>=0&&y>=0&&x<C.width&&y<C.height&&Math.hypot(x-p.x,y-p.y)<=r)s.seen[U.key(x,y)]=1;}
  };
})(window.Kiri=window.Kiri||{});
