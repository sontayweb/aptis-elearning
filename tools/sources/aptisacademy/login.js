import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { getExecutablePath } from '../../core/browser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=====================================================');
  console.log('🔑 ĐĂNG NHẬP VÀO APTIS ACADEMY (aptisacademy.com.vn)');
  console.log('=====================================================\n');

  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  const email = config.account.email;
  const password = config.account.password;
  const port = config.remotePort || 9223;

  console.log(`👤 Tài khoản: ${email}`);
  console.log(`🔑 Mật khẩu:  ${password}`);
  console.log(`🌐 Cổng Chrome: ${port}`);

  const profileDir = path.resolve(__dirname, '../../.chrome_profile_aptisacademy');
  fs.mkdirSync(profileDir, { recursive: true });

  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
    console.log(`⚡ Đã kết nối vào Chrome đang mở ở cổng ${port}`);
  } catch {
    console.log(`🚀 Khởi động Chrome với profile riêng biệt: ${profileDir}`);
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

  const page = await browser.newPage();

  // Bẻ khóa triệt để thư viện disable-devtool từ cấp độ Webpack module
  await page.evaluateOnNewDocument(() => {
    let chunkArr = window.webpackChunk_N_E || [];
    const hijack = (arr) => {
      const orig = arr.push.bind(arr);
      arr.push = function(...args) {
        args.forEach(item => {
          if (Array.isArray(item) && item[1]) {
            // Vô hiệu hóa module layout devtool checker
            if (item[1][80281]) {
              item[1][80281] = function(e, t, a) {
                a.d(t, { default: () => () => null });
              };
            }
            // Vô hiệu hóa lõi disable-devtool library
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

  // Lắng nghe tất cả API responses để bắt JWT token hoặc auth profile
  const capturedResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('auth') || url.includes('user') || url.includes('login') || url.includes('profile')) {
      try {
        const status = response.status();
        const text = await response.text();
        capturedResponses.push({ url, status, text: text.slice(0, 500) });
        console.log(`📡 [API RESPONSE] ${status} ${url}`);
        if (text.includes('token') || text.includes('user') || text.includes('accessToken')) {
          console.log(`   ✨ PAYLOAD:`, text.slice(0, 200));
        }
      } catch {}
    }
  });

  console.log('🌐 Đang mở trang đăng nhập https://aptisacademy.com.vn/login ...');
  await page.goto('https://aptisacademy.com.vn/login', { waitUntil: 'networkidle2' });

  console.log('⏳ Đợi form đăng nhập xuất hiện...');
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });

  // Điền email
  console.log(`✍️ Đang nhập Email: ${email}`);
  const emailInput = await page.$('input[type="email"], input[placeholder*="email" i], input[type="text"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.press('Backspace');
  await emailInput.type(email, { delay: 40 });

  // Điền password
  console.log(`✍️ Đang nhập Mật khẩu...`);
  const pwdInput = await page.$('input[type="password"]');
  await pwdInput.click({ clickCount: 3 });
  await pwdInput.press('Backspace');
  await pwdInput.type(password, { delay: 40 });

  // Tích vào checkbox "Ghi nhớ đăng nhập" nếu có
  const rememberCheckbox = await page.$('input[type="checkbox"]');
  if (rememberCheckbox) {
    const checked = await (await rememberCheckbox.getProperty('checked')).jsonValue();
    if (!checked) await rememberCheckbox.click();
  }

  // Bấm nút ĐĂNG NHẬP
  console.log('🚀 Đang bấm nút "ĐĂNG NHẬP →"...');
  const submitBtn = await page.$('button[type="submit"]') ||
    (await page.$$('button')).find(async b => {
      const text = await (await b.getProperty('textContent')).jsonValue();
      return text && text.includes('ĐĂNG NHẬP');
    });

  if (submitBtn) {
    await submitBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  console.log('⏳ Đang đợi server xác thực và phản hồi...');
  await new Promise(r => setTimeout(r, 6000));

  const afterUrl = page.url();
  console.log(`\n📍 URL sau khi đăng nhập: ${afterUrl}`);

  // Trích xuất Cookies và LocalStorage
  const cookies = await page.cookies();
  const localStorageData = await page.evaluate(() => Object.assign({}, localStorage));
  const sessionStorageData = await page.evaluate(() => Object.assign({}, sessionStorage));

  console.log(`🍪 Số lượng cookies nhận được: ${cookies.length}`);
  console.log(`🔑 LocalStorage keys:`, Object.keys(localStorageData));

  // Kiểm tra thành công
  const hasUserSession = !afterUrl.includes('/login') ||
    cookies.some(c => c.name.toLowerCase().includes('token') || c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('auth')) ||
    Object.keys(localStorageData).some(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('user') || k.toLowerCase().includes('email'));

  console.log('\n-----------------------------------------------------');
  if (hasUserSession) {
    console.log('🎉🎉🎉 ĐĂNG NHẬP THÀNH CÔNG VÀO APTIS ACADEMY!');
    console.log(`👤 Tài khoản đang hoạt động: ${email}`);
    console.log(`📍 Trang chuyển hướng đến: ${afterUrl}`);
  } else {
    console.log('⚠️ Kiểm tra lại phản hồi đăng nhập: URL vẫn ở /login');
  }
  console.log('-----------------------------------------------------\n');

  // Lưu session ra tệp
  const sessionFile = path.resolve(__dirname, '../../data/aptisacademy/session.json');
  fs.writeFileSync(sessionFile, JSON.stringify({
    account: email,
    afterUrl,
    hasUserSession,
    cookies,
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    capturedResponses,
    updatedAt: new Date().toISOString()
  }, null, 2));

  console.log(`💾 Thông tin phiên đăng nhập đã lưu tại: ${sessionFile}`);

  // Chụp ảnh màn hình kết quả sau khi đăng nhập
  const screenshotPath = path.resolve(__dirname, '../../data/aptisacademy/logged_in_dashboard.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Đã chụp ảnh màn hình lưu tại: ${screenshotPath}`);

  return { hasUserSession, afterUrl };
}

main().catch(console.error);
