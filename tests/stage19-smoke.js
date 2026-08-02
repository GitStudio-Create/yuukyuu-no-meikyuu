'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.addEventListener=()=>{};
function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','inventory','item-icons','state','map','visibility','combat-rules','entities','enemy-renderer','sprites','animation','item-actions','stage10-items','balance','traps','stairs'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24,id:1}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:0};s.enemies=[];s.groundItems=[];s.traps=[];s.stairs={x:30,y:22};s.visible={};for(let y=0;y<24;y++)for(let x=0;x<32;x++)s.visible[Kiri.Util.key(x,y)]=1;return s;}

// Walking keeps the sprite on an integer tile anchor; only the feet alternate.
const translations=[],spriteCtx={save(){},restore(){},translate(x,y){translations.push([x,y]);},scale(){},fillRect(){},set fillStyle(v){},set globalAlpha(v){}};Kiri.Sprites.drawPlayer(spriteCtx,32,64,{type:'walk',progress:.27},123,'right');assert.deepStrictEqual(translations[0],[48,80]);

// The facing marker supports all eight directions and points to the requested side.
Kiri.UI={draw:()=>{}};load('js/stage16-ui.js');function arrowTip(f){const lines=[],ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(x,y){lines.push([x,y]);},stroke(){},set strokeStyle(v){},set lineWidth(v){}};Kiri.UI.drawFacingArrow(ctx,0,0,f);return lines[0];}[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]].forEach(d=>{const tip=arrowTip({dx:d[0],dy:d[1]});assert.equal(Math.sign(tip[0]-16),Math.sign(d[0]));assert.equal(Math.sign(tip[1]-16),Math.sign(d[1]));});

// Spawn sleep consumes the whole enemy turn, including both actions of a fast enemy.
let s=arena(),enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'fast');enemy.spawnSleep=true;enemy.awake=false;enemy.speed=2;s.enemies=[enemy];Kiri.State.data=s;const random=Math.random;Math.random=()=>0;let hp=s.player.hp;Kiri.Entities.takeEnemyTurns(s);assert.equal(s.player.hp,hp);assert(enemy.awake&&!enemy.spawnSleep);assert(s.log[0].includes(enemy.name+'は目を覚ました。'));s.turn++;Kiri.Entities.takeEnemyTurns(s);assert(s.player.hp<hp);

// Item-induced sleep also wakes without attacking on the expiration turn.
s=arena();enemy=Kiri.Entities.createEnemy(1,{x:3,y:2},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.spawnSleep=false;enemy.awake=true;enemy.effectSleep=1;enemy.status.sleep=1;s.enemies=[enemy];Kiri.State.data=s;hp=s.player.hp;Kiri.Entities.takeEnemyTurns(s);assert.equal(s.player.hp,hp);assert.equal(enemy.effectSleep,0);assert(s.log[0].includes(enemy.name+'は目を覚ました。'));s.turn++;Kiri.Entities.takeEnemyTurns(s);assert(s.player.hp<hp);Math.random=random;

console.log('stage 19 smoke: stable walking, eight-way facing marker and wake-only enemy turns passed');
