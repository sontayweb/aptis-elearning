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
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Không tìm thấy Google Chrome hoặc Edge trên máy tính.');
}

async function analyzeLive() {
  console.log('🚀 Đang khởi động Google Chrome trên máy Windows để phân tích trực tiếp...');
  const execPath = getExecutablePath();
  console.log('Trình duyệt sử dụng:', execPath);

  const outputDir = path.resolve(__dirname, 'data/aptistest');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  const networkLogs = [];
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['xhr', 'fetch', 'websocket', 'document'].includes(resourceType)) {
      networkLogs.push({
        method: req.method(),
        url: req.url(),
        resourceType,
        postData: req.postData()
      });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('login') || url.includes('student') || url.includes('api') || url.includes('dashboard')) {
      try {
        console.log(`📡 [Network Response] ${res.status()} - ${url}`);
      } catch {}
    }
  });

  console.log('⏳ Đang điều hướng đến https://aptistest.edu.vn/login ...');
  await page.goto('https://aptistest.edu.vn/login', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('📄 URL trang hiện tại:', page.url());
  console.log('📄 Tiêu đề trang:', await page.title());

  // Thử điền form với tài khoản người dùng cung cấp
  console.log('\n🔐 Thử nhập thông tin đăng nhập: trabingo03@gmail.com / Onthi122 ...');
  const emailInput = await page.$('#username, input[type="text"], input[type="email"]');
  const passwordInput = await page.$('#password, input[type="password"]');

  if (emailInput && passwordInput) {
    await emailInput.type('trabingo03@gmail.com', { delay: 50 });
    await passwordInput.type('Onthi122', { delay: 50 });
    console.log('✅ Đã điền xong Email và Mật khẩu.');

    await page.screenshot({ path: path.join(outputDir, 'step1_filled_form.png') });
    console.log('📸 Đã chụp ảnh lưu tại: tools/data/aptistest/step1_filled_form.png');

    // Tìm nút Đăng nhập và bấm
    const submitBtn = (await page.$('button[type="submit"]')) ||
      (await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent && b.textContent.includes('Đăng nhập')) || btns[0];
      }));

    if (submitBtn) {
      console.log('👉 Đang bấm nút Đăng nhập...');
      await submitBtn.click();
    }

    // Đợi 7 giây để hệ thống xử lý đăng nhập và chuyển trang
    await new Promise(r => setTimeout(r, 7000));

    const currentUrl = page.url();
    console.log('\n🎉 URL sau khi bấm đăng nhập:', currentUrl);
    await page.screenshot({ path: path.join(outputDir, 'step2_after_login.png') });
    console.log('📸 Đã chụp ảnh kết quả lưu tại: tools/data/aptistest/step2_after_login.png');

    // Lấy cookie
    const cookies = await page.cookies();
    console.log('\n🍪 Cookies nhận được:', cookies.map(c => `${c.name} (${c.domain})`));
    fs.writeFileSync(path.join(outputDir, 'session_cookies.json'), JSON.stringify(cookies, null, 2));

    // Lấy nội dung trang sau đăng nhập
    const pageBodyText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log('\n📄 Nội dung trang nhận được:\n', pageBodyText.substring(0, 500));

    // Xuất network logs
    fs.writeFileSync(path.join(outputDir, 'network_traffic.json'), JSON.stringify(networkLogs, null, 2));
    console.log('\n📊 Đã lưu nhật ký Network Traffic tại tools/data/aptistest/network_traffic.json');
  } else {
    console.warn('⚠️ Không tìm thấy ô nhập email/password trên giao diện!');
  }

  await browser.close();
  console.log('\n🏁 Hoàn tất phân tích Chrome trực tiếp!');
}

analyzeLive().catch(console.error);
