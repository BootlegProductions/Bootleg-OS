(() => {
  document.querySelectorAll("[data-comments-post]").forEach(section => {
    const key = "bootlegComments:" + section.dataset.commentsPost;
    const form = section.querySelector(".comment-form");
    const list = section.querySelector(".comment-list");
    const read = () => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
    const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
    const render = () => { const comments = read(); list.innerHTML = comments.length ? comments.map(c => `<article class="comment"><strong>${escapeHtml(c.name)}</strong><time>${escapeHtml(c.date)}</time><p>${escapeHtml(c.comment)}</p></article>`).join("") : '<p class="comments-empty">No comments yet. Be first through the door.</p>'; };
    form?.addEventListener("submit", event => { event.preventDefault(); const data = new FormData(form); const comments = read(); comments.unshift({name:data.get("name"), comment:data.get("comment"), date:new Date().toLocaleString()}); localStorage.setItem(key, JSON.stringify(comments)); form.reset(); render(); });
    render();
  });
})();
