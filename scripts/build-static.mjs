import fs from 'node:fs';
const path='orbit/index.html';
let html=fs.readFileSync(path,'utf8');
if(!html.includes('id="downloadApp"'))throw new Error('The approved mobile application is missing');
html=html.replace('<meta name="bvs-release" content="2026-09-09.4">','<meta name="bvs-release" content="2026-09-09.4">'+(html.includes('name="bvs-updater"')?'':'<meta name="bvs-updater" content="2026-09-09.5">'));
html=html.replaceAll('/pwa.js?v=20260909-4','/pwa.js?v=20260909-5').replaceAll('Version 2026.09.09.4</small>','Version 2026.09.09.4 · Update 5</small>');
for(const name of ['index.html','app.html','launch.html'])fs.writeFileSync('orbit/'+name,html);
console.log('Approved BVS UI preserved; three real entry files created; updater 5 enabled.');
