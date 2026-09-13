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

// Rex Relax release guard: do not publish a broken guided-session build.
const rexPath='orbit/rex-relax/index.html';
const rex=fs.readFileSync(rexPath,'utf8');
const guidedNames=['Guided Breath & Body','Calm Nervous System','Full Body Release','Mindful Recovery','Deep Rest & Sleep'];
for(const name of guidedNames)if(!rex.includes("name:'"+name+"'"))throw new Error('Rex Relax guided track missing: '+name);
if(!rex.includes('GUIDED • 60 MIN')||rex.includes('GUIDED • 90 MIN')||rex.includes('Guided 90 min'))throw new Error('Rex Relax guided duration must be 60 minutes');
for(const id of ['guidedPlay','guidedBack','guidedForward','guidedRepeat','guidedRestart','guidedSeek','guidedVoice','guidedRate'])if(!rex.includes('id="'+id+'"'))throw new Error('Rex Relax control missing: '+id);
for(const fn of ['startGuided','pauseGuided','seekGuided','repeatGuidance','currentGuidedPos'])if(!rex.includes('function '+fn+'('))throw new Error('Rex Relax transport function missing: '+fn);
const guidedBlock=rex.match(/const guided=\{([\s\S]*?)\};\nconst sounds=/);
if(!guidedBlock)throw new Error('Rex Relax guided scripts block not found');
for(const key of ['breath','nervous','release','mindful','sleep']){
  const match=guidedBlock[1].match(new RegExp(key+':G\\(([\\s\\S]*?)\\)(?:,\\n|$)'));
  const cueCount=match?[...match[1].matchAll(/\[\d+,/g)].length:0;
  if(cueCount<13)throw new Error('Rex Relax '+key+' needs at least 13 timed guidance cues; found '+cueCount);
}
const rexScript=rex.match(/<script>([\s\S]*?)<\/script>/);
if(!rexScript)throw new Error('Rex Relax inline script missing');
new Function(rexScript[1]);
console.log('Rex Relax checks passed: 5 x 60-minute guided sessions, resumable transport, 13+ timed cues each, valid JavaScript.');
console.log('Unified BVS entry built. Approved UI and canonical app storage unchanged.');
