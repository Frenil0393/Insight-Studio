(() => {
  if (!window.isSecureContext) return;
  if ('serviceWorker' in navigator) {
    window.addEventListener(
      'load',
      () => {
        const base = new URL(
          '../../',
          document.querySelector('script[src*="assets/js/install.js"]').src,
        );
        navigator.serviceWorker
          .register(new URL('sw.js', base), { scope: base.pathname, updateViaCache: 'none' })
          .catch(() => {});
      },
      { once: true },
    );
  }
  const button = document.querySelector('[data-install-app]');
  const dialog = document.querySelector('.install-help');
  if (!button || !dialog) return;
  const standalone = matchMedia('(display-mode:standalone)');
  let pending = null;
  const sync = () => {
    button.hidden = standalone.matches || navigator.standalone === true;
  };
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pending = event;
    sync();
  });
  window.addEventListener('appinstalled', () => {
    pending = null;
    button.hidden = true;
  });
  standalone.addEventListener('change', sync);
  button.addEventListener('click', async () => {
    if (!pending) {
      dialog.showModal();
      return;
    }
    const request = pending;
    pending = null;
    try {
      await request.prompt();
      await request.userChoice;
    } catch {
      dialog.showModal();
    }
  });
  dialog.querySelector('[data-close-install]').addEventListener('click', () => dialog.close());
  sync();
})();
