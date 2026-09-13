"""Verify all masters, decoding every unique encoded period and both fades.

Use --full to decode repeated periods too. The normal pass covers the intro,
the repeated encoded period and the complete separately encoded ending.
"""
import argparse, concurrent.futures, hashlib, json, subprocess
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'orbit/rex-relax/music-60'
parser=argparse.ArgumentParser();parser.add_argument('--ready',action='store_true');parser.add_argument('--full',action='store_true');args=parser.parse_args()
specs=json.loads((ROOT/'scripts/rex-60min-masters.json').read_text())
def verify(s):
    p=OUT/s['file'];side=ROOT/'node_modules/.cache/rex-masters'/f'{p.name}.json'
    if not side.exists():return None
    meta=json.loads(side.read_text())
    if meta.get('assembly') is None:return None
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    if digest!=meta['sha256']:raise RuntimeError(f'Checksum mismatch: {p.name}')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]))
    stream=probe['streams'][0];duration=float(probe['format']['duration'])
    assert abs(duration-3600)<.1,(p.name,duration)
    assert stream['channels']==2 and stream['sample_rate']=='44100'
    assert abs(int(stream['bit_rate'])-192000)<100
    count=0;lowest=1.;longest=quiet=0;peak=0.;total_sq=0.
    span=meta['loopSeconds']*2+1
    ranges=[(0,3600)] if args.full else [(0,span),(3600-span,span)]
    for offset,seconds in ranges:
        proc=subprocess.Popen(['ffmpeg','-v','error','-xerror','-err_detect','explode','-ss',str(offset),'-i',str(p),'-t',str(seconds),'-f','f32le','-ac','1','-ar','8000','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        local=0;quiet=0
        while True:
            chunk=proc.stdout.read(3200)
            if not chunk:break
            x=np.frombuffer(chunk,'<f4');rms=float(np.sqrt(np.mean(x*x)))
            count+=len(x);local+=len(x);total_sq+=float(np.sum(x*x));peak=max(peak,float(np.max(np.abs(x))))
            if 8<offset+local/8000<3584:
                lowest=min(lowest,rms)
                quiet=quiet+len(x)/8000 if rms<.0001 else 0
                longest=max(longest,quiet)
        err=proc.stderr.read().decode();code=proc.wait()
        assert code==0 and not err,(p.name,err)
        assert abs(local/8000-seconds)<.15,(p.name,local/8000,seconds)
    assert longest<.5,(p.name,'Unexpected silent stretch',longest)
    result={'name':s['name'],'file':p.name,'durationSeconds':duration,'decodedSeconds':count/8000,
        'fullDecodePassed':args.full,'allUniqueEncodedPeriodsDecoded':True,'sourceSHA256':s['sourceSHA256'],'sha256':digest,'channels':2,'sampleRate':44100,
        'bitrate':192000,'longestInteriorSilenceSeconds':round(longest,3),'minimumInterior100msRMS':lowest,
        'overallRMS':float(np.sqrt(total_sq/count)),'downsampledPeak':peak,'loopSeconds':meta['loopSeconds']}
    print(json.dumps({k:result[k] for k in ['name','durationSeconds','decodedSeconds','longestInteriorSilenceSeconds','overallRMS','downsampledPeak']}),flush=True)
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=[r for r in pool.map(verify,specs) if r]
if not args.ready:assert len(results)==20,f'Only {len(results)} of 20 completed masters'
report={'release':'2026.09.13.8','verifiedCount':len(results),'method':'Decode every unique encoded period, opening and ending with fatal decode errors; verify segment sample counts, complete-file duration, 44.1-kHz stereo metadata, full-file hashes and interior silence. --full additionally decodes identical repeated periods. Extended credited recordings, not newly composed music.','tracks':results}
(ROOT/'docs/rex-60min-verification.json').write_text(json.dumps(report,indent=2)+'\n')
