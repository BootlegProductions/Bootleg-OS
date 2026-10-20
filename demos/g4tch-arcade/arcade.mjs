import {romTitle, checkRom, makeGame, launch, stepGame, favouriteKey, readPreferences} from './arcade-model.mjs?v=2';
const $ = id => document.getElementById(id);
let view = 'boot', selected = 'test', game = makeGame(), paused = false, pointer = null, direction = 0, last = performance.now();
let padAction = false, padVertical = 0, emulationFrame = null;
const keys = new Set();
// Storage can be unavailable in an embedded/private browser. The tool still works.
let storage;
try { storage = window.localStorage; } catch {}
const preferences = readPreferences(storage);
const favourites = new Set(preferences.favourites);
let favouritesOnly = false, soundEnabled = preferences.sound;
const introAudio = new Audio('prism-original.mp3');
introAudio.preload = 'none'; introAudio.volume = .4;
function savePreferences() {
  try { storage?.setItem('g4tch-preview-v1',JSON.stringify({theme:document.body.dataset.theme,sound:soundEnabled,favourites:[...favourites]})); } catch {}
}
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  $('theme-label').textContent = theme === 'green' ? 'MU/TH/UR TERMINAL' : 'OCP / CITY PATROL';
}
function playIntro() {
  introAudio.pause(); introAudio.currentTime = 0;
  if (soundEnabled) introAudio.play().catch(() => {
    $('library-status').textContent = 'Intro sound could not play. The cabinet is still available.';
  });
}
function soundLabel() {
  $('sound').textContent = soundEnabled ? 'Intro sound on' : 'Intro sound off';
  $('sound').setAttribute('aria-pressed',String(soundEnabled));
}
applyTheme(preferences.theme); soundLabel();
const catalogue = [{id:'test', title:'Prism Break', description:'A built-in paddle game to try the cabinet. No ROM needed.'}];
let filtered = catalogue.slice();
function show(next) {
  view = next;
  if (next !== 'boot') introAudio.pause();
  for (const id of ['boot','library','play']) $(id).hidden = id !== next;
}
function choose(id) {
  selected = id;
  const item = catalogue.find(x => x.id === id);
  $('game-title').textContent = item?.title || 'No matching cartridge';
  $('game-description').textContent = item?.description || 'Try a different search, or add a ROM.';
  $('launch').disabled = !item;
  const starred = !!item && favourites.has(favouriteKey(item.title));
  $('star').disabled = !item;
  $('star').textContent = starred ? '★ Favourited' : '☆ Favourite';
  $('star').setAttribute('aria-pressed',String(starred));
  $('games').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.id === id)));
}
function renderLibrary() {
  const query = $('search').value.trim().toLocaleLowerCase();
  filtered = catalogue.filter(x => x.title.toLocaleLowerCase().includes(query) && (!favouritesOnly || favourites.has(favouriteKey(x.title))));
  $('games').replaceChildren();
  for (const item of filtered) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.id = item.id;
    button.textContent = (favourites.has(favouriteKey(item.title)) ? '★ ' : '') + item.title; button.addEventListener('click',() => choose(item.id)); $('games').append(button);
  }
  if (!filtered.length) { const p = document.createElement('p');p.textContent=favouritesOnly ? 'No favourites match. Choose All games to star a cartridge.' : 'No matches.'; $('games').append(p); }
  choose(filtered.some(x => x.id === selected) ? selected : filtered[0]?.id);
}
function leaveGame() {
  emulationFrame?.remove(); emulationFrame = null; keys.clear(); direction = 0; pointer = null;
  show('library'); $('launch').focus();
}
function pauseGame(value) {
  paused = value; $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('game-status').textContent = paused ? 'Paused. Press P or Resume to continue.' : '← → / A D move · Space launches · P pauses · drag or controller also works';
}
function runSelected() {
  const item = catalogue.find(x => x.id === selected); if (!item) return;
  show('play');$('playing-title').textContent = item.title; const test = item.id === 'test';
  $('test-game').hidden = !test; $('rom-game').hidden = test; $('pause').hidden = !test; $('restart').hidden = !test;
  emulationFrame?.remove(); emulationFrame = null;
  if (test) { game = makeGame(); pauseGame(false); $('screen').focus(); }
  else {
    const frame = document.createElement('iframe');frame.src = 'emulator.html?v=1';frame.title = 'Mega Drive player: '+item.title;
    frame.allow='autoplay; fullscreen; gamepad';frame.allowFullscreen=true;
    frame.addEventListener('load', () => frame.contentWindow.postMessage({type:'g4tch-load-rom',file:item.file},location.origin),{once:true});
    $('rom-game').replaceChildren(frame);emulationFrame=frame;
  }
}
function serve() {
  if (game.over || game.won) game = makeGame();
  if (paused) pauseGame(false);
  launch(game);$('screen').focus();
}
$('start').addEventListener('click',()=>{show('library');$('search').focus();});
$('intro').addEventListener('click',()=>{emulationFrame?.remove();emulationFrame=null;show('boot');playIntro();$('start').focus();});
$('theme').addEventListener('click',()=>{
  applyTheme(document.body.dataset.theme === 'green' ? 'blue' : 'green'); savePreferences();
});
$('sound').addEventListener('click',()=>{
  soundEnabled = !soundEnabled; soundLabel(); savePreferences();
  if (soundEnabled && view === 'boot') playIntro(); else introAudio.pause();
});
$('favourites').addEventListener('click',()=>{
  favouritesOnly = !favouritesOnly;
  $('favourites').setAttribute('aria-pressed',String(favouritesOnly));
  $('favourites').textContent = favouritesOnly ? 'Show all games' : 'Favourites / all'; renderLibrary();
});
$('star').addEventListener('click',()=>{
  const item = catalogue.find(x => x.id === selected); if (!item) return;
  const key = favouriteKey(item.title);
  if (favourites.has(key)) favourites.delete(key); else favourites.add(key);
  savePreferences(); renderLibrary();
});
$('full').addEventListener('click',async()=>{
  try { if(document.fullscreenElement) await document.exitFullscreen(); else await $('cabinet').requestFullscreen(); }
  catch { $('library-status').textContent='Fullscreen is unavailable here. Open the preview in its own tab for more space.'; }
});
$('search').addEventListener('input',renderLibrary);
$('pick').addEventListener('click',()=>$('roms').click());
$('roms').addEventListener('change',()=>{
  let added=0;const errors=[];
  for(const file of $('roms').files) {
    const error=checkRom(file);if(error){errors.push(error);continue;}
    if(catalogue.some(x=>x.file?.name===file.name&&x.file?.size===file.size))continue;
    catalogue.push({id:'rom-'+catalogue.length,title:romTitle(file.name),file,description:'Mega Drive cartridge · '+(file.size/1024/1024).toFixed(1)+' MB · browser emulation'});added++;
  }
  $('search').value='';if(favouritesOnly)$('favourites').click();renderLibrary();$('library-status').textContent=(added?added+' cartridge'+(added===1?'':'s')+' added. ':'')+(errors[0]||'Select a game, then launch. Files stay in this browser tab.');
  $('roms').value='';
});
$('launch').addEventListener('click',runSelected);$('back').addEventListener('click',leaveGame);
$('pause').addEventListener('click',()=>pauseGame(!paused));$('restart').addEventListener('click',()=>{game=makeGame();pauseGame(false);$('screen').focus();});$('serve').addEventListener('click',serve);
for(const [id,dir] of [['left',-1],['right',1]]) {
  const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);direction=dir;pointer=null;});
  for(const event of ['pointerup','pointercancel','lostpointercapture']) b.addEventListener(event,()=>direction=0);
}
const canvas=$('screen'),ctx=canvas.getContext('2d');
let dragging=false;
function movePointer(e){const rect=canvas.getBoundingClientRect();pointer=(e.clientX-rect.left)/rect.width*360;}
canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);movePointer(e);serve();});
canvas.addEventListener('pointermove',e=>{if(dragging)movePointer(e);});
for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>{dragging=false;pointer=null;});
document.addEventListener('keydown',e=>{
  if(view === 'library' && e.ctrlKey && e.key.toLowerCase() === 'd') {e.preventDefault();if(!e.repeat)$('star').click();return;}
  if(e.target.matches('input,textarea'))return;
  if(view==='boot'&&e.key==='Enter'){e.preventDefault();$('start').click();return;}
  if(view==='play'&&selected==='test'&&['ArrowLeft','ArrowRight','a','A','d','D',' ','p','P','Escape'].includes(e.key)){
    e.preventDefault();keys.add(e.key.toLowerCase());pointer=null;
    if(!e.repeat&&e.key===' ')serve();
    if(!e.repeat&&/^[pP]$/.test(e.key))pauseGame(!paused);
    if(e.key==='Escape')leaveGame();
  }
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();direction=0;if(view==='play'&&selected==='test')pauseGame(true);});
function draw() {
  ctx.fillStyle='#071020';ctx.fillRect(0,0,360,240);
  ctx.font='9px monospace';ctx.fillStyle='#a3e8db';ctx.fillText('PRISM BREAK',10,14);ctx.fillText('SCORE '+game.score,139,14);ctx.fillText('LIVES '+game.lives,295,14);
  const colours=['#ff8592','#ffc172','#91efac','#7bdaff'];
  for(const brick of game.bricks)if(brick.alive){ctx.fillStyle=colours[brick.row];ctx.fillRect(brick.x,brick.y,brick.w,brick.h);}
  ctx.fillStyle='#c9f5ee';ctx.fillRect(game.paddle,212,60,6);ctx.beginPath();ctx.arc(game.ball.x,game.ball.y,3,0,Math.PI*2);ctx.fill();
  if(!game.launched||paused||game.over||game.won){ctx.fillStyle='#071020db';ctx.fillRect(45,112,270,49);ctx.fillStyle='#eaf8f4';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(game.won?'SPECTRUM CLEARED':game.over?'GAME OVER':paused?'PAUSED':'SPACE / LAUNCH TO START',180,133);ctx.font='9px monospace';ctx.fillText(game.over||game.won?'Launch / continue to play again':'Keep the signal alive',180,149);ctx.textAlign='left';}
}
function frame(now) {
  const dt=(now-last)/1000;last=now;
  const pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);
  $('controller').textContent=pad?'USB / CONTROLLER CONNECTED':'KEYBOARD / TOUCH';
  let padDir=0;
  if(pad&&document.hasFocus()) {
    padDir=pad.buttons[14]?.pressed?-1:pad.buttons[15]?.pressed?1:Math.abs(pad.axes[0]||0)>.2?pad.axes[0]:0;
    const action=!!(pad.buttons[0]?.pressed||pad.buttons[9]?.pressed);
    const vertical=pad.buttons[12]?.pressed?-1:pad.buttons[13]?.pressed?1:Math.abs(pad.axes[1]||0)>.6?Math.sign(pad.axes[1]):0;
    if(action&&!padAction){if(view==='boot')$('start').click();else if(view==='library')runSelected();else if(selected==='test')serve();}
    if(view==='library'&&vertical&&vertical!==padVertical&&filtered.length){const i=filtered.findIndex(x=>x.id===selected);choose(filtered[(i+vertical+filtered.length)%filtered.length].id);$('games').querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest'});}
    padAction=action;padVertical=vertical;
  } else {padAction=false;padVertical=0;}
  if(view==='play'&&selected==='test') {
    const keyboard=keys.has('arrowleft')||keys.has('a')?-1:keys.has('arrowright')||keys.has('d')?1:0;
    if(!paused&&!document.hidden)stepGame(game,dt,keyboard||direction||padDir,pointer);
    draw();
  }
  requestAnimationFrame(frame);
}
renderLibrary();requestAnimationFrame(frame);
