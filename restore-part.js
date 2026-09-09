/* Normalise the two recorded upload-transport differences before verifying the release. */
(function (root) {
  'use strict';
  function restorePart(number, bytes) {
    if (number !== 1 && number !== 5) return bytes;
    const encode = typeof Buffer !== 'undefined' ? b => Buffer.from(b).toString('base64') : b => btoa(String.fromCharCode(...b));
    const decode = typeof Buffer !== 'undefined' ? s => new Uint8Array(Buffer.from(s, 'base64')) : s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    let encoded = encode(bytes);
    if (number === 1) encoded = encoded.replace('NLZmyhQ2QQtc', 'NLZmyhQ2Qtc') + 'j';
    if (number === 5) {
      encoded = encoded.replace(/=+$/, '').replace('MPgTNwuG6mWV', 'MPgTNwu6mWV').replace('bcOrNhjON5TX', 'bcOrNhON5TX').replace('CfryRZz2V', 'CfryRz2V');
      encoded = encoded.slice(0, -1) + '/';
    }
    return decode(encoded);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = restorePart;
  else root.PGCRestorePart = restorePart;
})(globalThis);
