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
// Rebuild raster PWA icons during every production build so Chrome receives
// ordinary, decodable PNGs instead of inheriting a browser/Wix shortcut icon.
const rexDir='orbit/rex-relax';
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

await import('./verify-rex-release.mjs');
await import('./build-rex-music.mjs');
console.log('Unified BVS entry built. Rex Relax approved-logo PWA icons regenerated and verified.');
