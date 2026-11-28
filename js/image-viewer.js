(() => {
  if (document.querySelector('.site-image-viewer')) return;
  if (document.getElementById('gallery-root') && !new URLSearchParams(location.search).has('cat')) return;
  const scriptURL = document.currentScript.src;
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = new URL('../css/image-viewer.css?v=2', scriptURL).href;
  document.head.append(sheet);
  const dialog = document.createElement('dialog');
  dialog.className = 'site-image-viewer boot-window';
  dialog.setAttribute('aria-label', 'Image preview');
  dialog.innerHTML = '<div class="window-bar"><span class="lights" aria-hidden="true"><span></span><span></span><span></span></span><span class="site-image-title">Image preview</span><button type="button" aria-label="Close image preview">×</button></div><div class="site-image-stage"><img alt=""></div><p class="site-image-caption"></p>';
  document.body.append(dialog);
  const preview = dialog.querySelector('img');
  const title = dialog.querySelector('.site-image-title');
  const caption = dialog.querySelector('.site-image-caption');
  let opener;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    preview.removeAttribute('src');
    if (opener?.isConnected) opener.focus({preventScroll:true});
  });

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const image = event.target.closest('main img') || event.target.closest('main a')?.querySelector('img');
    if (!image || image.closest('[data-no-image-viewer], .app-icon, button, .image-editor, .pixel-editor, .archive-dialog, .site-image-viewer')) return;
    const link = image.closest('a');
    if (link?.hasAttribute('download')) return;
    const target = link ? new URL(link.href, location.href) : null;
    const isImageLink = target && /\.(?:png|jpe?g|webp|gif|avif|svg)$/i.test(target.pathname);
    if (link && !isImageLink) return;
    if (!link && !image.closest('figure') && !image.hasAttribute('data-enlarge')) return;
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    opener = link || image;
    const description = image.closest('figure')?.querySelector('figcaption')?.textContent.trim() || image.alt || '';
    title.textContent = image.alt || 'Image preview';
    caption.textContent = description;
    caption.hidden = !description;
    preview.alt = image.alt;
    preview.src = isImageLink ? target.href : image.currentSrc || image.src;
    dialog.showModal();
  }, true);

  function makeFocusable(image) {
    if (image.closest('a, button, [data-no-image-viewer], .image-editor, .pixel-editor') || (!image.closest('figure') && !image.hasAttribute('data-enlarge'))) return;
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Enlarge image: ' + (image.alt || 'Image preview'));
  }
  document.querySelectorAll('main figure img, main img[data-enlarge]').forEach(makeFocusable);
  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || !event.target.matches('main img[role="button"]')) return;
    event.preventDefault();
    event.target.click();
  });
})();
