const CACHE='bvs-protocol-v14';
const STATIC=['./','./index.html','./bvs-v3.css?v=5','./bvs-v3-polish.css?v=3','./bvs-v3.js?v=5','./bvs-logo-v3.svg?v=6','./bvs-app-icon-192.png?v=14','./bvs-app-icon-512.png?v=14','./manifest.webmanifest?v=14'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>key===CACHE?Promise.resolve():caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>response).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('focus' in client){client.navigate(target);return client.focus();}}
    return clients.openWindow?clients.openWindow(target):undefined;
  }));
});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={body:event.data?event.data.text():'BVS reminder'}}
  event.waitUntil(self.registration.showNotification(data.title||'BVS Protocol',{
    body:data.body||'Time for your BVS routine.',
    icon:'./bvs-app-icon-192.png?v=14',badge:'./bvs-app-icon-192.png?v=14',tag:data.tag||'bvs-push',
    vibrate:[220,100,220],data:{url:data.url||'./?bvs=v14#today'}
  }));
});
