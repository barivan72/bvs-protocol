const RELEASE = '2026-09-09.2';
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
    // A failed download must never replace the working offline app.
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
    await Promise.all(keys.filter(key => key.startsWith('bvs-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Direct icon and manifest URLs must keep their actual file response.
    const appPage = ['/', '/index.html', '/index-v3.html', '/lander'].includes(url.pathname);
    if (request.mode === 'navigate' && appPage) {
      if (url.pathname === '/index-v3.html') {
        url.pathname = '/';
        return Response.redirect(url.href, 302);
      }
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok && hasCurrentApp(await response.clone().text())) return response;
      } catch (_) { /* Use the last complete app offline. */ }
      return (await cache.match(SHELL)) || new Response('Open BVS again when you are online.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    // Keep an installed release's scripts, styles and 3D assets together.
    if (url.pathname !== '/manifest.webmanifest') {
      const saved = await cache.match(request);
      if (saved) return saved;
    }
    try { return await fetch(request, { cache: 'no-cache' }); }
    catch (_) {
      return (await cache.match(request)) || new Response('Offline', { status: 503 });
    }
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
