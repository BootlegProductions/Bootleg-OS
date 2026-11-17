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

function clipUrl(value) {
  const url = new URL(value.trim());
  const host = url.hostname.replace(/^www\./, '');
  const path = /^\/yarn-clip\/([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})\/?$/i.exec(url.pathname);
  if (url.origin !== `https://${url.hostname}` || !['getyarn.io', 'yarn.co'].includes(host) || !path) {
    throw new Error('Paste a full Yarn clip link from yarn.co or getyarn.io.');
  }
  return `https://getyarn.io/yarn-clip/${path[1].toLowerCase()}`;
}

form.addEventListener('input', reset);
form.addEventListener('submit', event => {
  event.preventDefault();
  reset();
  $('yarn-job').hidden = false;
  try {
    job = {version: 1, url: clipUrl($('yarn-url').value), ...counts()};
  } catch {
    $('yarn-status').textContent = 'Paste a full Yarn clip link from yarn.co or getyarn.io.';
    return;
  }
  open.href = job.url;
  open.hidden = false;
  save.hidden = false;
  $('yarn-status').textContent = `Batch ready: ${job.before} before + starting clip + ${job.after} after.`;
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
