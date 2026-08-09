(function(K){
  'use strict';
  var KEY='eternal-labyrinth-se-v1',LEGACY_KEYS=['kiriakari-se-v1'],SE_BASE='BGM/SE/',context=null,enabled=true,volume=.45,unlocked=false,lastPlayed={},history=[],filePools={},poolIndex={},buffers={},fileLoads={},timings=[],pendingInput=null,debugTiming=false;
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
  function clock(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled:enabled,volume:volume}));}catch(e){}}
  function load(){try{var raw=localStorage.getItem(KEY),legacy=false;for(var i=0;!raw&&i<LEGACY_KEYS.length;i++){raw=localStorage.getItem(LEGACY_KEYS[i]);legacy=!!raw;}var d=JSON.parse(raw);if(d){enabled=true;volume=Math.max(0,Math.min(1,Number(d.volume)));if(!Number.isFinite(volume)||volume<.05)volume=.45;save();}}catch(e){}}
  function controls(){if(typeof document==='undefined')return;var b=document.querySelector('[data-se-toggle]'),r=document.querySelector('[data-se-volume]');if(b){b.textContent=enabled?'SE ON':'SE OFF';b.setAttribute('aria-pressed',String(enabled));}if(r)r.value=String(Math.round(volume*100));}
  function tone(spec){var o=context.createOscillator(),g=context.createGain(),start=context.currentTime+spec[3];o.type=spec[2];o.frequency.setValueAtTime(spec[0],start);g.gain.setValueAtTime(Math.max(.0001,volume*.16),start);g.gain.exponentialRampToValueAtTime(.0001,start+spec[1]);o.connect(g);g.connect(context.destination);o.start(start);o.stop(start+spec[1]+.01);}
  function makeFileAudio(name){
    if(typeof Audio==='undefined'||!files[name])return null;
    try{
      var audio=new Audio(SE_BASE+files[name]);
      audio.preload='auto';
      if(audio.load)audio.load();
      return audio;
    }catch(e){return null;}
  }
  function preloadFile(name){
    if(!files[name]||filePools[name])return;
    filePools[name]=[];
    for(var i=0;i<3;i++){var audio=makeFileAudio(name);if(audio)filePools[name].push(audio);}
  }
  function preloadCommon(){['menuSelect','menuCancel','stairs','swordAttack','swordMiss','unarmedAttack','unarmedMiss','playerDamage','enemyDamage','arrow','throwItem'].forEach(preloadFile);}
  function decoded(buffer){return buffer&&typeof buffer==='object';}
  function decodeData(data){return new Promise(function(resolve,reject){var settled=false,ok=function(value){if(!settled){settled=true;resolve(value);}},bad=function(error){if(!settled){settled=true;reject(error);}};try{var result=context.decodeAudioData(data,ok,bad);if(result&&result.then)result.then(ok,bad);}catch(e){bad(e);}});}
  function loadBuffer(name){
    var file=files[name];if(!context||!context.decodeAudioData||typeof fetch==='undefined'||!file)return Promise.resolve(null);
    if(decoded(buffers[name]))return Promise.resolve(buffers[name]);
    if(!fileLoads[file])fileLoads[file]=fetch(SE_BASE+file).then(function(response){if(!response.ok)throw new Error('SE '+response.status);return response.arrayBuffer();}).then(decodeData).catch(function(){return null;});
    return fileLoads[file].then(function(buffer){if(buffer)Object.keys(files).forEach(function(key){if(files[key]===file)buffers[key]=buffer;});return buffer;});
  }
  function decodeCommon(){['swordAttack','unarmedAttack','enemyAttack','playerDamage','enemyDamage','menuSelect','menuCancel','stairs','arrow','throwItem','itemUse','equip','warp','enemySpecial','herbHpUp','herbHeal','powerRecover','poison','trapPoison','trapPit'].forEach(function(name){loadBuffer(name);});}
  function finishTrace(trace,started,backend){if(!trace)return;trace.started=started;trace.backend=backend;timings.push(trace);if(timings.length>60)timings.shift();if(debugTiming&&typeof console!=='undefined')console.debug('[SE DEBUG]',trace.name,'input:',trace.input==null?'-':trace.input.toFixed(1)+'ms','playSE:',trace.called.toFixed(1)+'ms','start:',trace.started.toFixed(1)+'ms','backend:',backend);}
  function playBuffer(name,trace){
    if(!context||context.state==='suspended'||!decoded(buffers[name])||!context.createBufferSource||!context.createGain)return false;
    try{var source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[name];gain.gain.value=volume;source.connect(gain);gain.connect(context.destination);source.start(0);finishTrace(trace,clock(),'webaudio');return true;}catch(e){return false;}
  }
  function playFile(name,trace){
    if(typeof Audio==='undefined'||!files[name])return false;
    preloadFile(name);
    var pool=filePools[name]||[];if(!pool.length)return false;
    try{
      var index=poolIndex[name]||0,audio=pool[index%pool.length];poolIndex[name]=(index+1)%pool.length;
      audio.volume=volume;
      try{audio.currentTime=0;}catch(ignore){}
      if(trace&&audio.addEventListener)audio.addEventListener('playing',function(){finishTrace(trace,clock(),'htmlaudio');},{once:true});
      var promise=audio.play();
      if(promise&&promise.catch)promise.catch(function(){});
      return true;
    }catch(e){return false;}
  }
  K.Sound={patterns:patterns,files:files,base:SE_BASE,init:function(){load();controls();preloadCommon();var b=document.querySelector('[data-se-toggle]'),r=document.querySelector('[data-se-volume]');if(b)b.addEventListener('click',function(){K.Sound.toggle();});if(r)r.addEventListener('input',function(e){K.Sound.setVolume(Number(e.target.value)/100);});['pointerdown','keydown'].forEach(function(type){document.addEventListener(type,function(){K.Sound.unlock();},{once:true,passive:true,capture:true});});},unlock:function(){try{var C=AudioCtor();if(C&&!context)context=new C({latencyHint:'interactive'});unlocked=true;if(context&&context.state==='suspended'){var p=context.resume();if(p&&p.then)p.then(decodeCommon).catch(function(){});else decodeCommon();}else decodeCommon();return true;}catch(e){context=null;unlocked=false;return false;}},markInput:function(kind){pendingInput={kind:kind,at:clock()};},play:function(name,variant){history.push(name);if(history.length>100)history.shift();var effective=variant||name,called=clock(),input=name==='playerAttack'&&pendingInput&&pendingInput.kind==='attack'?pendingInput.at:null,trace={name:name,effective:effective,input:input,called:called,started:null,backend:''};if(input!=null)pendingInput=null;var now=Date.now();if(lastPlayed[effective]&&now-lastPlayed[effective]<18)return false;lastPlayed[effective]=now;if(!enabled||!unlocked)return false;if(playBuffer(effective,trace))return true;loadBuffer(effective);if(playFile(effective,trace))return true;if(!context||!patterns[effective])return false;try{patterns[effective].forEach(tone);finishTrace(trace,clock(),'oscillator');return true;}catch(e){return false;}},toggle:function(){enabled=!enabled;save();controls();return enabled;},setVolume:function(value){volume=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(volume))volume=.45;Object.keys(filePools).forEach(function(name){filePools[name].forEach(function(audio){audio.volume=volume;});});save();controls();return volume;},settings:function(){return{enabled:enabled,volume:volume,unlocked:unlocked,decoded:Object.keys(buffers).filter(function(name){return decoded(buffers[name]);})};},events:function(){return history.slice();},clearEvents:function(){history.length=0;},timings:function(){return timings.slice();},clearTimings:function(){timings.length=0;pendingInput=null;},debugTimings:function(on){debugTiming=!!on;return debugTiming;},preload:function(){preloadCommon();decodeCommon();},_setContext:function(fake){context=fake;unlocked=!!fake;},_setBuffer:function(name,buffer){buffers[name]=buffer;}};
  addEventListener('DOMContentLoaded',function(){K.Sound.init();});
})(window.Kiri=window.Kiri||{});
