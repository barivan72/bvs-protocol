const CACHE='rex-relax-2026-09-20-1';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.jpg?v=20260916-7',
  './icon-192.png?v=20260916-7',
  './icon-512.png?v=20260916-7',
  './audio-v5-data.js?v=20260913-9',
  './audio-v5.js?v=20260916-7',
  './audio-v5-core.js?v=20260916-2'
];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  await self.clients.claim();
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('rex-relax-')&&k!==CACHE).map(k=>caches.delete(k)));
  for(const c of await self.clients.matchAll({type:'window'}))c.postMessage({type:'REX_UPDATE_READY',release:'2026.09.16.7'});
})()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith('./')||u.pathname.startsWith('./music-60/'))return;
  e.respondWith(
    fetch(e.request,{cache:'no-cache'}).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
      return r;
    }).catch(async()=>await caches.match(e.request)||((e.request.mode==='navigate')?await caches.match('./index.html'):null)||new Response('Unavailable offline',{status:503}))
  );
});
