import fs from 'node:fs';
const canonical='https://bvs-protocol.vercel.app/live.html';
let html=fs.readFileSync('orbit/index.html','utf8');
if(!html.includes('id="downloadApp"'))throw new Error('Approved mobile app is missing');
html=html.replace('<meta name="bvs-release" content="2026-09-09.4">','<meta name="bvs-release" content="2026-09-09.4">'+(html.includes('name="bvs-updater"')?'':'<meta name="bvs-updater" content="2026-09-09.5">'));
html=html.replaceAll('/pwa.js?v=20260909-4','/pwa.js?v=20260909-5');
html=html.replace(/Version 2026\.09\.09\.4(?: · Update 5)?/g,'BVS Protocol · LIVE 09 SEP 2026');
if(!html.includes('name="bvs-entry"'))html=html.replace('</head>','<meta name="bvs-entry" content="unified-6"><link rel="canonical" href="'+canonical+'"></head>');
for(const name of ['index.html','app.html','launch.html','live.html'])fs.writeFileSync('orbit/'+name,html);
// Keep the working app worker on the origin that the user successfully installed.
// Custom-domain workers become small, independent forwarders, not cache updaters.
const workerPath='orbit/sw.js';
const current=fs.readFileSync(workerPath,'utf8');
if(!current.includes('BVS_ORIGIN_DISPATCH_6'))fs.writeFileSync('orbit/app-worker.js',current);
fs.writeFileSync(workerPath,"// BVS_ORIGIN_DISPATCH_6\nif(['bvsprotocol.com','www.bvsprotocol.com'].includes(self.location.hostname)){importScripts('/origin-forward.js')}else{importScripts('/app-worker.js')}\n");
fs.copyFileSync(workerPath,'orbit/service-worker.js');
fs.copyFileSync(workerPath,'orbit/serviceWorker.js');
console.log('Unified BVS entry built. Approved UI and canonical app storage unchanged.');
