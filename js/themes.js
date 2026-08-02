(function(K){
  'use strict';
  function visual(wallStyle,roomFloorStyle,corridorStyle,decorationStyle,p){
    return {
      wallStyle:wallStyle,
      roomFloorStyle:roomFloorStyle,
      corridorStyle:corridorStyle,
      decorationStyle:decorationStyle,
      wall:p.wall,wallDark:p.wallDark,wallLight:p.wallLight,
      carpet:p.floor,carpetDark:p.floorDark,carpetEdge:p.edge,carpetEdgeDark:p.edgeDark,
      stone:p.corridor,stoneDark:p.corridorDark,stoneLight:p.corridorLight,
      accent:p.accent||p.edge,accent2:p.accent2||p.corridorLight
    };
  }
  var themes=[
    {id:'forgottenCastle',from:1,to:2,name:'忘れられた王城',bgmThemeName:'王城の入口',floor:'#6f1f2b',corridor:'#5f6367',wall:'#34383d',grid:'#8e3140',visual:visual('castleStone','carpet','grayStone','torchPillar',{wall:'#34383d',wallDark:'#24282d',wallLight:'#62686f',floor:'#6f1f2b',floorDark:'#4c1821',edge:'#c28b48',edgeDark:'#7a4d2e',corridor:'#5f6367',corridorDark:'#464b50',corridorLight:'#7b8188',accent:'#f1a946'})},
    {id:'castleBasement',from:3,to:4,name:'王城地下区画',bgmThemeName:'石灯りの歩み',floor:'#33341d',corridor:'#565847',wall:'#2d321e',grid:'#56583b',visual:visual('mossBrick','tile','grayStone','oldTorch',{wall:'#2d321e',wallDark:'#1d2114',wallLight:'#4b5131',floor:'#33341d',floorDark:'#242615',edge:'#6f6b35',edgeDark:'#46411f',corridor:'#565847',corridorDark:'#424436',corridorLight:'#73765e',accent:'#b78a35'})},
    {id:'whiteTemple',from:5,to:6,name:'白亜の神殿',bgmThemeName:'木霊の小径',floor:'#aaa58f',corridor:'#c4c0a8',wall:'#696858',grid:'#bfb89d',visual:visual('marble','whiteTile','whiteStone','pillar',{wall:'#696858',wallDark:'#4e4d42',wallLight:'#928f7b',floor:'#aaa58f',floorDark:'#85816e',edge:'#d8cfaa',edgeDark:'#958c73',corridor:'#c4c0a8',corridorDark:'#a39f8b',corridorLight:'#ddd8be',accent:'#f0e6bd'})},
    {id:'waterdropCave',from:7,to:9,name:'水滴の洞窟',bgmThemeName:'軋む静寂',floor:'#263947',corridor:'#4f7f8d',wall:'#1b2d38',grid:'#3f6572',visual:visual('wetRock','wetFloor','waterStone','droplet',{wall:'#1b2d38',wallDark:'#101c24',wallLight:'#355466',floor:'#263947',floorDark:'#1b2a35',edge:'#447586',edgeDark:'#2a4d59',corridor:'#4f7f8d',corridorDark:'#3c6470',corridorLight:'#72a5b3',accent:'#93d8e7'})},
    {id:'oldMonument',from:10,to:12,name:'古碑の遺跡',bgmThemeName:'翠滴の洞',floor:'#51432f',corridor:'#766a50',wall:'#3a2f22',grid:'#675640',visual:visual('largeStone','sandTile','sandStone','glyph',{wall:'#3a2f22',wallDark:'#251e16',wallLight:'#67533b',floor:'#51432f',floorDark:'#392f23',edge:'#8b7652',edgeDark:'#5a492f',corridor:'#766a50',corridorDark:'#5d523e',corridorLight:'#95896d',accent:'#b99b66'})},
    {id:'eclipseGarden',from:13,to:15,name:'月蝕の地下庭園',bgmThemeName:'土壁の息吹',floor:'#2f3c1d',corridor:'#6a6745',wall:'#243017',grid:'#4e6730',visual:visual('vineStone','garden','earthPath','flowerVine',{wall:'#243017',wallDark:'#151d0d',wallLight:'#465c2a',floor:'#2f3c1d',floorDark:'#202b14',edge:'#60793b',edgeDark:'#3c4c25',corridor:'#6a6745',corridorDark:'#504d34',corridorLight:'#8a875f',accent:'#b66aa4',accent2:'#7fc97a'})},
    {id:'snowIceCorridor',from:16,to:18,name:'雪奏の氷回廊',bgmThemeName:'岩脈の鼓動',floor:'#315969',corridor:'#76a7b6',wall:'#224753',grid:'#56889a',visual:visual('iceWall','iceFloor','icePath','icicle',{wall:'#224753',wallDark:'#17333c',wallLight:'#5f91a1',floor:'#315969',floorDark:'#244653',edge:'#74a9ba',edgeDark:'#477483',corridor:'#76a7b6',corridorDark:'#5d8b99',corridorLight:'#a0cfdb',accent:'#d8f8ff'})},
    {id:'forgottenCathedral',from:19,to:21,name:'忘却の大聖堂',bgmThemeName:'失われた線刻',floor:'#5b5343',corridor:'#938a74',wall:'#332f27',grid:'#736a58',visual:visual('cathedralStone','mosaic','whiteStone','stainedGlass',{wall:'#332f27',wallDark:'#211f1a',wallLight:'#5d5649',floor:'#5b5343',floorDark:'#413b31',edge:'#8f8264',edgeDark:'#5f563f',corridor:'#938a74',corridorDark:'#756d5b',corridorLight:'#b8ad92',accent:'#d0984b',accent2:'#6db4d8'})},
    {id:'snowyLake',from:22,to:24,name:'雪舞う地下湖',bgmThemeName:'氷湖の結晶',floor:'#254f60',corridor:'#67a6bb',wall:'#1d3946',grid:'#477488',visual:visual('lakeWall','blueRock','icePath','crystal',{wall:'#1d3946',wallDark:'#132832',wallLight:'#426d80',floor:'#254f60',floorDark:'#1b3a47',edge:'#4e879c',edgeDark:'#315f72',corridor:'#67a6bb',corridorDark:'#4e879a',corridorLight:'#91d0df',accent:'#b9f3ff'})},
    {id:'moonMachina',from:25,to:26,name:'月渡りの機巧都市',bgmThemeName:'熾火の脈動',floor:'#4d3514',corridor:'#9a7935',wall:'#2b2417',grid:'#7b5b23',visual:visual('metalWall','metalPlate','goldPlate','gear',{wall:'#2b2417',wallDark:'#1a160e',wallLight:'#5e4b26',floor:'#4d3514',floorDark:'#37250e',edge:'#9c741e',edgeDark:'#684914',corridor:'#9a7935',corridorDark:'#765d2a',corridorLight:'#c19b49',accent:'#f0b74a'})},
    {id:'eternalDeep',from:27,to:999,name:'悠久の深界',bgmThemeName:'深層の灯',floor:'#3f2451',corridor:'#76509a',wall:'#211228',grid:'#5e3774',visual:visual('abyssWall','violetCrystal','violetPath','crystal',{wall:'#211228',wallDark:'#130a18',wallLight:'#5a2f68',floor:'#3f2451',floorDark:'#2b1838',edge:'#7f4da0',edgeDark:'#542e6d',corridor:'#76509a',corridorDark:'#5b3b78',corridorLight:'#9d72c5',accent:'#d366ff',accent2:'#7fd4ff'})}
  ];
  K.Themes={list:Object.freeze(themes),forFloor:function(floor){for(var i=0;i<themes.length;i++)if(floor<=themes[i].to)return themes[i];return themes[themes.length-1];}};
})(window.Kiri=window.Kiri||{});
