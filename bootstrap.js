(async function () {
  'use strict';
  const status = document.getElementById('publish-status');
  try {
    if (!globalThis.DecompressionStream || !globalThis.crypto?.subtle) throw new Error('Please open this website in an up-to-date Chrome, Edge, Safari or Firefox browser.');
    const parts = await Promise.all(Array.from({length:8}, async (_, i) => {
      const response = await fetch(new URL(`payload-${String(i+1).padStart(2,'0')}.bin`, document.baseURI));
      if (!response.ok) throw new Error(`The catalogue could not load (HTTP ${response.status}). Please reload this page.`);
      return PGCRestorePart(i+1, new Uint8Array(await response.arrayBuffer()));
    }));
    const stream = new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip'));
    const bytes = await new Response(stream).arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2,'0')).join('');
    if (hash !== '7670bdc7a1bf13f269afbc025480031ecfc4dacbb6c762d2634f9382f74b77a0' || bytes.byteLength !== 264212) throw new Error('The catalogue integrity check failed. Please reload the page.');
    const html = new TextDecoder().decode(bytes);
    document.open(); document.write(html); document.close();
  } catch (error) {
    status.textContent = error.message || 'The catalogue could not load. Please reload this page.';
    document.getElementById('retry').hidden = false;
    console.error('Pet Gadget Club publication:', error);
  }
})();
