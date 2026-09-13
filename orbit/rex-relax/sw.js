const CACHE='rex-relax-2026-09-13-4';
const RELEASE='2026.09.13.4';
const ASSETS=['/rex-relax/index.html','/rex-relax/manifest.webmanifest','/rex-relax/icon.svg','/rex-relax/audio-v4-data.js','/rex-relax/audio-v4.js'];
const INJECT='<!-- REX_AUDIO_V4_INJECT '+RELEASE+' --><script src="/rex-relax/audio-v4-data.js?v=20260913-4"></script><script src="/rex-relax/audio-v4.js?v=20260913-4"></script>';
function inject(html){if(html.includes('REX_AUDIO_V4_INJECT'))return html;return html.includes('</body>')?html.replace('</body>',INJECT+'</body>'):html+INJECT;}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('rex-relax-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of windows){try{const u=new URL(c.url);if(u.pathname.startsWith('/rex-relax/')&&!u.searchParams.has('rv4')){u.searchParams.set('rv4','1');await c.navigate(u.href)}}catch{}}
})()));
async function pageResponse(request){
  let r;try{r=await fetch(request,{cache:'no-store'})}catch{r=await caches.match('/rex-relax/index.html')}
  if(!r)return new Response('Rex Relax offline cache unavailable',{status:503});
  const html=await r.text(),headers=new Headers(r.headers);headers.set('content-type','text/html; charset=utf-8');headers.set('cache-control','no-store, max-age=0');headers.set('x-rex-relax-release',RELEASE);
  return new Response(inject(html),{status:r.status,statusText:r.statusText,headers});
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin===self.location.origin&&u.pathname.startsWith('/rex-relax/')&&(u.pathname.endsWith('/')||u.pathname.endsWith('/index.html'))){e.respondWith(pageResponse(e.request));return;}
  if(u.origin===self.location.origin&&u.pathname.startsWith('/rex-relax/')){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));}
});
