/* Rex Relax: recorded music and fully mixed 90-minute guided audio. */
(() => {
  'use strict';
  if (window.__rexRecordedPlayer) return;
  function init() {
    const grid = document.getElementById('musicGrid') || document.getElementById('rrSounds');
    const button = document.getElementById('audioBtn') || document.getElementById('rrAudio');
    const volume = document.getElementById('volume') || document.getElementById('rrVol');
    if (!grid || !button || !volume || !window.REX_AUDIO_V5) { setTimeout(init, 150); return; }
    window.__rexRecordedPlayer = true;
    const tracks = window.REX_AUDIO_V5.tracks;
    const wix = grid.id === 'rrSounds';
    const base = document.createElement('div');
    base.className = 'box';
    base.id = 'rexRecordedPlayer';
    base.innerHTML = `<h2 style="margin:0 0 8px;font-family:Georgia;color:#f0d696">Music & guided relaxation</h2>
      <p style="color:#c7c1b3">20 continuous 60-minute music sessions + 5 guided 90-minute sessions. Choose one recording for your massage.</p>
      <p id="rxTitle" style="font-size:20px;color:#f0d696"></p>
      <p id="rxDescription" style="color:#aaa79f"></p>
      <audio id="rxRecording" controls playsinline preload="metadata" style="width:100%;display:block" aria-label="Rex Relax audio player"></audio>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button type="button" class="btn" id="rxPlay">PLAY</button>
        <button type="button" class="btn2" id="rxBack">− 5 MIN</button>
        <button type="button" class="btn2" id="rxForward">+ 5 MIN</button>
        <button type="button" class="btn2" id="rxRestart">RESTART</button>
      </div>
      <p id="rxPlaybackStatus" role="status" aria-live="polite" style="color:#d8cfbd;font-size:13px"></p>
      <p id="rxCredit" style="color:#aaa79f;font-size:12px"></p>`;
    const download=document.createElement('a');
    download.id='rxDownload';download.textContent='OPEN / SAVE MP3';download.target='_blank';download.rel='noopener';
    download.style.cssText='color:#f0d696;display:inline-block;padding:12px 0';
    base.append(download);
    grid.parentNode.insertBefore(base, grid);
    grid.setAttribute('aria-label', 'Music and guided session selection');
    for (const id of ['guidedPlayer', 'rexAudioV4Player', 'rrMusicCredit']) document.getElementById(id)?.remove();
    const status = document.getElementById('audioStatus');
    const controlBox = button.closest('.box');
    const heading = controlBox?.querySelector('h2');
    if (heading && controlBox !== base) heading.textContent = '60-minute music & guided relaxation';
    const summary = controlBox?.querySelector('p');
    if (summary && !summary.contains(button)) summary.textContent = 'Each music recording lasts a full 60 minutes, keeping the same composition and original tempo throughout. Five separate 90-minute guided sessions are also available.';
    if (wix && summary?.contains(button)) {
      const paragraphs = controlBox.querySelectorAll('p');
      if (paragraphs[0] && !paragraphs[0].contains(button)) paragraphs[0].textContent = '20 continuous 60-minute music sessions + 5 guided 90-minute sessions. Each selection plays to the end without changing tracks.';
    }
    const old = button, primary = old.cloneNode(true);
    old.replaceWith(primary);
    const audio = document.getElementById('rxRecording');
    const playButton = document.getElementById('rxPlay');
    const message = document.getElementById('rxPlaybackStatus');
    let selected = 0, generation = 0, wake = null;
    const clock = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
    async function wakeScreen() {
      try { if (!wake && navigator.wakeLock && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (_) {}
    }
    function releaseWake() { if (wake) wake.release().catch(() => {}); wake = null; }
    function paint() {
      const playing = !audio.paused && !audio.ended;
      playButton.textContent = primary.textContent = playing ? 'PAUSE' : 'PLAY';
      grid.querySelectorAll('button').forEach((b,i) => {
        b.classList.toggle(wix ? 'sel' : 'active', i === selected);
        b.setAttribute('aria-pressed', String(i === selected));
      });
      if (status) status.textContent = `Selected: ${tracks[selected].name}`;
    }
    async function play() {
      const token = generation;
      if (audio.error) audio.load();
      message.textContent = 'Loading audio…';
      try {
        if(audio.readyState<1) await new Promise((resolve,reject)=>{
          const done=()=>{cleanup();resolve()};
          const fail=()=>{cleanup();reject(new Error('Metadata unavailable'))};
          const timer=setTimeout(fail,20000);
          function cleanup(){clearTimeout(timer);audio.removeEventListener('loadedmetadata',done);audio.removeEventListener('error',fail)}
          audio.addEventListener('loadedmetadata',done);audio.addEventListener('error',fail);
        });
        if(token!==generation)return;
        if(!validDuration()) {message.textContent='The full recording could not be verified. Please reload the page; playback has been stopped.';return;}
        if(audio.ended)audio.currentTime=0;
        await audio.play(); if (token !== generation) return; paint();
      }
      catch (e) {
        if (token !== generation || e.name === 'AbortError') return;
        message.textContent = e.name === 'NotAllowedError' ? 'Tap PLAY to begin the recording.' : 'Audio could not start. Check your connection and tap PLAY to retry.';
        paint();
      }
    }
    function toggle() { if (audio.paused || audio.ended) play(); else audio.pause(); }
    function select(i, autoplay = false) {
      generation++;
      audio.pause();
      selected = i;
      const track = tracks[i];
      const timerDuration = document.getElementById('duration') || document.getElementById('rrDur');
      const timerButton = document.getElementById('startBtn') || document.getElementById('rrStart');
      if (timerDuration && /^(START|FINISHED)$/.test(timerButton?.textContent.trim())) {
        timerDuration.value = track.type==='guided'?'90':'60';
        timerDuration.dispatchEvent(new Event('change', {bubbles:true}));
      }
      audio.src = track.url;
      audio.load();
      document.getElementById('rxTitle').textContent = `${track.name} · ${track.type==='music'?'60':'90'} MIN`;
      document.getElementById('rxDescription').textContent = track.type === 'guided'
        ? `${track.method} • 90 minutes. Closely guided for at least the first 15 minutes, with gentle reminders through the closing minutes. A deep British male voice and continuous relaxing music.`
        : '60 minutes of the same instrumental composition at its original tempo. Smoothly blended repeats, with a gentle opening and ending. Playback stops when this session finishes.';
      document.getElementById('rxCredit').textContent = track.type === 'guided'
        ? `Original Rex Relax guidance • male AI narration • background: ${track.backgroundCredit}`
        : `${track.artist} • 60-minute extended edition of the credited recording`;
      download.href=track.url;download.download=track.type==='music'?track.file:'';
      message.textContent = 'Ready. Pause and resume keep your position.';
      paint();
      if (navigator.mediaSession && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title:track.name,artist:track.type === 'guided'?'Rex Relax':track.artist,album:'Rex Relax'});
      if (autoplay) play();
    }
    grid.replaceChildren();
    tracks.forEach((track, i) => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'sound';
      card.style.cssText = 'text-align:left;min-height:88px;line-height:1.5';
      const title = document.createElement('strong'); title.textContent = `${i + 1}. ${track.name}`;
      const detail = document.createElement('span'); detail.className = 'small';
      detail.textContent = track.type === 'guided' ? `${track.method} • 90 MIN` : `60 MIN • ${track.artist}`;
      card.append(title, document.createElement('br'), detail);
      card.onclick = () => select(i, !audio.paused);
      grid.append(card);
    });
    primary.onclick = playButton.onclick = toggle;
    function seek(delta) {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
    }
    document.getElementById('rxBack').onclick = () => seek(-300);
    document.getElementById('rxForward').onclick = () => seek(300);
    document.getElementById('rxRestart').onclick = () => { if (audio.readyState) audio.currentTime = 0; };
    function setVolume() { audio.volume = Math.max(0, Math.min(1, Number(volume.value) || 0)); }
    volume.oninput = setVolume; setVolume();
    audio.addEventListener('playing', () => {
      if(!validDuration()){audio.pause();message.textContent='The full recording could not be verified. Please reload the page; playback has been stopped.';return;}
      message.textContent = 'Playing'; paint(); wakeScreen();
    });
    audio.addEventListener('pause', () => { message.textContent = `Paused at ${clock(audio.currentTime)}. PLAY continues from here.`; paint(); releaseWake(); });
    audio.addEventListener('waiting', () => { message.textContent = 'Buffering audio — playback resumes when the connection catches up.'; });
    audio.addEventListener('error', () => { message.textContent = 'This recording could not load. Check your connection and tap PLAY to retry.'; paint(); releaseWake(); });
    audio.addEventListener('ended', () => {
      message.textContent = tracks[selected].type==='music'?'60-minute music session complete.':'90-minute guided session complete.';
      paint(); releaseWake();
    });
    function validDuration(){return Number.isFinite(audio.duration)&&Math.abs(audio.duration-tracks[selected].duration)<1}
    audio.addEventListener('loadedmetadata', () => {
      if(!validDuration()){audio.pause();message.textContent='The full recording could not be verified. Please reload the page; playback has been stopped.';}
      else if(audio.paused)message.textContent=`Ready · ${clock(audio.duration)}. Press PLAY.`;
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !audio.paused) wakeScreen(); });
    if (navigator.mediaSession) {
      for (const [action, handler] of Object.entries({play, pause:()=>audio.pause(), seekbackward:()=>seek(-30), seekforward:()=>seek(30), seekto:e=>{ if (Number.isFinite(e.seekTime)) audio.currentTime=e.seekTime; }})) {
        try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
      }
    }
    window.addEventListener('pagehide', () => { audio.pause(); releaseWake(); });
    if (wix) document.getElementById('rrClose')?.addEventListener('click', () => audio.pause());
    select(0);
  }
  init();
})();
