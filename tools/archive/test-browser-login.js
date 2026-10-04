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

async function loginViaBrowser() {
  const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
  console.log('🚀 Đang mở trình duyệt để thử đăng nhập trên giao diện...');

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  console.log('🌐 Đang mở trang https://aptiskytich.vn/auth ...');
  await page.goto('https://aptiskytich.vn/auth', { waitUntil: 'networkidle2' });

  console.log('⏳ Đang đợi form đăng nhập...');
  // Điền email và mật khẩu
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'sontayweb.admin@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Taovipko0!!', { delay: 50 });

    console.log('👉 Đang bấm nút Đăng nhập...');
    const submitBtn = await page.$('button[type="submit"], form button');
    if (submitBtn) {
      await submitBtn.click();
    }

    // Đợi 5 giây xem có thông báo lỗi hay chuyển trang
    await new Promise(r => setTimeout(r, 4000));

    const currentUrl = page.url();
    console.log(`URL sau khi bấm đăng nhập: ${currentUrl}`);

    // Đọc thông báo lỗi trên màn hình nếu có
    const errorText = await page.evaluate(() => {
      const err = document.querySelector('.text-destructive, [role="alert"], .text-red-500, .toast');
      return err?.textContent?.trim() || null;
    });

    if (errorText) {
      console.log(`⚠️ Thông báo từ web: "${errorText}"`);
    }

    // Kiểm tra token trong localStorage
    const token = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          return localStorage.getItem(k);
        }
      }
      return null;
    });

    if (token) {
      console.log('🎉 ĐÃ BẮT ĐƯỢC TOKEN ĐĂNG NHẬP THÀNH CÔNG TỪ TRÌNH DUYỆT!');
      const parsed = JSON.parse(token);
      fs.writeFileSync(path.resolve(__dirname, 'auth_token.json'), JSON.stringify({
        accessToken: parsed.access_token,
        user: parsed.user
      }, null, 2));
    }
  } catch (e) {
    console.error('Lỗi khi thao tác trên web:', e.message);
  }
}

loginViaBrowser().catch(console.error);
