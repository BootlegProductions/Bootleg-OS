@echo off
setlocal
title Bootleg Helper Setup
set "BOOTLEG_SETUP_PATH=%~f0"
powershell.exe -NoLogo -NoProfile -Command "$setup=[IO.File]::ReadAllText($env:BOOTLEG_SETUP_PATH); $marker=[regex]::Match($setup,'(?m)^::BOOTLEG_POWERSHELL\r?$'); $files=[regex]::Match($setup,'(?m)^::BOOTLEG_FILE '); if(-not $marker.Success -or -not $files.Success -or $files.Index -le $marker.Index){exit 1}; $start=$marker.Index+$marker.Length; & ([scriptblock]::Create($setup.Substring($start,$files.Index-$start)))"
if errorlevel 1 (
  echo.
  echo Setup did not finish. Keep this window open to read the error.
  pause
  exit /b 1
)
exit /b 0
::BOOTLEG_POWERSHELL
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Save-VerifiedFile($url, $destination, $sha256) {
    if ($sha256 -notmatch '^[0-9a-f]{64}$') { throw 'The publisher checksum could not be read.' }
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $destination -TimeoutSec 300
    if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $sha256) {
        throw 'A download did not match the publisher checksum. Setup stopped.'
    }
}

$stage = $null
try {
    if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64' -and $env:PROCESSOR_ARCHITEW6432 -ne 'AMD64') {
        throw 'This version of Bootleg Helper requires 64-bit Intel or AMD Windows.'
    }
    Write-Host 'Bootleg Helper for Yarn and YouTube'
    Write-Host 'Setup downloads the required tools, installs for your Windows account, and starts the helper when you sign in.'
    $root = Join-Path $env:LOCALAPPDATA 'BootlegOS'
    $install = Join-Path $root 'Helper'
    $startup = [Environment]::GetFolderPath('Startup')
    if (-not $startup) { throw 'Windows did not provide a Startup folder.' }
    $answer = Read-Host '[I] Install or update  [U] Uninstall  [Enter] Exit'
    if ($answer -eq 'u') {
        $oldNode = Join-Path $install 'bin\node.exe'
        Get-Process -Name 'node' -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -eq $oldNode } |
            Stop-Process -Force
        $link = Join-Path $startup 'Bootleg Helper.lnk'
        if (Test-Path -LiteralPath $link) { Remove-Item -LiteralPath $link -Force }
        if (Test-Path -LiteralPath $install) { Remove-Item -LiteralPath $install -Recurse -Force }
        Write-Host 'Bootleg Helper has been removed. Your downloads are kept.'
        Read-Host 'Press Enter to close setup' | Out-Null
        exit 0
    }
    if ($answer -ne 'i') { exit 0 }
    $stage = Join-Path $root ('setup-' + [guid]::NewGuid().ToString('N'))
    $payload = Join-Path $stage 'Helper'
    $bin = Join-Path $payload 'bin'
    New-Item -ItemType Directory -Path $bin -Force | Out-Null

    Write-Host '1 of 3: Downloading Node.js...'
    Save-VerifiedFile 'https://nodejs.org/dist/v24.22.3/win-x64/node.exe' (Join-Path $bin 'node.exe') '86fc4785327db5f5c7558dc6156c543b433c313e813a222e088086222ab4afa6'

    Write-Host '2 of 3: Downloading yt-dlp...'
    $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest' -Headers @{'User-Agent' = 'Bootleg-OS-Helper-Setup'} -TimeoutSec 60
    if ($release.tag_name -notmatch '^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$') { throw 'Could not identify the current yt-dlp release.' }
    $ytBase = 'https://github.com/yt-dlp/yt-dlp/releases/download/' + $release.tag_name
    $sums = (Invoke-WebRequest -UseBasicParsing -Uri ($ytBase + '/SHA2-256SUMS') -TimeoutSec 60).Content
    if ($sums -is [byte[]]) { $sums = [Text.Encoding]::UTF8.GetString($sums) }
    $ytHash = [regex]::Match($sums, '(?m)^([0-9a-f]{64})\s+\*?yt-dlp\.exe\s*$').Groups[1].Value
    Save-VerifiedFile ($ytBase + '/yt-dlp.exe') (Join-Path $bin 'yt-dlp.exe') $ytHash

    Write-Host '3 of 3: Downloading FFmpeg (the largest part)...'
    $archive = Join-Path $stage 'ffmpeg.zip'
    Save-VerifiedFile 'https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip' $archive '60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba'
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $stage 'ffmpeg')
    foreach ($name in 'ffmpeg.exe', 'ffprobe.exe') {
        $binary = Get-ChildItem -LiteralPath (Join-Path $stage 'ffmpeg') -Filter $name -File -Recurse | Select-Object -First 1
        if (-not $binary) { throw "FFmpeg archive is missing $name." }
        Copy-Item -LiteralPath $binary.FullName -Destination (Join-Path $bin $name)
    }

    $parts = [regex]::Split($setup, '(?m)^::BOOTLEG_FILE ([a-z-]+\.mjs)\r?\n')
    if ($parts.Length -ne 9) { throw 'The helper files are missing from this download.' }
    for ($i = 1; $i -lt $parts.Length; $i += 2) {
        [IO.File]::WriteAllText((Join-Path $payload $parts[$i]), $parts[$i + 1], [Text.UTF8Encoding]::new($false))
    }

    if (Test-Path -LiteralPath $install) {
        $oldNode = Join-Path $install 'bin\node.exe'
        Get-Process -Name 'node' -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -eq $oldNode } |
            Stop-Process -Force
        $backup = Join-Path $stage 'Previous'
        Move-Item -LiteralPath $install -Destination $backup
    }
    try {
        Move-Item -LiteralPath $payload -Destination $install
        $node = Join-Path $install 'bin\node.exe'
        $started = Start-Process -FilePath $node -ArgumentList 'local-helper.mjs' -WorkingDirectory $install -WindowStyle Hidden -PassThru
        $ready = $false
        for ($i = 0; $i -lt 20 -and -not $started.HasExited; $i++) {
            Start-Sleep -Milliseconds 250
            try {
                $health = Invoke-RestMethod -Uri 'http://127.0.0.1:47832/health' -TimeoutSec 2
                if ($health.localHelper) { $ready = $true; break }
            } catch {}
        }
        if (-not $ready) { throw 'The helper did not start. Another app may already be using port 47832.' }

        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut((Join-Path $startup 'Bootleg Helper.lnk'))
        $shortcut.TargetPath = Join-Path $PSHOME 'powershell.exe'
        $shortcut.Arguments = '-NoProfile -WindowStyle Hidden -Command "Start-Process (Join-Path $env:LOCALAPPDATA ''BootlegOS\Helper\bin\node.exe'') -WorkingDirectory (Join-Path $env:LOCALAPPDATA ''BootlegOS\Helper'') -ArgumentList ''local-helper.mjs'' -WindowStyle Hidden"'
        $shortcut.Save()
    } catch {
        if ($started -and -not $started.HasExited) { Stop-Process -Id $started.Id -Force }
        if (Test-Path -LiteralPath $install) { Remove-Item -LiteralPath $install -Recurse -Force }
        if ($backup -and (Test-Path -LiteralPath $backup)) { Move-Item -LiteralPath $backup -Destination $install }
        throw
    }
    Write-Host 'Bootleg Helper is installed and running.'
    Write-Host 'Return to Bootleg OS and click Download. Choose Allow if your browser asks to connect.'
    Read-Host 'Press Enter to close setup' | Out-Null
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    if ($stage -and (Test-Path -LiteralPath $stage)) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }
}
exit 0
::BOOTLEG_FILE local-helper.mjs
import {existsSync} from 'node:fs';
import {delimiter, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createService} from './server.mjs';
import {collectYarn} from './yarn-sequence.mjs';

const bin = fileURLToPath(new URL('./bin/', import.meta.url));
const binary = join(bin, 'yt-dlp.exe');
if (process.platform === 'win32' && existsSync(binary)) {
  process.env.YTDLP = binary;
  process.env.PATH = [bin, process.env.PATH].filter(Boolean).join(delimiter);
}
const host = '127.0.0.1';
const port = 47832;
const origin = 'https://bootlegproductions.github.io';
process.env.ALLOWED_ORIGINS = origin;
let yarnBusy = false;
const server = createService({
  localHost: `${host}:${port}`,
  async localRoute({path, req, res, json}) {
    if (path !== '/yarn/sequence') return false;
    if (req.method !== 'POST') {
      json(405, {error: 'Use POST to collect a Yarn sequence.'});
      return true;
    }
    if (req.headers['content-type'] !== 'application/json') {
      json(415, {error: 'Expected JSON settings.'});
      return true;
    }
    if (yarnBusy) {
      json(409, {error: 'A Yarn sequence is already collecting.'});
      return true;
    }
    yarnBusy = true;
    const cancelled = new AbortController();
    const cancel = () => cancelled.abort();
    res.once('close', cancel);
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) {
          json(413, {error: 'The batch settings are too large.'});
          return true;
        }
      }
      const signal = AbortSignal.any([cancelled.signal, AbortSignal.timeout(90000)]);
      const archive = await collectYarn(JSON.parse(body), {signal});
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': archive.length,
        'Content-Disposition': 'attachment; filename="bootleg-yarn-sequence.zip"'
      });
      res.end(archive);
    } catch (error) {
      if (!res.destroyed) json(400, {error: error.message});
    } finally {
      res.off('close', cancel);
      yarnBusy = false;
    }
    return true;
  }
});
server.on('error', error => {
  console.error(`Bootleg Helper could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Bootleg Helper ready at http://${host}:${port}. Keep it open while downloading.`));
::BOOTLEG_FILE server.mjs
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
     await run([...args,'--match-filters','duration > 0 & duration <= 1800 & !is_live',
       '--no-simulate','--print','before_dl:BOOTLEG_TITLE:%(title)j',
       '--max-filesize','250M','--progress','--newline','--progress-template','download:PROGRESS:%(progress._percent_str)s',
       '-o',join(dir,'media.%(ext)s'),url],{signal:j.abort.signal,timeout:240000,onLine:line=>{
       if(line.startsWith('BOOTLEG_TITLE:')){
        try{j.title=JSON.parse(line.slice('BOOTLEG_TITLE:'.length))}catch{}
        j.status='downloading';
       }
       if(line.startsWith('PROGRESS:')){
        j.progress=Math.min(99,parseFloat(line.slice(9))||0);
        j.status='downloading';
       }
       if(line.includes('[Merger]')||line.includes('[ExtractAudio]'))j.status='converting';
     }});
     if(j.status==='checking')throw Error('Choose a completed video up to 30 minutes long.');
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
::BOOTLEG_FILE yarn-core.mjs
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function clipId(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !['getyarn.io','www.getyarn.io'].includes(u.hostname)) throw Error('Use an https://getyarn.io/yarn-clip/ link.');
  const id = u.pathname.split('/')[2];
  if (!u.pathname.startsWith('/yarn-clip/') || !UUID.test(id || '')) throw Error('That is not a Yarn clip link.');
  return id.toLowerCase();
}
function decode(s) {return String(s).replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, e => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'}[e.toLowerCase()] ?? String.fromCodePoint(parseInt(e.slice(2,-1).replace(/^x/i,''), /^&#x/i.test(e)?16:10))));}
function attrs(tag) {const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);return a;}
export function parseClip(html,id) {
  if (!UUID.test(id)) throw Error('Invalid clip ID.');
  let previous=null,next=null,video=null,title=id;
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const a=attrs(m[0]);if(!['Previous Clip','Next Clip'].includes(a.title))continue;
    try {const v=clipId(new URL(a.href,'https://getyarn.io').href);if(a.title==='Previous Clip')previous=v;else next=v;}catch{}
  }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a=attrs(m[0]);if(a.property==='og:title')title=a.content||title;
    if(['og:video:url','og:video:secure_url'].includes(a.property)&&a.content) {
      const u=new URL(a.content,'https://getyarn.io');
      if(u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&['y.getyarn.io','y.yarn.co'].includes(u.hostname)&&/\.mp4$/i.test(u.pathname))video=u.href;
    }
  }
  if(!video)throw Error('No MP4 found. The page may be unavailable or Yarn may have changed its layout.');
  return {id,previous,next,video,title};
}
export function filename(index,clip,start) {return `${String(index+1).padStart(3,'0')}${clip.id===start?'_START':''}_${clip.id}.mp4`;}
export function boundedCount(n) {const v=Number(n);if(!Number.isInteger(v)||v<0||v>15)throw Error('Choose 0–15 clips on each side.');return v;}
::BOOTLEG_FILE yarn-sequence.mjs
import {crc32} from 'node:zlib';
import {clipId, parseClip, filename, boundedCount} from './yarn-core.mjs';

const MAX_ZIP_BYTES = 64 * 1024 * 1024;
const MAX_PAGE_BYTES = 1024 * 1024;

async function read(fetcher, url, limit, signal, mime) {
  const response = await fetcher(url, {redirect: 'error', signal});
  if (!response.ok) throw new Error(`Yarn returned HTTP ${response.status}.`);
  if (!response.body || !mime.test(response.headers.get('content-type') || '') ||
      Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Yarn did not return the expected file, or it exceeded the size limit.');
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.byteLength;
    if (length > limit) throw new Error('The sequence exceeds the 64 MB ZIP limit.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

function zip(entries) {
  const files = [], directory = [];
  let offset = 0, directorySize = 0;
  for (const {name, data} of entries) {
    const path = Buffer.from(name);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(path.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(path.length, 28);
    central.writeUInt32LE(offset, 42);
    files.push(local, path, data);
    directory.push(central, path);
    offset += local.length + path.length + data.length;
    directorySize += central.length + path.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, ...directory, end]);
}

export async function collectYarn({url, before, after}, {fetcher = fetch, signal = AbortSignal.timeout(90000)} = {}) {
  const start = clipId(url);
  const counts = [boundedCount(before), boundedCount(after)];
  async function readClip(id) {
    const page = await read(fetcher, `https://getyarn.io/yarn-clip/${id}`, MAX_PAGE_BYTES, signal, /^text\/html\b/i);
    return parseClip(page.toString('utf8'), id);
  }
  const center = await readClip(start);
  const clips = [center], seen = new Set([start]);
  for (const [index, direction] of ['previous', 'next'].entries()) {
    let current = center;
    for (let i = 0; i < counts[index]; i++) {
      const id = current[direction];
      if (!id || seen.has(id)) break;
      seen.add(id);
      current = await readClip(id);
      if (direction === 'previous') clips.unshift(current);
      else clips.push(current);
    }
  }
  let remaining = MAX_ZIP_BYTES;
  const entries = [];
  for (const [index, clip] of clips.entries()) {
    const data = await read(fetcher, clip.video, remaining, signal, /^(?:video\/mp4|application\/octet-stream)\b/i);
    if (!data.length) throw new Error('Yarn returned an empty MP4.');
    remaining -= data.length;
    entries.push({name: filename(index, clip, start), data});
  }
  return zip(entries);
}
