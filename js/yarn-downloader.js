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
form.addEventListener('submit', async event => {
  event.preventDefault();
  if ($('yarn-local').disabled) return;
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
  if (event.submitter?.value === 'local') {
    await downloadSequence(job);
    return;
  }
  open.href = job.url;
  open.hidden = false;
  save.hidden = false;
  $('yarn-status').textContent = `Batch ready: ${job.before} before + starting clip + ${job.after} after. Opening the source MP4 clip page.`;
});

async function downloadSequence(settings) {
  const status = $('yarn-status');
  const submit = $('yarn-local');
  const controls = Array.from(form.elements);
  const api = 'http://127.0.0.1:47832';
  const disabled = controls.map(control => control.disabled);
  controls.forEach(control => {control.disabled = true;});
  status.textContent = 'Connecting to Bootleg Helper…';
  try {
    let health;
    try {
      const response = await fetch(api + '/health', {signal: AbortSignal.timeout(30000)});
      if (response.ok) health = await response.json();
    } catch {}
    if (!health?.localHelper) throw new Error('Start Bootleg Helper on this PC and allow the browser to connect, then try again.');
    status.textContent = 'Collecting clips and preparing the ZIP…';
    const response = await fetch(api + '/yarn/sequence', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(settings),
      signal: AbortSignal.timeout(100000)
    });
    if (!response.ok) throw new Error((await response.json()).error || 'The sequence could not be collected.');
    if (response.headers.get('content-type') !== 'application/zip') throw new Error('The helper did not return a ZIP.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bootleg-yarn-sequence.zip';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    status.textContent = 'ZIP ready. Check your browser downloads.';
  } catch (error) {
    status.textContent = error.message + ' You can still use Prepare batch with the browser companion.';
  } finally {
    controls.forEach((control, index) => {control.disabled = disabled[index];});
    submit.focus();
  }
}

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
