(() => {
  function toastSafe(msg){if(typeof toast==='function')toast(msg);else console.log(msg)}
  const stage=document.querySelector('.atom-stage');
  if(stage&&!stage.dataset.upgraded){stage.dataset.upgraded='1';stage.innerHTML='<div class="bvs-logo-card" aria-label="Animated BVS Protocol atom logo"><div class="atom-core"><div class="core-glow"></div><div class="orbit-line o1"></div><div class="orbit-line o2"></div><div class="orbit-line o3"></div><div class="path-plane p1"><div class="hero-sphere">B</div><div class="satellite"></div></div><div class="path-plane p2"><div class="hero-sphere">V</div><div class="satellite"></div></div><div class="path-plane p3"><div class="hero-sphere">S</div><div class="satellite"></div></div></div></div>'}
  const map={today:'D',calendar:'C',protocol:'B',shop:'S',profile:'P'};document.querySelectorAll('[data-view]').forEach(b=>b.dataset.orb=map[b.dataset.view]||'•');
  let deferred=null;
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const updateStatus=m=>document.querySelectorAll('[data-install-status]').forEach(e=>e.textContent=m);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;updateStatus('Ready to install')});
  window.addEventListener('appinstalled',()=>{deferred=null;updateStatus('Installed');toastSafe('BVS Protocol installed')});
  function platformGuide(){
    const ua=navigator.userAgent.toLowerCase();
    if(/iphone|ipad|ipod/.test(ua))return {title:'Install BVS on iPhone / iPad',steps:['Tap the Share button in Safari.','Choose “Add to Home Screen”.','Tap “Add”. The blue-and-silver BVS icon will appear on your Home Screen.']};
    if(/android/.test(ua))return {title:'Install BVS on Android',steps:['Open your browser menu (⋮ or browser menu).','Choose “Install app” or “Add to Home screen”.','Confirm Install. The BVS icon will appear with your apps.']};
    if(/opr\//.test(ua)||/opera/.test(ua))return {title:'Install BVS in Opera',steps:['Open the Opera menu.','Look for “Install app”, “Install BVS Protocol” or “Add to Home screen”.','Confirm the installation.']};
    if(/edg\//.test(ua))return {title:'Install BVS in Microsoft Edge',steps:['Open the Edge menu (⋯).','Choose Apps, then “Install BVS Protocol”.','Confirm Install.']};
    if(/chrome\//.test(ua))return {title:'Install BVS in Chrome',steps:['Open the Chrome menu (⋮).','Choose “Install BVS Protocol” or “Cast, save and share” → “Install page as app”.','Confirm Install.']};
    return {title:'Install BVS Protocol',steps:['Open your browser menu.','Choose “Install app”, “Install BVS Protocol” or “Add to Home screen”.','Confirm the installation.']};
  }
  function showInstallGuide(){
    document.getElementById('bvsInstallGuide')?.remove();
    const g=platformGuide(),back=document.createElement('div');back.id='bvsInstallGuide';back.className='install-modal-backdrop';back.innerHTML=`<div class="install-modal-card" role="dialog" aria-modal="true" aria-labelledby="bvsInstallTitle"><button class="install-modal-close" type="button" aria-label="Close">×</button><div class="install-modal-hero"><img src="bvs-app-icon.svg" alt="BVS Protocol blue and silver app icon" class="install-modal-logo"><div><div class="kicker">BVS on your device</div><h3 id="bvsInstallTitle">${g.title}</h3></div></div><ol>${g.steps.map(s=>`<li>${s}</li>`).join('')}</ol><div class="install-modal-note">Your browser controls the final installation step. Once installed, BVS opens like an app and uses the blue-and-silver icon.</div><button class="btn blue install-modal-done" type="button">Got it</button></div>`;
    document.body.appendChild(back);
    const close=()=>back.remove();back.querySelector('.install-modal-close').addEventListener('click',close);back.querySelector('.install-modal-done').addEventListener('click',close);back.addEventListener('click',e=>{if(e.target===back)close()});
  }
  async function install(){
    if(isStandalone()){toastSafe('BVS Protocol is already installed');return}
    if(deferred){deferred.prompt();const r=await deferred.userChoice;deferred=null;updateStatus(r.outcome==='accepted'?'Installed':'Install available');if(r.outcome!=='accepted')showInstallGuide();return}
    showInstallGuide();
  }
  const actions=document.querySelector('.hero-actions');if(actions&&!document.getElementById('installAppHero')){const b=document.createElement('button');b.className='btn blue';b.id='installAppHero';b.textContent='Install BVS App';actions.appendChild(b);b.addEventListener('click',install)}
  const top=document.querySelector('.topbar-in');if(top&&!document.getElementById('installAppTop')){const b=document.createElement('button');b.className='ghost topbar-install';b.id='installAppTop';b.type='button';b.innerHTML='<span class="topbar-install-orb">↓</span><span>Install App</span>';const reset=document.getElementById('resetDemo');top.insertBefore(b,reset||null);b.addEventListener('click',install)}
  const today=document.getElementById('today');if(today&&!document.getElementById('bvsInstallStrip')){const div=document.createElement('div');div.id='bvsInstallStrip';div.className='install-strip';div.innerHTML='<img class="install-logo" src="bvs-app-icon.svg" alt="BVS Protocol blue and silver atom app icon"><div><div class="kicker">BVS on your phone</div><h3>Install the BVS Protocol app</h3><p>Add it to your Home Screen with the new blue-and-silver icon. <span data-install-status>'+(isStandalone()?'Installed':'Install available')+'</span></p></div><div class="install-actions"><button class="btn blue" id="installAppMain">Install BVS App</button><a class="btn" href="bvs-app-icon.svg" download="BVS-Protocol-icon.svg">Download logo</a></div>';today.querySelector('.page-head')?.insertAdjacentElement('afterend',div);div.querySelector('#installAppMain').addEventListener('click',install)}
})();