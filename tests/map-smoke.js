'use strict';
const fs = require('fs');
const vm = require('vm');
global.window = global;
global.Kiri = {};
vm.runInThisContext(fs.readFileSync('js/config.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/map.js', 'utf8'));

for (let run = 0; run < 250; run++) {
  const generated = Kiri.Map.generate();
  if (generated.rooms.length < 2) throw new Error('room count: ' + generated.rooms.length);
  const map = generated.tiles, start = generated.rooms[0];
  const queue = [[start.cx, start.cy]], reached = new Set([start.cx + ',' + start.cy]);
  while (queue.length) {
    const [x, y] = queue.shift();
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
      const nx=x+dx, ny=y+dy, key=nx+','+ny;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length && map[ny][nx] && !reached.has(key)) {
        reached.add(key); queue.push([nx,ny]);
      }
    });
  }
  generated.rooms.forEach(room => {
    if (!reached.has(room.cx + ',' + room.cy)) throw new Error('disconnected room on run ' + run);
  });
  if (map[0].some(Boolean) || map.at(-1).some(Boolean) || map.some(row => row[0] || row.at(-1)))
    throw new Error('floor escaped boundary on run ' + run);
}
console.log('map smoke: 250 floors passed');
