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

async function loginAndOpenChrome() {
  console.log('=====================================================');
  console.log('🌐 ĐĂNG NHẬP VÀ MỞ GOOGLE CHROME TRỰC TIẾP TRÊN MÀN HÌNH');
  console.log('=====================================================\n');

  // 1. Gọi API đăng nhập chính thức để lấy cookie bảo mật
  console.log('🔐 [1/3] Gọi API xác thực tài khoản: Levandatfibc8@columbed.us ...');
  const loginRes = await fetch('https://aptistest.edu.vn/api/auth/login-cookie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://aptistest.edu.vn',
      'Referer': 'https://aptistest.edu.vn/login',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      emailOrUsername: 'Levandatfibc8@columbed.us',
      password: 'Onthi01',
      rememberMe: false,
      loginContext: 'Student'
    })
  });

  const loginData = await loginRes.json();
  console.log('Kết quả đăng nhập API:', loginData);

  if (!loginData.result) {
    console.error('❌ Đăng nhập thất bại:', loginData.message);
    return;
  }

  const rawCookieHeader = loginRes.headers.get('set-cookie');
  console.log('✅ Đăng nhập API thành công! Đã nhận Set-Cookie từ server.');

  // Tách cookie AptisWeb.Auth
  let authCookieValue = '';
  const match = rawCookieHeader.match(/AptisWeb\.Auth=([^;]+)/);
  if (match) {
    authCookieValue = match[1];
  }

  if (!authCookieValue) {
    console.error('❌ Không tìm thấy cookie AptisWeb.Auth trong response header!');
    return;
  }

  // 2. Khởi động Chrome CÓ GIAO DIỆN (headless: false)
  console.log('\n🖥️ [2/3] Đang bật trình duyệt Google Chrome trên màn hình máy tính (headless: false)...');
  const execPath = getExecutablePath();

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: false, // MỞ GIAO DIỆN CHROME THẬT TRÊN MÀN HÌNH
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  // Nạp Cookie đăng nhập vào Chrome
  await page.setCookie({
    name: 'AptisWeb.Auth',
    value: authCookieValue,
    domain: 'aptistest.edu.vn',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  });

  // Ghi lại toàn bộ API network khi lướt web
  const outputDir = path.resolve(__dirname, 'data/aptistest');
  const screensDir = path.join(outputDir, 'screenshots');
  fs.mkdirSync(screensDir, { recursive: true });

  const networkCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    const type = req.resourceType();
    if (['xhr', 'fetch', 'websocket'].includes(type) || url.includes('/api/')) {
      networkCalls.push({
        method: req.method(),
        url,
        type,
        postData: req.postData()
      });
      console.log(`📡 [API Call] ${req.method()} -> ${url}`);
    }
  });

  // 3. Điều hướng thẳng vào Student Dashboard
  console.log('\n🚀 [3/3] Đang chuyển đến https://aptistest.edu.vn/student/dashboard ...');
  await page.goto('https://aptistest.edu.vn/student/dashboard', { waitUntil: 'networkidle2', timeout: 45000 });

  console.log('🎉 URL hiện tại:', page.url());
  console.log('📄 Tiêu đề trang:', await page.title());

  await page.screenshot({ path: path.join(screensDir, 'student_dashboard_live.png') });
  console.log('📸 Đã chụp ảnh màn hình lưu tại: tools/data/aptistest/screenshots/student_dashboard_live.png');

  // Lấy danh sách menu, các link học tập và gói cước trên dashboard
  const dashboardDetails = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    })).filter(l => l.text && l.href && !l.href.includes('javascript'));

    const text = document.body.innerText;
    return {
      links,
      summaryText: text.substring(0, 2000)
    };
  });

  console.log('\n📋 Nội dung hiển thị trên Dashboard:');
  console.log(dashboardDetails.summaryText);

  fs.writeFileSync(path.join(outputDir, 'dashboard_links.json'), JSON.stringify(dashboardDetails.links, null, 2));
  fs.writeFileSync(path.join(outputDir, 'captured_apis.json'), JSON.stringify(networkCalls, null, 2));

  console.log('\n✅ Đã lưu danh sách các liên kết & API được gọi trong dashboard.');
  console.log('💡 Trình duyệt Chrome vẫn đang mở trên màn hình để bạn có thể xem trực tiếp.');

  // Giữ Chrome mở trong 30 giây để bạn và script quan sát, sau đó tự đóng gọn gàng
  await new Promise(r => setTimeout(r, 15000));
  await browser.close();
  console.log('\n🏁 Hoàn tất phiên kiểm tra Chrome!');
}

loginAndOpenChrome().catch(console.error);

