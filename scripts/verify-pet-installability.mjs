import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2];
if (!url) throw new Error('usage: node verify-pet-installability.mjs <url>');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForChrome(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Chrome did not open debugging port ${port}`);
}

async function onePass(pass) {
  const port = 9221 + pass;
  const profile = `/tmp/pet-tomorrow-chrome-${pass}`;
  fs.rmSync(profile, { recursive: true, force: true });
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    url,
  ], { stdio: 'ignore' });

  try {
    await waitForChrome(port);
    await delay(2500);
    const targets = await CDP.List({ host: '127.0.0.1', port });
    const target = targets.find(t => t.type === 'page' && t.url.includes('/pet-tomorrow/')) ?? targets.find(t => t.type === 'page');
    if (!target) throw new Error('No Pet Tomorrow Chrome page target');

    const client = await CDP({ target, host: '127.0.0.1', port });
    try {
      const { Page, Runtime } = client;
      await Page.enable();
      const installability = await Page.getInstallabilityErrors();
      const manifest = await Page.getAppManifest();
      const state = await Runtime.evaluate({
        expression: `(async()=>{const reg=await navigator.serviceWorker.ready;return{title:document.title,url:location.href,manifest:document.querySelector('link[rel="manifest"]')?.href,serviceWorkerScope:reg.scope,icons:[...document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]')].map(x=>x.href)}})()`,
        awaitPromise: true,
        returnByValue: true,
      });
      const value = state.result.value;
      console.log(JSON.stringify({ pass, installabilityErrors: installability.installabilityErrors, manifestUrl: manifest.url, state: value }));
      if (installability.installabilityErrors.length) throw new Error(`Chrome installability errors: ${JSON.stringify(installability.installabilityErrors)}`);
      if (!manifest.url?.includes('/pet-tomorrow/manifest.webmanifest')) throw new Error('Wrong Pet Tomorrow manifest URL');
      if (!value?.serviceWorkerScope?.endsWith('/pet-tomorrow/')) throw new Error('Wrong Pet Tomorrow service worker scope');
      if (!value?.icons?.some(x => x.includes('icon-192.png'))) throw new Error('Pet Tomorrow 192 icon is not active in the document');
      if (!value?.icons?.some(x => x.includes('icon-512.png'))) throw new Error('Pet Tomorrow 512 icon is not active in the document');
    } finally {
      await client.close();
    }
  } finally {
    chrome.kill('SIGKILL');
    await delay(300);
  }
}

for (const pass of [1, 2, 3]) await onePass(pass);
console.log('PET_TOMORROW_CHROME_INSTALLABILITY_3X_OK');
