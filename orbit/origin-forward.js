// BVS_ORIGIN_FORWARD_6: retire an old origin without deleting personal records.
const BVS_LIVE='https://bvs-protocol.vercel.app/live.html';
function destination(source){const to=new URL(BVS_LIVE);try{to.hash=new URL(source).hash}catch(_){}return to.href}
function excluded(url){return new URL(url).pathname.endsWith('/saved-records.html')}
function pageState(client){return new Promise(resolve=>{const ch=new MessageChannel();let done=false;const finish=data=>{if(done)return;done=true;clearTimeout(timer);ch.port1.close();resolve(data)};const timer=setTimeout(()=>finish(null),600);ch.port1.onmessage=e=>finish(e.data);try{client.postMessage({type:'BVS_PREPARE_UPDATE',release:'2026-09-09.4',updater:'2026-09-09.5'},[ch.port2])}catch(_){finish(null)}})}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
await self.clients.claim();
await Promise.all((await self.clients.matchAll({type:'window',includeUncontrolled:true})).map(async client=>{
if(new URL(client.url).origin!==self.location.origin||excluded(client.url))return;
const state=await pageState(client);if(state?.dirty)return;
// Do not await cross-origin navigation during activation.
client.navigate(destination(client.url)).catch(()=>{});
}));
})()));
self.addEventListener('fetch',event=>{
if(event.request.method!=='GET'||event.request.mode!=='navigate'||excluded(event.request.url))return;
if(new URL(event.request.url).origin!==self.location.origin)return;
event.respondWith(Response.redirect(destination(event.request.url),302));
});
self.addEventListener('message',event=>{if(event.data?.type==='BVS_RELEASE_STATUS')event.ports[0]?.postMessage({release:'2026-09-09.4',updater:'origin-forward-6',destination:BVS_LIVE})});
