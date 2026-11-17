// A bounded, temporary-file download service. No shell commands or arbitrary URLs.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp, readdir, stat, rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
export function youtubeURL(input){
 let u;try{u=new URL(input)}catch{throw Error('Enter a valid YouTube link.')}
 if(u.protocol!=='https:' || u.username || u.password || u.port)throw Error('Use an HTTPS YouTube link.');
 let id;
 if(u.hostname==='youtu.be')id=u.pathname.slice(1);
 else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)){
  if(u.pathname==='/watch')id=u.searchParams.get('v');
  else if(/^\/(shorts|embed)\//.test(u.pathname))id=u.pathname.split('/')[2];
 }
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id||''))throw Error('Use a link to one YouTube video, not a channel or playlist.');
 return 'https://www.youtube.com/watch?v='+id;
}
export function formatArgs(format,quality){
 if(!['mp4','mp3'].includes(format)||!['720','1080'].includes(quality))throw Error('Choose MP4 or MP3 and a supported quality.');
 return format==='mp3'?['-f','bestaudio/best','-x','--audio-format','mp3','--audio-quality','192K']:
 ['-f',`bv*[height<=${quality}][ext=mp4]+ba[ext=m4a]/b[height<=${quality}][ext=mp4]`,'--merge-output-format','mp4'];
}
function run(args,{onLine,signal,timeout=180000}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.env.YTDLP||'yt-dlp',['--no-playlist','--no-warnings','--js-runtimes','node',...args],{signal});
  let stdout='',stderr='',pending='';
  child.stdout.on('data',chunk=>{stdout+=chunk;pending+=chunk;const lines=pending.split('\n');pending=lines.pop();lines.forEach(l=>onLine?.(l));if(stdout.length>2000000)child.kill()});
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-4000)});
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeout);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.on('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(Error(stderr.includes('Sign in')?'YouTube is blocking this server. Try again later; this video cannot currently be downloaded.':stderr.slice(-600)||'Download stopped or timed out.'))});
 });
}
export function createService({localHost, localRoute} = {}){
 const jobs=new Map(),rates=new Map();let active=0;
 const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);
 const sweep=setInterval(()=>{const now=Date.now();for(const [id,j]of jobs)if(now-j.created>1800000){j.abort.abort();jobs.delete(id);rm(j.dir,{recursive:true,force:true}).catch(()=>{})}for(const [ip,r]of rates)if(now-r.start>60000)rates.delete(ip)},60000);sweep.unref();
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(localHost && (req.headers.host !== localHost ||
      (['POST','DELETE'].includes(req.method) && !allowed.includes(origin)))) {
    res.writeHead(403);res.end();return;
  }
  if(origin&&!allowed.includes(origin)){res.writeHead(403);res.end();return}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin')}
  res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');if(localHost&&origin&&req.headers['access-control-request-private-network']==='true')res.setHeader('Access-Control-Allow-Private-Network','true');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))};
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  const path=new URL(req.url,'http://service').pathname;
  if(path==='/health'&&req.method==='GET'){json(200,{ready:true,formats:['mp4','mp3'],maxMinutes:30,...(localHost?{localHelper:true}:{})});return}
  try{
   if(localRoute && await localRoute({path,req,res,json}))return;
   const match=path.match(/^\/jobs\/([a-f0-9]{48})(\/file)?$/);
   if(match){
    const j=jobs.get(match[1]);if(!j){json(404,{error:'This download expired. Create a new one.'});return}
    if(req.method==='DELETE'&&!match[2]){j.abort.abort();j.status='cancelled';json(200,{status:j.status});return}
    if(req.method!=='GET'){json(405,{error:'Method not supported.'});return}
    if(match[2]){
     if(j.status!=='ready'){json(409,{error:'The file is not ready.'});return}
     res.writeHead(200,{'Content-Type':j.format==='mp3'?'audio/mpeg':'video/mp4','Content-Length':j.size,'Content-Disposition':`attachment; filename="bootleg-${j.videoId}.${j.format}"`});const stream=createReadStream(j.file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return;
    }
    json(200,{status:j.status,progress:j.progress,title:j.title,error:j.error});return;
   }
   if(path!=='/jobs'||req.method!=='POST'){json(404,{error:'Route not found.'});return}
   const ip=req.socket.remoteAddress;let r=rates.get(ip);if(!r||Date.now()-r.start>60000){r={start:Date.now(),count:0};rates.set(ip,r)}
   if(++r.count>5){json(429,{error:'Please wait a minute before starting another download.'});return}
   if(active>=2){json(503,{error:'Both download slots are busy. Try again shortly.'});return}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){json(413,{error:'Request too large.'});return}}
   let data;try{data=JSON.parse(body)}catch{throw Error('Invalid request.')}
   const url=youtubeURL(data.url),args=formatArgs(data.format,data.quality);
   const id=randomBytes(24).toString('hex'),dir=await mkdtemp(join(tmpdir(),'bootleg-'));
   const j={created:Date.now(),status:'checking',progress:0,dir,format:data.format,videoId:url.split('=')[1],abort:new AbortController()};jobs.set(id,j);active++;
   json(202,{id});
   (async()=>{
    try{
     const meta=JSON.parse(await run(['--dump-single-json','--skip-download',url],{signal:j.abort.signal,timeout:60000}));
     if(meta.is_live||!meta.duration||meta.duration>1800)throw Error('Choose a completed video up to 30 minutes long.');
     j.title=meta.title;j.status='downloading';
     await run([...args,'--max-filesize','250M','--newline','--progress-template','download:PROGRESS:%(progress._percent_str)s','-o',join(dir,'media.%(ext)s'),url],{signal:j.abort.signal,onLine:line=>{if(line.startsWith('PROGRESS:'))j.progress=Math.min(99,parseFloat(line.slice(9))||0);if(line.includes('[Merger]')||line.includes('[ExtractAudio]'))j.status='converting'}});
     const files=(await readdir(dir)).filter(f=>f.endsWith('.'+j.format));if(files.length!==1)throw Error('No complete file was produced.');
     j.file=join(dir,files[0]);j.size=(await stat(j.file)).size;if(j.size>262144000)throw Error('The completed file exceeds the 250 MB limit.');
     j.status='ready';j.progress=100;
    }catch(e){if(j.status!=='cancelled'){j.status='failed';j.error=e.message}await rm(dir,{recursive:true,force:true})}finally{active--}
   })();
  }catch(e){json(400,{error:e.message})}
 });
 server.on('close',()=>{clearInterval(sweep);for(const j of jobs.values()){j.abort.abort();rm(j.dir,{recursive:true,force:true}).catch(()=>{})}});return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createService().listen(Number(process.env.PORT)||10000,'0.0.0.0');
