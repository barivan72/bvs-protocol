const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const approved=JSON.parse(fs.readFileSync('scripts/rex-approved-music.json','utf8'));
const engine=fs.readFileSync('orbit/rex-relax/audio-v5.js','utf8');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('orbit/rex-relax/audio-v5-data.js','utf8'),context);
const fixture=context.REX_AUDIO_V5;
async function verify(wix){
 const html=wix?'<div id="rrTM"><button id="rrClose">EXIT</button><div class="box"><h2>Massage soundscapes</h2><p>Old description</p><p><button id="rrAudio">START MUSIC</button><input id="rrVol" value=".55"></p><div id="rrSounds"></div></div></div>':fs.readFileSync('orbit/rex-relax/index.html','utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test/rex-relax/'});
 const w=dom.window;w.REX_AUDIO_V5=fixture;
 const state=new WeakMap();const stateFor=e=>{if(!state.has(e))state.set(e,{paused:true,ended:false,currentTime:0,error:null,duration:180});return state.get(e)};
 const proto=w.HTMLMediaElement.prototype;
 for(const k of ['paused','ended','currentTime','error','duration'])Object.defineProperty(proto,k,{configurable:true,get(){return stateFor(this)[k]},set(v){stateFor(this)[k]=v}});
 Object.defineProperty(proto,'readyState',{get(){return 1}});
 proto.load=function(){this.currentTime=0;this.ended=false;this.error=null;this.duration=fixture.tracks.find(t=>t.url===this.src)?.duration||180;this.dispatchEvent(new w.Event('loadedmetadata'))};
 proto.play=async function(){this.paused=false;this.dispatchEvent(new w.Event('playing'))};
 proto.pause=function(){this.paused=true;this.dispatchEvent(new w.Event('pause'))};
 w.eval(engine);
 const doc=w.document,grid=doc.getElementById(wix?'rrSounds':'musicGrid');
 assert.equal(grid.querySelectorAll('button').length,25);
 assert.equal(doc.querySelectorAll('audio').length,1);
 for(let i=0;i<20;i++)assert.ok(grid.children[i].textContent.includes(approved[i].name));
 const audio=doc.getElementById('rxRecording');
 for(let i=20;i<25;i++){
  grid.children[i].click();assert.equal(audio.src,fixture.tracks[i].url);assert.equal(audio.duration,5400);
  assert.ok(grid.children[i].textContent.includes(fixture.tracks[i].method));
  assert.ok(doc.getElementById('rxDescription').textContent.includes('first 15 minutes'));
  assert.ok(doc.getElementById('rxDescription').textContent.includes(fixture.tracks[i].method));
  if(!wix)assert.equal(doc.getElementById('duration').value,'90');
  doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.paused,false);
  audio.currentTime=2712;doc.getElementById('rxPlay').click();assert.equal(audio.paused,true);assert.equal(audio.currentTime,2712);
  doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.currentTime,2712);
  doc.getElementById('rxForward').click();assert.equal(audio.currentTime,3012);
  doc.getElementById('rxBack').click();assert.equal(audio.currentTime,2712);
  audio.currentTime=5390;doc.getElementById('rxForward').click();assert.equal(audio.currentTime,5400);
  doc.getElementById('rxRestart').click();assert.equal(audio.currentTime,0);
  audio.paused=true;audio.currentTime=audio.duration;audio.dispatchEvent(new w.Event('ended'));assert.equal(doc.getElementById('rxPlaybackStatus').textContent,'90-minute guided session complete.');
 }
 for(let i=0;i<20;i++){
  grid.children[i].click();assert.equal(audio.src,fixture.tracks[i].url);assert.equal(audio.duration,3600);
  assert.ok(grid.children[i].textContent.includes('60 MIN'));
  assert.ok(doc.getElementById('rxDescription').textContent.includes('same instrumental composition'));
  assert.equal(doc.getElementById('rxDownload').href,fixture.tracks[i].url);
  doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.paused,false);
  audio.currentTime=90;doc.getElementById('rxPlay').click();assert.equal(audio.currentTime,90);
  doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.currentTime,90);
  audio.currentTime=3599;doc.getElementById('rxForward').click();assert.equal(audio.currentTime,3600);
  audio.paused=true;audio.ended=true;audio.dispatchEvent(new w.Event('ended'));await Promise.resolve();
  assert.equal(audio.src,fixture.tracks[i].url);assert.equal(audio.paused,true);
  assert.equal(doc.getElementById('rxPlaybackStatus').textContent,'60-minute music session complete.');
  audio.duration=3606;doc.getElementById('rxPlay').click();await Promise.resolve();
  assert.equal(audio.paused,false);assert.equal(audio.currentTime,0);assert.equal(audio.duration,3600);
  audio.currentTime=1800;audio.duration=3606;audio.paused=true;
  doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.paused,false);assert.equal(audio.currentTime,1800);
  audio.pause();
 }
 // A stale or accidentally short source must never masquerade as an hour.
 audio.duration=85;audio.currentTime=0;audio.dispatchEvent(new w.Event('loadedmetadata'));
 doc.getElementById('rxPlay').click();await Promise.resolve();assert.equal(audio.paused,true);
 assert.match(doc.getElementById('rxPlaybackStatus').textContent,/could not be verified/);
 audio.dispatchEvent(new w.Event('error'));assert.match(doc.getElementById('rxPlaybackStatus').textContent,/could not load/);
 const v=doc.getElementById(wix?'rrVol':'volume');v.value='0';v.dispatchEvent(new w.Event('input'));assert.equal(audio.volume,0);
 v.value='.55';v.dispatchEvent(new w.Event('input'));assert.equal(audio.volume,.55);
 w.eval(engine);assert.equal(doc.querySelectorAll('#rexRecordedPlayer').length,1);
 dom.window.close();console.log((wix?'Wix':'Therapy Mode')+': 20 full-hour music selections, five guided sessions, pause/resume, seeking, restart, no automatic track changes, short-file rejection, errors, volume and duplicate-load protection passed.');
}
(async()=>{await verify(false);await verify(true)})().catch(e=>{console.error(e);process.exit(1)});
