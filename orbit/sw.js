// Installation must never wait for icons, 3D files or an offline download.
const RELEASE = '2026-09-09.4';
const UPDATER = '2026-09-09.5';
const CACHE = 'bvs-orbit-' + RELEASE + '-update5';
const SHELL = '/index.html?bvs_update=5';
const APP_PAGES = ['/', '/index.html', '/app.html', '/index-v3.html', '/lander', '/orbit', '/orbit/', '/orbit/index.html', '/orbit/app.html', '/launch.html'];
const CORE = [SHELL, '/style.css?v=20260909-4', '/mobile-r4.css', '/data.js?v=20260909-4', '/app.js?v=20260909-4', '/pwa.js?v=20260909-5', '/manifest.webmanifest', '/assets/bvs-icon-192-r3.png', '/assets/bvs-icon-512-r3.png', '/assets/bvs-icon-maskable-r3.png', '/assets/bvs-apple-touch-180-r3.png', '/assets/bvs-emblem.png'];
const OPTIONAL = ['/atom.js?v=20260909-4', '/vendor/build/three.module.js', '/vendor/build/three.core.js', '/vendor/examples/jsm/environments/RoomEnvironment.js', '/vendor/examples/jsm/utils/BufferGeometryUtils.js', '/vendor/examples/jsm/loaders/FontLoader.js', '/vendor/examples/jsm/geometries/TextGeometry.js', '/vendor/examples/jsm/objects/Reflector.js', '/vendor/examples/fonts/helvetiker_bold.typeface.json'];
function approved(html) { return html.includes('name="bvs-release"') && html.includes('id="downloadApp"') && html.includes('class="app-banner'); }
async function network(request, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(request, { cache: 'no-store', signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
let warming, warmedAt = 0;
function warmOffline() {
  if (warming) return warming;
  if (Date.now() - warmedAt < 60000) return Promise.resolve();
  warmedAt = Date.now();
  warming = (async () => {
    const cache = await caches.open(CACHE);
    const store = async url => {
      try {
        const response = await network(url, 10000);
        if (!response.ok || (url === SHELL && !approved(await response.clone().text()))) return false;
        await cache.put(url, response); return true;
      } catch (_) { return false; }
    };
    const results = await Promise.all(CORE.map(store));
    // Remove obsolete FILE caches only after a complete replacement exists.
    // Personal localStorage and IndexedDB records are never touched.
    if (results.every(Boolean)) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('bvs-') && key !== CACHE).map(key => caches.delete(key)));
    }
    await Promise.all(OPTIONAL.map(store));
  })().catch(() => {}).finally(() => { warming = null; });
  return warming;
}
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
function askPage(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel(); let settled = false;
    const finish = value => { if (settled) return; settled = true; clearTimeout(timer); channel.port1.close(); resolve(value); };
    const timer = setTimeout(() => finish(null), 700);
    channel.port1.onmessage = event => finish(event.data);
    try { client.postMessage({ type: 'BVS_PREPARE_UPDATE', release: RELEASE, updater: UPDATER }, [channel.port2]); }
    catch (_) { finish(null); }
  });
}
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(async client => {
      const url = new URL(client.url);
      if (url.origin !== self.location.origin || !APP_PAGES.includes(url.pathname)) return;
      const page = await askPage(client);
      if (page?.dirty || (page?.release === RELEASE && page?.updater === UPDATER)) return;
      // Works even when the old worker used an unknown cache name or no cache.
      url.pathname = '/app.html'; url.searchParams.set('bvs_update', UPDATER);
      // Do not await navigation inside activation: that can deadlock activation.
      client.navigate(url.href).catch(() => {});
    }));
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'BVS_RELEASE_STATUS') event.ports[0]?.postMessage({ release: RELEASE, updater: UPDATER, cache: CACHE });
  if (event.data?.type === 'BVS_SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'BVS_PRECACHE') event.waitUntil(warmOffline());
});
async function savedShell(cache) {
  let saved = await cache.match(SHELL);
  if (saved && approved(await saved.clone().text())) return saved;
  // A previously verified release-4 offline app is a safe fallback during repair.
  for (const name of await caches.keys()) {
    if (!name.startsWith('bvs-orbit-2026-09-09.4')) continue;
    const previous = await caches.open(name);
    for (const path of [SHELL, '/index.html?v=20260909-4']) {
      saved = await previous.match(path);
      if (saved && approved(await saved.clone().text())) return saved;
    }
  }
  return null;
}
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/(^|\/)sw\.js$/.test(url.pathname) || url.pathname.endsWith('/update-bvs.html')) {
    event.respondWith(network(request)); return;
  }
  const navigation = request.mode === 'navigate' && APP_PAGES.includes(url.pathname);
  if (navigation) event.waitUntil(warmOffline());
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (navigation) {
      try {
        const response = await network(request);
        if (response.ok && approved(await response.clone().text())) {
          await cache.put(SHELL, response.clone()); return response;
        }
      } catch (_) { /* Use only a verified, modern offline page. */ }
      const saved = await savedShell(cache); if (saved) return saved;
      return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>BVS connection</title><body style="background:#050a12;color:#eaf3ff;font:18px system-ui;padding:28px"><h1>Reconnect to BVS Protocol</h1><p>The current app could not be reached. No personal records have been deleted.</p><a style="color:#b5dcff" href="https://bvs-protocol.vercel.app/launch.html">Open the verified BVS app</a></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }
    // Versioned resources may use the new cache, never legacy app caches.
    if (url.pathname !== '/manifest.webmanifest') {
      const saved = await cache.match(request); if (saved) return saved;
    }
    try {
      const response = await network(request);
      if (response.ok && [...CORE, ...OPTIONAL].some(path => new URL(path,self.location.origin).href === url.href)) await cache.put(request,response.clone());
      return response;
    } catch (_) { return (await cache.match(request)) || new Response('Reconnect to load this file.',{status:503}); }
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    for (const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})) {
      if (new URL(client.url).origin === self.location.origin) { await client.navigate('/app.html'); return client.focus(); }
    }
    return self.clients.openWindow('/app.html');
  })());
});
