(function(K){
  'use strict';
  var effectText={heal25:'HPを25回復する。HP満タン時は最大HPを1増やす。',heal100:'HPを100回復する。HP満タン時は最大HPを2増やす。',attack:'周囲へ火花を放ち、近くの敵にダメージを与える。',powerMend:'低下したちからを最大値まで戻す。',powerUp:'ちからと最大値を1増やす。',level:'蓄えた経験を満たし、レベルを1上げる。',haste:'しばらく行動を速める。',sight:'現在階にある罠の位置と種類を見抜く。',poison:'HPとちからを下げる毒を含む。',confuse:'しばらく方向感覚を乱す。',blind:'しばらく目つぶし状態になる。こんらん目玉のにらみを受けない。敵に当てると敵の目をつぶす。',invisible:'しばらく透明になり、敵に居場所を気付かれず、こんらん目玉のにらみも受けない。',sleep:'深い眠りへ誘う。',warp:'同じ階の別の場所へ移す。',flame:'向いている方向へ炎を吹き、敵へ大きなダメージを与える。',thunder:'正面へ雷光を走らせ、敵にダメージを与える。',slow:'正面の敵の動きを鈍らせる。',change:'正面の敵を別の性質へ変化させる。',hpOne:'正面の敵のHPを1まで削る。',sacrifice:'自分のHPを半分使い、敵へ大きなダメージを与える。',escape:'迷宮探索を終え、安全に地上へ戻る。',weaponUp:'装備中の武器を1強化し、呪いも解く。',shieldUp:'装備中の盾を1強化し、呪いも解く。',uncurse:'装備中の道具に絡んだ呪いを解く。',identify:'正体や回数が不明な道具を一つ識別する。',map:'この階全体を明るくし、地形・罠の位置と種類・道具・階段の位置を明らかにする。敵の位置は全体マップには表示されない。効果は階を移動するまで続く。',traps:'現在階にある罠の位置と種類を明らかにする。',items:'現在階に落ちている道具の位置を明らかにする。',enemies:'この階にいるすべての敵の位置が、全体マップに赤い点で表示される。効果は階を移動するまで続く。',blast:'同じ部屋の敵へ衝撃を与える。',food:'手持ちの道具一つを大きな食料へ変える。',charge:'手持ちの杖一つへ使用回数を加える。',hungerHalf:'装備中は満腹度の減り方を半分にする。',poisonGuard:'装備中は毒による低下を防ぐ。',rustProof:'錆びず、強化値が失われない。',fireHalf:'装備中は炎によるダメージを軽減する。',maxPower:'装備中は攻撃に使うちからを3増やす。',sleepGuard:'装備中は眠りを防ぐ。',noHunger:'装備中は満腹度が減らない。',trapGuard:'装備中は踏んだ罠を無効にする。',randomWarp:'装備中、まれに勝手に別の場所へ移動する。',normal:'向いている方向へ最大10マス飛ぶ矢。',pierce:'壁まで飛び、直線上の複数の敵を貫く矢。'};
  var foodText={nutBread:'食べると満腹度を50回復する。',bigBread:'食べると満腹度を最大まで回復する。',spoiledBread:'満腹度は最大まで回復するが、HPとちからが下がる。'};
  var categoryLabels={food:'食料',herb:'草',scroll:'巻物',staff:'杖',weapon:'武器',shield:'盾',ring:'指輪',arrow:'矢',treasure:'宝物'};
  var useText={food:'食べる・投げる・置く',herb:'飲む・投げる・置く',scroll:'読む・投げる・置く',staff:'振る・投げる・置く',weapon:'装備・投げる・置く',shield:'装備・投げる・置く',ring:'装備または外す・投げる・置く',arrow:'装備・撃つ・置く',treasure:'持ち帰る・置く'};
  Object.keys(K.Items.definitions).forEach(function(id){
    var d=K.Items.definitions[id];
    d.description=foodText[id]||effectText[d.effect]||((d.category==='weapon'?'装備すると攻撃力を上げる武器。':d.category==='shield'?'装備すると防御力を上げる盾。':d.category==='ring'?'装備中に力を発揮する指輪。':d.category==='treasure'?'地上まで持ち帰るための宝箱。':'迷宮で役立つ道具。'));
  });
  function metadata(item){
    var rows=[];
    if(item.equipped)rows.push('装備中');
    if(item.category==='weapon')rows.push('攻撃補正: '+(item.bonus>=0?'+':'')+item.bonus);
    if(item.category==='shield')rows.push('防御補正: '+(item.bonus>=0?'+':'')+item.bonus);
    if(['weapon','shield','ring'].indexOf(item.category)>=0)rows.push('呪い: '+(item.curseKnown?(item.cursed?'あり':'なし'):'未判明'));
    if(item.category==='staff')rows.push(item.chargesKnown?'杖の残り回数: '+item.charges+'回':'杖の残り回数: 不明');
    if(item.category==='arrow')rows.push('本数: '+item.quantity+'本');
    return rows;
  }
  K.ItemDetails={
    categoryLabel:function(c){return categoryLabels[c]||'道具';},
    description:function(item){if(!item.identified)return'まだ正体が分からない。効果はまだ分からない。';var d=K.Items.definitions[item.id];return d&&d.description||'効果の記録がない。';},
    forItem:function(item){return{name:K.Items.name(item),category:this.categoryLabel(item.category),description:this.description(item),usage:useText[item.category]||'投げる・置く',metadata:metadata(item)};},
    prompt:function(item,action){var verbs={eat:'食べますか？',drink:'飲みますか？',read:'読みますか？',wave:'振りますか？',equip:'装備しますか？',unequip:'外しますか？',shoot:'撃ちますか？',throw:'投げますか？',place:'置きますか？'};return K.Items.name(item)+'を'+(verbs[action]||'使いますか？');}
  };
})(window.Kiri=window.Kiri||{});
