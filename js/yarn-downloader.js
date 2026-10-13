const $=id=>document.getElementById(id);
let job=null;
function total(){const n=Number($('yarn-before').value)+Number($('yarn-after').value)+1;$('yarn-total').textContent=`Up to ${n} clips including the starting clip; collection stops at the end of a scene.`;}
$('yarn-before').addEventListener('input',total);$('yarn-after').addEventListener('input',total);total();
$('yarn-form').addEventListener('submit',e=>{
  e.preventDefault();
  try{const u=new URL($('yarn-url').value.trim());if(u.protocol!=='https:'||!['getyarn.io','www.getyarn.io'].includes(u.hostname)||!/^\/yarn-clip\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\/?$/i.test(u.pathname))throw Error('Paste a full Yarn clip link.');
  job={version:1,url:`https://getyarn.io${u.pathname.replace(/\/$/,'')}`,before:Number($('yarn-before').value),after:Number($('yarn-after').value)};
  $('yarn-job').hidden=false;$('yarn-status').textContent=`Batch ready: ${job.before} before + starting clip + ${job.after} after.`;$('yarn-open').href=job.url;
  }catch(error){$('yarn-job').hidden=false;$('yarn-status').textContent=error.message;$('yarn-open').removeAttribute('href');job=null;}
});
$('yarn-export').addEventListener('click',()=>{if(!job)return;const url=URL.createObjectURL(new Blob([JSON.stringify(job,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Bootleg-Yarn-Batch.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
