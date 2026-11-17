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
