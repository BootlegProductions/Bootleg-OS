/* Browser-only adaptation of Archive Link Scraper V2.0.1. No backend or third-party ZIP library. */
(()=>{'use strict';
const $=id=>document.getElementById(id), form=$('archive-form'), status=$('archive-status'), items=$('archive-items');
let results=[],controller=null;
const setStatus=s=>{status.textContent=s;};
function cleanName(s){let n=String(s||'Archive_Item').replace(/[\\/*?:"<>|]/g,'').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,70).replace(/[ ._-]+$/,'');return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(n)?'_'+n:n||'Archive_Item';}
function modeFor(raw){let u;try{u=new URL(raw)}catch{}if(u&& !['archive.org','www.archive.org'].includes(u.hostname))throw Error('Only archive.org URLs are supported.');const p=u?.pathname||'';
if(raw.toLowerCase().startsWith('fav-'))return {query:'collection:'+raw.split(/[/?#]/)[0]};
if(p.includes('/details/@')&&p.toLowerCase().includes('/favorites'))return {query:'collection:fav-'+p.split('@')[1].split('/')[0]};
if(p.includes('/details/@')||raw.startsWith('@'))return {query:'_uploader_useritem:@'+raw.split('@').pop().split(/[/?#]/)[0]};
if(p.startsWith('/details/')||p.startsWith('/download/'))return {identifier:decodeURIComponent(p.split('/')[2]||'')};
if(p.startsWith('/search')&&u.searchParams.has('query'))return {query:u.searchParams.get('query')};
if(raw.toLowerCase().startsWith('collection:'))return {query:raw};
if(u)throw Error('Paste an Internet Archive item, search, uploader or favourites URL.');
return {query:raw};}
async function json(url){let r;try{r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});}catch(e){if(e.name==='AbortError')throw e;throw Error('Browser request failed (possibly Internet Archive CORS or network restrictions). '+e.message);}if(!r.ok)throw Error('Internet Archive returned HTTP '+r.status+' for '+new URL(url).pathname);return r.json();}
async function itemData(id){if(!/^[\w.\-]+$/.test(id))throw Error('Invalid item identifier: '+id);const m=await json('https://archive.org/metadata/'+encodeURIComponent(id));if(m.is_dark) return null;const links=(m.files||[]).filter(f=>typeof f.name==='string'&&f.name.toLowerCase().endsWith('.mp4')).map(f=>typeof f.url==='string'&&/^https:\/\//.test(f.url)?f.url:'https://archive.org/download/'+encodeURIComponent(id)+'/'+f.name.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/'));return links.length?{id,title:cleanName(m.metadata?.title||id),links}:null;}
function render(){
  items.replaceChildren();
  $('archive-results').hidden=!results.length;
  $('archive-count').textContent=results.length+' item(s) with MP4 files';
  results.forEach((r,i)=>{
    const card=document.createElement('div');card.className='archive-item';
    const label=document.createElement('label');label.className='archive-item-main';
    const box=document.createElement('input');box.type='checkbox';box.className='archive-choice';box.value=i;box.checked=true;
    box.setAttribute('aria-label','Include '+r.title+' in ZIP');
    const text=document.createElement('span');text.className='archive-item-copy';
    const title=document.createElement('strong');title.className='archive-item-title';title.textContent=r.title;
    const count=document.createElement('span');count.className='archive-item-count';count.textContent=r.links.length+' MP4 link'+(r.links.length===1?'':'s');
    text.append(title,count);label.append(box,text);
    const footer=document.createElement('div');footer.className='archive-item-footer';
    const id=document.createElement('span');id.className='archive-item-id';id.textContent=r.id;
    const a=document.createElement('a');a.href='https://archive.org/details/'+encodeURIComponent(r.id);a.target='_blank';a.rel='noopener noreferrer';a.textContent='View on Internet Archive ↗';
    footer.append(id,a);card.append(label,footer);items.append(card);
  });
}
async function search(ev){ev.preventDefault();controller?.abort();controller=new AbortController();results=[];render();const raw=$('archive-input').value.trim();if(!raw)return;const btn=$('archive-run');btn.disabled=true;try{const mode=modeFor(raw);let ids;if(mode.identifier){ids=[mode.identifier];}else{setStatus('Searching Internet Archive…');const params=new URLSearchParams({q:mode.query,fl:'identifier',rows:'100',page:'1',output:'json'});if($('archive-sort').value!=='none')params.set('sort[]',$('archive-sort').value);const data=await json('https://archive.org/advancedsearch.php?'+params);ids=(data.response?.docs||[]).map(d=>d.identifier).filter(Boolean);if(!ids.length){setStatus('No search items found.');return;}}
for(let i=0;i<ids.length;i++){setStatus('Checking item '+(i+1)+' / '+ids.length+' · '+results.length+' with MP4s');try{const r=await itemData(ids[i]);if(r)results.push(r);}catch(e){if(e.name==='AbortError')throw e;console.warn('Skipped item:',ids[i],e);if(ids.length===1)throw e;}if((i+1)%5===0)render();}render();setStatus(results.length?'Complete: '+results.length+' item(s) containing MP4 links.':'No MP4 files found (or item metadata requests failed).');}catch(e){setStatus(e.name==='AbortError'?'Search cancelled.':'Error: '+e.message);}finally{btn.disabled=false;}}
function season(link){const name=decodeURIComponent(link.split('/').pop());for(const re of [/(?:^|[\s._\-/[(])S(?:eason)?[ ._-]*0*(\d{1,2})(?:E|[\s._\-/\])])/i,/Season[ ._-]*0*(\d{1,2})/i,/Series[ ._-]*0*(\d{1,2})/i]){const m=name.match(re);if(m)return Number(m[1]);}return null;}
function parserText(r){const groups=new Map(),other=[];r.links.forEach(l=>{const s=season(l);if(s===null)other.push(l);else{if(!groups.has(s))groups.set(s,[]);groups.get(s).push(l);}});const lines=['# '+r.title,''];if(groups.size){[...groups.keys()].sort((a,b)=>a-b).forEach(s=>{lines.push('## Season '+s,...groups.get(s),'');});if(other.length)lines.push('## Specials / Unsorted',...other,'');}else lines.push(...other,'');return lines.join('\n').trimEnd()+'\n';}
// ZIP 'store' format: standard uncompressed ZIP, created entirely offline in the browser.
const encoder=new TextEncoder();const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function u16(v){return [v&255,(v>>>8)&255];}function u32(v){return [...u16(v),...u16(v>>>16)];}
function makeZip(entries){const local=[],central=[];let offset=0;for(const [name,text] of entries){const fn=encoder.encode(name),data=encoder.encode(text),sum=crc(data),size=data.length;const head=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(size),...u32(size),...u16(fn.length),...u16(0)]);local.push(head,fn,data);central.push(Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(size),...u32(size),...u16(fn.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]),fn);offset+=head.length+fn.length+size;}const centralSize=central.reduce((n,b)=>n+b.length,0);const end=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);return new Blob([...local,...central,end],{type:'application/zip'});}
function download(){const chosen=[...document.querySelectorAll('.archive-choice:checked')].map(c=>results[Number(c.value)]);if(!chosen.length){setStatus('Select at least one item first.');return;}const used=new Set(),entries=chosen.map(r=>{let stem=cleanName(r.title),name=stem+'.txt',n=2;while(used.has(name.toLowerCase())){const suffix=' ('+n+++')';name=stem.slice(0,70-suffix.length).replace(/[ ._-]+$/,'')+suffix+'.txt';}used.add(name.toLowerCase());return[name,parserText(r)];});const url=URL.createObjectURL(makeZip(entries)),a=document.createElement('a');a.href=url;a.download='New-Links.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setStatus('ZIP prepared with '+entries.length+' TXT file(s).');}
form.addEventListener('submit',search);$('archive-download').addEventListener('click',download);$('archive-all').addEventListener('click',()=>document.querySelectorAll('.archive-choice').forEach(c=>c.checked=true));$('archive-none').addEventListener('click',()=>document.querySelectorAll('.archive-choice').forEach(c=>c.checked=false));$('archive-clear').addEventListener('click',()=>{controller?.abort();form.reset();results=[];render();setStatus('Search cleared.');$('archive-input').focus();});
})();
