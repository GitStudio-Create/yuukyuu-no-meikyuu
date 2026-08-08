(function(K){'use strict';
function table(kind){
  var common={
    nutBread:14,bigBread:4,spoiledBread:2,
    moonHerb:10,starHerb:5,powerMendHerb:4,powerSeedHerb:3,levelHerb:2,swiftHerb:3,sightHerb:3,poisonHerb:3,confuseHerb:3,blindHerb:2,invisibleHerb:1,sleepHerb:3,warpHerb:3,flameHerb:6,
    thunderStaff:4,slowStaff:3,sleepStaff:3,confuseStaff:3,blindStaff:2,invisibleStaff:1,warpStaff:3,changeStaff:2,hasteStaff:2,sacrificeStaff:2,
    escapeScroll:2,weaponScroll:3,shieldScroll:3,uncurseScroll:3,identifyScroll:3,mapScroll:3,trapScroll:2,itemScroll:2,enemyScroll:2,blastScroll:3,foodScroll:2,chargeScroll:2,
    emberBlade:5,willowBlade:4,mistSaber:3,stoneAxe:3,dawnEdge:2,
    barkShield:4,leatherShield:4,mossShield:4,clearShield:3,emberShield:3,everShield:2,
    mightRing:2,antidoteRing:2,wakeRing:2,fastingRing:2,safeRing:2,driftRing:2,
    reedArrow:5,ironArrow:3,pierceArrow:2
  };
  if(kind==='tutorial'){
    Object.assign(common,{
      nutBread:24,bigBread:8,spoiledBread:0,moonHerb:20,starHerb:10,powerMendHerb:7,flameHerb:7,
      thunderStaff:7,slowStaff:6,sleepStaff:6,emberBlade:2,willowBlade:2,
      barkShield:2,leatherShield:2,mossShield:2,
      mightRing:1,antidoteRing:1,wakeRing:1,fastingRing:1,safeRing:1,driftRing:0
    });
  }
  if(kind==='normal'){
    common.mightRing=1;common.antidoteRing=1;common.wakeRing=1;common.fastingRing=1;common.safeRing=1;common.driftRing=1;
  }
  return common;
}
var modes={
  tutorialDungeon:{id:'tutorialDungeon',name:'ちょっと不思議な悠久の迷宮',shortName:'ちょっと不思議',maxFloor:10,difficultyName:'弱',difficulty:.7,enemyHpMultiplier:.85,enemyPowerMultiplier:.75,enemyDefenseMultiplier:.9,itemSpawnMultiplier:1.15,naturalSpawnMultiplier:1.15,enemyTable:'tutorial',finalEvent:'returnTreasure',bgm:'floorTheme',clearCondition:'treasureReturn',returnTreasureFloor:10,identify:['all'],curseKnown:'all',staffChargesKnown:false,curseRate:0,itemSpawnTable:table('tutorial')},
  normalDungeon:{id:'normalDungeon',name:'不思議な悠久の迷宮',shortName:'不思議',maxFloor:99,difficultyName:'中',difficulty:1,enemyHpMultiplier:1,enemyPowerMultiplier:1,enemyDefenseMultiplier:1,itemSpawnMultiplier:1,naturalSpawnMultiplier:1,enemyTable:'normal',finalEvent:'storyTreasure27',bgm:'floorTheme',clearCondition:'treasureReturn',returnTreasureFloor:27,identify:['all'],curseKnown:'nonEquipment',staffChargesKnown:false,curseRate:.05,itemSpawnTable:table('normal')},
  mysteryDungeon:{id:'mysteryDungeon',name:'もっと不思議な迷宮',shortName:'もっと不思議',maxFloor:99,difficultyName:'強',difficulty:1.2,enemyHpMultiplier:1.12,enemyPowerMultiplier:1.08,enemyDefenseMultiplier:1.08,itemSpawnMultiplier:.9,naturalSpawnMultiplier:.85,enemyTable:'mystery',finalEvent:'deepTreasure27',bgm:'floorTheme',clearCondition:'treasureReturn',returnTreasureFloor:27,identify:['food','weapon','shield','arrow'],curseKnown:'nonEquipment',staffChargesKnown:false,curseRate:.12,itemSpawnTable:table('mystery')}
};
K.Dungeons={modes:Object.freeze(modes),get:function(id){return modes[id]||modes[K.Config.defaultDungeon];},isIdentified:function(m,c){return m.identify.indexOf('all')>=0||m.identify.indexOf(c)>=0;},isCurseKnown:function(m,c){return m.curseKnown==='all'||['weapon','shield','ring'].indexOf(c)<0;}};
})(window.Kiri=window.Kiri||{});
