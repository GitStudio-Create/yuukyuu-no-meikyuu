(function(K){
  'use strict';
  var defs={
    mistNeedle:{name:'石針の輪',effect:'damage',sound:'trapDamage',animation:'trapDamage'},
    bileBloom:{name:'濁り花の印',effect:'poison',sound:'trapPoison',animation:'trapPoison'},
    dreamSeal:{name:'眠り糸の印',effect:'sleep',sound:'trapSleep',animation:'trapSleep'},
    spiralMark:{name:'渦目の印',effect:'confuse',sound:'trapConfuse',animation:'trapConfuse'},
    driftGate:{name:'転移の環',effect:'warp',sound:'trapWarp',animation:'trapWarp'},
    hollowFloor:{name:'空洞床',effect:'pit',sound:'trapPit',animation:'trapPit'},
    dullingAsh:{name:'鈍り灰の印',effect:'weaken',sound:'trapWeaken',animation:'trapWeaken'},
    hungerMoss:{name:'飢え苔の印',effect:'hunger',sound:'trapHunger',animation:'trapHunger'},
    scatterSnare:{name:'こぼし縄',effect:'drop',sound:'trapDrop',animation:'trapDrop'}
  };
  function def(trap){return defs[trap&&trap.id]||defs.mistNeedle;}
  function pool(id,floor){if(id==='tutorialDungeon')return floor<=5?['mistNeedle','bileBloom']:['mistNeedle','bileBloom','dreamSeal','hungerMoss'];return Object.keys(defs);}
  function dropItem(state){var choices=state.inventory.filter(function(i){return!i.equipped;});if(!choices.length)return false;var item=choices[K.Util.rand(choices.length)],index=state.inventory.indexOf(item);state.inventory.splice(index,1);item.x=state.player.x;item.y=state.player.y;state.groundItems.push(item);return true;}
  function reveal(trap){trap.revealed=true;trap.identified=true;}
  function armPlayer(state,trap){
    var d=def(trap);
    reveal(trap);
    trap._trapSoundPlayed=true;
    return{pending:true,trap:trap,sound:d.sound||'trap',animation:d.animation||'trap',delay:420,message:'「'+d.name+'」が反応した。'};
  }
  function applyPlayer(state,trap){
    var p=state.player,d=def(trap),message='「'+d.name+'」が作動した。';
    reveal(trap);
    if(K.Items.hasEffect(state,'trapGuard'))return{message:'足見の指輪が「'+d.name+'」を退けた。',soundPlayed:!!trap._trapSoundPlayed};
    if(d.effect==='damage'){
      p.hp=Math.max(0,p.hp-6);
      message+=' 6のダメージ。';
    }else if(d.effect==='poison'){
      var before=p.power;
      if(K.PlayerVitals)K.PlayerVitals.applyStrengthDamage(state,1,d.name,{silent:true});
      else p.power=Math.max(0,(p.power||8)-1);
      message+=' ちからが'+Math.max(0,before-p.power)+'下がった。';
    }else if(d.effect==='sleep'){
      if(!K.Items.hasEffect(state,'sleepGuard'))p.status.sleep=5;
      message+=' 眠気に包まれた。';
    }else if(d.effect==='confuse'){
      p.status.confuse=8;
      message+=' 方向感覚が乱れた。';
    }else if(d.effect==='warp'){
      K.ItemActions.warpEntity(state,p);
      message+=' 別の場所へ飛ばされた。';
    }else if(d.effect==='pit'){
      message+=' 下の階へ落ちる！';
      return{message:message,descend:true,soundPlayed:!!trap._trapSoundPlayed};
    }else if(d.effect==='weaken'){
      var gear=p.equipment.weapon||p.equipment.shield;
      if(gear&&!(gear.effect==='rustProof')){gear.modifier--;gear.bonus--;message+=' '+gear.trueName+'が弱くなった。';}
      else message+=' 弱くなる装備はなかった。';
    }else if(d.effect==='hunger'){
      if(K.Items.hasEffect(state,'noHunger'))message+=' 満腹の指輪が腹減りを防いだ。';
      else{p.food=Math.max(0,p.food-20);message+=' 満腹度が20減った。';}
    }else if(d.effect==='drop'){
      message+=dropItem(state)?' 道具を一つ落とした。':' 落とす道具はなかった。';
    }
    return{message:message,soundPlayed:!!trap._trapSoundPlayed};
  }
  K.Traps={
    definitions:defs,
    createRandom:function(state,p){var ids=pool(state.dungeonId,state.floor),id=ids[K.Util.rand(ids.length)];return{x:p.x,y:p.y,id:id,revealed:false,identified:false};},
    name:function(trap){return def(trap).name;},
    armPlayer:armPlayer,
    applyPlayer:applyPlayer
  };
})(window.Kiri=window.Kiri||{});
