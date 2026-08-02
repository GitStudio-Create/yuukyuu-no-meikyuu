(function(K){
  'use strict';
  function optionsHtml(){
    var types=K.Map&&K.Map.terrainTypes||{};
    return'<label>地形タイプ<select data-gm-terrain-type><option value="auto">自動抽選</option>'+
      ['standard','horizontal','vertical','perimeter','bigMixed','branch'].map(function(id){
        var t=types[id];return'<option value="'+id+'">'+(t?t.name:id)+'</option>';
      }).join('')+'</select></label><p class="gm-terrain-now" data-gm-terrain-now>地形タイプ：-</p>';
  }
  function state(){return K.State&&K.State.data;}
  function active(){return K.GM&&K.GM.active&&K.GM.active();}
  function terrainName(id){var t=K.Map&&K.Map.terrainTypes&&K.Map.terrainTypes[id];return t?t.name:(id||'自動抽選');}
  function syncPanel(){
    var panel=document.querySelector('#gmPanel'),s=state();
    if(!panel||!s)return;
    var modeSection=panel.querySelector('.gm-grid section');
    if(modeSection&&!panel.querySelector('[data-gm-terrain-type]'))modeSection.insertAdjacentHTML('beforeend',optionsHtml());
    var select=panel.querySelector('[data-gm-terrain-type]'),now=panel.querySelector('[data-gm-terrain-now]');
    if(select)select.value=s.gmTerrainType||'auto';
    if(now){
      var st=s.mapDebug&&s.mapDebug.generationStats;
      now.textContent='地形タイプ：'+(s.terrainTypeName||terrainName(s.terrainType)||'-')+(st?' / 試行 '+st.attempts+' / 再生成 '+st.regenerations:'');
    }
  }
  function applySelection(){
    var s=state(),select=document.querySelector('[data-gm-terrain-type]');
    if(s&&select)s.gmTerrainType=select.value==='auto'?null:select.value;
  }
  function drawDebug(state){
    if(!active()||!(K.GM.flags.overlayMove||K.GM.flags.overlayVision)||!state||!state.mapDebug)return;
    var canvas=document.querySelector('#game'),ctx=canvas&&canvas.getContext('2d'),tile=K.Config.tile,debug=state.mapDebug;
    if(!ctx)return;
    ctx.save();
    (debug.zones||[]).forEach(function(z){
      ctx.strokeStyle='rgba(90,210,255,.28)';
      ctx.lineWidth=1;
      ctx.strokeRect(z.x*tile+.5,z.y*tile+.5,z.w*tile,z.h*tile);
    });
    ctx.font='10px system-ui';
    ctx.textAlign='center';
    state.rooms.forEach(function(r,i){
      ctx.fillStyle='rgba(255,238,150,.95)';
      ctx.fillText(String(i),r.cx*tile+tile/2,r.cy*tile+tile/2);
    });
    (debug.connections||[]).forEach(function(pair){
      var a=state.rooms[pair[0]],b=state.rooms[pair[1]];
      if(!a||!b)return;
      ctx.strokeStyle='rgba(255,190,80,.42)';
      ctx.beginPath();ctx.moveTo(a.cx*tile+tile/2,a.cy*tile+tile/2);ctx.lineTo(b.cx*tile+tile/2,b.cy*tile+tile/2);ctx.stroke();
    });
    (debug.corridors||[]).forEach(function(c){
      ctx.strokeStyle='rgba(120,230,255,.58)';
      ctx.lineWidth=2;
      ctx.beginPath();
      (c.path||[]).forEach(function(p,i){var px=p.x*tile+tile/2,py=p.y*tile+tile/2;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
      ctx.stroke();
      [c.fromEntrance,c.toEntrance].forEach(function(e){
        if(!e)return;
        ctx.fillStyle='rgba(255,235,80,.95)';
        ctx.fillRect(e.x*tile+tile/2-3,e.y*tile+tile/2-3,6,6);
        ctx.fillStyle='rgba(80,255,180,.25)';
        ctx.fillRect((e.x+e.outwardX)*tile,(e.y+e.outwardY)*tile,tile,tile);
        ctx.fillRect((e.x+e.outwardX*2)*tile,(e.y+e.outwardY*2)*tile,tile,tile);
      });
    });
    (debug.invalid||[]).forEach(function(p){
      ctx.fillStyle='rgba(255,40,80,.55)';
      ctx.fillRect(p.x*tile,p.y*tile,tile,tile);
      ctx.fillStyle='#ffd6e0';
      ctx.fillText('!',p.x*tile+tile/2,p.y*tile+tile/2);
    });
    ctx.fillStyle='rgba(255,230,80,.95)';
    ctx.fillText('P',state.player.x*tile+tile/2,state.player.y*tile+tile/2);
    if(state.stairs){ctx.strokeStyle='rgba(80,230,245,.95)';ctx.strokeRect(state.stairs.x*tile+5,state.stairs.y*tile+5,10,10);}
    ctx.textAlign='left';
    ctx.fillStyle='rgba(12,18,20,.78)';
    ctx.fillRect(8,28,210,34);
    ctx.fillStyle='#e9fbff';
    ctx.fillText('地形タイプ：'+(state.terrainTypeName||'-'),14,43);
    ctx.fillText('Seed：'+(state.gmSeed||'random'),14,57);
    ctx.restore();
  }
  var oldDraw=K.UI.draw;
  K.UI.draw=function(s){oldDraw.call(this,s);syncPanel();drawDebug(s);};
  addEventListener('DOMContentLoaded',function(){
    syncPanel();
    document.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('[data-gm-rebuild]'))applySelection();
    },true);
    document.addEventListener('change',function(e){
      if(e.target.matches&&e.target.matches('[data-gm-terrain-type]'))applySelection();
    });
  });
})(window.Kiri=window.Kiri||{});
