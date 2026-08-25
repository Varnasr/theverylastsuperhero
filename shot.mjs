import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5340/wallpapers/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const box = await p.locator('.paper').first().boundingBox();
await p.screenshot({ path: process.env.OUT, clip: { x: box.x, y: box.y, width: box.width*2.1, height: box.height } });
console.log('ok');
