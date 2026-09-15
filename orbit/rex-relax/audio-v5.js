/* Rex Relax: logo refresh + recorded audio loader. */
(() => {
  'use strict';
  const logo = '/rex-relax/icon.svg?v=20260915-1';
  function applyBrand() {
    const mark = document.querySelector('.mark');
    if (!mark) return false;
    if (!mark.dataset.rexLogo20260915) {
      mark.dataset.rexLogo20260915 = '1';
      mark.textContent = '';
      mark.style.cssText = 'width:52px;height:52px;border:1px solid var(--gold);border-radius:50%;overflow:hidden;display:block;flex:0 0 52px;background:#080907';
      const img = document.createElement('img');
      img.src = logo;
      img.alt = 'Rex Relax logo';
      img.width = 52;
      img.height = 52;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      mark.appendChild(img);
    }
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link => { link.href = logo; });
    return true;
  }
  if (!applyBrand()) document.addEventListener('DOMContentLoaded', applyBrand, {once:true});
  const core = document.createElement('script');
  core.src = '/rex-relax/audio-v5-core.js?v=20260915-1';
  core.onload = applyBrand;
  core.onerror = () => console.error('Rex Relax audio player failed to load.');
  document.head.appendChild(core);
})();
