'use strict';
const CACHE='pgc-live-20260909-4';
const INDEX=new URL('./index.html',self.registration.scope).href;
const SHELL=['index.html','manifest.webmanifest','assets/icon.svg'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pgc-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(INDEX,copy)))}return r}).catch(()=>caches.match(INDEX)))}
else if(SHELL.includes(e.request.url)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))}
});
