import {compressionArgs,MAX_INPUT_BYTES,formatBytes,outputName} from './video-compressor-core.js';
const $=id=>document.getElementById(id),form=$('compress-form'),picker=$('compress-input'),drop=$('compress-drop'),original=$('compress-original'),result=$('compress-result'),output=$('compress-output'),status=$('compress-status'),progress=$('compress-progress'),start=$('compress-start'),cancel=$('compress-cancel');
let busy=false,file=null,metadata=null,inputURL=null,outputURL=null,worker=null,job=0,reading=0,loadTimer;
function tell(text){if(status.textContent!==text)status.textContent=text}
function releaseResult(){result.hidden=true;output.removeAttribute('src');output.load();if(outputURL)URL.revokeObjectURL(outputURL);outputURL=null;$('compress-download').removeAttribute('href')}
function setBusy(value){busy=value;form.setAttribute('aria-busy',String(busy));for(const el of form.elements)el.disabled=busy;cancel.disabled=!busy;start.disabled=busy||!file;drop.setAttribute('aria-disabled',String(busy));if(!busy)$('compress-target').disabled=$('compress-mode').value!=='target'}
function stop(message='Cancelled. Your original video is unchanged.'){
 job++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);progress.value=0;setBusy(false);tell(message);
}
async function choose(candidate){
 if(!candidate||busy)return;
 const request=++reading;releaseResult();file=null;metadata=null;start.disabled=true;
 if(inputURL)URL.revokeObjectURL(inputURL);inputURL=null;original.removeAttribute('src');original.load();
 $('compress-file-info').textContent='No video selected.';
 if(!/\.(mp4|m4v|mov|webm)$/i.test(candidate.name)){tell('Choose an MP4, M4V, MOV or WebM video.');return}
 if(candidate.size>MAX_INPUT_BYTES){tell('This browser tool currently accepts files up to 500 MB. Please choose a smaller clip.');return}
 if(!candidate.size){tell('That file is empty. Please choose another video.');return}
 const url=URL.createObjectURL(candidate);inputURL=url;original.src=url;
 tell('Reading the video…');
 try{
  const info=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{cleanup();reject(Error('Video details took too long to load. Try another MP4.'))},15000);
   function cleanup(){clearTimeout(timer);original.removeEventListener('loadedmetadata',loaded);original.removeEventListener('error',failed)}
   function loaded(){const value={duration:original.duration,width:original.videoWidth,height:original.videoHeight};cleanup();resolve(value)}
   function failed(){cleanup();reject(Error('This browser cannot read that video. Try a standard H.264 MP4.'))}
   original.addEventListener('loadedmetadata',loaded);original.addEventListener('error',failed);
   if(original.readyState>=1)loaded();
  });
  if(request!==reading)return;
  if(!Number.isFinite(info.duration)||info.duration<=0||!info.width||!info.height)throw Error('This file has no readable video duration or picture.');
  file=candidate;metadata=info;start.disabled=false;
  $('compress-file-info').textContent=`${file.name} · ${formatBytes(file.size)} · ${info.width} × ${info.height} · ${Math.floor(info.duration/60)}m ${Math.round(info.duration%60)}s`;
  tell('Ready. Choose a preset, then compress. Your original stays unchanged.');
 }catch(error){if(request===reading)tell(error.message)}
}
picker.addEventListener('change',()=>choose(picker.files[0]));
for(const name of ['dragenter','dragover'])drop.addEventListener(name,e=>{e.preventDefault();if(!busy)drop.classList.add('is-dragging')});
for(const name of ['dragleave','drop'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('is-dragging')});
drop.addEventListener('drop',e=>choose(e.dataTransfer.files[0]));
$('compress-mode').addEventListener('change',()=>{$('compress-target').disabled=$('compress-mode').value!=='target'});
cancel.addEventListener('click',()=>stop());
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!file||busy)return;
 let args;
 try{args=compressionArgs({preset:$('compress-preset').value,height:Number($('compress-resolution').value),mode:$('compress-mode').value,targetMB:Number($('compress-target').value),duration:metadata.duration,removeAudio:$('compress-mute').checked,speed:$('compress-speed').value})}catch(error){tell(error.message);return}
 if(!window.Worker||!window.WebAssembly){tell('This browser needs Web Workers and WebAssembly. Try an up-to-date Chrome, Edge, Firefox or Safari.');return}
 releaseResult();setBusy(true);progress.removeAttribute('value');tell('Preparing the video…');original.pause();
 const run=++job,source=file;
 try{
  const buffer=await source.arrayBuffer();if(run!==job)return;
  worker=new Worker(new URL('./video-compressor-worker.js',import.meta.url));
  loadTimer=setTimeout(()=>{if(run===job)stop('The video engine could not load in time. Check your connection and try again.')},180000);
  worker.onerror=()=>{if(run===job)stop('The video engine stopped. Your device may be low on memory, or the engine download was blocked. Try a smaller clip and close other tabs.')};
  worker.onmessage=({data})=>{
   if(run!==job)return;
   if(data.type==='status')tell(data.message);
   if(data.type==='started'){clearTimeout(loadTimer);progress.value=0;tell('Compressing… Keep this tab open. Larger videos can take several minutes.')}
   if(data.type==='progress'&&Number.isFinite(data.progress)){const percent=Math.min(99,Math.max(0,Math.round(data.progress*100)));progress.value=percent;tell(`Compressing… ${percent}%. Keep this tab open.`)}
   if(data.type==='error'){stop(data.message+' Try a smaller clip, a lower resolution or a different MP4.');$('compress-diagnostics').hidden=!data.details;$('compress-log').textContent=data.details||''}
   if(data.type==='done'){
    clearTimeout(loadTimer);worker.terminate();worker=null;setBusy(false);progress.value=100;
    const blob=new Blob([data.buffer],{type:'video/mp4'});outputURL=URL.createObjectURL(blob);output.src=outputURL;
    const link=$('compress-download');link.href=outputURL;link.download=outputName(source.name);
    const saving=Math.round((1-blob.size/source.size)*100);
    $('compress-summary').textContent=`${formatBytes(source.size)} → ${formatBytes(blob.size)} · ${saving>0?saving+'% smaller':saving===0?'about the same size':Math.abs(saving)+'% larger'}`;
    $('compress-advice').textContent=saving>0?'Preview the result, then save your MP4.': 'This file was already efficiently compressed. Try “Smallest file” or a lower resolution; keep the original if it looks better.';
    result.hidden=false;tell('Compression complete. Preview your video and download when ready.');result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
   }
  };
  $('compress-diagnostics').hidden=true;$('compress-log').textContent='';
  worker.postMessage({type:'compress',buffer,args},[buffer]);
 }catch(error){if(run===job)stop('Could not start compression. '+error.message)}
});
window.addEventListener('pagehide',()=>{if(worker)worker.terminate();clearTimeout(loadTimer);if(inputURL)URL.revokeObjectURL(inputURL);if(outputURL)URL.revokeObjectURL(outputURL)});
