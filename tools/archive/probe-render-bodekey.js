import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy trình duyệt.');
}

async function renderBoDeKey() {
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  console.log('🌐 Đang mở https://aptisacademy.com.vn/bo-de-key ...');
  await page.goto('https://aptisacademy.com.vn/bo-de-key', { waitUntil: 'networkidle2' });

  const info = await page.evaluate(() => {
    const text = document.body.innerText;
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, placeholder: i.placeholder, name: i.name
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    }));
    return { text: text.substring(0, 2000), inputs, buttons, links: links.filter(l => l.text) };
  });

  console.log('\n--- VĂN BẢN TRÊN TRANG /bo-de-key ---');
  console.log(info.text);
  console.log('\n--- Inputs ---', info.inputs);
  console.log('\n--- Buttons ---', info.buttons.slice(0, 10));
  console.log('\n--- Links ---', info.links.slice(0, 10));

  await page.screenshot({ path: 'tools/bo-de-key-screenshot.png', fullPage: true });
  console.log('📸 Đã chụp ảnh lưu tại tools/bo-de-key-screenshot.png');

  await browser.close();
}

renderBoDeKey().catch(console.error);
