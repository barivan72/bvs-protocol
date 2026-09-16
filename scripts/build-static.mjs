import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';

const canonical='https://bvs-protocol.vercel.app/live.html';
let html=fs.readFileSync('orbit/index.html','utf8');
if(!html.includes('id="downloadApp"'))throw new Error('Approved mobile app is missing');
html=html.replace('<meta name="bvs-release" content="2026-09-09.4">','<meta name="bvs-release" content="2026-09-09.4">'+(html.includes('name="bvs-updater"')?'':'<meta name="bvs-updater" content="2026-09-09.5">'));
html=html.replaceAll('/pwa.js?v=20260909-4','/pwa.js?v=20260909-5');
html=html.replace(/Version 2026\.09\.09\.4(?: · Update 5)?/g,'BVS Protocol · LIVE 09 SEP 2026');
if(!html.includes('name="bvs-entry"'))html=html.replace('</head>','<meta name="bvs-entry" content="unified-6"><link rel="canonical" href="'+canonical+'"></head>');
for(const name of ['index.html','app.html','launch.html','live.html'])fs.writeFileSync('orbit/'+name,html);
const workerPath='orbit/sw.js';
const current=fs.readFileSync(workerPath,'utf8');
if(!current.includes('BVS_ORIGIN_DISPATCH_6'))fs.writeFileSync('orbit/app-worker.js',current);
fs.writeFileSync(workerPath,"// BVS_ORIGIN_DISPATCH_6\nif(['bvsprotocol.com','www.bvsprotocol.com'].includes(self.location.hostname)){importScripts('/origin-forward.js')}else{importScripts('/app-worker.js')}\n");
fs.copyFileSync(workerPath,'orbit/service-worker.js');
fs.copyFileSync(workerPath,'orbit/serviceWorker.js');

// Rex Relax uses the exact user-approved emblem as the single source of truth.
// This deliberately follows the same successful PWA packaging pattern used by
// Living Select UK and BVS Protocol: local raster icons + manifest + SW on the
// same HTTPS origin, never a browser-created Wix shortcut.
const rexDir='orbit/rex-relax';
const rexRelease='20260916-8';
const approvedLogoUrl='https://static.wixstatic.com/media/bec34c_e276d0753c7745439100c5ad660d83fa~mv2.png';
const approvedLogoSha256='5c9a2928fabef55fa8eefd2967aebd3499c60a55e66047ff448fe2e7a1462244';
const approvedResponse=await fetch(approvedLogoUrl,{signal:AbortSignal.timeout(30000)});
if(!approvedResponse.ok)throw new Error(`Approved Rex Relax logo download failed: HTTP ${approvedResponse.status}`);
const approvedBytes=Buffer.from(await approvedResponse.arrayBuffer());
const approvedDigest=crypto.createHash('sha256').update(approvedBytes).digest('hex');
if(approvedDigest!==approvedLogoSha256)throw new Error(`Approved Rex Relax logo changed: ${approvedDigest}`);
const approvedPath=`${rexDir}/rex-relax-logo.png`;
fs.writeFileSync(approvedPath,approvedBytes);

const ffmpeg=(await import('ffmpeg-static')).default;
function makeIcon(name,size,filter){
  const output=`${rexDir}/${name}`;
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',approvedPath,'-vf',filter||`scale=${size}:${size}:flags=lanczos`,'-frames:v','1','-update','1','-pix_fmt','rgba',output],{encoding:'utf8'});
  if(result.status!==0)throw new Error(`Rex Relax ${name} generation failed: ${result.stderr}`);
}
makeIcon('icon-192.png',192);
makeIcon('icon-512.png',512);
makeIcon('icon-512-maskable.png',512,'scale=410:410:flags=lanczos,pad=512:512:51:51:color=0x080806');
makeIcon('apple-touch-icon.png',180);

let rexHtml=fs.readFileSync(`${rexDir}/index.html`,'utf8');
rexHtml=rexHtml.replace(/<link rel="manifest" href="[^"]+">/,'<link rel="manifest" href="/rex-relax/manifest.webmanifest?v='+rexRelease+'">');
rexHtml=rexHtml.replace(/<link rel="icon" href="[^"]+"(?: type="[^"]+")?>/,'<link rel="icon" type="image/png" sizes="192x192" href="/rex-relax/icon-192.png?v='+rexRelease+'"><link rel="icon" type="image/png" sizes="512x512" href="/rex-relax/icon-512.png?v='+rexRelease+'">');
rexHtml=rexHtml.replace(/<link rel="apple-touch-icon" href="[^"]+">/,'<link rel="apple-touch-icon" sizes="180x180" href="/rex-relax/apple-touch-icon.png?v='+rexRelease+'">');
rexHtml=rexHtml.replace('/rex-relax/audio-v5.js?v=20260913-9','/rex-relax/audio-v5.js?v='+rexRelease);
fs.writeFileSync(`${rexDir}/index.html`,rexHtml);

let rexLoader=fs.readFileSync(`${rexDir}/audio-v5.js`,'utf8');
rexLoader=rexLoader.replace(/const icon = '[^']+';/,"const icon = '/rex-relax/rex-relax-logo.png?v="+rexRelease+"';");
fs.writeFileSync(`${rexDir}/audio-v5.js`,rexLoader);

const rexManifest={
  name:'Rex Relax',
  short_name:'Rex Relax',
  id:'/rex-relax/',
  start_url:'/rex-relax/?source=pwa&release='+rexRelease,
  scope:'/rex-relax/',
  display:'standalone',
  display_override:['standalone','minimal-ui'],
  background_color:'#080806',
  theme_color:'#080806',
  description:'Rex Relax massage therapy app for sessions, music, client records and consent.',
  prefer_related_applications:false,
  icons:[
    {src:'/rex-relax/icon-192.png?v='+rexRelease,sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'/rex-relax/icon-512.png?v='+rexRelease,sizes:'512x512',type:'image/png',purpose:'any'},
    {src:'/rex-relax/icon-512-maskable.png?v='+rexRelease,sizes:'512x512',type:'image/png',purpose:'maskable'}
  ]
};
fs.writeFileSync(`${rexDir}/manifest.webmanifest`,JSON.stringify(rexManifest,null,2)+'\n');

fs.writeFileSync(`${rexDir}/sw.js`,`const CACHE='rex-relax-2026-09-16-8';\nconst ASSETS=[\n  '/rex-relax/',\n  '/rex-relax/index.html',\n  '/rex-relax/manifest.webmanifest?v=${rexRelease}',\n  '/rex-relax/rex-relax-logo.png?v=${rexRelease}',\n  '/rex-relax/icon-192.png?v=${rexRelease}',\n  '/rex-relax/icon-512.png?v=${rexRelease}',\n  '/rex-relax/icon-512-maskable.png?v=${rexRelease}',\n  '/rex-relax/apple-touch-icon.png?v=${rexRelease}',\n  '/rex-relax/audio-v5-data.js?v=20260913-9',\n  '/rex-relax/audio-v5.js?v=${rexRelease}',\n  '/rex-relax/audio-v5-core.js?v=20260916-2'\n];\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('rex-relax-')&&k!==CACHE).map(k=>caches.delete(k)));for(const c of await self.clients.matchAll({type:'window'}))c.postMessage({type:'REX_UPDATE_READY',release:'2026.09.16.8'});})()));\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith('/rex-relax/')||u.pathname.startsWith('/rex-relax/music-60/'))return;e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>await caches.match(e.request)||((e.request.mode==='navigate')?await caches.match('/rex-relax/index.html'):null)||new Response('Unavailable offline',{status:503})));});\n`);

await import('./verify-rex-release.mjs');
await import('./build-rex-music.mjs');
console.log('Unified BVS entry built. Rex Relax approved-logo PWA icons regenerated and verified.');
