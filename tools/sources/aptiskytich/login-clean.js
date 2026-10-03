import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { getExecutablePath } from '../../core/browser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('=====================================================');
  console.log('🚀 TIẾN HÀNH ĐĂNG NHẬP VÀO APTIS KỲ TÍCH (aptiskytich.vn)');
  console.log('=====================================================\n');

  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  const email = config.account?.email || 'sontayweb.admin@gmail.com';
  const password = config.account?.password || 'Taovipko!';
  const port = config.remotePort || 9222;

  console.log(`👤 Tài khoản: ${email}`);

  const profileDir = path.resolve(__dirname, '../../.chrome_profile_aptis');
  fs.mkdirSync(profileDir, { recursive: true });

  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
    console.log(`⚡ Đã kết nối vào Chrome đang mở (Port ${port})`);
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
    console.log(`⚡ Đã mở cửa sổ Chrome mới (Port ${port})`);
  }

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto('https://aptiskytich.vn/auth', { waitUntil: 'networkidle2', timeout: 30000 });

  // Kiểm tra xem đã có token trong localStorage chưa
  let authToken = await getAuthTokenFromPage(page);

  if (!authToken) {
    console.log('🔐 Đang điền form đăng nhập tự động...');
    try {
      await page.waitForSelector('#email', { timeout: 5000 });
      await page.$eval('#email', (el, v) => el.value = v, email);
      await page.$eval('#password', (el, v) => el.value = v, password);

      // Nhấn Đăng nhập
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginBtn = btns.find(b => b.textContent.includes('Đăng nhập') && b.type === 'submit');
        if (loginBtn) loginBtn.click();
      });

      await new Promise(r => setTimeout(r, 2500));
      authToken = await getAuthTokenFromPage(page);
    } catch (e) {
      console.log('⚠️ Form fill:', e.message);
    }
  }

  // Nếu vẫn chưa đăng nhập thành công do sai mật khẩu, chờ người dùng đăng nhập trên giao diện
  if (!authToken) {
    console.log('\n⚠️ Mật khẩu "Taovipko!" chưa khớp với hệ thống.');
    console.log('👉 CỬA SỔ CHROME ĐÃ ĐƯỢC MỞ TRÊN MÀN HÌNH.');
    console.log('👉 Vui lòng: Nhập mật khẩu đúng trên màn hình HOẶC nhấn "Đăng nhập với Google"!');
    console.log('⏳ Đang chờ bạn thao tác đăng nhập (tối đa 120s)...');

    const startTime = Date.now();
    while (Date.now() - startTime < 120000) {
      await new Promise(r => setTimeout(r, 2000));
      authToken = await getAuthTokenFromPage(page);
      if (authToken) {
        console.log('🎉 ĐÃ PHÁT HIỆN ĐĂNG NHẬP THÀNH CÔNG TỪ TRÌNH DUYỆT!');
        break;
      }
    }
  }

  if (!authToken) {
    console.error('❌ Hết thời gian chờ đăng nhập.');
    return null;
  }

  console.log('\n=====================================================');
  console.log('🎉 XÁC THỰC THÀNH CÔNG VỚI SUPABASE AUTH!');
  console.log(`- Email: ${authToken.user?.email}`);
  console.log(`- User ID: ${authToken.user?.id}`);
  console.log(`- Token: ${authToken.access_token?.substring(0, 30)}...`);
  console.log('=====================================================\n');

  // Lưu token
  const tokenFile = path.resolve(__dirname, '../../auth_token.json');
  const sessionFile = path.resolve(__dirname, '../../data/aptiskytich/session.json');

  const sessionData = {
    accessToken: authToken.access_token,
    refreshToken: authToken.refresh_token,
    user: authToken.user,
    savedAt: new Date().toISOString()
  };

  fs.writeFileSync(tokenFile, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  console.log(`💾 Đã lưu session vào: ${sessionFile}`);

  // Kiểm tra gói PRO
  try {
    const res = await fetch(`https://bacoamhbatqpxatrrflz.supabase.co/rest/v1/user_subscriptions?user_id=eq.${authToken.user.id}&select=*`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${authToken.access_token}`
      }
    });
    if (res.ok) {
      const subs = await res.json();
      console.log('📦 Gói dịch vụ hiện tại của tài khoản:', subs);
    }
  } catch {}

  return sessionData;
}

async function getAuthTokenFromPage(page) {
  try {
    return await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('auth-token'))) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k));
            if (parsed && parsed.access_token) return parsed;
          } catch {}
        }
      }
      return null;
    });
  } catch {
    return null;
  }
}

run().catch(console.error);
