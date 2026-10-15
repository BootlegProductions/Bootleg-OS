// Shared, testable encoding settings. Paths are fixed inside a temporary worker FS.
export const PRESETS={small:{crf:35,audio:64},balanced:{crf:28,audio:128},quality:{crf:23,audio:192}};
export const MAX_INPUT_BYTES=500*1024*1024;
export function compressionArgs({preset='balanced',height=720,mode='quality',targetMB=25,duration,removeAudio=false,speed='veryfast'}={}){
 const settings=PRESETS[preset];if(!settings)throw Error('Choose a compression preset.');
 if(![0,480,720,1080].includes(Number(height)))throw Error('Choose a supported resolution.');
 if(!['quality','target'].includes(mode)||!['veryfast','ultrafast'].includes(speed))throw Error('Choose valid compression settings.');
 const args=['-y','-i','input','-map','0:v:0'];
 if(!removeAudio)args.push('-map','0:a:0?');
 args.push('-c:v','libx264','-preset',speed,'-pix_fmt','yuv420p');
 if(mode==='target'){
  if(!Number.isFinite(duration)||duration<=0)throw Error('A duration is needed to estimate a target size. Try quality mode instead.');
  const mb=Number(targetMB);if(!Number.isFinite(mb)||mb<1||mb>500)throw Error('Choose a target between 1 and 500 MB.');
  const kbps=Math.floor(mb*1024*1024*8*.94/duration/1000-(removeAudio?0:settings.audio));
  if(kbps<100)throw Error('That target is too small for this video. Increase it or use quality mode.');
  args.push('-b:v',kbps+'k','-maxrate',Math.round(kbps*1.3)+'k','-bufsize',Math.round(kbps*2)+'k');
 }else args.push('-crf',String(settings.crf));
 const filter=Number(height)?`scale=-2:trunc(min(ih\\,${Number(height)})/2)*2`:'scale=trunc(iw/2)*2:trunc(ih/2)*2';
 args.push('-vf',filter);
 if(removeAudio)args.push('-an');else args.push('-c:a','aac','-b:a',settings.audio+'k');
 return [...args,'-sn','-dn','-map_metadata','-1','-movflags','+faststart','output.mp4'];
}
export function outputName(name){return (name.replace(/\.[^.]*$/,'').replace(/[\\/:*?"<>|]/g,'-')||'video')+'-bootleg-compressed.mp4'}
export function formatBytes(bytes){return bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`}
