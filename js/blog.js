(() => {
  const posts = (window.BOOTLEG_BLOG_POSTS || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  const root = document.querySelector('[data-blog-grid]');
  if (!root) return;
  const filters = document.querySelector('[data-blog-filters]');
  const search = document.querySelector('[data-blog-search]');
  const count = document.querySelector('[data-blog-count]');
  const categories = ['All', ...new Set(posts.map(p => p.category))];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current = 'All';
  function render() {
    const query = (search?.value || '').trim().toLowerCase();
    const shown = posts.filter(p => (current === 'All' || p.category === current) && (!query || [p.title,p.excerpt,p.category].join(' ').toLowerCase().includes(query)));
    root.innerHTML = shown.map(p => `<a class="card blog-card" href="${escape(p.href)}"><img class="blog-card-image" src="${escape(p.image)}" alt="" loading="lazy"><div class="card-content"><span class="tag">${escape(p.category)}</span><span class="blog-date">${p.updated ? 'Updated ' : ''}${new Date((p.updated || p.date)+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span><h3>${escape(p.title)}</h3><p>${escape(p.excerpt)}</p><span class="project-open">Read article →</span></div></a>`).join('') || '<p>No articles match. Try a different search or category.</p>';
    if (count) count.textContent = `${shown.length} article${shown.length === 1 ? '' : 's'}`;
  }
  if (filters) {
    filters.replaceChildren();
    for (const category of categories) {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'btn blog-filter' + (category === 'All' ? ' active' : '');
      button.textContent = category; button.dataset.blogCategory = category;
      button.setAttribute('aria-pressed', String(category === 'All'));
      button.addEventListener('click', () => {
        current = category;
        filters.querySelectorAll('button').forEach(b => { const active = b === button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
        render();
      });
      filters.append(button);
    }
  }
  search?.addEventListener('input', render);
  render();
})();
