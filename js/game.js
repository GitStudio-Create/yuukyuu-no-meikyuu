(function(K){
  'use strict';
  var S=K.State,U=K.Util,selectedIndex=-1,enemyTurnTimer=null,enemyTurnToken=0,runActionBatch=false,runSpawnCounted=false,runEntranceBlocked=false;

  function clearEnemyTurnTimer(){
    if(enemyTurnTimer){clearTimeout(enemyTurnTimer);enemyTurnTimer=null;}
    enemyTurnToken++;
    if(S.data)S.data.turnLocked=false;
  }
  function isInputLocked(){
    return !!(S.data&&(S.data.turnLocked||S.data.gameOver))||(K.Campaign&&K.Campaign.isOpen&&K.Campaign.isOpen())||(K.GM&&K.GM.isOpen&&K.GM.isOpen())||(K.UI&&K.UI.isMapOnlyOpen&&K.UI.isMapOnlyOpen());
  }

  function buildFloor(){
    clearEnemyTurnTimer();
    runEntranceBlocked=false;
    if(K.Input&&K.Input.cancelHeldMovement)K.Input.cancelHeldMovement();
    if(K.ActionSequence&&K.ActionSequence.flush)K.ActionSequence.flush();
    if(K.Animation&&K.Animation.clearProjectiles)K.Animation.clearProjectiles();
    var s=S.data,g=K.Map.generate(),mode=K.Dungeons.get(s.dungeonId),theme=K.Themes.forFloor(s.floor),plan=K.Balance.floorPlan(s.dungeonId,s.floor);
    s.map=g.tiles;s.rooms=g.rooms;s.enemies=[];s.groundItems=[];s.traps=[];s.monsterHouse=null;s.seen={};s.vision={traps:false,items:false,enemies:false,mapAll:false,mapOnly:false};s.crystalWalls=[];
    s.floorTheme=theme.name;s.bgmThemeName=theme.bgmThemeName;s.deepestFloor=Math.max(s.deepestFloor||1,s.floor);
    var start=s.rooms[0],goal=s.rooms[s.rooms.length-1];
    s.player.x=start.cx;s.player.y=start.cy;s.stairs={x:goal.cx,y:goal.cy,type:(K.Treasures&&K.Treasures.isReturning(s))?'up':'down'};
    s.spawnPolicy=K.Spawns.policy(s.dungeonId,s.floor,s.turn);
    placeEnemies(s.spawnPolicy.initialCount,mode);
    var itemCount=plan.items;
    if(plan.guaranteedHeal){placeOne(function(p){if(!K.ItemLimits||K.ItemLimits.canCreate(s))s.groundItems.push(K.Items.create('moonHerb',p.x,p.y,s.dungeonId));},0);itemCount--;}
    if(plan.guaranteedFood){placeOne(function(p){if(!K.ItemLimits||K.ItemLimits.canCreate(s))s.groundItems.push(K.Items.create('nutBread',p.x,p.y,s.dungeonId));},0);itemCount--;}
    place(itemCount,function(p){if(!K.ItemLimits||K.ItemLimits.canCreate(s))s.groundItems.push(K.Items.randomForFloor(s.floor,p.x,p.y,s.dungeonId));},0);
    place(plan.traps,function(p){s.traps.push(K.Traps.createRandom(s,p));},1);
    if(K.Treasures)K.Treasures.placeForFloor(s);
    if(s.dungeonId==='tutorialDungeon'&&s.floor>=mode.maxFloor&&!K.Treasures.isReturning(s))s.stairs={x:-1,y:-1,type:'down',disabled:true};
    if(K.CrystalWalls)K.CrystalWalls.place(s);
    if(K.MonsterHouse)K.MonsterHouse.tryCreate(s,mode);
    K.Map.reveal(s);
    S.addLog((K.FloorMessages&&K.FloorMessages.forFloor?K.FloorMessages.forFloor(s.floor):theme.name));
    finish();
    if(K.Audio)K.Audio.setForState?K.Audio.setForState(s):K.Audio.setTheme(s.floor);
  }
  function place(n,fn,start){for(var i=0;i<n;i++)placeOne(fn,start);}
  function placeOne(fn,start){var p=K.Map.freeCell(S.data,start);if(p)fn(p);}
  function placeEnemies(n,mode){
    var s=S.data;
    for(var i=0;i<n;i++){
      var p=null;
      for(var t=0;t<120;t++){
        var q=K.Map.freeCell(s,1);
        if(q&&U.distance(q,s.player)>6&&U.distance(q,s.stairs)>3){p=q;break;}
      }
      if(p)s.enemies.push(K.Entities.createEnemy(s.floor,p,mode));
    }
  }

  function setFacing(dx,dy){
    if(!dx&&!dy)return;
    if(K.Direction8)K.Direction8.apply(S.data.player,dx,dy);
    else S.data.player.facingDirection={dx:Math.sign(dx),dy:Math.sign(dy)};
  }
  function asleep(){var p=S.data.player;if(p.status.sleep>0){S.addLog('深い眠りで動けない。');endTurn();return true;}return false;}
  function face(dx,dy){if(isInputLocked()||(!dx&&!dy))return;setFacing(dx,dy);S.save();K.UI.draw(S.data);}
  function move(dx,dy){
    var s=S.data,p=s.player;
    if(isInputLocked()||(!dx&&!dy)||asleep())return{moved:false};
    if(p.status.confuse>0){
      var names=Object.keys(K.Directions),random=K.Directions[names[U.rand(names.length)]];
      dx=random[0];dy=random[1];
    }
    setFacing(dx,dy);
    var nx=p.x+dx,ny=p.y+dy,e=s.enemies.find(function(q){return q.x===nx&&q.y===ny;});
    if(e){
      if(dx&&dy&&!K.CombatRules.canDiagonalMeleeAttack(s,p,e)){S.addLog('通路では斜めに通常攻撃できない。');endTurn({delayEnemy:true});return{moved:false,combat:false};}
      K.Entities.attack(s,e);endTurn({delayEnemy:true});return{moved:false,combat:true};
    }
    if(!K.Map.canStep(s,nx,ny,dx,dy)){K.UI.draw(s);return{moved:false,blocked:true};}
    p.x=nx;p.y=ny;
    var ground=s.groundItems.find(function(q){return q.x===nx&&q.y===ny;}),hadItem=!!ground,important=ground&&ground.category==='treasure'&&K.Campaign&&K.Campaign.collectTreasure,canMerge=ground&&ground.category==='arrow'&&s.inventory.some(function(q){return q.id===ground.id&&q.quantity<99;});
    if(hadItem&&(important||s.inventory.length<K.Config.inventoryMax||canMerge))pickup();
    var trapResult=triggerTrap(),onStairs=!!s.stairs&&nx===s.stairs.x&&ny===s.stairs.y;if(K.MonsterHouse)K.MonsterHouse.checkEntry(s);
    if(trapResult&&trapResult.pending){
      s.turnLocked=true;
      if(K.Sound)K.Sound.play(trapResult.sound||'trap');
      if(K.Animation)K.Animation.player(trapResult.animation||'trap',trapResult.delay||420,{dx:0,dy:1});
      S.save();K.UI.draw(s);
      setTimeout(function(){
        var result=K.Traps.applyPlayer(s,trapResult.trap);
        if(result&&result.message)S.addLog(result.message);
        s.turnLocked=false;
        var alive=endTurn();
        if(alive&&result&&result.descend){
          s.turnLocked=true;
          if(K.Sound)K.Sound.play('stairs');
          if(K.Animation)K.Animation.player('fall',520,{dx:0,dy:1});
          K.UI.draw(s);
          setTimeout(function(){s.floor++;buildFloor();},540);
        }else if(alive&&onStairs)K.UI.showStairs();
      },trapResult.delay||420);
      return{moved:true,event:true,trap:true};
    }
    var alive=endTurn();
    if(alive&&trapResult&&trapResult.descend){
      s.turnLocked=true;
      if(K.Sound)K.Sound.play('stairs');
      if(K.Animation)K.Animation.player('fall',520,{dx:0,dy:1});
      K.UI.draw(s);
      setTimeout(function(){s.floor++;buildFloor();},540);
      return{moved:true,event:true,fall:true};
    }
    if(alive&&onStairs)K.UI.showStairs();
    return{moved:true,event:hadItem||!!trapResult||onStairs,stairs:onStairs};
  }
  function inRoom(s,x,y){return s.rooms.some(function(r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;});}
  function visibleEnemyNear(s){return s.enemies.some(function(e){return s.seen[U.key(e.x,e.y)]&&U.distance(e,s.player)<=5;});}
  function branches(s,x,y){var n=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){if(K.Map.walkable(s,x+d[0],y+d[1]))n++;});return n;}
  function crossesRoomEntrance(s,x,y,nx,ny){return inRoom(s,x,y)!==inRoom(s,nx,ny);}
  function stopBeforeRun(s,dx,dy,steps){
    var p=s.player,nx=p.x+dx,ny=p.y+dy;
    if(!K.Map.canStep(s,nx,ny,dx,dy)||!s.seen[U.key(nx,ny)])return true;
    if(s.enemies.some(function(e){return e.x===nx&&e.y===ny;})||visibleEnemyNear(s))return true;
    if(steps>0&&crossesRoomEntrance(s,p.x,p.y,nx,ny))return true;
    if(steps>0&&!inRoom(s,p.x,p.y)&&branches(s,p.x,p.y)!==2)return true;
    return false;
  }
  function run(dx,dy){if(isInputLocked()||runEntranceBlocked)return;if(!dx&&!dy)return;var s=S.data,stoppedAtEntrance=false;runActionBatch=true;runSpawnCounted=false;try{for(var steps=0;steps<40;steps++){if(stopBeforeRun(s,dx,dy,steps)){var p=s.player;stoppedAtEntrance=steps>0&&crossesRoomEntrance(s,p.x,p.y,p.x+dx,p.y+dy);if(stoppedAtEntrance)runEntranceBlocked=true;break;}var result=move(dx,dy);if(!result.moved||result.event||visibleEnemyNear(s)||s.gameOver)break;}}finally{runActionBatch=false;runSpawnCounted=false;}return{stoppedAtEntrance:stoppedAtEntrance};}
  function releaseRunEntranceStop(){runEntranceBlocked=false;}
  function clearDungeon(){var s=S.data;clearEnemyTurnTimer();if(K.Campaign&&K.Campaign.onDungeonReturn)return K.Campaign.onDungeonReturn(s);s.gameOver=true;S.clearSave();K.UI.draw(s);if(K.UI.showEscape){K.UI.showEscape(s);var text=document.querySelector('#overlayText');if(text&&K.Treasures)text.textContent=K.Treasures.clearMessage(s);}return true;}
  function descend(){var s=S.data;if(isInputLocked()||!s.stairs||s.stairs.disabled||s.player.x!==s.stairs.x||s.player.y!==s.stairs.y)return false;clearEnemyTurnTimer();K.UI.closeStairs();if(s.stairs.type==='up'){s.floor--;if(s.floor<=0)return clearDungeon();s.player.hp=Math.min(s.player.maxHp,s.player.hp+3);buildFloor();return true;}var mode=K.Dungeons.get(s.dungeonId),max=mode.maxFloor||99;s.floor=s.floor>=max?max:s.floor+1;s.player.hp=Math.min(s.player.maxHp,s.player.hp+3);buildFloor();return true;}
  function stayStairs(){K.UI.closeStairs();return true;}
  function attack(){
    var s=S.data,p=s.player;if(isInputLocked()||asleep())return;
    var f=p.facingDirection||{dx:0,dy:1},target={x:p.x+f.dx,y:p.y+f.dy};
    if(f.dx&&f.dy&&!K.CombatRules.canDiagonalMeleeAttack(s,p,target)){S.addLog('通路では斜めに通常攻撃できない。');endTurn({delayEnemy:true});return;}
    var e=s.enemies.find(function(q){return q.x===target.x&&q.y===target.y;});
    if(e)K.Entities.attack(s,e);else S.addLog('攻撃は外れた。');
    endTurn({delayEnemy:true});
  }
  function shootArrow(){
    var s=S.data;if(isInputLocked()||asleep())return false;
    var result=K.ItemActions.shootEquipped(s);S.addLog(result.message);
    if(!result.success){K.UI.draw(s);return false;}
    endTurn({delayEnemy:true});return true;
  }
  function step(){var s=S.data;if(isInputLocked()||asleep())return;S.addLog('その場で足踏みした。');endTurn();}
  function tickPlayerStatus(p,key,message){p.status=p.status||{};if((p.status[key]||0)>0){p.status[key]--;if(p.status[key]===0)S.addLog(message);}}

  function pickup(){
    var s=S.data,p=s.player,i=s.groundItems.findIndex(function(q){return q.x===p.x&&q.y===p.y;});
    if(i<0){S.addLog('足元に拾える道具はない。');return false;}
    var item=s.groundItems[i];
    if(K.Campaign&&K.Campaign.collectTreasure&&K.Campaign.collectTreasure(s,item,i))return true;
    if(item.category==='arrow'){
      var stacks=s.inventory.filter(function(q){return q.id===item.id&&q.quantity<99;}),moved=0;
      stacks.forEach(function(stack){if(item.quantity<=0)return;var amount=Math.min(99-stack.quantity,item.quantity);stack.quantity+=amount;item.quantity-=amount;moved+=amount;});
      if(!moved&&s.inventory.length<K.Config.inventoryMax){
        var amount=Math.min(99,item.quantity),stack=K.Items.create(item.id,undefined,undefined,s.dungeonId);
        stack.quantity=amount;stack.identified=item.identified;stack.displayName=item.displayName;stack.equipped=false;
        s.inventory.push(stack);item.quantity-=amount;moved=amount;
      }
      if(moved){
        if(item.quantity<=0)s.groundItems.splice(i,1);
        S.addLog(item.trueName+'を'+moved+'本まとめた。'+(item.quantity>0?' 残り'+item.quantity+'本は床に残った。':''));
        return true;
      }
    }
    if(s.inventory.length>=K.Config.inventoryMax){S.addLog('道具袋がいっぱいです。');return false;}
    s.groundItems.splice(i,1);delete item.x;delete item.y;s.inventory.push(item);S.addLog(K.Items.name(item)+'を拾った。');if(K.Treasures)K.Treasures.onPickup(s,item);return true;
  }
  function pickupAction(){if(isInputLocked())return false;if(!pickup()){K.UI.draw(S.data);return false;}endTurn();return true;}
  function suspend(){if(isInputLocked())return false;if(K.Campaign&&K.Campaign.requestSuspend){K.Campaign.requestSuspend();return true;}S.save();K.UI.showSuspend();return true;}
  function resume(){K.UI.closeSuspend();return true;}
  function triggerTrap(){var s=S.data,p=s.player,t=s.traps.find(function(q){return q.x===p.x&&q.y===p.y;});if(!t)return null;if(K.Traps.armPlayer){var armed=K.Traps.armPlayer(s,t);S.addLog(armed.message);return armed;}var result=K.Traps.applyPlayer(s,t);S.addLog(result.message);return result;}
  function openItem(index){var s=S.data;if(isInputLocked()||index<0||index>=s.inventory.length)return;if(K.Input&&K.Input.cancelHeldMovement)K.Input.cancelHeldMovement();selectedIndex=index;K.UI.showItemMenu(K.Items.name(s.inventory[index]),K.ItemActions.actionsFor(s.inventory[index]));}
  function itemAction(action){
    var s=S.data,item=s.inventory[selectedIndex];
    if(isInputLocked())return;
    if(K.Input&&K.Input.cancelHeldMovement)K.Input.cancelHeldMovement();
    if(!item){K.UI.closeItemMenu();return;}
    var result=K.ItemActions.perform(action,s,item);
    if(result.message)S.addLog(result.message);
    if(!result.success){K.UI.draw(s);return;}
    K.UI.closeItemMenu();selectedIndex=-1;
    if(result.endRun)return escapeDungeon();
    endTurn({delayEnemy:true});
  }
  function escapeDungeon(){var s=S.data;clearEnemyTurnTimer();s.gameOver=true;S.clearSave();K.UI.draw(s);K.UI.showEscape(s);}
  function finishEnemyPhase(s,p,skipEnemy,token){
    if(token!==undefined&&token!==enemyTurnToken)return false;
    if(!s||S.data!==s||s.gameOver||p.hp<=0){if(p&&p.hp<=0)gameOver();return false;}
    if(!skipEnemy)K.Entities.takeEnemyTurns(s);
    if(p.hp<=0){gameOver();return false;}
    if(K.Hunger&&K.Hunger.processTurn)K.Hunger.processTurn(s);
    else if(!K.Items.hasEffect(s,'noHunger')){
      p.hungerClock=(p.hungerClock||0)+1;
      var limit=K.Items.hasEffect(s,'hungerHalf')?10:5;
      if(p.hungerClock>=limit){p.food=Math.max(0,p.food-1);p.hungerClock=0;}
    }
    if(p.hp<=0){gameOver();return false;}
    if(K.PlayerVitals)K.PlayerVitals.processNaturalHpRecovery(s);
    K.Spawns.tryNaturalSpawn(s);
    if(K.Items.hasEffect(s,'randomWarp')&&Math.random()<1/16){K.ItemActions.warpEntity(s,p);S.addLog('ワープの指輪が勝手に場所を移した。');}
    K.Map.reveal(s);
    if(p.hp<=0){gameOver();return false;}
    s.turnLocked=false;
    finish();return true;
  }
  function endTurn(options){
    var s=S.data,p=s.player;
    if(p.hp<=0){gameOver();return false;}
    if(s.turnLocked)return false;
    if(!runActionBatch||!runSpawnCounted){K.Spawns.recordAction(s);if(runActionBatch)runSpawnCounted=true;}
    s.turn++;
    tickPlayerStatus(p,'sleep','眠りから目を覚ました。');
    tickPlayerStatus(p,'confuse','混乱が解けた。');
    tickPlayerStatus(p,'haste','倍速の効果が切れた。');
    tickPlayerStatus(p,'blind','目つぶしが治った。');
    tickPlayerStatus(p,'invisible','透明の効果が切れた。');
    tickPlayerStatus(p,'slow','体の重さが消えた。');
    if(p.status.poison>0&&K.Items.hasEffect(s,'poisonGuard')){p.status.poison=0;S.addLog('毒よけの指輪が毒を消した。');}
    else if(p.status.poison>0){p.status.poison--;if(p.status.poison%3===0){p.hp=Math.max(0,p.hp-1);S.addLog('毒でHPが1減った。');}if(p.status.poison===0)S.addLog('毒が消えた。');}
    tickPlayerStatus(p,'trapSight','ワナ見え草の効果が切れた。');
    var skipEnemy=p.status.haste>0&&s.turn%2===0;
    if(options&&options.delayEnemy){
      s.turnLocked=true;
      var token=++enemyTurnToken;
      S.save();K.UI.draw(s);
      enemyTurnTimer=setTimeout(function(){enemyTurnTimer=null;finishEnemyPhase(s,p,skipEnemy,token);},500);
      return true;
    }
    return finishEnemyPhase(s,p,skipEnemy);
  }
  function finish(){S.save();K.UI.draw(S.data);return true;}
  function gameOver(){var s=S.data;clearEnemyTurnTimer();s.player.hp=0;s.gameOver=true;if(K.Ranking)K.Ranking.recordGameOver(s);K.UI.closeItemMenu();K.UI.closeStairs();if(K.Campaign&&K.Campaign.onGameOver){K.Campaign.onGameOver(s);return;}S.clearSave();K.UI.draw(s);K.UI.showGameOver(s);}
  function newGame(id){clearEnemyTurnTimer();S.reset(typeof id==='string'?id:K.Config.defaultDungeon);K.Input.resetModes();K.UI.hideOverlay();K.UI.closeStatus();K.UI.closeItemMenu();K.UI.closeStairs();buildFloor();}
  function toggleStatus(){K.UI.toggleStatus(S.data);}
  function sortInventory(){var s=S.data;if(isInputLocked())return false;K.Inventory.manualSort(s);S.addLog('道具袋を整理した。');S.save();K.UI.draw(s);return true;}
  K.Game={actions:{move:move,run:run,face:face,attack:attack,shootArrow:shootArrow,step:step,pickup:pickupAction,suspend:suspend,resume:resume,openItem:openItem,itemAction:itemAction,newGame:newGame,toggleStatus:toggleStatus,descend:descend,stayStairs:stayStairs,sortInventory:sortInventory},buildFloor:buildFloor,endTurn:endTurn,endTurnDelayed:function(){return endTurn({delayEnemy:true});},isInputLocked:isInputLocked,cancelPendingEnemyTurn:clearEnemyTurnTimer,releaseRunEntranceStop:releaseRunEntranceStop,enemyCountFor:K.Spawns.enemyCount};
  addEventListener('DOMContentLoaded',function(){K.UI.init();K.Input.init(K.Game.actions);if(K.Campaign&&K.Campaign.boot){K.Campaign.boot();return;}if(!S.load())buildFloor();else{if(K.MonsterHouse)K.MonsterHouse.normalize(S.data);K.Map.reveal(S.data);K.UI.draw(S.data);if(K.Audio)K.Audio.setForState?K.Audio.setForState(S.data):K.Audio.setTheme(S.data.floor);}});
})(window.Kiri=window.Kiri||{});
