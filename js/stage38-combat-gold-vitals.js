(function(K){
  'use strict';
  var GOLD_CHANCE=.55,GOLD_DROP_MIN=1,GOLD_DROP_MAX=100,RANKING_KEY='eternal_labyrinth_gold_ranking';
  function removeInventory(state,item){var i=state.inventory.indexOf(item);if(i>=0)state.inventory.splice(i,1);}
  function goldAmountForFloor(){return GOLD_DROP_MIN+K.Util.rand(GOLD_DROP_MAX-GOLD_DROP_MIN+1);}
  function createGold(amount,x,y){return{id:'gold',category:'gold',trueName:'ゴールド',displayName:'ゴールド',identified:true,x:x,y:y,amount:Math.max(1,Math.floor(amount||1)),quantity:1};}
  function goldName(item){return(item.amount||0)+'G';}
  function collectGold(state,item){var i=state.groundItems.indexOf(item);if(i>=0)state.groundItems.splice(i,1);state.player.gold=(state.player.gold||0)+(item.amount||0);K.State.addLog((item.amount||0)+'Gを拾った。');if(K.UI&&K.UI.hideFloorItemTooltip)K.UI.hideFloorItemTooltip();return true;}
  function canPlaceGold(state,x,y){return K.ProjectileLanding?K.ProjectileLanding.canLand(state,x,y):K.Map.walkable(state,x,y);}
  function dropGoldAt(state,amount,x,y){
    var gold=createGold(amount,x,y),result=K.ProjectileLanding&&K.ProjectileLanding.resolveLanding?K.ProjectileLanding.resolveLanding(state,gold,{x:x,y:y},{disappearMessage:''}):null;
    if(result&&result.placed)return gold;
    if(!result&&canPlaceGold(state,x,y)){state.groundItems.push(gold);return gold;}
    return null;
  }
  function placeFloorGold(state){
    if(state.goldPlacedFloor===state.floor)return;
    state.goldPlacedFloor=state.floor;
    var count=K.Util.rand(100)<GOLD_CHANCE?1+K.Util.rand(K.Util.rand(100)<15?3:2):0;
    for(var i=0;i<count;i++){var p=K.Map.freeCell(state,0);if(p)dropGoldAt(state,goldAmountForFloor(state.floor),p.x,p.y);}
  }
  function collectGoldAtPlayer(state){
    var p=state.player,item=(state.groundItems||[]).find(function(g){return g.category==='gold'&&g.x===p.x&&g.y===p.y;});
    return item?collectGold(state,item):false;
  }
  function cleanInventoryGold(state){
    (state.inventory||[]).slice().forEach(function(item){if(item.category==='gold'){removeInventory(state,item);state.player.gold=(state.player.gold||0)+(item.amount||0);K.State.addLog((item.amount||0)+'Gを拾った。');}});
  }
  function applyStrengthDamage(state,amount,source,opts){
    opts=opts||{};var p=state.player,before=p.power===undefined?8:p.power;
    if(K.Items.hasEffect(state,'poisonGuard')){if(!opts.silent)K.State.addLog('毒よけの指輪が毒を防いだ。');return 0;}
    p.power=Math.max(0,before-Math.max(0,Math.floor(amount||0)));
    var down=before-p.power;
    if(!opts.silent){
      K.State.addLog((source?source+'を受けた。':'毒を受けた。'));
      K.State.addLog(down>0?'ちからが'+down+'下がった。':'しかし、ちからはこれ以上下がらなかった。');
    }
    return down;
  }
  function directDamage(state,amount,source,opts){state.player.hp-=Math.max(0,Math.floor(amount||0));if(!(opts&&opts.silent))K.State.addLog((source||'ダメージ')+'でHPが'+amount+'減った。');return amount;}
  function processNaturalHpRecovery(state){
    var p=state.player;p.hpRegenAccumulator=p.hpRegenAccumulator||0;p.lastHpRegen=0;
    if(p.hp>=p.maxHp){p.hpRegenAccumulator=0;return 0;}
    if(p.food<=0)return 0;
    p.hpRegenAccumulator+=p.maxHp/150;
    var heal=Math.floor(p.hpRegenAccumulator+1e-9);
    if(heal>0){p.hp=Math.min(p.maxHp,p.hp+heal);p.hpRegenAccumulator=Math.max(0,p.hpRegenAccumulator-heal);p.lastHpRegen=heal;if(p.hp>=p.maxHp)p.hpRegenAccumulator=0;}
    return p.lastHpRegen;
  }
  K.PlayerVitals={applyStrengthDamage:applyStrengthDamage,applyDirectPlayerDamage:directDamage,processNaturalHpRecovery:processNaturalHpRecovery,regenPerTurn:function(player){return(player.maxHp||0)/150;}};
  function readRanking(){try{var list=JSON.parse(localStorage.getItem(RANKING_KEY)||'[]');return Array.isArray(list)?list.filter(function(r){return r&&Number.isFinite(Number(r.gold));}):[];}catch(e){return[];}}
  function saveRanking(list){try{localStorage.setItem(RANKING_KEY,JSON.stringify(list.slice(0,10)));}catch(e){}}
  function recordGameOver(state){
    if(!state||state.rankingRecorded)return false;
    state.rankingRecorded=true;
    var entry={gold:Math.max(0,Math.floor((state.player&&state.player.gold)||0)),floor:state.floor||1,level:(state.player&&state.player.level)||1,turn:state.turn||0,type:state.cleared?'clear':'gameOver',date:new Date().toISOString()};
    var key=[entry.gold,entry.floor,entry.level,entry.turn,entry.type].join(':');
    var list=readRanking().filter(function(r){return [r.gold,r.floor,r.level,r.turn,r.type].join(':')!==key;});
    list.push(entry);
    list.sort(function(a,b){return(b.gold||0)-(a.gold||0)||(b.floor||0)-(a.floor||0);});
    saveRanking(list);
    return true;
  }
  K.Gold={create:createGold,name:goldName,amountForFloor:goldAmountForFloor,placeFloorGold:placeFloorGold,dropAt:dropGoldAt,collect:collectGold,collectAtPlayer:collectGoldAtPlayer,min:GOLD_DROP_MIN,max:GOLD_DROP_MAX,chance:GOLD_CHANCE};
  K.Ranking={key:RANKING_KEY,list:readRanking,recordGameOver:recordGameOver};
  function normalizeState(state){if(!state||!state.player)return state;var p=state.player;if(p.hpRegenAccumulator===undefined)p.hpRegenAccumulator=0;if(p.lastHpRegen===undefined)p.lastHpRegen=0;p.status=p.status||{};p.status.poison=0;state.groundItems=(state.groundItems||[]).map(function(item){if(item&&item.id==='gold')item.category='gold';return item;});return state;}
  var oldResetState=K.State.reset,oldLoadState=K.State.load;
  K.State.reset=function(){return normalizeState(oldResetState.apply(this,arguments));};
  K.State.load=function(){var ok=oldLoadState.apply(this,arguments);if(ok)normalizeState(this.data);return ok;};

  var oldName=K.Items.name;
  K.Items.name=function(item){return item&&item.category==='gold'?goldName(item):oldName.call(this,item);};
  if(K.ItemDetails&&K.ItemDetails.forItem){
    var oldDetail=K.ItemDetails.forItem;
    K.ItemDetails.forItem=function(item){if(item&&item.category==='gold')return{name:'ゴールド',category:'お金',description:(item.amount||0)+'G。拾うと所持金に加算される。',usage:'拾う',metadata:[(item.amount||0)+'G']};return oldDetail.call(this,item);};
  }
  if(K.Items&&K.Items.definitions){
    if(K.Items.definitions.poisonHerb)K.Items.definitions.poisonHerb.description='飲むとHPが5減り、現在ちからが3下がる。投げると敵に5ダメージを与える。';
    if(K.Items.definitions.spoiledBread)K.Items.definitions.spoiledBread.description='食べると満腹度が最大まで回復するが、HPが5減り、現在ちからが1下がる。';
    if(K.Items.definitions.powerMendHerb)K.Items.definitions.powerMendHerb.description='飲むと現在ちからが最大ちからまで回復し、満腹度が5回復する。HPは回復しない。';
  }
  if(K.ItemIcons){var oldIcon=K.ItemIcons.draw;K.ItemIcons.draw=function(ctx,category,x,y,size){if(category!=='gold')return oldIcon.apply(this,arguments);var s=size/20;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#d8ad4a';ctx.beginPath();ctx.arc(10,10,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0a2';ctx.fillRect(7,5,6,2);ctx.fillRect(6,9,8,2);ctx.fillRect(7,13,6,2);ctx.restore();};}

  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    if(action==='eat'&&item.id==='spoiledBread'){
      var name=K.Items.name(item),foodBefore=state.player.food;state.player.food=state.player.maxFood||100;removeInventory(state,item);
      directDamage(state,5,name,{silent:true});var down=applyStrengthDamage(state,1,name,{silent:true});
      return{success:true,message:name+'を食べた。\n満腹度が'+(state.player.food-foodBefore)+'回復した。\nHPが5減った。\n'+(down>0?'ちからが'+down+'下がった。':'毒よけがちから低下を防いだ。')};
    }
    if(action==='drink'&&item.id==='poisonHerb'){
      var herbName=K.Items.name(item);state.player.food=Math.min(state.player.maxFood||100,state.player.food+5);removeInventory(state,item);K.Items.identify(item);
      directDamage(state,5,herbName,{silent:true});var lowered=applyStrengthDamage(state,3,herbName,{silent:true});
      return{success:true,message:herbName+'を飲んだ。\nHPが5減った。\n'+(lowered>0?'ちからが'+lowered+'下がった。':'毒よけがちから低下を防いだ。')};
    }
    if(action==='drink'&&item.id==='powerMendHerb'){
      var before=state.player.power;state.player.food=Math.min(state.player.maxFood||100,state.player.food+5);state.player.power=state.player.maxPower;removeInventory(state,item);K.Items.identify(item);
      return{success:true,message:item.trueName+'を飲んだ。\n'+(state.player.power>before?'ちからが最大まで回復した。':'ちからは下がっていなかった。')};
    }
    return oldPerform.apply(this,arguments);
  };

  if(K.Game&&K.Game.actions){
    var oldMove=K.Game.actions.move;
    K.Game.actions.move=function(dx,dy){var s=K.State.data,p=s.player,target={x:p.x+dx,y:p.y+dy},gold=s.groundItems.find(function(g){return g.category==='gold'&&g.x===target.x&&g.y===target.y;});if(gold&&K.Map.canStep(s,target.x,target.y,dx,dy)&&!s.enemies.some(function(e){return e.x===target.x&&e.y===target.y;}))collectGold(s,gold);var r=oldMove.apply(this,arguments);cleanInventoryGold(s);collectGoldAtPlayer(s);return r;};
    var oldPickup=K.Game.actions.pickup;
    K.Game.actions.pickup=function(){var s=K.State.data;if(collectGoldAtPlayer(s)){K.Game.endTurn();return true;}return oldPickup.apply(this,arguments);};
    var oldBuild=K.Game.buildFloor;
    K.Game.buildFloor=function(){var r=oldBuild.apply(this,arguments);placeFloorGold(K.State.data);K.Map.reveal(K.State.data);K.State.save();K.UI.draw(K.State.data);return r;};
    var oldNew=K.Game.actions.newGame;
    K.Game.actions.newGame=function(){var r=oldNew.apply(this,arguments);placeFloorGold(K.State.data);K.UI.draw(K.State.data);return r;};
    var oldDescend=K.Game.actions.descend;
    K.Game.actions.descend=function(){var r=oldDescend.apply(this,arguments);if(r){placeFloorGold(K.State.data);K.UI.draw(K.State.data);}return r;};
  }
  addEventListener('DOMContentLoaded',function(){setTimeout(function(){normalizeState(K.State.data);if(K.State&&K.State.data&&K.State.data.map&&K.State.data.map.length){placeFloorGold(K.State.data);K.UI.draw(K.State.data);}},0);});
  function enhanceGMPanel(){
    var panel=document.querySelector('#gmPanel');
    if(!panel||panel.querySelector('[data-gm-gold-tools]'))return;
    var grid=panel.querySelector('.gm-grid');
    if(!grid)return;
    var section=document.createElement('section');
    section.setAttribute('data-gm-gold-tools','');
    section.innerHTML='<h3>ゴールド・自然回復</h3><p data-gm-regen-info>自然回復：-</p><label>生成G<input data-gm-gold-amount type="number" value="50" min="1" max="9999"></label><button data-gm-gold-foot>足元へG配置</button><button data-gm-gold-front>前方へG配置</button><button data-gm-gold-floor>この階へ床G生成</button><p data-gm-floor-gold-info></p>';
    grid.appendChild(section);
    panel.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('button');
      if(!b||!K.GM||!K.GM.active||!K.GM.active())return;
      var s=K.State.data,p=s.player,amount=Math.max(1,Math.floor(Number((panel.querySelector('[data-gm-gold-amount]')||{}).value)||50)),cell=null;
      if(b.matches('[data-gm-gold-foot]'))cell={x:p.x,y:p.y};
      else if(b.matches('[data-gm-gold-front]')){var f=p.facingDirection||{dx:0,dy:1};cell={x:p.x+f.dx,y:p.y+f.dy};}
      else if(b.matches('[data-gm-gold-floor]')){s.goldPlacedFloor=null;placeFloorGold(s);if(K.GM.log)K.GM.log('この階へゴールドを生成。','アイテム');K.UI.draw(s);return;}
      if(cell){
        var dropped=dropGoldAt(s,amount,cell.x,cell.y);
        if(K.GM.log)K.GM.log(dropped?amount+'Gを配置。':'ゴールドを配置できませんでした。','アイテム');
        K.UI.draw(s);
      }
    });
  }
  function updateGMVitals(){
    var panel=document.querySelector('#gmPanel'),s=K.State&&K.State.data;
    if(!panel||!s||!s.player)return;
    var regen=panel.querySelector('[data-gm-regen-info]'),gold=panel.querySelector('[data-gm-floor-gold-info]');
    if(regen)regen.textContent='自然回復：毎ターン '+((s.player.maxHp||0)/150).toFixed(3)+' / 蓄積 '+(s.player.hpRegenAccumulator||0).toFixed(3)+' / 直近 +'+(s.player.lastHpRegen||0);
    if(gold)gold.textContent='床G：'+(s.groundItems||[]).filter(function(i){return i.category==='gold';}).length+'個';
  }
  var oldDrawUi=K.UI&&K.UI.draw;
  if(oldDrawUi){K.UI.draw=function(s){oldDrawUi.call(this,s);var gold=document.querySelector('#goldText');if(gold&&s&&s.player)gold.textContent=(s.player.gold||0)+' G';enhanceGMPanel();updateGMVitals();};}
  if(K.UI&&K.UI.showGameOver){
    var oldShowGameOver=K.UI.showGameOver;
    K.UI.showGameOver=function(s){
      var result=oldShowGameOver.apply(this,arguments),text=document.querySelector('#overlayText'),list=readRanking();
      if(text&&s){
        var rows=list.slice(0,10).map(function(r,i){return(i+1)+'位　'+(r.gold||0).toLocaleString()+'G　'+(r.floor||1)+'F';}).join('\n');
        text.textContent=(text.textContent||'')+'\n所持金：'+(((s.player&&s.player.gold)||0).toLocaleString())+'G'+(rows?'\n\n所持金ランキング\n'+rows:'');
      }
      return result;
    };
  }
  addEventListener('DOMContentLoaded',function(){setTimeout(function(){enhanceGMPanel();updateGMVitals();},0);});
})(window.Kiri=window.Kiri||{});
