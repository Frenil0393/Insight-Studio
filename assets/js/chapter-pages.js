(() => {
  const reduced = () =>
    document.documentElement.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;
  const animate = (element) => {
    if (!reduced())
      element.animate(
        [
          { opacity: 0.25, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
  };

  const archive = document.querySelector('.archive-grid'),
    viewButtons = [...document.querySelectorAll('[data-archive-view]')];
  if (archive && viewButtons.length) {
    document.querySelector('.archive-view-switch').hidden = false;
    viewButtons.forEach((button) =>
      button.addEventListener('click', () => {
        const gallery = button.dataset.archiveView === 'gallery';
        if (archive.classList.contains('is-gallery') === gallery) return;
        archive.classList.toggle('is-gallery', gallery);
        viewButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        archive
          .querySelectorAll('.index-project-image')
          .forEach((image) => (image.style.transform = ''));
        animate(archive);
        window.insightScroll?.resize();
      }),
    );
  }

  const projectHero = document.querySelector('.project-hero'),
    imageScale = document.querySelector('#project-image-scale');
  if (projectHero && imageScale) {
    document.querySelector('.project-reading-control').hidden = false;
    imageScale.addEventListener('input', () => {
      const scale = Number(imageScale.value) / 100;
      projectHero.style.setProperty('--reading-zoom', String(scale));
      document.querySelector('#project-image-scale-value').textContent = `${scale.toFixed(1)}×`;
    });
    projectHero.addEventListener(
      'pointermove',
      (event) => {
        if (
          event.pointerType !== 'mouse' ||
          reduced() ||
          Number(imageScale.value) <= 100 ||
          event.target.closest('input,label,.project-reading-control')
        )
          return;
        const rect = projectHero.getBoundingClientRect();
        projectHero.style.setProperty(
          '--reading-x',
          `${Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100))}%`,
        );
        projectHero.style.setProperty(
          '--reading-y',
          `${Math.max(10, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100))}%`,
        );
      },
      { passive: true },
    );
    projectHero.addEventListener('pointerleave', () => {
      projectHero.style.setProperty('--reading-x', '50%');
      projectHero.style.setProperty('--reading-y', '50%');
    });
  }
  const chapters = [...document.querySelectorAll('.project-chapters a[href^="#"]')];
  if (chapters.length) {
    const sections = chapters
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top < innerHeight * 0.42) current = section;
      });
      chapters.forEach((link) => {
        const active = link.hash === `#${current.id}`;
        link.classList.toggle('is-current', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    addEventListener(
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(update);
      },
      { passive: true },
    );
    update();
  }
})();
