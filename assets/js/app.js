(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s),
    $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const menu = $('#mobile-menu'),
    toggle = $('.menu-toggle');
  let menuAnimation = null;
  function setMenu(open) {
    const wasHidden = menu.hidden,
      start = wasHidden ? 'inset(0 0 100% 0)' : getComputedStyle(menu).clipPath;
    menuAnimation?.cancel();
    menu.hidden = false;
    menu.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open
      ? 'Close <span aria-hidden="true">−</span>'
      : 'Menu <span aria-hidden="true">＋</span>';
    document.body.classList.add('menu-open');
    $('#main').inert = true;
    $('.site-footer').inert = true;
    const finish = () => {
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      $('#main').inert = open;
      $('.site-footer').inert = open;
      menuAnimation?.cancel();
      menuAnimation = null;
    };
    if (
      document.documentElement.classList.contains('motion-paused') ||
      matchMedia('(prefers-reduced-motion:reduce)').matches
    ) {
      finish();
      if (open) $('a', menu).focus();
      return;
    }
    menuAnimation = menu.animate(
      [
        { clipPath: start === 'none' ? 'inset(0 0 0% 0)' : start },
        { clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' },
      ],
      { duration: open ? 540 : 380, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' },
    );
    menuAnimation.onfinish = finish;
    if (open) {
      $('a', menu).focus();
      $$('a', menu).forEach((a, i) =>
        a.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 500,
            delay: 70 + i * 45,
            easing: 'cubic-bezier(.22,1,.36,1)',
            fill: 'backwards',
          },
        ),
      );
    }
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (!menu.hidden) {
      if (e.key === 'Escape') {
        setMenu(false);
        toggle.focus();
      }
      if (e.key === 'Tab') {
        const items = [toggle, ...$$('a', menu)],
          first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) setMenu(false);
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduced.matches;
  function setMotion(value) {
    motionPaused = value;
    document.documentElement.classList.toggle('motion-paused', value);
    $$('[data-motion-toggle]').forEach((b) => {
      b.textContent = value ? 'Enable motion' : 'Pause motion';
      b.setAttribute('aria-pressed', String(value));
    });
    document.dispatchEvent(new CustomEvent('insight:motion', { detail: { paused: value } }));
  }
  setMotion(motionPaused);
  $$('[data-motion-toggle]').forEach((b) =>
    b.addEventListener('click', () => setMotion(!motionPaused)),
  );
  reduced.addEventListener('change', (e) => setMotion(e.matches));
  if ('IntersectionObserver' in window && !motionPaused) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.classList.remove('will-reveal');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.06, rootMargin: '0px 0px 50px 0px' },
    );
    $$('.reveal').forEach((el) => {
      el.classList.add('will-reveal');
      observer.observe(el);
    });
  }
  const progress = $('.reading-progress');
  let scheduled = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    scheduled = false;
  }
  addEventListener(
    'scroll',
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true },
  );
  addEventListener('resize', updateProgress);
  updateProgress();
  $$('[data-filter]').forEach((button) =>
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      let count = 0;
      $$('.project-card').forEach((card) => {
        const show = category === 'All' || card.dataset.category === category;
        card.hidden = !show;
        if (show) {
          count++;
          card.classList.add('is-visible');
          card.classList.remove('will-reveal');
        }
      });
      $('.archive-grid')?.classList.toggle('is-filtered', category !== 'All');
      $('#filter-count').textContent = `${count} project${count === 1 ? '' : 's'}`;
    }),
  );
  const consentKey = 'insight-v2-privacy',
    banner = $('.cookie-banner'),
    dialog = $('.cookie-dialog');
  dialog.setAttribute('aria-label', 'Privacy preferences');
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(consentKey) || 'null');
  } catch {}
  if (!stored || stored.version !== 1 || Date.now() - stored.savedAt > 180 * 86400000)
    banner.hidden = false;
  function saveConsent() {
    try {
      localStorage.setItem(
        consentKey,
        JSON.stringify({ version: 1, essential: true, savedAt: Date.now() }),
      );
    } catch {}
    banner.hidden = true;
    dialog.close();
  }
  $$('[data-cookie-accept],[data-cookie-save]').forEach((b) =>
    b.addEventListener('click', saveConsent),
  );
  $$('[data-cookie-settings]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!menu.hidden) setMenu(false);
      dialog.showModal();
    }),
  );
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        dialog.close();
    }
  });
  const film = $('.film-dialog'),
    video = film && $('video', film);
  $('[data-open-film]')?.addEventListener('click', () => {
    film.showModal();
    video.play().catch(() => {});
  });
  $('.film-close')?.addEventListener('click', () => {
    video.pause();
    film.close();
  });
  film?.addEventListener('close', () => video.pause());
  const form = $('#inquiry-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const status = $('.form-status', form),
      submit = $('button[type=submit]', form);
    if (form.elements.botcheck.checked) return;
    submit.disabled = true;
    submit.textContent = 'Sending your inquiry…';
    status.textContent = '';
    status.dataset.state = '';
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const data = Object.fromEntries(new FormData(form));
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Delivery failed');
      status.dataset.state = 'success';
      status.textContent =
        'Thank you. Your inquiry has been sent to the studio. We look forward to speaking with you.';
      form.reset();
    } catch {
      status.dataset.state = 'error';
      status.textContent =
        'Your inquiry could not be sent. Please try again or email insightstudio27@gmail.com. Your details have been kept in the form.';
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
      submit.innerHTML = 'Send your inquiry <span aria-hidden="true">↗</span>';
    }
  });
})();
