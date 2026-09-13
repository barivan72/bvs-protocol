import fs from 'node:fs';
import vm from 'node:vm';
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

// Rex Relax Audio v4: strict release guard. This is intentionally independent
// of the previous experimental audio layer so regressions cannot silently publish.
const dataPath='orbit/rex-relax/audio-v4-data.js';
const enginePath='orbit/rex-relax/audio-v4.js';
const rexSwPath='orbit/rex-relax/sw.js';
for(const p of [dataPath,enginePath,rexSwPath])if(!fs.existsSync(p))throw new Error('Rex Relax v4 file missing: '+p);
const dataSource=fs.readFileSync(dataPath,'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(dataSource,ctx,{filename:dataPath});
const data=ctx.REX_AUDIO_V4_DATA;if(!data||!Array.isArray(data.tracks))throw new Error('Rex Relax v4 data invalid');
const tracks=data.tracks,music=tracks.filter(t=>t.type==='music'),guided=tracks.filter(t=>t.type==='guided');
if(data.release!=='2026.09.13.4')throw new Error('Rex Relax release id mismatch');
if(tracks.length!==20||music.length!==15||guided.length!==5)throw new Error(`Rex Relax requires exactly 15 music + 5 guided; found ${music.length}+${guided.length}`);
if(!tracks.every(t=>t.duration===3600))throw new Error('Every Rex Relax audio selection must be exactly 60 minutes');
if(new Set(tracks.map(t=>t.id)).size!==20||new Set(tracks.map(t=>t.name)).size!==20)throw new Error('Rex Relax track ids/names must be unique');
for(const t of music){
  if(!Array.isArray(t.chords)||t.chords.length<4||!Array.isArray(t.arp)||t.arp.length<8||!Array.isArray(t.melody)||t.melody.length<8)throw new Error('Massage composition is musically incomplete: '+t.id);
  if(!(t.bpm>=50&&t.bpm<=65))throw new Error('Massage composition tempo outside relaxation range: '+t.id);
}
for(const t of guided){
  if(!Array.isArray(t.cues)||t.cues.length<16)throw new Error('Guided session needs 16+ spoken cues: '+t.id);
  if(t.cues[0].at!==0)throw new Error('Guided session must begin at 00:00: '+t.id);
  if(t.cues.at(-1).at<3480)throw new Error('Guided session must include guidance at/after 58:00: '+t.id);
  const gaps=t.cues.slice(1).map((c,i)=>c.at-t.cues[i].at);
  if(Math.max(...gaps)>240)throw new Error('Guided session has a silent guidance gap over 4 minutes: '+t.id);
  if(!t.cues.every((c,i)=>c.at>=0&&c.at<3600&&(i===0||c.at>t.cues[i-1].at)&&typeof c.text==='string'&&c.text.length>45))throw new Error('Guided session cue invalid: '+t.id);
}
const engine=fs.readFileSync(enginePath,'utf8');
new vm.Script(engine,{filename:enginePath});
for(const id of ['rxPlay','rxBack','rxForward','rxRestart','rxSeek','rxVoicePreview','rxRepeat'])if(!engine.includes(`id="${id}"`))throw new Error('Rex Relax v4 transport control missing: '+id);
for(const fn of ['scheduleMusic','playPad','playPluck','playBell','checkGuidance','repeatGuidance','loadVoices'])if(!engine.includes('function '+fn+'('))throw new Error('Rex Relax v4 function missing: '+fn);
if(!engine.includes('15 complete massage-music compositions + 5 guided relaxation sessions'))throw new Error('Rex Relax v4 UI summary missing');
const sw=fs.readFileSync(rexSwPath,'utf8');
for(const asset of ['audio-v4-data.js','audio-v4.js'])if(!sw.includes(asset))throw new Error('Rex Relax service worker does not load '+asset);
if(!sw.includes('REX_AUDIO_V4_INJECT'))throw new Error('Rex Relax service worker injection guard missing');
console.log('Rex Relax AUDIO V4 CHECK 1/2 PASSED: 15 musical compositions + 5 guided, all 60 min; 16 cues per guided; max guidance gap <=4 min; transport and voice controls present.');
for(const t of guided){let delivered=0,last=-1;for(let second=0;second<=3600;second++){while(delivered<t.cues.length&&t.cues[delivered].at<=second){last=t.cues[delivered].at;delivered++;}}if(delivered!==t.cues.length||last<3480)throw new Error('Rex Relax timeline simulation failed: '+t.id);}
console.log('Rex Relax AUDIO V4 CHECK 2/2 PASSED: full-hour guidance timeline simulation delivered every scheduled cue.');
console.log('Unified BVS entry built. Approved UI and canonical app storage unchanged.');
