import { BOOTS_FRAMES } from './boots-frames.js?v=boots-chat-3';

// A fixed canvas draws decoded frames. Cached GIF playback and CSS scale races
// cannot resize an old sleeping/idle bitmap during a state change.
export function createBootsAnimator({sprite,base,reducedMotion=false,setTimer=setTimeout,clearTimer=clearTimeout,loadImage=loadSpriteImage}){
 // Preserve integer source pixels in the unchanged 72px display box.
 const size=216; sprite.width=size; sprite.height=size;
 const ctx=sprite.getContext('2d');
 let state='idle',revision=0,frameTimer,endTimer,sleepTimer,destroyed=false;
 const images={};
 const ready=Promise.all(Object.entries(BOOTS_FRAMES).map(async([name,frames])=>{
  images[name]=await Promise.all(frames.map(async frame=>({...frame,image:await loadImage(new URL('assets/brand/boots/'+frame.file,base).href)})));
 }));
 function cancelAnimation(){clearTimer(frameTimer);clearTimer(endTimer);revision++}
 function paint(name,frame){
  const image=frame.image,scale=4;
  ctx.clearRect(0,0,size,size);ctx.imageSmoothingEnabled=false;
  // The jump's original travel needs two pixels of extra headroom.
  ctx.drawImage(image,(size-image.width*scale)/2,(size-image.height*scale)/2+(name==='jump'?6:0),image.width*scale,image.height*scale);
  sprite.dataset.state=name;
 }
 function show(name,{loop=false,duration=0}={}){
  cancelAnimation();state=name;const request=revision;
  ready.then(()=>{
   if(destroyed||request!==revision)return;
   const frames=images[name];let index=0;paint(name,frames[0]);
   function tick(){
    if(destroyed||request!==revision)return;
    index++;
    if(index===frames.length){if(loop)index=0;else{idle();return}}
    paint(name,frames[index]);frameTimer=setTimer(tick,frames[index].duration||200);
   }
   if(!reducedMotion&&frames.length>1)frameTimer=setTimer(tick,frames[0].duration||200);
   if(duration)endTimer=setTimer(idle,duration);
   else if(name==='jump'&&reducedMotion)endTimer=setTimer(idle,1400);
  }).catch(()=>{sprite.dataset.error='Sprite artwork could not load'});
 }
 function armSleep(){clearTimer(sleepTimer);sleepTimer=setTimer(()=>{sleepTimer=null;show('sleep')},300000)}
 function idle(){show('idle');if(!sleepTimer)armSleep()}
 function temporary(name,duration=0){armSleep();show(name,{loop:name==='talk'||name==='explain',duration})}
 function activity(){if(state==='sleep')show('idle');armSleep()}
 function setOpen(value,clicked=false){
  if(value||(clicked&&(state==='idle'||state==='sleep')))temporary('jump');
  else if(!value)idle();
 }
 function talk(){temporary('talk',7000)}
 function explain(){temporary('explain',7000)}
 function celebrate(){temporary('jump')}
 function destroy(){destroyed=true;cancelAnimation();clearTimer(sleepTimer)}
 idle();
 return {setOpen,talk,explain,celebrate,activity,destroy,ready};
}
function loadSpriteImage(url){
 return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Sprite image unavailable'));image.src=url});
}
