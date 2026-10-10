// Show the opening drawing until a decoded frame matches the section's scroll position.
(() => {
  const film = document.querySelector('#construction-scroll-video'),
    stage = document.querySelector('#manifesto');
  if (!film || !stage) return;
  const label = document.querySelector('#construction-stage'),
    progressLine = document.querySelector('.construction-progress');
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  let paused = document.documentElement.classList.contains('motion-paused') || preference.matches;
  let visible = false,
    frame = 0,
    targetTime = 0,
    started = false;
  const duration = () =>
    Number.isFinite(film.duration) ? Math.max(0, film.duration - 0.06) : 11.96;
  function ready() {
    if (film.readyState >= 2 && !film.seeking && Math.abs(film.currentTime - targetTime) < 0.08)
      film.classList.add('is-scroll-ready');
  }
  function seek() {
    if (film.readyState < 1 || film.seeking) return;
    if (Math.abs(film.currentTime - targetTime) > 0.035) {
      try {
        film.currentTime = targetTime;
      } catch {}
    } else ready();
  }
  function update() {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const p = paused
      ? 0
      : Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    targetTime = p * duration();
    // Above the section, never display a retained later frame after back navigation.
    if (p === 0 && film.currentTime > 0.08) film.classList.remove('is-scroll-ready');
    if (visible || started) seek();
    progressLine.style.transform = `scaleX(${p})`;
    label.textContent =
      p < 0.23
        ? '01 / THE PLAN'
        : p < 0.51
          ? '02 / THE STRUCTURE'
          : p < 0.8
            ? '03 / THE LIGHT'
            : '04 / THE PLACE';
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !started) {
        started = true;
        film.preload = 'auto';
        film.load();
      }
      schedule();
    },
    { rootMargin: '300px' },
  ).observe(stage);
  film.addEventListener('seeked', () => {
    seek();
    ready();
  });
  for (const name of ['loadedmetadata', 'loadeddata', 'canplay', 'durationchange'])
    film.addEventListener(name, schedule);
  film.addEventListener('error', () => film.classList.remove('is-scroll-ready'));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('pageshow', () => {
    film.classList.remove('is-scroll-ready');
    schedule();
  });
  document.fonts?.ready.then(schedule);
  document.addEventListener('insight:motion', (event) => {
    paused = event.detail.paused || preference.matches;
    schedule();
  });
  preference.addEventListener('change', () => {
    paused = preference.matches || document.documentElement.classList.contains('motion-paused');
    schedule();
  });
  update();
})();
