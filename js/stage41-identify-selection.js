(function(K){
  'use strict';
  if(!K.Game||!K.Game.actions||!K.Items||!K.UI)return;

  var selectedItem=null;
  var pendingScroll=null;
  var pendingTarget=null;
  var pendingNoTarget=false;
  var pendingChargeScroll=null;
  var pendingChargeTarget=null;
  var pendingEnhanceScroll=null;
  var pendingEnhanceTarget=null;
  var pendingEnhanceKind='';
  var pendingFoodScroll=null;
  var pendingFoodTarget=null;
  var pendingUncurseScroll=null;
  var pendingUncurseTarget=null;

  function inventory(){
    return (K.State.data&&K.State.data.inventory)||[];
  }
  function stillHeld(item){
    return inventory().indexOf(item)>=0;
  }
  function groundAtPlayer(){
    var state=K.State.data,p=state.player;
    return (state.groundItems||[]).filter(function(item){return item.x===p.x&&item.y===p.y;});
  }
  function stillGround(item){
    return groundAtPlayer().indexOf(item)>=0;
  }
  function scrollStillAvailable(item){
    return stillHeld(item)||stillGround(item);
  }
  function consumeScroll(state,item){
    var index=state.inventory.indexOf(item);
    if(index>=0){state.inventory.splice(index,1);return true;}
    index=(state.groundItems||[]).indexOf(item);
    if(index>=0){state.groundItems.splice(index,1);return true;}
    return false;
  }
  function activeReadScroll(){
    if(K.FloorItem&&K.FloorItem.isOpen&&K.FloorItem.isOpen()){
      var floor=K.FloorItem.footItem?K.FloorItem.footItem(K.State.data):null;
      if(floor&&floor.category==='scroll'&&stillGround(floor))return floor;
    }
    return selectedItem&&stillHeld(selectedItem)?selectedItem:null;
  }
  function closeSelectionMenus(){
    K.UI.closeConfirm();
    K.UI.closeItemMenu();
    if(K.FloorItem&&K.FloorItem.clear)K.FloorItem.clear();
  }
  function targetStillValid(entry){
    if(!entry||!entry.item)return false;
    if(entry.source==='ground')return stillGround(entry.item);
    if(entry.source==='equipment'){
      var e=K.State.data.player.equipment||{};
      return e.weapon===entry.item||e.shield===entry.item||e.ring===entry.item||e.arrow===entry.item||stillHeld(entry.item);
    }
    return stillHeld(entry.item);
  }
  function isUnknown(item){
    return item&&(!item.identified||!item.chargesKnown);
  }
  function identifyTargets(scroll){
    return inventory().map(function(item,index){
      return {item:item,index:index};
    }).filter(function(entry){
      return entry.item!==scroll&&isUnknown(entry.item);
    });
  }
  function chargeTargets(scroll){
    var targets=inventory().map(function(item,index){return {item:item,index:index,source:'inventory'};}).filter(function(entry){return entry.item!==scroll&&entry.item.category==='staff';});
    groundAtPlayer().forEach(function(item,index){if(item.category==='staff')targets.push({item:item,index:index,source:'ground'});});
    return targets;
  }
  function enhanceTargets(scroll,category){
    var seen=[],targets=[],state=K.State.data,e=state.player.equipment||{};
    inventory().forEach(function(item,index){
      if(item===scroll||item.category!==category)return;
      seen.push(item);
      targets.push({item:item,index:index,source:item.equipped?'equipment':'inventory'});
    });
    ['weapon','shield'].forEach(function(slot){
      var item=e[slot];
      if(item&&item.category===category&&seen.indexOf(item)<0){seen.push(item);targets.push({item:item,index:-1,source:'equipment'});}
    });
    groundAtPlayer().forEach(function(item,index){if(item.category===category)targets.push({item:item,index:index,source:'ground'});});
    return targets;
  }
  function foodTargets(scroll){
    return inventory().map(function(item,index){return {item:item,index:index,source:'inventory'};}).filter(function(entry){
      return entry.item!==scroll&&entry.item.id!=='bigBread';
    });
  }
  function uncurseTargets(scroll){
    return inventory().map(function(item,index){return {item:item,index:index,source:'inventory'};}).filter(function(entry){
      return entry.item!==scroll&&['weapon','shield','ring'].indexOf(entry.item.category)>=0&&entry.item.cursed;
    });
  }
  function targetActions(scroll){
    return identifyTargets(scroll).map(function(entry){
      return {id:'identify-target:'+entry.index,label:(entry.index+1)+' '+K.Items.name(entry.item)};
    });
  }
  function chargeTargetActions(scroll){
    return chargeTargets(scroll).map(function(entry){
      return {id:'charge-target:'+entry.source+':'+entry.index,label:targetLabel(entry)};
    });
  }
  function targetLabel(entry){
    var suffix=entry.source==='ground'?'（足元）':entry.source==='equipment'?'（装備中）':'（手持ち）';
    return K.Items.name(entry.item)+suffix;
  }
  function enhanceTargetActions(scroll,category){
    return enhanceTargets(scroll,category).map(function(entry){
      return {id:'enhance-target:'+category+':'+entry.source+':'+entry.index,label:targetLabel(entry)};
    });
  }
  function foodTargetActions(scroll){
    return foodTargets(scroll).map(function(entry){
      var disabled=entry.item.equipped;
      return {id:'food-target:'+entry.index,label:(entry.index+1)+' '+K.Items.name(entry.item)+(disabled?'（装備中は不可）':''),disabled:disabled};
    });
  }
  function uncurseTargetActions(scroll){
    return uncurseTargets(scroll).map(function(entry){
      return {id:'uncurse-target:'+entry.index,label:(entry.index+1)+' '+K.Items.name(entry.item)+(entry.item.equipped?'（装備中）':'')};
    });
  }
  function showTargetMenu(scroll){
    var actions=targetActions(scroll);
    if(!actions.length)return false;
    pendingScroll=scroll;
    pendingTarget=null;
    pendingNoTarget=false;
    K.UI.showItemDetails({
      name:'識別する道具を選ぶ',
      category:'識別の紙片',
      description:'正体や回数が分からない道具を1つ選んでください。',
      metadata:['キャンセルではターンを進めません。'],
      usage:'対象を選ぶ'
    },actions);
    if(K.Sound)K.Sound.play('menuOpen');
    return true;
  }
  function showChargeMenu(scroll){
    var actions=chargeTargetActions(scroll);
    if(!actions.length)return false;
    pendingChargeScroll=scroll;
    pendingChargeTarget=null;
    K.UI.showItemDetails({
      name:'直す杖を選ぶ',
      category:'杖なおしの紙片',
      description:'使用回数を回復したい杖を1つ選んでください。',
      metadata:['キャンセルではターンを進めません。'],
      usage:'対象を選ぶ'
    },actions);
    if(K.Sound)K.Sound.play('menuOpen');
    return true;
  }
  function showEnhanceMenu(scroll,kind){
    var category=kind==='weaponUp'?'weapon':'shield',actions=enhanceTargetActions(scroll,category);
    if(!actions.length)return false;
    pendingEnhanceScroll=scroll;
    pendingEnhanceTarget=null;
    pendingEnhanceKind=kind;
    K.UI.showItemDetails({
      name:(category==='weapon'?'強化する剣を選ぶ':'強化する盾を選ぶ'),
      category:scroll.trueName||K.Items.name(scroll),
      description:(category==='weapon'?'強化したい剣':'強化したい盾')+'を1つ選んでください。',
      metadata:['手持ち・装備中・足元から選べます。','キャンセルではターンを進めません。'],
      usage:'対象を選ぶ'
    },actions);
    if(K.Sound)K.Sound.play('menuOpen');
    return true;
  }
  function showFoodMenu(scroll){
    var actions=foodTargetActions(scroll);
    if(!actions.length)return false;
    pendingFoodScroll=scroll;
    pendingFoodTarget=null;
    K.UI.showItemDetails({
      name:'食料に変える道具を選ぶ',
      category:'食料の紙片',
      description:'選んだ道具を大きなパンに変えます。',
      metadata:['食料の紙片自身は選べません。','装備中の道具は外してから選んでください。','キャンセルではターンを進めません。'],
      usage:'対象を選ぶ'
    },actions);
    if(K.Sound)K.Sound.play('menuOpen');
    return true;
  }
  function showUncurseMenu(scroll){
    var actions=uncurseTargetActions(scroll);
    if(!actions.length)return false;
    pendingUncurseScroll=scroll;
    pendingUncurseTarget=null;
    K.UI.showItemDetails({
      name:'呪いを消す道具を選ぶ',
      category:'呪い消しの紙片',
      description:'呪われた武器・盾・指輪から1つ選んでください。',
      metadata:['装備中でも選べます。','キャンセルではターンを進めません。'],
      usage:'対象を選ぶ'
    },actions);
    if(K.Sound)K.Sound.play('menuOpen');
    return true;
  }
  function finishIdentify(){
    var scroll=pendingScroll,target=pendingTarget,state=K.State.data;
    pendingScroll=null;
    pendingTarget=null;
    pendingNoTarget=false;
    if(!scroll||!target||!scrollStillAvailable(scroll)||!stillHeld(target)){
      K.UI.closeConfirm();
      return false;
    }
    var before=K.Items.name(target);
    var scrollName=scroll.trueName||K.Items.name(scroll);
    consumeScroll(state,scroll);
    K.Items.identify(target);
    K.State.addLog(scrollName+'を読んだ。');
    K.State.addLog(before+'の正体が分かった。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }
  function finishNoTarget(){
    var scroll=pendingScroll,state=K.State.data;
    pendingScroll=null;
    pendingTarget=null;
    pendingNoTarget=false;
    if(!scroll||!scrollStillAvailable(scroll)){
      K.UI.closeConfirm();
      return false;
    }
    var scrollName=scroll.trueName||K.Items.name(scroll);
    consumeScroll(state,scroll);
    K.State.addLog(scrollName+'を読んだ。');
    K.State.addLog('識別する道具はなかった。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }
  function stripChargesName(item){
    return K.Items.name(item).replace(/（残り[^）]+）/,'');
  }
  function repairLimit(item){
    var limit=Number(item&&item.maxCharges);
    return Number.isFinite(limit)?limit:null;
  }
  function repairStaff(scroll,target){
    var limit=repairLimit(target),before=Number(target.charges||0),amount=1+K.Util.rand(3),after=limit===null?before+amount:Math.min(limit,before+amount),gain=after-before;
    if(gain<=0)return{ok:false,message:'この杖は直す必要がない。'};
    target.charges=after;
    target.chargesKnown=true;
    return{ok:true,gain:gain};
  }
  function finishCharge(){
    var scroll=pendingChargeScroll,target=pendingChargeTarget,state=K.State.data;
    pendingChargeScroll=null;
    pendingChargeTarget=null;
    if(!scroll||!target||!scrollStillAvailable(scroll)||!targetStillValid(target)){
      K.UI.closeConfirm();
      return false;
    }
    var targetName=stripChargesName(target.item),scrollName=scroll.trueName||K.Items.name(scroll),result=repairStaff(scroll,target.item);
    K.UI.closeConfirm();
    if(!result.ok){
      K.State.addLog(result.message);
      showChargeMenu(scroll);
      return false;
    }
    consumeScroll(state,scroll);
    K.State.addLog(scrollName+'を使った。');
    K.State.addLog(targetName+'の使用回数が'+result.gain+'回復した。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }
  function enhanceGear(target){
    target.modifier=(target.modifier||0)+1;
    target.bonus=(target.bonus||target.basePower||0)+1;
    target.cursed=false;
    target.curseKnown=true;
    return true;
  }
  function finishEnhance(){
    var scroll=pendingEnhanceScroll,target=pendingEnhanceTarget,state=K.State.data;
    pendingEnhanceScroll=null;
    pendingEnhanceTarget=null;
    pendingEnhanceKind='';
    if(!scroll||!target||!scrollStillAvailable(scroll)||!targetStillValid(target)){
      K.UI.closeConfirm();
      return false;
    }
    var scrollName=scroll.trueName||K.Items.name(scroll),targetName=K.Items.name(target.item);
    enhanceGear(target.item);
    consumeScroll(state,scroll);
    K.State.addLog(scrollName+'を読んだ。');
    K.State.addLog(targetName+'が1強化された。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }
  function finishFood(){
    var scroll=pendingFoodScroll,target=pendingFoodTarget,state=K.State.data;
    pendingFoodScroll=null;
    pendingFoodTarget=null;
    if(!scroll||!target||!scrollStillAvailable(scroll)||!stillHeld(target)){
      K.UI.closeConfirm();
      return false;
    }
    if(target.equipped){
      K.UI.closeConfirm();
      K.State.addLog('装備中の道具は食料に変えられない。');
      showFoodMenu(scroll);
      return false;
    }
    var before=K.Items.name(target),scrollName=scroll.trueName||K.Items.name(scroll),targetIndex=state.inventory.indexOf(target);
    if(targetIndex<0||!scrollStillAvailable(scroll)){
      K.UI.closeConfirm();
      return false;
    }
    state.inventory[targetIndex]=K.Items.create('bigBread',undefined,undefined,state.dungeonId);
    consumeScroll(state,scroll);
    K.State.addLog(scrollName+'を読んだ。');
    K.State.addLog(before+'を大きなパンに変えた。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }
  function finishUncurse(){
    var scroll=pendingUncurseScroll,target=pendingUncurseTarget,state=K.State.data;
    pendingUncurseScroll=null;
    pendingUncurseTarget=null;
    if(!scroll||!target||!scrollStillAvailable(scroll)||!stillHeld(target)){
      K.UI.closeConfirm();
      return false;
    }
    if(!target.cursed){
      K.UI.closeConfirm();
      K.State.addLog('この道具は呪われていない。');
      return false;
    }
    var targetName=K.Items.name(target),scrollName=scroll.trueName||K.Items.name(scroll);
    target.cursed=false;
    target.curseKnown=true;
    consumeScroll(state,scroll);
    K.State.addLog(scrollName+'を読んだ。');
    K.State.addLog(targetName+'の呪いが解けた。');
    if(K.Sound)K.Sound.play('itemUse');
    closeSelectionMenus();
    if(K.Game.endTurnDelayed)K.Game.endTurnDelayed();else if(K.Game.endTurn)K.Game.endTurn();
    return true;
  }

  var oldOpen=K.Game.actions.openItem;
  K.Game.actions.openItem=function(index){
    selectedItem=inventory()[index]||null;
    pendingScroll=null;
    pendingTarget=null;
    pendingNoTarget=false;
    pendingChargeScroll=null;
    pendingChargeTarget=null;
    pendingEnhanceScroll=null;
    pendingEnhanceTarget=null;
    pendingEnhanceKind='';
    pendingFoodScroll=null;
    pendingFoodTarget=null;
    pendingUncurseScroll=null;
    pendingUncurseTarget=null;
    return oldOpen.apply(this,arguments);
  };

  var oldPickup=K.Game.actions.pickup;
  K.Game.actions.pickup=function(){
    selectedItem=null;
    pendingScroll=null;
    pendingTarget=null;
    pendingNoTarget=false;
    pendingChargeScroll=null;
    pendingChargeTarget=null;
    pendingEnhanceScroll=null;
    pendingEnhanceTarget=null;
    pendingEnhanceKind='';
    pendingFoodScroll=null;
    pendingFoodTarget=null;
    pendingUncurseScroll=null;
    pendingUncurseTarget=null;
    return oldPickup.apply(this,arguments);
  };

  var oldRequest=K.Game.actions.requestItemAction;
  K.Game.actions.requestItemAction=function(action){
    var readScroll=action==='read'?activeReadScroll():null;
    if(action==='read'&&readScroll&&readScroll.id==='identifyScroll'&&scrollStillAvailable(readScroll)){
      if(showTargetMenu(readScroll))return false;
      pendingScroll=readScroll;
      pendingTarget=null;
      pendingNoTarget=true;
      K.UI.showConfirm(K.Items.name(readScroll)+'を読みますか？');
      return true;
    }
    if(action==='read'&&readScroll&&readScroll.effect==='charge'&&scrollStillAvailable(readScroll)){
      if(showChargeMenu(readScroll))return false;
      K.State.addLog('直せる杖を持っていない。');
      return false;
    }
    if(action==='read'&&readScroll&&(readScroll.effect==='weaponUp'||readScroll.effect==='shieldUp')&&scrollStillAvailable(readScroll)){
      if(showEnhanceMenu(readScroll,readScroll.effect))return false;
      K.State.addLog(readScroll.effect==='weaponUp'?'強化する剣がなかった。':'強化する盾がなかった。');
      return false;
    }
    if(action==='read'&&readScroll&&readScroll.effect==='food'&&scrollStillAvailable(readScroll)){
      if(showFoodMenu(readScroll))return false;
      K.State.addLog('食料へ変える道具がなかった。');
      return false;
    }
    if(action==='read'&&readScroll&&readScroll.effect==='uncurse'&&scrollStillAvailable(readScroll)){
      if(showUncurseMenu(readScroll))return false;
      K.State.addLog('呪われた道具を持っていない。');
      return false;
    }
    if(action.indexOf('identify-target:')===0&&pendingScroll&&scrollStillAvailable(pendingScroll)){
      var index=Number(action.split(':')[1]);
      var target=inventory()[index];
      if(!target||target===pendingScroll||!isUnknown(target)){
        K.State.addLog('識別する道具はなかった。');
        return false;
      }
      pendingTarget=target;
      K.UI.showConfirm(K.Items.name(target)+'を識別しますか？');
      return true;
    }
    if(action.indexOf('charge-target:')===0&&pendingChargeScroll&&scrollStillAvailable(pendingChargeScroll)){
      var parts=action.split(':'),source=parts[1],chargeIndex=Number(parts[2]),chargeTarget=source==='ground'?groundAtPlayer()[chargeIndex]:inventory()[chargeIndex],entry={item:chargeTarget,index:chargeIndex,source:source};
      if(!chargeTarget||chargeTarget===pendingChargeScroll||chargeTarget.category!=='staff'||!targetStillValid(entry)){
        K.State.addLog('直せる杖を持っていない。');
        return false;
      }
      var limit=repairLimit(chargeTarget);
      if(limit!==null&&Number(chargeTarget.charges||0)>=limit){
        K.State.addLog('この杖は直す必要がない。');
        return false;
      }
      pendingChargeTarget=entry;
      K.UI.showConfirm(stripChargesName(chargeTarget)+'を直しますか？');
      return true;
    }
    if(action.indexOf('enhance-target:')===0&&pendingEnhanceScroll&&scrollStillAvailable(pendingEnhanceScroll)){
      var enhanceParts=action.split(':'),category=enhanceParts[1],enhanceSource=enhanceParts[2],enhanceIndex=Number(enhanceParts[3]),enhanceTarget=enhanceSource==='ground'?groundAtPlayer()[enhanceIndex]:enhanceSource==='equipment'?(K.State.data.player.equipment[category]||inventory()[enhanceIndex]):inventory()[enhanceIndex],enhanceEntry={item:enhanceTarget,index:enhanceIndex,source:enhanceSource};
      if(!enhanceTarget||enhanceTarget===pendingEnhanceScroll||enhanceTarget.category!==category||!targetStillValid(enhanceEntry)){
        K.State.addLog(category==='weapon'?'強化する剣がなかった。':'強化する盾がなかった。');
        return false;
      }
      pendingEnhanceTarget=enhanceEntry;
      K.UI.showConfirm(K.Items.name(enhanceTarget)+'を強化しますか？');
      return true;
    }
    if(action.indexOf('food-target:')===0&&pendingFoodScroll&&scrollStillAvailable(pendingFoodScroll)){
      var foodIndex=Number(action.split(':')[1]),foodTarget=inventory()[foodIndex];
      if(!foodTarget||foodTarget===pendingFoodScroll||foodTarget.id==='bigBread'){
        K.State.addLog('食料へ変える道具がなかった。');
        return false;
      }
      if(foodTarget.equipped){
        K.State.addLog('装備中の道具は食料に変えられない。');
        return false;
      }
      pendingFoodTarget=foodTarget;
      K.UI.showConfirm(K.Items.name(foodTarget)+'を食料に変えますか？');
      return true;
    }
    if(action.indexOf('uncurse-target:')===0&&pendingUncurseScroll&&scrollStillAvailable(pendingUncurseScroll)){
      var uncurseIndex=Number(action.split(':')[1]),uncurseTarget=inventory()[uncurseIndex];
      if(!uncurseTarget||uncurseTarget===pendingUncurseScroll||['weapon','shield','ring'].indexOf(uncurseTarget.category)<0||!uncurseTarget.cursed){
        K.State.addLog('呪われた道具を持っていない。');
        return false;
      }
      pendingUncurseTarget=uncurseTarget;
      K.UI.showConfirm(K.Items.name(uncurseTarget)+'の呪いを消しますか？');
      return true;
    }
    return oldRequest.apply(this,arguments);
  };

  var oldConfirm=K.Game.actions.confirmItemAction;
  K.Game.actions.confirmItemAction=function(){
    if(pendingScroll&&pendingNoTarget)return finishNoTarget();
    if(pendingScroll&&pendingTarget)return finishIdentify();
    if(pendingChargeScroll&&pendingChargeTarget)return finishCharge();
    if(pendingEnhanceScroll&&pendingEnhanceTarget)return finishEnhance();
    if(pendingFoodScroll&&pendingFoodTarget)return finishFood();
    if(pendingUncurseScroll&&pendingUncurseTarget)return finishUncurse();
    return oldConfirm.apply(this,arguments);
  };

  var oldCancel=K.Game.actions.cancelItemAction;
  K.Game.actions.cancelItemAction=function(){
    pendingTarget=null;
    pendingNoTarget=false;
    pendingChargeTarget=null;
    pendingEnhanceTarget=null;
    pendingFoodTarget=null;
    pendingUncurseTarget=null;
    return oldCancel.apply(this,arguments);
  };

  var oldClose=K.Game.actions.closeItemDetails;
  K.Game.actions.closeItemDetails=function(){
    selectedItem=null;
    pendingScroll=null;
    pendingTarget=null;
    pendingNoTarget=false;
    pendingChargeScroll=null;
    pendingChargeTarget=null;
    pendingEnhanceScroll=null;
    pendingEnhanceTarget=null;
    pendingEnhanceKind='';
    pendingFoodScroll=null;
    pendingFoodTarget=null;
    pendingUncurseScroll=null;
    pendingUncurseTarget=null;
    return oldClose.apply(this,arguments);
  };
})(window.Kiri=window.Kiri||{});
