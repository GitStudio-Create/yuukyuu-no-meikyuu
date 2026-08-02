(function(K){
  'use strict';
  var UNKNOWN={name:'正体不明の罠',description:'何かの仕掛けが床に刻まれている。踏むまで効果は分からない。'};
  var DETAILS={
    mistNeedle:{color:'#ff7a42',accent:'#ffd18a',symbol:'✹',description:'踏むと石針が飛び出し、6ダメージを受ける。'},
    bileBloom:{color:'#63d96f',accent:'#c8ff91',symbol:'●',description:'踏むと毒気が広がり、ちからが下がる。'},
    dreamSeal:{color:'#8b7dff',accent:'#d8d5ff',symbol:'Z',description:'踏むと眠気に包まれ、しばらく眠ってしまう。'},
    spiralMark:{color:'#b76dff',accent:'#f2c6ff',symbol:'↺',description:'踏むと方向感覚が乱れ、混乱してしまう。'},
    driftGate:{color:'#9d7bff',accent:'#efe7ff',symbol:'◇',description:'踏むと別の場所へ飛ばされる。'},
    hollowFloor:{color:'#25232c',accent:'#b9a8ff',symbol:'',description:'踏むと床が抜け、下の階へ落ちる。'},
    dullingAsh:{color:'#b87847',accent:'#ffe0a0',symbol:'↓',description:'踏むと錆びた灰が舞い、武器か盾が弱くなることがある。'},
    hungerMoss:{color:'#c9a246',accent:'#fff0a0',symbol:'▽',description:'踏むと腹をすかせる苔が絡み、満腹度が20減る。'},
    scatterSnare:{color:'#f0cf58',accent:'#fff6a8',symbol:'／',description:'踏むと足元を取られ、道具を一つ落としてしまう。'}
  };
  function def(trap){return DETAILS[trap&&trap.id]||DETAILS.mistNeedle;}
  function state(trap){
    if(!trap||!trap.revealed)return'hidden';
    return trap.identified?'identified':'discovered';
  }
  function unknown(ctx,cx,cy,r){
    ctx.save();
    ctx.strokeStyle='#bd55d9';
    ctx.lineWidth=Math.max(1,Math.round(r*.22));
    ctx.beginPath();
    ctx.arc(cx,cy,r*.6,0,Math.PI*2);
    ctx.stroke();
    ctx.fillStyle='rgba(189,85,217,.18)';
    ctx.beginPath();
    ctx.arc(cx,cy,r*.38,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  function crack(ctx,cx,cy,r){
    ctx.strokeStyle='#201d25';
    ctx.lineWidth=Math.max(1,r*.11);
    [[-.7,-.1,-.95,-.45],[-.45,.45,-.8,.7],[.35,-.55,.65,-.85],[.45,.35,.82,.55]].forEach(function(a){
      ctx.beginPath();ctx.moveTo(cx+a[0]*r,cy+a[1]*r);ctx.lineTo(cx+a[2]*r,cy+a[3]*r);ctx.stroke();
    });
  }
  function draw(ctx,trap,x,y,size){
    if(state(trap)==='hidden')return;
    var cx=x+size/2,cy=y+size/2,r=size*.38,d=def(trap);
    if(state(trap)==='discovered')return unknown(ctx,cx,cy,r);
    ctx.save();
    ctx.fillStyle='rgba(10,8,12,.32)';
    ctx.beginPath();ctx.arc(cx,cy,r*.82,0,Math.PI*2);ctx.fill();
    if(trap.id==='hollowFloor'){
      ctx.fillStyle='#050509';ctx.beginPath();ctx.arc(cx,cy,r*.76,0,Math.PI*2);ctx.fill();crack(ctx,cx,cy,r);
    }else if(trap.id==='spiralMark'){
      ctx.strokeStyle=d.color;ctx.lineWidth=Math.max(2,r*.18);ctx.beginPath();
      for(var a=0;a<Math.PI*2.25;a+=.32){var rr=r*.12+a*r*.105;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}
      ctx.stroke();
    }else if(trap.id==='bileBloom'){
      ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(cx,cy+r*.18,r*.32,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx-r*.34,cy-r*.12,r*.18,0,Math.PI*2);ctx.arc(cx+r*.28,cy-r*.18,r*.15,0,Math.PI*2);ctx.fill();
    }else if(trap.id==='mistNeedle'){
      ctx.strokeStyle=d.color;ctx.lineWidth=Math.max(2,r*.16);
      for(var i=0;i<8;i++){var ang=i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*r*.18,cy+Math.sin(ang)*r*.18);ctx.lineTo(cx+Math.cos(ang)*r*.75,cy+Math.sin(ang)*r*.75);ctx.stroke();}
    }else{
      ctx.strokeStyle=d.color;ctx.lineWidth=Math.max(2,r*.16);ctx.beginPath();ctx.arc(cx,cy,r*.58,0,Math.PI*2);ctx.stroke();
    }
    if(d.symbol){
      ctx.fillStyle=d.accent;ctx.font='bold '+Math.max(9,Math.round(size*.42))+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.symbol,cx,cy+1);
    }
    ctx.restore();
  }
  function drawMini(ctx,trap,cx,cy,size){
    if(state(trap)==='hidden')return;
    var r=Math.max(2,size*.42);
    ctx.save();
    ctx.lineWidth=Math.max(1,Math.round(size*.14));
    if(state(trap)==='discovered'){
      ctx.strokeStyle='#d36bff';ctx.fillStyle='rgba(84,24,106,.62)';
      ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx-r*.45,cy);ctx.lineTo(cx+r*.45,cy);ctx.moveTo(cx,cy-r*.45);ctx.lineTo(cx,cy+r*.45);ctx.stroke();
      ctx.restore();return;
    }
    var d=def(trap),accent=d.accent;
    if(trap.id==='hollowFloor'){
      ctx.strokeStyle=accent;ctx.fillStyle='rgba(5,5,9,.9)';
      ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.strokeRect(cx-r,cy-r,r*2,r*2);
    }else if(trap.id==='mistNeedle'){
      ctx.strokeStyle=accent;for(var i=0;i<4;i++){var a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx-Math.cos(a)*r,cy-Math.sin(a)*r);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}
    }else if(trap.id==='bileBloom'){
      ctx.fillStyle='#a6ff5f';ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.quadraticCurveTo(cx+r*.85,cy-r*.05,cx,cy+r);ctx.quadraticCurveTo(cx-r*.85,cy-r*.05,cx,cy-r);ctx.fill();
    }else if(trap.id==='dreamSeal'){
      ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(cx-r,cy-r*.15);ctx.lineTo(cx-r*.35,cy-r*.15);ctx.lineTo(cx+r*.35,cy+r*.15);ctx.lineTo(cx+r,cy+r*.15);ctx.stroke();
    }else if(trap.id==='spiralMark'){
      ctx.strokeStyle=accent;ctx.beginPath();ctx.arc(cx,cy,r*.75,Math.PI*.2,Math.PI*1.75);ctx.lineTo(cx+r*.15,cy-r*.05);ctx.stroke();
    }else if(trap.id==='driftGate'){
      ctx.strokeStyle=accent;ctx.fillStyle='rgba(80,48,150,.78)';ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(trap.id==='dullingAsh'){
      ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(cx-r,cy-r*.45);ctx.lineTo(cx+r,cy-r*.45);ctx.moveTo(cx,cy-r*.45);ctx.lineTo(cx,cy+r*.7);ctx.moveTo(cx-r*.45,cy+r*.25);ctx.lineTo(cx,cy+r*.7);ctx.lineTo(cx+r*.45,cy+r*.25);ctx.stroke();
    }else if(trap.id==='hungerMoss'){
      ctx.strokeStyle=accent;ctx.fillStyle='rgba(120,92,18,.72)';ctx.beginPath();ctx.moveTo(cx,cy+r);ctx.lineTo(cx+r,cy-r);ctx.lineTo(cx-r,cy-r);ctx.closePath();ctx.fill();ctx.stroke();
    }else{
      ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(cx-r,cy+r*.65);ctx.lineTo(cx-r*.25,cy-r*.65);ctx.lineTo(cx+r*.2,cy+r*.5);ctx.lineTo(cx+r,cy-r*.55);ctx.stroke();
    }
    ctx.restore();
  }
  function detail(trap){
    if(state(trap)!=='identified')return{name:UNKNOWN.name,category:'罠',description:UNKNOWN.description};
    var base=K.Traps&&K.Traps.name?K.Traps.name(trap):'罠',d=def(trap);
    return{name:base,category:'罠',description:d.description};
  }
  K.TrapRenderer={draw:draw,drawMini:drawMini,detail:detail,knowledgeState:state,styles:DETAILS};
})(window.Kiri=window.Kiri||{});
