
// First-visit Bootleg OS loader ----------------------------------------------
(function bootSequence(){
    if (sessionStorage.getItem('bootlegBootSeen')) return;
    sessionStorage.setItem('bootlegBootSeen','1');
    const boot=document.createElement('div');
    boot.className='boot-sequence';
    boot.innerHTML='<div class="boot-sequence-inner"><strong>BOOTLEG OS</strong><span>INITIALISING CREATIVE HUB...</span><div class="boot-progress"><i></i></div></div>';
    document.body.appendChild(boot);
    requestAnimationFrame(()=>boot.classList.add('is-active'));
    setTimeout(()=>boot.classList.add('is-leaving'),1250);
    setTimeout(()=>boot.remove(),1700);
})();
function qs(selector) { return document.querySelector(selector); }
function qsa(selector) { return [...document.querySelectorAll(selector)]; }

function localClock() {
    const el = qs('#local-clock');
    const now = new Date();
    if (el) el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    qsa('[data-zone]').forEach(zone => {
        const target = zone.querySelector('strong');
        if (target) target.textContent = new Intl.DateTimeFormat([], { timeZone: zone.dataset.zone, hour: '2-digit', minute: '2-digit' }).format(now);
    });
    const hour = now.getHours();
    document.body.dataset.time = hour > 6 && hour < 18 ? 'day' : 'night';
}
setInterval(localClock, 1000);
localClock();

function galleryPreview(category) {
    const image = category.files.find(file => ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(file.type));
    if (image) return `<img src="${image.file}" alt="" loading="lazy">`;
    const video = category.files.find(file => ['mp4', 'webm'].includes(file.type));
    if (video?.poster) return `<img src="${video.poster}" alt="" loading="lazy">`;
    if (video) return `<video src="${video.file}" muted autoplay loop playsinline preload="metadata"></video>`;
    return `<div class="gallery-folder-fallback">▧</div>`;
}

function galleryFileMarkup(file) {
    const imageTypes = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    const videoTypes = ['mp4', 'webm'];
    if (imageTypes.includes(file.type)) {
        return `<article class="gallery-item"><a href="${file.file}" target="_blank"><img src="${file.file}" alt="${file.name}" loading="lazy"></a><p>${file.name}</p></article>`;
    }
    if (videoTypes.includes(file.type)) {
        return `<article class="gallery-item"><video controls playsinline preload="none" ${file.poster ? `poster="${file.poster}"` : ''} aria-label="${file.name}" src="${file.file}"></video><p>${file.name}</p></article>`;
    }
    if (file.type === 'pdf') {
        return `<article class="gallery-item"><div class="card-content gallery-pdf"><span class="app-icon">PDF</span><h3>${file.name}</h3><a class="btn" href="${file.file}" target="_blank">Open PDF</a></div><p>${file.name}</p></article>`;
    }
    return `<article class="gallery-item"><div class="gallery-file-card"><span class="file-kind">${file.type.toUpperCase()} FILE</span><h3>${file.name}</h3><p>This format is kept in the archive but may not preview directly in a browser.</p><a class="btn" href="${file.file}" target="_blank" download>Open / Download</a></div><p>${file.name}</p></article>`;
}

function initGallery() {
    const root = qs('#gallery-root');
    if (!root || !window.GALLERY_CATEGORIES) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('cat');

    if (!slug) {
        root.innerHTML = `<div class="gallery-folders">${GALLERY_CATEGORIES.map(category => `
            <a class="gallery-folder" href="gallery.html?cat=${category.slug}">
                <div class="gallery-folder-tab"></div>
                <div class="gallery-folder-preview">${galleryPreview(category)}</div>
                <div class="gallery-folder-overlay"></div>
                <div class="gallery-folder-copy">
                    <span class="eyebrow">${category.files.length ? `${category.files.length} items` : `Archive folder`}</span>
                    <h3>${category.title}</h3>
                    <p>Open folder →</p>
                </div>
            </a>`).join('')}</div>`;
        return;
    }

    const category = GALLERY_CATEGORIES.find(item => item.slug === slug);
    if (!category) { root.textContent = 'Folder not found'; return; }
    document.title = category.title + ' - Bootleg OS';
    const galleryItems = category.files.length
        ? category.files.map(galleryFileMarkup).join('')
        : `<div class="card gallery-empty"><div class="card-content"><span class="eyebrow">Empty folder</span><h3>${category.title}</h3><p>No indexed files are currently registered for this folder.</p></div></div>`;

    root.innerHTML = `<div class="gallery-category-head"><a class="btn" href="gallery.html">← Back to folders</a><div><span class="eyebrow">Gallery folder</span><h2>${category.title}</h2></div></div><div class="gallery-grid">${galleryItems}</div>`;
}
initGallery();

// Load the shared guide relative to this script, including nested project pages.
{const entry=document.currentScript;if(entry){const helper=document.createElement('script');helper.src=new URL('boots.js?v=frames-1',entry.src).href;helper.defer=true;document.body.append(helper)}}
