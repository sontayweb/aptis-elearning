import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { getExecutablePath } from './core/browser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function inspectVipContent() {
  console.log('=====================================================');
  console.log('🔍 KIỂM TRA NỘI DUNG VIP BỘ ĐỀ KEY (TÀI KHOẢN VIP)');
  console.log('=====================================================\n');

  const profileDir = path.resolve(__dirname, '.chrome_profile_aptisacademy');

  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223' });
  const page = (await browser.pages())[0] || (await browser.newPage());

  const apis = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/') || url.includes('/data/') || url.includes('bode') || url.includes('listening')) {
      try {
        const status = res.status();
        const text = await res.text();
        console.log(`📡 [${status}] ${url}`);
        if (text.startsWith('{') || text.startsWith('[')) {
          apis.push({ url, status, data: JSON.parse(text) });
        }
      } catch {}
    }
  });

  console.log('🌐 Đang mở https://aptisacademy.com.vn/bo-de-key ...');
  await page.goto('https://aptisacademy.com.vn/bo-de-key', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 4000));

  console.log('Current URL:', page.url());

  const info = await page.evaluate(() => {
    return {
      title: document.title,
      links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.href })).filter(a => a.href.includes('bo-de-key') || a.href.includes('listening')),
      bodySnippet: document.body.innerText.slice(0, 500)
    };
  });

  console.log('Links found:', info.links.slice(0, 10));

  fs.writeFileSync('data/aptisacademy/vip_probe.json', JSON.stringify({ info, apis }, null, 2));
  await page.screenshot({ path: 'data/aptisacademy/bodekey_vip.png' });
  console.log('📸 Đã chụp ảnh màn hình lưu tại data/aptisacademy/bodekey_vip.png');
}

inspectVipContent().catch(console.error);
