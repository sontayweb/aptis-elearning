import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy trình duyệt Google Chrome hoặc Edge trên máy tính.');
}

/**
 * Khởi chạy hoặc kết nối vào Chrome với profile và port riêng biệt theo từng nguồn web
 */
export async function getBrowserForSource(sourceName, port = 9222, headless = false) {
  // 1. Thử kết nối vào port debug nếu Chrome đã mở
  try {
    const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
    console.log(`⚡ Đã kết nối vào Chrome đang chạy (Port ${port})!`);
    return browser;
  } catch {}

  // 2. Nếu chưa mở, khởi động Chrome mới với profile riêng biệt
  const profileDir = path.resolve(__dirname, `../../.chrome_profile_${sourceName}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless,
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--remote-debugging-port=${port}`
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  return browser;
}

// Chạy trực tiếp từ dòng lệnh: node browser.js <sourceName> <port> <url>
if (process.argv[1] && process.argv[1].endsWith('browser.js')) {
  const sourceName = process.argv[2] || 'default';
  const port = parseInt(process.argv[3] || '9222', 10);
  const targetUrl = process.argv[4] || 'https://google.com';

  console.log(`🚀 Đang mở Chrome cho nguồn "${sourceName}" tại cổng ${port}...`);
  getBrowserForSource(sourceName, port, false).then(async (browser) => {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.goto(targetUrl);
    console.log(`✅ Trình duyệt đã mở tại: ${targetUrl}`);
  }).catch((err) => {
    console.error('❌ Lỗi mở Chrome:', err.message);
  });
}
