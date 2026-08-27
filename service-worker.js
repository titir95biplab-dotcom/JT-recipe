// Bump CACHE_NAME on every deploy so installed devices pick up the new build.
// Every entry below must actually exist: cache.addAll() rejects as a whole if a
// single URL 404s, which silently kills offline caching.
const CACHE_NAME = 'jt-recipe-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo-192.png',
  './logo-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.map((c) => { if (c !== CACHE_NAME) return caches.delete(c); })
    ))
  );
  self.clients.claim();
});

// Network first, cache as the fallback. Recipes are edited from the admin side,
// so a stale cached copy would be worse than a slow one; the cache only keeps the
// book readable in the kitchen when the connection drops.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
