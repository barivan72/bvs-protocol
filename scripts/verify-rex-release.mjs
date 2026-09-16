import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base='orbit/rex-relax/';
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(base+'audio-v5-data.js','utf8'),context);
const data=context.REX_AUDIO_V5;
assert.equal(data.release,'2026.09.13.9');
const music=data.tracks.filter(t=>t.type==='music'),guided=data.tracks.filter(t=>t.type==='guided');
const approved=JSON.parse(fs.readFileSync('scripts/rex-approved-music.json','utf8'));
assert.equal(music.length,20);assert.equal(guided.length,5);
for(let i=0;i<20;i++){
  assert.equal(music[i].name,approved[i].name);
  assert.equal(music[i].sourceUrl,approved[i].url);
  assert.equal(music[i].duration,3600);
  assert.ok(music[i].url.endsWith('-60min.mp3'));
}
for(const track of guided){
  assert.equal(track.voice,'bm_george');
  assert.equal(track.narrator,'Deep British male');
  assert.equal(track.duration,5400);
  assert.match(track.url,/^https:\/\//);
  assert.ok(track.backgroundCredit);
  assert.ok(track.method);
  assert.ok(track.coverage.denseOpeningSeconds>=900);
  assert.ok(track.coverage.first15Minutes.spokenFraction>=.65);
  assert.ok(track.coverage.first15Minutes.longestPauseSeconds<=8.1);
  assert.ok(track.coverage.spokenSegments>=75);
  assert.equal(track.coverage.first,0);
  assert.ok(track.coverage.last>=5350);
  assert.ok(track.coverage.maxGap<=120.001);
}
assert.equal(new Set(data.tracks.map(t=>t.url)).size,25);
assert.equal(new Set(guided.map(t=>t.method)).size,5);
const scripts=JSON.parse(fs.readFileSync('docs/rex-relax-guided-transcripts.json','utf8'));
for(const session of scripts){
  assert.ok(session.cues[0].phase==='opening');
  assert.ok(session.denseOpeningSeconds>=900);
  assert.equal(session.cues.at(-1).at,5350);
  for(const cue of session.cues){
    assert.ok(!/^(welcome|this is|you are listening)/i.test(cue.text));
    assert.ok(!/\b(rex|advert|ninety|male voice|kokoro|subscribe|booking|calendly)\b/i.test(cue.text));
  }
}
const html=fs.readFileSync(base+'index.html','utf8');
const loader=fs.readFileSync(base+'audio-v5.js','utf8');
const engine=fs.readFileSync(base+'audio-v5-core.js','utf8');
new vm.Script(loader);
new vm.Script(engine);
for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
assert.ok(!html.includes('speechSynthesis'));
assert.ok(!html.includes('audio-v4'));
assert.ok(html.includes('REX_AUDIO_V4_INJECT'), 'Installed v4 workers must not reinject the old synthesizer.');
assert.ok(html.includes('audio-v5-data.js')&&html.includes('audio-v5.js'));
for(const price of ['£80','£120','£160'])assert.ok(html.includes(price));
for(const id of ['oilPreference','oilAllergy'])assert.ok(html.includes('id="'+id+'"'));
assert.ok(html.includes("const DB='RexRelaxClientMemory',STORE='clients'"));
assert.ok(!engine.includes('SpeechSynthesisUtterance'));
assert.ok(!engine.includes('createOscillator'));
assert.ok(engine.includes('<audio'));
assert.ok(engine.includes('male AI narration'));
assert.ok(loader.includes('/rex-relax/rex-relax-logo.png?v=20260916-8'));
assert.ok(!loader.includes('static.wixstatic.com'));
assert.ok(loader.includes('audio-v5-core.js?v=20260916-2'));
assert.ok(loader.includes('beforeinstallprompt'));
assert.ok(html.includes('/rex-relax/icon-192.png?v=20260916-8'));
assert.ok(html.includes('/rex-relax/icon-512.png?v=20260916-8'));
assert.ok(html.includes('/rex-relax/apple-touch-icon.png?v=20260916-8'));

const logo=fs.readFileSync(base+'rex-relax-logo.png');
assert.equal(crypto.createHash('sha256').update(logo).digest('hex'),'5c9a2928fabef55fa8eefd2967aebd3499c60a55e66047ff448fe2e7a1462244');
function pngSize(name){
  const b=fs.readFileSync(base+name);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
}
assert.deepEqual(pngSize('icon-192.png'),[192,192]);
assert.deepEqual(pngSize('icon-512.png'),[512,512]);
assert.deepEqual(pngSize('icon-512-maskable.png'),[512,512]);
assert.deepEqual(pngSize('apple-touch-icon.png'),[180,180]);

const manifest=JSON.parse(fs.readFileSync(base+'manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.prefer_related_applications,false);
assert.equal(manifest.id,'/rex-relax/');
assert.equal(manifest.scope,'/rex-relax/');
assert.ok(manifest.start_url.startsWith('/rex-relax/?source=pwa&release=20260916-8'));
assert.ok(manifest.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'&&i.purpose==='any'));
assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'&&i.purpose==='any'));
assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'&&i.purpose==='maskable'));
const publicEmbed=fs.readFileSync('scripts/rex-public-site-embed.html','utf8');
assert.ok(publicEmbed.includes('Completely free.'));
assert.ok(publicEmbed.includes('Cash preferred. Direct debit also accepted.'));
assert.ok(!publicEmbed.toLowerCase().includes('calendly'));
assert.equal((publicEmbed.match(/https:\/\/wa.me\/447957229022/g)||[]).length,5);
const worker=fs.readFileSync(base+'sw.js','utf8');
assert.ok(!worker.includes('INJECT'));
assert.ok(worker.includes('rex-relax-2026-09-16-8'));
assert.ok(worker.includes('icon-192.png?v=20260916-8'));
assert.ok(worker.includes('icon-512.png?v=20260916-8'));
assert.ok(worker.includes('icon-512-maskable.png?v=20260916-8'));
console.log('Rex Relax release verified: exact approved logo, decodable local PWA icons, standalone manifest, 20 complete 60-minute extended tracks, five recorded 90-minute sessions, prices, oil questions, and client database preserved.');
