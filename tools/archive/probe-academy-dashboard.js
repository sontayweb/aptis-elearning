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

async function checkDashboard() {
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  console.log('🌐 Mở https://aptisacademy.com.vn/dashboard ...');
  await page.goto('https://aptisacademy.com.vn/dashboard', { waitUntil: 'networkidle2' });

  const url = page.url();
  console.log('URL hiện tại:', url);

  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('Text trong dashboard:');
  console.log(text);

  await page.screenshot({ path: 'tools/dashboard_screenshot.png', fullPage: true });
  console.log('📸 Đã chụp ảnh lưu tại tools/dashboard_screenshot.png');

  await browser.close();
}

checkDashboard().catch(console.error);
