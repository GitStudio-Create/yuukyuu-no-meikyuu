'use strict';
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');

assert(/<body class="campaign-menu-open" data-app-state="TITLE">/.test(html),'HTML must start in TITLE state');
assert(/id="campaignScreen" class="campaign-screen screen-start"/.test(html),'campaign screen must be visible before JavaScript runs');
assert(/data-title-action="start"[^>]*>はじめる/.test(html),'static title must provide start action');
assert(/data-title-action="exit"[^>]*>ゲーム終了/.test(html),'static title must provide safe exit action');
assert(!/PRESS ANY KEY|PUSH START|オプション|つづきから/.test(html),'obsolete title choices must not remain');
assert(/<main class="game-shell" hidden aria-hidden="true">/.test(html),'legacy game UI must be hidden by default');
assert(css.includes('.game-shell[hidden]{display:none!important}'),'hidden game shell needs an author-level fail-safe');
assert(css.includes('body:not([data-app-state="DUNGEON"]):not([data-app-state="SUSPEND"]) .game-shell{display:none!important}'),'only DUNGEON and SUSPEND states may show the game UI');
assert(css.includes('.campaign-screen.screen-suspend-confirm'),'suspend confirmation needs its dedicated overlay');
assert(html.indexOf('js/campaign.js')<html.indexOf('js/game.js'),'campaign controller must load before game boot');
assert(!/<button[^>]+id="newGame"/.test(html),'dungeon header must not keep the duplicate title button');
assert.equal((html.match(/data-floor-suspend/g)||[]).length,1,'dungeon header keeps one suspend button');
assert(css.includes('images/campaign/title-labyrinth-bg.png'),'title uses the clean labyrinth background');
assert(css.includes('images/campaign/adventure-library-bg.png'),'books use the clean library background');
assert(fs.existsSync('images/campaign/title-labyrinth-bg.png'));
assert(fs.existsSync('images/campaign/adventure-library-bg.png'));
['宝箱無し','宝箱あり','宝箱開けた状態'].forEach(name=>assert(css.includes(name),'castle background missing: '+name));
assert(css.includes('.campaign-screen.screen-exit-confirm')&&css.includes('backdrop-filter:blur(4px)'),'exit and castle overlays keep and blur their backgrounds');

console.log('campaign entry smoke: fail-safe title and explicit script order passed');
