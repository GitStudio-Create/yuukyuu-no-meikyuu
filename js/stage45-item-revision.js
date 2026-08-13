(function(K){
  'use strict';
  function removeInventory(state,item){var index=(state.inventory||[]).indexOf(item);if(index>=0)state.inventory.splice(index,1);}
  function revealNearby(state){
    var p=state&&state.player;if(!(p&&p.status&&p.status.trapSight>0))return 0;
    var found=0;(state.traps||[]).forEach(function(trap){
      if(Math.max(Math.abs(trap.x-p.x),Math.abs(trap.y-p.y))<=1){if(!trap.revealed||!trap.identified)found++;trap.revealed=true;trap.identified=true;}
    });
    return found;
  }
  K.TrapSight={revealNearby:revealNearby,duration:20};

  function migrateItem(item){
    var def=item&&K.Items.definitions[item.id];if(!def)return item;
    if(['weapon','shield'].indexOf(item.category)>=0){item.basePower=def.basePower;item.modifier=item.modifier||0;item.bonus=def.basePower+item.modifier;}
    item.effect=def.effect;
    if(item.category==='arrow')item.arrowStrength=def.arrowStrength;
    return item;
  }
  function migrateState(state){
    if(!state||!state.player)return state;
    (state.inventory||[]).concat(state.groundItems||[]).forEach(migrateItem);
    var equipment=state.player.equipment||{};['weapon','shield','ring','arrow'].forEach(function(slot){if(equipment[slot])migrateItem(equipment[slot]);});
    state.player.status=state.player.status||{};state.player.status.trapSight=state.player.status.trapSight||0;state.player.status.poison=state.player.status.poison||0;
    state.vision=state.vision||{};state.vision.mapOnly=!!state.vision.mapOnly;
    return state;
  }
  var oldLoad=K.State.load;
  K.State.load=function(){var ok=oldLoad.apply(this,arguments);if(ok)migrateState(this.data);return ok;};
  K.ItemRevision={migrateState:migrateState};

  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    if(action==='read'&&item.effect==='map'){
      state.vision=state.vision||{};state.vision.mapAll=true;state.vision.mapOnly=true;
      removeInventory(state,item);K.Visibility.update(state);
      return{success:true,message:'道標の紙片を読んだ。\n現在階の地形と階段が明らかになった。'};
    }
    return oldPerform.apply(this,arguments);
  };

  var oldShowItem=K.Visibility.shouldShowItemOnMap;
  K.Visibility.shouldShowItemOnMap=function(state,item){
    if(state&&state.vision&&state.vision.mapOnly&&!state.vision.items){var sight=state.entityVisible||state.visible||{};return!!sight[K.Util.key(item.x,item.y)];}
    return oldShowItem.call(this,state,item);
  };

  if(K.Game&&K.Game.actions){
    var oldMove=K.Game.actions.move;
    K.Game.actions.move=function(){var result=oldMove.apply(this,arguments),state=K.State.data;if(result&&result.moved&&state&&state.player&&state.player.status.trapSight>0){revealNearby(state);K.State.save();K.UI.draw(state);}return result;};
  }

  var oldEnemyTurns=K.Entities.takeEnemyTurns;
  K.Entities.takeEnemyTurns=function(state){
    var result=oldEnemyTurns.apply(this,arguments);
    (state.enemies||[]).forEach(function(enemy){var status=enemy.status||{};if(status.invisible>0)status.invisible--;});
    return result;
  };

  var descriptions={
    emberBlade:'植物系・氷系の敵に1.5倍のダメージを与える短剣。',
    willowBlade:'飛行系の敵に1.5倍のダメージを与える剣。',
    mistSaber:'霊体・影系の敵に1.5倍のダメージを与える刀。',
    stoneAxe:'岩・甲羅・重装系の敵に1.5倍のダメージを与える斧。',
    dawnEdge:'特殊効果を持たない、基礎攻撃力の高い剣。',
    beastBlade:'獣系の敵に1.5倍のダメージを与える剣。',
    magicBlade:'魔法を使う敵・魔法系の敵に1.5倍のダメージを与える剣。',
    dragonBlade:'竜系の敵に1.5倍のダメージを与える剣。',
    barkShield:'装備すると防御力を1上げる盾。',
    mossShield:'毒による現在ちからの低下を防ぐ。毒状態と毒ダメージは防がない。',
    clearShield:'敵の光弾・魔法弾を50%の確率で反射し、受けるダメージを無効化して敵へ返す。',
    emberShield:'炎属性ダメージを50%軽減する盾。',
    everShield:'錆びた灰や敵の弱化を受けても、この盾自身の強化値が下がらない。',
    antidoteRing:'毒状態そのものを無効化し、毒ダメージとちから低下を防ぐ。',
    pierceArrow:'壁まで飛び、直線上の複数の敵を貫いて攻撃する。\n矢の強さ：12。実ダメージはレベルと敵防御で変化する。',
    mapScroll:'現在階の地形と階段を明らかにする。罠・床アイテム・敵は表示しない。効果は階を移動するまで続く。',
    sightHerb:'飲むと満腹度が5回復し、20ターンの間、移動時に周囲8マスの罠の位置と種類を見抜く。投げると敵に1ダメージを与える。',
    invisibleStaff:'正面の最初の敵を10ターン透明にする。水晶壁で反射すると自分が10ターン透明になる。投げて当てても敵を透明にする。',
    flameHerb:'飲むと満腹度が1回復し、向いている方向へ炎を吹いて敵へダメージを与える。投げても炎ダメージを与える。',
    levelHerb:'飲むと満腹度が5回復し、レベルが1上がる。',
    poisonHerb:'飲むと満腹度が5回復するが、HPが5減って毒状態になり、現在ちからが3下がる。投げると敵に5ダメージを与え、攻撃力を1下げて継続毒にする。',
    weaponScroll:'手持ち・装備中・足元の武器から1つ選び、1強化して呪いも解く。',
    shieldScroll:'手持ち・装備中・足元の盾から1つ選び、1強化して呪いも解く。',
    chargeScroll:'手持ちまたは足元の杖を1つ選び、使用回数を1～3回復する。'
  };
  Object.keys(descriptions).forEach(function(id){if(K.Items.definitions[id])K.Items.definitions[id].description=descriptions[id];});
  Object.keys(K.Items.definitions).forEach(function(id){
    var d=K.Items.definitions[id];if(d.category!=='herb'||descriptions[id]||(d.description||'').indexOf('満腹度')>=0)return;
    d.description=(d.description?d.description+' ':'')+'飲むと満腹度が5回復する。';
  });
  if(K.Inventory&&K.Inventory.itemOrder){K.Inventory.itemOrder.beastBlade=3.1;K.Inventory.itemOrder.magicBlade=3.2;K.Inventory.itemOrder.dragonBlade=3.3;}
})(window.Kiri=window.Kiri||{});
