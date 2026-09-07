const CACHE="bvs-protocol-v6";
const ASSETS=["./","./index.html","./manifest.webmanifest","./i18n.js","./bvs-app-icon.svg","./bvs-premium.css","./bvs-ui.js","./bvs-reminders.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const target=(e.notification.data&&e.notification.data.url)||"./";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list){if("focus" in c){c.navigate(target);return c.focus()}}return clients.openWindow?clients.openWindow(target):undefined}));
});
self.addEventListener("push",e=>{
  let data={};try{data=e.data?e.data.json():{}}catch(_){data={body:e.data?e.data.text():"BVS reminder"}}
  const title=data.title||"BVS Protocol";
  e.waitUntil(self.registration.showNotification(title,{body:data.body||"Time for your BVS routine.",icon:"bvs-app-icon.svg",badge:"bvs-app-icon.svg",tag:data.tag||"bvs-push",vibrate:[220,100,220],data:{url:data.url||"./#today"}}));
});