(function(K){
  'use strict';
  var BAG_MAX=function(){return K.Config.inventoryMax||20;};
  var HUNGER_UNIT=100,BASE_HUNGER_PER_TURN=10,HUNGER_HALF_MULTIPLIER=.5;
  var floorItem=null,pendingAction=null,exchangeMode=false;

  function bagUsed(state){return(state.inventory||[]).filter(function(item){return item&&item.category!=='gold';}).length;}
  function footItem(state){var p=state.player;return(state.groundItems||[]).find(function(item){return item.category!=='gold'&&item.x===p.x&&item.y===p.y;})||null;}
  function removeGround(state,item){var i=state.groundItems.indexOf(item);if(i>=0)state.groundItems.splice(i,1);}
  function removeInventory(state,item){var i=state.inventory.indexOf(item);if(i>=0)state.inventory.splice(i,1);}
  function cleanFloorFields(item){delete item.x;delete item.y;return item;}
  function addLog(msg){if(msg)K.State.addLog(msg);}
  function visibleName(item){return K.Items.name(item);}
  function pickupLabel(item){return item?'拾う：G / '+visibleName(item):'拾う：G';}
  function isOpen(){var menu=document.querySelector('#itemMenu');return !!floorItem&&menu&&!menu.classList.contains('hidden');}
  function categoryActions(item){
    var primary={food:['eat','食べる'],herb:['drink','飲む'],scroll:['read','読む'],staff:['wave','振る'],weapon:['equip','装備'],shield:['equip','装備'],ring:['equip','装備'],arrow:['shoot','撃つ']}[item.category];
    var list=[];
    if(primary)list.push({id:primary[0],label:primary[1]});
    if(item.category!=='arrow')list.push({id:'throw',label:'投げる'});
    list.push({id:'exchange',label:'交換'},{id:'describe',label:'説明'});
    return list;
  }
  function floorDetail(item){
    var d=K.ItemDetails.forItem(item);
    d.name='床の'+d.name;
    d.metadata=(d.metadata||[]).concat(['道具袋が満杯でも、ここから直接使えます。']);
    return d;
  }
  function openFloorMenu(state,item){
    floorItem=item||footItem(state);
    pendingAction=null;exchangeMode=false;
    if(!floorItem)return false;
    K.UI.showItemDetails(floorDetail(floorItem),categoryActions(floorItem));
    if(K.Sound)K.Sound.play('menuOpen');
    return 'floor-menu';
  }
  function showExchangeList(){
    var s=K.State.data,actions=(s.inventory||[]).map(function(item,index){return{id:'exchange:'+index,label:(index+1)+' '+visibleName(item)};});
    if(!actions.length){addLog('交換できる手持ち道具がない。');return false;}
    exchangeMode=true;
    K.UI.showItemDetails({
      name:'交換する手持ち道具',
      category:'道具袋',
      description:'選んだ手持ち道具を足元に置き、床の道具を道具袋へ入れます。',
      metadata:['キャンセルではターンを進めません。'],
      usage:'交換相手を選ぶ'
    },actions);
    return false;
  }
  function canEquipFromFloor(state,item){
    var current=state.player.equipment[item.category];
    if(current&&current.cursed)return{ok:false,message:'呪いが絡みつき、'+K.Items.name(current)+'を外せない。'};
    return{ok:true,current:current};
  }
  function equipFromFloor(state,item){
    var check=canEquipFromFloor(state,item),p=state.player;
    if(!check.ok)return{success:false,message:check.message};
    if(!check.current&&bagUsed(state)>=BAG_MAX())return{success:false,message:'道具袋がいっぱいです。先に「交換」を選んでください。'};
    removeGround(state,item);
    if(check.current){
      removeInventory(state,check.current);
      check.current.equipped=false;check.current.x=p.x;check.current.y=p.y;
      state.groundItems.push(check.current);
    }
    cleanFloorFields(item);item.equipped=true;item.curseKnown=true;
    p.equipment[item.category]=item;
    if(bagUsed(state)<BAG_MAX())state.inventory.push(item);
    return{success:true,message:K.Items.name(item)+'を装備した。'+(check.current?' '+K.Items.name(check.current)+'は足元に置いた。':'')};
  }
  function exchangeFloorWithInventory(state,item,index){
    var held=state.inventory[index],p=state.player;
    if(!held)return{success:false,message:'交換する道具を選べない。'};
    if(held.equipped&&held.cursed)return{success:false,message:'呪われた'+K.Items.name(held)+'は交換できない。'};
    removeGround(state,item);
    state.inventory.splice(index,1);
    if(held.equipped&&state.player.equipment[held.category]===held)state.player.equipment[held.category]=null;
    held.equipped=false;held.x=p.x;held.y=p.y;state.groundItems.push(held);
    cleanFloorFields(item);item.equipped=false;state.inventory.push(item);
    return{success:true,message:K.Items.name(item)+'を道具袋へ入れ、'+K.Items.name(held)+'を足元に置いた。'};
  }
  function performFloorAction(action){
    var s=K.State.data,item=floorItem||footItem(s),result=null,remaining=false;
    if(!item)return{success:false,message:'足元に道具がない。'};
    if(action.indexOf('exchange:')===0)return exchangeFloorWithInventory(s,item,Number(action.split(':')[1]));
    if(action==='equip')return equipFromFloor(s,item);
    if(action==='throw'){removeGround(s,item);result=K.ItemActions.perform(action,s,item);return result;}
    if(action==='shoot'){
      removeGround(s,item);
      result=K.ItemActions.perform(action,s,item);
      remaining=item.quantity>0;
      if(remaining){item.x=s.player.x;item.y=s.player.y;item.equipped=false;s.groundItems.push(item);}
      return result;
    }
    result=K.ItemActions.perform(action,s,item);
    if(['eat','drink','read'].indexOf(action)>=0&&result.success)removeGround(s,item);
    if(action==='wave'&&result.success&&item.charges<=0)removeGround(s,item);
    return result;
  }
  function finishFloorAction(result){
    var s=K.State.data;
    if(result&&result.message)addLog(result.message);
    if(!result||!result.success){K.UI.draw(s);return false;}
    K.UI.closeConfirm();K.UI.closeItemMenu();floorItem=null;pendingAction=null;exchangeMode=false;
    if(result.endRun){s.gameOver=true;K.State.clearSave();K.UI.draw(s);if(K.UI.showEscape)K.UI.showEscape(s);return true;}
    K.Game.endTurn();
    return true;
  }

  var oldReset=K.State.reset,oldLoad=K.State.load;
  function normalizeHunger(state){
    if(!state||!state.player)return state;
    var p=state.player;
    if(p.maxFood===undefined)p.maxFood=100;
    if(p.hungerAccumulator===undefined)p.hungerAccumulator=Math.max(0,Math.floor((p.hungerClock||0)*BASE_HUNGER_PER_TURN));
    if(p.hungerEmptyGrace===undefined)p.hungerEmptyGrace=false;
    p.lastHungerAdd=p.lastHungerAdd||0;p.lastHungerMultiplier=p.lastHungerMultiplier||1;p.lastHungerDecrease=p.lastHungerDecrease||0;p.lastHungerDamage=p.lastHungerDamage||0;
    return state;
  }
  K.State.reset=function(){return normalizeHunger(oldReset.apply(this,arguments));};
  K.State.load=function(){var ok=oldLoad.apply(this,arguments);if(ok)normalizeHunger(this.data);return ok;};
  function hungerMultiplier(state){
    if(K.Items.hasEffect(state,'noHunger'))return 0;
    var m=1;
    if(K.Items.hasEffect(state,'hungerHalf'))m*=HUNGER_HALF_MULTIPLIER;
    return Math.max(.5,m);
  }
  function hungerPerTurn(state){return Math.round(BASE_HUNGER_PER_TURN*hungerMultiplier(state));}
  function processHungerTurn(state){
    normalizeHunger(state);
    var p=state.player,foodMax=p.maxFood||100,add=hungerPerTurn(state),before=p.food;
    p.lastHungerAdd=add;p.lastHungerMultiplier=hungerMultiplier(state);p.lastHungerDecrease=0;p.lastHungerDamage=0;
    if(before>0&&add>0){
      p.hungerAccumulator+=add;
      var decrease=Math.floor(p.hungerAccumulator/HUNGER_UNIT);
      if(decrease>0){
        p.food=Math.max(0,p.food-decrease);
        p.hungerAccumulator-=decrease*HUNGER_UNIT;
        p.lastHungerDecrease=before-p.food;
        if(before>0&&p.food===0){p.hungerEmptyGrace=true;addLog('お腹が空になった。');}
      }
    }else if(p.food>0&&add===0){
      p.hungerAccumulator=Math.min(p.hungerAccumulator,HUNGER_UNIT-1);
    }
    if(p.food>0){p.food=Math.min(foodMax,p.food);p.hungerEmptyGrace=false;return 0;}
    if(p.hungerEmptyGrace){p.hungerEmptyGrace=false;return 0;}
    if(K.PlayerVitals&&K.PlayerVitals.applyDirectPlayerDamage)K.PlayerVitals.applyDirectPlayerDamage(state,1,'空腹',{silent:true});
    else p.hp-=1;
    p.lastHungerDamage=1;
    addLog('空腹でHPが1減った。');
    return 1;
  }
  K.Hunger={UNIT:HUNGER_UNIT,BASE_PER_TURN:BASE_HUNGER_PER_TURN,HALF_MULTIPLIER:HUNGER_HALF_MULTIPLIER,normalize:normalizeHunger,getMultiplier:hungerMultiplier,perTurn:hungerPerTurn,processTurn:processHungerTurn,bagUsed:bagUsed};

  if(K.Items&&K.Items.definitions&&K.Items.definitions.leatherShield){
    K.Items.definitions.leatherShield.description='装備すると満腹度が減る速さを半分にする盾。20ターンで満腹度が1減る。';
  }

  var oldPickup=K.Game.actions.pickup;
  K.Game.actions.pickup=function(){
    var s=K.State.data,item=footItem(s);
    if(K.ActionSequence&&K.ActionSequence.isBusy&&K.ActionSequence.isBusy())return false;
    if(!item)return oldPickup.apply(this,arguments);
    var canMerge=item.category==='arrow'&&s.inventory.some(function(q){return q.id===item.id&&q.quantity<99;});
    if(bagUsed(s)>=BAG_MAX()&&!canMerge)return openFloorMenu(s,item);
    return oldPickup.apply(this,arguments);
  };
  var oldRequest=K.Game.actions.requestItemAction;
  K.Game.actions.requestItemAction=function(action){
    if(!floorItem)return oldRequest.apply(this,arguments);
    if(action==='describe'){K.UI.showItemDetails(floorDetail(floorItem),categoryActions(floorItem));return false;}
    if(action==='exchange')return showExchangeList();
    pendingAction=action;
    K.UI.showConfirm(K.ItemDetails.prompt(floorItem,action.indexOf('exchange:')===0?'exchange':action).replace('を使いますか？','を操作しますか？'));
    return true;
  };
  var oldConfirm=K.Game.actions.confirmItemAction;
  K.Game.actions.confirmItemAction=function(){
    if(!floorItem)return oldConfirm.apply(this,arguments);
    var action=pendingAction;pendingAction=null;
    if(!action){K.UI.closeConfirm();return false;}
    return finishFloorAction(performFloorAction(action));
  };
  var oldCancel=K.Game.actions.cancelItemAction;
  K.Game.actions.cancelItemAction=function(){
    if(!floorItem)return oldCancel.apply(this,arguments);
    pendingAction=null;K.UI.closeConfirm();
  };
  var oldClose=K.Game.actions.closeItemDetails;
  K.Game.actions.closeItemDetails=function(){
    if(!floorItem)return oldClose.apply(this,arguments);
    floorItem=null;pendingAction=null;exchangeMode=false;K.UI.closeConfirm();K.UI.closeItemMenu();
  };
  var oldInventoryCount=K.Game.actions.inventoryCount;
  K.Game.actions.inventoryCount=function(){return oldInventoryCount?oldInventoryCount.apply(this,arguments):bagUsed(K.State.data);};

  function confirmVisible(){var c=document.querySelector('#confirmScreen');return c&&!c.classList.contains('hidden');}
  addEventListener('keydown',function(e){
    if(!isOpen())return;
    var editing=e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]');
    if(editing)return;
    if(confirmVisible()){
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();return K.Game.actions.cancelItemAction();}
      if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();return K.Game.actions.confirmItemAction();}
      return;
    }
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();return K.Game.actions.closeItemDetails();}
    if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].indexOf(e.key)>=0){e.preventDefault();e.stopImmediatePropagation();K.UI.selectAction(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1);return;}
    if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();var a=K.UI.selectedAction();if(a)K.Game.actions.requestItemAction(a);return;}
  },true);

  var oldDraw=K.UI.draw;
  K.UI.draw=function(state){oldDraw.call(this,state);updateShortcutLabels(state);enhanceGMPanel();updateGMPanel(state);};
  function setText(selector,text){var el=document.querySelector(selector);if(el)el.textContent=text;}
  function updateShortcutLabels(state){
    var count=bagUsed(state),full=count>=BAG_MAX(),item=footItem(state);
    var title=document.querySelector('.inventory-panel .section-title h2');
    if(title)title.textContent='道具袋（'+count+'/'+BAG_MAX()+(full?'・満杯':'')+'）';
    var pickup=document.querySelector('[data-floor-pickup]');
    if(pickup){pickup.disabled=!item;pickup.classList.toggle('full',!!item&&full);pickup.textContent=pickupLabel(item);pickup.title=item?visibleName(item):'';}
    setText('[data-floor-stairs]','階段：Enter');
    setText('[data-floor-step]','足踏み：Z');
    setText('.floor-commands [data-floor-suspend]','中断：Esc');
    var mapButton=document.querySelector('[data-map-toggle]');
    if(mapButton&&!mapButton.dataset.stage40Label){mapButton.textContent='全体マップ：M';mapButton.dataset.stage40Label='1';}
  }

  function itemOptions(){
    return Object.keys(K.Items.definitions).sort(function(a,b){return K.Items.definitions[a].trueName.localeCompare(K.Items.definitions[b].trueName,'ja');}).map(function(id){return'<option value="'+id+'">'+K.Items.definitions[id].trueName+'</option>';}).join('');
  }
  function placeItemAtFoot(id){
    var s=K.State.data,p=s.player;
    if(footItem(s)){addLog('足元にはすでに道具がある。');return false;}
    var item=K.Items.create(id||'moonHerb',p.x,p.y,s.dungeonId);
    if(K.ItemLimits&&!K.ItemLimits.canCreate(s))return false;s.groundItems.push(item);K.UI.draw(s);return true;
  }
  function fillBag(){
    var s=K.State.data;
    while(bagUsed(s)<BAG_MAX()&&(!K.ItemLimits||K.ItemLimits.canCreate(s)))s.inventory.push(K.Items.create('nutBread',undefined,undefined,s.dungeonId));
    K.UI.draw(s);
  }
  function equipLeatherShield(){
    var s=K.State.data,item=K.Items.create('leatherShield',undefined,undefined,s.dungeonId);
    item.identified=true;item.displayName=item.trueName;item.curseKnown=true;item.cursed=false;
    var current=s.player.equipment.shield;
    if(current)current.equipped=false;
    item.equipped=true;s.player.equipment.shield=item;
    if(bagUsed(s)<BAG_MAX()&&(!K.ItemLimits||K.ItemLimits.canCreate(s)))s.inventory.push(item);
    K.UI.draw(s);
  }
  function enhanceGMPanel(){
    var panel=document.querySelector('#gmPanel');
    if(!panel||panel.querySelector('[data-gm-stage40]'))return;
    var grid=panel.querySelector('.gm-grid');
    if(!grid)return;
    var sec=document.createElement('section');
    sec.setAttribute('data-gm-stage40','');
    sec.innerHTML='<h3>道具袋・満腹度</h3><p data-gm-bag-hunger-info></p><label>床に置く道具<select data-gm-stage40-item>'+itemOptions()+'</select></label><button data-gm-fill-bag>道具袋を30/30にする</button><button data-gm-place-foot-item>足元に道具を置く</button><button data-gm-equip-leather>皮の盾を生成・装備</button><button data-gm-empty-hunger>満腹度を0にする</button><label>満腹度<input data-gm-set-food type="number" min="0" max="999" value="100"></label><button data-gm-apply-food>満腹度を反映</button><label>蓄積値<input data-gm-set-hunger-acc type="number" min="0" max="999" value="0"></label><button data-gm-apply-hunger-acc>蓄積値を反映</button><p class="gm-key-list">キー：M 全体マップ / G 拾う / Z 足踏み / Enter 階段 / Esc 中断 / I 道具袋</p>';
    grid.appendChild(sec);
    panel.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('button');
      if(!b||!K.GM||!K.GM.active||!K.GM.active())return;
      var s=K.State.data,pl=s.player;
      if(b.matches('[data-gm-fill-bag]'))fillBag();
      else if(b.matches('[data-gm-place-foot-item]'))placeItemAtFoot((panel.querySelector('[data-gm-stage40-item]')||{}).value||'moonHerb');
      else if(b.matches('[data-gm-equip-leather]'))equipLeatherShield();
      else if(b.matches('[data-gm-empty-hunger]')){pl.food=0;pl.hungerEmptyGrace=true;K.UI.draw(s);}
      else if(b.matches('[data-gm-apply-food]')){pl.food=Math.max(0,Math.floor(Number((panel.querySelector('[data-gm-set-food]')||{}).value)||0));K.UI.draw(s);}
      else if(b.matches('[data-gm-apply-hunger-acc]')){pl.hungerAccumulator=Math.max(0,Math.floor(Number((panel.querySelector('[data-gm-set-hunger-acc]')||{}).value)||0));K.UI.draw(s);}
    });
  }
  function updateGMPanel(state){
    var panel=document.querySelector('#gmPanel'),box=panel&&panel.querySelector('[data-gm-bag-hunger-info]');
    if(!box||!state||!state.player)return;
    var item=footItem(state);
    box.textContent='道具袋 '+bagUsed(state)+'/'+BAG_MAX()+' / 足元 '+(item?K.Items.name(item):'なし')+' / 満腹度蓄積 '+(state.player.hungerAccumulator||0)+' / 1ターン+'+hungerPerTurn(state)+' / 倍率'+hungerMultiplier(state)+' / 直前減少 '+(state.player.lastHungerDecrease||0);
  }
  K.FloorItem={open:openFloorMenu,perform:performFloorAction,isOpen:isOpen,footItem:footItem,bagUsed:bagUsed,actionsFor:categoryActions,pickupLabel:pickupLabel,clear:function(){floorItem=null;pendingAction=null;exchangeMode=false;}};
})(window.Kiri=window.Kiri||{});
