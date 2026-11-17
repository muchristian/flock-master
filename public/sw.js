/* FlockMaster service worker — offline-first PWA.
 *
 * Strategy
 *  - Navigation requests (the HTML app shell): network-first, falling back to
 *    the cached shell so the app opens offline.
 *  - Static assets (JS, CSS, images, fonts, including the FontAwesome CDN):
 *    stale-while-revalidate — serve instantly from cache, refresh in the
 *    background so updates land on the next load.
 *
 * Bump CACHE_VERSION whenever the caching logic changes to evict old caches.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `flockmaster-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `flockmaster-assets-${CACHE_VERSION}`;

// The HTML app shell. Vite hashes the JS/CSS filenames, so they are discovered
// and cached at runtime; we only need the entry document pre-cached.
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest'];

// Icons must be available offline for an installed app.
const ICON_URLS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/icons/favicon-16.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      // Don't fail the whole install if one optional URL 404s.
      await Promise.all(
        [...SHELL_URLS, ...ICON_URLS].map((url) =>
          shell.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Tell the page a new version is ready (used to show a "Refresh" prompt).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isFontAwesome(url) {
  return url.host === 'cdnjs.cloudflare.com' && url.pathname.includes('font-awesome');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache the local dev server's HMR / websocket traffic.
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/__vite')) return;

  // App shell / navigations: network-first, offline fallback to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/index.html', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          );
        }
      })()
    );
    return;
  }

  // Static assets (same-origin build output + the FontAwesome CDN).
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin || isFontAwesome(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);
        // Stale-while-revalidate: return cached immediately if present.
        return cached || (await network) || Response.error();
      })()
    );
  }
});
