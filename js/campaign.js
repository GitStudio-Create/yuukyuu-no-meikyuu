(function(K){
  'use strict';
  var root=null,screen='boot',selectedBook=0,eventIndex=0,eventList=[],eventDone=null,pendingTreasure=null;
  function esc(value){var d=document.createElement('div');d.textContent=String(value==null?'':value);return d.innerHTML;}
  function formatTime(ms){var minutes=Math.floor((ms||0)/60000),hours=Math.floor(minutes/60);return String(hours).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
  function formatDate(value){if(!value)return'-';try{return new Date(value).toLocaleString('ja-JP');}catch(e){return value;}}
  function updateDebug(){var box=document.querySelector('[data-campaign-debug]');if(box&&K.AdventureBooks)box.textContent=JSON.stringify(K.AdventureBooks.debug(),null,2);}
  function setScreen(name,html,wide){screen=name;root.className='campaign-screen'+(wide?' campaign-wide':'');root.innerHTML='<div class="campaign-card">'+html+'</div>';root.classList.remove('hidden');document.body.classList.add('campaign-menu-open');document.querySelector('.game-shell').setAttribute('aria-hidden','true');updateDebug();}
  function closeScreen(){screen='dungeon';root.classList.add('hidden');document.body.classList.remove('campaign-menu-open');document.querySelector('.game-shell').removeAttribute('aria-hidden');updateDebug();}
  function startScreen(){setScreen('start','<small>ORIGINAL MINI ROGUELIKE</small><h1>悠久の迷宮</h1><button class="push-start" data-campaign="books">PUSH START</button><p>Enter / Space / クリック・タップ</p>');}
  function clearNames(ids){return ids.length?ids.map(function(id){return K.Dungeons.get(id).shortName||K.Dungeons.get(id).name;}).join('、'):'なし';}
  function booksScreen(message){
    var cards=K.AdventureBooks.slots().map(function(result){
      if(result.error)return'<button class="book-slot book-error" data-book="'+result.slot+'"><strong>冒険の書'+result.slot+'</strong><span>読み込みエラー</span><small>'+esc(result.message)+'</small></button>';
      if(result.empty)return'<button class="book-slot" data-book="'+result.slot+'"><strong>冒険の書'+result.slot+'</strong><span>新しい冒険を始める</span></button>';
      var d=result.data,s=d.summary||{};
      return'<button class="book-slot" data-book="'+result.slot+'"><strong>冒険の書'+result.slot+'</strong><span>レベル'+(s.level||1)+'　'+esc(s.location||'王城')+(s.floor?' '+s.floor+'F':'')+'</span><small>プレイ時間 '+formatTime(d.playTimeMs)+' ／ 更新 '+formatDate(d.updatedAt)+'</small><small>宝箱 '+esc(s.chest||'未入手')+' ／ クリア '+esc(clearNames(s.cleared||[]))+'</small></button>';
    }).join('');
    setScreen('books','<small>ADVENTURE BOOKS</small><h2>冒険の書を選ぶ</h2>'+(message?'<p class="campaign-notice">'+esc(message)+'</p>':'')+'<div class="book-list">'+cards+'</div><button data-campaign="start" class="secondary">戻る</button>',true);
  }
  function bookActions(slot){
    var result=K.AdventureBooks.slots()[slot-1];selectedBook=slot;
    if(result.error){setScreen('book-actions','<h2>冒険の書'+slot+'</h2><p>'+esc(result.message)+'</p><div class="campaign-actions"><button data-delete="'+slot+'">この書を消す</button><button data-campaign="books" class="secondary">戻る</button></div>');return;}
    var action=result.empty?'<button data-create="'+slot+'">この冒険の書で始める</button>':'<button data-continue="'+slot+'">冒険を続ける</button><button data-delete="'+slot+'" class="danger">冒険の書を消す</button>';
    setScreen('book-actions','<small>ADVENTURE BOOK '+slot+'</small><h2>冒険の書'+slot+'</h2><div class="campaign-actions">'+action+'<button data-campaign="books" class="secondary">戻る</button></div>');
  }
  function deleteConfirm(slot){setScreen('delete-confirm','<small>DELETE CONFIRMATION</small><h2>冒険の書'+slot+'を消しますか？</h2><p>この操作は元に戻せません。</p><div class="campaign-actions"><button data-delete-confirm="'+slot+'" class="danger">消す</button><button data-book="'+slot+'" class="secondary">やめる</button></div>');}
  function playEvent(list,done){eventList=list||[];eventIndex=0;eventDone=done;showEvent();}
  function showEvent(){
    if(eventIndex>=eventList.length){var done=eventDone;eventDone=null;if(done)done();return;}
    var line=eventList[eventIndex++];
    setScreen('event','<small>STORY</small>'+(line.speaker?'<h3>'+esc(line.speaker)+'</h3>':'')+'<p class="story-line">'+esc(line.text)+'</p><button data-campaign="event-next">次へ</button>');
  }
  function createBook(slot){
    if(!K.AdventureBooks.create(slot))return booksScreen(K.AdventureBooks.lastError());
    playEvent(K.StoryEvents.opening,function(){var story=K.AdventureBooks.story();story.openingSeen=true;story.questAccepted=true;K.AdventureBooks.saveBase();baseScreen('王様の依頼を受けました。');});
  }
  function continueBook(slot){
    var result=K.AdventureBooks.select(slot);if(result.error)return booksScreen(result.message);
    if(K.AdventureBooks.loadSelected()){
      closeScreen();K.Map.reveal(K.State.data);K.UI.draw(K.State.data);if(K.Audio)K.Audio.setForState?K.Audio.setForState(K.State.data):K.Audio.setTheme(K.State.data.floor);return;
    }
    baseScreen();
  }
  function chestText(story){return!story.treasureChest.obtained?'宝箱はまだ見つかっていない。':story.treasureChest.opened?'開かれた宝箱。中は空だが、不思議な力が残っている。':'古びた宝箱。固く閉ざされている。';}
  function baseScreen(message){
    var story=K.AdventureBooks.story();if(!story)return booksScreen();K.AdventureBooks.saveBase(K.State.data);
    setScreen('base','<small>ROYAL CASTLE</small><h2>王城</h2>'+(message?'<p class="campaign-notice">'+esc(message)+'</p>':'')+'<p class="important-item">重要アイテム：'+esc(chestText(story))+'</p><div class="campaign-actions"><button data-campaign="king">王様と話す</button><button data-campaign="dungeons">ダンジョンへ向かう</button><button data-campaign="chest">宝箱を調べる</button><button data-campaign="record">冒険の書に記録する</button><button data-campaign="title" class="secondary">タイトルへ戻る</button></div>');
  }
  function kingText(story){if(story.cleared.mysteryDungeon)return'宝箱のなぞはまだ深い。だが、おぬしの勇気は国の希望だ。';if(story.treasureChest.opened)return'宝箱から不思議な力を感じる。迷宮にも変化が起きているかもしれぬ。';if(story.treasureChest.obtained)return'おお、それが伝説の宝箱か。まずはゆっくり調べてみるとよい。';if(story.cleared.tutorialDungeon)return'よく戻った。これなら本当の迷宮も任せられそうだ。';return'まずは迷宮に慣れることだ。無理はするでないぞ。';}
  function kingScreen(){var story=K.AdventureBooks.story();setScreen('king','<small>THE KING</small><h2>王様</h2><p class="story-line">'+esc(kingText(story))+'</p><button data-campaign="base">王城へ戻る</button>');}
  function dungeonsScreen(){
    setScreen('dungeons','<small>DUNGEON GATE</small><h2>向かう迷宮</h2><div class="dungeon-list"><button data-dungeon="tutorialDungeon"><strong>ちょっと不思議</strong><span>全10F ／ 難易度：弱</span></button><button data-dungeon="normalDungeon"><strong>不思議</strong><span>全99F ／ 難易度：中</span></button></div><button data-campaign="base" class="secondary">戻る</button>');
  }
  function resolveDungeon(requested,story){return requested==='normalDungeon'&&story&&story.treasureChest.obtained&&story.treasureChest.opened?'mysteryDungeon':requested;}
  function beginDungeon(requested){
    var story=K.AdventureBooks.story(),actual=resolveDungeon(requested,story);
    function launch(){story.currentDungeon=actual;K.AdventureBooks.saveBase(K.State.data);closeScreen();K.Game.actions.newGame(actual);}
    if(actual==='mysteryDungeon'){var first=!story.events.deepEntranceSeen;story.events.deepEntranceSeen=true;playEvent(first?K.StoryEvents.deepEntrance:K.StoryEvents.deepEntranceShort,function(){K.AdventureBooks.saveBase(K.State.data);launch();});}else launch();
  }
  function chestScreen(){
    var story=K.AdventureBooks.story();
    if(!story.treasureChest.obtained)return setScreen('chest','<h2>宝箱を調べる</h2><p>宝箱はまだ見つかっていない。</p><button data-campaign="base">戻る</button>');
    if(story.treasureChest.opened)return setScreen('chest','<h2>開かれた宝箱</h2><p>中は空だが、不思議な力が残っている。</p><button data-campaign="base">戻る</button>');
    setScreen('chest','<h2>古びた宝箱</h2><p>固く閉ざされている。開けますか？</p><div class="campaign-actions"><button data-campaign="open-chest">開ける</button><button data-campaign="base" class="secondary">まだ開けない</button></div>');
  }
  function openChest(){var story=K.AdventureBooks.story();story.treasureChest.opened=true;if(K.AdventureBooks.saveBase(K.State.data))baseScreen('宝箱を開けました。迷宮を変える力が残っています。');else baseScreen(K.AdventureBooks.lastError());}
  function suspendConfirm(){setScreen('suspend-confirm','<small>SUSPEND</small><h2>ここまでの冒険を保存して中断しますか？</h2><div class="campaign-actions"><button data-campaign="suspend-save">中断する</button><button data-campaign="resume-game" class="secondary">冒険を続ける</button></div>');}
  function suspendSave(){if(K.AdventureBooks.saveDungeon()){K.UI.closeSuspend();booksScreen('冒険を記録しました。');}else{closeScreen();K.State.addLog(K.AdventureBooks.lastError());K.UI.draw(K.State.data);}}
  function collectTreasure(state,item,index){
    if(['trialTreasure','eternalTreasure','deepTreasure'].indexOf(item.id)<0)return false;
    state.groundItems.splice(index,1);pendingTreasure={state:state,item:item};
    setScreen('treasure-found','<small>IMPORTANT ITEM</small><h2>古びた宝箱を見つけた</h2><p>'+(item.id==='trialTreasure'?'浅い迷宮の目的の品だ。':'王様が探していた宝箱に違いない。')+'</p><button data-campaign="take-treasure">持ち帰る</button>');
    return true;
  }
  function takeTreasure(){
    var pending=pendingTreasure;if(!pending)return;pendingTreasure=null;var s=pending.state,story=K.AdventureBooks.story();
    if(pending.item.id==='eternalTreasure')story.treasureChest.obtained=true;
    s.treasureState=s.treasureState||{returning:false,obtained:{},rank:{}};s.treasureState.returning=true;s.treasureState.obtained[pending.item.id]=true;if(s.stairs)s.stairs.type='up';
    K.State.addLog('大切な宝箱を手に入れた。階段が地上へ戻る道に変わった。');K.AdventureBooks.saveDungeon();closeScreen();K.UI.draw(s);
  }
  function dungeonReturn(state){
    var story=K.AdventureBooks.story(),id=state.dungeonId;story.cleared[id]=true;state.gameOver=false;K.AdventureBooks.saveBase(state);
    if(id==='mysteryDungeon'&&!story.events.endingSeen){story.events.endingSeen=true;playEvent(K.StoryEvents.ending,function(){K.AdventureBooks.saveBase(state);baseScreen('もっと不思議から帰還しました。');});}
    else baseScreen(K.Dungeons.get(id).shortName+'をクリアしました。');
    return true;
  }
  function gameOver(state){state.gameOver=true;K.AdventureBooks.saveBase(state);setScreen('game-over','<small>GAME OVER</small><h2>冒険はここまで</h2><p>'+state.floor+'Fで力尽きました。挑戦中の記録は終了しました。</p><button data-campaign="base">王城へ戻る</button>');}
  function boot(){
    root=document.querySelector('#campaignScreen');var titleButton=document.querySelector('#newGame');titleButton.textContent='タイトルへ戻る';titleButton.addEventListener('click',function(e){if(screen!=='dungeon')return;e.preventDefault();e.stopImmediatePropagation();suspendConfirm();},true);
    var gmGrid=document.querySelector('#gmPanel .gm-grid');if(gmGrid&&!gmGrid.querySelector('[data-campaign-debug]'))gmGrid.insertAdjacentHTML('beforeend','<section><h3>冒険の書デバッグ</h3><pre data-campaign-debug></pre></section>');startScreen();
    root.addEventListener('click',click);addEventListener('keydown',keys,true);addEventListener('popstate',function(){if(screen==='dungeon')suspendConfirm();else if(screen!=='start')startScreen();});
  }
  function click(e){
    var b=e.target.closest('button');if(!b){if(screen==='start')booksScreen();return;}
    var action=b.dataset.campaign;
    if(action==='books')booksScreen();else if(action==='start')startScreen();else if(action==='event-next')showEvent();else if(action==='base')baseScreen();else if(action==='king')kingScreen();else if(action==='dungeons')dungeonsScreen();else if(action==='chest')chestScreen();else if(action==='record')baseScreen(K.AdventureBooks.saveBase(K.State.data)?'冒険の書に記録しました。':K.AdventureBooks.lastError());else if(action==='title')startScreen();else if(action==='open-chest')openChest();else if(action==='suspend-save')suspendSave();else if(action==='resume-game')closeScreen();else if(action==='take-treasure')takeTreasure();
    else if(b.dataset.book)bookActions(Number(b.dataset.book));else if(b.dataset.create)createBook(Number(b.dataset.create));else if(b.dataset.continue)continueBook(Number(b.dataset.continue));else if(b.dataset.delete)deleteConfirm(Number(b.dataset.delete));else if(b.dataset.deleteConfirm){K.AdventureBooks.remove(Number(b.dataset.deleteConfirm));booksScreen('冒険の書を消しました。');}else if(b.dataset.dungeon)beginDungeon(b.dataset.dungeon);
  }
  function keys(e){
    if(screen==='dungeon')return;
    if(screen==='start'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();booksScreen();return;}
    if(e.key==='Escape'){e.preventDefault();if(screen==='books')startScreen();else if(screen==='base')startScreen();else if(screen==='event')return;else if(screen==='suspend-confirm')closeScreen();else if(screen==='book-actions'||screen==='delete-confirm')booksScreen();else baseScreen();}
  }
  K.Campaign={boot:boot,isOpen:function(){return screen!=='dungeon';},currentScreen:function(){return screen;},showStart:startScreen,showBooks:booksScreen,showBase:baseScreen,requestSuspend:suspendConfirm,collectTreasure:collectTreasure,onDungeonReturn:dungeonReturn,onGameOver:gameOver,resolveDungeon:resolveDungeon,debug:function(){return K.AdventureBooks.debug();}};
})(window.Kiri=window.Kiri||{});
