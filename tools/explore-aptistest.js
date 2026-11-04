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

async function exploreAptisTest() {
  console.log('=====================================================');
  console.log('🚀 BẮT ĐẦU PHÂN TÍCH CHUYÊN SÂU: APTISTEST.EDU.VN');
  console.log('=====================================================\n');

  const execPath = getExecutablePath();
  const outputDir = path.resolve(__dirname, 'data/aptistest');
  const screensDir = path.join(outputDir, 'screenshots');
  fs.mkdirSync(screensDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true, // Chạy ngầm mượt mà
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  const discoveredApis = [];
  page.on('request', (req) => {
    const url = req.url();
    const type = req.resourceType();
    if (['xhr', 'fetch', 'websocket'].includes(type) || url.includes('/api/')) {
      discoveredApis.push({
        method: req.method(),
        url,
        resourceType: type,
        headers: req.headers(),
        postData: req.postData()
      });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    if (url.includes('/api/') || url.includes('student') || url.includes('practice')) {
      console.log(`📡 [API Response ${status}] ${url}`);
    }
  });

  // 1. Đăng nhập trực tiếp bằng UI
  console.log('⏳ [1/4] Đang điều hướng đến https://aptistest.edu.vn/login ...');
  await page.goto('https://aptistest.edu.vn/login', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('🔐 [2/4] Nhập tài khoản: Levandatfibc8@columbed.us ...');
  await page.type('#username', 'Levandatfibc8@columbed.us', { delay: 30 });
  await page.type('#password', 'Onthi01', { delay: 30 });

  const submitBtn = await page.$('button[type="submit"]') || (await page.$$('button'))[0];
  if (submitBtn) {
    console.log('👉 Đang bấm nút Đăng nhập...');
    await submitBtn.click();
  }

  // Đợi chuyển trang sau đăng nhập
  await new Promise(r => setTimeout(r, 6000));
  const currentUrl = page.url();
  console.log('\n🎉 [3/4] URL hiện tại sau khi đăng nhập:', currentUrl);

  await page.screenshot({ path: path.join(screensDir, '01_dashboard.png'), fullPage: true });
  console.log('📸 Đã chụp ảnh màn hình Dashboard: 01_dashboard.png');

  // Lưu Cookies phiên
  const cookies = await page.cookies();
  fs.writeFileSync(path.join(outputDir, 'session_cookies.json'), JSON.stringify(cookies, null, 2));

  // 2. Lấy thông tin người dùng từ DOM
  const studentInfo = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    })).filter(l => l.href && l.href.startsWith('http') && !l.href.includes('#'));
    return {
      title: document.title,
      links,
      previewText: bodyText.substring(0, 1000)
    };
  });

  console.log('\n📋 Tiêu đề trang:', studentInfo.title);
  console.log('👤 Thông tin trên giao diện Dashboard:\n', studentInfo.previewText);

  // 3. Khám phá các menu và phân hệ chính
  console.log('\n⏳ [4/4] Đang khám phá các phân hệ học tập & ngân hàng đề...');
  const keyRoutes = [
    { name: '02_practice_exams', url: 'https://aptistest.edu.vn/practice/aptis-focus-exams' },
    { name: '03_actual_test', url: 'https://aptistest.edu.vn/practice/aptis-actual-test' },
    { name: '04_tips_key', url: 'https://aptistest.edu.vn/learning/tips?exam=aptis' },
    { name: '05_listening', url: 'https://aptistest.edu.vn/learning/listening/options' },
    { name: '06_dictation', url: 'https://aptistest.edu.vn/learning/listening/dictation/list' },
    { name: '07_reading', url: 'https://aptistest.edu.vn/learning/reading/options' },
    { name: '08_writing', url: 'https://aptistest.edu.vn/learning/writing/options' },
    { name: '09_speaking', url: 'https://aptistest.edu.vn/learning/speaking/options' },
    { name: '10_forecast_du_doan', url: 'https://aptistest.edu.vn/du-doan-de' }
  ];

  const routeResults = [];

  for (const r of keyRoutes) {
    try {
      console.log(`\n▶️ Đang mở: ${r.url} ...`);
      await page.goto(r.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(res => setTimeout(res, 2000));

      const pageTitle = await page.title();
      const screenPath = path.join(screensDir, `${r.name}.png`);
      await page.screenshot({ path: screenPath, fullPage: false });

      const textSample = await page.evaluate(() => document.body.innerText.substring(0, 400));
      routeResults.push({
        name: r.name,
        url: r.url,
        title: pageTitle,
        textSample
      });
      console.log(`✅ [${r.name}] Title: "${pageTitle}" | Đã chụp: ${r.name}.png`);
    } catch (err) {
      console.warn(`⚠️ Không mở được ${r.url}:`, err.message);
    }
  }

  // Lưu toàn bộ danh sách API phát hiện được
  fs.writeFileSync(path.join(outputDir, 'discovered_apis.json'), JSON.stringify(discoveredApis, null, 2));
  fs.writeFileSync(path.join(outputDir, 'discovered_routes.json'), JSON.stringify(routeResults, null, 2));
  console.log('\n📊 Đã lưu toàn bộ danh sách API phát hiện được tại: tools/data/aptistest/discovered_apis.json');

  await browser.close();
  console.log('\n=====================================================');
  console.log('🎉 HOÀN THÀNH PHÂN TÍCH CHUYÊN SÂU APTISTEST.EDU.VN!');
  console.log('=====================================================');
}

exploreAptisTest().catch(console.error);

