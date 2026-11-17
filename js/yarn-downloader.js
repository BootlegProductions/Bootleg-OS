const $ = id => document.getElementById(id);
const form = $('yarn-form');
const open = $('yarn-open');
const save = $('yarn-export');
let job = null;

function counts() {
  return {before: Number($('yarn-before').value), after: Number($('yarn-after').value)};
}

function reset() {
  const {before, after} = counts();
  $('yarn-total').textContent = `Up to ${before + after + 1} clips including the starting clip; collection stops at the end of a scene.`;
  job = null;
  $('yarn-job').hidden = true;
  open.removeAttribute('href');
  open.hidden = true;
  save.hidden = true;
}

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

const setup = $('yarn-setup');
const installed = $('yarn-installed');
const setupKey = 'bootleg-yarn-helper-ready';
try {
  if (localStorage.getItem(setupKey) === 'yes') setup.open = false;
} catch {
  // Setup remains visible when browser storage is unavailable.
}
installed.hidden = false;
installed.addEventListener('click', () => {
  try {
    localStorage.setItem(setupKey, 'yes');
  } catch {
    // The setup card can still collapse for this visit.
  }
  setup.open = false;
  $('yarn-url').focus();
});

form.addEventListener('input', reset);
form.addEventListener('submit', event => {
  event.preventDefault();
  reset();
  $('yarn-job').hidden = false;
  try {
    const url = clipUrl($('yarn-url').value);
    if (!url) throw new Error('Missing Yarn clip');
    job = {version: 1, url, ...counts()};
  } catch {
    $('yarn-status').textContent = 'Open an individual Yarn clip and copy its link. Search pages, collections and full tracks need a starting clip.';
    return;
  }
  open.href = job.url;
  open.hidden = false;
  save.hidden = false;
  $('yarn-status').textContent = `Batch ready: ${job.before} before + starting clip + ${job.after} after. Opening the source MP4 clip page.`;
});

save.addEventListener('click', () => {
  if (!job) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(job, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Bootleg-Yarn-Batch.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

reset();
