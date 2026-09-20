(()=>{
'use strict';
const DATA=globalThis.REX_AUDIO_V4_DATA;
if(!DATA||!Array.isArray(DATA.tracks)) { console.error('Rex Audio v4 data missing'); return; }
const $=id=>document.getElementById(id);
const tracks=DATA.tracks;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=s=>{s=Math.round(clamp(s,0,3600));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const midiHz=m=>440*Math.pow(2,(m-69)/12);
try{ if(typeof stopNodes==='function') stopNodes(); }catch{}
try{ if(typeof guidedTimer!=='undefined') clearInterval(guidedTimer); }catch{}
try{ speechSynthesis.cancel(); }catch{}
const oldGuided=$('guidedPlayer'); if(oldGuided) oldGuided.style.display='none';
const status=$('audioStatus');
const audioBtn=$('audioBtn');
const volume=$('volume');
const grid=$('musicGrid');
const musicBox=status?.closest('.box');
if(musicBox){
  const h=musicBox.querySelector('h2'); if(h) h.textContent='60-minute massage music';
  const p=musicBox.querySelector('p'); if(p) p.textContent='15 complete massage-music compositions + 5 guided relaxation sessions. Every selection runs for 60 minutes and supports pause, resume and seeking.';
}
const player=document.createElement('div');
player.id='rexAudioV4Player';
player.style.cssText='margin-top:18px;padding:18px;border:1px solid #765d31;border-radius:16px;background:#0d100c';
player.innerHTML=`
  <div class="ey">REX RELAX AUDIO PLAYER • 60 MIN</div>
  <div id="rxTitle" style="font:24px Georgia;margin-top:6px;color:var(--gold2)"></div>
  <div id="rxKind" class="small" style="margin-top:4px"></div>
  <div id="rxClock" style="font:34px Georgia;color:var(--gold2);margin:10px 0 5px">00:00 / 60:00</div>
  <input id="rxSeek" type="range" min="0" max="3600" step="1" value="0" style="width:100%;accent-color:#d6ae60">
  <div id="rxGuidance" class="small" style="min-height:21px;margin-top:7px;color:#d8cfbd"></div>
  <div class="actions">
    <button class="btn" id="rxPlay" type="button">PLAY</button>
    <button class="btn2" id="rxBack" type="button">− 5 MIN</button>
    <button class="btn2" id="rxForward" type="button">+ 5 MIN</button>
    <button class="btn2" id="rxRestart" type="button">RESTART</button>
  </div>
  <div id="rxVoiceBox" class="formgrid" style="margin-top:14px;display:none">
    <div><label>Relaxing voice</label><select id="rxVoice"><option>Loading voices…</option></select></div>
    <div><label>Voice pace</label><select id="rxRate"><option value="0.64">Very slow</option><option value="0.70" selected>Soft & slow</option><option value="0.78">Gentle</option></select></div>
    <div class="full actions" style="margin-top:0"><button class="btn2" id="rxVoicePreview" type="button">PREVIEW VOICE</button><button class="btn2" id="rxRepeat" type="button">REPEAT LAST GUIDANCE</button></div>
  </div>
  <div class="notice" style="margin-bottom:0">Pause preserves the exact position. Resume continues from that point. The guided sessions contain spoken guidance across the full hour, with no gap longer than four minutes.</div>`;
grid.insertAdjacentElement('afterend',player);
const ui={title:$('rxTitle'),kind:$('rxKind'),clock:$('rxClock'),seek:$('rxSeek'),guidance:$('rxGuidance'),play:$('rxPlay'),back:$('rxBack'),forward:$('rxForward'),restart:$('rxRestart'),voiceBox:$('rxVoiceBox'),voice:$('rxVoice'),rate:$('rxRate'),preview:$('rxVoicePreview'),repeat:$('rxRepeat')};
let selectedIndex=0;
let state={playing:false,pos:0,anchorPerf:0,lastCue:-1};
let audioCtx=null, master=null, dry=null, wet=null, reverb=null, scheduler=null, noiseNode=null, noiseGain=null;
const activeNodes=new Set();
let nextEventBeat=0;
function ensureCtx(){
  if(audioCtx) return;
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  master=audioCtx.createGain(); master.gain.value=+volume.value||.25;
  const comp=audioCtx.createDynamicsCompressor(); comp.threshold.value=-26; comp.knee.value=18; comp.ratio.value=3; comp.attack.value=.01; comp.release.value=.45;
  dry=audioCtx.createGain(); dry.gain.value=.78;
  wet=audioCtx.createGain(); wet.gain.value=.28;
  reverb=audioCtx.createConvolver(); reverb.buffer=makeImpulse(audioCtx,3.8,2.4);
  dry.connect(master); wet.connect(master); reverb.connect(wet); master.connect(comp); comp.connect(audioCtx.destination);
}
function makeImpulse(ctx,seconds,decay){
  const len=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++){const x=1-i/len;d[i]=(Math.random()*2-1)*Math.pow(x,decay)}}return b;
}
function connectFx(node,send=.3){ node.connect(dry); const s=audioCtx.createGain();s.gain.value=send;node.connect(s);s.connect(reverb);activeNodes.add(s);return s; }
function trackNode(n){activeNodes.add(n);n.onended=()=>{activeNodes.delete(n);try{n.disconnect()}catch{}};return n;}
function stopActive(){for(const n of activeNodes){try{if(n.stop)n.stop()}catch{}try{n.disconnect()}catch{}}activeNodes.clear(); if(noiseNode){try{noiseNode.stop()}catch{} noiseNode=null;} noiseGain=null;}
function envGain(when,attack,peak,hold,release){const g=audioCtx.createGain();g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),when+attack);g.gain.setValueAtTime(Math.max(.0002,peak),when+attack+hold);g.gain.exponentialRampToValueAtTime(.0001,when+attack+hold+release);return g;}
function panFor(seed){return ((seed*37)%100)/100*1.1-.55}
function playPad(notes,when,dur,track,seed){
  const g=envGain(when,1.8,.030,Math.max(.1,dur-4),2.2);connectFx(g,.55);
  const filt=audioCtx.createBiquadFilter();filt.type='lowpass';filt.frequency.setValueAtTime(track.pad==='wide'?1450:1100,when);filt.Q.value=.35;filt.connect(g);activeNodes.add(filt);
  notes.slice(0,4).forEach((m,i)=>[-5,5].forEach((det,j)=>{const o=trackNode(audioCtx.createOscillator());o.type=(i===0&&j===0)?'triangle':'sine';o.frequency.value=midiHz(m);o.detune.value=det+(seed%3-1)*1.5;o.connect(filt);o.start(when);o.stop(when+dur)}));
}
function playBass(m,when,dur){const g=envGain(when,.12,.038,Math.max(.1,dur-1.2),1.0);connectFx(g,.18);const o=trackNode(audioCtx.createOscillator());o.type='sine';o.frequency.value=midiHz(m);o.connect(g);o.start(when);o.stop(when+dur)}
function playPluck(m,when,track,seed,accent=1){
  const p=audioCtx.createStereoPanner?audioCtx.createStereoPanner():null;if(p)p.pan.value=panFor(seed);
  const g=envGain(when,.008,.026*accent,.05,1.65); if(p){g.connect(p);connectFx(p,.32)}else connectFx(g,.32);
  const o1=trackNode(audioCtx.createOscillator()),o2=trackNode(audioCtx.createOscillator());
  o1.type=track.texture==='harp'?'triangle':'sine';o2.type=track.texture==='keys'?'triangle':'sine';o1.frequency.value=midiHz(m);o2.frequency.value=midiHz(m)*2;o2.detune.value=seed%2?2:-2;
  const mix=audioCtx.createGain();mix.gain.value=.72;o1.connect(mix);o2.connect(mix);mix.connect(g);activeNodes.add(mix);o1.start(when);o2.start(when);o1.stop(when+1.9);o2.stop(when+1.5);
}
function playBell(m,when,seed){const g=envGain(when,.015,.018,.08,3.3);connectFx(g,.7);[1,2.01,3.98].forEach((r,i)=>{const o=trackNode(audioCtx.createOscillator());o.type='sine';o.frequency.value=midiHz(m)*r;const og=audioCtx.createGain();og.gain.value=[1,.28,.08][i];o.connect(og);og.connect(g);activeNodes.add(og);o.start(when);o.stop(when+3.6)});}
function startNature(track){
  const ctx=audioCtx,len=ctx.sampleRate*4,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const white=Math.random()*2-1;last=(last+.018*white)/1.018;d[i]=last*2.6}
  const src=ctx.createBufferSource();src.buffer=b;src.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=track.nature==='rain'?1700:track.nature==='ocean'?620:track.nature==='forest'?980:760;
  const g=ctx.createGain();g.gain.value=track.nature==='rain'?.022:track.nature==='ocean'?.018:.010;src.connect(f);f.connect(g);connectFx(g,.4);src.start();noiseNode=src;noiseGain=g;activeNodes.add(f);activeNodes.add(g);
}
function chordIntervals(track,degree){
  if(track.mode==='minor'){
    if(degree===0||degree===5)return[0,3,7,10];
    if(degree===8||degree===3)return[0,4,7,11];
    return[0,4,7,10];
  }
  if(degree===9||degree===2)return[0,3,7,10];
  if(degree===7)return[0,4,7,10];
  return[0,4,7,11];
}
function chordMidi(track,degree){const root=track.root+degree;return chordIntervals(track,degree).map(x=>root+x)}
function pos(){return state.playing?clamp(state.pos+(performance.now()-state.anchorPerf)/1000,0,3600):state.pos}
function setPos(p){state.pos=clamp(+p,0,3600);state.anchorPerf=performance.now();state.lastCue=lastCueBefore(state.pos);resetSchedule();updateUI();}
function resetSchedule(){stopActive(); if(state.playing&&audioCtx){startNature(tracks[selectedIndex]); const beatSec=60/tracks[selectedIndex].bpm;nextEventBeat=Math.ceil(pos()/beatSec*2)/2;}}
function scheduleMusic(){
  if(!state.playing||!audioCtx)return;
  const tr=tracks[selectedIndex],beatSec=60/tr.bpm,current=pos(),ahead=current+1.8;
  while(nextEventBeat*beatSec<ahead&&nextEventBeat*beatSec<3600){
    const beat=nextEventBeat,when=audioCtx.currentTime+Math.max(.03,beat*beatSec-current),bar=Math.floor(beat/4),inBar=beat%4,section=Math.floor(bar/8),chordIdx=Math.floor(bar/4)%tr.chords.length,degree=tr.chords[chordIdx],notes=chordMidi(tr,degree),step=Math.round(beat*2);
    if(Math.abs(inBar)<.001 && bar%4===0){playPad(notes,when,beatSec*16+2,tr,section+bar);playBass(notes[0]-12,when,beatSec*7.5)}
    if(Number.isInteger(beat) && step%2===0){const p=tr.arp[(Math.floor(beat)+section)%tr.arp.length]%notes.length;playPluck(notes[p]+12,when,tr,step,.9+(section%3)*.06)}
    if(Number.isInteger(beat) && Math.floor(beat)%4===2){const mi=tr.melody[(bar+section)%tr.melody.length],oct=(section%4===3)?24:12;playPluck(tr.root+mi+oct,when+.08,tr,bar+17,1.05)}
    if(Number.isInteger(beat)&&bar%8===6&&Math.floor(inBar)===0)playBell(tr.root+12+tr.melody[(section+2)%tr.melody.length],when+.15,bar);
    nextEventBeat+=.5;
  }
}
function startEngine(){ensureCtx();if(audioCtx.state==='suspended')audioCtx.resume();stopActive();startNature(tracks[selectedIndex]);const beatSec=60/tracks[selectedIndex].bpm;nextEventBeat=Math.ceil(pos()/beatSec*2)/2;clearInterval(scheduler);scheduler=setInterval(()=>{scheduleMusic();checkGuidance();updateUI()},180);scheduleMusic();}
function pauseEngine(){state.pos=pos();state.playing=false;clearInterval(scheduler);scheduler=null;stopActive();try{speechSynthesis.cancel()}catch{}updateUI();}
function play(){if(state.pos>=3600)setPos(0);state.playing=true;state.anchorPerf=performance.now();startEngine();checkGuidance();updateUI();}
function toggle(){state.playing?pauseEngine():play()}
let voices=[];
function voiceScore(v){const n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase();let s=0;if(/natural|neural|premium|enhanced|online/.test(n))s+=160;if(/sonia|serena|samantha|ava|emma|olivia|jenny|aria|libby|maisie|google uk english female/.test(n))s+=120;if(l.startsWith('en-gb'))s+=70;else if(l.startsWith('en'))s+=35;if(/female/.test(n))s+=20;if(!v.localService)s+=10;return s;}
function loadVoices(){if(!('speechSynthesis'in window))return;voices=speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith('en')).sort((a,b)=>voiceScore(b)-voiceScore(a));ui.voice.innerHTML='';if(!voices.length){ui.voice.innerHTML='<option value="">Best English voice available</option>';return}const saved=localStorage.getItem('rexRelaxV4Voice')||'';voices.forEach((v,i)=>{const o=document.createElement('option');o.value=v.name;o.textContent=v.name+' — '+v.lang;if((saved===v.name)||(!saved&&i===0))o.selected=true;ui.voice.appendChild(o)})}
function chosenVoice(){return voices.find(v=>v.name===ui.voice.value)||voices[0]||null}
function speak(text){if(!text||!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),v=chosenVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-GB';u.rate=+ui.rate.value||.70;u.pitch=.88;u.volume=.88;speechSynthesis.speak(u)}catch(e){console.warn(e)}}
function lastCueBefore(p){const tr=tracks[selectedIndex];if(tr.type!=='guided')return-1;let idx=-1;tr.cues.forEach((c,i)=>{if(c.at<p-1)idx=i});return idx;}
function checkGuidance(){const tr=tracks[selectedIndex];if(!state.playing||tr.type!=='guided')return;const p=pos();let due=-1;for(let i=state.lastCue+1;i<tr.cues.length;i++){if(tr.cues[i].at<=p+1)due=i;else break}if(due>=0){state.lastCue=due;speak(tr.cues[due].text)}}
function repeatGuidance(){const tr=tracks[selectedIndex];if(tr.type!=='guided')return;const p=pos();let idx=0;tr.cues.forEach((c,i)=>{if(c.at<=p)idx=i});speak(tr.cues[idx].text)}
function updateUI(){
  const tr=tracks[selectedIndex],p=pos();ui.title.textContent=tr.name;ui.kind.textContent=(tr.type==='guided'?'Guided relaxation + musical massage bed':'Massage music composition')+' • 60 minutes • '+tr.texture+' / '+tr.nature;ui.clock.textContent=fmt(p)+' / 60:00';ui.seek.value=Math.round(p);ui.play.textContent=state.playing?'PAUSE':'PLAY';audioBtn.textContent=state.playing?'PAUSE':'PLAY';status.textContent='Selected: '+tr.name+' • '+(tr.type==='guided'?'Guided 60 min':'Music 60 min');ui.voiceBox.style.display=tr.type==='guided'?'grid':'none';
  if(tr.type==='guided'){
    const next=tr.cues.find(c=>c.at>p+1),last=tr.cues.filter(c=>c.at<=p+1).slice(-1)[0];
    if(p>=3600)ui.guidance.textContent='Session complete.'; else if(next)ui.guidance.textContent=(last?'Last guidance delivered • ':'')+'Next guidance in '+fmt(next.at-p)+' • '+(state.lastCue+1)+' of '+tr.cues.length+' delivered'; else ui.guidance.textContent='Final spoken guidance delivered • music continues to 60:00';
  }else ui.guidance.textContent='Continuous musical arrangement • harmony, melody, pads and gentle instrumental movement throughout the hour.';
  if(p>=3600&&state.playing){state.pos=3600;state.playing=false;clearInterval(scheduler);scheduler=null;stopActive();ui.play.textContent='PLAY';audioBtn.textContent='PLAY'}
}
function selectTrack(i){
  if(i===selectedIndex){updateUI();return}const was=state.playing;if(was)pauseEngine();else stopActive();try{speechSynthesis.cancel()}catch{}selectedIndex=i;state.pos=0;state.anchorPerf=performance.now();state.lastCue=-1;document.querySelectorAll('#musicGrid .sound').forEach((b,j)=>b.classList.toggle('active',j===i));updateUI();if(was)play();
}
function buildGrid(){grid.innerHTML='';tracks.forEach((tr,i)=>{const b=document.createElement('button');b.className='sound'+(i===selectedIndex?' active':'');b.type='button';b.innerHTML='<strong>'+(i+1)+'. '+tr.name+'</strong><br><span class="small">'+(tr.type==='guided'?'Guided relaxation + full musical bed':'Full massage music • harmony + melody')+'</span><br><span class="guided-tag">'+(tr.type==='guided'?'GUIDED':'MUSIC')+' • 60 MIN</span>';b.onclick=()=>selectTrack(i);grid.appendChild(b)})}
buildGrid();
audioBtn.onclick=toggle;volume.oninput=e=>{ensureCtx();master.gain.value=+e.target.value};
ui.play.onclick=toggle;ui.back.onclick=()=>{const was=state.playing;if(was)pauseEngine();setPos(pos()-300);if(was)play()};ui.forward.onclick=()=>{const was=state.playing;if(was)pauseEngine();setPos(pos()+300);if(was)play()};ui.restart.onclick=()=>{const was=state.playing;if(was)pauseEngine();setPos(0);if(was)play()};ui.seek.onchange=e=>{const was=state.playing;if(was)pauseEngine();setPos(+e.target.value);if(was)play()};ui.seek.oninput=e=>{ui.clock.textContent=fmt(+e.target.value)+' / 60:00'};
ui.voice.onchange=e=>localStorage.setItem('rexRelaxV4Voice',e.target.value);ui.preview.onclick=()=>speak('Take a slow, comfortable breath. Let your shoulders soften, and allow your body to rest.');ui.repeat.onclick=repeatGuidance;
if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;setTimeout(loadVoices,500)}
globalThis.__REX_AUDIO_V4__={release:DATA.release,tracks:tracks.map(t=>({id:t.id,name:t.name,type:t.type,duration:t.duration,cues:t.cues?.length||0})),diagnostics(){const music=tracks.filter(t=>t.type==='music'),guided=tracks.filter(t=>t.type==='guided');return{release:DATA.release,total:tracks.length,music:music.length,guided:guided.length,all60:tracks.every(t=>t.duration===3600),guidedCoverage:guided.map(t=>({id:t.id,cues:t.cues.length,first:t.cues[0].at,last:t.cues.at(-1).at,maxGap:Math.max(...t.cues.slice(1).map((c,i)=>c.at-t.cues[i].at))})),controls:['rxPlay','rxBack','rxForward','rxRestart','rxSeek','rxVoicePreview'].every(id=>!!document.getElementById(id)),gridCards:document.querySelectorAll('#musicGrid .sound').length}}};
updateUI();
})();
