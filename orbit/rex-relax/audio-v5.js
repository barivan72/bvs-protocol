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
      <p style="color:#c7c1b3">20 original music tracks + 5 complete 90-minute guided sessions.</p>
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
    grid.parentNode.insertBefore(base, grid);
    grid.setAttribute('aria-label', 'Music and guided session selection');
    for (const id of ['guidedPlayer', 'rexAudioV4Player', 'rrMusicCredit']) document.getElementById(id)?.remove();
    const status = document.getElementById('audioStatus');
    const controlBox = button.closest('.box');
    const heading = controlBox?.querySelector('h2');
    if (heading && controlBox !== base) heading.textContent = 'Original music & guided relaxation';
    const summary = controlBox?.querySelector('p');
    if (summary && !summary.contains(button)) summary.textContent = 'Choose from the 20 original recordings or five complete guided sessions with voice and relaxing music throughout all 90 minutes.';
    if (wix && summary?.contains(button)) {
      const paragraphs = controlBox.querySelectorAll('p');
      if (paragraphs[0] && !paragraphs[0].contains(button)) paragraphs[0].textContent = '20 original music tracks + 5 complete 90-minute guided sessions.';
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
      try { await audio.play(); if (token !== generation) return; paint(); }
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
      if (track.type === 'guided' && timerDuration && /^(START|FINISHED)$/.test(timerButton?.textContent.trim())) {
        timerDuration.value = '90';
        timerDuration.dispatchEvent(new Event('change', {bubbles:true}));
      }
      audio.src = track.url;
      audio.load();
      document.getElementById('rxTitle').textContent = track.name;
      document.getElementById('rxDescription').textContent = track.type === 'guided'
        ? '90 minutes • recorded voice and continuous music in one complete audio file. Spoken guidance returns throughout, including the closing minutes.'
        : 'Original instrumental recording. The next music track starts automatically when this one ends.';
      document.getElementById('rxCredit').textContent = track.type === 'guided'
        ? `Original Rex Relax guidance • pre-recorded AI narration • background: ${track.backgroundCredit}`
        : `${track.artist} • original recording from the approved collection`;
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
      detail.textContent = track.type === 'guided' ? 'Guided relaxation + music • 90 MIN' : `Original music • ${track.artist}`;
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
    audio.addEventListener('playing', () => { message.textContent = 'Playing'; paint(); wakeScreen(); });
    audio.addEventListener('pause', () => { message.textContent = `Paused at ${clock(audio.currentTime)}. PLAY continues from here.`; paint(); releaseWake(); });
    audio.addEventListener('waiting', () => { message.textContent = 'Buffering audio — playback resumes when the connection catches up.'; });
    audio.addEventListener('error', () => { message.textContent = 'This recording could not load. Check your connection and tap PLAY to retry.'; paint(); releaseWake(); });
    audio.addEventListener('ended', () => {
      if (tracks[selected].type === 'music') select((selected + 1) % 20, true);
      else { message.textContent = '90-minute guided session complete.'; paint(); releaseWake(); }
    });
    audio.addEventListener('loadedmetadata', () => {
      if (tracks[selected].type === 'guided' && Math.abs(audio.duration - 5400) > 2) message.textContent = 'Recording duration could not be confirmed as 90 minutes. Please choose another session.';
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
