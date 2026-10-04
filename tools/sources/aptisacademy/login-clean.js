import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { getExecutablePath } from '../../core/browser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('=====================================================');
  console.log('🚀 TIẾN HÀNH ĐĂNG NHẬP VÀO APTIS ACADEMY');
  console.log('=====================================================\n');

  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  const email = config.account.email;
  const password = config.account.password;
  const port = config.remotePort || 9223;

  console.log(`👤 Tài khoản: ${email}`);
  console.log(`🔑 Mật khẩu:  ${password}`);

  const profileDir = path.resolve(__dirname, '../../.chrome_profile_aptisacademy');
  fs.mkdirSync(profileDir, { recursive: true });

  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
  } catch {
    browser = await puppeteer.launch({
      executablePath: getExecutablePath(),
      headless: false,
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
  }

  // Đóng các tab cũ, chỉ giữ 1 tab sạch
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  for (let i = 1; i < pages.length; i++) {
    await pages[i].close().catch(() => {});
  }

  // 1. ÁP DỤNG BYPASS ANTI-DEVTOOL TRỰC TIẾP VÀO WEBPACK LOADER
  await page.evaluateOnNewDocument(() => {
    let chunkArr = window.webpackChunk_N_E || [];
    const hijack = (arr) => {
      const orig = arr.push.bind(arr);
      arr.push = function(...args) {
        args.forEach(item => {
          if (Array.isArray(item) && item[1]) {
            // Vô hiệu hóa module checker
            if (item[1][80281]) {
              item[1][80281] = function(e, t, a) {
                a.d(t, { default: () => () => null });
              };
            }
            // Vô hiệu hóa disable-devtool library
            if (item[1][97891]) {
              item[1][97891] = function(e, t, a) {
                const dummy = function() {};
                dummy.DetectorType = { Size: 0 };
                dummy.isRunning = false;
                dummy.stop = function() {};
                dummy.isDevToolOpened = function() { return false; };
                e.exports = dummy;
                e.exports.default = dummy;
              };
            }
          }
        });
        return orig(...args);
      };
    };
    hijack(chunkArr);
    Object.defineProperty(window, 'webpackChunk_N_E', {
      get() { return chunkArr; },
      set(v) { chunkArr = v; hijack(chunkArr); }
    });
  });

  // Lắng nghe các cuộc gọi mạng sau khi submit
  const networkEvents = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/') || url.includes('auth') || url.includes('login') || url.includes('user') || url.includes('session')) {
      try {
        const status = res.status();
        const text = await res.text();
        console.log(`📡 [${status}] ${url}`);
        networkEvents.push({ url, status, text: text.slice(0, 500) });
        if (text.includes('token') || text.includes('user') || text.includes('accessToken') || text.includes('success')) {
          console.log(`   ✨ Response payload:`, text.slice(0, 300));
        }
      } catch {}
    }
  });

  console.log('🌐 Đang tải trang https://aptisacademy.com.vn/login ...');
  await page.goto('https://aptisacademy.com.vn/login', { waitUntil: 'networkidle2' });

  console.log('⏳ Đợi form đăng nhập hiển thị...');
  await page.waitForSelector('input[type="password"], input[placeholder*="••••"]', { timeout: 15000 });

  console.log('✍️ Đang điền Email...');
  const emailInput = await page.$('input[type="email"], input[placeholder*="email" i], input[type="text"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email, { delay: 50 });

  console.log('✍️ Đang điền Mật khẩu...');
  const pwdInput = await page.$('input[type="password"], input[placeholder*="••••"]');
  await pwdInput.click({ clickCount: 3 });
  await pwdInput.type(password, { delay: 50 });

  console.log('🖱️ Đang bấm nút Đăng nhập...');
  // Bấm submit
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đăng nhập'));
    if (btn) btn.click();
  });

  console.log('⏳ Đợi phản hồi xác thực và chuyển hướng từ hệ thống...');
  await new Promise(r => setTimeout(r, 6000));

  const finalUrl = page.url();
  console.log(`\n📍 URL sau khi đăng nhập: ${finalUrl}`);

  const cookies = await page.cookies();
  const localStorageData = await page.evaluate(() => Object.assign({}, localStorage));
  const sessionStorageData = await page.evaluate(() => Object.assign({}, sessionStorage));

  console.log(`🍪 Cookies nhận được (${cookies.length}):`);
  cookies.forEach(c => console.log(`   - ${c.name} (${c.domain})`));

  console.log(`🔑 LocalStorage keys (${Object.keys(localStorageData).length}):`, Object.keys(localStorageData));

  // Kiểm tra thông báo lỗi hoặc thành công hiển thị trên màn hình
  const screenText = await page.evaluate(() => {
    const alerts = Array.from(document.querySelectorAll('[role="alert"], [class*="toast"], [class*="error"], [class*="alert"]')).map(e => e.textContent.trim());
    return {
      alerts: alerts.filter(Boolean),
      bodySnippet: document.body.innerText.slice(0, 500)
    };
  });

  console.log('🔔 Thông báo trên giao diện:', screenText.alerts);

  const isSuccess = !finalUrl.includes('/login') ||
    cookies.some(c => c.name.toLowerCase().includes('token') || c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('session')) ||
    Object.keys(localStorageData).some(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('user'));

  console.log('\n=====================================================');
  if (isSuccess) {
    console.log('🎉🎉🎉 ĐĂNG NHẬP THÀNH CÔNG VÀO APTIS ACADEMY!');
    console.log(`👤 Tài khoản: ${email}`);
    console.log(`📍 Trang hiện tại: ${finalUrl}`);
  } else {
    console.log('ℹ️ Kết quả đăng nhập đã được ghi nhận.');
  }
  console.log('=====================================================\n');

  // Lưu session vào data/aptisacademy
  const sessionPath = path.resolve(__dirname, '../../data/aptisacademy/session.json');
  fs.writeFileSync(sessionPath, JSON.stringify({
    account: email,
    finalUrl,
    isSuccess,
    cookies,
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    networkEvents,
    screenText,
    updatedAt: new Date().toISOString()
  }, null, 2));
  console.log(`💾 Đã lưu session vào: ${sessionPath}`);

  // Chụp ảnh kết quả
  const screenshotPath = path.resolve(__dirname, '../../data/aptisacademy/login_result_final.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Đã chụp ảnh màn hình: ${screenshotPath}`);
}

run().catch(console.error);
