const CACHE_NAME = 'insight-cache-v4.0'; 

// ⚠️ Make sure these files ACTUALLY exist exactly as spelled!
const ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/work.html',
  '/contact.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/js/scene.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching App Assets...');
      // CRITICAL FIX: Add files individually. If one fails, it won't crash the PWA!
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => console.error('Missing file preventing cache:', asset));
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).catch(() => {
          // CRITICAL FIX: If offline, force the browser to show index.html
          if (e.request.mode === 'navigate') {
              return caches.match('/index.html');
          }
      });
    })
  );
});