(function(K){
  'use strict';
  var KEY='eternal-labyrinth-se-v1',LEGACY_KEYS=['kiriakari-se-v1'],SE_BASE='BGM/SE/',context=null,enabled=true,volume=.45,unlocked=false,lastPlayed={},history=[];
  var patterns={
    playerAttack:[[190,.045,'square',0],[115,.07,'sawtooth',.035]],enemyAttack:[[135,.06,'square',0],[85,.09,'sawtooth',.04]],playerDamage:[[90,.13,'sawtooth',0]],enemyDamage:[[260,.055,'square',0]],throwItem:[[340,.04,'sine',0],[210,.07,'triangle',.045]],wand:[[440,.08,'sine',0],[660,.12,'sine',.06]],arrow:[[720,.035,'triangle',0],[320,.055,'triangle',.025]],menuOpen:[[420,.045,'sine',0],[560,.05,'sine',.04]],menuSelect:[[610,.035,'sine',0]],menuCancel:[[300,.05,'triangle',0],[220,.06,'triangle',.035]],itemUse:[[520,.06,'sine',0],[780,.08,'sine',.05]],stairs:[[360,.07,'triangle',0],[270,.08,'triangle',.06],[180,.12,'triangle',.12]],trap:[[105,.15,'square',0]],trapDamage:[[140,.055,'square',0],[90,.09,'sawtooth',.045]],trapPoison:[[220,.08,'sine',0],[155,.12,'triangle',.055]],trapSleep:[[520,.13,'sine',0],[390,.18,'sine',.08],[260,.22,'sine',.16]],trapConfuse:[[330,.06,'triangle',0],[520,.06,'triangle',.07],[260,.09,'triangle',.14]],trapWarp:[[620,.055,'sine',0],[880,.08,'sine',.06],[420,.12,'triangle',.12]],trapPit:[[190,.08,'triangle',0],[135,.1,'triangle',.07],[80,.16,'sawtooth',.16]],trapWeaken:[[260,.06,'sawtooth',0],[180,.11,'square',.07]],trapHunger:[[170,.08,'triangle',0],[120,.13,'triangle',.09]],trapDrop:[[460,.045,'triangle',0],[300,.08,'triangle',.06]],levelUp:[],gameOver:[]
  };
  var files={
    throwItem:'物を投げる時の音.mp3',
    warp:'ワープ.mp3',
    arrow:'弓を射る音.mp3',
    swordAttack:'剣で斬る.mp3',
    swordMiss:'剣の空振り.mp3',
    playerDamage:'自分や敵にダメージを与えた音.mp3',
    enemyDamage:'自分や敵にダメージを与えた音.mp3',
    unarmedAttack:'素手で殴る.mp3',
    enemyAttack:'素手で殴る.mp3',
    equip:'装備する音.mp3',
    unarmedMiss:'パンチの素振り.mp3',
    menuCancel:'キャンセルする音.mp3',
    menuOpen:'メニューを開く音.mp3',
    menuSelect:'決定した音.mp3',
    itemUse:'決定した音.mp3',
    stairs:'階段を上り下りする音.mp3',
    enemySpecial:'敵の特殊攻撃1.mp3',
    herbHpUp:'草でHPが上昇.mp3',
    herbHeal:'草で回復.mp3',
    powerRecover:'ちからが回復.mp3',
    poison:'毒を受ける.mp3',
    trapPoison:'毒を受ける.mp3',
    trapPit:'罠で下の階に落ちる.mp3'
  };
  function AudioCtor(){return window.AudioContext||window.webkitAudioContext||null;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled:enabled,volume:volume}));}catch(e){}}
  function load(){try{var raw=localStorage.getItem(KEY),legacy=false;for(var i=0;!raw&&i<LEGACY_KEYS.length;i++){raw=localStorage.getItem(LEGACY_KEYS[i]);legacy=!!raw;}var d=JSON.parse(raw);if(d){enabled=true;volume=Math.max(0,Math.min(1,Number(d.volume)));if(!Number.isFinite(volume))volume=.45;if(legacy)save();}}catch(e){}}
  function controls(){if(typeof document==='undefined')return;var b=document.querySelector('[data-se-toggle]'),r=document.querySelector('[data-se-volume]');if(b){b.textContent=enabled?'SE ON':'SE OFF';b.setAttribute('aria-pressed',String(enabled));}if(r)r.value=String(Math.round(volume*100));}
  function tone(spec){var o=context.createOscillator(),g=context.createGain(),start=context.currentTime+spec[3];o.type=spec[2];o.frequency.setValueAtTime(spec[0],start);g.gain.setValueAtTime(Math.max(.0001,volume*.16),start);g.gain.exponentialRampToValueAtTime(.0001,start+spec[1]);o.connect(g);g.connect(context.destination);o.start(start);o.stop(start+spec[1]+.01);}
  function playFile(name){
    if(typeof Audio==='undefined'||!files[name])return false;
    try{
      var audio=new Audio(SE_BASE+files[name]);
      audio.volume=volume;
      var promise=audio.play();
      if(promise&&promise.catch)promise.catch(function(){});
      return true;
    }catch(e){return false;}
  }
  K.Sound={patterns:patterns,files:files,base:SE_BASE,init:function(){load();controls();var b=document.querySelector('[data-se-toggle]'),r=document.querySelector('[data-se-volume]');if(b)b.addEventListener('click',function(){K.Sound.toggle();});if(r)r.addEventListener('input',function(e){K.Sound.setVolume(Number(e.target.value)/100);});document.addEventListener('pointerdown',function(){K.Sound.unlock();},{once:true});document.addEventListener('keydown',function(){K.Sound.unlock();},{once:true});},unlock:function(){try{var C=AudioCtor();if(C&&!context)context=new C();unlocked=true;if(context&&context.state==='suspended'){var p=context.resume();if(p&&p.catch)p.catch(function(){});}return true;}catch(e){context=null;unlocked=false;return false;}},play:function(name,variant){history.push(name);if(history.length>100)history.shift();var effective=variant||name,now=Date.now();if(lastPlayed[effective]&&now-lastPlayed[effective]<18)return false;lastPlayed[effective]=now;if(!enabled||!unlocked)return false;if(playFile(effective))return true;if(!context||!patterns[effective])return false;try{patterns[effective].forEach(tone);return true;}catch(e){return false;}},toggle:function(){enabled=!enabled;save();controls();return enabled;},setVolume:function(value){volume=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(volume))volume=.45;save();controls();return volume;},settings:function(){return{enabled:enabled,volume:volume,unlocked:unlocked};},events:function(){return history.slice();},clearEvents:function(){history.length=0;},_setContext:function(fake){context=fake;unlocked=!!fake;}};
  addEventListener('DOMContentLoaded',function(){K.Sound.init();});
})(window.Kiri=window.Kiri||{});
