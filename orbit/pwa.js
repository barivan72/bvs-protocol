(() => {
  if (!('serviceWorker' in navigator)) return;
  const RELEASE = '2026-09-09.4';
  const pageRelease = document.querySelector('meta[name="bvs-release"]')?.content;
  let refreshing = false, profileDirty = false, registration, lastCheck = 0;
  const form = document.getElementById('profileForm');
  form?.addEventListener('input', () => { profileDirty = true; });
  form?.addEventListener('change', () => { profileDirty = true; });
  form?.addEventListener('submit', () => { profileDirty = false; });

  function refreshApp() {
    if (refreshing) return;
    refreshing = true;
    const target = new URL(location.href);
    target.pathname = '/app.html';
    target.searchParams.set('bvs_release', RELEASE);
    location.replace(target.href);
  }
  function offerRefresh() {
    if (pageRelease === RELEASE || refreshing) return;
    if (!profileDirty) { refreshApp(); return; }
    if (document.getElementById('bvsUpdateNotice')) return;
    const notice = document.createElement('div');
    notice.id = 'bvsUpdateNotice';
    notice.className = 'app-update-notice';
    notice.setAttribute('role', 'status');
    notice.append('An update is ready. Save your profile, then ');
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary'; button.textContent = 'Update app';
    button.addEventListener('click', () => {
      if (profileDirty) { form?.reportValidity(); form?.requestSubmit(); }
      if (!profileDirty) refreshApp();
    });
    notice.append(button); document.body.append(notice);
  }
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'BVS_PREPARE_UPDATE') return;
    event.ports[0]?.postMessage({ release: pageRelease, dirty: profileDirty });
    if (event.data.release !== pageRelease) offerRefresh();
  });
  navigator.serviceWorker.addEventListener('controllerchange', offerRefresh);

  async function checkUpdate() {
    if (!registration || document.hidden || !navigator.onLine || Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    try { await registration.update(); } catch (_) { /* Retain the working offline copy. */ }
  }
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(result => { registration = result; return checkUpdate(); })
    .catch(() => { /* The online site and installation guidance remain usable. */ });
  document.addEventListener('visibilitychange', checkUpdate);
  window.addEventListener('online', checkUpdate);
  window.addEventListener('pageshow', checkUpdate);
})();
