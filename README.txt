BVS PROTOCOL — PUBLISHABLE STATIC SITE

FILES
- index.html — complete website
- manifest.webmanifest — installable web-app metadata
- sw.js — basic offline cache/service worker
- netlify.toml — Netlify publish/security headers

NETLIFY — FREE PUBLISHING
1. Create/sign in to a Netlify account.
2. Open Netlify Drop / Add new site -> Deploy manually.
3. Drag the CONTENTS of this folder (or the unzipped folder) into the deploy area.
4. Netlify will create a temporary .netlify.app address.
5. Open it and test the website.
6. In Netlify: Domain management -> Add a domain -> bvsprotocol.com.
7. Netlify will show the exact DNS records required.
8. In GoDaddy: Domain -> DNS -> add/change only those records.
9. Wait for DNS verification and HTTPS certificate activation.

IMPORTANT
- Affiliate/subscription payment links are intentionally not hard-coded yet.
- This prototype stores adherence data in the visitor's own browser (localStorage).
- It is not a clinical record system and should not be presented as one.
