// Article text and links work without these progressive reading helpers.
(() => {
  const article = document.querySelector('.blog-post .content-article');
  if (!article) return;
  const toc = document.querySelector('[data-article-toc]');
  const headings = [...article.querySelectorAll('h2')];
  if (toc && headings.length) {
    const used = new Set([...document.querySelectorAll('[id]')].map(el => el.id));
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const root = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let id = root, suffix = index + 1;
        while (used.has(id)) id = root + '-' + suffix++;
        heading.id = id; used.add(id);
      }
      const item = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + heading.id; link.textContent = heading.textContent;
      item.append(link); toc.append(item);
    });
    toc.closest('details').hidden = false;
  }
  article.querySelectorAll('.command-card pre code').forEach(code => {
    const original = code.textContent, lines = original.split('\n');
    code.replaceChildren();
    lines.forEach((line, lineIndex) => {
      let first = true;
      for (const token of line.split(/("[^"]*"|'[^']*'|\s+|\|)/g).filter(Boolean)) {
        if (/^\s+$/.test(token)) { code.append(token); continue; }
        const span = document.createElement('span');
        span.className = token === '|' ? 'cmd-pipe' : /^['"]/.test(token) ? 'cmd-string' : token.startsWith('-') ? 'cmd-option' : first ? 'cmd-program' : '';
        span.textContent = token; code.append(span); first = token === '|';
      }
      if (lineIndex < lines.length - 1) code.append('\n');
    });
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'copy-command'; button.textContent = 'Copy commands';
    button.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(original); button.textContent = 'Copied'; }
      catch { button.textContent = 'Select the code to copy'; }
      setTimeout(() => { button.textContent = 'Copy commands'; }, 2500);
    });
    code.closest('.command-card').prepend(button);
  });
})();
