const KEY='bvs_v3_state';
const STAGES={
 B:{name:'Bioavailability',water:1500,tag:'Foundation',summary:'Build a consistent foundation around timing, food and hydration.',supplements:[
  {id:'vitd',icon:'D',name:'Vitamin D',times:['08:00'],take:'Take with a meal or snack that contains some fat.',why:'Vitamin D is fat-soluble, so taking it with food containing fat supports absorption.'},
  {id:'vitb',icon:'B',name:'Vitamin B complex',times:['08:15','20:15'],take:'Morning and evening with water.',why:'B vitamins support normal energy-yielding metabolism, the nervous system and red-blood-cell function.'},
  {id:'vitc',icon:'C',name:'Vitamin C',times:['08:30','20:30'],take:'Morning and evening with water, with or without food.',why:'Vitamin C supports normal immune function, collagen formation and antioxidant protection.'},
  {id:'mag',icon:'Mg',name:'Magnesium',times:['21:00'],take:'Evening with water.',why:'Magnesium contributes to normal muscle and nerve function, energy metabolism and electrolyte balance.'}
 ]},
 V:{name:'Vitality',water:2000,tag:'Builds on B',summary:'Keep the Bioavailability foundation and add support linked to cellular energy and omega-3 intake.',supplements:[]},
 S:{name:'Synergy',water:3000,tag:'Complete routine',summary:'Bring the full B and V routine together and add creatine as the final performance-and-recovery element.',supplements:[]}
};
STAGES.V.supplements=[...STAGES.B.supplements,{id:'coq10',icon:'Q10',name:'CoQ10',times:['13:00'],take:'With a meal, preferably earlier in the day.',why:'CoQ10 participates in mitochondrial energy production; food can improve absorption of standard formulations.'},{id:'omega3',icon:'Ω3',name:'Fish oil / Omega-3',times:['13:00'],take:'With a main meal.',why:'EPA and DHA are omega-3 fatty acids associated with cardiovascular and brain function.'}];
STAGES.S.supplements=[...STAGES.V.supplements,{id:'creatine',icon:'Cr',name:'Creatine monohydrate',times:['10:00'],take:'Take consistently each day with water or another suitable drink, following the product dose.',why:'Creatine helps replenish phosphocreatine used for rapid ATP production and can support strength and physical performance.'}];
const PRODUCTS={vitd:['Vitamin D3 + K2','https://amzn.to/4d4VImj'],vitb:['Vitamin B Complex','https://amzn.to/4rccZQB'],vitc:['Liposomal Vitamin C','https://amzn.to/3VbV00n'],mag:['Magnesium Glycinate','https://amzn.to/4hbsDbd'],coq10:['CoQ10','https://amzn.to/4qYb6qu'],omega3:['Omega-3 Fish Oil','https://amzn.to/4qS3d5P'],creatine:['Creatine Monohydrate','https://amzn.to/4h8STTD']};
function defaultState(){return{profile:{name:'Resident',stage:'B'},water:{},events:{}}}
function load(){try{return{...defaultState(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaultState()}}
let state=load(),calDate=new Date();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function eventKey(id,time,d=new Date()){return `${dateKey(d)}|${id}|${time}`}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}
function switchView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(id==='calendar')renderCalendar();$('#main').scrollIntoView({behavior:'smooth',block:'start'})}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
$('#enterBvs').addEventListener('click',()=>$('#main').scrollIntoView({behavior:'smooth'}));
function setStage(s){state.profile.stage=s;save();renderAll();toast(`Stage ${s}: ${STAGES[s].name}`)}
$$('[data-stage]').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.stage)));
function itemsFor(stage=state.profile.stage){return STAGES[stage].supplements.flatMap(s=>s.times.map(time=>({...s,time})))}
function statusFor(i,d=new Date()){return state.events[eventKey(i.id,i.time,d)]||''}
function setStatus(i,status){state.events[eventKey(i.id,i.time)]=status;save();renderAll();toast(`${i.name} marked ${status}`)}
function waterToday(){return +(state.water[dateKey()]||0)}
function addWater(n){state.water[dateKey()]=waterToday()+n;save();renderAll();toast(`${n} mL recorded`)}
$$('[data-water]').forEach(b=>b.addEventListener('click',()=>addWater(+b.dataset.water)));
function orb(icon,cls='supp-orb'){return `<div class="${cls}" aria-hidden="true">${icon}</div>`}
function renderToday(){const st=STAGES[state.profile.stage],items=itemsFor(),taken=items.filter(i=>statusFor(i)==='taken').length,w=waterToday(),pct=Math.min(100,Math.round(w/st.water*100));$('#metricStage').textContent=state.profile.stage;$('#metricTaken').textContent=`${taken} / ${items.length}`;$('#metricPct').textContent=`${items.length?Math.round(taken/items.length*100):0}%`;$('#metricWater').textContent=w>=1000?`${(w/1000).toFixed(1)} L`:`${w} mL`;$('#waterText').textContent=`${w} mL of ${st.water} mL`;$('#waterPct').textContent=`${pct}%`;$('#waterBar').style.width=`${pct}%`;$('#waterHeading').textContent=`${st.name} water target: ${st.water/1000} L`;$('#todayList').innerHTML=items.map(i=>{const status=statusFor(i);return `<div class="due">${orb(i.icon)}<div><h3>${i.name}${status?` <span style="font-size:.7rem;color:${status==='taken'?'#83e5b0':'#ffaaaa'}">• ${status}</span>`:''}</h3><p>${i.time} • ${i.take}</p></div><div class="due-actions">${status?`<button class="take-btn" data-clear="${i.id}|${i.time}">Undo</button>`:`<button class="take-btn" data-take="${i.id}|${i.time}">Taken</button><button class="take-btn missed" data-miss="${i.id}|${i.time}">Missed</button>`}</div></div>`}).join('');$$('[data-take]').forEach(b=>b.onclick=()=>{const[id,time]=b.dataset.take.split('|'),i=items.find(x=>x.id===id&&x.time===time);setStatus(i,'taken')});$$('[data-miss]').forEach(b=>b.onclick=()=>{const[id,time]=b.dataset.miss.split('|'),i=items.find(x=>x.id===id&&x.time===time);setStatus(i,'missed')});$$('[data-clear]').forEach(b=>b.onclick=()=>{const[id,time]=b.dataset.clear.split('|');delete state.events[eventKey(id,time)];save();renderAll()})}
function renderProtocol(){const s=state.profile.stage,st=STAGES[s];$('#protocolDetail').innerHTML=`<div class="stage-summary"><article class="card stage-hero-card">${orb(s,'stage-orb')}<div class="kicker">Stage ${s}</div><h3 class="stage-title">${st.name}</h3><p class="muted">${st.summary}</p><div class="metric" style="margin-top:15px"><small>Water routine</small><strong>${st.water/1000} L / day</strong></div><button class="btn blue" data-go="shop" style="margin-top:15px">Shop Stage ${s}</button></article><article class="card"><div class="kicker">Included routine</div>${st.supplements.map(x=>`<div class="rule">${orb(x.icon)}<div><strong>${x.name} — ${x.times.join(' & ')}</strong><span>${x.take}</span><span><b>Why:</b> ${x.why}</span></div></div>`).join('')}</article></div>`;$('#protocolDetail [data-go="shop"]').onclick=()=>switchView('shop')}
function dayStats(d){const items=itemsFor(),vals=items.map(i=>state.events[eventKey(i.id,i.time,d)]||''),water=+(state.water[dateKey(d)]||0),complete=vals.filter(v=>v==='taken').length,missed=vals.filter(v=>v==='missed').length,stage=STAGES[state.profile.stage];if(complete===items.length&&water>=stage.water)return['good','Complete'];if(missed>0||(d<new Date()&&complete===0&&water===0))return['bad','Missed'];if(complete>0||water>0)return['partial','Partial'];return['','No record']}
function renderCalendar(){const y=calDate.getFullYear(),m=calDate.getMonth();$('#monthTitle').textContent=calDate.toLocaleDateString('en-GB',{month:'long',year:'numeric'});const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),labels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];let html=labels.map(x=>`<div class="weekday">${x}</div>`).join('');for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const[cls,label]=dayStats(d),out=d.getMonth()!==m,today=dateKey(d)===dateKey();html+=`<div class="day ${out?'out':''} ${today?'today':''}"><span class="day-num">${d.getDate()}</span>${cls?`<i class="day-status ${cls}" title="${label}"></i>`:''}<small>${label}</small></div>`}$('#monthGrid').innerHTML=html}
$('#prevMonth').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCalendar()};$('#nextMonth').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCalendar()};
function productButtons(ids){return ids.map(id=>`<a class="btn primary" href="${PRODUCTS[id][1]}" target="_blank" rel="sponsored noopener">${PRODUCTS[id][0]}</a>`).join('')}
function renderShop(){['B','V','S'].forEach(s=>{const el=$(`#shop${s}`);if(el)el.innerHTML=productButtons(STAGES[s].supplements.map(x=>x.id))});$('#shopAll').innerHTML=productButtons(Object.keys(PRODUCTS))}
$('#saveProfile').onclick=()=>{state.profile.name=$('#profileName').value.trim()||'Resident';state.profile.stage=$('#profileStage').value;save();renderAll();toast('Profile saved')};$('#resetDemo').onclick=()=>{if(confirm('Reset all BVS records stored in this browser?')){localStorage.removeItem(KEY);state=defaultState();renderAll();toast('Records reset')}};
function renderAll(){$('#profileName').value=state.profile.name||'Resident';$('#profileStage').value=state.profile.stage;$$('[data-stage]').forEach(b=>b.classList.toggle('active',b.dataset.stage===state.profile.stage));renderToday();renderProtocol();renderCalendar();renderShop()}
function animateAtom(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const stage=$('.atom-stage'),orbs=$$('.hero-orb'),electrons=$$('.electron'),rings=$$('.ring');
 if(!stage||!orbs.length)return;
 let t0=performance.now(),pointerX=0,pointerY=0,targetX=0,targetY=0;
 stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*1.0;targetY=((e.clientY-r.top)/r.height-.5)*1.0});
 stage.addEventListener('pointerleave',()=>{targetX=0;targetY=0});
 function frame(now){
  const t=(now-t0)/1000;
  pointerX+=(targetX-pointerX)*.045;pointerY+=(targetY-pointerY)*.045;
  const cx=stage.clientWidth/2,cy=stage.clientHeight/2,rx=Math.min(stage.clientWidth*.34,265),ry=Math.min(stage.clientHeight*.245,98);
  rings.forEach((r,i)=>{const base=[0,60,-60][i]||0,drift=Math.sin(t*.24+i)*1.8;const tilt=67+pointerY*5;r.style.transform=`translate(-50%,-50%) rotateZ(${base+drift+pointerX*5}deg) rotateX(${tilt}deg)`});
  orbs.forEach((o,i)=>{const a=t*.52+i*(Math.PI*2/3),depth=Math.sin(a),z=(depth+1)/2,x=cx+Math.cos(a)*rx+pointerX*16,y=cy+depth*ry+pointerY*10,scale=.76+z*.34;o.style.transform=`translate3d(${x-o.offsetWidth/2}px,${y-o.offsetHeight/2}px,${(z-.5)*72}px) scale(${scale})`;o.style.zIndex=String(8+Math.round(z*7));o.style.filter=`brightness(${.83+z*.27}) saturate(${.96+z*.12})`;o.style.opacity=String(.84+z*.16)});
  electrons.forEach((e,i)=>{const speed=.76+i*.055,a=-t*speed+i*(Math.PI*2/electrons.length),phase=i%2?1:-1,x=cx+Math.cos(a)*(rx*(.88+i*.035))+pointerX*10,y=cy+Math.sin(a)*(ry*(1.20+i*.06))*phase+pointerY*8,z=(Math.sin(a+i)+1)/2,scale=.72+z*.34;e.style.transform=`translate3d(${x-e.offsetWidth/2}px,${y-e.offsetHeight/2}px,${(z-.5)*55}px) scale(${scale})`;e.style.zIndex=String(7+Math.round(z*8));e.style.opacity=String(.58+z*.42)});
  requestAnimationFrame(frame)
 }
 requestAnimationFrame(frame)
}
renderAll();animateAtom();
