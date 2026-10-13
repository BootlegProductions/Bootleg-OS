// YouTube supplies the public count inside its official Subscribe button.
// Re-rendering the widget fetches its current public value without an API key.
(() => {
  const container = document.getElementById('youtube-subscribe-widget');
  if (!container) return;

  const interval = 2 * 60 * 1000;
  let lastRefresh = Date.now();

  function refresh() {
    if (document.hidden || !window.gapi?.ytsubscribe?.go) return;

    const button = document.createElement('div');
    button.className = 'g-ytsubscribe';
    button.dataset.channelid = 'UCKfnhWvIqqC7B-PVwYDuy6Q';
    button.dataset.layout = 'default';
    button.dataset.theme = 'default';
    button.dataset.count = 'default';
    container.replaceChildren(button);
    window.gapi.ytsubscribe.go(container);
    lastRefresh = Date.now();
  }

  window.setInterval(refresh, interval);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastRefresh >= interval) refresh();
  });
})();
