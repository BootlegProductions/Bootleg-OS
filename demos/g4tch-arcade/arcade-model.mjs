// Browser-only cartridge catalogue and the original Prism Break cabinet test.
export const MAX_ROM_BYTES = 32 * 1024 * 1024;
export function romTitle(name) {
  return name.replace(/\.(bin|md|gen|smd|zip)$/i, '').replace(/_/g, ' ');
}
// Stable across file extensions and region tags, like the native catalogue titles.
export function favouriteKey(title) {
  return romTitle(title).split('(')[0].trim().toLocaleLowerCase();
}
export function readPreferences(storage) {
  try {
    const value = JSON.parse(storage.getItem('g4tch-preview-v1') || '{}');
    return {theme:value?.theme === 'green' ? 'green' : 'blue',
      sound:value?.sound === true,
      favourites:Array.isArray(value?.favourites) ? value.favourites.filter(x => typeof x === 'string').slice(0,2000) : []};
  } catch { return {theme:'blue',sound:false,favourites:[]}; }
}
export function checkRom(file) {
  if (!/\.(bin|md|gen|smd|zip)$/i.test(file.name)) return 'Choose a Mega Drive .bin, .md, .gen, .smd or individual game .zip.';
  if (!file.size) return 'This file is empty.';
  if (file.size > MAX_ROM_BYTES) return 'Choose one game at a time (up to 32 MB per file), rather than the whole collection ZIP.';
  return '';
}
export function makeGame() {
  const bricks = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
    bricks.push({x: 13 + col * 42, y: 35 + row * 14, w: 39, h: 10, row, alive: true});
  }
  return {paddle: 150, ball: {x: 180, y: 206, vx: 88, vy: -115}, launched: false, score: 0, lives: 3, won: false, over: false, bricks};
}
export function launch(game) { if (!game.over && !game.won) game.launched = true; }
export function stepGame(game, seconds, direction = 0, pointer = null) {
  if (game.over || game.won) return;
  const dt = Math.min(Math.max(seconds, 0), .025);
  game.paddle = Math.max(0, Math.min(300, pointer === null ? game.paddle + direction * 235 * dt : pointer - 30));
  const b = game.ball;
  if (!game.launched) { b.x = game.paddle + 30; b.y = 206; return; }
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < 4 || b.x > 356) { b.x = Math.max(4, Math.min(356, b.x)); b.vx *= -1; }
  if (b.y < 23) { b.y = 23; b.vy = Math.abs(b.vy); }
  if (b.vy > 0 && b.y >= 207 && b.y <= 216 && b.x >= game.paddle - 4 && b.x <= game.paddle + 64) {
    b.y = 206; b.vx = (b.x - game.paddle - 30) * 4; b.vy = -Math.max(90, 145 - Math.abs(b.vx) * .2);
  }
  for (const brick of game.bricks) {
    if (brick.alive && b.x + 3 >= brick.x && b.x - 3 <= brick.x + brick.w && b.y + 3 >= brick.y && b.y - 3 <= brick.y + brick.h) {
      brick.alive = false; b.vy *= -1; game.score += 10; break;
    }
  }
  if (b.y > 244) { game.lives--; game.over = game.lives <= 0; game.launched = false; b.vx = 88; b.vy = -115; b.x = game.paddle + 30; b.y = 206; }
  game.won = game.bricks.every(brick => !brick.alive);
}
