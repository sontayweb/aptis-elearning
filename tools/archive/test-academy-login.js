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
  throw new Error('Không tìm thấy trình duyệt.');
}

async function testAcademyLogin() {
  console.log('=====================================================');
  console.log('🚀 KIỂM TRA ĐĂNG NHẬP VÀO APTIS ACADEMY');
  console.log('=====================================================\n');

  const profileDir = path.resolve(__dirname, '../.chrome_profile_academy');
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: false, // Hiện cửa sổ để quan sát
    userDataDir: profileDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || (await browser.newPage());

  // Lắng nghe tất cả request mạng của trang này
  const networkLogs = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('auth') || url.includes('login') || url.includes('user')) {
      try {
        const status = response.status();
        const text = await response.text();
        networkLogs.push({ url, status, text: text.substring(0, 300) });
        console.log(`📡 [API RESPONSE] ${status} ${url}`);
      } catch {}
    }
  });

  console.log('🌐 Đang mở https://aptisacademy.com.vn/login ...');
  await page.goto('https://aptisacademy.com.vn/login', { waitUntil: 'networkidle2' });

  console.log('⏳ Đang điền form đăng nhập...');
  try {
    // Tìm các input
    await page.waitForSelector('input', { timeout: 10000 });

    const inputs = await page.$$('input');
    console.log(`Tìm thấy ${inputs.length} ô nhập liệu.`);

    // Điền tài khoản
    await page.type('input[type="email"], input[name="email"], input[placeholder*="email" i], input[type="text"]', 'thanhthu8805pl@gmail.com', { delay: 50 });
    await page.type('input[type="password"]', 'Thu123', { delay: 50 });

    console.log('👉 Đang bấm nút Đăng nhập...');
    const submitBtn = await page.$('button[type="submit"], form button, button');
    if (submitBtn) {
      await submitBtn.click();
    }

    // Đợi 5 giây xem kết quả chuyển trang
    await new Promise(r => setTimeout(r, 5000));

    const currentUrl = page.url();
    console.log(`\nURL sau khi đăng nhập: ${currentUrl}`);

    // Đọc token từ LocalStorage và Cookies
    const cookies = await page.cookies();
    const storage = await page.evaluate(() => Object.assign({}, localStorage));

    console.log(`- Số lượng Cookies: ${cookies.length}`);
    console.log(`- Các key trong LocalStorage:`, Object.keys(storage));

    fs.writeFileSync('tools/academy_session.json', JSON.stringify({
      currentUrl,
      cookies,
      localStorage: storage,
      networkLogs
    }, null, 2));

    console.log('\n💾 Đã lưu session vào: tools/academy_session.json');

  } catch (err) {
    console.error('Lỗi khi thao tác trên web:', err.message);
  }
}

testAcademyLogin().catch(console.error);
