(() => {
  if (!('serviceWorker' in navigator)) return;
  const RELEASE = document.querySelector('meta[name="bvs-release"]')?.content;
  const UPDATER = document.querySelector('meta[name="bvs-updater"]')?.content || '2026-09-09.5';
  let refreshing = false, profileDirty = false, registration, lastCheck = 0;
  let pending = {release:RELEASE,updater:UPDATER};
  const form = document.getElementById('profileForm');
  form?.addEventListener('input',()=>{profileDirty=true;});
  form?.addEventListener('change',()=>{profileDirty=true;});
  form?.addEventListener('submit',()=>{profileDirty=false;});
  function refreshApp(){
    if(refreshing)return;refreshing=true;
    const target=new URL(location.href);target.pathname='/app.html';
    target.searchParams.set('bvs_update',pending.updater||pending.release);location.replace(target.href);
  }
  function offerRefresh(info){
    if(!info||refreshing)return;pending=info;
    if(info.release===RELEASE&&info.updater===UPDATER)return;
    if(!profileDirty){refreshApp();return;}
    if(document.getElementById('bvsUpdateNotice'))return;
    const notice=document.createElement('div');notice.id='bvsUpdateNotice';notice.className='app-update-notice';notice.setAttribute('role','status');
    notice.append('An update is ready. Save your profile, then ');
    const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Update app';
    button.addEventListener('click',()=>{if(profileDirty)form?.requestSubmit();if(!profileDirty)refreshApp();});
    notice.append(button);document.body.append(notice);
  }
  function status(worker){return new Promise(resolve=>{
    if(!worker){resolve(null);return;}
    const channel=new MessageChannel();let settled=false;
    const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();resolve(value);};
    const timer=setTimeout(()=>finish(null),1500);channel.port1.onmessage=e=>finish(e.data);
    try{worker.postMessage({type:'BVS_RELEASE_STATUS'},[channel.port2]);}catch(_){finish(null);}
  });}
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type!=='BVS_PREPARE_UPDATE')return;
    event.ports[0]?.postMessage({release:RELEASE,updater:UPDATER,dirty:profileDirty});offerRefresh(event.data);
  });
  navigator.serviceWorker.addEventListener('controllerchange',async()=>{
    const worker=navigator.serviceWorker.controller;const info=await status(worker);offerRefresh(info);
    worker?.postMessage({type:'BVS_PRECACHE'});
  });
  async function checkUpdate(){
    if(!registration||document.hidden||!navigator.onLine||Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();try{await registration.update();}catch(_){}
  }
  navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(result=>{registration=result;return checkUpdate();}).catch(()=>{});
  navigator.serviceWorker.ready.then(result=>result.active?.postMessage({type:'BVS_PRECACHE'})).catch(()=>{});
  document.addEventListener('visibilitychange',checkUpdate);window.addEventListener('online',checkUpdate);window.addEventListener('pageshow',checkUpdate);
})();
