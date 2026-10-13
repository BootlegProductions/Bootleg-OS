(() => {
 const image=document.getElementById('broadcast-logo-image');if(!image)return;
 const base=new URL('../assets/gallery/Bootleg Broadcast Logos/',document.currentScript.src),caption=document.getElementById('broadcast-logo-caption'),pause=document.getElementById('broadcast-logo-pause');
 const logos=[['Cartoons Cartoons','Cartoons Cartoons Logo.webp'],['90s Toons','90s Cartoons Logo.webp'],['Japanime','Japanime Logo.webp'],['Off Licence TV','Off Licence TV Logo.webp'],['Dickleodeon','Dickleodeon Logo.webp'],['Dizzy','Dizzy Logo.webp'],['Star Spangled TV','Star Spangled TV Logo.webp'],['Girly Pop','Girly Pop Logo.webp'],['AAA','AAA Logo.webp'],['What?','What Logo.webp']];
 let index=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function show(n){index=(n+logos.length)%logos.length;image.src=new URL(logos[index][1],base).href;image.alt=logos[index][0]+' channel identity';caption.textContent=logos[index][0]+` · ${index+1} / ${logos.length}`}
 function updatePause(){pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play logo slideshow':'Pause logo slideshow')}
 document.getElementById('broadcast-logo-prev').onclick=()=>show(index-1);document.getElementById('broadcast-logo-next').onclick=()=>show(index+1);pause.onclick=()=>{paused=!paused;updatePause()};
 const observer=new IntersectionObserver(([entry])=>{image.dataset.visible=String(entry.isIntersecting)});observer.observe(image);
 setInterval(()=>{if(!paused&&!document.hidden&&image.dataset.visible==='true'&&!document.querySelector('.broadcast-logo-slideshow').matches(':focus-within'))show(index+1)},4000);
 show(0);updatePause();
})();
