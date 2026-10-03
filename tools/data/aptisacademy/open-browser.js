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
  throw new Error('Không tìm thấy Google Chrome hoặc Edge trên máy tính.');
}

async function main() {
  const chromePath = getExecutablePath();
  const profileDir = path.resolve(__dirname, '../../.chrome_profile_academy');

  console.log('=====================================================');
  console.log('🚀 KHỞI ĐỘNG CHROME ĐỘC LẬP CHO APTIS ACADEMY');
  console.log('=====================================================');
  console.log(`- Trình duyệt: ${chromePath}`);
  console.log(`- Profile lưu tại: ${profileDir}`);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    defaultViewport: null,
    userDataDir: profileDir,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--remote-debugging-port=9223' // Dùng port 9223 để không bị xung đột với aptiskytich (9222)
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  console.log('🌐 Đang mở https://aptisacademy.com.vn/ ...');
  await page.goto('https://aptisacademy.com.vn/', { waitUntil: 'domcontentloaded' }).catch(() => {});

  console.log('\n✅ TRÌNH DUYỆT ĐÃ MỞ THÀNH CÔNG!');
  console.log('- Bạn có thể đăng nhập hoặc vào phòng thi của Academy.');
  console.log('- Sau đó chạy "crawl-exam.bat" để cào toàn bộ nội dung về hệ thống.');
}

main().catch(console.error);
