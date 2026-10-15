// Single-threaded FFmpeg runs in a same-origin classic worker. It needs no
// SharedArrayBuffer or special hosting headers, so it works on GitHub Pages.
// Core source/licensing: https://github.com/ffmpegwasm/ffmpeg.wasm
const CORE_BASE='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/';
let engine;
async function loadEngine(){
 self.postMessage({type:'status',message:'Loading the video engine (about 32 MB on first use)…'});
 importScripts(CORE_BASE+'ffmpeg-core.js');
 engine=await self.createFFmpegCore({mainScriptUrlOrBlob:CORE_BASE+'ffmpeg-core.js#'+btoa(JSON.stringify({wasmURL:CORE_BASE+'ffmpeg-core.wasm',workerURL:''}))});
 return engine;
}
self.onmessage=async({data})=>{
 if(data.type!=='compress')return;
 let logs=[];
 try{
  const core=await loadEngine();
  core.setLogger(({message})=>{logs.push(String(message));if(logs.length>30)logs.shift()});
  core.setProgress(({progress})=>self.postMessage({type:'progress',progress}));
  core.FS.writeFile('input',new Uint8Array(data.buffer));
  self.postMessage({type:'started'});
  core.setTimeout(-1);core.exec(...data.args);const code=core.ret;core.reset();
  if(code!==0)throw Error('The encoder could not finish this file.');
  const bytes=core.FS.readFile('output.mp4').slice();
  if(!bytes.byteLength)throw Error('The encoder returned an empty file.');
  self.postMessage({type:'done',buffer:bytes.buffer},[bytes.buffer]);
 }catch(error){self.postMessage({type:'error',message:error.message||'Video compression failed.',details:logs.slice(-8).join('\n')})}
 finally{if(engine)for(const path of ['input','output.mp4'])try{engine.FS.unlink(path)}catch{}}
};
