const $ = id => document.getElementById(id);
const clipPageHosts = new Set([
  'yarn.co', 'www.yarn.co', 'memes.yarn.co',
  'getyarn.io', 'www.getyarn.io', 'memes.getyarn.io', 'tv.getyarn.io', 'trailers.getyarn.io'
]);
const mediaHosts = new Set(['y.yarn.co', 'y.getyarn.io']);
const clipId = '([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})';
const clipPage = new RegExp('^/yarn-clip/' + clipId + '(?:/(?:gif|meme|embed))?/?$', 'i');
const embedPage = new RegExp('^/yarn-clip/embed/' + clipId + '/?$', 'i');
const mediaFile = new RegExp('^/' + clipId + '(?:_text)?\\.(?:mp4|gif)$', 'i');

function clipUrl(value) {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
  const match = clipPageHosts.has(url.hostname)
    ? (clipPage.exec(url.pathname) || embedPage.exec(url.pathname))
    : mediaHosts.has(url.hostname) && mediaFile.exec(url.pathname);

  return match ? 'https://getyarn.io/yarn-clip/' + match[1].toLowerCase() : null;
}


$('yarn-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const normalized = clipUrl($('yarn-url').value);
    if (!normalized) throw Error('Paste an individual Yarn clip link.');
    const target = new URL(normalized);
    const options = new URLSearchParams();
    for (const key of ['before','after']) {
      const count = Number($('yarn-' + key).value);
      if (!Number.isInteger(count) || count < 0 || count > 15) throw Error('Choose 0–15 clips on each side.');
      options.set('bootleg-' + key, String(count));
    }
    target.hash = options.toString();
    location.assign(target.href);
  } catch (error) { $('yarn-status').textContent = error.message; }
});
