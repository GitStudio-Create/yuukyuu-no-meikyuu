(function(K){
  'use strict';
  function pct(n){return n===undefined?'-':Math.round(n*100)+'%';}
  function roleName(id){return(K.EnemyCatalog.roles&&K.EnemyCatalog.roles[id])||id||'-';}
  function abilityName(a){return{
    none:'なし',poisonTouch:'毒攻撃',sleepTouch:'睡眠攻撃',confuseTouch:'混乱攻撃',confuseGaze:'混乱にらみ',
    weakenGear:'装備弱化',hungerDrain:'満腹度低下',split:'分裂',warpHit:'被弾ワープ',
    phase:'壁抜け',rangedShot:'直線遠距離',fireBreath:'炎ブレス',staffCast:'妨害術',roomShot:'部屋内光線',steal:'盗み'
  }[a]||a||'なし';}
  function selectedDef(panel){var sel=panel&&panel.querySelector('[data-gm-enemy]');return sel?K.EnemyCatalog.get(sel.value):K.EnemyCatalog.list[0];}
  function selectedExisting(panel,state){var sel=panel&&panel.querySelector('[data-gm-existing-enemy]'),i=sel&&sel.value;return state&&state.enemies?state.enemies[Number(i)]:null;}
  function line(label,value){return '<div><span>'+label+'</span><b>'+value+'</b></div>';}
  function renderMonsterPanel(panel,state){
    var box=panel&&panel.querySelector('[data-gm-monster-detail]');if(!box)return;
    var d=selectedDef(panel),e=selectedExisting(panel,state),chance=d.specialChance!==undefined?d.specialChance:(d.poisonChance||d.sleepChance||d.confuseChance||d.rustChance||d.splitChance||d.warpChance);
    box.innerHTML=
      '<h4>選択中: '+d.name+'</h4>'+
      '<div class="gm-monster-grid">'+
      line('役割',roleName(d.role))+line('HP',d.hp)+line('攻撃',d.attack)+line('防御',d.defense)+line('経験値',d.exp)+
      line('出現階層',d.floorRange[0]+'-'+d.floorRange[1]+'F')+line('重み',d.spawnWeight)+line('上限',d.maxPerFloor||'-')+
      line('ドロップ',pct(d.dropRate))+line('特殊',abilityName(d.specialAbility))+line('発動率',pct(chance))+line('射程',d.specialRange||'-')+
      line('速度',d.behaviorType==='fast'?'倍速':d.behaviorType==='slow'?'鈍足':'通常')+
      '</div><p>'+d.description+'</p>'+
      (e?'<h4>対象敵の状態</h4><div class="gm-monster-grid">'+
        line('現在HP',e.hp+'/'+e.maxHp)+line('AI状態',e.aiState||'-')+line('睡眠',e.spawnSleep||e.effectSleep||e.status&&e.status.sleep?'あり':'なし')+
        line('盗品',e.stolenItem?K.Items.name(e.stolenItem):'なし')+line('分裂元',e.splitParent||'-')+line('CD',e.specialCooldownLeft||0)+
      '</div>':'');
  }
  function enhancePanel(){
    var panel=document.querySelector('#gmPanel');if(!panel||panel.querySelector('[data-gm-monster-detail]'))return;
    var section=panel.querySelector('[data-gm-enemy]');section=section&&section.closest('section');if(!section)return;
    section.insertAdjacentHTML('beforeend','<div class="gm-monster-detail" data-gm-monster-detail></div>');
    section.addEventListener('change',function(e){if(e.target.matches('[data-gm-enemy],[data-gm-existing-enemy]'))renderMonsterPanel(panel,K.State.data);});
    renderMonsterPanel(panel,K.State&&K.State.data);
  }
  addEventListener('DOMContentLoaded',function(){setTimeout(enhancePanel,0);});
  var oldDraw=K.UI&&K.UI.draw;
  if(oldDraw)K.UI.draw=function(state){oldDraw.call(this,state);enhancePanel();renderMonsterPanel(document.querySelector('#gmPanel'),state);};
  K.MonsterGM={render:renderMonsterPanel};
})(window.Kiri=window.Kiri||{});
