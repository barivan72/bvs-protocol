/* Rex Relax: final branding + standalone PWA install + recorded audio loader. */
(() => {
  'use strict';
  const icon = './rex-relax-logo.png?v=20260916-8';

  function applyBrand() {
    const mark = document.querySelector('.mark');
    if (mark && !mark.dataset.rexLogo20260916) {
      mark.dataset.rexLogo20260916 = '1';
      mark.textContent = '';
      mark.style.cssText = 'width:52px;height:52px;border:1px solid var(--gold);border-radius:50%;overflow:hidden;display:block;flex:0 0 52px;background:#080806';
      const img = document.createElement('img');
      img.src = icon;
      img.alt = 'Rex Relax logo';
      img.width = 52;
      img.height = 52;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      mark.appendChild(img);
    }
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link => { link.href = icon; });
    return Boolean(mark);
  }

  function standalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function installUI() {
    if (standalone() || document.getElementById('rexPwaInstall')) return;
    let deferredPrompt = null;
    const button = document.createElement('button');
    button.id = 'rexPwaInstall';
    button.type = 'button';
    button.textContent = 'INSTALL REX RELAX';
    button.style.cssText = 'display:none;position:fixed;left:16px;bottom:16px;z-index:2147483000;border:1px solid #d6ae60;background:#11130f;color:#f0d38e;padding:12px 16px;border-radius:999px;font:800 12px Arial,Helvetica,sans-serif;letter-spacing:.08em;box-shadow:0 8px 28px rgba(0,0,0,.5);cursor:pointer';
    document.body.appendChild(button);

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredPrompt = event;
      button.style.display = 'block';
    });

    button.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (_) {}
      deferredPrompt = null;
      button.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      button.remove();
    });
  }

  if (!applyBrand()) document.addEventListener('DOMContentLoaded', applyBrand, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installUI, { once: true });
  else installUI();

  const core = document.createElement('script');
  core.src = './audio-v5-core.js?v=20260916-2';
  core.onload = applyBrand;
  core.onerror = () => console.error('Rex Relax audio player failed to load.');
  document.head.appendChild(core);
})();
