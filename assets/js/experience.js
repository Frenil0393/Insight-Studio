(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(pointer:fine)');
  let paused =
    document.documentElement.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;
  const hero = $('.spatial-hero'),
    manifesto = $('.manifesto-stage'),
    ribbon = $('.kinetic-ribbon'),
    invitation = $('.invitation-scene');
  const words = [];
  const statement = $('[data-word-reveal]');
  if (statement) {
    const text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.textContent = '';
    text.split(/\s+/).forEach((word) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.setAttribute('aria-hidden', 'true');
      statement.append(span);
      words.push(span);
    });
  }
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  let scrollFrame = 0;
  const scenes = $$('.project-scene');
  const parallaxImages = $('.studio-figure>img,.project-hero:not([data-detail-view])>img');
  function updateScroll() {
    scrollFrame = 0;
    if (paused) {
      words.forEach((w) => w.classList.add('is-lit'));
      return;
    }
    const vh = innerHeight;
    if (manifesto) {
      const r = manifesto.getBoundingClientRect(),
        progress = clamp((-r.top + vh * 0.12) / (r.height - vh * 0.45));
      words.forEach((w, i) => w.classList.toggle('is-lit', progress > (i / words.length) * 0.84));
    }
    if (ribbon) {
      const r = ribbon.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const progress = (vh - r.top) / (vh + r.height);
        ribbon.firstElementChild.style.transform = `translate3d(${-progress * 24}%,0,0)`;
      }
    }
    scenes.forEach((scene) => {
      const r = scene.getBoundingClientRect(),
        image = $('.scene-image', scene);
      if (r.bottom > 0 && r.top < vh) {
        const progress = clamp(-r.top / (r.height * 0.8));
        image.style.transform = `scale(${1 - progress * 0.03})`;
      }
    });
    if (invitation) {
      const r = invitation.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (vh - r.top) / (vh + r.height);
        $('.invitation-image img', invitation).style.transform =
          `translate3d(0,${(p - 0.5) * 75}px,0) scale(1.15)`;
      }
    }
    parallaxImages.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (vh - r.top) / (vh + r.height);
        img.style.transform = `translate3d(0,${(p - 0.5) * 60}px,0) scale(1.1)`;
      }
    });
  }
  const requestScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  };
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll);
  requestScroll();
  document.addEventListener('insight:motion', (e) => {
    paused = e.detail.paused;
    if (paused) {
      scenes.forEach((s) => {
        const a = $('.scene-image', s);
        a.style.transform = '';
        a.style.filter = '';
      });
      parallaxImages.forEach((i) => (i.style.transform = ''));
      if (invitation) $('img', invitation).style.transform = '';
    }
    requestScroll();
  });
  // Pointer movement travels through the typography at different depths.
  if (hero) {
    let px = 0,
      py = 0,
      tx = 0,
      ty = 0,
      frame = 0;
    const layers = $$('[data-depth]', hero);
    layers.forEach((layer) =>
      layer.addEventListener(
        'animationend',
        () => {
          layer.style.animation = 'none';
        },
        { once: true },
      ),
    );
    function animateDepth() {
      frame = 0;
      if (paused) return;
      px += (tx - px) * 0.075;
      py += (ty - py) * 0.075;
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth);
        layer.style.transform = `translate3d(${px * depth}px,${py * depth}px,0)`;
      });
      if (Math.abs(tx - px) + Math.abs(ty - py) > 0.2) frame = requestAnimationFrame(animateDepth);
    }
    hero.addEventListener(
      'pointermove',
      (e) => {
        if (!fine.matches || paused) return;
        const r = hero.getBoundingClientRect();
        tx = e.clientX - r.left - r.width / 2;
        ty = e.clientY - r.top - r.height / 2;
        if (!frame) frame = requestAnimationFrame(animateDepth);
      },
      { passive: true },
    );
    hero.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      if (!frame) frame = requestAnimationFrame(animateDepth);
    });
  }
  // Small magnetic responses on controls; the browser's standard cursor is retained.
  if (fine.matches) {
    $('.footer-cta>span,.scene-link').forEach((item) => {
      item.addEventListener('pointermove', (e) => {
        if (paused) return;
        const r = item.getBoundingClientRect();
        item.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.16}px,${(e.clientY - r.top - r.height / 2) * 0.16}px)`;
      });
      item.addEventListener('pointerleave', () => (item.style.transform = ''));
    });
    $$('.index-project-link').forEach((link) => {
      const image = $('.index-project-image', link);
      link.addEventListener('pointermove', (e) => {
        if (paused || link.closest('.is-gallery')) return;
        const r = link.getBoundingClientRect(),
          x = (e.clientX - r.left) / r.width - 0.5,
          y = (e.clientY - r.top) / r.height - 0.5;
        image.style.transform = `perspective(800px) rotateY(${x * -11}deg) rotateX(${y * 9}deg) translateY(${y * 12}px) scale(1.06)`;
      });
      link.addEventListener('pointerleave', () => (image.style.transform = ''));
    });
  }
  // The material atlas responds to both pointer and keyboard selection.
  const materialData = {
    concrete: {
      n: '01',
      title: ['Honest.', 'Elemental.', 'Enduring.'],
      copy: 'The imprint of a board. The weight of a wall. Concrete holds the memory of its making, and the quiet strength of a space.',
      spec: 'BOARD-FORMED CONCRETE / RAW FINISH',
      image: 'material-study',
      alt: 'Generated study of board-formed concrete, walnut and limestone',
    },
    timber: {
      n: '02',
      title: ['Warm.', 'Tactile.', 'Alive.'],
      copy: 'Grain carries a history that no two pieces share. Timber brings a human scale and a warmth you feel before you can describe it.',
      spec: 'MILLED TIMBER / NATURAL GRAIN',
      image: 'zenith-interior',
      alt: 'Warm walnut and ocean light in a generated interior concept',
    },
    light: {
      n: '03',
      title: ['Shifting.', 'Sculptural.', 'Intangible.'],
      copy: 'Our most expressive material has no weight. A shaft of daylight transforms a wall, a passing hour changes a room, and a shadow becomes a place.',
      spec: 'NATURAL DAYLIGHT / CHANGING ATMOSPHERE',
      image: 'lumina',
      alt: 'Daylight and sculptural shadow in the Lumina Museum concept',
    },
  };
  const materialTabs = $$('[data-material]'),
    panel = $('#material-panel'),
    visual = $('.material-visual');
  function selectMaterial(tab) {
    const key = tab.dataset.material,
      data = materialData[key];
    if (!data || !panel) return;
    materialTabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    $('.material-number', panel).textContent = data.n;
    const title = $('h3', panel);
    title.replaceChildren();
    data.title.forEach((text, i) => {
      if (i) title.append(document.createElement('br'));
      title.append(document.createTextNode(text));
    });
    $('p', panel).textContent = data.copy;
    $('.material-spec', panel).textContent = data.spec;
    const picture = $('img', visual);
    picture.src = `assets/images/${data.image}.webp`;
    picture.srcset = `assets/images/${data.image}-small.webp 768w, assets/images/${data.image}.webp ${data.image === 'courtyard' ? 1672 : 1536}w`;
    picture.alt = data.alt;
    visual.dataset.current = key;
    if (!paused) {
      panel.animate(
        [
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
    }
  }
  materialTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectMaterial(tab));
    tab.addEventListener('keydown', (e) => {
      let next;
      if (e.key === 'ArrowRight') next = (i + 1) % materialTabs.length;
      if (e.key === 'ArrowLeft') next = (i + materialTabs.length - 1) % materialTabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = materialTabs.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        materialTabs[next].focus();
        selectMaterial(materialTabs[next]);
      }
    });
  });
})();
