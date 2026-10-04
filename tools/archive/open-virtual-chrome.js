import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tìm đường dẫn Chrome hoặc Edge trên máy tính
function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Không tìm thấy Google Chrome hoặc Microsoft Edge trên máy tính của bạn.');
}

async function main() {
  const chromePath = getExecutablePath();
  const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');

  console.log(`[INFO] Trình duyệt thực thi: ${chromePath}`);
  console.log(`[INFO] Profile dữ liệu lưu tại: ${profileDir}`);

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
      '--remote-debugging-port=9222'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  const pages = await browser.pages();
  const page1 = pages[0] || (await browser.newPage());

  console.log('🌐 [1/2] Đang mở https://aptistest.edu.vn/ ...');
  await page1.goto('https://aptistest.edu.vn/', { waitUntil: 'domcontentloaded' }).catch((e) => {
    console.warn(`Lỗi mở trang 1: ${e.message}`);
  });

  console.log('🌐 [2/2] Đang mở https://aptisacademy.com.vn/ ...');
  const page2 = await browser.newPage();
  await page2.goto('https://aptisacademy.com.vn/', { waitUntil: 'domcontentloaded' }).catch((e) => {
    console.warn(`Lỗi mở trang 2: ${e.message}`);
  });

  console.log('\n======================================================');
  console.log('🎉 TRÌNH DUYỆT ẢO ĐÃ KHỞI ĐỘNG THÀNH CÔNG!');
  console.log('- Đăng nhập tài khoản trên 2 tab.');
  console.log('- Mọi session, cookies và tài khoản sẽ được lưu vĩnh viễn trong .chrome_profile_aptis/');
  console.log('- Bạn có thể ấn F12 để kiểm tra API, cấu trúc bài thi, audio.');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Lỗi khởi động:', err);
});
