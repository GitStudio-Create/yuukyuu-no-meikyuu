(function(K){
  'use strict';
  function r(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function side(facing){return K.Direction8?K.Direction8.side(facing):(facing==='left'?'left':facing==='right'?'right':'center');}
  function dirId(actor,fallback){return (K.Direction8&&K.Direction8.fromActor(actor))||fallback||'S';}
  function dirVec(id){return K.Direction8?K.Direction8.vector(id):{dx:id==='W'?-1:id==='E'?1:0,dy:id==='N'?-1:id==='S'?1:0,id:id||'S'};}
  function playerEquipment(actor){var e=actor&&actor.equipment||{};return{weapon:e.weapon||null,shield:e.shield||null};}
  function weaponVisual(item){var id=item&&item.id||'',base={blade:'#dce8ec',edge:'#f7fbff',hilt:'#cda24b',kind:'sword',len:11,wide:2};if(id==='emberBlade')return{blade:'#ff9360',edge:'#ffe0b2',hilt:'#7d442c',kind:'dagger',len:8,wide:2};if(id==='willowBlade')return{blade:'#99d7c5',edge:'#e8fff8',hilt:'#6e9a5a',kind:'sword',len:11,wide:2};if(id==='mistSaber')return{blade:'#d7eef2',edge:'#ffffff',hilt:'#8ea0b7',kind:'long',len:13,wide:2};if(id==='stoneAxe')return{blade:'#aeb7ad',edge:'#f4f5e8',hilt:'#8b5b35',kind:'axe',len:10,wide:3};if(id==='dawnEdge')return{blade:'#ffd36f',edge:'#fff1b0',hilt:'#9e6a2f',kind:'long',len:14,wide:3};return base;}
  function shieldVisual(item){var id=item&&item.id||'',base={face:'#9faab0',rim:'#4f5960',mark:'#e6edf0',w:7,h:10};if(id==='barkShield')return{face:'#9a6b3a',rim:'#573a24',mark:'#d3a56a',w:7,h:10};if(id==='leatherShield')return{face:'#b88955',rim:'#624128',mark:'#e1b47a',w:7,h:9};if(id==='mossShield')return{face:'#5f9a62',rim:'#315738',mark:'#c6f0b9',w:7,h:10};if(id==='clearShield')return{face:'#9fd4dd',rim:'#4e7279',mark:'#efffff',w:8,h:10};if(id==='emberShield')return{face:'#c56c45',rim:'#6e3528',mark:'#ffd16a',w:8,h:10};if(id==='everShield')return{face:'#8c9188',rim:'#4e534d',mark:'#c9cfc2',w:9,h:11};return base;}
  function drawWeapon(ctx,item,dir,anim,front){
    if(!item)return;
    var v=weaponVisual(item),d=dirVec(dir),p=anim.progress||0,attack=anim.type==='attack',arrow=anim.type==='arrow',staff=anim.type==='staff',reach=attack?Math.round(Math.sin(p*Math.PI)*5):0;
    if(staff){r(ctx,'#9b6b42',23+d.dx*2,8+d.dy*2,3,17);r(ctx,'#9b72cf',22+d.dx*3,5+d.dy*3,6,5);if(p>.35)r(ctx,'#8ffff4',24+d.dx*5,3+d.dy*5,4,4);return;}
    if(arrow){r(ctx,'#b57c42',23+d.dx*2,9+d.dy*2,2,15);r(ctx,'#d8c18b',24+d.dx*2,11+d.dy*2,5,2);r(ctx,'#d8c18b',24+d.dx*2,20+d.dy*2,5,2);return;}
    var sx=22+d.dx*(2+reach),sy=14+d.dy*(2+reach),len=v.len+reach,wide=v.wide;
    if(dir==='N'||dir==='NE'||dir==='NW')sy-=front?1:3;
    if(dir==='S'||dir==='SE'||dir==='SW')sy+=front?1:0;
    if(dir==='E'||dir==='W'){r(ctx,v.hilt,sx-2,sy+6,5,2);r(ctx,v.blade,sx,sy,wide,len);r(ctx,v.edge,sx+wide,sy,1,len-2);if(v.kind==='axe')r(ctx,v.edge,sx-4,sy+1,7,5);}
    else if(dir==='N'||dir==='S'){r(ctx,v.hilt,sx-2,sy+6,5,2);r(ctx,v.blade,sx,sy,wide,len);r(ctx,v.edge,sx+wide,sy,1,len-2);if(v.kind==='axe')r(ctx,v.edge,sx-4,sy+1,7,5);}
    else{r(ctx,v.hilt,sx-2,sy+6,5,2);for(var i=0;i<len;i+=2)r(ctx,i%4?v.blade:v.edge,sx+Math.round(d.dx*i*.45),sy+Math.round(d.dy*i*.45),wide+1,2);if(v.kind==='axe')r(ctx,v.edge,sx+Math.round(d.dx*5)-3,sy+Math.round(d.dy*5),7,5);}
  }
  function drawShield(ctx,item,dir,front){
    if(!item)return;
    var v=shieldVisual(item),d=dirVec(dir),x=5-d.dx*2,y=14+d.dy*2;
    if(dir==='N'||dir==='NE'||dir==='NW')y=12;
    if(dir==='S'||dir==='SE'||dir==='SW')y=15;
    if(!front&&(dir==='N'||dir==='NE'||dir==='NW'))y=11;
    r(ctx,v.rim,x,y,v.w,v.h);r(ctx,v.face,x+1,y+1,Math.max(2,v.w-2),Math.max(2,v.h-2));r(ctx,v.mark,x+Math.floor(v.w/2),y+3,2,2);
  }
  function drawPlayerBody(ctx,dir,hit,walkStep){
    var back=dir==='N'||dir==='NE'||dir==='NW',profile=dir==='E'||dir==='W',diag=dir.length===2,front=dir==='S'||dir==='SE'||dir==='SW';
    var skin=hit?'#ffb19c':'#e2a46f',coat=hit?'#ff6b62':'#172b55',stripe='#e9e7d5',hat='#803d6d',hatHi='#c45d8f';
    if(back){r(ctx,coat,8,8,17,17);r(ctx,'#244f88',6,13,5,10);r(ctx,'#244f88',23,13,5,10);r(ctx,'#214778',12,9,9,15);r(ctx,hat,7,4,18,5);r(ctx,hatHi,10,2,13,4);r(ctx,'#4da7c9',8,3,4,2);r(ctx,stripe,10,17,4,7);r(ctx,stripe,16,17,4,7);r(ctx,stripe,22,17,3,7);}
    else if(profile){r(ctx,coat,9,9,16,15);r(ctx,'#315a9a',7,13,5,10);r(ctx,'#315a9a',22,13,4,10);r(ctx,skin,13,7,10,9);r(ctx,'#171512',20,10,2,2);r(ctx,'#b77b54',23,12,2,2);r(ctx,hat,8,4,17,5);r(ctx,hatHi,11,2,12,4);r(ctx,'#4da7c9',21,2,3,2);r(ctx,stripe,10,17,4,7);r(ctx,stripe,16,17,4,7);r(ctx,stripe,21,17,3,7);}
    else{r(ctx,coat,7,8,18,16);r(ctx,'#315a9a',5,12,5,11);r(ctx,'#315a9a',24,12,4,11);r(ctx,skin,10,7,13,9);r(ctx,'#171512',13+(diag?2:0),10,2,2);r(ctx,'#171512',19+(diag?1:0),10,2,2);r(ctx,hat,7,4,18,5);r(ctx,hatHi,10,2,13,4);r(ctx,'#4da7c9',21,2,3,2);r(ctx,stripe,8,17,4,7);r(ctx,stripe,14,17,4,7);r(ctx,stripe,20,17,4,7);}
    r(ctx,'#6b3d2a',10-walkStep,24,5,5);r(ctx,'#6b3d2a',19+walkStep,24,5,5);
    if(diag&&!back)r(ctx,'#f0c18e',22,13,3,3);
    if(diag&&back)r(ctx,'#244f88',22,11,4,9);
    return front||profile;
  }
  function trapVisual(type){
    return {
      trapDamage:{color:'#ff7a42',symbol:'✹'},
      trapPoison:{color:'#63d96f',symbol:'●'},
      trapSleep:{color:'#a8adff',symbol:'Z'},
      trapConfuse:{color:'#c178ff',symbol:'↺'},
      trapWarp:{color:'#5fd8ff',symbol:'◇'},
      trapPit:{color:'#b9a8ff',symbol:'□'},
      trapWeaken:{color:'#c88755',symbol:'↓'},
      trapHunger:{color:'#e3bd54',symbol:'▽'},
      trapDrop:{color:'#f0cf58',symbol:'／'}
    }[type]||null;
  }
  function drawTrapPulse(ctx,x,y,type,progress){
    var v=trapVisual(type);if(!v)return;
    var p=Math.max(0,Math.min(1,progress||0)),cx=x+16,cy=y+16,radius=8+p*15;
    ctx.save();
    ctx.globalAlpha=Math.max(.12,.72-p*.48);
    ctx.strokeStyle=v.color;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=v.color;ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(v.symbol,cx,cy-18+p*5);
    ctx.restore();
  }
  function player(ctx,x,y,anim,time,facing,actor){
    actor=actor||(K.State&&K.State.data&&K.State.data.player)||{};
    anim=anim||{type:'idle',progress:0};
    var dir=(typeof facing==='string'&&facing)||dirId(actor,'S'),p=anim.progress||0,eq=playerEquipment(actor),moving=anim.type==='walk',falling=anim.type==='fall',bob=anim.type==='idle'?Math.round(Math.sin(time/360)):(moving?0:Math.round(Math.sin(time/420))),walk=moving&&p>.2&&p<.8?1:0,hit=anim.type==='damage'&&Math.floor(p*8)%2===0,alpha=anim.type==='death'?Math.max(0,1-p):(falling?Math.max(.25,1-p*.72):1),fallScale=falling?Math.max(.42,1-p*.58):1,flip=side(dir)==='left'?-1:1,drawDir=flip<0?({W:'E',NW:'NE',SW:'SE'}[dir]||dir):dir,front=drawDir==='S'||drawDir==='SE'||drawDir==='SW'||drawDir==='E';
    if(actor.status&&actor.status.invisible>0)alpha*=.45;
    if(trapVisual(anim.type))drawTrapPulse(ctx,x,y,anim.type,p);
    ctx.save();if(falling){ctx.fillStyle='rgba(0,0,0,'+(.18+p*.52)+')';ctx.beginPath();ctx.ellipse(x+16,y+22,13+p*5,6+p*3,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=alpha;ctx.translate(x+16,y+16+bob+(falling?p*8:0));ctx.scale(flip*fallScale,fallScale);ctx.translate(-16,-16);
    if(!front)drawWeapon(ctx,eq.weapon,drawDir,anim,false);
    if(!front)drawShield(ctx,eq.shield,drawDir,false);
    var frontLayer=drawPlayerBody(ctx,drawDir,hit,walk);
    if(anim.type==='attack'&&!eq.weapon){var d=dirVec(drawDir),reach=Math.round(Math.sin(p*Math.PI)*4);r(ctx,'#e2a46f',23+d.dx*reach,13+d.dy*reach,5,4);}
    if(frontLayer||!front){drawShield(ctx,eq.shield,drawDir,true);drawWeapon(ctx,eq.weapon,drawDir,anim,true);}
    ctx.restore();
  }
  var family={dewMote:'slime',driftMoth:'bat',dozeBud:'mushroom',stoneBeak:'goblin',bileToad:'bigSlime',dreamWisp:'ghost',needleWing:'harpy',mudBrute:'golem',reedSniper:'goblin',pocketImp:'goblin',shyShell:'mimic',spiralEye:'eye',rustMaw:'scorpion',hungerShade:'shadow',mirrorSeed:'mushroom',riftFox:'beast',wallWraith:'ghost',oakGiant:'golem',emberHorn:'demon',staffAdept:'mage',roomWatcher:'eye',frostCrown:'beast',voidKnight:'skeleton',manyCore:'spider',abyssOracle:'demon'};
  function enemyFace(ctx,dir,f,c,dark){
    var back=dir==='N'||dir==='NE'||dir==='NW',profile=dir==='E'||dir==='W',diag=dir.length===2;
    if(back){r(ctx,'rgba(10,12,13,.45)',11,8,12,3);r(ctx,'#d5c188',15,4,3,5);if(diag)r(ctx,'#d5c188',22,8,4,3);return;}
    if(profile){r(ctx,dark,21,12,3,3);r(ctx,'#f6e9bd',24,14,2,2);if(diag)r(ctx,'#f6e9bd',20,8,2,2);return;}
    r(ctx,dark,11+(diag?2:0),13,3,3);r(ctx,dark,20+(diag?1:0),13,3,3);if(diag)r(ctx,'#f6e9bd',23,10,2,2);
  }
  function enemy(ctx,e,x,y,anim,time){
    anim=anim||{type:'idle',progress:0};
    var f=family[e.spriteId||e.definitionId||e.id]||'slime',p=anim.progress||0,dir=dirId(e,'E'),fd=dirVec(dir),bob=anim.type==='walk'?0:Math.sin(time/260+(e.x+e.y))*1.5,lung=anim.type==='attack'?Math.sin(p*Math.PI)*4:0,length=Math.sqrt((anim.dx||fd.dx||1)*(anim.dx||fd.dx||1)+(anim.dy||fd.dy||0)*(anim.dy||fd.dy||0))||1,lx=(anim.dx||fd.dx||1)/length*lung,ly=(anim.dy||fd.dy||0)/length*lung,flash=anim.type==='damage'&&Math.floor(p*8)%2===0,c=flash?'#fff4ed':e.color||'#8b7',dark='#25231f',flip=side(dir)==='left'?-1:1,drawDir=flip<0?({W:'E',NW:'NE',SW:'SE'}[dir]||dir):dir,back=drawDir==='N'||drawDir==='NE'||drawDir==='NW';
    ctx.save();ctx.translate(x+16+lx,y+bob+ly);ctx.scale(flip,1);ctx.translate(-16,0);
    if(f==='slime'||f==='bigSlime'){var big=f==='bigSlime'?2:0;r(ctx,c,5-big,11-big,22+big*2,15+big);r(ctx,c,9,7-big,14,5);if(!back)enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='bat'||f==='harpy'){var flap=Math.floor(time/180)%2?3:0;if(back)flap=-1;r(ctx,c,12,10,8,13);r(ctx,c,2,7+flap,10,5);r(ctx,c,20,7+flap,10,5);enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='ghost'||f==='shadow'){ctx.globalAlpha=f==='shadow'?.7:.85;r(ctx,c,8,5,17,20);r(ctx,c,5,10,23,12);if(!back){r(ctx,'#f4f3de',11,11,3,4);r(ctx,'#f4f3de',20,11,3,4);r(ctx,dark,15,18,4,2);}else enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='skeleton'){r(ctx,'#e5ddc4',12,4,10,9);if(!back)enemyFace(ctx,drawDir,f,c,dark);r(ctx,'#e5ddc4',15,13,4,12);r(ctx,'#e5ddc4',9,15,6,3);r(ctx,'#e5ddc4',19,15,6,3);r(ctx,'#e5ddc4',10,24,3,6);r(ctx,'#e5ddc4',21,24,3,6);}
    else if(f==='mushroom'){r(ctx,'#eee2c2',13,14,8,14);r(ctx,c,5,6,24,10);r(ctx,c,9,3,16,5);if(!back){r(ctx,'#fff3dc',10,7,4,3);r(ctx,'#fff3dc',21,9,3,3);}else enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='golem'){r(ctx,c,7,6,20,22);enemyFace(ctx,drawDir,f,c,dark);r(ctx,'#51483b',3,14,6,11);r(ctx,'#51483b',27,14,4,11);}
    else if(f==='scorpion'||f==='spider'){r(ctx,c,10,12,14,12);for(var i=0;i<4;i++){r(ctx,c,3,8+i*5,8,2);r(ctx,c,23,8+i*5,8,2);}if(f==='scorpion'){r(ctx,c,20,5,4,9);r(ctx,c,16,3,7,4);}else if(!back){r(ctx,'#eee4bd',14,15,2,2);r(ctx,'#eee4bd',20,15,2,2);}enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='eye'){r(ctx,c,5,6,24,20);if(back){r(ctx,'#5b294d',12,8,10,10);enemyFace(ctx,drawDir,f,c,dark);}else{r(ctx,'#f2e9c9',9,9,16,13);r(ctx,'#5b294d',15,12,6,7);r(ctx,'#fff',17,13,2,2);}}
    else if(f==='mage'||f==='demon'){r(ctx,c,9,8,17,20);r(ctx,c,5,4,11,9);r(ctx,c,20,4,8,9);enemyFace(ctx,drawDir,f,c,dark);if(f==='mage'){r(ctx,'#b991e8',25,5,3,22);r(ctx,'#8ff7ef',24,2,6,6);}else{r(ctx,'#e4c05b',4,2,5,8);r(ctx,'#e4c05b',25,2,5,8);}}
    else if(f==='mimic'){r(ctx,'#a87935',5,10,24,17);r(ctx,'#e0b95f',5,8,24,5);if(!back){r(ctx,dark,11,16,3,3);r(ctx,dark,21,16,3,3);r(ctx,'#fff',14,23,10,3);}else enemyFace(ctx,drawDir,f,c,dark);}
    else if(f==='beast'){r(ctx,c,7,10,21,16);r(ctx,c,21,6,9,11);r(ctx,'#e8d48a',23,3,3,6);if(!back)r(ctx,dark,25,10,2,2);else enemyFace(ctx,drawDir,f,c,dark);r(ctx,c,8,24,5,6);r(ctx,c,21,24,5,6);}
    else{r(ctx,c,8,7,18,21);enemyFace(ctx,drawDir,f,c,dark);r(ctx,'#8a5b35',4,15,5,12);r(ctx,'#8a5b35',27,15,3,12);}
    if(drawDir==='NE'||drawDir==='SE')r(ctx,'rgba(255,255,210,.72)',24,7,3,4);
    ctx.restore();
  }
  K.Sprites={drawPlayer:player,drawEnemy:enemy,familyFor:function(e){return family[e.spriteId||e.definitionId||e.id]||'slime';},families:Object.freeze(family),weaponVisual:weaponVisual,shieldVisual:shieldVisual};
})(window.Kiri=window.Kiri||{});
