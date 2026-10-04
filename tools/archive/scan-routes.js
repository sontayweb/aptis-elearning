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

const ROUTES = [
  { name: '01_thi_that', url: 'https://aptistest.edu.vn/practice/aptis-actual-test' },
  { name: '02_nghe', url: 'https://aptistest.edu.vn/learning/listening/options' },
  { name: '03_nghe_chep', url: 'https://aptistest.edu.vn/learning/listening/dictation/list' },
  { name: '04_doc', url: 'https://aptistest.edu.vn/learning/reading/options' },
  { name: '05_viet', url: 'https://aptistest.edu.vn/learning/writing/options' },
  { name: '06_noi', url: 'https://aptistest.edu.vn/learning/speaking/options' },
  { name: '07_ngu_phap', url: 'https://aptistest.edu.vn/learning/grammar/options' },
  { name: '08_de_trong_diem', url: 'https://aptistest.edu.vn/practice/aptis-focus-exams' },
  { name: '09_xep_hang_de', url: 'https://aptistest.edu.vn/practice/aptis-focus-exams?view=ranking' },
  { name: '10_du_doan_de', url: 'https://aptistest.edu.vn/du-doan-de' },
  { name: '11_dap_an_key', url: 'https://aptistest.edu.vn/learning/tips?exam=aptis' },
  { name: '12_lo_trinh', url: 'https://aptistest.edu.vn/aptis/b1-c1' },
  { name: '13_video_lectures', url: 'https://aptistest.edu.vn/video-lectures' },
  { name: '14_tai_lieu', url: 'https://aptistest.edu.vn/learning/aptis/materials' },
  { name: '15_tinh_diem', url: 'https://aptistest.edu.vn/aptis/b1-c1?tab=score' }
];

async function scanRoutes() {
  const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
  const screenshotDir = path.resolve(__dirname, 'screenshots/aptistest');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Khởi động quét giao diện bằng profile đã lưu...');
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    userDataDir: profileDir,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--start-maximized']
  });

  const page = await browser.newPage();

  for (let i = 0; i < ROUTES.length; i++) {
    const item = ROUTES[i];
    console.log(`[${i + 1}/${ROUTES.length}] Đang mở: ${item.name} (${item.url})...`);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500)); // Đợi render đầy đủ

      const outPath = path.join(screenshotDir, `${item.name}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`   -> Đã lưu ảnh: ${item.name}.png`);
    } catch (e) {
      console.warn(`   -> Lỗi khi mở ${item.name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ Hoàn tất! Toàn bộ ảnh chụp đã được lưu tại: tools/screenshots/aptistest/\n');
}

scanRoutes().catch((err) => {
  if (err.message.includes('Lock file can not be created')) {
    console.log('⚠️ Hãy đóng cửa sổ Chrome ảo đang mở trước khi chạy lệnh quét tự động.');
  } else {
    console.error('Lỗi quét trang:', err);
  }
});
