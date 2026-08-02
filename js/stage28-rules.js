(function(K){
  'use strict';
  var MONSTER_EXP={};
  K.EnemyCatalog.list.forEach(function(enemy){MONSTER_EXP[enemy.id]=enemy.exp;});

  function normalizeStrength(state){
    var p=state.player,oldMax=p.maxPower||p.power||8;
    var deficit=Math.max(0,oldMax-(p.power===undefined?oldMax:p.power));
    if(oldMax<=4){p.maxPower=8;p.power=Math.max(1,8-deficit);}
    else{p.maxPower=oldMax;p.power=Math.min(oldMax,p.power===undefined?oldMax:p.power);}
  }
  function normalizeCurseKnowledge(state){
    var equipment=state.player.equipment||{};
    (state.inventory||[]).concat(state.groundItems||[]).forEach(function(item){
      if(['weapon','shield','ring'].indexOf(item.category)<0)return;
      if(item.equipped||equipment[item.category]===item){item.curseKnown=true;item.curseRevealedByEquip=true;}
      else if(!item.curseRevealedByEquip)item.curseKnown=false;
    });
  }
  normalizeStrength(K.State.data);normalizeCurseKnowledge(K.State.data);
  var oldReset=K.State.reset;
  K.State.reset=function(id){var state=oldReset.call(this,id);normalizeStrength(state);normalizeCurseKnowledge(state);return state;};
  var oldLoad=K.State.load;
  K.State.load=function(){var ok=oldLoad.call(this);if(ok){normalizeStrength(this.data);normalizeCurseKnowledge(this.data);}return ok;};

  function hideNewCurse(item){
    if(item&&['weapon','shield','ring'].indexOf(item.category)>=0&&!item.equipped){item.curseKnown=false;item.curseRevealedByEquip=false;}
    return item;
  }
  var oldCreate=K.Items.create;
  K.Items.create=function(){return hideNewCurse(oldCreate.apply(this,arguments));};
  var oldRandom=K.Items.randomForFloor;
  K.Items.randomForFloor=function(){return hideNewCurse(oldRandom.apply(this,arguments));};

  var oldDetail=K.ItemDetails.forItem;
  K.ItemDetails.forItem=function(item){
    var detail=oldDetail.call(this,item);
    if(['weapon','shield','ring'].indexOf(item.category)>=0&&!item.curseKnown){
      detail.metadata=detail.metadata.filter(function(row){return row.indexOf('\u546a\u3044:')!==0;});
    }
    return detail;
  };

  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    if(action!=='drink'||item.effect!=='level'){
      var ordinary=oldPerform.apply(this,arguments);
      if(action==='equip'&&ordinary.success&&['weapon','shield','ring'].indexOf(item.category)>=0){
        item.curseKnown=true;item.curseRevealedByEquip=true;
      }
      return ordinary;
    }
    var p=state.player;
    var snapshot={level:p.level,exp:p.exp,maxHp:p.maxHp,hp:p.hp,power:p.power,maxPower:p.maxPower};
    var result=oldPerform.apply(this,arguments);
    p.level=snapshot.level;p.exp=snapshot.exp;p.maxHp=snapshot.maxHp;p.hp=snapshot.hp;
    p.power=snapshot.power;p.maxPower=snapshot.maxPower;
    var levels=K.Progression.grantNextLevel(p);
    result.message=levels.length
      ?item.trueName+'\u3092\u98f2\u307f\u3001\u30ec\u30d9\u30eb\u304c'+levels[levels.length-1]+'\u306b\u4e0a\u304c\u3063\u305f\uff01'
      :'\u3059\u3067\u306b\u6700\u5927\u30ec\u30d9\u30eb\u3060\u3002';
    return result;
  };

  K.MonsterExp=Object.freeze(MONSTER_EXP);
  K.StrengthRules={normalize:normalizeStrength};
  K.CurseRules={normalize:normalizeCurseKnowledge};
})(window.Kiri=window.Kiri||{});
