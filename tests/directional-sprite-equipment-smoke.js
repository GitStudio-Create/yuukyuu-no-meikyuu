const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const context = { window: {}, console };
context.window.Kiri = {};
vm.createContext(context);
function load(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
load('js/directions.js');
load('js/sprites.js');
const K = context.window.Kiri;

function makeCtx() {
  const ops = [];
  return {
    ops,
    fillStyle: '',
    globalAlpha: 1,
    save() { ops.push(['save']); },
    restore() { ops.push(['restore']); },
    translate(x, y) { ops.push(['translate', x, y]); },
    scale(x, y) { ops.push(['scale', x, y]); },
    fillRect(x, y, w, h) { ops.push(['fillRect', this.fillStyle, x, y, w, h]); }
  };
}
function renderPlayer(facing, equipment) {
  const ctx = makeCtx();
  const player = { facing8: facing, facingDirection: K.Direction8.vector(facing), equipment: equipment || {} };
  K.Sprites.drawPlayer(ctx, 0, 0, { type: 'idle', progress: 0 }, 1000, facing, player);
  return JSON.stringify(ctx.ops);
}
function renderEnemy(facing) {
  const ctx = makeCtx();
  K.Sprites.drawEnemy(ctx, { x: 1, y: 1, id: 'dewMote', color: '#77bb88', facing8: facing, facingDirection: K.Direction8.vector(facing) }, 0, 0, { type: 'idle', progress: 0 }, 1000);
  return JSON.stringify(ctx.ops);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bare = renderPlayer('S', { weapon: null, shield: null });
assert(!bare.includes('#dce8ec') && !bare.includes('#9faab0'), '丸腰プレイヤーに旧武器・旧盾色が描画されています');

const armed = renderPlayer('S', { weapon: { id: 'dawnEdge' }, shield: { id: 'everShield' } });
assert(armed.includes('#ffd36f'), '装備中の武器色が描画されていません');
assert(armed.includes('#8c9188'), '装備中の盾色が描画されていません');

const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const playerShapes = new Set(dirs.map((d) => renderPlayer(d, { weapon: { id: 'emberBlade' }, shield: { id: 'barkShield' } })));
assert(playerShapes.size >= 5, 'プレイヤーの8方向描画差が不足しています');
const enemyShapes = new Set(dirs.map(renderEnemy));
assert(enemyShapes.size >= 4, '敵の方向描画差が不足しています');

const actor = {};
K.Direction8.apply(actor, 1, -1);
assert(actor.facing8 === 'NE' && actor.facingDirection.dx === 1 && actor.facingDirection.dy === -1, '方向共通関数が右上を保持できていません');
K.Direction8.apply(actor, 0, 0);
assert(actor.facing8 === 'NE', '足踏み相当の入力で最後の向きが維持されていません');

console.log('directional sprite equipment smoke passed');
