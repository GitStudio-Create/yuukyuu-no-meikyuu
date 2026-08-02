'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};let clock=100;global.performance={now:()=>clock};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','item-icons','state','map','visibility','combat-rules','entities','enemy-renderer','sprites','animation','item-actions','stage10-items','balance','traps','stairs'].forEach(n=>load('js/'+n+'.js'));

// Camera and player share the exact same interpolation progress.
Kiri.UI={draw:()=>{}};load('js/stage16-ui.js');const state=Kiri.State.reset('normalDungeon');state.player.x=17;state.player.y=13;Kiri.Animation.player('walk',200,{dx:1,dy:1,fromX:16,fromY:12,toX:17,toY:13});let cam=Kiri.UI.stage21RenderCamera(state,100);assert.equal(cam.x,6);assert.equal(cam.y,5);cam=Kiri.UI.stage21RenderCamera(state,200);assert.equal(cam.x,6.5);assert.equal(cam.y,5.5);cam=Kiri.UI.stage21RenderCamera(state,300);assert.equal(cam.x,7);assert.equal(cam.y,6);

// MP3 fanfare pauses BGM, uses BGM volume, refuses overlap, and resumes afterward.
let paused=false,plays=0;const bgm={get paused(){return paused;},pause(){paused=true;},play(){paused=false;plays++;return Promise.resolve();}};global.document={querySelector:q=>q==='#bgmAudio'?bgm:null};Kiri.Audio={settings:()=>({enabled:true,volume:.4})};load('js/stage21-audio.js');let fanfarePlays=0,fanfarePaused=false;const fakeFanfare={preload:'',volume:0,currentTime:0,onended:null,onerror:null,pause(){fanfarePaused=true;},play(){fanfarePlays++;return Promise.resolve();}};Kiri.Fanfare._setAudio(fakeFanfare);assert(Kiri.Fanfare.play());assert(paused);assert(Kiri.Fanfare.isActive());assert.equal(fakeFanfare.volume,.4);assert.equal(fanfarePlays,1);assert.equal(Kiri.Fanfare.play(),false);Kiri.Fanfare.finish();assert(fanfarePaused);assert.equal(plays,1);assert(!Kiri.Fanfare.isActive());Kiri.Audio.settings=()=>({enabled:false,volume:.4});assert.equal(Kiri.Fanfare.play(),false);assert.equal(Kiri.Fanfare.duration,2.15);assert.equal(Kiri.Fanfare.file,'BGM/レベルアップ.mp3');

const html=fs.readFileSync('index.html','utf8'),sound=fs.readFileSync('js/sound.js','utf8'),entities=fs.readFileSync('js/entities.js','utf8');assert(html.includes('js/stage21-audio.js'));assert(sound.includes('levelUp:[]'));assert(entities.includes("' レベルが'+level+'に上がった！'"));
console.log('stage 21 smoke: synchronized camera interpolation and BGM-aware fanfare passed');
