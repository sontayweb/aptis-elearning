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

async function extractToken() {
  console.log('=====================================================');
  console.log('🔍 BẮT ĐẦU TRÍCH XUẤT TOKEN TỪ TRÌNH DUYỆT ĐANG MỞ');
  console.log('=====================================================\n');

  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('⚡ Đã kết nối vào cửa sổ trình duyệt đang chạy!');
  } catch {
    const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
    console.log('🚀 Đang khởi chạy trình duyệt với profile đã lưu...');
    browser = await puppeteer.launch({
      executablePath: getExecutablePath(),
      headless: false,
      userDataDir: profileDir,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--remote-debugging-port=9222']
    });
  }

  const pages = await browser.pages();
  let targetPage = pages.find(p => p.url().includes('aptiskytich.vn'));

  if (!targetPage) {
    targetPage = pages[0] || (await browser.newPage());
    console.log('🌐 Đang điều hướng tới https://aptiskytich.vn/ ...');
    await targetPage.goto('https://aptiskytich.vn/', { waitUntil: 'domcontentloaded' });
  }

  console.log('⏳ Đang đọc session từ LocalStorage...');
  const storageData = await targetPage.evaluate(() => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      items[key] = localStorage.getItem(key);
    }
    return items;
  });

  let token = null;
  let userEmail = null;

  for (const [key, val] of Object.entries(storageData)) {
    if (key.includes('supabase.auth.token') || key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(val);
        token = parsed.access_token || parsed.currentSession?.access_token;
        userEmail = parsed.user?.email || parsed.currentSession?.user?.email;
        if (token) break;
      } catch {}
    }
  }

  if (token) {
    console.log('🎉 TÌM THẤY TOKEN ĐĂNG NHẬP THÀNH CÔNG!');
    console.log(`👤 Tài khoản: ${userEmail || 'Đã xác thực'}`);
    console.log(`🔑 Token (rút gọn): ${token.substring(0, 25)}...`);

    const outPath = path.resolve(__dirname, 'auth_token.json');
    fs.writeFileSync(outPath, JSON.stringify({ accessToken: token, userEmail }, null, 2));
    console.log(`💾 Đã tự động lưu vào file: ${outPath}`);
  } else {
    console.log('⚠️ CHƯA TÌM THẤY TOKEN:');
    console.log('- Hãy đảm bảo bạn đã bấm "Đăng nhập" tài khoản trên tab aptiskytich.vn trong cửa sổ Chrome.');
    console.log('- Sau khi đăng nhập xong, chạy lại lệnh này là token sẽ được tự động lưu!');
  }
}

extractToken().catch(err => {
  console.error('Lỗi trích xuất token:', err.message);
});
