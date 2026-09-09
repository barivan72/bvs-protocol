// Legacy repository/GitHub Pages entry only. Personal records are not removed.
const TARGET='https://bvs-protocol.vercel.app/live.html';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();for(const c of await self.clients.matchAll({type:'window',includeUncontrolled:true})){if(new URL(c.url).origin===self.location.origin&&!c.url.includes('saved-records.html'))c.navigate(TARGET).catch(()=>{})}})()));
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&e.request.mode==='navigate'&&!e.request.url.includes('saved-records.html'))e.respondWith(Response.redirect(TARGET,302))});
