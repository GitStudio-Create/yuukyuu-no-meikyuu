(function(K){
  'use strict';
  var TILE=32,lastHoverItem=null,lastHoverTrap=null;
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function equipment(){return K.State.data.player.equipment||{};}
  function gearStrength(item){return item?Math.max(0,Number(item.bonus||0)):0;}
  function weaponStrength(state){return gearStrength((state.player.equipment||{}).weapon);}
  function shieldStrength(state){return gearStrength((state.player.equipment||{}).shield);}
  function itemName(item){return item?K.Items.name(item):'なし';}
  function powerText(state){var p=K.Items.displayPower?K.Items.displayPower(state):{current:state.player.power,max:state.player.maxPower};return p.current+'/'+p.max;}
  function statusText(p){var s=p.status||{},a=[];if(s.sleep>0)a.push('睡眠');if(s.confuse>0)a.push('混乱');if(s.haste>0)a.push('倍速');if(s.slow>0)a.push('鈍足');if(s.blind>0)a.push('目つぶし');if(s.invisible>0)a.push('透明');if(s.poison>0)a.push('毒');if(s.bind>0)a.push('停止');return a.length?a.join('・'):'なし';}
  function curseText(item){if(!item)return'なし';if(!item.curseKnown)return'未判明';return item.cursed?'あり':'なし';}
  function remainingText(state){if(!K.Progression||!K.Progression.remaining)return'-';var r=K.Progression.remaining(state.player);return r===null?'最大レベル':r+'ポイント';}
  function parent(selector,className){
    var node=document.querySelector(selector),box=node&&node.parentElement;
    if(box&&className)className.split(' ').forEach(function(name){box.classList.add(name);});
    return box;
  }
  function ensureTopStatusLayout(){
    var status=document.querySelector('.status');if(!status)return;
    var floor=parent('#floor','floor-stat'),
        hp=parent('#hpText','meter hp-stat'),
        food=parent('#foodText','meter food-stat'),
        power=parent('#power','power-stat'),
        level=parent('#levelText','level-stat'),
        gold=parent('#goldText','gold-stat'),
        weapon=parent('#weaponStrengthText','gear-strength weapon-stat'),
        shield=parent('#shieldStrengthText','gear-strength shield-stat'),
        next=parent('#nextLevelTopText','next-level-top next-level-stat');
    if(!floor||!hp||!food||!power||!level||!weapon||!shield||!next)return;
    var meta=status.querySelector('.status-meta-row')||document.createElement('div'),
        combat=status.querySelector('.status-combat-row')||document.createElement('div'),
        vitals=status.querySelector('.status-vitals-row')||document.createElement('div');
    meta.className='status-row status-meta-row';
    combat.className='status-row status-combat-row';
    vitals.className='status-row status-vitals-row';
    [meta,combat,vitals].forEach(function(row){if(row.parentElement!==status)status.appendChild(row);});
    [floor,power,level,next].forEach(function(node){meta.appendChild(node);});
    [weapon,shield].forEach(function(node){combat.appendChild(node);});
    [hp,food].forEach(function(node){vitals.appendChild(node);});
    if(gold){gold.hidden=true;gold.style.display='none';status.appendChild(gold);}
    if(status.firstElementChild!==meta)status.insertBefore(meta,status.firstElementChild);
    if(meta.nextElementSibling!==combat)status.insertBefore(combat,meta.nextElementSibling);
    if(combat.nextElementSibling!==vitals)status.insertBefore(vitals,combat.nextElementSibling);
  }
  function updateTop(state){
    ensureTopStatusLayout();
    var w=document.querySelector('#weaponStrengthText'),sh=document.querySelector('#shieldStrengthText'),next=document.querySelector('#nextLevelTopText');
    if(w)w.textContent=weaponStrength(state)+'（攻撃力：'+K.Items.attackPower(state)+'）';
    if(sh)sh.textContent=shieldStrength(state)+'（防御力：'+K.Items.defensePower(state)+'）';
    if(next)next.textContent=remainingText(state);
  }
  function cell(label,value,full){
    return'<div'+(full?' class="status-full-row"':'')+'><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
  }
  function renderStatus(state){
    if(!K.UI.isStatusOpen())return;
    var grid=document.querySelector('#statusGrid');if(!grid)return;
    var p=state.player,e=p.equipment||{};
    grid.innerHTML=[
      cell('階層',state.floor+'F'),cell('レベル',p.level),
      cell('HP',p.hp+'/'+p.maxHp),cell('満腹度',p.food+'/'+(p.maxFood||100)),
      cell('剣の強さ',weaponStrength(state)),cell('盾の強さ',shieldStrength(state)),
      cell('攻撃力',K.Items.attackPower(state)),cell('防御力',K.Items.defensePower(state)),
      cell('武器',itemName(e.weapon)),cell('盾',itemName(e.shield)),
      cell('ちから',powerText(state)),cell('指輪',itemName(e.ring)),
      cell('累計経験値',p.exp||0),cell('所持金',(p.gold||0)+'G'),
      cell('ターン数',state.turn||0),cell('状態異常',statusText(p)),
      cell('刀の呪い',curseText(e.weapon)),cell('盾の呪い',curseText(e.shield)),
      cell('次のレベルまで',remainingText(state),true)
    ].join('');
  }
  function canvasPoint(event,canvas){
    var rect=canvas.getBoundingClientRect();
    return{
      x:(event.clientX-rect.left)*(canvas.width/rect.width),
      y:(event.clientY-rect.top)*(canvas.height/rect.height)
    };
  }
  function currentCamera(state){
    var now=typeof performance!=='undefined'?performance.now():Date.now();
    if(K.UI.stage21RenderCamera)return K.UI.stage21RenderCamera(state,now);
    if(K.UI.stage16Camera)return K.UI.stage16Camera(state);
    return{x:0,y:0};
  }
  function canvasToTile(event,state,canvas){
    var p=canvasPoint(event,canvas),cam=currentCamera(state);
    return{x:Math.floor(p.x/TILE+cam.x),y:Math.floor(p.y/TILE+cam.y)};
  }
  function isItemDrawable(state,item){
    if(!item||!K.Visibility.isVisible(state,item.x,item.y))return false;
    if(state.player.x===item.x&&state.player.y===item.y)return false;
    if((state.enemies||[]).some(function(e){return e.x===item.x&&e.y===item.y&&K.Visibility.isEntityVisible(state,e.x,e.y);}))return false;
    var cam=currentCamera(state);
    return item.x>=cam.x&&item.y>=cam.y&&item.x<cam.x+20&&item.y<cam.y+15;
  }
  function isTrapDrawable(state,trap){
    if(!trap||!trap.revealed||!K.Visibility.isVisible(state,trap.x,trap.y))return false;
    var cam=currentCamera(state);
    return trap.x>=cam.x&&trap.y>=cam.y&&trap.x<cam.x+20&&trap.y<cam.y+15;
  }
  function actionsFor(item){
    return K.ItemActions&&K.ItemActions.actionsFor?K.ItemActions.actionsFor(item):[];
  }
  function showFloorTooltip(item,event){
    var tooltip=document.querySelector('#itemTooltip');if(!tooltip)return;
    var detail=K.ItemDetails.forItem(item),actions=actionsFor(item);
    document.querySelector('#tooltipTitle').textContent=detail.name;
    document.querySelector('#tooltipCategory').textContent=detail.category;
    document.querySelector('#tooltipDescription').textContent=detail.description+(detail.metadata.length?' '+detail.metadata.join(' / '):'');
    document.querySelector('#tooltipActions').textContent=actions.length?'行動: '+actions.map(function(a){return a.label;}).join('・'):'床に落ちている道具';
    tooltip.classList.remove('hidden');
    var rect=tooltip.getBoundingClientRect(),left=event.clientX+14,top=event.clientY+14;
    if(left+rect.width>window.innerWidth-8)left=event.clientX-rect.width-14;
    if(top+rect.height>window.innerHeight-8)top=event.clientY-rect.height-14;
    tooltip.style.left=Math.max(8,left)+'px';
    tooltip.style.top=Math.max(8,top)+'px';
  }
  function showTrapTooltip(trap,event){
    var tooltip=document.querySelector('#itemTooltip');if(!tooltip||!K.TrapRenderer)return;
    var detail=K.TrapRenderer.detail(trap);
    document.querySelector('#tooltipTitle').textContent=detail.name;
    document.querySelector('#tooltipCategory').textContent=detail.category;
    document.querySelector('#tooltipDescription').textContent=detail.description;
    document.querySelector('#tooltipActions').textContent=trap.identified?'判明済みの罠':'踏むまで効果は分からない';
    tooltip.classList.remove('hidden');
    var rect=tooltip.getBoundingClientRect(),left=event.clientX+14,top=event.clientY+14;
    if(left+rect.width>window.innerWidth-8)left=event.clientX-rect.width-14;
    if(top+rect.height>window.innerHeight-8)top=event.clientY-rect.height-14;
    tooltip.style.left=Math.max(8,left)+'px';
    tooltip.style.top=Math.max(8,top)+'px';
  }
  function hideFloorTooltip(){
    lastHoverItem=null;lastHoverTrap=null;
    if(K.UI.hideTooltip)K.UI.hideTooltip();
    else{var t=document.querySelector('#itemTooltip');if(t)t.classList.add('hidden');}
  }
  function handlePointerMove(event){
    if(event.pointerType&&event.pointerType!=='mouse')return hideFloorTooltip();
    var canvas=document.querySelector('#game'),state=K.State&&K.State.data;if(!canvas||!state||state.gameOver)return hideFloorTooltip();
    var tile=canvasToTile(event,state,canvas);
    var item=(state.groundItems||[]).find(function(i){return i.x===tile.x&&i.y===tile.y&&isItemDrawable(state,i);});
    if(item){lastHoverItem=item;lastHoverTrap=null;showFloorTooltip(item,event);return;}
    var trap=(state.traps||[]).find(function(t){return t.x===tile.x&&t.y===tile.y&&isTrapDrawable(state,t);});
    if(trap){lastHoverTrap=trap;lastHoverItem=null;showTrapTooltip(trap,event);return;}
    hideFloorTooltip();
  }
  function handlePointerDown(event){
    if(!event.pointerType||event.pointerType==='mouse')return;
    var canvas=document.querySelector('#game'),state=K.State&&K.State.data;if(!canvas||!state||state.gameOver)return hideFloorTooltip();
    var tile=canvasToTile(event,state,canvas);
    var trap=(state.traps||[]).find(function(t){return t.x===tile.x&&t.y===tile.y&&isTrapDrawable(state,t);});
    if(trap){lastHoverTrap=trap;lastHoverItem=null;showTrapTooltip(trap,event);}
  }
  function validateHover(){
    if(!lastHoverItem&&!lastHoverTrap)return;
    var state=K.State.data;
    if(lastHoverItem&&((state.groundItems||[]).indexOf(lastHoverItem)<0||!isItemDrawable(state,lastHoverItem)))hideFloorTooltip();
    if(lastHoverTrap&&((state.traps||[]).indexOf(lastHoverTrap)<0||!isTrapDrawable(state,lastHoverTrap)))hideFloorTooltip();
  }
  var oldDraw=K.UI.draw,oldToggle=K.UI.toggleStatus;
  K.UI.draw=function(state){oldDraw.call(this,state);updateTop(state);renderStatus(state);validateHover();};
  K.UI.toggleStatus=function(state){oldToggle.call(this,state);updateTop(state);renderStatus(state);};
  K.EquipmentStats={weaponStrength:weaponStrength,shieldStrength:shieldStrength,gearStrength:gearStrength};
  K.UI.renderOrderedStatus=renderStatus;
  K.UI.hideFloorItemTooltip=hideFloorTooltip;
  addEventListener('DOMContentLoaded',function(){
    var canvas=document.querySelector('#game');
    if(canvas){
      canvas.addEventListener('pointermove',handlePointerMove);
      canvas.addEventListener('pointerdown',handlePointerDown);
      canvas.addEventListener('pointerleave',hideFloorTooltip);
    }
  });
})(window.Kiri=window.Kiri||{});
