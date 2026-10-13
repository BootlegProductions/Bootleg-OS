/* Portfolio preview: read the live site's written UK timetable, not a second schedule. */
(() => {
  const BASE='https://bootlegproductions.github.io/Bootleg-Broadcast/';
  const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const $=id=>document.getElementById(id), video=$('broadcast-video');
  const time=ms=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(ms);
  let plans=[],selected=0,powered=false,slotKey='',loading=false,dayKey='',loadedAt=null,endedKey='';
  const element=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
  async function getJson(path){const r=await fetch(BASE+path,{cache:'no-cache',signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`Timetable unavailable (${r.status}).`);return r.json();}
  function current(channel,now=Date.now()){const plan=plans[channel];return plan?BootlegClock.locate(plan,now):null;}
  const watchable=item=>item&&!item.presentation&&/^https:\/\/archive\.org\/download\/.+\.mp4(?:\?.*)?$/i.test(item.url||'');
  function tune() {
    const pos=current(selected);if(!pos||!powered)return;
    const item=pos.item,key=item.slot_id;
    if(slotKey===key)return;slotKey=key;endedKey='';
    video.pause();video.removeAttribute('src');video.load();
    $('broadcast-screen-status').textContent=watchable(item)?'Tuning the live slot…':'This slot has no playable source. The guide continues below.';
    $('broadcast-screen-status').hidden=false;
    if(!watchable(item))return;
    video.onloadedmetadata=()=>{if(slotKey!==key||!powered)return;const now=current(selected);if(now?.item.slot_id!==key){slotKey='';tune();return;}const offset=item.loop&&video.duration?now.offset%video.duration:now.offset;if(Number.isFinite(video.duration)&&offset>=video.duration){endedKey=key;$('broadcast-screen-status').textContent=`This clip has ended. Next slot starts at ${time(item.end)} UK.`;return;}video.currentTime=Math.max(0,offset);video.play().then(()=>{$('broadcast-screen-status').hidden=true;}).catch(()=>{$('broadcast-screen-status').hidden=false;$('broadcast-screen-status').textContent='Press play on the video to continue.';});};
    video.src=item.url;video.load();
  }
  function render() {
    if(!plans.length)return;const now=Date.now(),p=BootlegClock.parts(now);
    $('broadcast-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now)+' · UK time';
    $('broadcast-guide').replaceChildren();
    plans.forEach((plan,index)=>{const pos=current(index,now),row=element('button','', 'broadcast-channel'+(index===selected?' selected':''));row.type='button';row.setAttribute('aria-pressed',String(index===selected));row.append(element('strong',plan.name));if(pos){row.append(element('span',`${time(pos.item.start)}–${time(pos.item.end)} · ${pos.item.title}`,'broadcast-now'));const next=plan.slots.slice(pos.index+1).find(s=>!['Ident','Advert','Break','Filler'].includes(s.type));row.append(element('span',next?`Next ${time(next.start)} · ${next.title}`:'Next timetable begins at midnight','broadcast-next'));}else row.append(element('span','No current slot in the published timetable.'));row.onclick=()=>{selected=index;slotKey='';render();tune();};$('broadcast-guide').append(row);});
    const pos=current(selected,now);$('broadcast-now-title').textContent=pos?.item.title||'Choose a channel';$('broadcast-channel-name').textContent=plans[selected]?.name||'BOOTLEG BROADCAST';
    $('broadcast-current-link').hidden=!watchable(pos?.item);if(watchable(pos?.item))$('broadcast-current-link').href=BASE+'?watch='+encodeURIComponent(pos.item.url);
    $('broadcast-freshness').textContent=`Published timetable · checked ${time(loadedAt)} UK. “Now” follows the schedule; playback depends on the archive source.`;
    const nextDay=`${p.year}-${p.month}-${p.day}`;if(nextDay!==dayKey)load();
    if(powered)tune();
  }
  async function load() {
    if(loading)return;loading=true;$('broadcast-refresh').disabled=true;$('broadcast-guide-status').textContent='Loading today’s live timetable…';
    try{const p=BootlegClock.parts(Date.now()),[data,breaks]=await Promise.all([getJson(`schedules/${MONTHS[p.month-1]}.json`),getJson('channel-breaks.json')]);
      const days=data.weeks?.flatMap(w=>w.week||[])||data.week||[];const day=days.find(d=>Number(d.date)===p.day);
      if(!day?.channels?.length)throw Error('Today is missing from the published timetable.');
      if(data.schedule_year&&Number(data.schedule_year)!==p.year)throw Error('The live site has not published a timetable for this year.');
      plans=day.channels.map(c=>({...BootlegClock.plan({year:p.year,month:p.month,day:p.day,channel:c.name,items:c.playlist,breaks}),name:c.name}));
      dayKey=`${p.year}-${p.month}-${p.day}`;loadedAt=Date.now();selected=Math.min(selected,plans.length-1);slotKey='';$('broadcast-guide-status').textContent=`${plans.length} channels · tap a channel to select it.`;$('broadcast-play').disabled=false;render();
    }catch(e){$('broadcast-guide-status').textContent=`${e.message} Use Refresh guide to retry, or open the full Broadcast site.`;}
    finally{loading=false;$('broadcast-refresh').disabled=false;}
  }
  $('broadcast-play').onclick=()=>{powered=!powered;$('broadcast-play').textContent=powered?'Stop mini TV':'Turn on mini TV';if(powered){$('broadcast-screen-status').hidden=true;slotKey='';tune();}else{video.pause();video.removeAttribute('src');video.load();$('broadcast-screen-status').hidden=false;$('broadcast-screen-status').textContent='TV off · live guide remains available';}};
  $('broadcast-refresh').onclick=load;
  // Hide the prompt for both scripted and native video-control playback.
  video.addEventListener('playing',()=>{if(powered&&video.getAttribute('src'))$('broadcast-screen-status').hidden=true;});
  video.addEventListener('error',()=>{if(powered&&video.getAttribute('src')){$('broadcast-screen-status').hidden=false;$('broadcast-screen-status').textContent='This archive source could not play. Try another channel or the full player.';}});
  video.addEventListener('ended',()=>{const pos=current(selected);if(pos?.item.loop){video.currentTime=0;video.play().catch(()=>{});}else{$('broadcast-screen-status').hidden=false;$('broadcast-screen-status').textContent=`Waiting for the next scheduled slot${pos?' at '+time(pos.item.end)+' UK':''}.`;endedKey=slotKey;}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  load();setInterval(render,15000);setInterval(load,30*60*1000);
})();
