const $ = id => document.getElementById(id);
const form = $('yarn-form');
const local = $('yarn-local');
const fallback = $('yarn-fallback');

function counts() {
  return {before: Number($('yarn-before').value), after: Number($('yarn-after').value)};
}

function reset() {
  const {before, after} = counts();
  $('yarn-total').textContent = `Up to ${before + after + 1} clips including the starting clip; collection stops at the end of a scene.`;
  $('yarn-job').hidden = true;
  if (fallback) fallback.hidden = true;
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

form.addEventListener('input', reset);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (local.disabled) return;
  reset();
  $('yarn-job').hidden = false;
  let job;
  try {
    const url = clipUrl($('yarn-url').value);
    if (!url) throw new Error('Missing Yarn clip');
    job = {version: 1, url, ...counts()};
  } catch {
    $('yarn-status').textContent = 'Open an individual Yarn clip and copy its link. Search pages, collections and full tracks need a starting clip.';
    return;
  }
  await downloadSequence(job);
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
    if (!health?.localHelper) throw new Error('Bootleg Helper is not connected. Run the setup above if this is your first time, then allow the connection and retry.');
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
    if (/Yarn returned HTTP 403/.test(error.message) && fallback) {
      status.textContent = 'Yarn blocked the local helper from reading this clip. The ZIP could not be created.';
      $('yarn-fallback-open').href = settings.url;
      fallback.hidden = false;
    } else {
      status.textContent = error.message;
    }
  } finally {
    controls.forEach((control, index) => {control.disabled = disabled[index];});
    submit.focus();
  }
}

reset();
