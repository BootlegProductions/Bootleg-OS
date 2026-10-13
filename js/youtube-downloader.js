(() => {
 const form=document.querySelector('#yt-form'),status=document.querySelector('#yt-status'),start=document.querySelector('#yt-start'),cancel=document.querySelector('#yt-cancel'),progress=document.querySelector('#yt-progress'),download=document.querySelector('#yt-download');
 let api,job,stopped=false;
 try {const u=new URL(window.BOOTLEG_DOWNLOAD_API);if(u.protocol!=='https:')throw Error();api=u.origin}catch{status.textContent='The new download service is awaiting hosting. Downloads will become available here once it is connected.';return}
 async function request(path,options={}){const r=await fetch(api+path,{...options,signal:AbortSignal.timeout(path==='/health'?120000:25000)});const data=await r.json();if(!r.ok)throw Error(data.error||'The download service is unavailable.');return data}
 status.textContent='Connecting to the download service… The first connection may take a minute while it wakes up.';
 request('/health').then(()=>{status.textContent='Ready. Paste a video link to begin.';start.disabled=false}).catch(()=>{status.textContent='The download service is offline. Please try again later.'});
 document.querySelector('#yt-format').addEventListener('change',e=>{document.querySelector('#yt-quality').disabled=e.target.value==='mp3'});
 cancel.addEventListener('click',async()=>{stopped=true;try{await request('/jobs/'+job,{method:'DELETE'})}catch{}status.textContent='Download cancelled.';cancel.hidden=true;start.disabled=false;progress.hidden=true});
 form.addEventListener('submit',async e=>{
  e.preventDefault();stopped=false;start.disabled=true;download.hidden=true;cancel.hidden=true;progress.hidden=false;progress.removeAttribute('value');status.textContent='Checking video…';document.querySelector('#yt-title').textContent='';
  try{
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
