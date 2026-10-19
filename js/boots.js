// Boots is a local guide: deterministic answers, no network chat or personal data collection.
(async () => {
 const entry=document.currentScript.src,base=new URL('../',entry),page=location.pathname;
 const [{createBootsAnimator},{findPlace,timeAnswer,weatherAnswer,WEATHER_PLACE_KEY},{createDialogue}]=await Promise.all([import(new URL('boots-state.js?v=boots-chat-3',entry)),import(new URL('boots-live.js',entry)),import(new URL('boots-dialogue.js?v=boots-chat-3',entry))]);
 const dialogue=createDialogue();let activeGuide=null,guideStep=0;
 function toolHelp(guide,advance=false){
  const steps=guide[2].match(/[^.!?]+(?:[.!?]+|$)/g)||[guide[2]];
  if(!advance||activeGuide!==guide){activeGuide=guide;guideStep=0}else guideStep++;
  if(guideStep>=steps.length){message('That’s the basics! Ready to give it a try?','boots',guide[3]);setSuggestions(['Start again','Show me the tools','Contact']);}
  else{message(steps[guideStep].trim()+(guideStep===0?' Want me to walk you through it?':''),'boots',guide[3]);setSuggestions([guideStep===0?'Walk me through it':'Next step','Show me the tools','Contact']);}
  draw('focused');
 }
 const guides=[
 ['video-compressor','Video Compressor','Choose a video from your device. Start with Balanced quality and 720 pixels. Press Compress and keep the tab open while it works. Preview the result, then download your MP4. You can also aim for a target size, but the final size is an estimate.','video-compressor.html'],
 ['utilities','Image Tools','Upload an image, then use automatic cutout to remove the background. Check the edges, use Restore to recover details or Erase to remove leftovers, and download a transparent PNG. Colour key is useful for a flat background.','utilities.html'],
 ['pixel-studio','Pixel Studio','Choose your canvas size and palette, then paint on the grid. Brush size controls the pixel footprint. Use layers for separate parts and frames for animation; onion skin helps line up neighbouring frames. Export your work when ready.','pixel-studio.html'],
 ['archive-scraper','Archive Scraper','Paste the Internet Archive item or collection link into the scraper. Choose the files you want from the results before downloading. Large collections can take longer to scan.','archive-scraper.html'],
 ['youtube-downloader','YouTube Downloader','Paste a link to one video, choose MP4 or MP3, then prepare the download. This tool needs its separate download service online. If this page says it is awaiting hosting, downloads are not available yet.','youtube-downloader.html'],
 ['yarn-downloader','Yarn Downloader','The Yarn page includes the browser companion and setup steps. It uses the Yarn page in your browser to collect consecutive clips. If Yarn refuses access, it stops and explains the problem.','yarn-downloader.html'],
 ['clock','World Clock','Use the world map to select a country and see its time. Countries with several time zones may offer more than one location. The clock cards give you quick regional comparisons.','clock.html'],
 ['weather','Weather','Search for a city to see its weather. Check the location name in the result so you know you have the right city.','weather.html'],
 ['radio','Pirate Radio','On mobile, use the bottom player for Play/Pause and Next. Swipe its handle up for stations and volume, or down to collapse it. On desktop, use the header radio dials. Open the full radio page for more space.','radio.html'],
 ['pipboy','Pi-Boy','Launch the beta, then use its controls to navigate the green-screen interface. The browser beta recreates the Raspberry Pi project in a small interactive screen.','project-pages/raspberry-pi.html']
 ];
 const current=guides.find(g=>page.includes(g[0])||(g[0]==='pipboy'&&page.includes('raspberry-pi')));
 const shell=document.createElement('aside');shell.className='boots-helper';shell.setAttribute('aria-label','Boots site helper');
 shell.innerHTML=`<section class="boots-window" id="boots-window" hidden aria-label="Chat with Boots"><header><strong>BOOTS // SITE GUIDE</strong><button type="button" class="boots-close" aria-label="Close Boots">×</button></header><p class="boots-disclosure">A local guide to Bootleg OS. Site guide · live weather uses Open-Meteo.</p><div class="boots-log" role="log" aria-live="polite"></div><div class="boots-suggestions"></div><form class="boots-form"><label class="boots-input-label" for="boots-question">Ask Boots about the site</label><input id="boots-question" maxlength="300" autocomplete="off" placeholder="How do I remove a background?"><button type="submit">Ask</button></form></section><button class="boots-toggle" type="button" aria-controls="boots-window" aria-expanded="false"><span class="boots-avatar" aria-hidden="true"><canvas width="216" height="216" class="boots-sprite-canvas"></canvas></span><span>Ask Boots</span></button>`;
 document.body.append(shell);const toggle=shell.querySelector('.boots-toggle'),win=shell.querySelector('.boots-window'),log=shell.querySelector('.boots-log'),input=shell.querySelector('input'),sprite=shell.querySelector('.boots-sprite-canvas');
 const animator=createBootsAnimator({sprite,base,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches});
 function draw(emote='happy'){
  if(emote==='focused')animator.explain();
  else if(emote==='happy')animator.talk();
 }
 function message(text,who='boots',href){const p=document.createElement('p');p.className='boots-message '+who;p.textContent=text;if(href){const a=document.createElement('a');a.href=new URL(href,base);a.textContent='Open page →';if(a.origin!==base.origin){a.target='_blank';a.rel='noopener'}p.append(document.createElement('br'),a)}log.append(p);while(log.children.length>24)log.firstChild.remove();log.scrollTop=log.scrollHeight}
 function guideAnswer(question){
  const q=question.toLowerCase();draw('thinking');
  if(/redbubble|shop|stickers/.test(q)){message('Oliver’s Bootleg-Edits shop has clothing, stickers and artwork on Redbubble.','boots','https://www.redbubble.com/people/Bootleg-Edits/shop?asc=u');setSuggestions(['YouTube channels','Explore the gallery','Contact']);draw('happy');return}
  if(/open bootleg edit/.test(q)){message('Here’s Oliver’s Bootleg Edit channel.','boots','https://youtube.com/@bootleg-edit');setSuggestions(['YouTube channels','Check out Redbubble','Contact']);draw('happy');return}
  if(/youtube channel|internetcourier|internet courier|bootleg.edit/.test(q)){message('Internet Courier has gaming videos and Fallout: New Vegas playthroughs. Bootleg Edit is the other creative channel. Choose one below.','boots','https://youtube.com/@internetcourier');setSuggestions(['Open Bootleg Edit','Check out Redbubble','Contact']);draw('happy');return}
  const matched=guides.find(g=>(g[0]==='video-compressor'&&/compress|smaller video|reduce.*video/.test(q))||q.includes(g[1].toLowerCase())||q.includes(g[0])||(g[0]==='utilities'&&/background|cutout|erase|restore|image/.test(q))||(g[0]==='pixel-studio'&&/pixel|onion|layers|animation/.test(q))||(g[0]==='youtube-downloader'&&/youtube|mp3|mp4/.test(q)));
  if(matched){toolHelp(matched);return}
  if(/help|this tool|how.*use/.test(q)&&current){toolHelp(current);return}
  if(/contact|email|hire|collaborat/.test(q)){setSuggestions(['Check out Redbubble','YouTube channels','About Oliver']);message('You can email Oliver about projects, collaborations or tool feedback. The Contact page also has professional and creative links.','boots','contact.html');}
  else if(/about|oliver|who|education/.test(q))message('Oliver makes websites, artwork and interactive tools. Bootleg OS brings that work together—want to read his story?','boots','about.html');
  else if(/gallery|art|images/.test(q))message('The Gallery groups artwork, sketches, photography and other media into folders. Open a folder to explore its contents.','boots','gallery.html');
  else if(/project|portfolio/.test(q))message('The Projects page contains case studies, including university work and newer experiments. Open a project to see the story, process and media.','boots','projects.html');
  else if(/blog|article|writing/.test(q))message('The Blog has articles about technology, creativity and making things online. Each article links to related reading.','boots','blog.html');
  else if(/tools|apps|what can/.test(q)){message('Want to make something, check the world, or find media? Pick a starting point.','boots','applications.html');setSuggestions(['Remove a background','Make some pixel art','Video Compressor']);}
  else message('I didn’t quite catch that. Are you looking for a tool, a project, or a chat?');draw('happy');
 }
 function open(value,clicked=false){win.hidden=!value;toggle.setAttribute('aria-expanded',String(value));animator.setOpen(value,clicked);if(value){if(!log.children.length){message(dialogue.welcome());setSuggestions(current?['Help with this tool','Show me the tools','Just chatting']:['Show me the tools','Find a project','Just chatting']);}input.focus()}}
 for(const event of ['pointerdown','keydown','wheel'])document.addEventListener(event,e=>{if(!e.target.closest?.('.boots-toggle'))animator.activity()},{passive:true});
 let lastMovement=0;document.addEventListener('pointermove',e=>{const now=Date.now();if(now-lastMovement>1000&&!e.target.closest?.('.boots-toggle')){lastMovement=now;animator.activity()}},{passive:true});
 input.addEventListener('input',()=>animator.activity());
 // Celebrate confirmed status changes, rather than a click before export completes.
 for(const id of ['image-status','pixel-status','yt-status']){
  const status=document.getElementById(id);if(!status)continue;
  let previous=status.textContent;
  new MutationObserver(()=>{const text=status.textContent;if(text===previous)return;previous=text;if(/^(Cutout ready\.|Exported |Ready\. Your file)/.test(text))animator.celebrate();}).observe(status,{childList:true,characterData:true,subtree:true});
 }
 toggle.onclick=()=>open(win.hidden,true);shell.querySelector('.boots-close').onclick=()=>{open(false);toggle.focus()};shell.addEventListener('keydown',e=>{if(e.key==='Escape'){open(false);toggle.focus()}});
 let pendingWeather=false,queue=Promise.resolve();
 function setSuggestions(labels){const box=shell.querySelector('.boots-suggestions');box.replaceChildren();for(const label of labels){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>submitQuestion(label);box.append(b)}}
 function rememberedPlace(){try{const p=JSON.parse(localStorage.getItem(WEATHER_PLACE_KEY));return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)?p:null}catch{return null}}
 async function answer(question){
  const q=question.toLowerCase();
  if(activeGuide&&/^(walk me through it|next step|yes|yeah|yep|sure|okay|ok|start again)[!. ]*$/.test(q)){pendingWeather=false;toolHelp(activeGuide,!/^start again/.test(q));return;}
  activeGuide=null;
  const social=dialogue.reply(question);if(social){pendingWeather=false;activeGuide=null;message(social.text,'boots',social.href);setSuggestions(social.suggestions);if(social.mood==='angry')animator.angry();else if(social.mood==='sleepy')animator.sleepy();else if(social.mood==='explain')animator.explain();else draw('happy');return;}
  const weatherMatch=question.match(/(?:weather|forecast)(?:\s+like)?\s+(?:in|for|at)\s+(.+?)[?.!]*$/i),timeMatch=question.match(/time(?:\s+is(?:\s+it)?)?\s+(?:in|at)\s+(.+?)[?.!]*$/i);
  if(timeMatch||/what.*time|time now|current time|^time$/.test(q)){
   try{const place=timeMatch?await findPlace(timeMatch[1]):null;message(timeAnswer(place),'boots','clock.html')}catch(e){message(e.message,'boots','clock.html')}
   setSuggestions(['Time in Tokyo','Time in New York','What’s the weather?']);draw('happy');return;
  }
  if(/weather|forecast/.test(q)||(pendingWeather&&!/contact|email|redbubble|youtube|tools|apps|about|gallery|project|blog/.test(q))){
   try{
    const place=weatherMatch?await findPlace(weatherMatch[1]):pendingWeather&&!/weather|forecast/.test(q)?await findPlace(question):rememberedPlace();
    if(!place){pendingWeather=true;message('Which town or city would you like the weather for? You can also select a place in the Weather app.','boots','weather.html');setSuggestions(['Weather in Huddersfield','Weather in London','What time is it?']);return}
    pendingWeather=false;message(await weatherAnswer(place,{snapshot:window.BOOTLEG_WEATHER_SNAPSHOT}),'boots','weather.html');
    try{localStorage.setItem(WEATHER_PLACE_KEY,JSON.stringify(place))}catch{}
   }catch(e){pendingWeather=false;message(e.message,'boots','weather.html')}
   setSuggestions(['What’s the weather?','Weather in Huddersfield','What time is it?']);draw('happy');return;
  }
  pendingWeather=false;setSuggestions(['What tools are here?','What time is it?','Contact']);guideAnswer(question);
 }
 function submitQuestion(question){
  const q=question.trim();if(!q)return;message(q,'user');input.value='';
  queue=queue.then(async()=>{
   animator.talk();
   const dots=document.createElement('p');dots.className='boots-message boots-typing';dots.setAttribute('aria-label','Boots is typing');dots.textContent='● ● ●';log.append(dots);log.scrollTop=log.scrollHeight;
   try{await new Promise(r=>setTimeout(r,700));await answer(q)}catch{message('I couldn’t complete that answer. Please try again.')}finally{dots.remove()}
  });
 }
 setSuggestions([current?'Help with this tool':'Show me the tools','Find a project','Just chatting']);
 shell.querySelector('form').onsubmit=e=>{e.preventDefault();submitQuestion(input.value)};
})();


