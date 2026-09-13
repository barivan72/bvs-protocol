import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base='orbit/rex-relax/';
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(base+'audio-v5-data.js','utf8'),context);
const data=context.REX_AUDIO_V5;
assert.equal(data.release,'2026.09.13.5');
const music=data.tracks.filter(t=>t.type==='music'),guided=data.tracks.filter(t=>t.type==='guided');
const approved=JSON.parse(fs.readFileSync('scripts/rex-approved-music.json','utf8'));
assert.equal(music.length,20);assert.equal(guided.length,5);
for(let i=0;i<20;i++){
  assert.equal(music[i].name,approved[i].name);
  assert.equal(music[i].url,approved[i].url);
}
for(const track of guided){
  assert.equal(track.duration,5400);
  assert.match(track.url,/^https:\/\//);
  assert.ok(track.backgroundCredit);
  assert.ok(track.coverage.spokenSegments>=46);
  assert.equal(track.coverage.first,0);
  assert.ok(track.coverage.last>=5350);
  assert.ok(track.coverage.maxGap<=120);
}
assert.equal(new Set(data.tracks.map(t=>t.url)).size,25);
const html=fs.readFileSync(base+'index.html','utf8');
const engine=fs.readFileSync(base+'audio-v5.js','utf8');
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
assert.ok(!fs.readFileSync(base+'sw.js','utf8').includes('INJECT'));
console.log('Rex Relax release verified: original 20 tracks, five recorded 90-minute sessions, guidance through minute 89, prices, oil questions, and client database preserved.');
