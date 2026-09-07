(() => {
  const KEY='bvs_reminders_enabled_v1';
  const ICON='bvs-app-icon-512.png';
  let timers=[];
  const toastSafe=m=>typeof toast==='function'?toast(m):console.log(m);
  const items=()=>{try{return STAGES[state.profile.stage].supplements.flatMap(s=>s.times.map(time=>({name:s.name,time,take:s.take||''})))}catch(e){return[]}};
  function nextDate(time){const [h,m]=time.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);if(d<=new Date())d.setDate(d.getDate()+1);return d}
  function clearTimers(){timers.forEach(clearTimeout);timers=[]}
  async function notify(item,test=false){
    const body=test?'This is your BVS reminder test.':`${item.time} • ${item.take||'Time for your BVS routine.'}`;
    if('serviceWorker'in navigator){
      try{
        const reg=await navigator.serviceWorker.ready;
        await reg.showNotification(`BVS • ${item.name}`,{body,icon:ICON,badge:'bvs-app-icon-192.png',tag:`bvs-${item.name}-${item.time}`,renotify:true,vibrate:[220,100,220],data:{url:'./#today'}});
        return;
      }catch(e){}
    }
    if('Notification'in window&&Notification.permission==='granted')new Notification(`BVS • ${item.name}`,{body,icon:ICON});
  }
  function schedule(){
    clearTimers();
    if(localStorage.getItem(KEY)!=='true')return;
    items().forEach(item=>{
      const ms=nextDate(item.time)-new Date();
      timers.push(setTimeout(()=>{notify(item);schedule()},Math.min(ms,2147483000)));
    });
    refresh();
  }
  async function enable(){
    if(!('Notification'in window)){alert('This browser does not support web notifications. Use “Add alarms to calendar” for reliable phone alerts.');return}
    const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();
    if(p==='granted'){localStorage.setItem(KEY,'true');schedule();toastSafe('BVS reminders enabled')}
    else{localStorage.setItem(KEY,'false');refresh();alert('Notifications were not enabled. You can still add the BVS schedule to your phone calendar.')}
  }
  const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n'),pad=n=>String(n).padStart(2,'0');
  function icsDate(time){const d=nextDate(time);return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`}
  function calendar(){
    const stageName=STAGES[state.profile.stage].name;
    let ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BVS Protocol//Daily Reminders//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
    items().forEach((item,i)=>{
      const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
      ics+=`BEGIN:VEVENT\r\nUID:bvs-${Date.now()}-${i}@bvsprotocol.com\r\nDTSTAMP:${stamp}\r\nDTSTART:${icsDate(item.time)}\r\nRRULE:FREQ=DAILY\r\nSUMMARY:${esc('BVS • '+item.name)}\r\nDESCRIPTION:${esc(item.take)}\r\nBEGIN:VALARM\r\nTRIGGER:PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:${esc('BVS reminder: '+item.name)}\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
    });
    ics+='END:VCALENDAR\r\n';
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
    a.download=`BVS-${stageName.replace(/\s+/g,'-')}-reminders.ics`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
    toastSafe('Calendar reminders created');
  }
  function refresh(){
    const box=document.getElementById('bvsReminderCard');if(!box)return;
    const on=localStorage.getItem(KEY)==='true'&&(!('Notification'in window)||Notification.permission==='granted');
    const status=box.querySelector('.reminder-status');
    if(status){status.classList.toggle('on',on);status.querySelector('span').textContent=on?'Browser reminders enabled':'Reminders not enabled'}
    const list=box.querySelector('.schedule-orbs');
    if(list)list.innerHTML=items().map(i=>`<div class="schedule-orb"><div><b>${i.name}</b><small>${i.time}</small></div></div>`).join('');
    const next=items().map(i=>({...i,date:nextDate(i.time)})).sort((a,b)=>a.date-b.date)[0];
    const n=box.querySelector('[data-next-reminder]');if(n)n.textContent=next?`${next.name} • ${next.time}`:'No reminder scheduled';
  }
  const today=document.getElementById('today');
  if(today&&!document.getElementById('bvsReminderCard')){
    const c=document.createElement('article');c.id='bvsReminderCard';c.className='card reminder-card';
    c.innerHTML='<div class="reminder-head"><div><div class="kicker">Smart reminders</div><h3 style="margin:.25em 0">BVS alarm & calendar</h3><p class="muted small" style="margin:0">Use notifications while the web app is active, and add recurring calendar alarms for reliable phone alerts even when BVS is closed.</p></div><div class="reminder-status"><i></i><span>Reminders not enabled</span></div></div><div style="margin-top:12px"><small class="muted">Next: <b data-next-reminder></b></small></div><div class="schedule-orbs"></div><div class="install-actions" style="margin-top:16px;justify-content:flex-start"><button class="btn blue" id="enableBvsReminders">Enable reminders</button><button class="btn" id="calendarBvsReminders">Add alarms to calendar</button><button class="btn" id="testBvsReminder">Test reminder</button></div>';
    today.querySelector('.bvs-selector')?.insertAdjacentElement('afterend',c);
    c.querySelector('#enableBvsReminders').addEventListener('click',enable);
    c.querySelector('#calendarBvsReminders').addEventListener('click',calendar);
    c.querySelector('#testBvsReminder').addEventListener('click',async()=>{
      if(!('Notification'in window)||Notification.permission!=='granted')await enable();
      if('Notification'in window&&Notification.permission==='granted')notify({name:'Test reminder',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),take:'Your BVS notification system is working.'},true);
    });
  }
  document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{refresh();schedule()},80)));
  document.getElementById('saveProfile')?.addEventListener('click',()=>setTimeout(()=>{refresh();schedule()},80));
  refresh();
  if(localStorage.getItem(KEY)==='true')schedule();
})();