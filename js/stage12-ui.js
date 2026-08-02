(function(K){
  'use strict';
  var oldInit=K.UI.init,oldDraw=K.UI.draw,panel,canvas,pinned=false,currentId=null;
  var behaviorLabels={wander:'気まぐれ移動',chaser:'追跡',sleeper:'休眠',fast:'倍速',slow:'鈍足',ranged:'遠距離',coward:'逃走',thief:'盗み'};
  var abilityLabels={none:'なし',poisonTouch:'毒付与',sleepTouch:'眠り付与',rangedShot:'直線射撃',steal:'道具盗み',confuseTouch:'混乱付与',confuseGaze:'混乱にらみ',weakenGear:'装備弱化',hungerDrain:'満腹度減少',split:'分裂',warpHit:'被弾時ワープ',phase:'壁抜け',fireBreath:'炎の息',staffCast:'妨害術',roomShot:'部屋内射撃'};
  function esc(value){var d=document.createElement('div');d.textContent=String(value);return d.innerHTML;}
  function statuses(enemy){var s=enemy.status||{},a=[];if(s.sleep>0)a.push('睡眠');if(s.confuse>0)a.push('混乱');if(s.poison>0)a.push('毒');if(s.bind>0)a.push('拘束');if((enemy.speed||1)>1)a.push('倍速');if((enemy.speed||1)<1)a.push('鈍足');return a.length?a.join('・'):'なし';}
  function danger(enemy){var d=K.EnemyCatalog.get(enemy.definitionId),tier=d.tier||1;return tier<=1?'低':tier===2?'注意':tier===3?'高':tier===4?'危険':'極めて危険';}
  function info(enemy){return{name:enemy.name,description:enemy.description||'古い迷宮に棲む敵。',behavior:behaviorLabels[enemy.behaviorType]||enemy.behaviorType,ability:abilityLabels[enemy.specialAbility]||enemy.specialAbility,hp:enemy.hp+' / '+enemy.maxHp,danger:danger(enemy),status:statuses(enemy)};}
  function show(enemy,x,y,lock){
    if(!panel)return;
    var d=info(enemy);currentId=enemy;document.querySelector('#enemyInfoName').textContent=d.name;document.querySelector('#enemyInfoDescription').textContent=d.description;
    document.querySelector('#enemyInfoRows').innerHTML=[['HP目安',d.hp],['行動',d.behavior],['特殊能力',d.ability],['危険度',d.danger],['状態異常',d.status]].map(function(r){return'<div><span>'+esc(r[0])+'</span><strong>'+esc(r[1])+'</strong></div>';}).join('');
    pinned=!!lock;panel.classList.toggle('pinned',pinned);panel.classList.remove('hidden');
    if(!pinned){var w=panel.offsetWidth||250,h=panel.offsetHeight||190;panel.style.left=Math.max(8,Math.min(x+14,window.innerWidth-w-8))+'px';panel.style.top=Math.max(8,Math.min(y+14,window.innerHeight-h-8))+'px';}else{panel.style.left='50%';panel.style.top='50%';}
  }
  function hide(force){if(!panel||pinned&&!force)return;pinned=false;currentId=null;panel.classList.remove('pinned');panel.classList.add('hidden');}
  function enemyFromPointer(e){var state=K.State.data,rect=canvas.getBoundingClientRect(),cam=K.UI.stage16Camera?K.UI.stage16Camera(state):{x:0,y:0},tile=K.UI.stage16Camera?32:K.Config.tile,x=cam.x+Math.floor((e.clientX-rect.left)*canvas.width/rect.width/tile),y=cam.y+Math.floor((e.clientY-rect.top)*canvas.height/rect.height/tile);return state.enemies.find(function(enemy){return enemy.x===x&&enemy.y===y&&K.Visibility.isEntityVisible(state,x,y);});}
  K.UI.init=function(){oldInit.call(K.UI);panel=document.querySelector('#enemyInfo');canvas=document.querySelector('#game');canvas.addEventListener('pointermove',function(e){if(e.pointerType==='touch'||pinned)return;var enemy=enemyFromPointer(e);if(enemy)show(enemy,e.clientX,e.clientY,false);else hide(false);});canvas.addEventListener('pointerleave',function(){hide(false);});canvas.addEventListener('pointerup',function(e){if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;var enemy=enemyFromPointer(e);if(enemy){e.preventDefault();show(enemy,e.clientX,e.clientY,true);}});document.querySelector('#closeEnemyInfo').addEventListener('click',function(){hide(true);});addEventListener('keydown',function(e){if(e.key==='Escape'&&pinned)hide(true);});};
  K.UI.draw=function(state){oldDraw.call(K.UI,state);if(currentId&&state.enemies.indexOf(currentId)<0)hide(true);};
  K.UI.enemyInfo=info;K.UI.showEnemyInfo=show;K.UI.closeEnemyInfo=function(){hide(true);};
})(window.Kiri=window.Kiri||{});
