import Lenis from '../vendor/lenis.js';

let lenis = null,
  frame = 0,
  blocked = false;
const reduced = () =>
  document.documentElement.classList.contains('motion-paused') ||
  matchMedia('(prefers-reduced-motion:reduce)').matches;
function animate(time) {
  frame = 0;
  if (!lenis || document.hidden) return;
  lenis.raf(time);
  frame = requestAnimationFrame(animate);
}
function syncLock() {
  if (!lenis) return;
  const phase = document.documentElement.dataset.navigationPhase;
  const lock =
    blocked ||
    (phase && phase !== 'ready') ||
    document.body.classList.contains('menu-open') ||
    !!document.querySelector('dialog[open]');
  if (lock) lenis.stop();
  else lenis.start();
}
function start() {
  if (reduced() || lenis) return;
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.85,
    anchors: false,
    autoRaf: false,
    prevent: (node) => !!node.closest?.('dialog,[data-lenis-prevent],textarea,select'),
  });
  window.insightScroll = lenis;
  syncLock();
  frame = requestAnimationFrame(animate);
}
function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  lenis?.destroy();
  lenis = null;
  window.insightScroll = null;
}
start();
document.addEventListener('insight:motion', (event) => {
  event.detail.paused ? stop() : start();
});
document.addEventListener('insight:navigation', (event) => {
  blocked = event.detail.phase !== 'ready';
  syncLock();
});
const locks = new MutationObserver(syncLock);
locks.observe(document.body, { attributes: true, attributeFilter: ['class'] });
document
  .querySelectorAll('dialog')
  .forEach((dialog) => locks.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a[href]');
  if (
    !anchor ||
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  let target;
  try {
    target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  } catch {}
  if (!target) return;
  if (!lenis) return;
  event.preventDefault();
  lenis.scrollTo(target, {
    offset: 0,
    duration: 1.15,
    onComplete: () => {
      history.replaceState(null, '', url.hash);
      if (target.matches('main,section')) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    },
  });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else if (lenis && !frame) frame = requestAnimationFrame(animate);
});
addEventListener('pageshow', (event) => {
  if (event.persisted) {
    blocked = false;
    syncLock();
    lenis?.resize();
    if (lenis && !frame) frame = requestAnimationFrame(animate);
  }
});
addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    stop();
    locks.disconnect();
  }
});
