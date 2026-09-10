#!/usr/bin/env node
/* Sinh icon-192.png + icon-512.png bằng puppeteer (tránh lỗi icon lệch trên Android
   khi dùng ảnh chỉnh tay). Chạy: NODE_PATH=$(npm root -g) node gen_icons.js */
const path = require('path');
const puppeteer = require('puppeteer');

const svgFor = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#12121c"/>
  <circle cx="256" cy="256" r="168" fill="#16281f"/>
  <path d="M256 128 c 26 22 34 52 26 78 c -8 26 -30 40 -52 40 c -22 0 -44 -14 -52 -40 c 8 -40 42 -70 78 -78 z" fill="#22c55e"/>
  <path d="M232 168 c 14 -10 30 -14 44 -12" stroke="#a7f3d0" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M150 268 h212 c0 58 -47 106 -106 106 s-106 -48 -106 -106 z" fill="#4ade80"/>
  <rect x="134" y="250" width="244" height="22" rx="11" fill="#86efac"/>
  <path d="M206 214 c 10 -14 -10 -24 0 -38" stroke="#86efac" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M306 214 c 10 -14 -10 -24 0 -38" stroke="#86efac" stroke-width="13" stroke-linecap="round" fill="none"/>
</svg>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  for (const size of [192, 512]) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(
      '<html><body style="margin:0;padding:0;background:#12121c">' + svgFor(size) + '</body></html>',
      { waitUntil: 'load' }
    );
    const out = path.join(__dirname, `icon-${size}.png`);
    await page.screenshot({ path: out });
    console.log('wrote', out);
  }
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
