(function () {
  const root = document.querySelector('[data-project-media]');
  const folder = document.body.dataset.projectFolder;
  if (!root || !folder || !window.PROJECT_MEDIA) return;
  const files = window.PROJECT_MEDIA[folder] || [];
  const images = files.filter(file => ['png', 'jpg', 'jpeg', 'webp'].includes(file.type));
  const videos = files.filter(file => ['mp4', 'webm'].includes(file.type));
  const choices = folder === 'Raspberry Pi Project'
    ? ['Original Stat Screen', 'Pipboy Interface Beta', '3D printed Custom Pip-Boy Case', 'PipBoy On Wrist']
    : folder === 'in-mind' ? ['In-Mind App Home Screen', 'In-Mind Mind Page', 'In-Mind Body Page'] : [];
  const selected = choices.map(term => images.find(file => file.name.toLowerCase().includes(term.toLowerCase()))).filter(Boolean);
  for (const file of images) if (selected.length < 4 && !selected.includes(file)) selected.push(file);
  const galleryLink = folder === 'Raspberry Pi Project'
    ? '<a class="btn" href="../gallery.html?cat=pipboy-development-images">Open Pi-Boy gallery</a>' : '';
  const preview = selected.length ? `<div class="project-showcase-grid">${selected.map(file => `<a href="${file.file}" target="_blank" rel="noopener"><img src="${file.file}" alt="${file.name}" loading="lazy"><span>${file.name}</span></a>`).join('')}</div>` : '<p>Project images are being prepared.</p>';
  const all = files.map(file => {
    if (images.includes(file)) return `<figure class="project-media-item"><a href="${file.file}" target="_blank" rel="noopener"><img src="${file.file}" alt="${file.name}" loading="lazy"></a><figcaption class="project-media-caption">${file.name}</figcaption></figure>`;
    if (videos.includes(file)) return `<figure class="project-media-item"><video controls preload="none" src="${file.file}"></video><figcaption class="project-media-caption">${file.name}</figcaption></figure>`;
    return `<a class="project-download" href="${file.file}" download><span>${file.name}</span><small>${file.type}</small></a>`;
  }).join('');
  root.innerHTML = `<div class="project-showcase"><span class="eyebrow">Visual archive</span><h2>Project media</h2>${preview}<div class="project-showcase-actions">${galleryLink}</div><details class="project-all-media"><summary>Browse all ${files.length} project files</summary><div class="project-media-grid">${all}</div></details></div>`;
})();
