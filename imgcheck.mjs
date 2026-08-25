import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const broken = [];
for (const path of ['/lore/', '/archive/', '/illustrations/', '/lore/p-ai/', '/lore/mr-gupta/', '/lore/momo/']) {
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  p.on('response', r => { if (r.request().resourceType() === 'image' && r.status() >= 400) broken.push(path + ' ' + r.url().split('/').pop()); });
  await p.goto('http://localhost:5610' + path, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=700) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,100)); } });
  await p.waitForTimeout(1200);
  const imgs = await p.$$eval('img', els => els.map(e => e.complete && e.naturalWidth > 0));
  console.log(path.padEnd(20), imgs.length, 'images |', imgs.filter(x => !x).length, 'not rendered');
  await p.close();
}
console.log('HTTP image errors:', broken.length, broken.slice(0,5));
await b.close();
