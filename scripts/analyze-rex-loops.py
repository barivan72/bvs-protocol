"""Choose repeat boundaries in the approved recordings; never change playback speed.

The published build uses the reviewed parameters, so it does not need librosa.
"""
import concurrent.futures, hashlib, json, os, subprocess
from pathlib import Path
import numpy as np
import librosa

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get('REX_SOURCE_DIR', str(ROOT / '.cache/rex-audio/sources')))
SR, HOP = 11025, 256

def analyze(pair):
    i, track = pair
    path = SOURCE / f'{i+1:02}.mp3'
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar',str(SR),'-'])
    y = np.frombuffer(raw, dtype='<f4')
    duration = len(y)/SR
    env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
    tempo, frames = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=HOP, trim=False)
    beats = librosa.frames_to_time(frames, sr=SR, hop_length=HOP)
    chroma = librosa.feature.chroma_stft(y=y, sr=SR, hop_length=HOP)
    rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
    peak = np.max(rms)
    def feature(a,b):
        lo,hi = max(0,int(a*SR/HOP)), min(chroma.shape[1],int(b*SR/HOP))
        c = chroma[:,lo:hi].mean(axis=1)
        return c / (np.linalg.norm(c)+1e-9), float(np.mean(rms[lo:hi]))
    candidates=[]
    # Crossfades overlap matching beat counts; longer loops retain musical phrases.
    for cross_beats in [4,8]:
        for j in range(len(beats)-cross_beats-8):
            a=beats[j]
            if a<.3 or a>duration*.18: continue
            cross=beats[j+cross_beats]-a
            if cross<1.7 or cross>10: continue
            f1,v1=feature(a,a+cross)
            if v1<peak*.22: continue
            for k in range(j+cross_beats+8,len(beats)):
                b=beats[k]
                if b<duration*.72 or b>duration-.25:continue
                if (k-j-cross_beats)%8:continue
                length=b-a-cross
                if length<duration*.55:continue
                f2,v2=feature(b-cross,b)
                if v2<peak*.22:continue
                mismatch=abs(np.log((v2+1e-9)/(v1+1e-9)))
                score=float(np.dot(f1,f2)) - .10*mismatch + .10*length/duration
                candidates.append((score,a,b,cross))
    if not candidates:
        raise RuntimeError(f'No suitable musical loop for {track["name"]}; manual selection required')
    score,a,b,cross=max(candidates)
    # Constant gain keeps the original phrasing/dynamics; measured on the selected section.
    segment=y[int(a*SR):int(b*SR)]
    gain=min(.105/(np.sqrt(np.mean(segment**2))+1e-12),.80/(np.max(np.abs(segment))+1e-12))
    result={**track,'file':f'{i+1:02}-{track["name"].lower().replace(" ","-").replace("\'","").replace("&","and")}-60min.mp3',
        'sourceSHA256':hashlib.sha256(path.read_bytes()).hexdigest(), 'sourceDuration':round(duration,6),
        'start':round(float(a),6),'end':round(float(b),6),'crossfade':round(float(cross),6),
        'gain':round(float(gain),8),'analysisTempo':round(float(np.asarray(tempo).ravel()[0]),3),
        'boundaryScore':round(float(score),5),'duration':3600,'bitrate':192000,'sampleRate':44100,'channels':2}
    print(json.dumps({k:result[k] for k in ['name','sourceDuration','start','end','crossfade','analysisTempo','boundaryScore']}),flush=True)
    return result

if __name__=='__main__':
    tracks=json.loads((ROOT/'scripts/rex-approved-music.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(analyze,enumerate(tracks)))
    (ROOT/'scripts/rex-60min-masters.json').write_text(json.dumps(results,indent=2)+'\n')
