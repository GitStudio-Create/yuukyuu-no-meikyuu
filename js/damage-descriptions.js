(function(K){
  'use strict';
  var descriptions={
    blastScroll:'同じ部屋の敵へ雷撃を与える。\nダメージ：20',
    flameHerb:'向いている方向へ炎を放ち、最初に当たった敵を攻撃する。飲むと満腹度が1回復する。\nダメージ：飲む 65～75 / 投げる 35～40',
    reedArrow:'正面へ最大10マス飛ばし、最初に当たった敵を攻撃する。\n矢の強さ：4。実ダメージはレベルと敵防御で変化する。',
    ironArrow:'正面へ最大10マス飛ばし、最初に当たった敵を強く攻撃する。\n矢の強さ：9。実ダメージはレベルと敵防御で変化する。',
    pierceArrow:'壁まで飛び、直線上の複数の敵を貫いて攻撃する。\n矢の強さ：9。実ダメージはレベルと敵防御で変化する。',
    thunderStaff:'正面へ雷を飛ばし、最初に当たった敵を攻撃する。\nダメージ：22',
    sacrificeStaff:'自分のHPを半分消費し、その2倍のダメージを敵に与える。'
  };
  Object.keys(descriptions).forEach(function(id){if(K.Items.definitions[id])K.Items.definitions[id].description=descriptions[id];});
  K.DamageDescriptions=Object.freeze(descriptions);
})(window.Kiri=window.Kiri||{});
