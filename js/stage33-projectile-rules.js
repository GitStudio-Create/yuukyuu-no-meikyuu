(function(K){
  'use strict';
  var BASE_ATTACK_BY_LEVEL=Object.freeze([0,5,7,9,11,13,16,19,22,25,29,33,37,41,46,51,56,61,65,71,74,77,80,83,86,89,90,91,92,93,94,95,96,97,98,99,100,100]),MAX_PROJECTILE_RANGE=10;

  function baseAttackForLevel(level){
    level=Math.max(1,Math.floor(level||1));
    return BASE_ATTACK_BY_LEVEL[Math.min(level,BASE_ATTACK_BY_LEVEL.length-1)]||BASE_ATTACK_BY_LEVEL[BASE_ATTACK_BY_LEVEL.length-1];
  }
  function weaponPower(state){
    var e=state.player.equipment||{},weapon=e.weapon,ring=e.ring;
    return(weapon?weapon.bonus:0)+(ring&&ring.effect==='maxPower'?3:0);
  }
  function ringPowerBonus(state){
    var e=state.player.equipment||{},ring=e.ring;
    return ring&&ring.effect==='maxPower'?3:0;
  }
  function displayPower(state){
    var p=state.player,bonus=ringPowerBonus(state);
    return{current:(p.power||8)+bonus,max:(p.maxPower||p.power||8)+bonus,bonus:bonus};
  }
  function roundHalfAway(value){return value>=0?Math.floor(value+.5):Math.ceil(value-.5);}
  function attackPower(state){
    var p=state.player,base=baseAttackForLevel(p.level),offset=weaponPower(state)+(p.power||8)-8;
    return Math.max(0,Math.min(255,base+roundHalfAway(base*offset/16)));
  }
  function arrowAttackPower(state,item){
    var base=baseAttackForLevel(state.player.level),strength=item&&item.arrowStrength!==undefined?item.arrowStrength:item&&item.basePower!==undefined?item.basePower:4;
    return Math.max(1,base+roundHalfAway(base*(strength-8)/16));
  }

  K.Items.attackPower=attackPower;
  K.Items.baseAttackForLevel=baseAttackForLevel;
  K.Items.weaponAttackPower=weaponPower;
  K.Items.ringPowerBonus=ringPowerBonus;
  K.Items.displayPower=displayPower;
  K.Items.roundAttackBonus=roundHalfAway;
  K.Items.arrowAttackPower=arrowAttackPower;
  K.Items.attackFormula=function(state){
    var p=state.player,base=baseAttackForLevel(p.level),weapon=weaponPower(state),strength=(p.power||8)-8;
    return{baseAttack:base,weaponPower:weapon,strengthOffset:strength,attackPower:attackPower(state)};
  };

  function key(x,y){return x+','+y;}
  function itemName(item){return K.Items.name(item).replace(/（残り[^）]+）/,'');}
  function trapAt(state,x,y){return(state.traps||[]).some(function(t){return t.x===x&&t.y===y;});}
  function enemyAt(state,x,y){return(state.enemies||[]).some(function(e){return e.x===x&&e.y===y;});}
  function itemAt(state,x,y,ignore){
    return(state.groundItems||[]).some(function(item){return item!==ignore&&item.x===x&&item.y===y;});
  }
  function stairsAt(state,x,y){return state.stairs&&state.stairs.x===x&&state.stairs.y===y;}
  function canLand(state,x,y,ignore){
    return x>=0&&y>=0&&x<K.Config.width&&y<K.Config.height&&K.Map.walkable(state,x,y)&&
      !(state.player.x===x&&state.player.y===y)&&
      !enemyAt(state,x,y)&&
      !itemAt(state,x,y,ignore)&&
      !trapAt(state,x,y)&&
      !stairsAt(state,x,y);
  }
  function shuffled(cells){return K.Util.shuffle?K.Util.shuffle(cells):cells.sort(function(){return Math.random()-.5;});}
  function removeGround(state,item){
    var index=state.groundItems.indexOf(item);
    if(index>=0)state.groundItems.splice(index,1);
  }
  function candidatesAround(x,y){
    var cells=[];
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)cells.push({x:x+dx,y:y+dy,center:!dx&&!dy});
    return cells;
  }
  function resolveLanding(state,item,planned,options){
    options=options||{};
    if(!planned)return{placed:false,message:itemName(item)+'は落ちる場所がなく消えた。'};
    removeGround(state,item);
    var cells=candidatesAround(planned.x,planned.y).filter(function(cell){
      if(cell.center&&!canLand(state,cell.x,cell.y,item))return false;
      if(!cell.center&&!canLand(state,cell.x,cell.y,item))return false;
      return true;
    });
    var center=cells.find(function(cell){return cell.center;});
    var chosen=center||shuffled(cells.filter(function(cell){return!cell.center;}))[0];
    if(!chosen)return{placed:false,message:(options.disappearMessage||itemName(item)+'は落ちる場所がなく消えた。')};
    item.x=chosen.x;item.y=chosen.y;item.equipped=false;
    if(item.category==='arrow')item.quantity=1;
    state.groundItems.push(item);
    return{placed:true,cell:{x:chosen.x,y:chosen.y},message:''};
  }
  function rayInfo(state,max){
    var p=state.player,f=p.facingDirection||{dx:0,dy:1},cells=[],wall=false;
    for(var n=1;n<=max;n++){
      var x=p.x+f.dx*n,y=p.y+f.dy*n;
      if(!K.Map.walkable(state,x,y)){wall=true;break;}
      cells.push({x:x,y:y});
    }
    return{cells:cells,last:cells[cells.length-1]||{x:p.x,y:p.y},wall:wall,rangeEnded:!wall&&cells.length>=max};
  }
  function newDrops(state,before){
    return state.groundItems.filter(function(item){return!before.has(item);});
  }
  function sanitizeDrops(state,drops,planned,options){
    var messages=[];
    drops.forEach(function(item){
      var target={x:item.x,y:item.y};
      var result=resolveLanding(state,item,canLand(state,target.x,target.y,item)?target:planned,options);
      if(result.message)messages.push(result.message);
    });
    return messages;
  }
  function append(result,messages){
    if(!result||!messages.length)return result;
    var text=messages.join('\n');
    result.message=result.message?result.message+'\n'+text:text;
    if(result.messages)Array.prototype.push.apply(result.messages,messages);
    return result;
  }

  K.ProjectileLanding={canLand:canLand,resolveLanding:resolveLanding,rayInfo:rayInfo};

  function applyProjectileLanding(action,state,item,execute){
    var before=new Set(state.groundItems),info=rayInfo(state,MAX_PROJECTILE_RANGE),pierce=item&&item.effect==='pierce';
    var result=execute(),drops=newDrops(state,before),messages=[];
    messages=messages.concat(sanitizeDrops(state,drops,info.last,{disappearMessage:itemName(item)+'は落ちる場所がなく消えた。'}));
    if(action==='shoot'&&pierce&&info.wall&&!drops.length){
      var arrow=K.Items.create(item.id,undefined,undefined,state.dungeonId);
      arrow.quantity=1;arrow.equipped=false;arrow.identified=item.identified;arrow.displayName=item.displayName;
      var landed=resolveLanding(state,arrow,info.last,{disappearMessage:itemName(item)+'は落ちる場所がなく消えた。'});
      if(landed.message)messages.push(landed.message);
    }else if(action==='shoot'&&pierce&&info.rangeEnded&&!info.wall){
      messages.push(itemName(item)+'は遠くへ飛んで消えた。');
    }
    return append(result,messages);
  }

  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    if(action!=='throw'&&action!=='shoot')return oldPerform.apply(this,arguments);
    return applyProjectileLanding(action,state,item,function(){return oldPerform.call(K.ItemActions,action,state,item);});
  };

  var oldShootEquipped=K.ItemActions.shootEquipped;
  K.ItemActions.shootEquipped=function(state){
    var item=state&&state.player&&state.player.equipment&&state.player.equipment.arrow;
    if(!item)return oldShootEquipped.apply(this,arguments);
    return applyProjectileLanding('shoot',state,item,function(){return oldShootEquipped.call(K.ItemActions,state);});
  };
})(window.Kiri=window.Kiri||{});
