// Runs before the first paint so the destination never flashes behind an orange wipe.
(() => {
  const root = document.documentElement;
  try {
    const entry = JSON.parse(sessionStorage.getItem('insight-navigation') || 'null');
    sessionStorage.removeItem('insight-navigation');
    if (
      entry &&
      Date.now() - entry.at < 20000 &&
      entry.path === location.pathname &&
      !matchMedia('(prefers-reduced-motion:reduce)').matches
    ) {
      root.classList.add('nav-arrival');
      window.__insightArrival = true;
      // Do not leave a visitor behind a curtain if a later script cannot load.
      window.__insightArrivalFallback = setTimeout(
        () => root.classList.remove('nav-arrival'),
        1800,
      );
    }
  } catch {}
})();
