const RELEASE = '2026-09-09.3';
const CACHE = 'bvs-orbit-' + RELEASE;
const SHELL = '/index.html?v=20260909-1';
const CORE = [SHELL, '/style.css?v=20260909-1', '/data.js?v=20260909-1',
  '/app.js?v=20260909-1', '/atom.js?v=20260909-1', '/pwa.js?v=20260909-1',
  '/manifest.webmanifest', '/assets/bvs-icon-192-r3.png', '/assets/bvs-icon-512-r3.png',
  '/assets/bvs-icon-maskable-r3.png', '/assets/bvs-apple-touch-180-r3.png',
  '/assets/icon-192.png', '/assets/bvs-emblem.png', '/vendor/build/three.module.js',
  '/vendor/build/three.core.js', '/vendor/examples/jsm/environments/RoomEnvironment.js',
  '/vendor/examples/jsm/utils/BufferGeometryUtils.js', '/vendor/examples/jsm/loaders/FontLoader.js',
  '/vendor/examples/jsm/geometries/TextGeometry.js', '/vendor/examples/jsm/objects/Reflector.js',
  '/vendor/examples/fonts/helvetiker_bold.typeface.json'];

function hasCurrentApp(html) { return html.includes('name="bvs-release"'); }

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Never replace a working offline app until every required file is available.
    await Promise.all(CORE.map(async url => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error('BVS update download failed');
      if (url === SHELL && !hasCurrentApp(await response.clone().text())) {
        throw new Error('BVS update did not contain the current app');
      }
      await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Only remove obsolete BVS asset caches. Never delete personal record storage.
    await Promise.all(keys.filter(key => key.startsWith('bvs-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
    // An older worker may have served its old homepage for the update URL.
    // Reload only the explicitly requested recovery page, never unrelated tabs.
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      const url = new URL(client.url);
      if (url.origin !== self.location.origin || url.pathname !== '/update-bvs.html' || url.searchParams.has('activated')) continue;
      url.searchParams.set('activated', RELEASE);
      // Do not await navigation inside activation: the new page may need activation to finish.
      client.navigate(url.href).catch(() => { /* Page may already have navigated. */ });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'BVS_RELEASE_STATUS') {
    event.ports[0]?.postMessage({ release: RELEASE, cache: CACHE });
  }
  if (event.data?.type === 'BVS_SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // The recovery tool always comes from the network, never an old offline shell.
  if (url.pathname === '/update-bvs.html' || url.pathname === '/sw.js') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const appPages = ['/', '/index.html', '/app.html', '/index-v3.html', '/lander', '/orbit', '/orbit/', '/orbit/index.html'];
    if (request.mode === 'navigate' && appPages.includes(url.pathname)) {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok && hasCurrentApp(await response.clone().text())) return response;
      } catch (_) { /* Use the last complete app offline. */ }
      return (await cache.match(SHELL)) || new Response('Open BVS again when you are online.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    if (url.pathname !== '/manifest.webmanifest') {
      const saved = await cache.match(request);
      if (saved) return saved;
    }
    try { return await fetch(request, { cache: 'no-cache' }); }
    catch (_) { return (await cache.match(request)) || new Response('Offline', { status: 503 }); }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      await client.navigate('/');
      return client.focus();
    }
    return self.clients.openWindow('/');
  })());
});
