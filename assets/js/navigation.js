(() => {
  const root = document.documentElement;
  const reduced = () =>
    root.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;
  const curtain = document.createElement('div');
  curtain.className = 'page-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  const logo = document.querySelector('.brand-logo-svg').cloneNode(true);
  logo.setAttribute('class', 'curtain-logo');
  const word = document.createElement('span');
  word.textContent = 'insight.';
  const note = document.createElement('small');
  note.textContent = 'A NEW PERSPECTIVE';
  curtain.append(logo, word, note);
  document.body.append(curtain);
  let leaving = false,
    arrivalTimer,
    leaveTimer;
  const emit = (phase) => {
    root.dataset.navigationPhase = phase;
    document.dispatchEvent(new CustomEvent('insight:navigation', { detail: { phase } }));
  };
  function clear() {
    clearTimeout(arrivalTimer);
    clearTimeout(leaveTimer);
    clearTimeout(window.__insightArrivalFallback);
    leaving = false;
    curtain.style.transition = 'none';
    root.classList.remove('nav-arrival', 'nav-departing');
    curtain.classList.remove('is-covering', 'is-opening', 'is-entering');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!leaving) curtain.style.transition = '';
      }),
    );
    emit('ready');
  }
  function open() {
    clearTimeout(window.__insightArrivalFallback);
    if (!window.__insightArrival || reduced()) {
      root.classList.remove('nav-arrival');
      return;
    }
    curtain.style.transition = 'none';
    curtain.classList.add('is-covering');
    root.classList.remove('nav-arrival');
    emit('opening');
    // Let the covered frame paint before moving the curtain off the destination.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        curtain.style.transition = '';
        curtain.classList.add('is-opening');
        curtain.classList.remove('is-covering');
        arrivalTimer = setTimeout(clear, 820);
      }),
    );
    window.__insightArrival = false;
  }
  open();
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (
      !anchor ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target ||
      anchor.hasAttribute('download')
    )
      return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.hash) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      event.preventDefault();
      return;
    }
    if (leaving) {
      event.preventDefault();
      return;
    }
    if (reduced()) return;
    event.preventDefault();
    leaving = true;
    clearTimeout(arrivalTimer);
    // Recover a partially completed incoming wipe before beginning the next route.
    curtain.style.transition = 'none';
    curtain.classList.remove('is-opening', 'is-covering');
    root.classList.add('nav-departing');
    emit('closing');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        curtain.style.transition = '';
        curtain.classList.add('is-covering');
        leaveTimer = setTimeout(() => {
          try {
            sessionStorage.setItem(
              'insight-navigation',
              JSON.stringify({ path: url.pathname, at: Date.now() }),
            );
          } catch {}
          location.assign(url.href);
        }, 740);
      }),
    );
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted) clear();
  });
  document.addEventListener('insight:motion', (event) => {
    if (event.detail.paused && !leaving) clear();
  });
})();
