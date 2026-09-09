'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const base=process.env.PGC_URL||'http://127.0.0.1:8765/index.html';
const live=!!process.env.PGC_URL;
const report={url:base,checkedAt:new Date().toISOString(),checks:[],errors:[]};
const record=(name,pass,detail)=>{report.checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name,detail===undefined?'':JSON.stringify(detail));if(!pass)throw new Error(name)};
(async()=>{
 fs.mkdirSync('qa',{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.PGC?.count===58,{timeout:30000});
  record('Anonymous website opens',response.status()===200&&!page.url().includes('vercel.com/login'),page.url());
  record('58 catalogue products',await page.locator('#products .product-card').count()===58);
  record('Eight premium robots visible',await page.locator('.robot-card:visible').count()===8);
  record('58 prices and 58 seller links',await page.locator('#products .product-price').count()===58&&await page.locator('#products a.btn[href^="https://"]').count()===58);
  const images=await page.evaluate(async()=>{const products=JSON.parse(document.querySelector('#catalog-data').textContent);const out=[];for(let start=0;start<products.length;start+=8){out.push(...await Promise.all(products.slice(start,start+8).map(p=>new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve({id:p.id,ok:false,error:'timeout'}),18000);img.referrerPolicy='no-referrer';img.onload=()=>{clearTimeout(timer);resolve({id:p.id,ok:img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight})};img.onerror=()=>{clearTimeout(timer);resolve({id:p.id,ok:false,error:'image-load'})};img.src=p.image}))))}return out});
  report.images=images;record('All 58 photographs decode in the browser',images.every(x=>x.ok),{passed:images.filter(x=>x.ok).length,total:images.length});
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:width<500?844:1000});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);record('No horizontal overflow at '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===1440||width===390){await page.screenshot({path:'qa/'+(live?'online-':'')+'home-'+width+'.png'});await page.locator('#robots').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await page.screenshot({path:'qa/'+(live?'online-':'')+'robots-'+width+'.png'})}}
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#filter-category').selectOption('Premium robots');record('Premium filter returns eight robots',await page.locator('.product-card:visible').count()===8);
  await page.locator('#filter-budget').selectOption('5000');record('Budget respects currencies',await page.locator('.product-card:visible').count()===3);
  await page.locator('[data-reset]').first().click();await page.locator('#search').fill('Purobot Ultra');record('Search filters products',await page.locator('.product-card:visible').count()===1);
  const save=page.locator('.product-card:visible [data-save]').first();await save.click();record('Favourite saved',await save.getAttribute('aria-pressed')==='true');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.PGC?.count===58);record('Favourite persists after reload',await page.locator('#products [data-id="pgc-02"] [data-save]').getAttribute('aria-pressed')==='true');
  const compare=page.locator('.product-card:visible [data-compare]');await compare.nth(0).check();await compare.nth(1).check();await page.locator('#compare-open').click();record('Comparison opens',await page.locator('.comparison-table').isVisible());await page.keyboard.press('Escape');
  await page.locator('[data-finder]').first().click();await page.locator('[data-quiz="robot"]').click();await page.locator('[data-quiz="Premium robots"]').click();await page.locator('[data-quiz="5000"]').click();record('Robot finder returns three choices',await page.locator('.quiz-result').count()===3);await page.keyboard.press('Escape');
  record('App manifest is linked',await page.locator('link[rel="manifest"]').count()===1);
  if(!live){const worker=await page.evaluate(async()=>{await navigator.serviceWorker.ready;return true});record('Offline worker activates',worker);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.PGC?.count===58);record('Catalogue opens offline',await page.locator('#products .product-card').count()===58);await context.setOffline(false)}
  record('No uncaught JavaScript errors',report.errors.length===0,report.errors);
  report.success=true;
 }finally{await browser.close();fs.writeFileSync('qa/'+(live?'online-':'')+'browser-report.json',JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
