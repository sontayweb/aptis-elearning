import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy trình duyệt');
}

async function exportCookies() {
  const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
  const outFile = path.resolve(__dirname, 'saved_cookies.json');

  console.log('📦 Đang trích xuất cookies từ profile đã lưu...');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true, // Chạy ngầm không cần mở cửa sổ
    userDataDir: profileDir,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://aptistest.edu.vn/student/dashboard', { waitUntil: 'networkidle2' }).catch(() => {});

  const cookies = await page.cookies();
  const localStorageData = await page.evaluate(() => Object.assign({}, window.localStorage));

  const result = {
    domain: 'aptistest.edu.vn',
    exportedAt: new Date().toISOString(),
    cookies,
    localStorage: localStorageData
  };

  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Đã lưu cookies và token vào: ${outFile}`);

  await browser.close();
}

exportCookies().catch((err) => {
  if (err.message.includes('Lock file can not be created')) {
    console.log('⚠️ Lưu ý: Hãy đóng cửa sổ Chrome ảo trước khi chạy lệnh xuất cookies này (để tránh xung đột lock profile).');
  } else {
    console.error('Lỗi xuất cookies:', err.message);
  }
});
