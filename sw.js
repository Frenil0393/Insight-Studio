// Only public GET resources are cached. Video ranges and inquiry submissions use the network.
const PREFIX = `insight-${self.registration.scope}-`;
const CACHE = `${PREFIX}20261010-1`;
const offline = new URL('offline.html', self.registration.scope).href;
const offlineStyle = new URL('assets/css/offline.css', self.registration.scope).href;
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([offline, offlineStyle].map((url) => new Request(url, { cache: 'reload' }))),
      ),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope) ||
    request.headers.has('range')
  )
    return;
  const navigation = request.mode === 'navigate';
  const asset =
    /\.(?:css|js|woff2|svg|png|webp)$/.test(url.pathname) &&
    url.pathname.includes('/assets/') &&
    !url.pathname.includes('/render-');
  if (!navigation && !asset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          event.waitUntil(
            cache
              .put(request, copy)
              .then(async () => {
                const keys = (await cache.keys()).filter(
                  (key) => ![offline, offlineStyle].includes(key.url),
                );
                await Promise.all(
                  keys.slice(0, Math.max(0, keys.length - 100)).map((key) => cache.delete(key)),
                );
              })
              .catch(() => {}),
          );
        }
        return response;
      } catch {
        const stored = await cache.match(request);
        if (stored) return stored;
        if (navigation) return (await cache.match(offline)) || Response.error();
        return Response.error();
      }
    })(),
  );
});
