import json, threading, pathlib, mimetypes, urllib.parse, shutil
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
BASE=pathlib.Path(__file__).resolve().parents[1]
ROOT=BASE/'orbit'
OUT=BASE/'verification';OUT.mkdir(exist_ok=True)
OLD_SW=(OUT/'original-sw.js').read_bytes()
LEGACY=b'''<!doctype html><meta name="viewport" content="width=device-width"><h1 id="old">OLD BVS</h1><script>navigator.serviceWorker.register('/sw.js?v=14')</script>'''
LEGACY_SW=b'''self.addEventListener('install',e=>e.waitUntil(caches.open('old-unknown-name').then(c=>c.add('/legacy.html')).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.match('/legacy.html'))});'''
state={'mode':'legacy','missing':False}
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def do_GET(self):
        name=urllib.parse.urlparse(self.path).path
        kind='text/html; charset=utf-8'
        if name=='/sw.js':
            body=LEGACY_SW if state['mode']=='legacy' else OLD_SW if state['mode']=='baseline' else (ROOT/'sw.js').read_bytes();kind='application/javascript'
        elif name=='/legacy.html' or (name=='/' and state['mode']=='legacy'):body=LEGACY
        elif state['missing'] and name=='/assets/bvs-icon-maskable-r3.png':
            self.send_response(404);self.end_headers();return
        else:
            if name in ('/','/orbit/','/index-v3.html'):name='/index.html'
            f=(ROOT/name.lstrip('/')).resolve()
            if not f.is_relative_to(ROOT.resolve()) or not f.is_file():
                self.send_response(404);self.end_headers();return
            body=f.read_bytes();kind=mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
            if f.suffix=='.webmanifest':kind='application/manifest+json'
        self.send_response(200);self.send_header('Content-Type',kind);self.send_header('Cache-Control','no-store');self.send_header('Service-Worker-Allowed','/');self.end_headers()
        try:self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
report={'updater':'2026-09-09.5','tests':[],'errors':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        for version in ['baseline','fixed']:
            state.update(mode='legacy',missing=True)
            context=browser.new_context(viewport={'width':390,'height':844})
            page=context.new_page();page.set_default_timeout(15000)
            page.goto(origin+'/',wait_until='domcontentloaded')
            page.evaluate('navigator.serviceWorker.ready');page.reload();page.locator('#old').wait_for()
            page.evaluate("localStorage.setItem('sentinel','KEEP');localStorage.setItem('bvs_v3_state',JSON.stringify({profile:{name:'Migration check',stage:'B'},events:{},water:{}}));")
            state['mode']=version
            page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update()).catch(()=>null)')
            if version=='baseline':
                page.wait_for_timeout(2500)
                assert page.locator('#old').count()==1,'Failed to reproduce the old installer failure'
                report['tests'].append({'name':'Original update with one missing icon','result':'REPRODUCED: old screen remained'})
            else:
                page.wait_for_url('**/app.html?**',timeout=15000)
                page.locator('#downloadApp').wait_for(state='visible')
                page.wait_for_function("document.querySelector('.app-banner img').naturalWidth===192")
                result=page.evaluate("""()=>({url:location.pathname,updater:document.querySelector('meta[name=bvs-updater]').content,kept:localStorage.getItem('sentinel')==='KEEP',profile:JSON.parse(localStorage.getItem('bvs_orbit_v1')).profile.name,icon:document.querySelector('.app-banner img').naturalWidth,overflow:document.documentElement.scrollWidth>innerWidth+1})""")
                assert result['updater']=='2026-09-09.5' and result['kept'] and result['profile']=='Migration check' and not result['overflow'],result
                report['tests'].append({'name':'New update, missing icon and unrecognised old cache name','result':'PASS','details':result})
                page.screenshot(path=str(OUT/'mobile-repaired.png'))
            context.close()
        state.update(mode='fixed',missing=False)
        for width in [320,390,768,1440]:
            context=browser.new_context(viewport={'width':width,'height':900})
            page=context.new_page();page.set_default_timeout(15000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
            page.goto(origin+'/',wait_until='networkidle')
            page.locator('#downloadApp').wait_for(state='visible')
            page.wait_for_function("document.querySelector('.app-banner img').naturalWidth===192")
            result=page.evaluate("""()=>({width:innerWidth,updater:document.querySelector('meta[name=bvs-updater]').content,downloadVisible:document.getElementById('downloadApp').getBoundingClientRect().bottom<innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1})""")
            assert result['downloadVisible'] and not result['overflow'],result
            page.evaluate('installPrompt=null');page.locator('#downloadApp').click();page.locator('#detailDialog[open]').wait_for();page.locator('.dialog-close').click()
            before=page.locator('#waterAmount').inner_text();page.locator('[data-water="250"]').click();after=page.locator('#waterAmount').inner_text();assert before!=after
            page.locator('#scheduleList [data-check]').first.click();taken=page.locator('#takenCount').inner_text()
            for view in ['calendar','protocol','shop','history']:
                page.locator(f'[data-view="{view}"]').first.evaluate('(e)=>e.click()');assert page.locator('#'+view).evaluate('(e)=>!e.hidden')
            page.locator('[data-view="today"]').first.evaluate('(e)=>e.click()')
            page.reload(wait_until='networkidle');assert page.locator('#waterAmount').inner_text()==after;assert page.locator('#takenCount').inner_text()==taken
            if width==390:
                page.wait_for_function("async()=>{const c=await caches.open('bvs-orbit-2026-09-09.4-update5');return !!(await c.match('/pwa.js?v=20260909-5'))}")
                context.set_offline(True);page.reload(wait_until='domcontentloaded');page.locator('#downloadApp').wait_for(state='visible');assert page.locator('#waterAmount').inner_text()==after
                result['offline']=True
            report['tests'].append({'name':f'Layout and functions {width}px','result':'PASS','details':result})
            context.close()
        browser.close()
    report['passed']=not report['errors'];assert report['passed'],report
except Exception as e:
    report['passed']=False;report['failure']=str(e);raise
finally:
    server.shutdown();(OUT/'repair-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
