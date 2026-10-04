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

async function inspectLoginPage() {
  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  console.log('🌐 Đang mở https://aptisacademy.com.vn/login ...');
  await page.goto('https://aptisacademy.com.vn/login', { waitUntil: 'networkidle2' });

  // Đọc toàn bộ form, input, button
  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      placeholder: i.placeholder,
      value: i.value
    }));

    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim(),
      type: b.type,
      className: b.className
    }));

    const bodyText = document.body.innerText;

    return { inputs, buttons, bodyText: bodyText.substring(0, 1000) };
  });

  console.log('Inputs:', formInfo.inputs);
  console.log('Buttons:', formInfo.buttons);
  console.log('Body Text mẫu:', formInfo.bodyText);

  // Thử điền form và bắt request POST
  page.on('request', req => {
    if (req.method() === 'POST') {
      console.log(`📡 [POST REQUEST] ${req.url()}`);
      console.log(`   Headers:`, req.headers());
      console.log(`   PostData:`, req.postData());
    }
  });

  page.on('response', async res => {
    const req = res.request();
    if (req.method() === 'POST') {
      console.log(`📥 [POST RESPONSE] ${res.status()} ${res.url()}`);
      try {
        console.log(`   Response text:`, (await res.text()).substring(0, 500));
      } catch {}
    }
  });

  console.log('\n👉 Bắt đầu nhập thông tin đăng nhập: thanhthu8805pl@gmail.com / Thu123...');
  if (formInfo.inputs.length >= 2) {
    const emailSelector = formInfo.inputs[0].name ? `input[name="${formInfo.inputs[0].name}"]` : 'input[type="email"], input[type="text"]';
    const pwdSelector = formInfo.inputs[1].name ? `input[name="${formInfo.inputs[1].name}"]` : 'input[type="password"]';

    await page.type(emailSelector, 'thanhthu8805pl@gmail.com', { delay: 30 });
    await page.type(pwdSelector, 'Thu123', { delay: 30 });

    // Bấm nút đăng nhập
    const submitBtn = await page.$('button[type="submit"]') || (await page.$$('button'))[0];
    if (submitBtn) {
      console.log('Bấm submit...');
      await submitBtn.click();
    }

    await new Promise(r => setTimeout(r, 6000));

    console.log('\nURL sau submit:', page.url());
    const afterText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Body text sau submit:', afterText);

    // Lưu cookies
    const cookies = await page.cookies();
    console.log('Cookies sau submit:', cookies.map(c => `${c.name} (${c.domain})`));
    fs.writeFileSync('tools/academy_logged_cookies.json', JSON.stringify(cookies, null, 2));

    await page.screenshot({ path: 'tools/academy_login_result.png', fullPage: true });
    console.log('📸 Đã chụp ảnh màn hình lưu tại tools/academy_login_result.png');
  }

  await browser.close();
}

inspectLoginPage().catch(console.error);
