(function(K){
  'use strict';

  var KEY='eternal-labyrinth-audio-v1',
      LEGACY_KEYS=['kiriakari-audio-v1'],
      BGM_BASE='BGM/',
      TITLE_FILE='悠久の迷宮（ゲームタイトル曲）.mp3',
      audio=null,
      enabled=true,
      volume=.35,
      unlocked=false,
      currentFile='',
      requestedFloor=1;

  var tracks=[
    {to:2,file:'1_心淵の扉_1F~2F.mp3'},
    {to:4,file:'2_ソラリスの雨_3F～4F.mp3'},
    {to:6,file:'3_夕暮れピエロ_5F～6F.mp3'},
    {to:9,file:'4_水滴の踊り_7F～9F.mp3'},
    {to:12,file:'5_古の碑石_10F～12F.mp3'},
    {to:15,file:'6_月蝕のミラージュ_13F～15F.mp3'},
    {to:18,file:'7_闇に舞う雪_16F～18F.mp3'},
    {to:21,file:'8_クリスマスのオルガン_19F～21F.mp3'},
    {to:24,file:'9_雪の舞う浜辺_22F～24F.mp3'},
    {to:26,file:'10_月を飛び立つアポロ_25F～26F.mp3'},
    {to:999,file:'11_四声のミサ_27F～.mp3'}
  ];

  var specialTracks={
    monsterHouse:'モンスターハウス（竜騎兵）.mp3'
  };

  function fileFor(floor){
    for(var i=0;i<tracks.length;i++)if(floor<=tracks[i].to)return tracks[i].file;
    return '';
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({enabled:enabled,volume:volume}));}catch(e){}
  }
  function updateControls(){
    var b=document.querySelector('[data-bgm-toggle]'),r=document.querySelector('[data-bgm-volume]');
    if(b){b.textContent=enabled?'BGM ON':'BGM OFF';b.setAttribute('aria-pressed',String(enabled));}
    if(r)r.value=String(Math.round(volume*100));
  }
  function play(){
    if(!audio||!enabled||!unlocked||!currentFile)return;
    if(audio.paused){
      var promise=audio.play();
      if(promise&&promise.catch)promise.catch(function(){});
    }
  }
  function loadSettings(){
    try{
      var raw=localStorage.getItem(KEY),legacy=false;
      for(var i=0;!raw&&i<LEGACY_KEYS.length;i++){raw=localStorage.getItem(LEGACY_KEYS[i]);legacy=!!raw;}
      var data=JSON.parse(raw);
      if(data){
        if(typeof data.enabled==='boolean')enabled=data.enabled;
        volume=Math.max(0,Math.min(1,Number(data.volume)));
        if(!Number.isFinite(volume)||volume<.05)volume=.35;
        save();
      }
    }catch(e){}
  }
  function setFile(file){
    if(!audio||file===currentFile){play();return false;}
    currentFile=file;
    if(!file){audio.pause();audio.removeAttribute('src');return false;}
    audio.src=BGM_BASE+file;
    audio.load();
    play();
    return true;
  }

  K.Audio={
    tracks:tracks,
    specialTracks:specialTracks,
    init:function(){
      audio=document.querySelector('#bgmAudio');
      loadSettings();
      audio.volume=volume;
      audio.loop=true;
      audio.addEventListener('error',function(){audio.pause();});
      document.querySelector('[data-bgm-toggle]').addEventListener('click',function(){
        enabled=!enabled;
        if(enabled)play();else audio.pause();
        save();
        updateControls();
      });
      document.querySelector('[data-bgm-volume]').addEventListener('input',function(e){
        volume=Number(e.target.value)/100;
        audio.volume=volume;
        save();
      });
      updateControls();
      this.setTheme(requestedFloor);
    },
    unlock:function(){unlocked=true;play();return true;},
    setTheme:function(floor){requestedFloor=floor;return setFile(fileFor(floor));},
    setTitle:function(){return setFile(TITLE_FILE);},
    setSpecial:function(name){return setFile(specialTracks[name]||'');},
    setForState:function(state){if(state&&state.monsterHouse&&state.monsterHouse.bgmActive)return this.setSpecial('monsterHouse');return this.setTheme(state?state.floor:requestedFloor);},
    toggle:function(){var b=document.querySelector('[data-bgm-toggle]');if(b)b.click();},
    settings:function(){return{enabled:enabled,volume:volume,currentFile:currentFile,unlocked:unlocked,base:BGM_BASE};},
    fileForFloor:fileFor,
    fileForTitle:function(){return TITLE_FILE;},
    fileForSpecial:function(name){return specialTracks[name]||'';}
  };

  addEventListener('DOMContentLoaded',function(){K.Audio.init();});
})(window.Kiri=window.Kiri||{});
