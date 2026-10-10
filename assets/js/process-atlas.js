(() => {
  const root = document.querySelector('.process-atlas');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-atlas-stage]')],
    panels = [...root.querySelectorAll('.atlas-panel')];
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  const reduced = () =>
    document.documentElement.classList.contains('motion-paused') || preference.matches;
  let active = 0,
    animations = [],
    revision = 0;
  root.classList.add('atlas-motion-ready');
  function settle() {
    revision++;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    panels.forEach((panel, i) => {
      panel.hidden = i !== active;
      panel.inert = i !== active;
      panel.style.opacity = '';
      panel.style.zIndex = '';
      panel.removeAttribute('aria-hidden');
    });
  }
  function select(index, focusTarget) {
    if (index < 0 || index >= tabs.length || index === active) return;
    const direction = index > active ? 1 : -1;
    // Preserve the current frame when another stage is chosen mid-transition.
    const snapshots = panels.map((panel) => ({
      visible: !panel.hidden,
      opacity: panel.hidden ? 0 : Number(getComputedStyle(panel).opacity),
      parts: [
        ...panel.querySelectorAll('.atlas-sheet svg,.atlas-narrative > :not(.atlas-large-number)'),
      ].map((element) => ({ element, translate: getComputedStyle(element).translate })),
    }));
    const token = ++revision;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.inert = i !== index;
      panel.style.zIndex = i === index ? '2' : '1';
      if (i !== index) panel.setAttribute('aria-hidden', 'true');
      else panel.removeAttribute('aria-hidden');
    });
    panels[index].hidden = false;
    // Move keyboard focus before retiring the outgoing panel.
    if (focusTarget === 'tab') tabs[index].focus({ preventScroll: true });
    if (focusTarget === 'next' || focusTarget === 'prev') {
      const control = panels[index].querySelector('[data-atlas-' + focusTarget + ']');
      (control && !control.disabled ? control : tabs[index]).focus({ preventScroll: true });
    }
    if (reduced()) {
      settle();
      return;
    }
    const easing = 'cubic-bezier(.22,1,.36,1)';
    panels.forEach((panel, i) => {
      if (i !== index && !snapshots[i].visible) return;
      panel.hidden = false;
      const animation = panel.animate(
        [{ opacity: snapshots[i].opacity }, { opacity: i === index ? 1 : 0 }],
        { duration: i === index ? 560 : 320, easing, fill: 'both' },
      );
      animations.push(animation);
    });
    snapshots[index].parts.forEach(({ element, translate }, i) => {
      const distance = element.matches('svg') ? 20 : 12;
      animations.push(
        element.animate(
          [
            { translate: snapshots[index].visible ? translate : direction * distance + 'px 0' },
            { translate: '0px 0px' },
          ],
          {
            duration: 620,
            delay: snapshots[index].visible ? 0 : Math.min(i * 24, 100),
            easing,
            fill: 'both',
          },
        ),
      );
    });
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (token === revision) settle();
      })
      .catch(() => {});
    window.insightScroll?.resize();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key))
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        if (next === active) tabs[next].focus({ preventScroll: true });
        else select(next, 'tab');
      }
    });
  });
  root
    .querySelectorAll('[data-atlas-next]')
    .forEach((button) => button.addEventListener('click', () => select(active + 1, 'next')));
  root
    .querySelectorAll('[data-atlas-prev]')
    .forEach((button) => button.addEventListener('click', () => select(active - 1, 'prev')));
  document.addEventListener('insight:motion', (event) => {
    if (event.detail.paused) settle();
  });
  preference.addEventListener('change', () => {
    if (preference.matches) settle();
  });
  settle();
})();
