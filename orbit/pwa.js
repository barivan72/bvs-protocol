(() => {
  if (!('serviceWorker' in navigator)) return;
  const startedControlled = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  let profileDirty = false;
  let registration;
  let lastCheck = 0;
  const form = document.getElementById('profileForm');
  form?.addEventListener('input', () => { profileDirty = true; });
  form?.addEventListener('change', () => { profileDirty = true; });
  form?.addEventListener('submit', () => { profileDirty = false; });

  function refreshApp() {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First installation needs no reload. Existing installations update once.
    if (!startedControlled || refreshing) return;
    if (!profileDirty) { refreshApp(); return; }
    const notice = document.createElement('div');
    notice.className = 'app-update-notice';
    notice.setAttribute('role', 'status');
    notice.append('An update is ready. Save your profile, then ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = 'Update app';
    button.addEventListener('click', () => {
      if (profileDirty) { form?.reportValidity(); form?.requestSubmit(); }
      if (!profileDirty) refreshApp();
    });
    notice.append(button);
    document.body.append(notice);
  });

  async function checkUpdate() {
    if (!registration || document.hidden || !navigator.onLine || Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    try { await registration.update(); } catch (_) { /* Keep the working app offline. */ }
  }
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(result => { registration = result; return checkUpdate(); })
    .catch(() => { /* The online website remains usable. */ });
  document.addEventListener('visibilitychange', checkUpdate);
  window.addEventListener('online', checkUpdate);
  window.addEventListener('pageshow', checkUpdate);
})();
