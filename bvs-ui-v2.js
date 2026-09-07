(() => {
  const ICON='bvs-app-icon-512.png';

  function toastSafe(msg){if(typeof toast==='function')toast(msg);else console.log(msg)}
  function addHeadIcon(rel,href,sizes){
    let el=document.querySelector(`link[rel="${rel}"]`);
    if(!el){el=document.createElement('link');el.rel=rel;document.head.appendChild(el)}
    el.href=href;if(sizes)el.sizes=sizes;
  }
  addHeadIcon('icon','bvs-app-icon-192.png','192x192');
  addHeadIcon('apple-touch-icon','bvs-app-icon-192.png','192x192');

  const stage=document.querySelector('.atom-stage');
  if(stage){
    stage.dataset.upgraded='v2';
    stage.innerHTML=`
      <div class="bvs-logo-card" aria-label="Animated BVS Protocol 3D atom logo">
        <div class="atom-core">
          <div class="core-glow"></div>
          <div class="orbit-line o1"></div>
          <div class="orbit-line o2"></div>
          <div class="orbit-line o3"></div>
          <div class="path-plane p1">
            <div class="hero-sphere"><span class="sphere-letter">B</span></div>
            <div class="satellite"></div><div class="satellite s2"></div>
          </div>
          <div class="path-plane p2">
            <div class="hero-sphere"><span class="sphere-letter">V</span></div>
            <div class="satellite"></div><div class="satellite s2"></div>
          </div>
          <div class="path-plane p3">
            <div class="hero-sphere"><span class="sphere-letter">S</span></div>
            <div class="satellite"></div><div class="satellite s2"></div>
          </div>
        </div>
      </div>`;
  }

  const stageCopy={
    en:{B:['Bioavailability','Foundation'],V:['Vitality','Builds on B'],S:['Synergy','Complete routine']},
    pt:{B:['Biodisponibilidade','Base'],V:['Vitalidade','Continua B'],S:['Sinergia','Rotina completa']},
    es:{B:['Biodisponibilidad','Base'],V:['Vitalidad','Continúa B'],S:['Sinergia','Rutina completa']},
    fr:{B:['Biodisponibilité','Base'],V:['Vitalité','Continue B'],S:['Synergie','Routine complète']},
    it:{B:['Biodisponibilità','Base'],V:['Vitalità','Continua B'],S:['Sinergia','Routine completa']},
    de:{B:['Bioverfügbarkeit','Grundlage'],V:['Vitalität','Baut auf B auf'],S:['Synergie','Komplette Routine']}
  };
  function lang(){
    const l=(document.documentElement.lang||'en').slice(0,2).toLowerCase();
    return stageCopy[l]?l:'en';
  }
  function restoreStageButtons(){
    const l=lang();
    document.querySelectorAll('.bvs-button[data-stage]').forEach(btn=>{
      const s=btn.dataset.stage;
      const copy=stageCopy[l][s]||stageCopy.en[s];
      const orb=btn.querySelector('.mini-orb');
      if(!orb || !orb.querySelector('span') || btn.querySelector('strong')?.textContent!==copy[0]){
        btn.innerHTML=`<div><div class="mini-orb"><span>${s}</span></div><strong>${copy[0]}</strong><small>${copy[1]}</small></div>`;
      }
    });
  }
  restoreStageButtons();

  const selectors=document.querySelectorAll('.bvs-selector');
  selectors.forEach(sel=>{
    const obs=new MutationObserver(()=>{if([...sel.querySelectorAll('.bvs-button')].some(b=>!b.querySelector('.mini-orb')))restoreStageButtons()});
    obs.observe(sel,{childList:true,subtree:true,characterData:true});
  });
  document.getElementById('bvsLangSelect')?.addEventListener('change',()=>setTimeout(restoreStageButtons,0));

  const navOrb={today:'D',calendar:'C',protocol:'B',shop:'S',profile:'P'};
  document.querySelectorAll('[data-view]').forEach(b=>b.dataset.orb=navOrb[b.dataset.view]||'•');

  let deferred=null;
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const updateStatus=m=>document.querySelectorAll('[data-install-status]').forEach(e=>e.textContent=m);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;updateStatus('Ready to install')});
  window.addEventListener('appinstalled',()=>{deferred=null;updateStatus('Installed');toastSafe('BVS Protocol installed')});

  const extraStyle=document.createElement('style');
  extraStyle.textContent=`
    .topbar-install{display:flex!important;align-items:center;gap:8px;white-space:nowrap}
    .install-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(0,4,10,.78);backdrop-filter:blur(12px)}
    .install-modal-card{position:relative;width:min(520px,100%);border:1px solid rgba(128,215,255,.35);border-radius:28px;padding:24px;background:radial-gradient(420px 220px at 0 0,rgba(47,176,255,.18),transparent 62%),linear-gradient(150deg,#061a2b,#01060d 72%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 80px rgba(0,0,0,.6),0 0 42px rgba(40,166,255,.18);color:#f5fbff}
    .install-modal-close{position:absolute;right:14px;top:12px;width:42px;height:42px;border:1px solid rgba(190,229,246,.2);border-radius:50%;background:rgba(255,255,255,.05);color:#fff;font-size:1.55rem}
    .install-modal-hero{display:flex;align-items:center;gap:16px;padding-right:40px}.install-modal-logo{width:96px;height:96px}
    .install-modal-card h3{margin:.22em 0;font-size:1.55rem}.install-modal-card ol{margin:22px 0;padding-left:24px;display:grid;gap:12px;color:#d8e9f2;line-height:1.5}
    .install-modal-card li::marker{color:#70d8ff;font-weight:900}.install-modal-note{padding:13px 15px;border-radius:16px;border:1px solid rgba(120,211,255,.16);background:rgba(54,159,221,.08);color:#a9c5d4;line-height:1.5;font-size:.88rem}.install-modal-done{width:100%;margin-top:16px}
    @media(max-width:760px){.topbar-install span:last-child{display:none}.topbar-install{padding:8px!important}.install-modal-card{padding:20px}.install-modal-logo{width:76px;height:76px}.install-modal-card h3{font-size:1.25rem}}
  `;
  document.head.appendChild(extraStyle);

  function platformGuide(){
    const ua=navigator.userAgent.toLowerCase();
    if(/iphone|ipad|ipod/.test(ua))return {title:'Install BVS on iPhone / iPad',steps:['Open BVS in Safari.','Tap Share.','Choose “Add to Home Screen”, then tap Add.']};
    if(/android/.test(ua))return {title:'Install BVS on Android',steps:['Open your browser menu.','Choose “Install app” or “Add to Home screen”.','Confirm Install.']};
    if(/opr\//.test(ua)||/opera/.test(ua))return {title:'Install BVS from Edge or Chrome',steps:['Opera Desktop does not currently provide normal PWA installation for BVS.','Open bvsprotocol.com in Microsoft Edge or Google Chrome.','In Edge: menu (⋯) → Apps → Install BVS Protocol. In Chrome: menu (⋮) → Install BVS Protocol.']};
    if(/edg\//.test(ua))return {title:'Install BVS in Microsoft Edge',steps:['Open the Edge menu (⋯).','Choose Apps.','Choose “Install BVS Protocol”, then confirm Install.']};
    if(/chrome\//.test(ua))return {title:'Install BVS in Chrome',steps:['Open the Chrome menu (⋮).','Choose “Install BVS Protocol” or “Install page as app”.','Confirm Install.']};
    return {title:'Install BVS Protocol',steps:['Open your browser menu.','Choose “Install app” or “Add to Home screen”.','Confirm the installation.']};
  }
  function showInstallGuide(){
    document.getElementById('bvsInstallGuide')?.remove();
    const g=platformGuide(),back=document.createElement('div');
    back.id='bvsInstallGuide';back.className='install-modal-backdrop';
    back.innerHTML=`<div class="install-modal-card" role="dialog" aria-modal="true" aria-labelledby="bvsInstallTitle">
      <button class="install-modal-close" type="button" aria-label="Close">×</button>
      <div class="install-modal-hero"><img src="${ICON}" alt="BVS Protocol round blue and silver 3D app icon" class="install-modal-logo"><div><div class="kicker">BVS on your device</div><h3 id="bvsInstallTitle">${g.title}</h3></div></div>
      <ol>${g.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
      <div class="install-modal-note">The installed app now uses a real PNG icon designed for Windows, Android and Home Screen installation.</div>
      <button class="btn blue install-modal-done" type="button">Got it</button>
    </div>`;
    document.body.appendChild(back);
    const close=()=>back.remove();
    back.querySelector('.install-modal-close').addEventListener('click',close);
    back.querySelector('.install-modal-done').addEventListener('click',close);
    back.addEventListener('click',e=>{if(e.target===back)close()});
  }
  async function install(){
    if(isStandalone()){toastSafe('BVS Protocol is already installed');return}
    if(deferred){
      deferred.prompt();const r=await deferred.userChoice;deferred=null;
      updateStatus(r.outcome==='accepted'?'Installed':'Install available');
      if(r.outcome!=='accepted')showInstallGuide();
      return;
    }
    showInstallGuide();
  }

  const actions=document.querySelector('.hero-actions');
  if(actions&&!document.getElementById('installAppHero')){
    const b=document.createElement('button');b.className='btn blue';b.id='installAppHero';b.textContent='Install BVS App';actions.appendChild(b);b.addEventListener('click',install);
  }
  const top=document.querySelector('.topbar-in');
  if(top&&!document.getElementById('installAppTop')){
    const b=document.createElement('button');b.className='ghost topbar-install';b.id='installAppTop';b.type='button';b.innerHTML='<span class="topbar-install-orb">↓</span><span>Install App</span>';
    const reset=document.getElementById('resetDemo');top.insertBefore(b,reset||null);b.addEventListener('click',install);
  }
  const today=document.getElementById('today');
  if(today&&!document.getElementById('bvsInstallStrip')){
    const div=document.createElement('div');div.id='bvsInstallStrip';div.className='install-strip';
    div.innerHTML=`<img class="install-logo" src="${ICON}" alt="BVS Protocol round blue and silver 3D app icon">
      <div><div class="kicker">BVS on your phone</div><h3>Install the BVS Protocol app</h3><p>Add it to your Home Screen with the new round 3D blue-and-silver icon. <span data-install-status>${isStandalone()?'Installed':'Install available'}</span></p></div>
      <div class="install-actions"><button class="btn blue" id="installAppMain">Install BVS App</button><a class="btn" href="${ICON}" download="BVS-Protocol-round-icon.png">Download logo</a></div>`;
    today.querySelector('.page-head')?.insertAdjacentElement('afterend',div);
    div.querySelector('#installAppMain').addEventListener('click',install);
  }
})();