// Launch the real Python/Pygame build only when the visitor requests it.
(() => {
  const screen = document.getElementById('pipboy-screen');
  const device = document.getElementById('pipboy-device');
  const start = document.getElementById('pipboy-start');
  const stop = document.getElementById('pipboy-stop');
  const status = document.getElementById('pipboy-status');
  let frame = null;
  let loadingTimer = null;

  function stopBeta(message = 'Beta stopped. Your local progress is saved.') {
    clearTimeout(loadingTimer);
    frame?.remove();
    frame = null;
    screen.innerHTML = '<div class="pipboy-beta-idle"><strong>PI-BOY / V0.4</strong><span>Ready when you are.</span></div>';
    start.disabled = false;
    stop.disabled = true;
    status.textContent = message;
  }

  start.addEventListener('click', () => {
    if (frame) return;
    screen.replaceChildren();
    frame = document.createElement('iframe');
    frame.title = 'Interactive Pi-Boy V0.4 Pygame prototype';
    frame.src = '../pipboy-beta/index.html?v=3';
    frame.allow = 'autoplay';
    screen.append(frame);
    start.disabled = true;
    stop.disabled = false;
    status.textContent = 'Loading Pi-Boy… when prompted, tap the screen to start and enable sound.';
    loadingTimer = setTimeout(() => {
      stopBeta('Startup timed out. Check your connection and try Start beta again. Python/Pygame must be downloadable from pygame-web.github.io.');
    }, 180000);
  });

  stop.addEventListener('click', () => stopBeta());
  document.getElementById('pipboy-scale').addEventListener('change', event => {
    device.style.setProperty('--pipboy-screen-width', `${480 * Number(event.target.value)}px`);
  });
  document.getElementById('pipboy-reset').addEventListener('click', () => {
    if (!window.confirm('Reset this browser’s Pi-Boy beta character, inventory, perks, notes and quests?')) return;
    stopBeta('Beta save reset. Start again for a fresh prototype.');
    try { localStorage.removeItem('bootleg-pipboy-beta-v04'); }
    catch { status.textContent = 'This browser did not allow the beta save to be reset.'; }
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
    let message;
    try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; }
    catch { return; }
    if (message?.type !== 'pipboy-beta') return;
    if (message.state === 'ready') {
      clearTimeout(loadingTimer);
      status.textContent = 'Beta running. Click the screen to focus keyboard controls. Changes save locally every second.';
    } else if (message.state === 'loading') {
      status.textContent = message.detail || 'Loading Pi-Boy…';
      if (message.detail?.includes('Tap the screen')) clearTimeout(loadingTimer);
    } else if (message.state === 'stopped') stopBeta();
    else if (message.state === 'error') {
      clearTimeout(loadingTimer);
      stopBeta(`Unable to start Pi-Boy: ${message.detail || 'runtime loading failed'}. Try Start beta again.`);
    }
  });
})();
