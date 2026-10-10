(() => {
  const root = document.documentElement;
  const reduced = () =>
    root.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;
  // Native page scrolling remains the source of truth; this rail controls it.
  const rail = document.createElement('div'),
    thumb = document.createElement('span');
  rail.className = 'architect-scrollbar';
  rail.tabIndex = 0;
  rail.setAttribute('role', 'scrollbar');
  rail.setAttribute('aria-label', 'Page scroll position');
  rail.setAttribute('aria-controls', 'main');
  rail.setAttribute('aria-orientation', 'vertical');
  rail.setAttribute('aria-valuemin', '0');
  rail.setAttribute('aria-valuemax', '100');
  thumb.className = 'architect-scroll-thumb';
  rail.append(thumb);
  document.body.append(rail);
  root.classList.add('custom-scroll-enabled');
  let drag = false,
    startY = 0,
    startScroll = 0,
    travel = 0,
    max = 0,
    raf = 0;
  function update() {
    raf = 0;
    max = Math.max(0, root.scrollHeight - innerHeight);
    const h = rail.clientHeight,
      size = Math.min(h, Math.max(40, (h * innerHeight) / root.scrollHeight));
    travel = h - size;
    thumb.style.height = `${size}px`;
    thumb.style.transform = `translateY(${max ? Math.min(1, Math.max(0, scrollY / max)) * travel : 0}px)`;
    rail.setAttribute('aria-valuenow', String(Math.round(max ? (scrollY / max) * 100 : 0)));
    rail.hidden = max < 2;
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }
  function move(y) {
    const target = Math.max(0, Math.min(max, y));
    if (window.insightScroll)
      window.insightScroll.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo({ top: target, behavior: 'instant' });
    schedule();
  }
  rail.addEventListener('pointerdown', (e) => {
    if (
      e.button !== 0 ||
      document.querySelector('dialog[open]') ||
      document.body.classList.contains('menu-open')
    )
      return;
    e.preventDefault();
    update();
    rail.focus({ preventScroll: true });
    drag = true;
    rail.classList.add('is-dragging');
    window.insightScroll?.stop();
    rail.setPointerCapture(e.pointerId);
    if (e.target !== thumb) {
      const r = rail.getBoundingClientRect();
      move(((e.clientY - r.top - thumb.clientHeight / 2) / Math.max(1, travel)) * max);
    }
    startY = e.clientY;
    startScroll = scrollY;
  });
  rail.addEventListener('pointermove', (e) => {
    if (drag) move(startScroll + ((e.clientY - startY) / Math.max(1, travel)) * max);
  });
  function end() {
    drag = false;
    rail.classList.remove('is-dragging');
    if (
      !document.querySelector('dialog[open]') &&
      !document.body.classList.contains('menu-open') &&
      (!root.dataset.navigationPhase || root.dataset.navigationPhase === 'ready')
    )
      window.insightScroll?.start();
  }
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointercancel', end);
  rail.addEventListener('lostpointercapture', end);
  rail.addEventListener('keydown', (e) => {
    const destinations = {
      ArrowDown: scrollY + 80,
      ArrowUp: scrollY - 80,
      PageDown: scrollY + innerHeight * 0.85,
      PageUp: scrollY - innerHeight * 0.85,
      Home: 0,
      End: max,
    };
    if (e.key in destinations) {
      e.preventDefault();
      move(destinations[e.key]);
    }
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(document.body);
  update();

  document.querySelectorAll('details.discipline').forEach((details) => {
    const summary = details.querySelector('summary'),
      content = details.querySelector('.discipline-detail');
    let animation = null,
      intent = details.open;
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      intent = !intent;
      const from = details.getBoundingClientRect().height;
      animation?.cancel();
      details.style.height = '';
      details.style.overflow = 'hidden';
      details.open = true;
      content.inert = !intent;
      const to = intent
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height;
      if (reduced()) {
        details.open = intent;
        details.style.overflow = '';
        return;
      }
      animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 520,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both',
      });
      animation.onfinish = () => {
        details.open = intent;
        animation.cancel();
        animation = null;
        details.style.overflow = '';
      };
    });
  });

  const select = document.querySelector('#service');
  if (!select) return;
  const wrap = document.createElement('div');
  wrap.className = 'project-select';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'project-select-trigger';
  button.id = 'service-trigger';
  button.setAttribute('role', 'combobox');
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'service-options');
  button.setAttribute('aria-required', 'true');
  const panel = document.createElement('div');
  panel.className = 'project-select-panel';
  panel.inert = true;
  const list = document.createElement('div');
  list.className = 'project-select-options';
  list.id = 'service-options';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Project type');
  list.dataset.lenisPrevent = '';
  panel.append(list);
  const options = [...select.options].slice(1).map((option, i) => {
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.id = `service-option-${i}`;
    item.tabIndex = -1;
    item.textContent = option.text;
    item.dataset.value = option.value;
    list.append(item);
    return item;
  });
  select.after(wrap);
  wrap.append(button, panel);
  select.classList.add('enhanced-native-select');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  const label = document.querySelector('label[for="service"]');
  label.id = 'service-label';
  label.htmlFor = button.id;
  button.setAttribute('aria-labelledby', 'service-label service-trigger');
  let open = false,
    focusIndex = 0;
  function sync() {
    button.textContent = select.options[select.selectedIndex].text;
    button.dataset.placeholder = String(!select.value);
    options.forEach((item) =>
      item.setAttribute('aria-selected', String(item.dataset.value === select.value)),
    );
    button.removeAttribute('aria-invalid');
  }
  function setOpen(value, focus = true) {
    open = value;
    wrap.classList.toggle('is-open', value);
    button.setAttribute('aria-expanded', String(value));
    panel.inert = !value;
    if (value) {
      focusIndex = Math.max(
        0,
        options.findIndex((item) => item.dataset.value === select.value),
      );
      if (focus) options[focusIndex].focus({ preventScroll: true });
    } else if (focus) button.focus({ preventScroll: true });
  }
  button.addEventListener('click', () => setOpen(!open));
  options.forEach((item, i) => {
    item.addEventListener('click', () => {
      select.value = item.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      setOpen(false);
    });
    item.addEventListener('focus', () => {
      focusIndex = i;
    });
  });
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === 'Tab') {
      setOpen(false, false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      focusIndex =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? options.length - 1
            : (focusIndex + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[focusIndex].focus({ preventScroll: true });
      options[focusIndex].scrollIntoView({ block: 'nearest' });
    }
    if (open && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      options[focusIndex].click();
    }
    if (open && e.key.length === 1 && /\S/.test(e.key)) {
      const index = options.findIndex((o) =>
        o.textContent.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      if (index >= 0) {
        focusIndex = index;
        options[index].focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (open && !wrap.contains(e.target)) setOpen(false, false);
  });
  wrap.addEventListener('focusout', () =>
    queueMicrotask(() => {
      if (open && !wrap.contains(document.activeElement)) setOpen(false, false);
    }),
  );
  select.addEventListener('invalid', (e) => {
    e.preventDefault();
    button.setAttribute('aria-invalid', 'true');
    button.focus();
    setOpen(true, false);
  });
  select.addEventListener('change', sync);
  select.form.addEventListener('reset', () => setTimeout(sync, 0));
  sync();
})();
