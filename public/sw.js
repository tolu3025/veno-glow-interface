// Kill-switch service worker.
// Replaces the prior app-shell cache that was serving stale/blank pages.
// Deletes KukaPay caches, claims clients, navigates them to fresh URLs,
// then unregisters itself so future loads hit the network directly.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.allSettled(
        names
          .filter((n) => n.startsWith('kuka') || n.includes('workbox') || n.includes('precache') || n.includes('runtime'))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
      const wins = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(wins.map((c) => c.navigate(c.url)));
    } finally {
      await self.registration.unregister();
    }
  })());
});

// Pass-through fetch — never serve from cache.
self.addEventListener('fetch', () => {});
