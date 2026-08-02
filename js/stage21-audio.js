(function(K){
  'use strict';
  var FANFARE_FILE='BGM/レベルアップ.mp3',audio=null,active=false,resumeField=false,DURATION=2.15;
  function fieldAudio(){return typeof document!=='undefined'?document.querySelector('#bgmAudio'):null;}
  function cleanup(){
    if(!audio)return;
    audio.onended=null;
    audio.onerror=null;
    try{audio.pause();}catch(e){}
    audio.currentTime=0;
  }
  function finish(){
    cleanup();
    active=false;
    var field=fieldAudio(),settings=K.Audio&&K.Audio.settings();
    if(field&&resumeField&&settings&&settings.enabled){
      var promise=field.play();
      if(promise&&promise.catch)promise.catch(function(){});
    }
    resumeField=false;
  }
  function createAudio(){
    if(audio)return audio;
    if(typeof Audio==='undefined')return null;
    audio=new Audio(FANFARE_FILE);
    audio.preload='auto';
    return audio;
  }
  function play(){
    var settings=K.Audio&&K.Audio.settings();
    if(active||!settings||!settings.enabled)return false;
    var fanfare=createAudio();
    if(!fanfare)return false;
    var field=fieldAudio();
    resumeField=!!field&&!field.paused;
    if(field)field.pause();
    active=true;
    fanfare.volume=Math.max(0,Math.min(1,settings.volume));
    fanfare.currentTime=0;
    fanfare.onended=finish;
    fanfare.onerror=finish;
    try{
      var promise=fanfare.play();
      if(promise&&promise.catch)promise.catch(function(){finish();});
      return true;
    }catch(e){
      finish();
      return false;
    }
  }
  K.Fanfare={play:play,finish:finish,cancel:function(){resumeField=false;finish();},isActive:function(){return active;},duration:DURATION,file:FANFARE_FILE,_setAudio:function(fake){audio=fake;}};
})(window.Kiri=window.Kiri||{});
