(() => {
 const form=document.querySelector('#yt-form'),status=document.querySelector('#yt-status'),start=document.querySelector('#yt-start'),cancel=document.querySelector('#yt-cancel'),progress=document.querySelector('#yt-progress'),download=document.querySelector('#yt-download');
 let api='http://127.0.0.1:47832',job,stopped=false;
 let local=true;
 try {const u=new URL(window.BOOTLEG_DOWNLOAD_API);if(u.protocol!=='https:')throw Error();api=u.origin;local=false}catch{}
 async function request(path,options={}){const r=await fetch(api+path,{...options,signal:AbortSignal.timeout(path==='/health'?120000:25000)});const data=await r.json();if(!r.ok)throw Error(data.error||'The download service is unavailable.');return data}
 const pilot=new URLSearchParams(location.search).get('pilot')==='1';
 if(local&&!pilot){status.textContent='YouTube downloads are unavailable while the Windows helper is being prepared.';return}
 const tools=document.querySelector('#yt-tools'), unavailable=document.querySelector('#yt-unavailable');
 if(tools)tools.hidden=false;
 if(unavailable)unavailable.hidden=true;
 status.textContent=local?'Start Bootleg Helper on this PC, then click Download.':'Paste a video link to begin.';
 start.disabled=false;
 document.querySelector('#yt-format').addEventListener('change',e=>{document.querySelector('#yt-quality').disabled=e.target.value==='mp3'});
 cancel.addEventListener('click',async()=>{stopped=true;try{await request('/jobs/'+job,{method:'DELETE'})}catch{}status.textContent='Download cancelled.';cancel.hidden=true;progress.hidden=true});
 form.addEventListener('submit',async e=>{
  e.preventDefault();stopped=false;start.disabled=true;download.hidden=true;cancel.hidden=true;progress.hidden=false;progress.removeAttribute('value');status.textContent='Checking video…';document.querySelector('#yt-title').textContent='';
  try{
   if(local){
    status.textContent='Connecting to Bootleg Helper…';
    let health;
    try {const response=await fetch(api+'/health',{signal:AbortSignal.timeout(30000)});if(response.ok)health=await response.json()}catch{}
    if(!health?.localHelper)throw Error('Start Bootleg Helper on this PC and allow the browser to connect, then try again.');
   }
   const data=await request('/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:document.querySelector('#yt-url').value,format:document.querySelector('#yt-format').value,quality:document.querySelector('#yt-quality').value})});job=data.id;cancel.hidden=false;
   while(!stopped){const j=await request('/jobs/'+job);if(stopped)return;document.querySelector('#yt-title').textContent=j.title||'';
    if(j.status==='failed')throw Error(j.error);if(j.status==='cancelled'){status.textContent='Download cancelled.';break}
    if(j.status==='ready'){progress.value=100;status.textContent='Ready. Your file is available for 30 minutes from when you started.';download.href=api+'/jobs/'+job+'/file';download.hidden=false;break}
    status.textContent=j.status==='checking'?'Checking video…':j.status==='converting'?'Converting your file…':`Downloading… ${Math.round(j.progress)}%`;if(j.progress)progress.value=j.progress;
    await new Promise(r=>setTimeout(r,1200));
   }
  }catch(error){if(!stopped)status.textContent=error.message;progress.hidden=true}finally{start.disabled=false;cancel.hidden=true}
 });
})();
