(function(K){
  'use strict';
  // TODO: 将来候補: 投げ物を跳ね返す敵 / 罠を設置する敵 / パンを腐らせる敵 / 矢を拾って撃つ敵 / アイテムを使う敵 / 倒すと爆発する敵 / 階段へ逃げる敵
  var legacyNames={
    dewMote:['露ころび'],driftMoth:['ゆら羽'],dozeBud:['まどろみ蕾'],stoneBeak:['石くちばし'],
    bileToad:['濁り蛙'],dreamWisp:['夢わたげ'],needleWing:['針つばさ'],mudBrute:['泥かぶと'],
    reedSniper:['葦弾き'],pocketImp:['袋さらい'],shyShell:['逃げ甲羅'],spiralEye:['渦まなこ'],
    rustMaw:['錆あぎと'],hungerShade:['飢え影'],mirrorSeed:['鏡ふたば'],riftFox:['裂け尾'],
    wallWraith:['壁すべり'],oakGiant:['古樹の巨躯'],emberHorn:['熾角獣'],staffAdept:['杖つむぎ'],
    roomWatcher:['遠見の灯眼'],frostCrown:['氷冠の獣'],voidKnight:['虚ろ鎧'],manyCore:['群生核'],
    abyssOracle:['深淵の詠み手']
  };
  var roleLabels={
    basic:'通常型',wander:'ふらふら型',sleeper:'睡眠配置型',fast:'倍速型',ranged:'遠距離型',
    status:'状態異常型',thief:'盗み型',coward:'逃走型',splitter:'分裂型',tank:'高耐久型',
    trick:'変則型',phase:'壁抜け型',lateBoss:'深層強敵'
  };
  var list=[
    {id:'dewMote',name:'まるスライム',role:'basic',floorRange:[1,3],hp:6,attack:2,defense:0,exp:2,behaviorType:'chaser',specialAbility:'none',spawnWeight:34,maxPerFloor:8,dropRate:.08,dropCategories:['random'],color:'#78a86f',iconShape:'circle',description:'ゆっくり近づいて攻撃する、迷宮で最も弱いぷるぷるした敵。',tier:1,tutorial:true},
    {id:'driftMoth',name:'まよい蛾',role:'wander',floorRange:[1,5],hp:7,attack:3,defense:0,exp:3,behaviorType:'wander',specialAbility:'none',spawnWeight:24,maxPerFloor:7,dropRate:.12,dropCategories:['arrow','herb'],color:'#9b77ad',iconShape:'wing',description:'ふらふら動く。近づくと追ってくるので、向きを合わせて戦おう。',tier:1,tutorial:true},
    {id:'dozeBud',name:'ねむりつぼみ',role:'sleeper',floorRange:[3,6],hp:11,attack:4,defense:1,exp:7,behaviorType:'sleeper',specialAbility:'none',spawnWeight:18,maxPerFloor:5,spawnSleepChance:.88,dropRate:.32,dropCategories:['herb'],color:'#8f718f',iconShape:'flower',description:'眠って置かれていることが多い。起きたターンは動かない。',tier:1,tutorial:true},
    {id:'stoneBeak',name:'いしつつき',role:'basic',floorRange:[3,8],hp:15,attack:6,defense:1,exp:8,behaviorType:'chaser',specialAbility:'none',spawnWeight:20,maxPerFloor:7,dropRate:.12,dropCategories:['arrow','food'],color:'#9d8468',iconShape:'triangle',description:'特殊能力はないが一撃が重い。正面から受ける回数に注意。',tier:1,tutorial:true},
    {id:'bileToad',name:'どくガエル',role:'status',floorRange:[5,10],hp:17,attack:6,defense:1,exp:12,behaviorType:'chaser',specialAbility:'poisonTouch',poisonChance:.28,statusDuration:12,spawnWeight:15,maxPerFloor:5,dropRate:.28,dropCategories:['herb'],color:'#668c55',iconShape:'poison',description:'攻撃時に毒を受けることがある。毒よけがあると安心。',tier:2,tutorial:true},
    {id:'dreamWisp',name:'ねむりわたげ',role:'status',floorRange:[6,11],hp:15,attack:5,defense:1,exp:14,behaviorType:'sleeper',specialAbility:'sleepTouch',sleepChance:.24,statusDuration:4,spawnWeight:12,maxPerFloor:4,spawnSleepChance:.55,dropRate:.12,dropCategories:['scroll'],color:'#b49ac7',iconShape:'ghost',description:'触れると眠らされることがある。囲まれる前に倒したい。',tier:2,tutorial:true},
    {id:'needleWing',name:'はやてバチ',role:'fast',floorRange:[7,13],hp:18,attack:5,defense:1,exp:20,behaviorType:'fast',specialAbility:'none',spawnWeight:10,maxPerFloor:4,dropRate:.35,dropCategories:['arrow'],color:'#b09068',iconShape:'wing',description:'すばやく2回動く。攻撃力は低めだが油断すると追いつかれる。',tier:2},
    {id:'mudBrute',name:'のろのろ兵',role:'tank',floorRange:[8,15],hp:34,attack:12,defense:4,exp:24,behaviorType:'slow',specialAbility:'none',spawnWeight:12,maxPerFloor:4,dropRate:.15,dropCategories:['gold','weapon','shield'],color:'#78614d',iconShape:'horn',description:'動きは遅いが硬くて強い。逃げる判断も大事。',tier:2},
    {id:'reedSniper',name:'矢うち草',role:'ranged',floorRange:[9,16],hp:21,attack:8,defense:1,exp:28,behaviorType:'ranged',specialAbility:'rangedShot',specialChance:.72,specialCooldown:1,specialRange:7,rangedDamage:9,spawnWeight:12,maxPerFloor:4,dropRate:.40,dropCategories:['arrow'],color:'#728f73',iconShape:'triangle',description:'直線上へ矢を撃つ。壁や他の敵のかげに入ると防ぎやすい。',tier:2},
    {id:'pocketImp',name:'ぬすっと小鬼',role:'thief',floorRange:[10,17],hp:24,attack:6,defense:2,exp:30,behaviorType:'thief',specialAbility:'steal',specialChance:.32,stealType:'item',spawnWeight:8,maxPerFloor:3,dropRate:.30,dropCategories:['food'],color:'#bd7b65',iconShape:'horn',description:'道具を盗むと逃げる。倒せば盗まれた道具を取り返せる。',tier:2},
    {id:'shyShell',name:'にげカメ',role:'coward',floorRange:[10,18],hp:28,attack:7,defense:5,exp:24,behaviorType:'coward',specialAbility:'none',spawnWeight:10,maxPerFloor:4,dropRate:.25,dropCategories:['food','shield'],color:'#6e8d91',iconShape:'diamond',description:'傷つくと逃げる。守りは硬いが攻撃は控えめ。',tier:2},
    {id:'spiralEye',name:'こんらん目玉',role:'status',floorRange:[12,20],hp:28,attack:18,defense:2,exp:38,behaviorType:'chaser',specialAbility:'confuseGaze',confuseChance:.25,specialCooldown:1,specialRange:99,statusDuration:7,spawnWeight:9,maxPerFloor:4,dropRate:.18,dropCategories:['scroll'],color:'#aa6e91',iconShape:'eye',description:'同じ部屋や射線上から、にらみで混乱させることがある。混乱・目つぶし・透明なら受けない。',tier:3},
    {id:'rustMaw',name:'さびかみ',role:'status',floorRange:[14,22],hp:34,attack:11,defense:3,exp:48,behaviorType:'chaser',specialAbility:'weakenGear',rustChance:.28,spawnWeight:8,maxPerFloor:3,dropRate:.16,dropCategories:['weapon','shield'],color:'#a45f42',iconShape:'square',description:'装備を弱くする牙を持つ。大事な装備の時は距離を取りたい。',tier:3},
    {id:'hungerShade',name:'はらへり影',role:'status',floorRange:[15,23],hp:31,attack:10,defense:2,exp:44,behaviorType:'chaser',specialAbility:'hungerDrain',specialChance:.35,hungerDamage:10,spawnWeight:8,maxPerFloor:3,dropRate:.08,dropCategories:['goodFood','scroll'],color:'#685d79',iconShape:'ghost',description:'攻撃といっしょに満腹度を下げる。パンの残りを確認しよう。',tier:3},
    {id:'mirrorSeed',name:'ふえる芽',role:'splitter',floorRange:[17,25],hp:30,attack:11,defense:2,exp:58,behaviorType:'chaser',specialAbility:'split',splitChance:.25,spawnWeight:7,maxPerFloor:4,dropRate:.38,dropCategories:['herb'],color:'#8db5ad',iconShape:'flower',description:'傷つくと分裂することがある。広い場所で増やしすぎないように。',tier:3},
    {id:'riftFox',name:'ワープぎつね',role:'trick',floorRange:[18,27],hp:36,attack:12,defense:3,exp:64,behaviorType:'coward',specialAbility:'warpHit',warpChance:.30,spawnWeight:7,maxPerFloor:3,dropRate:.24,dropCategories:['food','ring'],color:'#cf946a',iconShape:'triangle',description:'攻撃を受けるとワープして逃げることがある。倒す順番に注意。',tier:3},
    {id:'wallWraith',name:'すりぬけ影',role:'phase',floorRange:[21,30],hp:40,attack:17,defense:2,exp:90,behaviorType:'wander',specialAbility:'phase',spawnWeight:5,maxPerFloor:2,dropRate:.12,dropCategories:['scroll'],color:'#7a8499',iconShape:'ghost',description:'壁を抜けて、ふらふらしながら近づく。ただし壁の中からは攻撃できない。',tier:4},
    {id:'oakGiant',name:'大木ゴーレム',role:'tank',floorRange:[21,30],hp:68,attack:20,defense:7,exp:105,behaviorType:'slow',specialAbility:'none',spawnWeight:9,maxPerFloor:3,dropRate:.20,dropCategories:['gold','weapon','shield'],color:'#756746',iconShape:'square',description:'遅いがとても硬く強い。倒せば見返りも大きい。',tier:4},
    {id:'emberHorn',name:'火ふき獣',role:'ranged',floorRange:[23,99],hp:52,attack:22,defense:4,exp:110,behaviorType:'chaser',specialAbility:'fireBreath',specialChance:.55,specialCooldown:1,specialRange:7,rangedDamage:16,spawnWeight:7,maxPerFloor:3,dropRate:.22,dropCategories:['rare'],color:'#c95535',iconShape:'flame',description:'直線上へ炎を吐く。炎よけがあると受ける傷を減らせる。',tier:4},
    {id:'staffAdept',name:'杖つかい',role:'ranged',floorRange:[24,99],hp:44,attack:13,defense:3,exp:120,behaviorType:'ranged',specialAbility:'staffCast',specialChance:.45,specialCooldown:1,specialRange:6,statusDuration:6,spawnWeight:6,maxPerFloor:3,dropRate:.28,dropCategories:['staff','scroll'],color:'#8871b4',iconShape:'star',description:'離れた場所から眠りや混乱の術を使う。射線を切ろう。',tier:4},
    {id:'roomWatcher',name:'部屋うち目玉',role:'ranged',floorRange:[26,99],hp:48,attack:18,defense:4,exp:145,behaviorType:'ranged',specialAbility:'roomShot',specialChance:.50,specialCooldown:1,specialRange:99,rangedDamage:14,spawnWeight:5,maxPerFloor:2,dropRate:.22,dropCategories:['scroll','staff'],color:'#d2aa55',iconShape:'eye',description:'同じ部屋にいる相手へ光線を放つ。部屋から出ると安全。',tier:4},
    {id:'frostCrown',name:'ねむり氷獣',role:'fast',floorRange:[27,99],hp:58,attack:18,defense:5,exp:170,behaviorType:'fast',specialAbility:'sleepTouch',sleepChance:.22,statusDuration:4,spawnWeight:4,maxPerFloor:2,dropRate:.22,dropCategories:['rare','herb'],color:'#7ab9ce',iconShape:'ice',description:'倍速で近づき、眠りの冷気をまとっている。近づけすぎないこと。',tier:5},
    {id:'voidKnight',name:'さび鎧',role:'tank',floorRange:[28,99],hp:74,attack:24,defense:8,exp:190,behaviorType:'chaser',specialAbility:'weakenGear',rustChance:.28,spawnWeight:5,maxPerFloor:2,dropRate:.20,dropCategories:['gold','weapon','shield'],color:'#51566d',iconShape:'horn',description:'硬い鎧の敵。攻撃時に装備を弱くすることがある。',tier:5},
    {id:'manyCore',name:'ふえるコア',role:'splitter',floorRange:[31,99],hp:60,attack:20,defense:5,exp:230,behaviorType:'fast',specialAbility:'split',splitChance:.30,spawnWeight:3,maxPerFloor:3,dropRate:.30,dropCategories:['herb','rare'],color:'#b26978',iconShape:'poison',description:'倍速で動き、傷つくと分裂する危険な核。増える前に対処したい。',tier:5},
    {id:'abyssOracle',name:'深層まどうし',role:'lateBoss',floorRange:[35,99],hp:68,attack:36,defense:6,exp:320,behaviorType:'ranged',specialAbility:'staffCast',specialChance:.55,specialCooldown:1,specialRange:7,statusDuration:7,spawnWeight:3,maxPerFloor:2,dropRate:.25,dropCategories:['rare','staff','scroll'],color:'#58417d',iconShape:'star',description:'深い階で強い妨害術を使う。射線と状態異常対策が重要。',tier:5}
  ];
  var combatTags={
    driftMoth:['flying'],dozeBud:['plant'],stoneBeak:['flying'],bileToad:['beast'],dreamWisp:['plant','flying','spirit'],needleWing:['flying'],
    mudBrute:['armored'],reedSniper:['plant'],pocketImp:['beast','magic'],shyShell:['beast','shell'],spiralEye:['magic'],rustMaw:['beast'],
    hungerShade:['spirit','shadow'],mirrorSeed:['plant'],riftFox:['beast'],wallWraith:['spirit','shadow'],oakGiant:['plant','rock'],
    emberHorn:['beast','dragon'],staffAdept:['magic'],roomWatcher:['magic'],frostCrown:['ice','beast'],voidKnight:['armored','spirit'],
    manyCore:['rock','magic'],abyssOracle:['magic','spirit']
  };
  list.forEach(function(enemy){enemy.tags=Object.freeze((combatTags[enemy.id]||[]).slice());});
  var byId={};list.forEach(function(d){byId[d.id]=d;});
  function allowed(d,id,floor){
    var mode=K.Dungeons&&K.Dungeons.get?K.Dungeons.get(id):null;
    if(id==='tutorialDungeon'&&mode&&floor>mode.maxFloor)id='normalDungeon';
    if(id==='tutorialDungeon')return!!d.tutorial;
    if(id==='normalDungeon'){
      if(d.tier<=3)return true;
      if(floor>=21&&['wallWraith','oakGiant'].indexOf(d.id)>=0)return true;
      if(floor>=24&&d.id==='emberHorn')return true;
      if(floor>=26&&d.id==='staffAdept')return true;
      if(floor>=28&&d.id==='roomWatcher')return true;
      return false;
    }
    return true;
  }
  function countOnFloor(state,id){return (state.enemies||[]).filter(function(e){return(e.definitionId||e.id)===id;}).length;}
  function canSpawnMore(state,d){return !state||!d.maxPerFloor||countOnFloor(state,d.id)<d.maxPerFloor;}
  function weightedPick(pool){var total=pool.reduce(function(n,d){return n+(d.spawnWeight||1);},0),r=K.Util.rand(Math.max(1,total));for(var i=0;i<pool.length;i++){r-=pool[i].spawnWeight||1;if(r<0)return pool[i];}return pool[0];}
  K.EnemyCatalog={
    list:Object.freeze(list),byId:byId,roles:roleLabels,
    tableFor:function(id,floor){
      var mode=K.Dungeons&&K.Dungeons.get?K.Dungeons.get(id):null;
      if(id==='tutorialDungeon'&&mode&&floor>mode.maxFloor)id='normalDungeon';
      var pool=list.filter(function(d){return allowed(d,id,floor)&&floor>=d.floorRange[0]&&floor<=d.floorRange[1];});
      if(!pool.length)pool=list.filter(function(d){return allowed(d,id,floor)&&d.floorRange[0]<=floor;}).slice(-6);
      return pool;
    },
    pick:function(id,floor){return weightedPick(this.tableFor(id,floor));},
    pickForState:function(state){
      var pool=this.tableFor(state.dungeonId,state.floor).filter(function(d){return canSpawnMore(state,d);});
      return weightedPick(pool.length?pool:this.tableFor(state.dungeonId,state.floor));
    },
    get:function(id){return byId[id]||byId.dewMote;},
    canSpawnMore:canSpawnMore,
    normalize:function(e){
      var d=this.get(e.definitionId||e.id);
      e.definitionId=d.id;
      if(!e.name||(legacyNames[d.id]||[]).indexOf(e.name)>=0)e.name=d.name;
      ['role','defense','behaviorType','specialAbility','color','iconShape','description','spawnWeight','maxPerFloor','tags',
       'specialChance','specialCooldown','specialRange','statusDuration','rangedDamage','hungerDamage','stealType',
       'splitChance','warpChance','rustChance','sleepChance','confuseChance','poisonChance','spawnSleepChance'
      ].forEach(function(k){if(e[k]===undefined&&d[k]!==undefined)e[k]=d[k];});
      e.dropRate=e.dropRate===undefined?d.dropRate:e.dropRate;
      e.dropCategories=e.dropCategories||d.dropCategories.slice();
      e.exp=e.exp===undefined?d.exp:e.exp;
      return e;
    }
  };
})(window.Kiri=window.Kiri||{});
