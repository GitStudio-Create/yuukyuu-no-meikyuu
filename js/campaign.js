(function(K){
  'use strict';
  var root=null,gameShell=null,screen='boot',selectedBook=0,titleSelection=0,bookSelection=0,screenSelection=0,eventIndex=0,eventList=[],eventDone=null,eventState='OPENING',pendingTreasure=null;
  var STATES={start:'TITLE','exit-confirm':'TITLE','exit-message':'TITLE',books:'ADVENTURE_BOOKS','book-actions':'ADVENTURE_BOOKS','delete-confirm':'ADVENTURE_BOOKS',event:'OPENING',base:'CASTLE',king:'CASTLE',chest:'CASTLE',record:'CASTLE','suspend-confirm':'SUSPEND',dungeons:'DUNGEON_SELECT',dungeon:'DUNGEON','treasure-found':'TREASURE_EVENT','game-over':'GAME_OVER'};
  function esc(value){var d=document.createElement('div');d.textContent=String(value==null?'':value);return d.innerHTML;}
  function formatTime(ms){var minutes=Math.floor((ms||0)/60000),hours=Math.floor(minutes/60);return String(hours).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
  function formatDate(value){if(!value)return'-';try{return new Date(value).toLocaleString('ja-JP');}catch(e){return value;}}
  function updateDebug(){var box=document.querySelector('[data-campaign-debug]');if(box&&K.AdventureBooks)box.textContent=JSON.stringify(K.AdventureBooks.debug(),null,2);}
  function playSound(name){if(K.Sound)K.Sound.play(name);}
  function useTitleBgm(name){return['start','exit-confirm','exit-message','books','book-actions','delete-confirm','event','base','king','chest','record','dungeons'].indexOf(name)>=0;}
  function isCastleScreen(name){return['base','king','chest','record','dungeons','event'].indexOf(name)>=0;}
  function castleTheme(){var story=K.AdventureBooks&&K.AdventureBooks.story?K.AdventureBooks.story():null,chest=story&&story.treasureChest;if(!chest||!chest.obtained)return' castle-no-chest';return chest.opened?' castle-open-chest':' castle-closed-chest';}
  function screenMenuSelector(name){if(name==='base')return'.castle-menu-item:not(:disabled)';if(['exit-confirm','king','chest','record','dungeons','suspend-confirm'].indexOf(name)>=0)return'.campaign-card button:not(:disabled)';return'';}
  function updateScreenSelection(next,focus){var selector=screenMenuSelector(screen),items=selector&&root.querySelectorAll?root.querySelectorAll(selector):[];if(!items.length)return;screenSelection=(next+items.length)%items.length;items.forEach(function(item,index){var on=index===screenSelection;item.classList.toggle('is-selected',on);item.setAttribute('aria-current',String(on));if(on&&focus)item.focus();});}
  function applyState(name){
    var state=name==='event'?eventState:(STATES[name]||'TITLE'),inDungeon=state==='DUNGEON',showGame=inDungeon||state==='SUSPEND';
    document.body.dataset.appState=state;
    document.body.classList.toggle('campaign-menu-open',!inDungeon);
    root.hidden=inDungeon;root.classList.toggle('hidden',inDungeon);
    gameShell.hidden=!showGame;gameShell.setAttribute('aria-hidden',String(!inDungeon));
  }
  function setScreen(name,html,wide,cardClass){screen=name;screenSelection=0;root.className='campaign-screen screen-'+name+(wide?' campaign-wide':'')+(isCastleScreen(name)?castleTheme():'');root.innerHTML='<div class="campaign-card'+(cardClass?' '+cardClass:'')+'">'+html+'</div>';applyState(name);updateScreenSelection(0,false);if(useTitleBgm(name)&&K.Audio&&K.Audio.setTitle)K.Audio.setTitle();updateDebug();}
  function closeScreen(){screen='dungeon';applyState(screen);updateDebug();}
  function startScreen(){titleSelection=0;setScreen('start','<small>ORIGINAL ROGUELIKE</small><h1>悠久の迷宮</h1><div class="title-ornament" aria-hidden="true"><i></i></div><nav class="title-menu" aria-label="タイトルメニュー"><button class="title-menu-item is-selected" data-title-action="start" aria-current="true">はじめる</button><button class="title-menu-item" data-title-action="exit">ゲーム終了</button></nav><p class="menu-guide">↑ ↓ 選択　Enter / Space 決定</p>',false,'title-card');}
  function clearNames(ids){return ids.length?ids.map(function(id){return K.Dungeons.get(id).shortName||K.Dungeons.get(id).name;}).join('、'):'なし';}
  function booksScreen(message){
    bookSelection=0;
    var cards=K.AdventureBooks.slots().map(function(result,index){
      var selected=index===bookSelection?' is-selected':'',common='<div class="book-cover" aria-hidden="true"><span class="book-compass">✦</span></div><div class="book-page"><h3>冒険の書'+result.slot+'</h3>';
      if(result.error)return'<article class="book-slot book-error book-'+result.slot+selected+'" data-book-card="'+result.slot+'" role="option" tabindex="'+(index===bookSelection?'0':'-1')+'" aria-selected="'+(index===bookSelection)+'">'+common+'<p class="book-empty">読み込みエラー</p><p class="book-error-text">'+esc(result.message)+'</p><div class="book-buttons"><button data-book="'+result.slot+'">詳細を確認する</button></div></div></article>';
      if(result.empty)return'<article class="book-slot book-'+result.slot+selected+'" data-book-card="'+result.slot+'" role="option" tabindex="'+(index===bookSelection?'0':'-1')+'" aria-selected="'+(index===bookSelection)+'">'+common+'<p class="book-empty">データがありません</p><div class="book-buttons"><button data-create="'+result.slot+'">新しく冒険を始める</button></div></div></article>';
      var d=result.data,s=d.summary||{},location=esc(s.location||'王城')+(s.floor?' '+s.floor+'F':'');
      return'<article class="book-slot book-'+result.slot+selected+'" data-book-card="'+result.slot+'" role="option" tabindex="'+(index===bookSelection?'0':'-1')+'" aria-selected="'+(index===bookSelection)+'">'+common+'<dl class="book-data"><div><dt>レベル</dt><dd>'+(s.level||1)+'</dd></div><div><dt>現在地</dt><dd>'+location+'</dd></div><div><dt>プレイ時間</dt><dd>'+formatTime(d.playTimeMs)+'</dd></div><div><dt>最終更新</dt><dd>'+esc(formatDate(d.updatedAt))+'</dd></div><div><dt>宝箱</dt><dd>'+esc(s.chest||'未入手')+'</dd></div></dl><div class="book-buttons"><button data-continue="'+result.slot+'">冒険を続ける</button><button data-delete="'+result.slot+'" class="book-delete">冒険の書を消す</button></div></div></article>';
    }).join('');
    setScreen('books','<div class="books-heading"><small>ADVENTURE BOOKS</small><h2>冒険の書を選んでください</h2><p>冒険の記録を選択してください</p></div>'+(message?'<p class="campaign-notice">'+esc(message)+'</p>':'')+'<div class="book-list" role="listbox" aria-label="冒険の書">'+cards+'</div><p class="book-guide">↑ ↓ 選択　Enter / Space 決定　Esc タイトルへ</p><button data-campaign="start" class="books-back secondary">タイトルへ戻る</button>',true,'books-card');
  }
  function updateTitleSelection(next){var items=root.querySelectorAll('[data-title-action]');if(!items.length)return;titleSelection=(next+items.length)%items.length;items.forEach(function(item,index){var on=index===titleSelection;item.classList.toggle('is-selected',on);item.setAttribute('aria-current',String(on));});}
  function updateBookSelection(next,focus){var cards=root.querySelectorAll('[data-book-card]');if(!cards.length)return;bookSelection=(next+cards.length)%cards.length;cards.forEach(function(card,index){var on=index===bookSelection;card.classList.toggle('is-selected',on);card.setAttribute('aria-selected',String(on));card.tabIndex=on?0:-1;if(on&&focus)card.focus();});}
  function activateTitle(){if(titleSelection===0&&K.Audio&&K.Audio.unlock)K.Audio.unlock();playSound('menuSelect');if(titleSelection===0)booksScreen();else exitConfirm();}
  function activateBook(slot){var result=K.AdventureBooks.slots()[slot-1];if(!result)return;playSound('menuSelect');if(result.error)bookActions(slot);else if(result.empty)createBook(slot);else continueBook(slot);}
  function exitConfirm(){setScreen('exit-confirm','<small>END GAME</small><h2>ゲームを終了しますか？</h2><div class="dialog-menu"><button class="title-menu-item" data-campaign="exit-game">終了する</button><button class="title-menu-item" data-campaign="start">戻る</button></div>',false,'dialog-card');}
  function exitGame(){try{window.close();}catch(e){}setScreen('exit-message','<small>END GAME</small><h2>冒険を終了しました</h2><p class="story-line">ブラウザを閉じてゲームを終了してください。</p><button data-campaign="start">タイトルへ戻る</button>');}
  function bookActions(slot){
    var result=K.AdventureBooks.slots()[slot-1];selectedBook=slot;
    if(result.error){setScreen('book-actions','<h2>冒険の書'+slot+'</h2><p>'+esc(result.message)+'</p><div class="campaign-actions"><button data-delete="'+slot+'">この書を消す</button><button data-campaign="books" class="secondary">戻る</button></div>');return;}
    var action=result.empty?'<button data-create="'+slot+'">この冒険の書で始める</button>':'<button data-continue="'+slot+'">冒険を続ける</button><button data-delete="'+slot+'" class="danger">冒険の書を消す</button>';
    setScreen('book-actions','<small>ADVENTURE BOOK '+slot+'</small><h2>冒険の書'+slot+'</h2><div class="campaign-actions">'+action+'<button data-campaign="books" class="secondary">戻る</button></div>');
  }
  function deleteConfirm(slot){setScreen('delete-confirm','<small>DELETE CONFIRMATION</small><h2>冒険の書'+slot+'を消しますか？</h2><p>この操作は元に戻せません。</p><div class="campaign-actions"><button data-delete-confirm="'+slot+'" class="danger">消す</button><button data-book="'+slot+'" class="secondary">やめる</button></div>');}
  function playEvent(list,done,state){eventList=list||[];eventIndex=0;eventDone=done;eventState=state||'OPENING';showEvent();}
  function showEvent(){
    if(eventIndex>=eventList.length){var done=eventDone;eventDone=null;if(done)done();return;}
    var line=eventList[eventIndex++];
    setScreen('event','<small>STORY</small>'+(line.speaker?'<h3>'+esc(line.speaker)+'</h3>':'')+'<p class="story-line">'+esc(line.text)+'</p><button data-campaign="event-next">次へ</button>',false,'story-dialog-card');
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
    var chestDisabled=story.treasureChest.obtained?'':' disabled aria-disabled="true"';
    setScreen('base','<small>ROYAL CASTLE</small><h2>王城</h2>'+(message?'<p class="campaign-notice">'+esc(message)+'</p>':'')+'<p class="important-item">重要アイテム：'+esc(chestText(story))+'</p><nav class="castle-menu" aria-label="王城メニュー"><button class="castle-menu-item" data-campaign="king">王様と話す</button><button class="castle-menu-item" data-campaign="dungeons">ダンジョンへ向かう</button><button class="castle-menu-item" data-campaign="chest"'+chestDisabled+'>宝箱を調べる'+(story.treasureChest.obtained?'':'<small>まだ宝箱を持っていません</small>')+'</button><button class="castle-menu-item" data-campaign="record">冒険の書に記録する</button><button class="castle-menu-item" data-campaign="title">タイトルへ戻る</button></nav><p class="menu-guide">↑ ↓ 選択　Enter / Space 決定</p>',false,'castle-card');
  }
  function kingText(story){if(story.cleared.mysteryDungeon)return'宝箱のなぞはまだ深い。だが、おぬしの勇気は国の希望だ。';if(story.treasureChest.opened)return'宝箱から不思議な力を感じる。迷宮にも変化が起きているかもしれぬ。';if(story.treasureChest.obtained)return'おお、それが伝説の宝箱か。まずはゆっくり調べてみるとよい。';if(story.cleared.tutorialDungeon)return'よく戻った。これなら本当の迷宮も任せられそうだ。';return'まずは迷宮に慣れることだ。無理はするでないぞ。';}
  function kingScreen(){var story=K.AdventureBooks.story();setScreen('king','<small>THE KING</small><h2>王様</h2><p class="story-line">「'+esc(kingText(story))+'」</p><button data-campaign="base">戻る</button>',false,'castle-dialog-card');}
  function dungeonsScreen(){
    var story=K.AdventureBooks.story(),unlocked=!!(story&&story.cleared.tutorialDungeon),deeper=!!(story&&story.treasureChest&&story.treasureChest.opened),secondName=deeper?'もっと不思議':'不思議',secondGuide='27Fへ行くと、不思議な宝があるとの噂があるらしい。';
    setScreen('dungeons','<small>DUNGEON GATE</small><h2>どの迷宮へ向かいますか？</h2><div class="dungeon-list"><button data-dungeon="tutorialDungeon"><strong>ちょっと不思議</strong><span>10Fへ行くと、王様に依頼された物があるみたいだ。</span></button><button data-dungeon="normalDungeon"'+(unlocked?'':' disabled aria-disabled="true"')+'><strong>'+secondName+'</strong><span>'+(unlocked?secondGuide:'未解放 ／ ちょっと不思議をクリアすると挑戦できます')+'</span></button></div><button data-campaign="base" class="secondary">戻る</button>',false,'castle-dialog-card');
  }
  function resolveDungeon(requested,story){return requested==='normalDungeon'&&story&&story.treasureChest.obtained&&story.treasureChest.opened?'mysteryDungeon':requested;}
  function beginDungeon(requested){
    var story=K.AdventureBooks.story();if(requested==='normalDungeon'&&!(story&&story.cleared.tutorialDungeon))return false;var actual=resolveDungeon(requested,story);
    function launch(){playSound('stairs');story.currentDungeon=actual;K.AdventureBooks.saveBase(K.State.data);closeScreen();K.Game.actions.newGame(actual);}
    if(actual==='mysteryDungeon'){var first=!story.events.deepEntranceSeen;story.events.deepEntranceSeen=true;playEvent(first?K.StoryEvents.deepEntrance:K.StoryEvents.deepEntranceShort,function(){K.AdventureBooks.saveBase(K.State.data);launch();},'TREASURE_EVENT');}else launch();
  }
  function chestScreen(){
    var story=K.AdventureBooks.story();
    if(!story.treasureChest.obtained)return setScreen('chest','<h2>宝箱を調べる</h2><p class="story-line">宝箱はまだ見つかっていない。</p><button data-campaign="base">戻る</button>',false,'castle-dialog-card');
    if(story.treasureChest.opened)return setScreen('chest','<h2>開かれた宝箱</h2><p class="story-line">宝箱は開かれている。<br>中は空だが、不思議な力が残っている。</p><button data-campaign="base">戻る</button>',false,'castle-dialog-card');
    setScreen('chest','<h2>古びた宝箱</h2><p class="story-line">古びた宝箱が置かれている。<br>宝箱を開けますか？</p><div class="campaign-actions"><button data-campaign="open-chest">開ける</button><button data-campaign="base" class="secondary">まだ開けない</button></div>',false,'castle-dialog-card');
  }
  function openChest(){var story=K.AdventureBooks.story();story.treasureChest.opened=true;if(K.AdventureBooks.saveBase(K.State.data))baseScreen('宝箱を開けました。迷宮を変える力が残っています。');else baseScreen(K.AdventureBooks.lastError());}
  function recordScreen(){var saved=K.AdventureBooks.saveBase(K.State.data);setScreen('record','<small>ADVENTURE RECORD</small><h2>'+(saved?'冒険の記録を残しました。':'冒険の記録に失敗しました。')+'</h2>'+(saved?'':'<p>'+esc(K.AdventureBooks.lastError())+'</p>')+'<button data-campaign="base">戻る</button>',false,'castle-dialog-card');}
  function suspendConfirm(){playSound('menuSelect');setScreen('suspend-confirm','<small>SUSPEND</small><h2>ここまでの冒険を保存して中断しますか？</h2><div class="campaign-actions"><button data-campaign="suspend-save">中断する</button><button data-campaign="resume-game" class="secondary">冒険を続ける</button></div>',false,'suspend-dialog-card');}
  function suspendSave(){if(K.AdventureBooks.saveDungeon()){K.UI.closeSuspend();booksScreen('冒険を記録しました。');}else{closeScreen();K.State.addLog('冒険の記録に失敗しました。ゲームを続けます。'+(K.AdventureBooks.lastError()?' '+K.AdventureBooks.lastError():''));K.UI.draw(K.State.data);}}
  function collectTreasure(state,item,index){
    if(['trialTreasure','eternalTreasure','deepTreasure'].indexOf(item.id)<0)return false;
    state.groundItems.splice(index,1);pendingTreasure={state:state,item:item};
    setScreen('treasure-found','<small>IMPORTANT ITEM</small><h2>古びた宝箱を見つけた</h2><p>'+(item.id==='trialTreasure'?'浅い迷宮の目的の品だ。':'王様が探していた宝箱に違いない。')+'</p><button data-campaign="take-treasure">持ち帰る</button>');
    return true;
  }
  function takeTreasure(){
    var pending=pendingTreasure;if(!pending)return;pendingTreasure=null;var s=pending.state,story=K.AdventureBooks.story();
    if(pending.item.id==='eternalTreasure')story.treasureChest.obtained=true;
    s.treasureState=s.treasureState||{returning:false,obtained:{},rank:{}};s.treasureState.returning=true;s.treasureState.obtained[pending.item.id]=true;if(s.stairs&&!s.stairs.disabled)s.stairs.type='up';else s.stairs={x:s.player.x,y:s.player.y,type:'up'};
    K.State.addLog('大切な宝箱を手に入れた。階段が地上へ戻る道に変わった。');K.AdventureBooks.saveDungeon();closeScreen();K.UI.draw(s);
  }
  function dungeonReturn(state){
    var story=K.AdventureBooks.story(),id=state.dungeonId;story.cleared[id]=true;state.gameOver=false;K.AdventureBooks.saveBase(state);
    if(id==='mysteryDungeon'&&!story.events.endingSeen){story.events.endingSeen=true;playEvent(K.StoryEvents.ending,function(){K.AdventureBooks.saveBase(state);baseScreen('もっと不思議から帰還しました。');},'CLEAR');}
    else baseScreen(K.Dungeons.get(id).shortName+'をクリアしました。');
    return true;
  }
  function gameOver(state){state.gameOver=true;K.AdventureBooks.saveBase(state);setScreen('game-over','<small>GAME OVER</small><h2>冒険はここまで</h2><p>'+state.floor+'Fで力尽きました。挑戦中の記録は終了しました。</p><button data-campaign="base">戻る</button>');}
  function boot(){
    root=document.querySelector('#campaignScreen');gameShell=document.querySelector('.game-shell');
    var gmGrid=document.querySelector('#gmPanel .gm-grid');if(gmGrid&&!gmGrid.querySelector('[data-campaign-debug]'))gmGrid.insertAdjacentHTML('beforeend','<section><h3>セーブデータ</h3><details class="gm-save-details"><summary>セーブデータ確認</summary><pre data-campaign-debug></pre></details></section>');startScreen();
    root.addEventListener('click',click);root.addEventListener('pointerover',function(e){var selector=screenMenuSelector(screen),title=e.target.closest('[data-title-action]'),card=e.target.closest('[data-book-card]'),menu=selector?e.target.closest(selector):null;if(title){var titles=Array.prototype.slice.call(root.querySelectorAll('[data-title-action]'));updateTitleSelection(titles.indexOf(title));}else if(card)updateBookSelection(Number(card.dataset.bookCard)-1,false);else if(menu){var items=Array.prototype.slice.call(root.querySelectorAll(selector));updateScreenSelection(items.indexOf(menu),false);}});addEventListener('keydown',keys,true);addEventListener('popstate',function(){if(screen==='dungeon')suspendConfirm();else if(screen!=='start')startScreen();});
  }
  function click(e){
    var b=e.target.closest('button'),card=e.target.closest('[data-book-card]');if(!b){if(card)updateBookSelection(Number(card.dataset.bookCard)-1,false);return;}if(b.disabled)return;
    var action=b.dataset.campaign;
    if(b.dataset.titleAction){titleSelection=b.dataset.titleAction==='start'?0:1;activateTitle();return;}
    if(!b.dataset.dungeon)playSound(b.classList&&b.classList.contains('secondary')||['books','start','base','title','resume-game'].indexOf(action)>=0?'menuCancel':'menuSelect');
    if(action==='books')booksScreen();else if(action==='start')startScreen();else if(action==='exit-game')exitGame();else if(action==='event-next')showEvent();else if(action==='base')baseScreen();else if(action==='king')kingScreen();else if(action==='dungeons')dungeonsScreen();else if(action==='chest')chestScreen();else if(action==='record')recordScreen();else if(action==='title')startScreen();else if(action==='open-chest')openChest();else if(action==='suspend-save')suspendSave();else if(action==='resume-game')closeScreen();else if(action==='take-treasure')takeTreasure();
    else if(b.dataset.book)bookActions(Number(b.dataset.book));else if(b.dataset.create)createBook(Number(b.dataset.create));else if(b.dataset.continue)continueBook(Number(b.dataset.continue));else if(b.dataset.delete)deleteConfirm(Number(b.dataset.delete));else if(b.dataset.deleteConfirm){K.AdventureBooks.remove(Number(b.dataset.deleteConfirm));booksScreen('冒険の書を消しました。');}else if(b.dataset.dungeon)beginDungeon(b.dataset.dungeon);
  }
  function keys(e){
    if(screen==='dungeon')return;
    if(screen==='start'){
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();updateTitleSelection(titleSelection+(e.key==='ArrowDown'?1:-1));return;}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();activateTitle();return;}
    }
    if(screen==='books'){
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();updateBookSelection(bookSelection+(e.key==='ArrowDown'?1:-1),true);return;}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();activateBook(bookSelection+1);return;}
    }
    if(screenMenuSelector(screen)){
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();updateScreenSelection(screenSelection+(e.key==='ArrowDown'?1:-1),true);return;}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();var selected=root.querySelector(screenMenuSelector(screen)+'.is-selected');if(selected)selected.click();return;}
    }
    if(e.key==='Escape'){if(screen==='event')return;e.preventDefault();playSound('menuCancel');if(screen==='books'||screen==='exit-confirm'||screen==='exit-message')startScreen();else if(screen==='base')startScreen();else if(screen==='suspend-confirm')closeScreen();else if(screen==='book-actions'||screen==='delete-confirm')booksScreen();else baseScreen();}
  }
  K.Campaign={boot:boot,isOpen:function(){return screen!=='dungeon';},currentScreen:function(){return screen;},showStart:startScreen,showBooks:booksScreen,showBase:baseScreen,requestSuspend:suspendConfirm,collectTreasure:collectTreasure,onDungeonReturn:dungeonReturn,onGameOver:gameOver,resolveDungeon:resolveDungeon,debug:function(){return K.AdventureBooks.debug();}};
})(window.Kiri=window.Kiri||{});
