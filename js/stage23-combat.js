(function(K){
  'use strict';
  var oldDeathFrames=K.Animation.deathFrames;
  K.Animation.deathFrames=function(time){return oldDeathFrames.call(K.Animation,time).map(function(frame){if(frame.pending)frame.progress=-.125;return frame;});};
  var oldPerform=K.ItemActions.perform;
  K.ItemActions.perform=function(action,state,item){
    var tracked=action==='drink'&&item.category==='herb'?state.enemies.map(function(enemy){return{enemy:enemy,hp:enemy.hp};}):[];
    var name=item.trueName,effect=item.effect,result=oldPerform.apply(this,arguments);
    if(result&&result.messages)return result;
    if(!tracked.length||!result||!result.success)return result;
    var hits=tracked.filter(function(hit){return hit.enemy.hp<hit.hp;}).map(function(hit){var text=(effect==='flame'?'炎':'火花')+'が'+hit.enemy.name+'に'+(hit.hp-hit.enemy.hp)+'ダメージを与えた。';if(hit.enemy.hp<=0)text+=' '+hit.enemy.name+'を倒した。';return text;});
    if(hits.length)result.message=name+'を飲んだ。 '+hits.join(' ');
    return result;
  };
})(window.Kiri=window.Kiri||{});
