const RELEASE = '2026-09-09.4';
const CACHE = 'bvs-orbit-' + RELEASE;
const SHELL = '/index.html?v=20260909-4';
const APP_PAGES = ['/', '/index.html', '/app.html', '/index-v3.html', '/lander', '/orbit', '/orbit/', '/orbit/index.html'];
const CORE = [SHELL, '/style.css?v=20260909-4', '/mobile-r4.css', '/data.js?v=20260909-4',
  '/app.js?v=20260909-4', '/pwa.js?v=20260909-4', '/manifest.webmanifest',
  '/assets/bvs-icon-192-r3.png', '/assets/bvs-icon-512-r3.png',
  '/assets/bvs-icon-maskable-r3.png', '/assets/bvs-apple-touch-180-r3.png', '/assets/bvs-emblem.png'];
const OPTIONAL = ['/atom.js?v=20260909-4', '/vendor/build/three.module.js',
  '/vendor/build/three.core.js', '/vendor/examples/jsm/environments/RoomEnvironment.js',
  '/vendor/examples/jsm/utils/BufferGeometryUtils.js', '/vendor/examples/jsm/loaders/FontLoader.js',
  '/vendor/examples/jsm/geometries/TextGeometry.js', '/vendor/examples/jsm/objects/Reflector.js',
  '/vendor/examples/fonts/helvetiker_bold.typeface.json'];
function hasCurrentApp(html) { return html.includes('name="bvs-release"'); }

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(async url => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error('BVS required update file unavailable: ' + url);
      if (url === SHELL && !(await response.clone().text()).includes('content="' + RELEASE + '"')) {
        throw new Error('BVS deployment is not ready for this release');
      }
      await cache.put(url, response);
    }));
    // A missing optional 3D dependency must not trap people on the old app.
    // The verified blue-and-silver image remains available as a fallback.
    await Promise.all(OPTIONAL.map(async url => {
      try { const response = await fetch(url, { cache: 'reload' }); if (response.ok) await cache.put(url, response); }
      catch (_) { /* Optional visual enhancement. */ }
    }));
    await self.skipWaiting();
  })());
});

function askPage(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = value => { if (settled) return; settled = true; clearTimeout(timer); channel.port1.close(); resolve(value); };
    const timer = setTimeout(() => finish(null), 800);
    channel.port1.onmessage = event => finish(event.data);
    try { client.postMessage({ type: 'BVS_PREPARE_UPDATE', release: RELEASE }, [channel.port2]); }
    catch (_) { finish(null); }
  });
}

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const replacingOlderBVS = keys.some(key => key.startsWith('bvs-') && key !== CACHE);
    // Delete only obsolete BVS asset caches, never localStorage or IndexedDB records.
    await Promise.all(keys.filter(key => key.startsWith('bvs-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      const url = new URL(client.url);
      if (url.origin !== self.location.origin) continue;
      if (url.pathname === '/update-bvs.html' && !url.searchParams.has('activated')) {
        url.searchParams.set('activated', RELEASE);
        client.navigate(url.href).catch(() => {});
      } else if (replacingOlderBVS && APP_PAGES.includes(url.pathname)) {
        const page = await askPage(client);
        // A current page already has the right screen. Its script protects unsaved forms.
        if (page?.release === RELEASE || page?.dirty) continue;
        url.pathname = '/app.html';
        url.searchParams.set('bvs_release', RELEASE);
        // Do not await navigation in activation: navigation can depend on activation.
        client.navigate(url.href).catch(() => {});
      }
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'BVS_RELEASE_STATUS') event.ports[0]?.postMessage({ release: RELEASE, cache: CACHE });
  if (event.data?.type === 'BVS_SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/update-bvs.html' || url.pathname === '/sw.js') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate' && APP_PAGES.includes(url.pathname)) {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok && hasCurrentApp(await response.clone().text())) return response;
      } catch (_) { /* Open the complete, verified app offline. */ }
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
      await client.navigate('/app.html');
      return client.focus();
    }
    return self.clients.openWindow('/app.html');
  })());
});
