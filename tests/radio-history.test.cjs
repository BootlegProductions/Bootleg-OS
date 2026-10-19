const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const store=new Map(),events={},timers=new Map();let nextTimer=1;
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
class Audio {
 constructor(){this.listeners={};this.currentTime=0;this.duration=120;this.readyState=4;}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 emit(k){for(const f of this.listeners[k]||[])f()}
 load(){} pause(){this.emit('pause')} play(){this.emit('play');return Promise.resolve()}
}
const elements={};function element(){return {dataset:{},style:{},setAttribute(){},addEventListener(){},querySelector:s=>elements[s]??=element(),append(){},classList:{toggle(){}}};}
let audio,click;
const station=(id,url)=>({id,name:id,frequency:'89 FM',tracks:[{title:id,url}]});
const sandbox={window:{BOOTLEG_RADIO_STATIONS:[station('oldies','https://archive.org/a.mp3'),station('western','https://archive.org/b.mp3')],addEventListener(k,f){events[k]=f}},document:{body:{appendChild(v){if(v instanceof Audio)audio=v},append(){}},querySelector:s=>elements[s]??=element(),querySelectorAll:()=>[],createElement:element,addEventListener(k,f){if(k==='click')click=f}},Audio,localStorage:storage,sessionStorage:storage,clearTimeout:id=>timers.delete(id),setTimeout:fn=>{const id=nextTimer++;timers.set(id,fn);return id},console};
vm.runInNewContext(fs.readFileSync(new URL('../js/radio-player.js','file://'+__filename),'utf8'),sandbox);
click({target:{closest:s=>s==='[data-play-radio]'?{}:null}});
audio.currentTime=42;
const staleWatchdogs=[...timers.values()];
events.pagehide();
assert.equal(store.get('bootlegRadioTime'),'42');
assert.equal(timers.size,0);
audio.emit('ended');staleWatchdogs.forEach(fn=>fn());
assert.equal(audio.src,'https://archive.org/a.mp3');
// A newer page tuned a different station. Back must use that saved state.
store.set('bootlegRadioStation','1');store.set('bootlegRadioTrack','0');store.set('bootlegRadioTime','17');
events.pageshow({persisted:true});audio.emit('loadedmetadata');
assert.equal(audio.src,'https://archive.org/b.mp3');
assert.equal(audio.currentTime,17);
assert.equal(store.get('bootlegRadioWanted'),'1');
console.log('Radio history: frozen watchdog ignored, no hidden-page advance, latest station and seek restored.');
