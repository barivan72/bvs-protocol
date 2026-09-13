/** Actual 60-minute audio files. Sources are never used as playback fallbacks. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const ffmpeg=process.env.REX_FFMPEG || (await import('ffmpeg-static')).default;

const specs=JSON.parse(await fs.readFile('scripts/rex-60min-masters.json','utf8'));
const cache=path.resolve('node_modules/.cache/rex-masters');
const output=path.resolve('orbit/rex-relax/music-60');
await fs.mkdir(cache,{recursive:true}); await fs.mkdir(output,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(args){
  return new Promise((resolve,reject)=>{
    const p=spawn(ffmpeg,['-hide_banner','-nostdin','-y','-loglevel','error',...args],{stdio:['ignore','ignore','pipe']});
    let error='';p.stderr.on('data',b=>{error=(error+b).slice(-8000)});
    p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(`Audio conversion failed (${code}): ${error}`)));
  });
}
async function source(spec,i){
  const local=process.env.REX_SOURCE_DIR?path.join(process.env.REX_SOURCE_DIR,`${String(i+1).padStart(2,'0')}.mp3`):null;
  const cached=path.join(cache,spec.sourceSHA256+'.mp3');
  for(const p of [local,cached].filter(Boolean)){
    try{if(hash(await fs.readFile(p))===spec.sourceSHA256)return p}catch(e){if(e.code!=='ENOENT')throw e}
  }
  let last;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const r=await fetch(spec.url,{signal:AbortSignal.timeout(120000)});
      if(!r.ok)throw new Error(`Source HTTP ${r.status}: ${spec.name}`);
      const bytes=Buffer.from(await r.arrayBuffer());
      if(hash(bytes)!==spec.sourceSHA256)throw new Error(`Source changed: ${spec.name}; review required`);
      await fs.writeFile(cached,bytes);return cached;
    }catch(e){last=e}
  }
  throw last;
}
// MPEG-1 Layer III, 44.1 kHz, without the bit reservoir. Each stored frame
// is independently decodable; the waveform period is a whole number of frames.
// Reuse the warmed-up middle period without adding encoder delay at repeats.
function mp3Frames(bytes){
  const frames=[];let at=0;
  if(bytes.subarray(0,3).toString()==='ID3')at=10+((bytes[6]&127)<<21)+((bytes[7]&127)<<14)+((bytes[8]&127)<<7)+(bytes[9]&127);
  const rates=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
  while(at<bytes.length){
    if(bytes.subarray(at,at+3).toString()==='TAG'&&bytes.length-at===128)break;
    const h=bytes.readUInt32BE(at);
    if((h>>>21)!==2047||((h>>>19)&3)!==3||((h>>>17)&3)!==1||((h>>>10)&3)!==0)throw new Error('Unexpected MP3 frame format');
    const size=Math.floor(144000*rates[(h>>>12)&15]/44100)+((h>>>9)&1);
    if(size<100||at+size>bytes.length)throw new Error('Incomplete MP3 frame');
    const side=at+4+(((h>>>16)&1)?0:2);
    if(bytes[side]!==0||(bytes[side+1]&128))throw new Error('MP3 bit reservoir must be disabled for period assembly');
    frames.push(bytes.subarray(at,at+size));at+=size;
  }
  return frames;
}
async function master(spec,i){
  const dst=path.join(output,spec.file), signature=hash('periodic-frames-v1'+JSON.stringify(spec));
  const sidecar=path.join(cache,spec.file+'.json');
  try{
    const saved=JSON.parse(await fs.readFile(sidecar,'utf8'));
    if(saved.signature===signature && (await fs.stat(dst)).size===saved.bytes && hash(await fs.readFile(dst))===saved.sha256){console.log(`Audio ready: ${spec.name} · 60:00`);return saved}
  }catch(e){if(e.code!=='ENOENT')throw e}
  const src=await source(spec,i);
  const loop=path.join(cache,spec.file+'.wav');
  const start=Math.round(spec.start*44100),end=Math.round(spec.end*44100),n=end-start;
  const samples=Math.floor((n-spec.crossfade*44100)/1152)*1152,c=n-samples;
  // Each side of the overlap has the same beat count. Complementary curves
  // prevent a volume swell; the rest of the original performance is preserved.
  const filter=`[0:a]aresample=44100,atrim=start_sample=${start}:end_sample=${end},asetpts=PTS-STARTPTS,asplit=3[mid][tail][head];`+
    `[mid]atrim=start_sample=${c}:end_sample=${n-c},asetpts=PTS-STARTPTS[m];`+
    `[tail]atrim=start_sample=${n-c},asetpts=PTS-STARTPTS[t];`+
    `[head]atrim=end_sample=${c},asetpts=PTS-STARTPTS[h];`+
    `[t][h]acrossfade=ns=${c}:c1=hsin:c2=hsin[join];`+
    `[join][m]concat=n=2:v=0:a=1,volume=${spec.gain},apad=whole_len=${samples},atrim=end_sample=${samples}[out]`;
  await run(['-i',src,'-filter_complex_threads','1','-filter_complex',filter,'-map','[out]','-ac','2','-ar','44100','-c:a','pcm_f32le',loop]);
  const k=samples/1152,total=Math.ceil(3600*44100/1152),outCount=(total-k)%k+k;
  const prelude=path.join(cache,spec.file+'.intro.mp3'),ending=path.join(cache,spec.file+'.end.mp3'),raw=path.join(cache,spec.file+'.raw.mp3');
  const encode=['-ac','2','-ar','44100','-c:a','libmp3lame','-b:a','192k','-reservoir','0','-threads','1','-write_xing','0','-id3v2_version','0','-map_metadata','-1'];
  await run(['-stream_loop','2','-i',loop,'-af','afade=t=in:d=6',...encode,prelude]);
  const endingTime=(k+outCount)*1152/44100;
  await run(['-stream_loop','-1','-i',loop,'-t',String(endingTime+1),'-af',`afade=t=out:st=${endingTime-15.05}:d=15`,...encode,ending]);
  const p=mp3Frames(await fs.readFile(prelude)),e=mp3Frames(await fs.readFile(ending));
  if(p.length<2*k||e.length<k+outCount)throw new Error('Insufficient encoded periods');
  const chunks=[...p.slice(0,k)],period=p.slice(k,2*k);
  for(let j=0;j<(total-k-outCount)/k;j++)chunks.push(...period);
  chunks.push(...e.slice(k,k+outCount));
  if(chunks.length!==total)throw new Error('60-minute frame count mismatch');
  await fs.writeFile(raw,Buffer.concat(chunks));
  await run(['-i',raw,'-c:a','copy','-write_xing','1',
    '-metadata',`title=${spec.name} — 60-minute continuous edition`,
    '-metadata',`artist=${spec.artist}`,'-metadata','album=Rex Relax — Continuous Massage Sessions',
    '-metadata','comment=Extended from the credited recording. Same composition, original speed, blended musical repeats. No playlist changes.',dst]);
  const data=await fs.readFile(dst);
  const result={name:spec.name,file:spec.file,duration:3600,bytes:data.length,sha256:hash(data),signature,
    source:spec.url,sourceSHA256:spec.sourceSHA256,loopSeconds:samples/44100,crossfadeSeconds:c/44100,
    assembly:'Continuous PCM period aligned to 1152-sample MP3 frames; reservoir disabled; warm encoder periods; separate fades',encodedFrames:total};
  await fs.writeFile(sidecar,JSON.stringify(result));
  await Promise.all([loop,prelude,ending,raw].map(p=>fs.rm(p)));
  console.log(`Rendered: ${spec.name} · 60:00 · 192 kbps stereo`);
  return result;
}
if(process.env.REX_ONLY){
  const i=Number(process.env.REX_ONLY)-1;
  if(!Number.isInteger(i)||!specs[i])throw new Error('Invalid single-master number');
  await master(specs[i],i);
}else{
let next=0;const results=Array(specs.length);
await Promise.all(Array.from({length:2},async()=>{while(next<specs.length){const i=next++;results[i]=await master(specs[i],i)}}));
if(results.length!==20||results.some(x=>!x||x.bytes<80000000))throw new Error('Incomplete 20-hour music collection');
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({release:'2026.09.13.8',tracks:results},null,2)+'\n');
console.log('All 20 complete 60-minute recordings rendered successfully.');
}
