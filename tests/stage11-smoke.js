'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.Kiri={};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};global.addEventListener=()=>{};function load(f){vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});}
['config','spawns','dungeons','themes','enemy-catalog','items','state','stage8-state','stage10-state','map','visibility','combat-rules','entities','item-actions','stage10-items','balance','traps'].forEach(n=>load('js/'+n+'.js'));
function arena(){const s=Kiri.State.reset('normalDungeon');s.map=Array.from({length:24},()=>Array(32).fill(1));s.rooms=[{x:0,y:0,w:32,h:24}];s.player.x=2;s.player.y=2;s.player.hp=100;s.player.maxHp=100;s.player.facingDirection={dx:1,dy:1};s.stairs={x:30,y:22,type:'down'};s.enemies=[];s.groundItems=[];s.inventory=[];s.traps=[];s.seen={};s.spawnPolicy={nextSpawnTurn:999,maxEnemies:10,naturalSpawnInterval:30};return s;}

// A diagonal step needs both orthogonal side cells to be open.
let s=arena();s.map[2][3]=0;assert.equal(Kiri.Map.canStep(s,3,3,1,1),false);s.map[2][3]=1;s.map[3][2]=0;assert.equal(Kiri.Map.canStep(s,3,3,1,1),false);s.map[3][2]=1;assert.equal(Kiri.Map.canStep(s,3,3,1,1),true);const actor={x:5,y:5};s.map[5][6]=0;assert.equal(Kiri.Map.canTraverse(s,actor,6,6,1,1),false);

// Diagonal enemies reposition but do not make a normal attack.
s=arena();s.rooms=[];let enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser'),enemyStart={x:enemy.x,y:enemy.y};s.enemies=[enemy];let hp=s.player.hp;Kiri.Entities.enemyAct(s,enemy);assert.equal(s.player.hp,hp);assert(Math.abs(enemy.x-enemyStart.x)+Math.abs(enemy.y-enemyStart.y)<=1);

// Player diagonal normal attacks whiff and consume exactly one turn.
Kiri.UI={draw:()=>{},showStairs:()=>{},closeStairs:()=>{},closeItemMenu:()=>{},showGameOver:()=>{},showEscape:()=>{},hideOverlay:()=>{},closeStatus:()=>{},toggleStatus:()=>{}};Kiri.Input={resetModes:()=>{}};Kiri.Audio={setTheme:()=>{}};load('js/game.js');s=arena();s.rooms=[];enemy=Kiri.Entities.createEnemy(1,{x:3,y:3},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.status.sleep=9;s.enemies=[enemy];hp=enemy.hp;Kiri.Game.actions.attack();assert.equal(enemy.hp,hp);assert.equal(s.turn,1);assert(s.log[0].includes('通路では斜めに通常攻撃できない'));

// Arrows, staffs and thrown items still travel diagonally.
s=arena();enemy=Kiri.Entities.createEnemy(1,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];let arrow=Kiri.Items.create('reedArrow',0,0,s.dungeonId);arrow.quantity=2;s.inventory=[arrow];hp=enemy.hp;Kiri.ItemActions.perform('shoot',s,arrow);assert(enemy.hp<hp);
s=arena();enemy=Kiri.Entities.createEnemy(1,{x:5,y:5},Kiri.Dungeons.get(s.dungeonId),'chaser');s.enemies=[enemy];let staff=Kiri.Items.create('sleepStaff',0,0,s.dungeonId);s.inventory=[staff];Kiri.ItemActions.perform('wave',s,staff);assert(enemy.status.sleep>0);

// Thrown hit damage is category-specific; hits disappear and misses land.
function throwDamage(id){s=arena();enemy=Kiri.Entities.createEnemy(1,{x:4,y:4},Kiri.Dungeons.get(s.dungeonId),'chaser');enemy.hp=50;enemy.maxHp=50;s.enemies=[enemy];const item=Kiri.Items.create(id,0,0,s.dungeonId);s.inventory=[item];Kiri.ItemActions.perform('throw',s,item);assert(!s.inventory.includes(item));assert(!s.groundItems.includes(item));return 50-enemy.hp;}
assert.equal(throwDamage('barkShield'),2);assert.equal(throwDamage('mightRing'),1);assert.equal(throwDamage('mapScroll'),1);assert.equal(throwDamage('nutBread'),1);assert(throwDamage('emberBlade')<=4);assert.equal(throwDamage('reedArrow'),4);
s=arena();const missed=Kiri.Items.create('nutBread',0,0,s.dungeonId);s.inventory=[missed];Kiri.ItemActions.perform('throw',s,missed);assert(s.groundItems.includes(missed));

// Stage 11 layout has one compact status row, a three-line log and canvas theme label.
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');assert(html.includes('id="levelText"'));assert(html.includes('id="goldText"'));assert(!html.includes('class="mini-status"'));assert(html.includes('js/stage11-ui.js'));assert(css.includes('.message-area{height:62px'));assert(css.includes('max-height:136px'));
const labels=[],ctx={save(){},restore(){},measureText:t=>({width:t.length*8}),fillRect(){},fillText:t=>labels.push(t)};const nodes={levelText:{textContent:''},goldText:{textContent:''},game:{getContext:()=>ctx},message:{children:[],removeChild(){this.children.pop();},get lastElementChild(){return this.children[this.children.length-1];}}};Kiri.UI={draw:()=>{nodes.message.children=[{},{},{},{}];}};global.document={querySelector:q=>nodes[q.slice(1)]||null};load('js/stage11-ui.js');s=arena();s.player.level=3;s.player.gold=42;Kiri.UI.draw(s);assert.equal(nodes.levelText.textContent,3);assert.equal(nodes.goldText.textContent,'42 G');assert.equal(nodes.message.children.length,3);assert(labels.includes('入口の迷宮'));

// Legacy state remains loadable after movement/UI additions.
const legacy=Kiri.State.fresh();delete legacy.player.facingDirection;store[Kiri.Config.saveKey]=JSON.stringify(legacy);assert(Kiri.State.load());assert(Kiri.State.data.player.facingDirection);
console.log('stage 11 smoke: diagonal rules, throws, compact UI and migration passed');
