(() => {
    const root = document.getElementById('gallery-root');
    const categories = window.GALLERY_CATEGORIES;
    if (!root || !categories || new URLSearchParams(location.search).has('cat')) return;

    const imageTypes = new Set(['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'avif']);
    const videoTypes = new Set(['mp4', 'webm', 'mov']);
    const groups = [
        {slug:'sketches', title:'Sketches', note:'Pencil, colour and pages straight from the sketchbook.', folders:['sketches']},
        {slug:'graphic-design', title:'Graphic Design', note:'Print, merchandise and experiments in colour.', folders:['redbubble-designs','posters','stickers','vaporwave-surreal-memes','seasonal-design-elements','business-cards','social-media-graphics','youtube-thumbnails']},
        {slug:'brand-motion', title:'Brand & Motion', note:'Channel identities, animated idents and the Boots sprite archive.', folders:['bootleg-broadcast-logos','bootleg-broadcast-animated-logos','logos','boots-pixel-assistant','portfolio-websites-assets']},
        {slug:'projects-photography', title:'Projects & Photography', note:'Interface studies, development files and photographs.', folders:[]},
    ];
    const featured = [
        ['redbubble-designs','DVD Burner','A design about burning discs and the DIY culture of physical media.'],
        ['sketches','Acid Bath','A sketchbook skeleton surrounded by purple bubbles and a spill of bright green.'],
        ['redbubble-designs','Gomorrah billboard','A Fallout: New Vegas-inspired billboard design with a pop-art treatment.'],
        ['bootleg-broadcast-logos','Japanime Logo','The channel mark for Japanime, part of Bootleg Broadcast’s set of retro TV identities.'],
        ['stickers','Rex Sticker','A sticker design featuring Rex from Fallout: New Vegas.'],
        ['posters','Individual Project Poster (Award Winning)-1','The image edition of my award-winning university project poster.','Award-Winning Project Poster'],
        ['mobile-app-mock-ups','In Mind Mobile Mock-Up','A mobile interface concept for In Mind, presented as a screen mock-up.'],
        ['vaporwave-surreal-memes','Talk To Hue','An experiment from the Vaporwave Surreal Memes folder.'],
        ['photography','Barcelona Neon Statue','A photograph from Barcelona, picked for the contrast between sculpture and neon light.'],
        ['sketches','Vault Suit Study','Blue and yellow coloured pencil on paper, testing the folds and pose of a vault suit.'],
    ].flatMap(([slug,name,description,title]) => {
        const folder = categories.find(c => c.slug === slug);
        const item = folder?.files.find(f => f.name === name && imageTypes.has(f.type));
        return item ? [{...item, title:title || item.name, description, folder}] : [];
    });

    const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const folderURL = folder => 'gallery.html?cat=' + encodeURIComponent(folder.slug);
    const button = (label, text, attr) => `<button type="button" class="archive-control" aria-label="${label}" ${attr}>${text}</button>`;
    const assigned = new Set(groups.flatMap(group => group.folders));
    const foldersFor = group => group.folders.length
        ? group.folders.flatMap(slug => categories.filter(folder => folder.slug === slug))
        : categories.filter(folder => !assigned.has(folder.slug));

    root.id = 'gallery-desktop';
    root.className = 'archive-desktop';
    document.getElementById('gallery-folder-intro')?.setAttribute('hidden','');
    root.innerHTML = `
      <header class="archive-heading">
        <div><span class="eyebrow">Bootleg OS / Creative work</span><h1>Gallery archive</h1></div>
        <a class="archive-control" href="#file-cabinet">Browse the file cabinet ↓</a>
      </header>
      ${featured.length ? `<section class="archive-window" aria-labelledby="featured-heading">
        <div class="archive-titlebar"><span id="featured-heading">▣ Featured Works.exe</span><button type="button" class="archive-maximize" data-feature-maximize aria-label="Enlarge featured artwork" title="Enlarge artwork">⛶</button></div>
        <div class="archive-feature-body">
          <div class="archive-feature-screen" data-feature-stage>
            <div class="archive-stage-grid" aria-hidden="true"></div>
            <button type="button" class="archive-feature-art" data-feature-open><img alt="" draggable="false"><span class="archive-zoom-mark" aria-hidden="true">+</span></button>
            ${button('Previous featured artwork','←','data-feature-prev')}
            ${button('Next featured artwork','→','data-feature-next')}
          </div>
          <div class="archive-feature-details">
            <div class="archive-feature-copy">
              <span class="eyebrow" data-feature-folder></span>
              <h2 data-feature-title></h2><p data-feature-description></p>
            </div>
            <a data-feature-link>Open folder →</a>
          </div>
        </div>
        <div class="archive-feature-status">
          <output data-feature-count aria-live="polite"></output>
          <div class="archive-feature-pages" aria-label="Choose featured artwork">
            ${featured.map((item,i) => `<button type="button" data-feature-page="${i}" aria-label="${html(item.title)}" title="${html(item.title)}"><span></span></button>`).join('')}
          </div>
          <span class="archive-gesture-hint">Swipe to browse <span aria-hidden="true">/</span> Tap art to enlarge</span>
        </div>
      </section>` : ''}
      <section id="file-cabinet" aria-labelledby="cabinet-heading">
        <div class="archive-cabinet-heading"><span class="eyebrow">Full collection</span><h2 id="cabinet-heading">File cabinet</h2><p>Swipe through a drawer, or open a folder to see its files together.</p></div>
        <div data-drawers></div>
      </section>
      <dialog class="archive-dialog" aria-labelledby="archive-preview-title">
        <div class="archive-titlebar"><span id="archive-preview-title" aria-live="polite">Artwork preview</span><button type="button" data-close-preview aria-label="Close artwork preview">×</button></div>
        <div class="archive-preview-stage">
          <div class="archive-preview-media"></div>
          ${button('Previous artwork in preview','←','data-preview-prev hidden')}
          ${button('Next artwork in preview','→','data-preview-next hidden')}
        </div>
        <div class="archive-preview-details"><p></p><a target="_blank" rel="noopener" class="archive-control">Open original file</a></div>
      </dialog>`;
    const $ = selector => root.querySelector(selector);
    const dialog = $('.archive-dialog');
    const previewMedia = $('.archive-preview-media');
    let previewOpener, previewBrowse;
    const previewPrev = $('[data-preview-prev]'), previewNext = $('[data-preview-next]');
    function renderPreview(item) {
        $('#archive-preview-title').textContent = item.title || item.name;
        $('.archive-preview-details p').textContent = item.description || '';
        $('.archive-preview-details a').href = item.file;
        const media = document.createElement(videoTypes.has(item.type) ? 'video' : 'img');
        if (media.tagName === 'VIDEO') {media.controls = true;media.playsInline = true;media.preload = 'metadata';media.setAttribute('aria-label',item.name);}
        else {media.alt = item.name;media.draggable = false;}
        media.src = item.file;
        previewMedia.replaceChildren(media);
    }
    function openArtwork(item, opener, browse) {
        if (!dialog.showModal) {window.open(item.file,'_blank','noopener');return;}
        if (dialog.open) return;
        previewOpener = opener;
        previewBrowse = browse;
        previewPrev.hidden = previewNext.hidden = !browse;
        dialog.classList.toggle('archive-dialog-feature',Boolean(browse));
        renderPreview(item);
        dialog.showModal();
    }
    function arrowKeys(element, move) {
        element.addEventListener('keydown',event => {
            if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
            if (move(event.key === 'ArrowLeft' ? -1 : 1) !== false) event.preventDefault();
        });
    }
    function swipeArtwork(stage, move) {
        let start = null, suppressClickUntil = 0;
        stage.addEventListener('pointerdown',event => {
            if (!event.isPrimary || event.button !== 0 || event.target.closest('.archive-control, video')) return;
            suppressClickUntil = 0;
            start = {id:event.pointerId,x:event.clientX,y:event.clientY};
        });
        stage.addEventListener('pointermove',event => {
            if (start?.id !== event.pointerId) return;
            const dx = Math.abs(event.clientX - start.x), dy = Math.abs(event.clientY - start.y);
            if (dx > 10 && dx > dy * 1.25 && !stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
        });
        stage.addEventListener('pointercancel',() => {start = null;});
        stage.addEventListener('pointerup',event => {
            if (start?.id !== event.pointerId) return;
            const dx = event.clientX - start.x, dy = event.clientY - start.y;
            start = null;
            if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                suppressClickUntil = performance.now() + 400;
                move(dx < 0 ? 1 : -1);
            }
        });
        stage.addEventListener('click',event => {
            if (event.detail && performance.now() < suppressClickUntil) {
                event.preventDefault();event.stopPropagation();
            }
        },true);
    }
    $('[data-close-preview]').addEventListener('click',() => dialog.close());
    dialog.addEventListener('click',event => {if(event.target === dialog) dialog.close();});
    dialog.addEventListener('close',() => {
        previewMedia.replaceChildren();
        previewBrowse = undefined;
        previewOpener?.focus({preventScroll:true});
        previewOpener = undefined;
    });
    previewPrev.addEventListener('click',() => previewBrowse?.(-1));
    previewNext.addEventListener('click',() => previewBrowse?.(1));
    arrowKeys(dialog,delta => previewBrowse ? previewBrowse(delta) : false);
    swipeArtwork(previewMedia,delta => previewBrowse?.(delta));

    if (featured.length) {
        let index = 0;
        const stage = $('[data-feature-stage]'), open = $('[data-feature-open]'), img = open.querySelector('img');
        const pages = [...root.querySelectorAll('[data-feature-page]')];
        function showFeature(i) {
            index = (i + featured.length) % featured.length;
            const item = featured[index];
            img.src = item.file; img.alt = item.name;
            open.setAttribute('aria-label','Enlarge ' + item.title);
            $('[data-feature-title]').textContent = item.title;
            $('[data-feature-description]').textContent = item.description;
            $('[data-feature-folder]').textContent = item.folder.title;
            $('[data-feature-link]').href = folderURL(item.folder);
            $('[data-feature-count]').textContent = `${String(index + 1).padStart(2,'0')} / ${String(featured.length).padStart(2,'0')}`;
            pages.forEach((page,n) => n === index ? page.setAttribute('aria-current','true') : page.removeAttribute('aria-current'));
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches && img.animate) {
                img.getAnimations().forEach(animation => animation.cancel());
                img.animate([{opacity:.55,transform:'translateY(5px) scale(.986)'},{opacity:1,transform:'none'}],{duration:230,easing:'ease-out'});
            }
        }
        const move = delta => showFeature(index + delta);
        $('[data-feature-prev]').addEventListener('click',() => move(-1));
        $('[data-feature-next]').addEventListener('click',() => move(1));
        pages.forEach((page,n) => page.addEventListener('click',() => showFeature(n)));
        for (const trigger of [open,$('[data-feature-maximize]')]) {
            trigger.addEventListener('click',() => openArtwork(featured[index],trigger,delta => {
                move(delta);
                renderPreview(featured[index]);
            }));
        }
        arrowKeys(stage,move);
        swipeArtwork(stage,move);
        showFeature(0);
    }

    function fileCard(item,i) {
        const preview = item.poster || (imageTypes.has(item.type) && item.type !== 'gif' ? item.file : '');
        const thumb = preview
            ? `<img src="${html(preview)}" alt="" draggable="false" loading="lazy" decoding="async">`
            : `<span class="archive-file-icon" aria-hidden="true">${html(item.type.toUpperCase())}</span>`;
        const inside = `<span class="archive-folder-back" aria-hidden="true"></span><span class="archive-thumb">${thumb}</span><span class="archive-folder-front"><span class="archive-file-name">${html(item.name)}</span><span class="archive-file-type">${html(item.folder.title)} · ${html(item.type.toUpperCase())}</span></span>`;
        return `<li>${imageTypes.has(item.type) || videoTypes.has(item.type)
            ? `<button type="button" class="archive-file" data-open-file="${i}">${inside}</button>`
            : `<a class="archive-file" href="${html(item.file)}" target="_blank" rel="noopener">${inside}</a>`}</li>`;
    }

    for (const group of groups) {
        const folders = foldersFor(group);
        const drawer = document.createElement('section');
        drawer.className = 'archive-drawer';
        drawer.id = 'drawer-' + group.slug;
        drawer.setAttribute('aria-labelledby',drawer.id + '-title');
        drawer.innerHTML = `
          <div class="archive-drawer-head">
            <div><h3 id="${drawer.id}-title">▰ ${html(group.title)}</h3><p>${html(group.note)}</p></div>
            <div class="archive-folder-picker">${folders.length > 1
                ? `<select aria-label="${html(group.title)} folder"><option value="">All folders</option>${folders.map(f => `<option value="${html(f.slug)}">${html(f.title)}</option>`).join('')}</select>`
                : ''}<a class="archive-control" data-folder-link>Open folder</a>
              <div class="archive-drawer-nav">
                <output></output>
                ${button('Previous '+html(group.title)+' files','←','data-rail-prev')}
                ${button('Next '+html(group.title)+' files','→','data-rail-next')}
              </div>
            </div>
          </div>
          <ul class="archive-rail" tabindex="0" aria-label="${html(group.title)} files"></ul>`;
        $('[data-drawers]').append(drawer);
        const rail = drawer.querySelector('.archive-rail');
        const prev = drawer.querySelector('[data-rail-prev]'), next = drawer.querySelector('[data-rail-next]');
        const picker = drawer.querySelector('select'), link = drawer.querySelector('[data-folder-link]');
        const count = drawer.querySelector('output');
        const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
        let entries = [];
        const maxScroll = () => Math.max(0,rail.scrollWidth - rail.clientWidth);
        const stride = () => rail.children.length > 1 ? rail.children[1].offsetLeft - rail.children[0].offsetLeft : rail.clientWidth || 1;
        function sync() {
            const end = maxScroll(), left = Math.max(0,rail.scrollLeft);
            prev.disabled = left < 2;next.disabled = end - left < 2;
        }
        function showFolder() {
            const selected = folders.find(f => f.slug === picker?.value) || (folders.length === 1 ? folders[0] : null);
            entries = (selected ? [selected] : folders).flatMap(folder => folder.files.map(file => ({...file,folder})));
            link.hidden = !selected;
            if (selected) link.href = folderURL(selected);
            rail.innerHTML = entries.map(fileCard).join('') || '<li>No files in this drawer.</li>';
            rail.scrollLeft = 0;
            count.textContent = `${entries.length} ${entries.length === 1 ? 'file' : 'files'}`;
            sync();
        }
        const move = delta => rail.scrollBy({left:delta * stride(),behavior:motion()});
        prev.addEventListener('click',() => move(-1));
        next.addEventListener('click',() => move(1));
        rail.addEventListener('scroll',sync,{passive:true});
        rail.addEventListener('keydown',event => {
            if (event.target !== rail || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
            event.preventDefault();move(event.key === 'ArrowLeft' ? -1 : 1);
        });
        let drag = null, ignoreClick = false;
        rail.addEventListener('pointerdown',event => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return;
            ignoreClick = false;
            drag = {id:event.pointerId,x:event.clientX,left:rail.scrollLeft};
        });
        rail.addEventListener('pointermove',event => {
            if (drag?.id !== event.pointerId || !(event.buttons & 1) || maxScroll() < 2) return;
            const dx = event.clientX - drag.x;
            if (!ignoreClick && Math.abs(dx) < 9) return;
            if (!ignoreClick) {
                ignoreClick = true;
                rail.classList.add('is-dragging');
                rail.setPointerCapture(event.pointerId);
            }
            rail.scrollLeft = drag.left - dx;
        });
        const endDrag = () => {drag = null;rail.classList.remove('is-dragging');};
        rail.addEventListener('pointerup',endDrag);
        rail.addEventListener('pointercancel',endDrag);
        rail.addEventListener('lostpointercapture',endDrag);
        rail.addEventListener('click',event => {
            if (ignoreClick && event.detail) {event.preventDefault();return;}
            const opener = event.target.closest('[data-open-file]');
            if (opener) openArtwork(entries[Number(opener.dataset.openFile)],opener);
        });
        picker?.addEventListener('change',showFolder);
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sync).observe(rail);
        else window.addEventListener('resize',sync);
        showFolder();
    }
})();
